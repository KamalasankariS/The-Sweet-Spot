"use client";

import { IconTarget, IconEdit, IconMusic , Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ChemistryRing } from "@/components/ui/ChemistryRing";
import { Toast } from "@/components/ui/Toast";
import { shareGroupInvite } from "@/lib/share";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { EventIllustration } from "@/components/ui/EventIllustrations";

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
  { id: "chill-night", label: "Chill Night", icon: "crystal" },
  { id: "birthday", label: "Birthday", icon: "cake" },
  { id: "date-night", label: "Date Night", icon: "magic" },
  { id: "celebration", label: "Celebration", icon: "celebrate" },
];

const OCCASIONS_CORPORATE = [
  { id: "team-dinner", label: "Team Dinner", icon: "building" },
  { id: "client-entertainment", label: "Client Night", icon: "heart" },
  { id: "welcome-night", label: "Welcome Night", icon: "wave" },
  { id: "offsite", label: "Offsite", icon: "plane" },
];

const TRAVEL_MODES = [
  { id: "car", label: "Car", icon: "map" },
  { id: "train", label: "Train", icon: "map" },
  { id: "bus", label: "Bus", icon: "map" },
  { id: "cycle", label: "Cycle", icon: "map" },
  { id: "walk", label: "Walk", icon: "map" },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
  { value: 50, label: "50+ mi" },
];

