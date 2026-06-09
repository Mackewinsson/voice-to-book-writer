"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Moon, Sun, Book, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BookRecord = { id: string; title: string; created_at: string };

export default function Dashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      const supabase = createClient();
      const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        setBooks(data);
      }
      setIsLoading(false);
    }
    fetchBooks();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCreateBook = async () => {
    setIsCreating(true);
    const supabase = createClient();
    const newTitle = "Untitled Draft";
    
    // Create Book
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .insert({ title: newTitle })
      .select()
      .single();

    if (bookErr || !book) {
      console.error("Failed to create book", bookErr);
      setIsCreating(false);
      return;
    }

    // Create First Chapter automatically
    const { error: chapterErr } = await supabase
      .from("chapters")
      .insert({ book_id: book.id, title: "Chapter 1" });

    if (chapterErr) {
      console.error("Failed to create chapter", chapterErr);
    }

    // Navigate to editor
    router.push(`/book/${book.id}`);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f7f4ef] text-stone-900"}`}>
      <div className={`pointer-events-none fixed inset-0 ${isDarkMode ? "bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.08),_transparent_55%)]" : "bg-[radial-gradient(ellipse_at_top,_rgba(180,140,90,0.12),_transparent_55%)]"}`} aria-hidden />

      <header className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${isDarkMode ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80" : "bg-[#f7f4ef]/85 border-b border-stone-200/80"}`}>
        <div>
          <p className={`text-[11px] uppercase tracking-[0.22em] ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>Voice-to-Book</p>
          <h1 className="text-xl font-medium tracking-tight mt-0.5">My Projects</h1>
        </div>
        <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-4xl md:mx-auto w-full py-8 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Drafts</h2>
          <button 
            onClick={handleCreateBook}
            disabled={isCreating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
              isDarkMode 
                ? "bg-zinc-100 text-zinc-900 hover:bg-white shadow-white/5" 
                : "bg-stone-900 text-stone-50 hover:bg-black shadow-black/10"
            }`}
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className={`inline-flex p-4 rounded-full ${isDarkMode ? "bg-zinc-800/50" : "bg-stone-200/50"}`}>
              <Book size={32} className={isDarkMode ? "text-zinc-500" : "text-stone-400"} />
            </div>
            <p className={`text-xl font-medium tracking-tight ${isDarkMode ? "text-zinc-300" : "text-stone-700"}`}>No projects yet</p>
            <p className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>Create your first book project to start writing with your voice.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {books.map(book => (
              <Link href={`/book/${book.id}`} key={book.id}>
                <article className={`group flex flex-col justify-between h-40 p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isDarkMode 
                    ? "bg-zinc-900/60 border-zinc-700/80 hover:bg-zinc-800/80 hover:border-zinc-600 shadow-black/40" 
                    : "bg-white/80 border-stone-200/90 hover:bg-white hover:border-stone-300 shadow-stone-200/50"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${isDarkMode ? "bg-zinc-800" : "bg-stone-100 group-hover:bg-stone-200"} transition-colors`}>
                      <Book size={20} className={isDarkMode ? "text-zinc-400" : "text-stone-500"} />
                    </div>
                    <button className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-stone-100 text-stone-400"}`}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg tracking-tight line-clamp-1">{book.title}</h3>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
                      {new Date(book.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
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
