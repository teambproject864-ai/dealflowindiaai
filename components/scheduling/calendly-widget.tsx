"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw, ExternalLink, Calendar } from "lucide-react";

interface CalendlyWidgetProps {
  url?: string;
  height?: string;
  minWidth?: string;
  className?: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillCompany?: string;
}

export function CalendlyWidget({
  url = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/praneethburada/30min",
  height = "700px",
  minWidth = "320px",
  className = "",
  prefillName,
  prefillEmail,
  prefillCompany
}: CalendlyWidgetProps) {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  const buildCalendlyUrl = () => {
    try {
      const parsedUrl = new URL(url);
      if (prefillName) parsedUrl.searchParams.set("name", prefillName);
      if (prefillEmail) parsedUrl.searchParams.set("email", prefillEmail);
      if (prefillCompany) parsedUrl.searchParams.set("a1", prefillCompany);
      return parsedUrl.toString();
    } catch {
      return url;
    }
  };

  const finalUrl = buildCalendlyUrl();

  const loadCalendlyScript = () => {
    setLoadState("loading");
    const scriptId = "calendly-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => setLoadState("loaded");
      script.onerror = () => setLoadState("error");
      document.body.appendChild(script);
    } else {
      setLoadState("loaded");
    }
  };

  useEffect(() => {
    loadCalendlyScript();

    // Fallback timeout if iframe takes longer than 8 seconds to report load
    const timer = setTimeout(() => {
      setLoadState((prev) => (prev === "loading" ? "loaded" : prev));
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`w-full flex flex-col items-center justify-center relative ${className}`}
      role="region"
      aria-label="Calendly Demo Booking Widget"
    >
      {/* Loading Overlay */}
      {loadState === "loading" && (
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center space-y-4 z-20 border border-slate-800"
          aria-live="polite"
        >
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
            <Calendar className="w-4 h-4 text-purple-400 absolute" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white tracking-wide animate-pulse">
              Loading Official Calendly Demo Scheduler...
            </p>
            <p className="text-xs text-slate-400">
              Connecting securely to live calendar availability
            </p>
          </div>
        </div>
      )}

      {/* Error Fallback UI */}
      {loadState === "error" ? (
        <div className="w-full p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-slate-200 flex flex-col items-center text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Unable to Load Calendly Widget</h3>
            <p className="text-xs text-slate-400 max-w-md">
              The embedded calendar could not be loaded. Please check your connection or open Calendly directly in a new window.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              onClick={loadCalendlyScript}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
            </button>
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-semibold text-slate-950 flex items-center gap-2 transition-colors"
            >
              Open Calendly Directly <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        /* Official Calendly Inline Widget Container */
        <div
          className="calendly-inline-widget w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900"
          data-url={finalUrl}
          style={{ minWidth, height }}
        />
      )}
    </div>
  );
}
