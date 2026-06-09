import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    lemonSqueezySetup({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY as string,
    });

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID as string;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID as string;

    if (!process.env.LEMON_SQUEEZY_API_KEY || !storeId || !variantId) {
      return NextResponse.json({ error: 'Lemon Squeezy is not configured' }, { status: 500 });
    }

    const { error, data, statusCode } = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: {
          user_id: userId,
        },
      },
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: statusCode || 500 });
    }

    return NextResponse.json({ checkoutUrl: data?.data.attributes.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
