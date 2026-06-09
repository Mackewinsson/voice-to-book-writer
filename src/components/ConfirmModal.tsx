"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  isDarkMode: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  isDarkMode,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onCancel}
          className={`absolute inset-0 backdrop-blur-sm ${
            isDarkMode ? "bg-black/40" : "bg-black/20"
          }`}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
            isDarkMode 
              ? "bg-[#0c0c0e] border-zinc-800 shadow-black/50" 
              : "bg-white border-stone-200 shadow-stone-900/10"
          }`}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300" : "hover:bg-stone-100 text-stone-400 hover:text-stone-600"
            }`}
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className={`p-3 rounded-2xl mb-4 ${
              isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"
            }`}>
              <AlertTriangle size={24} />
            </div>
            
            <h3 className={`text-xl font-semibold tracking-tight mb-2 ${
              isDarkMode ? "text-zinc-100" : "text-stone-900"
            }`}>
              {title}
            </h3>
            
            <p className={`text-sm mb-8 ${
              isDarkMode ? "text-zinc-400" : "text-stone-500"
            }`}>
              {description}
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-full font-medium transition-colors border ${
                  isDarkMode 
                    ? "bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300 disabled:opacity-50" 
                    : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700 disabled:opacity-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-medium transition-colors shadow-sm ${
                  isDarkMode 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 disabled:opacity-50" 
                    : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 disabled:opacity-50"
                }`}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
