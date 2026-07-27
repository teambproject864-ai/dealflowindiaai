"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  User,
  Star,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { REVENUE_AGENTS } from "@/lib/types";



export function AgentAssignmentModule() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("");
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
          reason
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Agent change request submitted to administrators.");
        setReason("");
        setSelectedAgentKey("");
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

  const currentAssignedAgent = REVENUE_AGENTS[0]; // Primary default agent

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
              Assigned Account Manager & Agent
            </span>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
              <UserCheck className="h-5 w-5 text-cyan-400" /> Dedicated Growth Agent Assignment
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Your assigned revenue agent facilitates GTM strategy execution, campaign building, and channel optimization.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <RotateCw className="h-4 w-4" /> Request Agent Change
          </button>
        </div>
      </GlassPanel>

      {/* Currently Assigned Agent Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/20 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg">
              {currentAssignedAgent.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white">{currentAssignedAgent.name}</h4>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>
              <p className="text-xs text-cyan-400 font-medium">{currentAssignedAgent.title}</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span className="font-bold">4.9 / 5.0 Rating</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 text-xs space-y-2">
            <p className="text-slate-400 leading-relaxed">{currentAssignedAgent.bio}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentAssignedAgent.specialties.map((s: string) => (
                <span key={s} className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">{s}</span>
              ))}
            </div>
          </div>

        </GlassPanel>

        {/* Change Request Audit Log History */}
        <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/20 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-400" /> Agent Change Request History
          </h4>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6">No agent change requests submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {requests.map(r => (
                <div key={r.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Requested: {r.requestedAgentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      r.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      r.status === "rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
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
      </div>

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
