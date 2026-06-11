import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    
    if (!profile) {
      const { data: newProfile } = await supabase.from("profiles").insert({ user_id: userId, free_seconds_remaining: 900 }).select().single();
      profile = newProfile;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
