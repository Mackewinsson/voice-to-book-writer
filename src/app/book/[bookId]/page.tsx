"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Moon, Sun, ChevronLeft, FileText, MoreVertical } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type BookRecord = { id: string; title: string };
type ChapterRecord = { id: string; title: string; created_at: string };

export default function ChapterList() {
  const router = useRouter();
  const params = useParams<{ bookId: string }>();
  const bookId = params?.bookId;

  const [book, setBook] = useState<BookRecord | null>(null);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!bookId) return;
      const supabase = createClient();
      
      const { data: bookData } = await supabase.from("books").select("*").eq("id", bookId).single();
      if (bookData) setBook(bookData);

      const { data: chaptersData } = await supabase.from("chapters").select("*").eq("book_id", bookId).order("created_at", { ascending: true });
      if (chaptersData) setChapters(chaptersData);

      setIsLoading(false);
    }
    fetchData();
  }, [bookId]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCreateChapter = async () => {
    if (!bookId) return;
    setIsCreating(true);
    const supabase = createClient();
    
    const newTitle = `Chapter ${chapters.length + 1}`;
    
    const { data: chapter, error } = await supabase
      .from("chapters")
      .insert({ book_id: bookId, title: newTitle })
      .select()
      .single();

    if (error || !chapter) {
      console.error("Failed to create chapter", error);
      setIsCreating(false);
      return;
    }

    router.push(`/book/${bookId}/chapter/${chapter.id}`);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f7f4ef] text-stone-900"}`}>
      <div className={`pointer-events-none fixed inset-0 ${isDarkMode ? "bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.08),_transparent_55%)]" : "bg-[radial-gradient(ellipse_at_top,_rgba(180,140,90,0.12),_transparent_55%)]"}`} aria-hidden />

      <header className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${isDarkMode ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80" : "bg-[#f7f4ef]/85 border-b border-stone-200/80"}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`p-2 -ml-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10 text-zinc-400 hover:text-zinc-200" : "hover:bg-black/5 text-stone-500 hover:text-stone-700"
            }`}
            aria-label="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
              {book ? book.title : "Loading..."}
            </p>
            <h1 className="text-xl font-medium tracking-tight mt-0.5">Chapters</h1>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-4xl md:mx-auto w-full py-8 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Table of Contents</h2>
          <button 
            onClick={handleCreateChapter}
            disabled={isCreating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
              isDarkMode 
                ? "bg-zinc-100 text-zinc-900 hover:bg-white shadow-white/5" 
                : "bg-stone-900 text-stone-50 hover:bg-black shadow-black/10"
            }`}
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            New Chapter
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className={`inline-flex p-4 rounded-full ${isDarkMode ? "bg-zinc-800/50" : "bg-stone-200/50"}`}>
              <FileText size={32} className={isDarkMode ? "text-zinc-500" : "text-stone-400"} />
            </div>
            <p className={`text-xl font-medium tracking-tight ${isDarkMode ? "text-zinc-300" : "text-stone-700"}`}>No chapters yet</p>
            <p className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>Create your first chapter to start writing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chapters.map((chapter, index) => (
              <Link href={`/book/${bookId}/chapter/${chapter.id}`} key={chapter.id}>
                <article className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isDarkMode 
                    ? "bg-zinc-900/60 border-zinc-700/80 hover:bg-zinc-800/80 hover:border-zinc-600 shadow-black/40" 
                    : "bg-white/80 border-stone-200/90 hover:bg-white hover:border-stone-300 shadow-stone-200/50"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-stone-100 text-stone-600 group-hover:bg-stone-200"} transition-colors`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg tracking-tight line-clamp-1">{chapter.title}</h3>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
                          {new Date(chapter.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-stone-100 text-stone-400"}`}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
