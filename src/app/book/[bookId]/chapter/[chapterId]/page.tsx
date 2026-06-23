"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type PointerEvent,
} from "react";
import { Mic, Moon, Sun, Loader2, Pencil, Lock, Bookmark, User, Compass, Sparkles, ChevronLeft, ClipboardPaste, Check, Trash2, Bot, GripVertical, ChevronDown, Star, Keyboard, Send, Upload, Plus } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";
import PaywallModal from "@/components/PaywallModal";
import ConfirmModal from "@/components/ConfirmModal";
import ScoreWidget from "@/components/ScoreWidget";
import { learnLessons } from "@/utils/learnLessons";

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
] as const;

function getSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }

  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

async function requestMicrophoneStream(): Promise<MediaStream> {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  type LegacyNavigator = Navigator & {
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      success: (stream: MediaStream) => void,
      error: (err: Error) => void
    ) => void;
    webkitGetUserMedia?: LegacyNavigator["getUserMedia"];
    mozGetUserMedia?: LegacyNavigator["getUserMedia"];
    msGetUserMedia?: LegacyNavigator["getUserMedia"];
  };

  const legacyNavigator = navigator as LegacyNavigator;
  const getUserMedia =
    legacyNavigator.getUserMedia ||
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia ||
    legacyNavigator.msGetUserMedia;

  if (!getUserMedia) {
    throw new Error("Microphone API not supported in this browser.");
  }

  return new Promise((resolve, reject) => {
    getUserMedia.call(navigator, { audio: true }, resolve, reject);
  });
}

type Block = { id: string; text: string; note_type?: string };

