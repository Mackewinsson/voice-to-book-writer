"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Moon, Sun, ChevronLeft, FileText, Download, Pencil, Trash2, List, ScrollText, Lock, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import ScoreWidget from "@/components/ScoreWidget";

type BookRecord = { id: string; title: string; project_type?: string; script_score?: number; script_feedback?: string; };
type ChapterRecord = { id: string; title: string; created_at: string; word_count?: number; is_passed?: boolean; lesson_score?: number; };
type BlockRecord = { id: string; chapter_id: string; content: string; note_type: string; order_index: number; };

export default function ChapterList() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const params = useParams<{ bookId: string }>();
  const bookId = params?.bookId;

  const [book, setBook] = useState<BookRecord | null>(null);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<"list" | "manuscript">("list");
  const [allBlocks, setAllBlocks] = useState<BlockRecord[]>([]);
  const [isLoadingManuscript, setIsLoadingManuscript] = useState(false);
  const [isEvaluatingScript, setIsEvaluatingScript] = useState(false);

  const handleTitleSave = async (newTitle: string) => {
    const finalTitle = newTitle.trim() || "Untitled Draft";
    if (book) setBook({ ...book, title: finalTitle });
    setIsEditingTitle(false);
    const supabase = createClient();
    await supabase.from("books").update({ title: finalTitle }).eq("id", bookId);
  };

  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState("");

  const startEditingChapter = (e: React.MouseEvent, chapter: ChapterRecord) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChapterId(chapter.id);
    setEditingChapterTitle(chapter.title);
  };

  const handleChapterTitleSave = async (chapterId: string) => {
    const finalTitle = editingChapterTitle.trim() || "Untitled Chapter";
    setChapters(chapters.map(c => c.id === chapterId ? { ...c, title: finalTitle } : c));
    setEditingChapterId(null);
    const supabase = createClient();
    await supabase.from("chapters").update({ title: finalTitle }).eq("id", chapterId);
  };

  const [chapterToDelete, setChapterToDelete] = useState<ChapterRecord | null>(null);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;
    setIsDeletingChapter(true);
    const supabase = createClient();
    
    // Manually cascade delete blocks first
    await supabase.from("blocks").delete().eq("chapter_id", chapterToDelete.id);
    await supabase.from("chapters").delete().eq("id", chapterToDelete.id);
    
    setChapters(chapters.filter(c => c.id !== chapterToDelete.id));
    setChapterToDelete(null);
    setIsDeletingChapter(false);
  };

  useEffect(() => {
    async function fetchData() {
      if (!bookId || !isLoaded || !userId) return;
      const supabase = createClient();
      
      const { data: bookData } = await supabase.from("books").select("*").eq("id", bookId).eq("user_id", userId).single();
      if (bookData) setBook(bookData);

      const { data: countsData } = await supabase.rpc("get_chapter_word_counts", { book_uuid: bookId });
      const countsMap = new Map();
      if (countsData) {
        countsData.forEach((row: { chapter_id: string; word_count: number }) => countsMap.set(row.chapter_id, row.word_count));
      }

      const { data: chaptersData } = await supabase.from("chapters").select("*").eq("book_id", bookId).order("created_at", { ascending: true });
      if (chaptersData) setChapters(chaptersData.map(c => ({ ...c, word_count: countsMap.get(c.id) || 0 })));

      setIsLoading(false);
    }
    fetchData();
  }, [bookId, isLoaded, userId]);

  useEffect(() => {
    async function fetchManuscript() {
      if (viewMode !== "manuscript" || chapters.length === 0 || allBlocks.length > 0) return;
      setIsLoadingManuscript(true);
      const supabase = createClient();
      const chapterIds = chapters.map(c => c.id);
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .in("chapter_id", chapterIds)
        .order("order_index", { ascending: true });
        
      if (!error && data) {
        setAllBlocks(data);
      }
      setIsLoadingManuscript(false);
    }
    fetchManuscript();
  }, [viewMode, chapters, allBlocks.length]);

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

  const handleExportWord = async () => {
    if (!book || chapters.length === 0) return;
    setIsExporting(true);
    
    try {
      const supabase = createClient();
      
      const chapterIds = chapters.map(c => c.id);
      const { data: blocksData, error: blocksErr } = await supabase
        .from("blocks")
        .select("*")
        .in("chapter_id", chapterIds)
        .order("order_index", { ascending: true });
        
      if (blocksErr) {
        console.error("Failed to fetch blocks for export", blocksErr);
        setIsExporting(false);
        return;
      }
      
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

      const blocksByChapter = chapters.reduce((acc, chapter) => {
        acc[chapter.id] = blocksData?.filter(b => b.chapter_id === chapter.id) || [];
        return acc;
      }, {} as Record<string, BlockRecord[]>);

      const chapterParagraphs = chapters.flatMap((chapter, index) => {
        const chapterBlocks = blocksByChapter[chapter.id] || [];
        
        const titlePara = new Paragraph({
          text: chapter.title || `Chapter ${index + 1}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          pageBreakBefore: index > 0,
        });

        const blockParas = chapterBlocks.map((block) => {
          const isNormal = !block.note_type || block.note_type === "normal";
          if (!isNormal) {
            const labels: Record<string, string> = {
              investigate_later: "[Investigate Later] ",
              author_note: "[Author Note] ",
              character_idea: "[Character Idea] ",
              plot_point: "[Plot Point] ",
            };
            const textPrefix = labels[block.note_type] || `[${block.note_type}] `;
            
            return new Paragraph({
              children: [
                new TextRun({ text: textPrefix, bold: true, italics: true }),
                new TextRun({ text: block.content, italics: true })
              ],
              spacing: { after: 300 }
            });
          }

          return new Paragraph({
            children: [new TextRun({ text: block.content })],
            spacing: { after: 300 }
          });
        });

        return [titlePara, ...blockParas];
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: book.title || "Untitled Draft",
                heading: HeadingLevel.TITLE,
                spacing: { after: 800 },
              }),
              ...chapterParagraphs
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title || "Exported_Book"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEvaluateScript = async () => {
    if (!bookId || !book) return;
    setIsEvaluatingScript(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, type: "script" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      
      setBook({
        ...book,
        script_score: data.score,
        script_feedback: data.feedback
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to evaluate script.");
    } finally {
      setIsEvaluatingScript(false);
    }
  };

  const isLearnMode = book?.project_type === "learn";
  const unlockedChapters = new Set<string>();
  if (isLearnMode) {
    let isNextUnlocked = true;
    for (const chapter of chapters) {
      if (isNextUnlocked) {
        unlockedChapters.add(chapter.id);
      }
      isNextUnlocked = !!chapter.is_passed;
    }
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f7f4ef] text-stone-900"}`}>
      <div className={`pointer-events-none fixed inset-0 ${isDarkMode ? "bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.08),_transparent_55%)]" : "bg-[radial-gradient(ellipse_at_top,_rgba(180,140,90,0.12),_transparent_55%)]"}`} aria-hidden />

      <header className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${isDarkMode ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80" : "bg-[#f7f4ef]/85 border-b border-stone-200/80"}`}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className={`p-2 -ml-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10 text-zinc-400 hover:text-zinc-200" : "hover:bg-black/5 text-stone-500 hover:text-stone-700"
            }`}
            aria-label="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={book?.title || ""}
                onChange={(e) => setBook(b => b ? { ...b, title: e.target.value } : null)}
                onBlur={(e) => handleTitleSave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    handleTitleSave((e.target as HTMLInputElement).value);
                  }
                }}
                className={`text-[11px] uppercase tracking-[0.22em] bg-transparent outline-none border-b border-dashed ${
                  isDarkMode ? "text-zinc-300 border-zinc-500" : "text-stone-700 border-stone-400"
                } w-32 sm:w-auto`}
                autoFocus
              />
            ) : (
              <p 
                onClick={() => setIsEditingTitle(true)}
                className={`text-[11px] uppercase tracking-[0.22em] cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}
                title="Click to edit project name"
              >
                {book ? book.title : "Loading..."}
                {book && <Pencil size={10} className="opacity-50" />}
              </p>
            )}
            <h1 className="text-xl font-medium tracking-tight mt-0.5">Chapters</h1>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <UserButton />
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-4xl md:mx-auto w-full py-8 space-y-6">
        
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {viewMode === "list" ? "Table of Contents" : "Manuscript"}
            </h2>
            <div className={`flex p-1 rounded-lg ${isDarkMode ? "bg-zinc-800/50" : "bg-stone-200/50"}`}>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? (isDarkMode ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-stone-900 shadow-sm") : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-stone-500 hover:text-stone-700")}`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("manuscript")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "manuscript" ? (isDarkMode ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-stone-900 shadow-sm") : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-stone-500 hover:text-stone-700")}`}
                title="Manuscript View"
              >
                <ScrollText size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportWord}
              disabled={isExporting || chapters.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                isDarkMode 
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50" 
                  : "bg-white text-stone-700 hover:bg-stone-50 border disabled:opacity-50"
              }`}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export Word
            </button>
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : viewMode === "manuscript" ? (
          isLoadingManuscript ? (
            <div className="flex justify-center items-center py-20 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className={`max-w-2xl mx-auto py-8 space-y-16 ${isDarkMode ? "text-zinc-300" : "text-stone-800"} text-lg leading-relaxed font-serif`}>
              {book?.project_type === "reel" && (
                <div className="font-sans mb-8">
                  <ScoreWidget
                    title="Script"
                    score={book.script_score || null}
                    feedback={book.script_feedback || null}
                    isAnalyzing={isEvaluatingScript}
                    isDarkMode={isDarkMode}
                    onAnalyze={handleEvaluateScript}
                  />
                </div>
              )}
              {chapters.map(chapter => {
                const chapterBlocks = allBlocks.filter(b => b.chapter_id === chapter.id);
                return (
                  <section key={chapter.id} className="space-y-6">
                    <h2 className={`text-3xl font-bold tracking-tight font-sans mb-8 ${isDarkMode ? "text-zinc-100" : "text-stone-900"}`}>
                      {chapter.title}
                    </h2>
                    {chapterBlocks.length === 0 ? (
                      <p className="italic opacity-40 text-sm font-sans">No text written yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {chapterBlocks.map(block => {
                          const isNormal = !block.note_type || block.note_type === "normal";
                          if (!isNormal) {
                            const labels: Record<string, string> = {
                              investigate_later: "Investigate Later",
                              author_note: "Author Note",
                              character_idea: "Character Idea",
                              plot_point: "Plot Point",
                            };
                            return (
                              <div key={block.id} className={`p-4 rounded-xl text-sm font-sans my-6 border-l-2 ${
                                isDarkMode 
                                  ? "bg-amber-900/10 border-amber-500/50 text-amber-200/80" 
                                  : "bg-amber-50 border-amber-400 text-amber-800"
                              }`}>
                                <span className="font-bold uppercase tracking-wider text-[10px] mb-1 block opacity-70">
                                  {labels[block.note_type] || block.note_type}
                                </span>
                                {block.content}
                              </div>
                            );
                          }
                          return (
                            <p key={block.id} className="whitespace-pre-wrap">{block.content}</p>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )
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
            {chapters.map((chapter, index) => {
              const isLocked = isLearnMode && !unlockedChapters.has(chapter.id);
              const isPassed = isLearnMode && chapter.is_passed;
              
              const CardContent = (
                <article className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  isLocked 
                    ? isDarkMode ? "bg-zinc-900/40 border-zinc-800/50 opacity-60" : "bg-stone-50 border-stone-200/50 opacity-60"
                    : isDarkMode 
                      ? "bg-zinc-900/60 border-zinc-700/80 hover:bg-zinc-800/80 hover:border-zinc-600 shadow-black/40 hover:-translate-y-1 hover:shadow-lg" 
                      : "bg-white/80 border-stone-200/90 hover:bg-white hover:border-stone-300 shadow-stone-200/50 hover:-translate-y-1 hover:shadow-lg"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                        isPassed
                          ? "bg-green-500/20 text-green-600"
                          : isLocked
                            ? isDarkMode ? "bg-zinc-800/50 text-zinc-600" : "bg-stone-200/50 text-stone-400"
                            : isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-stone-100 text-stone-600 group-hover:bg-stone-200"
                      } transition-colors`}>
                        {isPassed ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : index + 1}
                      </div>
                      <div>
                        {editingChapterId === chapter.id ? (
                          <input
                            autoFocus
                            value={editingChapterTitle}
                            onChange={(e) => setEditingChapterTitle(e.target.value)}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onBlur={() => handleChapterTitleSave(chapter.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleChapterTitleSave(chapter.id);
                              }
                            }}
                            className={`font-medium text-lg tracking-tight bg-transparent outline-none border-b border-dashed w-full ${
                              isDarkMode ? "text-zinc-100 border-zinc-500" : "text-stone-900 border-stone-400"
                            }`}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg tracking-tight line-clamp-1">{chapter.title}</h3>
                            {isPassed && chapter.lesson_score && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-green-600 bg-green-500/10">
                                {chapter.lesson_score}/100
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-stone-200 text-stone-500"}`}>
                            {(chapter.word_count || 0).toLocaleString()} palabras
                          </span>
                          <p className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
                            {new Date(chapter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!isLearnMode && (
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => startEditingChapter(e, chapter)}
                          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-stone-100 text-stone-400"}`}
                          title="Edit chapter name"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setChapterToDelete(chapter);
                          }}
                          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}
                          title="Delete chapter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );

              return isLocked ? (
                <div key={chapter.id} className="cursor-not-allowed">
                  {CardContent}
                </div>
              ) : (
                <Link href={`/book/${bookId}/chapter/${chapter.id}`} key={chapter.id}>
                  {CardContent}
                </Link>
              );
            })}
          </div>
        )}

      </main>

      <ConfirmModal
        isOpen={!!chapterToDelete}
        title="Delete Chapter"
        description={`Are you sure you want to delete "${chapterToDelete?.title}"? All text blocks inside it will be permanently lost. This action cannot be undone.`}
        isDarkMode={isDarkMode}
        isLoading={isDeletingChapter}
        onConfirm={handleDeleteChapter}
        onCancel={() => setChapterToDelete(null)}
      />
    </div>
  );
}
