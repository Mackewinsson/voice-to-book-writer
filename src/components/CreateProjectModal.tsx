"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Book, FileText, FlaskConical, Share2, X, Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelectBook: () => void;
}

export default function CreateProjectModal({
  isOpen,
  isDarkMode,
  isLoading,
  onClose,
  onSelectBook,
}: CreateProjectModalProps) {
  if (!isOpen) return null;

  const options = [
    {
      id: "book",
      title: "Book",
      description: "Write your next bestseller with structured chapters.",
      icon: Book,
      disabled: false,
    },
    {
      id: "blog",
      title: "Blog Post",
      description: "Create engaging articles for your audience.",
      icon: FileText,
      disabled: true,
    },
    {
      id: "paper",
      title: "Scientific Paper",
      description: "Format your research properly for publication.",
      icon: FlaskConical,
      disabled: true,
    },
    {
      id: "social",
      title: "Social Media",
      description: "Draft viral threads and posts effortlessly.",
      icon: Share2,
      disabled: true,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onClose}
          className={`absolute inset-0 backdrop-blur-sm ${
            isDarkMode ? "bg-black/40" : "bg-black/20"
          }`}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl border ${
            isDarkMode 
              ? "bg-[#0c0c0e] border-zinc-800 shadow-black/50" 
              : "bg-white border-stone-200 shadow-stone-900/10"
          }`}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
              isDarkMode ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300" : "hover:bg-stone-100 text-stone-400 hover:text-stone-600"
            }`}
          >
            <X size={16} />
          </button>

          <div className="mb-6">
            <h2 className={`text-2xl font-bold tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-stone-900"}`}>
              What are you writing?
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-stone-500"}`}>
              Choose a format for your new project.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((option) => (
              <button
                key={option.id}
                disabled={option.disabled || isLoading}
                onClick={() => {
                  if (option.id === "book") onSelectBook();
                }}
                className={`relative flex flex-col text-left p-5 rounded-2xl border transition-all ${
                  option.disabled
                    ? isDarkMode 
                      ? "opacity-50 cursor-not-allowed bg-zinc-900/30 border-zinc-800" 
                      : "opacity-50 cursor-not-allowed bg-stone-50 border-stone-200"
                    : isDarkMode
                      ? "bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50"
                      : "bg-white border-stone-200 hover:bg-stone-50 hover:border-amber-500/50 hover:shadow-md"
                }`}
              >
                {option.disabled && (
                  <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-stone-200 text-stone-500"
                  }`}>
                    Coming Soon
                  </span>
                )}
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  option.disabled
                    ? isDarkMode ? "bg-zinc-800 text-zinc-500" : "bg-stone-200 text-stone-400"
                    : "bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 shadow-lg shadow-amber-500/20"
                }`}>
                  {isLoading && option.id === "book" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <option.icon size={20} />
                  )}
                </div>

                <h3 className={`font-semibold text-lg tracking-tight mb-1 ${
                  isDarkMode ? "text-zinc-100" : "text-stone-900"
                }`}>
                  {option.title}
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? "text-zinc-400" : "text-stone-500"
                }`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
