import React from "react";
import { AgentDashboard } from "@/components/monitoring/agent-dashboard";

export const metadata = {
  title: "Agent & MAG Monitoring | DealFlow AI",
  description: "Real-time voice, chat, and Memory-Augmented Generation (MAG) performance telemetry, KPIs, and anomaly monitoring.",
};

export default function AgentMonitoringPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AgentDashboard />
      </div>
    </main>
  );
}
