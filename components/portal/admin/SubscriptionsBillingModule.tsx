// components/portal/admin/SubscriptionsBillingModule.tsx
"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw, 
  Download,
  ShieldAlert,
  Search,
  Filter
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";

export interface CustomerSubscription {
  id: string;
  companyName: string;
  planTier: "Enterprise AI" | "Growth Pro" | "Starter Tier";
  amount: number;
  billingInterval: "monthly" | "annually";
  status: "active" | "trialing" | "past_due" | "canceled";
  renewalDate: string;
  cardLast4: string;
  failedAttempts: number;
}

const INITIAL_SUBSCRIPTIONS: CustomerSubscription[] = [
  {
    id: "sub-1",
    companyName: "Acme Enterprise SaaS",
    planTier: "Enterprise AI",
    amount: 1999,
    billingInterval: "monthly",
    status: "active",
    renewalDate: "2026-09-01",
    cardLast4: "4242",
    failedAttempts: 0
  },
  {
    id: "sub-2",
    companyName: "Global Fintech Dynamics",
    planTier: "Growth Pro",
    amount: 799,
    billingInterval: "monthly",
    status: "active",
    renewalDate: "2026-08-28",
    cardLast4: "8891",
    failedAttempts: 0
  },
  {
    id: "sub-3",
    companyName: "Apex HealthTech",
    planTier: "Enterprise AI",
    amount: 24000,
    billingInterval: "annually",
    status: "active",
    renewalDate: "2027-02-10",
    cardLast4: "1092",
    failedAttempts: 0
  },
  {
    id: "sub-4",
    companyName: "Nexus Retail Logistics",
    planTier: "Growth Pro",
    amount: 799,
    billingInterval: "monthly",
    status: "past_due",
    renewalDate: "2026-08-14",
    cardLast4: "5512",
    failedAttempts: 2
  }
];

export function SubscriptionsBillingModule() {
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>(INITIAL_SUBSCRIPTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filtered = subscriptions.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || s.companyName.toLowerCase().includes(q) || s.planTier.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const mrr = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.billingInterval === "annually" ? s.amount / 12 : s.amount), 0);

  const arr = mrr * 12;
  const pastDueCount = subscriptions.filter(s => s.status === "past_due").length;

  const handleRetryBilling = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: "active", failedAttempts: 0 } : s));
      setRetryingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-emerald-950/20 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full">
              Revenue Operations
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <CreditCard className="h-6 w-6 text-emerald-400" /> Subscriptions & Billing Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Monitor active customer plan tiers, renewal schedules, MRR velocity, and payment failure retries.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Monthly Recurring (MRR)</span>
              <span className="text-base font-bold text-emerald-400 font-mono">${Math.round(mrr).toLocaleString()}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Annual Run Rate (ARR)</span>
              <span className="text-base font-bold text-white font-mono">${Math.round(arr).toLocaleString()}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Past Due Alerts</span>
              <span className={`text-base font-bold font-mono ${pastDueCount > 0 ? "text-rose-400 font-extrabold" : "text-emerald-400"}`}>
                {pastDueCount}
              </span>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Alert Banner for Failed Billing */}
      {pastDueCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Action Required:</strong> {pastDueCount} account(s) have failed invoice renewals. Review payment gateway retries.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("past_due")}
            className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-[11px]"
          >
            View Past Due
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriptions by company name or tier..."
            className="bg-slate-950 border-slate-800 text-xs pl-9 h-9 rounded-xl focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Plans</option>
            <option value="past_due">Past Due (Alert)</option>
            <option value="trialing">Trialing</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Customer Account</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5">Amount / Interval</th>
                <th className="p-3.5">Next Renewal</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Billing Status</th>
                <th className="p-3.5 text-right">Gateway Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-white">{s.companyName}</td>
                  <td className="p-3.5 font-mono text-emerald-400">{s.planTier}</td>
                  <td className="p-3.5 font-mono text-white">
                    ${s.amount.toLocaleString()} <span className="text-slate-500 text-[10px]">/{s.billingInterval}</span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">{s.renewalDate}</td>
                  <td className="p-3.5 font-mono text-slate-400">•••• {s.cardLast4}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === "active" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" :
                      s.status === "past_due" ? "bg-rose-950/80 text-rose-300 border border-rose-800/50 animate-pulse" :
                      "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {s.status === "past_due" ? (
                      <button
                        onClick={() => handleRetryBilling(s.id)}
                        disabled={retryingId === s.id}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                      >
                        {retryingId === s.id ? "Retrying..." : "Retry Charge"}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Good Standing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
