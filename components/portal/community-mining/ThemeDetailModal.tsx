// components/portal/community-mining/ThemeDetailModal.tsx
"use client";

import React, { useState } from "react";
import {
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Shield,
  Layers,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import type { CMTheme, CMThemeStatus, CMTeam } from "@/types/community-mining";

interface ThemeDetailModalProps {
  theme: CMTheme;
  onClose: () => void;
  onUpdateStatus: (themeId: string, status: CMThemeStatus, assignedTeam: CMTeam) => Promise<void>;
}

export function ThemeDetailModal({ theme, onClose, onUpdateStatus }: ThemeDetailModalProps) {
  const [status, setStatus] = useState<CMThemeStatus>(theme.status);
  const [team, setTeam] = useState<CMTeam>(theme.assignedTeam);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateStatus(theme.id, status, team);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const severityBadgeClass = {
    critical: "bg-red-500/20 text-red-300 border-red-500/40",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  }[theme.severity] || "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <GlassPanel
        tilt={false}
        className="w-full max-w-4xl bg-slate-900/95 border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badges & Title */}
        <div className="space-y-3 pr-10 border-b border-slate-800/80 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${severityBadgeClass}`}>
              {theme.severity} Severity
            </span>
            <span className="bg-violet-950/40 border border-violet-850 text-violet-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-violet-400" /> Clustered Theme ({theme.itemCount} items)
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated: {new Date(theme.lastUpdatedAt).toLocaleDateString()}
            </span>
          </div>

          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">{theme.label}</h2>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-light">{theme.description}</p>
        </div>

        {/* Top Entities & Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Sentiment Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black ${theme.sentimentAvg >= 0.2 ? "text-emerald-400" : theme.sentimentAvg <= -0.2 ? "text-red-400" : "text-slate-300"}`}>
                {theme.sentimentAvg > 0 ? `+${theme.sentimentAvg}` : theme.sentimentAvg}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">(-1.0 to +1.0)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Velocity Delta</span>
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-black">+{theme.velocityScore || 25}%</span>
              <span className="text-[10px] text-slate-400">vs last 7d</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Top Entities</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {theme.topEntities.map((ent, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {ent}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Volume Trend Curve */}
        <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> Item Volume by Date
          </h4>
          <div className="flex items-end gap-2 h-20 pt-2 border-b border-slate-850 pb-2">
            {theme.trend.map((pt, i) => {
              const maxCount = Math.max(...theme.trend.map((t) => t.count), 1);
              const heightPercent = Math.max(15, Math.round((pt.count / maxCount) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t group-hover:from-violet-500 group-hover:to-cyan-400 transition-all cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center">
                    {pt.date.slice(5)}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-7 bg-slate-950 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                    {pt.count} items
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw Sample Customer Quotes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-cyan-400" /> Sample Customer Voices & Excerpts
          </h4>
          <div className="space-y-2.5">
            {theme.sampleQuotes.map((quote, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-850/80 text-xs text-slate-200 leading-relaxed italic relative pl-8">
                <span className="absolute left-3 top-3 text-violet-400 font-serif font-black text-base leading-none">“</span>
                {quote}
              </div>
            ))}
          </div>
        </div>

        {/* Management Controls: Status & Team Assignment */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-mono">Team:</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value as CMTeam)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="product">Product & Engineering</option>
                <option value="cs">Customer Success</option>
                <option value="sales">Sales & GTM</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-mono">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CMThemeStatus)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="new">New / Unreviewed</option>
                <option value="reviewed">Under Investigation (Reviewed)</option>
                <option value="actioned">Actioned & Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-850"
            >
              Close
            </button>

            <ExtrudedButton
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2 px-6 rounded-xl shadow-lg shadow-violet-500/20 inline-flex items-center gap-1.5"
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
              ) : savedSuccess ? (
                <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved!</>
              ) : (
                <>Save Theme Updates</>
              )}
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
