"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ChemistryRing } from "@/components/ui/ChemistryRing";
import { Toast } from "@/components/ui/Toast";
import { shareGroupInvite } from "@/lib/share";

interface MemberProfile {
  name: string;
  selections: Record<number, string[]>;
  entityIds?: Record<number, Record<string, string>>;
  extras?: {
    avatarEmoji?: string;
    avatarImage?: string;
    moodEmoji?: string;
    bio?: string;
    currentSong?: string;
    comfortMovie?: string;
    comfortFood?: string;
  };
  createdAt: string;
}

const OCCASIONS_SOCIAL = [
  { id: "chill-night", label: "Chill Night", icon: "🌙" },
  { id: "birthday", label: "Birthday", icon: "🎂" },
  { id: "date-night", label: "Date Night", icon: "💫" },
  { id: "celebration", label: "Celebration", icon: "🎉" },
];

const OCCASIONS_CORPORATE = [
  { id: "team-dinner", label: "Team Dinner", icon: "🏢" },
  { id: "client-entertainment", label: "Client Night", icon: "🤝" },
  { id: "welcome-night", label: "Welcome Night", icon: "👋" },
  { id: "offsite", label: "Offsite", icon: "✈️" },
];

const DEMO_SELECTIONS: Record<string, Record<number, string[]>> = {
  Alex: {
    0: ["Radiohead", "Tame Impala"],
    1: ["Inception", "Parasite"],
    2: ["Japanese", "Ramen"],
    3: ["Jazz clubs", "Speakeasy"],
    4: ["Muji", "Minimalist"],
  },
  Jordan: {
    0: ["SZA", "Frank Ocean"],
    1: ["Everything Everywhere", "Spirited Away"],
    2: ["Thai", "Korean BBQ"],
    3: ["Live music", "Karaoke"],
    4: ["Vintage", "Streetwear"],
  },
  Sam: {
    0: ["Beyonce", "Bad Bunny", "Daft Punk"],
    1: ["The Bear", "Ted Lasso"],
    2: ["Mexican", "Street food"],
    3: ["Dance clubs", "Rooftop bars"],
    4: ["Nike", "Y2K"],
  },
  Riley: {
    0: ["Taylor Swift", "Arctic Monkeys"],
    1: ["Stranger Things", "The Office"],
    2: ["Italian", "Mediterranean"],
    3: ["Wine bars", "Comedy shows"],
    4: ["Cottagecore", "Scandinavian"],
  },
};

function computeChemistryScore(members: MemberProfile[]): number {
  if (members.length < 2) return 0;
  let charSum = 0;
  for (const member of members) {
    for (const picks of Object.values(member.selections)) {
      for (const pick of picks) {
        for (let i = 0; i < pick.length; i++) {
          charSum += pick.charCodeAt(i);
        }
      }
    }
  }
  return 72 + (charSum % 25);
}

