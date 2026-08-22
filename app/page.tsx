// app/page.tsx
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
  RefreshCw,
  Users,
  Activity,
  Terminal,
  Bot,
  AlertCircle,
  FileText,
  Clock,
  Radio,
  Check,
  ChevronRight,
  Lock,
  Layers,
  BarChart3,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { PLANS, CONVERSION_RATES } from "@/lib/pricing";
import { IconDealflowLogo } from "@/components/gtm/GtmIcons";

/**
 * Apple Minimalist + Modern SaaS Dashboard Design System
 * - Apple Canvas: #FBFBFD (Light) / #000000 (OLED Dark)
 * - Apple Blue: #0071E3 (Light) / #2997FF (Dark)
 * - System Mint: #34C759
 * - System Cyan: #32ADE6
 * - System Amber: #FF9500
 * - System Coral: #FF3B30
 * - Frosted Liquid Acrylic: backdrop-blur-2xl with hairline borders
 */

const renderFeatureText = (text: string) => {
  if (text.includes("ALMA")) {
    return (
      <span className="relative inline-block group">
        <Link
          href="/features#alma"
          className="underline decoration-dotted decoration-[#0071E3] hover:text-[#0071E3] transition-colors cursor-help font-medium"
        >
          {text}
        </Link>
        <span className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-[11px] normal-case tracking-normal leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6] shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <strong className="text-[#0071E3] dark:text-[#2997FF] block mb-1">ALMA (Agent Learning & Memory Architecture)</strong>
          Our proprietary self-supervised AI engine that fine-tunes email templates and outreach logic based on actual sales success rates in your CRM.
        </span>
      </span>
    );
  }
  return text;
};

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  // SaaS Telemetry Widget Active Tab
  const [telemetryTab, setTelemetryTab] = useState<"velocity" | "meeting" | "watchdog" | "outreach">("velocity");

  // FAPO Simulator States
  const [originalPrompt, setOriginalPrompt] = useState("Write a cold email to sell my enterprise marketing software.");
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
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[#FBFBFD] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors font-sans selection:bg-[#0071E3]/20" suppressHydrationWarning>
      
      {/* ─── HERO SECTION: AUTONOMOUS AI WORKFORCE COMMAND CENTER ──────── */}
      <section id="hero" className="relative pt-12 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Autonomous Workforce Value Proposition */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Apple-style Pill Eyebrow */}
            <div className="apple-pill-badge">
              <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse" />
              <span>Autonomous AI Sales & Business Workforce</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[60px] font-bold leading-[1.08] tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              The Autonomous AI Workforce That{" "}
              <span className="text-[#0071E3] dark:text-[#2997FF] block sm:inline">Actually Does the Work.</span>
            </h1>

            {/* Core Positioning Subtitle */}
            <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              DealFlow.ai is an autonomous AI workforce that doesn&apos;t just recommend what your business should do &mdash; it actually does the work. You provide the business goal, and our AI agents autonomously discover prospects, research pain points, join sales calls as AI human representatives, negotiate within boundaries, close deals, and execute agreed customer requirements end-to-end.
            </p>

            {/* Apple-Style Pill CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/portal/customer/login?signup=true"
                onClick={() => trackEvent("cta_landing_portal", { surface: "hero" })}
                className="btn-apple-primary inline-flex items-center gap-2 text-sm font-semibold shadow-md transition-all"
              >
                Deploy AI Workforce
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                href="#gtm-assessment"
                className="btn-apple-secondary inline-flex items-center gap-2 text-sm font-semibold shadow-sm transition-all"
              >
                <Target className="h-4 w-4 text-[#0071E3]" />
                Define Business Goal
              </Link>

              <Link
                href="/features"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
              >
                Explore Architecture <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="pt-2 flex items-center gap-3 flex-wrap text-xs text-[#86868B]">
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#34C759]" /> SOC 2 Type II In Progress
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#32ADE6]" /> Boundary-Enforced Negotiation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#34C759]" /> End-to-End Requirement Delivery
              </span>
            </div>

          </div>

          {/* Right Column: Live SaaS Telemetry Command Center Widget */}
          <div className="lg:col-span-5 relative">
            <div className="apple-glass-card p-6 sm:p-7 rounded-3xl space-y-5">
              
              {/* Widget Header & Segmented Switcher */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center shadow-sm">
                    <IconDealflowLogo className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-white tracking-tight block">
                      DEALFLOW WORKFORCE TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#86868B]">Autonomous Agents Live Status</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#34C759]/15 border border-[#34C759]/30 text-[#248A3D] dark:text-[#30D158] text-[10px] font-semibold flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  AUTONOMOUS FLEET ACTIVE
                </span>
              </div>

              {/* Segmented Control Selector */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.06] rounded-full border border-black/[0.04] dark:border-white/[0.06]">
                {(["velocity", "meeting", "watchdog", "outreach"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTelemetryTab(tab)}
                    className={`py-1.5 text-[10px] font-semibold rounded-full capitalize transition-all ${
                      telemetryTab === tab
                        ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                        : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    {tab === "velocity" ? "Velocity" : tab === "meeting" ? "AI Call Rep" : tab === "watchdog" ? "Negotiate" : "Prospecting"}
                  </button>
                ))}
              </div>

              {/* Dynamic Telemetry Display Pane */}
              <div className="min-h-[220px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {telemetryTab === "velocity" && (
                    <motion.div
                      key="velocity"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Autonomous Execution Index</span>
                          <span className="text-[#34C759] font-bold">+41.8% Velocity</span>
                        </div>
                        <div className="h-2 w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#0071E3] rounded-full w-[88%]" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#86868B] pt-1">
                          <span>Active Deals in Negotiation: $4.2M</span>
                          <span>Closed & Executed: 34 Deals</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08]">
                          <span className="text-[10px] text-[#86868B] block">AI Call Win Rate</span>
                          <strong className="text-sm font-bold text-[#1D1D1F] dark:text-white">44.2%</strong>
                        </div>
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08]">
                          <span className="text-[10px] text-[#86868B] block">Autonomous Hours Saved</span>
                          <strong className="text-sm font-bold text-[#0071E3] dark:text-[#2997FF]">24.5 hrs/wk</strong>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {telemetryTab === "meeting" && (
                    <motion.div
                      key="meeting"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#32ADE6]/15 text-[#0071A4] dark:text-[#64D2FF] flex items-center justify-center font-bold">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">AI Sales Representative</p>
                            <p className="text-[10px] text-[#86868B]">Live Video/Audio Meeting Participant</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#32ADE6] bg-[#32ADE6]/10 px-2 py-0.5 rounded-full">
                          On Live Call
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#1D1D1F] dark:text-white">Live Objection Handling & Discovery:</p>
                        <p>&quot;Prospect inquired about ISO 27001 compliance. AI rep verified certifications and negotiated standard 14-day SLA terms.&quot;</p>
                      </div>
                    </motion.div>
                  )}

                  {telemetryTab === "watchdog" && (
                    <motion.div
                      key="watchdog"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#FF3B30]/15 text-[#D70015] dark:text-[#FF453A] flex items-center justify-center font-bold">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">Autonomous Negotiation Engine</p>
                            <p className="text-[10px] text-[#86868B]">Boundary & Contract Structuring</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                          Boundary Enforced
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#0071E3] dark:text-[#2997FF]">Automated Contract Proposal:</p>
                        <p>Structured $74,000 annual term within approved 12% discount ceiling. Sent to buyer with auto-provisions.</p>
                      </div>
                    </motion.div>
                  )}

                  {telemetryTab === "outreach" && (
                    <motion.div
                      key="outreach"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] flex items-center justify-center font-bold">
                            <Rocket className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">Autonomous Prospecting Fleet</p>
                            <p className="text-[10px] text-[#86868B]">Pain Point Scraping & Multichannel</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                          Actively Sourcing
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#1D1D1F] dark:text-white">ALMA Continuous Self-Learning:</p>
                        <p>580 prospect requirements analyzed &bull; 46.8% positive engagement rate &bull; 18 discovery calls booked.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Telemetry Strip */}
                <div className="pt-3 flex justify-between items-center text-[10px] text-[#86868B] border-t border-black/[0.06] dark:border-white/[0.08]">
                  <span>AES-256 BYOK Encryption</span>
                  <span className="text-[#0071E3] dark:text-[#2997FF] font-semibold">CRM & ERP Auto-Synchronized</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 10-STEP CORE JOURNEY VISUAL STRIP ───────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="apple-pill-badge">
            <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
            <span>End-to-End Autonomous Journey</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            How DealFlow.ai Executes Your Business Goal
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
            From initial objective intake to closing deals, executing requirements, and continuous self-improvement.
          </p>
        </div>

        {/* 10-Step Horizontal Scrollable / Responsive Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {[
            { step: "1", title: "Business Goal", desc: "You set target & boundaries", color: "border-blue-500/30 text-blue-500" },
            { step: "2", title: "AI Understands", desc: "Parses ICP & strategy", color: "border-cyan-500/30 text-cyan-500" },
            { step: "3", title: "Finds Prospects", desc: "Scrapes & identifies buyers", color: "border-teal-500/30 text-teal-500" },
            { step: "4", title: "Engages", desc: "Multichannel sequences", color: "border-emerald-500/30 text-emerald-500" },
            { step: "5", title: "Joins Calls", desc: "Live AI human rep", color: "border-indigo-500/30 text-indigo-500" },
            { step: "6", title: "Understands Pain", desc: "Deep technical discovery", color: "border-purple-500/30 text-purple-500" },
            { step: "7", title: "Sells & Negotiates", desc: "Handles objections", color: "border-amber-500/30 text-amber-500" },
            { step: "8", title: "Closes Deals", desc: "Secures contract & terms", color: "border-emerald-500/30 text-emerald-500" },
            { step: "9", title: "Executes Work", desc: "Delivers requirements", color: "border-blue-500/30 text-blue-500" },
            { step: "10", title: "Improves", desc: "ALMA continuous learning", color: "border-violet-500/30 text-violet-500" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 flex flex-col justify-between transition-all hover:border-[#0071E3]/40"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-black/[0.02] dark:bg-white/[0.04] ${item.color}`}>
                  {item.step}
                </span>
                {idx < 9 && <ChevronRight className="h-3 w-3 text-slate-400 hidden lg:block opacity-40" />}
              </div>
              <div>
                <strong className="text-xs font-bold text-[#1D1D1F] dark:text-white block leading-tight">
                  {item.title}
                </strong>
                <span className="text-[10px] text-[#86868B] leading-tight block mt-0.5">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MODULAR BENTO SUITE: 4 AUTONOMOUS WORKFORCE PILLARS ───────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="apple-pill-badge">
            <span>Autonomous Workforce Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            Four interconnected pillars. Complete execution.
          </h2>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm sm:text-base leading-relaxed">
            Eliminate manual friction by deploying an autonomous AI workforce that moves prospects through every stage of the customer lifecycle.
          </p>
        </div>

        {/* 4 Connected Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Card 1: Autonomous Prospect Discovery */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#32ADE6]/15 text-[#0071A4] dark:text-[#64D2FF] flex items-center justify-center font-bold">
                <Database className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#0071A4] dark:text-[#64D2FF] uppercase tracking-wider">1. PROSPECT DISCOVERY & RESEARCH</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Autonomous Research</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  AI agents continuously identify high-intent target accounts, extract technical pain points, and map key decision-makers based on your business goal.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#0071A4] dark:text-[#64D2FF] font-semibold">
              <span>✓ ICP Auto-Extraction</span>
              <span>✓ Pain Point Mapping</span>
            </div>
          </div>

          {/* Card 2: AI Call Representative */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] flex items-center justify-center font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#248A3D] dark:text-[#30D158] uppercase tracking-wider">2. AI SALES CALL REPRESENTATIVE</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Live Call Representation</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  AI human representatives join live Zoom, Teams, and Meet sessions to run product discovery, answer technical questions, and resolve objections.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#248A3D] dark:text-[#30D158] font-semibold">
              <span>Live Video & Voice</span>
              <span>Real-Time Objections</span>
            </div>
          </div>

          {/* Card 3: Boundary-Enforced Negotiation */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FF3B30]/15 text-[#D70015] dark:text-[#FF453A] flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#D70015] dark:text-[#FF453A] uppercase tracking-wider">3. NEGOTIATE & CLOSE DEALS</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Autonomous Deal Closure</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Agents navigate pricing terms and contract clauses within your strict commercial boundaries, drafting agreements and closing deals autonomously.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#D70015] dark:text-[#FF453A] font-semibold">
              <span>Boundary Safeguards</span>
              <span>Auto-Contracting</span>
            </div>
          </div>

          {/* Card 4: Requirement Execution & ALMA */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#5856D6]/15 text-[#4341A8] dark:text-[#5E5CE6] flex items-center justify-center font-bold">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#4341A8] dark:text-[#5E5CE6] uppercase tracking-wider">4. POST-SALE EXECUTION & ALMA</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Requirement Fulfillment</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Post-sale agents orchestrate delivery on agreed client deliverables, track business milestones, and continuously improve models using ALMA.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#4341A8] dark:text-[#5E5CE6] font-semibold">
              <span>Deliverable Sync</span>
              <span>ALMA Self-Learning</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── GTM ASSESSMENT INTAKE FORM SECTION ─────────────────────────────── */}
      <section id="gtm-assessment" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-4 space-y-5 text-left">
            <div className="apple-pill-badge">
              <Target className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Define Business Objective</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight leading-tight">
              Set your business goal. Your AI workforce executes it.
            </h2>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm leading-relaxed">
              Complete the intake questionnaire below to define your business objective, commercial boundaries, and target criteria. DealFlow.ai immediately deploys autonomous agents to find prospects, engage, sell, and execute.
            </p>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 text-xs shadow-sm">
              <span className="font-semibold text-[#1D1D1F] dark:text-white block">What happens next:</span>
              <ul className="space-y-2 text-[#6E6E73] dark:text-[#A1A1A6]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#0071E3]" /> Autonomous Prospect Identification</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#32ADE6]" /> AI Call Representative Assignment</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#34C759]" /> End-to-End Requirement Fulfillment</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8">
            <IntakeForm />
          </div>

        </div>
      </section>
          
      {/* ─── FAPO SIMULATOR SECTION: DEVELOPER PLAYGROUND CONSOLE ───────────── */}
      {isClient && (
        <section id="fapo" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="apple-pill-badge">
                <Rocket className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>Autonomous Reasoning Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                Fully Autonomous Negotiation & Outreach Optimization.
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm leading-relaxed">
                DealFlow.ai doesn&apos;t just generate templates &mdash; it runs recursive simulation and multi-model evaluation cycles to synthesize conversational strategies, handle objections, and negotiate within your defined commercial boundaries.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#1D1D1F] dark:text-white font-semibold" htmlFor="original-prompt-input">
                    Your Business Goal or Value Proposition
                  </label>
                  <input
                    id="original-prompt-input"
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="e.g. Sell our enterprise cloud security platform to mid-market fintechs..."
                    className="w-full bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 rounded-2xl px-4 py-3 text-xs text-[#1D1D1F] dark:text-white focus:outline-none transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={handleFapoOptimize}
                  disabled={isOptimizing}
                  className="w-full btn-apple-primary py-3 px-6 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Synthesizing Strategy...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Simulate Autonomous Execution
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Developer Console Output Card */}
            <div className="lg:col-span-7 apple-glass-card p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#0071E3]" />
                  <span className="text-[11px] font-mono text-[#86868B]">autonomous-workforce-orchestration.log</span>
                </div>
                <span className="text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF]">12 Boundary Constraints</span>
              </div>

              <div className="min-h-[220px] flex flex-col justify-center">
                {isOptimizing && (
                  <div className="space-y-3 font-mono text-xs text-[#0071E3] bg-[#F5F5F7] dark:bg-[#161618] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                    <p className="animate-pulse">→ Orchestrating autonomous workforce execution cycle...</p>
                    <p className="text-[#1D1D1F] dark:text-white font-bold">{optimizationStep}</p>
                  </div>
                )}

                {!isOptimizing && !optimizedResult && (
                  <div className="text-center py-10 text-[#86868B] space-y-2">
                    <Brain className="h-8 w-8 mx-auto text-[#86868B]" />
                    <p className="text-xs">Enter your business goal and simulate to view autonomous prospect engagement & negotiation output.</p>
                  </div>
                )}

                {!isOptimizing && optimizedResult && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-[#F5F5F7] dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] p-4 rounded-2xl space-y-1.5 max-h-[200px] overflow-y-auto">
                      <span className="text-[9px] uppercase font-bold text-[#0071E3] dark:text-[#2997FF]">Autonomous Execution Output</span>
                      <pre className="font-mono text-[11px] text-[#1D1D1F] dark:text-white whitespace-pre-wrap leading-relaxed">
                        {optimizedResult}
                      </pre>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-2.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/30">
                        <span className="text-[9px] text-[#248A3D] dark:text-[#30D158] block font-semibold uppercase">Close Rate</span>
                        <strong className="text-[#248A3D] dark:text-[#30D158] text-xs font-bold">+34.2%</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#32ADE6]/15 border border-[#32ADE6]/30">
                        <span className="text-[9px] text-[#0071A4] dark:text-[#64D2FF] block font-semibold uppercase">Rep Time Saved</span>
                        <strong className="text-[#0071A4] dark:text-[#64D2FF] text-xs font-bold">24 hrs/wk</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#0071E3]/15 border border-[#0071E3]/30">
                        <span className="text-[9px] text-[#0071E3] dark:text-[#2997FF] block font-semibold uppercase">Execution Fit</span>
                        <strong className="text-[#0071E3] dark:text-[#2997FF] text-xs font-bold">99.4%</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ─── SOCIAL PROOF & INTEGRATIONS SECTION ────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center space-y-10">
          <p className="text-xs uppercase tracking-widest text-[#86868B] font-semibold">
            Trusted by fast-growing companies deploying autonomous AI workforces
          </p>
          
          {/* Logo Strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 opacity-60">
            <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">STRIPE</span>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">VERCEL</span>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">HUBSPOT</span>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">SALESFORCE</span>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">SNOWFLAKE</span>
          </div>

          {/* Testimonial Card */}
          <div className="apple-glass-card p-8 md:p-10 rounded-3xl max-w-2xl mx-auto text-center space-y-4 shadow-sm">
            <p className="text-base sm:text-lg text-[#1D1D1F] dark:text-white leading-relaxed font-normal">
              &quot;DealFlow.ai is the first platform where AI doesn&apos;t just give suggestions &mdash; its AI representatives joined our prospect calls, negotiated within our pricing guardrails, closed 40+ deals in Q3, and automated our customer requirement handoffs end-to-end.&quot;
            </p>
            <div>
              <strong className="text-xs font-bold text-[#1D1D1F] dark:text-white block">Sarah Jenkins</strong>
              <span className="text-[11px] text-[#86868B]">VP of Revenue Operations, TechScale</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="apple-pill-badge">
            <span>Pricing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            Simple, transparent pricing.
          </h2>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm">
            Start free for 14 days. No credit card required.
          </p>

          {/* Billing Toggle & Currency */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <div className="flex items-center gap-1 bg-[#F5F5F7] dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] p-1 rounded-full shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !isAnnual ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm" : "text-[#86868B]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isAnnual ? "bg-[#0071E3] text-white shadow-sm" : "text-[#86868B]"
                }`}
              >
                Annually
                <span className="px-1.5 py-0.2 rounded-full bg-[#34C759] text-white text-[9px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-[#86868B]">Currency:</span>
              <div className="flex bg-[#F5F5F7] dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] rounded-full p-1 shadow-sm">
                {(["USD", "EUR", "GBP", "CAD", "INR"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      currency === curr ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
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
                className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? "apple-glass-card border-2 border-[#0071E3] shadow-lg"
                    : "apple-glass-card"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-semibold uppercase tracking-wider shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <span className={`text-[11px] font-semibold uppercase tracking-widest block mb-1 ${isPopular ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]"}`}>
                      {plan.name}
                    </span>
                    <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white">
                      {priceVal}
                      {!isEnterprise && <span className="text-sm font-normal text-[#86868B]">/mo</span>}
                    </div>
                    <p className="text-[11px] text-[#86868B] mt-1">
                      {isEnterprise ? "Custom parameters" : isAnnual ? "Billed annually" : "Billed monthly"}
                    </p>
                  </div>

                  <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-4">
                    <ul className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPopular ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#34C759]"}`} />
                          <span className={f.included ? "text-[#1D1D1F] dark:text-white" : "text-[#86868B] line-through"}>
                            {renderFeatureText(f.text)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <Link
                    href={isEnterprise ? "/book-demo" : "/portal/customer/login?signup=true"}
                    className={`w-full h-10 flex items-center justify-center rounded-full font-semibold text-xs transition-all ${
                      isPopular
                        ? "btn-apple-primary"
                        : "btn-apple-secondary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <span className="text-[9px] text-[#86868B] text-center block">
                    No credit card required · Cancel anytime
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
