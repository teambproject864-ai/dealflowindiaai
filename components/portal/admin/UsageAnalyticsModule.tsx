// components/portal/admin/UsageAnalyticsModule.tsx
"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  Cpu, 
  Database, 
  Layers, 
  Zap, 
  TrendingUp, 
  Server, 
  HardDrive,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";

export function UsageAnalyticsModule() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  const consumptionStats = {
    totalTokensUsed: "14,890,200",
    storageUsedGb: 42.8,
    storageLimitGb: 100,
    apiCallsTotal: "482,120",
    botMinutesTotal: 1840,
    activeModel: "Kimi Moonshot v1 + HuggingFace + Recall.ai"
  };

  const featureAdoption = [
    { feature: "SEO & GEO Keyword Studio", usagePercentage: 88, requests: "124,300" },
    { feature: "Autonomous Meeting Bot", usagePercentage: 74, requests: "1,840 sessions" },
    { feature: "Community Mining Automation", usagePercentage: 62, requests: "89,120 leads" },
    { feature: "Dealflow CRM Pipeline Sync", usagePercentage: 95, requests: "268,700 calls" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-blue-950/20 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold bg-blue-950/60 border border-blue-700/50 px-2 py-0.5 rounded-full">
              Resource Telemetry
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <BarChart3 className="h-6 w-6 text-blue-400" /> Usage & Analytics Overview
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Track token consumption, storage allocation, API throughput, and feature adoption across all client organizations.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-0.5 text-xs font-mono">
            <button
              onClick={() => setTimeRange("24h")}
              className={`px-3 py-1 rounded-lg ${timeRange === "24h" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1 rounded-lg ${timeRange === "7d" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1 rounded-lg ${timeRange === "30d" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            >
              30d
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Consumption Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase font-mono">LLM Tokens</span>
            <Cpu className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{consumptionStats.totalTokensUsed}</p>
          <span className="text-[10px] text-emerald-400 font-mono">↑ 14% vs previous window</span>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase font-mono">API Requests</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{consumptionStats.apiCallsTotal}</p>
          <span className="text-[10px] text-slate-400 font-mono">Avg Latency: 42ms</span>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase font-mono">Storage Capacity</span>
            <HardDrive className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{consumptionStats.storageUsedGb} / {consumptionStats.storageLimitGb} GB</p>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-violet-500 h-full rounded-full" style={{ width: `${(consumptionStats.storageUsedGb / consumptionStats.storageLimitGb) * 100}%` }} />
          </div>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase font-mono">Meeting Bot Time</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{consumptionStats.botMinutesTotal} mins</p>
          <span className="text-[10px] text-cyan-400 font-mono">100% Transcription Accuracy</span>
        </GlassPanel>
      </div>

      {/* Feature Adoption Breakdown */}
      <GlassPanel tilt={false} className="border-slate-800/80 p-6 bg-slate-950/60 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-400" /> Feature Adoption & Engine Utilization
        </h3>

        <div className="space-y-3.5">
          {featureAdoption.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{item.feature}</span>
                <span className="font-mono text-slate-400">{item.requests} ({item.usagePercentage}% Adoption)</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${item.usagePercentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

    </div>
  );
}
