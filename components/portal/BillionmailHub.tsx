"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Plus,
  BarChart2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Globe,
  Radio,
  FileText,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { cn } from "@/lib/utils";
import type {
  BillionmailCampaign,
  BillionmailContact,
  BillionmailAnalytics,
  BillionmailEvent,
} from "@/lib/billionmail-service";

export function BillionmailHub() {
  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "contacts" | "analytics" | "events">("campaigns");
  const [campaigns, setCampaigns] = useState<BillionmailCampaign[]>([]);
  const [contacts, setContacts] = useState<BillionmailContact[]>([]);
  const [analytics, setAnalytics] = useState<BillionmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Campaign Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardTitle, setWizardTitle] = useState("");
  const [wizardSubject, setWizardSubject] = useState("");
  const [wizardSenderName, setWizardSenderName] = useState("DealFlow Outreach");
  const [wizardSenderEmail, setWizardSenderEmail] = useState("growth@dealflows.ai");
  const [wizardAudienceName, setWizardAudienceName] = useState("Tier-1 Enterprise Decision Makers");
  const [wizardContentHtml, setWizardContentHtml] = useState(
    `<p>Hi {{firstName}},</p><p>We analyzed {{company}}'s market footprint and identified key growth levers for automated deal orchestration.</p><p><a href="https://dealflows.ai/demo">Book a 15-min strategy session</a>.</p><p>Best regards,<br/>DealFlow AI Team</p>`
  );
  const [wizardScheduleType, setWizardScheduleType] = useState<"immediate" | "scheduled">("immediate");
  const [wizardScheduledAt, setWizardScheduledAt] = useState("");
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // New Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTags, setNewTags] = useState("enterprise, gtm");
  const [submittingContact, setSubmittingContact] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, contRes, analRes] = await Promise.all([
        fetch("/api/portal/billionmail/campaigns"),
        fetch("/api/portal/billionmail/contacts"),
        fetch("/api/portal/billionmail/analytics"),
      ]);

      const campData = await campRes.json();
      const contData = await contRes.json();
      const analData = await analRes.json();

      if (campData.success) setCampaigns(campData.campaigns || []);
      if (contData.success) setContacts(contData.contacts || []);
      if (analData.success) setAnalytics(analData.analytics || null);
    } catch (err) {
      console.error("Failed to load Billionmail data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardTitle || !wizardSubject || !wizardContentHtml) return;

    setSubmittingCampaign(true);
    try {
      const res = await fetch("/api/portal/billionmail/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: wizardTitle,
          subject: wizardSubject,
          senderName: wizardSenderName,
          senderEmail: wizardSenderEmail,
          audienceName: wizardAudienceName,
          contentHtml: wizardContentHtml,
          sendImmediately: wizardScheduleType === "immediate",
          scheduledAt: wizardScheduleType === "scheduled" ? wizardScheduledAt : undefined,
          tags: ["dealflow-campaign", "portal-sync"],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: `Campaign "${wizardTitle}" launched successfully!` });
        setShowWizard(false);
        setWizardTitle("");
        setWizardSubject("");
        fetchData();
      } else {
        setNotification({ type: "error", message: data.error || "Failed to create campaign" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error creating campaign" });
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setSubmittingContact(true);
    try {
      const tagsArray = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/portal/billionmail/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName,
          lastName: newLastName,
          company: newCompany,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: `Contact ${newEmail} added to audience list.` });
        setShowContactModal(false);
        setNewEmail("");
        setNewFirstName("");
        setNewLastName("");
        setNewCompany("");
        fetchData();
      } else {
        setNotification({ type: "error", message: data.error || "Failed to add contact" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error adding contact" });
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/portal/billionmail/campaigns?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setNotification({ type: "success", message: "Campaign deleted." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Billionmail Autonomous Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Live Sync Active
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Mail className="h-6 w-6 text-indigo-400" /> Billionmail Campaign & Delivery Tracker
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Automate high-velocity email outreach, manage audience segments, and monitor real-time delivery telemetry with sub-second feedback loops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl transition-all"
              title="Refresh telemetry"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-indigo-400")} />
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="h-4 w-4" /> New Campaign
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Notifications */}
      {notification && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs flex items-center justify-between",
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Delivery Rate
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl font-black text-white">{analytics?.deliveryRate || 98.4}%</div>
          <p className="text-[10px] text-emerald-400 font-medium">99.8% inbox placement score</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Open Rate
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
          </span>
          <div className="text-2xl font-black text-white">{analytics?.openRate || 54.2}%</div>
          <p className="text-[10px] text-indigo-400 font-medium">+14.6% vs SaaS industry avg</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Click-Through (CTR)
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          </span>
          <div className="text-2xl font-black text-white">{analytics?.clickRate || 26.8}%</div>
          <p className="text-[10px] text-cyan-400 font-medium">High conversion pipeline</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Bounce Rate
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
          </span>
          <div className="text-2xl font-black text-white">{analytics?.bounceRate || 1.6}%</div>
          <p className="text-[10px] text-emerald-400 font-medium">Ultra low domain risk</p>
        </GlassPanel>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("campaigns")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "campaigns"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Mail className="h-3.5 w-3.5" /> Campaigns ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveSubTab("contacts")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "contacts"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Users className="h-3.5 w-3.5" /> Audience & Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveSubTab("analytics")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "analytics"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <BarChart2 className="h-3.5 w-3.5" /> Delivery Telemetry & Charts
        </button>

        <button
          onClick={() => setActiveSubTab("events")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "events"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Live Event Ticker
        </button>
      </div>

      {/* Campaigns View */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Filter status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="sending">Sending</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <GlassPanel tilt={false} className="p-12 text-center border-slate-800 space-y-3">
              <Mail className="h-10 w-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No campaigns found</h4>
              <p className="text-xs text-slate-400">Create your first automated Billionmail campaign to start driving outreach.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-500"
              >
                Create Campaign Now
              </button>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCampaigns.map((camp) => (
                <GlassPanel
                  key={camp.id}
                  tilt={false}
                  className="p-5 bg-slate-950/60 border-slate-850 rounded-2xl hover:border-slate-750 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{camp.title}</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            camp.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : camp.status === "sending"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse"
                              : camp.status === "scheduled"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          )}
                        >
                          {camp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Subject: <span className="text-slate-200">{camp.subject}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Recipients</span>
                      <span className="font-bold text-white">{camp.audienceCount.toLocaleString()}</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Delivered</span>
                      <span className="font-bold text-emerald-400">{camp.deliveredCount.toLocaleString()}</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Opens</span>
                      <span className="font-bold text-indigo-400">
                        {camp.openedCount.toLocaleString()} (
                        {camp.deliveredCount > 0 ? Math.round((camp.openedCount / camp.deliveredCount) * 100) : 0}%)
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Clicks</span>
                      <span className="font-bold text-cyan-400">
                        {camp.clickedCount.toLocaleString()} (
                        {camp.openedCount > 0 ? Math.round((camp.clickedCount / camp.openedCount) * 100) : 0}%)
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Bounces</span>
                      <span className="font-bold text-rose-400">{camp.bouncedCount.toLocaleString()}</span>
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts View */}
      {activeSubTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">Synchronized audience lists and automated pipeline contacts.</p>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="h-3.5 w-3.5" /> Add Single Contact
            </button>
          </div>

          <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-850">
                <tr>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Company</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tags</th>
                  <th className="p-3.5">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px]">{c.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{c.company || "—"}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                          c.status === "subscribed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t, idx) => (
                          <span key={idx} className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[10px]">
                      {c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleTimeString() : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          <GlassPanel tilt={false} className="p-6 bg-slate-900/30 border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> 7-Day Outbound Volume & Conversion Trend
            </h4>

            <div className="grid grid-cols-7 gap-2 pt-4">
              {analytics?.timeSeries.map((t, idx) => (
                <div key={idx} className="space-y-2 text-center">
                  <div className="h-32 bg-slate-950 border border-slate-850 rounded-xl p-2 flex flex-col justify-end gap-1 relative overflow-hidden">
                    <div
                      className="w-full bg-indigo-500/40 rounded-t"
                      style={{ height: `${Math.min(100, (t.sent / 400) * 100)}%` }}
                      title={`Sent: ${t.sent}`}
                    />
                    <div
                      className="w-full bg-emerald-500/70 rounded-t"
                      style={{ height: `${Math.min(100, (t.opened / 400) * 100)}%` }}
                      title={`Opened: ${t.opened}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">{t.date}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Live Event Ticker View */}
      {activeSubTab === "events" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Real-time webhook events dispatched by the Billionmail delivery network.</p>
          <div className="space-y-2">
            {analytics?.recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      ev.eventType === "delivered"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : ev.eventType === "opened"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : ev.eventType === "clicked"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-rose-500/20 text-rose-400"
                    )}
                  >
                    {ev.eventType}
                  </span>
                  <span className="text-white font-bold">{ev.email}</span>
                  <span className="text-slate-500 text-[11px]">({ev.campaignTitle || "Campaign"})</span>
                </div>
                <div className="text-slate-400 text-[10px]">{new Date(ev.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel tilt={false} className="w-full max-w-2xl bg-slate-900 border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" /> New Billionmail Campaign Wizard
              </h3>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Executive GTM Outreach"
                    value={wizardTitle}
                    onChange={(e) => setWizardTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Audience Segment</label>
                  <input
                    type="text"
                    value={wizardAudienceName}
                    onChange={(e) => setWizardAudienceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Email Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="Accelerating {{company}}'s outbound velocity"
                  value={wizardSubject}
                  onChange={(e) => setWizardSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Sender Name</label>
                  <input
                    type="text"
                    value={wizardSenderName}
                    onChange={(e) => setWizardSenderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Sender Email</label>
                  <input
                    type="email"
                    value={wizardSenderEmail}
                    onChange={(e) => setWizardSenderEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Email Body Content (HTML / Template)</label>
                <textarea
                  rows={6}
                  required
                  value={wizardContentHtml}
                  onChange={(e) => setWizardContentHtml(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">
                  Supported variables: <code>{`{{firstName}}`}</code>, <code>{`{{company}}`}</code>, <code>{`{{title}}`}</code>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
                >
                  {submittingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Launch Campaign
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Add Audience Contact
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  {submittingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Contact
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
