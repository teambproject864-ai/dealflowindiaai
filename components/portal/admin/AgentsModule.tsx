"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Activity,
  Star,
  Clock,
  Briefcase,
  Shield,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Loader2,
  Check,
  Building,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { cn } from "@/lib/utils";

interface AssignedCustomer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  status: string;
  businessModel?: string;
}

interface AgentRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  countryCode?: string;
  callConversationFramework?: string;
  whatsAppMessageParameters?: string;
  isActive: boolean;
  createdAt: string;
  assignedCustomers?: AssignedCustomer[];
  assignedCustomersCount?: number;
  metrics?: {
    assignedCustomersCount: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: string;
    csatScore: string;
    avgResponseTime: string;
  };
}

export function AgentsModule() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "customers" | "newest">("name");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    countryCode: "US",
    callConversationFramework: "",
    whatsAppMessageParameters: "",
    isActive: true,
  });
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
      } else {
        toast.error(data.error || "Failed to fetch agents");
      }
    } catch {
      toast.error("Failed to connect to agent service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Agent account for "${data.agent.name}" created successfully!`);
        setShowCreateModal(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          phoneNumber: "",
          countryCode: "US",
          callConversationFramework: "",
          whatsAppMessageParameters: "",
          isActive: true,
        });
        fetchAgents();
      } else {
        toast.error(data.error || "Failed to create agent");
      }
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          countryCode: formData.countryCode,
          callConversationFramework: formData.callConversationFramework,
          whatsAppMessageParameters: formData.whatsAppMessageParameters,
          isActive: formData.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Agent "${formData.name}" updated successfully!`);
        setShowEditModal(false);
        setSelectedAgent(null);
        fetchAgents();
      } else {
        toast.error(data.error || "Failed to update agent");
      }
    } catch {
      toast.error("Failed to update agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (agent: AgentRecord) => {
    const newStatus = !agent.isActive;
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          isActive: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, isActive: newStatus } : a))
        );
        toast.success(`Agent is now ${newStatus ? "ACTIVE" : "INACTIVE"}`);
      }
    } catch {
      toast.error("Failed to change agent status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !resetPasswordVal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          newPassword: resetPasswordVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Password for ${selectedAgent.name} has been reset successfully.`);
        setShowResetModal(false);
        setSelectedAgent(null);
        setResetPasswordVal("");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agent: AgentRecord) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete agent "${agent.name}"?\nAll ${agent.assignedCustomersCount || 0} assigned customers will be set to unassigned.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/agents?agentId=${agent.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Agent "${agent.name}" deleted successfully.`);
        setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      } else {
        toast.error(data.error || "Failed to delete agent");
      }
    } catch {
      toast.error("Failed to delete agent");
    }
  };

  // Filter and sort agents
  const filteredAgents = agents
    .filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phoneNumber || "").toLowerCase().includes(q) ||
        (a.assignedCustomers || []).some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.companyName.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? a.isActive : !a.isActive);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "customers") {
        return (b.assignedCustomersCount || 0) - (a.assignedCustomersCount || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return (a.name || "").localeCompare(b.name || "");
    });

  const totalActive = agents.filter((a) => a.isActive).length;
  const totalAssignedClients = agents.reduce((acc, a) => acc + (a.assignedCustomersCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Top Stats Banner ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Specialists</p>
              <p className="text-2xl font-extrabold text-white mt-1">{agents.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            <strong className="text-emerald-400">{totalActive} Active</strong> ready for calls & deals
          </p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Clients</p>
              <p className="text-2xl font-extrabold text-teal-400 mt-1">{totalAssignedClients}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Across all operating revenue queues</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Quality CSAT</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">4.9 / 5.0</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Voice & WhatsApp engagement satisfaction</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Response Time</p>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">2.4m</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Sub-5 min target SLA standard</p>
        </GlassPanel>
      </div>

      {/* ─── Action & Filter Controls Bar ─── */}
      <GlassPanel tilt={false} className="p-4 bg-slate-900/80 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by agent name, email, phone, or assigned customer..."
              className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 h-9 rounded-xl focus-visible:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 h-9"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 h-9"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="customers">Sort: Most Customers</option>
              <option value="newest">Sort: Newest Added</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors",
                viewMode === "grid" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-colors",
                viewMode === "table" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgents}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin text-violet-400")} />
            Refresh
          </Button>

          <ExtrudedButton
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                password: "",
                phoneNumber: "",
                countryCode: "US",
                callConversationFramework: "Core Objectives:\n- Introduce DealFlow AI\n- Pitch pipeline optimization benefits",
                whatsAppMessageParameters: "Tone: Professional, direct.\nCall to Action: Schedule a 15-minute demo.",
                isActive: true,
              });
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold py-2 px-4 whitespace-nowrap shadow-lg shadow-violet-600/20"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add New Agent
          </ExtrudedButton>
        </div>
      </GlassPanel>

      {/* ─── Agents Display (Grid or Table) ─── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-xs font-semibold">Loading specialist agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <GlassPanel tilt={false} className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No agents found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No agents matching "${searchQuery}". Try clearing your filters.`
              : "No specialist agent accounts registered yet. Click 'Add New Agent' above to register your first team member."}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-4 text-xs border-slate-700 text-slate-300"
            >
              Clear Filters
            </Button>
          )}
        </GlassPanel>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const initial = (agent.name || "A").charAt(0).toUpperCase();
            return (
              <GlassPanel
                key={agent.id}
                tilt={false}
                className="border-slate-800/80 bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
              >
                <div>
                  {/* Agent Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-extrabold text-base shadow-md">
                          {initial}
                        </div>
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900",
                            agent.isActive ? "bg-emerald-500 ring-1 ring-emerald-400" : "bg-slate-500"
                          )}
                          title={agent.isActive ? "Active Agent" : "Inactive Agent"}
                        />
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          {agent.name}
                        </h4>
                        <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full font-semibold border border-violet-500/20">
                          {agent.role.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(agent)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1",
                        agent.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      )}
                    >
                      {agent.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {agent.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{agent.phoneNumber || "No phone linked"} ({agent.countryCode || "US"})</span>
                    </div>
                  </div>

                  {/* Performance KPI Chips */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Clients</p>
                      <p className="text-sm font-extrabold text-teal-400 mt-0.5">
                        {agent.assignedCustomersCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Task Win</p>
                      <p className="text-sm font-extrabold text-cyan-400 mt-0.5">
                        {agent.metrics?.completionRate || "100%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">CSAT</p>
                      <p className="text-sm font-extrabold text-amber-400 mt-0.5">
                        {agent.metrics?.csatScore || "4.9"}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Customers Section */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                      <span>Assigned Customers ({agent.assignedCustomers?.length || 0})</span>
                    </p>
                    {agent.assignedCustomers && agent.assignedCustomers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                        {agent.assignedCustomers.map((cust) => (
                          <span
                            key={cust.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/60 border border-teal-800/60 text-[10px] text-teal-300 font-medium truncate max-w-full"
                          >
                            <Building className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                            <span className="truncate">{cust.companyName || cust.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No customers assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setFormData({
                        name: agent.name,
                        email: agent.email,
                        password: "",
                        phoneNumber: agent.phoneNumber || "",
                        countryCode: agent.countryCode || "US",
                        callConversationFramework: agent.callConversationFramework || "",
                        whatsAppMessageParameters: agent.whatsAppMessageParameters || "",
                        isActive: agent.isActive,
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 h-8 rounded-xl border-slate-800 bg-slate-950/80 text-slate-200 hover:text-white text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1 text-teal-400" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setResetPasswordVal("");
                      setShowResetModal(true);
                    }}
                    className="h-8 px-2.5 rounded-xl border-slate-800 bg-slate-950/80 text-slate-200 hover:text-amber-300 text-xs"
                    title="Reset Password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent)}
                    className="h-8 px-2.5 rounded-xl border-rose-900/30 bg-rose-950/30 hover:bg-rose-900/60 text-rose-300 text-xs"
                    title="Delete Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </Button>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="p-4">Specialist Agent</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Customers</th>
                  <th className="p-4">Performance</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300">
                          {(agent.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{agent.name}</p>
                          <p className="text-[10px] text-slate-400">ID: {agent.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-slate-200">{agent.email}</p>
                      <p className="text-slate-400 font-mono text-[10px]">
                        {agent.phoneNumber || "No phone"} ({agent.countryCode || "US"})
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                          agent.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", agent.isActive ? "bg-emerald-400" : "bg-slate-500")} />
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-teal-400 text-sm">
                        {agent.assignedCustomersCount || 0} Clients
                      </span>
                      {agent.assignedCustomers && agent.assignedCustomers.length > 0 && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {agent.assignedCustomers.map((c) => c.companyName || c.name).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> {agent.metrics?.csatScore || "4.9"}
                        </span>
                        <span className="text-slate-400">· {agent.metrics?.completionRate || "100%"} rate</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setFormData({
                              name: agent.name,
                              email: agent.email,
                              password: "",
                              phoneNumber: agent.phoneNumber || "",
                              countryCode: agent.countryCode || "US",
                              callConversationFramework: agent.callConversationFramework || "",
                              whatsAppMessageParameters: agent.whatsAppMessageParameters || "",
                              isActive: agent.isActive,
                            });
                            setShowEditModal(true);
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-white"
                          title="Edit Agent"
                        >
                          <Edit className="w-3.5 h-3.5 text-teal-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setResetPasswordVal("");
                            setShowResetModal(true);
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-amber-300"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAgent(agent)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-400"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

      {/* ─── CREATE AGENT MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <GlassPanel tilt={false} className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" /> Add Specialist Agent
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Full Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Email Address *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@dealflow.ai"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-slate-300">Initial Password *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Country</Label>
                  <Input
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                    placeholder="US"
                    maxLength={3}
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Direct Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1-555-019-2834"
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Call Conversation Strategy & Framework</Label>
                <textarea
                  value={formData.callConversationFramework}
                  onChange={(e) => setFormData({ ...formData, callConversationFramework: e.target.value })}
                  placeholder="Key objectives, objection handles, and elevator pitch points..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs border-slate-800 bg-slate-950 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* ─── EDIT AGENT MODAL ─── */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <GlassPanel tilt={false} className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-teal-400" /> Edit Agent: {selectedAgent.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAgent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Phone Number</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Status</Label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 h-9"
                  >
                    <option value="active">Active Specialist</option>
                    <option value="inactive">Inactive / On Leave</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Call Conversation Framework</Label>
                <textarea
                  value={formData.callConversationFramework}
                  onChange={(e) => setFormData({ ...formData, callConversationFramework: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="text-xs border-slate-800 bg-slate-950 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {showResetModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" /> Reset Agent Password
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <p className="text-slate-400">Target Agent:</p>
                <p className="text-white font-bold text-sm mt-0.5">{selectedAgent.name} ({selectedAgent.email})</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">New Password *</Label>
                <Input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  className="text-xs border-slate-800 bg-slate-950 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || resetPasswordVal.length < 6}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reset"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
