// components/portal/PortalSidebar.tsx
"use client";

import React from "react";
import { LucideIcon, ChevronLeft, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

export interface SidebarTab {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  badge?: string | number;
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
    activeGlow: "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] dark:bg-[#2997FF]/15 border-[#0071E3]/20 dark:border-[#2997FF]/30",
    badgeVariant: "emerald" as const,
  },
  agent: {
    title: "Agent Command",
    subtitle: "Revenue Workstation",
    accentColor: "text-[#32ADE6]",
    activeGlow: "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] dark:bg-[#2997FF]/15 border-[#0071E3]/20 dark:border-[#2997FF]/30",
    badgeVariant: "cyan" as const,
  },
  admin: {
    title: "Admin Executive",
    subtitle: "System Governance",
    accentColor: "text-[#FF9500]",
    activeGlow: "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] dark:bg-[#2997FF]/15 border-[#0071E3]/20 dark:border-[#2997FF]/30",
    badgeVariant: "gold" as const,
  },
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

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-[#FBFBFD]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">{theme.title}</span>
              <span className="text-[10px] text-[#86868B] font-medium">{theme.subtitle}</span>
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

      {/* Tabs Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all duration-200 group text-left",
                isActive
                  ? `${theme.activeGlow} shadow-sm`
                  : "border-transparent text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              )}
            >
              <tab.icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]")} />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] text-[10px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
          {!collapsed && (
            <div className="flex flex-col truncate text-[10px]">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">System Status: Online</span>
              <span className="text-[#86868B]">100% Operational</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
