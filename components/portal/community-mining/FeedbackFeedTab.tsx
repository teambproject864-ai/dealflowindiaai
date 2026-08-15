// components/portal/community-mining/FeedbackFeedTab.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Clock,
  Layers,
  AlertCircle,
  Tag,
  User,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { Input } from "@/components/ui/input";
import type { CMInsight, CMSentiment, PlanTier } from "@/types/community-mining";

export function FeedbackFeedTab() {
  const [insights, setInsights] = useState<CMInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== "all") params.set("sourceId", sourceFilter);
      if (sentimentFilter !== "all") params.set("sentiment", sentimentFilter);
      if (tierFilter !== "all") params.set("planTier", tierFilter);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/community-mining/feedback?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights || []);
      }
    } catch (err) {
      console.error("Failed to load feedback feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sourceFilter, sentimentFilter, tierFilter, searchQuery]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInsights();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Filter Bar */}
      <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/40 p-4 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search raw feedback, user names, error messages or tags..."
              className="bg-slate-950/80 border-slate-800 text-xs pl-10 h-10 rounded-xl text-slate-200 focus:border-violet-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 h-10 text-slate-200 focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="support">Support Tickets</option>
              <option value="call_transcript">Call Bot Transcripts</option>
              <option value="community">Community Discord/Slack</option>
              <option value="review">Reviews (G2/Capterra)</option>
              <option value="survey">Surveys</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 h-10 text-slate-200 focus:outline-none"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
            </select>

            {/* Plan Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 h-10 text-slate-200 focus:outline-none"
            >
              <option value="all">All Plan Tiers</option>
              <option value="enterprise">Enterprise Tier</option>
              <option value="growth">Growth Tier</option>
              <option value="starter">Starter Tier</option>
            </select>

            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 h-10 rounded-xl transition-all shadow-md shadow-violet-500/20"
            >
              Search
            </button>
          </div>
        </form>
      </GlassPanel>

      {/* Feed Stream List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-violet-400" /> Loading Feedback Stream...
          </div>
        ) : insights.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono bg-slate-900/20 rounded-2xl border border-slate-850">
            No feedback items match the selected filter criteria.
          </div>
        ) : (
          insights.map((item) => {
            const sentimentBadge = {
              positive: "bg-emerald-950/40 text-emerald-300 border-emerald-850",
              negative: "bg-red-950/40 text-red-300 border-red-850",
              neutral: "bg-blue-950/40 text-blue-300 border-blue-850",
              mixed: "bg-amber-950/40 text-amber-300 border-amber-850",
            }[item.sentiment] || "bg-slate-800 text-slate-300 border-slate-700";

            return (
              <GlassPanel
                key={item.id}
                tilt={false}
                className="border-slate-850 bg-slate-900/30 p-5 rounded-2xl space-y-3.5 hover:border-slate-800 transition-all"
              >
                {/* Meta row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850/60 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                      {item.sourceType.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${sentimentBadge}`}>
                      {item.sentiment}
                    </span>
                    {item.planTier && (
                      <span className="bg-indigo-950/30 border border-indigo-850 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                        {item.planTier}
                      </span>
                    )}
                    {item.authorName && (
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" /> {item.authorName} {item.authorEmail ? `(${item.authorEmail})` : ""}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(item.processedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* 1-Sentence Executive Summary */}
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs lg:text-sm font-semibold text-slate-100">{item.summary}</p>
                </div>

                {/* Raw snippet quote */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs text-slate-300 italic">
                  “{item.rawSnippet}”
                </div>

                {/* Theme Tags & Entities */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.themeTags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-violet-950/30 border border-violet-850/60 text-violet-300 rounded text-[10px] font-mono flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5 text-violet-400" /> {tag}
                    </span>
                  ))}
                  {item.entities.map((ent, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px] font-mono">
                      {ent.name} ({ent.entityType})
                    </span>
                  ))}
                </div>
              </GlassPanel>
            );
          })
        )}
      </div>
    </div>
  );
}
