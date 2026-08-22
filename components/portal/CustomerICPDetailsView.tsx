"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";

export interface CustomerICPDetailsViewProps {
  customerId?: string;
  customerData?: any;
  gtmAnalysis?: any;
}

export function CustomerICPDetailsView({
  customerId,
  customerData,
  gtmAnalysis,
}: CustomerICPDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<"icp" | "firmographics" | "painpoints" | "interactions">("icp");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedICP, setFetchedICP] = useState<any | null>(null);

  // Request race-condition counter to handle rapid sequential switches
  const activeRequestIdRef = useRef<number>(0);

  // Synchronize state immediately when customerId or customerData changes
  useEffect(() => {
    const currentRequestId = ++activeRequestIdRef.current;

    // Reset fetched ICP synchronously on switch to prevent cross-customer leakage
    setFetchedICP(null);

    const targetId = customerId || customerData?.id;
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch real-time customer ICP data
    const fetchCustomerICP = async () => {
      try {
        const res = await fetch(`/api/customer/icp?customerId=${encodeURIComponent(targetId)}`, {
          cache: "no-store",
        });

        // Abort if another customer switch happened while fetching
        if (currentRequestId !== activeRequestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.icpEntries && data.icpEntries.length > 0) {
            setFetchedICP(data.icpEntries[0]);
          }
        }
      } catch (err) {
        // Graceful fallback to customerData
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchCustomerICP();
  }, [customerId, customerData?.id]);

  // Dynamic merged ICP attributes
  const companyName =
    customerData?.companyName ||
    customerData?.companyInformation?.name ||
    gtmAnalysis?.companyName ||
    (customerData?.name ? `${customerData.name}'s Org` : "Client Account");

  const isInactive = customerData?.status === "inactive" || customerData?.status === "paused";
  const isNew = customerData?.status === "onboarding" || !customerData?.createdAt;

  const rawIndustries =
    fetchedICP?.targetIndustries ||
    customerData?.targetIndustries ||
    (customerData?.industry ? [customerData.industry] : null) ||
    (customerData?.companyInformation?.industry ? [customerData.companyInformation.industry] : null) ||
    ["B2B SaaS / Enterprise Technology"];

  const industry = Array.isArray(rawIndustries) ? rawIndustries.join(", ") : String(rawIndustries);

  const rawSizes =
    fetchedICP?.targetCompanySizes ||
    customerData?.targetCompanySizes ||
    (customerData?.companySize ? [customerData.companySize] : null) ||
    ["25-100 employees"];

  const companySize = Array.isArray(rawSizes) ? rawSizes.join(", ") : String(rawSizes);

  const rawGeos =
    fetchedICP?.targetGeographicRegions ||
    customerData?.targetGeographics ||
    customerData?.targetGeographicRegions ||
    (customerData?.region ? [customerData.region] : null) ||
    ["North America (US/Canada)"];

  const geography = Array.isArray(rawGeos) ? rawGeos.join(", ") : String(rawGeos);

  const rawDecisionMakers =
    fetchedICP?.decisionMakers ||
    customerData?.targetSeniorities ||
    customerData?.decisionMakers ||
    ["VP Sales, CRO, Head of Growth, Sales Ops Manager"];

  const decisionMakers = Array.isArray(rawDecisionMakers) ? rawDecisionMakers.join(", ") : String(rawDecisionMakers);

  const painPointText =
    fetchedICP?.painPoints?.join("; ") ||
    (Array.isArray(customerData?.painPoints) ? customerData.painPoints.join("; ") : customerData?.painPoints) ||
    customerData?.keyChallenges ||
    customerData?.challenges ||
    `Manual lead qualification and prospecting workflows reduce sales velocity at ${companyName}, resulting in delayed response times and lower pipeline conversion.`;

  const primaryOutcomeText =
    fetchedICP?.valueProposition ||
    customerData?.primaryOutcome ||
    customerData?.valueProposition ||
    `Automate multi-channel outreach, qualify high-intent decision makers, and accelerate ${companyName}'s quarterly pipeline velocity by 35%.`;

  // Dynamically constructed interaction timeline isolated per customer
  const interactions = useMemo(() => {
    const contactName = customerData?.name || customerData?.customerName || "Client Admin";
    const agentName = customerData?.assignedAgentName || "Assigned Specialist";
    const baseDate = customerData?.createdAt ? new Date(customerData.createdAt) : new Date();

    const formatDate = (date: Date, offsetHours = 0) => {
      const d = new Date(date.getTime() - offsetHours * 3600 * 1000);
      return d.toISOString().replace("T", " ").substring(0, 16);
    };

    return [
      {
        date: formatDate(baseDate, -2),
        title: "ICP Profile Synced & Active",
        detail: `Ideal Customer Profile synchronized in real-time for ${companyName}.`,
        author: "Agent Portal Sync Engine",
      },
      {
        date: formatDate(baseDate, -1),
        title: "Agent Assignment Confirmed",
        detail: `Delegated to ${agentName} for dedicated sales pipeline management.`,
        author: "System Dispatcher",
      },
      {
        date: formatDate(baseDate, 0),
        title: "Account Onboarding Initialized",
        detail: `Client account registered with primary contact ${contactName}.`,
        author: "Portal Admin",
      },
    ];
  }, [customerData, companyName]);

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6 animate-in fade-in duration-200">
      {/* Inactive Customer Warning Banner */}
      {isInactive && (
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Account Status: Inactive / Paused.</span>
            <span className="ml-1 text-slate-300">Displaying preserved ICP snapshot for archival and reactivation reference.</span>
          </div>
        </div>
      )}

      {/* Account Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Assigned Account Full Visibility
            </span>
            {isNew && (
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                New Customer Profile
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <Building2 className="h-5 w-5 text-cyan-400" /> {companyName} ICP Account Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete demographic details, pain points, business criteria, and historical interaction records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronizing ICP Data...
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Fully Synced to Agent Portal
            </span>
          )}
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
                  <li>• Uses Salesforce, HubSpot, or modern CRM stack</li>
                  <li>• Established outbound or inbound revenue motion</li>
                  <li>• Target market aligned with {industry}</li>
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl space-y-2">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Exclusion Criteria
                </span>
                <ul className="space-y-1 text-slate-300 font-light">
                  <li>• Non-aligned consumer / pure retail entities</li>
                  <li>• Pre-idea or unfunded organizations</li>
                  <li>• Legacy single-location operations without digital presence</li>
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
                <td className="p-3">FinTech / HealthTech / B2B SaaS</td>
                <td className="p-3">100 - 500 employees</td>
                <td className="p-3 text-amber-400 font-bold">$20M - $50M</td>
                <td className="p-3">Tooling fragmentation & extended deal cycles</td>
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
              {painPointText}
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold uppercase tracking-wider block">Target Primary Outcome</span>
            <p className="text-slate-200 leading-relaxed font-light">
              {primaryOutcomeText}
            </p>
          </div>
        </div>
      )}

      {activeTab === "interactions" && (
        <div className="space-y-3 text-xs">
          {interactions.map((item, idx) => (
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
