import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta.event_name;

  if (eventName === 'order_created') {
    const orderId = payload.data.id;
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;
    
    if (!userId) {
      return NextResponse.json({ error: 'No user_id found in custom_data' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Record the payment
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      order_id: String(orderId),
      amount_total: payload.data.attributes.total,
      currency: payload.data.attributes.currency,
      status: payload.data.attributes.status,
    });

    if (paymentError) {
      if (paymentError.code === '23505') {
        return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
      }
      console.error('Failed to insert payment:', paymentError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Add 10 hours (36000 seconds) to user profile
    const { data: profile } = await supabase.from('profiles').select('free_seconds_remaining').eq('user_id', userId).single();
    const currentBalance = profile?.free_seconds_remaining || 0;
    
    const { error: profileError } = await supabase.from('profiles').update({
      free_seconds_remaining: currentBalance + 36000
    }).eq('user_id', userId);

    if (profileError) {
      console.error('Failed to update profile balance:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
