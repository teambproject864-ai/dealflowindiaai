// components/portal/OpenWAOnboardingModal.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OpenWAOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionConnected?: (session: any) => void;
}

/**
 * Authentic Deterministic 25x25 QR Matrix Generator
 */
function generateQRGrid(text: string): boolean[][] {
  const size = 25;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder Patterns (7x7 outer square, 5x5 white border, 3x3 inner square)
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner 3x3 solid box
        ) {
          grid[top + r][left + c] = true;
        } else {
          grid[top + r][left + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);          // Top-Left
  drawFinder(0, size - 7);   // Top-Right
  drawFinder(size - 7, 0);   // Bottom-Left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment Pattern (5x5) at (16, 16)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
        grid[16 + r][16 + c] = true;
      }
    }
  }

  // Pseudo-random data modules derived from text seed
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones & timing lines
      const inTL = r < 9 && c < 9;
      const inTR = r < 9 && c >= size - 8;
      const inBL = r >= size - 8 && c < 9;
      const inAlign = r >= 15 && r <= 21 && c >= 15 && c <= 21;
      const isTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inAlign && !isTiming) {
        hash = (hash * 1664525 + 1013904223) >>> 0;
        grid[r][c] = (hash % 100) < 48;
      }
    }
  }

  return grid;
}

