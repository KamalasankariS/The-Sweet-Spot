"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───

export interface ThemeConfig {
  gradient: {
    colors: string[];
    angle: number;
    opacity: number;
  };
  particles: {
    type: "fireflies" | "bokeh" | "hearts" | "stars" | "confetti" | "sparkles" | "bubbles" | "petals" | "snowflakes" | "lanterns";
    colors: string[];
    count: number;
    speed: "slow" | "medium" | "fast";
    size: "small" | "medium" | "large";
  };
  ambience: {
    baseColor: string;
    glowColor: string;
    glowPosition: string;
    warmth: number;
    secondaryGlow: string;
    secondaryGlowPosition: string;
  };
  mood_description: string;
}

// ─── Particle Canvas ───

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  phase: number;
  rotation: number;
  rotationSpeed: number;
  type: string;
}

const SPEED_MAP = { slow: 0.35, medium: 0.8, fast: 1.4 };
const SIZE_MAP = { small: [3, 7], medium: [6, 14], large: [10, 22] };

function createParticle(
  canvas: { width: number; height: number },
  config: ThemeConfig["particles"],
  randomY = false,
): Particle {
  const sizeRange = SIZE_MAP[config.size] || SIZE_MAP.medium;
  const speed = SPEED_MAP[config.speed] || SPEED_MAP.slow;

  return {
    x: Math.random() * canvas.width,
    y: randomY ? Math.random() * canvas.height : canvas.height + 20,
    vx: (Math.random() - 0.5) * speed * 0.5,
    vy: -Math.random() * speed * 0.8 - 0.15,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    opacity: 0.25 + Math.random() * 0.55,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 2,
    type: config.type,
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, time: number) {
  ctx.save();
  const pulse = Math.sin(time * 0.002 + p.phase) * 0.3 + 0.7;
  ctx.globalAlpha = p.opacity * pulse;

  switch (p.type) {
    case "fireflies": {
      // Soft glowing circle with halo
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.3, p.color + "80");
      gradient.addColorStop(1, p.color + "00");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      // Bright core
      ctx.globalAlpha = p.opacity * pulse * 1.2;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bokeh": {
      // Soft blurred circle
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      grad.addColorStop(0, p.color + "50");
      grad.addColorStop(0.5, p.color + "25");
      grad.addColorStop(1, p.color + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Ring
      ctx.strokeStyle = p.color + "30";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "hearts": {
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(p.size / 8, p.size / 8);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.bezierCurveTo(-5, -10, -14, -5, -7, 3);
      ctx.lineTo(0, 10);
      ctx.lineTo(7, 3);
      ctx.bezierCurveTo(14, -5, 5, -10, 0, -3);
      ctx.fill();
      break;
    }
    case "stars": {
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      // 4-point star
      const s = p.size;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const outerX = Math.cos(angle) * s;
        const outerY = Math.sin(angle) * s;
        const innerAngle = angle + Math.PI / 4;
        const innerX = Math.cos(innerAngle) * s * 0.35;
        const innerY = Math.sin(innerAngle) * s * 0.35;
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2);
      glow.addColorStop(0, p.color + "30");
      glow.addColorStop(1, p.color + "00");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "confetti": {
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.8, -p.size * 0.3, p.size * 1.6, p.size * 0.6);
      break;
    }
    case "sparkles": {
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      // Diamond sparkle
      const sz = p.size * pulse;
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.3, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-sz, 0);
      ctx.lineTo(0, sz * 0.3);
      ctx.lineTo(sz, 0);
      ctx.lineTo(0, -sz * 0.3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "bubbles": {
      const bGrad = ctx.createRadialGradient(
        p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.1,
        p.x, p.y, p.size
      );
      bGrad.addColorStop(0, "#FFFFFF40");
      bGrad.addColorStop(0.5, p.color + "20");
      bGrad.addColorStop(1, p.color + "05");
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.color + "35";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Highlight
      ctx.fillStyle = "#FFFFFF50";
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "petals": {
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.5, p.size * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Vein
      ctx.strokeStyle = p.color + "40";
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 1.1);
      ctx.lineTo(0, p.size * 1.1);
      ctx.stroke();
      break;
    }
    case "snowflakes": {
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 0.7;
      const r = p.size;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        ctx.stroke();
        // Small branches
        const bx = Math.cos(angle) * r * 0.6;
        const by = Math.sin(angle) * r * 0.6;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(angle + 0.5) * r * 0.3, by + Math.sin(angle + 0.5) * r * 0.3);
        ctx.stroke();
      }
      break;
    }
    case "lanterns": {
      // Warm glowing lantern
      const lGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      lGrad.addColorStop(0, p.color + "60");
      lGrad.addColorStop(0.4, p.color + "25");
      lGrad.addColorStop(1, p.color + "00");
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      // Lantern body
      ctx.fillStyle = p.color + "90";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 0.8, p.size * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top cap
      ctx.fillStyle = p.color + "60";
      ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 1.1, p.size, p.size * 0.3);
      break;
    }
    default: {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function ParticleCanvas({ config }: { config: ThemeConfig["particles"] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: config.count }, () =>
      createParticle(
        { width: window.innerWidth, height: window.innerHeight },
        config,
        true,
      )
    );

    const speed = SPEED_MAP[config.speed] || SPEED_MAP.slow;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particlesRef.current.forEach((p, i) => {
        // Wandering motion
        p.x += p.vx + Math.sin(time * 0.001 + p.phase) * speed * 0.3;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Respawn at bottom when off top
        if (p.y < -20 || p.x < -20 || p.x > window.innerWidth + 20) {
          particlesRef.current[i] = createParticle(
            { width: window.innerWidth, height: window.innerHeight },
            config,
            false,
          );
        }

        drawParticle(ctx, p, time);
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Glow Position Helper ───

function glowPositionToCSS(pos: string): { top?: string; bottom?: string; left?: string; right?: string } {
  switch (pos) {
    case "top-left": return { top: "-20%", left: "-15%" };
    case "top-right": return { top: "-20%", right: "-15%" };
    case "bottom-left": return { bottom: "-20%", left: "-15%" };
    case "bottom-right": return { bottom: "-20%", right: "-15%" };
    case "center": return { top: "20%", left: "25%" };
    default: return { top: "-20%", right: "-15%" };
  }
}

// ─── Main Component ───

export function AmbientTheme({ theme, loading, backgroundImage }: { theme: ThemeConfig | null; loading?: boolean; backgroundImage?: string | null }) {
  if (!theme) {
    // Default static background (matches AnimatedBackground), with optional background image overlay
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "#FAF5F0" }} />
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,228,228,0.7) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,212,242,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212,237,242,0.5) 0%, transparent 70%)" }}
        />
        {backgroundImage && (
          <motion.div
            key={backgroundImage}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <img
              src={backgroundImage}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)" }} />
          </motion.div>
        )}
      </div>
    );
  }

  const { gradient, particles, ambience } = theme;
  const primaryGlowPos = glowPositionToCSS(ambience.glowPosition);
  const secondaryGlowPos = glowPositionToCSS(ambience.secondaryGlowPosition);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme.mood_description}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="fixed inset-0 -z-10 overflow-hidden"
      >
        {/* Base color */}
        <div className="absolute inset-0" style={{ background: ambience.baseColor }} />

        {/* Background image (if provided) */}
        {backgroundImage && (
          <motion.div
            key={backgroundImage}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <img
              src={backgroundImage}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
              }}
            />
            {/* Dark overlay for readability */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.6) 100%)",
              }}
            />
            {/* Tinted overlay matching theme */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${ambience.glowColor}20 0%, transparent 50%, ${ambience.secondaryGlow}15 100%)`,
              }}
            />
          </motion.div>
        )}

        {/* Gradient overlay (less intense when image present) */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: backgroundImage ? gradient.opacity * 0.3 : gradient.opacity }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            background: `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(", ")})`,
          }}
        />

        {/* Primary glow */}
        <motion.div
          className="absolute w-[900px] h-[900px] rounded-full"
          style={{
            ...primaryGlowPos,
            background: `radial-gradient(circle, ${ambience.glowColor}80 0%, ${ambience.glowColor}40 35%, ${ambience.glowColor}15 55%, transparent 75%)`,
          }}
          animate={{
            scale: [1, 1.08, 0.96, 1],
            x: [0, 20, -15, 0],
            y: [0, -15, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Secondary glow */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            ...secondaryGlowPos,
            background: `radial-gradient(circle, ${ambience.secondaryGlow}70 0%, ${ambience.secondaryGlow}30 35%, ${ambience.secondaryGlow}10 55%, transparent 75%)`,
          }}
          animate={{
            scale: [1, 0.95, 1.1, 1],
            x: [0, -25, 15, 0],
            y: [0, 20, -25, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Warmth overlay */}
        {ambience.warmth > 0.3 && (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, rgba(232,184,138,${ambience.warmth * 0.15}) 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Particles */}
        <ParticleCanvas config={particles} />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(45,42,38,0.04) 100%)",
          }}
        />

        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Loading shimmer */}
        {loading && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0, 0.06, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: `linear-gradient(135deg, transparent, ${ambience.glowColor}30, transparent)` }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Hook for fetching theme ───

export function useAmbientTheme() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [moodLabel, setMoodLabel] = useState("");
  const lastRequestRef = useRef("");

  const generateTheme = useCallback(async (params: {
    eventType: string;
    eventLabel?: string;
    location?: string;
    groupSize?: string;
    timeOfDay?: string;
    mood?: string;
  }) => {
    // Dedupe identical requests
    const key = JSON.stringify(params);
    if (key === lastRequestRef.current) return;
    lastRequestRef.current = key;

    if (!params.eventType) {
      setTheme(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/theme/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.gradient) {
        setTheme(data);
        setMoodLabel(data.mood_description || "");
      }
    } catch (err) {
      console.error("Theme generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { theme, loading, moodLabel, generateTheme };
}
