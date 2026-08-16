"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit,
  Trash2,
  UserX,
  X,
  Loader2,
  Check,
  Shield,
  Layers,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { cn } from "@/lib/utils";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  industry?: string;
  status: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  businessModel?: string;
  isVerified?: boolean;
  serviceConfigurations?: {
    gtmReports?: boolean;
    leadScoring?: boolean;
    aiCalls?: boolean;
    wrenChatbot?: boolean;
    automatedGtmAnalysis?: boolean;
    playbookGeneration?: boolean;
  };
  createdAt: string;
}

export function CustomersModule() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessModelFilter, setBusinessModelFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Form states
  const [onboardFormData, setOnboardFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    industry: "Technology",
    assignedAgentId: "",
    businessModel: "b2b",
    serviceConfigurations: {
      gtmReports: true,
      leadScoring: false,
      aiCalls: false,
      wrenChatbot: true,
      automatedGtmAnalysis: true,
      playbookGeneration: true,
    },
  });

  const [resignationFormData, setResignationFormData] = useState({
    terminationReason: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (agentFilter !== "all") params.set("agentId", agentFilter);

      const [custRes, agentsRes] = await Promise.all([
        fetch(`/api/admin/customers?${params.toString()}`),
        fetch("/api/admin/agents").catch(() => null),
      ]);

      const data = await custRes.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setTotalCount(data.totalCount || data.customers.length);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.error || "Failed to load customers");
      }

      if (agentsRes && agentsRes.ok) {
        const agData = await agentsRes.json();
        if (agData.success && Array.isArray(agData.agents)) {
          setAgents(agData.agents);
        }
      }
    } catch {
      toast.error("Failed to connect to customer service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, statusFilter, agentFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOnboardCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardFormData.name || !onboardFormData.email) {
      toast.error("Name and email are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedAgentObj = agents.find((a) => a.id === onboardFormData.assignedAgentId);
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboard",
          ...onboardFormData,
          assignedAgentName: selectedAgentObj ? selectedAgentObj.name : "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Customer "${data.customer.name}" onboarded successfully!`);
        setShowOnboardModal(false);
        setOnboardFormData({
          name: "",
          email: "",
          phone: "",
          companyName: "",
          industry: "Technology",
          assignedAgentId: "",
          businessModel: "b2b",
          serviceConfigurations: {
            gtmReports: true,
            leadScoring: false,
            aiCalls: false,
            wrenChatbot: true,
            automatedGtmAnalysis: true,
            playbookGeneration: true,
          },
        });
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to onboard customer");
      }
    } catch {
      toast.error("Failed to submit onboarding request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBusinessModel = async (customerId: string, newModel: string) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, businessModel: newModel }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, businessModel: newModel } : c))
        );
        toast.success(`Business model updated to ${newModel.toUpperCase()}`);
      }
    } catch {
      toast.error("Failed to update business model");
    }
  };

  const handleReassignAgent = async (customerId: string, newAgentId: string) => {
    const targetAgent = agents.find((a) => a.id === newAgentId);
    const agentName = targetAgent ? targetAgent.name : "";
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          assignedAgentId: newAgentId,
          assignedAgentName: agentName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId
              ? { ...c, assignedAgentId: newAgentId, assignedAgentName: agentName }
              : c
          )
        );
        toast.success(`Assigned agent updated to ${agentName || "Unassigned"}`);
      }
    } catch {
      toast.error("Failed to reassign agent");
    }
  };

  const handleProcessResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/portal/resignations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          requestDate: new Date().toISOString().split("T")[0],
          effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          terminationReason: resignationFormData.terminationReason,
          notes: resignationFormData.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Resignation for ${selectedCustomer.name} processed.`);
        setShowResignationModal(false);
        setSelectedCustomer(null);
        setResignationFormData({ terminationReason: "", notes: "" });
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to process resignation");
      }
    } catch {
      toast.error("Failed to process resignation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customer: CustomerRecord) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete customer "${customer.name}" (${customer.companyName})?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/customers?customerId=${customer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Customer "${customer.name}" removed successfully.`);
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        toast.error(data.error || "Failed to delete customer");
      }
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  // Filter client-side by business model if needed
  const displayCustomers = customers.filter(
    (c) => businessModelFilter === "all" || (c.businessModel || "b2b") === businessModelFilter
  );

  const b2bTotal = customers.filter((c) => c.businessModel === "b2b").length;
  const b2cTotal = customers.filter((c) => c.businessModel === "b2c").length;
  const d2cTotal = customers.filter((c) => c.businessModel === "d2c").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Stats Banner ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
              <p className="text-2xl font-extrabold text-white mt-1">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Dynamic real-time customer directory</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">B2B Enterprise</p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{b2bTotal}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Multi-seat enterprise sales pipelines</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">D2C & B2C Accounts</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{d2cTotal + b2cTotal}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Direct consumer & ecommerce brands</p>
        </GlassPanel>

        <GlassPanel tilt={false} className="p-4 bg-slate-900/60 border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Retainers</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {customers.filter((c) => c.status === "active").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">100% SLA uptime coverage</p>
        </GlassPanel>
      </div>

      {/* ─── Action & Search Controls Bar ─── */}
      <GlassPanel tilt={false} className="p-4 bg-slate-900/80 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, company, email, phone..."
              className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 h-9 rounded-xl focus-visible:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 h-9"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="resigned">Resigned</option>
            </select>

            <select
              value={businessModelFilter}
              onChange={(e) => setBusinessModelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 h-9"
            >
              <option value="all">All Business Models</option>
              <option value="b2b">B2B Enterprise</option>
              <option value="b2c">B2C Retail</option>
              <option value="d2c">D2C Brand</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 h-9"
            >
              <option value="all">All Assigned Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin text-teal-400")} />
            Refresh
          </Button>

          <ExtrudedButton
            onClick={() => setShowOnboardModal(true)}
            className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-xs font-bold py-2 px-4 whitespace-nowrap shadow-lg shadow-teal-500/20"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Onboard New Customer
          </ExtrudedButton>
        </div>
      </GlassPanel>

      {/* ─── Customer Cards Grid ─── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-xs font-semibold">Loading customer database records...</p>
        </div>
      ) : displayCustomers.length === 0 ? (
        <GlassPanel tilt={false} className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No customers found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No customers matching "${searchQuery}".`
              : "No customers registered yet. Click 'Onboard New Customer' to add an account."}
          </p>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCustomers.map((customer) => {
            const initial = (customer.name || "C").charAt(0).toUpperCase();
            return (
              <GlassPanel
                key={customer.id}
                tilt={false}
                className="border-slate-800/80 bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
              >
                <div>
                  {/* Customer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600/30 to-cyan-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 font-extrabold text-base shadow-md">
                        {initial}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          {customer.name}
                        </h4>
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-200">{customer.companyName || "Organization"}</span>
                          <span className="text-[10px] text-slate-400">({customer.industry || "Tech"})</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        customer.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : customer.status === "onboarding"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      )}
                    >
                      {customer.status || "active"}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Business Model & Assigned Agent Pickers */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Operating Model
                      </Label>
                      <select
                        value={customer.businessModel || "b2b"}
                        onChange={(e) => handleUpdateBusinessModel(customer.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="b2b">B2B Enterprise</option>
                        <option value="b2c">B2C Retail</option>
                        <option value="d2c">D2C Brand</option>
                        <option value="custom">Custom Creator</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Assigned Specialist
                      </Label>
                      <select
                        value={customer.assignedAgentId || ""}
                        onChange={(e) => handleReassignAgent(customer.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 truncate"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    Registered: {new Date(customer.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {customer.status !== "resigned" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowResignationModal(true);
                        }}
                        className="h-7 px-2 rounded-lg border-rose-900/30 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 text-[11px]"
                      >
                        Resign
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCustomer(customer)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-400"
                      title="Delete Customer Account"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </Button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* ─── Pagination Footer ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <p className="text-slate-400">
            Showing <strong className="text-white">{displayCustomers.length}</strong> of{" "}
            <strong className="text-white">{totalCount}</strong> customers
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>

            <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── ONBOARD CUSTOMER MODAL ─── */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <GlassPanel tilt={false} className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" /> Onboard New Customer
              </h3>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Contact Full Name *</Label>
                  <Input
                    required
                    value={onboardFormData.name}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, name: e.target.value })}
                    placeholder="e.g. Jane Smith"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Email Address *</Label>
                  <Input
                    type="email"
                    required
                    value={onboardFormData.email}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Company Name *</Label>
                  <Input
                    required
                    value={onboardFormData.companyName}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, companyName: e.target.value })}
                    placeholder="e.g. Apex Global"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Industry</Label>
                  <Input
                    value={onboardFormData.industry}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, industry: e.target.value })}
                    placeholder="e.g. SaaS, Fintech, Retail"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Direct Phone</Label>
                  <Input
                    value={onboardFormData.phone}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, phone: e.target.value })}
                    placeholder="+1-555-019-4829"
                    className="bg-slate-950 border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Operating Model</Label>
                  <select
                    value={onboardFormData.businessModel}
                    onChange={(e) => setOnboardFormData({ ...onboardFormData, businessModel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 h-9"
                  >
                    <option value="b2b">B2B Enterprise</option>
                    <option value="b2c">B2C Retail</option>
                    <option value="d2c">D2C Brand</option>
                    <option value="custom">Custom Creator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Assign Specialist Agent</Label>
                <select
                  value={onboardFormData.assignedAgentId}
                  onChange={(e) => setOnboardFormData({ ...onboardFormData, assignedAgentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 h-9"
                >
                  <option value="">Auto-Assign / Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOnboardModal(false)}
                  className="text-xs border-slate-800 bg-slate-950 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Onboarding"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* ─── PROCESS RESIGNATION MODAL ─── */}
      {showResignationModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-400" /> Process Account Resignation
              </h3>
              <button onClick={() => setShowResignationModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessResignation} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <p className="text-slate-400">Target Account:</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {selectedCustomer.name} — {selectedCustomer.companyName}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Reason for Termination *</Label>
                <Input
                  required
                  value={resignationFormData.terminationReason}
                  onChange={(e) =>
                    setResignationFormData({ ...resignationFormData, terminationReason: e.target.value })
                  }
                  placeholder="e.g. Project completed, budget shift..."
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Archival Notes</Label>
                <textarea
                  value={resignationFormData.notes}
                  onChange={(e) =>
                    setResignationFormData({ ...resignationFormData, notes: e.target.value })
                  }
                  placeholder="Additional context for compliance & audit archives..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResignationModal(false)}
                  className="text-xs border-slate-800 bg-slate-950 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Resignation"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
