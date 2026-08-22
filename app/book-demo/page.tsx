"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Zap,
  Shield,
  Globe,
  ArrowLeft,
  Star,
  Video,
  MessageSquare,
  CheckCircle2,
  Lock,
  Clock
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { CalendlyWidget } from "@/components/scheduling/calendly-widget";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const BENEFITS = [
  {
    icon: <Zap className="h-6 w-6 text-purple-400" />,
    title: "Autonomous Workforce Walkthrough",
    description: "Experience how AI agents understand business goals, research pain points, and autonomously engage prospects.",
  },
  {
    icon: <Shield className="h-6 w-6 text-teal-400" />,
    title: "Live AI Call Rep & Negotiation Demo",
    description: "See the AI join live calls as a human representative, handle objections, and negotiate within commercial boundaries.",
  },
  {
    icon: <Globe className="h-6 w-6 text-amber-400" />,
    title: "Post-Sale Requirement Execution",
    description: "Learn how the workforce transitions closed deals into automated deliverable fulfillment and ALMA self-learning.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "VP of Revenue Operations, TechScale",
    content: "DealFlow.ai's AI representatives joined prospect calls, negotiated within our guardrails, and closed 40+ deals.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "CEO at GrowthLab",
    content: "Our AI workforce took our quarterly business goal and delivered an automated pipeline that closed in weeks.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Sales Director at InnovateCo",
    content: "The post-sale requirement fulfillment engine transformed how we deliver agreed client deliverables.",
    rating: 5,
  },
];

export default function BookDemoPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
        <div className="flex items-center space-x-3 text-slate-400 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading Book Demo Scheduler...</span>
        </div>
      </main>
    );
  }

  return (
    <main suppressHydrationWarning className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500/20 selection:text-teal-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-24 space-y-12">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg px-2 py-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to DealFlow AI
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-300 uppercase tracking-wider shadow-sm">
            <Calendar className="h-4 w-4" />
            <span>Official Workforce Strategy Session</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            See the Autonomous AI Workforce{" "}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              in Action
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Schedule a 30-minute personalized strategy session with our Solutions Engineering team to see how DealFlow.ai executes your revenue operations end-to-end.
          </p>
        </div>

        {/* Value Prop Benefits Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {BENEFITS.map((benefit, idx) => (
            <GlassPanel
              key={idx}
              material="glass"
              depth="mid"
              className="p-6 border-slate-800/80 bg-slate-900/60 rounded-2xl hover:border-slate-700 transition-colors"
            >
              <div className="mb-3.5">{benefit.icon}</div>
              <h3 className="text-base font-bold text-white mb-1.5">
                {benefit.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </GlassPanel>
          ))}
        </div>

        {/* Main Section Grid: Calendly Widget + Sidebar */}
        <div className="grid gap-10 lg:grid-cols-[1fr,380px] items-start max-w-7xl mx-auto">
          {/* Main Container: Embedded Official Calendly Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <GlassPanel
              material="glass"
              depth="mid"
              className="p-2 sm:p-4 border-slate-800/80 bg-slate-900/40 rounded-3xl"
            >
              <CalendlyWidget height="750px" />
            </GlassPanel>
          </motion.div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Demo Video Preview */}
            <GlassPanel
              material="glass"
              depth="mid"
              className="p-6 border-slate-800/80 bg-slate-900/50 rounded-2xl space-y-4"
            >
              <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-teal-500/20 group-hover:scale-105 transition-transform duration-300" />
                <Video className="h-12 w-12 text-teal-400/80 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Watch 30-Second Product Overview
                </h3>
                <p className="text-xs text-slate-400">
                  Preview how DealFlow AI autonomous agents streamline pipeline revenue operations.
                </p>
              </div>
            </GlassPanel>

            {/* Testimonials */}
            <GlassPanel
              material="glass"
              depth="mid"
              className="p-6 border-slate-800/80 bg-slate-900/50 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400 fill-amber-400"
                  />
                ))}
                <span className="text-xs text-slate-300 font-bold ml-1">4.9/5 Rating</span>
              </div>

              <div className="space-y-4 divide-y divide-slate-800/60">
                {TESTIMONIALS.map((t, idx) => (
                  <div key={idx} className={idx > 0 ? "pt-3 space-y-1" : "space-y-1"}>
                    <p className="text-xs text-slate-300 italic">
                      &quot;{t.content}&quot;
                    </p>
                    <div className="text-[11px] text-slate-400 font-semibold">
                      {t.name} • <span className="text-slate-500">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Help / Live Support Card */}
            <GlassPanel
              material="glass"
              depth="mid"
              className="p-6 border-slate-800/80 bg-slate-900/50 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Need Help Scheduling?
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Have questions before your call? Our RevOps team is available for live assistance.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/portal/agent")}
                className="w-full h-10 border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Connect via Agent Portal
              </Button>
            </GlassPanel>
          </div>
        </div>
      </div>
    </main>
  );
}
