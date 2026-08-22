// components/whatsapp/WhatsAppProviderSelectorModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  MessageSquare, 
  Zap, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Radio,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type WhatsAppProviderChoice = "evolution" | "openwa";

export interface WhatsAppProviderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: WhatsAppProviderChoice) => void;
  currentProvider?: WhatsAppProviderChoice;
}

export function WhatsAppProviderSelectorModal({
  isOpen,
  onClose,
  onSelectProvider,
  currentProvider = "evolution",
}: WhatsAppProviderSelectorModalProps) {
  const [selected, setSelected] = useState<WhatsAppProviderChoice>(currentProvider);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSelected(currentProvider);
  }, [currentProvider]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted || typeof document === "undefined") return null;

  const providers = [
    {
      id: "evolution" as WhatsAppProviderChoice,
      name: "Evolution Whatsapp",
      tagline: "Primary REST API Gateway",
      description: "Direct multi-tenant REST communication gateway with live delivery tracking, high throughput, and automated CRM webhook callbacks.",
      icon: Zap,
      iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      features: [
        "Instant multi-tenant REST message dispatch",
        "Automated delivery & read status webhooks",
        "Pre-configured 15-min meeting reminders",
      ],
      recommended: true,
    },
    {
      id: "openwa" as WhatsAppProviderChoice,
      name: "Open WA",
      tagline: "Secondary High-Availability Node",
      description: "Autonomous secondary WhatsApp Web client supporting multi-device QR pairing, local session persistence, and end-to-end encryption.",
      icon: QrCode,
      iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      features: [
        "Device QR code pairing & session onboarding",
        "Independent failover communication channel",
        "SHA-256 encrypted compliance vault storage",
      ],
      recommended: false,
    },
  ];

  const handleConfirm = () => {
    onSelectProvider(selected);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-selector-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar my-auto rounded-3xl bg-white dark:bg-[#101016] border border-black/[0.12] dark:border-white/[0.18] shadow-2xl p-6 sm:p-7 space-y-6 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 shadow-sm shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#25D366]">
                WhatsApp Channel Configuration
              </span>
              <h2 id="whatsapp-selector-title" className="text-base sm:text-lg font-bold text-[#110F24] dark:text-white mt-0.5">
                Select WhatsApp Integration
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-0.5">
                Choose between Evolution WhatsApp and Open WA to launch your messaging workflow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#86868B] hover:text-[#110F24] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3" role="radiogroup" aria-label="WhatsApp Provider Options">
          {providers.map((p) => {
            const isChosen = selected === p.id;
            const IconComponent = p.icon;

            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={isChosen}
                tabIndex={0}
                onClick={() => setSelected(p.id)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setSelected(p.id);
                  }
                }}
                className={`group relative p-4.5 rounded-2xl border-2 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
                  isChosen
                    ? "border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 shadow-md"
                    : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] hover:border-black/[0.15] dark:hover:border-white/[0.15] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 mt-0.5 ${p.iconBg}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-[#110F24] dark:text-white">
                          {p.name}
                        </h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${p.badgeColor}`}>
                          {p.tagline}
                        </span>
                        {p.recommended && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] border border-[#34C759]/30">
                            Recommended
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed">
                        {p.description}
                      </p>

                      {/* Feature Bullet Points */}
                      <ul className="pt-2 space-y-1">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px] text-[#55526A] dark:text-[#C5C5CB]">
                            <CheckCircle2 className={`h-3 w-3 shrink-0 ${isChosen ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]"}`} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Radio Selection Dot */}
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 transition-colors mt-1 ${
                    isChosen
                      ? "border-[#0071E3] bg-[#0071E3] text-white"
                      : "border-black/[0.2] dark:border-white/[0.3] bg-transparent"
                  }`}>
                    {isChosen && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <ShieldCheck className="h-4 w-4 text-[#34C759]" />
            <span>End-to-end encrypted integration</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="btn-apple-primary text-xs font-semibold px-4 rounded-xl flex items-center gap-1.5"
            >
              <span>Launch {selected === "evolution" ? "Evolution WhatsApp" : "Open WA"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
