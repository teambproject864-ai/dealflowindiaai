"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Zap,
  Activity
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { APIKeyProvider } from "@/lib/customer-api-keys";

export interface CustomerKeyItem {
  id: string;
  provider: APIKeyProvider;
  label: string;
  maskedKey: string;
  status: "active" | "inactive";
  usageTokens: number;
  requestCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

export function APIKeyManagementModule() {
  const [keys, setKeys] = useState<CustomerKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<APIKeyProvider>("openai");
  const [label, setLabel] = useState("");
  const [rawKey, setRawKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/customer/api-keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/customer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label: label || `${provider.toUpperCase()} Key`,
          rawKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("API Key validated, encrypted, and saved successfully.");
        setRawKey("");
        setLabel("");
        setShowAddForm(false);
        fetchKeys();
      } else {
        setErrorMessage(data.error || "Failed to save API key");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error saving API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this saved API key?")) return;
    try {
      const res = await fetch(`/api/customer/api-keys?keyId=${keyId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("API Key deleted successfully.");
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  };

  const handleToggleStatus = async (keyId: string, currentStatus: "active" | "inactive") => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch("/api/customer/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to update key status:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> AES-256 Encrypted Credential Vault
            </span>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
              <Key className="h-5 w-5 text-emerald-400" /> Customer API Key Management
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure and manage your custom model API credentials for automated content generation and AI tasks.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <Plus className="h-4 w-4" /> {showAddForm ? "Close Form" : "Add API Key"}
          </button>
        </div>
      </GlassPanel>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 font-bold">Dismiss</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 font-bold">Dismiss</button>
        </div>
      )}

      {/* Add New Key Form */}
      {showAddForm && (
        <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/30 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" /> Register & Encrypt New API Credential
          </h4>

          <form onSubmit={handleAddKey} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">AI Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as APIKeyProvider)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                >
                  <option value="openai">OpenAI (sk-...)</option>
                  <option value="anthropic">Anthropic (sk-ant-...)</option>
                  <option value="huggingface">Hugging Face (hf_...)</option>
                  <option value="billionmail">Billionmail (bm_... / API Key)</option>
                  <option value="scrapegraph">ScrapeGraphAI (sgai-... / API Key)</option>
                  <option value="pinecone">Pinecone Vector DB</option>
                  <option value="custom">Custom / Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Key Label / Identifier</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Production OpenAI Tier-1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Secret API Key String</label>
              <input
                type="password"
                value={rawKey}
                onChange={(e) => setRawKey(e.target.value)}
                placeholder="sk-..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Your key is instantly encrypted using AES-256 before storage and is never stored or exposed in plaintext.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Validate & Encrypt Key
              </button>
            </div>
          </form>
        </GlassPanel>
      )}

      {/* Saved Keys List */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/20 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" /> Saved Credentials ({keys.length})
        </h4>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <Key className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No API keys saved yet. Add your credentials above to enable custom generation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{k.label}</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">
                      {k.provider}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(k.id, k.status)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors ${
                        k.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {k.status}
                    </button>
                  </div>
                  <p className="font-mono text-slate-400 text-[11px]">{k.maskedKey}</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    <div>Tokens used: <span className="text-slate-300 font-bold">{k.usageTokens.toLocaleString()}</span></div>
                    <div>Requests: <span className="text-slate-300 font-bold">{k.requestCount}</span></div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors"
                    title="Delete API key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
