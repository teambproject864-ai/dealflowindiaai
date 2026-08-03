"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Award,
  Download,
  Share2,
  DollarSign,
  PieChart,
  HelpCircle,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { WebinarAnalytics } from "@/types/webinar";

interface WebinarAnalyticsDashboardProps {
  existingAnalytics?: WebinarAnalytics;
}

export function WebinarAnalyticsDashboard({ existingAnalytics }: WebinarAnalyticsDashboardProps) {
  const analytics: WebinarAnalytics = existingAnalytics || {
    webinarId: "webinar-1",
    totalRegistrations: 248,
    totalAttended: 186,
    attendanceRate: 75,
    avgWatchTimeMinutes: 38,
    engagementScore: 92,
    pollResponseRate: 84,
    qaQuestionsCount: 42,
    leadQualityBreakdown: { hot: 48, warm: 92, cold: 46 },
    estimatedROI: "14.2x ($142,000 Pipeline Value)",
    socialPerformance: [
      { platform: "linkedin", impressions: 14200, clicks: 1240, registrations: 112 },
      { platform: "twitter", impressions: 9800, clicks: 810, registrations: 54 },
      { platform: "email", font: "Email", impressions: 4500, clicks: 920, registrations: 62 },
    ] as any,
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Metric,Value\nRegistrations,248\nAttended,186\nShowRate,75%\nROI,$142000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "webinar_analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <BarChart3 className="w-4 h-4" /> Webinar Intelligence & ROI Analytics
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Performance & Campaign Telemetry</h2>
          <p className="text-xs text-slate-400">Track registrations, attendance show rates, audience watch time, and conversion ROI</p>
        </div>

        <div className="flex items-center gap-3">
          <ExtrudedButton onClick={handleExportCSV} className="bg-cyan-500/20 border-cyan-500/40 text-cyan-200 flex items-center gap-1.5 text-xs font-bold">
            <Download className="w-4 h-4" /> Export Report (CSV)
          </ExtrudedButton>
        </div>
      </div>

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedMetricCard
          title="Total Registrations"
          value={analytics.totalRegistrations.toString()}
          change="+34% vs last event"
          isPositive={true}
          accentColor="cyan"
          icon={Users}
        />
        <AnimatedMetricCard
          title="Attendance Show Rate"
          value={`${analytics.attendanceRate}%`}
          change={`${analytics.totalAttended} live attendees`}
          isPositive={true}
          accentColor="emerald"
          icon={TrendingUp}
        />
        <AnimatedMetricCard
          title="Avg Watch Time"
          value={`${analytics.avgWatchTimeMinutes} mins`}
          change="84% of total duration"
          isPositive={true}
          accentColor="violet"
          icon={Clock}
        />
        <AnimatedMetricCard
          title="Estimated Pipeline ROI"
          value={analytics.estimatedROI.split(" ")[0]}
          change={analytics.estimatedROI.split(" ")[1] || "14.2x"}
          isPositive={true}
          accentColor="amber"
          icon={DollarSign}
        />
      </div>

      {/* Charts & Deep-Dive Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Quality Distribution */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" /> AI Lead Intent Distribution
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-bold">🔥 Hot Leads (48)</span>
                <span className="text-slate-400 font-mono">26%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "26%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-bold">⚡ Warm Leads (92)</span>
                <span className="text-slate-400 font-mono">49%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "49%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-bold">❄️ Cold Leads (46)</span>
                <span className="text-slate-400 font-mono">25%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Q&A & Polling Engagement */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" /> Live Interactivity & Poll Insights
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-2xl font-black text-purple-400">{analytics.pollResponseRate}%</span>
              <span className="text-[11px] text-slate-400 block font-medium">Poll Response Rate</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-2xl font-black text-cyan-400">{analytics.qaQuestionsCount}</span>
              <span className="text-[11px] text-slate-400 block font-medium">RAG Questions Asked</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            Top question category: "CRM Integration API speed and multi-tenant security safeguards."
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
