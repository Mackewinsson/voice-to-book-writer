import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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
    const contextStr = formData.get("context") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    // Convert audio file to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // We use gemini-1.5-flash as it's fast, multimodal, and cheap/free
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert ghostwriter. The user is writing a book using their voice.
Below is the recent context of the chapter (if any).
Please listen to the attached audio, transcribe what the user said, and seamlessly continue the narrative from the previous context.
Refine the transcription into well-written, polished paragraphs. Maintain a consistent voice, fix any grammar, and do not add any meta-commentary.
Return ONLY the refined text for the new block.

PREVIOUS CONTEXT:
${contextStr || "No previous context. This is the start of the chapter."}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type || "audio/webm",
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: `Failed to process audio: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
