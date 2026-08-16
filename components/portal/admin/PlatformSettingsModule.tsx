// components/portal/admin/PlatformSettingsModule.tsx
"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Sliders, 
  Bell, 
  Globe, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Cpu,
  Mail,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";

export function PlatformSettingsModule() {
  const [platformName, setPlatformName] = useState("DealFlow AI Revenue OS");
  const [supportEmail, setSupportEmail] = useState("support@dealflow.ai");
  const [webhookUrl, setWebhookUrl] = useState("https://api.dealflow.ai/webhooks/crm-sync");
  
  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState({
    aiWebinarModule: true,
    communityMining: true,
    voiceDialerIntegration: true,
    autoGtmPlaybooks: true,
    customerSelfRegistration: true,
    maintenanceMode: false
  });

  const [isSaved, setIsSaved] = useState(false);

  const toggleFlag = (flagKey: keyof typeof featureFlags) => {
    setFeatureFlags(prev => ({ ...prev, [flagKey]: !prev[flagKey] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-slate-800/40 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold bg-slate-900 border border-slate-750 px-2 py-0.5 rounded-full">
              Global Platform Configuration
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <Settings className="h-6 w-6 text-slate-300" /> Platform Settings & Feature Flags
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Configure global application branding, webhook endpoints, feature rollouts, and notification delivery options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExtrudedButton
              onClick={handleSave}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-500/20"
            >
              <Check className="h-3.5 w-3.5" /> {isSaved ? "Settings Saved" : "Save All Settings"}
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Branding & URLs */}
        <GlassPanel tilt={false} className="border-slate-800/80 p-6 bg-slate-950/60 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4 text-violet-400" /> General Application Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Application Workspace Name</label>
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Default Support Contact Email</label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-300">Global CRM Sync Webhook Endpoint</label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs h-10 rounded-xl font-mono"
              />
            </div>
          </div>
        </GlassPanel>

        {/* Global Feature Flags Toggle Matrix */}
        <GlassPanel tilt={false} className="border-slate-800/80 p-6 bg-slate-950/60 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" /> Platform Feature Flags & Capabilities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
            
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">AI Webinar Module</span>
                <span className="text-[10px] text-slate-500">Autonomous webinar simulation & lead capture.</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.aiWebinarModule}
                onChange={() => toggleFlag("aiWebinarModule")}
                className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">Community Mining Automation</span>
                <span className="text-[10px] text-slate-500">Social intent scraping and lead pipelines.</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.communityMining}
                onChange={() => toggleFlag("communityMining")}
                className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">AI Voice Dialer & WhatsApp</span>
                <span className="text-[10px] text-slate-500">Twilio telephony & WhatsApp message queues.</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.voiceDialerIntegration}
                onChange={() => toggleFlag("voiceDialerIntegration")}
                className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">Maintenance Mode</span>
                <span className="text-[10px] text-rose-400">Lock non-admin access for updates.</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.maintenanceMode}
                onChange={() => toggleFlag("maintenanceMode")}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

          </div>
        </GlassPanel>

      </form>

    </div>
  );
}
