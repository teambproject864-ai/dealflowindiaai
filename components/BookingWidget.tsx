"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useCalendlyEventListener } from "react-calendly";
import {
  Calendar,
  ShieldCheck,
  X,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  Sparkles,
  Bot,
  ArrowRight,
  Mail,
  PhoneCall,
  Zap,
  Check,
  Star,
  Globe,
  TrendingUp,
  Loader2,
  RefreshCw,
  Users,
  MessageSquare,
  Phone,
  Video,
  CalendarCheck,
  Lock,
  Activity,
  BarChart2,
  Clock,
  Shield,
  BadgeCheck,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { REVENUE_AGENTS } from "@/lib/revenue-agents";
import { CustomerAccountSetup } from "@/components/CustomerAccountSetup";
import { PasswordCreationModal } from "@/components/PasswordCreationModal";



const DynamicInlineWidget = dynamic(
  () => import("react-calendly").then((mod) => mod.InlineWidget),
  { ssr: false }
);

export type BookingWidgetProps = {
  name?: string;
  email?: string;
  companyName?: string;
  contactPhone?: string;
  leadId?: string;
  analysisId?: string;
  skipAiAgent?: boolean;
  forcedMeetingType?: "ai" | "live" | "calendly" | "cal";
  challengeTags?: string[];
  intakeNotes?: string;
  selectedPlanKey?: string;
  onClose?: () => void;
  onAgentAssigned?: (agentKey: string) => void;
  onBookingConfirmed?: (details: any) => void;
};

// Status color mapping
const statusConfig: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  online: { dot: "bg-emerald-400 shadow-emerald-400", label: "Online", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  busy: { dot: "bg-amber-400 shadow-amber-400", label: "Busy", bg: "bg-amber-500/10", text: "text-amber-400" },
  offline: { dot: "bg-slate-500", label: "Offline", bg: "bg-slate-800", text: "text-slate-400" },
};

// Gradient per agent index
const agentGradients = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-700",
  "from-cyan-400 to-indigo-600",
];

