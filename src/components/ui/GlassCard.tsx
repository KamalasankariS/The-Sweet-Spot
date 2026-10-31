"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  hover?: boolean;
  glow?: "rose" | "lavender" | "sky" | "peach" | "mint" | "none";
  className?: string;
  delay?: number;
}

const glowColors = {
  rose: "hover:shadow-[0_4px_24px_rgba(232,120,138,0.12)]",
  lavender: "hover:shadow-[0_4px_24px_rgba(184,160,210,0.12)]",
  sky: "hover:shadow-[0_4px_24px_rgba(140,191,212,0.12)]",
  peach: "hover:shadow-[0_4px_24px_rgba(232,184,138,0.12)]",
  mint: "hover:shadow-[0_4px_24px_rgba(138,196,160,0.12)]",
  none: "",
};

export function GlassCard({
  children,
  hover = true,
  glow = "lavender",
  className = "",
  delay = 0,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={
        hover
          ? {
              y: -4,
              transition: { duration: 0.3 },
            }
          : {}
      }
      className={`
        bg-white/80 backdrop-blur-xl
        border border-border-light
        rounded-2xl shadow-[0_2px_12px_rgba(45,42,38,0.06)]
        transition-colors duration-300
        ${hover ? "hover:bg-white/95 hover:border-border-light" : ""}
        ${glowColors[glow]}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
