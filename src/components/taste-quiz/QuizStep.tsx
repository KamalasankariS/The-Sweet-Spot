"use client";

import { Icon } from "@/components/icons/SweetSpotIcons";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { getCuisineFlag } from "@/lib/cuisineFlags";

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
  entityType?: string;
  searchContext?: string;
  onAddSelection: (item: string, entityId?: string, imageUrl?: string) => void;
  onRemoveSelection: (item: string) => void;
  selections: string[];
  selectionImages?: Record<string, string>;
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
  searchContext,
  onAddSelection,
  onRemoveSelection,
  selections,
  selectionImages = {},
  maxSelections = 5,
}: QuizStepProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [qlooResults, setQlooResults] = useState<QlooResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientCache = useRef<Map<string, QlooResult[]>>(new Map());

  // Live Qloo search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!inputValue.trim() || inputValue.length < 2) {
      setQlooResults([]);
      return;
    }

    const cacheKey = `${inputValue.toLowerCase().trim()}|${entityType || ""}|${searchContext || ""}`;

    const cached = clientCache.current.get(cacheKey);
    if (cached) {
      setQlooResults(cached.filter((r: QlooResult) => !selections.includes(r.name)));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const searchQuery = searchContext && inputValue.trim().length <= 4
          ? `${inputValue} ${searchContext}`
          : inputValue;
        const params = new URLSearchParams({ q: searchQuery, take: "6" });
        if (entityType) params.set("types", entityType);
        const res = await fetch(`/api/qloo/search?${params}`);
        const data = await res.json();
        const allResults = data.results || [];
        clientCache.current.set(cacheKey, allResults);
        if (clientCache.current.size > 100) {
          const oldest = clientCache.current.keys().next().value;
          if (oldest) clientCache.current.delete(oldest);
        }
        const results = allResults.filter((r: QlooResult) => !selections.includes(r.name));
        setQlooResults(results);
      } catch {
        setQlooResults([]);
      } finally {
        setSearching(false);
      }
    }, 50);

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
      if (matchingSuggestions.length > 0) {
        handleAdd(matchingSuggestions[0]);
      } else if (qlooResults.length > 0) {
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

  const isFoodSearch = searchContext?.includes("food");
  const matchingSuggestions = inputValue.length >= 1 ? filteredSuggestions.slice(0, 3) : [];
  const showQlooDropdown = inputValue.length >= 2 && (qlooResults.length > 0 || searching || matchingSuggestions.length > 0 || (isFoodSearch && inputValue.trim().length >= 2));
  const cuisineEntry: QlooResult | null = (isFoodSearch && inputValue.trim().length >= 2 && !selections.includes(inputValue.trim()))
    ? {
        name: inputValue.trim(),
        entity_id: `cuisine-${inputValue.trim().toLowerCase()}`,
        types: [],
        properties: undefined,
      }
    : null;

  const cuisineFlag = cuisineEntry ? getCuisineFlag(cuisineEntry.name) : null;

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
          <Icon name={icon} size={20} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{category}</h2>
        <p className="text-text-secondary">{prompt}</p>
      </div>

      {/* Selected items */}
      <div className="flex flex-wrap gap-2 mb-6 min-h-[40px] justify-center">
        <AnimatePresence mode="popLayout">
          {selections.map((item) => {
            const imgUrl = selectionImages[item];
            const flag = isFoodSearch ? getCuisineFlag(item) : null;
            const hasVisual = imgUrl || flag;
            return (
              <motion.button
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                onClick={() => onRemoveSelection(item)}
                className="flex items-center gap-2 rounded-full border text-sm font-medium transition-all hover:bg-accent-rose/10 cursor-pointer"
                style={{
                  borderColor: `${color}40`,
                  backgroundColor: `${color}15`,
                  color: color,
                  padding: hasVisual ? "0.25rem 0.75rem 0.25rem 0.25rem" : "0.5rem 1rem",
                }}
              >
                {flag && !imgUrl && (
                  <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{flag}</span>
                )}
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt=""
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                {item}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M4 4l6 6m0-6l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            );
          })}
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
          className="w-full px-6 py-4 rounded-2xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors text-center"
          disabled={selections.length >= maxSelections}
        />
        {selections.length < maxSelections && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {selections.length}/{maxSelections}
          </span>
        )}
        {searching && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
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
                marginTop: "0.5rem",
                background: "rgb(255, 255, 255)",
                border: "1px solid rgba(232,224,214,0.6)",
                borderRadius: "1rem",
                overflow: "hidden",
                maxHeight: "14rem",
                overflowY: "auto",
                boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
              }}
            >
              {/* Matching quick picks shown inside dropdown */}
              {inputValue.length >= 1 && filteredSuggestions.length > 0 && (
                <>
                  {filteredSuggestions.slice(0, 3).map((sug) => (
                    <button
                      key={`sug-${sug}`}
                      onClick={() => handleAdd(sug)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.6rem 1rem",
                        background: `${color}06`,
                        border: "none",
                        borderBottom: "1px solid rgba(232,224,214,0.4)",
                        color: "#2D2A26",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = `${color}12`; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = `${color}06`; }}
                    >
                      <div style={{
                        width: "2rem", height: "2rem", borderRadius: "0.5rem",
                        background: `${color}20`, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "0.85rem", flexShrink: 0,
                      }}>
                        <Icon name={icon} size={20} />
                      </div>
                      <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 500 }}>
                        {sug}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: `${color}90`, flexShrink: 0 }}>
                        Quick pick
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Cuisine type entry for food searches */}
              {cuisineEntry && !searching && (
                <button
                  onClick={() => handleAdd(cuisineEntry.name)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: `${color}08`,
                    border: "none",
                    borderBottom: `1px solid ${color}20`,
                    color: "#2D2A26",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = `${color}15`; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = `${color}08`; }}
                >
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.5rem",
                      background: `${color}25`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: cuisineFlag ? "1.4rem" : "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    {cuisineFlag || icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      {cuisineFlag && <span style={{ marginRight: "0.35rem" }}>{cuisineFlag}</span>}
                      {cuisineEntry.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: `${color}99` }}>
                      Cuisine type
                    </div>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: `${color}80`, flexShrink: 0, fontWeight: 500 }}>
                    Cuisine
                  </div>
                </button>
              )}

              {searching && qlooResults.length === 0 ? (
                <div style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "rgba(45,42,38,0.35)", fontSize: "0.8rem" }}>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "0.7rem" }}>&#9676;</span>
                  Finding matches...
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
                      borderBottom: "1px solid rgba(232,224,214,0.3)",
                      color: "#2D2A26",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.03)"; }}
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
                        <Icon name={icon} size={20} />
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.name}
                      </div>
                      {result.properties?.short_description && (
                        <div style={{ fontSize: "0.7rem", color: "rgba(45,42,38,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
          <span className="w-full text-center text-xs text-text-muted mb-2">
            Quick picks
          </span>
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <motion.button
              key={suggestion}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAdd(suggestion)}
              className="px-4 py-2 rounded-full bg-text-primary/[0.04] border border-border-light text-sm text-text-secondary hover:text-text-primary hover:border-accent-rose/30 hover:bg-accent-rose/5 transition-all cursor-pointer"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
