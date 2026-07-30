// lib/monitoring/anomaly-detector.ts
import { getAgentMonitor, AgentTelemetryPoint } from "./agent-monitor";

export type IncidentTag =
  | "#LATENCY_SPIKE"
  | "#MAG_HALLUCINATION"
  | "#VOICE_ASR_DROP"
  | "#HIGH_ERROR_RATE"
  | "#LOW_RECALL_ACCURACY";

export type IncidentSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface IncidentAlert {
  id: string;
  tag: IncidentTag;
  severity: IncidentSeverity;
  title: string;
  description: string;
  metricName: string;
  actualValue: number;
  thresholdValue: number;
  timestamp: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  resolvedAt?: string;
  rootCauseAnalysis?: string;
}

const incidentLog: IncidentAlert[] = [];

// Baseline Threshold Rules
const ANOMALY_THRESHOLDS = {
  maxLatencyMs: 1200,
  maxErrorRatePct: 2.0,
  maxASRWER: 0.15, // max 15% WER
  minContextRelevance: 0.70,
  maxHallucinationRatePct: 4.0,
};

export function detectAnomalies(telemetry: AgentTelemetryPoint): IncidentAlert[] {
  const newIncidents: IncidentAlert[] = [];
  const now = new Date().toISOString();

  // 1. Latency Spike Check
  if (telemetry.technical.responseLatencyMs > ANOMALY_THRESHOLDS.maxLatencyMs) {
    newIncidents.push({
      id: `inc_lat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tag: "#LATENCY_SPIKE",
      severity: telemetry.technical.responseLatencyMs > 2500 ? "CRITICAL" : "HIGH",
      title: "Response Latency Spike Detected",
      description: `Agent ${telemetry.agentId} experienced a response latency of ${telemetry.technical.responseLatencyMs}ms (threshold: ${ANOMALY_THRESHOLDS.maxLatencyMs}ms).`,
      metricName: "responseLatencyMs",
      actualValue: telemetry.technical.responseLatencyMs,
      thresholdValue: ANOMALY_THRESHOLDS.maxLatencyMs,
      timestamp: now,
      status: "OPEN",
      rootCauseAnalysis: "Network jitter or vector index cold start during memory synthesis."
    });
  }

  // 2. MAG Hallucination Rate Check
  if (telemetry.mag.hallucinationRatePercentage > ANOMALY_THRESHOLDS.maxHallucinationRatePct) {
    newIncidents.push({
      id: `inc_hal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tag: "#MAG_HALLUCINATION",
      severity: "CRITICAL",
      title: "MAG Memory Hallucination Anomaly",
      description: `Hallucination rate spiked to ${telemetry.mag.hallucinationRatePercentage}% in session ${telemetry.sessionId}.`,
      metricName: "hallucinationRatePercentage",
      actualValue: telemetry.mag.hallucinationRatePercentage,
      thresholdValue: ANOMALY_THRESHOLDS.maxHallucinationRatePct,
      timestamp: now,
      status: "OPEN",
      rootCauseAnalysis: "Low memory context relevance or conflicting memory entries in long-term storage."
    });
  }

  // 3. Voice ASR Drop Check
  if (telemetry.agentType === "voice" && telemetry.technical.asrWordErrorRate > ANOMALY_THRESHOLDS.maxASRWER) {
    newIncidents.push({
      id: `inc_asr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tag: "#VOICE_ASR_DROP",
      severity: "HIGH",
      title: "Voice Recognition Accuracy Degradation",
      description: `Voice ASR Word Error Rate increased to ${Math.round(telemetry.technical.asrWordErrorRate * 100)}%.`,
      metricName: "asrWordErrorRate",
      actualValue: telemetry.technical.asrWordErrorRate,
      thresholdValue: ANOMALY_THRESHOLDS.maxASRWER,
      timestamp: now,
      status: "OPEN",
      rootCauseAnalysis: "Background noise or codec sample rate mismatch in audio stream."
    });
  }

  // 4. Low Context Relevance Check
  if (telemetry.mag.contextRelevanceScore < ANOMALY_THRESHOLDS.minContextRelevance) {
    newIncidents.push({
      id: `inc_rel_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tag: "#LOW_RECALL_ACCURACY",
      severity: "MEDIUM",
      title: "Sub-optimal Context Relevance Score",
      description: `Context relevance score fell to ${telemetry.mag.contextRelevanceScore} for agent ${telemetry.agentId}.`,
      metricName: "contextRelevanceScore",
      actualValue: telemetry.mag.contextRelevanceScore,
      thresholdValue: ANOMALY_THRESHOLDS.minContextRelevance,
      timestamp: now,
      status: "OPEN",
      rootCauseAnalysis: "Vector search distance cutoff threshold too high or missing semantic keywords."
    });
  }

  // Add to active incident log
  newIncidents.forEach(inc => incidentLog.unshift(inc));
  return newIncidents;
}

export function getActiveIncidents(): IncidentAlert[] {
  // Return recent incidents
  if (incidentLog.length === 0) {
    // Seed sample incident for demonstration
    incidentLog.push({
      id: "inc_sample_01",
      tag: "#MAG_HALLUCINATION",
      severity: "HIGH",
      title: "Transient Context Recall Misalignment",
      description: "Minor context matching mismatch resolved automatically after memory index refresh.",
      metricName: "hallucinationRatePercentage",
      actualValue: 4.2,
      thresholdValue: 4.0,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: "RESOLVED",
      resolvedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      rootCauseAnalysis: "Automated purge of stale memory entries restored 100% grounded response generation."
    });
  }
  return incidentLog;
}

export function resolveIncident(incidentId: string, resolutionNotes?: string): boolean {
  const incident = incidentLog.find(i => i.id === incidentId);
  if (!incident) return false;
  incident.status = "RESOLVED";
  incident.resolvedAt = new Date().toISOString();
  if (resolutionNotes) {
    incident.rootCauseAnalysis = resolutionNotes;
  }
  return true;
}
