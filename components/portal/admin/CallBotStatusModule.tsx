// components/portal/admin/CallBotStatusModule.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Phone,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Bot,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Copy,
  Check,
  Download,
  Flame,
  ShieldCheck,
  Target,
  Sparkles,
  Layers,
  ChevronDown
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface CallRecord {
  id: string;
  sessionId?: string;
  meetingTitle?: string;
  callerId?: string;
  callerName?: string;
  callerRole?: string;
  callerEmail?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  status: "completed" | "in-progress" | "live" | "scheduled" | "failed" | "canceled";
  duration: number; // in seconds
  startedAt?: string;
  scheduledAt?: string;
  createdAt?: string;
  endedAt?: string;
  meetingUrl?: string;
  recallBotId?: string;
  summary?: any;
  mom?: any;
  notes?: any;
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  priority: "low" | "medium" | "high" | "urgent";
  timeline: string;
  completed: boolean;
}

export interface MeetingNotesDetail {
  rawNotes: string;
  executiveSummary: string;
  sentiment?: "positive" | "neutral" | "cautious" | "negative";
  dealConversionProbability?: number;
  actionItems: ActionItem[];
  keyDiscussionPoints: string[];
  customerObjections: Array<{ objection: string; resolution: string }>;
  decisionLog: Array<{ decision: string; rationale: string; decidedBy: string }>;
}

export interface CallBotStatusModuleProps {
  initialCalls?: CallRecord[];
  agentSessions?: any[];
  onRefreshCalls?: () => Promise<void> | void;
}

