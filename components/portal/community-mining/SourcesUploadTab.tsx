// components/portal/community-mining/SourcesUploadTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Database,
  Radio,
  FileCode,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CMSource } from "@/types/community-mining";

export function SourcesUploadTab() {
  const [sources, setSources] = useState<CMSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // File Upload States
  const [file, setFile] = useState<File | null>(null);
  const [sourceId, setSourceId] = useState("csv_manual_upload");
  const [autoProcess, setAutoProcess] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    received?: number;
    ingested?: number;
    deduped?: number;
    processed?: number;
    error?: string;
  } | null>(null);

  // Add Source Modal State
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<any>("support");
  const [isAddingSource, setIsAddingSource] = useState(false);

  const fetchSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await fetch("/api/community-mining/sources");
      const data = await res.json();
      if (data.success) {
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceId", sourceId);
      formData.append("autoProcess", autoProcess ? "true" : "false");

      const res = await fetch("/api/community-mining/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadResult({
          success: true,
          received: data.received,
          ingested: data.ingested,
          deduped: data.deduped,
          processed: data.processed,
        });
        setFile(null);
        await fetchSources();
      } else {
        setUploadResult({ success: false, error: data.error || "Upload failed" });
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err?.message || "Upload error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName) return;

    setIsAddingSource(true);
    try {
      const res = await fetch("/api/community-mining/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSourceName,
          type: newSourceType,
          status: "active",
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchSources();
        setShowAddSourceModal(false);
        setNewSourceName("");
      }
    } catch (err) {
      console.error("Failed to add source:", err);
    } finally {
      setIsAddingSource(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 2 Column Layout: Sources Grid & Manual Upload Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Registered Data Sources */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-400" /> Registered Ingestion Sources
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Continuous ingestion channels connected to DealFlow AI.</p>
            </div>
            <ExtrudedButton
              onClick={() => setShowAddSourceModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Source
            </ExtrudedButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sources.map((source) => (
              <GlassPanel key={source.id} tilt={false} className="border-slate-850 bg-slate-900/30 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-white">{source.name}</span>
                  </div>
                  <span className="bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {source.type}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <p><span className="text-slate-500">Item Count:</span> <strong className="text-white">{source.itemCount || 0}</strong></p>
                  <p><span className="text-slate-500">Last Synced:</span> {source.lastSyncedAt || "Never"}</p>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Manual CSV/JSON Backfill Upload */}
        <div className="space-y-4">
          <GlassPanel tilt={false} className="border-slate-850 bg-slate-900/30 p-6 rounded-2xl space-y-5">
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" /> Manual CSV / JSON Upload
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Upload historical feedback exports for one-off backfilling and instant LLM processing.
              </p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-300">Target Ingestion Source</Label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
                >
                  <option value="csv_manual_upload">Manual CSV Upload</option>
                  <option value="src_support_zendesk">Customer Support (Zendesk)</option>
                  <option value="src_g2_capterra_reviews">G2 / Capterra Reviews</option>
                  <option value="src_discord_community">Community Feedback</option>
                </select>
              </div>

              {/* Drag & Drop File Input Area */}
              <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/60 rounded-2xl p-6 text-center space-y-2 bg-slate-950/60 transition-colors">
                <FileText className="h-8 w-8 text-violet-400 mx-auto" />
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="community-mining-file-input"
                />
                <label
                  htmlFor="community-mining-file-input"
                  className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer block"
                >
                  {file ? file.name : "Select CSV or JSON file to upload"}
                </label>
                <p className="text-[10px] text-slate-500 font-mono">Supports columns: feedback, author, tier, date</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-process-check"
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-0"
                />
                <label htmlFor="auto-process-check" className="text-slate-300 text-xs cursor-pointer">
                  Auto-process items with LLM immediately
                </label>
              </div>

              <ExtrudedButton
                type="submit"
                disabled={!file || isUploading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-violet-500/20"
              >
                {isUploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin inline mr-1.5" /> Ingesting & Processing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 inline mr-1.5" /> Ingest File</>
                )}
              </ExtrudedButton>
            </form>

            {/* Upload Result Report */}
            {uploadResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
                uploadResult.success ? "bg-emerald-950/30 border-emerald-850/60 text-emerald-200" : "bg-red-950/30 border-red-850/60 text-red-200"
              }`}>
                {uploadResult.success ? (
                  <>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Ingestion Successful
                    </div>
                    <p>• Received: {uploadResult.received} rows</p>
                    <p>• Newly Ingested: {uploadResult.ingested} items</p>
                    <p>• Deduped: {uploadResult.deduped} items</p>
                    <p>• LLM Processed: {uploadResult.processed} insights</p>
                  </>
                ) : (
                  <div className="flex items-start gap-1.5 text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Error: {uploadResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </GlassPanel>
        </div>

      </div>

      {/* Add Source Modal */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Register New Source</h4>
              <button onClick={() => setShowAddSourceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-300">Source Name</Label>
                <Input
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. In-App Feedback Widget"
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-300">Source Type</Label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200"
                >
                  <option value="support">Support Tickets (Webhook)</option>
                  <option value="community">Community / Chat</option>
                  <option value="review">Reviews (G2 / Capterra)</option>
                  <option value="survey">Free-Text Survey</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <ExtrudedButton
                  type="submit"
                  disabled={isAddingSource}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 px-5 rounded-xl"
                >
                  {isAddingSource ? "Registering..." : "Register Source"}
                </ExtrudedButton>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
