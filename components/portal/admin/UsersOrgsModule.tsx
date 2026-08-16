// components/portal/admin/UsersOrgsModule.tsx
"use client";

import React, { useState } from "react";
import { 
  Users, 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Mail, 
  Filter,
  UserCheck,
  UserX,
  Lock,
  MoreVertical
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent" | "customer" | "manager";
  organization: string;
  status: "active" | "inactive" | "suspended";
  mfaEnabled: boolean;
  lastLogin: string;
  createdAt: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: "usr-1",
    name: "Administrator",
    email: "admin@dealflow.ai",
    role: "admin",
    organization: "DealFlow HQ",
    status: "active",
    mfaEnabled: true,
    lastLogin: "Just now",
    createdAt: "2026-01-01"
  },
  {
    id: "usr-2",
    name: "Praneeth Revenue Specialist",
    email: "praneeth@dealflow.ai",
    role: "agent",
    organization: "DealFlow RevOps Team",
    status: "active",
    mfaEnabled: true,
    lastLogin: "10 mins ago",
    createdAt: "2026-01-15"
  },
  {
    id: "usr-3",
    name: "Ashok Agent",
    email: "agent.ashok@dealflow.ai",
    role: "agent",
    organization: "DealFlow SDR Unit",
    status: "active",
    mfaEnabled: false,
    lastLogin: "2 hours ago",
    createdAt: "2026-02-01"
  },
  {
    id: "usr-4",
    name: "Sarah Jenkins",
    email: "sarah.j@apexhealthtech.com",
    role: "customer",
    organization: "Apex HealthTech",
    status: "active",
    mfaEnabled: true,
    lastLogin: "Yesterday",
    createdAt: "2026-02-10"
  },
  {
    id: "usr-5",
    name: "Anil Kumar",
    email: "anil@cralgo.com",
    role: "customer",
    organization: "Global Fintech Dynamics",
    status: "inactive",
    mfaEnabled: false,
    lastLogin: "3 days ago",
    createdAt: "2026-02-01"
  }
];

export function UsersOrgsModule() {
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "agent" as SystemUser["role"],
    organization: "DealFlow RevOps",
    status: "active" as SystemUser["status"]
  });

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.organization.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter(u => u.status === "active").length;
  const inactiveCount = users.filter(u => u.status !== "active").length;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      organization: formData.organization,
      status: formData.status,
      mfaEnabled: false,
      lastLogin: "Never",
      createdAt: new Date().toISOString().split("T")[0]
    };

    setUsers([newUser, ...users]);
    setShowCreateModal(false);
    setFormData({ name: "", email: "", role: "agent", organization: "DealFlow RevOps", status: "active" });
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassPanel tilt={false} className="border-slate-800 p-6 bg-gradient-to-r from-slate-900/90 via-violet-950/30 to-slate-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-bold bg-violet-950/60 border border-violet-700/50 px-2 py-0.5 rounded-full">
              Administrative Governance
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1.5">
              <Users className="h-6 w-6 text-violet-400" /> Users & Organizations
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Manage all platform users, assign corporate organization linkages, and enforce role lifecycle policies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Active Users</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{activeCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Inactive</span>
              <span className="text-base font-bold text-amber-400 font-mono">{inactiveCount}</span>
            </div>
            <ExtrudedButton
              onClick={() => setShowCreateModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-500/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add User
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, or organization..."
            className="bg-slate-950 border-slate-800 text-xs pl-9 h-9 rounded-xl focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="agent">Specialist Agents</option>
            <option value="customer">Customers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Organization</th>
                <th className="p-3.5">MFA Security</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Login</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-white text-xs">{u.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === "admin" ? "bg-amber-950/80 text-amber-300 border border-amber-800/50" :
                      u.role === "agent" ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/50" :
                      "bg-violet-950/80 text-violet-300 border border-violet-800/50"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-300">{u.organization}</td>
                  <td className="p-3.5">
                    {u.mfaEnabled ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Enforced
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">Disabled</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === "active" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" : "bg-slate-900 text-slate-500 border border-slate-800"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{u.lastLogin}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white"
                        title={u.status === "active" ? "Deactivate User" : "Activate User"}
                      >
                        {u.status === "active" ? <UserX className="h-3.5 w-3.5 text-amber-400" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-violet-400" /> Create Platform User
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. alex@dealflow.ai"
                  required
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="agent">Specialist Agent</option>
                    <option value="admin">Administrator</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Organization</label>
                  <Input
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="DealFlow HQ"
                    className="bg-slate-900 border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <ExtrudedButton
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 px-4 rounded-xl"
                >
                  Create User
                </ExtrudedButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
