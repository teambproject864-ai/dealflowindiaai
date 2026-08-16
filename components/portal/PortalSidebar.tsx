// components/portal/PortalSidebar.tsx
"use client";

import React, { useState } from "react";
import { LucideIcon, ChevronLeft, ChevronRight, Zap, ShieldCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarTab {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  badge?: string | number;
  category?: string;
}

export interface PortalSidebarProps {
  role: "customer" | "agent" | "admin";
  tabs: readonly SidebarTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ROLE_SIDEBAR_THEMES = {
  customer: {
    title: "Customer Portal",
    subtitle: "Self-Service Workspace",
    accentColor: "text-[#34C759]",
    activeGlow: "bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF] dark:bg-[#2997FF]/15 border-[#0071E3]/30 dark:border-[#2997FF]/40",
    badgeVariant: "emerald" as const,
  },
  agent: {
    title: "Agent Command",
    subtitle: "Revenue Workstation",
    accentColor: "text-[#32ADE6]",
    activeGlow: "bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF] dark:bg-[#2997FF]/15 border-[#0071E3]/30 dark:border-[#2997FF]/40",
    badgeVariant: "cyan" as const,
  },
  admin: {
    title: "Admin Governance",
    subtitle: "System Command Center",
    accentColor: "text-[#FF9500]",
    activeGlow: "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
    badgeVariant: "gold" as const,
  },
};

const CATEGORY_MAP: Record<string, string> = {
  // Overview
  dashboard: "Overview & Intelligence",
  "usage-analytics": "Overview & Intelligence",
  "llm-manager": "Overview & Intelligence",
  orchestrator: "Overview & Intelligence",
  "gtm-reports": "Overview & Intelligence",

  // Entities
  agents: "Entity Management",
  customers: "Entity Management",
  tasks: "Entity Management",
  documents: "Entity Management",
  requirements: "Entity Management",
  resignations: "Entity Management",

  // Communications
  "bot-monitor": "Communications & Integrations",
  interactions: "Communications & Integrations",
  "whatsapp-archive": "Communications & Integrations",
  "crm-sync-center": "Communications & Integrations",
  "dealflow-crm": "Communications & Integrations",

  // Governance & Security
  "users-orgs": "Platform & Governance",
  "roles-permissions": "Platform & Governance",
  "subscriptions-billing": "Platform & Governance",
  "security-management": "Platform & Governance",
  "audit-logs-module": "Platform & Governance",
  "password-requests": "Platform & Governance",
  "system-health-module": "Platform & Governance",
  "platform-settings-module": "Platform & Governance",
};

export function PortalSidebar({
  role,
  tabs,
  activeTab,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
}: PortalSidebarProps) {
  const theme = ROLE_SIDEBAR_THEMES[role] || ROLE_SIDEBAR_THEMES.customer;
  const [navSearch, setNavSearch] = useState("");

  const filteredTabs = tabs.filter((t) =>
    !navSearch ? true : t.label.toLowerCase().includes(navSearch.toLowerCase())
  );

  // Group tabs by category
  const groupedTabs = filteredTabs.reduce((acc, tab) => {
    const category = tab.category || CATEGORY_MAP[tab.id] || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(tab);
    return acc;
  }, {} as Record<string, SidebarTab[]>);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-[#FBFBFD]/95 dark:bg-[#07070a]/95 backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-600/30">
            <Zap className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">{theme.title}</span>
              <span className="text-[10px] text-violet-400 font-semibold">{theme.subtitle}</span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Quick Tab Search (when expanded) */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Find module..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Tabs Navigation List Grouped */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {Object.entries(groupedTabs).map(([categoryName, categoryTabs]) => (
          <div key={categoryName} className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {categoryName}
              </p>
            )}

            {categoryTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 group text-left",
                    isActive
                      ? `${theme.activeGlow} shadow-sm font-bold`
                      : "border-transparent text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  )}
                  title={collapsed ? tab.label : undefined}
                >
                  <tab.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-violet-400" : "text-[#86868B]"
                    )}
                  />

                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{tab.label}</span>
                      {tab.badge && (
                        <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-[#121216] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col truncate text-[10px]">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">System Governance</span>
              <span className="text-emerald-400 font-bold">Real-time Verified</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
