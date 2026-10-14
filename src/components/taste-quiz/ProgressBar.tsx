"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ icon: string; label: string }>;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  steps,
}: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-lg mx-auto mb-12">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1"
            animate={{
              opacity: i <= currentStep ? 1 : 0.3,
              scale: i === currentStep ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                i < currentStep
                  ? "bg-accent-pink/20 border border-accent-pink/40"
                  : i === currentStep
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/[0.03] border border-white/[0.06]"
              }`}
            >
              {i < currentStep ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8l3.5 3.5L13 5"
                    stroke="#ec4899"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="text-sm">{step.icon}</span>
              )}
            </div>
            <span className="text-[10px] text-white/30 hidden sm:block">
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-orange via-accent-pink to-accent-purple"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
