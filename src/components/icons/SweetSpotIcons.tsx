"use client";

import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const d = (size = 20): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

/* 1 — Location pin (replaces 📍) */
export function IconPin({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

/* 2 — Fork & knife (replaces 🍽️) */
export function IconRestaurant({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M7 2v8c0 1.1.9 2 2 2h0" />
      <path d="M7 12v10" />
      <path d="M3 2v4c0 1.66 1.34 3 3 3h2c1.66 0 3-1.34 3-3V2" />
      <path d="M17 2c0 4-1 8-1 8h4s-1-4-1-8" />
      <path d="M16 10h4" />
      <path d="M18 10v12" />
    </svg>
  );
}

/* 3 — Cocktail glass (replaces 🍸🥂) */
export function IconCocktail({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M4 3h16l-8 10-8-10z" />
      <line x1="12" y1="13" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="7" y1="6" x2="13" y2="6" />
    </svg>
  );
}

/* 4 — Film clapboard (replaces 🎭) */
export function IconTheater({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M2 8h20" />
      <path d="M6 2l-2 6" />
      <path d="M12 2l-2 6" />
      <path d="M18 2l-2 6" />
      <line x1="7" y1="13" x2="7.01" y2="13" strokeWidth="2" />
      <line x1="12" y1="13" x2="12.01" y2="13" strokeWidth="2" />
      <path d="M7 17h10" />
    </svg>
  );
}

/* 5 — Music note (replaces 🎵🎶) */
export function IconMusic({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/* 6 — Sunrise (replaces 🌅) */
export function IconSunrise({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2v3" />
      <path d="M4.22 7.22l2.12 2.12" />
      <path d="M1 14h4" />
      <path d="M19 14h4" />
      <path d="M17.66 9.34l2.12-2.12" />
      <path d="M5 18h14" />
      <path d="M17 14a5 5 0 00-10 0" />
      <path d="M3 22h18" />
    </svg>
  );
}

/* 7 — Cake (replaces 🍰🎂) */
export function IconCake({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2a2 2 0 011 3.73V8h-2V5.73A2 2 0 0112 2z" />
      <rect x="2" y="10" width="20" height="4" rx="1" />
      <path d="M2 14v6a2 2 0 002 2h16a2 2 0 002-2v-6" />
      <path d="M6 10v12" />
      <path d="M18 10v12" />
    </svg>
  );
}

/* 8 — Palette (replaces 🎨) */
export function IconPalette({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10a2 2 0 002-2v-.5c0-.83.67-1.5 1.5-1.5H17a3 3 0 003-3c0-4.97-3.58-9-8-9z" />
      <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* 9 — Spa/lotus (replaces 💆🧘) */
export function IconSpa({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 22V12" />
      <path d="M12 12C12 7 8 3 3 3c0 5 4 9 9 9z" />
      <path d="M12 12c0-5 4-9 9-9 0 5-4 9-9 9z" />
    </svg>
  );
}

/* 10 — Bowling (replaces 🎳) */
export function IconBowling({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 4a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" stroke="none" />
      <path d="M9 16.5c-1-3-2.5-6.5-2-9.5a5 5 0 0110 0c.5 3-1 6.5-2 9.5" />
      <ellipse cx="12" cy="19.5" rx="4.5" ry="2.5" />
    </svg>
  );
}

/* 11 — Microphone (replaces 🎤) */
export function IconMic({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

/* 12 — Stadium (replaces 🏟️) */
export function IconStadium({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <ellipse cx="12" cy="9" rx="10" ry="5" />
      <path d="M2 9v5c0 2.76 4.48 5 10 5s10-2.24 10-5V9" />
      <line x1="7" y1="10" x2="7" y2="16" />
      <line x1="12" y1="10.5" x2="12" y2="17" />
      <line x1="17" y1="10" x2="17" y2="16" />
    </svg>
  );
}

/* 13 — Taco/food (replaces 🌮) */
export function IconTaco({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M3 15c0-5.52 4.03-10 9-10s9 4.48 9 10" />
      <path d="M3 15c1.5-.5 3 1 5 2s4 1 4 1 2 0 4-1 3.5-2.5 5-2" />
      <path d="M8 10c1.5 1.5 3 2 4 2s2.5-.5 4-2" />
    </svg>
  );
}

/* 14 — Puzzle (replaces 🧩) */
export function IconPuzzle({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M19.5 9h-.5a2.5 2.5 0 010-5h.5V2h-6v.5a2.5 2.5 0 01-5 0V2H3v6.5h.5a2.5 2.5 0 010 5H3V20h5.5v-.5a2.5 2.5 0 015 0v.5H20v-6.5h-.5a2.5 2.5 0 010-5z" />
    </svg>
  );
}

/* 15 — Tree/leaf (replaces 🌳🌿) */
export function IconTree({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 22V14" />
      <path d="M12 2l-6 8h3l-3 4h3l-3 4h12l-3-4h3l-3-4h3L12 2z" />
    </svg>
  );
}

/* 16 — Laugh/smiley (replaces 😂) */
export function IconLaugh({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
    </svg>
  );
}

/* 17 — Coffee (replaces ☕) */
export function IconCoffee({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M17 8h1a4 4 0 010 8h-1" />
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

/* 18 — Book (replaces 📚) */
export function IconBook({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

/* 19 — Shopping bag (replaces 🛍️) */
export function IconShop({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

/* 20 — Disco ball (replaces 🪩) */
export function IconDisco({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <ellipse cx="12" cy="12" rx="9" ry="3" />
      <ellipse cx="12" cy="12" rx="3" ry="9" />
    </svg>
  );
}

/* 21 — Building/venue (replaces 🏛️) */
export function IconBuilding({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
      <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2" />
      <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2" />
      <line x1="9" y1="14" x2="9.01" y2="14" strokeWidth="2" />
      <line x1="15" y1="14" x2="15.01" y2="14" strokeWidth="2" />
    </svg>
  );
}

/* 22 — Target/bullseye (replaces 🎯) */
export function IconTarget({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/* 23 — Sparkle (replaces ✨) */
export function IconSparkle({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 5.2L8 14 2 9.2h7.6L12 2z" />
    </svg>
  );
}

/* 24 — Celebrate/party (replaces 🎉🎊) */
export function IconCelebrate({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M5.8 11.3L2 22l10.6-3.8" />
      <path d="M4 3l2 2" />
      <path d="M10 2l1 3" />
      <path d="M2 10l3 1" />
      <path d="M18 4l-1 2" />
      <path d="M22 8l-3 .5" />
      <path d="M20 2l-2 2" />
      <path d="M5.8 11.3C8 9 11 8 14 8c2 0 5 1 6.5 3.5" />
      <path d="M12.6 18.2c2-2.2 3.5-5 3.5-7.7" />
    </svg>
  );
}

/* 25 — Two people / friends (replaces 👋👥) */
export function IconWave({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="17" cy="9" r="3" />
      <path d="M21 21v-1.5a3 3 0 00-3-3h-1" />
    </svg>
  );
}

/* 26 — Chat bubble (replaces 💬) */
export function IconChat({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <line x1="8" y1="10" x2="8.01" y2="10" strokeWidth="2" />
      <line x1="12" y1="10" x2="12.01" y2="10" strokeWidth="2" />
      <line x1="16" y1="10" x2="16.01" y2="10" strokeWidth="2" />
    </svg>
  );
}

/* 27 — Star (replaces ⭐) */
export function IconStar({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* 28 — Heart (replaces ❤️💝) */
export function IconHeart({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

/* 29 — Fire/flame (replaces 🔥) */
export function IconFire({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 2c0 0-5 4-5 10a5 5 0 0010 0c0-3-2-5-2-5s-1 2-3 2c0 0 2-3 0-7z" />
    </svg>
  );
}

/* 30 — Crystal ball (replaces 🔮) */
export function IconCrystal({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="12" cy="10" r="8" />
      <path d="M8 19h8" />
      <path d="M9 22h6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <path d="M9.5 7c1.5-1.5 3.5-1.5 5 0" />
    </svg>
  );
}

/* 31 — Map (replaces 🗺️) */
export function IconMap({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

/* 32 — Lightbulb (replaces 💡) */
export function IconLightbulb({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A7 7 0 1011.5 16c.76-.76 1.23-1.52 1.41-2.5" />
    </svg>
  );
}

/* 33 — Check circle (replaces ✅) */
export function IconCheck({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* 34 — Lock (replaces 🔒) */
export function IconLock({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

/* 35 — Sun (replaces ☀️) */
export function IconSun({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* 36 — Airplane (replaces ✈️) */
export function IconPlane({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M2 14l9-3 3-9 3 9 9 3-9 3-3 9-3-9-9-3z" />
    </svg>
  );
}

/* 37 — Pencil/edit (replaces ✏️) */
export function IconEdit({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

/* 38 — Crown (replaces 👑) */
export function IconCrown({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M2 20h20" />
      <path d="M2 17l3-12 5 6 2-9 2 9 5-6 3 12H2z" />
    </svg>
  );
}

/* 39 — Magic wand (replaces 💫) */
export function IconMagic({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8L19 13" />
      <path d="M15 9l-9 9" />
      <path d="M11 6.2L9.8 5" />
      <path d="M17.8 6.2L19 5" />
      <path d="M11 11.8L9.8 13" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* 40 — Camera (replaces 📷📸) */
export function IconPhoto({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/* 41 — Trophy (replaces 🏆) */
export function IconTrophy({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M6 4H4a2 2 0 00-2 2v1a4 4 0 004 4" />
      <path d="M18 4h2a2 2 0 012 2v1a4 4 0 01-4 4" />
      <path d="M6 4h12v7a6 6 0 01-12 0V4z" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

/* 42 — Bar chart (replaces 📊) */
export function IconChart({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* 43 — Bell (replaces 🔔) */
export function IconBell({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

/* 44 — Back arrow (for back buttons) */
export function IconBack({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* 45 — Fashion/hanger (for brands & style) */
export function IconFashion({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M12 3a3 3 0 00-3 3c0 1.1.6 2 1.5 2.5L3 15v2h18v-2l-7.5-6.5c.9-.5 1.5-1.4 1.5-2.5a3 3 0 00-3-3z" />
      <path d="M3 17h18v2H3z" />
    </svg>
  );
}

/* 46 — Moon (crescent) */
export function IconMoon({ size, className, style }: IconProps) {
  return (
    <svg {...d(size)} className={className} style={style}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

/* Universal icon mapper — renders an icon by string name */
const ICON_MAP: Record<string, React.FC<IconProps>> = {
  pin: IconPin,
  restaurant: IconRestaurant,
  cocktail: IconCocktail,
  theater: IconTheater,
  music: IconMusic,
  sunrise: IconSunrise,
  cake: IconCake,
  palette: IconPalette,
  spa: IconSpa,
  bowling: IconBowling,
  mic: IconMic,
  stadium: IconStadium,
  taco: IconTaco,
  puzzle: IconPuzzle,
  tree: IconTree,
  laugh: IconLaugh,
  coffee: IconCoffee,
  book: IconBook,
  shop: IconShop,
  disco: IconDisco,
  building: IconBuilding,
  target: IconTarget,
  sparkle: IconSparkle,
  celebrate: IconCelebrate,
  wave: IconWave,
  chat: IconChat,
  star: IconStar,
  heart: IconHeart,
  fire: IconFire,
  crystal: IconCrystal,
  map: IconMap,
  lightbulb: IconLightbulb,
  check: IconCheck,
  lock: IconLock,
  sun: IconSun,
  plane: IconPlane,
  edit: IconEdit,
  crown: IconCrown,
  magic: IconMagic,
  photo: IconPhoto,
  trophy: IconTrophy,
  chart: IconChart,
  bell: IconBell,
  back: IconBack,
  fashion: IconFashion,
  moon: IconMoon,
  friends: IconWave,
};

export function Icon({ name, size, className, style }: IconProps & { name: string }) {
  const Component = ICON_MAP[name];
  if (!Component) return null;
  return <Component size={size} className={className} style={style} />;
}
