"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Globe,
  Bot,
  User,
  Shield,
  Video,
  Palette,
  ListOrdered,
  HelpCircle,
  BarChart,
  Bell,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { WebinarWizardData, SpeakerType, PlatformType, PrivacyType } from "@/types/webinar";

interface WebinarCreationWizardProps {
  onComplete: (data: WebinarWizardData) => void;
  onCancel?: () => void;
}

export function WebinarCreationWizard({ onComplete, onCancel }: WebinarCreationWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<WebinarWizardData>({
    title: "AI-Driven Enterprise Pipeline Masterclass",
    objective: "Educate B2B buyers on autonomous dealflow automation and drive qualified demo bookings.",
    topic: "Autonomous AI Sales & Marketing Agents",
    description: "Discover how top-performing revenue teams deploy AI bots to handle lead qualification, live Q&A, and CRM data enrichment automatically.",
    targetAudience: "VPs of Revenue Ops, CROs, Growth Marketers, Enterprise Sales Directors",
    industry: "B2B SaaS & Tech",
    date: "2026-08-20",
    time: "11:00",
    duration: 45,
    timezone: "EST (UTC-5)",
    speakerType: "AI_BOT",
    speakerName: "AI Dealflow Bot Host",
    speakerBio: "Autonomous revenue host trained on high-converting sales playbooks.",
    language: "English",
    registrationFields: ["Full Name", "Work Email", "Company Name", "Job Title", "Phone Number"],
    branding: {
      bannerGradient: "from-cyan-500 via-indigo-500 to-purple-600",
      primaryColor: "#06b6d4",
      accentColor: "#6366f1",
    },
    meetingPlatform: "WebRTC",
    privacy: "Public",
    recordingOption: true,
    agenda: [
      { id: "1", timeSlot: "00:00 - 00:05", topic: "Welcome & Interactive Poll", speaker: "AI Host Bot", description: "Opening remarks" },
      { id: "2", timeSlot: "00:05 - 00:25", topic: "The 2026 Revenue Agent Blueprint", speaker: "AI Host Bot", description: "Keynote presentation" },
      { id: "3", timeSlot: "00:25 - 00:40", topic: "Live RAG Q&A Session", speaker: "AI Host Bot", description: "Real-time context query handling" },
    ],
    qaEnabled: true,
    polls: [
      {
        id: "p1",
        question: "How long does your team currently take to follow up with inbound leads?",
        options: [
          { id: "o1", text: "Under 5 minutes", votes: 0 },
          { id: "o2", text: "1 to 4 hours", votes: 0 },
          { id: "o3", text: "24+ hours", votes: 0 },
        ],
      },
    ],
    surveys: [
      { id: "s1", question: "How would you rate today's AI host demonstration?", type: "rating" },
    ],
    resources: [
      { title: "Enterprise AI Dealflow Framework 2026.pdf", url: "#", size: "3.5 MB" },
    ],
    reminders: {
      email: true,
      sms: true,
      whatsapp: true,
      timingMinutesBefore: [1440, 60, 15],
    },
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(formData);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <GlassPanel className="p-6 md:p-8 space-y-6">
      {/* Wizard Header & Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4" /> Step {step} of 5
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Webinar Creation Wizard</h2>
          <p className="text-xs text-slate-400">Configure your end-to-end AI webinar parameters</p>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { num: 1, label: "Overview" },
            { num: 2, label: "Schedule & Host" },
            { num: 3, label: "Branding & Platform" },
            { num: 4, label: "Agenda & Polls" },
            { num: 5, label: "Reminders & Save" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                step === s.num
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10"
                  : step > s.num
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-500"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{s.num}.</span>}
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content Panels */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Webinar Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Primary Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Objective</label>
            <input
              type="text"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Audience</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Start Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase">Speaker / Host Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, speakerType: "AI_BOT" })}
                className={`p-4 rounded-xl border flex items-start gap-3 text-left transition-all ${
                  formData.speakerType === "AI_BOT"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Bot className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-sm block">AI Dealflow Bot (Autonomous)</span>
                  <span className="text-xs text-slate-400">Fully AI-hosted webinar with live RAG Q&A, slide control, and automatic chat moderation.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, speakerType: "HUMAN_AI" })}
                className={`p-4 rounded-xl border flex items-start gap-3 text-left transition-all ${
                  formData.speakerType === "HUMAN_AI"
                    ? "bg-purple-500/15 border-purple-500 text-purple-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <User className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-sm block">Human + AI Co-Pilot</span>
                  <span className="text-xs text-slate-400">Human presenter paired with AI Dealflow Bot co-host for real-time data lookup & polling.</span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Speaker Display Name</label>
              <input
                type="text"
                value={formData.speakerName}
                onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Primary Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-cyan-400" /> Meeting Platform
              </label>
              <select
                value={formData.meetingPlatform}
                onChange={(e) => setFormData({ ...formData, meetingPlatform: e.target.value as PlatformType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="WebRTC">DealsflowsAI WebRTC Studio (Native HD Stream)</option>
                <option value="Zoom">Zoom Video Webinars</option>
                <option value="Teams">Microsoft Teams</option>
                <option value="Google Meet">Google Meet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Privacy Access
              </label>
              <select
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as PrivacyType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="Public">Public (Anyone can register)</option>
                <option value="Private">Private (Approval required)</option>
                <option value="Invite-only">Invite-Only (Specific domain/VIP list)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> Branding & Visual Theme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Banner Color Gradient</span>
                <input
                  type="text"
                  value={formData.branding.bannerGradient}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, bannerGradient: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Primary Color:</span>
                  <input
                    type="color"
                    value={formData.branding.primaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, primaryColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
              <ListOrdered className="w-3.5 h-3.5 text-cyan-400" /> Session Agenda Items
            </label>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  agenda: [
                    ...formData.agenda,
                    {
                      id: Date.now().toString(),
                      timeSlot: "00:40 - 00:45",
                      topic: "New Segment",
                      speaker: "AI Host Bot",
                      description: "Segment description",
                    },
                  ],
                })
              }
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 hover:bg-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Segment
            </button>
          </div>

          <div className="space-y-2">
            {formData.agenda.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <span className="text-xs font-mono text-cyan-400 font-bold w-24 shrink-0">{item.timeSlot}</span>
                <input
                  type="text"
                  value={item.topic}
                  onChange={(e) => {
                    const newAg = [...formData.agenda];
                    newAg[idx].topic = e.target.value;
                    setFormData({ ...formData, agenda: newAg });
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
                <button
                  onClick={() => {
                    const newAg = formData.agenda.filter((_, i) => i !== idx);
                    setFormData({ ...formData, agenda: newAg });
                  }}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {step === 5 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-cyan-400" /> Automated Reminder Schedule
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, email: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                />
                Email Reminders (24h, 1h)
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.sms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, sms: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                />
                SMS Notifications
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, whatsapp: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                />
                WhatsApp Live Invite
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Nav Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-40 flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-transparent text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          )}

          <ExtrudedButton onClick={handleNext} className="bg-cyan-500/20 border-cyan-500/40 text-cyan-200 flex items-center gap-2 text-xs">
            {step === 5 ? "Complete & Save Webinar" : "Next Step"}
            <ChevronRight className="w-4 h-4" />
          </ExtrudedButton>
        </div>
      </div>
    </GlassPanel>
  );
}
