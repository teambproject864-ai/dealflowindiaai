"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  User,
  Mail,
  Zap,
  CalendarCheck,
  X,
  Check,
  HelpCircle,
} from "lucide-react";

interface PasswordCreationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  prefillEmail?: string;
  prefillName?: string;
  leadId?: string;
  optionSelected: "select-agent" | "book-call";
  assignedAgentName: string;
  assignedAgentKey: string;
  onSuccessRedirect?: (redirectUrl: string) => void;
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  barColor: string;
}

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

async function safeFetchJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { success: false, error: `Server response (${res.status}) is not JSON` };
  }
  return await res.json().catch(() => ({ success: false, error: "Failed to parse JSON response" }));
}

export function PasswordCreationModal({
  isOpen,
  onClose,
  prefillEmail = "",
  prefillName = "",
  leadId = "",
  optionSelected,
  assignedAgentName,
  assignedAgentKey,
  onSuccessRedirect,
}: PasswordCreationModalProps) {
  const [displayName, setDisplayName] = useState(prefillName || "Pipeline Client");
  const [email, setEmail] = useState(prefillEmail || "client@dealflow.ai");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [step, setStep] = useState<"input" | "confirm" | "submitting" | "success">("input");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailCheckState, setEmailCheckState] = useState<"idle" | "checking" | "taken" | "available">("idle");

  const modalRef = useRef<HTMLDivElement>(null);
  const strength = evaluatePassword(password);

  // Sync props when modal opens
  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillName) setDisplayName(prefillName);
  }, [prefillEmail, prefillName, isOpen]);

  // Debounced duplicate email check
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckState("idle");
      return;
    }
    setEmailCheckState("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customer-credentials?email=${encodeURIComponent(email)}`);
        const data = await safeFetchJson(res);
        setEmailCheckState(data.credentials?.length > 0 || data.available === false ? "taken" : "available");
      } catch {
        setEmailCheckState("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = "Display name is required.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (emailCheckState === "taken") {
      errs.email = "This email is already registered. Try another or sign in.";
    }

    if (!password) {
      errs.password = "Password cannot be empty.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    } else if (!PW_REGEX.test(password)) {
      errs.password = "Password must include at least one letter, one number, and one special character (!@#$…).";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Move to Confirmation Prompt step
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep("confirm");
    }
  };

  // Execute Submission & Progression
  const handleFinalSubmission = useCallback(async () => {
    setStep("submitting");
    setErrors({});

    try {
      // 1. Create Credentials
      const credRes = await fetch("/api/customer-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId || `lead-${Date.now()}`,
          email,
          password,
          name: displayName,
        }),
      });

      const credData = await safeFetchJson(credRes);
      if (!credRes.ok && !credData.success && credRes.status !== 409) {
        setErrors({ form: credData.error || "Failed to create account credentials." });
        setStep("input");
        return;
      }

      // 2. Authenticate & Create JWT Cookie
      const authRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "customer",
        }),
      });

      const authData = await safeFetchJson(authRes);
      if (!authRes.ok && !authData.success) {
        setErrors({ form: authData.error || "Account created, but automated login failed. Please sign in." });
        setStep("input");
        return;
      }

      setStep("success");


      // 3. Automated Progression / Redirection after brief success prompt
      const targetUrl = `/portal/customer?tab=chat&agentKey=${assignedAgentKey || "praneeth"}&option=${optionSelected}`;
      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      }, 2000);
    } catch {
      setErrors({ form: "Network error occurred during account creation. Please try again." });
      setStep("input");
    }
  }, [leadId, email, password, displayName, assignedAgentKey, optionSelected, onSuccessRedirect]);

  if (!isOpen) return null;

  const optionBadgeText =
    optionSelected === "select-agent"
      ? `Option 1 Completed: Agent Assigned (${assignedAgentName})`
      : `Option 2 Completed: Strategy Call Confirmed (${assignedAgentName})`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#060B18] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Ambient top bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" aria-hidden="true" />

        {/* ─── MODAL HEADER ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-2">
                {optionSelected === "select-agent" ? (
                  <Zap className="h-3 w-3 text-cyan-400" />
                ) : (
                  <CalendarCheck className="h-3 w-3 text-emerald-400" />
                )}
                {optionBadgeText}
              </div>

              <h2 id="password-modal-title" className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                Create Your Secure Password
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                To complete your workflow setup and progress to your dedicated pipeline workspace, please create your account credentials.
              </p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ─── MODAL BODY ───────────────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* STEP 1: PASSWORD & USER INPUT */}
          {step === "input" && (
            <form onSubmit={handleProceedToConfirmation} noValidate className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1">
                <label htmlFor="modal-name" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Full Name / Company Representative
                </label>
                <div className="relative">
                  <input
                    id="modal-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                    placeholder="Enter your name"
                  />
                  <User className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.displayName && <p className="text-[11px] text-red-400">{errors.displayName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="modal-email" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Email Address (Account Login)
                </label>
                <div className="relative">
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                    placeholder="your.email@company.com"
                  />
                  <Mail className="h-4 w-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.email && <p className="text-[11px] text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="modal-password" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Create Secure Password
                </label>
                <div className="relative">
                  <input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 transition-all pr-10 ${
                      errors.password
                        ? "border-red-500/60 focus-visible:ring-red-500/40"
                        : "border-slate-700 focus-visible:ring-cyan-500/40 hover:border-slate-600"
                    }`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" />{errors.password}</p>}

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            n <= strength.score ? strength.barColor : "bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={`text-[10px] mt-1 font-semibold ${strength.color}`}>
                        Password Strength: {strength.label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Password Complexity Checklist */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
                <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Complexity Requirements:
                </p>
                {[
                  { ok: password.length >= 8, text: "At least 8 characters long" },
                  { ok: /[a-zA-Z]/.test(password), text: "Contains at least one letter (a-z, A-Z)" },
                  { ok: /[0-9]/.test(password), text: "Contains at least one number (0-9)" },
                  { ok: /[^A-Za-z0-9]/.test(password), text: "Contains at least one special character (!@#$…)" },
                ].map(({ ok, text }) => (
                  <div key={text} className={`flex items-center gap-1.5 ${ok ? "text-emerald-400 font-semibold" : ""}`}>
                    <CheckCircle2 className={`h-3 w-3 shrink-0 ${ok ? "text-emerald-400" : "text-slate-700"}`} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="modal-confirm-password" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="modal-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 pr-10"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-400">{errors.confirmPassword}</p>}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match perfectly.
                  </p>
                )}
              </div>

              {errors.form && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Confirmation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* STEP 2: CONFIRMATION PROMPT */}
          {step === "confirm" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm">
                  <HelpCircle className="h-5 w-5" />
                  Confirm Account Registration
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are about to lock in your credentials for <strong className="text-white">{email}</strong> and proceed to the next pipeline workflow steps.
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <div className="flex justify-between">
                    <span>Selected Pathway:</span>
                    <span className="font-bold text-white uppercase">{optionSelected === "select-agent" ? "Option 1 — Agent Assigned" : "Option 2 — Call Booked"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Specialist:</span>
                    <span className="font-bold text-cyan-300">{assignedAgentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Email:</span>
                    <span className="font-bold text-slate-200">{email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Edit Password
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmission}
                  className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Confirm &amp; Register Account
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTING STATE */}
          {step === "submitting" && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center" role="status">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-white">Saving Password &amp; Authenticating Session…</p>
              <p className="text-xs text-slate-400">Encrypting credentials with bcrypt 12-round salt</p>
            </div>
          )}

          {/* STEP 4: SUCCESS & REDIRECT */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center gap-4 text-center animate-in zoom-in-95 duration-300" role="status">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Check className="h-8 w-8 text-white stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Password Created Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Credentials registered. Redirecting you to your pipeline workflow steps…
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Redirecting to Customer Portal Messenger…</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-center text-[10px] text-slate-500 flex justify-around">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> bcrypt Hashed</span>
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-cyan-400" /> Auto-Progress Enabled</span>
          <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-indigo-400" /> AES-256 Secured</span>
        </div>
      </div>
    </div>
  );
}
