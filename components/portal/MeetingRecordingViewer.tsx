// components/portal/MeetingRecordingViewer.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Video,
  Play,
  Pause,
  Globe,
  Clock,
  Lock,
  User,
  CheckCircle2,
  FileText,
  Tag,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SecuredMeetingRecording } from "@/lib/meeting/recording-service";
import { SUPPORTED_LANGUAGES, translateText } from "@/lib/translation/translation-service";

interface MeetingRecordingViewerProps {
  recordingId?: string;
  customerId?: string;
  ticketId?: string;
  onClose?: () => void;
}

export function MeetingRecordingViewer({
  recordingId,
  customerId,
  ticketId,
  onClose,
}: MeetingRecordingViewerProps) {
  const [recordings, setRecordings] = useState<SecuredMeetingRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<SecuredMeetingRecording | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [viewMode, setViewMode] = useState<"original" | "translated">("original");
  const [translatedSegments, setTranslatedSegments] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentPlayTimeSeconds, setCurrentPlayTimeSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch recordings
  useEffect(() => {
    async function loadRecordings() {
      try {
        const params = new URLSearchParams();
        if (recordingId) params.set("id", recordingId);
        if (customerId) params.set("customerId", customerId);
        if (ticketId) params.set("ticketId", ticketId);

        const res = await fetch(`/api/portal/meeting-recordings?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          const list = data.recordings || (data.recording ? [data.recording] : []);
          setRecordings(list);
          if (list.length > 0 && !selectedRecording) {
            setSelectedRecording(list[0]);
          }
        }
      } catch (err) {
        console.error("Error loading recordings:", err);
      }
    }
    loadRecordings();
  }, [recordingId, customerId, ticketId, selectedRecording]);

  // Translate transcript segments when language or view mode changes
  useEffect(() => {
    async function translateAllSegments() {
      if (!selectedRecording || viewMode === "original" || selectedLanguage === "en") return;
      setIsTranslating(true);
      const cache: Record<string, string> = {};
      for (const seg of selectedRecording.transcriptSegments) {
        const trans = await translateText(seg.text, selectedLanguage, seg.detectedLanguage || "en");
        cache[seg.id] = trans.translatedText;
      }
      setTranslatedSegments(cache);
      setIsTranslating(false);
    }
    translateAllSegments();
  }, [selectedRecording, selectedLanguage, viewMode]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Secured Meeting Recording & Playback Pipeline
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                RBAC AES-256 Cloud Vault
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audio, Video & Screen Share Capture • 15-Min SLA Time-Stamped Transcription • 20+ Languages
            </p>
          </div>
        </div>

        {/* Language & Translation Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setViewMode("original")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all font-medium",
                viewMode === "original" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode("translated")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all font-medium",
                viewMode === "translated" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              Translated ({selectedLanguage.toUpperCase()})
            </button>
          </div>

          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Main Playback & Transcript View */}
      {selectedRecording ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Media Player Box */}
          <div className="md:col-span-6 space-y-3">
            <GlassPanel className="p-4 border-slate-800 bg-slate-900/20 space-y-4">
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center text-slate-600">
                <Video className="h-16 w-16 opacity-30 mb-2" />
                <p className="text-xs text-slate-400 font-mono">
                  {selectedRecording.meetingTitle}
                </p>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    REC PLAYBACK
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {Math.floor(selectedRecording.durationSeconds / 60)} min
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Lock className="h-2.5 w-2.5" /> AES-256 RBAC Verified
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                    {isPlaying ? "Pause" : "Play Recording"}
                  </Button>
                  <span className="text-xs font-mono text-slate-400">
                    {Math.floor(currentPlayTimeSeconds / 60)}:{(currentPlayTimeSeconds % 60).toString().padStart(2, "0")} / {Math.floor(selectedRecording.durationSeconds / 60)}:00
                  </span>
                </div>

                <div className="flex gap-2">
                  {selectedRecording.tracks.map((t) => (
                    <span
                      key={t.trackType}
                      className="px-2 py-0.5 rounded text-[9px] bg-slate-950 border border-slate-800 text-slate-400 uppercase font-mono"
                    >
                      {t.trackType.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linked Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Linked Customer</span>
                  <span className="font-bold text-slate-200">{selectedRecording.customerId}</span>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Linked Agent Ticket</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedRecording.ticketId || "N/A"}</span>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Time-Stamped Transcription Pane */}
          <div className="md:col-span-6 space-y-3">
            <GlassPanel className="p-4 border-slate-800 bg-slate-900/20 h-[480px] flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" /> Time-Stamped Transcription (15m SLA: {selectedRecording.transcriptionSlaMinutes}m)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {viewMode === "translated" ? `Language: ${selectedLanguage.toUpperCase()}` : "Original Audio"}
                </span>
              </div>

              {/* Segments List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-3 custom-scrollbar">
                {isTranslating ? (
                  <p className="text-xs text-indigo-400 animate-pulse text-center py-10">Translating transcript into {selectedLanguage.toUpperCase()}...</p>
                ) : (
                  selectedRecording.transcriptSegments.map((seg) => {
                    const textDisplay =
                      viewMode === "translated" && translatedSegments[seg.id]
                        ? translatedSegments[seg.id]
                        : seg.text;

                    return (
                      <div
                        key={seg.id}
                        onClick={() => setCurrentPlayTimeSeconds(seg.startTimeSeconds)}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1",
                          seg.isActionItemCommitment
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                        )}
                      >
                        <div className="flex justify-between text-[11px]">
                          <span className={cn(
                            "font-bold",
                            seg.role === "agent" ? "text-blue-400" : "text-emerald-400"
                          )}>
                            {seg.speakerName} ({seg.role})
                          </span>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {Math.floor(seg.startTimeSeconds / 60)}:{(seg.startTimeSeconds % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {textDisplay}
                        </p>
                        {seg.isActionItemCommitment && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ★ Action Item Commitment
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Items Footer */}
              {selectedRecording.actionItems && selectedRecording.actionItems.length > 0 && (
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Extracted Commitments</span>
                  {selectedRecording.actionItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                      <span>• {item.task}</span>
                      <span className="text-amber-400 font-mono text-[10px]">{item.owner} ({item.timeline})</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>
        </div>
      ) : (
        <GlassPanel className="p-12 text-center text-slate-500 text-xs">
          No meeting recordings found.
        </GlassPanel>
      )}
    </div>
  );
}
