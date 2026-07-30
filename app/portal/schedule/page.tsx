import React from "react";
import { CalendlyWidget } from "@/components/scheduling/calendly-widget";

export const metadata = {
  title: "Portal Schedule | DealFlow AI",
  description: "Official Calendly inline scheduling portal page.",
};

export default function PortalSchedulePage() {
  return (
    <main className="p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white">Official Project Call & Demo Scheduler</h1>
            <p className="text-xs text-slate-400 mt-1">
              Standardized scheduling policy enforced: Use the official Calendly widget below to book meeting slots.
            </p>
          </div>
        </div>

        <CalendlyWidget height="720px" />
      </div>
    </main>
  );
}
