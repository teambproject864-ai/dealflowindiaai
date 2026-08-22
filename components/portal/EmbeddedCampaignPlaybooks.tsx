"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
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
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";

export interface EmbeddedCampaignPlaybooksProps {
  customerId?: string;
  customerData?: any;
  companyName?: string;
}

export function EmbeddedCampaignPlaybooks({
  customerId,
  customerData,
  companyName: propCompanyName,
}: EmbeddedCampaignPlaybooksProps) {
  const [activePlaybook, setActivePlaybook] = React.useState<"outbound" | "plg" | "enterprise">("outbound");
  const [isLoading, setIsLoading] = React.useState(false);
  const [customPlaybooks, setCustomPlaybooks] = React.useState<any[]>([]);

  // Request counter to avoid race conditions during rapid customer switches
  const activeRequestIdRef = React.useRef<number>(0);

  const activeCompanyName =
    propCompanyName ||
    customerData?.companyName ||
    customerData?.companyInformation?.name ||
    (customerData?.name ? `${customerData.name}'s Org` : "Client Account");

  const targetIndustry =
    customerData?.industry ||
    customerData?.companyInformation?.industry ||
    (Array.isArray(customerData?.targetIndustries) ? customerData.targetIndustries[0] : null) ||
    "Enterprise SaaS";

  const isInactive = customerData?.status === "inactive" || customerData?.status === "paused";
  const isNew = customerData?.status === "onboarding" || !customerData?.createdAt;

  // Real-time synchronization when customerId or customerData changes
  React.useEffect(() => {
    const currentRequestId = ++activeRequestIdRef.current;

    // Reset customer-specific playbooks synchronously on customer switch
    setCustomPlaybooks([]);

    const targetId = customerId || customerData?.id;
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchCustomerPlaybooks = async () => {
      try {
        const res = await fetch(`/api/gtm-playbook?customerId=${encodeURIComponent(targetId)}`, {
          cache: "no-store",
        });

        // Discard result if user switched customer in the meantime
        if (currentRequestId !== activeRequestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.playbooks) && data.playbooks.length > 0) {
            setCustomPlaybooks(data.playbooks);
          }
        }
      } catch (err) {
        // Fallback to tailored built-in playbooks
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchCustomerPlaybooks();
  }, [customerId, customerData?.id]);

  // Dynamically constructed and tailored playbooks for the active customer
  const playbooks = React.useMemo(() => {
    return [
      {
        id: "outbound",
        title: "Outbound Lead Gen Playbook",
        stage: "Top of Funnel (TOFU)",
        target: `VP Sales & CRO (${targetIndustry})`,
        conversionBenchmark: "8.5% Meeting Booking Rate",
        targetReplyRate: "12.5%",
        targetVelocity: "28 Days Average",
        steps: [
          `Day 1: Personalized LinkedIn InMail addressing manual pipeline friction at ${activeCompanyName}.`,
          `Day 3: Email 1 - Case study highlighting 70% reduction in lead scoring time for ${targetIndustry} peers.`,
          `Day 5: Cold Call attempt + VM referencing custom GTM analysis and DealFlow ROI.`,
          `Day 8: Email 2 - ROI Calculator link + 1-click weekly standup booking invite for ${activeCompanyName}.`,
        ],
        messagingFramework: `Problem (${targetIndustry} Bottlenecks) -> Business Cost -> AI Solution Proof -> Frictionless Next Step for ${activeCompanyName}`,
      },
      {
        id: "plg",
        title: "Product-Led Growth (PLG) Expansion",
        stage: "Middle of Funnel (MOFU)",
        target: `Sales Ops & Growth Leads (${targetIndustry})`,
        conversionBenchmark: "22.4% Free-to-Paid Upgrade",
        targetReplyRate: "18.2%",
        targetVelocity: "14 Days Average",
        steps: [
          `Day 1: Automated onboarding sequence trigger with interactive dashboard walkthrough for ${activeCompanyName}.`,
          `Day 4: Feature adoption check-in call with assigned revenue specialist.`,
          `Day 7: Value realization email showcasing top high-scoring leads identified in ${targetIndustry}.`,
        ],
        messagingFramework: "Usage Signal -> Friction Removal -> Value Milestone -> Team Rollout Offer",
      },
      {
        id: "enterprise",
        title: "Enterprise Multi-Stakeholder Playbook",
        stage: "Bottom of Funnel (BOFU)",
        target: "C-Suite & Economic Buyers",
        conversionBenchmark: "45.0% Proposal-to-Close Rate",
        targetReplyRate: "28.0%",
        targetVelocity: "42 Days Average",
        steps: [
          `Step 1: Stakeholder Mapping & Executive Sponsor alignment across ${activeCompanyName}.`,
          `Step 2: Custom ROI business case presentation tailored to ${targetIndustry} economics.`,
          `Step 3: Security & Compliance verification (mTLS, HMAC, Envelope Encryption).`,
          `Step 4: Pilot agreement scope with 30-day KPI checkpoints for ${activeCompanyName}.`,
        ],
        messagingFramework: "Executive Alignment -> Security Proof -> ROI Guarantee -> Pilot Scope",
      },
    ];
  }, [activeCompanyName, targetIndustry]);

  const current = playbooks.find((p) => p.id === activePlaybook) || playbooks[0];

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6 animate-in fade-in duration-200">
      {/* Inactive Account Notice */}
      {isInactive && (
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Campaign Status: Paused / Inactive Account.</span>
            <span className="ml-1 text-slate-300">Campaign execution is on hold pending client reactivation.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Embedded Playbooks & Guidelines
            </span>
            {isNew && (
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                New Campaign Cadence
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <BookOpen className="h-5 w-5 text-cyan-400" /> GTM Campaign Playbooks for {activeCompanyName}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step engagement playbooks, messaging frameworks, and conversion benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronizing Playbooks...
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Cadence Synced
            </span>
          )}
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
              Use native portal content generator to draft emails matching this framework automatically for {activeCompanyName}.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Conversion Benchmarks & Target KPIs
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Reply Rate:</span>
                <span className="font-bold text-white">{current.targetReplyRate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Meeting Booking:</span>
                <span className="font-bold text-emerald-400">{current.conversionBenchmark}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Target Deal Velocity:</span>
                <span className="font-bold text-cyan-300">{current.targetVelocity}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
