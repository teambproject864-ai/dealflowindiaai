"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Send,
  Target,
  CheckCircle2,
  TrendingUp,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";

interface EmbeddedCampaignPlaybooksProps {
  companyName?: string;
}

export function EmbeddedCampaignPlaybooks({ companyName = "Client Account" }: EmbeddedCampaignPlaybooksProps) {
  const [activePlaybook, setActivePlaybook] = useState<"outbound" | "plg" | "enterprise">("outbound");

  const playbooks = [
    {
      id: "outbound",
      title: "Outbound Lead Gen Playbook",
      stage: "Top of Funnel (TOFU)",
      target: "VP Sales & CRO",
      conversionBenchmark: "8.5% Meeting Booking Rate",
      steps: [
        "Day 1: Personalized LinkedIn InMail touching on manual lead qualification pain.",
        "Day 3: Email 1 - Case study highlighting 70% reduction in lead scoring time.",
        "Day 5: Cold Call attempt + VM referencing custom GTM analysis.",
        "Day 8: Email 2 - ROI Calculator link + 1-click weekly standup invite.",
      ],
      messagingFramework: "Problem -> Business Cost -> AI Solution Proof -> Frictionless Next Step",
    },
    {
      id: "plg",
      title: "Product-Led Growth (PLG) Expansion",
      stage: "Middle of Funnel (MOFU)",
      target: "Sales Ops & Growth Leads",
      conversionBenchmark: "22.4% Free-to-Paid Upgrade",
      steps: [
        "Day 1: Automated onboarding sequence trigger with interactive dashboard walkthrough.",
        "Day 4: Feature adoption check-in call with assigned revenue agent.",
        "Day 7: Value realization email showcasing top high-scoring leads identified.",
      ],
      messagingFramework: "Usage Signal -> Friction Removal -> Value Milestone -> Team Rollout Offer",
    },
    {
      id: "enterprise",
      title: "Enterprise Multi-Stakeholder Playbook",
      stage: "Bottom of Funnel (BOFU)",
      target: "C-Suite & Economic Buyers",
      conversionBenchmark: "45.0% Proposal-to-Close Rate",
      steps: [
        "Step 1: Stakeholder Mapping & Executive Sponsor alignment.",
        "Step 2: Custom ROI business case presentation.",
        "Step 3: Security & Compliance verification (mTLS, HMAC, Envelope Encryption).",
        "Step 4: Pilot agreement scope with 30-day KPI checkpoints.",
      ],
      messagingFramework: "Executive Alignment -> Security Proof -> ROI Guarantee -> Pilot Scope",
    },
  ];

  const current = playbooks.find((p) => p.id === activePlaybook) || playbooks[0];

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Embedded Playbooks & Guidelines
          </span>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <BookOpen className="h-5 w-5 text-cyan-400" /> GTM Campaign Playbooks for {companyName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step engagement playbooks, messaging frameworks, and conversion benchmarks.
          </p>
        </div>
      </div>

      {/* Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {playbooks.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlaybook(p.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePlaybook === p.id
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Target className="h-3.5 w-3.5" /> {p.title}
          </button>
        ))}
      </div>

      {/* Active Playbook Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Engagement */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Funnel Stage:</span>
              <p className="text-xs font-bold text-cyan-300">{current.stage}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Target Persona:</span>
              <p className="text-xs font-bold text-slate-200">{current.target}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Conversion Benchmark:</span>
              <p className="text-xs font-bold text-emerald-400">{current.conversionBenchmark}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Step-by-Step Engagement Cadence
            </h4>
            <div className="space-y-2">
              {current.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messaging Framework & Benchmarks */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Messaging Framework
            </h4>
            <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
              {current.messagingFramework}
            </p>
            <p className="text-[11px] text-slate-400 font-light">
              Use native portal content generator to draft emails matching this framework automatically.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Conversion Benchmarks & Target KPIs
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Reply Rate:</span>
                <span className="font-bold text-white">12.5%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Meeting Booking:</span>
                <span className="font-bold text-emerald-400">{current.conversionBenchmark}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Target Deal Velocity:</span>
                <span className="font-bold text-cyan-300">28 Days Average</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
