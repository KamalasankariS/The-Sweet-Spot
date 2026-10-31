"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  // Fetch notifications
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data } = await supabase!
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && !cancelled) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
      setLoading(false);
    }

    load();

    // Realtime subscription for new notifications
    const channel = supabase.channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification(newNotif.title, {
              body: newNotif.body || undefined,
              icon: "/icon-192.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [supabase]);

  const markAsRead = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [supabase]);

  const markAllRead = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [supabase]);

  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllRead, requestPushPermission };
}
