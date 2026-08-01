"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Plus,
  CheckCircle2,
  Sparkles,
  Zap,
  Share2,
  Settings2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkflowNode {
  id: string;
  title: string;
  type: "trigger" | "ai_transform" | "compliance_check" | "channel_publish";
  status: "idle" | "running" | "completed" | "error";
  description: string;
  tacticCategory?: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

interface WorkflowNodeCanvasProps {
  initialNodes?: WorkflowNode[];
  onExecuteWorkflow?: (nodes: WorkflowNode[]) => void;
}

const DEFAULT_NODES: WorkflowNode[] = [
  {
    id: "node-trigger-1",
    title: "GTM Event Trigger",
    type: "trigger",
    status: "completed",
    description: "Triggers when a new customer ICP segment is updated",
    config: { event: "icp_update" },
    x: 40,
    y: 80,
  },
  {
    id: "node-transform-1",
    title: "Kimi AI Content Repurposer",
    type: "ai_transform",
    status: "idle",
    description: "Generates multi-channel copy (LinkedIn, Email, SEO Page)",
    tacticCategory: "AI Repurposing",
    config: { model: "moonshot-v1-8k", tone: "authoritative" },
    x: 340,
    y: 80,
  },
  {
    id: "node-compliance-1",
    title: "SOC 2 & Brand Compliance Check",
    type: "compliance_check",
    status: "idle",
    description: "Validates claim accuracy, legal disclaimers, and PII masking",
    config: { piiMasking: true, legalCheck: true },
    x: 640,
    y: 80,
  },
  {
    id: "node-publish-1",
    title: "Multi-Channel Publisher Node",
    type: "channel_publish",
    status: "idle",
    description: "Distributes finalized assets to WordPress, LinkedIn & HubSpot",
    config: { platforms: ["WordPress", "LinkedIn", "HubSpot"] },
    x: 940,
    y: 80,
  },
];

export default function WorkflowNodeCanvas({
  initialNodes = DEFAULT_NODES,
  onExecuteWorkflow,
}: WorkflowNodeCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[1]?.id || null);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    // Simulate step-by-step node execution animation
    for (let i = 0; i < nodes.length; i++) {
      const nodeId = nodes[i].id;
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: "running" } : n))
      );
      await new Promise((res) => setTimeout(res, 800));
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: "completed" } : n))
      );
    }
    setIsRunning(false);
    if (onExecuteWorkflow) onExecuteWorkflow(nodes);
  };

  const handleAddNode = (type: WorkflowNode["type"]) => {
    const newId = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newId,
      title: type === "ai_transform" ? "AI Copywriter Node" : "Publishing Action Node",
      type,
      status: "idle",
      description: "Custom workflow step configured via n8n DAG builder",
      config: {},
      x: 340 + nodes.length * 60,
      y: 180,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const nodeTypeStyles = {
    trigger: { bg: "bg-teal-500/10 border-teal-500/30 text-teal-300", icon: Zap, badge: "TRIGGER" },
    ai_transform: { bg: "bg-violet-500/10 border-violet-500/30 text-violet-300", icon: Sparkles, badge: "TRANSFORM" },
    compliance_check: { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300", icon: ShieldCheck, badge: "VERIFY" },
    channel_publish: { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300", icon: Share2, badge: "OUTPUT" },
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* ── Top Canvas Action Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-400/30">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">n8n Content Tactics DAG Studio</h3>
            <p className="text-xs text-slate-400">Node-based multi-channel automation & content transformation graph</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddNode("ai_transform")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-teal-400" />
            <span>Add AI Node</span>
          </button>

          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs text-white shadow-lg transition-all",
              "bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isRunning ? (
              <>
                <Zap className="h-4 w-4 animate-bounce text-amber-300" />
                <span>Executing Graph...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Interactive DAG Grid View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Node Flow Workspace (2 Cols) */}
        <div className="lg:col-span-2 relative min-h-[420px] p-6 rounded-3xl bg-slate-950/70 border border-white/8 backdrop-blur-2xl overflow-x-auto shadow-2xl flex flex-col justify-between">
          {/* Subtle Grid Canvas */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-widest pb-2 border-b border-white/5">
              <span>Pipeline Workflow Sequence</span>
              <span>{nodes.length} Nodes Configured</span>
            </div>

            {/* Render Horizontal DAG Flow Chain */}
            <div className="flex items-center gap-4 overflow-x-auto py-6 px-2">
              {nodes.map((node, index) => {
                const style = nodeTypeStyles[node.type];
                const Icon = style.icon;
                const isSelected = node.id === selectedNodeId;

                return (
                  <div key={node.id} className="flex items-center gap-3 shrink-0">
                    <motion.div
                      onClick={() => setSelectedNodeId(node.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative w-64 p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-200",
                        style.bg,
                        isSelected
                          ? "ring-2 ring-teal-400 border-teal-400/60 shadow-[0_0_25px_rgba(20,184,166,0.25)]"
                          : "hover:border-white/20"
                      )}
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10">
                          {style.badge}
                        </span>
                        {node.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        {node.status === "running" && (
                          <Zap className="h-4 w-4 text-amber-400 animate-spin" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 shrink-0" />
                        <h4 className="text-sm font-bold text-white truncate">{node.title}</h4>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {node.description}
                      </p>
                    </motion.div>

                    {/* Connecting Connector Arrow */}
                    {index < nodes.length - 1 && (
                      <div className="flex items-center justify-center text-slate-600">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-white/5">
            <span>Status: {isRunning ? "Workflow executing..." : "Ready for execution"}</span>
            <span>n8n Protocol Standard Engine v2.4</span>
          </div>
        </div>

        {/* Selected Node Configuration Inspector Panel (1 Col) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col">
          {selectedNode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedNode.title}</h4>
                  <p className="text-xs text-slate-400">Node Inspector Parameters</p>
                </div>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  title="Remove Node"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Node Title
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) => (n.id === selectedNode.id ? { ...n, title: val } : n))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={selectedNode.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) => (n.id === selectedNode.id ? { ...n, description: val } : n))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Node Execution Status
                  </label>
                  <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        selectedNode.status === "completed"
                          ? "bg-emerald-400"
                          : selectedNode.status === "running"
                          ? "bg-amber-400 animate-ping"
                          : "bg-slate-500"
                      )}
                    />
                    <span className="capitalize">{selectedNode.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Settings2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">Select any node on the graph to inspect and configure parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
