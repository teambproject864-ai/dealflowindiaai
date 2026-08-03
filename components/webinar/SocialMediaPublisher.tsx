"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Calendar,
  Send,
  CheckCircle2,
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2,
  BarChart2,
  Sparkles,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { AIContentGeneration, SocialPlatformId } from "@/types/webinar";

interface SocialMediaPublisherProps {
  aiContent?: AIContentGeneration;
}

export function SocialMediaPublisher({ aiContent }: SocialMediaPublisherProps) {
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState<Record<string, { status: "published" | "scheduled"; time?: string }>>({
    linkedin: { status: "published", time: "2026-08-03 10:00" },
    twitter: { status: "published", time: "2026-08-03 10:05" },
  });

  const platforms: { id: SocialPlatformId; name: string; icon: string; color: string }[] = [
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "text-sky-400 border-sky-500/30" },
    { id: "facebook", name: "Facebook", icon: "📘", color: "text-blue-400 border-blue-500/30" },
    { id: "instagram", name: "Instagram", icon: "📸", color: "text-pink-400 border-pink-500/30" },
    { id: "twitter", name: "X (Twitter)", icon: "🐦", color: "text-slate-200 border-slate-500/30" },
    { id: "threads", name: "Threads", icon: "🧵", color: "text-purple-400 border-purple-500/30" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "text-emerald-400 border-emerald-500/30" },
    { id: "telegram", name: "Telegram", icon: "✈️", color: "text-cyan-400 border-cyan-500/30" },
    { id: "youtube", name: "YouTube", icon: "🔴", color: "text-red-400 border-red-500/30" },
    { id: "email", name: "Email", icon: "📧", color: "text-amber-400 border-amber-500/30" },
  ];

  const handleAction = async (platformId: SocialPlatformId, action: "publish" | "schedule") => {
    setPublishing(platformId);
    try {
      const res = await fetch("/api/webinar/social-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishedStatus((prev) => ({
          ...prev,
          [platformId]: {
            status: action === "publish" ? "published" : "scheduled",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        }));
      }
    } catch (e) {
      console.error("Social publish error", e);
    } finally {
      setPublishing(null);
    }
  };

  return (
    <GlassPanel className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Share2 className="w-4 h-4" /> Connected Social Media Publishing Hub
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Multi-Channel Campaign Manager</h2>
          <p className="text-xs text-slate-400">Publish or schedule promotional posts across 9 platforms with automated click telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <ExtrudedButton
            onClick={() => {
              platforms.forEach((p) => handleAction(p.id, "publish"));
            }}
            className="bg-cyan-500/20 border-cyan-500/40 text-cyan-200 flex items-center gap-2 text-xs font-bold"
          >
            <Zap className="w-4 h-4" /> Publish All 9 Channels Now
          </ExtrudedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((p) => {
          const creative = aiContent?.socialCreatives[p.id];
          const pubInfo = publishedStatus[p.id];

          return (
            <div key={p.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <span className="font-extrabold text-sm text-slate-100">{p.name}</span>
                  </div>

                  {pubInfo ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {pubInfo.status}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-mono">
                      Draft Ready
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 italic">
                  "{creative?.caption || `Generated promotion copy ready for ${p.name}`}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Clicks: <strong className="text-cyan-300">{pubInfo ? "184" : "0"}</strong></span>
                  <span>Registrations: <strong className="text-emerald-300">{pubInfo ? "24" : "0"}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={() => handleAction(p.id, "schedule")}
                  disabled={publishing === p.id}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> Schedule
                </button>

                <button
                  onClick={() => handleAction(p.id, "publish")}
                  disabled={publishing === p.id}
                  className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {publishing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
