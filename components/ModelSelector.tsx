"use client";

import React from "react";
import { 
  SUPPORTED_MODELS, 
  ModelConfig, 
  getModelsForRole, 
  isModelAllowedForRole 
} from "@/lib/model-registry";
import { 
  getRoleMetadataLabel, 
  getKimiCapabilitiesSummary 
} from "@/lib/kimi-rbac";
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Brain, 
  Gauge, 
  CheckCircle2,
  ChevronDown,
  Bot,
  Sliders,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (model: ModelConfig) => void;
  userRole?: "customer" | "agent" | "admin" | string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ModelSelector({
  selectedModelId,
  onSelectModel,
  userRole = "customer",
  disabled = false,
  className = "",
  label = "AI Model Selection for Strategy & Content Generation"
}: ModelSelectorProps) {
  const currentModel = SUPPORTED_MODELS.find(m => m.id === selectedModelId) || SUPPORTED_MODELS[0];
  const userAllowedModels = getModelsForRole(userRole);
  const roleMetadata = getRoleMetadataLabel(userRole);
  const capabilities = getKimiCapabilitiesSummary(userRole);

  const isKimiModel = (modelId: string) => modelId.toLowerCase().includes("moonshot") || modelId.toLowerCase().includes("kimi");

  const getBadgeStyle = (badge: string, provider: string) => {
    if (provider.toLowerCase().includes("kimi") || provider.toLowerCase().includes("moonshot")) {
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm shadow-cyan-500/20";
    }
    switch (badge) {
      case "Fastest":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Pro":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "Enterprise":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "High-Precision":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Standard":
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  return (
    <div className={cn("w-full space-y-4 font-sans text-slate-100", className)}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">{label}</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Active LLM:</span>
              <span className="font-bold text-indigo-400">{currentModel.name}</span>
              <span>({currentModel.provider})</span>
              {isKimiModel(currentModel.id) && (
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Kimi Engine Active
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Role & Access Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-indigo-300">
              Role: <span className="capitalize text-white">{userRole}</span> ({userAllowedModels.length} Authorized)
            </span>
          </div>
          {/* Subtle Role-Specific Metadata Label */}
          <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-900/50 px-2.5 py-0.5 rounded-md">
            {roleMetadata}
          </span>
        </div>
      </div>

      {/* Direct Native Dropdown Select Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="ai-model-select-direct" className="text-xs font-semibold text-slate-300 block">
            Choose Authorized AI Generation Engine:
          </label>

          {/* Role Access Capabilities summary tag */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            {capabilities.canManageConfig && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Sliders className="w-3 h-3" /> System Config
              </span>
            )}
            {capabilities.canViewSystemAnalytics && (
              <span className="flex items-center gap-1 text-blue-400">
                <BarChart3 className="w-3 h-3" /> Analytics
              </span>
            )}
            {capabilities.canViewTaskReporting && !capabilities.canViewSystemAnalytics && (
              <span className="flex items-center gap-1 text-indigo-400">
                <BarChart3 className="w-3 h-3" /> Task Reports
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <select
            id="ai-model-select-direct"
            value={selectedModelId}
            disabled={disabled}
            onChange={(e) => {
              const target = SUPPORTED_MODELS.find(m => m.id === e.target.value);
              if (target && isModelAllowedForRole(target.id, userRole)) {
                onSelectModel(target);
              }
            }}
            className="w-full appearance-none bg-slate-950 border border-slate-800 hover:border-indigo-500/50 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-100 font-semibold cursor-pointer focus:outline-none transition-all pr-10"
          >
            {SUPPORTED_MODELS.map((model) => {
              const isAllowed = isModelAllowedForRole(model.id, userRole);
              const isKimi = isKimiModel(model.id);
              const kimiTag = isKimi ? "✨ [Kimi LLM]" : "";

              return (
                <option 
                  key={model.id} 
                  value={model.id} 
                  disabled={!isAllowed}
                  className="bg-slate-900 text-slate-200 py-2"
                >
                  {kimiTag} {model.name} — [{model.badge}] ({model.provider}) {!isAllowed ? "🔒 (Role Restricted)" : ""}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 1-Click Interactive Visual Cards */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block">
          Or Select Directly via Model Cards:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUPPORTED_MODELS.map((model) => {
            const isAllowed = isModelAllowedForRole(model.id, userRole);
            const isSelected = model.id === selectedModelId;
            const isKimi = isKimiModel(model.id);

            return (
              <button
                key={model.id}
                type="button"
                disabled={disabled || !isAllowed}
                onClick={() => {
                  if (isAllowed && !disabled) {
                    onSelectModel(model);
                  }
                }}
                className={cn(
                  "text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-2.5 relative overflow-hidden",
                  isSelected
                    ? isKimi
                      ? "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/50"
                      : "bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/50"
                    : isAllowed
                    ? isKimi
                      ? "bg-slate-900/50 border-cyan-900/60 hover:border-cyan-500/50 hover:bg-slate-900/80 cursor-pointer"
                      : "bg-slate-900/40 border-slate-800/90 hover:border-indigo-500/40 hover:bg-slate-900/80 cursor-pointer"
                    : "bg-slate-950/50 border-slate-900 opacity-40 cursor-not-allowed"
                )}
              >
                {/* Active Indicator Top Glow */}
                {isSelected && (
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    isKimi ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
                  )} />
                )}

                {/* Card Title Row */}
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <h4 className={cn("font-bold text-xs leading-snug flex items-center gap-1", isSelected ? "text-white" : "text-slate-200")}>
                      {isKimi && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      {model.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">{model.provider}</span>
                  </div>

                  {isSelected ? (
                    <span className={cn("p-0.5 rounded-full text-white shrink-0 shadow", isKimi ? "bg-cyan-500" : "bg-indigo-500")}>
                      <CheckCircle2 className="w-4 h-4 text-white fill-current" />
                    </span>
                  ) : !isAllowed ? (
                    <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 text-[10px] font-bold flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  ) : null}
                </div>

                {/* Badge Tag */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn("text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border inline-block", getBadgeStyle(model.badge, model.provider))}>
                    {model.badge}
                  </span>

                  {isKimi && (
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                      <Bot className="w-2.5 h-2.5 text-cyan-400" /> Kimi AI
                    </span>
                  )}
                </div>

                {/* Description Snippet */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>

                {/* Performance Metrics Footer */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{model.performanceProfile.latencyMs}ms</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Gauge className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>{model.performanceProfile.tokensPerSecond} t/s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
                    <span>{(model.performanceProfile.contextWindow / 1024).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-400">{model.performanceProfile.accuracyRating}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
