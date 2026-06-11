"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Moon, Sun, Library, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import CreateProjectModal from "@/components/CreateProjectModal";
import { scriptFormulas } from "@/utils/scriptFormulas";

type BookRecord = { id: string; title: string; created_at: string; word_count?: number };

export default function Dashboard() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  
  const [projects, setProjects] = useState<BookRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isProjectTypeModalOpen, setIsProjectTypeModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState("");

  const startEditing = (e: React.MouseEvent, book: BookRecord) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjectId(book.id);
    setEditingProjectTitle(book.title);
  };

  const handleTitleSave = async (bookId: string) => {
    const finalTitle = editingProjectTitle.trim() || "Untitled Draft";
    setProjects(projects.map(p => p.id === bookId ? { ...p, title: finalTitle } : p));
    setEditingProjectId(null);
    const supabase = createClient();
    await supabase.from("books").update({ title: finalTitle }).eq("id", bookId);
  };

  const [projectToDelete, setProjectToDelete] = useState<BookRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();
    
    // Manually cascade delete to ensure no foreign key errors
    const { data: chapters } = await supabase.from("chapters").select("id").eq("book_id", projectToDelete.id);
    if (chapters && chapters.length > 0) {
      const chapterIds = chapters.map(c => c.id);
      await supabase.from("blocks").delete().in("chapter_id", chapterIds);
      await supabase.from("chapters").delete().in("id", chapterIds);
    }
    
    await supabase.from("books").delete().eq("id", projectToDelete.id);
    
    setProjects(projects.filter(p => p.id !== projectToDelete.id));
    setProjectToDelete(null);
    setIsDeleting(false);
  };

  useEffect(() => {
    async function fetchProjects() {
      if (!isLoaded || !userId) return;

      const supabase = createClient();
      const { data: countsData } = await supabase.rpc("get_book_word_counts", { user_uuid: userId });
      const countsMap = new Map();
      if (countsData) {
        countsData.forEach((row: { book_id: string; word_count: number }) => countsMap.set(row.book_id, row.word_count));
      }

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setProjects(data.map(book => ({ ...book, word_count: countsMap.get(book.id) || 0 })));
      }
      setIsLoading(false);
    }
    fetchProjects();
  }, [isLoaded, userId]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCreateProject = async () => {
    if (!userId) return;
    setIsCreating(true);
    const supabase = createClient();
    
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .insert({ title: "Untitled Draft", user_id: userId })
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

  const handleCreateScript = async (formulaId: string) => {
    if (!userId) return;
    setIsCreating(true);
    
    const formula = scriptFormulas.find(f => f.id === formulaId);
    if (!formula) {
      setIsCreating(false);
      return;
    }

    const supabase = createClient();
    
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .insert({ title: "Untitled Script", user_id: userId, project_type: "reel" })
      .select()
      .single();

    if (bookErr || !book) {
      console.error("Failed to create script project", bookErr);
      setIsCreating(false);
      return;
    }

    // Create chapters sequentially to maintain order via created_at
    for (const chapter of formula.chapters) {
      const { error: chapterErr } = await supabase
        .from("chapters")
        .insert({ book_id: book.id, title: chapter.title, description: chapter.description, detailed_description: chapter.detailedDescription });
        
      if (chapterErr) {
        console.error(`Failed to create chapter: ${chapter.title}`, chapterErr);
      }
      
      // tiny delay to ensure created_at ordering if supabase resolution is low
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    router.push(`/book/${book.id}`);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f7f4ef] text-stone-900"}`}>
      <div className={`pointer-events-none fixed inset-0 ${isDarkMode ? "bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.08),_transparent_55%)]" : "bg-[radial-gradient(ellipse_at_top,_rgba(180,140,90,0.12),_transparent_55%)]"}`} aria-hidden />

      <header className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${isDarkMode ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80" : "bg-[#f7f4ef]/85 border-b border-stone-200/80"}`}>
        <div>
          <p className={`text-[11px] uppercase tracking-[0.22em] ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>Projects</p>
          <h1 className="text-xl font-medium tracking-tight mt-0.5">My Books</h1>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <UserButton />
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-4xl md:mx-auto w-full py-8 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Drafts</h2>
          <button 
            onClick={() => setIsProjectTypeModalOpen(true)}
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
        ) : projects.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className={`inline-flex p-4 rounded-full ${isDarkMode ? "bg-zinc-800/50" : "bg-stone-200/50"}`}>
              <Library size={32} className={isDarkMode ? "text-zinc-500" : "text-stone-400"} />
            </div>
            <p className={`text-xl font-medium tracking-tight ${isDarkMode ? "text-zinc-300" : "text-stone-700"}`}>No projects yet</p>
            <p className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>Create your first book project to start writing with your voice.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map(book => (
              <Link href={`/book/${book.id}`} key={book.id}>
                <article className={`group flex flex-col justify-between h-40 p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isDarkMode 
                    ? "bg-zinc-900/60 border-zinc-700/80 hover:bg-zinc-800/80 hover:border-zinc-600 shadow-black/40" 
                    : "bg-white/80 border-stone-200/90 hover:bg-white hover:border-stone-300 shadow-stone-200/50"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${isDarkMode ? "bg-zinc-800" : "bg-stone-100 group-hover:bg-stone-200"} transition-colors`}>
                      <Library size={20} className={isDarkMode ? "text-zinc-400" : "text-stone-500"} />
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => startEditing(e, book)}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-stone-100 text-stone-400"}`}
                        title="Edit project name"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectToDelete(book);
                        }}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}
                        title="Delete project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    {editingProjectId === book.id ? (
                      <input
                        autoFocus
                        value={editingProjectTitle}
                        onChange={(e) => setEditingProjectTitle(e.target.value)}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onBlur={() => handleTitleSave(book.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTitleSave(book.id);
                          }
                        }}
                        className={`font-medium text-lg tracking-tight bg-transparent outline-none border-b border-dashed w-full ${
                          isDarkMode ? "text-zinc-100 border-zinc-500" : "text-stone-900 border-stone-400"
                        }`}
                      />
                    ) : (
                      <h3 className="font-medium text-lg tracking-tight line-clamp-1">{book.title}</h3>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-stone-200 text-stone-700"}`}>
                        {(book.word_count || 0).toLocaleString()} palabras
                      </span>
                      <p className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
                        {new Date(book.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </main>

      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.title}"? All chapters and text blocks inside it will be permanently lost. This action cannot be undone.`}
        isDarkMode={isDarkMode}
        isLoading={isDeleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />

      <CreateProjectModal
        isOpen={isProjectTypeModalOpen}
        isDarkMode={isDarkMode}
        isLoading={isCreating}
        onClose={() => setIsProjectTypeModalOpen(false)}
        onSelectBook={handleCreateProject}
        onSelectScript={handleCreateScript}
      />
    </div>
  );
}
