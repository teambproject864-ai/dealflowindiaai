"use client";

import { useState, useEffect, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@/lib/auth";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Sparkles,
  ChevronRight,
  Activity,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  role: UserRole;
  allowRegistration?: boolean;
}

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bg: string;
} {
  if (!password) return { score: 0, label: "", color: "", bg: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map = [
    { label: "Too weak", color: "text-red-400", bg: "bg-red-500" },
    { label: "Weak", color: "text-orange-400", bg: "bg-orange-500" },
    { label: "Fair", color: "text-amber-400", bg: "bg-amber-400" },
    { label: "Good", color: "text-teal-400", bg: "bg-teal-400" },
    { label: "Strong", color: "text-emerald-400", bg: "bg-emerald-500" },
  ];
  return { score: capped, ...map[capped] };
}

function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return null;
}

function validatePassword(pw: string, isLogin: boolean): string | null {
  if (!pw) return "Password is required";
  if (!isLogin && pw.length < 8) return "Password must be at least 8 characters";
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Full name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return null;
}

// ─── Floating stats for hero panel ────────────────────────────────────────────
const heroStats = [
  { value: "3.2x", label: "Pipeline Growth", icon: TrendingUp, color: "text-teal-400", glow: "shadow-teal-500/20" },
  { value: "89%", label: "Lead Quality", icon: Target, color: "text-violet-400", glow: "shadow-violet-500/20" },
  { value: "48h", label: "Time to Value", icon: Activity, color: "text-cyan-400", glow: "shadow-cyan-500/20" },
];

const features = [
  { icon: Zap, text: "AI-powered revenue intelligence", sub: "Autonomous outreach at scale" },
  { icon: TrendingUp, text: "Pipeline automation & insights", sub: "ICP matching in real-time" },
  { icon: Shield, text: "Enterprise-grade security", sub: "SOC 2 Type II (Audit in Progress)" },
  { icon: BarChart3, text: "Real-time GTM analytics", sub: "360° customer visibility" },
];

// ─── Animated mesh background ──────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary gradient blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-20 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

