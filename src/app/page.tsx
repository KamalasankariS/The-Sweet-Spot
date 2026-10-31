"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Navbar } from "@/components/layout/Navbar";
import { ChemistryRing } from "@/components/ui/ChemistryRing";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/icons/SweetSpotIcons";
import { createClient } from "@/lib/supabase/client";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function TypewriterWord({ words }: { words: string[] }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tick = useCallback(() => {
    const current = words[wordIdx];
    if (!deleting) {
      if (charIdx < current.length) {
        timeoutRef.current = setTimeout(() => setCharIdx((c) => c + 1), 100);
      } else {
        // Pause at full word, then start deleting
        timeoutRef.current = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (charIdx > 0) {
        timeoutRef.current = setTimeout(() => setCharIdx((c) => c - 1), 60);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }
  }, [charIdx, deleting, wordIdx, words]);

  useEffect(() => {
    tick();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [tick]);

  const displayed = words[wordIdx].slice(0, charIdx);

  return (
    <span className="gradient-text" style={{ fontFamily: "var(--font-special-elite)" }}>
      {displayed}
      <span style={{ opacity: 0.7, fontWeight: 300, animation: "blink 1s step-end infinite" }}>|</span>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{ maxWidth: "1024px", marginLeft: "auto", marginRight: "auto", paddingLeft: "2rem", paddingRight: "2rem" }} className={className}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedBackground />
      <Navbar />

      <main style={{ position: "relative", zIndex: 10 }}>
        {/* Hero Section */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "6rem" }}>
          <Container>
            <motion.div
              style={{ textAlign: "center" }}
              initial="hidden"
              animate="show"
              variants={stagger}
            >
              <motion.div variants={fadeUp} style={{ marginBottom: "1.5rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", background: "rgba(45,42,38,0.04)", border: "1px solid rgba(232,224,214,0.5)", fontSize: "0.75rem", color: "rgba(45,42,38,0.5)" }}>
                  <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", background: "#E8788A" }} />
                  Powered by Qloo Cultural Intelligence
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "1.5rem" }}
              >
                Find where your{" "}
                <br className="hidden md:block" />
                group&apos;s tastes{" "}
                <TypewriterWord words={["meet", "blend", "unite", "harmonize", "connect"]} />
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{ fontSize: "1.15rem", color: "rgba(107,100,90,0.8)", maxWidth: "38rem", margin: "0 auto 2.5rem", lineHeight: 1.7 }}
              >
                Stop guessing. The Sweet Spot uses cultural intelligence to
                understand what your crew actually loves — then plans the perfect
                night everyone will enjoy.
              </motion.p>

              <motion.div variants={fadeUp}>
                <HeroAuth />
              </motion.div>

            </motion.div>
          </Container>
        </section>

        {/* How It Works */}
        <section style={{ padding: "8rem 0" }}>
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: "4rem" }}
            >
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, marginBottom: "1rem" }}>
                How it <span className="gradient-text">works</span>
              </h2>
              <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "1.1rem", maxWidth: "32rem", margin: "0 auto" }}>
                Three steps to the perfect group night. No voting. No compromises. Just taste science.
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <StepCard step="01" title="Take the Taste Quiz" description="Tell us your favorite artists, movies, food, and vibes. Takes 60 seconds. We map your cultural DNA across 12 domains." icon="target" glow="rose" delay={0} />
              <StepCard step="02" title="Create Your Group" description="Invite your crew. Each person takes the quiz. Our AI finds the cultural sweet spot where everyone's tastes overlap." icon="target" glow="lavender" delay={0.15} />
              <StepCard step="03" title="Get Your Night Planned" description="Receive a full itinerary — pre-drinks, dinner, activity, nightcap — every stop taste-optimized for your group." icon="sparkle" glow="sky" delay={0.3} />
            </div>
          </Container>
        </section>

        {/* Chemistry Preview */}
        <section style={{ padding: "8rem 0" }}>
          <Container>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="chemistry-grid">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, marginBottom: "1.5rem" }}>
                  See your group&apos;s{" "}
                  <span className="gradient-text-warm">taste chemistry</span>
                </h2>
                <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.7 }}>
                  Not just &ldquo;who likes what&rdquo; — we reveal the hidden
                  cultural connections between every member. Discover your taste
                  twin, find surprise overlaps, and get conversation starters
                  from your divergences.
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    "Pair compatibility scores between every member",
                    "Shared taste profiles across music, film, dining",
                    "Wildcard picks nobody's tried but everyone will love",
                    "Conversation starters from where you diverge",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(45,42,38,0.6)", fontSize: "0.95rem" }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#B8A0D2", flexShrink: 0 }} />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <GlassCard hover={false} className="p-8">
                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                      Group Chemistry
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: "0.25rem" }}>
                      Friday Night Crew
                    </h3>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                    <ChemistryRing score={87} size={150} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { pair: "Sarah & Mike", score: 94, label: "Taste twins" },
                      { pair: "Alex & Jordan", score: 78, label: "Solid vibes" },
                      { pair: "Sarah & Alex", score: 82, label: "Indie soulmates" },
                    ].map((p, i) => (
                      <div
                        key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem", borderRadius: "0.75rem", background: "rgba(45,42,38,0.03)" }}
                      >
                        <span style={{ fontSize: "0.875rem", color: "rgba(45,42,38,0.7)" }}>{p.pair}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.35)" }}>{p.label}</span>
                          <span className="gradient-text" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{p.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Modes Section */}
        <section style={{ padding: "8rem 0" }}>
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: "4rem" }}
            >
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, marginBottom: "1rem" }}>
                One app, <span className="gradient-text-cool">two modes</span>
              </h2>
              <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "1.1rem" }}>
                Whether it&apos;s friends or colleagues, we find the sweet spot.
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <GlassCard glow="rose" className="p-8" delay={0}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(232,120,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: "rgba(232,120,138,0.6)" }}>
                  <Icon name="heart" size={24} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.75rem" }}>Friends Night</h3>
                <p style={{ color: "rgba(107,100,90,0.8)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Birthday blowouts, chill weeknights, date nights, celebrations.
                  Every member&apos;s taste shapes the plan. Share your Cultural DNA card on socials.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Birthday", "Chill Night", "Date Night", "Celebration"].map((tag) => (
                    <span key={tag} style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "rgba(232,120,138,0.1)", color: "rgba(232,120,138,0.8)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>

              <GlassCard glow="mint" className="p-8" delay={0.15}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(138,196,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: "rgba(138,196,160,0.6)" }}>
                  <Icon name="building" size={24} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.75rem" }}>Teams & Corporate</h3>
                <p style={{ color: "rgba(107,100,90,0.8)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Team dinners, client entertainment, new hire welcomes, offsite planning.
                  Add budget caps, dietary needs, and accessibility requirements.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Team Dinner", "Client Night", "Welcome Night", "Offsite"].map((tag) => (
                    <span key={tag} style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "rgba(138,196,160,0.1)", color: "rgba(138,196,160,0.8)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </div>
          </Container>
        </section>

        {/* Wrapped Preview */}
        <section style={{ padding: "8rem 0" }}>
          <Container>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="chemistry-grid">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <GlassCard hover={false} className="p-8" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: "10rem", height: "10rem", background: "rgba(140,191,212,0.15)", borderRadius: "50%", filter: "blur(3rem)" }} />

                  <span style={{ fontSize: "0.7rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Night Recap
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                    October 12, 2026
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { icon: "pin", title: "3 stops", sub: "2.1 miles walked", bg: "rgba(232,120,138,0.1)" },
                      { icon: "target", title: "87% group match", sub: '"Scary compatible"', bg: "rgba(184,160,210,0.1)" },
                      { icon: "crystal", title: "1 new discovery", sub: '"You tried jazz for the first time"', bg: "rgba(140,191,212,0.1)" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(45,42,38,0.5)" }}>
                          <Icon name={item.icon} size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.35)" }}>{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(232,224,214,0.5)" }}>
                    <div style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.35)", marginBottom: "0.5rem" }}>Vibe of the night</div>
                    <div className="gradient-text" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      &ldquo;Wes Anderson meets Tokyo alley&rdquo;
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, marginBottom: "1.5rem" }}>
                  Your night, <span className="gradient-text-cool">wrapped</span>
                </h2>
                <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.7 }}>
                  After every outing, get a personalized recap. See what worked, what surprised you, and how your taste evolved. Share it like Spotify Wrapped — because your nights out deserve a highlight reel too.
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    "Post-night recaps with match scores",
                    "Monthly & quarterly taste evolution stories",
                    "Shareable Cultural DNA cards",
                    "Corporate team culture reports",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(45,42,38,0.6)", fontSize: "0.95rem" }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8AC4A0", flexShrink: 0 }} />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section style={{ padding: "8rem 0" }}>
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", maxWidth: "48rem", margin: "0 auto" }}
            >
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 500, marginBottom: "1.5rem" }}>
                Ready to find your <span className="gradient-text">sweet spot?</span>
              </h2>
              <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
                60 seconds to discover your taste DNA. Then invite the crew.
              </p>
              <Link href="/quiz">
                <GradientButton size="lg">Start the Taste Quiz</GradientButton>
              </Link>
            </motion.div>
          </Container>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(232,224,214,0.6)", padding: "2rem 0" }}>
          <Container>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem", color: "rgba(45,42,38,0.35)" }}>
                The Sweet Spot — Built with Qloo Cultural AI
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.2)" }}>
                Qloo Agentic Hackathon 2026
              </span>
            </div>
          </Container>
        </footer>
      </main>

      {/* Responsive grid override for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .chemistry-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}


function StepCard({ step, title, description, icon, glow, delay }: {
  step: string; title: string; description: string; icon: string;
  glow: "rose" | "lavender" | "sky"; delay: number;
}) {
  return (
    <GlassCard glow={glow} className="p-8" delay={delay}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <span style={{ color: "rgba(232,120,138,0.7)" }}><Icon name={icon} size={28} /></span>
        <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgba(45,42,38,0.2)" }}>{step}</span>
      </div>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>{title}</h3>
      <p style={{ color: "rgba(107,100,90,0.8)", lineHeight: 1.7, fontSize: "0.875rem" }}>{description}</p>
    </GlassCard>
  );
}

function HeroAuth() {
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"initial" | "otp" | "success">("initial");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        window.location.href = "/profile";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Already signed in — show the normal CTAs
  if (loading) return null;
  if (user) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Link href="/quiz">
          <GradientButton size="lg">
            Discover Your Taste DNA
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginLeft: "0.25rem" }}>
              <path d="M6 10h8m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GradientButton>
        </Link>
        <Link href="/group">
          <GradientButton variant="outline" size="lg">Create a Group</GradientButton>
        </Link>
      </div>
    );
  }

  // Not configured — show CTAs without auth
  if (!configured) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Link href="/quiz">
          <GradientButton size="lg">
            Discover Your Taste DNA
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginLeft: "0.25rem" }}>
              <path d="M6 10h8m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GradientButton>
        </Link>
        <Link href="/group">
          <GradientButton variant="outline" size="lg">Create a Group</GradientButton>
        </Link>
      </div>
    );
  }

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabase) return;
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setError("");
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      setStep("otp");
      setMessage(`Code sent to ${email}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    if (!supabase) return;
    const token = code || otp.join("");
    if (token.length !== 6) return;
    setError("");
    setSending(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (value && index === 5 && next.every((d) => d)) {
      setTimeout(() => handleVerifyOtp(next.join("")), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    if (text.length === 6) setTimeout(() => handleVerifyOtp(text), 100);
  };

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: "center", maxWidth: "380px", margin: "0 auto" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(80,180,80,0.15), rgba(80,180,80,0.05))",
            border: "2px solid rgba(80,180,80,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="rgba(60,140,60,0.8)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
          </motion.svg>
        </motion.div>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.25rem" }}>
          You&apos;re in!
        </p>
        <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.5)" }}>
          Taking you to your profile...
        </p>
      </motion.div>
    );
  }

  if (step === "otp") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: "380px", margin: "0 auto" }}
      >
        <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)", marginBottom: "1rem" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              style={{
                width: "2.75rem",
                height: "3.25rem",
                textAlign: "center",
                fontSize: "1.3rem",
                fontWeight: 600,
                borderRadius: "0.6rem",
                border: digit ? "2px solid rgba(184,160,210,0.6)" : "1px solid rgba(232,224,214,0.6)",
                background: "rgba(255,255,255,0.7)",
                color: "rgba(45,42,38,0.9)",
                outline: "none",
              }}
            />
          ))}
        </div>
        {error && <p style={{ fontSize: "0.8rem", color: "rgba(220,80,80,0.8)", marginBottom: "0.75rem" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <button
            onClick={() => { setStep("initial"); setOtp(["", "", "", "", "", ""]); setError(""); }}
            style={{ background: "none", border: "none", fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            Change email
          </button>
          <button
            onClick={async () => {
              if (!supabase) return;
              setSending(true);
              try {
                await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
                setMessage(`New code sent to ${email}`);
              } catch { /* ignore */ }
              setSending(false);
            }}
            disabled={sending}
            style={{ background: "none", border: "none", fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            Resend code
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: "380px", margin: "0 auto" }}>
      {/* Google sign-in */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth("google")}
        style={{ ...heroBtnStyle, marginBottom: "1.25rem" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </motion.button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(232,224,214,0.5)" }} />
        <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(232,224,214,0.5)" }} />
      </div>

      {/* Email OTP */}
      <form onSubmit={handleSendOtp} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          style={{
            flex: 1,
            padding: "0.7rem 1rem",
            borderRadius: "0.6rem",
            border: "1px solid rgba(232,224,214,0.6)",
            background: "rgba(255,255,255,0.7)",
            fontSize: "0.9rem",
            color: "rgba(45,42,38,0.9)",
            outline: "none",
          }}
        />
        <motion.button
          type="submit"
          disabled={sending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "0.7rem 1.25rem",
            borderRadius: "0.6rem",
            border: "none",
            background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)",
            color: "white",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {sending ? "Sending..." : "Continue"}
        </motion.button>
      </form>

      {error && <p style={{ fontSize: "0.8rem", color: "rgba(220,80,80,0.8)", marginTop: "0.5rem" }}>{error}</p>}

      <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.35)", marginTop: "0.75rem" }}>
        We&apos;ll send a one-time code. No passwords needed. We value your privacy!
      </p>

      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)", marginTop: "1.5rem" }}>
        Not in the spot yet?{" "}
        <Link href="/auth?mode=signup" style={{ color: "rgba(107,100,90,0.7)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
          Create account
        </Link>
        {" "}and experience hitting the sweet spots.
      </p>
    </div>
  );
}

const heroBtnStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.6rem",
  padding: "0.9rem 1.25rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(232,224,214,0.6)",
  background: "rgba(255,255,255,0.7)",
  cursor: "pointer",
  fontSize: "0.95rem",
  fontWeight: 500,
  color: "rgba(45,42,38,0.85)",
};
