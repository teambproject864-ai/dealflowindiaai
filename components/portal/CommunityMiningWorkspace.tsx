"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Activity, Database, MessageSquare, ShieldAlert, RefreshCw } from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { OverviewTab } from "./community-mining/OverviewTab";
import { SourcesUploadTab } from "./community-mining/SourcesUploadTab";
import { FeedbackFeedTab } from "./community-mining/FeedbackFeedTab";
import { RoutingRulesTab } from "./community-mining/RoutingRulesTab";
import { ThemeDetailModal } from "./community-mining/ThemeDetailModal";
import type { CMStatsOverview, CMTheme } from "@/types/community-mining";
import { cn } from "@/lib/utils";

export function CommunityMiningWorkspace() {
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "feedback" | "rules">("overview");
  const [stats, setStats] = useState<CMStatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState<CMTheme | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community-mining/stats", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch Community Mining stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500 dark:text-violet-400" />
            <span>Community Mining & Feedback Intelligence Engine</span>
          </h2>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-1 text-xs">
            Ingest unstructured feedback, cluster trending themes, track sentiment, and auto-route tickets to engineering & product teams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExtrudedButton
            variant="outline"
            onClick={fetchStats}
            disabled={isLoading}
            className="rounded-xl text-xs font-semibold py-2 px-3.5 gap-2 border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            <span>Refresh Intelligence</span>
          </ExtrudedButton>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="w-full">
        <div className="flex flex-wrap gap-1.5 bg-black/[0.04] dark:bg-slate-900/60 p-2 rounded-2xl border border-black/[0.08] dark:border-slate-800/80 backdrop-blur-xl w-full">
          {[
            { id: "overview", label: "Executive Overview", icon: Activity },
            { id: "sources", label: "Sources & Ingestion", icon: Database },
            { id: "feedback", label: "Raw Feedback Stream", icon: MessageSquare },
            { id: "rules", label: "Routing Rules & Triggers", icon: ShieldAlert },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <ExtrudedButton
                key={t.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "rounded-xl transition-all duration-300 gap-2 font-semibold text-xs py-2 px-3.5 relative",
                  isActive
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                    : "border-transparent bg-transparent text-[#4E4A67] dark:text-slate-400 hover:text-[#19162F] dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-slate-800/60"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t.label}
              </ExtrudedButton>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={stats}
          isLoading={isLoading}
          onSelectTheme={(theme) => setSelectedTheme(theme)}
          onRefresh={fetchStats}
        />
      )}

      {activeTab === "sources" && (
        <SourcesUploadTab />
      )}

      {activeTab === "feedback" && (
        <FeedbackFeedTab />
      )}

      {activeTab === "rules" && (
        <RoutingRulesTab />
      )}

      {/* Theme Detail Modal */}
      {selectedTheme && (
        <ThemeDetailModal
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
          onUpdateStatus={async (themeId, status, team) => {
            try {
              await fetch(`/api/community-mining/themes/${themeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, assignedTeam: team }),
              });
              await fetchStats();
            } catch (err) {
              console.error("Failed to update theme status", err);
            }
          }}
        />
      )}
    </div>
  );
}
