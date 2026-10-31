"use client";

import { motion } from "framer-motion";
import type { Transition } from "framer-motion";

interface IllustrationProps {
  size?: number;
  className?: string;
}

const easeInOut = "easeInOut" as const;
const linear = "linear" as const;

const floatTransition: Transition = { duration: 5, repeat: Infinity, ease: easeInOut };
const sparkleTransition: Transition = { duration: 2.5, repeat: Infinity, ease: easeInOut };
const slowSpin: Transition = { duration: 20, repeat: Infinity, ease: linear };

// ─── Date Night — romantic dinner scene with candles, wine, and floating hearts ───
export function DateNightIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="dn-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FBE4E4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FBE4E4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dn-candle" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#E8B88A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8788A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="95" r="85" fill="url(#dn-glow)" />

      {/* Table */}
      <ellipse cx="100" cy="145" rx="70" ry="12" fill="#F2E4D4" stroke="#E8E0D6" strokeWidth="1.5" />
      <path d="M45 145 Q42 180 55 180 L145 180 Q158 180 155 145" fill="#F2E4D4" stroke="#E8E0D6" strokeWidth="1" />

      {/* Tablecloth accent */}
      <path d="M35 145 Q60 155 100 155 Q140 155 165 145" stroke="#E8788A" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" fill="none" />

      {/* Left wine glass */}
      <g transform="translate(62, 95)">
        <ellipse cx="0" cy="0" rx="14" ry="8" fill="rgba(232,120,138,0.12)" stroke="#E8788A" strokeWidth="1.5" />
        <path d="M-10 -2 Q0 6 10 -2" fill="rgba(232,120,138,0.2)" stroke="none" />
        <line x1="0" y1="8" x2="0" y2="38" stroke="#E8788A" strokeWidth="1.5" />
        <ellipse cx="0" cy="40" rx="10" ry="3" fill="none" stroke="#E8788A" strokeWidth="1.5" />
        {/* Wine level */}
        <path d="M-9 0 Q0 5 9 0 Q0 -3 -9 0" fill="#E8788A" opacity="0.25" />
      </g>

      {/* Right wine glass */}
      <g transform="translate(138, 95)">
        <ellipse cx="0" cy="0" rx="14" ry="8" fill="rgba(184,160,210,0.12)" stroke="#B8A0D2" strokeWidth="1.5" />
        <path d="M-10 -2 Q0 6 10 -2" fill="rgba(184,160,210,0.2)" stroke="none" />
        <line x1="0" y1="8" x2="0" y2="38" stroke="#B8A0D2" strokeWidth="1.5" />
        <ellipse cx="0" cy="40" rx="10" ry="3" fill="none" stroke="#B8A0D2" strokeWidth="1.5" />
        <path d="M-9 0 Q0 5 9 0 Q0 -3 -9 0" fill="#B8A0D2" opacity="0.25" />
      </g>

      {/* Candle center */}
      <rect x="96" y="100" width="8" height="30" rx="3" fill="#FAF5F0" stroke="#E8E0D6" strokeWidth="1" />
      <line x1="100" y1="102" x2="100" y2="100" stroke="#6B645A" strokeWidth="0.8" />

      {/* Candle flame */}
      <motion.g
        animate={{ scaleY: [1, 1.25, 0.95, 1.1, 1], scaleX: [1, 0.9, 1.05, 0.95, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: easeInOut } satisfies Transition}
        style={{ transformOrigin: "100px 96px" }}
      >
        <ellipse cx="100" cy="93" rx="4" ry="7" fill="#E8B88A" opacity="0.9" />
        <ellipse cx="100" cy="94" rx="2" ry="4" fill="#FAF5F0" opacity="0.7" />
      </motion.g>
      {/* Candle glow */}
      <circle cx="100" cy="93" r="14" fill="url(#dn-candle)" opacity="0.5" />

      {/* Plate left */}
      <ellipse cx="68" cy="140" rx="18" ry="5" fill="none" stroke="#E8E0D6" strokeWidth="1.2" />
      <ellipse cx="68" cy="140" rx="12" ry="3" fill="none" stroke="#E8E0D6" strokeWidth="0.8" />

      {/* Plate right */}
      <ellipse cx="132" cy="140" rx="18" ry="5" fill="none" stroke="#E8E0D6" strokeWidth="1.2" />
      <ellipse cx="132" cy="140" rx="12" ry="3" fill="none" stroke="#E8E0D6" strokeWidth="0.8" />

      {/* Floating hearts */}
      <motion.g
        animate={{ y: [0, -8, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: easeInOut } satisfies Transition}
      >
        <path d="M88 60 C88 55 92 52 96 55 C100 52 104 55 104 60 C104 67 96 72 96 72 C96 72 88 67 88 60Z" fill="#E8788A" opacity="0.5" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: easeInOut, delay: 0.8 } satisfies Transition}
      >
        <path d="M112 50 C112 47 114 45 117 47 C120 45 122 47 122 50 C122 54 117 57 117 57 C117 57 112 54 112 50Z" fill="#B8A0D2" opacity="0.45" />
      </motion.g>
      <motion.g
        animate={{ y: [0, -6, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: easeInOut, delay: 1.5 } satisfies Transition}
      >
        <path d="M72 48 C72 46 74 44 76 46 C78 44 80 46 80 48 C80 51 76 53 76 53 C76 53 72 51 72 48Z" fill="#E8788A" opacity="0.35" />
      </motion.g>

      {/* Sparkle accents */}
      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ ...sparkleTransition, delay: 0.5 } satisfies Transition} cx="40" cy="55" r="2" fill="#E8B88A" />
      <motion.circle animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }} transition={{ ...sparkleTransition, delay: 1.2 } satisfies Transition} cx="160" cy="60" r="1.5" fill="#8CBFD4" />
      <motion.circle animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ ...sparkleTransition, delay: 0.8 } satisfies Transition} cx="155" cy="80" r="1" fill="#B8A0D2" />
    </motion.svg>
  );
}

