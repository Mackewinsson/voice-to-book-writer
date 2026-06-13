"use client";

import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

interface ScoreWidgetProps {
  score: number | null;
  feedback: string | null;
  isAnalyzing: boolean;
  isDarkMode: boolean;
  title: string;
  onAnalyze: () => void;
}

export default function ScoreWidget({
  score,
  feedback,
  isAnalyzing,
  isDarkMode,
  title,
  onAnalyze
}: ScoreWidgetProps) {

  const getColorByScore = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getGradientByScore = (s: number) => {
    if (s >= 80) return "from-emerald-400 to-emerald-600";
    if (s >= 60) return "from-amber-400 to-amber-600";
    return "from-red-400 to-red-600";
  };

  if (score === null && !isAnalyzing) {
    return (
      <div className={`p-6 rounded-2xl border transition-all ${
        isDarkMode 
          ? "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/60" 
          : "bg-white/40 border-stone-200/80 hover:bg-white/60"
      } backdrop-blur-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h3 className={`font-semibold text-lg tracking-tight ${isDarkMode ? "text-zinc-200" : "text-stone-800"}`}>
            Evaluate {title}
          </h3>
          <p className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-stone-500"}`}>
            Use AI to analyze your {title.toLowerCase()} for virality and effectiveness.
          </p>
        </div>
        <button
          onClick={onAnalyze}
          className={`flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
            isDarkMode
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-indigo-500/25"
              : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:shadow-indigo-500/30"
          } hover:scale-105 active:scale-95`}
        >
          <Sparkles size={16} />
          Analyze
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border shadow-xl backdrop-blur-xl relative overflow-hidden ${
        isDarkMode 
          ? "bg-[#0c0c0e]/80 border-zinc-800/80 shadow-black/50" 
          : "bg-white/80 border-stone-200/80 shadow-indigo-900/5"
      }`}
    >
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
        {/* Score Circle */}
        <div className="flex-shrink-0 relative flex items-center justify-center w-24 h-24">
          {isAnalyzing ? (
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          ) : (
            <>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  className={isDarkMode ? "stroke-zinc-800" : "stroke-stone-200"}
                />
                <motion.circle
                  initial={{ strokeDasharray: "0, 300" }}
                  animate={{ strokeDasharray: `${(score || 0) * 2.83}, 300` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={getColorByScore(score || 0)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br ${getGradientByScore(score || 0)}`}>
                  {score}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-semibold text-lg tracking-tight ${isDarkMode ? "text-zinc-100" : "text-stone-900"}`}>
              {title} Score
            </h3>
            {score !== null && !isAnalyzing && (
              <button
                onClick={onAnalyze}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-100 text-stone-500"
                }`}
                title="Re-analyze"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
          
          {isAnalyzing ? (
            <div className="space-y-2">
              <div className={`h-4 rounded w-3/4 animate-pulse ${isDarkMode ? "bg-zinc-800" : "bg-stone-200"}`} />
              <div className={`h-4 rounded w-1/2 animate-pulse ${isDarkMode ? "bg-zinc-800" : "bg-stone-200"}`} />
            </div>
          ) : (
            <p className={`text-sm leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-stone-600"}`}>
              {feedback}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
