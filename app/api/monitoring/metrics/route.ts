// app/api/monitoring/metrics/route.ts
import { NextResponse } from "next/server";
import { getAgentMonitor } from "@/lib/monitoring/agent-monitor";
import { detectAnomalies, getActiveIncidents, resolveIncident } from "@/lib/monitoring/anomaly-detector";

export async function GET(request: Request) {
  try {
    const monitor = getAgentMonitor();
    const kpis = monitor.getAggregatedKPIs();
    const history = monitor.getTelemetryHistory(30);
    const incidents = getActiveIncidents();

    return NextResponse.json({
      success: true,
      kpis,
      history,
      incidents,
      slaStatus: {
        targetUptime: "99.9%",
        currentUptime: `${kpis.uptimePercentage}%`,
        maxResolutionTimeMins: 15,
        status: kpis.uptimePercentage >= 99.9 ? "HEALTHY" : "DEGRADED"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch monitoring metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const monitor = getAgentMonitor();

    const telemetryPoint = monitor.recordTelemetry({
      agentId: body.agentId || "dealflow_bot",
      agentType: body.agentType || "chat",
      sessionId: body.sessionId || `sess_${Date.now()}`,
      technical: {
        responseLatencyMs: body.technical?.responseLatencyMs || 450,
        uptimePercentage: body.technical?.uptimePercentage || 99.9,
        errorRatePercentage: body.technical?.errorRatePercentage || 0.1,
        asrWordErrorRate: body.technical?.asrWordErrorRate || 0.05,
        intentClassificationSuccessRate: body.technical?.intentClassificationSuccessRate || 98.0
      },
      mag: {
        memoryRetrievalLatencyMs: body.mag?.memoryRetrievalLatencyMs || 110,
        contextRelevanceScore: body.mag?.contextRelevanceScore || 0.94,
        memoryUpdateFrequencyPerMin: body.mag?.memoryUpdateFrequencyPerMin || 15,
        hallucinationRatePercentage: body.mag?.hallucinationRatePercentage || 1.0
      },
      ux: {
        userSatisfactionScore: body.ux?.userSatisfactionScore || 4.8,
        conversationResolutionRatePercentage: body.ux?.conversationResolutionRatePercentage || 95.0,
        averageConversationLengthTurns: body.ux?.averageConversationLengthTurns || 5.0
      }
    });

    const newIncidents = detectAnomalies(telemetryPoint);

    return NextResponse.json({
      success: true,
      telemetryPoint,
      detectedAnomaliesCount: newIncidents.length,
      newIncidents
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record telemetry point" },
      { status: 500 }
    );
  }
}