// ─── Animated stat card ────────────────────────────────────────────────────────
function StatCard({ stat, delay }: { stat: typeof heroStats[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl",
        "bg-white/5 border border-white/10 backdrop-blur-sm",
        "shadow-lg", stat.glow
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <stat.icon className={cn("h-4 w-4", stat.color)} />
      </div>
      <div>
        <div className={cn("text-lg font-bold leading-none", stat.color)}>{stat.value}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{stat.label}</div>
      </div>
    </motion.div>
  );
}

// ─── Input component ──────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  isValid?: boolean;
}
function AuthInput({ hasError, isValid, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500",
        "bg-slate-800/70 border transition-all duration-200 outline-none",
        "focus:ring-2 focus:ring-offset-0",
        hasError
          ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20"
          : isValid
          ? "border-emerald-500/40 focus:border-emerald-500/50 focus:ring-emerald-500/15"
          : "border-white/8 focus:border-teal-500/50 focus:ring-teal-500/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string | null;
  touched?: boolean;
  children: React.ReactNode;
}
function Field({ id, label, icon: Icon, error, touched, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400"
      >
        <Icon className="h-3 w-3 text-teal-400/80" />
        {label}
      </label>
      {children}
      <div className="min-h-[18px] relative w-full">
        <AnimatePresence mode="wait">
          {touched && error && (
            <motion.p
              key="error"
              id={`${id}-error`}
              role="alert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 text-xs text-red-400 font-medium absolute top-0 left-0"
            >
              <XCircle className="h-3 w-3 shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LoginForm({ role, allowRegistration = false }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [touched, setTouched] = useState({ email: false, password: false, name: false });
  const [shakeError, setShakeError] = useState(false);

  // Verification & CAPTCHA states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [mfaCodeHint, setMfaCodeHint] = useState("");
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useCurrentUser();
  const redirectUrl = searchParams.get("redirect") || `/portal/${role}`;

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const verificationCodeId = useId();

  useEffect(() => {
    if (searchParams.get("signup") === "true") setIsLogin(false);
    const err = searchParams.get("error");
    if (err) setApiError(err);
  }, [searchParams]);

  useEffect(() => {
    setApiError(null);
    setSuccessMessage(null);
    setTouched({ email: false, password: false, name: false });
    setFormData({ email: "", password: "", name: "" });
    setIsPasswordVisible(false);
    setIsVerifying(false);
    setRequiresCaptcha(false);
    setCaptchaPassed(false);
    setVerificationCode("");
  }, [isLogin]);

  useEffect(() => {
    if (!isLoading && user) {
      router.push(`/portal/${user.role}`);
    }
  }, [user, isLoading, router]);

  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password, isLogin);
  const nameError = !isLogin ? validateName(formData.name) : null;
  const strength = getPasswordStrength(formData.password);

  const isFormValid = !emailError && !passwordError && (isLogin || !nameError);

  const handleBlur = (field: "email" | "password" | "name") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (apiError) setApiError(null);
  };

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, name: true });
    if (!isFormValid) { triggerShake(); return; }
    setApiError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { 
            email: formData.email, 
            password: formData.password, 
            role,
            captchaToken: captchaPassed ? "dealflow-secure-captcha-pass-token" : undefined
          }
        : { email: formData.email, password: formData.password, name: formData.name, role };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        if (data.requiresVerification) {
          setSuccessMessage(data.message);
          setVerificationEmail(formData.email);
          setIsVerifying(true);
          setMfaCodeHint(data.verificationCode || "123456");
        } else {
          setSuccessMessage(isLogin ? "Welcome back! Redirecting…" : "Account created! Redirecting…");
          setTimeout(() => { window.location.replace(redirectUrl); }, 800);
        }
      } else {
        if (data.requiresCaptcha) {
          setRequiresCaptcha(true);
        }
        if (data.requiresVerification) {
          setVerificationEmail(formData.email);
          setIsVerifying(true);
          setMfaCodeHint(data.verificationCode || "123456");
        }
        setApiError(data.error || "An error occurred. Please try again.");
        triggerShake();
      }
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setApiError("Please enter a valid 6-digit verification code.");
      triggerShake();
      return;
    }
    setApiError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail || formData.email, code: verificationCode }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Account verified! Redirecting...");
        setTimeout(() => { window.location.replace(redirectUrl); }, 800);
      } else {
        setApiError(data.error || "Verification failed. Please check the code.");
        triggerShake();
      }
    } catch {
      setApiError("Network error. Please check your connection.");
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleColors: Record<UserRole, { accent: string; glow: string; badge: string }> = {
    admin: { accent: "from-teal-500 to-cyan-500", glow: "shadow-teal-500/25", badge: "border-teal-500/25 text-teal-400 bg-teal-500/8" },
    agent: { accent: "from-violet-500 to-purple-500", glow: "shadow-violet-500/25", badge: "border-violet-500/25 text-violet-400 bg-violet-500/8" },
    customer: { accent: "from-teal-500 to-emerald-500", glow: "shadow-teal-500/25", badge: "border-teal-500/25 text-teal-400 bg-teal-500/8" },
  };
  const rc = roleColors[role] || roleColors.customer;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
      <MeshBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl mx-4 my-8"
      >
        {/* ── Card shell ── */}
        <div className="rounded-3xl overflow-hidden border border-white/[0.07] shadow-[0_50px_100px_rgba(0,0,0,0.7)] bg-slate-900/80 backdrop-blur-2xl flex flex-col lg:flex-row min-h-[620px]">

          {/* ════════════════════════════════════════
              LEFT — Hero panel (desktop only)
          ════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d1117] to-slate-950">
            {/* Subtle decorative orbs */}
            <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" aria-hidden />
            <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-violet-600/12 blur-[80px] pointer-events-none" aria-hidden />
            {/* Edge shimmer */}
            <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" aria-hidden />

            <div className="relative z-10 flex flex-col h-full p-10">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex items-center gap-3 mb-12"
              >
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="absolute inset-0 rounded-lg bg-teal-500/20 blur-sm" />
                  <div className="relative h-6 w-6 rounded-md bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <span className="font-mono text-sm font-bold tracking-[0.15em] text-slate-300 uppercase">
                  DEALFLOW<span className="text-teal-400">.AI</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-teal-300">
                    Revenue Intelligence Platform
                  </span>
                </div>
                <h1 className="text-[2.2rem] font-extrabold leading-[1.15] mb-4">
                  <span className="text-white">AI Agents That</span>
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #7c3aed 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Close Deals.
                  </span>
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  From ICP to closed deal — AI agents with persistent memory, autonomous outreach, and real-time GTM intelligence.
                </p>
              </motion.div>

              {/* Feature list */}
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="space-y-3 mb-10"
              >
                {features.map(({ icon: Icon, text, sub }, i) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.35 }}
                    className="flex items-start gap-3 group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-white/6 group-hover:border-teal-500/30 group-hover:bg-teal-500/8 transition-all duration-300">
                      <Icon className="h-3.5 w-3.5 text-teal-400" />
                    </div>
                    <div className="pt-0.5">
                      <div className="text-sm text-slate-200 font-medium leading-none mb-1">{text}</div>
                      <div className="text-[11px] text-slate-500">{sub}</div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                {heroStats.map((stat, i) => (
                  <StatCard key={stat.label} stat={stat} delay={0.7 + i * 0.1} />
                ))}
              </div>

              {/* Trust footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="mt-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/6 text-xs text-slate-500">
                  <Shield className="h-3.5 w-3.5 text-teal-500/70" />
                  Enterprise-grade security · SOC 2 audit in progress · GDPR compliant
                </div>
              </motion.div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT — Auth form
          ════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-10">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div className="relative flex h-7 w-7 items-center justify-center">
                <div className="relative h-5 w-5 rounded-md bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="font-mono text-sm font-bold tracking-[0.15em] text-slate-300 uppercase">
                DEALFLOW<span className="text-teal-400">.AI</span>
              </span>
            </div>

            {/* Role badge */}
            <div className="mb-6">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-widest",
                rc.badge
              )}>
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </span>
            </div>

            {/* Tab switcher */}
            {allowRegistration && (
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="flex rounded-2xl bg-slate-800/80 border border-white/6 p-1 mb-7"
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setIsLogin((v) => !v);
                    setTimeout(() => {
                      const buttons = e.currentTarget.querySelectorAll("button");
                      const nextBtn = Array.from(buttons).find((b) => b.getAttribute("aria-selected") === "true");
                      (nextBtn as HTMLElement)?.focus();
                    }, 50);
                  }
                }}
              >
                {[
                  { id: "login", label: "Sign In" },
                  { id: "signup", label: "Create Account" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={isLogin === (id === "login")}
                    onClick={() => setIsLogin(id === "login")}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                      isLogin === (id === "login")
                        ? cn("bg-gradient-to-r text-white shadow-lg", rc.accent, rc.glow)
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-h" : "signup-h"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {isLogin ? "Welcome back 👋" : "Join DealFlow AI"}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {isLogin
                    ? `Sign in to your ${role} portal to continue`
                    : "Create your account and supercharge your GTM motion"}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* API Error */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/6 px-4 py-3 flex items-start gap-3"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-medium">{apiError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/6 px-4 py-3 flex items-center gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-300 font-medium">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {isVerifying ? (
              <motion.form
                onSubmit={handleVerifySubmit}
                noValidate
                className="space-y-4"
                animate={shakeError ? { x: [0, -7, 7, -5, 5, -2, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={verificationCodeId}
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      <Shield className="h-3.5 w-3.5 text-teal-400/80" />
                      MFA Verification Code
                    </label>
                    {mfaCodeHint && (
                      <button
                        type="button"
                        id="verification-code-hint-btn"
                        title="Click to auto-paste verification code"
                        onClick={() => {
                          const sanitizedCode = mfaCodeHint.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(sanitizedCode);
                          if (apiError) setApiError(null);
                        }}
                        className="relative group flex items-center gap-1.5 text-[11px] font-mono font-bold text-teal-300 bg-teal-500/15 border border-teal-400/40 hover:border-teal-400/80 hover:bg-teal-500/25 px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      >
                        {/* Animated pulse ring */}
                        <span className="absolute inset-0 rounded-lg animate-ping opacity-20 bg-teal-400 pointer-events-none" />
                        <span className="relative z-10 tracking-widest">{mfaCodeHint}</span>
                        <span className="relative z-10 text-teal-400/70 text-[10px] font-sans font-semibold normal-case tracking-normal">↵ tap to fill</span>
                      </button>
                    )}
                  </div>
                  <AuthInput
                    id={verificationCodeId}
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    disabled={isSubmitting}
                    required
                    className="text-center text-lg font-bold tracking-[0.5em] focus:tracking-[0.5em]"
                  />
                  <p className="text-xs text-slate-400 leading-normal">
                    Enter the 6-digit verification code sent to <strong>{verificationEmail || formData.email}</strong> to activate your customer account.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || verificationCode.length !== 6}
                    className={cn(
                      "w-full relative flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white",
                      "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                      "disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r hover:brightness-110 active:scale-[0.98]",
                      rc.accent,
                      rc.glow
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Account…</span>
                      </>
                    ) : (
                      <>
                        <span>Activate & Log In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Did not get the code?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifying(false);
                      setSuccessMessage(null);
                      setApiError(null);
                    }}
                    className="font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Back to Register
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
                animate={shakeError ? { x: [0, -7, 7, -5, 5, -2, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Name — signup only */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Field id={nameId} label="Full Name" icon={User} error={nameError} touched={touched.name}>
                        <AuthInput
                          id={nameId}
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          onBlur={() => handleBlur("name")}
                          placeholder="Jane Smith"
                          disabled={isSubmitting}
                          required={!isLogin}
                          autoComplete="name"
                          aria-invalid={touched.name && !!nameError}
                          aria-describedby={touched.name && nameError ? `${nameId}-error` : undefined}
                          hasError={touched.name && !!nameError}
                          isValid={touched.name && !nameError}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <Field id={emailId} label="Email Address" icon={Mail} error={emailError} touched={touched.email}>
                  <AuthInput
                    id={emailId}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="you@company.com"
                    disabled={isSubmitting}
                    required
                    autoComplete="email"
                    aria-invalid={touched.email && !!emailError}
                    aria-describedby={touched.email && emailError ? `${emailId}-error` : undefined}
                    hasError={touched.email && !!emailError}
                    isValid={touched.email && !emailError}
                  />
                </Field>

                {/* Password */}
                <Field id={passwordId} label="Password" icon={Lock} error={passwordError} touched={touched.password}>
                  <div className="relative">
                    <AuthInput
                      id={passwordId}
                      type={isPasswordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                      disabled={isSubmitting}
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      aria-invalid={touched.password && !!passwordError}
                      aria-describedby={
                        touched.password && passwordError
                          ? `${passwordId}-error`
                          : !isLogin
                          ? `${passwordId}-strength`
                          : undefined
                      }
                      hasError={touched.password && !!passwordError}
                      isValid={touched.password && !passwordError}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 transition-colors"
                      aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                      {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength */}
                  <AnimatePresence>
                    {!isLogin && formData.password && (
                      <motion.div
                        id={`${passwordId}-strength`}
                        role="region"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden pt-2"
                        aria-label={`Password strength: ${strength.label}`}
                      >
                        <div className="flex gap-1 mb-1" aria-hidden>
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-300",
                                i <= strength.score ? strength.bg : "bg-slate-700/60"
                              )}
                            />
                          ))}
                        </div>
                        {strength.label && (
                          <p className={cn("text-[11px] font-semibold", strength.color)}>
                            {strength.label}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Field>

                {/* Forgot password */}
                {isLogin && (
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => router.push("/auth/forgot-password")}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 rounded transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {/* CAPTCHA Safeguard validation checkbox */}
                {isLogin && requiresCaptcha && (
                  <div className="flex items-center gap-3 p-3 px-4 rounded-xl bg-slate-800/50 border border-teal-500/20 my-2">
                    <input
                      type="checkbox"
                      id="captcha-checkbox"
                      checked={captchaPassed}
                      onChange={(e) => setCaptchaPassed(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 focus:ring-opacity-25 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="captcha-checkbox" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
                      Verify you are human (SafeGuard Check)
                    </label>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    id="auth-submit-btn"
                    disabled={isSubmitting || !!successMessage}
                    className={cn(
                      "w-full relative flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white",
                      "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      "shadow-xl",
                      !isSubmitting && !successMessage && cn(
                        "bg-gradient-to-r hover:brightness-110 active:scale-[0.98]",
                        rc.accent,
                        rc.glow
                      ),
                      isSubmitting || successMessage ? "bg-slate-700" : ""
                    )}
                  >
                    {/* Shimmer overlay */}
                    {!isSubmitting && !successMessage && (
                      <span className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] -translate-x-full hover:translate-x-full transition-transform duration-700" />
                      </span>
                    )}
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isLogin ? "Signing in…" : "Creating account…"}</span>
                      </>
                    ) : successMessage ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Success!</span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? "Sign In" : "Create Account"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* Toggle mode */}
            {allowRegistration && !isVerifying && (
              <p className="mt-6 text-center text-sm text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin((v) => !v)}
                  className="font-semibold text-teal-400 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 rounded transition-colors inline-flex items-center gap-0.5"
                >
                  {isLogin ? "Sign up free" : "Sign in"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </p>
            )}

            {/* Divider + social proof */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-600">
              <span>Trusted by 500+ GTM teams</span>
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {["#7c3aed","#0891b2","#0d9488"].map((c, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border-2 border-slate-900 ring-0"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span>+497 others</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
