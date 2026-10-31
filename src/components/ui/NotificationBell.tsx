"use client";

import { Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead, requestPushPermission } = useNotifications();
  const [open, setOpen] = useState(false);
  const [hasAskedPush, setHasAskedPush] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Ask for push permission on first open
  useEffect(() => {
    if (open && !hasAskedPush && "Notification" in window && Notification.permission === "default") {
      setHasAskedPush(true);
      requestPushPermission();
    }
  }, [open, hasAskedPush, requestPushPermission]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.4rem",
          color: "rgba(45,42,38,0.5)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: "0.1rem",
              right: "0.1rem",
              width: "1rem",
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
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              width: "22rem",
              maxHeight: "28rem",
              overflowY: "auto",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(232,224,214,0.6)",
              borderRadius: "1rem",
              boxShadow: "0 8px 32px rgba(45,42,38,0.12)",
              zIndex: 100,
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1rem 0.6rem",
              borderBottom: "1px solid rgba(232,224,214,0.4)",
            }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(45,42,38,0.85)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "0.7rem",
                    color: "rgba(184,160,210,0.9)",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markAsRead} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const icon = getNotificationIcon(n.type);
  const links = getProfileLinks(n);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => { if (!n.read) onRead(n.id); }}
      style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid rgba(232,224,214,0.3)",
        cursor: n.read ? "default" : "pointer",
        background: n.read ? "transparent" : "rgba(184,160,210,0.04)",
        transition: "background 0.2s",
      }}
    >
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        {/* Icon */}
        <span style={{ flexShrink: 0, marginTop: "0.1rem" }}><Icon name={icon || "bell"} size={16} /></span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <p style={{
            fontSize: "0.8rem",
            fontWeight: n.read ? 400 : 600,
            color: "rgba(45,42,38,0.85)",
            margin: 0,
            lineHeight: 1.35,
          }}>
            {n.title}
          </p>

          {/* Body */}
          {n.body && (
            <p style={{
              fontSize: "0.72rem",
              color: "rgba(107,100,90,0.6)",
              margin: "0.2rem 0 0",
              lineHeight: 1.3,
            }}>
              {n.body}
            </p>
          )}

          {/* Profile links for share notifications */}
          {links.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              {links.map((link) => (
                <Link
                  key={link.userId}
                  href={`/profile/${link.userId}`}
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  style={{
                    fontSize: "0.68rem",
                    color: "rgba(184,160,210,0.9)",
                    textDecoration: "none",
                    fontWeight: 500,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "0.4rem",
                    background: "rgba(184,160,210,0.08)",
                    border: "1px solid rgba(184,160,210,0.15)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(184,160,210,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(184,160,210,0.08)")}
                >
                  @{link.username}
                </Link>
              ))}
            </div>
          )}

          {/* Share request actions */}
          {n.type === "share_request" && !n.read && (
            <ShareRequestActions notificationId={n.id} requestData={n.data} onRead={onRead} />
          )}

          {/* Timestamp */}
          <p style={{
            fontSize: "0.62rem",
            color: "rgba(107,100,90,0.35)",
            margin: "0.35rem 0 0",
          }}>
            {formatTimeAgo(n.created_at)}
          </p>
        </div>

        {/* Unread dot */}
        {!n.read && (
          <div style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "50%",
            background: "#E8788A",
            flexShrink: 0,
            marginTop: "0.35rem",
          }} />
        )}
      </div>
    </motion.div>
  );
}

