"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function GradientButton({
  children,
  onClick,
  size = "md",
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: GradientButtonProps) {
  const sizes = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-7 py-3.5 text-base",
    lg: "px-10 py-4.5 text-lg",
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-accent-orange via-accent-pink to-accent-purple text-white",
    outline:
      "bg-transparent border border-white/10 text-white hover:border-white/20",
    ghost: "bg-white/5 text-white hover:bg-white/10",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl font-semibold
        transition-all duration-300 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${sizes[size]} ${variants[variant]} ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-accent-orange via-accent-pink to-accent-purple opacity-0"
          whileHover={{ opacity: 1 }}
          style={{ backgroundSize: "200% 200%" }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