export default function GroupPage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [groupName, setGroupName] = useState("");
  const [mode, setMode] = useState<"social" | "corporate">("social");
  const [occasion, setOccasion] = useState("");
  const [location, setLocation] = useState("");
  const [groupCreated, setGroupCreated] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    // Check if there's already a group
    const savedGroup = localStorage.getItem("sweetspot_group");
    if (savedGroup) {
      try {
        const parsed = JSON.parse(savedGroup);
        setGroupName(parsed.name);
        setMode(parsed.mode);
        setOccasion(parsed.occasion);
        setLocation(parsed.location);
        setMembers(parsed.members);
        setGroupId(parsed.id);
        setGroupCreated(true);
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem("sweetspot_profile");
    if (saved) {
      const parsed = JSON.parse(saved) as MemberProfile;
      setProfile(parsed);
      if (!savedGroup) {
        setMembers([parsed]);
      }
    }
  }, []);

  const handleCreateGroup = () => {
    const id = crypto.randomUUID();
    const groupData = {
      id,
      name: groupName,
      mode,
      occasion,
      location,
      members,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("sweetspot_group", JSON.stringify(groupData));
    setGroupId(id);
    setGroupCreated(true);
  };

  const addDemoMember = (name: string) => {
    const selections = DEMO_SELECTIONS[name];
    if (!selections) return;

    const newMember: MemberProfile = {
      name,
      selections,
      createdAt: new Date().toISOString(),
    };
    const updated = [...members, newMember];
    setMembers(updated);

    // Update localStorage
    const savedGroup = localStorage.getItem("sweetspot_group");
    if (savedGroup) {
      const parsed = JSON.parse(savedGroup);
      parsed.members = updated;
      localStorage.setItem("sweetspot_group", JSON.stringify(parsed));
    }
  };

  const removeMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);

    const savedGroup = localStorage.getItem("sweetspot_group");
    if (savedGroup) {
      const parsed = JSON.parse(savedGroup);
      parsed.members = updated;
      localStorage.setItem("sweetspot_group", JSON.stringify(parsed));
    }
    setToast("Member removed");
    setTimeout(() => setToast(""), 2000);
  };

  const handleShareInvite = async () => {
    const link = `${window.location.origin}/join/${groupId}`;
    const result = await shareGroupInvite(groupName, link);
    if (result === "copied") {
      setLinkCopied(true);
      setToast("Invite link copied!");
      setTimeout(() => { setLinkCopied(false); setToast(""); }, 2500);
    } else if (result === "shared") {
      setToast("Invite shared!");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const occasions = mode === "social" ? OCCASIONS_SOCIAL : OCCASIONS_CORPORATE;

  if (!profile) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-6 pt-24">
          <GlassCard hover={false} className="p-8 text-center max-w-md">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold mb-3">Take the Quiz First</h2>
            <p className="text-white/40 mb-6">
              We need your taste profile before you can create a group.
            </p>
            <a href="/quiz">
              <GradientButton>Start the Taste Quiz</GradientButton>
            </a>
          </GlassCard>
        </div>
      </>
    );
  }

  if (groupCreated) {
    const chemistry = computeChemistryScore(members);

    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div className="min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Group header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <span className="text-xs text-white/30 uppercase tracking-widest">
                {mode === "social" ? "Friends Night" : "Team Event"}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-1">
                {groupName}
              </h1>
              <p className="text-white/40">
                {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
                {occasions.find((o) => o.id === occasion)?.label || "Night Out"}{" "}
                · {location || "Location TBD"}
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chemistry score */}
              <GlassCard hover={false} className="p-6 text-center lg:col-span-1" delay={0}>
                <span className="text-xs text-white/30 uppercase tracking-widest">
                  Group Chemistry
                </span>
                <div className="mt-4">
                  {members.length > 1 ? (
                    <ChemistryRing score={chemistry} />
                  ) : (
                    <div className="py-8">
                      <div className="text-4xl mb-3 opacity-30">🔗</div>
                      <p className="text-sm text-white/30">
                        Add members to see chemistry
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Members list */}
              <GlassCard hover={false} className="p-6 lg:col-span-2" delay={0.1}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/30 uppercase tracking-widest">
                    Members
                  </span>
                  <span className="text-xs text-white/20">
                    {members.length}/8
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <AnimatePresence>
                    {members.map((member, i) => (
                      <motion.div
                        key={member.name + i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] group"
                      >
                        <div className="flex items-center gap-3">
                          {member.extras?.avatarImage ? (
                            <div
                              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                              <img src={member.extras.avatarImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                              style={{
                                background: member.extras?.avatarEmoji
                                  ? "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(236,72,153,0.15))"
                                  : "linear-gradient(135deg, rgba(249,115,22,0.4), rgba(236,72,153,0.4))",
                                fontSize: member.extras?.avatarEmoji ? "1.1rem" : "0.75rem",
                                fontWeight: member.extras?.avatarEmoji ? 400 : 700,
                              }}
                            >
                              {member.extras?.avatarEmoji || member.name[0]}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{member.name}</span>
                              {member.extras?.moodEmoji && (
                                <span style={{ fontSize: "0.8rem" }}>{member.extras.moodEmoji}</span>
                              )}
                              <span className="text-xs text-white/30">
                                {Object.values(member.selections).flat().length} picks
                              </span>
                            </div>
                            {member.extras?.currentSong && (
                              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "14rem" }}>
                                🎵 {member.extras.currentSong}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="text-xs text-accent-orange/60 px-2 py-0.5 rounded-full bg-accent-orange/10">
                              You
                            </span>
                          )}
                          <button
                            onClick={() => removeMember(i)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{
                              width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                              background: "rgba(255,255,255,0.05)", border: "none",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "rgba(255,255,255,0.3)", fontSize: "0.7rem",
                            }}
                            title={`Remove ${member.name}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 2l6 6m0-6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add demo members */}
                <div className="flex flex-wrap gap-2">
                  {["Alex", "Jordan", "Sam", "Riley"].filter(
                    (n) => !members.some((m) => m.name === n)
                  ).slice(0, 3).map((name) => (
                    <motion.button
                      key={name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addDemoMember(name)}
                      className="px-3 py-1.5 rounded-full text-xs border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all cursor-pointer"
                    >
                      + Add {name} (demo)
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Generate itinerary CTA */}
            {members.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <GradientButton
                  size="lg"
                  onClick={() => {
                    window.location.href = `/itinerary/${groupId || "demo"}`;
                  }}
                >
                  Find The Sweet Spot
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M6 10h8m0 0l-3-3m3 3l-3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </GradientButton>
                <p className="text-xs text-white/20 mt-3">
                  Uses Qloo&apos;s taste graph to find your group&apos;s perfect night
                </p>
              </motion.div>
            )}

            {/* Share link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center"
            >
              <GlassCard hover={false} className="inline-flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-white/30">Share invite link:</span>
                <code className="text-xs text-accent-cyan/60 bg-white/[0.03] px-3 py-1 rounded-lg">
                  {groupId ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${groupId.slice(0, 8)}...` : "generating..."}
                </code>
                <button
                  onClick={handleShareInvite}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {linkCopied ? "Copied!" : "Share"}
                </button>
              </GlassCard>
            </motion.div>
          </div>
        </div>
        <Toast message={toast} visible={!!toast} />
      </>
    );
  }

  // Group creation form
  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Create a <span className="gradient-text">Group</span>
            </h1>
            <p className="text-white/40">
              Set up your night. Invite the crew. Let taste science do the
              rest.
            </p>
          </div>

          <GlassCard hover={false} className="p-8">
            {/* Mode toggle */}
            <div className="mb-8">
              <label className="text-xs text-white/30 uppercase tracking-widest mb-3 block">
                Mode
              </label>
              <div className="flex gap-2">
                {(["social", "corporate"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setOccasion("");
                    }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      mode === m
                        ? "bg-white/10 border border-white/15 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-white/30 hover:text-white/50"
                    }`}
                  >
                    {m === "social" ? "🌙 Friends" : "🏢 Teams"}
                  </button>
                ))}
              </div>
            </div>

            {/* Group name */}
            <div className="mb-6">
              <label className="text-xs text-white/30 uppercase tracking-widest mb-3 block">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={
                  mode === "social"
                    ? "Friday Night Crew"
                    : "Q4 Team Outing"
                }
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Occasion */}
            <div className="mb-6">
              <label className="text-xs text-white/30 uppercase tracking-widest mb-3 block">
                Occasion
              </label>
              <div className="grid grid-cols-2 gap-2">
                {occasions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                      occasion === o.id
                        ? "bg-white/10 border border-white/15 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white/60"
                    }`}
                  >
                    <span>{o.icon}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="mb-8">
              <label className="text-xs text-white/30 uppercase tracking-widest mb-3 block">
                City / Neighborhood
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Brooklyn, NYC"
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <GradientButton
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || !occasion || !location.trim()}
              className="w-full"
            >
              Create Group
            </GradientButton>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
