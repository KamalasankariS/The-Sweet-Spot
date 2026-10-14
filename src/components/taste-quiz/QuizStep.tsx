"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface QuizStepProps {
  category: string;
  icon: string;
  prompt: string;
  placeholder: string;
  color: string;
  suggestions: string[];
  onAddSelection: (item: string) => void;
  onRemoveSelection: (item: string) => void;
  selections: string[];
  maxSelections?: number;
}

export function QuizStep({
  category,
  icon,
  prompt,
  placeholder,
  color,
  suggestions,
  onAddSelection,
  onRemoveSelection,
  selections,
  maxSelections = 5,
}: QuizStepProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleAdd = useCallback(
    (item: string) => {
      if (selections.length < maxSelections && !selections.includes(item)) {
        onAddSelection(item);
        setInputValue("");
      }
    },
    [selections, maxSelections, onAddSelection]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleAdd(inputValue.trim());
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !selections.includes(s) &&
      (inputValue === "" || s.toLowerCase().includes(inputValue.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Category header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-5xl mb-4"
        >
          {icon}
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{category}</h2>
        <p className="text-white/40">{prompt}</p>
      </div>

      {/* Selected items */}
      <div className="flex flex-wrap gap-2 mb-6 min-h-[40px] justify-center">
        <AnimatePresence mode="popLayout">
          {selections.map((item) => (
            <motion.button
              key={item}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
              onClick={() => onRemoveSelection(item)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:bg-white/10 cursor-pointer"
              style={{
                borderColor: `${color}40`,
                backgroundColor: `${color}15`,
                color: color,
              }}
            >
              {item}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M4 4l6 6m0-6l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="relative mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-6 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors text-center"
          disabled={selections.length >= maxSelections}
        />
        {selections.length < maxSelections && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/20">
            {selections.length}/{maxSelections}
          </span>
        )}
      </div>

      {/* Suggestion chips */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          <span className="w-full text-center text-xs text-white/20 mb-2">
            Quick picks
          </span>
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <motion.button
              key={suggestion}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAdd(suggestion)}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white hover:border-white/15 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
