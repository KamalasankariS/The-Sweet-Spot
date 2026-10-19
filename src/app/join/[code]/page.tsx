"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GradientButton } from "@/components/ui/GradientButton";
import { GlassCard } from "@/components/ui/GlassCard";

interface MemberProfile {
  name: string;
  selections: Record<number, string[]>;
  createdAt: string;
}

interface GroupData {
  id: string;
  name: string;
  mode: "social" | "corporate";
  occasion: string;
  location: string;
  members: MemberProfile[];
  createdAt: string;
}

const OCCASION_LABELS: Record<string, { label: string; icon: string }> = {
  "chill-night": { label: "Chill Night", icon: "🌙" },
  "birthday": { label: "Birthday", icon: "🎂" },
  "date-night": { label: "Date Night", icon: "💫" },
  "celebration": { label: "Celebration", icon: "🎉" },
  "team-dinner": { label: "Team Dinner", icon: "🏢" },
  "client-entertainment": { label: "Client Night", icon: "🤝" },
  "welcome-night": { label: "Welcome Night", icon: "👋" },
  "offsite": { label: "Offsite", icon: "✈️" },
};

export default function JoinGroupPage() {
  return (
    <Suspense fallback={null}>
      <JoinGroupContent />
    </Suspense>
  );
}

function JoinGroupContent() {
  const params = useParams();
  const code = params.code as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const groupRaw = localStorage.getItem("sweetspot_group");
    if (groupRaw) {
      try {
        const parsed: GroupData = JSON.parse(groupRaw);
        if (parsed.id === code) {
          setGroup(parsed);
          // Check if user already in group
          const profileRaw = localStorage.getItem("sweetspot_profile");
          if (profileRaw) {
            const prof = JSON.parse(profileRaw) as MemberProfile;
            setProfile(prof);
            if (parsed.members.some((m) => m.name === prof.name)) {
              setJoined(true);
            }
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [code]);

  const handleJoin = () => {
    if (!group || !profile) return;
    const updated = {
      ...group,
      members: [...group.members, profile],
    };
    localStorage.setItem("sweetspot_group", JSON.stringify(updated));
    setJoined(true);
    setTimeout(() => {
      window.location.href = "/group";
    }, 1200);
  };

  const handleTakeQuiz = () => {
    localStorage.setItem("sweetspot_redirect", `/join/${code}`);
    window.location.href = "/quiz";
  };

  // Not found state
  if (notFound) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 2rem 2rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", maxWidth: "24rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Group Not Found
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              This invite link doesn&apos;t match any group. Ask the host to share a fresh link.
            </p>
            <GradientButton onClick={() => (window.location.href = "/group")}>
              Create Your Own Group
            </GradientButton>
          </motion.div>
        </div>
      </>
    );
  }

  // Loading state
  if (!group) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: "2rem" }}
          >
            🔗
          </motion.div>
        </div>
      </>
    );
  }

  const occasion = OCCASION_LABELS[group.occasion];
  const totalPicks = profile
    ? Object.values(profile.selections).flat().length
    : 0;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 2rem 2rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: "28rem" }}
        >
          {/* Group info card */}
          <GlassCard hover={false} style={{ padding: "2rem", marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
                You&apos;re invited to join
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                {group.name}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                {occasion?.icon} {occasion?.label || "Night Out"} · 📍 {group.location}
              </p>
            </div>

            {/* Members already in */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
                {group.members.length} member{group.members.length !== 1 ? "s" : ""} so far
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {group.members.map((member, i) => (
                  <div
                    key={member.name + i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #f97316, #ec4899)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {member.name[0]}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {member.name}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>
                      {Object.values(member.selections).flat().length} picks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Join action */}
            {joined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "1rem 0" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>You&apos;re in!</p>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  Redirecting to the group...
                </p>
              </motion.div>
            ) : profile ? (
              <div>
                {/* Preview user's profile */}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.4rem" }}>
                    Joining as
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {profile.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{profile.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                        {totalPicks} taste picks across 5 categories
                      </div>
                    </div>
                  </div>
                </div>

                <GradientButton onClick={handleJoin} className="w-full">
                  Join This Group
                </GradientButton>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                  Take the taste quiz first so the group can find your sweet spot together.
                </p>
                <GradientButton onClick={handleTakeQuiz}>
                  Take the Quiz to Join
                </GradientButton>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
