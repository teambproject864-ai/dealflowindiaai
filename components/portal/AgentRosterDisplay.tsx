"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  TrendingUp,
  Globe,
  Loader2,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { RevenueAgentProfile } from "@/lib/types";

interface AgentRosterDisplayProps {
  currentAssignedAgentKey?: string;
  onSelectAgent?: (agentKey: string) => void;
  onAutoAssignSuccess?: (agent: RevenueAgentProfile) => void;
  compact?: boolean;
}

export function AgentRosterDisplay({
  currentAssignedAgentKey,
  onSelectAgent,
  onAutoAssignSuccess,
  compact = false,
}: AgentRosterDisplayProps) {
  const [agents, setAgents] = useState<RevenueAgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [filterExpertise, setFilterExpertise] = useState("all");

  const fetchRoster = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error("Failed to fetch agent roster:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    const interval = setInterval(fetchRoster, 5000); // Live status update polling every 5s
    return () => clearInterval(interval);
  }, []);

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const res = await fetch("/api/agent-assignments/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "B2B SaaS",
          timeZone: "America/New_York",
          challengeTags: ["GTM", "Outbound", "RevOps"],
        }),
      });
      const data = await res.json();
      if (data.success && data.agent) {
        toast.success(`Auto-Assigned to ${data.agent.name}! Match Score: ${data.matchScore}/100`);
        if (onAutoAssignSuccess) onAutoAssignSuccess(data.agent);
        if (onSelectAgent) onSelectAgent(data.agent.key);
        fetchRoster();
      } else {
        toast.error(data.error || "Auto-assignment failed");
      }
    } catch (err) {
      toast.error("Auto-assignment request failed");
    } finally {
      setAutoAssigning(false);
    }
  };

  const filteredAgents =
    filterExpertise === "all"
      ? agents
      : agents.filter(
          (a) =>
            a.expertise.some((e) => e.toLowerCase().includes(filterExpertise.toLowerCase())) ||
            (a.specialties && a.specialties.some((s) => s.toLowerCase().includes(filterExpertise.toLowerCase())))
        );

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <Users className="h-4 w-4" /> AI Revenue Agent Roster Selection
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Status
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Select or Auto-Assign Your Revenue Agent
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Browse full profiles, expertise specialties, active workload, and real-time availability.
              Or let our AI matching engine select the optimal agent for your business.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchRoster}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
              title="Refresh Roster"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {autoAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Matching Best Agent...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300 fill-amber-300" /> Auto-Assign Best Match
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80 mt-4">
          <span className="text-xs font-semibold text-slate-400 self-center mr-1">Filter Expertise:</span>
          {["all", "gtm", "outbound", "growth", "enterprise", "revops", "content"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterExpertise(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                filterExpertise === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Grid Roster View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const isAssigned = currentAssignedAgentKey === agent.key;
            const workloadPct = Math.min(100, Math.round(((agent.activeSessions || 0) / (agent.maxSessions || 3)) * 100));

            return (
              <GlassPanel
                key={agent.key}
                tilt={false}
                className={`relative border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                  isAssigned
                    ? "border-cyan-500 bg-cyan-950/20 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30"
                    : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                }`}
              >
                <div>
                  {/* Status Badges Header */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          agent.onlineStatus === "online"
                            ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                            : agent.onlineStatus === "busy"
                            ? "bg-amber-400"
                            : "bg-slate-500"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {agent.onlineStatus || "online"}
                      </span>
                    </div>

                    {isAssigned ? (
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Currently Assigned
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {agent.rating || 4.9}
                      </span>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md flex-shrink-0">
                      {agent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight">{agent.name}</h3>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">{agent.title || agent.role}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-indigo-400" /> {agent.timeZone?.split(" ")[0] || "EST"}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{agent.winRate || "35%"} Win Rate</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 leading-relaxed mt-3 line-clamp-3 font-light">
                    {agent.bio || "Dedicated AI Revenue Specialist optimizing sales execution and GTM pipeline strategy."}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(agent.specialties || agent.expertise).map((spec) => (
                      <span
                        key={spec}
                        className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workload & Action Footer */}
                <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-3">
                  {/* Workload Meter */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                      <span>Workload Capacity:</span>
                      <span className={workloadPct >= 100 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                        {agent.activeSessions || 0} / {agent.maxSessions || 3} Accounts ({workloadPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          workloadPct >= 100 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                        }`}
                        style={{ width: `${workloadPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => {
                      if (onSelectAgent) onSelectAgent(agent.key);
                      toast.success(`Selected ${agent.name} as your Revenue Agent.`);
                    }}
                    disabled={isAssigned}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isAssigned
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 cursor-default"
                        : "bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500 shadow-md"
                    }`}
                  >
                    {isAssigned ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Active Assigned Agent
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" /> Select {agent.name}
                      </>
                    )}
                  </button>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
