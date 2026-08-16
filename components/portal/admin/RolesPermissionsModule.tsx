// components/portal/admin/RolesPermissionsModule.tsx
"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  Settings, 
  Layers, 
  Sliders, 
  Sparkles,
  KeyRound,
  RotateCw
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";

interface RolePermissionRule {
  key: string;
  name: string;
  category: "crm" | "ai_agents" | "content" | "system";
  description: string;
  admin: boolean;
  agent: boolean;
  customer: boolean;
}

const DEFAULT_PERMISSIONS: RolePermissionRule[] = [
  {
    key: "crm_read_write",
    name: "Full CRM Pipeline Management",
    category: "crm",
    description: "Create, modify, and delete customer deal records and company profiles.",
    admin: true,
    agent: true,
    customer: false
  },
  {
    key: "crm_customer_switch",
    name: "Cross-Account Workspace Context Switcher",
    category: "crm",
    description: "Switch active customer workstation context from the top navigation panel.",
    admin: true,
    agent: true,
    customer: false
  },
  {
    key: "bot_dispatch",
    name: "Autonomous Meeting Bot Dispatch",
    category: "ai_agents",
    description: "Trigger autonomous Google Meet/Zoom recording bots via Recall.ai.",
    admin: true,
    agent: true,
    customer: false
  },
  {
    key: "community_mining",
    name: "Community Mining & Lead Extractor",
    category: "ai_agents",
    description: "Scrape and ingest high-intent B2B leads from online communities.",
    admin: true,
    agent: true,
    customer: true
  },
  {
    key: "keyword_studio",
    name: "SEO & GEO Deliverable Content Studio",
    category: "content",
    description: "Generate semantic HTML deliverable content incorporating SEO/GEO target matrices.",
    admin: true,
    agent: true,
    customer: true
  },
  {
    key: "rbac_user_management",
    name: "User Provisioning & Password Resets",
    category: "system",
    description: "Add/delete users, configure system-wide roles, and execute direct credential resets.",
    admin: true,
    agent: false,
    customer: false
  },
  {
    key: "audit_log_export",
    name: "Immutable Security Audit Logs Export",
    category: "system",
    description: "View and export raw user audit event streams and IP tracking records.",
    admin: true,
    agent: false,
    customer: false
  }
];

export function RolesPermissionsModule() {
  const [permissions, setPermissions] = useState<RolePermissionRule[]>(DEFAULT_PERMISSIONS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const togglePermission = (key: string, role: "admin" | "agent" | "customer") => {
    if (role === "admin") return; // Admin always retains root privileges
    setPermissions(permissions.map(p => p.key === key ? { ...p, [role]: !p[role] } : p));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-amber-950/20 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
              RBAC Matrix
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <KeyRound className="h-6 w-6 text-amber-400" /> Roles & Permissions Governance
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Configure fine-grained role-based access control (RBAC) privileges across platform features and execution layers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 flex items-center gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" /> Reset Defaults
            </button>
            <ExtrudedButton
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="h-3.5 w-3.5" /> {savedSuccess ? "Saved Policy" : "Save Matrix"}
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>

      {/* Permissions Grid Table */}
      <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Permission / Feature Capability</th>
                <th className="p-3.5 text-center">Administrator</th>
                <th className="p-3.5 text-center">Specialist Agent</th>
                <th className="p-3.5 text-center">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {permissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 max-w-md">
                    <p className="font-bold text-white text-xs">{perm.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{perm.description}</p>
                  </td>
                  
                  {/* Admin (Always checked) */}
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-300 font-bold">
                      <Check className="h-4 w-4" />
                    </div>
                  </td>

                  {/* Agent */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(perm.key, "agent")}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                        perm.agent ? "bg-cyan-950/80 border-cyan-700/60 text-cyan-300" : "bg-slate-900/60 border-slate-800 text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {perm.agent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>

                  {/* Customer */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(perm.key, "customer")}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                        perm.customer ? "bg-violet-950/80 border-violet-700/60 text-violet-300" : "bg-slate-900/60 border-slate-800 text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {perm.customer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
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
