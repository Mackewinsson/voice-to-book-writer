import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const NO_SPEECH_PATTERNS = [
  /^\[?\s*silence\s*\]?$/i,
  /^no\s+(speech|words|audio|sound)/i,
  /^\(?no\s+speech\)?$/i,
  /^nothing\s+(was\s+)?(said|spoken|detected)/i,
  /^(i\s+)?(cannot|can't)\s+(hear|detect|make out)/i,
  /^the\s+audio\s+(is|was)\s+silent/i,
  /^empty\s+audio$/i,
];

function isEmptyTranscription(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return NO_SPEECH_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API Key is not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json({ text: "", empty: true });
    }

    // Convert audio file to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Listen to the attached audio and return a verbatim transcription of what was spoken.
Preserve natural punctuation and paragraph breaks only where the speaker pauses.
Do not rewrite, summarize, add content, or change the meaning.
If the audio is silent or contains no intelligible spoken words, return an empty response with no explanation.
Return only the transcribed text.`;

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

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: `Failed to process audio: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
