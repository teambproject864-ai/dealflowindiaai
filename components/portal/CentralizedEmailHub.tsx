// components/portal/CentralizedEmailHub.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Trash2,
  Bookmark,
  Star,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Tag,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Reply,
  Forward,
  Plus,
  X,
  Lock,
  Calendar,
  Bell,
  Eye,
  Check,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PortalEmail,
  EmailStatus,
  EmailFolder,
  EmailFilterOptions,
} from "@/lib/email/email-types";

interface CentralizedEmailHubProps {
  currentAgentId?: string;
  currentAgentEmail?: string;
  currentAgentName?: string;
  defaultTicketId?: string;
  defaultCustomerId?: string;
}

export function CentralizedEmailHub({
  currentAgentId = "agent-portal-user",
  currentAgentEmail = "agent@dealflow.ai",
  currentAgentName = "Dealflow Senior Agent",
  defaultTicketId,
  defaultCustomerId,
}: CentralizedEmailHubProps) {
  // State
  const [emails, setEmails] = useState<(PortalEmail & { decryptedBodyText: string })[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<(PortalEmail & { decryptedBodyText: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [statusFilter, setStatusFilter] = useState<EmailStatus | "all">("all");
  const [senderFilter, setSenderFilter] = useState("");
  const [ticketFilter, setTicketFilter] = useState(defaultTicketId || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);

  // Compose & Action State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "forward">("compose");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTicketId, setComposeTicketId] = useState(defaultTicketId || "");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audit Trail State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);

  // Desktop Alert Notification State
  const [desktopAlertsEnabled, setDesktopAlertsEnabled] = useState(false);
  const [recentAlert, setRecentAlert] = useState<string | null>(null);

  // Request Notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setDesktopAlertsEnabled(true);
      }
    }
  }, []);

  const enableDesktopNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setDesktopAlertsEnabled(true);
        setStatusMessage("Desktop alerts enabled for incoming emails.");
      }
    }
  };

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder !== "inbox") params.set("folder", activeFolder);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (senderFilter.trim()) params.set("sender", senderFilter.trim());
      if (ticketFilter.trim()) params.set("ticketId", ticketFilter.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (searchQuery.trim()) params.set("searchQuery", searchQuery.trim());

      const res = await fetch(`/api/portal/email/inbox?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails || []);
        setUnreadCount(data.unreadCount || 0);
        setFlaggedCount(data.flaggedCount || 0);
        if (data.emails?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load emails:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, statusFilter, senderFilter, ticketFilter, startDate, endDate, searchQuery, selectedEmail]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Execute Agent Action
  const handleAction = async (action: "open" | "reply" | "forward" | "delete" | "archive" | "flag") => {
    if (!selectedEmail) return;

    if (action === "reply") {
      setComposeMode("reply");
      setComposeRecipient(selectedEmail.senderEmail);
      setComposeSubject(selectedEmail.subject.startsWith("RE:") ? selectedEmail.subject : `RE: ${selectedEmail.subject}`);
      setComposeBody(`\n\n--- On ${new Date(selectedEmail.timestamp).toLocaleString()}, ${selectedEmail.senderName} wrote:\n> ${selectedEmail.decryptedBodyText.replace(/\n/g, "\n> ")}`);
      setComposeTicketId(selectedEmail.ticketId || "");
      setIsComposeOpen(true);
      return;
    }

    if (action === "forward") {
      setComposeMode("forward");
      setComposeRecipient("");
      setComposeSubject(selectedEmail.subject.startsWith("FWD:") ? selectedEmail.subject : `FWD: ${selectedEmail.subject}`);
      setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.senderName} <${selectedEmail.senderEmail}>\nSubject: ${selectedEmail.subject}\nDate: ${new Date(selectedEmail.timestamp).toLocaleString()}\n\n${selectedEmail.decryptedBodyText}`);
      setComposeTicketId(selectedEmail.ticketId || "");
      setIsComposeOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/portal/email/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          action,
          agentId: currentAgentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Email successfully updated: action "${action}" applied.`);
        await fetchEmails();
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  // View Audit Trail
  const openAuditTrail = async () => {
    if (!selectedEmail) return;
    try {
      const res = await fetch(`/api/portal/email/actions?emailId=${selectedEmail.id}`);
      const data = await res.json();
      if (data.success) {
        setAuditTrail(data.auditTrail || []);
        setIsAuditModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load audit trail:", err);
    }
  };

  // Send / Compose Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipient || !composeSubject || !composeBody) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/portal/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: composeRecipient,
          subject: composeSubject,
          bodyText: composeBody,
          ticketId: composeTicketId || undefined,
          actionType: composeMode,
          threadId: selectedEmail?.threadId,
          inReplyTo: selectedEmail?.id,
          agentId: currentAgentId,
          agentEmail: currentAgentEmail,
          agentName: currentAgentName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("Email dispatched and synchronized with official mail server!");
        setIsComposeOpen(false);
        setComposeBody("");
        setComposeSubject("");
        setComposeRecipient("");
        await fetchEmails();
      } else {
        alert(data.error || "Failed to send email.");
      }
    } catch (err: any) {
      console.error("Error sending email:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Alert Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              Centralized Email Monitoring & Unified Inbox
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                E2E AES-256 Encrypted
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated customer & internal communications • IMAP/SMTP & API Auto-Sync • GDPR/HIPAA Audit Logged
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!desktopAlertsEnabled && (
            <Button
              onClick={enableDesktopNotifications}
              variant="outline"
              size="sm"
              className="bg-slate-950 border-slate-800 text-xs text-amber-400 hover:text-amber-300"
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable Desktop Alerts
            </Button>
          )}
          <Button
            onClick={() => {
              setComposeMode("compose");
              setComposeRecipient("");
              setComposeSubject("");
              setComposeBody("");
              setComposeTicketId(ticketFilter || "");
              setIsComposeOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Compose Email
          </Button>
          <Button
            onClick={fetchEmails}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Mail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[640px]">
        {/* Left Navigation Folders */}
        <div className="md:col-span-3 space-y-3">
          <GlassPanel className="p-3 space-y-1 border-slate-800 bg-slate-900/20">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Mail Folders
            </div>
            {[
              { id: "inbox", label: "Unified Inbox", icon: Inbox, count: unreadCount },
              { id: "sent", label: "Sent Items", icon: Send },
              { id: "archived", label: "Archived", icon: Archive },
              { id: "trash", label: "Trash / Deleted", icon: Trash2 },
            ].map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setActiveFolder(folder.id as EmailFolder);
                    setSelectedEmail(null);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count !== undefined && folder.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </GlassPanel>

          {/* Filtering Panel */}
          <GlassPanel className="p-4 space-y-3 border-slate-800 bg-slate-900/20 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-blue-400" /> Filter Inquiries
              </span>
              {(statusFilter !== "all" || senderFilter || ticketFilter || startDate) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSenderFilter("");
                    setTicketFilter("");
                    setStartDate("");
                    setEndDate("");
                    setSearchQuery("");
                  }}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread Only</option>
                <option value="flagged">Flagged / Priority</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Ticket / Lead ID</label>
              <Input
                placeholder="e.g. TICK-4892"
                value={ticketFilter}
                onChange={(e) => setTicketFilter(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Sender Filter</label>
              <Input
                placeholder="Filter by sender email/name..."
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Date Range</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-400"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-400"
                />
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Middle Email List */}
        <div className="md:col-span-4 space-y-2 flex flex-col">
          {/* Quick Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              placeholder="Search subjects, tickets, contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-xs h-9"
            />
          </div>

          <GlassPanel className="flex-1 p-2 border-slate-800 bg-slate-900/20 overflow-y-auto max-h-[580px] space-y-1.5 custom-scrollbar">
            {emails.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                <Mail className="h-8 w-8 mx-auto opacity-30" />
                <p>No communications found matching criteria.</p>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isUnread = email.status === "unread";
                const isFlagged = email.status === "flagged";

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (email.status === "unread") {
                        handleAction("open");
                      }
                    }}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 relative",
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/40 shadow-sm"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700",
                      isUnread && "border-l-4 border-l-blue-500 font-semibold"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-slate-200 truncate max-w-[180px]">
                        {email.senderName || email.senderEmail}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(email.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="text-slate-100 font-bold truncate">
                      {email.subject}
                    </div>

                    <div className="text-slate-400 text-[11px] line-clamp-2">
                      {email.decryptedBodyText}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {email.ticketId && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {email.ticketId}
                        </span>
                      )}
                      {email.isEncrypted && (
                        <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                          <Lock className="h-2.5 w-2.5" /> AES-256
                        </span>
                      )}
                      {isFlagged && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </GlassPanel>
        </div>

        {/* Right Email Detail Reading Pane */}
        <div className="md:col-span-5 flex flex-col">
          {selectedEmail ? (
            <GlassPanel className="flex-1 p-5 border-slate-800 bg-slate-900/20 flex flex-col justify-between space-y-4">
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Header Actions */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {selectedEmail.ticketId && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Ticket: {selectedEmail.ticketId}
                        </span>
                      )}
                      {selectedEmail.complianceLabels?.map((lbl) => (
                        <span key={lbl} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                          {lbl} Compliant
                        </span>
                      ))}
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-emerald-400" /> End-to-End Encrypted
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAction("flag")}
                      title="Flag Email"
                      className={cn(
                        "p-1.5 rounded-lg border",
                        selectedEmail.status === "flagged"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleAction("archive")}
                      title="Archive Email"
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleAction("delete")}
                      title="Delete Email"
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={openAuditTrail}
                      title="View Compliance Audit Log"
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-blue-400"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sender & Recipient Metadata */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">From:</span>
                    <span className="text-slate-200 font-medium">{selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">To:</span>
                    <span className="text-slate-300">{selectedEmail.recipientName || selectedEmail.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-400 text-[11px]">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedEmail.serverMessageId && (
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Server ID:</span>
                      <span>{selectedEmail.serverMessageId}</span>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800 text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.decryptedBodyText}
                </div>
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <Button
                  onClick={() => handleAction("reply")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
                >
                  <Reply className="h-3.5 w-3.5 mr-1.5" /> Reply Directly
                </Button>
                <Button
                  onClick={() => handleAction("forward")}
                  variant="outline"
                  size="sm"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  <Forward className="h-3.5 w-3.5 mr-1.5" /> Forward
                </Button>
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel className="flex-1 p-12 border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
              <Mail className="h-10 w-10 opacity-20" />
              <p>Select an email from the inbox to read communication.</p>
            </GlassPanel>
          )}
        </div>
      </div>

      {/* Compose / Reply Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" />
                {composeMode === "reply" ? "Reply to Email" : composeMode === "forward" ? "Forward Email" : "Compose New Email"}
              </h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Recipient Email</label>
                <Input
                  type="email"
                  required
                  placeholder="client@enterprise.com"
                  value={composeRecipient}
                  onChange={(e) => setComposeRecipient(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Subject</label>
                <Input
                  required
                  placeholder="Subject line..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Associated Ticket / Lead ID (Optional)</label>
                <Input
                  placeholder="e.g. TICK-4892"
                  value={composeTicketId}
                  onChange={(e) => setComposeTicketId(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Message Body</label>
                <Textarea
                  rows={8}
                  required
                  placeholder="Write your email content..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs mt-1 leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-400" /> AES-256 GCM encrypted & auto-synced to mail server
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsComposeOpen(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSending}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    {isSending ? "Dispatching..." : "Send & Sync"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Compliance Audit Trail (GDPR / CCPA / HIPAA)
              </h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 text-xs">
              {auditTrail.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No audit actions recorded for this item yet.</p>
              ) : (
                auditTrail.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-bold text-blue-400 uppercase">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Agent: {log.agentId} | IP Hash: {log.ipHash}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      Compliance Hash: {log.complianceHash}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
