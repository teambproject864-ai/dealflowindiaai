// components/portal/PortalHeader.tsx
"use client";

import React, { useState } from "react";
import { Search, Bell, Sparkles, User, Shield, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

export interface PortalHeaderProps {
  role: "customer" | "agent" | "admin";
  activeTabLabel: string;
  userEmail?: string;
  userName?: string;
  onSearchOpen?: () => void;
}

const ROLE_HEADER_METADATA = {
  customer: {
    portalName: "Customer Portal",
    badgeText: "Customer Pro",
    badgeVariant: "emerald" as const,
  },
  agent: {
    portalName: "Agent Portal",
    badgeText: "Revenue Specialist",
    badgeVariant: "cyan" as const,
  },
  admin: {
    portalName: "Admin Portal",
    badgeText: "Executive Admin",
    badgeVariant: "gold" as const,
  },
};

export function PortalHeader({
  role,
  activeTabLabel,
  userEmail = "user@dealflow.ai",
  userName = "Dealflow User",
  onSearchOpen,
}: PortalHeaderProps) {
  const meta = ROLE_HEADER_METADATA[role] || ROLE_HEADER_METADATA.customer;
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between gap-4">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium truncate">
        <span className="text-slate-500 font-mono">Dealflow.AI</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-300 font-semibold">{meta.portalName}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-100 font-bold tracking-tight">{activeTabLabel}</span>
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={onSearchOpen}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span>Search features, tickets, deals, KB articles...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Health Meter */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 text-xs font-mono text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>API 100%</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3 z-50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">System Notifications</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
                  <p className="font-semibold text-slate-200 text-xs">Meeting Bot Dispatched</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Session `bot-live-101` connected to Google Meet.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
                  <p className="font-semibold text-slate-200 text-xs">WhatsApp Message Logged</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Inbound message archived in compliance vault.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-850">
          <IconBadge icon={User} variant={meta.badgeVariant} size="sm" />
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-bold text-xs text-slate-200 truncate max-w-[120px]">{userName}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">{meta.badgeText}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
