// lib/monitoring/agent-monitor.ts

export interface TechnicalMetrics {
  responseLatencyMs: number;
  uptimePercentage: number;
  errorRatePercentage: number;
  asrWordErrorRate: number;
  intentClassificationSuccessRate: number;
}

export interface MAGMetrics {
  memoryRetrievalLatencyMs: number;
  contextRelevanceScore: number; // 0.0 - 1.0
  memoryUpdateFrequencyPerMin: number;
  hallucinationRatePercentage: number;
}

export interface UXMetrics {
  userSatisfactionScore: number; // CSAT 1.0 - 5.0
  conversationResolutionRatePercentage: number;
  averageConversationLengthTurns: number;
}

export interface AgentTelemetryPoint {
  timestamp: string;
  agentId: string;
  agentType: 'voice' | 'chat';
  sessionId: string;
  technical: TechnicalMetrics;
  mag: MAGMetrics;
  ux: UXMetrics;
}

class AgentMonitorStack {
  private static instance: AgentMonitorStack;
  private telemetryBuffer: AgentTelemetryPoint[] = [];
  private readonly maxBufferSize = 500;

  private constructor() {
    this.seedDefaultMetrics();
  }

  public static getInstance(): AgentMonitorStack {
    if (!AgentMonitorStack.instance) {
      AgentMonitorStack.instance = new AgentMonitorStack();
    }
    return AgentMonitorStack.instance;
  }

  private seedDefaultMetrics() {
    // Seed baseline telemetry data for initial monitoring dashboard view
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 60 * 1000).toISOString();
      this.telemetryBuffer.push({
        timestamp: time,
        agentId: 'dealflow_bot_main',
        agentType: i % 2 === 0 ? 'voice' : 'chat',
        sessionId: `sess_monitoring_${i}`,
        technical: {
          responseLatencyMs: 420 + Math.floor(Math.random() * 80),
          uptimePercentage: 99.95,
          errorRatePercentage: 0.2 + (Math.random() * 0.3),
          asrWordErrorRate: 0.04 + (Math.random() * 0.02),
          intentClassificationSuccessRate: 98.5
        },
        mag: {
          memoryRetrievalLatencyMs: 95 + Math.floor(Math.random() * 30),
          contextRelevanceScore: 0.92 + (Math.random() * 0.06),
          memoryUpdateFrequencyPerMin: 14 + Math.floor(Math.random() * 6),
          hallucinationRatePercentage: 1.2 + (Math.random() * 0.5)
        },
        ux: {
          userSatisfactionScore: 4.8,
          conversationResolutionRatePercentage: 94.2,
          averageConversationLengthTurns: 5.4
        }
      });
    }
  }

  public recordTelemetry(point: Omit<AgentTelemetryPoint, 'timestamp'>): AgentTelemetryPoint {
    const fullPoint: AgentTelemetryPoint = {
      ...point,
      timestamp: new Date().toISOString()
    };

    this.telemetryBuffer.push(fullPoint);
    if (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer.shift();
    }
    return fullPoint;
  }

  public getTelemetryHistory(limit: number = 50): AgentTelemetryPoint[] {
    return this.telemetryBuffer.slice(-limit);
  }

  public getAggregatedKPIs(): {
    avgLatencyMs: number;
    uptimePercentage: number;
    errorRatePercentage: number;
    asrAccuracyPercentage: number;
    intentSuccessPercentage: number;
    avgMemoryLatencyMs: number;
    avgContextRelevance: number;
    avgHallucinationRate: number;
    avgCSAT: number;
    resolutionRate: number;
  } {
    const history = this.telemetryBuffer;
    if (history.length === 0) {
      return {
        avgLatencyMs: 0,
        uptimePercentage: 100,
        errorRatePercentage: 0,
        asrAccuracyPercentage: 100,
        intentSuccessPercentage: 100,
        avgMemoryLatencyMs: 0,
        avgContextRelevance: 1.0,
        avgHallucinationRate: 0,
        avgCSAT: 5.0,
        resolutionRate: 100
      };
    }

    const count = history.length;
    let sumLatency = 0, sumUptime = 0, sumError = 0, sumASR = 0, sumIntent = 0;
    let sumMemLat = 0, sumRel = 0, sumHal = 0, sumCSAT = 0, sumRes = 0;

    history.forEach(p => {
      sumLatency += p.technical.responseLatencyMs;
      sumUptime += p.technical.uptimePercentage;
      sumError += p.technical.errorRatePercentage;
      sumASR += (1 - p.technical.asrWordErrorRate) * 100;
      sumIntent += p.technical.intentClassificationSuccessRate;

      sumMemLat += p.mag.memoryRetrievalLatencyMs;
      sumRel += p.mag.contextRelevanceScore;
      sumHal += p.mag.hallucinationRatePercentage;

      sumCSAT += p.ux.userSatisfactionScore;
      sumRes += p.ux.conversationResolutionRatePercentage;
    });

    return {
      avgLatencyMs: Math.round(sumLatency / count),
      uptimePercentage: Math.round((sumUptime / count) * 100) / 100,
      errorRatePercentage: Math.round((sumError / count) * 100) / 100,
      asrAccuracyPercentage: Math.round((sumASR / count) * 100) / 100,
      intentSuccessPercentage: Math.round((sumIntent / count) * 100) / 100,
      avgMemoryLatencyMs: Math.round(sumMemLat / count),
      avgContextRelevance: Math.round((sumRel / count) * 1000) / 1000,
      avgHallucinationRate: Math.round((sumHal / count) * 100) / 100,
      avgCSAT: Math.round((sumCSAT / count) * 10) / 10,
      resolutionRate: Math.round((sumRes / count) * 100) / 100
    };
  }
}

export function getAgentMonitor(): AgentMonitorStack {
  return AgentMonitorStack.getInstance();
}
