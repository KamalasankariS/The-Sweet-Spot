"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotonResult {
  name: string;
  state?: string;
  city?: string;
  county?: string;
  postcode?: string;
  countrycode?: string;
  display: string;
}

interface PhotonAutocompleteProps {
  value: string;
  onChange: (value: string, result?: PhotonResult) => void;
  placeholder?: string;
  countryCode?: string;
  accentColor?: string;
  /** Filter results to only states or only cities */
  placeType?: "state" | "city";
  /** Constrain city search to this state name */
  withinState?: string;
}

// Photon type values that correspond to states/regions
const STATE_TYPES = new Set(["state", "county"]);
// Photon type values that correspond to cities/towns
const CITY_TYPES = new Set(["city", "town", "village", "district", "locality", "borough", "suburb", "neighbourhood", "hamlet", "municipality"]);

export function PhotonAutocomplete({
  value,
  onChange,
  placeholder = "Search...",
  countryCode,
  accentColor = "#E8788A",
  placeType,
  withinState,
}: PhotonAutocompleteProps) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (value !== text && !open) setText(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Append state/country context to query for better results
        let q = query.trim();
        if (placeType === "city" && withinState) q += `, ${withinState}`;
        if (countryCode) {
          const countryNames: Record<string, string> = { us: "USA", gb: "UK", ca: "Canada", au: "Australia", in: "India" };
          const cn = countryNames[countryCode.toLowerCase()];
          if (cn) q += `, ${cn}`;
        }
        const params = new URLSearchParams({ q, limit: "10" });
        if (countryCode) params.set("lang", countryCode.toLowerCase() === "us" ? "en" : "default");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let features: any[] = data.features || [];

        // Filter by country (Photon returns uppercase codes like "US")
        if (countryCode) {
          const cc = countryCode.toUpperCase();
          features = features.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) => (f.properties?.countrycode || "").toUpperCase() === cc
          );
        }

        // Filter by place type (state vs city)
        if (placeType === "state") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features = features.filter((f: any) => {
            const t = (f.properties?.type || "").toLowerCase();
            return STATE_TYPES.has(t);
          });
        } else if (placeType === "city") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features = features.filter((f: any) => {
            const t = (f.properties?.type || "").toLowerCase();
            return CITY_TYPES.has(t);
          });
        }

        // Filter by state if specified
        if (withinState) {
          const ws = withinState.toLowerCase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features = features.filter((f: any) => {
            const s = (f.properties?.state || "").toLowerCase();
            return s === ws || s.includes(ws);
          });
        }

        // Map to our format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: PhotonResult[] = features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || "";
          const city = p.city || "";
          const state = p.state || "";
          const county = p.county || "";
          const country = p.country || "";
          const isUS = (p.countrycode || "").toLowerCase() === "us";

          // Build display string
          const parts: string[] = [];
          if (name && name !== city && name !== state) parts.push(name);
          if (city && city !== name) parts.push(city);
          if (county && county !== city && county !== name) parts.push(county);
          if (state && state !== name) parts.push(state);
          if (!isUS && country) parts.push(country);

          return {
            name: name || city || state || county,
            state,
            city,
            county,
            postcode: p.postcode,
            countrycode: p.countrycode,
            display: parts.length > 0 ? parts.join(", ") : name,
          };
        });

        // Deduplicate by display
        const seen = new Set<string>();
        const unique = mapped.filter((r) => {
          const key = r.display.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setResults(unique.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
  }, [countryCode, placeType, withinState]);

  // Reset highlight when results change
  useEffect(() => { setHighlightIdx(0); }, [results]);

  const handleInput = (v: string) => {
    setText(v);
    onChange(v);
    search(v);
    setOpen(true);
  };

  const select = (r: PhotonResult) => {
    const val = r.name || r.display;
    setText(val);
    onChange(val, r);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => {
        const next = Math.min(i + 1, results.length - 1);
        listRef.current?.querySelectorAll("[data-option]")[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => {
        const next = Math.max(i - 1, 0);
        listRef.current?.querySelectorAll("[data-option]")[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { setOpen(true); if (text.length >= 2) search(text); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.65rem 0.75rem",
          borderRadius: "0.75rem",
          border: `1px solid ${open ? accentColor + "40" : "rgba(232,224,214,0.6)"}`,
          background: "white",
          color: "rgba(45,42,38,0.9)",
          fontSize: "0.85rem",
          outline: "none",
          transition: "border-color 0.15s",
          boxSizing: "border-box" as const,
        }}
      />

      <AnimatePresence>
        {open && (results.length > 0 || searching || text.length >= 2) && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
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
              maxHeight: "14rem",
              overflowY: "auto",
              boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
            }}
          >
            {searching && results.length === 0 && (
              <div style={{ padding: "0.6rem 0.75rem", color: "rgba(107,100,90,0.35)", fontSize: "0.75rem", textAlign: "center" }}>
                Searching...
              </div>
            )}

            {results.map((r, i) => (
              <button
                key={`${r.display}-${i}`}
                data-option
                onMouseDown={(e) => { e.preventDefault(); select(r); }}
                onMouseEnter={() => setHighlightIdx(i)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  background: i === highlightIdx ? accentColor + "14" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.2)",
                  color: "#2D2A26",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.8rem",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                {r.display !== r.name && (
                  <div style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.4)", marginTop: "0.1rem" }}>
                    {r.display}
                  </div>
                )}
              </button>
            ))}

            {!searching && results.length === 0 && text.length >= 2 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  const val = text.trim();
                  onChange(val, { name: val, display: val });
                  setOpen(false);
                }}
                style={{
                  width: "100%", padding: "0.6rem 0.75rem", background: "transparent",
                  border: "none", cursor: "pointer", textAlign: "center",
                  fontSize: "0.75rem", color: "rgba(107,100,90,0.5)",
                }}
              >
                Use &quot;{text.trim()}&quot;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
