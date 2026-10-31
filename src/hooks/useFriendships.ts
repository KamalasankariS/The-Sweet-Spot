"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FriendProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
  // Populated after join
  profile?: FriendProfile;
}

export function useFriendships() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;
  const myIdRef = useRef<string | null>(null);

  const loadFriendships = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    myIdRef.current = user.id;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .neq("status", "blocked");

    if (!data) { setLoading(false); return; }

    // Collect all user IDs we need profiles for
    const userIds = new Set<string>();
    data.forEach((f) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      userIds.add(otherId);
    });

    // Batch fetch profiles
    const profileMap = new Map<string, FriendProfile>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, extras")
        .in("id", [...userIds]);

      profiles?.forEach((p) => {
        profileMap.set(p.id, {
          id: p.id,
          name: p.name || "User",
          username: p.username || null,
          avatar_url: p.extras?.avatarImage || null,
        });
      });
    }

    // Categorize
    const accepted: Friendship[] = [];
    const received: Friendship[] = [];
    const sent: Friendship[] = [];

    data.forEach((f) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      const enriched = { ...f, profile: profileMap.get(otherId) };

      if (f.status === "accepted") {
        accepted.push(enriched);
      } else if (f.status === "pending") {
        if (f.addressee_id === user.id) received.push(enriched);
        else sent.push(enriched);
      }
    });

    setFriends(accepted);
    setPendingReceived(received);
    setPendingSent(sent);
    setLoading(false);
  }, [supabase]);

  // Initial load
  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;
    const channelName = `friendships-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        loadFriendships();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    if (!supabase || !myIdRef.current) return { error: "Not authenticated" };
    const myId = myIdRef.current;

    // Check if friendship already exists in either direction
    const { data: existing } = await supabase
      .from("friendships")
      .select("id, status")
      .or(`and(requester_id.eq.${myId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${myId})`)
      .limit(1);

    if (existing && existing.length > 0) {
      const f = existing[0];
      if (f.status === "accepted") return { error: "Already friends" };
      if (f.status === "pending") return { error: "Request already pending" };
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: myId,
      addressee_id: addresseeId,
      status: "pending",
    });

    if (!error) {
      // Fetch requester profile for notification
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("name, username")
        .eq("id", myId)
        .single();

      await supabase.from("notifications").insert({
        user_id: addresseeId,
        type: "friend_request",
        title: "New friend request",
        body: `${myProfile?.name || "Someone"} (@${myProfile?.username || "user"}) sent you a friend request`,
        data: { requester_id: myId, requester_username: myProfile?.username || "" },
      });
    }

    return { error: error?.message };
  }, [supabase]);

  const acceptRequest = useCallback(async (friendshipId: string, requesterId: string) => {
    if (!supabase || !myIdRef.current) return;

    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    // Notify the requester
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("name, username")
      .eq("id", myIdRef.current)
      .single();

    await supabase.from("notifications").insert({
      user_id: requesterId,
      type: "friend_accepted",
      title: "Friend request accepted!",
      body: `${myProfile?.name || "Someone"} accepted your friend request`,
      data: { accepter_id: myIdRef.current, accepter_username: myProfile?.username || "" },
    });
  }, [supabase]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    if (!supabase) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }, [supabase]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!supabase) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }, [supabase]);

  const blockUser = useCallback(async (friendshipId: string) => {
    if (!supabase) return;
    await supabase.from("friendships").update({ status: "blocked" }).eq("id", friendshipId);
  }, [supabase]);

  // Check friendship status with a specific user
  const getFriendshipStatus = useCallback(async (userId: string): Promise<{ status: string | null; friendshipId: string | null; direction: "sent" | "received" | null }> => {
    if (!supabase || !myIdRef.current) return { status: null, friendshipId: null, direction: null };
    const myId = myIdRef.current;

    const { data } = await supabase
      .from("friendships")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${myId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${myId})`)
      .limit(1);

    if (!data || data.length === 0) return { status: null, friendshipId: null, direction: null };
    const f = data[0];
    return {
      status: f.status,
      friendshipId: f.id,
      direction: f.requester_id === myId ? "sent" : "received",
    };
  }, [supabase]);

  // Search users to add as friends
  const searchUsers = useCallback(async (query: string): Promise<FriendProfile[]> => {
    if (!supabase || !query.trim() || query.length < 2) return [];

    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, extras")
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .neq("id", myIdRef.current || "")
      .limit(10);

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name || "User",
      username: p.username || null,
      avatar_url: p.extras?.avatarImage || null,
    }));
  }, [supabase]);

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    getFriendshipStatus,
    searchUsers,
    refresh: loadFriendships,
  };
}
