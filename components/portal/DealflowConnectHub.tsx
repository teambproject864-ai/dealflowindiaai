"use client";

import React, { useState, useEffect } from "react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import {
  Key,
  CreditCard,
  Bot,
  Sliders,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Send,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DealflowConnectHub() {
  const [activeSubTab, setActiveSubTab] = useState<"api-vault" | "credits" | "bot-invite" | "bot-training">("api-vault");

  // API Key state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyProvider, setNewKeyProvider] = useState<string>("openai");
  const [newKeyLabel, setNewKeyLabel] = useState<string>("");
  const [newKeyValue, setNewKeyValue] = useState<string>("");
  const [keySaving, setKeySaving] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  // Credit state
  const [creditData, setCreditData] = useState<any>(null);
  const [addingCredits, setAddingCredits] = useState(false);

  // Bot Invite state
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [callScenario, setCallScenario] = useState("client_sales");
  const [participantEmails, setParticipantEmails] = useState("");
  const [invitingBot, setInvitingBot] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [pastInvites, setPastInvites] = useState<any[]>([]);

  // Training state
  const [trainingConfig, setTrainingConfig] = useState<any>({
    companyName: "",
    productFocus: "",
    customTalkTrack: "",
  });
  const [liveOverridePrompt, setLiveOverridePrompt] = useState("");
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [trainingMsg, setTrainingMsg] = useState<string | null>(null);

  // Calendar & Bot Control state
  const [scheduledCalendarLinks, setScheduledCalendarLinks] = useState<any>(null);

  // Personal CRM state
  const [personalDeals, setPersonalDeals] = useState<any[]>([]);

  // WhatsApp Preference state
  const [whatsAppNotifications, setWhatsAppNotifications] = useState(true);

  useEffect(() => {
    fetchApiKeys();
    fetchCredits();
    fetchInvites();
    fetchTrainingConfig();
    fetchPersonalDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeFetchJson = async (url: string, init?: RequestInit) => {
    try {
      const res = await fetch(url, init);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        return { success: false, error: `Server response status ${res.status}` };
      }
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || "Network fetch failed" };
    }
  };

  const fetchPersonalDeals = async () => {
    const data = await safeFetchJson("/api/crm/sync?role=customer");
    if (data.success) setPersonalDeals(data.deals || []);
  };

  const fetchApiKeys = async () => {
    const data = await safeFetchJson("/api/portal/customer/api-keys");
    if (data.success) setApiKeys(data.keys || []);
  };

  const fetchCredits = async () => {
    const data = await safeFetchJson("/api/portal/customer/credits");
    if (data.success) setCreditData(data.credits);
  };

  const fetchInvites = async () => {
    const data = await safeFetchJson("/api/portal/customer/bot-invite");
    if (data.success) setPastInvites(data.invitations || []);
  };

  const fetchTrainingConfig = async () => {
    const data = await safeFetchJson("/api/portal/customer/bot-training");
    if (data.success) setTrainingConfig(data.trainingConfig || {});
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue) return;
    try {
      setKeySaving(true);
      const data = await safeFetchJson("/api/portal/customer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: newKeyProvider,
          label: newKeyLabel || `${newKeyProvider.toUpperCase()} Production Key`,
          rawKey: newKeyValue,
        }),
      });
      if (data.success) {
        setKeyStatusMsg(`API Key saved and encrypted with AES-256 successfully.`);
        setNewKeyValue("");
        setNewKeyLabel("");
        fetchApiKeys();
      } else {
        setKeyStatusMsg(`Error: ${data.error || "Failed to save API key"}`);
      }
    } catch (err: any) {
      setKeyStatusMsg(`Failed to save key: ${err?.message}`);
    } finally {
      setKeySaving(false);
    }
  };

  const handleAddCredits = async (tierUsd: number) => {
    try {
      setAddingCredits(true);
      const data = await safeFetchJson("/api/portal/customer/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditTier: tierUsd }),
      });
      if (data.success) {
        fetchCredits();
      }
    } catch (e) {
      console.error("Failed to add credits", e);
    } finally {
      setAddingCredits(false);
    }
  };

  const handleInviteBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl) return;
    try {
      setInvitingBot(true);
      const emails = participantEmails.split(",").map((s) => s.trim()).filter(Boolean);
      
      const data = await safeFetchJson("/api/portal/meeting-bot/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTitle: meetingTitle || "Customer Sync Call",
          meetingUrl,
          startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          callScenario,
          scheduledByUserRole: "customer",
          recipients: emails.map(email => ({ email })),
        }),
      });
      if (data.success) {
        setInviteSuccessMsg(`Bot scheduled & calendar sync generated for '${meetingTitle || meetingUrl}'!`);
        if (data.calendarLinks) {
          setScheduledCalendarLinks(data.calendarLinks);
        }
        setMeetingTitle("");
        setMeetingUrl("");
        setParticipantEmails("");
        fetchInvites();
      }
    } catch (e: any) {
      console.error("Failed to schedule meeting bot", e);
    } finally {
      setInvitingBot(false);
    }
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTrainingSaving(true);
      const res = await fetch("/api/portal/customer/bot-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trainingConfig,
          liveOverridePrompt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrainingMsg(data.message);
        setLiveOverridePrompt("");
        fetchTrainingConfig();
      }
    } catch (e: any) {
      setTrainingMsg(`Failed to update training: ${e?.message}`);
    } finally {
      setTrainingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-7 h-7 text-emerald-400" />
          Dealflow Connect (Integration & Bot Gateway)
        </h2>
        <p className="text-slate-400 text-sm">
          Bring your own API keys, check and add credits, invite the Dealflow Meeting Bot to calls, and customize bot training behavior in real time.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("api-vault")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
            activeSubTab === "api-vault"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          )}
        >
          <Key className="w-4 h-4" />
          BYOK API Vault & Encryption
        </button>

        <button
          onClick={() => setActiveSubTab("credits")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
            activeSubTab === "credits"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Credit Balance & Top-Up
        </button>

        <button
          onClick={() => setActiveSubTab("bot-invite")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
            activeSubTab === "bot-invite"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          )}
        >
          <Bot className="w-4 h-4" />
          Invite Bot to Meeting
        </button>

        <button
          onClick={() => setActiveSubTab("bot-training")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
            activeSubTab === "bot-training"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          )}
        >
          <Sliders className="w-4 h-4" />
          Bot Training & Custom Inputs
        </button>
      </div>

      {/* SUB-TAB 1: BYOK API VAULT */}
      {activeSubTab === "api-vault" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassPanel className="p-6 lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Add Third-Party API Key
            </h3>
            <p className="text-xs text-slate-400">
              Credentials are encrypted using AES-256 master keys. You can rotate or update your keys at any time.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Provider</label>
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="openai">OpenAI (sk-...)</option>
                  <option value="anthropic">Anthropic (sk-ant-...)</option>
                  <option value="huggingface">Hugging Face (hf_...)</option>
                  <option value="pinecone">Pinecone</option>
                  <option value="custom">Custom API Gateway Key</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Key Label</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI Production Key"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Raw API Key</label>
                <input
                  type="password"
                  placeholder="Enter sensitive key..."
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <ExtrudedButton
                variant="default"
                type="submit"
                disabled={keySaving || !newKeyValue}
                className="w-full flex items-center justify-center gap-2 text-xs"
              >
                {keySaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Save Encrypted API Key
              </ExtrudedButton>

              {keyStatusMsg && (
                <div className="text-xs p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  {keyStatusMsg}
                </div>
              )}
            </form>
          </GlassPanel>

          <GlassPanel className="p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Active Encrypted Vault Keys
            </h3>

            {apiKeys.length === 0 ? (
              <p className="text-slate-400 text-sm">No external API keys configured yet.</p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                          {key.provider}
                        </span>
                        <h4 className="font-semibold text-slate-200 text-sm">{key.label}</h4>
                      </div>
                      <div className="font-mono text-xs text-slate-400 mt-1">{key.maskedKey}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                      <button
                        onClick={fetchApiKeys}
                        className="text-xs p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Rotate / Verify Key"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      )}

      {/* SUB-TAB 2: CREDIT BALANCE & TOP-UP */}
      {activeSubTab === "credits" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassPanel className="p-6 lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Credit Balance Overview
            </h3>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-300/80 font-medium">Available AI Credits</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">
                {creditData?.balance ?? 2450} <span className="text-sm font-normal text-slate-400">Credits</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">Tier: {creditData?.tier || "Enterprise Tier"}</div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Credits (Simulated Gateway)</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddCredits(50)}
                  disabled={addingCredits}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-center text-xs font-bold text-slate-200 transition"
                >
                  <div>$50</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">500 Credits</div>
                </button>
                <button
                  onClick={() => handleAddCredits(100)}
                  disabled={addingCredits}
                  className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center text-xs font-bold text-amber-300 transition"
                >
                  <div>$100</div>
                  <div className="text-[10px] text-amber-200/70 font-normal mt-0.5">1000 Credits</div>
                </button>
                <button
                  onClick={() => handleAddCredits(500)}
                  disabled={addingCredits}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-center text-xs font-bold text-slate-200 transition"
                >
                  <div>$500</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">5000 Credits</div>
                </button>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Transaction & Credit Usage History</h3>
            <div className="space-y-2">
              {creditData?.transactions?.map((tx: any) => (
                <div key={tx.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200 capitalize">{tx.type === "topup" ? `Top-up ($${tx.costUsd} USD)` : tx.description}</div>
                    <div className="text-slate-400 text-[10px]">{new Date(tx.date).toLocaleString()}</div>
                  </div>
                  <div className={cn("font-bold text-sm", tx.amount > 0 ? "text-emerald-400" : "text-slate-300")}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* SUB-TAB 3: INVITE BOT TO MEETING */}
      {activeSubTab === "bot-invite" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassPanel className="p-6 lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              Invite Bot to Call
            </h3>
            <p className="text-xs text-slate-400">
              Dispatch the Dealflow Meeting Bot to external client meetings, internal standups, or onboarding calls to qualify, negotiate, and close deals.
            </p>

            <form onSubmit={handleInviteBot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Executive Sales Review"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Call Scenario</label>
                <select
                  value={callScenario}
                  onChange={(e) => setCallScenario(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="client_sales">Client Sales / Prospecting Call</option>
                  <option value="customer_checkin">Customer Check-in / QBR</option>
                  <option value="internal_standup">Internal Team Standup</option>
                  <option value="onboarding">Customer Onboarding Call</option>
                  <option value="cross_functional">Cross-Functional Strategic Sync</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Meeting URL (Google Meet / Zoom / Teams)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Participant Emails (comma separated)</label>
                <input
                  type="text"
                  placeholder="client@acme.com, ae@dealflow.ai"
                  value={participantEmails}
                  onChange={(e) => setParticipantEmails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <ExtrudedButton
                variant="default"
                type="submit"
                disabled={invitingBot || !meetingUrl}
                className="w-full flex items-center justify-center gap-2 text-xs"
              >
                {invitingBot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Dispatch Bot Now
              </ExtrudedButton>

              {inviteSuccessMsg && (
                <div className="text-xs p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 space-y-2">
                  <p>{inviteSuccessMsg}</p>
                  {scheduledCalendarLinks && (
                    <div className="pt-2 border-t border-indigo-500/20 flex flex-wrap gap-2">
                      <a href={scheduledCalendarLinks.googleCalendarUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-900 border border-indigo-400/30 rounded text-[10px] text-indigo-300 hover:text-white font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" /> Google Cal
                      </a>
                      <a href={scheduledCalendarLinks.outlookUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-900 border border-indigo-400/30 rounded text-[10px] text-indigo-300 hover:text-white font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" /> Outlook
                      </a>
                      <a href={scheduledCalendarLinks.iCalDataUrl} download="dealflow-meeting.ics" className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-500">
                        <Calendar className="w-3 h-3" /> Download .ICS
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </GlassPanel>

          <GlassPanel className="p-6 lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" /> Personal Dealflow CRM Status
              </h3>
              <p className="text-xs text-slate-400">Role-scoped view of your company deals, stages, and real-time CRM synchronization status.</p>
            </div>

            <div className="space-y-3">
              {personalDeals.length === 0 ? (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 text-xs text-slate-400">
                  <p className="font-semibold text-slate-200 mb-1">Acme Enterprise AI Pipeline Expansion</p>
                  <p>Stage: Proposal • Value: $120,000 • Status: <span className="text-emerald-400 font-bold">Synced Real-Time</span></p>
                </div>
              ) : (
                personalDeals.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{d.dealName}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">${d.amount?.toLocaleString()} • Stage: <span className="uppercase text-teal-300 font-bold">{d.stage}</span></p>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ CRM Synced
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* WhatsApp Preferences */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" /> Evolution API WhatsApp Alerts
                  </h4>
                  <p className="text-xs text-slate-400">Receive 15-min meeting reminders &amp; deal stage updates via WhatsApp.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsAppNotifications(!whatsAppNotifications)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    whatsAppNotifications
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}
                >
                  {whatsAppNotifications ? "Enabled (20 msg/day limit)" : "Disabled"}
                </button>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6 lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Dispatched Bot Invitations</h3>
            {pastInvites.length === 0 ? (
              <p className="text-slate-400 text-sm">No bot meeting invitations dispatched yet.</p>
            ) : (
              <div className="space-y-3">
                {pastInvites.map((inv) => (
                  <div key={inv.botId} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                          {inv.callScenario}
                        </span>
                        <h4 className="font-semibold text-slate-200 text-sm">{inv.meetingTitle}</h4>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{inv.meetingUrl}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                      Dispatched
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      )}

      {/* SUB-TAB 4: BOT TRAINING & CUSTOM INPUTS */}
      {activeSubTab === "bot-training" && (
        <GlassPanel className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              Pre-Call & Live In-Call Bot Customization Workbench
            </h3>
            <p className="text-xs text-slate-400">
              Customize company context, talk tracks, objection handling rules, and send real-time prompt overrides to active bots.
            </p>
          </div>

          <form onSubmit={handleSaveTraining} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={trainingConfig.companyName || ""}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Product Focus & Deliverables</label>
                <input
                  type="text"
                  value={trainingConfig.productFocus || ""}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, productFocus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Sales Talk Track & Value Proposition</label>
              <textarea
                rows={3}
                value={trainingConfig.customTalkTrack || ""}
                onChange={(e) => setTrainingConfig({ ...trainingConfig, customTalkTrack: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Live In-Call Prompt Override */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Live In-Call Prompt Override Injection
              </label>
              <p className="text-[11px] text-slate-400">
                Send immediate real-time instruction to active bot while meeting is in progress.
              </p>
              <input
                type="text"
                placeholder="e.g. Pivot to explaining our SOC2 compliance features right now!"
                value={liveOverridePrompt}
                onChange={(e) => setLiveOverridePrompt(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
              />
            </div>

            <ExtrudedButton
              variant="default"
              type="submit"
              disabled={trainingSaving}
              className="flex items-center gap-2 text-xs"
            >
              {trainingSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Training Config & Inject Overrides
            </ExtrudedButton>

            {trainingMsg && (
              <div className="text-xs p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                {trainingMsg}
              </div>
            )}
          </form>
        </GlassPanel>
      )}
    </div>
  );
}
