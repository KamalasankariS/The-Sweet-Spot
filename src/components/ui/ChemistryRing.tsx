"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface ChemistryRingProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export function ChemistryRing({
  score,
  size = 140,
  label,
  sublabel,
}: ChemistryRingProps) {
  const id = useId();
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 85) return { from: "#E8788A", to: "#B8A0D2" };
    if (s >= 65) return { from: "#8CBFD4", to: "#8AC4A0" };
    if (s >= 45) return { from: "#8AC4A0", to: "#E8B88A" };
    return { from: "#9E9689", to: "#B5AFA6" };
  };

  const getVibeLabel = (s: number) => {
    if (s >= 90) return "Soulmates";
    if (s >= 75) return "Scary compatible";
    if (s >= 60) return "Solid vibes";
    if (s >= 40) return "Room to explore";
    return "Opposites attract";
  };

  const colors = getColor(score);
  const gradientId = `ring-gradient-${id}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(45,42,38,0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Score ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold gradient-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {score}%
          </motion.span>
        </div>
      </div>

      {label && (
        <span className="text-sm font-medium text-text-primary">{label}</span>
      )}
      {sublabel ? (
        <span className="text-xs text-text-muted">{sublabel}</span>
      ) : (
        <span className="text-xs text-text-muted">{getVibeLabel(score)}</span>
      )}
    </div>
  );
}
