// components/portal/DashboardWidget.tsx
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
        "df-widget group/widget flex flex-col rounded-3xl apple-glass-card transition-all duration-300 overflow-hidden shadow-sm",
        isLarge ? "col-span-full md:col-span-2" : "col-span-1",
        isCollapsed ? "h-auto" : "h-[360px]",
        className
      )}
    >
      {/* Widget Header */}
      <div className="df-widget-header bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] px-4.5 py-3">
        <div className="flex items-center gap-2">
          <div className="text-[#86868B] cursor-grab hover:text-[#0071E3] active:cursor-grabbing">
            <Move className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight select-none">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
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
              className="p-1 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
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
              className="p-1 rounded-full hover:bg-[#FF3B30]/10 text-[#86868B] hover:text-[#FF3B30] transition-colors"
              title="Remove Widget"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="df-widget-content flex-1 p-4 overflow-y-auto text-[#1D1D1F] dark:text-[#F5F5F7]">
          {children}
        </div>
      )}
    </div>
  );
}
