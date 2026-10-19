"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GradientButton } from "@/components/ui/GradientButton";

const SLIDES = [
  {
    bg: "linear-gradient(135deg, #0a0a0f 0%, #1a0a1e 100%)",
    accent: "#f97316",
    content: (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          style={{ fontSize: "4rem", marginBottom: "1rem" }}
        >
          🌙
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem" }}
        >
          Your Month in Review
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.1 }}
        >
          This month, your crew
          <br />
          went out{" "}
          <span style={{ color: "#f97316" }}>4 times</span>
        </motion.h2>
      </>
    ),
  },
  {
    bg: "linear-gradient(135deg, #0a0a0f 0%, #0a1520 100%)",
    accent: "#ec4899",
    content: (
      <>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: "2rem" }}
        >
          You visited{" "}
          <span style={{ color: "#ec4899" }}>11 spots</span>
          <br />
          across{" "}
          <span style={{ color: "#ec4899" }}>3 neighborhoods</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}
        >
          {["Williamsburg", "Lower East Side", "Greenpoint"].map((n) => (
            <span
              key={n}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                background: "rgba(236,72,153,0.1)",
                color: "rgba(236,72,153,0.8)",
                fontSize: "0.8rem",
              }}
            >
              {n}
            </span>
          ))}
        </motion.div>
      </>
    ),
  },
  {
    bg: "linear-gradient(135deg, #0a0a0f 0%, #15100a 100%)",
    accent: "#8b5cf6",
    content: (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          style={{ fontSize: "4rem", marginBottom: "1rem" }}
        >
          🍜
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: "0.5rem" }}
        >
          Your group&apos;s #1 cuisine?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 800, color: "#8b5cf6" }}
        >
          Japanese.
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem", marginTop: "0.5rem" }}
        >
          By a landslide.
        </motion.p>
      </>
    ),
  },
  {
    bg: "linear-gradient(135deg, #0a0a0f 0%, #0a150f 100%)",
    accent: "#06b6d4",
    content: (
      <>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "2rem" }}
        >
          Sarah and Mike are
          <br />
          <span style={{ color: "#06b6d4" }}>94% taste twins</span> 👀
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", maxWidth: "24rem", margin: "0 auto" }}
        >
          They agreed on 9 out of 10 spots this month. Coincidence? Qloo says no.
        </motion.p>
      </>
    ),
  },
  {
    bg: "linear-gradient(135deg, #0a0a0f 0%, #1a0a10 100%)",
    accent: "#84cc16",
    content: (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          style={{ fontSize: "4rem", marginBottom: "1rem" }}
        >
          🔮
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: "1rem" }}
        >
          Your Wildcard picks had a
          <br />
          <span style={{ color: "#84cc16" }}>90% hit rate</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}
        >
          Trust the owl. 🦉
        </motion.p>
      </>
    ),
  },
];

export default function WrappedPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={nextSlide}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            inset: 0,
            background: slide.bg,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {slide.content}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          display: "flex",
          gap: "0.5rem",
          zIndex: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              width: i === currentSlide ? "2rem" : "0.5rem",
              height: "0.5rem",
              borderRadius: "9999px",
              background: i === currentSlide ? slide.accent : "rgba(255,255,255,0.15)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Navigation hint */}
      <div
        style={{
          position: "fixed",
          bottom: "4rem",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.2)",
          zIndex: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLast ? (
          <a href="/" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
            <GradientButton size="sm">Back to Home</GradientButton>
          </a>
        ) : (
          "Tap anywhere to continue"
        )}
      </div>

      {/* Back button */}
      {currentSlide > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          style={{
            position: "fixed",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            width: "2.5rem",
            height: "2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            zIndex: 20,
          }}
        >
          ‹
        </button>
      )}
    </div>
  );
}
