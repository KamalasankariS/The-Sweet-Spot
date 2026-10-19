"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";

interface QlooResult {
  name: string;
  entity_id: string;
  types: string[];
  properties?: {
    image?: { url?: string };
    short_description?: string;
  };
}

interface QuizStepProps {
  category: string;
  icon: string;
  prompt: string;
  placeholder: string;
  color: string;
  suggestions: string[];
  entityType?: string; // Qloo entity type for live search
  onAddSelection: (item: string, entityId?: string, imageUrl?: string) => void;
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
  entityType,
  onAddSelection,
  onRemoveSelection,
  selections,
  maxSelections = 5,
}: QuizStepProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [qlooResults, setQlooResults] = useState<QlooResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live Qloo search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!inputValue.trim() || inputValue.length < 2) {
      setQlooResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: inputValue, take: "6" });
        if (entityType) params.set("types", entityType);
        const res = await fetch(`/api/qloo/search?${params}`);
        const data = await res.json();
        const query = inputValue.toLowerCase().trim();
        const results = (data.results || [])
          .filter((r: QlooResult) => !selections.includes(r.name))
          .sort((a: QlooResult, b: QlooResult) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            // Exact match first
            const aExact = aName === query ? 0 : 1;
            const bExact = bName === query ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;
            // Solo artist (shorter name, no "&", ",", "x", "feat") ranks higher
            const collab = /[&,]| x | feat/i;
            const aCollab = collab.test(a.name) ? 1 : 0;
            const bCollab = collab.test(b.name) ? 1 : 0;
            if (aCollab !== bCollab) return aCollab - bCollab;
            // Closer name length to query = better match
            return aName.length - bName.length;
          });
        setQlooResults(results);
      } catch {
        setQlooResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, entityType, selections]);

  const handleAdd = useCallback(
    (item: string, entityId?: string, imageUrl?: string) => {
      if (selections.length < maxSelections && !selections.includes(item)) {
        onAddSelection(item, entityId, imageUrl);
        setInputValue("");
        setQlooResults([]);
      }
    },
    [selections, maxSelections, onAddSelection]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // If there's a top Qloo result, use it
      if (qlooResults.length > 0) {
        handleAdd(qlooResults[0].name, qlooResults[0].entity_id, qlooResults[0].properties?.image?.url);
      } else {
        handleAdd(inputValue.trim());
      }
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !selections.includes(s) &&
      (inputValue === "" || s.toLowerCase().includes(inputValue.toLowerCase()))
  );

  const showQlooDropdown = inputValue.length >= 2 && (qlooResults.length > 0 || searching);

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

      {/* Input with Qloo autocomplete */}
      <div className="relative mb-6">
        <input
          ref={inputRef}
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
        {searching && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
            ...
          </span>
        )}

        {/* Qloo autocomplete dropdown */}
        <AnimatePresence>
          {showQlooDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                left: 0,
                right: 0,
                zIndex: 20,
                background: "rgba(15, 15, 22, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "1rem",
                overflow: "hidden",
                maxHeight: "16rem",
                overflowY: "auto",
              }}
            >
              {searching && qlooResults.length === 0 ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                  Searching Qloo...
                </div>
              ) : (
                qlooResults.map((result) => (
                  <button
                    key={result.entity_id}
                    onClick={() => handleAdd(result.name, result.entity_id, result.properties?.image?.url)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Entity image */}
                    {result.properties?.image?.url ? (
                      <img
                        src={result.properties.image.url}
                        alt=""
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "0.5rem",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "0.5rem",
                          background: `${color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.name}
                      </div>
                      {result.properties?.short_description && (
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {result.properties.short_description}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: `${color}80`, flexShrink: 0 }}>
                      Qloo
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion chips (hide when Qloo dropdown is showing) */}
      {!showQlooDropdown && showSuggestions && filteredSuggestions.length > 0 && (
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
