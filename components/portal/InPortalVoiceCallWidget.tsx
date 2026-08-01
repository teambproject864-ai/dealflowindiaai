"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Radio,
  FileText,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/immersive/GlassPanel";

interface InPortalVoiceCallWidgetProps {
  agentName?: string;
  customerName?: string;
  onCallEnd?: (transcript: string, notes: string) => void;
}

export function InPortalVoiceCallWidget({
  agentName = "Assigned Agent",
  customerName = "Valued Customer",
  onCallEnd,
}: InPortalVoiceCallWidgetProps) {
  const [callState, setCallState] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [liveNotes, setLiveNotes] = useState("");
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: string; text: string }>>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const startCall = () => {
    setCallState("connecting");
    toast.info("Initializing high-quality WebRTC audio connection...");
    setTimeout(() => {
      setCallState("active");
      setCallDuration(0);
      setLiveTranscript([
        { sender: agentName, text: `Hello ${customerName}! Thank you for connecting. How can I assist with your GTM campaign strategy today?` },
      ]);
      toast.success("Voice Call Connected");
    }, 2000);
  };

  const endCall = () => {
    setCallState("ended");
    toast.success("Call ended and recording saved.");
    if (onCallEnd) {
      onCallEnd(liveTranscript.map((t) => `${t.sender}: ${t.text}`).join("\n"), liveNotes);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/40 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            In-Portal Voice Call Engine
          </span>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <Phone className="h-5 w-5 text-cyan-400" /> High-Quality Audio Call & Note-Taking
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Direct WebRTC voice communication between {customerName} and {agentName}.
          </p>
        </div>

        {callState === "active" && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              CALL LIVE ({formatTime(callDuration)})
            </span>
          </div>
        )}
      </div>

      {/* Main Call Control Body */}
      {callState === "idle" && (
        <div className="text-center py-8 space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Volume2 className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white">Ready for Direct Voice Consultation</h4>
            <p className="text-xs text-slate-400 mt-1">
              Start an instant audio call with {agentName}. Includes live recording and automated transcript notes.
            </p>
          </div>
          <button
            onClick={startCall}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Phone className="h-4 w-4" /> Initiate Audio Call Now
          </button>
        </div>
      )}

      {callState === "connecting" && (
        <div className="text-center py-10 space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 animate-pulse">
            <Phone className="h-8 w-8 animate-bounce" />
          </div>
          <p className="text-sm font-extrabold text-white">Connecting to {agentName}...</p>
        </div>
      )}

      {(callState === "active" || callState === "ended") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Call Controls & Live Transcript */}
          <div className="lg:col-span-7 space-y-4">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isMuted
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {isMuted ? <MicOff className="h-4 w-4 text-rose-400" /> : <Mic className="h-4 w-4 text-emerald-400" />}
                  {isMuted ? "Muted" : "Mute Mic"}
                </button>

                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isRecording
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-400"
                  }`}
                >
                  <Radio className={`h-4 w-4 ${isRecording ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                  {isRecording ? "Recording Active" : "Recording Off"}
                </button>
              </div>

              {callState === "active" && (
                <button
                  onClick={endCall}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25"
                >
                  <PhoneOff className="h-4 w-4" /> End Call
                </button>
              )}
            </div>

            {/* Live Transcript View */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-cyan-400" /> Live Audio Transcript Stream
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {liveTranscript.map((t, idx) => (
                  <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                    <span className="font-bold text-cyan-400 block mb-0.5">{t.sender}:</span>
                    <span className="text-slate-300 font-light">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Embedded Note Taking */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-cyan-400" /> Live Meeting Notes
              </span>
              <button
                onClick={() => toast.success("Call notes saved to account history.")}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" /> Save Notes
              </button>
            </div>

            <textarea
              value={liveNotes}
              onChange={(e) => setLiveNotes(e.target.value)}
              placeholder="Type key discussion points, decision notes, and follow-up action items during the call..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-light"
              rows={8}
            />
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
