"use client";

import { IconPin } from "@/components/icons/SweetSpotIcons";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StopInfo {
  stopId: string;
  placeName: string;
  placeEntityId?: string;
  category: string;
  scheduledTime: string;
}

interface StopReminderPromptProps {
  stop: StopInfo;
  onConfirm: (stopId: string, confirmed: boolean, alternative?: { name: string; entityId?: string }) => void;
  onDismiss: () => void;
}

export function StopReminderPrompt({ stop, onConfirm, onDismiss }: StopReminderPromptProps) {
  const [showAlternative, setShowAlternative] = useState(false);
  const [altName, setAltName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      style={{
        position: "fixed", top: "5rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 9998, width: "90%", maxWidth: "22rem",
        padding: "1.25rem", borderRadius: "1rem",
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(232,224,214,0.6)",
        boxShadow: "0 12px 40px rgba(45,42,38,0.15)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem",
        }}>
          <IconPin size={16} />
        </div>
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(45,42,38,0.9)" }}>
            Time for your next stop!
          </div>
          <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)" }}>
            {stop.scheduledTime}
          </div>
        </div>
      </div>

      {/* Stop info */}
      <div style={{
        padding: "0.65rem 0.8rem", borderRadius: "0.6rem",
        background: "rgba(184,160,210,0.08)",
        border: "1px solid rgba(184,160,210,0.15)",
        marginBottom: "0.75rem",
      }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(45,42,38,0.85)" }}>
          {stop.placeName}
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)", marginTop: "0.1rem" }}>
          {stop.category}
        </div>
      </div>

      <p style={{ fontSize: "0.78rem", color: "rgba(45,42,38,0.7)", marginBottom: "0.75rem" }}>
        Is your itinerary going as planned?
      </p>

      {!showAlternative ? (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onConfirm(stop.stopId, true);
              onDismiss();
            }}
            style={{
              flex: 1, padding: "0.55rem", borderRadius: "0.6rem", border: "none",
              background: "rgba(138,196,160,0.2)", color: "rgba(60,120,70,0.9)",
              fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            Yes, on track!
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAlternative(true)}
            style={{
              flex: 1, padding: "0.55rem", borderRadius: "0.6rem", border: "none",
              background: "rgba(232,120,138,0.1)", color: "rgba(180,60,60,0.7)",
              fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            Changed plans
          </motion.button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: "0.72rem", color: "rgba(107,100,90,0.6)", marginBottom: "0.4rem" }}>
            Where did you go instead? (optional)
          </p>
          <input
            type="text"
            value={altName}
            onChange={(e) => setAltName(e.target.value)}
            placeholder="e.g. Went to Joe's Pizza"
            style={{
              width: "100%", padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
              border: "1px solid rgba(232,224,214,0.5)", background: "rgba(245,243,240,0.5)",
              fontSize: "0.78rem", color: "rgba(45,42,38,0.9)", outline: "none",
              marginBottom: "0.5rem", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onConfirm(stop.stopId, false, altName.trim() ? { name: altName } : undefined);
                onDismiss();
              }}
              style={{
                flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: "none",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                color: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Submit
            </motion.button>
            <button
              onClick={() => {
                onConfirm(stop.stopId, false);
                onDismiss();
              }}
              style={{
                padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                border: "1px solid rgba(232,224,214,0.5)", background: "none",
                fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", cursor: "pointer",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          position: "absolute", top: "0.6rem", right: "0.6rem",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(107,100,90,0.35)", fontSize: "1rem",
        }}
      >
        x
      </button>
    </motion.div>
  );
}

// --- Hook for scheduling stop reminders ---

export function useStopReminders() {
  const [activeReminder, setActiveReminder] = useState<StopInfo | null>(null);
  const timersRef = useState<ReturnType<typeof setTimeout>[]>([])[0];

  const scheduleReminders = (stops: Array<{
    id: string;
    placeName: string;
    placeEntityId?: string;
    category: string;
    time?: string; // HH:MM format
  }>) => {
    // Clear existing timers
    timersRef.forEach(clearTimeout);
    timersRef.length = 0;

    const now = new Date();

    stops.forEach((stop) => {
      if (!stop.time) return;

      const [hours, minutes] = stop.time.split(":").map(Number);
      const stopTime = new Date(now);
      stopTime.setHours(hours, minutes, 0, 0);

      const delay = stopTime.getTime() - now.getTime();
      if (delay <= 0) return; // Already passed

      const timer = setTimeout(() => {
        setActiveReminder({
          stopId: stop.id,
          placeName: stop.placeName,
          placeEntityId: stop.placeEntityId,
          category: stop.category,
          scheduledTime: stop.time!,
        });

        // Browser notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Time for your next stop!", {
            body: `${stop.placeName} — Is your itinerary on track?`,
            icon: "/icon-192.png",
            tag: `stop-${stop.id}`,
          });
        }
      }, delay);

      timersRef.push(timer);
    });
  };

  const dismissReminder = () => setActiveReminder(null);

  const clearAllReminders = () => {
    timersRef.forEach(clearTimeout);
    timersRef.length = 0;
    setActiveReminder(null);
  };

  return { activeReminder, scheduleReminders, dismissReminder, clearAllReminders };
}
