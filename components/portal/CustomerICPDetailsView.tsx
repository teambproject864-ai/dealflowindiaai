"use client";

import React, { useState } from "react";
import {
  Building2,
  Target,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Shield,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";

interface CustomerICPDetailsViewProps {
  customerData?: any;
  gtmAnalysis?: any;
}

export function CustomerICPDetailsView({ customerData, gtmAnalysis }: CustomerICPDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<"icp" | "firmographics" | "painpoints" | "interactions">("icp");

  const companyName = customerData?.companyName || gtmAnalysis?.companyName || "Acme Corp";
  const industry = customerData?.targetIndustries?.join(", ") || "B2B SaaS / SalesTech";
  const companySize = customerData?.targetCompanySizes?.join(", ") || "25-100 employees";
  const geography = customerData?.targetGeographics?.join(", ") || "North America (US/Canada)";
  const decisionMakers = customerData?.targetSeniorities?.join(", ") || "VP Sales, CRO, Sales Ops Manager";

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6">
      {/* Account Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Assigned Account Full Visibility
          </span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <Building2 className="h-5 w-5 text-cyan-400" /> {companyName} ICP Account Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete demographic details, pain points, business criteria, and historical interaction records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Fully Synced to Agent Portal
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
        {[
          { id: "icp", label: "ICP & Demographics", icon: Target },
          { id: "firmographics", label: "Firmographics", icon: Building2 },
          { id: "painpoints", label: "Pain Points & Criteria", icon: AlertTriangle },
          { id: "interactions", label: "Historical Interactions", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "icp" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" /> Core Demographics & Targets
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Target Industries:</span>
                <span className="text-white font-bold">{industry}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Target Company Size:</span>
                <span className="text-white font-bold">{companySize}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Target Geographic Regions:</span>
                <span className="text-white font-bold">{geography}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Key Decision Maker Titles:</span>
                <span className="text-cyan-300 font-bold">{decisionMakers}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" /> Inclusion & Exclusion Criteria
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Inclusion Criteria
                </span>
                <ul className="space-y-1 text-slate-300 font-light">
                  <li>• Uses Salesforce or HubSpot CRM</li>
                  <li>• Existing outbound or inbound sales motion</li>
                  <li>• ARR range between $2M and $20M</li>
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl space-y-2">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Exclusion Criteria
                </span>
                <ul className="space-y-1 text-slate-300 font-light">
                  <li>• B2C only operations</li>
                  <li>• Pre-revenue early stage startups</li>
                  <li>• Legacy single-location operations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "firmographics" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                <th className="p-3">Priority Tier</th>
                <th className="p-3">Industry Vertical</th>
                <th className="p-3">Company Size</th>
                <th className="p-3">ARR Range</th>
                <th className="p-3">Primary Cost Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-3 font-bold text-cyan-400">Tier 1 (High Priority)</td>
                <td className="p-3">{industry}</td>
                <td className="p-3">{companySize}</td>
                <td className="p-3 text-amber-400 font-bold">$2M - $20M</td>
                <td className="p-3">Sales rep headcount & manual lead qualification</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-indigo-400">Tier 2 (Expansion)</td>
                <td className="p-3">FinTech / HealthTech</td>
                <td className="p-3">100 - 500 employees</td>
                <td className="p-3 text-amber-400 font-bold">$20M - $50M</td>
                <td className="p-3">Tooling fragmentation & long deal cycles</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "painpoints" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold uppercase tracking-wider block">Primary Business Pain Point</span>
            <p className="text-slate-200 leading-relaxed font-light">
              {customerData?.keyChallenges || "Manual lead qualification takes 30% of sales rep bandwidth, resulting in delayed follow-ups and missed quota."}
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold uppercase tracking-wider block">Target Primary Outcome</span>
            <p className="text-slate-200 leading-relaxed font-light">
              {customerData?.primaryOutcome || "Automate lead scoring, accelerate pipeline deal velocity, and increase close rates by 25%."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "interactions" && (
        <div className="space-y-3 text-xs">
          {[
            { date: "2026-08-01 09:15", title: "Automated Agent Assigned", detail: "Intelligently auto-assigned to Ashok based on B2B SaaS alignment.", author: "System" },
            { date: "2026-07-31 16:40", title: "GTM Intake Form Submitted", detail: "Customer completed full 20-field GTM intake questionnaire.", author: "Client Admin" },
            { date: "2026-07-31 14:00", title: "Initial Portal Activation", detail: "Secure customer portal account initialized.", author: "System" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <Clock className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                </div>
                <p className="text-slate-400 mt-0.5 font-light">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
