import React from "react";
import { CalendlyWidget } from "@/components/scheduling/calendly-widget";

export const metadata = {
  title: "Schedule Call & Demo | DealFlow AI",
  description: "Official Calendly booking page for all team members, clients, and external stakeholders to schedule demo calls.",
};

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Schedule Call & Demo</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Mandatory Scheduling Policy: All team members, clients, and external stakeholders must exclusively use this official Calendly widget to book calls or demos.
          </p>
        </div>

        {/* Embedded Official Calendly Inline Widget */}
        <CalendlyWidget height="750px" />
      </div>
    </main>
  );
}
