// components/whatsapp/WhatsAppIntegrationsList.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  Zap, 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Activity, 
  Server, 
  ExternalLink,
  Plus,
  X,
  Filter
} from "lucide-react";
import { WhatsAppConfiguredIntegration } from "@/app/api/whatsapp/integrations/route";
import { WhatsAppProviderSelectorModal, WhatsAppProviderChoice } from "@/components/whatsapp/WhatsAppProviderSelectorModal";
import { OpenWAOnboardingModal } from "@/components/portal/OpenWAOnboardingModal";
import { GlassPanel } from "@/components/immersive/GlassPanel";

interface WhatsAppIntegrationsListProps {
  onSelectIntegration?: (integration: WhatsAppConfiguredIntegration) => void;
  className?: string;
}

export function WhatsAppIntegrationsList({
  onSelectIntegration,
  className = "",
}: WhatsAppIntegrationsListProps) {
  const [integrations, setIntegrations] = useState<WhatsAppConfiguredIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modals for onboarding / gateway switching
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isOpenWAModalOpen, setIsOpenWAModalOpen] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const res = await fetch("/api/whatsapp/integrations");
      const data = await res.json();
      if (data.success && Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
        if (!selectedId && data.integrations.length > 0) {
          setSelectedId(data.integrations[0].id);
        }
      } else {
        throw new Error(data.error || "Failed to load WhatsApp integrations");
      }
    } catch (err: any) {
      console.error("[WhatsAppIntegrationsList] Fetch error:", err);
      setError(err.message || "Failed to load WhatsApp integrations.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const filteredIntegrations = integrations.filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "inactive") {
      return item.status === "inactive" || item.status === "disconnected";
    }
    return item.status === statusFilter;
  });

  const getStatusBadge = (status: WhatsAppConfiguredIntegration["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            PENDING PAIRING
          </span>
        );
      case "inactive":
      case "disconnected":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            INACTIVE
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 text-left ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-md border border-[#25D366]/20">
              WhatsApp Workbench Infrastructure
            </span>
            <span className="text-xs text-[#86868B]">
              {integrations.length} Configured Lines
            </span>
          </div>
          <h3 className="text-base font-bold text-[#110F24] dark:text-white mt-1 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#25D366]" />
            Configured WhatsApp Integrations
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.04] p-0.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-xs">
            {(["all", "active", "pending", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-[#0071E3] text-white shadow-sm font-bold"
                    : "text-[#86868B] hover:text-[#110F24] dark:hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchIntegrations}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#161618] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#86868B] hover:text-[#110F24] dark:hover:text-white transition-colors"
            title="Refresh integration states"
            aria-label="Refresh integration states"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#0071E3]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-violet-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add / Switch Gateway</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchIntegrations} className="text-xs font-bold underline hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] animate-pulse space-y-3">
              <div className="h-4 bg-black/[0.05] dark:bg-white/[0.05] rounded w-1/2" />
              <div className="h-3 bg-black/[0.03] dark:bg-white/[0.03] rounded w-3/4" />
              <div className="h-8 bg-black/[0.04] dark:bg-white/[0.04] rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-black/[0.01] dark:bg-white/[0.01] space-y-2">
          <MessageSquare className="h-8 w-8 text-[#86868B] mx-auto opacity-50" />
          <p className="text-xs font-semibold text-[#110F24] dark:text-white">
            No WhatsApp integrations found for filter &quot;{statusFilter}&quot;.
          </p>
          <p className="text-[11px] text-[#86868B]">
            Add an Evolution API cluster or pair an Open WA node to activate communications.
          </p>
        </div>
      ) : (
        /* Integrations Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredIntegrations.map((item) => {
            const isSelected = selectedId === item.id;
            const isEvolution = item.gateway === "evolution";
            const GatewayIcon = isEvolution ? Zap : QrCode;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  if (onSelectIntegration) onSelectIntegration(item);
                }}
                className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-3 ${
                  isSelected
                    ? "border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 shadow-md"
                    : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#14141A] hover:border-black/[0.15] dark:hover:border-white/[0.15]"
                }`}
              >
                {/* Top Row: Gateway Badge & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 ${
                      isEvolution
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                      <GatewayIcon className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#110F24] dark:text-white leading-tight truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#86868B] block mt-0.5">
                        ID: {item.id}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#86868B] block">Linked Phone</span>
                    <span className="font-mono font-semibold text-[#110F24] dark:text-slate-200 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#25D366]" />
                      {item.phoneNumber}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#86868B] block">Gateway Node</span>
                    <span className="font-semibold text-[#110F24] dark:text-slate-200 capitalize">
                      {item.gateway === "openwa" ? "Open WA (Web Node)" : "Evolution (REST API)"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#86868B] block">Daily Quota Meter</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.dailyQuotaUsed} / {item.dailyQuotaLimit} msgs
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#86868B] block">Last Synchronized</span>
                    <span className="font-mono text-[10px] text-[#86868B] flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(item.lastSyncTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Quick Action Button for Pending QR */}
                {item.status === "pending" && item.qrRequired && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpenWAModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Complete Device QR Pairing</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Provider Selector Modal */}
      <WhatsAppProviderSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectProvider={(provider: WhatsAppProviderChoice) => {
          if (provider === "openwa") {
            setIsOpenWAModalOpen(true);
          }
          fetchIntegrations();
        }}
      />

      {/* OpenWA Onboarding / Pairing Modal */}
      <OpenWAOnboardingModal
        isOpen={isOpenWAModalOpen}
        onClose={() => {
          setIsOpenWAModalOpen(false);
          fetchIntegrations();
        }}
      />
    </div>
  );
}
