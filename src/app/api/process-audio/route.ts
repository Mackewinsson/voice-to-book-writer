import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const NO_SPEECH_PATTERNS = [
  /^\[?\s*silence\s*\]?$/i,
  /^\[?\s*silencio\s*\]?$/i,
  /^no\s+(speech|words|audio|sound|hay audio|se escucha nada)/i,
  /^\(?no\s+speech\)?$/i,
  /^nothing\s+(was\s+)?(said|spoken|detected)/i,
  /^(i\s+)?(cannot|can't)\s+(hear|detect|make out)/i,
  /^the\s+audio\s+(is|was)\s+silent/i,
  /^empty\s+audio$/i,
  /^\[NO_AUDIO\]$/i,
];

function isEmptyTranscription(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return NO_SPEECH_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const durationSeconds = parseInt(formData.get("durationSeconds") as string || "0", 10);
    const context = formData.get("context") as string || "";
    const projectLanguage = formData.get("projectLanguage") as string || "the spoken language";

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    if (audioFile.size === 0) {
      return NextResponse.json({ text: "", empty: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    
    if (!profile) {
      const { data: newProfile } = await supabase.from("profiles").insert({ user_id: userId, free_seconds_remaining: 900 }).select().single();
      profile = newProfile;
    }

    const hasBalance = profile.free_seconds_remaining > 0;
    const hasCustomKey = !!profile.gemini_api_key;

    if (!hasBalance && !hasCustomKey) {
      return NextResponse.json({ error: "Quota Exceeded" }, { status: 403 });
    }

    const apiKey = hasCustomKey ? profile.gemini_api_key : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    const prompt = `You are a professional ghostwriter. Listen to the audio and transcribe it accurately into well-written paragraphs.
CRITICAL INSTRUCTIONS:
1. If the audio is silent or contains NO spoken words, you MUST return exactly the string "[NO_AUDIO]". Do not write anything else.
2. You MUST write the output in ${projectLanguage}. Do not translate it if it's already in that language, but if it is not, or if you are formatting it, ensure the final text is strictly in ${projectLanguage}.
3. Fix minor grammar issues and maintain the author's voice.
4. Use this brief preceding context only to understand tone and continuity:

[PREVIOUS CONTEXT]
${context || "No preceding context."}
[/PREVIOUS CONTEXT]

Remember: If no words are spoken in the audio, return "[NO_AUDIO]" and nothing else.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type || "audio/webm",
        },
      },
      prompt,
    ]);

    const responseText = result.response.text().trim();

    if (isEmptyTranscription(responseText)) {
      return NextResponse.json({ text: "", empty: true });
    }

    if (!hasCustomKey && hasBalance && durationSeconds > 0) {
      const newBalance = Math.max(0, profile.free_seconds_remaining - durationSeconds);
      await supabase.from("profiles").update({ free_seconds_remaining: newBalance }).eq("user_id", userId);
    }

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Error processing audio:", error);
    const err = error as { message?: string; status?: number };
    if (err?.message?.includes("API key not valid") || err?.status === 403) {
       return NextResponse.json({ error: "Invalid Custom API Key" }, { status: 403 });
    }
    return NextResponse.json(
      { error: `Failed to process audio: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