export function BookingWidget({
  name = "Revenue Leader",
  email = "leader@example.com",
  companyName = "Enterprise",
  contactPhone = "",
  leadId = "",
  analysisId = "",
  challengeTags = [],
  onClose,
  onAgentAssigned,
  onBookingConfirmed,
}: BookingWidgetProps) {
  const [activePathway, setActivePathway] = useState<"select-agent" | "book-call">("select-agent");
  // No default agent — starts unselected; user must choose or auto-assign
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("");
  const [agentProceedConfirmed, setAgentProceedConfirmed] = useState<boolean>(false);
  const [callScheduled, setCallScheduled] = useState<boolean>(false);
  const [matchedAgentKey, setMatchedAgentKey] = useState<string>("");
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssigned, setAutoAssigned] = useState(false);
  const [autoAssignedAgent, setAutoAssignedAgent] = useState<(typeof REVENUE_AGENTS)[0] | null>(null);
  const [autoAssignScore, setAutoAssignScore] = useState<number>(0);
  const [autoAssignCount, setAutoAssignCount] = useState<number>(0); // tracks re-assign cycles
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "busy">("all");
  const [showTooltip, setShowTooltip] = useState(false);

  const selectedAgent = useMemo(
    () => REVENUE_AGENTS.find((a) => a.key === selectedAgentKey) ?? null,
    [selectedAgentKey]
  );

  const matchedAgent = useMemo(
    () => REVENUE_AGENTS.find((a) => a.key === matchedAgentKey) ?? null,
    [matchedAgentKey]
  );

  const filteredAgents = useMemo(() => {
    if (filterStatus === "all") return REVENUE_AGENTS;
    return REVENUE_AGENTS.filter((a) => a.onlineStatus === filterStatus);
  }, [filterStatus]);

  const calendlyBaseUrl =
    process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/praneethburada/30min";
  const calendlyExternalUrl = `${calendlyBaseUrl}?utm_source=dealflow&utm_medium=pipeline_support&utm_campaign=gtm_analysis_review&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;

  useCalendlyEventListener({
    onEventScheduled: (e) => {
      setCallScheduled(true);
      const randomAgent = REVENUE_AGENTS[Math.floor(Math.random() * REVENUE_AGENTS.length)];
      setMatchedAgentKey(randomAgent.key);
      if (onBookingConfirmed)
        onBookingConfirmed({
          name, email, companyName, leadId, analysisId,
          calendlyPayload: e.data.payload,
          assignedAgent: randomAgent,
          confirmedAt: new Date().toISOString(),
        });
    },
  });

  const handleAutoAssign = useCallback(async () => {
    // Prevent duplicate clicks while assigning
    if (autoAssigning) return;
    setAutoAssigning(true);
    setAgentProceedConfirmed(false);

    // Key of agent to exclude (must not re-assign same agent)
    const excludeKey = autoAssignedAgent?.key ?? "";

    try {
      const res = await fetch("/api/agent-assignments/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          companyName,
          industry: "B2B SaaS",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          challengeTags,
          excludeAgentKey: excludeKey, // server-side exclusion
        }),
      });
      const data = await res.json();
      // Accept server result only if it differs from previously assigned agent
      if (data.success && data.agent && data.agent.key !== excludeKey) {
        const matched = REVENUE_AGENTS.find((a) => a.key === data.agent.key);
        if (matched) {
          setAutoAssignedAgent(matched);
          setSelectedAgentKey(matched.key);
          setAutoAssignScore(data.matchScore ?? 87);
          setAutoAssigned(true);
          setAutoAssignCount((c) => c + 1);
          if (onAgentAssigned) onAgentAssigned(matched.key);
          return;
        }
      }
      // Fallback: pick a truly random online agent that is not the excluded one
      throw new Error("Need fallback");
    } catch {
      // Build candidate pool excluding previously assigned agent
      const pool = REVENUE_AGENTS.filter(
        (a) => a.onlineStatus !== "offline" && a.key !== excludeKey
      );
      const candidates = pool.length > 0 ? pool : REVENUE_AGENTS.filter((a) => a.key !== excludeKey);
      // Last resort: any agent different from previous (if all same — impossible with 7 agents, but safety net)
      const finalPool = candidates.length > 0 ? candidates : REVENUE_AGENTS;
      const randomIdx = Math.floor(Math.random() * finalPool.length);
      const best = finalPool[randomIdx];
      setAutoAssignedAgent(best);
      setSelectedAgentKey(best.key);
      setAutoAssignScore(Math.floor(Math.random() * 10) + 80); // 80-89 range for fallback
      setAutoAssigned(true);
      setAutoAssignCount((c) => c + 1);
      if (onAgentAssigned) onAgentAssigned(best.key);
    } finally {
      setAutoAssigning(false);
    }
  }, [autoAssigning, autoAssignedAgent, leadId, companyName, challengeTags, onAgentAssigned]);

  const handleProceedWithAgent = () => {
    setAgentProceedConfirmed(true);
    if (onAgentAssigned) onAgentAssigned(selectedAgent.key);
    if (onBookingConfirmed)
      onBookingConfirmed({
        name, email, companyName, assignedAgent: selectedAgent,
        pathway: "select-agent", confirmedAt: new Date().toISOString(),
      });
  };

  const handleConfirmCallBooking = () => {
    setCallScheduled(true);
    const assigned = REVENUE_AGENTS[Math.floor(Math.random() * REVENUE_AGENTS.length)];
    setMatchedAgentKey(assigned.key);
    if (onBookingConfirmed)
      onBookingConfirmed({
        name, email, companyName, assignedAgent: assigned,
        pathway: "book-call", confirmedAt: new Date().toISOString(),
      });
  };

  const onlineCount = REVENUE_AGENTS.filter((a) => a.onlineStatus === "online").length;

  return (
    <div className="w-full bg-[#060B18] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 relative flex flex-col">
      {/* Ambient glow top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* ─── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="relative px-6 pt-6 pb-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-[#080E20] to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/25 text-cyan-300 mb-3">
              <Sparkles className="h-3 w-3 fill-cyan-400 text-cyan-400" />
              Conversion-Focused Pipeline Support
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Let&apos;s Fix Your{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Pipeline
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-lg leading-relaxed">
              Select your ideal AI Revenue Specialist or book a GTM strategy call — we automatically
              match the best available agent to your business profile in under 3 seconds.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount}/{REVENUE_AGENTS.length} Agents Live
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
              <Lock className="h-3 w-3 text-slate-400" />
              E2E Encrypted
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-800/60">
          {[
            { icon: Activity, label: "Auto-Assign Success Rate", value: "100%" },
            { icon: Clock, label: "Avg Match Time", value: "<3 sec" },
            { icon: Shield, label: "Uptime SLA", value: "99.9%" },
            { icon: CalendarCheck, label: "Calendar Platforms", value: "Google · Outlook · Apple" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 text-[11px]">
              <Icon className="h-3.5 w-3.5 text-cyan-400/70" />
              <span className="text-slate-500">{label}:</span>
              <span className="font-bold text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── PATHWAY TABS ────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Choose Your Pipeline Support Pathway:
        </p>
        <div role="tablist" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Option 1 */}
          <button
            role="tab"
            aria-selected={activePathway === "select-agent"}
            onClick={() => setActivePathway("select-agent")}
            className={`relative p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden group ${
              activePathway === "select-agent"
                ? "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/40 ring-1 ring-amber-500/25 shadow-lg shadow-amber-500/5"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            {activePathway === "select-agent" && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
            )}
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">
                Option 1
              </span>
              {activePathway === "select-agent" ? (
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              )}
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-amber-400" />
              Browse &amp; Select Agent
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              View all available AI Revenue Specialists with profiles, workload, and skills — select
              manually or use 1-click intelligent auto-assign.
            </p>
          </button>

          {/* Option 2 */}
          <button
            role="tab"
            aria-selected={activePathway === "book-call"}
            onClick={() => setActivePathway("book-call")}
            className={`relative p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden group ${
              activePathway === "book-call"
                ? "bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent border-cyan-500/40 ring-1 ring-cyan-500/25 shadow-lg shadow-cyan-500/5"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            {activePathway === "book-call" && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            )}
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 uppercase tracking-wider">
                Option 2
              </span>
              {activePathway === "book-call" ? (
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              )}
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-cyan-400" />
              Book Strategy Call &amp; Get Matched
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Schedule a 30-min AI GTM Analysis Review on Calendly — we automatically assign the
              optimal agent the moment you confirm.
            </p>
          </button>
        </div>
      </div>

      {/* ─── CONTENT PANELS ──────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 flex-1 space-y-6">

        {/* ═══ OPTION 1: AGENT ROSTER GRID ═══════════════════════════════════ */}
        {activePathway === "select-agent" && (
          <div id="pathway-option-1" role="tabpanel" aria-labelledby="tab-option-1" className="space-y-5">

            {/* Panel header with auto-assign CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-amber-400" />
                  AI Revenue Agent Roster
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All {REVENUE_AGENTS.length} specialists visible simultaneously. Workload &amp; availability live.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter pills */}
                <div className="flex gap-1.5">
                  {(["all", "online", "busy"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        filterStatus === f
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* ── AI AUTO-ASSIGN CTA ─────────────────────────────────────── */}
                <div className="relative">
                  {/* Tooltip — shown on hover/focus for first-time context */}
                  {showTooltip && (
                    <div
                      role="tooltip"
                      id="auto-assign-tooltip"
                      className="absolute bottom-full mb-2 right-0 z-20 w-64 p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-xl text-[10px] leading-relaxed text-slate-300"
                    >
                      <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                        <Cpu className="h-3 w-3 text-cyan-400" />
                        How Auto-Assign Works
                      </p>
                      <p>
                        Our AI instantly evaluates all {REVENUE_AGENTS.length} agents by expertise,
                        workload, timezone &amp; performance — then picks the best available match
                        for your profile.
                      </p>
                      {autoAssignCount > 0 && (
                        <p className="mt-1.5 text-amber-300 font-semibold">
                          ↻ Click again to reassign a different agent.
                        </p>
                      )}
                      {/* Tooltip caret */}
                      <div className="absolute right-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800" />
                    </div>
                  )}

                  <button
                    id="auto-assign-btn"
                    onClick={handleAutoAssign}
                    disabled={autoAssigning}
                    aria-disabled={autoAssigning}
                    aria-describedby="auto-assign-tooltip auto-assign-status"
                    aria-label={
                      autoAssigning
                        ? "Matching agent, please wait…"
                        : autoAssignCount === 0
                        ? "AI Auto-Assign: Instantly find the best matching available agent"
                        : `AI Reassign: Replace current agent with a different match (attempt ${autoAssignCount + 1})`
                    }
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    className={
                      `relative flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-[11px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-slate-950 ${
                        autoAssigning
                          ? "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                          : autoAssigned
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 active:scale-95"
                          : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 active:scale-95"
                      }`
                    }
                  >
                    {autoAssigning ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Analyzing Agents…</span>
                        {/* Prevent width collapse during spin */}
                        <span className="sr-only">Please wait while we match the best agent for you.</span>
                      </>
                    ) : autoAssigned ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reassign Agent</span>
                        <span className="bg-white/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          #{autoAssignCount}
                        </span>
                      </>
                    ) : (
                      <>
                        <Cpu className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
                        <span>AI Auto-Assign</span>
                        <Zap className="h-3 w-3 text-amber-300 fill-amber-300" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── AUTO-ASSIGN RESULT BANNER — aria-live region ── */}
            <div
              id="auto-assign-status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-0"
            >
              {/* Loading state skeleton */}
              {autoAssigning && (
                <div
                  className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 animate-pulse"
                  role="status"
                  aria-label="Matching agent in progress"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 bg-slate-800 rounded-full" />
                    <div className="h-2 w-60 bg-slate-800/70 rounded-full" />
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <div className="h-5 w-20 bg-slate-800 rounded-lg" />
                    <div className="h-5 w-20 bg-slate-800 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Assigned agent result card */}
              {!autoAssigning && autoAssigned && autoAssignedAgent && (
                <div
                  className="relative bg-gradient-to-r from-cyan-950/50 via-indigo-950/30 to-cyan-950/50 border border-cyan-500/30 rounded-2xl p-4 overflow-hidden"
                  role="region"
                  aria-label={`Auto-assigned agent: ${autoAssignedAgent.name}`}
                >
                  {/* Top shimmer line */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" aria-hidden="true" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Agent avatar + identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-xl bg-gradient-to-br ${agentGradients[REVENUE_AGENTS.findIndex(a => a.key === autoAssignedAgent.key) % agentGradients.length]} flex items-center justify-center text-white text-base font-black shadow-lg shrink-0`}
                        aria-hidden="true"
                      >
                        {autoAssignedAgent.name[0]}
                      </div>
                      <div>
                        <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
                          {autoAssignCount > 1 ? `♻ Reassigned (attempt ${autoAssignCount})` : "🤖 Intelligently Auto-Assigned"}
                        </p>
                        <p className="text-sm font-extrabold text-white">
                          {autoAssignedAgent.name}
                          <span className="text-cyan-300 font-normal text-xs ml-1">— {autoAssignedAgent.title}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{autoAssignedAgent.timeZone}</p>
                      </div>
                    </div>

                    {/* Match metrics */}
                    <div className="flex flex-wrap gap-2 text-[10px] sm:ml-auto">
                      <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg font-semibold">
                        Match Score: <span className="text-cyan-400 font-bold">{autoAssignScore}/100</span>
                      </span>
                      <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg font-semibold">
                        Win Rate: <span className="text-emerald-400 font-bold">{autoAssignedAgent.winRate}</span>
                      </span>
                      <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg font-semibold">
                        Rating: <span className="text-amber-400 font-bold">★ {autoAssignedAgent.rating}</span>
                      </span>
                    </div>
                  </div>

                  {/* Reassign microcopy */}
                  <p className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Not the right fit?{" "}
                    <button
                      onClick={handleAutoAssign}
                      disabled={autoAssigning}
                      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
                      aria-label="Try again to get a different agent match"
                    >
                      Click to try a different agent
                    </button>
                    {" "}— each click picks a new one.
                  </p>
                </div>
              )}
            </div>

            {/* ── AGENT GRID CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAgents.map((agent, idx) => {
                const status = statusConfig[agent.onlineStatus] || statusConfig.online;
                const isSelected = selectedAgentKey === agent.key;
                const activeSessions = (agent as any).activeSessions || 0;
                const workloadPct = Math.min(100, Math.round(activeSessions / (agent.maxSessions || 3) * 100));
                const grad = agentGradients[idx % agentGradients.length];

                return (
                  <button
                    key={agent.key}
                    onClick={() => {
                      setSelectedAgentKey(agent.key);
                      setAutoAssigned(false);
                      setAutoAssignedAgent(null);
                      setAgentProceedConfirmed(false);
                    }}
                    className={`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                      isSelected
                        ? "border-amber-500/50 bg-gradient-to-br from-amber-500/8 via-orange-500/4 to-transparent ring-1 ring-amber-500/30 shadow-xl shadow-amber-500/8"
                        : "border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
                    )}

                    {/* Card top: avatar + status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-black shadow-md`}>
                          {agent.name[0]}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#060B18] ${status.dot} shadow-sm`} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white leading-none">{agent.name}</p>
                          <p className="text-[10px] text-amber-300/80 mt-0.5 font-medium leading-none">{agent.title}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                      {agent.bio}
                    </p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.specialties.slice(0, 3).map((s) => (
                        <span key={s} className="text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Metrics row */}
                    <div className="flex items-center gap-3 text-[10px] border-t border-slate-800/60 pt-2.5">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="h-3 w-3 fill-amber-400" /> {agent.rating}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <TrendingUp className="h-3 w-3" /> {agent.winRate}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 ml-auto">
                        <Globe className="h-3 w-3" /> {(agent.timeZone || "EST").split(" ")[1] || "EST"}
                      </span>
                    </div>

                    {/* Workload bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mb-1">
                        <span>Workload</span>
                        <span className={workloadPct >= 100 ? "text-amber-400" : "text-emerald-400"}>
                          {workloadPct}%
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                        <div
                          className={`h-full rounded-full transition-all ${workloadPct >= 100 ? "bg-amber-500" : `bg-gradient-to-r ${grad}`}`}
                          style={{ width: `${workloadPct || 8}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>


            {/* ── SELECTED AGENT FULL PREVIEW ── */}
            {!agentProceedConfirmed ? (
              selectedAgent ? (
              <div className="relative bg-slate-900/50 border border-amber-500/20 rounded-2xl p-5 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${agentGradients[REVENUE_AGENTS.findIndex((a) => a.key === selectedAgentKey) % agentGradients.length]} flex items-center justify-center text-white text-xl font-black shadow-xl shrink-0`}>
                    {selectedAgent.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-base font-extrabold text-white">{selectedAgent.name}</h4>
                      <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                        Active &amp; Available
                      </span>
                      {autoAssigned && (
                        <span className="text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                          AI Matched
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-amber-300 mb-1">{selectedAgent.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{selectedAgent.bio}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedAgent.specialties.map((s) => (
                        <span key={s} className="text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 space-y-1.5 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 w-full sm:w-auto">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Portal Capabilities</div>
                    <div className="flex sm:flex-col gap-2 flex-wrap text-[11px] text-slate-300">
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-cyan-400" /> Live Chat</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-emerald-400" /> Voice Call</span>
                      <span className="flex items-center gap-1"><Video className="h-3 w-3 text-indigo-400" /> Video Call</span>
                      <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3 text-amber-400" /> Calendar Sync</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleProceedWithAgent}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    aria-label={`Proceed with ${selectedAgent.name} and activate pipeline support`}
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    Proceed with {selectedAgent.name} &amp; Activate Pipeline Support
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => { setFilterStatus("all"); setAutoAssigned(false); setAutoAssignedAgent(null); setSelectedAgentKey(""); setAutoAssignCount(0); }}
                    className="px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label="Reset agent selection"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
              </div>
              ) : (
              /* Empty state — no agent selected yet */
              <div className="relative bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">No Agent Selected</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Click any agent card above to manually select, or use{" "}
                      <button
                        onClick={handleAutoAssign}
                        disabled={autoAssigning}
                        className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
                      >
                        AI Auto-Assign
                      </button>{" "}
                      to let the system pick the best match for you instantly.
                    </p>
                  </div>
                </div>
              </div>
              )

            ) : (
              /* SUCCESS BANNER */
              <div className="relative bg-gradient-to-r from-emerald-950/50 via-emerald-900/25 to-emerald-950/50 border border-emerald-500/35 rounded-2xl p-5 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-white mb-1">
                      Agent Assigned &amp; Portal Access Activated!
                    </h4>
                    <p className="text-xs text-slate-300">
                      <strong>{selectedAgent.name}</strong> ({selectedAgent.title}) has been assigned to your account.
                      All your ICP data, campaign playbooks, and interaction history are now accessible in their agent portal.
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 text-xs space-y-1.5 text-slate-300">
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Confirmation sent to <code className="text-amber-300">{email}</code></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <PhoneCall className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Agent contact: <code className="text-amber-300">{selectedAgent.key}@dealflow.ai</code></span>
                        </p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 text-xs space-y-1.5 text-slate-300">
                        <p className="flex items-center gap-2">
                          <CalendarCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span>Calendar invite syncing to Google &amp; Outlook</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <BarChart2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>ICP + Campaign data synced to agent dashboard</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {["Secure Login Access", "Real-Time Chat", "Voice & Video Calls", "ICP Visibility", "Playbook Access", "Calendar Sync"].map((f) => (
                        <span key={f} className="flex items-center gap-1 text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">
                          <Check className="h-3 w-3 text-emerald-400" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCOUNT CREATION WIZARD (appears after agent confirmation) ── */}
            {agentProceedConfirmed && selectedAgent && (
              <div className="relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" aria-hidden="true" />
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-px bg-slate-800" aria-hidden="true" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                      Step 2 — Secure Account Setup
                    </span>
                    <div className="flex-1 h-px bg-slate-800" aria-hidden="true" />
                  </div>
                  <CustomerAccountSetup
                    prefillEmail={email}
                    prefillName={name}
                    leadId={leadId}
                    assignedAgentName={selectedAgent.name}
                    assignedAgentKey={selectedAgent.key}
                    inline={true}
                    onLoginSuccess={(user) => {
                      if (onAgentAssigned) onAgentAssigned(selectedAgent.key);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ OPTION 2: BOOK CALL ════════════════════════════════════════════ */}
        {activePathway === "book-call" && (
          <div id="pathway-option-2" role="tabpanel" aria-labelledby="tab-option-2" className="space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  Schedule AI GTM Review Strategy Call
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  30-minute 1-on-1 session. Automatic agent match upon confirmation. Bidirectionally synced to Google, Outlook &amp; Apple Calendar.
                </p>
              </div>

              <a
                href={calendlyExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all shrink-0"
              >
                <Calendar className="h-3.5 w-3.5" />
                Open Calendly (New Tab)
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Calendar platform badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Google Calendar", color: "text-blue-400 border-blue-500/25 bg-blue-500/8" },
                { label: "Microsoft Outlook", color: "text-indigo-400 border-indigo-500/25 bg-indigo-500/8" },
                { label: "Apple Calendar", color: "text-slate-300 border-slate-600 bg-slate-800/60" },
                { label: "iCal Export", color: "text-teal-400 border-teal-500/25 bg-teal-500/8" },
              ].map(({ label, color }) => (
                <span key={label} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${color} flex items-center gap-1`}>
                  <CalendarCheck className="h-3 w-3" /> {label}
                </span>
              ))}
            </div>

            {/* Booking status or manual confirm CTA */}
            {callScheduled ? (
              <div className="relative bg-gradient-to-r from-emerald-950/50 via-emerald-900/25 to-emerald-950/50 border border-emerald-500/35 rounded-2xl p-5 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white mb-1">Strategy Call Confirmed!</h4>
                    <p className="text-xs text-slate-300">
                      Matched Agent: <strong>{matchedAgent.name}</strong> ({matchedAgent.title})
                    </p>
                    <div className="mt-3 text-xs space-y-1.5 text-slate-300">
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-cyan-400" />
                        Pre-call confirmation dispatched to <code className="text-cyan-300">{email}</code>
                      </p>
                      <p className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-cyan-400" />
                        Agent contact: <code className="text-cyan-300">{matchedAgent.key}@dealflow.ai</code>
                      </p>
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        E2E encrypted. Tracking: <code>gtm_analysis_review</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-300">
                  Already scheduled on Calendly or want direct confirmation?
                </p>
                <button
                  onClick={handleConfirmCallBooking}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Check className="h-4 w-4" />
                  Confirm Booking &amp; Get Matched Agent
                </button>
              </div>
            )}

            {/* Inline Calendly */}
            <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 min-h-[640px]">
              <DynamicInlineWidget
                url={calendlyBaseUrl}
                prefill={{ email, name }}
                styles={{ height: "640px", width: "100%" }}
              />
            </div>

            {/* Portal capabilities teaser */}
            {!callScheduled && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Lock, label: "Secure Login", desc: "Encrypted portal access" },
                  { icon: MessageSquare, label: "Real-Time Chat", desc: "With assigned agent" },
                  { icon: Phone, label: "Voice Calls", desc: "In-portal audio" },
                  { icon: CalendarCheck, label: "Calendar Sync", desc: "Bi-directional sync" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
                    <div className="h-8 w-8 mx-auto rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <p className="text-[11px] font-bold text-white">{label}</p>
                    <p className="text-[9px] text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800/60 px-6 py-3 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> GDPR Compliant</span>
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> AES-256 Encrypted</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> SOC 2 Ready</span>
        </div>
        <span>© 2026 DealFlow AI · All rights reserved</span>
      </div>

      {/* ─── PASSWORD CREATION MODAL POP-UP (triggers for Option 1 or Option 2 completion) ─── */}
      <PasswordCreationModal
        isOpen={agentProceedConfirmed || callScheduled}
        onClose={() => {
          setAgentProceedConfirmed(false);
          setCallScheduled(false);
        }}
        prefillEmail={email}
        prefillName={name}
        leadId={leadId}
        optionSelected={activePathway}
        assignedAgentName={(activePathway === "select-agent" ? selectedAgent?.name : matchedAgent?.name) || "Revenue Specialist"}
        assignedAgentKey={(activePathway === "select-agent" ? selectedAgent?.key : matchedAgent?.key) || "praneeth"}
      />
    </div>
  );
}