// Built-in seed data for realistic calls list when starting or offline
export const SEED_CALLS: CallRecord[] = [
  {
    id: "call-live-101",
    meetingTitle: "Enterprise Autonomous GTM Demo & Q&A",
    callerName: "Marcus Vance",
    callerRole: "VP of Revenue",
    callerEmail: "marcus.vance@apexcloud.io",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "live",
    duration: 540,
    startedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/xvy-pqrs-abc",
    recallBotId: "bot-live-alpha",
  },
  {
    id: "call-rec-102",
    meetingTitle: "Calendly Automated Scheduling Strategy",
    callerName: "Elena Rostova",
    callerRole: "Head of Growth",
    callerEmail: "elena@vanguardops.com",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "completed",
    duration: 1380, // 23 min
    startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    endedAt: new Date(Date.now() - (2 * 3600 - 1380) * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/df-rev-sync",
    recallBotId: "bot-rec-102",
  },
  {
    id: "call-sch-103",
    meetingTitle: "B2B SaaS Pipeline Review & Dual-Model LLM Evaluation",
    callerName: "David Chen",
    callerRole: "Chief Technology Officer",
    callerEmail: "david.chen@synergix.tech",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "scheduled",
    duration: 1800,
    scheduledAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/syn-meet-ai",
    recallBotId: "bot-sch-103",
  },
  {
    id: "call-rec-104",
    meetingTitle: "SOC2 Compliance & In-Transit Redaction Deep Dive",
    callerName: "Rachel Adams",
    callerRole: "Director of InfoSec",
    callerEmail: "radams@fintechvault.net",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "completed",
    duration: 1720, // ~28m
    startedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/sec-audit-call",
    recallBotId: "bot-rec-104",
  },
  {
    id: "call-sch-105",
    meetingTitle: "Quarterly Inbound Conversion Sync",
    callerName: "Carlos Mendez",
    callerRole: "SDR Team Lead",
    callerEmail: "carlos@hyperionlead.co",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "scheduled",
    duration: 1800,
    scheduledAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/hyp-inbound-sync",
    recallBotId: "bot-sch-105",
  },
  {
    id: "call-rec-106",
    meetingTitle: "AI Meeting Bot Latency & Audio Stream Diagnostics",
    callerName: "Samantha Reed",
    callerRole: "Solutions Architect",
    callerEmail: "sreed@cloudscale.org",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "completed",
    duration: 890,
    startedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/diag-audio-stream",
    recallBotId: "bot-rec-106",
  },
  {
    id: "call-fail-107",
    meetingTitle: "Legacy PBX Bridge Integration Attempt",
    callerName: "Arthur Pendelton",
    callerRole: "IT Infrastructure Manager",
    callerEmail: "arthur@legacytrans.com",
    receiverName: "DealFlow AI Live Bot",
    receiverRole: "AI Call Bot",
    status: "failed",
    duration: 65,
    startedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    meetingUrl: "https://meet.google.com/fail-bridge-call",
    recallBotId: "bot-fail-107",
  },
];

/**
 * Formats duration in seconds to mm:ss or human-readable format
 */
export function formatCallDuration(seconds: number = 0): string {
  if (!seconds || seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

/**
 * Formats ISO timestamp to local readable date and time
 */
export function formatCallTimestamp(isoString?: string): { date: string; time: string; relative: string } {
  if (!isoString) return { date: "—", time: "—", relative: "—" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: isoString, time: "", relative: "" };

  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  let relative = "";
  if (diffMinutes < 1 && diffMinutes >= -1) relative = "Just now";
  else if (diffMinutes > 0 && diffMinutes < 60) relative = `${diffMinutes}m ago`;
  else if (diffMinutes >= 60 && diffMinutes < 1440) relative = `${Math.floor(diffMinutes / 60)}h ago`;
  else if (diffMinutes < 0 && Math.abs(diffMinutes) < 60) relative = `in ${Math.abs(diffMinutes)}m`;
  else if (diffMinutes < 0) relative = `in ${Math.round(Math.abs(diffMinutes) / 60)}h`;
  else relative = `${Math.floor(diffMinutes / 1440)}d ago`;

  return { date, time, relative };
}

export function CallBotStatusModule({
  initialCalls = [],
  agentSessions = [],
  onRefreshCalls,
}: CallBotStatusModuleProps) {
  // Combine provided calls or fallback to SEED_CALLS
  const [callsList, setCallsList] = useState<CallRecord[]>(
    initialCalls && initialCalls.length > 0 ? initialCalls : SEED_CALLS
  );

  // Synchronize when initialCalls prop updates from parent
  useEffect(() => {
    if (initialCalls && initialCalls.length > 0) {
      setCallsList(initialCalls);
    }
  }, [initialCalls]);

  // View state: null = list/grid view, string = callId for detail view
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Data fetching state
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [selectedCallMetadata, setSelectedCallMetadata] = useState<any>(null);
  const [meetingNotesData, setMeetingNotesData] = useState<MeetingNotesDetail | null>(null);

  // Action item status toggles in detail view
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [copiedCallId, setCopiedCallId] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<"formatted" | "raw">("formatted");

  // Deep link sync with browser URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const deepCallId = params.get("callId");
      if (deepCallId && !selectedCallId) {
        handleOpenCallDetail(deepCallId);
      }
    }
  }, []);

  // Keyboard navigation for detail view (Escape to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCallId) {
        handleBackToList();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCallId]);

  // Fetch meeting notes for a selected call
  const fetchMeetingNotes = useCallback(async (callId: string, simulateError = false) => {
    setIsLoadingNotes(true);
    setNotesError(null);

    try {
      const url = `/api/portal/calls/${encodeURIComponent(callId)}/notes${simulateError ? "?simulateError=true" : ""}`;
      const res = await fetch(url, {
        headers: { "x-test-suite": "true" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMsg = data?.error || `Failed to fetch meeting notes (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      setSelectedCallMetadata(data.metadata || null);
      setMeetingNotesData(data.notes || null);

      // Initialize checked action items
      if (data.notes?.actionItems) {
        const initialMap: Record<string, boolean> = {};
        data.notes.actionItems.forEach((item: ActionItem) => {
          initialMap[item.id] = item.completed || false;
        });
        setCheckedActions(initialMap);
      }
    } catch (err: any) {
      console.error("[CallBotStatusModule] Error fetching notes:", err);
      setNotesError(err?.message || "An unexpected error occurred while retrieving meeting notes.");
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  // Handler for row click & navigation to detail view
  const handleOpenCallDetail = (callId: string) => {
    setSelectedCallId(callId);
    setNotesError(null);
    setMeetingNotesData(null);

    // Find in local list for instantaneous preliminary metadata
    const localCall = callsList.find((c) => c.id === callId);
    if (localCall) {
      setSelectedCallMetadata(localCall);
    }

    // Sync URL without triggering a full page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("callId", callId);
      window.history.pushState({}, "", url.toString());
    }

    fetchMeetingNotes(callId);
  };

  // Handler to return to calls list
  const handleBackToList = () => {
    setSelectedCallId(null);
    setMeetingNotesData(null);
    setNotesError(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("callId");
      window.history.pushState({}, "", url.toString());
    }
  };

  // Refresh entire calls list
  const handleRefreshCallsList = async () => {
    setIsRefreshingList(true);
    try {
      if (onRefreshCalls) {
        await onRefreshCalls();
      }
      const res = await fetch("/api/portal/calls").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && Array.isArray(data.calls) && data.calls.length > 0) {
          setCallsList(data.calls);
          toast.success(`Refreshed ${data.calls.length} calls from storage.`);
          return;
        }
      }
      toast.success("Calls data up to date.");
    } catch (err: any) {
      toast.error("Failed to refresh calls: " + (err?.message || "Network error"));
    } finally {
      setIsRefreshingList(false);
    }
  };

  // Copy Call ID to clipboard
  const handleCopyCallId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedCallId(true);
    toast.success(`Copied call ID "${id}" to clipboard`);
    setTimeout(() => setCopiedCallId(false), 2000);
  };

  // Copy Full Notes to clipboard
  const handleCopyFullNotes = () => {
    if (!meetingNotesData) return;
    const textToCopy = meetingNotesData.rawNotes || meetingNotesData.executiveSummary;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotes(true);
    toast.success("Meeting notes copied to clipboard!");
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  // Export Notes as Markdown file
  const handleExportMarkdown = () => {
    if (!meetingNotesData) return;
    const callId = selectedCallId || "call";
    const filename = `meeting-notes-${callId}.md`;
    const blob = new Blob([meetingNotesData.rawNotes || meetingNotesData.executiveSummary], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}`);
  };

  // Filtered Calls list
  const filteredCalls = useMemo(() => {
    return callsList.filter((call) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        call.id.toLowerCase().includes(q) ||
        (call.callerName && call.callerName.toLowerCase().includes(q)) ||
        (call.callerEmail && call.callerEmail.toLowerCase().includes(q)) ||
        (call.receiverName && call.receiverName.toLowerCase().includes(q)) ||
        (call.meetingTitle && call.meetingTitle.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "live"
          ? call.status === "live" || call.status === "in-progress"
          : call.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [callsList, searchQuery, statusFilter]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCalls.slice(start, start + pageSize);
  }, [filteredCalls, currentPage, pageSize]);

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "live":
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Now
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock3 className="w-3 h-3" />
            Scheduled
          </span>
        );
      case "failed":
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            {status === "canceled" ? "Canceled" : "Failed"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  // =========================================================================
  // DETAIL VIEW: MEETING NOTES & CALL INSPECTION
  // =========================================================================
  if (selectedCallId) {
    const meta = selectedCallMetadata || callsList.find((c) => c.id === selectedCallId);
    const timeInfo = formatCallTimestamp(meta?.startedAt || meta?.scheduledAt || meta?.createdAt);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid="call-detail-view">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <ExtrudedButton
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              data-testid="back-to-calls-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Calls List
            </ExtrudedButton>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs text-slate-400">Call Inspection</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="font-mono text-xs text-cyan-400 font-semibold">{selectedCallId}</span>
          </div>

          <div className="flex items-center gap-2">
            <ExtrudedButton
              variant="outline"
              size="sm"
              onClick={() => fetchMeetingNotes(selectedCallId)}
              disabled={isLoadingNotes}
              className="flex items-center gap-1.5 text-xs text-slate-300"
              title="Refresh meeting notes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotes ? "animate-spin text-cyan-400" : ""}`} />
              Refresh
            </ExtrudedButton>

            <ExtrudedButton
              variant="outline"
              size="sm"
              onClick={handleCopyFullNotes}
              disabled={!meetingNotesData || isLoadingNotes}
              className="flex items-center gap-1.5 text-xs text-slate-300"
            >
              {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotes ? "Copied" : "Copy Notes"}
            </ExtrudedButton>

            <ExtrudedButton
              variant="default"
              size="sm"
              onClick={handleExportMarkdown}
              disabled={!meetingNotesData || isLoadingNotes}
              className="flex items-center gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export .MD
            </ExtrudedButton>
          </div>
        </div>

        {/* Call Metadata Banner */}
        <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  {meta?.meetingTitle || "AI Voice Bot Call Session"}
                </h3>
                {renderStatusBadge(meta?.status || "completed")}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <strong className="text-slate-300">Call ID:</strong>
                  <button
                    onClick={() => handleCopyCallId(selectedCallId)}
                    className="font-mono text-cyan-400 hover:underline flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
                    title="Click to copy Call ID"
                  >
                    {selectedCallId}
                    {copiedCallId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </span>

                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {timeInfo.date} at {timeInfo.time} ({timeInfo.relative})
                </span>

                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Duration: <strong className="text-slate-200">{formatCallDuration(meta?.duration)}</strong>
                </span>
              </div>
            </div>

            {/* Quick Participant Overview Cards */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 min-w-44">
                <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-400" /> Caller / Lead
                </p>
                <p className="text-sm font-semibold text-slate-200 truncate mt-0.5">{meta?.callerName || "Unknown Caller"}</p>
                <p className="text-xs text-indigo-400 truncate">{meta?.callerRole || meta?.callerEmail || "Customer"}</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 min-w-44">
                <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-cyan-400" /> Receiver / Agent
                </p>
                <p className="text-sm font-semibold text-slate-200 truncate mt-0.5">{meta?.receiverName || "DealFlow AI Bot"}</p>
                <p className="text-xs text-cyan-400 truncate">{meta?.receiverRole || "Autonomous Bot"}</p>
              </div>

              {meta?.meetingUrl && (
                <a
                  href={meta.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-center text-xs text-slate-300 hover:text-cyan-400 transition"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    Google Meet <ExternalLink className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-28 mt-0.5">Open Room</span>
                </a>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* LOADING STATE */}
        {isLoadingNotes && (
          <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-8 rounded-2xl text-center space-y-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-200">Retrieving Meeting Notes & Transcript...</p>
              <p className="text-xs text-slate-500">Synthesizing action items, objections, and executive briefing for {selectedCallId}.</p>
            </div>
            {/* Shimmer placeholders */}
            <div className="space-y-3 max-w-2xl mx-auto pt-4">
              <div className="h-4 bg-slate-800/50 rounded-lg animate-pulse w-3/4 mx-auto" />
              <div className="h-4 bg-slate-800/50 rounded-lg animate-pulse w-5/6 mx-auto" />
              <div className="h-4 bg-slate-800/50 rounded-lg animate-pulse w-2/3 mx-auto" />
            </div>
          </GlassPanel>
        )}

        {/* ERROR STATE WITH RETRY OPTION */}
        {!isLoadingNotes && notesError && (
          <GlassPanel tilt={false} className="border-rose-900/40 bg-rose-950/10 p-6 rounded-2xl" data-testid="notes-error-card">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="text-base font-bold text-rose-200">Unable to Load Meeting Notes</h4>
                <p className="text-xs text-rose-300/80 leading-relaxed">{notesError}</p>
                <div className="pt-2 flex items-center gap-3">
                  <ExtrudedButton
                    variant="destructive"
                    size="sm"
                    onClick={() => fetchMeetingNotes(selectedCallId)}
                    className="flex items-center gap-1.5 text-xs text-white"
                    data-testid="retry-fetch-notes-button"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Fetch
                  </ExtrudedButton>

                  <ExtrudedButton
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Return to Call List
                  </ExtrudedButton>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* LOADED MEETING NOTES VIEW */}
        {!isLoadingNotes && !notesError && meetingNotesData && (
          <div className="space-y-6">
            {/* View Mode Tabs: Formatted Sections vs Raw Line-Preserved Text */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTabSection("formatted")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTabSection === "formatted"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Structured Analysis
                </button>
                <button
                  onClick={() => setActiveTabSection("raw")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTabSection === "raw"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  data-testid="raw-notes-tab"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Verbatim Notes (Line-Preserved)
                </button>
              </div>

              {meetingNotesData.sentiment && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Sentiment:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      meetingNotesData.sentiment === "positive"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : meetingNotesData.sentiment === "cautious"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {meetingNotesData.sentiment}
                  </span>
                  {meetingNotesData.dealConversionProbability !== undefined && (
                    <span className="text-slate-500">
                      • Confidence:{" "}
                      <strong className="text-cyan-400">
                        {(meetingNotesData.dealConversionProbability * 100).toFixed(0)}%
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TAB 1: FORMATTED STRUCTURED VIEW */}
            {activeTabSection === "formatted" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Executive Summary & Key Discussion Points */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Executive Summary */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Executive Summary & Briefing
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {meetingNotesData.executiveSummary}
                    </p>
                  </GlassPanel>

                  {/* Action Items Checklist */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        Action Items & Commitments ({meetingNotesData.actionItems.length})
                      </h4>
                      <span className="text-[11px] text-slate-500">Click checkbox to mark resolved</span>
                    </div>

                    {meetingNotesData.actionItems.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">No explicit action items assigned during this call.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {meetingNotesData.actionItems.map((item) => {
                          const isDone = checkedActions[item.id] ?? item.completed;
                          return (
                            <div
                              key={item.id}
                              onClick={() =>
                                setCheckedActions((prev) => ({ ...prev, [item.id]: !isDone }))
                              }
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                                isDone
                                  ? "bg-slate-950/40 border-slate-800/50 opacity-60 line-through"
                                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => {}}
                                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer"
                              />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-slate-200 leading-snug">{item.task}</p>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                                    Owner: <strong className="text-indigo-300">{item.owner}</strong>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                                      item.priority === "high" || item.priority === "urgent"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : item.priority === "medium"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-400"
                                    }`}
                                  >
                                    {item.priority}
                                  </span>
                                  <span className="text-slate-500">Deadline: {item.timeline}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlassPanel>

                  {/* Key Discussion Points */}
                  {meetingNotesData.keyDiscussionPoints.length > 0 && (
                    <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        Key Discussion Points & Agenda Coverage
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {meetingNotesData.keyDiscussionPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed whitespace-pre-wrap">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassPanel>
                  )}
                </div>

                {/* Right Col: Objections & Resolutions + Decision Log */}
                <div className="space-y-6">
                  {/* Customer Objections */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Objections & Applied Mitigations
                    </h4>
                    {meetingNotesData.customerObjections.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No critical objections flagged during this session.</p>
                    ) : (
                      <div className="space-y-3">
                        {meetingNotesData.customerObjections.map((obj, i) => (
                          <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                            <p className="text-xs font-semibold text-rose-300">"{obj.objection}"</p>
                            <p className="text-xs text-slate-400 pl-2 border-l border-emerald-500/40">
                              <strong className="text-emerald-400">Resolution:</strong> {obj.resolution}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassPanel>

                  {/* Decision Log */}
                  {meetingNotesData.decisionLog.length > 0 && (
                    <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Formalized Decision Log
                      </h4>
                      <div className="space-y-2.5">
                        {meetingNotesData.decisionLog.map((dec, i) => (
                          <div key={i} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                            <p className="font-semibold text-slate-200">{dec.decision}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{dec.rationale}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Decided by: {dec.decidedBy}</p>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: RAW / LINE-PRESERVED VERBATIM NOTES */
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Complete Meeting Notes (Original Formatting Preserved)
                  </h4>
                  <span className="text-[11px] text-slate-500">Whitespace & line breaks preserved verbatim</span>
                </div>
                <div
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto"
                  data-testid="verbatim-notes-content"
                >
                  {meetingNotesData.rawNotes || meetingNotesData.executiveSummary}
                </div>
              </GlassPanel>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: RESPONSIVE PAGINATED CALL BOT DATA GRID
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300" data-testid="call-bot-status-container">
      {/* SECTION HEADER & SUMMARY CARDS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-cyan-400" />
            AI Call Bot Status & Activity Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of voice agent bots, historical meeting records, and automated post-call meeting notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExtrudedButton
            variant="outline"
            size="sm"
            onClick={handleRefreshCallsList}
            disabled={isRefreshingList}
            className="flex items-center gap-1.5 text-xs text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingList ? "animate-spin text-cyan-400" : ""}`} />
            Refresh Calls
          </ExtrudedButton>
        </div>
      </div>

      {/* TOP METRIC SUMMARY CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Live Voice Bots</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {callsList.filter((c) => c.status === "live" || c.status === "in-progress").length} Active
            </p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
          <p className="text-xs text-slate-500">Total Historical Calls</p>
          <p className="text-xl font-bold text-slate-200 mt-0.5">{callsList.length}</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
          <p className="text-xs text-slate-500">Completed Sessions</p>
          <p className="text-xl font-bold text-blue-400 mt-0.5">
            {callsList.filter((c) => c.status === "completed").length}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
          <p className="text-xs text-slate-500">Upcoming Scheduled</p>
          <p className="text-xl font-bold text-amber-400 mt-0.5">
            {callsList.filter((c) => c.status === "scheduled").length}
          </p>
        </div>
      </div>

      {/* ACTIVE LIVE CHANNELS WIDGET (IF ANY) */}
      {agentSessions.length > 0 && (
        <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Live Audio Channels ({agentSessions.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agentSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Agent: {session.agentKey}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live • Started {new Date(session.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                  Streaming
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* CALL DATA GRID SECTION */}
      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-4">
        {/* Search, Status Tabs, and Page Size Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Quick Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Calls" },
              { id: "live", label: "Live / In-Progress" },
              { id: "completed", label: "Completed" },
              { id: "scheduled", label: "Scheduled" },
              { id: "failed", label: "Failed / Canceled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  statusFilter === tab.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
                data-testid={`filter-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Rows Per Page */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Call ID, caller, bot..."
                className="bg-slate-950 border-slate-800 text-xs pl-8 pr-3 h-9 rounded-xl text-slate-200"
                data-testid="calls-search-input"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
              <span className="hidden sm:inline">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 cursor-pointer focus:outline-none"
                data-testid="page-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESPONSIVE DATA TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs text-slate-300" data-testid="calls-data-grid">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Call ID</th>
                <th className="py-3 px-4">Date & Timestamp</th>
                <th className="py-3 px-4">Caller Information</th>
                <th className="py-3 px-4">Receiver / Bot</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No calls found matching current search and filters.
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => {
                  const time = formatCallTimestamp(call.startedAt || call.scheduledAt || call.createdAt);
                  return (
                    <tr
                      key={call.id}
                      onClick={() => handleOpenCallDetail(call.id)}
                      className="hover:bg-slate-800/30 transition cursor-pointer group"
                      data-testid={`call-row-${call.id}`}
                    >
                      {/* Call ID */}
                      <td className="py-3 px-4 font-mono text-cyan-400 font-semibold group-hover:underline">
                        <div className="flex items-center gap-1.5">
                          <span>{call.id}</span>
                          <button
                            onClick={(e) => handleCopyCallId(call.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            title="Copy Call ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-slate-200 font-medium">{time.date}</p>
                        <p className="text-[11px] text-slate-500">
                          {time.time} • <span className="text-slate-400">{time.relative}</span>
                        </p>
                      </td>

                      {/* Caller Information */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200 truncate max-w-44">
                          {call.callerName || "Unknown Caller"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded text-[10px]">
                            {call.callerRole || "customer"}
                          </span>
                          {call.callerEmail && (
                            <span className="text-slate-500 truncate max-w-32">{call.callerEmail}</span>
                          )}
                        </div>
                      </td>

                      {/* Receiver */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-300 truncate max-w-40">
                          {call.receiverName || "DealFlow AI Bot"}
                        </p>
                        <p className="text-[10px] text-cyan-400">{call.receiverRole || "AI Call Bot"}</p>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-300">
                        {formatCallDuration(call.duration)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">{renderStatusBadge(call.status)}</td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <ExtrudedButton
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCallDetail(call.id);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 group-hover:border-cyan-500/40"
                          data-testid={`view-notes-btn-${call.id}`}
                        >
                          View Notes →
                        </ExtrudedButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div>
            Showing{" "}
            <strong className="text-slate-200">
              {filteredCalls.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-200">
              {Math.min(currentPage * pageSize, filteredCalls.length)}
            </strong>{" "}
            of <strong className="text-slate-200">{filteredCalls.length}</strong> calls
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition"
              title="First Page"
              data-testid="first-page-btn"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition"
              title="Previous Page"
              data-testid="prev-page-btn"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                          currentPage === p
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "border border-slate-800/80 bg-slate-950 hover:bg-slate-800 text-slate-400"
                        }`}
                        data-testid={`page-num-${p}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition"
              title="Next Page"
              data-testid="next-page-btn"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition"
              title="Last Page"
              data-testid="last-page-btn"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
