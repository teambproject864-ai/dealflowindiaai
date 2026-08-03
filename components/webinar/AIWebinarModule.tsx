"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  Sparkles,
  Share2,
  Users,
  Radio,
  FileCheck2,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { WebinarCreationWizard } from "./WebinarCreationWizard";
import { AIContentGeneratorStudio } from "./AIContentGeneratorStudio";
import { SocialMediaPublisher } from "./SocialMediaPublisher";
import { RegistrationManager } from "./RegistrationManager";
import { AIHostStudio } from "./AIHostStudio";
import { PostWebinarAutomationHub } from "./PostWebinarAutomationHub";
import { WebinarAnalyticsDashboard } from "./WebinarAnalyticsDashboard";
import { Webinar, WebinarWizardData, AIContentGeneration } from "@/types/webinar";

type WebinarSubTab = "overview" | "wizard" | "content_studio" | "social_publisher" | "registrations" | "live_host" | "post_automation" | "analytics";

export function AIWebinarModule() {
  const [subTab, setSubTab] = useState<WebinarSubTab>("overview");
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [activeWebinar, setActiveWebinar] = useState<Webinar | null>(null);

  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
    try {
      const res = await fetch("/api/webinar");
      const data = await res.json();
      if (data.success && data.webinars) {
        setWebinars(data.webinars);
        if (data.webinars.length > 0) {
          setActiveWebinar(data.webinars[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWizardComplete = async (wizardData: WebinarWizardData) => {
    try {
      const res = await fetch("/api/webinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizardData }),
      });
      const data = await res.json();
      if (data.success && data.webinar) {
        setWebinars([data.webinar, ...webinars]);
        setActiveWebinar(data.webinar);
        setSubTab("content_studio");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAIContent = (aiContent: AIContentGeneration) => {
    if (activeWebinar) {
      const updated = { ...activeWebinar, aiContent };
      setActiveWebinar(updated);
      setWebinars((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <GlassPanel className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Video className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-100 tracking-tight">AI Webinar Module</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                  AGENT PORTAL HUB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Create, market across 9 social channels, manage registrations, host via AI Dealflow Bot, and analyze webinar telemetry end-to-end.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExtrudedButton onClick={() => setSubTab("wizard")} className="bg-cyan-500/20 border-cyan-500/40 text-cyan-200 flex items-center gap-2 text-xs font-bold">
              <Plus className="w-4 h-4" /> Create New AI Webinar
            </ExtrudedButton>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 pt-6 border-t border-slate-850 mt-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Video },
            { id: "wizard", label: "Creation Wizard", icon: Plus },
            { id: "content_studio", label: "AI Content & 9 Socials", icon: Sparkles },
            { id: "social_publisher", label: "Social Media Publisher", icon: Share2 },
            { id: "registrations", label: "Registrations & QR", icon: Users },
            { id: "live_host", label: "AI Host Arena", icon: Radio },
            { id: "post_automation", label: "Post-Webinar & CRM", icon: FileCheck2 },
            { id: "analytics", label: "Analytics & ROI", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as WebinarSubTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Main View Area */}
      {subTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono">Active Webinars</span>
              <div className="text-2xl font-black text-slate-100">{webinars.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono">Total Registrations</span>
              <div className="text-2xl font-black text-cyan-400">248</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono">AI Host Success Rate</span>
              <div className="text-2xl font-black text-emerald-400">99.4%</div>
            </div>
          </div>

          {/* Webinars List */}
          <GlassPanel className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">All Scheduled & Archived Webinars</h3>

            <div className="space-y-3">
              {webinars.map((web) => (
                <div
                  key={web.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-100 text-base">{web.wizardData.title}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono capitalize">
                        {web.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{web.wizardData.topic} • Targeted to: {web.wizardData.targetAudience}</p>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> {web.wizardData.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /> {web.wizardData.time} {web.wizardData.timezone}</span>
                      <span>Speaker: <strong className="text-slate-200">{web.wizardData.speakerName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveWebinar(web);
                        setSubTab("live_host");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 flex items-center gap-1"
                    >
                      <Radio className="w-3.5 h-3.5" /> Launch AI Host
                    </button>

                    <button
                      onClick={() => {
                        setActiveWebinar(web);
                        setSubTab("content_studio");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-slate-700 flex items-center gap-1"
                    >
                      View AI Assets <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {subTab === "wizard" && (
        <WebinarCreationWizard onComplete={handleWizardComplete} onCancel={() => setSubTab("overview")} />
      )}

      {subTab === "content_studio" && activeWebinar && (
        <AIContentGeneratorStudio
          wizardData={activeWebinar.wizardData}
          existingContent={activeWebinar.aiContent}
          onSaveContent={handleSaveAIContent}
        />
      )}

      {subTab === "social_publisher" && activeWebinar && (
        <SocialMediaPublisher aiContent={activeWebinar.aiContent} />
      )}

      {subTab === "registrations" && activeWebinar && (
        <RegistrationManager initialRegistrations={activeWebinar.registrations} />
      )}

      {subTab === "live_host" && activeWebinar && (
        <AIHostStudio wizardData={activeWebinar.wizardData} />
      )}

      {subTab === "post_automation" && activeWebinar && (
        <PostWebinarAutomationHub existingPostData={activeWebinar.postWebinar} />
      )}

      {subTab === "analytics" && activeWebinar && (
        <WebinarAnalyticsDashboard existingAnalytics={activeWebinar.analytics} />
      )}
    </div>
  );
}