// ─── Friends Night — cozy lounge scene with drinks and fairy lights ───
export function FriendsNightIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="fn-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E4D4F2" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E4D4F2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="85" fill="url(#fn-glow)" />

      {/* Fairy lights string */}
      <path d="M20 45 Q60 30 100 42 Q140 54 180 40" stroke="#E8E0D6" strokeWidth="1.2" fill="none" />
      {/* Bulbs */}
      {[
        { cx: 35, cy: 40, color: "#E8788A" },
        { cx: 55, cy: 35, color: "#E8B88A" },
        { cx: 78, cy: 38, color: "#B8A0D2" },
        { cx: 100, cy: 42, color: "#8CBFD4" },
        { cx: 122, cy: 46, color: "#8AC4A0" },
        { cx: 142, cy: 44, color: "#E8788A" },
        { cx: 165, cy: 40, color: "#E8B88A" },
      ].map((b, i) => (
        <motion.g key={i}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: easeInOut, delay: i * 0.3 } satisfies Transition}
          style={{ transformOrigin: `${b.cx}px ${b.cy}px` }}
        >
          <circle cx={b.cx} cy={b.cy} r="4" fill={b.color} opacity="0.7" />
          <circle cx={b.cx} cy={b.cy} r="7" fill={b.color} opacity="0.15" />
        </motion.g>
      ))}

      {/* Couch / sofa shape */}
      <path d="M30 130 Q30 110 45 110 L155 110 Q170 110 170 130 L170 155 L30 155Z" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1.5" rx="8" />
      <path d="M30 130 Q30 118 40 115 L40 155 L30 155Z" fill="#D4C4E2" stroke="#B8A0D2" strokeWidth="1" /> {/* arm left */}
      <path d="M170 130 Q170 118 160 115 L160 155 L170 155Z" fill="#D4C4E2" stroke="#B8A0D2" strokeWidth="1" /> {/* arm right */}

      {/* Cushions */}
      <ellipse cx="70" cy="128" rx="22" ry="14" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1" opacity="0.7" />
      <ellipse cx="130" cy="128" rx="22" ry="14" fill="#D4EDF2" stroke="#8CBFD4" strokeWidth="1" opacity="0.7" />

      {/* Coffee table */}
      <rect x="55" y="160" width="90" height="8" rx="4" fill="#F2E4D4" stroke="#E8E0D6" strokeWidth="1" />
      <rect x="70" y="168" width="4" height="12" rx="1" fill="#E8E0D6" />
      <rect x="126" y="168" width="4" height="12" rx="1" fill="#E8E0D6" />

      {/* Drinks on table */}
      {/* Cocktail glass */}
      <g transform="translate(80, 148)">
        <path d="M-8 0 L8 0 L0 10Z" stroke="#E8788A" strokeWidth="1.2" fill="rgba(232,120,138,0.15)" strokeLinejoin="round" />
        <line x1="0" y1="10" x2="0" y2="14" stroke="#E8788A" strokeWidth="1" />
        <line x1="-4" y1="14" x2="4" y2="14" stroke="#E8788A" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* Beer glass */}
      <g transform="translate(105, 146)">
        <rect x="-5" y="0" width="10" height="14" rx="2" fill="rgba(232,184,138,0.2)" stroke="#E8B88A" strokeWidth="1.2" />
        <path d="M5 3 Q10 3 10 7 Q10 10 5 10" stroke="#E8B88A" strokeWidth="1" fill="none" />
        <rect x="-4" y="1" width="8" height="3" rx="1" fill="#FAF5F0" opacity="0.5" /> {/* foam */}
      </g>
      {/* Popcorn bowl */}
      <g transform="translate(125, 150)">
        <path d="M-8 0 Q-10 10 -6 12 L6 12 Q10 10 8 0Z" fill="#F2E4D4" stroke="#E8E0D6" strokeWidth="1" />
        <circle cx="-2" cy="-1" r="2.5" fill="#FAF5F0" stroke="#E8E0D6" strokeWidth="0.5" />
        <circle cx="3" cy="-2" r="2" fill="#FAF5F0" stroke="#E8E0D6" strokeWidth="0.5" />
        <circle cx="0" cy="-4" r="2.5" fill="#FAF5F0" stroke="#E8E0D6" strokeWidth="0.5" />
      </g>

      {/* Moon through window */}
      <circle cx="165" cy="75" r="15" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1" opacity="0.5" />
      <circle cx="172" cy="72" r="12" fill="#FAF5F0" opacity="0.5" />

      {/* Stars */}
      <motion.circle animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ ...sparkleTransition, delay: 0 } satisfies Transition} cx="150" cy="65" r="1.5" fill="#E8B88A" />
      <motion.circle animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ ...sparkleTransition, delay: 0.6 } satisfies Transition} cx="140" cy="72" r="1" fill="#8CBFD4" />
      <motion.circle animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ ...sparkleTransition, delay: 1.2 } satisfies Transition} cx="175" cy="58" r="1" fill="#E8788A" />
    </motion.svg>
  );
}

