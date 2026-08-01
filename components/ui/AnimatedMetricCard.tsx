"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: "teal" | "violet" | "cyan" | "amber" | "rose" | "emerald";
  className?: string;
}

const colorMap = {
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-400",
    glow: "shadow-[0_0_20px_rgba(20,184,166,0.15)]",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export function AnimatedMetricCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  accentColor = "teal",
  className,
}: AnimatedMetricCardProps) {
  const styles = colorMap[accentColor] || colorMap.teal;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "p-5 rounded-2xl bg-slate-900/80 border backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300",
        styles.border,
        styles.glow,
        "hover:border-white/20 hover:bg-slate-900/95",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", styles.bg, styles.border)}>
          <Icon className={cn("h-4 w-4", styles.text)} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border",
              isPositive
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-400" />
            )}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
    </motion.div>
  );
}
