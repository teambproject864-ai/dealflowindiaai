// components/portal/admin/AuditLogsModule.tsx
"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  Calendar
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ip: string;
  status: "success" | "failure";
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-08-15T18:30:10.000Z",
    user: "admin@dealflow.ai",
    role: "admin",
    action: "USER_AUTH_LOGIN",
    details: "Admin authenticated successfully via credentials session",
    ip: "192.168.1.1",
    status: "success"
  },
  {
    id: "log-2",
    timestamp: "2026-08-15T18:24:05.000Z",
    user: "praneeth@dealflow.ai",
    role: "agent",
    action: "CUSTOMER_CONTEXT_SWITCH",
    details: "Switched workspace active account context to Acme Enterprise SaaS",
    ip: "104.28.19.4",
    status: "success"
  },
  {
    id: "log-3",
    timestamp: "2026-08-15T18:15:22.000Z",
    user: "sarah.j@apexhealthtech.com",
    role: "customer",
    action: "DELIVERABLE_HTML_GENERATED",
    details: "Generated SEO/GEO deliverable 'SEO Blog Post' (v2)",
    ip: "172.56.21.9",
    status: "success"
  },
  {
    id: "log-4",
    timestamp: "2026-08-15T17:50:00.000Z",
    user: "unknown@external.net",
    role: "guest",
    action: "FAILED_AUTH_ATTEMPT",
    details: "Failed login with invalid credentials; rate limiter triggered",
    ip: "45.33.32.156",
    status: "failure"
  }
];

export function AuditLogsModule({ initialLogs = INITIAL_LOGS }: { initialLogs?: any[] }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs.length > 0 ? initialLogs : INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Details", "IP", "Status"];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.user,
      l.role,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip,
      l.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dealflow_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-teal-950/20 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold bg-teal-950/60 border border-teal-700/50 px-2 py-0.5 rounded-full">
              Compliance & Non-Repudiation
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <FileText className="h-6 w-6 text-teal-400" /> Immutable Audit Logs
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Cryptographically verified audit trail recording all administrative changes, customer switching, and authorization events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExtrudedButton
              onClick={handleExportCsv}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-500/20"
            >
              <Download className="h-3.5 w-3.5" /> Export Audit CSV
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by action, user, details, or IP..."
            className="bg-slate-950 border-slate-800 text-xs pl-9 h-9 rounded-xl focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success Events</option>
            <option value="failure">Failure & Alerts</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5">Actor Identity</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">Event Description</th>
                <th className="p-3.5">Origin IP</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-3.5 font-bold text-white">
                    {l.user}
                    <span className="text-[9px] text-slate-500 block uppercase font-normal">{l.role}</span>
                  </td>
                  <td className="p-3.5 text-teal-400 font-bold whitespace-nowrap">{l.action}</td>
                  <td className="p-3.5 text-slate-300 font-sans text-xs max-w-sm">{l.details}</td>
                  <td className="p-3.5 text-slate-400">{l.ip}</td>
                  <td className="p-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === "success" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" : "bg-rose-950/80 text-rose-300 border border-rose-800/50"
                    }`}>
                      {l.status}
                    </span>
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
