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
      
      {/* ─── HERO SECTION: APPLE PRODUCT SHOWCASE + SAAS COMMAND CENTER ──────── */}
      <section id="hero" className="relative pt-12 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Minimalist Value Proposition */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Apple-style Pill Eyebrow */}
            <div className="apple-pill-badge">
              <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse" />
              <span>Revenue Intelligence Platform</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold leading-[1.08] tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              The AI Operating System for Revenue Teams.{" "}
              <span className="text-[#0071E3] dark:text-[#2997FF] block sm:inline">From ICP to closed deal.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              DealFlow AI deploys universal meeting bots and collaborative agents with persistent memory directly integrated with your CRM. Reclaim 60% of your sales reps&apos; calendar with automated calls, standups, 15-minute MOM emails, and outreach sequences.
            </p>

            {/* Apple-Style Pill CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/portal"
                onClick={() => trackEvent("cta_landing_portal", { surface: "hero" })}
                className="btn-apple-primary inline-flex items-center gap-2 text-sm font-semibold shadow-md transition-all"
              >
                Launch Portals
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                href="#gtm-assessment"
                className="btn-apple-secondary inline-flex items-center gap-2 text-sm font-semibold shadow-sm transition-all"
              >
                <Target className="h-4 w-4 text-[#0071E3]" />
                Go to Market Assessment
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
              >
                View Pricing <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            {/* Trust Markers */}
            <div className="pt-2 flex items-center gap-3 flex-wrap text-xs text-[#86868B]">
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#34C759]" /> SOC 2 Type II In Progress
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#32ADE6]" /> GDPR Ready
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#34C759]" /> 14-Day Free Trial
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
                      DEALFLOW TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#86868B]">Live Control Center</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#34C759]/15 border border-[#34C759]/30 text-[#248A3D] dark:text-[#30D158] text-[10px] font-semibold flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  ONLINE
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
                    {tab}
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
                          <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Pipeline Velocity Index</span>
                          <span className="text-[#34C759] font-bold">+34.2% MoM</span>
                        </div>
                        <div className="h-2 w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#0071E3] rounded-full w-[82%]" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#86868B] pt-1">
                          <span>Active Deals: $4.2M</span>
                          <span>Conversion Rate: 31.8%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08]">
                          <span className="text-[10px] text-[#86868B] block">Deal Acceleration</span>
                          <strong className="text-sm font-bold text-[#1D1D1F] dark:text-white">+28.4%</strong>
                        </div>
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08]">
                          <span className="text-[10px] text-[#86868B] block">Rep Hours Saved</span>
                          <strong className="text-sm font-bold text-[#0071E3] dark:text-[#2997FF]">18.5 hrs/wk</strong>
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
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">Dealflow Meeting Bot</p>
                            <p className="text-[10px] text-[#86868B]">Universal Zoom/Teams/Meet Audio</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#32ADE6] bg-[#32ADE6]/10 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#1D1D1F] dark:text-white">Auto-Generated 15-Min MOM:</p>
                        <p>&quot;Client confirmed enterprise budget approval for Q3. Next step: security review sync.&quot;</p>
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
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">Stalled Deal Watchdog</p>
                            <p className="text-[10px] text-[#86868B]">Latency Spike Detection</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                          Intervention Ready
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#FF3B30]">Trigger Fired: Acme Corp Deal</p>
                        <p>No response in 72h after proposal sent. Auto-queued personalized warm re-engagement.</p>
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
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">Autonomous Outreach Fleet</p>
                            <p className="text-[10px] text-[#86868B]">FAPO Multi-Agent Sequences</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                          Dispatched
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                        <p className="font-semibold text-[#1D1D1F] dark:text-white">ALMA Self-Supervised Optimization:</p>
                        <p>240 tailored enterprise touches delivered with 41.2% reply rate.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Telemetry Strip */}
                <div className="pt-3 flex justify-between items-center text-[10px] text-[#86868B] border-t border-black/[0.06] dark:border-white/[0.08]">
                  <span>AES-256 BYOK Encryption</span>
                  <span className="text-[#0071E3] dark:text-[#2997FF] font-semibold">HubSpot & Salesforce Synced</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── MODULAR BENTO SUITE: REVENUE OPERATING SYSTEM ───────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="apple-pill-badge">
            <span>Revenue Operating System</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            Four interconnected roles for full-funnel velocity.
          </h2>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm sm:text-base leading-relaxed">
            Eliminate pipeline leakage by giving your revenue motion an autonomous control system.
          </p>
        </div>

        {/* 4 Connected Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Card 1: Capture Every Signal */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#32ADE6]/15 text-[#0071A4] dark:text-[#64D2FF] flex items-center justify-center font-bold">
                <Database className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#0071A4] dark:text-[#64D2FF] uppercase tracking-wider">1. CAPTURE EVERY SIGNAL</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Eliminate CRM Drudgery</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Universal Dealflow Meeting Bot transcribes client calls, standups, dispatches 15-min MOM emails, and syncs Salesforce/HubSpot logs automatically.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#0071A4] dark:text-[#64D2FF] font-semibold">
              <span>✓ Salesforce Synced</span>
              <span>✓ HubSpot Synced</span>
            </div>
          </div>

          {/* Card 2: Unstick Stalled Motion */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FF3B30]/15 text-[#D70015] dark:text-[#FF453A] flex items-center justify-center font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#D70015] dark:text-[#FF453A] uppercase tracking-wider">2. UNSTICK STALLED MOTION</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Rescue Stalled Deals</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Proactive triggers alert revenue agents the instant pipeline deals stall or decision-maker response latency spikes.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#D70015] dark:text-[#FF453A] font-semibold">
              <span>Active Triggers:</span>
              <span className="animate-pulse">● OUTREACH QUEUED</span>
            </div>
          </div>

          {/* Card 3: Deploy Specialized Agents */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] flex items-center justify-center font-bold">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#248A3D] dark:text-[#30D158] uppercase tracking-wider">3. DEPLOY SPECIALIZED AGENTS</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Fleet of GTM Agents</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Orchestrate meeting bots, outbound campaign playbooks, BYOK key management, and pre-meeting executive dossiers.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#248A3D] dark:text-[#30D158] font-semibold">
              <span>Average Win Rate:</span>
              <span>+22% Growth</span>
            </div>
          </div>

          {/* Card 4: Keep Trust & Compliance */}
          <div className="apple-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#5856D6]/15 text-[#4341A8] dark:text-[#5E5CE6] flex items-center justify-center font-bold">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#4341A8] dark:text-[#5E5CE6] uppercase tracking-wider">4. TRUST & COMPLIANCE</span>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Enterprise Firewall</h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  AES-256 encrypted BYOK key vaults, isolated client session data flows, and continuous compliance audit trails.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-[10px] text-[#4341A8] dark:text-[#5E5CE6] font-semibold">
              <span>SOC 2 Type II</span>
              <span>GDPR Ready</span>
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
              <span>GTM Assessment Wizard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight leading-tight">
              Map your motion. We&apos;ll show you what&apos;s next.
            </h2>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm leading-relaxed">
              Complete the questionnaire below to configure your custom revenue intelligence model and generate tailored outbound pipelines in real time.
            </p>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 text-xs shadow-sm">
              <span className="font-semibold text-[#1D1D1F] dark:text-white block">What you receive:</span>
              <ul className="space-y-2 text-[#6E6E73] dark:text-[#A1A1A6]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#0071E3]" /> ICP & Persona Breakdown</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#32ADE6]" /> Custom Campaign Playbook</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#34C759]" /> Instant CRM Workflow Blueprint</li>
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
                <span>FAPO Engine Simulator</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                Fully Autonomous Prompt Optimization.
              </h2>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] text-sm leading-relaxed">
                Don&apos;t spend hours trying to fine-tune sales templates manually. Our FAPO algorithms run recursive generation, evaluation, and comparison cycles to output outreach copy that converts 15-30% higher.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#1D1D1F] dark:text-white font-semibold" htmlFor="original-prompt-input">
                    Your Core Outreach Concept
                  </label>
                  <input
                    id="original-prompt-input"
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="e.g. Write an email selling software..."
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
                      Optimizing Sequences...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Simulate FAPO Optimization
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
                  <span className="text-[11px] font-mono text-[#86868B]">fapo-optimization-pipeline.log</span>
                </div>
                <span className="text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF]">12 Evaluation Criteria</span>
              </div>

              <div className="min-h-[220px] flex flex-col justify-center">
                {isOptimizing && (
                  <div className="space-y-3 font-mono text-xs text-[#0071E3] bg-[#F5F5F7] dark:bg-[#161618] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                    <p className="animate-pulse">→ Running FAPO iteration cycle...</p>
                    <p className="text-[#1D1D1F] dark:text-white font-bold">{optimizationStep}</p>
                  </div>
                )}

                {!isOptimizing && !optimizedResult && (
                  <div className="text-center py-10 text-[#86868B] space-y-2">
                    <Brain className="h-8 w-8 mx-auto text-[#86868B]" />
                    <p className="text-xs">Enter a concept and click simulate to view optimized sequence outputs.</p>
                  </div>
                )}

                {!isOptimizing && optimizedResult && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-[#F5F5F7] dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] p-4 rounded-2xl space-y-1.5 max-h-[200px] overflow-y-auto">
                      <span className="text-[9px] uppercase font-bold text-[#0071E3] dark:text-[#2997FF]">Optimized Delivery</span>
                      <pre className="font-mono text-[11px] text-[#1D1D1F] dark:text-white whitespace-pre-wrap leading-relaxed">
                        {optimizedResult}
                      </pre>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-2.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/30">
                        <span className="text-[9px] text-[#248A3D] dark:text-[#30D158] block font-semibold uppercase">Win Rate</span>
                        <strong className="text-[#248A3D] dark:text-[#30D158] text-xs font-bold">+28.4%</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#32ADE6]/15 border border-[#32ADE6]/30">
                        <span className="text-[9px] text-[#0071A4] dark:text-[#64D2FF] block font-semibold uppercase">Tokens Saved</span>
                        <strong className="text-[#0071A4] dark:text-[#64D2FF] text-xs font-bold">-14%</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#0071E3]/15 border border-[#0071E3]/30">
                        <span className="text-[9px] text-[#0071E3] dark:text-[#2997FF] block font-semibold uppercase">ICP Fit</span>
                        <strong className="text-[#0071E3] dark:text-[#2997FF] text-xs font-bold">98%</strong>
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
            Trusted by fast-growing revenue operations at scale
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
              &quot;DealFlow AI transformed our revenue operations. The universal Dealflow Meeting Bot handles client calls and dispatches 15-minute MOM emails automatically, driving over 91% alignment on deal action execution.&quot;
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
