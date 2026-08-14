// components/portal/community-mining/RoutingRulesTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Send,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Settings,
  Mail,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CMRoutingRule, CMTeam, CMSeverity } from "@/types/community-mining";

export function RoutingRulesTab() {
  const [rules, setRules] = useState<CMRoutingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for new rule
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [categories, setCategories] = useState("");
  const [assignedTeam, setAssignedTeam] = useState<CMTeam>("product");
  const [destinationChannel, setDestinationChannel] = useState<"slack" | "email" | "webhook">("slack");
  const [destinationTarget, setDestinationTarget] = useState("");
  const [minSeverity, setMinSeverity] = useState<CMSeverity>("high");
  const [isSaving, setIsSaving] = useState(false);
  const [testSendingId, setTestSendingId] = useState<string | null>(null);
  const [testSuccessId, setTestSuccessId] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community-mining/rules");
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error("Failed to load routing rules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destinationTarget) return;

    setIsSaving(true);
    try {
      const payload = {
        name,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
        assignedTeam,
        destinationChannel,
        destinationTarget,
        minSeverity,
        enabled: true,
      };

      const res = await fetch("/api/community-mining/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        await fetchRules();
        setShowAddModal(false);
        setName("");
        setKeywords("");
        setCategories("");
        setDestinationTarget("");
      }
    } catch (err) {
      console.error("Failed to save rule:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/community-mining/rules?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleTestDispatch = async (rule: CMRoutingRule) => {
    setTestSendingId(rule.id);
    try {
      const res = await fetch("/api/community-mining/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_dispatch",
          destinationChannel: rule.destinationChannel,
          destinationTarget: rule.destinationTarget,
          severity: rule.minSeverity || "high",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestSuccessId(rule.id);
        setTimeout(() => setTestSuccessId(null), 2500);
      }
    } catch (err) {
      console.error("Test dispatch failed:", err);
    } finally {
      setTestSendingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-400" /> Automated Routing & Notification Rules
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Route incoming themes and critical signals directly to Product, CS, Sales, or Marketing via Slack & Email.
          </p>
        </div>

        <ExtrudedButton
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-violet-500/20 inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Add Routing Rule
        </ExtrudedButton>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <GlassPanel
            key={rule.id}
            tilt={false}
            className="border-slate-850 bg-slate-900/30 p-5 rounded-2xl space-y-4 relative group"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {rule.assignedTeam} TEAM
                  </span>
                  <span className="bg-violet-950/40 text-violet-300 border border-violet-850 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {rule.destinationChannel}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white pt-1">{rule.name}</h4>
              </div>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Match Criteria */}
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <p className="text-[11px] text-slate-400">
                <span className="text-slate-500">Keywords:</span> {rule.keywords.join(", ") || "All"}
              </p>
              <p className="text-[11px] text-slate-400">
                <span className="text-slate-500">Min Severity:</span> {rule.minSeverity?.toUpperCase() || "HIGH"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                <span className="text-slate-500">Target:</span> {rule.destinationTarget}
              </p>
            </div>

            {/* Test Trigger Button */}
            <div className="pt-2 border-t border-slate-850/60 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono">
                {rule.enabled ? "Active" : "Disabled"}
              </span>

              <button
                onClick={() => handleTestDispatch(rule)}
                disabled={testSendingId === rule.id}
                className="text-xs bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                {testSendingId === rule.id ? (
                  <><Loader2 className="h-3 w-3 animate-spin text-violet-400" /> Testing...</>
                ) : testSuccessId === rule.id ? (
                  <><Check className="h-3 w-3 text-emerald-400" /> Dispatched!</>
                ) : (
                  <><Send className="h-3 w-3 text-violet-400" /> Test Alert</>
                )}
              </button>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel tilt={false} className="w-full max-w-lg bg-slate-900 border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Plus className="h-4 w-4 text-violet-400" /> Create Routing Rule
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-300">Rule Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Critical Bug Escalation to Engineering"
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">Target Team</Label>
                  <select
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value as CMTeam)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="product">Product & Eng</option>
                    <option value="cs">Customer Success</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-300">Channel</Label>
                  <select
                    value={destinationChannel}
                    onChange={(e) => setDestinationChannel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="slack">Slack Webhook</option>
                    <option value="email">Email Notification</option>
                    <option value="webhook">Generic Webhook</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-300">Destination URL or Email</Label>
                <Input
                  value={destinationTarget}
                  onChange={(e) => setDestinationTarget(e.target.value)}
                  placeholder={destinationChannel === "email" ? "alerts@company.com" : "https://hooks.slack.com/services/..."}
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-300">Trigger Keywords (comma separated)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. crash, bug, slow, latency, cancel"
                  className="bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <ExtrudedButton
                  type="submit"
                  disabled={isSaving}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 px-5 rounded-xl"
                >
                  {isSaving ? "Saving..." : "Create Rule"}
                </ExtrudedButton>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
