"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  Award,
  Database,
  CheckCircle2,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  Star,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { PostWebinarData } from "@/types/webinar";

interface PostWebinarAutomationHubProps {
  existingPostData?: PostWebinarData;
}

export function PostWebinarAutomationHub({ existingPostData }: PostWebinarAutomationHubProps) {
  const [postData, setPostData] = useState<PostWebinarData | null>(
    existingPostData || {
      webinarId: "webinar-1",
      recordingUrl: "https://storage.googleapis.com/dealflow-webinars/recordings/ai-revops-2026.mp4",
      transcript: [
        { time: "00:02", speaker: "AI Dealflow Bot", text: "Welcome everyone to AI-Powered Revenue Operations 2026." },
        { time: "05:14", speaker: "AI Dealflow Bot", text: "Notice how automated qualification saves 15 hours per rep per week." },
        { time: "22:40", speaker: "Sarah Jenkins (Audience)", text: "How does the bot handle multi-currency pricing questions?" },
        { time: "23:05", speaker: "AI Dealflow Bot", text: "Great question Sarah! The RAG knowledge engine reads live rate sheets and localizes quotes dynamically." },
      ],
      summary: {
        overview: "The session covered autonomous revenue operations, live RAG knowledge integration, and SDR workflow transformation.",
        keyTakeaways: [
          "AI agents reduce inbound response time from 4 hours to sub-5 seconds.",
          "RAG integration enables real-time context-aware buyer Q&A without human intervention.",
          "Lead scoring automation accurately flags hot enterprise deals for immediate co-host transfer.",
        ],
        actionItems: [
          "Deploy AI Dealflow Bot snippet to company landing page.",
          "Connect CRM pipeline webhooks for lead sync.",
          "Send PDF Certificates of Completion to 142 qualified attendees.",
        ],
      },
      leadScores: [
        { attendeeId: "reg-101", name: "Sarah Jenkins", score: 95, classification: "Hot" },
        { attendeeId: "reg-102", name: "David Miller", score: 84, classification: "Warm" },
        { attendeeId: "reg-103", name: "Elena Rostova", score: 91, classification: "Hot" },
      ],
      certificatesGenerated: 142,
      feedbackSurveyResults: {
        averageRating: 4.9,
        responsesCount: 88,
        topFeedback: [
          "The live AI Bot Q&A response speed was mind-blowing!",
          "Best revenue masterclass of the year.",
          "Super smooth slide progression and presentation.",
        ],
      },
      crmSyncStatus: "synced",
      followUpSequenceSent: true,
    }
  );

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4" /> Post-Webinar Automation Engine
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Transcripts, Lead Scores & CRM Sync</h2>
          <p className="text-xs text-slate-400">Automated post-event workflows, certificate generation, and follow-up sequences</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> Dealflow CRM: Synced
          </div>
        </div>
      </div>

      {postData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 & 2: Recording, Transcripts & AI Summaries */}
          <div className="md:col-span-2 space-y-4">
            {/* Recording & Transcript */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-cyan-400" /> Recording & AI Transcript Reader
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">HD Stream Saved</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {postData.transcript.map((t, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-slate-300">{t.speaker}</span>
                      <span>{t.time}</span>
                    </div>
                    <p className="text-slate-300">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary & Takeaways */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Executive Summary</h3>
              <p className="text-xs text-slate-300">{postData.summary.overview}</p>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Key Takeaways</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {postData.summary.keyTakeaways.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Col 3: Lead Scores & Certificate Generator */}
          <div className="space-y-4">
            {/* Lead Scores */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-2">
                AI Lead Intent Scoring
              </span>
              <div className="space-y-2">
                {postData.leadScores.map((ls) => (
                  <div key={ls.attendeeId} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs">
                    <div>
                      <span className="font-bold text-slate-100 block">{ls.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Score: {ls.score}/100</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        ls.classification === "Hot"
                          ? "bg-red-500/10 border border-red-500/30 text-red-400"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                      }`}
                    >
                      🔥 {ls.classification}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Issuer */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-center">
              <Award className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-slate-100">Certificate of Completion</h4>
                <p className="text-xs text-slate-400">{postData.certificatesGenerated} PDF Certificates Generated</p>
              </div>

              <ExtrudedButton onClick={() => alert("Certificates auto-emailed to attendees!")} className="w-full text-xs bg-cyan-500/20 border-cyan-500/40 text-cyan-200">
                Auto-Email Certificates
              </ExtrudedButton>
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
