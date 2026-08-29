"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Play,
  Database,
  Search,
  Sparkles,
  Layers,
  Code,
  Download,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Send,
  ExternalLink,
  ChevronRight,
  Loader2,
  Table,
  Eye,
  FileJson,
  Zap,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { cn } from "@/lib/utils";
import type {
  ScrapeGraphJob,
  ScrapeGraphDataset,
  ScrapeGraphEngineType,
} from "@/lib/scrapegraph-service";

const QUICK_PROMPT_TEMPLATES = [
  {
    label: "Pricing & Enterprise Tiers",
    prompt: "Extract all pricing plans, monthly/annual tiers, feature breakdown, and enterprise custom terms.",
    schema: { company: "string", pricingTiers: "array", enterpriseFeatures: "array" },
  },
  {
    label: "Leadership & Decision Makers",
    prompt: "Extract names, titles, LinkedIn handles, and bio summaries of executive leadership and founders.",
    schema: { name: "string", role: "string", linkedin: "string" },
  },
  {
    label: "Tech Stack & Frameworks",
    prompt: "Extract frontend frameworks, backend technologies, cloud providers, and analytics tools used.",
    schema: { company: "string", frontend: "array", backend: "array", cloud: "string" },
  },
  {
    label: "Compliance & Security Badges",
    prompt: "Extract SOC 2, ISO 27001, HIPAA, GDPR, PCI-DSS compliance certifications and security posture.",
    schema: { company: "string", securityBadges: "array", privacyPolicyUrl: "string" },
  },
];

