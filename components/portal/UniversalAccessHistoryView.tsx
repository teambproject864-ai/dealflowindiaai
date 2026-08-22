// components/portal/UniversalAccessHistoryView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  MessageSquare, 
  PhoneCall, 
  DollarSign, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function UniversalAccessHistoryView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState<"admin" | "agent" | "customer">("admin");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = `/api/history/universal?role=${selectedRole}&category=${selectedCategory}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedRole, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleExport = (format: "csv" | "json") => {
    const exportUrl = `/api/history/export?role=${selectedRole}&category=${selectedCategory}&format=${format}&q=${encodeURIComponent(searchQuery)}`;
    window.open(exportUrl, "_blank");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "whatsapp_openwa":
      case "whatsapp_evolution":
        return <MessageSquare className="h-4 w-4 text-[#25D366]" />;
      case "call_bot":
        return <PhoneCall className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />;
      case "deal_transaction":
        return <DollarSign className="h-4 w-4 text-amber-500" />;
      case "agent_action":
        return <Bot className="h-4 w-4 text-purple-500" />;
      case "security_audit":
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#121218] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#110F24] dark:text-white">
                Universal Access History
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
                Multi-channel interaction audits, deal transactions & communication logs with RBAC
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* RBAC Role Selector */}
          <div className="flex items-center rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] p-1 text-xs font-semibold">
            <span className="px-2 text-[#86868B] text-[11px]">Role:</span>
            {(["admin", "agent", "customer"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  selectedRole === role
                    ? "bg-[#0071E3] text-white shadow-sm"
                    : "text-[#86868B] hover:text-[#110F24] dark:hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="text-xs flex items-center gap-1.5 h-8.5 rounded-xl border-black/[0.08] dark:border-white/[0.12]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="text-xs flex items-center gap-1.5 h-8.5 rounded-xl border-black/[0.08] dark:border-white/[0.12]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, actor, hash, entity ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121218] border border-black/[0.08] dark:border-white/[0.1] text-[#110F24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          />
        </form>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Events" },
            { id: "whatsapp_openwa", label: "OpenWA" },
            { id: "whatsapp_evolution", label: "Evolution API" },
            { id: "call_bot", label: "Call Bot" },
            { id: "deal_transaction", label: "Deals" },
            { id: "security_audit", label: "Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? "bg-[#0071E3]/10 border-[#0071E3]/30 text-[#0071E3] dark:text-[#2997FF]"
                  : "bg-white dark:bg-[#121218] border-black/[0.06] dark:border-white/[0.08] text-[#86868B] hover:text-[#110F24] dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items Table / List */}
      <div className="rounded-2xl bg-white dark:bg-[#121218] border border-black/[0.08] dark:border-white/[0.1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#86868B]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3] mb-2" />
            <span className="text-xs">Loading universal history audit records...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-[#86868B]">
            <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No history records match the current filter or search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex items-start justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05] shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#110F24] dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[#86868B] uppercase">
                        {item.category.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#34C759] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#86868B]">
                      <span>Actor: <strong className="text-[#110F24] dark:text-white font-medium">{item.actorName}</strong> ({item.actorRole})</span>
                      <span>•</span>
                      <span>Org: <strong className="text-[#110F24] dark:text-white font-medium">{item.organizationName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#86868B] group-hover:translate-x-0.5 transition-transform shrink-0 mt-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#101016] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                {getCategoryIcon(selectedItem.category)}
                <h3 className="text-sm font-bold text-[#110F24] dark:text-white">
                  Audit Record Details
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#86868B]">Title:</span>
                <p className="font-semibold text-[#110F24] dark:text-white mt-0.5">{selectedItem.title}</p>
              </div>
              <div>
                <span className="text-[#86868B]">Description:</span>
                <p className="text-[#110F24] dark:text-white mt-0.5">{selectedItem.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <span className="text-[#86868B]">Actor:</span>
                  <p className="font-medium text-[#110F24] dark:text-white">{selectedItem.actorName} ({selectedItem.actorRole})</p>
                </div>
                <div>
                  <span className="text-[#86868B]">Organization:</span>
                  <p className="font-medium text-[#110F24] dark:text-white">{selectedItem.organizationName}</p>
                </div>
                <div>
                  <span className="text-[#86868B]">Target Entity ID:</span>
                  <p className="font-mono text-[#0071E3] dark:text-[#2997FF]">{selectedItem.targetEntityId || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[#86868B]">Timestamp:</span>
                  <p className="font-mono text-[#110F24] dark:text-white">{new Date(selectedItem.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-[#86868B]">SHA-256 Compliance Hash:</span>
                <p className="font-mono text-[10px] break-all bg-black/[0.03] dark:bg-white/[0.05] p-2 rounded-lg mt-0.5 text-[#110F24] dark:text-white">
                  {selectedItem.complianceHash}
                </p>
              </div>

              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div>
                  <span className="text-[#86868B]">Metadata:</span>
                  <pre className="font-mono text-[10px] bg-black/[0.03] dark:bg-white/[0.05] p-2 rounded-lg mt-0.5 overflow-x-auto text-[#110F24] dark:text-white">
                    {JSON.stringify(selectedItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
