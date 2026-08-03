"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Radio,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  BarChart,
  AlertTriangle,
  Database,
  Volume2,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { AIHostState, ChatMessage, WebinarWizardData } from "@/types/webinar";

interface AIHostStudioProps {
  wizardData: WebinarWizardData;
}

export function AIHostStudio({ wizardData }: AIHostStudioProps) {
  const [hostState, setHostState] = useState<AIHostState>({
    isHosting: true,
    currentSlideIndex: 0,
    totalSlides: 4,
    botStatus: "speaking",
    ragKnowledgeBaseConnected: true,
    chatMessages: [
      { id: "m1", sender: "AI Host Bot", role: "bot", text: "Welcome everyone! We are live presenting AI Revenue Operations 2026.", timestamp: "11:00", sentiment: "positive" },
      { id: "m2", sender: "Sarah Jenkins", role: "attendee", text: "Excited for this session! How does the bot sync with Salesforce?", timestamp: "11:02", sentiment: "positive" },
    ],
    sentimentOverall: "positive",
    humanEscalationRequired: false,
  });

  const [questionInput, setQuestionInput] = useState<string>("");
  const [askingRAG, setAskingRAG] = useState<boolean>(false);

  const mockSlides = [
    { title: wizardData.title, desc: "Autonomous revenue operations masterclass", visual: "🤖 AI Avatar Presenter Frame" },
    { title: "The Enterprise Bottleneck", desc: "Why traditional manual outreach decays inbound lead conversion", visual: "📊 Pipeline Friction Graph" },
    { title: "Autonomous AI Architecture", desc: "Sub-second lead response with RAG context synthesis", visual: "⚡ WebRTC / API Pipeline Grid" },
    { title: "Live RAG Q&A & Next Steps", desc: "Interactive query resolution with immediate CRM sync", visual: "🎯 Call to Action & Audit Form" },
  ];

  const handleNextSlide = () => {
    if (hostState.currentSlideIndex < hostState.totalSlides - 1) {
      setHostState((prev) => ({ ...prev, currentSlideIndex: prev.currentSlideIndex + 1 }));
    }
  };

  const handlePrevSlide = () => {
    if (hostState.currentSlideIndex > 0) {
      setHostState((prev) => ({ ...prev, currentSlideIndex: prev.currentSlideIndex - 1 }));
    }
  };

  const handleSendRAG = async () => {
    if (!questionInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "Audience Member",
      role: "attendee",
      text: questionInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHostState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMsg],
      botStatus: "processing_rag",
    }));

    setQuestionInput("");
    setAskingRAG(true);

    try {
      const res = await fetch("/api/webinar/host-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask_rag", message: userMsg.text }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setHostState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, data.reply],
          botStatus: "speaking",
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAskingRAG(false);
    }
  };

  const handleEscalate = async () => {
    setHostState((prev) => ({
      ...prev,
      humanEscalationRequired: true,
      escalationReason: "Handed over to Human Co-Host on demand.",
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `sys-${Date.now()}`,
          sender: "System",
          role: "system",
          text: "⚠️ Live controls transferred from AI Dealflow Bot to Human Presenter.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    }));
  };

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" /> LIVE Webinar Host Arena
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">AI Dealflow Bot Hosting Studio</h2>
          <p className="text-xs text-slate-400">Autonomous slide presenter, RAG Q&A engine, and human escalation console</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">RAG KB: <strong className="text-emerald-400">Connected</strong></span>
          </div>

          <button
            onClick={handleEscalate}
            disabled={hostState.humanEscalationRequired}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" /> Escalate to Human Host
          </button>
        </div>
      </div>

      {/* Main Grid: Live Presentation View & Chat Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Stage & Slide Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
            {/* Top Bar Overlay */}
            <div className="flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE BROADCAST
              </span>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>AI Host: {hostState.botStatus.toUpperCase()}</span>
              </div>
            </div>

            {/* Stage Presentation Slide Canvas */}
            <div className="text-center space-y-3 my-auto z-10">
              <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                {mockSlides[hostState.currentSlideIndex].visual}
              </span>
              <h3 className="text-2xl font-black text-slate-100 tracking-tight">
                {mockSlides[hostState.currentSlideIndex].title}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {mockSlides[hostState.currentSlideIndex].desc}
              </p>
            </div>

            {/* Bottom Overlay Info */}
            <div className="flex items-center justify-between z-10 border-t border-slate-850 pt-3">
              <span className="text-xs text-slate-400 font-mono">
                Slide {hostState.currentSlideIndex + 1} of {hostState.totalSlides}
              </span>
              <span className="text-xs text-slate-400">
                Host Persona: <strong className="text-cyan-300">{hostState.humanEscalationRequired ? "Human Co-Host" : wizardData.speakerName}</strong>
              </span>
            </div>
          </div>

          {/* Slide Deck Controller Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <button
              onClick={handlePrevSlide}
              disabled={hostState.currentSlideIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Slide
            </button>

            <span className="text-xs font-mono text-cyan-300 font-bold">
              {mockSlides[hostState.currentSlideIndex].title}
            </span>

            <button
              onClick={handleNextSlide}
              disabled={hostState.currentSlideIndex === hostState.totalSlides - 1}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
            >
              Next Slide <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Col: Live Chat & RAG Q&A Console */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Live Chat & RAG Stream
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                Sentiment: {hostState.sentimentOverall.toUpperCase()}
              </span>
            </div>

            {/* Chat Stream Messages */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {hostState.chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    m.role === "bot"
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200"
                      : m.role === "system"
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono"
                      : "bg-slate-950 border border-slate-850 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold">{m.sender}</span>
                    <span className="text-slate-500">{m.timestamp}</span>
                  </div>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>

            {/* Ask RAG Input Box */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Simulate Audience Question (RAG Test)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a technical or pricing question..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendRAG()}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleSendRAG}
                  disabled={askingRAG}
                  className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  {askingRAG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
