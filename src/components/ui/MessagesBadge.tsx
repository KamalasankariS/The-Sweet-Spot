"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function MessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user || cancelled) return;

      // Get conversations I'm in
      const { data: participations } = await supabase!
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id);

      if (!participations || cancelled) return;

      let total = 0;
      for (const p of participations) {
        const { count } = await supabase!
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", user.id)
          .gt("created_at", p.last_read_at || "1970-01-01")
          .is("deleted_at", null);

        total += count || 0;
      }

      if (!cancelled) setUnreadCount(total);
    }

    load();

    // Refresh on new messages
    const channel = supabase.channel("msg-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Link
      href="/messages"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "0.4rem",
        color: "rgba(45,42,38,0.5)",
        textDecoration: "none",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: "absolute",
            top: "0.1rem",
            right: "0.1rem",
            minWidth: "1rem",
            height: "1rem",
            borderRadius: "50%",
            background: "#E8788A",
            color: "white",
            fontSize: "0.6rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: "0 0.15rem",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </Link>
  );
}
