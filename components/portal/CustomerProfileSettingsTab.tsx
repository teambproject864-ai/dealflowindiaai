"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Briefcase, Lock, CheckCircle2, AlertCircle, Save, RefreshCw, ShieldCheck } from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getCustomerDisplayName } from "@/lib/utils";

interface CustomerProfileSettingsTabProps {
  onProfileUpdated?: () => void;
}

export function CustomerProfileSettingsTab({ onProfileUpdated }: CustomerProfileSettingsTabProps) {
  const { user, refetchUser } = useCurrentUser();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessModel, setBusinessModel] = useState<"b2b" | "b2c" | "d2c" | "custom">("b2b");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        setName(p.name || (user?.name ? getCustomerDisplayName(user) : ""));
        setEmail(p.email || user?.email || "");
        setPhone(p.phone || "");
        setCompanyName(p.companyName || "Acme Corp");
        setIndustry(p.industry || "SaaS & Tech");
        setBusinessModel(p.businessModel || "b2b");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New password and confirm password do not match" });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name,
        email,
        phone,
        companyName,
        industry,
        businessModel,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Account profile & details updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Refetch authenticated user context to update headers, badges & greetings immediately
        await refetchUser();
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to update profile details" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "An unexpected error occurred while saving profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-4">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading customer account details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <User className="h-6 w-6 text-[#0071E3] dark:text-[#2997FF]" />
            <span>Account Profile & Customer Settings</span>
          </h2>
          <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-1 text-xs">
            Manage your personal identity, contact credentials, company profile, and security preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>Authenticated Account Active</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* SECTION 1: Personal & Contact Credentials */}
        <GlassPanel className="p-6 space-y-4 bg-white/80 dark:bg-[#161618]/80 border-black/[0.08] dark:border-white/[0.12]">
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <User className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Customer Name / Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Praneeth Burada"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* SECTION 2: Organization & Business Profile */}
        <GlassPanel className="p-6 space-y-4 bg-white/80 dark:bg-[#161618]/80 border-black/[0.08] dark:border-white/[0.12]">
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <Building className="h-4 w-4 text-purple-400" />
            <span>Company & Business Operating Model</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme SaaS Technologies"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Industry Vertical
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. B2B Enterprise Software"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Operating Business Model
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "b2b", label: "B2B SaaS", desc: "Business to Business" },
                  { id: "b2c", label: "B2C Market", desc: "Business to Consumer" },
                  { id: "d2c", label: "D2C Brand", desc: "Direct to Consumer" },
                  { id: "custom", label: "Custom Model", desc: "Hybrid Operating Model" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBusinessModel(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      businessModel === m.id
                        ? "bg-[#0071E3]/15 border-[#0071E3] text-[#0071E3] dark:text-[#2997FF]"
                        : "bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="font-bold text-xs">{m.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* SECTION 3: Security & Password Update (Optional) */}
        <GlassPanel className="p-6 space-y-4 bg-white/80 dark:bg-[#161618]/80 border-black/[0.08] dark:border-white/[0.12]">
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <Lock className="h-4 w-4 text-amber-400" />
            <span>Security & Password Update (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required if setting new password"
                className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-4 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3] transition-colors"
              />
            </div>
          </div>
        </GlassPanel>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <ExtrudedButton
            type="submit"
            variant="default"
            disabled={saving}
            className="bg-gradient-to-r from-[#0071E3] to-[#2997FF] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#0071E3]/20"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Saving Changes..." : "Save Profile & Details"}</span>
          </ExtrudedButton>
        </div>
      </form>
    </div>
  );
}
