// components/portal/IconBadge.tsx
"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconBadgeProps {
  icon: LucideIcon;
  variant?: "emerald" | "teal" | "cyan" | "violet" | "amber" | "rose" | "indigo" | "gold" | "sky";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
  pulse?: boolean;
}

const VARIANT_STYLES: Record<string, { bg: string; border: string; iconColor: string; shadow: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    shadow: "shadow-emerald-500/10",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    iconColor: "text-teal-350",
    shadow: "shadow-teal-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    shadow: "shadow-cyan-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
    shadow: "shadow-violet-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    shadow: "shadow-amber-500/10",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
    shadow: "shadow-rose-500/10",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    iconColor: "text-indigo-400",
    shadow: "shadow-indigo-500/10",
  },
  gold: {
    bg: "bg-amber-400/10",
    border: "border-amber-400/40",
    iconColor: "text-amber-300",
    shadow: "shadow-amber-400/20",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    iconColor: "text-sky-400",
    shadow: "shadow-sky-500/10",
  },
};

const SIZE_STYLES: Record<string, { container: string; icon: string }> = {
  sm: { container: "w-7 h-7 rounded-lg", icon: "w-3.5 h-3.5" },
  md: { container: "w-9 h-9 rounded-xl", icon: "w-4 h-4" },
  lg: { container: "w-11 h-11 rounded-2xl", icon: "w-5 h-5" },
  xl: { container: "w-14 h-14 rounded-2xl", icon: "w-7 h-7" },
};

export function IconBadge({
  icon: Icon,
  variant = "emerald",
  size = "md",
  className,
  glow = true,
  pulse = false,
}: IconBadgeProps) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.emerald;
  const sz = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center border transition-all duration-300 group-hover:scale-105 shrink-0",
        style.bg,
        style.border,
        glow && `shadow-lg ${style.shadow}`,
        sz.container,
        className
      )}
    >
      <Icon className={cn(style.iconColor, sz.icon, pulse && "animate-pulse")} />
      {glow && (
        <span
          className={cn(
            "absolute inset-0 rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity blur-sm -z-10",
            style.bg
          )}
        />
      )}
    </div>
  );
}
