"use client";

import React, { useState } from "react";
import { Maximize2, Minimize2, ChevronDown, ChevronUp, X, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  id: string;
  title: string;
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export function DashboardWidget({
  id,
  title,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  children,
  className,
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "df-widget group/widget flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl overflow-hidden",
        isLarge ? "col-span-full md:col-span-2" : "col-span-1",
        isCollapsed ? "h-auto" : "h-[360px]",
        className
      )}
    >
      {/* Widget Header */}
      <div className="df-widget-header bg-slate-950/60 backdrop-blur-md flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-slate-500 cursor-grab hover:text-teal-400 active:cursor-grabbing">
            <Move className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 tracking-wide select-none">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Size Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsLarge(!isLarge)}
              className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
              title={isLarge ? "Shrink width" : "Expand width"}
            >
              {isLarge ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Close/Remove Button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
              title="Remove Widget"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="df-widget-content custom-scrollbar flex-1 p-4 overflow-y-auto text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
}
