"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface PollOption {
  text: string;
}

interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
}

interface PollVote {
  user_id: string;
  option_index: number;
}

export function PollMessage({
  messageId,
  metadata,
  isMine,
  myId,
}: {
  messageId: string;
  metadata: Record<string, unknown>;
  isMine: boolean;
  myId: string;
}) {
  const poll = metadata as unknown as PollData;
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const supabase = useRef(createClient()).current;

  const loadVotes = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("poll_votes")
      .select("user_id, option_index")
      .eq("message_id", messageId);

    if (data) {
      setVotes(data);
      const mine = data.find((v) => v.user_id === myId);
      if (mine) setMyVote(mine.option_index);
    }
  }, [supabase, messageId, myId]);

  useEffect(() => { loadVotes(); }, [loadVotes]);

  // Realtime vote updates
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`poll-${messageId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "poll_votes",
        filter: `message_id=eq.${messageId}`,
      }, () => { loadVotes(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, messageId, loadVotes]);

  const handleVote = async (optionIndex: number) => {
    if (!supabase || voting || myVote !== null) return;
    setVoting(true);

    await supabase.from("poll_votes").upsert({
      message_id: messageId,
      user_id: myId,
      option_index: optionIndex,
    }, { onConflict: "message_id,user_id" });

    setMyVote(optionIndex);
    setVoting(false);
    loadVotes();
  };

  const totalVotes = votes.length;
  const hasVoted = myVote !== null;

  return (
    <div style={{
      padding: "0.75rem",
      borderRadius: "1rem",
      background: isMine ? "rgba(184,160,210,0.1)" : "rgba(232,224,214,0.2)",
      border: `1px solid ${isMine ? "rgba(184,160,210,0.2)" : "rgba(232,224,214,0.4)"}`,
      maxWidth: 280,
      minWidth: 220,
    }}>
      {/* Question */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(184,160,210,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(45,42,38,0.9)" }}>
          {poll.question}
        </span>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {poll.options.map((opt, i) => {
          const optVotes = votes.filter((v) => v.option_index === i).length;
          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
          const isMyVote = myVote === i;

          return (
            <motion.button
              key={i}
              whileTap={!hasVoted ? { scale: 0.98 } : {}}
              onClick={() => handleVote(i)}
              disabled={hasVoted || voting}
              style={{
                position: "relative",
                padding: "0.5rem 0.65rem",
                borderRadius: "0.6rem",
                border: `1.5px solid ${isMyVote ? "#B8A0D2" : "rgba(232,224,214,0.5)"}`,
                background: "rgba(255,255,255,0.6)",
                cursor: hasVoted ? "default" : "pointer",
                textAlign: "left",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    position: "absolute", top: 0, left: 0, bottom: 0,
                    background: isMyVote ? "rgba(184,160,210,0.15)" : "rgba(232,224,214,0.25)",
                    borderRadius: "0.5rem",
                  }}
                />
              )}

              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: isMyVote ? 700 : 500,
                  color: "rgba(45,42,38,0.85)",
                }}>
                  {isMyVote && <span style={{ marginRight: "0.3rem" }}>✓</span>}
                  {opt.text}
                </span>
                {hasVoted && (
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(107,100,90,0.5)" }}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "0.5rem", fontSize: "0.62rem", color: "rgba(107,100,90,0.4)",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        {!hasVoted && <span>Tap to vote</span>}
      </div>
    </div>
  );
}

// --- Poll Creation UI ---

export function PollCreator({
  onSubmit,
  onCancel,
}: {
  onSubmit: (question: string, options: string[]) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    if (options.length < 8) setOptions([...options, ""]);
  };

  const updateOption = (i: number, val: string) => {
    setOptions((prev) => prev.map((o, idx) => idx === i ? val : o));
  };

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "1rem",
        borderRadius: "0.85rem",
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(232,224,214,0.5)",
        boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A0D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(45,42,38,0.85)" }}>Create Poll</span>
      </div>

      {/* Question */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        style={{
          width: "100%", padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
          border: "1px solid rgba(232,224,214,0.5)", background: "rgba(245,243,240,0.5)",
          fontSize: "0.8rem", color: "rgba(45,42,38,0.9)", outline: "none",
          marginBottom: "0.5rem", boxSizing: "border-box",
        }}
      />

      {/* Options */}
      {options.map((opt, i) => (
        <div key={i} style={{ display: "flex", gap: "0.3rem", marginBottom: "0.3rem" }}>
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            style={{
              flex: 1, padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
              border: "1px solid rgba(232,224,214,0.5)", background: "rgba(245,243,240,0.3)",
              fontSize: "0.75rem", color: "rgba(45,42,38,0.9)", outline: "none",
            }}
          />
          {options.length > 2 && (
            <button onClick={() => removeOption(i)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(180,60,60,0.5)", fontSize: "0.8rem", padding: "0 0.3rem",
            }}>x</button>
          )}
        </div>
      ))}

      {options.length < 8 && (
        <button onClick={addOption} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "0.7rem", color: "#B8A0D2", fontWeight: 600, padding: "0.2rem 0",
        }}>
          + Add option
        </button>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
        <button
          onClick={() => canSubmit && onSubmit(question, options.filter((o) => o.trim()))}
          disabled={!canSubmit}
          style={{
            flex: 1, padding: "0.45rem", borderRadius: "0.5rem", border: "none",
            background: canSubmit ? "linear-gradient(135deg, #E8788A, #B8A0D2)" : "rgba(232,224,214,0.4)",
            color: canSubmit ? "white" : "rgba(107,100,90,0.4)",
            fontSize: "0.75rem", fontWeight: 600, cursor: canSubmit ? "pointer" : "default",
          }}
        >
          Send Poll
        </button>
        <button onClick={onCancel} style={{
          padding: "0.45rem 0.75rem", borderRadius: "0.5rem",
          border: "1px solid rgba(232,224,214,0.5)", background: "none",
          fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", cursor: "pointer",
        }}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
