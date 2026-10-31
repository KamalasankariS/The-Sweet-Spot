"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// --- Types ---

export interface ChatParticipant {
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  last_read_at: string;
  muted: boolean;
}

export interface Conversation {
  id: string;
  type: "dm" | "group" | "event";
  name: string | null;
  group_id: string | null;
  event_id: string | null;
  created_at: string;
  // Computed
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  displayName: string;
  displayAvatar: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  type: "text" | "image" | "video" | "system" | "recommendation" | "itinerary" | "poll";
  metadata: Record<string, unknown>;
  reply_to: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  // Populated
  sender?: {
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
  replyMessage?: ChatMessage | null;
}

// --- Hook ---

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;
  const myIdRef = useRef<string | null>(null);

  // Load all conversations for current user
  const loadConversations = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    myIdRef.current = user.id;

    // Get conversations I'm part of
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at, muted")
      .eq("user_id", user.id);

    if (!myParticipations || myParticipations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = myParticipations.map((p) => p.conversation_id);
    const myDataMap = new Map(myParticipations.map((p) => [p.conversation_id, p]));

    // Fetch conversations
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds);

    if (!convs) { setLoading(false); return; }

    // Fetch all participants for these conversations
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, last_read_at, muted")
      .in("conversation_id", convIds);

    // Collect user IDs for profile lookup
    const userIds = new Set<string>();
    allParticipants?.forEach((p) => userIds.add(p.user_id));

    const profileMap = new Map<string, { name: string; username: string | null; avatar_url: string | null }>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, extras")
        .in("id", [...userIds]);

