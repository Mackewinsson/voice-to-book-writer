import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, chapterId, type } = await req.json();

    if (!bookId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify book ownership
    const { data: book } = await supabase.from("books").select("id, title").eq("id", bookId).eq("user_id", userId).single();
    if (!book) {
      return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
    }

    let { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    
    // Evaluate is a premium feature, let's just check if they have a key or we use the platform key
    const hasCustomKey = !!profile?.gemini_api_key;
    const apiKey = hasCustomKey ? profile.gemini_api_key : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    // Fetch the text to evaluate
    let textToEvaluate = "";
    if (type === "hook") {
      if (!chapterId) return NextResponse.json({ error: "chapterId required for hook evaluation" }, { status: 400 });
      const { data: blocks } = await supabase.from("blocks").select("content").eq("chapter_id", chapterId).order("order_index", { ascending: true });
      textToEvaluate = blocks?.map(b => b.content).join("\n") || "";
    } else {
      // script
      const { data: chapters } = await supabase.from("chapters").select("id").eq("book_id", bookId);
      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(c => c.id);
        const { data: blocks } = await supabase.from("blocks").select("content").in("chapter_id", chapterIds).order("order_index", { ascending: true });
        textToEvaluate = blocks?.map(b => b.content).join("\n\n") || "";
      }
    }

    if (!textToEvaluate.trim()) {
      return NextResponse.json({ error: "No content found to evaluate." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const systemPrompt = type === "hook" 
      ? "You are an expert social media strategist and copywriter. Evaluate the following 'hook' (the first few seconds of a short-form video script). Rate it from 0 to 100 based on its ability to instantly grab attention, trigger curiosity or emotion, and retain the viewer. Provide a short, constructive paragraph of feedback. RETURN JSON ONLY with keys 'score' (number) and 'feedback' (string)."
      : "You are an expert social media strategist and copywriter. Evaluate the following full short-form video script. Rate it from 0 to 100 based on its pacing, value delivery, retention mechanics, and call to action. Provide a short, constructive paragraph of feedback. RETURN JSON ONLY with keys 'score' (number) and 'feedback' (string).";

    const prompt = `${systemPrompt}\n\n[CONTENT TO EVALUATE]\n${textToEvaluate}\n[/CONTENT TO EVALUATE]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const evaluation = JSON.parse(responseText);

    // Save to database
    if (type === "hook") {
      await supabase.from("books").update({
        hook_score: evaluation.score,
        hook_feedback: evaluation.feedback
      }).eq("id", bookId);
    } else {
      await supabase.from("books").update({
        script_score: evaluation.score,
        script_feedback: evaluation.feedback
      }).eq("id", bookId);
    }

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error("Error evaluating script:", error);
    const err = error as { message?: string; status?: number };
    if (err?.message?.includes("API key not valid") || err?.status === 403) {
       return NextResponse.json({ error: "Invalid Custom API Key" }, { status: 403 });
    }
    return NextResponse.json(
      { error: `Failed to evaluate content: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
