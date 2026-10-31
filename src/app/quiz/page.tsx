"use client";

import { IconCelebrate , Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { QuizStep } from "@/components/taste-quiz/QuizStep";
import { ProgressBar } from "@/components/taste-quiz/ProgressBar";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Toast } from "@/components/ui/Toast";
import { moderateName } from "@/lib/moderation";
import { saveProfileEverywhere } from "@/lib/profileSync";

const QUIZ_STEPS = [
  {
    category: "Music",
    icon: "music",
    prompt: "What artists or bands do you love?",
    placeholder: "Type an artist name...",
    color: "#E8788A",
    entityType: "urn:entity:artist",
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
    icon: "theater",
    prompt: "What are your favorite movies or shows?",
    placeholder: "Type a movie or show...",
    color: "#B8A0D2",
    entityType: "urn:entity:movie,urn:entity:tv_show",
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
    icon: "restaurant",
    prompt: "What cuisines or food vibes are you into?",
    placeholder: "Type a cuisine or restaurant...",
    color: "#8CBFD4",
    entityType: "urn:entity:place",
    searchContext: "restaurant food",
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
    category: "Going Out",
    icon: "map",
    prompt: "What kind of outings or hangouts do you enjoy?",
    placeholder: "Type a venue, activity, or vibe...",
    color: "#8AC4A0",
    entityType: "urn:entity:place",
    searchContext: "venue activity entertainment",
    suggestions: [
      "Cocktail bars",
      "Coffee shops",
      "Live music",
      "Brunch spots",
      "Rooftop bars",
      "Museums",
      "Comedy shows",
      "Parks & picnics",
      "Bowling alleys",
      "Karaoke",
      "Board game cafes",
      "Farmers markets",
      "Escape rooms",
      "Art galleries",
      "Beer gardens",
      "Theater",
    ],
  },
  {
    category: "Brands & Style",
    icon: "fashion",
    prompt: "What brands or aesthetics resonate with you?",
    placeholder: "Type a brand or style...",
    color: "#E8B88A",
    entityType: "urn:entity:brand",
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
  const [entityIds, setEntityIds] = useState<Record<number, Record<string, string>>>(
    Object.fromEntries(QUIZ_STEPS.map((_, i) => [i, {}]))
  );
  const [entityImages, setEntityImages] = useState<Record<number, Record<string, string>>>(
    Object.fromEntries(QUIZ_STEPS.map((_, i) => [i, {}]))
  );
  const [quizComplete, setQuizComplete] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileMode, setProfileMode] = useState<"me" | "group">("me");
  const [groupName, setGroupName] = useState("");
  const [toast, setToast] = useState("");

  const handleAdd = useCallback(
    (item: string, entityId?: string, imageUrl?: string) => {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: [...(prev[currentStep] || []), item],
      }));
      if (entityId) {
        setEntityIds((prev) => ({
          ...prev,
          [currentStep]: { ...(prev[currentStep] || {}), [item]: entityId },
        }));
      }
      if (imageUrl) {
        setEntityImages((prev) => ({
          ...prev,
          [currentStep]: { ...(prev[currentStep] || {}), [item]: imageUrl },
        }));
      }
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
                <IconCelebrate size={28} />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">
                Taste DNA <span className="gradient-text">Mapped!</span>
              </h2>
              <p className="text-text-secondary mb-8">
                {totalPicks} cultural data points across{" "}
                {QUIZ_STEPS.length} domains. Your profile is ready.
              </p>

              {/* Taste summary */}
              <div className="space-y-3 mb-8">
                {QUIZ_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-4 rounded-xl bg-text-primary/[0.03]"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={s.icon} size={16} />
                      <span className="text-sm text-text-secondary">
                        {s.category}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: s.color }}>
                      {(selections[i] || []).length} picks
                    </span>
                  </div>
                ))}
              </div>

              {/* Who is this for? */}
              <div className="mb-4">
                <p style={{ fontSize: "0.65rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                  Who is this for?
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setProfileMode("me")}
                    style={{
                      flex: 1, padding: "0.65rem", borderRadius: "0.75rem",
                      background: profileMode === "me" ? "rgba(232,120,138,0.12)" : "rgba(45,42,38,0.02)",
                      border: `1px solid ${profileMode === "me" ? "rgba(232,120,138,0.4)" : "rgba(232,224,214,0.5)"}`,
                      color: profileMode === "me" ? "#2D2A26" : "rgba(107,100,90,0.8)",
                      cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, transition: "all 0.15s",
                    }}
                  >
                    Just Me
                  </button>
                  <button
                    onClick={() => setProfileMode("group")}
                    style={{
                      flex: 1, padding: "0.65rem", borderRadius: "0.75rem",
                      background: profileMode === "group" ? "rgba(140,191,212,0.12)" : "rgba(45,42,38,0.02)",
                      border: `1px solid ${profileMode === "group" ? "rgba(140,191,212,0.4)" : "rgba(232,224,214,0.5)"}`,
                      color: profileMode === "group" ? "#2D2A26" : "rgba(107,100,90,0.8)",
                      cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, transition: "all 0.15s",
                    }}
                  >
                    A Group
                  </button>
                </div>
              </div>

              {/* Name input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={profileMode === "me" ? "Your name" : "Your name (as shown to group)"}
                  className="w-full px-6 py-4 rounded-2xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors text-center"
                />
                {profileMode === "group" && (
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name (e.g. Friday Crew, Date Night)"
                    className="w-full px-6 py-4 rounded-2xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors text-center"
                    style={{ marginTop: "0.5rem" }}
                  />
                )}
              </div>

              <div className="flex flex-col gap-3">
                {profileMode === "group" ? (
                  <GradientButton
                    onClick={() => {
                      const check = moderateName(userName.trim());
                      if (!check.passed) {
                        setToast(check.reason!);
                        setTimeout(() => setToast(""), 3000);
                        return;
                      }
                      if (groupName.trim()) {
                        const gCheck = moderateName(groupName.trim());
                        if (!gCheck.passed) {
                          setToast(gCheck.reason!);
                          setTimeout(() => setToast(""), 3000);
                          return;
                        }
                      }
                      const profile = {
                        name: userName,
                        selections,
                        entityIds,
                        entityImages,
                        createdAt: new Date().toISOString(),
                      };
                      saveProfileEverywhere(profile);
                      // Pre-set group name if provided
                      if (groupName.trim()) {
                        localStorage.setItem("sweetspot_pending_group", groupName.trim());
                      }
                      window.location.href = "/group";
                    }}
                    disabled={!userName.trim()}
                  >
                    Create or Join a Group
                  </GradientButton>
                ) : (
                  <>
                    <GradientButton
                      onClick={() => {
                        const nameToCheck = userName.trim() || "You";
                        if (userName.trim()) {
                          const check = moderateName(nameToCheck);
                          if (!check.passed) {
                            setToast(check.reason!);
                            setTimeout(() => setToast(""), 3000);
                            return;
                          }
                        }
                        const profile = {
                          name: nameToCheck,
                          selections,
                          entityIds,
                          entityImages,
                          createdAt: new Date().toISOString(),
                        };
                        saveProfileEverywhere(profile);
                        window.location.href = "/dna";
                      }}
                    >
                      View My Cultural DNA Card
                    </GradientButton>
                    <GradientButton
                      variant="ghost"
                      onClick={() => {
                        const nameToCheck = userName.trim() || "You";
                        if (userName.trim()) {
                          const check = moderateName(nameToCheck);
                          if (!check.passed) {
                            setToast(check.reason!);
                            setTimeout(() => setToast(""), 3000);
                            return;
                          }
                        }
                        const profile = {
                          name: nameToCheck,
                          selections,
                          entityIds,
                          entityImages,
                          createdAt: new Date().toISOString(),
                        };
                        saveProfileEverywhere(profile);
                        window.location.href = "/plan";
                      }}
                    >
                      Plan My Own Night
                    </GradientButton>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
        <Toast message={toast} visible={!!toast} />
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
            entityType={step.entityType}
            searchContext={"searchContext" in step ? (step as { searchContext: string }).searchContext : undefined}
            selections={currentSelections}
            selectionImages={entityImages[currentStep] || {}}
            onAddSelection={handleAdd}
            onRemoveSelection={handleRemove}
          />
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 mt-8"
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
            className="mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip this category
          </motion.button>
        )}
      </div>
    </>
  );
}
