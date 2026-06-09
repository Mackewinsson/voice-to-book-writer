"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { Mic, Moon, Sun, MoreHorizontal, Loader2, Pencil, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Block = { id: string; text: string };

function TranscriptionSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const barClass = isDarkMode ? "bg-zinc-700" : "bg-stone-200";
  const cardClass = isDarkMode
    ? "bg-zinc-900/60 border-zinc-700"
    : "bg-white/80 border-stone-200";
  const labelClass = isDarkMode ? "text-zinc-400" : "text-stone-500";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 animate-pulse ${cardClass}`}
    >
      <p className={`text-sm italic ${labelClass}`}>Transcribing...</p>
      <div className={`h-4 rounded ${barClass} w-full`} />
      <div className={`h-4 rounded ${barClass} w-5/6`} />
      <div className={`h-4 rounded ${barClass} w-4/5`} />
      <div className={`h-4 rounded ${barClass} w-2/3`} />
    </div>
  );
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function TextBlock({
  block,
  isDarkMode,
  isEditing,
  isHighlighted,
  onStartEdit,
  onChange,
  onSave,
  onEndEdit,
}: {
  block: Block;
  isDarkMode: boolean;
  isEditing: boolean;
  isHighlighted: boolean;
  onStartEdit: () => void;
  onChange: (text: string) => void;
  onSave: (text: string) => void;
  onEndEdit: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cardClass = isDarkMode
    ? "bg-zinc-900/70 border-zinc-700/80"
    : "bg-white/90 border-stone-200/90 shadow-sm shadow-stone-200/40";
  const lockedTextClass = isDarkMode ? "text-zinc-500" : "text-stone-400";
  const editingTextClass = isDarkMode ? "text-white" : "text-stone-900";
  const actionBtnClass = isDarkMode
    ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
    : "text-stone-400 hover:text-stone-700 hover:bg-stone-100";
  const lockBtnClass = isDarkMode
    ? "text-zinc-300 hover:text-white hover:bg-zinc-800"
    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100";

  const handleLock = () => {
    const text = textareaRef.current?.value ?? block.text;
    onSave(text);
    onEndEdit();
  };

  useLayoutEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    autoResizeTextarea(el);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing, block.id]);

  useLayoutEffect(() => {
    if (isEditing) autoResizeTextarea(textareaRef.current);
  }, [block.text, isEditing]);

  return (
    <article
      className={`relative rounded-xl border p-4 pr-12 transition-colors ${cardClass} ${
        isHighlighted ? "block-highlight" : ""
      } ${isHighlighted ? "block-enter" : ""}`}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={block.text}
          onChange={(e) => {
            onChange(e.target.value);
            autoResizeTextarea(e.target);
          }}
          onBlur={(e) => {
            onSave(e.target.value);
            onEndEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onEndEdit();
            }
          }}
          rows={1}
          className={`w-full resize-none overflow-hidden bg-transparent outline-none leading-7 text-xl font-normal transition-colors ${editingTextClass}`}
        />
      ) : (
        <p
          className={`whitespace-pre-wrap leading-7 text-xl font-normal transition-colors ${lockedTextClass}`}
        >
          {block.text}
        </p>
      )}

      {isEditing ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLock}
          aria-label="Lock paragraph"
          className={`absolute top-3 right-3 rounded-lg p-2 transition-all ${lockBtnClass}`}
        >
          <Lock size={15} strokeWidth={1.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          aria-label="Edit paragraph"
          className={`absolute top-3 right-3 rounded-lg p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all ${actionBtnClass}`}
        >
          <Pencil size={15} strokeWidth={1.75} />
        </button>
      )}
    </article>
  );
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(
    null
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);

  const scrollToActive = useCallback(() => {
    requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedbackMessage(message);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        let { data: books, error: bookErr } = await supabase
          .from("books")
          .select("*")
          .limit(1);

        if (bookErr) {
          console.error(
            "Failed to load books. Did you run the SQL script?",
            bookErr
          );
          return;
        }

        let book = books?.[0];
        if (!book) {
          const { data: newBook, error: insertBookErr } = await supabase
            .from("books")
            .insert({ title: "My First Book" })
            .select()
            .single();
          if (insertBookErr) {
            console.error("Failed to create book:", insertBookErr);
            return;
          }
          book = newBook;
        }

        if (!book) return;

        let { data: chapters, error: chapterErr } = await supabase
          .from("chapters")
          .select("*")
          .eq("book_id", book.id)
          .limit(1);
        if (chapterErr) {
          console.error("Failed to load chapter:", chapterErr);
          return;
        }

        let chapter = chapters?.[0];
        if (!chapter) {
          const { data: newChapter, error: insertChapErr } = await supabase
            .from("chapters")
            .insert({ book_id: book.id, title: "Chapter 1" })
            .select()
            .single();
          if (insertChapErr) {
            console.error("Failed to create chapter:", insertChapErr);
            return;
          }
          chapter = newChapter;
        }

        if (!chapter) return;
        setChapterId(chapter.id);

        const { data: fetchedBlocks, error: blocksErr } = await supabase
          .from("blocks")
          .select("*")
          .eq("chapter_id", chapter.id)
          .order("order_index", { ascending: true });

        if (blocksErr) {
          console.error("Failed to load blocks:", blocksErr);
          return;
        }

        if (fetchedBlocks && fetchedBlocks.length > 0) {
          setBlocks(
            fetchedBlocks.map((b: { id: string; content: string }) => ({
              id: b.id,
              text: b.content,
            }))
          );
        }
      } catch (err) {
        console.error("Unexpected error in loadData:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isProcessing || highlightBlockId) scrollToActive();
  }, [isProcessing, highlightBlockId, scrollToActive]);

  useEffect(() => {
    if (isRecording) scrollToActive();
  }, [isRecording, scrollToActive]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleBlockEdit = (id: string, newText: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text: newText } : b))
    );
  };

  const handleBlockSave = async (id: string, newText: string) => {
    const supabase = createClient();
    await supabase.from("blocks").update({ content: newText }).eq("id", id);
  };

  const startEdit = (id: string) => {
    setEditingBlockId(id);
  };

  const endEdit = () => {
    setEditingBlockId(null);
  };

  const appendBlock = (id: string, text: string) => {
    setBlocks((prev) => [...prev, { id, text }]);
    setHighlightBlockId(id);
    window.setTimeout(() => setHighlightBlockId(null), 2000);
  };

  const startRecording = async () => {
    if (editingBlockId) {
      const block = blocks.find((b) => b.id === editingBlockId);
      if (block) await handleBlockSave(editingBlockId, block.text);
      setEditingBlockId(null);
    }

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
        const durationMs = recordingStartedAtRef.current
          ? Date.now() - recordingStartedAtRef.current
          : 0;
        recordingStartedAtRef.current = null;

        if (audioChunksRef.current.length === 0) {
          showFeedback("No audio captured. Tap the mic and try again.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (audioBlob.size === 0) {
          showFeedback("No audio captured. Tap the mic and try again.");
          return;
        }

        if (durationMs < 400) {
          showFeedback("Recording too short. Hold the mic while you speak.");
          return;
        }

        await processAudio(audioBlob);
      };

      recordingStartedAtRef.current = Date.now();
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
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/process-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Failed to process audio";
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch {
          // ignore parsing error
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const newText = typeof data.text === "string" ? data.text.trim() : "";

      if (data.empty || !newText) {
        showFeedback("No speech detected. Tap the mic and try again.");
        return;
      }

      if (chapterId) {
        const newOrderIndex = blocks.length;

        const supabase = createClient();
        const { data: newBlock, error } = await supabase
          .from("blocks")
          .insert({
            chapter_id: chapterId,
            content: newText,
            order_index: newOrderIndex,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to save block to DB", error);
          appendBlock(Date.now().toString(), newText);
        } else if (newBlock) {
          appendBlock(newBlock.id, newBlock.content);
        }
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while processing the audio.";
      alert(message);
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
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0c0c0e] text-zinc-100"
          : "bg-[#f7f4ef] text-stone-900"
      }`}
    >
      <div
        className={`pointer-events-none fixed inset-0 ${
          isDarkMode
            ? "bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.08),_transparent_55%)]"
            : "bg-[radial-gradient(ellipse_at_top,_rgba(180,140,90,0.12),_transparent_55%)]"
        }`}
        aria-hidden
      />

      <header
        className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 backdrop-blur-md ${
          isDarkMode
            ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80"
            : "bg-[#f7f4ef]/85 border-b border-stone-200/80"
        }`}
      >
        <div>
          <p
            className={`text-[11px] uppercase tracking-[0.22em] ${
              isDarkMode ? "text-zinc-500" : "text-stone-500"
            }`}
          >
            Voice draft
          </p>
          <h1 className="text-xl font-medium tracking-tight mt-0.5">
            Chapter 1
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-2xl md:mx-auto w-full pb-[50vh] pt-[40vh] space-y-5">
        {isLoading && (
          <div className="flex justify-center items-center py-10 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!isLoading &&
          blocks.length === 0 &&
          !isProcessing &&
          !isRecording && (
            <div className="text-center mt-16 space-y-2">
              <p
                className={`text-2xl font-medium tracking-tight ${
                  isDarkMode ? "text-zinc-200" : "text-stone-800"
                }`}
              >
                Speak your first paragraph
              </p>
              <p
                className={`italic text-base ${
                  isDarkMode ? "text-zinc-500" : "text-stone-500"
                }`}
              >
                Tap the mic below. Each recording becomes a locked block you
                can refine later.
              </p>
            </div>
          )}

        {blocks.map((block) => (
          <div key={block.id} className="group">
            <TextBlock
              block={block}
              isDarkMode={isDarkMode}
              isEditing={editingBlockId === block.id}
              isHighlighted={highlightBlockId === block.id}
              onStartEdit={() => startEdit(block.id)}
              onChange={(text) => handleBlockEdit(block.id, text)}
              onSave={(text) => handleBlockSave(block.id, text)}
              onEndEdit={endEdit}
            />
          </div>
        ))}

        {isRecording && (
          <div
            className={`rounded-xl border border-dashed px-4 py-5 flex gap-3 items-center ${
              isDarkMode
                ? "border-red-500/30 bg-red-500/5"
                : "border-red-400/40 bg-red-50/60"
            }`}
          >
            <div className="flex gap-1.5">
              <div
                className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span
              className={`text-sm ${
                isDarkMode ? "text-red-300/80" : "text-red-600/80"
              }`}
            >
              Listening…
            </span>
          </div>
        )}

        {isProcessing && <TranscriptionSkeleton isDarkMode={isDarkMode} />}

        <div className="flex flex-col items-center gap-4 mt-8 pb-8 transition-all">
          {feedbackMessage ? (
            <p
              role="status"
              className={`text-sm text-center px-4 ${
                isDarkMode ? "text-amber-300/90" : "text-amber-700"
              }`}
            >
              {feedbackMessage}
            </p>
          ) : !isRecording && !isProcessing && blocks.length > 0 ? (
            <p
              className={`text-xs tracking-wide ${
                isDarkMode ? "text-zinc-500" : "text-stone-500"
              }`}
            >
              Tap mic for the next paragraph
            </p>
          ) : null}
          <button
            onClick={handleRecordClick}
            disabled={isProcessing || isLoading || !chapterId}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
              isRecording
                ? "bg-red-500 shadow-red-500/30 ring-4 ring-red-500/20"
                : isDarkMode
                  ? "bg-zinc-100 text-zinc-900 hover:bg-white shadow-zinc-900/20"
                  : "bg-stone-900 text-stone-50 hover:bg-black shadow-stone-900/25"
            }`}
          >
            {isRecording && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-400" />
            )}

            {isProcessing ? (
              <Loader2
                size={32}
                className={`animate-spin ${isDarkMode ? "text-zinc-900" : "text-white"}`}
              />
            ) : (
              <Mic
                size={32}
                className={`transition-colors duration-200 ${isRecording ? "text-white" : ""}`}
              />
            )}
          </button>
        </div>

        <div ref={bottomAnchorRef} className="h-1" aria-hidden />
      </main>

    </div>
  );
}
