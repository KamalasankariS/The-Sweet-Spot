"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Navbar } from "@/components/layout/Navbar";
import { ChemistryRing } from "@/components/ui/ChemistryRing";

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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", background: "#f97316" }} />
                  Powered by Qloo Cultural Intelligence
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 0.95, marginBottom: "1.5rem" }}
              >
                Find where your{" "}
                <br className="hidden md:block" />
                group&apos;s tastes{" "}
                <span className="gradient-text">meet.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.4)", maxWidth: "38rem", margin: "0 auto 2.5rem", lineHeight: 1.7 }}
              >
                Stop guessing. The Sweet Spot uses cultural intelligence to
                understand what your crew actually loves — then plans the perfect
                night everyone will enjoy.
              </motion.p>

              <motion.div
                variants={fadeUp}
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "1rem" }}
              >
                <Link href="/quiz">
                  <GradientButton size="lg">
                    Discover Your Taste DNA
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginLeft: "0.25rem" }}>
                      <path d="M6 10h8m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </GradientButton>
                </Link>
                <Link href="/group">
                  <GradientButton variant="outline" size="lg">
                    Create a Group
                  </GradientButton>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                style={{ marginTop: "4rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "3rem" }}
              >
                <Stat value="250M+" label="Cultural entities" />
                <div style={{ width: "1px", height: "2rem", background: "rgba(255,255,255,0.1)" }} />
                <Stat value="12" label="Taste domains" />
                <div style={{ width: "1px", height: "2rem", background: "rgba(255,255,255,0.1)" }} />
                <Stat value="30T+" label="Taste connections" />
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
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1rem" }}>
                How it <span className="gradient-text">works</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", maxWidth: "32rem", margin: "0 auto" }}>
                Three steps to the perfect group night. No voting. No compromises. Just taste science.
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <StepCard step="01" title="Take the Taste Quiz" description="Tell us your favorite artists, movies, food, and vibes. Takes 60 seconds. We map your cultural DNA across 12 domains." icon="🎯" glow="orange" delay={0} />
              <StepCard step="02" title="Create Your Group" description="Invite your crew. Each person takes the quiz. Our AI finds the cultural sweet spot where everyone's tastes overlap." icon="🔗" glow="pink" delay={0.15} />
              <StepCard step="03" title="Get Your Night Planned" description="Receive a full itinerary — pre-drinks, dinner, activity, nightcap — every stop taste-optimized for your group." icon="✨" glow="purple" delay={0.3} />
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
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1.5rem" }}>
                  See your group&apos;s{" "}
                  <span className="gradient-text-warm">taste chemistry</span>
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.7 }}>
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
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ec4899", flexShrink: 0 }} />
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
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
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
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.03)" }}
                      >
                        <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>{p.pair}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{p.label}</span>
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
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1rem" }}>
                One app, <span className="gradient-text-cool">two modes</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>
                Whether it&apos;s friends or colleagues, we find the sweet spot.
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <GlassCard glow="orange" className="p-8" delay={0}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", fontSize: "1.5rem" }}>
                  🌙
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Friends Night</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Birthday blowouts, chill weeknights, date nights, celebrations.
                  Every member&apos;s taste shapes the plan. Share your Cultural DNA card on socials.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Birthday", "Chill Night", "Date Night", "Celebration"].map((tag) => (
                    <span key={tag} style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "rgba(249,115,22,0.1)", color: "rgba(249,115,22,0.8)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>

              <GlassCard glow="cyan" className="p-8" delay={0.15}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", fontSize: "1.5rem" }}>
                  🏢
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Teams & Corporate</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Team dinners, client entertainment, new hire welcomes, offsite planning.
                  Add budget caps, dietary needs, and accessibility requirements.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Team Dinner", "Client Night", "Welcome Night", "Offsite"].map((tag) => (
                    <span key={tag} style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "rgba(6,182,212,0.1)", color: "rgba(6,182,212,0.8)" }}>
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
                  <div style={{ position: "absolute", top: 0, right: 0, width: "10rem", height: "10rem", background: "rgba(139,92,246,0.1)", borderRadius: "50%", filter: "blur(3rem)" }} />

                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Night Recap
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                    October 12, 2026
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { icon: "📍", title: "3 stops", sub: "2.1 miles walked", bg: "rgba(249,115,22,0.1)" },
                      { icon: "🎯", title: "87% group match", sub: '"Scary compatible"', bg: "rgba(236,72,153,0.1)" },
                      { icon: "🔮", title: "1 new discovery", sub: '"You tried jazz for the first time"', bg: "rgba(139,92,246,0.1)" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>Vibe of the night</div>
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
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1.5rem" }}>
                  Your night, <span className="gradient-text-cool">wrapped</span>
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.7 }}>
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
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06b6d4", flexShrink: 0 }} />
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
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, marginBottom: "1.5rem" }}>
                Ready to find your <span className="gradient-text">sweet spot?</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
                60 seconds to discover your taste DNA. Then invite the crew.
              </p>
              <Link href="/quiz">
                <GradientButton size="lg">Start the Taste Quiz</GradientButton>
              </Link>
            </motion.div>
          </Container>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem 0" }}>
          <Container>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.3)" }}>
                The Sweet Spot — Built with Qloo Cultural AI
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function StepCard({ step, title, description, icon, glow, delay }: {
  step: string; title: string; description: string; icon: string;
  glow: "orange" | "pink" | "purple"; delay: number;
}) {
  return (
    <GlassCard glow={glow} className="p-8" delay={delay}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.75rem" }}>{icon}</span>
        <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>{step}</span>
      </div>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>{title}</h3>
      <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, fontSize: "0.875rem" }}>{description}</p>
    </GlassCard>
  );
}
