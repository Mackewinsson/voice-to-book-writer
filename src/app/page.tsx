"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Moon, Sun, MoreHorizontal, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chapterId, setChapterId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [blocks, setBlocks] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        
        let { data: books, error: bookErr } = await supabase.from('books').select('*').limit(1);
        
        if (bookErr) {
          console.error("Failed to load books. Did you run the SQL script?", bookErr);
          return;
        }

        let book = books?.[0];
        if (!book) {
          const { data: newBook, error: insertBookErr } = await supabase.from('books').insert({ title: 'My First Book' }).select().single();
          if (insertBookErr) {
            console.error("Failed to create book:", insertBookErr);
            return;
          }
          book = newBook;
        }

        if (!book) return;

        let { data: chapters, error: chapterErr } = await supabase.from('chapters').select('*').eq('book_id', book.id).limit(1);
        if (chapterErr) {
          console.error("Failed to load chapter:", chapterErr);
          return;
        }

        let chapter = chapters?.[0];
        if (!chapter) {
          const { data: newChapter, error: insertChapErr } = await supabase.from('chapters').insert({ book_id: book.id, title: 'Chapter 1' }).select().single();
          if (insertChapErr) {
            console.error("Failed to create chapter:", insertChapErr);
            return;
          }
          chapter = newChapter;
        }

        if (!chapter) return;
        setChapterId(chapter.id);

        const { data: fetchedBlocks, error: blocksErr } = await supabase.from('blocks').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true });
        
        if (blocksErr) {
          console.error("Failed to load blocks:", blocksErr);
          return;
        }

        if (fetchedBlocks && fetchedBlocks.length > 0) {
          setBlocks(fetchedBlocks.map((b: any) => ({ id: b.id, text: b.content })));
        }
      } catch (err) {
        console.error("Unexpected error in loadData:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleBlockEdit = (id: string, newText: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, text: newText } : b));
  };

  const handleBlockSave = async (id: string, newText: string) => {
    const supabase = createClient();
    await supabase.from('blocks').update({ content: newText }).eq('id', id);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access the microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      const contextBlocks = blocks.slice(-3).map(b => b.text).join("\n\n");
      formData.append("context", contextBlocks);

      const response = await fetch("/api/process-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Failed to process audio";
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      
      if (data.text && chapterId) {
        const newText = data.text.trim();
        const newOrderIndex = blocks.length;
        
        // Save to Supabase
        const supabase = createClient();
        const { data: newBlock, error } = await supabase.from('blocks').insert({
          chapter_id: chapterId,
          content: newText,
          order_index: newOrderIndex
        }).select().single();

        if (error) {
          console.error("Failed to save block to DB", error);
          setBlocks(prev => [...prev, { id: Date.now().toString(), text: newText }]);
        } else if (newBlock) {
          setBlocks(prev => [...prev, { id: newBlock.id, text: newBlock.content }]);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "An error occurred while processing the audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${isDarkMode ? 'bg-zinc-950/80 border-b border-zinc-800' : 'bg-stone-50/80 border-b border-stone-200'}`}>
        <h1 className="text-xl font-medium tracking-tight">Chapter 1</h1>
        <div className="flex gap-4">
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-2xl md:mx-auto w-full pb-32 pt-8 space-y-8">
        
        {isLoading && (
          <div className="flex justify-center items-center py-10 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!isLoading && blocks.length === 0 && (
          <p className="text-center text-stone-400 dark:text-zinc-500 italic mt-10">
            Tap the microphone below to start writing your book...
          </p>
        )}

        {blocks.map((block) => (
          <div key={block.id} className="group relative">
            <textarea
              value={block.text}
              onChange={(e) => handleBlockEdit(block.id, e.target.value)}
              onBlur={(e) => handleBlockSave(block.id, e.target.value)}
              className="w-full bg-transparent resize-none outline-none leading-relaxed text-lg text-stone-800 dark:text-zinc-200"
              rows={Math.max(2, block.text.split("\n").length + 1)}
              style={{ minHeight: '3rem' }}
            />
            {/* Subtle block indicator */}
            <div className={`absolute -left-4 top-2 bottom-2 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-zinc-700' : 'bg-stone-300'}`} />
          </div>
        ))}

        {/* Temporary writing/recording block placeholder */}
        {isRecording && (
          <div className="animate-pulse flex gap-2 items-center text-stone-400 dark:text-zinc-500 py-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2 text-sm italic">Listening...</span>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex gap-2 items-center text-stone-400 dark:text-zinc-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-sm italic">Gemini is writing...</span>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 pb-8 sm:pb-6 flex justify-center backdrop-blur-md ${isDarkMode ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent' : 'bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent'}`}>
        <button
          onClick={handleRecordClick}
          disabled={isProcessing || isLoading || !chapterId}
          className={`relative group flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
            isRecording 
              ? 'bg-red-500 shadow-red-500/30 ring-4 ring-red-500/20' 
              : isDarkMode 
                ? 'bg-zinc-100 text-zinc-900 hover:bg-white' 
                : 'bg-stone-900 text-stone-50 hover:bg-black'
          }`}
        >
          {/* Inner ring animation when recording */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-400"></div>
          )}
          
          {isProcessing ? (
            <Loader2 size={32} className={`animate-spin ${isDarkMode ? 'text-zinc-900' : 'text-white'}`} />
          ) : (
            <Mic 
              size={32} 
              className={`transition-colors duration-200 ${isRecording ? 'text-white' : ''}`} 
            />
          )}
        </button>
      </div>

    </div>
  );
}
