"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IntakeForm } from "@/components/IntakeForm";
import {
  ArrowRight,
  Zap,
  Shield,
  Brain,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Database,
  Cpu,
  Target,
  Rocket,
  BarChart2,
  RefreshCw,
  Users,
  Activity,
  Terminal,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { PLANS, CONVERSION_RATES } from "@/lib/pricing";

// ─── Floating Orb (Vibrant Cosmic Accents) ───────────────────────────────────
const FloatingOrb = React.memo(function FloatingOrb({
  className,
  delay = 0,
  color,
}: {
  className?: string;
  delay?: number;
  color: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-35 pointer-events-none ${className}`}
      style={{ background: color }}
      animate={{
        y: [0, -40, 0],
        x: [0, 20, 0],
        scale: [1, 1.15, 1],
        opacity: [0.25, 0.45, 0.25],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
});

const renderFeatureText = (text: string) => {
  if (text.includes("ALMA")) {
    return (
      <span className="relative inline-block group">
        <Link
          href="/features#alma"
          className="underline decoration-dotted decoration-teal-400/50 hover:text-teal-300 transition-colors cursor-help"
        >
          {text}
        </Link>
        <span className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-xl bg-slate-950 border border-white/10 text-[11px] normal-case tracking-normal leading-relaxed text-slate-350 shadow-xl z-55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <strong className="text-teal-455 block mb-1">ALMA (Agent Learning & Memory Architecture)</strong>
          Our proprietary self-supervised AI engine that fine-tunes email templates and outreach logic based on actual sales success rates in your CRM.
        </span>
      </span>
    );
  }
  return text;
};

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  // FAPO Simulator States
  const [originalPrompt, setOriginalPrompt] = useState("Write a cold email to sell my marketing software.");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState("");
  const [optimizedResult, setOptimizedResult] = useState<string | null>(null);

  // Pricing States
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP" | "CAD" | "INR">("USD");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Currency Formatter helper
  const formatCurrency = (amount: number, currencyCode: string) => {
    const localeMap: Record<string, string> = {
      USD: "en-US",
      EUR: "de-DE",
      GBP: "en-GB",
      CAD: "en-CA",
      INR: "en-IN",
    };
    const convertedAmount = amount * CONVERSION_RATES[currencyCode];
    return new Intl.NumberFormat(localeMap[currencyCode] || "en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
  };

  // Run mock FAPO Optimization
  const handleFapoOptimize = () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptimizedResult(null);
    setOptimizationStep("Analyzing prompt structure & tone...");

    setTimeout(() => {
      setOptimizationStep("Injecting target company ICP attributes...");
      setTimeout(() => {
        setOptimizationStep("Synthesizing multi-model prompt variants...");
        setTimeout(() => {
          setOptimizationStep("Evaluating against 12 historical success criteria...");
          setTimeout(() => {
            setOptimizedResult(
              `Subject: Solving conversion bottlenecks for Stark Industries?\n\nHi Tony,\n\nI noticed Stark Industries is scaling target aerospace acquisitions but experiencing bottleneck delays in CRM logging.\n\nOur specialized AI revenue agents update Salesforce automatically based on your real calling activity, saving 6+ hours weekly...`
            );
            setIsOptimizing(false);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <main className="min-h-screen text-white bg-[#060612] relative overflow-hidden font-sans" suppressHydrationWarning>
      {/* ─── DYNAMIC COLORFUL BACKGROUND ORBS ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(108,59,255,0.18),transparent_60%)]" />

        <FloatingOrb className="w-[500px] h-[500px] top-[10%] -left-[10%] opacity-20" color="radial-gradient(circle, #7c3aed 0%, transparent 70%)" delay={0} />
        <FloatingOrb className="w-[450px] h-[450px] top-[30%] -right-[10%] opacity-25" color="radial-gradient(circle, #06b6d4 0%, transparent 70%)" delay={2} />
        <FloatingOrb className="w-[400px] h-[400px] bottom-[20%] left-[25%] opacity-20" color="radial-gradient(circle, #ec4899 0%, transparent 70%)" delay={4} />
      </div>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section id="hero" className="relative z-10 pt-28 pb-16 flex flex-col items-center justify-center text-center px-6 max-w-7xl mx-auto">
        {isClient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 text-violet-300 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(124,58,237,0.15)]"
          >
            <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-spin" />
            Pipeline Orchestration OS
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isClient ? 1 : 0, y: isClient ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8 bg-gradient-to-r from-white via-[#C8B8FF] to-cyan-300 bg-clip-text text-transparent"
        >
          Close more deals.
          <br />
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(20,184,166,0.2)]">
            Let the agents do it.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isClient ? 1 : 0, y: isClient ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl text-slate-300 text-base sm:text-lg leading-relaxed mb-10"
        >
          DealFlow AI deploys universal meeting bots and collaborative agents with persistent memory directly integrated with your CRM. Reclaim 60% of your sales reps&apos; calendar by automating client calls, team standups, 15-minute MOM emails, and outreach sequences.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isClient ? 1 : 0, y: isClient ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-6"
        >
          <Link
            href="/portal"
            onClick={() => trackEvent("cta_landing_portal", { surface: "hero" })}
            className="group relative inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-500 hover:from-teal-500 hover:to-cyan-400 text-white font-bold text-sm transition-all duration-300 shadow-xl shadow-teal-500/20 hover:-translate-y-0.5"
          >
            Launch Portals
            <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#gtm-assessment"
            className="group inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl bg-[#0d0d21] border border-violet-500/30 hover:border-violet-500/60 text-slate-100 font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-violet-500/5"
          >
            Go to Market Assessment
            <Target className="h-4.5 w-4.5 text-violet-400" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            View Pricing
          </a>
        </motion.div>
        
        <span className="text-xs text-slate-500 tracking-wide mb-12">
          SOC 2 Type II audit in progress · GDPR ready · 14-day trial period · Instant results
        </span>
      </section>

      {/* ─── GTM ASSESSMENT INTAKE FORM ─────────────────────────────────────── */}
      <section id="gtm-assessment" className="relative z-10 py-24 px-6 max-w-6xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" /> GTM Assessment
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white leading-tight">
              Assess your Go to Market potential.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-light">
              Complete the questionnaire to configure the AI model and generate tailored, real-time go-to-market pipelines.
            </p>
          </div>

          <div className="lg:col-span-8 bg-slate-950/60 border border-white/10 rounded-2xl p-6 shadow-xl">
            <IntakeForm />
          </div>
        </div>
      </section>

      {/* ─── WHY REVENUE LEADERS CHOOSE US (BENTO GRID) ─────────────────────── */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-[#08081a]/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.02),transparent)] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <span className="eyebrow-violet mb-3">Enterprise Value</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why revenue teams choose DealFlow AI
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
              We isolate and automate the administrative load so your sellers can concentrate on building client relations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Box 1: CRM Updates (2/3 width) */}
            <div className="md:col-span-8 group relative p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-teal-950/20 via-black/40 to-transparent hover:border-teal-500/30 bento-glow transition-all duration-500 flex flex-col justify-between min-h-[250px]">
              <div className="df-specular" />
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-500/10 text-teal-400 mb-4 border border-teal-500/20">
                  <Database className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Eliminate CRM Drudgery</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Our universal Dealflow Meeting Bot automatically transcribes client check-ins, standups, and onboarding calls, dispatches 15-minute MOM HTML emails, and updates Salesforce or HubSpot CRM logs.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
                  ✓ Salesforce Synced
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                  ✓ HubSpot Synced
                </span>
              </div>
            </div>

            {/* Box 2: Deal Alerts (1/3 width) */}
            <div className="md:col-span-4 group relative p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-amber-950/20 via-black/40 to-transparent hover:border-amber-500/30 bento-glow transition-all duration-500 flex flex-col justify-between min-h-[250px]">
              <div className="df-specular" />
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                  <TrendingUp className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Rescue Stalled Deals</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Proactive triggers alert agents the moment a pipeline opportunity stalls or decision-maker response latency spikes.
                </p>
              </div>
              <div className="mt-6 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Active Triggers:</span>
                <span className="text-amber-400 font-bold animate-pulse">● OUTREACH QUEUED</span>
              </div>
            </div>

            {/* Box 3: Agent Orchestration (1/3 width) */}
            <div className="md:col-span-4 group relative p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-violet-950/20 via-black/40 to-transparent hover:border-violet-500/30 bento-glow transition-all duration-500 flex flex-col justify-between min-h-[250px]">
              <div className="df-specular" />
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 mb-4 border border-violet-500/20">
                  <Cpu className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fleet of Specialized Agents</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Orchestrate the Dealflow Meeting Bot alongside specialized agents for client calls, internal team standups, BYOK API key management, and pre-meeting dossiers.
                </p>
              </div>
              <div className="mt-6">
                <span className="text-[10px] font-mono text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Average Win Rate: +22%
                </span>
              </div>
            </div>

            {/* Box 4: Security Compliance (2/3 width) */}
            <div className="md:col-span-8 group relative p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-rose-950/20 via-black/40 to-transparent hover:border-rose-500/30 bento-glow transition-all duration-500 flex flex-col justify-between min-h-[250px]">
              <div className="df-specular" />
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
                  <Shield className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">GDPR & Compliance Firewall</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Enterprise-grade security and AES-256 encrypted BYOK API key management. Every meeting access is audited, and client data flows are isolated and compliant (SOC 2 Type II audit in progress).
                </p>
              </div>
              <div className="mt-6 flex justify-between items-center flex-wrap gap-4 text-[10px] font-mono">
                <div className="flex gap-2">
                  <span className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded text-slate-400">SOC 2 Type II (Audit in Progress)</span>
                  <span className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded text-slate-400">GDPR Compliant</span>
                </div>
                <span className="text-rose-400 flex items-center gap-1">🔒 Full Session Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAPO SIMULATOR SECTION ─────────────────────────────────────────── */}
      {isClient && (
        <section id="fapo" className="relative z-10 py-24 px-6 max-w-6xl mx-auto border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="eyebrow-amber">
                <Rocket className="h-3.5 w-3.5" />
                FAPO Engine Simulator
              </span>
              <h2 className="text-4xl font-extrabold text-white">
                Fully Autonomous Prompt Optimization
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Don&apos;t spend hours trying to fine-tune sales templates manually. Our FAPO algorithms run recursive generation, evaluation, and comparison cycles to output outreach copy that converts 15-30% higher.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold" htmlFor="original-prompt-input">
                    Your Core Outreach Concept
                  </label>
                  <input
                    id="original-prompt-input"
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="e.g. Write an email selling software..."
                    className="w-full bg-slate-950 border border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all duration-200"
                  />
                </div>

                <button
                  onClick={handleFapoOptimize}
                  disabled={isOptimizing}
                  className="w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-500 hover:from-violet-500 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-teal-400" />
                      Optimizing Prompts...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Simulate FAPO Optimization
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Console / Output Window */}
            <div className="relative rounded-3xl border border-white/10 border-t-2 border-t-violet-500/80 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950/95 to-violet-950/20 p-5 shadow-2xl min-h-[300px] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                <Terminal className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-500">fapo-execution-stream.log</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {isOptimizing && (
                  <div className="space-y-3 font-mono text-[10px] text-teal-400 bg-black/40 p-4 rounded-xl border border-teal-500/10">
                    <p className="animate-pulse">→ Running FAPO iteration cycle...</p>
                    <p className="text-slate-300">{optimizationStep}</p>
                  </div>
                )}

                {!isOptimizing && !optimizedResult && (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Brain className="h-10 w-10 text-slate-700 mx-auto" />
                    <p className="text-xs">Enter a concept and launch optimization above to start the simulator.</p>
                  </div>
                )}

                {!isOptimizing && optimizedResult && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl space-y-2 max-h-[220px] overflow-y-auto">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Optimized Sequence</p>
                      <pre className="font-mono text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {optimizedResult}
                      </pre>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-center rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase">Win Rate Prob</span>
                        <strong className="text-emerald-400 text-xs font-mono">+28.4%</strong>
                      </div>
                      <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-center rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase">Tokens Saved</span>
                        <strong className="text-cyan-400 text-xs font-mono">-14%</strong>
                      </div>
                      <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-center rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase">ICP Fit Rating</span>
                        <strong className="text-violet-400 text-xs font-mono">98%</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── SOCIAL PROOF SECTION ───────────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-[#08081a]/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-10 font-bold">
            Trusted by fast-growing revenue operations at scale
          </p>
          
          {/* Logo Strip with Glassmorphic Elements */}
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-40 hover:opacity-60 transition-opacity duration-300 mb-16">
            <span className="text-lg font-black tracking-tight text-white font-sans">
              stripe
            </span>
            <span className="text-lg font-black tracking-tight text-white font-sans">
              vercel
            </span>
            <span className="text-lg font-black tracking-tight text-white font-sans">
              hubspot
            </span>
            <span className="text-lg font-black tracking-tight text-white font-sans italic">
              salesforce
            </span>
            <span className="text-lg font-black tracking-tight text-white font-sans">
              snowflake
            </span>
          </div>

          {/* Testimonial Quote in Glassmorphic Card */}
          <div className="relative p-8 md:p-12 rounded-[2rem] border border-white/5 bg-slate-950/40 backdrop-blur-md max-w-3xl mx-auto shadow-2xl shadow-violet-500/5 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
            <div className="absolute -top-4 -left-2 text-8xl text-teal-500/10 font-serif select-none pointer-events-none">“</div>
            
            <p className="text-base md:text-lg text-slate-300 italic font-light leading-relaxed mb-8 relative z-10">
              &quot;DealFlow AI transformed our revenue operations. The universal Dealflow Meeting Bot handles client calls and dispatches 15-minute MOM emails automatically, driving over 91% alignment on deal action execution.&quot;
            </p>
            <div className="relative z-10">
              <strong className="text-white text-sm block tracking-wide">Sarah Jenkins</strong>
              <span className="text-xs text-slate-500 font-medium">VP of Revenue Operations, TechScale</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ───────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 border-t border-white/5 flex flex-col justify-center">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <span className="eyebrow-amber mb-3">Pricing Options</span>
            <h2 className="text-4xl font-extrabold text-white">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-sm mt-2">Start free for 14 days. No credit card required.</p>

            {/* billing toggler and currency */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
              <div className="flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${!isAnnual ? "text-teal-400 font-bold" : "text-slate-500"}`}>Monthly</span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="relative w-12 h-6 bg-slate-900 border border-white/10 rounded-full transition-colors flex items-center p-0.5 cursor-pointer"
                  aria-label="Toggle annual pricing"
                >
                  <motion.div
                    className="w-4.5 h-4.5 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-full"
                    animate={{ x: isClient && isAnnual ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                </button>
                <span className={`text-xs font-semibold ${isAnnual ? "text-teal-400 font-bold" : "text-slate-500"} flex items-center gap-1`}>
                  Annually
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                    Save 20%
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Currency:</span>
                <div className="flex bg-slate-900 border border-white/10 rounded-full p-0.5">
                  {(["USD", "EUR", "GBP", "CAD", "INR"] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${
                        currency === curr
                          ? "bg-gradient-to-r from-teal-500 to-cyan-400 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {PLANS.map((plan) => {
              const isPopular = plan.popular;
              const isEnterprise = plan.price === null;
              const priceVal = isEnterprise
                ? "Custom"
                : isClient
                  ? formatCurrency(isAnnual ? plan.price!.annual : plan.price!.monthly, currency)
                  : isAnnual ? `$${plan.price!.annual}` : `$${plan.price!.monthly}`;

              return (
                <div
                  key={plan.name}
                  className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isPopular
                      ? "border-violet-500/40 bg-gradient-to-b from-violet-950/20 to-[#070716] shadow-xl shadow-violet-500/10 hover:-translate-y-1 hover:border-violet-500/60"
                      : "border-white/5 bg-gradient-to-b from-slate-900/40 to-teal-950/5 hover:-translate-y-1 hover:border-teal-500/25 hover:bg-slate-900/60"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <div className={`${isPopular ? "text-violet-400" : "text-slate-400"} text-[10px] font-bold uppercase tracking-widest mb-1`}>
                        {plan.name}
                      </div>
                      <div className="text-3xl font-bold text-white font-mono">
                        {priceVal}
                        {!isEnterprise && <span className="text-lg text-slate-500 font-medium">/mo</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {isEnterprise ? "Custom parameters" : isAnnual ? "Billed annually" : "Billed monthly"}
                      </p>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed min-h-[36px] font-light">
                      {plan.description}
                    </p>

                    <div className="border-t border-white/10 my-4" />

                    <ul className="space-y-3">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPopular ? "text-violet-400" : "text-teal-400"}`} />
                          <span className={`text-xs font-light ${f.included ? "text-slate-300" : "text-slate-600 line-through"}`}>
                            {renderFeatureText(f.text)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 space-y-3">
                    <Link
                      href={isEnterprise ? "/book-demo" : "/portal/customer/login?signup=true"}
                      className={`w-full h-11 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                        isPopular
                          ? "bg-violet-600 hover:bg-violet-500 text-white"
                          : "border border-white/10 bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                    <span className="text-[9px] text-slate-500 text-center block font-light">
                      No credit card required · Cancel anytime
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </main>
  );
}
