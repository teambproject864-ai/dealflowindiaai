"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useFirestoreCollection } from "@/lib/firestore-realtime";
import { SalesLead, seedSalesLeads } from "@/lib/seed-data";
import { 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  XCircle,
  Briefcase,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { StaggerReveal } from "@/components/immersive/StaggerReveal";

const ScatterCloud3D = dynamic(
  () => import("@/components/immersive/ScatterCloud3D").then((mod) => mod.ScatterCloud3D),
  { ssr: false }
);

const SOLUTIONS_NAV = [
  { href: "/solutions",           label: "Overview Console", active: true },
  { href: "/solutions/gtm",       label: "GTM Roadmap",      active: false },
  { href: "/solutions/sales",     label: "Sales Pipeline",   active: false },
  { href: "/solutions/marketing", label: "Marketing Ops",    active: false },
];

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

// Seed custom client feedback mapping for maximum realism
const FEEDBACK_MAPPING: Record<string, string> = {
  l1: "Initial outreach successful. Lead is highly interested in integrating Apollo.io with Salesforce to solve manual follow-up bottlenecks. Discovery call scheduled next week.",
  l2: "Product demonstration completed. Evaluated HubSpot CRM integration options. Main concern is scaling outbound without burning domains. Highly satisfied with our deliverability safeguards.",
  l3: "Custom proposal submitted. Security team is reviewing compliance protocols. Impressed by real-time GTM cockpit visibility and estimated 25% pipeline acceleration.",
  l4: "Currently negotiating pricing terms for a multi-year deal. The client is requesting a 10% discount on seat onboarding. RevOps head has signed off on GTM Roadmap alignment.",
  l5: "Deal closed successfully! Onboarding sequence activated. The customer reported a 35% time savings during the beta trial phase. Initial setup fully completed.",
  l6: "Qualified prospect looking to optimize stack gaps. Currently using Salesforce + Outreach but struggling with data enrichment latency. Evaluating Clay sync details next phase.",
  l7: "Proposal submitted. Competing with standard agency solutions. Vertex AI Corp requested a tailored ROI analysis demonstrating stack gap consolidation benefits.",
  l8: "Early-stage discovery. VC fund is evaluating DealFlow.AI to audit and score GTM health for their portfolio companies. Awaiting pitch deck and sandbox review.",
};

export default function SolutionsPage() {
  // Real-time synchronization of client pipeline leads
  const { data: clientLeads, loading: leadsLoading } = useFirestoreCollection<SalesLead>(
    "sales_pipeline",
    [],
    seedSalesLeads
  );

  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  
  // Sorting States
  const [sortBy, setSortBy] = useState<"companyName" | "dealValue" | "probability" | "closingDate">("companyName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dynamic industry list derived from live leads
  const industries = useMemo(() => {
    const set = new Set(clientLeads.map((l) => l.industry).filter(Boolean));
    return Array.from(set);
  }, [clientLeads]);

  // Handle Column Header click for sorting
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter & Sort Leads
  const filteredLeads = useMemo(() => {
    return clientLeads
      .filter((lead) => {
        const matchesSearch =
          lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.salesRep || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
        const matchesIndustry = industryFilter === "all" || lead.industry === industryFilter;
        
        return matchesSearch && matchesStage && matchesIndustry;
      })
      .sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        } else {
          return sortOrder === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }
      });
  }, [clientLeads, searchTerm, stageFilter, industryFilter, sortBy, sortOrder]);

  // Aggregate KPI metrics based on current filtered records
  const kpis = useMemo(() => {
    const total = filteredLeads.reduce((acc, l) => acc + l.dealValue, 0);
    const weighted = filteredLeads.reduce((acc, l) => acc + l.dealValue * (l.probability / 100), 0);
    const wins = filteredLeads.filter((l) => l.stage === "closed-won").length;
    const avgProb = filteredLeads.length > 0 
      ? Math.round(filteredLeads.reduce((acc, l) => acc + l.probability, 0) / filteredLeads.length)
      : 0;

    return { total, weighted, wins, avgProb };
  }, [filteredLeads]);

  // Reset all sorting & search filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStageFilter("all");
    setIndustryFilter("all");
    setSortBy("companyName");
    setSortOrder("asc");
  };

  return (
    <div className="relative min-h-screen bg-dealflow-ink overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[5%] left-[-15%] w-[40rem] h-[40rem] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute top-[45%] right-[-15%] w-[40rem] h-[40rem] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 md:pt-36 md:pb-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Autonomous Workforce Operations Console</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight font-sans">
              Autonomous AI Sales &{" "}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Business Workforce
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Monitor and orchestrate your autonomous agents across prospect discovery, live AI call representation, boundary-enforced negotiation, and post-sale requirement fulfillment.
            </p>
          </div>

          {/* Sub Navigation Pills */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end shrink-0">
            {SOLUTIONS_NAV.map((nav) => (
              <Link key={nav.href} href={nav.href}>
                <button
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    nav.active
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20"
                      : "bg-white/3 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {nav.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace Area */}
      <section className="py-16 max-w-7xl mx-auto px-6 space-y-10">
        
        {/* KPI Analytics Block */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Pipeline", value: `$${(kpis.total / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-teal-400", glow: "shadow-teal-500/5", baseOffset: -12, floatHeight: 8, floatDuration: 5.5 },
            { label: "Weighted Value", value: `$${(kpis.weighted / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-violet-400", glow: "shadow-violet-500/5", baseOffset: -6, floatHeight: 6, floatDuration: 6.5 },
            { label: "Closed Won Count", value: `${kpis.wins} Deal${kpis.wins !== 1 ? "s" : ""}`, icon: Briefcase, color: "text-emerald-400", glow: "shadow-emerald-500/5", baseOffset: 0, floatHeight: 4, floatDuration: 7.5 },
            { label: "Avg Opportunity Prob.", value: `${kpis.avgProb}%`, icon: SlidersHorizontal, color: "text-amber-400", glow: "shadow-amber-500/5", baseOffset: 6, floatHeight: 2, floatDuration: 8.5 },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              animate={{
                y: [kpi.baseOffset, kpi.baseOffset - kpi.floatHeight, kpi.baseOffset]
              }}
              transition={{
                duration: kpi.floatDuration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <GlassPanel 
                material="glass" 
                depth="mid" 
                tilt={true} 
                className={`p-6 flex flex-col justify-between h-32 border-white/8 hover:border-white/15 transition-all duration-300 shadow-xl ${kpi.glow}`}
              >
                <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <span>{kpi.label}</span>
                  <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-sans">{kpi.value}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Interactive 3D Lead density point cloud */}
        <ScatterCloud3D />

        {/* Filtering Console Card */}
        <GlassPanel material="glass" depth="mid" tilt={false} className="p-6 border-white/8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by company name, key contact, sales rep..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all placeholder-slate-500"
              />
            </div>

            {/* Stage Filter */}
            <div className="w-full lg:w-56">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full bg-[#0d0d1e] border border-white/8 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>

            {/* Industry Filter */}
            <div className="w-full lg:w-56">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full bg-[#0d0d1e] border border-white/8 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
              >
                <option value="all">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {(searchTerm || stageFilter !== "all" || industryFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="w-full lg:w-auto h-12 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 border border-white/5 hover:bg-white/5 shrink-0"
              >
                <XCircle className="h-4 w-4 text-rose-500" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </GlassPanel>

        {/* Client Directory Container */}
        {leadsLoading ? (
          <GlassPanel material="glass" depth="mid" className="flex flex-col items-center justify-center py-24 border-white/8">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
            <p className="mt-4 text-slate-400 animate-pulse text-sm font-semibold">Synchronizing active client records...</p>
          </GlassPanel>
        ) : filteredLeads.length === 0 ? (
          <GlassPanel material="glass" depth="mid" className="text-center py-20 border-white/8">
            <p className="text-slate-400 text-sm">No client records match your current criteria matrix.</p>
            <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5 text-xs uppercase font-bold tracking-wider" onClick={handleResetFilters}>
              Clear Search Filters
            </Button>
          </GlassPanel>
        ) : (
          <GlassPanel material="glass" depth="mid" tilt={false} className="overflow-hidden border-white/8 shadow-2xl p-0">
            <StaggerReveal>
              
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th 
                        className="py-4.5 px-6 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("companyName")}
                      >
                        <div className="flex items-center gap-1.5">
                          Company &amp; Owner
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th className="py-4.5 px-6">Industry &amp; Contact</th>
                      <th 
                        className="py-4.5 px-6 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("dealValue")}
                      >
                        <div className="flex items-center gap-1.5">
                          Deal Value
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th 
                        className="py-4.5 px-6 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("probability")}
                      >
                        <div className="flex items-center gap-1.5">
                          Prob.
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th 
                        className="py-4.5 px-6 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("closingDate")}
                      >
                        <div className="flex items-center gap-1.5">
                          Closing Date
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th className="py-4.5 px-6">Stage</th>
                      <th className="py-4.5 px-6 max-w-[340px]">Agent Notes / Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#070715]/40">
                    {filteredLeads.map((lead) => {
                      const feedback = FEEDBACK_MAPPING[lead.id] || "Discovery process scheduled. Analyzing tech stack gaps and integration feasibility.";
                      return (
                        <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                          {/* Company rep */}
                          <td className="py-5 px-6">
                            <div className="font-bold text-white text-base leading-tight">{lead.companyName}</div>
                            <div className="text-xs text-slate-500 mt-1">Rep: {lead.salesRep}</div>
                          </td>
                          
                          {/* Industry / contact */}
                          <td className="py-5 px-6">
                            <div className="text-white font-medium">{lead.contactName}</div>
                            <div className="text-xs text-teal-400 font-semibold mt-1">{lead.industry}</div>
                          </td>

                          {/* Value */}
                          <td className="py-5 px-6 text-emerald-400 font-bold text-base font-sans">
                            ${lead.dealValue.toLocaleString()}
                          </td>

                          {/* Prob */}
                          <td className="py-5 px-6 text-violet-300 font-semibold font-sans">
                            {lead.probability}%
                          </td>

                          {/* Closing */}
                          <td className="py-5 px-6 text-slate-300 font-sans">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              {new Date(lead.closingDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          </td>

                          {/* Stage Badge */}
                          <td className="py-5 px-6">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border ${
                              lead.stage === "prospect" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                              lead.stage === "qualified" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                              lead.stage === "proposal" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              lead.stage === "negotiation" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                              lead.stage === "closed-won" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {STAGE_LABELS[lead.stage] || lead.stage}
                            </span>
                          </td>

                          {/* Feedback text */}
                          <td className="py-5 px-6 max-w-[340px] text-slate-400 text-xs leading-relaxed italic">
                            <div className="flex gap-2">
                              <MessageSquare className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                              <span>&ldquo;{feedback}&rdquo;</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RESPONSIVE MOBILE CARDS VIEW */}
              <div className="lg:hidden grid grid-cols-1 divide-y divide-white/5">
                {filteredLeads.map((lead) => {
                  const feedback = FEEDBACK_MAPPING[lead.id] || "Discovery process scheduled. Analyzing tech stack gaps and integration feasibility.";
                  return (
                    <div key={lead.id} className="p-6 space-y-4 hover:bg-white/[0.01] transition-colors bg-[#070715]/40">
                      {/* Top Header Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-bold text-white">{lead.companyName}</div>
                          <div className="text-xs text-slate-500">Rep: {lead.salesRep} · {lead.industry}</div>
                        </div>
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                          lead.stage === "prospect" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          lead.stage === "qualified" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                          lead.stage === "proposal" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          lead.stage === "negotiation" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          lead.stage === "closed-won" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {STAGE_LABELS[lead.stage] || lead.stage}
                        </span>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-3 gap-2 bg-[#0c0c1b] p-3 rounded-xl border border-white/5 text-center text-xs">
                        <div>
                          <div className="text-slate-500 font-semibold mb-0.5">Value</div>
                          <div className="text-emerald-400 font-bold">${lead.dealValue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 font-semibold mb-0.5">Probability</div>
                          <div className="text-violet-300 font-bold">{lead.probability}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500 font-semibold mb-0.5">Closing Date</div>
                          <div className="text-slate-300 font-medium">
                            {new Date(lead.closingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </div>

                      {/* Contact Detail */}
                      <div className="text-xs text-slate-400">
                        Primary Key Contact: <strong className="text-white">{lead.contactName}</strong>
                      </div>

                      {/* Feedback bubbles */}
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-slate-300 text-xs italic leading-relaxed flex gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                        <span>&ldquo;{feedback}&rdquo;</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </StaggerReveal>
          </GlassPanel>
        )}
      </section>
    </div>
  );
}