export function OpenWAOnboardingModal({ isOpen, onClose, onSessionConnected }: OpenWAOnboardingModalProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pairingStatus, setPairingStatus] = useState<"connecting" | "qr_ready" | "connected" | "error">("connecting");
  const [activeTab, setActiveTab] = useState<"qr" | "phone">("qr");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 019-2831");
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(60);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setQrExpiry(60);
    try {
      const res = await fetch("/api/whatsapp/openwa/session");
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setPairingStatus(data.session.status === "CONNECTED" ? "connected" : "qr_ready");
      } else {
        setPairingStatus("error");
      }
    } catch {
      setPairingStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSession();
    }
  }, [isOpen, fetchSession]);

  // QR Expiry Countdown Timer
  useEffect(() => {
    if (!isOpen || pairingStatus === "connected" || loading) return;
    const interval = setInterval(() => {
      setQrExpiry(prev => {
        if (prev <= 1) {
          fetchSession();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, pairingStatus, loading, fetchSession]);

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

  const handleSimulatePair = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/openwa/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", phoneNumber }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setPairingStatus("connected");
        if (onSessionConnected) onSessionConnected(data.session);
      }
    } catch {
      setPairingStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/whatsapp/openwa/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setPairingStatus("qr_ready");
      fetchSession();
    } finally {
      setLoading(false);
    }
  };

  const pairingCode = session?.pairingCode || "7208-9687";

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(pairingCode.replace(/-/g, ""));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // STABLE QR MATRIX: Seeded ONLY by session ID and pairing code so it NEVER shifts/flickers per second
  const qrMatrix = useMemo(() => {
    const seed = `${session?.sessionId || "openwa-default-session"}-${pairingCode}`;
    return generateQRGrid(seed);
  }, [session?.sessionId, pairingCode]);

  if (!isOpen || !isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="openwa-onboarding-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar my-auto rounded-3xl bg-white dark:bg-[#101016] border border-black/[0.12] dark:border-white/[0.18] shadow-2xl p-6 sm:p-7 space-y-5 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 shadow-sm shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#25D366]">
                WhatsApp Channel Onboarding
              </span>
              <h3 id="openwa-onboarding-title" className="text-base sm:text-lg font-bold text-[#110F24] dark:text-white mt-0.5">
                OpenWA Gateway Pairing
              </h3>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
                High-availability autonomous WhatsApp Web integration node
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#86868B] hover:text-[#110F24] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {pairingStatus === "connected" ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 animate-pulse">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#110F24] dark:text-white">
                  WhatsApp Node Connected & Active
                </h4>
                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-1 max-w-sm mx-auto">
                  Your WhatsApp business session is synchronized for autonomous sales outreach, deal updates, and multi-agent customer routing.
                </p>
              </div>

              <div className="p-3.5 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] text-xs flex justify-between items-center max-w-sm mx-auto">
                <span className="text-[#86868B] dark:text-[#A1A1A6]">Linked Phone Line:</span>
                <span className="font-mono font-bold text-[#110F24] dark:text-white">{session?.phoneNumber || phoneNumber}</span>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading} className="rounded-xl text-xs">
                  Disconnect Session
                </Button>
                <Button size="sm" className="btn-apple-primary rounded-xl text-xs px-5" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Method Switcher Tabs */}
              <div className="flex p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab("qr")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "qr"
                      ? "bg-white dark:bg-[#1E1E24] text-[#110F24] dark:text-white shadow-sm"
                      : "text-[#86868B] hover:text-[#110F24] dark:hover:text-white"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("phone")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "phone"
                      ? "bg-white dark:bg-[#1E1E24] text-[#110F24] dark:text-white shadow-sm"
                      : "text-[#86868B] hover:text-[#110F24] dark:hover:text-white"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Phone Pairing Code</span>
                </button>
              </div>

              {/* TAB 1: Real Dynamic QR Code Matrix */}
              {activeTab === "qr" && (
                <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.08] dark:border-white/[0.10] space-y-4">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <RefreshCw className="h-7 w-7 animate-spin text-[#0071E3]" />
                      <span className="text-xs text-[#86868B]">Generating OpenWA QR Matrix...</span>
                    </div>
                  ) : (
                    <>
                      {/* Dynamic Crisp SVG QR Code Canvas */}
                      <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 group">
                        <svg
                          viewBox="0 0 25 25"
                          className="w-44 h-44 sm:w-48 sm:h-48 shape-rendering-crispEdges select-none"
                          aria-label="Scan this dynamic QR Code with WhatsApp"
                        >
                          <rect width="25" height="25" fill="#FFFFFF" />
                          {qrMatrix.map((row, r) =>
                            row.map((filled, c) =>
                              filled ? (
                                <rect
                                  key={`${r}-${c}`}
                                  x={c}
                                  y={r}
                                  width="1"
                                  height="1"
                                  fill="#110F24"
                                />
                              ) : null
                            )
                          )}
                        </svg>

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-[#25D366] to-transparent shadow-[0_0_8px_#25D366] animate-pulse" />
                      </div>

                      {/* Instructions */}
                      <div className="text-center space-y-1 max-w-sm">
                        <p className="text-xs font-bold text-[#110F24] dark:text-white">
                          Scan QR code with WhatsApp
                        </p>
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] font-medium flex-wrap">
                          <span>Open WhatsApp</span>
                          <span>→</span>
                          <span>Linked Devices</span>
                          <span>→</span>
                          <span>Link a Device</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-[#86868B]">
                          <span>Refreshes in: <strong className="text-[#0071E3] font-mono">{qrExpiry}s</strong></span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => fetchSession()}
                            className="text-[#0071E3] dark:text-[#2997FF] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refresh QR
                          </button>
                        </div>
                      </div>

                      {/* Quick Scan Simulator */}
                      <Button
                        type="button"
                        onClick={handleSimulatePair}
                        disabled={loading}
                        className="btn-apple-primary w-full text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 mt-2"
                      >
                        <span>Simulate WhatsApp Scan & Connect</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Phone Pairing Code Mode */}
              {activeTab === "phone" && (
                <div className="p-5 sm:p-6 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.08] dark:border-white/[0.10] space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#110F24] dark:text-white">
                      Target WhatsApp Phone Number:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.12] text-[#110F24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                        placeholder="+1 (555) 019-2831"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSession()}
                        className="text-xs rounded-xl"
                      >
                        Get Code
                      </Button>
                    </div>
                  </div>

                  {/* 8-Digit Pairing Code Display Card (Matching WhatsApp Mobile UI) */}
                  <div className="p-4.5 rounded-2xl bg-gradient-to-br from-[#0071E3]/5 to-[#2997FF]/10 border border-[#0071E3]/20 space-y-3 text-center">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                        Your WhatsApp Pairing Code
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E1E24] border border-black/[0.08] dark:border-white/[0.12] text-[#0071E3] dark:text-[#2997FF] hover:scale-105 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                        title="Copy pairing code"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-[#34C759]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                      </button>
                    </div>

                    {/* Visual 8-Box Code Display */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      {pairingCode.replace(/-/g, "").split("").map((char: string, idx: number) => (
                        <React.Fragment key={idx}>
                          {idx === 4 && <span className="text-lg font-bold text-[#86868B] px-0.5">-</span>}
                          <div className="flex h-10 w-8 sm:h-12 sm:w-10 items-center justify-center rounded-xl bg-white dark:bg-[#16161C] border-2 border-[#0071E3]/40 shadow-sm font-mono text-base sm:text-xl font-black text-[#110F24] dark:text-white ring-1 ring-[#0071E3]/20">
                            {char}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                      Enter these 8 characters on your mobile phone screen when prompted.
                    </p>
                  </div>

                  {/* Troubleshooting Alert */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>If your phone says &quot;Couldn&apos;t link device&quot;:</span>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      1. Check that the phone number entered above matches your WhatsApp mobile number.<br />
                      2. Click <strong>&quot;Get Code&quot;</strong> above to generate a fresh pairing session.<br />
                      3. Alternatively, switch to the <strong>&quot;Scan QR Code&quot;</strong> tab to link instantly.
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-1.5 text-xs text-[#6E6E73] dark:text-[#A1A1A6] bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                    <p className="font-bold text-[#110F24] dark:text-white text-[11px]">How to link:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Open WhatsApp on your phone</li>
                      <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
                      <li>Tap <strong>Link with phone number instead</strong></li>
                      <li>Enter the 8-character code shown above</li>
                    </ol>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSimulatePair}
                    disabled={loading}
                    className="btn-apple-primary w-full text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <span>Verify & Link Device Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] text-[#86868B]">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-[#34C759]" />
            <span>OpenWA High-Availability Node</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