// ─── Team Outing — city skyline with rooftop bar ───
export function TeamOutingIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <linearGradient id="to-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4EDF2" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FAF5F0" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect x="10" y="10" width="180" height="150" rx="12" fill="url(#to-sky)" />

      {/* Far buildings (back layer) */}
      <rect x="15" y="80" width="18" height="80" rx="1" fill="#E4D4F2" opacity="0.5" />
      <rect x="38" y="60" width="22" height="100" rx="1" fill="#D4EDF2" opacity="0.5" />
      <rect x="145" y="70" width="20" height="90" rx="1" fill="#E4D4F2" opacity="0.5" />
      <rect x="170" y="85" width="16" height="75" rx="1" fill="#FBE4E4" opacity="0.5" />

      {/* Main buildings */}
      <rect x="25" y="68" width="28" height="92" rx="2" fill="#D4EDF2" stroke="#8CBFD4" strokeWidth="1.2" />
      {/* Windows */}
      {[75, 85, 95, 105, 115, 125, 135].map((y) => (
        <g key={y}>
          <rect x="30" y={y} width="4" height="5" rx="0.5" fill="#8CBFD4" opacity="0.3" />
          <rect x="37" y={y} width="4" height="5" rx="0.5" fill="#8CBFD4" opacity="0.3" />
          <rect x="44" y={y} width="4" height="5" rx="0.5" fill="#8CBFD4" opacity="0.3" />
        </g>
      ))}

      {/* Tall center building */}
      <rect x="65" y="40" width="35" height="120" rx="2" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1.2" />
      <rect x="63" y="36" width="39" height="8" rx="2" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1" />
      {[48, 58, 68, 78, 88, 98, 108, 118, 128, 138].map((y) => (
        <g key={y}>
          <rect x="70" y={y} width="4" height="5" rx="0.5" fill="#B8A0D2" opacity="0.25" />
          <rect x="78" y={y} width="4" height="5" rx="0.5" fill="#B8A0D2" opacity="0.25" />
          <rect x="86" y={y} width="4" height="5" rx="0.5" fill="#B8A0D2" opacity="0.25" />
        </g>
      ))}
      {/* Antenna */}
      <line x1="82" y1="22" x2="82" y2="36" stroke="#B8A0D2" strokeWidth="1.2" />
      <motion.circle animate={{ opacity: [0.3, 1, 0.3] }} transition={{ ...sparkleTransition } satisfies Transition} cx="82" cy="20" r="2" fill="#E8788A" />

      {/* Right building */}
      <rect x="110" y="75" width="30" height="85" rx="2" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1.2" />
      {[82, 92, 102, 112, 122, 132].map((y) => (
        <g key={y}>
          <rect x="115" y={y} width="4" height="5" rx="0.5" fill="#E8788A" opacity="0.2" />
          <rect x="123" y={y} width="4" height="5" rx="0.5" fill="#E8788A" opacity="0.2" />
          <rect x="131" y={y} width="4" height="5" rx="0.5" fill="#E8788A" opacity="0.2" />
        </g>
      ))}

      {/* Rooftop bar on right building */}
      <rect x="108" y="70" width="34" height="6" rx="2" fill="#E8788A" opacity="0.15" stroke="#E8788A" strokeWidth="0.8" />
      {/* String lights on rooftop */}
      <path d="M110 70 Q118 66 125 70 Q132 66 140 70" stroke="#E8E0D6" strokeWidth="0.8" fill="none" />
      {[114, 121, 128, 135].map((x, i) => (
        <motion.circle key={x}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: easeInOut, delay: i * 0.25 } satisfies Transition}
          cx={x} cy={68} r="1.5" fill={["#E8B88A", "#E8788A", "#8CBFD4", "#B8A0D2"][i]}
        />
      ))}

      {/* Flag on center building */}
      <motion.g
        animate={{ rotate: [0, 6, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: easeInOut } satisfies Transition}
        style={{ transformOrigin: "82px 22px" }}
      >
        <path d="M82 22 L94 26 L82 30Z" fill="#E8788A" opacity="0.6" />
      </motion.g>

      {/* Ground */}
      <line x1="10" y1="160" x2="190" y2="160" stroke="#E8E0D6" strokeWidth="1.5" />

      {/* Stars / evening sky */}
      <motion.circle animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ ...sparkleTransition, delay: 0.3 } satisfies Transition} cx="160" cy="25" r="1.5" fill="#E8B88A" />
      <motion.circle animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ ...sparkleTransition, delay: 0.9 } satisfies Transition} cx="30" cy="30" r="1" fill="#8CBFD4" />
      <motion.circle animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ ...sparkleTransition, delay: 1.5 } satisfies Transition} cx="175" cy="45" r="1" fill="#B8A0D2" />
    </motion.svg>
  );
}

