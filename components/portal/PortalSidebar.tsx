// components/portal/PortalSidebar.tsx
"use client";

import React, { useState } from "react";
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
    subtitle: "Dealflow Self-Service",
    accentBorder: "border-emerald-500/30",
    activeGlow: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10",
    badgeVariant: "emerald" as const,
  },
  agent: {
    title: "Agent Command",
    subtitle: "Revenue Workstation",
    accentBorder: "border-cyan-500/30",
    activeGlow: "bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10",
    badgeVariant: "cyan" as const,
  },
  admin: {
    title: "Admin Executive",
    subtitle: "System Governance",
    accentBorder: "border-amber-500/30",
    activeGlow: "bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-amber-500/10",
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
        "relative flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <IconBadge icon={Zap} variant={theme.badgeVariant} size="md" glow={true} pulse={true} />
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm text-slate-100 tracking-tight">{theme.title}</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">{theme.subtitle}</span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Tabs Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 group text-left",
                isActive
                  ? `${theme.activeGlow} shadow-md`
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800"
              )}
            >
              <IconBadge
                icon={tab.icon}
                variant={isActive ? theme.badgeVariant : "indigo"}
                size="sm"
                glow={isActive}
              />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 font-bold">
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
      <div className="p-3 border-t border-slate-850 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-850">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col truncate text-[10px]">
              <span className="font-bold text-slate-200">System Status: Online</span>
              <span className="text-slate-400 font-mono">100% Operational</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
