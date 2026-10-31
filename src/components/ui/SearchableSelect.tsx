"use client";

import { Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  accentColor = "#E8788A",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Reset highlight when filtered list changes
  useEffect(() => { setHighlightIdx(0); }, [filtered.length, search]);

  const handleSelect = (opt: Option) => {
    onChange(opt.value, opt.label);
    setOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) {
      if (e.key === "Enter" || e.key === "ArrowDown") { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => { const next = Math.min(i + 1, filtered.length - 1); scrollToIdx(next); return next; });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => { const next = Math.max(i - 1, 0); scrollToIdx(next); return next; });
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filtered[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
  };

  const scrollToIdx = (idx: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-option]");
    items[idx]?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{
          width: "100%",
          padding: "0.65rem 0.75rem",
          borderRadius: "0.5rem",
          border: `1px solid ${open ? accentColor + "40" : "rgba(232,224,214,0.6)"}`,
          background: "rgba(255,255,255,0.6)",
          color: selected ? "rgba(45,42,38,0.9)" : "rgba(107,100,90,0.4)",
          fontSize: "0.85rem",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          transition: "border-color 0.15s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {selected ? (
          <>
            {selected.icon && <span><Icon name={selected.icon} size={16} /></span>}
            <span>{selected.label}</span>
          </>
        ) : (
          <span>{placeholder}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "rgba(107,100,90,0.3)" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              top: "calc(100% + 0.25rem)",
              left: 0,
              right: 0,
              zIndex: 40,
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(232,224,214,0.6)",
              borderRadius: "0.75rem",
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
            }}
          >
            <div style={{ padding: "0.5rem", borderBottom: "1px solid rgba(232,224,214,0.4)" }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(232,224,214,0.5)",
                  background: "rgba(45,42,38,0.02)",
                  fontSize: "0.8rem",
                  color: "#2D2A26",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div ref={listRef} style={{ maxHeight: "12rem", overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(107,100,90,0.35)", fontSize: "0.75rem" }}>
                  No results found
                </div>
              )}
              {filtered.map((opt, i) => {
                const isHighlighted = i === highlightIdx;
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    data-option
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      background: isHighlighted ? accentColor + "14" : isSelected ? accentColor + "08" : "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(232,224,214,0.2)",
                      color: "#2D2A26",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.8rem",
                      transition: "background 0.1s",
                    }}
                  >
                    {opt.icon && <span style={{ flexShrink: 0 }}><Icon name={opt.icon} size={16} /></span>}
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
                    {isSelected && (
                      <span style={{ marginLeft: "auto", color: accentColor, fontSize: "0.75rem" }}>{"\u2713"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