// ─── Solo Adventure — compass on a trail map ───
export function SoloAdventureIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="sa-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#E4F2E0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E4F2E0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="95" r="85" fill="url(#sa-glow)" />

      {/* Map background */}
      <g transform="translate(25, 55)">
        <rect x="0" y="0" width="150" height="105" rx="6" fill="#FAF5F0" stroke="#E8E0D6" strokeWidth="1.5" />
        {/* Map fold lines */}
        <line x1="50" y1="0" x2="50" y2="105" stroke="#E8E0D6" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="100" y1="0" x2="100" y2="105" stroke="#E8E0D6" strokeWidth="0.5" strokeDasharray="4 4" />

        {/* Trail / path */}
        <motion.path
          d="M15 85 Q25 70 40 75 Q55 80 65 60 Q75 40 95 50 Q110 55 120 35 Q130 20 140 25"
          stroke="#8AC4A0" strokeWidth="2.5" fill="none" strokeLinecap="round"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: linear } satisfies Transition}
        />

        {/* Landmarks on map */}
        <circle cx="15" cy="85" r="4" fill="#E8788A" opacity="0.5" />
        <text x="15" y="97" textAnchor="middle" fontSize="7" fill="#6B645A" fontWeight="500">Start</text>

        <circle cx="140" cy="25" r="4" fill="#E8788A" opacity="0.7" />
        <text x="140" y="17" textAnchor="middle" fontSize="7" fill="#6B645A" fontWeight="500">End</text>

        {/* Little trees */}
        <g transform="translate(30, 55)" opacity="0.5">
          <polygon points="0,-8 5,0 -5,0" fill="#8AC4A0" />
          <rect x="-1" y="0" width="2" height="4" fill="#E8B88A" />
        </g>
        <g transform="translate(80, 35)" opacity="0.4">
          <polygon points="0,-8 5,0 -5,0" fill="#8AC4A0" />
          <rect x="-1" y="0" width="2" height="4" fill="#E8B88A" />
        </g>
        <g transform="translate(110, 65)" opacity="0.4">
          <polygon points="0,-6 4,0 -4,0" fill="#8AC4A0" />
          <rect x="-1" y="0" width="2" height="3" fill="#E8B88A" />
        </g>

        {/* Little mountain */}
        <g transform="translate(120, 30)" opacity="0.3">
          <polygon points="0,-12 10,0 -10,0" fill="#B8A0D2" stroke="#B8A0D2" strokeWidth="0.5" />
          <polygon points="0,-12 3,-6 -3,-6" fill="#FAF5F0" opacity="0.8" /> {/* snow cap */}
        </g>
      </g>

      {/* Compass overlaid */}
      <g transform="translate(145, 40)">
        <circle cx="0" cy="0" r="22" fill="rgba(250,245,240,0.95)" stroke="#8AC4A0" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="18" fill="none" stroke="#8AC4A0" strokeWidth="0.5" strokeDasharray="3 3" />
        <text x="0" y="-11" textAnchor="middle" fontSize="7" fill="#8AC4A0" fontWeight="600">N</text>
        <text x="0" y="16" textAnchor="middle" fontSize="6" fill="#E8B88A" fontWeight="500">S</text>
        <text x="13" y="3" textAnchor="middle" fontSize="6" fill="#B8A0D2" fontWeight="500">E</text>
        <text x="-13" y="3" textAnchor="middle" fontSize="6" fill="#8CBFD4" fontWeight="500">W</text>
        <motion.g
          animate={{ rotate: [0, 12, -8, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: easeInOut } satisfies Transition}
          style={{ transformOrigin: "0px 0px" }}
        >
          <polygon points="0,-14 3,0 0,2 -3,0" fill="#E8788A" opacity="0.8" />
          <polygon points="0,14 3,0 0,-2 -3,0" fill="#8CBFD4" opacity="0.5" />
          <circle cx="0" cy="0" r="2.5" fill="white" stroke="#E8E0D6" strokeWidth="0.8" />
        </motion.g>
      </g>

      {/* Destination pin */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: easeInOut } satisfies Transition}
      >
        <g transform="translate(163, 72)">
          <path d="M0 0 C-6 -10 -10 -16 -10 -20 A10 10 0 1 1 10 -20 C10 -16 6 -10 0 0Z" fill="#E8788A" opacity="0.7" />
          <circle cx="0" cy="-20" r="4" fill="white" opacity="0.8" />
        </g>
      </motion.g>
    </motion.svg>
  );
}

