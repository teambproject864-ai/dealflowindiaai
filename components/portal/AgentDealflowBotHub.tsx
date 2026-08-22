"use client";

import React, { useState, useEffect } from "react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import {
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Play,
  Check,
  X,
  RefreshCw,
  Zap,
  Users,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  QrCode,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppProviderSelectorModal, WhatsAppProviderChoice } from "@/components/whatsapp/WhatsAppProviderSelectorModal";
import { OpenWAOnboardingModal } from "@/components/portal/OpenWAOnboardingModal";

export function AgentDealflowBotHub() {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Decision state updates
  const [decisions, setDecisions] = useState<any[]>([]);

  // Bot Control State
  const [botStatusMsg, setBotStatusMsg] = useState<string | null>(null);
  const [botExecuting, setBotExecuting] = useState(false);

  // WhatsApp Workbench State
  const [waRecipientPhone, setWaRecipientPhone] = useState("+1 (555) 019-2831");
  const [waMessageContent, setWaMessageContent] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState<string | null>(null);
  const [whatsAppProvider, setWhatsAppProvider] = useState<WhatsAppProviderChoice>("evolution");
  const [isWhatsAppSelectorOpen, setIsWhatsAppSelectorOpen] = useState(false);
  const [isOpenWAOnboardingOpen, setIsOpenWAOnboardingOpen] = useState(false);

  // Agent CRM Portfolio State
  const [assignedDeals, setAssignedDeals] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchCRMDeals();
  }, []);

  const fetchCRMDeals = async () => {
    try {
      const res = await fetch("/api/crm/sync?role=agent");
      const data = await res.json();
      if (data.success) {
        setAssignedDeals(data.deals || []);
      }
    } catch (e) {
      console.error("Failed to load CRM portfolio deals", e);
    }
  };

  const handleBotControlAction = async (action: "start" | "pause" | "record" | "transcribe" | "stop") => {
    try {
      setBotExecuting(true);
      const res = await fetch("/api/portal/meeting-bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession?.botId || "bot-session-demo-1",
          action,
          userRole: "agent",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBotStatusMsg(data.message);
        if (selectedSession) {
          setSelectedSession({ ...selectedSession, status: data.session?.status || selectedSession.status });
        }
      }
    } catch (err: any) {
      setBotStatusMsg(`Bot Action Error: ${err?.message}`);
    } finally {
      setBotExecuting(false);
    }
  };

  const handleSendWhatsAppMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waMessageContent) return;

    try {
      setWaSending(true);
      const res = await fetch("/api/whatsapp/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: waRecipientPhone,
          content: waMessageContent,
          senderRole: "agent",
          senderId: "agent-1",
          senderName: "Agent Pro Specialist",
          preferredGateway: whatsAppProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const hash = data.message?.encryptedHash || data.message?.complianceHash || "verified";
        setWaStatusMsg(`WhatsApp Message Sent via ${data.gatewayUsed === "openwa" ? "Open WA" : "Evolution Whatsapp"}! (Hash: ${hash.substring(0, 10)}...)`);
        setWaMessageContent("");
      } else {
        setWaStatusMsg(`WhatsApp Alert: ${data.error}`);
      }
    } catch (err: any) {
      setWaStatusMsg(`WhatsApp Send Error: ${err?.message}`);
    } finally {
      setWaSending(false);
    }
  };

  const handleUpdateDealStage = async (deal: any, newStage: string) => {
    try {
      const updatedDeal = { ...deal, stage: newStage, updatedAt: new Date().toISOString() };
      const res = await fetch("/api/crm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "deal",
          entityId: deal.id,
          action: "stage_update",
          payload: updatedDeal,
          userRole: "agent",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignedDeals((prev) => prev.map((d) => (d.id === deal.id ? updatedDeal : d)));
      }
    } catch (e) {
      console.error("Failed to update CRM deal stage", e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/agent/dealflow-bot");
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.activeSessions || []);
        setKpis(data.kpi);
        if (data.activeSessions && data.activeSessions.length > 0) {
          setSelectedSession(data.activeSessions[0]);
          setDecisions(data.activeSessions[0].decisions || []);
        }
      }
    } catch (err) {
      console.error("Failed to load dealflow bot sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionAction = async (decisionId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/portal/agent/dealflow-bot/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setDecisions((prev) =>
          prev.map((d) => (d.id === decisionId ? { ...d, status: data.status } : d))
        );
      }
    } catch (err) {
      console.error("Failed to process decision", err);
    }
  };

  const handleGenerateActionPlan = async () => {
    try {
      setPlanLoading(true);
      const res = await fetch("/api/portal/agent/dealflow-bot/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: selectedSession?.botId || "bot-live-101",
          companyName: "Acme Global Enterprise",
          callScenario: selectedSession?.callScenario || "client_sales",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedPlan(data.actionPlan);
      }
    } catch (err) {
      console.error("Failed to generate action plan", err);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-400" />
            Dealflow Meeting Bot Command Center
          </h2>
          <p className="text-slate-400 text-sm">
            Monitor universal meeting bots, review real-time call analysis, approve flagged decisions, and generate data-driven action plans.
          </p>
        </div>
        <ExtrudedButton
          variant="default"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh Live Stream
        </ExtrudedButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Calls Monitored</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{activeSessions.length} Live</div>
          </div>
          <Activity className="w-8 h-8 text-emerald-400/30" />
        </GlassPanel>

        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Handled</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{kpis?.totalCallsHandled || 142}</div>
          </div>
          <Bot className="w-8 h-8 text-indigo-400/30" />
        </GlassPanel>

        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Autonomous Decisions</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{kpis?.autonomousDecisions || 89}</div>
          </div>
          <Zap className="w-8 h-8 text-cyan-400/30" />
        </GlassPanel>

        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Flagged Review Queue</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{kpis?.flaggedPendingReview || 1} Pending</div>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-400/30" />
        </GlassPanel>

        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Plan Alignment Rate</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{kpis?.actionPlanAlignmentRate || "91.4%"}</div>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-400/30" />
        </GlassPanel>
      </div>

      {/* Main Grid: Active Session Monitor & Decision / Action Plan Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Meeting Stream */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Bot Sessions
          </h3>

          {activeSessions.length === 0 ? (
            <GlassPanel className="p-6 text-center text-slate-400">
              No active meeting bot sessions running.
            </GlassPanel>
          ) : (
            activeSessions.map((session) => (
              <GlassPanel
                key={session.botId}
                className={cn(
                  "p-4 cursor-pointer transition-all border",
                  selectedSession?.botId === session.botId
                    ? "border-indigo-500/80 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-slate-800 hover:border-slate-700"
                )}
                onClick={() => {
                  setSelectedSession(session);
                  setDecisions(session.decisions || []);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                    {session.callScenario}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {session.status}
                  </span>
                </div>

                <div className="mt-3 text-sm font-semibold text-slate-200 truncate">
                  {session.meetingUrl}
                </div>

                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {session.participants.length} Participants
                  </span>
                  <span className="text-emerald-400 font-medium">
                    Sentiment: {session.sentimentRating} ({(session.sentimentScore * 100).toFixed(0)}%)
                  </span>
                </div>
              </GlassPanel>
            ))
          )}
        </div>

        {/* Right 2 Columns: Decision Approval Queue & Action Plan Workbench */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision Approval Queue */}
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              In-Meeting Decision & Approval Engine
            </h3>

            {decisions.length === 0 ? (
              <p className="text-slate-400 text-sm">No decisions recorded for this session.</p>
            ) : (
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded font-semibold uppercase",
                              decision.riskLevel === "high"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            )}
                          >
                            {decision.riskLevel} risk
                          </span>
                          <h4 className="font-semibold text-slate-200 text-sm">{decision.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{decision.description}</p>
                      </div>

                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-bold",
                          decision.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : decision.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300"
                            : decision.status === "autonomous_executed"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-amber-500/20 text-amber-300 animate-pulse"
                        )}
                      >
                        {decision.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-indigo-400">Proposed Action:</strong> {decision.proposedAction}
                    </div>

                    {decision.requiresAgentApproval && decision.status === "pending_agent_review" && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => handleDecisionAction(decision.id, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Decision
                        </button>
                        <button
                          onClick={() => handleDecisionAction(decision.id, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject Decision
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Action Plan Generator Workbench */}
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Data-Driven Action Plan Generator
                </h3>
                <p className="text-xs text-slate-400">
                  Derive next-step plans combining live conversation analysis with historical deal win rates.
                </p>
              </div>

              <ExtrudedButton
                variant="default"
                onClick={handleGenerateActionPlan}
                disabled={planLoading}
                className="flex items-center gap-2 text-xs"
              >
                {planLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Generate Plan
              </ExtrudedButton>
            </div>

            {generatedPlan && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between text-xs bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20">
                  <span className="text-slate-300 font-medium">Deal Win Probability:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {(generatedPlan.dealConversionProbability * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-300 font-medium">Alignment Score:</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {(generatedPlan.alignmentScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Strategy</h4>
                  <p className="text-sm text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {generatedPlan.overallStrategy}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Steps</h4>
                  <div className="space-y-2">
                    {generatedPlan.recommendedSteps?.map((step: any) => (
                      <div key={step.stepNumber} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{step.action}</div>
                          <div className="text-slate-400 mt-0.5">
                            Target: <span className="text-indigo-300">{step.targetOwner}</span> | Timeline: <span className="text-emerald-300">{step.timeline}</span>
                          </div>
                          <div className="text-slate-500 italic mt-0.5">Rationale: {step.rationale}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* In-Portal Live Meeting Bot Controls */}
          <GlassPanel className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-400" />
                  In-Portal Live Bot Controls
                </h3>
                <p className="text-xs text-slate-400">Direct audio capture, streaming transcription, and session termination controls.</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 font-bold uppercase">
                Active Session: {selectedSession?.botId || "bot-live-101"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleBotControlAction("start")}
                disabled={botExecuting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" /> Start Bot
              </button>
              <button
                onClick={() => handleBotControlAction("pause")}
                disabled={botExecuting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Clock className="w-3.5 h-3.5" /> Pause
              </button>
              <button
                onClick={() => handleBotControlAction("record")}
                disabled={botExecuting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Activity className="w-3.5 h-3.5" /> Toggle Record
              </button>
              <button
                onClick={() => handleBotControlAction("transcribe")}
                disabled={botExecuting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" /> Toggle Transcribe
              </button>
              <button
                onClick={() => handleBotControlAction("stop")}
                disabled={botExecuting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <X className="w-3.5 h-3.5" /> Finalize &amp; Stop
              </button>
            </div>

            {botStatusMsg && (
              <p className="text-xs p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono">
                {botStatusMsg}
              </p>
            )}
          </GlassPanel>

          {/* In-Portal WhatsApp Communication Workbench */}
          <GlassPanel className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  {whatsAppProvider === "openwa" ? (
                    <><QrCode className="w-5 h-5 text-blue-400" /> Open WA WhatsApp Workbench</>
                  ) : (
                    <><Zap className="w-5 h-5 text-emerald-400" /> Evolution API WhatsApp Workbench</>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Compose two-way encrypted WhatsApp communications to prospects directly from the portal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsWhatsAppSelectorOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Switch Gateway ({whatsAppProvider === "openwa" ? "Open WA" : "Evolution"})</span>
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppMessage} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={waRecipientPhone}
                    onChange={(e) => setWaRecipientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role Rate Limit Meter</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold flex items-center justify-between">
                    <span>Agent Limit: 200 msgs/day</span>
                    <span className="text-slate-400 font-normal">Active</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp Message</label>
                <textarea
                  rows={3}
                  placeholder="Hi Anil, following up on your deal proposal..."
                  value={waMessageContent}
                  onChange={(e) => setWaMessageContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <ExtrudedButton variant="default" type="submit" disabled={waSending || !waMessageContent} className="text-xs flex items-center gap-2">
                {waSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Send Encrypted WhatsApp Message
              </ExtrudedButton>

              {waStatusMsg && (
                <p className="text-xs p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                  {waStatusMsg}
                </p>
              )}
            </form>
          </GlassPanel>

          {/* Assigned CRM Portfolio Manager */}
          <GlassPanel className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Assigned CRM Portfolio Manager
                </h3>
                <p className="text-xs text-slate-400">Bi-directional CRM sync for assigned accounts &amp; 1-click stage advancement.</p>
              </div>
              <button onClick={fetchCRMDeals} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> Sync CRM Now
              </button>
            </div>

            <div className="space-y-3">
              {assignedDeals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No portfolio deals currently assigned.</p>
              ) : (
                assignedDeals.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-200 text-sm">{d.dealName}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-400">${d.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Customer: <strong className="text-slate-200">{d.customerName}</strong></span>
                      <span>Stage: <span className="uppercase font-bold text-indigo-300">{d.stage}</span></span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Update Stage:</span>
                      {(["qualification", "proposal", "negotiation", "closed-won"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateDealStage(d, st)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                            d.stage === st ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {st.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* WhatsApp Provider Selector Modal */}
      <WhatsAppProviderSelectorModal
        isOpen={isWhatsAppSelectorOpen}
        onClose={() => setIsWhatsAppSelectorOpen(false)}
        currentProvider={whatsAppProvider}
        onSelectProvider={(provider) => {
          setWhatsAppProvider(provider);
          if (provider === "openwa") {
            setIsOpenWAOnboardingOpen(true);
          }
        }}
      />

      {/* OpenWA Onboarding / Pairing Modal */}
      <OpenWAOnboardingModal
        isOpen={isOpenWAOnboardingOpen}
        onClose={() => setIsOpenWAOnboardingOpen(false)}
      />
    </div>
  );
}
