"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { UsernameInput } from "@/components/ui/UsernameInput";

type Step = "initial" | "otp" | "signup" | "success" | "onboarding";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const [step, setStep] = useState<Step>("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { syncToSupabase } = useProfile();

  // Check if redirected back from OAuth with success
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setStep("success");
    }
  }, [searchParams]);

  // After success animation, sync profile and check if onboarding is needed
  useEffect(() => {
    if (step === "success") {
      syncToSupabase();
      const timer = setTimeout(async () => {
        // Check if user already has name set — skip onboarding if so
        if (supabase) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser?.user_metadata?.first_name && currentUser?.user_metadata?.username) {
            router.push("/");
            return;
          }
        }
        setStep("onboarding");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, syncToSupabase, supabase, router]);

  // --- OAuth (Google) ---
  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabase) {
      setError("Auth not configured.");
      return;
    }
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth?success=true`,
      },
    });
    if (error) setError(error.message);
  };

  // --- Send OTP to email ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setStep("otp");
      setMessage(`We sent a 6-digit code to ${email}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // --- Verify OTP ---
  const handleVerifyOtp = async () => {
    if (!supabase) return;
    const code = otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // --- Manual Sign Up (email + password) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (error) throw error;
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Save onboarding profile ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`,
        },
      });
      if (error) throw error;
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // --- OTP input handlers ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (value && index === 5 && next.every((d) => d)) {
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    if (text.length === 6) setTimeout(() => handleVerifyOtp(), 100);
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />
      <Navbar />

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "6rem 1rem 2rem",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: "100%", maxWidth: "420px" }}
        >
          <GlassCard>
            <div style={{ padding: "2rem" }}>
              <AnimatePresence mode="wait">

                {/* === SUCCESS SCREEN === */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ textAlign: "center", padding: "1rem 0" }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(80,180,80,0.15), rgba(80,180,80,0.05))",
                        border: "2px solid rgba(80,180,80,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1.5rem",
                      }}
                    >
                      <motion.svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          stroke="rgba(60,140,60,0.8)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </motion.svg>
                    </motion.div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.5rem" }}>
                      You&apos;re in!
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)", marginBottom: "1.5rem" }}>
                      Account verified successfully. Let&apos;s set up your profile.
                    </p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div style={{
                        width: "100%",
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(232,224,214,0.3)",
                        overflow: "hidden",
                      }}>
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.8, ease: "linear" }}
                          style={{
                            height: "100%",
                            borderRadius: "2px",
                            background: "linear-gradient(90deg, #E8788A, #B8A0D2, #8CBFD4)",
                          }}
                        />
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.4)", marginTop: "0.5rem" }}>
                        Setting up your profile...
                      </p>
                    </motion.div>
                  </motion.div>
                )}

                {/* === ONBOARDING SCREEN === */}
                {step === "onboarding" && (
                  <motion.div
                    key="onboarding"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
                        Tell us about you
                      </h1>
                      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
                        Set up your name and choose a username
                      </p>
                    </div>

                    <form onSubmit={handleSaveProfile}>
                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>First name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First"
                            required
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Last name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last"
                            required
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: "1.5rem" }}>
                        <label style={labelStyle}>Username</label>
                        <UsernameInput
                          value={username}
                          onChange={setUsername}
                          style={inputStyle}
                        />
                      </div>

                      <AlertBox type="error" message={error} />

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={primaryBtnStyle(loading)}
                      >
                        {loading ? "Saving..." : "Let\u2019s Go"}
                      </motion.button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                      <button
                        onClick={() => router.push("/profile")}
                        style={linkBtnStyle}
                      >
                        Skip for now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* === INITIAL SCREEN === */}
                {step === "initial" && (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
                        Welcome
                      </h1>
                      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
                        Sign in or create an account to save your taste profile
                      </p>
                    </div>

                    {/* Google sign-in */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleOAuth("google")}
                      style={{ ...socialBtnStyle, marginBottom: "1.5rem" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Continue with Google</span>
                    </motion.button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div style={{ flex: 1, height: "1px", background: "rgba(232,224,214,0.6)" }} />
                      <span style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(232,224,214,0.6)" }} />
                    </div>

                    {/* Email OTP form */}
                    <form onSubmit={handleSendOtp}>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={labelStyle}>Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <AlertBox type="error" message={error} />

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={primaryBtnStyle(loading)}
                      >
                        {loading ? "Sending code..." : "Continue with Email"}
                      </motion.button>
                    </form>

                    {/* Manual sign up link */}
                    <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <button
                        onClick={() => { setStep("signup"); setError(""); }}
                        style={{ ...linkBtnStyle, display: "inline" }}
                      >
                        Create account with email &amp; password instead
                      </button>
                      <Link href="/" style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.4)", textDecoration: "none" }}>
                        Skip for now
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* === OTP VERIFICATION === */}
                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
                        Check your email
                      </h1>
                      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
                        {message}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
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
                            width: "3rem",
                            height: "3.5rem",
                            textAlign: "center",
                            fontSize: "1.4rem",
                            fontWeight: 600,
                            borderRadius: "0.6rem",
                            border: digit ? "2px solid rgba(184,160,210,0.6)" : "1px solid rgba(232,224,214,0.6)",
                            background: "rgba(255,255,255,0.6)",
                            color: "rgba(45,42,38,0.9)",
                            outline: "none",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "rgba(184,160,210,0.8)"; }}
                          onBlur={(e) => { e.target.style.borderColor = digit ? "rgba(184,160,210,0.6)" : "rgba(232,224,214,0.6)"; }}
                        />
                      ))}
                    </div>

                    <AlertBox type="error" message={error} />

                    <motion.button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.join("").length !== 6}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={primaryBtnStyle(loading || otp.join("").length !== 6)}
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </motion.button>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.25rem" }}>
                      <button
                        onClick={() => { setStep("initial"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                        style={linkBtnStyle}
                      >
                        Use different email
                      </button>
                      <button
                        onClick={async () => {
                          if (!supabase) return;
                          setError("");
                          setLoading(true);
                          try {
                            const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
                            if (error) throw error;
                            setMessage(`New code sent to ${email}`);
                          } catch (err: unknown) {
                            setError(err instanceof Error ? err.message : "Failed to resend");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        style={linkBtnStyle}
                      >
                        Resend code
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* === MANUAL SIGN UP === */}
                {step === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
                        Create your account
                      </h1>
                      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
                        Sign up with email and password
                      </p>
                    </div>

                    <form onSubmit={handleSignUp}>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={labelStyle}>Your name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="What should we call you?"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={labelStyle}>Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ marginBottom: "1.5rem" }}>
                        <label style={labelStyle}>Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          style={inputStyle}
                        />
                      </div>

                      <AlertBox type="error" message={error} />

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={primaryBtnStyle(loading)}
                      >
                        {loading ? "Creating account..." : "Create Account"}
                      </motion.button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                      <button
                        onClick={() => { setStep("initial"); setError(""); }}
                        style={linkBtnStyle}
                      >
                        Back to sign in options
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}

function AlertBox({ type, message }: { type: "error" | "success"; message: string }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "0.6rem",
        background: isError ? "rgba(220,80,80,0.08)" : "rgba(80,180,80,0.08)",
        border: `1px solid ${isError ? "rgba(220,80,80,0.2)" : "rgba(80,180,80,0.2)"}`,
        color: isError ? "rgba(180,60,60,0.9)" : "rgba(40,120,40,0.9)",
        fontSize: "0.8rem",
        marginBottom: "1rem",
      }}
    >
      {message}
    </motion.div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  color: "rgba(107,100,90,0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "0.6rem",
  border: "1px solid rgba(232,224,214,0.6)",
  background: "rgba(255,255,255,0.6)",
  fontSize: "0.9rem",
  color: "rgba(45,42,38,0.9)",
  outline: "none",
  transition: "border-color 0.3s",
  boxSizing: "border-box",
};

const socialBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  width: "100%",
  padding: "0.8rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(232,224,214,0.6)",
  background: "rgba(255,255,255,0.7)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "rgba(45,42,38,0.85)",
  transition: "all 0.2s",
};

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "0.75rem",
    border: "none",
    background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "opacity 0.3s",
  };
}

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "0.8rem",
  color: "rgba(107,100,90,0.5)",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};