// ─── Celebration — party scene with cake, balloons, and confetti ───
export function CelebrationIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="cl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2E4D4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F2E4D4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="85" fill="url(#cl-glow)" />

      {/* Banner / bunting */}
      <path d="M25 40 Q65 55 100 40 Q135 25 175 42" stroke="#E8E0D6" strokeWidth="1.2" fill="none" />
      {[
        { x: 40, color: "#E8788A" }, { x: 55, color: "#E8B88A" },
        { x: 70, color: "#8CBFD4" }, { x: 85, color: "#B8A0D2" },
        { x: 100, color: "#8AC4A0" }, { x: 115, color: "#E8788A" },
        { x: 130, color: "#E8B88A" }, { x: 145, color: "#8CBFD4" },
        { x: 160, color: "#B8A0D2" },
      ].map((f, i) => {
        const yBase = 40 + Math.sin((f.x - 25) / 150 * Math.PI) * 12 - 5;
        return (
          <polygon key={i} points={`${f.x - 5},${yBase} ${f.x + 5},${yBase} ${f.x},${yBase + 12}`} fill={f.color} opacity="0.5" />
        );
      })}

      {/* Balloons */}
      <motion.g animate={{ y: [0, -4, 0], x: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: easeInOut } satisfies Transition}>
        <ellipse cx="55" cy="75" rx="14" ry="17" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1" />
        <path d="M55 92 L55 130" stroke="#E8788A" strokeWidth="0.8" />
        <path d="M55 92 L53 95 L57 95Z" fill="#E8788A" opacity="0.5" />
      </motion.g>
      <motion.g animate={{ y: [0, -6, 0], x: [0, -2, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: easeInOut, delay: 0.5 } satisfies Transition}>
        <ellipse cx="75" cy="65" rx="12" ry="15" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1" />
        <path d="M75 80 L73 130" stroke="#B8A0D2" strokeWidth="0.8" />
        <path d="M75 80 L73 83 L77 83Z" fill="#B8A0D2" opacity="0.5" />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0], x: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: easeInOut, delay: 1 } satisfies Transition}>
        <ellipse cx="40" cy="82" rx="10" ry="13" fill="#D4EDF2" stroke="#8CBFD4" strokeWidth="1" />
        <path d="M40 95 L42 130" stroke="#8CBFD4" strokeWidth="0.8" />
        <path d="M40 95 L38 98 L42 98Z" fill="#8CBFD4" opacity="0.5" />
      </motion.g>

      {/* Cake */}
      <g transform="translate(100, 100)">
        {/* Bottom tier */}
        <rect x="-35" y="20" width="70" height="28" rx="4" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1.2" />
        <path d="M-35 30 Q-20 26 0 30 Q20 34 35 30" stroke="#E8788A" strokeWidth="0.8" opacity="0.3" fill="none" />
        {/* Top tier */}
        <rect x="-25" y="2" width="50" height="22" rx="4" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1.2" />
        <path d="M-25 12 Q-10 8 0 12 Q10 16 25 12" stroke="#B8A0D2" strokeWidth="0.8" opacity="0.3" fill="none" />
        {/* Frosting drips */}
        <path d="M-20 20 Q-18 25 -20 28" stroke="#E8788A" strokeWidth="0.8" fill="none" opacity="0.4" />
        <path d="M0 20 Q2 27 0 30" stroke="#E8788A" strokeWidth="0.8" fill="none" opacity="0.4" />
        <path d="M15 20 Q17 24 15 27" stroke="#E8788A" strokeWidth="0.8" fill="none" opacity="0.4" />

        {/* Candles */}
        {[
          { x: -12, h: 14, color: "#E8B88A" },
          { x: 0, h: 16, color: "#8CBFD4" },
          { x: 12, h: 14, color: "#B8A0D2" },
        ].map((c, i) => (
          <g key={i}>
            <rect x={c.x - 1.5} y={2 - c.h} width="3" height={c.h} rx="1.5" fill={c.color} opacity="0.7" />
            <motion.g
              animate={{ scaleY: [1, 1.3, 0.9, 1] }}
              transition={{ duration: 0.8 + i * 0.2, repeat: Infinity, ease: easeInOut, delay: i * 0.2 } satisfies Transition}
              style={{ transformOrigin: `${c.x}px ${2 - c.h}px` }}
            >
              <ellipse cx={c.x} cy={2 - c.h - 4} rx="3" ry="5" fill="#E8B88A" opacity="0.8" />
              <ellipse cx={c.x} cy={2 - c.h - 3} rx="1.5" ry="3" fill="#FAF5F0" opacity="0.6" />
            </motion.g>
          </g>
        ))}
      </g>

      {/* Confetti pieces */}
      {[
        { x: 140, y: 55, w: 6, h: 3, color: "#E8788A", dur: 3, delay: 0 },
        { x: 155, y: 70, w: 5, h: 3, color: "#8CBFD4", dur: 3.2, delay: 0.3 },
        { x: 165, y: 85, w: 4, h: 3, color: "#8AC4A0", dur: 2.8, delay: 0.6 },
        { x: 148, y: 90, w: 5, h: 3, color: "#E8B88A", dur: 3.5, delay: 0.9 },
        { x: 170, y: 60, w: 4, h: 3, color: "#B8A0D2", dur: 3.1, delay: 1.2 },
        { x: 30, y: 110, w: 5, h: 3, color: "#E8788A", dur: 2.9, delay: 0.4 },
        { x: 165, y: 105, w: 4, h: 3, color: "#8CBFD4", dur: 3.3, delay: 0.7 },
      ].map((c, i) => (
        <motion.rect key={i}
          animate={{ y: [0, 10, 0], rotate: [0, 180, 360], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: easeInOut, delay: c.delay } satisfies Transition}
          x={c.x} y={c.y} width={c.w} height={c.h} rx="1" fill={c.color}
        />
      ))}

      {/* Ground / table surface */}
      <line x1="55" y1="148" x2="145" y2="148" stroke="#E8E0D6" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  );
}

