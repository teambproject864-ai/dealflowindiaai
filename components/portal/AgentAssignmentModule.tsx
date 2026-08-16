"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  RotateCw,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { REVENUE_AGENTS } from "@/lib/revenue-agents-data";
import { AgentRosterDisplay } from "./AgentRosterDisplay";

export function AgentAssignmentModule() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("ashok");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/agent-assignments/requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch agent change requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentKey || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agent-assignments/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedAgentKey: selectedAgentKey,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Agent change request submitted to administrators.");
        setReason("");
        setShowModal(false);
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to submit request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Real-time Agent Roster Selection Component */}
      <AgentRosterDisplay
        currentAssignedAgentKey={selectedAgentKey}
        onSelectAgent={(key) => setSelectedAgentKey(key)}
        onAutoAssignSuccess={(agent) => setSelectedAgentKey(agent.key)}
      />

      {/* Change Request Audit Log History */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/20 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-400" /> Agent Change Request History
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5"
          >
            <RotateCw className="h-3.5 w-3.5" /> Request Reassignment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No custom agent change requests submitted yet.</p>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {requests.map((r) => (
              <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Requested: {r.requestedAgentName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      r.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : r.status === "rejected"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-light">&quot;{r.reason}&quot;</p>
                <p className="text-[9px] text-slate-600 font-mono">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Change Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassPanel tilt={false} className="border-slate-800 bg-slate-950 p-6 max-w-lg w-full space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-violet-400" /> Request Agent Reassignment
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Select Preferred Agent</label>
                <select
                  value={selectedAgentKey}
                  onChange={(e) => setSelectedAgentKey(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                >
                  <option value="">-- Choose an Authorized Agent --</option>
                  {REVENUE_AGENTS.map((agent: any) => (
                    <option key={agent.key} value={agent.key}>
                      {agent.name} ({agent.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Reason for Reassignment Request</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe why you would like to request an agent change..."
                  required
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
