// components/portal/PortalHeader.tsx
"use client";

import React, { useState } from "react";
import { Search, Bell, Sparkles, User, Shield, ChevronRight, Activity } from "lucide-react";
import { cn, getCustomerDisplayName } from "@/lib/utils";
import { CustomerSwitcher, CustomerAccountOption } from "./CustomerSwitcher";

export interface PortalHeaderProps {
  role: "customer" | "agent" | "admin";
  activeTabLabel: string;
  userEmail?: string;
  userName?: string;
  onSearchOpen?: () => void;
  customers?: CustomerAccountOption[];
  selectedCustomerId?: string;
  onSelectCustomer?: (customer: CustomerAccountOption) => void;
  onAddCustomer?: (newCustomer: CustomerAccountOption) => Promise<boolean> | boolean;
}

const ROLE_HEADER_METADATA = {
  customer: {
    portalName: "Customer Portal",
    badgeText: "Customer Pro",
    badgeColor: "bg-[#34C759]/10 text-[#34C759]",
  },
  agent: {
    portalName: "Agent Portal",
    badgeText: "Revenue Specialist",
    badgeColor: "bg-[#32ADE6]/10 text-[#0071A4] dark:text-[#64D2FF]",
  },
  admin: {
    portalName: "Admin Portal",
    badgeText: "Executive Admin",
    badgeColor: "bg-[#FF9500]/10 text-[#FF9500]",
  },
};

export function PortalHeader({
  role,
  activeTabLabel,
  userEmail = "user@dealflow.ai",
  userName = "Customer Name",
  onSearchOpen,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddCustomer,
}: PortalHeaderProps) {
  const meta = ROLE_HEADER_METADATA[role] || ROLE_HEADER_METADATA.customer;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const displayName = typeof getCustomerDisplayName === "function"
    ? getCustomerDisplayName({ name: userName, email: userEmail })
    : (userName && userName !== "Customer Name" ? userName : (userEmail.split("@")[0] || "Customer Name"));

  return (
    <header className="sticky top-0 z-20 w-full border-b border-black/[0.06] dark:border-white/[0.08] bg-[#FBFBFD]/80 dark:bg-[#0A0A0C]/80 backdrop-blur-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
      
      {/* Left: Breadcrumb Trail & Customer Switcher for Agent */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] font-medium truncate">
          <span className="text-[#86868B] hidden sm:inline">Dealflow.AI</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#86868B] hidden sm:inline" />
          <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold truncate">{meta.portalName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#86868B]" />
          <span className="text-[#0071E3] dark:text-[#2997FF] font-semibold tracking-tight truncate">{activeTabLabel}</span>
        </div>

        {/* Top Panel Customer Switcher (Dedicated to Agent Workstation) */}
        {role === "agent" && (
          <div className="pl-2 border-l border-black/[0.08] dark:border-white/[0.12] hidden md:block">
            <CustomerSwitcher
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={onSelectCustomer}
              onAddCustomer={onAddCustomer}
              align="left"
            />
          </div>
        )}
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-xs lg:max-w-md hidden lg:block">
        <button
          onClick={onSearchOpen}
          className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-full px-4 py-1.5 text-xs text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:border-[#0071E3]/40 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#86868B] group-hover:text-[#0071E3] transition-colors" />
            <span className="truncate">Search features, tickets, deals...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-full bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[10px] font-mono text-[#86868B]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Mobile/Compact Customer Switcher for Agent */}
        {role === "agent" && (
          <div className="block md:hidden">
            <CustomerSwitcher
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={onSelectCustomer}
              onAddCustomer={onAddCustomer}
              align="right"
            />
          </div>
        )}

        {/* Real-time Health Meter */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C759]/10 border border-[#34C759]/25 text-xs text-[#248A3D] dark:text-[#30D158] font-semibold">
          <Activity className="w-3.5 h-3.5 text-[#34C759] animate-pulse" />
          <span>API 100%</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0071E3] animate-ping" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-3xl apple-glass-card p-4 space-y-3 z-50 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
                <span className="font-bold text-[#1D1D1F] dark:text-white">System Notifications</span>
                <span className="text-[10px] text-[#0071E3] dark:text-[#2997FF] font-semibold">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <p className="font-semibold text-[#1D1D1F] dark:text-white text-xs">Meeting Bot Dispatched</p>
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] mt-0.5">Session `bot-live-101` connected to Google Meet.</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <p className="font-semibold text-[#1D1D1F] dark:text-white text-xs">Customer Account Switched</p>
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] mt-0.5">Workspace context updated to active client profile.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-7 h-7 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7] truncate max-w-[120px] lg:max-w-[140px]" title={displayName}>
              {displayName}
            </span>
            <span className="text-[10px] text-[#86868B] uppercase">{meta.badgeText}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
