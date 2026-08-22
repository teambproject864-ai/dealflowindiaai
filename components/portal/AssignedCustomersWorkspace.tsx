// components/portal/AssignedCustomersWorkspace.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Users, 
  Building2, 
  Search, 
  ArrowUpRight, 
  Briefcase, 
  Target, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Filter,
  Activity,
  Layers,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { AgentWorkloadItem } from "@/app/api/portal/assigned-agents/route";

export interface AssignedCustomerItem {
  id: string;
  name: string;
  customerName?: string;
  companyName: string;
  email?: string;
  phone?: string;
  industry?: string;
  annualRevenue?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  status?: string;
  dealsCount?: number;
  totalDealValue?: number;
  activeCampaignsCount?: number;
  lastActivityDate?: string;
}

interface AssignedCustomersWorkspaceProps {
  customers: any[];
  currentAgent: { id?: string; name?: string; email?: string; role?: string } | null;
  onSelectCustomerContext?: (customer: any) => void;
  onNavigateTab?: (tabId: string) => void;
}

export function AssignedCustomersWorkspace({
  customers = [],
  currentAgent,
  onSelectCustomerContext,
  onNavigateTab
}: AssignedCustomersWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<"my-accounts" | "agent-allocations">("my-accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Agent Allocations State
  const [agentWorkloads, setAgentWorkloads] = useState<AgentWorkloadItem[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState("all");

  const fetchAgentWorkloads = useCallback(async () => {
    try {
      setLoadingAgents(true);
      const roleParam = currentAgent?.role || "agent";
      const res = await fetch(`/api/portal/assigned-agents?role=${roleParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAgentWorkloads(data.agents);
      }
    } catch (e) {
      console.warn("[AssignedCustomersWorkspace] Failed to fetch agent workloads:", e);
    } finally {
      setLoadingAgents(false);
    }
  }, [currentAgent]);

  useEffect(() => {
    if (activeSubTab === "agent-allocations") {
      fetchAgentWorkloads();
    }
  }, [activeSubTab, fetchAgentWorkloads]);

  // Filter only customers explicitly assigned to the current agent
  const assignedCustomers = useMemo(() => {
    if (!customers || customers.length === 0 || !currentAgent) return [];

    const agentId = currentAgent.id?.toLowerCase().trim();
    const agentEmail = currentAgent.email?.toLowerCase().trim();
    const agentName = currentAgent.name?.toLowerCase().trim();
    const agentKey = agentId?.replace(/^agent-/, "") || agentEmail?.split("@")[0];

    return customers.filter((c) => {
      if (!c) return false;

      // 1. Direct ID match
      if (c.assignedAgentId && agentId && c.assignedAgentId.toLowerCase() === agentId) return true;

      // 2. Direct Email match
      if (c.assignedAgentEmail && agentEmail && c.assignedAgentEmail.toLowerCase() === agentEmail) return true;

      // 3. Direct Key match
      if (c.assignedAgentKey && agentKey && (c.assignedAgentKey.toLowerCase() === agentKey || (agentId && c.assignedAgentKey.toLowerCase() === agentId))) return true;

      // 4. Direct Name match
      if (c.assignedAgentName && agentName && c.assignedAgentName.toLowerCase() === agentName) return true;

      // 5. Nested assignedAgent object match
      if (c.assignedAgent) {
        const nestedId = (c.assignedAgent.agentId || c.assignedAgent.id)?.toLowerCase();
        const nestedEmail = c.assignedAgent.email?.toLowerCase();
        const nestedName = c.assignedAgent.name?.toLowerCase();
        if (nestedId && agentId && nestedId === agentId) return true;
        if (nestedEmail && agentEmail && nestedEmail === agentEmail) return true;
        if (nestedName && agentName && nestedName === agentName) return true;
      }

      // Strict RBAC: If no explicit assignment matches the current agent, do not display
      return false;
    });
  }, [customers, currentAgent]);

  // Search and status filtering
  const filteredList = useMemo(() => {
    return assignedCustomers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const name = (c.name || c.customerName || "").toLowerCase();
      const comp = (c.companyName || c.companyInformation?.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const ind = (c.industry || c.companyInformation?.industry || "").toLowerCase();

      const matchesQuery = !q || name.includes(q) || comp.includes(q) || email.includes(q) || ind.includes(q);
      const matchesStatus = statusFilter === "all" || (c.status || "active") === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [assignedCustomers, searchQuery, statusFilter]);

  // Filtered Agent Workloads
  const filteredAgents = useMemo(() => {
    return agentWorkloads.filter(ag => {
      const q = agentSearch.toLowerCase().trim();
      const matchesQuery = !q || 
        ag.name.toLowerCase().includes(q) || 
        ag.email.toLowerCase().includes(q) || 
        (ag.phoneNumber && ag.phoneNumber.includes(q)) || 
        ag.assignedCustomers.some(c => c.companyName.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
      const matchesStatus = workloadFilter === "all" || ag.workloadStatus === workloadFilter;
      return matchesQuery && matchesStatus;
    });
  }, [agentWorkloads, agentSearch, workloadFilter]);

  const totalAssigned = assignedCustomers.length;
  const activePipelines = assignedCustomers.reduce((sum, c) => sum + (c.dealsCount || 1), 0);

  const getWorkloadBadge = (status: AgentWorkloadItem["workloadStatus"]) => {
    switch (status) {
      case "available":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">AVAILABLE (0-2 Accounts)</span>;
      case "optimal":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">OPTIMAL (3-6 Accounts)</span>;
      case "heavy":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">HEAVY LOAD (7-9 Accounts)</span>;
      case "at_capacity":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">AT CAPACITY (10+ Accounts)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400">ACTIVE</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-violet-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold bg-indigo-950/60 border border-indigo-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Agent Access Control
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Assigned to: {currentAgent?.name || "Revenue Specialist"}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <Users className="h-6 w-6 text-indigo-400" /> Assigned Customer Accounts
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Access and manage your assigned customer portfolio and view active handling agents across the team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">My Assigned</span>
              <span className="text-lg font-bold text-white font-mono">{totalAssigned}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Handling Agents</span>
              <span className="text-lg font-bold text-indigo-400 font-mono">{agentWorkloads.length || 4}</span>
            </div>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveSubTab("my-accounts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "my-accounts"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>My Assigned Accounts ({totalAssigned})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("agent-allocations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "agent-allocations"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Handling Agents &amp; Allocations ({agentWorkloads.length || 4})</span>
          </button>
        </div>
      </GlassPanel>

      {/* VIEW 1: MY ASSIGNED CUSTOMER ACCOUNTS */}
      {activeSubTab === "my-accounts" && (
        <div className="space-y-4">
          {/* Filter and View Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assigned accounts by name, company, or industry..."
                className="bg-slate-950 border-slate-800 text-xs pl-9 h-9 rounded-xl focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="onboarding">Onboarding</option>
                <option value="review">Under Review</option>
              </select>

              <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    viewMode === "grid" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    viewMode === "table" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

      {/* Main Content Area */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
          <Users className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Assigned Customer Accounts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No accounts match "${searchQuery}".` : "You currently have no customer accounts assigned. Check with your administrator to receive account delegations."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((cust) => {
            const companyName = cust.companyName || cust.companyInformation?.name || "Independent Account";
            const contactName = cust.name || cust.customerName || "Primary Contact";
            const industry = cust.industry || cust.companyInformation?.industry || "B2B SaaS";

            return (
              <GlassPanel
                key={cust.id}
                tilt={false}
                className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                      {cust.status || "Active"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-white text-base leading-tight truncate">{companyName}</h4>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">{contactName}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">{industry}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-900">
                    {cust.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-slate-900">
                  <button
                    onClick={() => {
                      if (onSelectCustomerContext) onSelectCustomerContext(cust);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Set Active Workspace Context</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        if (onSelectCustomerContext) onSelectCustomerContext(cust);
                        if (onNavigateTab) onNavigateTab("icp-details");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1"
                      title="View ICP Breakdown"
                    >
                      <Target className="h-3 w-3 text-cyan-400" /> ICP
                    </button>

                    <button
                      onClick={() => {
                        if (onSelectCustomerContext) onSelectCustomerContext(cust);
                        if (onNavigateTab) onNavigateTab("content-hub");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1"
                      title="Open Content Studio"
                    >
                      <Sparkles className="h-3 w-3 text-violet-400" /> Content
                    </button>

                    <button
                      onClick={() => {
                        if (onSelectCustomerContext) onSelectCustomerContext(cust);
                        if (onNavigateTab) onNavigateTab("dealflow-crm");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1"
                      title="Open Dealflow CRM"
                    >
                      <Briefcase className="h-3 w-3 text-teal-400" /> Deals
                    </button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
                <tr>
                  <th className="p-3.5">Company Account</th>
                  <th className="p-3.5">Primary Contact</th>
                  <th className="p-3.5">Industry Vertical</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredList.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                        {(cust.companyName || cust.name || "C").charAt(0)}
                      </div>
                      <span>{cust.companyName || cust.name}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-200">{cust.name || cust.customerName}</p>
                      <p className="text-[10px] text-slate-500">{cust.email}</p>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{cust.industry || "B2B Tech"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-[10px] font-bold">
                        {cust.status || "Active"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          if (onSelectCustomerContext) onSelectCustomerContext(cust);
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        Set Context
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

  {/* VIEW 2: ALL HANDLING AGENTS & CUSTOMER ALLOCATIONS */}
  {activeSubTab === "agent-allocations" && (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Search & Workload Status Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-850">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="Search agents by name, email, phone, or assigned client..."
            className="bg-slate-950 border-slate-800 text-xs pl-9 h-9 rounded-xl focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Workload Levels</option>
            <option value="available">Available (0-2 Accounts)</option>
            <option value="optimal">Optimal (3-6 Accounts)</option>
            <option value="heavy">Heavy Load (7-9 Accounts)</option>
            <option value="at_capacity">At Capacity (10+ Accounts)</option>
          </select>

          <button
            type="button"
            onClick={fetchAgentWorkloads}
            disabled={loadingAgents}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh agent allocation roster"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAgents ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Agents Roster Cards */}
      {loadingAgents ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 animate-pulse space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-850 rounded w-1/2" />
              <div className="h-10 bg-slate-900 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
          <Users className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Handling Agents Match Search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or workload status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <GlassPanel
              key={agent.id}
              tilt={false}
              className="border-slate-800/80 p-5 bg-slate-950/60 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-all text-left"
            >
              {/* Top Row: Agent Identity & Workload Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm leading-tight flex items-center gap-2">
                      {agent.name}
                      {agent.id === currentAgent?.id && (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                          You
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{agent.email}</span>
                  </div>
                </div>

                <div>{getWorkloadBadge(agent.workloadStatus)}</div>
              </div>

              {/* Contact & Meta Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-850 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Contact Phone</span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {agent.phoneNumber || "+1 (555) 000-0000"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Customers Managed</span>
                  <span className="font-bold text-white font-mono flex items-center gap-1">
                    <Users className="h-3 w-3 text-indigo-400" />
                    {agent.assignedCustomersCount} Accounts
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Portfolio Value</span>
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${(agent.totalPortfolioValue || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Handled Customer Accounts List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] font-mono">
                    Assigned Client Portfolio ({agent.assignedCustomers.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Updated {new Date(agent.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {agent.assignedCustomers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-slate-900/30">
                    No customer accounts currently assigned to this agent.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
                    {agent.assignedCustomers.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 font-medium"
                      >
                        <Building2 className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[140px] font-bold">{c.companyName}</span>
                        {c.name && <span className="text-[10px] text-slate-400">({c.name})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </GlassPanel>
          ))}
        </div>
      )}

    </div>
  )}

    </div>
  );
}