// ─── Custom / Generic — magical sparkle constellation ───
export function CustomEventIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="ce-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBE4E4" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#E4D4F2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4EDF2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="85" fill="url(#ce-glow)" />

      {/* Central sparkle star */}
      <motion.g
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: easeInOut } satisfies Transition}
        style={{ transformOrigin: "100px 90px" }}
      >
        <path d="M100 55 L106 78 L130 78 L110 92 L118 115 L100 100 L82 115 L90 92 L70 78 L94 78Z"
          fill="#E8788A" opacity="0.15" stroke="#E8788A" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M100 65 L104 80 L120 80 L107 89 L112 105 L100 96 L88 105 L93 89 L80 80 L96 80Z"
          fill="#E8788A" opacity="0.1" stroke="none" />
      </motion.g>

      {/* Orbiting planets */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={slowSpin}
        style={{ transformOrigin: "100px 90px" }}
      >
        <circle cx="100" cy="42" r="8" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1" />
        <circle cx="104" cy="40" r="3" fill="#FAF5F0" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: linear } satisfies Transition}
        style={{ transformOrigin: "100px 90px" }}
      >
        <circle cx="148" cy="110" r="6" fill="#D4EDF2" stroke="#8CBFD4" strokeWidth="1" />
        <circle cx="150" cy="108" r="2" fill="#FAF5F0" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: linear } satisfies Transition}
        style={{ transformOrigin: "100px 90px" }}
      >
        <circle cx="55" cy="118" r="7" fill="#F2E4D4" stroke="#E8B88A" strokeWidth="1" />
        <circle cx="57" cy="116" r="2.5" fill="#FAF5F0" opacity="0.6" />
      </motion.g>

      {/* Orbit paths (dashed) */}
      <circle cx="100" cy="90" r="50" stroke="#B8A0D2" strokeWidth="0.5" strokeDasharray="4 6" fill="none" opacity="0.3" />
      <circle cx="100" cy="90" r="38" stroke="#8CBFD4" strokeWidth="0.5" strokeDasharray="3 5" fill="none" opacity="0.25" />

      {/* Connection lines */}
      <line x1="100" y1="55" x2="100" y2="48" stroke="#B8A0D2" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

      {/* Sparkle diamonds */}
      {[
        { x: 38, y: 55, color: "#8AC4A0", delay: 0 },
        { x: 162, y: 65, color: "#E8788A", delay: 0.5 },
        { x: 50, y: 150, color: "#B8A0D2", delay: 1 },
        { x: 155, y: 140, color: "#8CBFD4", delay: 1.5 },
        { x: 100, y: 155, color: "#E8B88A", delay: 2 },
        { x: 32, y: 100, color: "#E8788A", delay: 0.8 },
        { x: 168, y: 95, color: "#8AC4A0", delay: 1.3 },
      ].map((s, i) => (
        <motion.g key={i}
          animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut, delay: s.delay } satisfies Transition}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
        >
          <path d={`M${s.x} ${s.y - 4} L${s.x + 3} ${s.y} L${s.x} ${s.y + 4} L${s.x - 3} ${s.y}Z`} fill={s.color} />
        </motion.g>
      ))}

      {/* Tiny stars */}
      {[
        { cx: 75, cy: 40, r: 1.5 }, { cx: 130, cy: 50, r: 1 },
        { cx: 45, cy: 80, r: 1 }, { cx: 160, cy: 120, r: 1.5 },
      ].map((s, i) => (
        <motion.circle key={i}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ ...sparkleTransition, delay: i * 0.4 } satisfies Transition}
          cx={s.cx} cy={s.cy} r={s.r} fill="#E8E0D6"
        />
      ))}
    </motion.svg>
  );
}

