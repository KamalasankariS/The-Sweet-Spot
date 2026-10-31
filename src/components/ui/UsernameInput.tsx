"use client";

import { useState, useEffect, useRef } from "react";

interface UsernameInputProps {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}

export function UsernameInput({ value, onChange, style }: UsernameInputProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const clean = value.trim();
    if (!clean || clean.length < 2) {
      setStatus("idle");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        setStatus(data.available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  const borderColor =
    status === "available" ? "rgba(138,196,160,0.6)" :
    status === "taken" || status === "invalid" ? "rgba(220,80,80,0.4)" :
    "rgba(232,224,214,0.6)";

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
          placeholder="e.g. KMonkey"
          style={{
            ...style,
            borderColor,
            paddingRight: "2.5rem",
            transition: "border-color 0.2s",
          }}
        />
        {/* Status indicator */}
        <span style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.85rem",
          lineHeight: 1,
        }}>
          {status === "checking" && (
            <span style={{ color: "rgba(107,100,90,0.4)" }}>...</span>
          )}
          {status === "available" && (
            <span style={{ color: "rgba(60,120,70,0.8)" }}>{"\u2713"}</span>
          )}
          {status === "taken" && (
            <span style={{ color: "rgba(180,60,60,0.8)" }}>{"\u2717"}</span>
          )}
          {status === "invalid" && (
            <span style={{ color: "rgba(180,60,60,0.8)" }}>!</span>
          )}
        </span>
      </div>
      {/* Hint text */}
      <p style={{
        fontSize: "0.65rem",
        marginTop: "0.3rem",
        color: status === "taken" ? "rgba(180,60,60,0.7)" :
               status === "invalid" ? "rgba(180,60,60,0.7)" :
               status === "available" ? "rgba(60,120,70,0.6)" :
               "rgba(107,100,90,0.4)",
      }}>
        {status === "taken" && "Username is taken — try another"}
        {status === "invalid" && "Only letters, numbers, underscores, dots, and hyphens"}
        {status === "available" && "Username is available!"}
        {status === "idle" && "This will be displayed on the top-right and your profile"}
        {status === "checking" && "Checking availability..."}
      </p>
    </div>
  );
}
