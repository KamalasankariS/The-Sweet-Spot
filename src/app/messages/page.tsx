"use client";

import { IconWave, IconChat } from "@/components/icons/SweetSpotIcons";
import { moderateText } from "@/lib/moderation";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import { useChat, useChatMessages, type Conversation, type ChatMessage } from "@/hooks/useChat";
import { useFriendships, type FriendProfile } from "@/hooks/useFriendships";
import { PollMessage, PollCreator } from "@/components/chat/PollMessage";

// --- Helpers ---

const PALETTE = ["#E8788A", "#B8A0D2", "#8CBFD4", "#E8B88A", "#8AC4A0"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function Avatar({ name, avatarUrl, size = 40, userId }: { name: string; avatarUrl?: string | null; size?: number; userId?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(userId || name),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.4,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

// --- New Conversation Modal ---

function NewConversationModal({
  onClose,
  onStartDM,
  onCreateGroup,
  onSelfDM,
}: {
  onClose: () => void;
  onStartDM: (userId: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
  onSelfDM: () => void;
}) {
  const { friends, searchUsers } = useFriendships();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(q);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  };

  const displayList = query.length >= 2 ? searchResults : friends.map((f) => f.profile!).filter(Boolean);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%", maxWidth: "24rem", maxHeight: "70vh",
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
          borderRadius: "1.25rem", border: "1px solid rgba(232,224,214,0.6)",
          boxShadow: "0 12px 40px rgba(45,42,38,0.15)", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1rem 1.25rem 0.75rem",
          borderBottom: "1px solid rgba(232,224,214,0.4)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(45,42,38,0.9)" }}>New Message</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "rgba(107,100,90,0.5)" }}>
            x
          </button>
        </div>

        {/* Group toggle */}
        <div style={{ padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setIsGroup(!isGroup)}
            style={{
              padding: "0.3rem 0.7rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
              background: isGroup ? "rgba(184,160,210,0.15)" : "rgba(232,224,214,0.3)",
              border: `1px solid ${isGroup ? "rgba(184,160,210,0.4)" : "rgba(232,224,214,0.5)"}`,
              color: isGroup ? "#B8A0D2" : "rgba(107,100,90,0.6)",
            }}
          >
            {isGroup ? "Group Chat" : "Direct Message"}
          </button>
          {isGroup && (
            <input
              type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              style={{
                flex: 1, padding: "0.3rem 0.6rem", borderRadius: "0.5rem", fontSize: "0.75rem",
                border: "1px solid rgba(232,224,214,0.5)", background: "rgba(245,243,240,0.5)",
                color: "rgba(45,42,38,0.9)", outline: "none",
              }}
            />
          )}
        </div>

        {/* Search */}
        <div style={{ padding: "0.5rem 1.25rem" }}>
          <input
            type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search friends..."
            autoFocus
            style={{
              width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.75rem", fontSize: "0.8rem",
              border: "1px solid rgba(232,224,214,0.6)", background: "rgba(245,243,240,0.5)",
              color: "rgba(45,42,38,0.9)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Note to Self */}
        {!isGroup && query.length < 2 && (
          <div style={{ padding: "0 0.5rem" }}>
            <button
              onClick={onSelfDM}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.6rem 0.75rem", background: "transparent",
                border: "none", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,224,214,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #8CBFD4, #8AC4A0)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>Note to Self</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)" }}>Save messages, photos & reminders</div>
              </div>
            </button>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0.5rem" }}>
          {searching && <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(107,100,90,0.4)" }}>Searching...</div>}
          {displayList.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (isGroup) {
                  toggleSelect(p.id);
                } else {
                  onStartDM(p.id);
                }
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.6rem 0.75rem", background: selectedIds.has(p.id) ? "rgba(184,160,210,0.1)" : "transparent",
                border: "none", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "rgba(232,224,214,0.3)"; }}
              onMouseLeave={(e) => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "transparent"; }}
            >
              <Avatar name={p.name} avatarUrl={p.avatar_url} size={36} userId={p.id} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>{p.name}</div>
                {p.username && <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)" }}>@{p.username}</div>}
              </div>
              {isGroup && selectedIds.has(p.id) && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#B8A0D2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          ))}
          {!searching && displayList.length === 0 && (
            <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>
              {query.length >= 2 ? "No users found" : "Add friends to start chatting"}
            </div>
          )}
        </div>

        {/* Group create button */}
        {isGroup && selectedIds.size >= 2 && (
          <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(232,224,214,0.4)" }}>
            <button
              onClick={() => onCreateGroup(groupName || `Group (${selectedIds.size})`, [...selectedIds])}
              style={{
                width: "100%", padding: "0.65rem", borderRadius: "0.75rem", border: "none",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2)", color: "white",
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              Create Group Chat ({selectedIds.size} members)
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Conversation List Item ---

function ConversationRow({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const lastMsg = conv.lastMessage;
  let preview = "";
  if (lastMsg) {
    if (lastMsg.type === "image") preview = "Sent a photo";
    else if (lastMsg.type === "system") preview = lastMsg.content || "";
    else preview = lastMsg.content || "";
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
        padding: "0.7rem 1rem", background: active ? "rgba(184,160,210,0.1)" : "transparent",
        border: "none", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(232,224,214,0.25)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Avatar
        name={conv.displayName}
        avatarUrl={conv.displayAvatar}
        size={44}
        userId={conv.id}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: "0.82rem", fontWeight: conv.unreadCount > 0 ? 700 : 500,
            color: "rgba(45,42,38,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {conv.displayName}
          </span>
          {lastMsg && (
            <span style={{ fontSize: "0.62rem", color: "rgba(107,100,90,0.4)", flexShrink: 0, marginLeft: "0.5rem" }}>
              {formatTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{
            fontSize: "0.72rem", color: conv.unreadCount > 0 ? "rgba(45,42,38,0.7)" : "rgba(107,100,90,0.45)",
            fontWeight: conv.unreadCount > 0 ? 600 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {preview || "No messages yet"}
          </span>
          {conv.unreadCount > 0 && (
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#E8788A", flexShrink: 0,
            }} />
          )}
        </div>
      </div>
    </button>
  );
}

// --- Message Bubble ---

function MessageBubble({
  msg, isMine, showAvatar, isLast, myId,
}: {
  msg: ChatMessage; isMine: boolean; showAvatar: boolean; isLast: boolean; myId: string;
}) {
  const isImage = msg.type === "image";
  const isSystem = msg.type === "system";
  const isPoll = msg.type === "poll";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", padding: "0.3rem 0" }}>
        <span style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.4)", fontStyle: "italic" }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "0.4rem",
        marginBottom: isLast ? "0.5rem" : "0.15rem",
        padding: "0 0.5rem",
      }}
    >
      {/* Avatar for received */}
      {!isMine && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && msg.sender ? (
            <Avatar name={msg.sender.name} avatarUrl={msg.sender.avatar_url} size={28} userId={msg.sender_id} />
          ) : <div style={{ width: 28 }} />}
        </div>
      )}

      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
        {/* Reply preview */}
        {msg.replyMessage && (
          <div style={{
            padding: "0.25rem 0.5rem", marginBottom: "0.15rem",
            borderRadius: "0.5rem", background: "rgba(232,224,214,0.3)",
            borderLeft: "2px solid #B8A0D2", fontSize: "0.65rem",
            color: "rgba(107,100,90,0.6)", maxWidth: "100%",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {msg.replyMessage.content?.slice(0, 60)}
          </div>
        )}

        {/* Sender name in groups */}
        {!isMine && showAvatar && msg.sender && (
          <span style={{ fontSize: "0.62rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.1rem", paddingLeft: "0.4rem" }}>
            {msg.sender.name}
          </span>
        )}

        {/* Bubble */}
        {isPoll ? (
          <PollMessage messageId={msg.id} metadata={msg.metadata || {}} isMine={isMine} myId={myId} />
        ) : isImage ? (
          <img
            src={msg.content || ""}
            alt="Shared photo"
            style={{
              maxWidth: 240, maxHeight: 320, borderRadius: "1rem",
              objectFit: "cover", cursor: "pointer",
              border: `1px solid ${isMine ? "rgba(232,120,138,0.2)" : "rgba(232,224,214,0.5)"}`,
            }}
            onClick={() => window.open(msg.content || "", "_blank")}
          />
        ) : (
          <div style={{
            padding: "0.5rem 0.8rem",
            borderRadius: isMine ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
            background: isMine
              ? "linear-gradient(135deg, #E8788A, #B8A0D2)"
              : "rgba(232,224,214,0.35)",
            color: isMine ? "white" : "rgba(45,42,38,0.9)",
            fontSize: "0.82rem",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}>
            {msg.content}
            {msg.edited_at && (
              <span style={{ fontSize: "0.55rem", opacity: 0.6, marginLeft: "0.3rem" }}>(edited)</span>
            )}
          </div>
        )}

        {/* Time */}
        {isLast && (
          <span style={{ fontSize: "0.58rem", color: "rgba(107,100,90,0.35)", marginTop: "0.15rem", padding: "0 0.4rem" }}>
            {formatMsgTime(msg.created_at)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// --- Active Chat Panel ---

function ChatPanel({
  conversation,
  myId,
  onBack,
  sendMessage,
  sendImage,
}: {
  conversation: Conversation;
  myId: string;
  onBack: () => void;
  sendMessage: (convId: string, content: string, type?: ChatMessage["type"], metadata?: Record<string, unknown>, replyTo?: string) => Promise<ChatMessage | null>;
  sendImage: (convId: string, file: File) => Promise<ChatMessage | null>;
}) {
  const { messages, loading } = useChatMessages(conversation.id);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) {
      const check = moderateText(val, "Message");
      setProfanityWarning(check.passed ? null : check.reason || "Inappropriate language detected");
    } else {
      setProfanityWarning(null);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || profanityWarning) return;
    setSending(true);
    await sendMessage(conversation.id, trimmed, "text", {}, replyTo?.id);
    setText("");
    setReplyTo(null);
    setProfanityWarning(null);
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    await sendImage(conversation.id, file);
    setSending(false);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  let lastDate = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        padding: "0.85rem 1rem",
        borderBottom: "1px solid rgba(232,224,214,0.4)",
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(12px)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer", color: "rgba(107,100,90,0.5)",
          padding: "0.25rem", display: "flex",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar name={conversation.displayName} avatarUrl={conversation.displayAvatar} size={36} userId={conversation.id} />
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(45,42,38,0.9)" }}>
            {conversation.displayName}
          </div>
          {conversation.type === "group" && (
            <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.45)" }}>
              {conversation.participants.length} members
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem",
        display: "flex", flexDirection: "column",
      }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.5rem" }}>
            <IconWave size={24} />
            <span style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>Say hello!</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const msgDate = dateSeparator(msg.created_at);
            const showDateSep = msgDate !== lastDate;
            lastDate = msgDate;

            const isMine = msg.sender_id === myId;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
            const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div style={{ textAlign: "center", padding: "0.75rem 0 0.5rem" }}>
                    <span style={{
                      fontSize: "0.65rem", color: "rgba(107,100,90,0.4)",
                      background: "rgba(232,224,214,0.3)", padding: "0.2rem 0.6rem",
                      borderRadius: "1rem",
                    }}>
                      {msgDate}
                    </span>
                  </div>
                )}
                <div
                  onDoubleClick={() => !isMine && setReplyTo(msg)}
                  style={{ cursor: "default" }}
                >
                  <MessageBubble msg={msg} isMine={isMine} showAvatar={showAvatar} isLast={isLast} myId={myId} />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Poll creator */}
      <AnimatePresence>
        {showPollCreator && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "0.75rem", borderTop: "1px solid rgba(232,224,214,0.3)", overflow: "hidden" }}
          >
            <PollCreator
              onSubmit={async (question, options) => {
                await sendMessage(conversation.id, `Poll: ${question}`, "poll", { question, options: options.map((o) => ({ text: o })) });
                setShowPollCreator(false);
              }}
              onCancel={() => setShowPollCreator(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              padding: "0.4rem 1rem",
              borderTop: "1px solid rgba(232,224,214,0.3)",
              background: "rgba(184,160,210,0.05)",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <div style={{ width: 3, height: 20, borderRadius: 2, background: "#B8A0D2" }} />
            <div style={{ flex: 1, fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Replying to <strong>{replyTo.sender?.name || "message"}</strong>: {replyTo.content?.slice(0, 50)}
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(107,100,90,0.4)", fontSize: "0.8rem" }}>
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profanity warning */}
      <AnimatePresence>
        {profanityWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              padding: "0.4rem 1rem",
              background: "rgba(200,200,200,0.25)",
              borderTop: "1px solid rgba(220,80,80,0.3)",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <span style={{ fontSize: "0.7rem", color: "#c45", fontWeight: 500 }}>
              Inappropriate word detected. Please remove it before sending.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: "0.5rem",
        padding: "0.6rem 0.75rem",
        borderTop: profanityWarning ? "none" : "1px solid rgba(232,224,214,0.4)",
        background: profanityWarning ? "rgba(200,200,200,0.2)" : "rgba(255,255,255,0.6)",
        transition: "background 0.2s",
      }}>
        {/* Photo upload */}
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(107,100,90,0.45)", padding: "0.3rem",
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {/* Poll button */}
        <button
          onClick={() => setShowPollCreator(!showPollCreator)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: showPollCreator ? "#B8A0D2" : "rgba(107,100,90,0.45)", padding: "0.3rem",
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1, padding: "0.5rem 0.75rem", borderRadius: "1.25rem",
            border: `1px solid ${profanityWarning ? "rgba(220,80,80,0.4)" : "rgba(232,224,214,0.6)"}`,
            background: profanityWarning ? "rgba(200,200,200,0.15)" : "rgba(245,243,240,0.5)",
            color: profanityWarning ? "rgba(180,60,60,0.8)" : "rgba(45,42,38,0.9)",
            fontSize: "0.82rem", outline: "none",
            resize: "none", maxHeight: "5rem", lineHeight: 1.4,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        />

        {/* Send */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!text.trim() || sending || !!profanityWarning}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: profanityWarning
              ? "rgba(200,200,200,0.4)"
              : text.trim() ? "linear-gradient(135deg, #E8788A, #B8A0D2)" : "rgba(232,224,214,0.4)",
            border: "none",
            cursor: text.trim() && !profanityWarning ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// --- Local "Note to Self" storage ---

const SELF_NOTES_KEY = "sweetspot_self_notes";

interface SelfNote {
  id: string;
  content: string;
  type: "text" | "image";
  created_at: string;
  viewOnce?: boolean;
  viewed?: boolean;
  deletedForMe?: boolean;
  starred?: boolean;
  pinned?: boolean;
}

function loadSelfNotes(): SelfNote[] {
  try {
    return JSON.parse(localStorage.getItem(SELF_NOTES_KEY) || "[]");
  } catch { return []; }
}

function saveSelfNotes(notes: SelfNote[]) {
  localStorage.setItem(SELF_NOTES_KEY, JSON.stringify(notes));
}

// --- Menu button helper ---

function MenuBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  const c = color || "rgba(45,42,38,0.7)";
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "0.55rem 0.9rem", background: "none", border: "none",
        cursor: "pointer", fontSize: "0.76rem", color: c, textAlign: "left",
        display: "flex", alignItems: "center", gap: "0.55rem", fontWeight: 500,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = color ? "rgba(220,80,80,0.06)" : "rgba(232,224,214,0.2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </button>
  );
}

// --- Self Chat Panel (localStorage-based) ---

function SelfChatPanel({ onBack }: { onBack: () => void }) {
  const [notes, setNotes] = useState<SelfNote[]>(loadSelfNotes);
  const [text, setText] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [profanityWarning, setProfanityWarning] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "me" | "everyone" } | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [viewOnceToggle, setViewOnceToggle] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) {
      const check = moderateText(val, "Message");
      setProfanityWarning(check.passed ? null : "Inappropriate word detected. Please remove it before sending.");
    } else {
      setProfanityWarning(null);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || profanityWarning) return;
    const note: SelfNote = { id: crypto.randomUUID(), content: trimmed, type: "text", created_at: new Date().toISOString() };
    const updated = [...notes, note];
    setNotes(updated);
    saveSelfNotes(updated);
    setText("");
    setProfanityWarning(null);
    textareaRef.current?.focus();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendImage = () => {
    if (!pendingImage) return;
    const note: SelfNote = {
      id: crypto.randomUUID(), content: pendingImage, type: "image",
      created_at: new Date().toISOString(),
      ...(viewOnceToggle ? { viewOnce: true, viewed: false } : {}),
    };
    const updated = [...notes, note];
    setNotes(updated);
    saveSelfNotes(updated);
    setPendingImage(null);
    setViewOnceToggle(false);
  };

  const handleViewOnceOpen = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.viewOnce) return;
    setViewingImage(note.content);
    // Mark as viewed after opening
    const updated = notes.map((n) => n.id === noteId ? { ...n, viewed: true } : n);
    setNotes(updated);
    saveSelfNotes(updated);
  };

  const closeMenu = () => setActionMenu(null);

  const handleCopy = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note?.content) navigator.clipboard.writeText(note.content);
    closeMenu();
  };

  const handleStar = (id: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, starred: !n.starred } : n);
    setNotes(updated);
    saveSelfNotes(updated);
    closeMenu();
  };

  const handlePin = (id: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotes(updated);
    saveSelfNotes(updated);
    closeMenu();
  };

  const handleDeleteForMe = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, content: "", type: "text" as const, deletedForMe: true, pinned: false, starred: false } : n
    );
    setNotes(updated);
    saveSelfNotes(updated);
    setDeleteConfirm(null);
    closeMenu();
  };

  const handleDeleteForEveryone = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveSelfNotes(updated);
    setDeleteConfirm(null);
    closeMenu();
  };

  const handleSaveImage = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note || note.type !== "image" || !note.content) return;
    const a = document.createElement("a");
    a.href = note.content;
    a.download = `sweetspot-${note.id.slice(0, 8)}.png`;
    a.click();
    closeMenu();
  };

  const handleSelectToggle = (id: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const updated = notes.filter((n) => !selectedNotes.has(n.id));
    setNotes(updated);
    saveSelfNotes(updated);
    setSelectedNotes(new Set());
    setSelectMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  let lastDate = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        padding: "0.85rem 1rem",
        borderBottom: "1px solid rgba(232,224,214,0.4)",
        background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer", color: "rgba(107,100,90,0.5)",
          padding: "0.25rem", display: "flex",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #8CBFD4, #8AC4A0)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(45,42,38,0.9)" }}>Note to Self</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.45)" }}>Messages, photos & reminders</div>
        </div>
      </div>

      {/* Pinned messages bar */}
      {notes.some((n) => n.pinned && !n.deletedForMe) && (
        <div style={{
          padding: "0.4rem 1rem", borderBottom: "1px solid rgba(232,224,214,0.3)",
          background: "rgba(255,248,220,0.5)", display: "flex", alignItems: "center", gap: "0.4rem",
          overflow: "hidden",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,50,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 17v5M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
          </svg>
          <span style={{ fontSize: "0.7rem", color: "rgba(140,130,60,0.8)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {notes.find((n) => n.pinned && !n.deletedForMe)?.type === "image"
              ? "Pinned photo"
              : notes.find((n) => n.pinned && !n.deletedForMe)?.content?.slice(0, 50)}
          </span>
        </div>
      )}

      {/* Select mode toolbar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              padding: "0.5rem 1rem", borderBottom: "1px solid rgba(232,224,214,0.4)",
              background: "rgba(184,160,210,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "rgba(45,42,38,0.7)", fontWeight: 600 }}>
              {selectedNotes.size} selected
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {selectedNotes.size > 0 && (
                <button onClick={handleBulkDelete} style={{
                  padding: "0.3rem 0.75rem", borderRadius: "0.5rem", border: "none",
                  background: "rgba(220,80,80,0.1)", color: "#c44", fontSize: "0.72rem",
                  fontWeight: 600, cursor: "pointer",
                }}>
                  Delete ({selectedNotes.size})
                </button>
              )}
              <button onClick={() => { setSelectMode(false); setSelectedNotes(new Set()); }} style={{
                padding: "0.3rem 0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(232,224,214,0.5)",
                background: "white", color: "rgba(45,42,38,0.6)", fontSize: "0.72rem",
                fontWeight: 500, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column" }}>
        {notes.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(140,191,212,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>Save notes, photos & reminders here</span>
          </div>
        ) : (
          notes.map((note, i) => {
            const msgDate = dateSeparator(note.created_at);
            const showDateSep = msgDate !== lastDate;
            lastDate = msgDate;
            const isImage = note.type === "image";
            const isDeleted = !!note.deletedForMe;
            const isViewOnceViewed = !!(note.viewOnce && note.viewed);
            const showActions = !isDeleted;

            return (
              <div key={note.id}>
                {showDateSep && (
                  <div style={{ textAlign: "center", padding: "0.75rem 0 0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.4)", background: "rgba(232,224,214,0.3)", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>
                      {msgDate}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="note-row"
                  onClick={() => { if (selectMode && !isDeleted) handleSelectToggle(note.id); }}
                  style={{
                    display: "flex", flexDirection: "row-reverse", alignItems: "flex-start", gap: "0.4rem",
                    marginBottom: "0.15rem", padding: "0.15rem 0.5rem",
                    position: "relative",
                    cursor: selectMode ? "pointer" : "default",
                    background: selectedNotes.has(note.id) ? "rgba(184,160,210,0.08)" : "transparent",
                    borderRadius: "0.5rem",
                  }}
                >
                  {/* Select checkbox */}
                  {selectMode && !isDeleted && (
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: "0.3rem",
                      border: `2px solid ${selectedNotes.has(note.id) ? "#B8A0D2" : "rgba(107,100,90,0.3)"}`,
                      background: selectedNotes.has(note.id) ? "#B8A0D2" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {selectedNotes.has(note.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  )}

                  {/* Message content + arrow wrapper */}
                  <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: "flex-end", position: "relative" }}>
                    {/* Hover arrow dropdown trigger */}
                    {showActions && !selectMode && (
                      <button
                        className="msg-action-arrow"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActionMenu({ id: note.id, x: rect.left, y: rect.bottom + 4 });
                        }}
                        style={{
                          position: "absolute", top: 0, left: -28, zIndex: 10,
                          width: 24, height: 24, borderRadius: "50%",
                          background: "rgba(255,255,255,0.9)", border: "1px solid rgba(232,224,214,0.5)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                          cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    )}

                    {/* Star indicator */}
                    {note.starred && !isDeleted && (
                      <div style={{ position: "absolute", top: -4, right: -4, zIndex: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#e8b84a" stroke="#e8b84a" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                    )}

                    {/* Bubble content */}
                    {isDeleted ? (
                      <div style={{
                        padding: "0.5rem 0.8rem", borderRadius: "1rem 1rem 0.25rem 1rem",
                        background: "rgba(232,224,214,0.25)", border: "1px solid rgba(232,224,214,0.4)",
                        display: "flex", alignItems: "center", gap: "0.35rem",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        <span style={{ fontSize: "0.78rem", color: "rgba(107,100,90,0.4)", fontStyle: "italic" }}>
                          You deleted this message
                        </span>
                      </div>
                    ) : isImage ? (
                      isViewOnceViewed ? (
                        <div style={{
                          width: 200, padding: "1.5rem 1rem", borderRadius: "1rem",
                          background: "rgba(232,224,214,0.35)", border: "1px solid rgba(232,224,214,0.5)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                            <line x1="1" y1="1" x2="23" y2="23" stroke="rgba(107,100,90,0.35)" strokeWidth="1.5" />
                          </svg>
                          <span style={{ fontSize: "0.72rem", color: "rgba(107,100,90,0.45)", fontStyle: "italic" }}>View-once photo opened</span>
                        </div>
                      ) : note.viewOnce ? (
                        <div
                          onClick={(e) => { if (!selectMode) { e.stopPropagation(); handleViewOnceOpen(note.id); } }}
                          style={{
                            width: 200, height: 200, borderRadius: "1rem", overflow: "hidden",
                            position: "relative", cursor: selectMode ? "default" : "pointer",
                            border: "1px solid rgba(232,120,138,0.2)",
                          }}
                        >
                          <img src={note.content} alt="" style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            filter: "blur(20px)", transform: "scale(1.1)",
                          }} />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.3)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                          }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            </svg>
                            <span style={{ fontSize: "0.72rem", color: "white", fontWeight: 600 }}>View once</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={note.content} alt="Photo"
                          onClick={(e) => { if (!selectMode) { e.stopPropagation(); setViewingImage(note.content); } }}
                          style={{
                            maxWidth: 240, maxHeight: 320, borderRadius: "1rem", objectFit: "cover",
                            border: "1px solid rgba(232,120,138,0.2)", cursor: selectMode ? "default" : "pointer",
                          }}
                        />
                      )
                    ) : (
                      <div style={{
                        padding: "0.5rem 0.8rem", borderRadius: "1rem 1rem 0.25rem 1rem",
                        background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                        color: "white", fontSize: "0.82rem", lineHeight: 1.4, wordBreak: "break-word",
                      }}>
                        {note.content}
                      </div>
                    )}
                    {(i === notes.length - 1 || notes[i + 1]?.created_at.slice(0, 16) !== note.created_at.slice(0, 16)) && (
                      <span style={{ fontSize: "0.58rem", color: "rgba(107,100,90,0.35)", marginTop: "0.15rem", padding: "0 0.4rem" }}>
                        {formatMsgTime(note.created_at)}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* CSS for hover arrow visibility */}
      <style>{`
        .note-row:hover .msg-action-arrow { display: flex !important; }
      `}</style>

      {/* Image preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              padding: "0.75rem 1rem", borderTop: "1px solid rgba(232,224,214,0.4)",
              background: "rgba(245,243,240,0.8)", display: "flex", alignItems: "flex-end", gap: "0.75rem",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={pendingImage} alt="Preview" style={{
                maxWidth: 160, maxHeight: 160, borderRadius: "0.75rem", objectFit: "cover",
                border: "1px solid rgba(232,224,214,0.6)",
              }} />
              <button
                onClick={() => setPendingImage(null)}
                style={{
                  position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(45,42,38,0.7)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {/* View-once toggle */}
              <button
                onClick={() => setViewOnceToggle(!viewOnceToggle)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.35rem 0.65rem", borderRadius: "1rem",
                  border: `1px solid ${viewOnceToggle ? "rgba(140,191,212,0.5)" : "rgba(232,224,214,0.5)"}`,
                  background: viewOnceToggle ? "rgba(140,191,212,0.12)" : "rgba(245,243,240,0.5)",
                  cursor: "pointer", fontSize: "0.7rem", fontWeight: 500,
                  color: viewOnceToggle ? "#5a9ab5" : "rgba(107,100,90,0.5)",
                  transition: "all 0.2s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                </svg>
                {viewOnceToggle ? "View once ON" : "View once"}
              </button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendImage}
                style={{
                  padding: "0.5rem 1.2rem", borderRadius: "0.75rem", border: "none",
                  background: "linear-gradient(135deg, #E8788A, #B8A0D2)", color: "white",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Send Photo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profanity warning */}
      <AnimatePresence>
        {profanityWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "0.4rem 1rem", background: "rgba(200,200,200,0.25)", borderTop: "1px solid rgba(220,80,80,0.3)", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <span style={{ fontSize: "0.7rem", color: "#c45", fontWeight: 500 }}>{profanityWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: "0.5rem", padding: "0.6rem 0.75rem",
        borderTop: profanityWarning ? "none" : "1px solid rgba(232,224,214,0.4)",
        background: profanityWarning ? "rgba(200,200,200,0.2)" : "rgba(255,255,255,0.6)",
        transition: "background 0.2s",
      }}>
        <button onClick={() => fileRef.current?.click()} style={{
          background: "none", border: "none", cursor: "pointer", color: "rgba(107,100,90,0.45)", padding: "0.3rem", display: "flex", alignItems: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        <textarea
          ref={textareaRef} value={text} onChange={(e) => handleTextChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Write a note..." rows={1}
          style={{
            flex: 1, padding: "0.5rem 0.75rem", borderRadius: "1.25rem",
            border: `1px solid ${profanityWarning ? "rgba(220,80,80,0.4)" : "rgba(232,224,214,0.6)"}`,
            background: profanityWarning ? "rgba(200,200,200,0.15)" : "rgba(245,243,240,0.5)",
            color: profanityWarning ? "rgba(180,60,60,0.8)" : "rgba(45,42,38,0.9)",
            fontSize: "0.82rem", outline: "none", resize: "none", maxHeight: "5rem", lineHeight: 1.4, fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        />

        <motion.button whileTap={{ scale: 0.92 }} onClick={handleSend} disabled={!text.trim() || !!profanityWarning}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: profanityWarning ? "rgba(200,200,200,0.4)" : text.trim() ? "linear-gradient(135deg, #E8788A, #B8A0D2)" : "rgba(232,224,214,0.4)",
            border: "none", cursor: text.trim() && !profanityWarning ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </motion.button>
      </div>

      {/* Image lightbox */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => {
              // If this was a view-once image, wipe the image data from storage
              const viewOnceNote = notes.find((n) => n.viewOnce && n.content === viewingImage);
              if (viewOnceNote) {
                const updated = notes.map((n) =>
                  n.id === viewOnceNote.id ? { ...n, content: "", viewed: true } : n
                );
                setNotes(updated);
                saveSelfNotes(updated);
              }
              setViewingImage(null);
            }}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <motion.img
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={viewingImage} alt="Full view"
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "0.75rem", objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
            {/* View-once indicator */}
            {notes.some((n) => n.viewOnce && n.content === viewingImage) && (
              <div style={{
                position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
                padding: "0.4rem 1rem", borderRadius: "1rem",
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                </svg>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  View once — will disappear when you close
                </span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const viewOnceNote = notes.find((n) => n.viewOnce && n.content === viewingImage);
                if (viewOnceNote) {
                  const updated = notes.map((n) =>
                    n.id === viewOnceNote.id ? { ...n, content: "", viewed: true } : n
                  );
                  setNotes(updated);
                  saveSelfNotes(updated);
                }
                setViewingImage(null);
              }}
              style={{
                position: "absolute", top: "1.5rem", right: "1.5rem",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action menu dropdown (WhatsApp-style) */}
      <AnimatePresence>
        {actionMenu && (() => {
          const note = notes.find((n) => n.id === actionMenu.id);
          if (!note) return null;
          const isImage = note.type === "image" && !note.viewOnce;
          return (
            <>
              <div onClick={closeMenu} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: "fixed", left: Math.min(actionMenu.x, (typeof window !== "undefined" ? window.innerWidth - 220 : 300)),
                  top: actionMenu.y, zIndex: 260,
                  background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
                  borderRadius: "0.75rem", border: "1px solid rgba(232,224,214,0.5)",
                  boxShadow: "0 8px 32px rgba(45,42,38,0.18)", overflow: "hidden",
                  minWidth: "11rem", maxWidth: "14rem",
                }}
              >
                {/* Copy (text only) */}
                {note.type === "text" && (
                  <MenuBtn icon={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>} label="Copy" onClick={() => handleCopy(note.id)} />
                )}

                {/* Star */}
                <MenuBtn
                  icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />}
                  label={note.starred ? "Unstar" : "Star"}
                  onClick={() => handleStar(note.id)}
                />

                {/* Pin */}
                <MenuBtn
                  icon={<path d="M12 17v5M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />}
                  label={note.pinned ? "Unpin" : "Pin"}
                  onClick={() => handlePin(note.id)}
                />

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(232,224,214,0.4)", margin: "0.15rem 0" }} />

                {/* View (images only) */}
                {isImage && (
                  <MenuBtn
                    icon={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    label="View"
                    onClick={() => { setViewingImage(note.content); closeMenu(); }}
                  />
                )}

                {/* Save to Downloads (images only) */}
                {isImage && (
                  <MenuBtn
                    icon={<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />}
                    label="Save to Downloads"
                    onClick={() => handleSaveImage(note.id)}
                  />
                )}

                {isImage && <div style={{ height: 1, background: "rgba(232,224,214,0.4)", margin: "0.15rem 0" }} />}

                {/* Delete */}
                <MenuBtn
                  icon={<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />}
                  label="Delete"
                  color="#c44"
                  onClick={() => { setDeleteConfirm({ id: note.id, type: "me" }); closeMenu(); }}
                />

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(232,224,214,0.4)", margin: "0.15rem 0" }} />

                {/* Select messages */}
                <MenuBtn
                  icon={<><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></>}
                  label="Select messages"
                  onClick={() => { setSelectMode(true); handleSelectToggle(note.id); closeMenu(); }}
                />
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "90%", maxWidth: "20rem", padding: "1.25rem",
                background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
                borderRadius: "1rem", border: "1px solid rgba(232,224,214,0.5)",
                boxShadow: "0 12px 40px rgba(45,42,38,0.15)",
              }}
            >
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", margin: "0 0 0.75rem" }}>
                Delete message?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <button
                  onClick={() => handleDeleteForEveryone(deleteConfirm.id)}
                  style={{
                    width: "100%", padding: "0.6rem", borderRadius: "0.6rem", border: "none",
                    background: "rgba(220,80,80,0.08)", color: "#c44",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,80,80,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,80,80,0.08)"; }}
                >
                  Delete for everyone
                </button>
                <button
                  onClick={() => handleDeleteForMe(deleteConfirm.id)}
                  style={{
                    width: "100%", padding: "0.6rem", borderRadius: "0.6rem", border: "none",
                    background: "rgba(232,224,214,0.2)", color: "rgba(45,42,38,0.7)",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,224,214,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(232,224,214,0.2)"; }}
                >
                  Delete for me
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    width: "100%", padding: "0.6rem", borderRadius: "0.6rem",
                    border: "1px solid rgba(232,224,214,0.5)", background: "white",
                    color: "rgba(107,100,90,0.6)", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Messages Page ---

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: chatLoading, openDM, createGroupChat, sendMessage, sendImage } = useChat();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showSelfChat, setShowSelfChat] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  const filtered = searchFilter.trim()
    ? conversations.filter((c) => c.displayName.toLowerCase().includes(searchFilter.toLowerCase()))
    : conversations;

  const handleSelectConv = (id: string) => {
    setShowSelfChat(false);
    setActiveConvId(id);
    setMobileShowChat(true);
  };

  const handleStartDM = async (userId: string) => {
    const convId = await openDM(userId);
    if (convId) {
      setShowSelfChat(false);
      setActiveConvId(convId);
      setMobileShowChat(true);
    }
    setShowNewModal(false);
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    const convId = await createGroupChat(name, members);
    if (convId) {
      setShowSelfChat(false);
      setActiveConvId(convId);
      setMobileShowChat(true);
    }
    setShowNewModal(false);
  };

  const handleOpenSelfChat = () => {
    setShowNewModal(false);
    setActiveConvId(null);
    setShowSelfChat(true);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setShowSelfChat(false);
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", paddingTop: "7rem" }}>
          <div style={{
            padding: "3rem 2rem", textAlign: "center",
            background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)",
            borderRadius: "1.25rem", border: "1px solid rgba(232,224,214,0.6)",
          }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "rgba(45,42,38,0.85)" }}>Sign in to view messages</p>
            <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", marginTop: "0.5rem" }}>
              Chat with friends, share photos, plan events together.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Get last self-note for preview
  const selfNotes = loadSelfNotes();
  const lastSelfNote = selfNotes[selfNotes.length - 1];

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div style={{
        maxWidth: "960px", margin: "0 auto", padding: "7rem 1rem 1rem",
        height: "100vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          flex: 1, display: "flex", overflow: "hidden",
          borderRadius: "1.25rem",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(232,224,214,0.6)",
          boxShadow: "0 4px 24px rgba(45,42,38,0.06)",
        }}>
          {/* Left panel — Conversation list */}
          <div style={{
            width: "320px", minWidth: "280px",
            borderRight: "1px solid rgba(232,224,214,0.4)",
            display: mobileShowChat ? "none" : "flex",
            flexDirection: "column",
            ...(typeof window !== "undefined" && window.innerWidth > 768 ? { display: "flex" } : {}),
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1rem 1.1rem 0.6rem",
            }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "rgba(45,42,38,0.9)", margin: 0 }}>Messages</h2>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewModal(true)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(232,224,214,0.3)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(45,42,38,0.6)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </motion.button>
            </div>

            {/* Search */}
            <div style={{ padding: "0 0.75rem 0.5rem" }}>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.75rem",
                  border: "1px solid rgba(232,224,214,0.5)", background: "rgba(245,243,240,0.5)",
                  fontSize: "0.78rem", color: "rgba(45,42,38,0.8)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 0.4rem" }}>
              {/* Note to Self — always first */}
              <button
                onClick={handleOpenSelfChat}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.7rem 1rem", background: showSelfChat ? "rgba(140,191,212,0.12)" : "transparent",
                  border: "none", borderRadius: "0.75rem", cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!showSelfChat) e.currentTarget.style.background = "rgba(232,224,214,0.25)"; }}
                onMouseLeave={(e) => { if (!showSelfChat) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #8CBFD4, #8AC4A0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>Note to Self</span>
                    {lastSelfNote && (
                      <span style={{ fontSize: "0.62rem", color: "rgba(107,100,90,0.4)", flexShrink: 0, marginLeft: "0.5rem" }}>
                        {formatTime(lastSelfNote.created_at)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "rgba(107,100,90,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {lastSelfNote
                      ? lastSelfNote.type === "image"
                        ? lastSelfNote.viewOnce ? "View-once photo" : "Sent a photo"
                        : lastSelfNote.content.slice(0, 40)
                      : "Save messages, photos & reminders"}
                  </span>
                </div>
              </button>

              {/* Other conversations */}
              {chatLoading ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>
                  Loading...
                </div>
              ) : (
                filtered.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conv={c}
                    active={c.id === activeConvId && !showSelfChat}
                    onClick={() => handleSelectConv(c.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right panel — Active chat or Self chat */}
          <div style={{
            flex: 1, display: mobileShowChat || (!activeConv && !showSelfChat) ? "flex" : "none",
            flexDirection: "column",
            ...(typeof window !== "undefined" && window.innerWidth > 768 ? { display: "flex" } : {}),
          }}>
            {showSelfChat ? (
              <SelfChatPanel onBack={handleBack} />
            ) : activeConv ? (
              <ChatPanel
                key={activeConv.id}
                conversation={activeConv}
                myId={user.id}
                onBack={handleBack}
                sendMessage={sendMessage}
                sendImage={sendImage}
              />
            ) : (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "0.75rem",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(184,160,210,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(184,160,210,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(45,42,38,0.6)" }}>Your Messages</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.4)" }}>Select a conversation or start a new one</p>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleOpenSelfChat}
                  style={{
                    padding: "0.55rem 1.25rem", borderRadius: "0.75rem",
                    background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                    color: "white", border: "none", fontSize: "0.8rem",
                    fontWeight: 600, cursor: "pointer", marginTop: "0.5rem",
                  }}
                >
                  Send a Message
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New conversation modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewConversationModal
            onClose={() => setShowNewModal(false)}
            onStartDM={handleStartDM}
            onCreateGroup={handleCreateGroup}
            onSelfDM={handleOpenSelfChat}
          />
        )}
      </AnimatePresence>
    </>
  );
}