const TIME_OPTIONS = [
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 90, label: "1.5 hr" },
];


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
  const [zipcode, setZipcode] = useState("");
  const [travelMode, setTravelMode] = useState("car");
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxTime, setMaxTime] = useState(30);
  const [groupCreated, setGroupCreated] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);

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
        setZipcode(parsed.zipcode || "");
        setTravelMode(parsed.travelMode || "car");
        setMaxDistance(parsed.maxDistance || 10);
        setMaxTime(parsed.maxTime || 30);
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
      zipcode,
      travelMode,
      maxDistance,
      maxTime,
      members,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("sweetspot_group", JSON.stringify(groupData));
    setGroupId(id);
    setGroupCreated(true);
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

  const saveLocationPrefs = () => {
    const savedGroup = localStorage.getItem("sweetspot_group");
    if (savedGroup) {
      const parsed = JSON.parse(savedGroup);
      parsed.location = location;
      parsed.zipcode = zipcode;
      parsed.travelMode = travelMode;
      parsed.maxDistance = maxDistance;
      parsed.maxTime = maxTime;
      localStorage.setItem("sweetspot_group", JSON.stringify(parsed));
    }
    setEditingLocation(false);
    setToast("Location preferences updated!");
    setTimeout(() => setToast(""), 2000);
  };

  const occasions = mode === "social" ? OCCASIONS_SOCIAL : OCCASIONS_CORPORATE;

  if (!profile) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-6 pt-24">
          <GlassCard hover={false} className="p-8 text-center max-w-md">
            <div className="mb-4"><IconTarget size={40} /></div>
            <h2 className="text-xl font-bold mb-3">Take the Quiz First</h2>
            <p className="text-text-secondary mb-6">
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
              <span className="text-xs text-text-muted uppercase tracking-widest">
                {mode === "social" ? "Friends Night" : "Team Event"}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-1">
                {groupName}
              </h1>
              <p className="text-text-secondary">
                {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
                {occasions.find((o) => o.id === occasion)?.label || "Night Out"}{" "}
                · {location || "Location TBD"}
                {zipcode ? ` (${zipcode})` : ""}
              </p>
              <button
                onClick={() => setEditingLocation(!editingLocation)}
                className="text-text-muted text-xs mt-1 hover:text-text-secondary transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Icon name={TRAVEL_MODES.find((m) => m.id === travelMode)?.icon || "map"} size={14} />{" "}
                Within {maxDistance} mi / {maxTime} min by {travelMode}
                <span style={{ marginLeft: "0.25rem", display: "inline-flex" }}><IconEdit size={10} /></span>
              </button>
            </motion.div>

            {/* Inline location editor */}
            {editingLocation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <GlassCard hover={false} className="p-6 max-w-lg mx-auto">
                  <h3 className="text-sm font-semibold mb-4 text-text-secondary">Edit Location & Travel</h3>

                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City or neighborhood"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors text-sm"
                    />
                    <input
                      type="text"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                      placeholder="Zip"
                      className="w-20 px-3 py-2.5 rounded-xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors text-center text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-text-muted block mb-2">Travel Mode</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {TRAVEL_MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setTravelMode(m.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                            travelMode === m.id
                              ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                              : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <Icon name={m.icon} size={14} />{m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-text-muted block mb-2">Max Distance</span>
                      <div className="flex flex-wrap gap-1">
                        {DISTANCE_OPTIONS.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setMaxDistance(d.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                              maxDistance === d.value
                                ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                                : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block mb-2">Max Travel Time</span>
                      <div className="flex flex-wrap gap-1">
                        {TIME_OPTIONS.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setMaxTime(t.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                              maxTime === t.value
                                ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                                : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <GradientButton onClick={saveLocationPrefs} className="w-full">
                    Save Preferences
                  </GradientButton>
                </GlassCard>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chemistry score */}
              <GlassCard hover={false} className="p-6 text-center lg:col-span-1" delay={0}>
                <span className="text-xs text-text-muted uppercase tracking-widest">
                  Group Chemistry
                </span>
                <div className="mt-4">
                  {members.length > 1 ? (
                    <ChemistryRing score={chemistry} />
                  ) : (
                    <div className="py-8">
                      <div className="mb-3 opacity-30"><IconTarget size={40} /></div>
                      <p className="text-sm text-text-muted">
                        Add members to see chemistry
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Members list */}
              <GlassCard hover={false} className="p-6 lg:col-span-2" delay={0.1}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-muted uppercase tracking-widest">
                    Members
                  </span>
                  <span className="text-xs text-text-muted">
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
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-text-primary/[0.03] group"
                      >
                        <div className="flex items-center gap-3">
                          {member.extras?.avatarImage ? (
                            <div
                              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                              style={{ border: "1px solid rgba(232,224,214,0.5)" }}
                            >
                              <img src={member.extras.avatarImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                              style={{
                                background: member.extras?.avatarEmoji
                                  ? "linear-gradient(135deg, rgba(232,120,138,0.15), rgba(184,160,210,0.15))"
                                  : "linear-gradient(135deg, rgba(232,120,138,0.4), rgba(184,160,210,0.4))",
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
                            </div>
                            {member.extras?.currentSong && (
                              <div style={{ fontSize: "0.65rem", color: "rgba(45,42,38,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "14rem" }}>
                                <IconMusic size={12} /> {member.extras.currentSong}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="text-xs text-accent-rose/70 px-2 py-0.5 rounded-full bg-accent-rose/10">
                              You
                            </span>
                          )}
                          <button
                            onClick={() => removeMember(i)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{
                              width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                              background: "rgba(45,42,38,0.04)", border: "none",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "rgba(45,42,38,0.35)", fontSize: "0.7rem",
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

                {/* Add members */}
                <div className="flex flex-col items-center gap-3 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.location.href = "/contacts"}
                    className="w-full max-w-xs px-5 py-3 rounded-xl text-sm font-medium border-2 border-dashed border-border-light text-text-secondary hover:border-accent-rose/40 hover:bg-accent-rose/5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    Find Your Contacts
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "Join my group on The Sweet Spot", url: `${window.location.origin}/join/${groupId || "new"}` });
                      } else {
                        navigator.clipboard.writeText(`${window.location.origin}/join/${groupId || "new"}`);
                      }
                    }}
                    className="w-full max-w-xs px-5 py-3 rounded-xl text-sm font-medium border-2 border-dashed border-border-light text-text-secondary hover:border-accent-lavender/40 hover:bg-accent-lavender/5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    Invite a Friend
                  </motion.button>
                </div>
              </GlassCard>
            </div>

            {/* Generate itinerary CTA */}
            {members.length >= 1 && (
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
                <p className="text-xs text-text-muted mt-3">
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
                <span className="text-xs text-text-muted">Share invite link:</span>
                <code className="text-xs text-accent-sky/70 bg-text-primary/[0.03] px-3 py-1 rounded-lg">
                  {groupId ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${groupId.slice(0, 8)}...` : "generating..."}
                </code>
                <button
                  onClick={handleShareInvite}
                  className="text-xs text-text-secondary hover:text-text-secondary transition-colors cursor-pointer"
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
            <p className="text-text-secondary">
              Set up your night. Invite the crew. Let taste science do the
              rest.
            </p>
          </div>

          <GlassCard hover={false} className="p-8">
            {/* Mode toggle */}
            <div className="mb-8">
              <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
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
                        ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                        : "bg-white/[0.02] border border-white/[0.06] text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {m === "social" ? "Friends" : "Teams"}
                  </button>
                ))}
              </div>
            </div>

            {/* Group name */}
            <div className="mb-6">
              <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
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
                className="w-full px-5 py-3.5 rounded-xl bg-white border border-border-light text-text-primary placeholder-text-muted outline-none focus:border-accent-rose/40 transition-colors"
              />
            </div>

            {/* Occasion */}
            <div className="mb-6">
              <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
                Occasion
              </label>
              {occasion && (
                <div className="flex justify-center mb-3">
                  <EventIllustration eventId={occasion} size={100} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {occasions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                      occasion === o.id
                        ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                        : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Icon name={o.icon} size={16} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
                Location
              </label>
              <LocationAutocomplete
                value={location}
                zipcode={zipcode}
                onChange={setLocation}
                onZipcodeChange={setZipcode}
                variant="compact"
              />
            </div>

            {/* Travel Mode */}
            <div className="mb-6">
              <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
                How are you getting there?
              </label>
              <div className="flex gap-2 flex-wrap">
                {TRAVEL_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTravelMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                      travelMode === m.id
                        ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                        : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Icon name={m.icon} size={14} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance & Time */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
                  Max Distance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISTANCE_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setMaxDistance(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        maxDistance === d.value
                          ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                          : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-3 block">
                  Max Travel Time
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setMaxTime(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        maxTime === t.value
                          ? "bg-accent-rose/10 border border-accent-rose/30 text-text-primary"
                          : "bg-text-primary/[0.02] border border-border-light text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
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
