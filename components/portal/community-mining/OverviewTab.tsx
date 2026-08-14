// components/portal/community-mining/OverviewTab.tsx
"use client";

import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Layers,
  MessageSquare,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import type { CMStatsOverview, CMTheme } from "@/types/community-mining";

interface OverviewTabProps {
  stats: CMStatsOverview | null;
  isLoading: boolean;
  onSelectTheme: (theme: CMTheme) => void;
  onRefresh: () => void;
}

export function OverviewTab({ stats, isLoading, onSelectTheme, onRefresh }: OverviewTabProps) {
  if (!stats && isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-violet-400" /> Loading Community Mining Intelligence...
      </div>
    );
  }

  const themes = stats?.trendingThemes || [];
  const sources = stats?.sourcesHealth || [];
  const sentiment = stats?.sentimentBreakdown || { positive: 50, neutral: 30, negative: 15, mixed: 5 };
  const totalSent = sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.mixed || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Level KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/40 p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Total Ingested</span>
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-white">{stats?.totalIngested || 0}</span>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +{stats?.weeklyVelocity || 28}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Feedback items synced across all sources</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/40 p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Processed Insights</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-cyan-300">{stats?.totalProcessed || 0}</span>
            <span className="text-xs text-slate-400 font-mono">100% LLM tagged</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Sentiment, tags, entities & embeddings</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/40 p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Active Themes</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-indigo-300">{stats?.activeThemesCount || 0}</span>
            <span className="text-xs text-violet-400 font-mono">Clustered</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Aggregated feedback trend clusters</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/40 p-5 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Critical Escalations</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-red-400">{stats?.criticalAlertsCount || 0}</span>
            <span className="text-xs text-red-400/80 font-mono font-bold">Action Needed</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Churn risks & high-impact bugs</p>
        </GlassPanel>
      </div>

      {/* Main Grid: Trending Themes vs Sentiment & Source Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Trending Themes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-400" /> Trending Themes This Week vs Last
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Top recurring feedback patterns clustered by AI similarity</p>
            </div>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {themes.map((theme) => {
              const severityColor = {
                critical: "border-l-red-500",
                high: "border-l-amber-500",
                medium: "border-l-blue-500",
                low: "border-l-emerald-500",
              }[theme.severity] || "border-l-slate-700";

              return (
                <GlassPanel
                  key={theme.id}
                  tilt={false}
                  onClick={() => onSelectTheme(theme)}
                  className={`border-slate-850 hover:border-violet-500/50 bg-slate-900/30 hover:bg-slate-900/60 p-5 rounded-2xl cursor-pointer transition-all duration-200 border-l-4 ${severityColor} space-y-3 group`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-slate-300">
                          {theme.assignedTeam.toUpperCase()} TEAM
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          theme.status === "new" ? "bg-violet-950/40 text-violet-300 border-violet-850" :
                          theme.status === "reviewed" ? "bg-amber-950/40 text-amber-300 border-amber-850" :
                          "bg-emerald-950/40 text-emerald-300 border-emerald-850"
                        }`}>
                          {theme.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {theme.itemCount} items ({theme.velocityScore ? `+${theme.velocityScore}%` : "Stable"})
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors pt-1">
                        {theme.label}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-mono font-black ${
                        theme.sentimentAvg >= 0.2 ? "text-emerald-400" :
                        theme.sentimentAvg <= -0.2 ? "text-red-400" : "text-slate-400"
                      }`}>
                        {theme.sentimentAvg > 0 ? `+${theme.sentimentAvg}` : theme.sentimentAvg}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono">Sentiment</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 font-light leading-relaxed">
                    {theme.description}
                  </p>

                  {/* Sample Quote Pill */}
                  {theme.sampleQuotes?.[0] && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850/60 text-[11px] text-slate-300 italic truncate">
                      “{theme.sampleQuotes[0]}”
                    </div>
                  )}
                </GlassPanel>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Sentiment Distribution & Source Health */}
        <div className="space-y-6">
          
          {/* Sentiment Breakdown Widget */}
          <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/30 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> Sentiment Distribution
            </h4>

            {/* Visual Multi-Bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
              <div style={{ width: `${Math.round((sentiment.positive / totalSent) * 100)}%` }} className="bg-emerald-500" title="Positive" />
              <div style={{ width: `${Math.round((sentiment.neutral / totalSent) * 100)}%` }} className="bg-blue-500" title="Neutral" />
              <div style={{ width: `${Math.round((sentiment.negative / totalSent) * 100)}%` }} className="bg-red-500" title="Negative" />
              <div style={{ width: `${Math.round((sentiment.mixed / totalSent) * 100)}%` }} className="bg-amber-500" title="Mixed" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Positive: {sentiment.positive} ({Math.round((sentiment.positive / totalSent) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Neutral: {sentiment.neutral} ({Math.round((sentiment.neutral / totalSent) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Negative: {sentiment.negative} ({Math.round((sentiment.negative / totalSent) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Mixed: {sentiment.mixed} ({Math.round((sentiment.mixed / totalSent) * 100)}%)</span>
              </div>
            </div>
          </GlassPanel>

          {/* Sources Health Status */}
          <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/30 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-400" /> Data Source Health
            </h4>

            <div className="space-y-3">
              {sources.map((src) => (
                <div key={src.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-slate-200">{src.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {src.type} • Synced {src.lastSyncedAt || "Recently"}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white font-bold">{src.itemCount}</span>
                    <span className="text-[10px] text-slate-500 block">items</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

        </div>

      </div>
    </div>
  );
}