function ShareRequestActions({
  notificationId,
  requestData,
  onRead,
}: {
  notificationId: string;
  requestData: Record<string, string>;
  onRead: (id: string) => void;
}) {
  const [acted, setActed] = useState(false);

  const handleAction = async (approved: boolean) => {
    const supabase = (await import("@/lib/supabase/client")).createClient();
    if (!supabase) return;

    const requestId = requestData.request_id;
    if (!requestId) return;

    // Update the share request
    await supabase
      .from("profile_share_requests")
      .update({
        status: approved ? "approved" : "denied",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // If approved, create the share record and notify both parties
    if (approved) {
      await supabase.from("profile_shares").insert({
        profile_owner_id: requestData.profile_owner_id,
        shared_by: requestData.requester_id,
        shared_with: requestData.recipient_id,
      });

      // Notify the requester (approved)
      await supabase.from("notifications").insert({
        user_id: requestData.requester_id,
        type: "share_approved",
        title: "Share request approved",
        body: `Your request to share a profile was approved.`,
        data: requestData,
      });

      // Notify the person profile was shared with
      await supabase.from("notifications").insert({
        user_id: requestData.recipient_id,
        type: "profile_received",
        title: "A profile was shared with you",
        body: `@${requestData.requester_username} shared @${requestData.owner_username}'s profile with you`,
        data: requestData,
      });

      // Notify the profile owner that their profile was shared
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "profile_shared",
          title: "Your profile was shared",
          body: `@${requestData.requester_username} shared your profile with @${requestData.recipient_username}`,
          data: requestData,
        });
      }
    } else {
      // Notify the requester (denied)
      await supabase.from("notifications").insert({
        user_id: requestData.requester_id,
        type: "share_denied",
        title: "Share request declined",
        body: "Your request to share a profile was declined.",
        data: requestData,
      });
    }

    onRead(notificationId);
    setActed(true);
  };

  if (acted) {
    return (
      <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)", marginTop: "0.3rem", fontStyle: "italic" }}>
        Responded
      </p>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
      <button
        onClick={(e) => { e.stopPropagation(); handleAction(true); }}
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.3rem 0.75rem",
          borderRadius: "0.4rem",
          border: "none",
          background: "rgba(138,196,160,0.2)",
          color: "rgba(60,120,70,0.9)",
          cursor: "pointer",
        }}
      >
        Approve
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleAction(false); }}
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.3rem 0.75rem",
          borderRadius: "0.4rem",
          border: "none",
          background: "rgba(220,80,80,0.08)",
          color: "rgba(180,60,60,0.7)",
          cursor: "pointer",
        }}
      >
        Decline
      </button>
    </div>
  );
}

// --- Helpers ---

function getNotificationIcon(type: string): string {
  switch (type) {
    case "share_request": return "\uD83D\uDD10"; // lock
    case "share_approved": return "\u2705";
    case "share_denied": return "\u274C";
    case "profile_shared": return "\uD83D\uDCE4"; // outbox
    case "profile_received": return "\uD83D\uDCE5"; // inbox
    case "group_invite": return "\uD83D\uDC65";
    case "new_message": return "\uD83D\uDCAC";
    case "event_reminder": return "\uD83D\uDCC5";
    case "event_wrapped": return "\u2728";
    case "recommendation": return "\uD83C\uDFAF";
    default: return "\uD83D\uDD14";
  }
}

function getProfileLinks(n: Notification): { userId: string; username: string }[] {
  const links: { userId: string; username: string }[] = [];
  const d = n.data;

  if (n.type === "share_request" && d.requester_id && d.requester_username) {
    links.push({ userId: d.requester_id, username: d.requester_username });
  }
  if (n.type === "profile_shared") {
    if (d.requester_id && d.requester_username) links.push({ userId: d.requester_id, username: d.requester_username });
    if (d.recipient_id && d.recipient_username) links.push({ userId: d.recipient_id, username: d.recipient_username });
  }
  if (n.type === "profile_received") {
    if (d.sharer_id && d.sharer_username) links.push({ userId: d.sharer_id, username: d.sharer_username });
    if (d.profile_owner_id && d.profile_owner_username) links.push({ userId: d.profile_owner_id, username: d.profile_owner_username });
  }
  if (n.type === "share_approved" || n.type === "share_denied") {
    if (d.profile_owner_id && d.owner_username) links.push({ userId: d.profile_owner_id, username: d.owner_username });
    if (d.recipient_id && d.recipient_username) links.push({ userId: d.recipient_id, username: d.recipient_username });
  }

  return links;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
