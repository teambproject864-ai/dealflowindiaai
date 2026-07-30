"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useCalendlyEventListener } from "react-calendly";
import { Calendar, ShieldCheck, X, CheckCircle } from "lucide-react";

const DynamicInlineWidget = dynamic(
  () => import("react-calendly").then((mod) => mod.InlineWidget),
  { ssr: false }
);

type Props = {
  name?: string;
  email?: string;
  companyName?: string;
  contactPhone?: string;
  leadId?: string;
  analysisId?: string;
  skipAiAgent?: boolean;
  forcedMeetingType?: "ai" | "live" | "calendly" | "cal";
  challengeTags?: string[];
  intakeNotes?: string;
  selectedPlanKey?: string;
  onClose?: () => void;
};

export function BookingWidget({
  name = "",
  email = "",
  companyName = "",
  onClose
}: Props) {
  const [scheduled, setScheduled] = useState(false);
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/praneethburada/30min";

  // Listen to official Calendly event notifications
  useCalendlyEventListener({
    onEventScheduled: (e) => {
      console.log("[Calendly] Meeting scheduled successfully:", e.data.payload);
      setScheduled(true);
    },
  });

  return (
    <div className="w-full bg-[#0A0F1E]/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative flex flex-col min-h-[750px]">
      {/* Header Bar */}
      <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-teal-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Official Calendly Call & Demo Scheduler
            </h2>
            <p className="text-xs text-slate-400">
              Standardized Scheduling: Exclusive Calendly integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 border border-teal-500/30 text-teal-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Calendly Verified</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Banner if Scheduled */}
      {scheduled && (
        <div className="m-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-sm block text-white">Call Booking Confirmed!</span>
            Your meeting has been scheduled via Calendly. Check your email for the calendar invitation link.
          </div>
        </div>
      )}

      {/* Official Calendly Container */}
      <div className="w-full flex-1 min-h-[680px] bg-[#0A0F1E]/40">
        <DynamicInlineWidget
          url={calendlyUrl}
          prefill={{
            email: email,
            name: name,
          }}
          styles={{
            height: "700px",
            width: "100%"
          }}
        />
      </div>
    </div>
  );
}
