// app/agent-portal/community-mining/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Shield,
  Upload,
  Layers,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { OverviewTab } from "@/components/portal/community-mining/OverviewTab";
import { FeedbackFeedTab } from "@/components/portal/community-mining/FeedbackFeedTab";
import { RoutingRulesTab } from "@/components/portal/community-mining/RoutingRulesTab";
import { SourcesUploadTab } from "@/components/portal/community-mining/SourcesUploadTab";
import { ThemeDetailModal } from "@/components/portal/community-mining/ThemeDetailModal";
import type { CMStatsOverview, CMTheme, CMThemeStatus, CMTeam } from "@/types/community-mining";

export default function CommunityMiningPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "feed" | "routing" | "sources">("overview");
  const [stats, setStats] = useState<CMStatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CMTheme | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community-mining/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load community mining stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTriggerBatchProcess = async () => {
    setIsProcessing(true);
    setProcessStatus(null);
    try {
      const res = await fetch("/api/community-mining/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 30, triggerClustering: true }),
      });
      const data = await res.json();
      if (data.success) {
        setProcessStatus(`Processed ${data.processedItems} items & generated ${data.themesGenerated} themes.`);
        await fetchStats();
      }
    } catch (err) {
      console.error("Batch processing error:", err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessStatus(null), 4000);
    }
  };

  const handleUpdateThemeStatus = async (themeId: string, status: CMThemeStatus, assignedTeam: CMTeam) => {
    try {
      const res = await fetch("/api/community-mining/themes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, status, assignedTeam }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
        if (selectedTheme && selectedTheme.id === themeId) {
          setSelectedTheme({ ...selectedTheme, status, assignedTeam });
        }
      }
    } catch (err) {
      console.error("Failed to update theme status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/portal/agent"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Agent Portal
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-violet-400 font-mono font-bold">Community Mining Intelligence</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-violet-400" />
            Community Mining Automation Hub
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl font-light">
            Continuous unstructured feedback ingestion, LLM sentiment & entity clustering, and automated routing rules.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ExtrudedButton
            onClick={handleTriggerBatchProcess}
            disabled={isProcessing}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-violet-500/20 inline-flex items-center gap-2"
          >
            {isProcessing ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Processing Queue...</>
            ) : (
              <><Zap className="h-3.5 w-3.5" /> Run LLM Processing Batch</>
            )}
          </ExtrudedButton>
        </div>
      </div>

      {processStatus && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-850 text-emerald-300 text-xs font-mono rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {processStatus}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Intelligence Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === "feed"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Raw Feedback Stream</span>
        </button>

        <button
          onClick={() => setActiveTab("routing")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === "routing"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Routing & Notification Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("sources")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === "sources"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Sources & Manual Upload</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={stats}
          isLoading={isLoading}
          onSelectTheme={setSelectedTheme}
          onRefresh={fetchStats}
        />
      )}

      {activeTab === "feed" && <FeedbackFeedTab />}

      {activeTab === "routing" && <RoutingRulesTab />}

      {activeTab === "sources" && <SourcesUploadTab />}

      {/* Theme Detail Modal */}
      {selectedTheme && (
        <ThemeDetailModal
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
          onUpdateStatus={handleUpdateThemeStatus}
        />
      )}

    </div>
  );
}
