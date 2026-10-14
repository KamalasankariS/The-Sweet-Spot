"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { QuizStep } from "@/components/taste-quiz/QuizStep";
import { ProgressBar } from "@/components/taste-quiz/ProgressBar";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";

const QUIZ_STEPS = [
  {
    category: "Music",
    icon: "🎵",
    prompt: "What artists or bands do you love?",
    placeholder: "Type an artist name...",
    color: "#f97316",
    suggestions: [
      "Radiohead",
      "Beyonce",
      "Kendrick Lamar",
      "Taylor Swift",
      "The Weeknd",
      "Daft Punk",
      "Arctic Monkeys",
      "Frank Ocean",
      "Bad Bunny",
      "Tame Impala",
      "SZA",
      "Tyler the Creator",
    ],
  },
  {
    category: "Movies & TV",
    icon: "🎬",
    prompt: "What are your favorite movies or shows?",
    placeholder: "Type a movie or show...",
    color: "#ec4899",
    suggestions: [
      "Inception",
      "Breaking Bad",
      "Parasite",
      "The Office",
      "Interstellar",
      "Succession",
      "Everything Everywhere",
      "Stranger Things",
      "Pulp Fiction",
      "Ted Lasso",
      "Spirited Away",
      "The Bear",
    ],
  },
  {
    category: "Dining",
    icon: "🍽️",
    prompt: "What cuisines or food vibes are you into?",
    placeholder: "Type a cuisine or restaurant...",
    color: "#8b5cf6",
    suggestions: [
      "Japanese",
      "Italian",
      "Mexican",
      "Thai",
      "Korean BBQ",
      "Farm-to-table",
      "Sushi",
      "Ramen",
      "Mediterranean",
      "Indian",
      "French bistro",
      "Street food",
    ],
  },
  {
    category: "Nightlife & Vibes",
    icon: "🌙",
    prompt: "What's your ideal night out vibe?",
    placeholder: "Type a vibe or venue type...",
    color: "#06b6d4",
    suggestions: [
      "Cocktail bars",
      "Live music",
      "Jazz clubs",
      "Rooftop bars",
      "Dive bars",
      "Dance clubs",
      "Wine bars",
      "Comedy shows",
      "Speakeasy",
      "Karaoke",
      "Beer gardens",
      "Art galleries",
    ],
  },
  {
    category: "Brands & Style",
    icon: "✨",
    prompt: "What brands or aesthetics resonate with you?",
    placeholder: "Type a brand or style...",
    color: "#84cc16",
    suggestions: [
      "Nike",
      "Aesop",
      "Patagonia",
      "Apple",
      "Supreme",
      "Muji",
      "Vintage",
      "Minimalist",
      "Streetwear",
      "Cottagecore",
      "Y2K",
      "Scandinavian",
    ],
  },
];

const STEP_INDICATORS = QUIZ_STEPS.map((s) => ({
  icon: s.icon,
  label: s.category,
}));

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>(
    Object.fromEntries(QUIZ_STEPS.map((_, i) => [i, []]))
  );
  const [quizComplete, setQuizComplete] = useState(false);
  const [userName, setUserName] = useState("");

  const handleAdd = useCallback(
    (item: string) => {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: [...(prev[currentStep] || []), item],
      }));
    },
    [currentStep]
  );

  const handleRemove = useCallback(
    (item: string) => {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: (prev[currentStep] || []).filter((s) => s !== item),
      }));
    },
    [currentStep]
  );

  const handleNext = () => {
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentSelections = selections[currentStep] || [];
  const step = QUIZ_STEPS[currentStep];

  if (quizComplete) {
    const totalPicks = Object.values(selections).flat().length;

    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-6 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <GlassCard hover={false} className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-6xl mb-6"
              >
                🎉
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">
                Taste DNA <span className="gradient-text">Mapped!</span>
              </h2>
              <p className="text-white/40 mb-8">
                {totalPicks} cultural data points across{" "}
                {QUIZ_STEPS.length} domains. Your profile is ready.
              </p>

              {/* Taste summary */}
              <div className="space-y-3 mb-8">
                {QUIZ_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span className="text-sm text-white/60">
                        {s.category}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: s.color }}>
                      {(selections[i] || []).length} picks
                    </span>
                  </div>
                ))}
              </div>

              {/* Name input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name (for your group)"
                  className="w-full px-6 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors text-center"
                />
              </div>

              <div className="flex flex-col gap-3">
                <GradientButton
                  onClick={() => {
                    // TODO: Save profile & redirect to group creation
                    const profile = {
                      name: userName,
                      selections,
                      createdAt: new Date().toISOString(),
                    };
                    localStorage.setItem(
                      "sweetspot_profile",
                      JSON.stringify(profile)
                    );
                    window.location.href = "/group";
                  }}
                  disabled={!userName.trim()}
                >
                  Create or Join a Group
                </GradientButton>
                <GradientButton variant="ghost">
                  View My Cultural DNA Card
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={QUIZ_STEPS.length}
          steps={STEP_INDICATORS}
        />

        <AnimatePresence mode="wait">
          <QuizStep
            key={currentStep}
            category={step.category}
            icon={step.icon}
            prompt={step.prompt}
            placeholder={step.placeholder}
            color={step.color}
            suggestions={step.suggestions}
            selections={currentSelections}
            onAddSelection={handleAdd}
            onRemoveSelection={handleRemove}
          />
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 mt-12"
        >
          {currentStep > 0 && (
            <GradientButton variant="ghost" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 4l-4 4 4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </GradientButton>
          )}

          <GradientButton
            onClick={handleNext}
            disabled={currentSelections.length === 0}
          >
            {currentStep === QUIZ_STEPS.length - 1 ? (
              "Complete Quiz"
            ) : (
              <>
                Next
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </GradientButton>
        </motion.div>

        {/* Skip option */}
        {currentSelections.length === 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={handleNext}
            className="mt-4 text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Skip this category
          </motion.button>
        )}
      </div>
    </>
  );
}