const NOTE_TYPES = [
  { id: 'normal', label: 'Normal', icon: Pencil, color: 'bg-transparent' },
  { id: 'investigate_later', label: 'Investigate', icon: Compass, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'author_note', label: 'Author Note', icon: User, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'character_idea', label: 'Character', icon: Sparkles, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'plot_point', label: 'Plot Point', icon: Bookmark, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
];

function TranscriptionSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const barClass = isDarkMode ? "bg-zinc-700/50" : "bg-stone-200";
  const cardClass = isDarkMode
    ? "bg-zinc-900/70 border-zinc-700/80"
    : "bg-white/90 border-stone-200/90 shadow-sm shadow-stone-200/40";
  const labelClass = isDarkMode ? "text-zinc-500" : "text-stone-400";

  return (
    <article
      className={`relative rounded-xl border p-3 pr-3 sm:p-4 sm:pr-12 transition-colors ${cardClass} w-full backdrop-blur-md`}
    >
      <div className="animate-pulse space-y-3">
        <p className={`text-sm italic ${labelClass} mb-2`}>Transcribiendo...</p>
        <div className={`h-4 rounded ${barClass} w-full`} />
        <div className={`h-4 rounded ${barClass} w-5/6`} />
        <div className={`h-4 rounded ${barClass} w-4/5`} />
        <div className={`h-4 rounded ${barClass} w-2/3`} />
      </div>
    </article>
  );
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function InsertButton({ onClick, isDarkMode, position }: { onClick: () => void, isDarkMode: boolean, position: 'top' | 'bottom' }) {
  const positionClass = position === 'top' ? '-top-2.5' : '-bottom-2.5';
  return (
    <div className={`absolute ${positionClass} left-0 right-0 flex justify-center opacity-0 hover:opacity-100 transition-opacity z-20`}>
      <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] ${isDarkMode ? "bg-indigo-500/50" : "bg-indigo-400/50"}`} />
      <button
        type="button"
        onClick={onClick}
        className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 ${
          isDarkMode ? "bg-zinc-800 border-indigo-500/50 text-indigo-400 hover:bg-zinc-700" : "bg-white border-indigo-300 text-indigo-500 hover:bg-indigo-50"
        }`}
        title="Insert new paragraph here"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function TextBlock({
  block,
  isDarkMode,
  isEditing,
  isHighlighted,
  isRecordingTarget,
  isFirst,
  onStartEdit,
  onChange,
  onSave,
  onEndEdit,
  onChangeNoteType,
  onDelete,
  onInsertAbove,
  onInsertBelow,
  onRecordClick,
}: {
  block: Block;
  isDarkMode: boolean;
  isEditing: boolean;
  isHighlighted: boolean;
  isRecordingTarget?: boolean;
  isFirst?: boolean;
  onStartEdit: () => void;
  onChange: (text: string) => void;
  onSave: (text: string, type?: string) => void;
  onEndEdit: () => void;
  onChangeNoteType: (id: string, type: string) => void;
  onDelete: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  onRecordClick?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

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
    onSave(text, block.note_type);
    onEndEdit();
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPrompt = async () => {
    const prompt = `I am currently writing a book and I have left the following thought for deeper investigation:

"${block.text}"

Please act as an expert researcher and author assistant. Conduct a deep, comprehensive investigation on this topic to help me expand my book. Provide historical context, related interesting facts, potential arguments, and suggest how I could effectively integrate this point within my narrative.`;
    await navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

  const activeType = NOTE_TYPES.find(t => t.id === (block.note_type || 'normal')) || NOTE_TYPES[0];
  const TypeIcon = activeType.icon;

  const askAiBtnClass = isCopied
    ? "text-green-500 bg-green-500/10 border-green-500/20"
    : isDarkMode
      ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20"
      : "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200";
  const deleteBtnClass = isDarkMode
    ? "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
    : "text-stone-400 hover:text-red-500 hover:bg-red-50";

  return (
    <Reorder.Item
      as="article"
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={dragControls}
      className={`group relative flex flex-col rounded-xl border p-3 pl-9 pr-3 sm:p-4 sm:pl-12 sm:pr-12 transition-colors ${cardClass} ${
        activeType.id !== 'normal' ? activeType.color : ''
      } ${
        isHighlighted ? "block-highlight" : ""
      } ${isHighlighted ? "block-enter" : ""}`}
    >
      {/* Drag Handle */}
      <div
        className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing rounded-md opacity-20 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:hover:bg-black/5 dark:sm:hover:bg-white/5 transition-all ${isDarkMode ? "text-zinc-400" : "text-stone-400"}`}
        onPointerDown={(e) => dragControls.start(e)}
        title="Drag to reorder"
      >
        <GripVertical size={18} />
      </div>

      {/* Type Badge */}
      {activeType.id !== 'normal' && !isEditing && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-inherit border flex items-center gap-1">
          <TypeIcon size={10} />
          {activeType.label}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 pb-1">
            {NOTE_TYPES.map(nt => {
              const Icon = nt.icon;
              return (
                <button
                  key={nt.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onChangeNoteType(block.id, nt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
                    (block.note_type || 'normal') === nt.id
                      ? isDarkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-stone-200 border-stone-300 text-stone-900'
                      : isDarkMode ? 'border-transparent text-zinc-400 hover:bg-zinc-800' : 'border-transparent text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={12} />
                  {nt.label}
                </button>
              )
            })}
          </div>
          <textarea
            ref={textareaRef}
            value={block.text}
            onChange={(e) => {
              onChange(e.target.value);
              autoResizeTextarea(e.target);
            }}
            onBlur={(e) => {
              onSave(e.target.value, block.note_type);
              onEndEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onEndEdit();
              } else if (e.key === " " && (!textareaRef.current?.value || textareaRef.current.value.trim() === "") && onRecordClick) {
                e.preventDefault();
                onRecordClick();
              } else if (e.ctrlKey && e.key === " " && onRecordClick) {
                e.preventDefault();
                onRecordClick();
              }
            }}
            rows={1}
            className={`w-full resize-none overflow-hidden bg-transparent outline-none text-base leading-relaxed sm:text-xl sm:leading-7 font-normal transition-colors ${editingTextClass}`}
          />
        </div>
      ) : (
        <div
          className={`whitespace-pre-wrap text-base leading-relaxed sm:text-xl sm:leading-7 font-normal transition-colors min-h-[1.5em] ${lockedTextClass}`}
        >
          {isRecordingTarget ? (
            <span className="flex items-center gap-2 text-red-500 opacity-80 animate-pulse text-sm">
              <Mic size={16} /> Escuchando...
            </span>
          ) : (
            block.text
          )}
        </div>
      )}

      {/* Bottom bar with word count and mobile actions */}
      <div
        className={`mt-3 flex items-center justify-between gap-1 border-t pt-2 ${
          isDarkMode ? "border-zinc-700/60" : "border-stone-200/80"
        }`}
      >
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-stone-400"}`}>
          {block.text.trim().split(/\s+/).filter(Boolean).length} palabras
        </span>

        <div className="flex items-center gap-1 sm:hidden">
          {isEditing ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLock}
              aria-label="Lock paragraph"
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all ${lockBtnClass}`}
            >
              <Lock size={15} strokeWidth={1.75} />
            </button>
          ) : (
            <>
              {block.note_type === 'investigate_later' && (
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  aria-label="Copy prompt for AI"
                  title="Copy prompt for AI investigation"
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-all ${askAiBtnClass}`}
                >
                  {isCopied ? <Check size={16} strokeWidth={2} /> : <Bot size={16} strokeWidth={2} />}
                </button>
              )}
              <button
                type="button"
                onClick={onStartEdit}
                aria-label="Edit paragraph"
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all ${actionBtnClass}`}
              >
                <Pencil size={15} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete paragraph"
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all ${deleteBtnClass}`}
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop action cluster */}
      {isEditing ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLock}
          aria-label="Lock paragraph"
          className={`absolute top-3 right-3 hidden rounded-lg p-2 transition-all sm:block ${lockBtnClass}`}
        >
          <Lock size={15} strokeWidth={1.75} />
        </button>
      ) : (
        <div className="absolute top-3 right-3 hidden items-center gap-1 sm:flex">
          {block.note_type === 'investigate_later' && (
            <button
              type="button"
              onClick={handleCopyPrompt}
              aria-label="Copy prompt for AI"
              title="Copy prompt for AI investigation"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 text-xs font-medium border ${askAiBtnClass}`}
            >
              {isCopied ? <Check size={14} strokeWidth={2} /> : <Bot size={14} strokeWidth={2} />}
              {isCopied ? "Copied!" : "Ask AI"}
            </button>
          )}
          <button
            type="button"
            onClick={onStartEdit}
            aria-label="Edit paragraph"
            className={`rounded-lg p-2 opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 ${actionBtnClass}`}
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete paragraph"
            className={`rounded-lg p-2 opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 ${deleteBtnClass}`}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      )}
      
      {isFirst && onInsertAbove && <InsertButton onClick={onInsertAbove} isDarkMode={isDarkMode} position="top" />}
      {onInsertBelow && <InsertButton onClick={onInsertBelow} isDarkMode={isDarkMode} position="bottom" />}
    </Reorder.Item>
  );
}

export default function BookEditor() {
  const params = useParams<{ bookId: string; chapterId: string }>();
  const bookId = params?.bookId;
  const chapterId = params?.chapterId;
  const { userId, isLoaded } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(null);
  const [recordingTargetBlockId, setRecordingTargetBlockId] = useState<string | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);
  const [isDeletingBlock, setIsDeletingBlock] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ free_seconds_remaining: number; gemini_api_key?: string } | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "write">("voice");
  const [manualText, setManualText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingMimeTypeRef = useRef<string>("audio/webm");
  const audioChunksRef = useRef<BlobPart[]>([]);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState<string | null>(null);
  const [chapterDetailedDescription, setChapterDetailedDescription] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [hookScore, setHookScore] = useState<number | null>(null);
  const [hookFeedback, setHookFeedback] = useState<string | null>(null);
  const [isEvaluatingHook, setIsEvaluatingHook] = useState(false);
  const [lessonScore, setLessonScore] = useState<number | null>(null);
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [lessonAlternative, setLessonAlternative] = useState<string | null>(null);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [starsEarned, setStarsEarned] = useState<number>(0);
  const [isEvaluatingLesson, setIsEvaluatingLesson] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [projectLanguage, setProjectLanguage] = useState<string>("English");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chapterInputRef = useRef<HTMLInputElement>(null);

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
      if (!isLoaded || !userId) return;
      
      try {
        const supabase = createClient();

        const { data: books, error: bookErr } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .eq("user_id", userId)
          .single();

        if (bookErr || !books) {
          console.error("Failed to load book:", bookErr);
          return;
        }

        const book = books;

        if (!book) return;
        setBookTitle(book.title);
        setProjectType(book.project_type || "book");
        if (book.project_language) {
          setProjectLanguage(book.project_language);
        }
        setHookScore(book.hook_score);
        setHookFeedback(book.hook_feedback);

        const { data: chapter, error: chapterErr } = await supabase
          .from("chapters")
          .select("*")
          .eq("id", chapterId)
          .single();
        if (chapterErr || !chapter) {
          console.error("Failed to load chapter:", chapterErr);
          return;
        }

        setChapterTitle(chapter.title);
        setChapterDescription(chapter.description);
        setChapterDetailedDescription(chapter.detailed_description);
        setLessonScore(chapter.lesson_score);
        setLessonFeedback(chapter.lesson_feedback);
        setLessonAlternative(chapter.lesson_alternative);
        setIsPassed(chapter.is_passed);
        setStarsEarned(chapter.stars_earned || 0);

        const { data: fetchedBlocks, error: blocksErr } = await supabase
          .from("blocks")
          .select("*")
          .eq("chapter_id", chapterId)
          .order("order_index", { ascending: true });

        if (blocksErr) {
          console.error("Failed to load blocks:", blocksErr);
          return;
        }

        if (fetchedBlocks && fetchedBlocks.length > 0) {
          setBlocks(
            fetchedBlocks.map((b: { id: string; content: string; note_type: string }) => ({
              id: b.id,
              text: b.content,
              note_type: b.note_type || 'normal',
            }))
          );
        }

        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile) setProfile(profileData.profile);
        }
      } catch (err) {
        console.error("Unexpected error in loadData:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [bookId, chapterId, isLoaded, userId]);

  useEffect(() => {
    if (isProcessing || highlightBlockId) scrollToActive();
  }, [isProcessing, highlightBlockId, scrollToActive]);

  useEffect(() => {
    if (isRecording) scrollToActive();
  }, [isRecording, scrollToActive]);

  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true;
      if (blocks.length > 0) {
        const timer = setTimeout(scrollToActive, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, blocks.length, scrollToActive]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    const finalTitle = newTitle.trim() || "Untitled Draft";
    setBookTitle(finalTitle);
    setIsEditingTitle(false);
    const supabase = createClient();
    await supabase.from("books").update({ title: finalTitle }).eq("id", bookId);
  };

  const handleChapterTitleSave = async (newTitle: string) => {
    const finalTitle = newTitle.trim() || "Untitled Chapter";
    setChapterTitle(finalTitle);
    setIsEditingChapter(false);
    const supabase = createClient();
    await supabase.from("chapters").update({ title: finalTitle }).eq("id", chapterId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      // Split by double newline to get paragraphs
      const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
      
      if (paragraphs.length === 0) {
        setIsImporting(false);
        if (event.target) event.target.value = '';
        return;
      }

      // Find current max order_index
      const maxOrder = blocks.reduce((max, b: any) => Math.max(max, b.order_index ?? 0), -1);
      
      // Prepare blocks to insert
      const newBlocks = paragraphs.map((p, index) => ({
        chapter_id: chapterId,
        content: p,
        order_index: maxOrder + 1 + index,
        note_type: 'normal'
      }));

      const supabase = createClient();
      const { data, error } = await supabase.from('blocks').insert(newBlocks).select();

      if (error) throw error;

      if (data) {
        setBlocks(prev => [...prev, ...data.map(b => ({
          id: b.id,
          text: b.content,
          note_type: b.note_type || 'normal',
          order_index: b.order_index
        }))]);
      }
    } catch (err) {
      console.error("Failed to import file:", err);
      alert("Failed to import file.");
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleEvaluateHook = async () => {
    if (!bookId || !chapterId) return;
    setIsEvaluatingHook(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, chapterId, type: "hook" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      
      setHookScore(data.score);
      setHookFeedback(data.feedback);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to evaluate hook.");
    } finally {
      setIsEvaluatingHook(false);
    }
  };

  const handleEvaluateLesson = async () => {
    if (!bookId || !chapterId) return;
    setIsEvaluatingLesson(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, chapterId, type: "lesson" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      
      setLessonScore(data.score);
      setLessonFeedback(data.feedback);
      setLessonAlternative(data.alternativeIdea);
      if (data.newStars !== undefined) {
        setStarsEarned(data.newStars);
        if (data.newStars >= 3) setIsPassed(true);
      } else {
        if (data.score >= 80) setIsPassed(true);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to evaluate lesson.");
    } finally {
      setIsEvaluatingLesson(false);
    }
  };

  const handleBlockEdit = (id: string, newText: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text: newText } : b))
    );
  };

  const handleBlockSave = async (id: string, newText: string, note_type?: string) => {
    const supabase = createClient();
    
    if (newText.trim() === "") {
      // Auto-delete if empty
      await supabase.from("blocks").delete().eq("id", id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      return;
    }

    const updatePayload: Record<string, string> = { content: newText };
    if (note_type) updatePayload.note_type = note_type;
    await supabase.from("blocks").update(updatePayload).eq("id", id);
    
    // Auto-evaluate when text changes
    if (projectType === "learn") {
      void handleEvaluateLesson();
    } else if (projectType === "reel" && chapterTitle.toLowerCase().includes("hook")) {
      void handleEvaluateHook();
    }
  };

  const handleChangeNoteType = async (id: string, newType: string) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, note_type: newType } : b));
    const supabase = createClient();
    await supabase.from("blocks").update({ note_type: newType }).eq("id", id);
  };

  const saveNewOrder = async (reorderedBlocks: Block[]) => {
    const supabase = createClient();
    // Optimistic UI update already handled by Framer Motion's onReorder.
    // Now persist to DB. We can send concurrent updates for all blocks that changed index.
    // To simplify and ensure correctness, update all blocks with their new array index.
    const promises = reorderedBlocks.map((block, index) => 
      supabase.from("blocks").update({ order_index: index }).eq("id", block.id)
    );
    await Promise.all(promises);
  };

  const handleReorder = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    saveNewOrder(newBlocks);
  };

  const startEdit = (id: string) => {
    setEditingBlockId(id);
  };

  const endEdit = () => {
    setEditingBlockId(null);
  };

  const appendBlock = (id: string, text: string) => {
    setBlocks((prev) => [...prev, { id, text, note_type: 'normal' }]);
    setHighlightBlockId(id);
    window.setTimeout(() => setHighlightBlockId(null), 2000);
  };

  const handleInsertBlock = async (index: number) => {
    if (!chapterId || isProcessing || isRecording) return;
    
    setIsProcessing(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          chapter_id: chapterId,
          content: "",
          note_type: "normal",
          order_index: index + 1,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const blocksToShift = blocks.slice(index + 1);
        if (blocksToShift.length > 0) {
          const shiftPromises = blocksToShift.map((b, i) => 
            supabase.from("blocks").update({ order_index: index + 2 + i }).eq("id", b.id)
          );
          await Promise.all(shiftPromises);
        }
        
        const newBlock = { id: data.id, text: data.content, note_type: data.note_type || "normal" };
        const finalBlocks = [...blocks];
        finalBlocks.splice(index + 1, 0, newBlock);
        
        setBlocks(finalBlocks);
        startEdit(data.id);
      }
    } catch (err) {
      console.error("Failed to insert text box:", err);
      showFeedback("Failed to create text box");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualBlock = async () => {
    if (!chapterId || isProcessing || isRecording) return;
    
    setIsProcessing(true);
    try {
      const supabase = createClient();
      const newOrderIndex = blocks.length;
      
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          chapter_id: chapterId,
          content: "",
          note_type: "normal",
          order_index: newOrderIndex,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        appendBlock(data.id, "");
        startEdit(data.id);
      }
    } catch (err) {
      console.error("Failed to create manual block:", err);
      showFeedback("Failed to create text box");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!blockToDelete) return;
    setIsDeletingBlock(true);
    const supabase = createClient();
    
    await supabase.from("blocks").delete().eq("id", blockToDelete.id);
    
    setBlocks(blocks.filter((b) => b.id !== blockToDelete.id));
    setBlockToDelete(null);
    setIsDeletingBlock(false);
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim() || isProcessing || isLoading || !chapterId) return;
    
    setIsProcessing(true);
    try {
      const supabase = createClient();
      const newOrderIndex = blocks.length;
      
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          chapter_id: chapterId,
          content: manualText.trim(),
          note_type: "normal",
          order_index: newOrderIndex,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        appendBlock(data.id, data.content);
        setManualText("");
        
        if (projectType === "learn") {
          void handleEvaluateLesson();
        } else if (projectType === "reel" && chapterTitle.toLowerCase().includes("hook")) {
          void handleEvaluateHook();
        }
      }
    } catch (err) {
      console.error("Failed to create text block:", err);
      showFeedback("Failed to save text");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (profile && profile.free_seconds_remaining <= 0 && !profile.gemini_api_key) {
      setIsPaywallOpen(true);
      return;
    }

    let stream: MediaStream;
    try {
      // Must run before any await to preserve the mobile Safari user gesture.
      stream = await requestMicrophoneStream();
    } catch (err: unknown) {
      console.error("Error accessing microphone:", err);
      const micError = err instanceof DOMException ? err : null;
      let errorMsg = "No se pudo acceder al micrófono.";

      if (micError?.name === "NotAllowedError" || micError?.name === "SecurityError") {
        errorMsg +=
          " El acceso fue denegado. Ve a Ajustes > Safari > Micrófono (o la configuración del sitio en tu navegador) y permite el acceso, luego recarga la página.";
      } else if (micError?.name === "NotFoundError") {
        errorMsg += " No se encontró ningún micrófono conectado.";
      } else if (micError?.name === "NotReadableError") {
        errorMsg += " El micrófono está siendo usado por otra aplicación.";
      } else {
        errorMsg += ` Detalles: ${
          micError?.name ||
          (err instanceof Error ? err.message : "Error desconocido")
        }`;
      }
      
      alert(errorMsg);
      return;
    }

    let targetId: string | null = null;
    if (editingBlockId) {
      const block = blocks.find((b) => b.id === editingBlockId);
      if (block) {
        targetId = editingBlockId;
        if (block.text.trim() !== "") {
          await handleBlockSave(editingBlockId, block.text);
        }
      }
      setEditingBlockId(null);
    }
    setRecordingTargetBlockId(targetId);

    try {
      const mimeType = getSupportedAudioMimeType();
      recordingMimeTypeRef.current = mimeType ?? "audio/webm";
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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
          type: recordingMimeTypeRef.current,
        });

        if (audioBlob.size === 0) {
          showFeedback("No audio captured. Tap the mic and try again.");
          return;
        }

        if (durationMs < 400) {
          showFeedback("Recording too short. Hold the mic while you speak.");
          return;
        }

        await processAudio(audioBlob, durationMs);
      };

      // eslint-disable-next-line react-hooks/purity
      recordingStartedAtRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error setting up MediaRecorder:", err);
      alert("Error al iniciar la grabación.");
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

  const processAudio = async (audioBlob: Blob, durationMs: number = 0) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      const extension = audioBlob.type.includes("mp4")
        ? "recording.m4a"
        : audioBlob.type.includes("mpeg")
          ? "recording.mp3"
          : "recording.webm";
      formData.append("audio", audioBlob, extension);
      formData.append("durationSeconds", Math.ceil(durationMs / 1000).toString());
      // Only send the last block to keep context small
      const contextBlocks = blocks.slice(-1).map(b => b.text).join("\n\n");
      formData.append("context", contextBlocks);
      formData.append("projectLanguage", projectLanguage);

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
        showFeedback("No se ha detectado voz. Toca el micro e inténtalo de nuevo.");
        setRecordingTargetBlockId(null);
        return;
      }

      if (chapterId) {
        let blockToUpdateId = recordingTargetBlockId;
        const supabase = createClient();

        if (blockToUpdateId) {
          const existingBlock = blocks.find(b => b.id === blockToUpdateId);
          const currentText = existingBlock?.text || "";
          const combinedText = currentText.trim() ? `${currentText.trim()} ${newText}` : newText;

          const { error } = await supabase
            .from("blocks")
            .update({ content: combinedText })
            .eq("id", blockToUpdateId);

          if (!error) {
            setBlocks(prev => prev.map(b => b.id === blockToUpdateId ? { ...b, text: combinedText } : b));
            setHighlightBlockId(blockToUpdateId);
            window.setTimeout(() => setHighlightBlockId(null), 2000);
            
            if (projectType === "learn") {
              void handleEvaluateLesson();
            } else if (projectType === "reel" && chapterTitle.toLowerCase().includes("hook")) {
              void handleEvaluateHook();
            }
          } else {
            console.error("Failed to update target block", error);
            blockToUpdateId = null;
          }
        }

        if (!blockToUpdateId) {
          const newOrderIndex = blocks.length;

          const { data: newBlock, error } = await supabase
            .from("blocks")
            .insert({
              chapter_id: chapterId,
              content: newText,
              order_index: newOrderIndex,
              note_type: 'normal'
            })
            .select()
            .single();

          if (error) {
            console.error("Failed to save block to DB", error);
            appendBlock(Date.now().toString(), newText);
          } else if (newBlock) {
            appendBlock(newBlock.id, newBlock.content);
            
            if (projectType === "learn") {
              void handleEvaluateLesson();
            } else if (projectType === "reel" && chapterTitle.toLowerCase().includes("hook")) {
              void handleEvaluateHook();
            }
          }
        }
      }
      setRecordingTargetBlockId(null);

      setProfile(prev => {
        if (!prev || prev.gemini_api_key) return prev;
        return { ...prev, free_seconds_remaining: Math.max(0, prev.free_seconds_remaining - Math.ceil(durationMs / 1000)) };
      });
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
      void startRecording();
    }
  };

  const handleMicPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (isProcessing || isLoading || !chapterId) return;

    // iOS Safari requires getUserMedia inside the direct touch/pointer gesture.
    event.preventDefault();
    handleRecordClick();
  };

  const handleRecordClickRef = useRef(handleRecordClick);
  useEffect(() => {
    handleRecordClickRef.current = handleRecordClick;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "BUTTON" ||
          target.isContentEditable
        ) {
          return;
        }

        e.preventDefault();
        if (!isProcessing && !isLoading && chapterId) {
          handleRecordClickRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, isLoading, chapterId]);

  const wordCount = blocks.reduce((acc, block) => {
    const text = (block.text || "").trim();
    if (!text) return acc;
    return acc + text.split(/\s+/).length;
  }, 0);

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
        className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-[calc(1.5rem+env(safe-area-inset-top))] backdrop-blur-md ${
          isDarkMode
            ? "bg-[#0c0c0e]/85 border-b border-zinc-800/80"
            : "bg-[#f7f4ef]/85 border-b border-stone-200/80"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={`/book/${bookId}`}
            className={`shrink-0 p-2 -ml-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10 text-zinc-400 hover:text-zinc-200" : "hover:bg-black/5 text-stone-500 hover:text-stone-700"
            }`}
            aria-label="Back to Chapter List"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                onBlur={() => handleTitleSave(bookTitle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    handleTitleSave(bookTitle);
                  }
                }}
                className={`w-full max-w-[200px] sm:max-w-none sm:w-auto text-[11px] uppercase tracking-[0.22em] font-medium bg-transparent outline-none border-b border-dashed ${
                  isDarkMode ? "text-zinc-300 border-zinc-500" : "text-stone-700 border-stone-400"
                }`}
                autoFocus
              />
            ) : (
              <p
                onClick={() => setIsEditingTitle(true)}
                className={`text-[11px] uppercase tracking-[0.22em] cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 truncate ${
                  isDarkMode ? "text-zinc-500" : "text-stone-500"
                }`}
                title="Click to edit project name"
              >
                {bookTitle || "Untitled Draft"}
                <Pencil size={10} className="shrink-0 opacity-50" />
              </p>
            )}

            <div className="mt-0.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
              {isEditingChapter ? (
                <input
                  ref={chapterInputRef}
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  onBlur={() => handleChapterTitleSave(chapterTitle)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      handleChapterTitleSave(chapterTitle);
                    }
                  }}
                  className={`w-full max-w-[200px] sm:max-w-none sm:w-auto text-xl font-medium tracking-tight bg-transparent outline-none border-b border-dashed ${
                    isDarkMode ? "text-zinc-100 border-zinc-500" : "text-stone-900 border-stone-400"
                  }`}
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => setIsEditingChapter(true)}
                  className="group max-w-[calc(100vw-8rem)] truncate text-xl font-medium tracking-tight cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1.5 sm:max-w-none"
                  title="Click to edit chapter name"
                >
                  {chapterTitle || "Untitled Chapter"}
                  <Pencil size={14} className="shrink-0 opacity-50 sm:opacity-0 sm:group-hover:opacity-50 transition-opacity" />
                </h1>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-stone-200 text-stone-500"}`}>
                {wordCount.toLocaleString()} palabras
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-4 items-center">
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md" onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
              isDarkMode ? "hover:bg-white/10 text-zinc-400" : "hover:bg-black/5 text-stone-500"
            }`}
            aria-label="Import Markdown/Text file"
            title="Import Markdown/Text file"
          >
            {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-white/10 text-zinc-400" : "hover:bg-black/5 text-stone-500"
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <UserButton />
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:max-w-2xl md:mx-auto w-full pt-24 pb-44 sm:pt-[30vh] sm:pb-[45vh] md:pt-[40vh] md:pb-[50vh] space-y-5">
        
        {chapterDescription && (
          <div className={`p-4 rounded-xl border mb-6 text-sm backdrop-blur-md ${isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-800"}`}>
            
            {/* Stars UI for Learn Mode */}
            {projectType === "learn" && (
              <div className="flex justify-center gap-3 mb-5">
                {[1, 2, 3].map(starNum => (
                  <Star 
                    key={starNum} 
                    size={28} 
                    className={`transition-all duration-500 ${
                      starNum <= starsEarned 
                        ? "fill-yellow-400 text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                        : isDarkMode ? "text-zinc-700" : "text-stone-300"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="mb-1.5 flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Sparkles size={18} />
                Challenge
              </div>
              {(chapterDetailedDescription || projectType === "learn") && (
                <button 
                  onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                  className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors ${
                    isDarkMode ? "hover:bg-indigo-500/20" : "hover:bg-indigo-200"
                  }`}
                >
                  {isGuideExpanded ? "Show Less" : "Read More"}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isGuideExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            
            <p className="leading-relaxed opacity-90 text-base">{chapterDescription}</p>
            
            {/* Dynamic Challenge Text */}
            {isGuideExpanded && (
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-indigo-500/20" : "border-indigo-200"}`}>
                {(() => {
                  if (projectType === "learn") {
                    const lessonDef = learnLessons.find(l => l.title === chapterTitle);
                    if (lessonDef && lessonDef.challenges) {
                      const challengeIndex = Math.min(starsEarned, 2);
                      return <p className="leading-relaxed text-base font-medium">{lessonDef.challenges[challengeIndex]}</p>;
                    }
                  }
                  return <p className="leading-relaxed opacity-80">{chapterDetailedDescription}</p>;
                })()}
              </div>
            )}
            
            {projectType === "learn" && (
              <ScoreWidget
                title="Challenge"
                score={lessonScore}
                feedback={lessonFeedback}
                alternativeIdea={lessonAlternative}
                isAnalyzing={isEvaluatingLesson}
                isDarkMode={isDarkMode}
                embedded={true}
                onAnalyze={handleEvaluateLesson}
              />
            )}
            {projectType === "reel" && chapterTitle.toLowerCase().includes("hook") && (
              <ScoreWidget
                title="Hook"
                score={hookScore}
                feedback={hookFeedback}
                isAnalyzing={isEvaluatingHook}
                isDarkMode={isDarkMode}
                embedded={true}
                onAnalyze={handleEvaluateHook}
              />
            )}
          </div>
        )}

        {projectType === "learn" && isPassed && (
          <div className="flex justify-center pt-2 mb-6">
            <Link
              href={`/book/${bookId}`}
              className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg ${
                isDarkMode ? "bg-green-500 text-black shadow-green-500/20 hover:bg-green-400" : "bg-green-500 text-white shadow-green-500/30 hover:bg-green-600"
              }`}
            >
              <Check size={20} />
              Challenge Passed! Back to Lessons
            </Link>
          </div>
        )}

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
                className={`text-xl sm:text-2xl font-medium tracking-tight ${
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

        <Reorder.Group axis="y" values={blocks} onReorder={handleReorder} as="div" className="space-y-5 w-full">
          {blocks.map((block, index) => (
            <TextBlock
              key={block.id}
              block={block}
              isDarkMode={isDarkMode}
              isEditing={editingBlockId === block.id}
              isHighlighted={highlightBlockId === block.id}
              isRecordingTarget={recordingTargetBlockId === block.id}
              isFirst={index === 0}
              onStartEdit={() => startEdit(block.id)}
              onChange={(text) => handleBlockEdit(block.id, text)}
              onSave={(text, type) => handleBlockSave(block.id, text, type)}
              onEndEdit={endEdit}
              onChangeNoteType={handleChangeNoteType}
              onDelete={() => setBlockToDelete(block)}
              onInsertAbove={() => handleInsertBlock(-1)}
              onInsertBelow={() => handleInsertBlock(index)}
              onRecordClick={handleRecordClick}
            />
          ))}
        </Reorder.Group>

        <div ref={bottomAnchorRef} className="h-32 sm:h-40" aria-hidden />
      </main>

      <div className="fixed bottom-[calc(3rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto flex flex-col items-center space-y-4 w-full px-4 sm:px-6 md:max-w-2xl">
          {isRecording && (
            <div
              className={`rounded-xl border border-dashed px-4 py-5 flex gap-3 items-center shadow-lg ${
                isDarkMode
                  ? "border-red-500/30 bg-red-500/10 backdrop-blur-md"
                  : "border-red-400/40 bg-red-50/80 backdrop-blur-md"
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
                className={`text-sm font-medium ${
                  isDarkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                Escuchando…
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="w-full">
              <TranscriptionSkeleton isDarkMode={isDarkMode} />
            </div>
          )}

          <div className="flex flex-col items-center gap-4 transition-all w-full">
            {feedbackMessage ? (
              <p
                role="status"
                className={`text-sm text-center px-4 font-medium backdrop-blur-md py-1 rounded-full ${
                  isDarkMode ? "text-amber-300 bg-black/20" : "text-amber-700 bg-white/50"
                }`}
              >
                {feedbackMessage}
              </p>
            ) : !isRecording && !isProcessing && blocks.length > 0 ? (
              <p
                className={`text-xs tracking-wide font-medium backdrop-blur-md px-3 py-1 rounded-full ${
                  isDarkMode ? "text-zinc-400 bg-black/20" : "text-stone-500 bg-white/50"
                }`}
              >
                Toca el micro o presiona Espacio
              </p>
            ) : null}

            {profile && !profile.gemini_api_key && (
              <div className={`text-xs font-medium px-3 py-1 rounded-full border shadow-sm backdrop-blur-md ${
                profile.free_seconds_remaining > 0 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                {Math.floor(profile.free_seconds_remaining / 60)}:{Math.floor(profile.free_seconds_remaining % 60).toString().padStart(2, '0')} gratis restantes
              </div>
            )}

            <div className={`flex bg-black/5 dark:bg-white/5 rounded-full p-1 mb-2 ${isRecording ? 'opacity-0 pointer-events-none' : ''}`}>
              <button
                onClick={() => setInputMode('voice')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  inputMode === 'voice' 
                    ? isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                    : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Mic size={14} />
                Voice
              </button>
              <button
                onClick={() => setInputMode('write')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  inputMode === 'write' 
                    ? isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                    : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Keyboard size={14} />
                Write
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-6 relative w-full pb-4">
              {inputMode === 'voice' ? (
                <>
                  {/* Add Manual Block Button */}
                  <button
                    onClick={handleAddManualBlock}
                    disabled={isProcessing || isLoading || !chapterId || isRecording}
                    className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      isDarkMode 
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" 
                        : "bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                    title="Add empty text box"
                  >
                    <ClipboardPaste size={20} />
                  </button>

                  <button
                    type="button"
                    onPointerDown={handleMicPointerDown}
                    disabled={isProcessing || isLoading || !chapterId}
                    className={`relative flex touch-manipulation select-none items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
                      isRecording
                        ? "bg-red-500 shadow-red-500/40 ring-4 ring-red-500/20"
                        : isDarkMode
                          ? "bg-zinc-100 text-zinc-900 hover:bg-white shadow-white/10"
                          : "bg-stone-900 text-stone-50 hover:bg-black shadow-black/20"
                    }`}
                  >
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-400" />
                    )}

                    {isProcessing ? (
                      <Loader2
                        size={28}
                        className={`animate-spin ${isDarkMode ? "text-zinc-900" : "text-white"}`}
                      />
                    ) : (
                      <Mic
                        size={28}
                        className={`transition-colors duration-200 ${isRecording ? "text-white" : ""}`}
                      />
                    )}
                  </button>

                  {/* Empty placeholder to keep the big button centered */}
                  <div className="w-12 h-12 pointer-events-none" />
                </>
              ) : (
                <div className={`flex w-full items-end gap-2 p-2 rounded-2xl shadow-lg border ${
                  isDarkMode ? "bg-zinc-900/90 border-zinc-700" : "bg-white/90 border-stone-200"
                }`}>
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={manualText}
                      onChange={(e) => {
                        setManualText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleManualSubmit();
                          e.currentTarget.style.height = 'auto';
                        }
                      }}
                      placeholder="Write your paragraph..."
                      className={`w-full max-h-[120px] resize-none overflow-y-auto bg-transparent outline-none p-3 pb-1 text-base sm:text-lg ${
                        isDarkMode ? "text-white placeholder-zinc-500" : "text-stone-900 placeholder-stone-400"
                      }`}
                      rows={1}
                    />
                    <div className={`px-3 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-zinc-600" : "text-stone-400"}`}>
                      {manualText.trim().split(/\s+/).filter(Boolean).length} palabras
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleManualSubmit();
                      const textarea = document.querySelector('textarea[placeholder="Write your paragraph..."]') as HTMLTextAreaElement;
                      if (textarea) textarea.style.height = 'auto';
                    }}
                    disabled={!manualText.trim() || isProcessing || isLoading}
                    className={`flex-shrink-0 mb-1 p-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 active:scale-95 ${
                      isDarkMode ? "bg-zinc-100 text-zinc-900" : "bg-stone-900 text-white"
                    }`}
                  >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        onKeySaved={() => {
          setProfile(p => p ? { ...p, gemini_api_key: "saved" } : null);
        }} 
      />

      <ConfirmModal
        isOpen={!!blockToDelete}
        title="Delete Block"
        description="Are you sure you want to delete this text block? This action cannot be undone."
        isDarkMode={isDarkMode}
        isLoading={isDeletingBlock}
        onConfirm={handleDeleteBlock}
        onCancel={() => setBlockToDelete(null)}
      />
    </div>
  );
}
