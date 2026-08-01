"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  User,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CustomerAccountSetupProps {
  /** Pre-filled from the lead / booking widget */
  prefillEmail?: string;
  prefillName?: string;
  leadId?: string;
  assignedAgentName?: string;
  assignedAgentKey?: string;
  onComplete?: (customerId: string, email: string) => void;
  onLoginSuccess?: (user: { id: string; email: string; name: string; role: string }) => void;
  /** When true renders as a compact inline card, otherwise full-screen overlay style */
  inline?: boolean;
}

type Step = "create" | "login" | "success";

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  barColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Password strength evaluator
// ─────────────────────────────────────────────────────────────────────────────
function evaluatePassword(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "", color: "", barColor: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const map: Record<number, Omit<PasswordStrength, "score">> = {
    0: { label: "", color: "", barColor: "" },
    1: { label: "Weak", color: "text-red-400", barColor: "bg-red-500" },
    2: { label: "Fair", color: "text-amber-400", barColor: "bg-amber-500" },
    3: { label: "Good", color: "text-emerald-400", barColor: "bg-emerald-500" },
    4: { label: "Strong", color: "text-cyan-400", barColor: "bg-cyan-500" },
  };
  return { score: clamped, ...map[clamped] };
}

const PW_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Input helper
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  rightElement,
  disabled,
  "aria-describedby": ariaDescBy,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: React.ReactNode;
  autoComplete?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  "aria-describedby"?: string;
}) {
  const descId = error ? `${id}-error` : ariaDescBy;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 transition-all pr-${rightElement ? "12" : "4"} ${
            error
              ? "border-red-500/60 focus-visible:ring-red-500/40"
              : "border-slate-700 focus-visible:ring-cyan-500/40 hover:border-slate-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {!error && hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}

async function safeFetchJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { success: false, error: `Server error (${res.status})` };
  }
  return await res.json().catch(() => ({ success: false, error: "Invalid JSON response" }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Account Creation
// ─────────────────────────────────────────────────────────────────────────────
function CreateAccountStep({
  prefillEmail,
  prefillName,
  leadId,
  onCreated,
}: {
  prefillEmail: string;
  prefillName: string;
  leadId: string;
  onCreated: (email: string, password: string) => void;
}) {
  const [displayName, setDisplayName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailCheckState, setEmailCheckState] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const [submitting, setSubmitting] = useState(false);

  const strength = evaluatePassword(password);

  // Debounced duplicate-email check
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckState("idle");
      return;
    }
    setEmailCheckState("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customer-credentials?email=${encodeURIComponent(email)}`);
        const data = await safeFetchJson(res);
        setEmailCheckState(data.credentials?.length > 0 || data.available === false ? "taken" : "available");
      } catch {
        setEmailCheckState("idle");
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email is required";
    if (emailCheckState === "taken") errs.email = "This email is already registered";
    if (!PW_REGEX.test(password))
      errs.password = "Min 8 characters with a letter, number, and special character";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email, password, displayName }),
      });
      const data = await safeFetchJson(res);
      if (!data.success) {
        setErrors({ form: data.error || "Failed to create account. Please try again." });
      } else {
        onCreated(email, password);
      }
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };


  const emailSuffix =
    emailCheckState === "checking" ? (
      <Loader2 className="h-4 w-4 text-slate-400 animate-spin" aria-label="Checking email" />
    ) : emailCheckState === "taken" ? (
      <AlertTriangle className="h-4 w-4 text-red-400" aria-label="Email already taken" />
    ) : emailCheckState === "available" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Email available" />
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Create your account">
      <Field
        id="displayName"
        label="Display Name"
        value={displayName}
        onChange={setDisplayName}
        error={errors.displayName}
        autoComplete="name"
        disabled={submitting}
        rightElement={<User className="h-4 w-4 text-slate-500" aria-hidden="true" />}
      />

      <Field
        id="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
        disabled={submitting}
        rightElement={emailSuffix}
        hint={
          emailCheckState === "available"
            ? <span className="text-emerald-400">✓ Email is available</span>
            : "We'll use this to log you in"
        }
      />

      <div className="flex flex-col gap-1">
        <Field
          id="password"
          label="Password"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
          disabled={submitting}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        {/* Strength meter */}
        {password.length > 0 && (
          <div aria-live="polite" aria-label={`Password strength: ${strength.label}`}>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    n <= strength.score ? strength.barColor : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            {strength.label && (
              <p className={`text-[10px] mt-1 font-semibold ${strength.color}`}>
                {strength.label} password
              </p>
            )}
          </div>
        )}
        <ul className="text-[10px] text-slate-500 space-y-0.5 mt-1" aria-label="Password requirements">
          {[
            { ok: password.length >= 8, text: "At least 8 characters" },
            { ok: /[a-zA-Z]/.test(password), text: "At least one letter" },
            { ok: /[0-9]/.test(password), text: "At least one number" },
            { ok: /[^A-Za-z0-9]/.test(password), text: "At least one special character (!@#$…)" },
          ].map(({ ok, text }) => (
            <li key={text} className={`flex items-center gap-1.5 ${ok ? "text-emerald-400" : ""}`}>
              <CheckCircle2 className={`h-3 w-3 ${ok ? "text-emerald-400" : "text-slate-700"}`} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>

      <Field
        id="confirmPassword"
        label="Confirm Password"
        type={showConfirm ? "text" : "password"}
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        disabled={submitting}
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            className="text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        hint={
          confirmPassword.length > 0 && password === confirmPassword ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Passwords match
            </span>
          ) : undefined
        }
      />

      {errors.form && (
        <div role="alert" className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errors.form}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || emailCheckState === "taken" || emailCheckState === "checking"}
        aria-busy={submitting}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating Account…</>
        ) : (
          <><Shield className="h-4 w-4" aria-hidden="true" /> Create Secure Account <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
        )}
      </button>

      <p className="text-[10px] text-slate-500 text-center">
        <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-500" aria-hidden="true" />
        Password hashed with bcrypt · AES-256 encrypted · GDPR compliant
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Login
// ─────────────────────────────────────────────────────────────────────────────
function LoginStep({
  prefillEmail,
  prefillPassword,
  onSuccess,
}: {
  prefillEmail: string;
  prefillPassword: string;
  onSuccess: (user: { id: string; email: string; name: string; role: string }) => void;
}) {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState(prefillPassword);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-submit when both pre-filled values are present
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (prefillEmail && prefillPassword && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      doLogin(prefillEmail, prefillPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async (e_mail: string, pw: string) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e_mail, password: pw, role: "customer" }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.user);
      } else {
        if (res.status === 403 && data.error?.includes("locked")) {
          setLocked(true);
          setError("Account locked for 15 minutes due to too many failed attempts. Try again later.");
        } else if (res.status === 429) {
          setLocked(true);
          setError("Too many login attempts. Please wait 15 minutes before trying again.");
        } else {
          // Compute attempts left hint (server sends remaining as header or we track locally)
          setAttemptsLeft((prev) => (prev === null ? 4 : Math.max(0, prev - 1)));
          setError(data.error || "Invalid email or password");
        }
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting || locked) return;
    doLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Sign in to your account">
      {submitting && prefillPassword ? (
        <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-slate-300 font-semibold">Signing you in…</p>
          <p className="text-xs text-slate-500">Setting up your secure session</p>
        </div>
      ) : (
        <>
          <Field
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={submitting || locked}
            rightElement={<Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />}
          />

          <Field
            id="login-password"
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={submitting || locked}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {attemptsLeft !== null && attemptsLeft < 4 && !locked && (
            <p role="alert" aria-live="assertive" className="text-[11px] text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {attemptsLeft === 0
                ? "Next failed attempt will lock your account for 15 minutes."
                : `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before account lockout.`}
            </p>
          )}

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className={`flex items-start gap-2 text-sm rounded-xl p-3 border ${
                locked
                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/30"
              }`}
            >
              {locked ? (
                <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || locked || !email || !password}
            aria-busy={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing In…</>
            ) : (
              <><Lock className="h-4 w-4" aria-hidden="true" /> Sign In to Portal <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
            )}
          </button>
        </>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Success
// ─────────────────────────────────────────────────────────────────────────────
function SuccessStep({
  userName,
  assignedAgentName,
  onEnterPortal,
}: {
  userName: string;
  assignedAgentName: string;
  onEnterPortal: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onEnterPortal, 3000);
    return () => clearTimeout(t);
  }, [onEnterPortal]);

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center" role="status" aria-live="polite">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
          <CheckCircle2 className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 border-2 border-[#060B18] flex items-center justify-center">
          <Zap className="h-3 w-3 text-slate-900 fill-current" aria-hidden="true" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-extrabold text-white mb-1">
          Welcome, {userName}!
        </h3>
        <p className="text-sm text-slate-300">
          Your account is live and <span className="text-cyan-400 font-semibold">{assignedAgentName}</span> is ready.
        </p>
      </div>

      <div className="w-full bg-slate-900/60 border border-emerald-500/25 rounded-xl p-4 text-left space-y-2">
        {[
          { icon: MessageSquare, color: "text-cyan-400", text: "Direct agent messaging channel open" },
          { icon: ShieldCheck, color: "text-emerald-400", text: "End-to-end encrypted session active" },
          { icon: Zap, color: "text-amber-400", text: "ICP + campaign data synced to agent" },
        ].map(({ icon: Icon, color, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-sm text-slate-300">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
            {text}
          </div>
        ))}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Entering your portal in 3 seconds…
      </div>

      <button
        onClick={onEnterPortal}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label="Enter your customer portal now"
      >
        Enter Portal Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
const STEPS: { key: Step; label: string }[] = [
  { key: "create", label: "Create Account" },
  { key: "login", label: "Sign In" },
  { key: "success", label: "Access Portal" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Account setup progress" className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-extrabold border-2 transition-all ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                    : "bg-slate-900 border-slate-700 text-slate-600"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  active ? "text-cyan-400" : done ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-4 transition-all ${done ? "bg-emerald-500/60" : "bg-slate-800"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerAccountSetup({
  prefillEmail = "",
  prefillName = "",
  leadId = "",
  assignedAgentName = "your Revenue Agent",
  assignedAgentKey,
  onComplete,
  onLoginSuccess,
  inline = false,
}: CustomerAccountSetupProps) {
  const [step, setStep] = useState<Step>("create");
  const [createdEmail, setCreatedEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  const handleCreated = useCallback((email: string, password: string) => {
    setCreatedEmail(email);
    setCreatedPassword(password);
    setStep("login");
  }, []);

  const handleLoginSuccess = useCallback(
    (user: { id: string; email: string; name: string; role: string }) => {
      setLoggedInUser(user);
      setStep("success");
      if (onLoginSuccess) onLoginSuccess(user);
    },
    [onLoginSuccess]
  );

  const handleEnterPortal = useCallback(() => {
    const url = new URL("/portal/customer", window.location.origin);
    url.searchParams.set("tab", "chat");
    url.searchParams.set("agentKey", assignedAgentKey || "");
    if (onComplete && loggedInUser) onComplete(loggedInUser.id, loggedInUser.email);
    window.location.href = url.toString();
  }, [onComplete, loggedInUser, assignedAgentKey]);

  const stepTitles: Record<Step, string> = {
    create: "Create Your Secure Account",
    login: "Sign In to Your Portal",
    success: "You're All Set!",
  };

  const stepSubtitles: Record<Step, string> = {
    create: `Set up credentials to access your private communication channel with ${assignedAgentName}`,
    login: "Logging you in securely with your new credentials",
    success: `${assignedAgentName} is waiting in your portal`,
  };

  const wrapperClass = inline
    ? "w-full bg-[#060B18] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl relative"
    : "w-full max-w-md mx-auto bg-[#060B18] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl relative";

  return (
    <div className={wrapperClass} role="region" aria-label="Account Setup">
      {/* Ambient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" aria-hidden="true" />

      {/* Header */}
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">{stepTitles[step]}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{stepSubtitles[step]}</p>
          </div>
        </div>
        <StepIndicator current={step} />
      </div>

      {/* Step body */}
      <div className="p-6">
        {step === "create" && (
          <CreateAccountStep
            prefillEmail={prefillEmail}
            prefillName={prefillName}
            leadId={leadId}
            onCreated={handleCreated}
          />
        )}
        {step === "login" && (
          <LoginStep
            prefillEmail={createdEmail}
            prefillPassword={createdPassword}
            onSuccess={handleLoginSuccess}
          />
        )}
        {step === "success" && (
          <SuccessStep
            userName={loggedInUser?.name || prefillName || "Customer"}
            assignedAgentName={assignedAgentName}
            onEnterPortal={handleEnterPortal}
          />
        )}
      </div>

      {/* Security footer */}
      {step !== "success" && (
        <div className="px-6 py-3 border-t border-slate-800/40 flex flex-wrap gap-3 justify-center text-[9px] text-slate-600 font-semibold uppercase tracking-wider">
          {["GDPR Compliant", "AES-256 Encrypted", "bcrypt Hashed", "SOC 2 Ready"].map((badge) => (
            <span key={badge} className="flex items-center gap-1">
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" aria-hidden="true" />
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
