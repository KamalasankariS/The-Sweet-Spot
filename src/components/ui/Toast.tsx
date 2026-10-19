"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            padding: "0.75rem 1.5rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
            fontSize: "0.85rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
