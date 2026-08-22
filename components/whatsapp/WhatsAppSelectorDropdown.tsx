// components/whatsapp/WhatsAppSelectorDropdown.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, ChevronDown, Check, Zap, QrCode } from "lucide-react";
import { WhatsAppProviderChoice } from "./WhatsAppProviderSelectorModal";

interface WhatsAppSelectorDropdownProps {
  currentProvider?: WhatsAppProviderChoice;
  onSelectProvider: (provider: WhatsAppProviderChoice) => void;
  className?: string;
}

export function WhatsAppSelectorDropdown({
  currentProvider = "evolution",
  onSelectProvider,
  className = "",
}: WhatsAppSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right: number; left: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        left: rect.left,
      });
    }
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const options: Array<{ id: WhatsAppProviderChoice; name: string; badge: string; icon: any }> = [
    {
      id: "evolution",
      name: "Evolution Whatsapp",
      badge: "Primary REST",
      icon: Zap,
    },
    {
      id: "openwa",
      name: "Open WA",
      badge: "Secondary Node",
      icon: QrCode,
    },
  ];

  const current = options.find((o) => o.id === currentProvider) || options[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`WhatsApp Provider: ${current.name}. Click to change.`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#14141A] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold text-[#110F24] dark:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366]">
          <CurrentIcon className="h-3.5 w-3.5" />
        </div>
        <span>{current.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#86868B] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && isMounted && dropdownCoords && typeof document !== "undefined" && createPortal(
        <div 
          ref={menuRef}
          role="listbox" 
          aria-label="WhatsApp options"
          style={{
            position: "fixed",
            top: `${dropdownCoords.top}px`,
            right: `${Math.max(12, dropdownCoords.right)}px`,
            zIndex: 99999,
          }}
          className="w-56 rounded-2xl bg-white/98 dark:bg-[#161618]/98 border border-black/[0.12] dark:border-white/[0.18] shadow-2xl backdrop-blur-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
            Select WhatsApp Gateway
          </div>

          {options.map((opt) => {
            const isSelected = opt.id === currentProvider;
            const OptIcon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectProvider(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] font-bold"
                    : "text-[#110F24] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#25D366]">
                    <OptIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs leading-tight">{opt.name}</p>
                    <span className="text-[10px] text-[#86868B]">{opt.badge}</span>
                  </div>
                </div>

                {isSelected && <Check className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
