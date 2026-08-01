"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  Loader2,
  CalendarCheck,
  Bell,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { CalendarSlot, MeetingBooking } from "@/lib/types";

interface CalendarBookingModuleProps {
  agentKey?: string;
  agentName?: string;
  customerName?: string;
  isAgentView?: boolean;
}

export function CalendarBookingModule({
  agentKey = "ashok",
  agentName = "Ashok",
  customerName = "Valued Customer",
  isAgentView = false,
}: CalendarBookingModuleProps) {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

  const fetchCalendarData = async () => {
    try {
      const res = await fetch(`/api/portal/calendar?agentKey=${agentKey}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.availableSlots || []);
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [agentKey]);

  const handleConfirmBooking = async (slot: CalendarSlot) => {
    setBookingSlotId(slot.id);
    try {
      const res = await fetch("/api/portal/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          agentKey,
          agentName,
          customerName,
          startTime: slot.startTime,
          endTime: slot.endTime,
          meetingType: "weekly_standup",
          calendarProvider: "google",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Standup call confirmed! Reminders sent.");
        fetchCalendarData();
      } else {
        toast.error(data.error || "Booking failed");
      }
    } catch (err) {
      toast.error("Calendar booking failed");
    } finally {
      setBookingSlotId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            <CalendarIcon className="h-4 w-4" /> 2-Way Calendar Sync & Standup Booking
          </div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <CalendarCheck className="h-5 w-5 text-cyan-400" /> Mutually Available Standup Time Slots
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Connected with Google Calendar & Outlook. Automatically identifies free slots for weekly standups.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Bell className="h-4 w-4" /> Automated Reminders Active
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposed / Available Time Slots */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" /> Mutually Available Time Slots
            </h4>

            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-white">{slot.title || "Weekly Standup"}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{formatDate(slot.startTime)}</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-bold">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmBooking(slot)}
                    disabled={bookingSlotId === slot.id}
                    className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {bookingSlotId === slot.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> 1-Click Confirm & Sync
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Confirmed Bookings & Sync Status */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-400" /> Confirmed Standup Meetings
            </h4>

            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      {b.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {b.calendarSyncStatus || "synced_google"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">Weekly Standup Call with {b.agentName}</p>
                  <p className="text-xs text-slate-300 font-mono">
                    {formatDate(b.startTime)} @ {formatTime(b.startTime)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
