"use client";

import { Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ToastItem {
  id: string;
  title: string;
  body: string | null;
  type: string;
  icon: string;
  timestamp: number;
}

const ICON_MAP: Record<string, string> = {
  friend_request: "\uD83D\uDC64",
  friend_accepted: "\u2705",
  new_message: "\uD83D\uDCAC",
  group_invite: "\uD83D\uDC65",
  share_request: "\uD83D\uDD10",
  share_approved: "\u2705",
  profile_shared: "\uD83D\uDCE4",
  profile_received: "\uD83D\uDCE5",
  stop_reminder: "\uD83D\uDCCD",
  poll_created: "\uD83D\uDCCA",
  event_reminder: "\uD83D\uDCC5",
  event_wrapped: "\u2728",
  recommendation: "\uD83C\uDFAF",
};

export function GlobalNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const supabase = useRef(createClient()).current;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let userId: string | null = null;

    async function init() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;
      userId = user.id;
    }
    init();

    const channel = supabase
      .channel("global-notif-toast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as { id: string; user_id: string; type: string; title: string; body: string | null };
          // Only show toast for current user
          if (userId && n.user_id !== userId) return;

          const toast: ToastItem = {
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type,
            icon: ICON_MAP[n.type] || "\uD83D\uDD14",
            timestamp: Date.now(),
          };

          setToasts((prev) => [toast, ...prev].slice(0, 3));

          // Browser notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(n.title, {
              body: n.body || undefined,
              icon: "/icon-192.png",
              tag: n.id,
            });
          }

          // Auto dismiss after 5s
          setTimeout(() => dismissToast(n.id), 5000);
        }
      )
      // Also listen for new messages for instant DM/group chat toasts
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { id: string; sender_id: string; content: string | null; type: string; conversation_id: string };
          if (!userId || msg.sender_id === userId) return;

          // Don't show toast if user is already on the messages page looking at this conversation
          if (typeof window !== "undefined" && window.location.pathname === "/messages") return;

          // Get sender name
          const { data: profile } = await supabase!
            .from("profiles")
            .select("name, username")
            .eq("id", msg.sender_id)
            .single();

          const senderName = profile?.name || "Someone";
          let preview = msg.content || "";
          if (msg.type === "image") preview = "Sent a photo";
          if (msg.type === "poll") preview = "Created a poll";

          const toast: ToastItem = {
            id: `msg-${msg.id}`,
            title: senderName,
            body: preview.slice(0, 80),
            type: "new_message",
            icon: "\uD83D\uDCAC",
            timestamp: Date.now(),
          };

          setToasts((prev) => [toast, ...prev].slice(0, 3));

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(senderName, {
              body: preview.slice(0, 80),
              icon: "/icon-192.png",
              tag: `msg-${msg.id}`,
            });
          }

          setTimeout(() => dismissToast(toast.id), 5000);
        }
      )
      // Friend request realtime
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friendships" },
        async (payload) => {
          const f = payload.new as { id: string; requester_id: string; addressee_id: string; status: string };
          if (!userId || f.addressee_id !== userId || f.status !== "pending") return;

          const { data: profile } = await supabase!
            .from("profiles")
            .select("name")
            .eq("id", f.requester_id)
            .single();

          const toast: ToastItem = {
            id: `fr-${f.id}`,
            title: "New friend request",
            body: `${profile?.name || "Someone"} wants to be your friend`,
            type: "friend_request",
            icon: "\uD83D\uDC64",
            timestamp: Date.now(),
          };

          setToasts((prev) => [toast, ...prev].slice(0, 3));
          setTimeout(() => dismissToast(toast.id), 5000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, dismissToast]);

  return (
    <div style={{
      position: "fixed", top: "1rem", right: "1rem", zIndex: 9999,
      display: "flex", flexDirection: "column", gap: "0.5rem",
      pointerEvents: "none", maxWidth: "22rem",
    }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={() => dismissToast(t.id)}
            style={{
              pointerEvents: "auto",
              padding: "0.75rem 1rem",
              borderRadius: "0.85rem",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(232,224,214,0.6)",
              boxShadow: "0 8px 32px rgba(45,42,38,0.12)",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
            }}
          >
            <span style={{ flexShrink: 0, marginTop: "0.05rem" }}><Icon name={t.icon || "bell"} size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.8rem", fontWeight: 700,
                color: "rgba(45,42,38,0.9)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.title}
              </div>
              {t.body && (
                <div style={{
                  fontSize: "0.72rem", color: "rgba(107,100,90,0.6)",
                  marginTop: "0.1rem",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.body}
                </div>
              )}
            </div>
            <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.3)", flexShrink: 0 }}>now</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
