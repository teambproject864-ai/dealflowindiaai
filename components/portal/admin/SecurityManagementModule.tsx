// components/portal/admin/SecurityManagementModule.tsx
"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  Smartphone, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Eye,
  LogOut,
  RefreshCw
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";

export function SecurityManagementModule() {
  const [sessions, setSessions] = useState([
    { id: "sess-1", user: "admin@dealflow.ai", role: "admin", ip: "192.168.1.1", device: "Chrome / macOS (Current)", location: "San Francisco, US", activeSince: "10 mins ago" },
    { id: "sess-2", user: "praneeth@dealflow.ai", role: "agent", ip: "104.28.19.4", device: "Firefox / Windows", location: "New York, US", activeSince: "45 mins ago" },
    { id: "sess-3", user: "sarah.j@apexhealthtech.com", role: "customer", ip: "172.56.21.9", device: "Safari / iOS", location: "Austin, US", activeSince: "2 hours ago" }
  ]);

  const [alerts, setAlerts] = useState([
    { id: "alt-1", type: "info", title: "MFA Policy Enforced", time: "1 hour ago", desc: "Administrator role successfully configured with hardware MFA." },
    { id: "alt-2", type: "warning", title: "Failed Login Spike Mitigated", time: "3 hours ago", desc: "5 invalid attempts from IP 45.33.32.156 blocked by rate limiter." }
  ]);

  const handleTerminateSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-rose-950/20 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded-full">
              Infra Security & SOC2
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <ShieldCheck className="h-6 w-6 text-rose-400" /> Security & Threat Management
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Monitor active authentications, terminate suspicious user sessions, and enforce encryption and MFA policies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Active Sessions</span>
              <span className="text-base font-bold text-white font-mono">{sessions.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Threat Level</span>
              <span className="text-base font-bold text-emerald-400 font-mono">Low (Guarded)</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Security Alerts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
          Security Alerts & Guard Events
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alt) => (
            <div key={alt.id} className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              alt.type === "warning" ? "bg-amber-950/40 border-amber-500/40 text-amber-200" : "bg-slate-900/60 border-slate-800 text-slate-300"
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold flex items-center gap-1.5">
                  {alt.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                  {alt.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{alt.time}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{alt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active User Sessions Table */}
      <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl space-y-2">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Active User Sessions
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Live In-Flight JWTs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/40 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">IP Address & Location</th>
                <th className="p-3.5">Client Device</th>
                <th className="p-3.5">Active Since</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    {s.user}
                    <span className="block text-[10px] font-mono text-slate-500 font-normal uppercase">{s.role}</span>
                  </td>
                  <td className="p-3.5 font-mono">
                    <p className="text-slate-200">{s.ip}</p>
                    <p className="text-[10px] text-slate-500">{s.location}</p>
                  </td>
                  <td className="p-3.5 text-slate-400">{s.device}</td>
                  <td className="p-3.5 font-mono text-emerald-400">{s.activeSince}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleTerminateSession(s.id)}
                      className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[10px] font-bold flex items-center gap-1 ml-auto"
                    >
                      <LogOut className="h-3 w-3" /> Terminate
                    </button>
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
