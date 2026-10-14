"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  hover?: boolean;
  glow?: "orange" | "pink" | "purple" | "cyan" | "none";
  className?: string;
  delay?: number;
}

const glowColors = {
  orange: "hover:shadow-[0_0_40px_rgba(249,115,22,0.15)]",
  pink: "hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]",
  purple: "hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  cyan: "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]",
  none: "",
};

export function GlassCard({
  children,
  hover = true,
  glow = "purple",
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
        bg-white/[0.04] backdrop-blur-xl
        border border-white/[0.08]
        rounded-2xl
        transition-colors duration-300
        ${hover ? "hover:bg-white/[0.07] hover:border-white/[0.14]" : ""}
        ${glowColors[glow]}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
