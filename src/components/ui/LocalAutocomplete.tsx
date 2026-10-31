"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AutocompleteOption {
  label: string;
  sublabel?: string;
  value: string;
}

interface LocalAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  accentColor?: string;
}

export function LocalAutocomplete({
  value,
  onChange,
  options,
  placeholder = "Search...",
  accentColor = "#E8788A",
}: LocalAutocompleteProps) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== text && !open) setText(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = text.toLowerCase().trim();
    if (!q) return options.slice(0, 12);
    const results = options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
    // Sort: prefix matches first
    results.sort((a, b) => {
      const aStart = a.label.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.label.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return a.label.localeCompare(b.label);
    });
    return results.slice(0, 12);
  }, [text, options]);

  useEffect(() => { setHighlightIdx(0); }, [filtered]);

  const select = (o: AutocompleteOption) => {
    setText(o.label);
    onChange(o.label);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(filtered[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.75rem",
          border: `1px solid ${open ? accentColor + "40" : "rgba(232,224,214,0.6)"}`,
          background: "white", color: "rgba(45,42,38,0.9)", fontSize: "0.85rem",
          outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const,
        }}
      />

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.08 }}
            style={{
              position: "absolute", top: "calc(100% + 0.25rem)", left: 0, right: 0, zIndex: 40,
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(232,224,214,0.6)", borderRadius: "0.75rem",
              overflow: "hidden", maxHeight: "14rem", overflowY: "auto",
              boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
            }}
          >
            {filtered.map((o, i) => (
              <button
                key={o.value}
                onMouseDown={(e) => { e.preventDefault(); select(o); }}
                onMouseEnter={() => setHighlightIdx(i)}
                style={{
                  width: "100%", padding: "0.5rem 0.75rem",
                  background: i === highlightIdx ? accentColor + "14" : "transparent",
                  border: "none", borderBottom: "1px solid rgba(232,224,214,0.15)",
                  color: "#2D2A26", cursor: "pointer", textAlign: "left",
                  fontSize: "0.8rem", transition: "background 0.05s",
                }}
              >
                <div style={{ fontWeight: 500 }}>{o.label}</div>
                {o.sublabel && (
                  <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.4)", marginTop: "0.05rem" }}>
                    {o.sublabel}
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
