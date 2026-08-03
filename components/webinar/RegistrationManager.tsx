"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Download,
  Plus,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { RegistrationItem, RegistrationStatus } from "@/types/webinar";

interface RegistrationManagerProps {
  initialRegistrations?: RegistrationItem[];
}

export function RegistrationManager({ initialRegistrations = [] }: RegistrationManagerProps) {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>(
    initialRegistrations.length > 0
      ? initialRegistrations
      : [
          {
            id: "reg-1",
            webinarId: "w-1",
            name: "Sarah Jenkins",
            email: "sarah.j@acmecorp.com",
            company: "Acme Enterprise",
            jobTitle: "VP of Global Sales",
            status: "approved",
            registeredAt: "2026-08-01T10:30:00Z",
            qrCodeToken: "QR-ACME-9912",
            calendarInviteSent: true,
            leadScore: 92,
            attended: true,
          },
          {
            id: "reg-2",
            webinarId: "w-1",
            name: "David Miller",
            email: "d.miller@techflow.io",
            company: "TechFlow Systems",
            jobTitle: "Head of Growth",
            status: "approved",
            registeredAt: "2026-08-02T14:15:00Z",
            qrCodeToken: "QR-TECH-4410",
            calendarInviteSent: true,
            leadScore: 84,
            attended: true,
          },
          {
            id: "reg-3",
            webinarId: "w-1",
            name: "Elena Rostova",
            email: "elena@globalbank.eu",
            company: "Global Capital Bank",
            jobTitle: "Director of Digital Strategy",
            status: "pending",
            registeredAt: "2026-08-03T09:12:00Z",
            qrCodeToken: "QR-GLOB-1002",
            calendarInviteSent: false,
            leadScore: 91,
          },
          {
            id: "reg-4",
            webinarId: "w-1",
            name: "Marcus Vance",
            email: "marcus@startupone.co",
            company: "StartupOne",
            jobTitle: "Founder & CEO",
            status: "waitlist",
            registeredAt: "2026-08-03T11:45:00Z",
            qrCodeToken: "QR-STAR-3301",
            calendarInviteSent: false,
            leadScore: 68,
          },
        ]
  );

  const [selectedQR, setSelectedQR] = useState<RegistrationItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const updateStatus = (id: string, newStatus: RegistrationStatus) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus, calendarInviteSent: newStatus === "approved" } : r))
    );
  };

  const filteredList = registrations.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Users className="w-4 h-4" /> Registration & Attendee Management
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Registrations & Approval Queue</h2>
          <p className="text-xs text-slate-400">Custom forms, approval workflows, QR codes, and calendar synchronization</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Total Registrations: <strong className="text-emerald-400">{registrations.length}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "approved", "pending", "waitlist", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                filterStatus === st
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[10px] font-mono text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Attendee</th>
              <th className="p-3">Company & Role</th>
              <th className="p-3">Lead Score</th>
              <th className="p-3">Status</th>
              <th className="p-3">Calendar Invite</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredList.map((reg) => (
              <tr key={reg.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-slate-100">{reg.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{reg.email}</div>
                </td>
                <td className="p-3">
                  <div className="text-slate-200 font-medium">{reg.company}</div>
                  <div className="text-[11px] text-slate-400">{reg.jobTitle}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                    {reg.leadScore}/100
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold capitalize ${
                      reg.status === "approved"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : reg.status === "pending"
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                        : reg.status === "waitlist"
                        ? "bg-purple-500/10 border border-purple-500/30 text-purple-400"
                        : "bg-red-500/10 border border-red-500/30 text-red-400"
                    }`}
                  >
                    {reg.status}
                  </span>
                </td>
                <td className="p-3">
                  {reg.calendarInviteSent ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sent & Synced
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">Pending</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedQR(reg)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title="View QR Code Check-in"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {reg.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(reg.id, "approved")}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px]"
                      >
                        Approve
                      </button>
                    )}

                    {reg.status === "pending" && (
                      <button
                        onClick={() => updateStatus(reg.id, "waitlist")}
                        className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold text-[11px]"
                      >
                        Waitlist
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Attendee Check-in QR Token</h3>
            <p className="text-xs text-slate-400">{selectedQR.name} ({selectedQR.company})</p>

            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-xl flex items-center justify-center shadow-inner">
              {/* Simulated QR Pattern */}
              <div className="w-full h-full border-4 border-slate-950 flex flex-col items-center justify-center text-slate-950 font-mono text-center p-2 font-bold text-xs">
                <QrCode className="w-24 h-24 text-slate-900" />
                <span>{selectedQR.qrCodeToken}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 font-semibold">
              Status: {selectedQR.status.toUpperCase()}
            </div>

            <ExtrudedButton onClick={() => setSelectedQR(null)} className="w-full text-xs bg-cyan-500/20 border-cyan-500/40 text-cyan-200">
              Close Check-in Card
            </ExtrudedButton>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