      profiles?.forEach((p) => {
        profileMap.set(p.id, {
          name: p.name || "User",
          username: p.username || null,
          avatar_url: p.extras?.avatarImage || null,
        });
      });
    }

    // Fetch last message per conversation
    const lastMsgPromises = convIds.map(async (cid) => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", cid)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      return { cid, msg: data?.[0] || null };
    });
    const lastMsgs = await Promise.all(lastMsgPromises);
    const lastMsgMap = new Map(lastMsgs.map((m) => [m.cid, m.msg]));

    // Build conversation objects
    const built: Conversation[] = convs.map((c) => {
      const myData = myDataMap.get(c.id);
      const participants: ChatParticipant[] = (allParticipants || [])
        .filter((p) => p.conversation_id === c.id)
        .map((p) => {
          const prof = profileMap.get(p.user_id);
          return {
            user_id: p.user_id,
            name: prof?.name || "User",
            username: prof?.username || null,
            avatar_url: prof?.avatar_url || null,
            last_read_at: p.last_read_at,
            muted: p.muted,
          };
        });

      const lastMsg = lastMsgMap.get(c.id);
      const lastMsgSender = lastMsg ? profileMap.get(lastMsg.sender_id) : null;

      // Unread count
      const lastRead = myData?.last_read_at ? new Date(myData.last_read_at) : new Date(0);
      let unreadCount = 0;
      if (lastMsg && new Date(lastMsg.created_at) > lastRead && lastMsg.sender_id !== user.id) {
        unreadCount = 1; // Simplified — could count exact unread
      }

      // Display name for DMs (self-DM shows as "Note to Self")
      const others = participants.filter((p) => p.user_id !== user.id);
      const isSelfDM = c.type === "dm" && others.length === 0;
      const displayName = isSelfDM
        ? "Note to Self"
        : c.type === "dm"
          ? others[0]?.name || "Chat"
          : c.name || `Group (${participants.length})`;
      const displayAvatar = c.type === "dm" && !isSelfDM ? others[0]?.avatar_url || null : null;

      return {
        ...c,
        participants,
        lastMessage: lastMsg ? {
          ...lastMsg,
          sender: lastMsgSender ? {
            name: lastMsgSender.name,
            username: lastMsgSender.username,
            avatar_url: lastMsgSender.avatar_url,
          } : undefined,
        } : null,
        unreadCount,
        displayName,
        displayAvatar,
      };
    });

    // Sort by last message time (most recent first)
    built.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(built);
    setLoading(false);
  }, [supabase]);

  // Initial load
  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime: new messages trigger conversation list refresh
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("chat-list-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadConversations]);

  // --- Message operations ---

  const getMessages = useCallback(async (conversationId: string, page = 0, limit = 50): Promise<ChatMessage[]> => {
    if (!supabase) return [];

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (!data) return [];

    // Get sender profiles
    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const profileMap = new Map<string, { name: string; username: string | null; avatar_url: string | null }>();
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, extras")
        .in("id", senderIds);
      profiles?.forEach((p) => {
        profileMap.set(p.id, {
          name: p.name || "User",
          username: p.username || null,
          avatar_url: p.extras?.avatarImage || null,
        });
      });
    }

    // Get reply-to messages
    const replyIds = data.filter((m) => m.reply_to).map((m) => m.reply_to!);
    const replyMap = new Map<string, ChatMessage>();
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from("messages")
        .select("*")
        .in("id", replyIds);
      replies?.forEach((r) => replyMap.set(r.id, r));
    }

    return data.map((m) => ({
      ...m,
      sender: profileMap.get(m.sender_id),
      replyMessage: m.reply_to ? replyMap.get(m.reply_to) || null : null,
    })).reverse(); // Chronological order
  }, [supabase]);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    type: ChatMessage["type"] = "text",
    metadata: Record<string, unknown> = {},
    replyTo?: string
  ) => {
    if (!supabase || !myIdRef.current) return null;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: myIdRef.current,
        content,
        type,
        metadata,
        reply_to: replyTo || null,
      })
      .select()
      .single();

    if (error) return null;

    // Update our last_read_at
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", myIdRef.current);

    return data;
  }, [supabase]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!supabase) return;
    await supabase
      .from("messages")
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq("id", messageId);
  }, [supabase]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!supabase) return;
    await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);
  }, [supabase]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!supabase || !myIdRef.current) return;
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", myIdRef.current);
  }, [supabase]);

  // Create or get existing DM
  const openDM = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("get_or_create_dm", { other_user_id: otherUserId });
    if (error || !data) return null;
    await loadConversations();
    return data as string;
  }, [supabase, loadConversations]);

  // Open a DM with yourself (Note to Self)
  const openSelfDM = useCallback(async (): Promise<string | null> => {
    if (!supabase || !myIdRef.current) {
      console.error("[openSelfDM] not ready:", { supabase: !!supabase, myId: myIdRef.current });
      return null;
    }
    const myId = myIdRef.current;

    // First try the standard RPC (works if DB supports self-DMs)
    try {
      const { data, error } = await supabase.rpc("get_or_create_dm", { other_user_id: myId });
      if (!error && data) {
        await loadConversations();
        return data as string;
      }
      console.log("[openSelfDM] RPC didn't work, using fallback:", error?.message);
    } catch (e) {
      console.log("[openSelfDM] RPC exception, using fallback:", e);
    }

    // Fallback: check if self-DM already exists
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", myId);

    if (myConvs && myConvs.length > 0) {
      for (const mc of myConvs) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("id, type")
          .eq("id", mc.conversation_id)
          .eq("type", "dm")
          .single();
        if (!conv) continue;
        const { count } = await supabase
          .from("conversation_participants")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id);
        if (count === 1) {
          await loadConversations();
          return conv.id;
        }
      }
    }

    // Create new self-DM conversation
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert({ type: "dm", name: "Note to Self" })
      .select()
      .single();

    if (convErr || !conv) {
      console.error("[openSelfDM] Failed to create conversation:", convErr?.message);
      return null;
    }

    const { error: partErr } = await supabase
      .from("conversation_participants")
      .insert({ conversation_id: conv.id, user_id: myId });

    if (partErr) {
      console.error("[openSelfDM] Failed to add participant:", partErr.message);
    }

    await loadConversations();
    return conv.id;
  }, [supabase, loadConversations]);

  // Create group chat
  const createGroupChat = useCallback(async (name: string, memberIds: string[]): Promise<string | null> => {
    if (!supabase || !myIdRef.current) return null;

    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ type: "group", name })
      .select()
      .single();

    if (error || !conv) return null;

    // Add all members including self
    const allMembers = [...new Set([myIdRef.current, ...memberIds])];
    await supabase
      .from("conversation_participants")
      .insert(allMembers.map((uid) => ({
        conversation_id: conv.id,
        user_id: uid,
      })));

    await loadConversations();
    return conv.id;
  }, [supabase, loadConversations]);

  // Upload image and send as message
  const sendImage = useCallback(async (conversationId: string, file: File): Promise<ChatMessage | null> => {
    if (!supabase || !myIdRef.current) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat/${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type });

    if (uploadError) return null;

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

    // Also create media record
    await supabase.from("media").insert({
      uploaded_by: myIdRef.current,
      conversation_id: conversationId,
      type: "photo",
      url: publicUrl,
      metadata: { originalName: file.name, size: file.size },
    });

    return sendMessage(conversationId, publicUrl, "image", {
      originalName: file.name,
      size: file.size,
    });
  }, [supabase, sendMessage]);

  return {
    conversations,
    loading,
    myId: myIdRef.current,
    getMessages,
    sendMessage,
    sendImage,
    editMessage,
    deleteMessage,
    markAsRead,
    openDM,
    openSelfDM,
    createGroupChat,
    refresh: loadConversations,
  };
}

// --- Realtime hook for a single conversation's messages ---

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;
  const { getMessages, markAsRead } = useChat();

  // Load messages
  useEffect(() => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      markAsRead(conversationId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Realtime subscription for this conversation
  useEffect(() => {
    if (!supabase || !conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, name, username, extras")
            .eq("id", newMsg.sender_id)
            .single();

          const enriched: ChatMessage = {
            ...newMsg,
            sender: profile ? {
              name: profile.name || "User",
              username: profile.username || null,
              avatar_url: profile.extras?.avatarImage || null,
            } : undefined,
          };

          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });

          markAsRead(conversationId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, conversationId]);

  return { messages, loading, setMessages };
}
