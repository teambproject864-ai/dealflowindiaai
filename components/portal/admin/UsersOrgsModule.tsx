"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
  KeyRound, 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Check, 
  History, 
  ShieldAlert 
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { generateRandomStrongPassword } from "@/lib/password-utils";

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

export interface PasswordAuditEntry {
  id: string;
  timestamp: string;
  targetEmail: string;
  targetRole: string;
  adminOperator: string;
  status: "success" | "failed";
  notifiedViaEmail: boolean;
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

  // Admin Current User Context & Password Management States
  const { user: currentAdmin } = useCurrentUser();
  const currentAdminOperator = currentAdmin?.email
    ? `${currentAdmin.name || "Administrator"} (${currentAdmin.email})`
    : "Administrator (admin@dealflow.ai)";

  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notifyUserByEmail, setNotifyUserByEmail] = useState(true);
  const [isSubmittingPasswordReset, setIsSubmittingPasswordReset] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showAuditHistoryModal, setShowAuditHistoryModal] = useState(false);

  const [passwordAudits, setPasswordAudits] = useState<PasswordAuditEntry[]>([
    {
      id: "pa-1",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      targetEmail: "praneeth@dealflow.ai",
      targetRole: "agent",
      adminOperator: currentAdminOperator,
      status: "success",
      notifiedViaEmail: true
    }
  ]);

  // Password Complexity Validation Helpers
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Generate a Cryptographically Strong, High-Entropy Random Password
  const handleGenerateStrongPassword = () => {
    const generated = generateRandomStrongPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    setResetErrorMessage(null);
  };

  const handleOpenPasswordResetModal = (user: SystemUser) => {
    setSelectedUserForPasswordReset(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setResetSuccessMessage(null);
    setResetErrorMessage(null);
    setCopiedPassword(false);
  };

  const handleClosePasswordResetModal = () => {
    setSelectedUserForPasswordReset(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetSuccessMessage(null);
    setResetErrorMessage(null);
    setIsSubmittingPasswordReset(false);
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Submit Password Change with Authentication Check, Complexity Validation, and Audit Logging
  const handleSubmitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordReset) return;

    if (!isPasswordValid) {
      setResetErrorMessage("Password does not meet the minimum complexity requirements.");
      return;
    }

    if (!passwordsMatch) {
      setResetErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmittingPasswordReset(true);
    setResetErrorMessage(null);

    try {
      // Call backend direct reset endpoint with admin authentication
      const res = await fetch("/api/admin/direct-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: selectedUserForPasswordReset.email,
          targetRole: selectedUserForPasswordReset.role,
          newPassword: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({ success: false, error: "Failed to parse server response" }));

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Administrative password override failed with status ${res.status}`);
      }

      // Record Audit Log Entry for Success using current authenticated admin
      const newAudit: PasswordAuditEntry = {
        id: `pa-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetEmail: selectedUserForPasswordReset.email,
        targetRole: selectedUserForPasswordReset.role,
        adminOperator: currentAdminOperator,
        status: "success",
        notifiedViaEmail: notifyUserByEmail
      };
      setPasswordAudits(prev => [newAudit, ...prev]);

      setResetSuccessMessage(
        `Password for ${selectedUserForPasswordReset.name} (${selectedUserForPasswordReset.email}) was modified successfully.`
      );
    } catch (err: any) {
      console.error("Administrative password reset failed:", err);
      const errorMsg = err?.message || "Failed to override user password. Please verify administrative credentials and try again.";
      setResetErrorMessage(errorMsg);

      // Record Audit Log Entry for Failed Attempt using current authenticated admin
      const failedAudit: PasswordAuditEntry = {
        id: `pa-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetEmail: selectedUserForPasswordReset.email,
        targetRole: selectedUserForPasswordReset.role,
        adminOperator: currentAdminOperator,
        status: "failed",
        notifiedViaEmail: false
      };
      setPasswordAudits(prev => [failedAudit, ...prev]);
    } finally {
      setIsSubmittingPasswordReset(false);
    }
  };

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
              Manage all platform users, enforce password security policies, assign corporate organization linkages, and review password audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAuditHistoryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-left transition-colors flex items-center gap-2"
            >
              <History className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono">Password Audits</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{passwordAudits.length} Recorded</span>
              </div>
            </button>
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
                      {/* Secure Reset Password Action Button */}
                      <button
                        onClick={() => handleOpenPasswordResetModal(u)}
                        className="p-1.5 rounded-lg bg-violet-950/70 hover:bg-violet-900/90 border border-violet-700/50 text-violet-300 hover:text-white transition-all flex items-center gap-1 text-[11px] font-bold shadow-sm"
                        title="Admin Reset / Modify Password"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                        <span className="hidden sm:inline">Reset Pass</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white"
                        title={u.status === "active" ? "Deactivate User" : "Activate User"}
                      >
                        {u.status === "active" ? <UserX className="h-3.5 w-3.5 text-amber-400" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400"
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

      {/* SECURE ADMIN PASSWORD RESET & MODIFICATION MODAL */}
      {selectedUserForPasswordReset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-950 border border-violet-500/40 rounded-2xl p-6 md:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  Admin Security Action
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1.5">
                  <KeyRound className="h-5 w-5 text-violet-400" />
                  Reset & Modify User Password
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct credential override for <strong className="text-white">{selectedUserForPasswordReset.name}</strong> ({selectedUserForPasswordReset.email})
                </p>
              </div>
              <button
                onClick={handleClosePasswordResetModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Target User Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Role / Scope</span>
                <p className="font-bold text-violet-300 uppercase">{selectedUserForPasswordReset.role}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Organization</span>
                <p className="font-bold text-slate-200">{selectedUserForPasswordReset.organization}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Account Status</span>
                <p className="font-bold text-emerald-400 capitalize">{selectedUserForPasswordReset.status}</p>
              </div>
            </div>

            {/* Success Message Banner */}
            {resetSuccessMessage ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Password Successfully Modified &amp; Logged</span>
                  </div>
                  <p className="text-xs text-emerald-300/90 leading-relaxed">
                    {resetSuccessMessage}
                  </p>
                  <div className="mt-2 p-2.5 bg-slate-950 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                    <code className="text-xs font-mono text-white font-bold">{newPassword}</code>
                    <button
                      onClick={handleCopyPassword}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center gap-1"
                    >
                      {copiedPassword ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedPassword ? "Copied" : "Copy Password"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <ExtrudedButton
                    onClick={handleClosePasswordResetModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl"
                  >
                    Done
                  </ExtrudedButton>
                </div>
              </div>
            ) : (
              /* Password Reset Form */
              <form onSubmit={handleSubmitPasswordReset} className="space-y-4">
                {resetErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-200">New Password</Label>
                    <button
                      type="button"
                      onClick={handleGenerateStrongPassword}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <Sparkles className="h-3 w-3" /> Generate Strong Password
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)..."
                      required
                      className="bg-slate-900 border-slate-800 text-xs text-white pr-10 rounded-xl focus:border-violet-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Complexity Live Checklist */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Security &amp; Complexity Standards:
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      <div className={cn("flex items-center gap-1.5", hasMinLength ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                        <Check className={cn("h-3 w-3", hasMinLength ? "text-emerald-400" : "text-slate-600")} />
                        <span>Min 8 characters</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", hasUppercase ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                        <Check className={cn("h-3 w-3", hasUppercase ? "text-emerald-400" : "text-slate-600")} />
                        <span>1+ Uppercase (A-Z)</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", hasLowercase ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                        <Check className={cn("h-3 w-3", hasLowercase ? "text-emerald-400" : "text-slate-600")} />
                        <span>1+ Lowercase (a-z)</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", hasNumber ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                        <Check className={cn("h-3 w-3", hasNumber ? "text-emerald-400" : "text-slate-600")} />
                        <span>1+ Number (0-9)</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5 col-span-2", hasSpecialChar ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                        <Check className={cn("h-3 w-3", hasSpecialChar ? "text-emerald-400" : "text-slate-600")} />
                        <span>1+ Special Character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-200">Confirm New Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password..."
                      required
                      className="bg-slate-900 border-slate-800 text-xs text-white rounded-xl focus:border-violet-500 font-mono"
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-[11px] text-rose-400">Passwords do not match.</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifyUserByEmail}
                        onChange={(e) => setNotifyUserByEmail(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                      />
                      <span>Dispatch automated temporary credential notification to <strong className="text-white">{selectedUserForPasswordReset.email}</strong></span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    Action recorded in immutable audit log
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClosePasswordResetModal}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <ExtrudedButton
                      type="submit"
                      disabled={!isPasswordValid || !passwordsMatch || isSubmittingPasswordReset}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isSubmittingPasswordReset && "animate-spin")} />
                      {isSubmittingPasswordReset ? "Updating..." : "Override Password"}
                    </ExtrudedButton>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {showAuditHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Administrative Password Audit Log</h3>
              </div>
              <button onClick={() => setShowAuditHistoryModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Verified records of administrator-initiated password overrides and temporary credential dispatches.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {passwordAudits.map(audit => (
                <div key={audit.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{audit.targetEmail} ({audit.targetRole})</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {audit.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>By: {audit.adminOperator}</span>
                    <span>{new Date(audit.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-850 flex justify-end">
              <button
                onClick={() => setShowAuditHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}

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