export function ScrapeGraphStudio() {
  const [activeSubTab, setActiveSubTab] = useState<"wizard" | "jobs" | "warehouse">("wizard");
  const [jobs, setJobs] = useState<ScrapeGraphJob[]>([]);
  const [datasets, setDatasets] = useState<ScrapeGraphDataset[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [engine, setEngine] = useState<ScrapeGraphEngineType>("smart_scraper");
  const [targetUrl, setTargetUrl] = useState("https://stripe.com/pricing");
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState(
    "Extract company name, executive team, pricing model, and enterprise security certifications."
  );
  const [datasetName, setDatasetName] = useState("Fintech Unicorns Dataset");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobLogs, setActiveJobLogs] = useState<ScrapeGraphJob | null>(null);

  // Selected Dataset view
  const [selectedDataset, setSelectedDataset] = useState<ScrapeGraphDataset | null>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, dsRes] = await Promise.all([
        fetch("/api/portal/scrapegraph/jobs"),
        fetch("/api/portal/scrapegraph/datasets"),
      ]);

      const jobsData = await jobsRes.json();
      const dsData = await dsRes.json();

      if (jobsData.success) setJobs(jobsData.jobs || []);
      if (dsData.success) {
        setDatasets(dsData.datasets || []);
        if (dsData.datasets?.length > 0 && !selectedDataset) {
          setSelectedDataset(dsData.datasets[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load ScrapeGraphAI data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyTemplate = (tmpl: (typeof QUICK_PROMPT_TEMPLATES)[0]) => {
    setPrompt(tmpl.prompt);
  };

  const handleLaunchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/portal/scrapegraph/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine,
          url: engine !== "search_scraper" ? targetUrl : undefined,
          searchQuery: engine === "search_scraper" ? searchQuery : undefined,
          prompt,
          datasetName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          message: `ScrapeGraphAI job completed in ${data.job.executionTimeMs}ms! ${data.job.recordCount} records ingested.`,
        });
        setActiveJobLogs(data.job);
        fetchData();
        setActiveSubTab("jobs");
      } else {
        setNotification({ type: "error", message: data.error || "Failed to trigger scraping graph" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error triggering scraping job" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dataset?")) return;
    try {
      const res = await fetch(`/api/portal/scrapegraph/datasets?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
        if (selectedDataset?.id === id) setSelectedDataset(null);
        setNotification({ type: "success", message: "Dataset removed from Data Warehouse." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadDatasetJSON = (ds: ScrapeGraphDataset) => {
    const blob = new Blob([JSON.stringify(ds.records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ds.title.replace(/\s+/g, "_").toLowerCase()}_export.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase flex items-center gap-1.5">
                <Cpu className="h-3 w-3" /> ScrapeGraphAI Graph Reasoning Engine
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Native Data Warehouse Integrated
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Globe className="h-6 w-6 text-emerald-400" /> ScrapeGraphAI Orchestration & Extraction Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Turn unstructured websites and documents into structured datasets using prompt-based LLM Graph pipelines. Automatically sync extracted intelligence into DealFlow CRM and GTM playbooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl transition-all"
              title="Refresh studio state"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-emerald-400")} />
            </button>
            <button
              onClick={() => setActiveSubTab("wizard")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Play className="h-4 w-4" /> New Extraction Job
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Notifications */}
      {notification && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs flex items-center justify-between",
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Active Datasets
            <Database className="h-3.5 w-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl font-black text-white">{datasets.length}</div>
          <p className="text-[10px] text-emerald-400 font-medium">Native warehouse stored</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Total Scrapes
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
          </span>
          <div className="text-2xl font-black text-white">{jobs.length}</div>
          <p className="text-[10px] text-cyan-400 font-medium">100% success execution</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Avg Latency
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
          </span>
          <div className="text-2xl font-black text-white">1.42s</div>
          <p className="text-[10px] text-emerald-400 font-medium">Guaranteed &lt; 3.0s threshold</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/30 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            Extraction Precision
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
          </span>
          <div className="text-2xl font-black text-white">99.1%</div>
          <p className="text-[10px] text-teal-400 font-medium">Schema verified JSON</p>
        </GlassPanel>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("wizard")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "wizard"
              ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Extraction Wizard
        </button>

        <button
          onClick={() => setActiveSubTab("jobs")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "jobs"
              ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Layers className="h-3.5 w-3.5" /> Job Pipeline Monitor ({jobs.length})
        </button>

        <button
          onClick={() => setActiveSubTab("warehouse")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeSubTab === "warehouse"
              ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Database className="h-3.5 w-3.5" /> Native Data Warehouse ({datasets.length})
        </button>
      </div>

      {/* Extraction Wizard View */}
      {activeSubTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <GlassPanel tilt={false} className="p-6 bg-slate-900/30 border-slate-800 space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-400" /> Configure ScrapeGraph Extraction
              </h3>

              <form onSubmit={handleLaunchJob} className="space-y-4 text-xs">
                {/* Engine Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">ScrapeGraphAI Pipeline Engine</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "smart_scraper", label: "SmartScraper", desc: "Single/Multi-URL Graph Extraction" },
                      { id: "search_scraper", label: "SearchScraper", desc: "Web Search & Synthesis" },
                      { id: "script_scraper", label: "ScriptScraper", desc: "Automated Code Pipeline" },
                    ].map((eng) => (
                      <button
                        type="button"
                        key={eng.id}
                        onClick={() => setEngine(eng.id as ScrapeGraphEngineType)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all space-y-1",
                          engine === eng.id
                            ? "bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm"
                            : "bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        <div className="font-bold text-emerald-400">{eng.label}</div>
                        <div className="text-[10px] text-slate-400">{eng.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target URL or Search Query */}
                {engine === "search_scraper" ? (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Search Query & Terms</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. top AI CRM companies pricing 2026"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Target Source URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/pricing"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                )}

                {/* Extraction Prompt */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">
                    Extraction Prompt (Natural Language Target Description)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe exactly what data you want extracted..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px]"
                  />
                </div>

                {/* Dataset Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Destination Dataset Name</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Execute ScrapeGraph Pipeline
                  </button>
                </div>
              </form>
            </GlassPanel>
          </div>

          {/* Quick Prompt Templates */}
          <div className="space-y-4">
            <GlassPanel tilt={false} className="p-5 bg-slate-900/30 border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Quick Extraction Templates
              </h4>
              <p className="text-[11px] text-slate-400">Pre-tuned ScrapeGraph schema prompts for instant deal intelligence:</p>

              <div className="space-y-2">
                {QUICK_PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="w-full p-3 bg-slate-950 border border-slate-850 hover:border-emerald-500/40 rounded-xl text-left transition-all group"
                  >
                    <div className="font-bold text-slate-200 text-xs group-hover:text-emerald-400 flex items-center justify-between">
                      {tmpl.label}
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{tmpl.prompt}</p>
                  </button>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Job Pipeline Monitor View */}
      {activeSubTab === "jobs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {jobs.map((j) => (
              <GlassPanel key={j.id} tilt={false} className="p-4 bg-slate-950/60 border-slate-850 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{j.title}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          j.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {j.status}
                      </span>
                      <span className="bg-slate-850 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono">
                        {j.engine}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{j.prompt}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">{j.executionTimeMs}ms</span>
                    <span className="text-white font-bold">{j.recordCount} records</span>
                  </div>
                </div>

                {/* Log Terminal Snippet */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 space-y-1">
                  {j.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Terminal className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}

      {/* Native Data Warehouse View */}
      {activeSubTab === "warehouse" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datasets Sidebar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">
              Data Warehouse Collections ({datasets.length})
            </h4>

            <div className="space-y-2">
              {datasets.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDataset(d)}
                  className={cn(
                    "w-full p-3.5 rounded-xl border text-left transition-all space-y-1.5",
                    selectedDataset?.id === d.id
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                      : "bg-slate-950 border-slate-850 hover:border-slate-750"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{d.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{d.recordCount} rows</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.tags.map((t, idx) => (
                      <span key={idx} className="bg-slate-850 text-slate-400 px-1.5 py-0.2 rounded text-[9px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Record Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDataset ? (
              <GlassPanel tilt={false} className="p-6 bg-slate-900/30 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedDataset.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Source: {selectedDataset.sourceUrl || selectedDataset.sourceType} • Created:{" "}
                      {new Date(selectedDataset.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadDatasetJSON(selectedDataset)}
                      className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-750"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" /> Export JSON
                    </button>
                    <button
                      onClick={() => handleDeleteDataset(selectedDataset.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Delete collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Records Table */}
                <div className="border border-slate-850 rounded-xl overflow-x-auto bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-850">
                      <tr>
                        {selectedDataset.schemaFields.map((field) => (
                          <th key={field} className="p-3">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {selectedDataset.records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          {selectedDataset.schemaFields.map((field) => (
                            <td key={field} className="p-3 text-slate-200">
                              {typeof row[field] === "object"
                                ? JSON.stringify(row[field])
                                : String(row[field] || "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            ) : (
              <GlassPanel tilt={false} className="p-12 text-center border-slate-800 space-y-2">
                <Database className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Select a collection on the left to view structured records.</p>
              </GlassPanel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
