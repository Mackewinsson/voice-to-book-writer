import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    
    if (!profile) {
      await supabase.from("profiles").insert({ user_id: userId, free_seconds_remaining: 900, gemini_api_key: apiKey });
    } else {
      await supabase.from("profiles").update({ gemini_api_key: apiKey }).eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