// ─── Chill Night — cozy evening with moon, mug, and blanket ───
export function ChillNightIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="cn-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#E4D4F2" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#E4D4F2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cn-moon" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FAF5F0" />
          <stop offset="100%" stopColor="#E4D4F2" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="95" r="85" fill="url(#cn-glow)" />

      {/* Window frame */}
      <rect x="45" y="20" width="110" height="85" rx="6" fill="none" stroke="#E8E0D6" strokeWidth="2" />
      <line x1="100" y1="20" x2="100" y2="105" stroke="#E8E0D6" strokeWidth="1.5" />
      <line x1="45" y1="62" x2="155" y2="62" stroke="#E8E0D6" strokeWidth="1.5" />
      {/* Night sky through window */}
      <rect x="46" y="21" width="53" height="40" rx="3" fill="#E4D4F2" opacity="0.3" />
      <rect x="101" y="21" width="53" height="40" rx="3" fill="#E4D4F2" opacity="0.3" />
      <rect x="46" y="63" width="53" height="41" rx="3" fill="#E4D4F2" opacity="0.2" />
      <rect x="101" y="63" width="53" height="41" rx="3" fill="#E4D4F2" opacity="0.2" />

      {/* Moon through window */}
      <circle cx="130" cy="42" r="14" fill="url(#cn-moon)" />
      <circle cx="137" cy="38" r="11" fill="#E4D4F2" opacity="0.3" /> {/* crescent shadow */}

      {/* Stars through window */}
      {[
        { cx: 65, cy: 35, delay: 0 }, { cx: 80, cy: 28, delay: 0.5 },
        { cx: 110, cy: 32, delay: 1 }, { cx: 58, cy: 48, delay: 1.5 },
        { cx: 120, cy: 75, delay: 0.7 }, { cx: 75, cy: 78, delay: 1.2 },
      ].map((s, i) => (
        <motion.circle key={i}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut, delay: s.delay } satisfies Transition}
          style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
          cx={s.cx} cy={s.cy} r="1.5" fill="#E8B88A"
        />
      ))}

      {/* Window sill */}
      <rect x="40" y="105" width="120" height="6" rx="2" fill="#F2E4D4" stroke="#E8E0D6" strokeWidth="1" />

      {/* Cozy mug on sill */}
      <g transform="translate(80, 88)">
        <rect x="0" y="0" width="22" height="20" rx="4" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1.5" />
        <path d="M22 4 Q32 4 32 10 Q32 16 22 16" stroke="#E8788A" strokeWidth="1.5" fill="none" />
        {/* Heart on mug */}
        <path d="M8 8 C8 6 10 5 11 6.5 C12 5 14 6 14 8 C14 10 11 12 11 12 C11 12 8 10 8 8Z" fill="#E8788A" opacity="0.3" />
      </g>

      {/* Steam from mug */}
      <motion.path
        animate={{ y: [0, -6, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: easeInOut } satisfies Transition}
        d="M88 86 Q85 78 89 72" stroke="#B8A0D2" strokeWidth="1.2" fill="none" strokeLinecap="round"
      />
      <motion.path
        animate={{ y: [0, -5, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: easeInOut, delay: 0.5 } satisfies Transition}
        d="M95 85 Q93 77 97 71" stroke="#B8A0D2" strokeWidth="1" fill="none" strokeLinecap="round"
      />
      <motion.path
        animate={{ y: [0, -4, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: easeInOut, delay: 1 } satisfies Transition}
        d="M100 86 Q99 80 102 75" stroke="#B8A0D2" strokeWidth="0.8" fill="none" strokeLinecap="round"
      />

      {/* Blanket draped below */}
      <path d="M35 140 Q50 125 80 135 Q110 145 130 130 Q150 120 170 135 L170 170 L35 170Z"
        fill="#FBE4E4" stroke="#E8788A" strokeWidth="1" opacity="0.4" />
      <path d="M35 150 Q55 140 85 148 Q115 156 140 145 Q160 138 170 148"
        stroke="#E8788A" strokeWidth="0.8" opacity="0.2" fill="none" />

      {/* Book on blanket */}
      <g transform="translate(65, 150) rotate(-8)">
        <rect x="0" y="0" width="25" height="18" rx="2" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1" />
        <line x1="12.5" y1="1" x2="12.5" y2="17" stroke="#B8A0D2" strokeWidth="0.5" />
        <rect x="3" y="3" width="7" height="1" rx="0.5" fill="#B8A0D2" opacity="0.3" />
        <rect x="3" y="6" width="5" height="1" rx="0.5" fill="#B8A0D2" opacity="0.2" />
      </g>
    </motion.svg>
  );
}

// ─── Birthday — gift box with balloons and party hat ───
export function BirthdayIllustration({ size = 200, className }: IllustrationProps) {
  return (
    <motion.svg
      animate={{ y: [0, -5, 0] }}
      transition={floatTransition}
      width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}
    >
      <defs>
        <radialGradient id="bd-glow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#FBE4E4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FBE4E4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="105" r="85" fill="url(#bd-glow)" />

      {/* Balloons */}
      <motion.g animate={{ y: [0, -5, 0], x: [0, 3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: easeInOut } satisfies Transition}>
        <ellipse cx="52" cy="48" rx="16" ry="20" fill="#D4EDF2" stroke="#8CBFD4" strokeWidth="1" />
        <ellipse cx="52" cy="48" rx="10" ry="14" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M52 68 Q54 72 50 74" stroke="#8CBFD4" strokeWidth="0.8" fill="none" />
        <path d="M50 74 Q55 120 70 135" stroke="#8CBFD4" strokeWidth="0.6" fill="none" />
      </motion.g>
      <motion.g animate={{ y: [0, -7, 0], x: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, ease: easeInOut, delay: 0.5 } satisfies Transition}>
        <ellipse cx="75" cy="38" rx="14" ry="18" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1" />
        <ellipse cx="75" cy="38" rx="8" ry="12" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M75 56 Q77 60 73 62" stroke="#E8788A" strokeWidth="0.8" fill="none" />
        <path d="M73 62 Q78 110 85 135" stroke="#E8788A" strokeWidth="0.6" fill="none" />
      </motion.g>
      <motion.g animate={{ y: [0, -4, 0], x: [0, 2, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: easeInOut, delay: 1 } satisfies Transition}>
        <ellipse cx="38" cy="58" rx="12" ry="15" fill="#E4F2E0" stroke="#8AC4A0" strokeWidth="1" />
        <ellipse cx="38" cy="58" rx="7" ry="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M38 73 Q40 77 36 79" stroke="#8AC4A0" strokeWidth="0.8" fill="none" />
        <path d="M36 79 Q42 115 60 135" stroke="#8AC4A0" strokeWidth="0.6" fill="none" />
      </motion.g>

      {/* Gift box — main */}
      <g transform="translate(100, 100)">
        {/* Box body */}
        <rect x="-35" y="8" width="70" height="45" rx="4" fill="#E4D4F2" stroke="#B8A0D2" strokeWidth="1.5" />
        {/* Box lid */}
        <rect x="-40" y="-2" width="80" height="14" rx="4" fill="#FBE4E4" stroke="#E8788A" strokeWidth="1.5" />
        {/* Ribbon vertical */}
        <rect x="-5" y="-2" width="10" height="55" fill="#E8788A" opacity="0.2" />
        {/* Ribbon horizontal on lid */}
        <rect x="-40" y="2" width="80" height="6" fill="#E8788A" opacity="0.15" />

        {/* Bow */}
        <g transform="translate(0, -2)">
          <ellipse cx="-12" cy="-6" rx="12" ry="8" fill="#E8788A" opacity="0.25" stroke="#E8788A" strokeWidth="0.8" />
          <ellipse cx="12" cy="-6" rx="12" ry="8" fill="#E8788A" opacity="0.25" stroke="#E8788A" strokeWidth="0.8" />
          <circle cx="0" cy="-3" r="5" fill="#E8788A" opacity="0.5" />
          {/* Ribbon tails */}
          <path d="M-5 -3 Q-12 8 -18 5" stroke="#E8788A" strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M5 -3 Q12 8 18 5" stroke="#E8788A" strokeWidth="1" fill="none" opacity="0.4" />
        </g>

        {/* Polka dots on box */}
        <circle cx="-18" cy="25" r="3" fill="#B8A0D2" opacity="0.15" />
        <circle cx="-8" cy="38" r="2.5" fill="#B8A0D2" opacity="0.12" />
        <circle cx="18" cy="22" r="2.5" fill="#B8A0D2" opacity="0.15" />
        <circle cx="25" cy="40" r="3" fill="#B8A0D2" opacity="0.12" />
      </g>

      {/* Party hat */}
      <g transform="translate(148, 60)">
        <polygon points="0,-30 15,10 -15,10" fill="#E8B88A" stroke="#E8B88A" strokeWidth="1" opacity="0.6" strokeLinejoin="round" />
        <line x1="-10" y1="0" x2="10" y2="0" stroke="#E8788A" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <line x1="-12" y1="5" x2="12" y2="5" stroke="#8CBFD4" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <motion.circle
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ ...sparkleTransition } satisfies Transition}
          style={{ transformOrigin: "0px -30px" }}
          cx="0" cy="-32" r="3" fill="#E8788A"
        />
      </g>

      {/* Confetti */}
      {[
        { x: 160, y: 90, color: "#E8788A", dur: 3, delay: 0 },
        { x: 170, y: 110, color: "#8CBFD4", dur: 3.3, delay: 0.4 },
        { x: 25, y: 100, color: "#8AC4A0", dur: 2.8, delay: 0.8 },
        { x: 30, y: 125, color: "#E8B88A", dur: 3.1, delay: 1.2 },
        { x: 165, y: 135, color: "#B8A0D2", dur: 3.5, delay: 0.6 },
      ].map((c, i) => (
        <motion.rect key={i}
          animate={{ y: [0, 8, 0], rotate: [0, 180, 360], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: easeInOut, delay: c.delay } satisfies Transition}
          x={c.x} y={c.y} width="5" height="3" rx="1" fill={c.color}
        />
      ))}

      {/* Ground */}
      <line x1="50" y1="155" x2="150" y2="155" stroke="#E8E0D6" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  );
}

// ─── Map event ID to illustration ───
export function EventIllustration({ eventId, size = 200, className }: { eventId: string; size?: number; className?: string }) {
  const props = { size, className };
  switch (eventId) {
    case "date-night": return <DateNightIllustration {...props} />;
    case "friends-night": case "friends-hangout": return <FriendsNightIllustration {...props} />;
    case "chill-night": case "welcome-night": return <ChillNightIllustration {...props} />;
    case "team-outing": case "team-dinner": case "client-entertainment": case "offsite": return <TeamOutingIllustration {...props} />;
    case "solo-adventure": return <SoloAdventureIllustration {...props} />;
    case "celebration": return <CelebrationIllustration {...props} />;
    case "birthday": return <BirthdayIllustration {...props} />;
    default: return <CustomEventIllustration {...props} />;
  }
}
