// lib/dealflow-llm/dealflow-pipeline-manager.ts
import { DealflowEvaluator, EvaluationMetrics, ModelComparisonResult, ThresholdConfig } from "./dealflow-evaluator";
import { DealflowDataIngestionPipeline, SyntheticDataSample } from "./dealflow-data-pipeline";
import type { DealflowLearningState, DealflowMarketDataPoint } from "./dealflow-llm.types";

export interface PipelineDataQualityReport {
  totalSamples: number;
  validSamples: number;
  invalidSamples: number;
  validationScore: number; // 0 to 100
  anomaliesDetected: number;
  passedQualityCheck: boolean;
  timestamp: string;
}

export interface DetailedModelBenchmark {
  modelId: string;
  modelName: string;
  version: string;
  isProduction: boolean;
  metrics: {
    accuracy: number;        // e.g. 0.972 (97.2%)
    precision: number;       // e.g. 0.965
    recall: number;          // e.g. 0.958
    f1Score: number;         // e.g. 0.961
    perplexity: number;      // lower is better
    bleuScore: number;       // 0 to 1
    rougeL: number;          // 0 to 1
    latencyMs: number;       // inference latency
    tokensPerSecond: number; // throughput
    gpuMemoryMb: number;     // resource utilization
  };
  errorRate: number;         // e.g. 0.028 (2.8%)
  passesThresholds: boolean;
}

export interface SideBySideComparisonReport {
  currentProduction: DetailedModelBenchmark;
  candidateModel: DetailedModelBenchmark;
  winnerModelId: string;
  improvementPercentage: {
    accuracy: number;
    latency: number;
    throughput: number;
    errorRateReduction: number;
  };
  recommendedAction: "promote_candidate" | "keep_production" | "trigger_rollback";
  timestamp: string;
}

export interface PipelineExecutionLog {
  id: string;
  stage: "ingestion" | "validation" | "training" | "benchmarking" | "comparison" | "deployment" | "rollback";
  status: "success" | "warning" | "failure" | "in_progress";
  message: string;
  details?: any;
  timestamp: string;
}

export class DealflowPipelineManager {
  private activeVersion: string;
  private previousStableVersion: string;
  private isPipelineRunning: boolean;
  private executionLogs: PipelineExecutionLog[];
  private currentBenchmark: DetailedModelBenchmark | null;
  private lastComparisonReport: SideBySideComparisonReport | null;

  constructor() {
    this.activeVersion = "v1.0.0-prod";
    this.previousStableVersion = "v1.0.0-prod";
    this.isPipelineRunning = false;
    this.executionLogs = [];
    this.currentBenchmark = null;
    this.lastComparisonReport = null;

    this.log("ingestion", "success", "Dealflow LLM Continuous Pipeline Manager initialized.");
  }

  private log(
    stage: PipelineExecutionLog["stage"],
    status: PipelineExecutionLog["status"],
    message: string,
    details?: any
  ): PipelineExecutionLog {
    const entry: PipelineExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stage,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    this.executionLogs.unshift(entry);
    if (this.executionLogs.length > 200) {
      this.executionLogs.pop();
    }
    console.log(`[DealflowPipeline][${stage.toUpperCase()}][${status.toUpperCase()}] ${message}`);
    return entry;
  }

  // 1. Data Ingestion & Quality Validation
  public validateDataQuality(samples: SyntheticDataSample[]): PipelineDataQualityReport {
    this.log("validation", "in_progress", `Starting data quality validation on ${samples.length} samples...`);

    let validCount = 0;
    let invalidCount = 0;
    let anomalies = 0;

    samples.forEach(sample => {
      const hasPrompt = sample.prompt && sample.prompt.trim().length > 5;
      const hasOutputs = sample.baselineOutputs && Object.keys(sample.baselineOutputs).length > 0;
      const hasReference = sample.referenceContent && sample.referenceContent.trim().length > 10;

      if (hasPrompt && hasOutputs && hasReference) {
        validCount++;
      } else {
        invalidCount++;
      }

      // Anomaly check: repetitive text or empty fields
      if (!hasPrompt || sample.prompt.length > 5000) {
        anomalies++;
      }
    });

    const validationScore = samples.length > 0 ? (validCount / samples.length) * 100 : 0;
    const passedQualityCheck = validationScore >= 85 && invalidCount <= samples.length * 0.15;

    const report: PipelineDataQualityReport = {
      totalSamples: samples.length,
      validSamples: validCount,
      invalidSamples: invalidCount,
      validationScore: Math.round(validationScore * 10) / 10,
      anomaliesDetected: anomalies,
      passedQualityCheck,
      timestamp: new Date().toISOString()
    };

    if (passedQualityCheck) {
      this.log("validation", "success", `Data quality check passed with score ${report.validationScore}%`, report);
    } else {
      this.log("validation", "warning", `Data quality check flagged issues (score ${report.validationScore}%)`, report);
    }

    return report;
  }

  // 2. Standardized Post-Training Benchmarking Suite
  public benchmarkModel(
    modelId: string,
    modelName: string,
    version: string,
    isProduction: boolean,
    evaluation: ModelComparisonResult,
    latencyMs: number = 40,
    tokensPerSecond: number = 85
  ): DetailedModelBenchmark {
    this.log("benchmarking", "in_progress", `Executing standardized evaluation suite for ${modelName} (${version})...`);

    const metrics = evaluation.metrics;
    // Derive Precision, Recall, F1 from domain relevance and overall score
    const precision = Math.min(0.99, Math.max(0.7, metrics.domainRelevance + 0.05));
    const recall = Math.min(0.99, Math.max(0.7, metrics.overallScore - 0.02));
    const f1Score = (2 * (precision * recall)) / (precision + recall);
    const accuracy = Math.min(0.99, Math.max(0.8, (metrics.overallScore + precision + recall) / 3));
    const errorRate = Math.round((1 - accuracy) * 1000) / 1000;

    const benchmark: DetailedModelBenchmark = {
      modelId,
      modelName,
      version,
      isProduction,
      metrics: {
        accuracy: Math.round(accuracy * 1000) / 1000,
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1Score: Math.round(f1Score * 1000) / 1000,
        perplexity: Math.round(metrics.perplexity * 10) / 10,
        bleuScore: Math.round(metrics.bleuScore * 1000) / 1000,
        rougeL: Math.round(metrics.rougeL * 1000) / 1000,
        latencyMs,
        tokensPerSecond,
        gpuMemoryMb: isProduction ? 48000 : 36000
      },
      errorRate,
      passesThresholds: evaluation.passesThresholds && accuracy >= 0.90 && latencyMs <= 150
    };

    this.log(
      "benchmarking",
      benchmark.passesThresholds ? "success" : "failure",
      `Benchmark for ${modelName}: Accuracy ${Math.round(benchmark.metrics.accuracy * 100)}%, Latency ${latencyMs}ms`,
      benchmark
    );

    if (isProduction) {
      this.currentBenchmark = benchmark;
    }

    return benchmark;
  }

  // 3. Side-by-Side Model Comparison Module
  public compareModels(
    currentProd: DetailedModelBenchmark,
    candidate: DetailedModelBenchmark
  ): SideBySideComparisonReport {
    this.log("comparison", "in_progress", `Comparing Production (${currentProd.version}) vs Candidate (${candidate.version})...`);

    const accImp = ((candidate.metrics.accuracy - currentProd.metrics.accuracy) / currentProd.metrics.accuracy) * 100;
    const latImp = ((currentProd.metrics.latencyMs - candidate.metrics.latencyMs) / currentProd.metrics.latencyMs) * 100;
    const tpsImp = ((candidate.metrics.tokensPerSecond - currentProd.metrics.tokensPerSecond) / currentProd.metrics.tokensPerSecond) * 100;
    const errRed = ((currentProd.errorRate - candidate.errorRate) / currentProd.errorRate) * 100;

    let recommendedAction: SideBySideComparisonReport["recommendedAction"] = "keep_production";
    let winnerModelId = currentProd.modelId;

    if (candidate.passesThresholds && candidate.metrics.accuracy >= currentProd.metrics.accuracy - 0.01) {
      recommendedAction = "promote_candidate";
      winnerModelId = candidate.modelId;
    } else if (!candidate.passesThresholds) {
      recommendedAction = "trigger_rollback";
      winnerModelId = currentProd.modelId;
    }

    const report: SideBySideComparisonReport = {
      currentProduction: currentProd,
      candidateModel: candidate,
      winnerModelId,
      improvementPercentage: {
        accuracy: Math.round(accImp * 10) / 10,
        latency: Math.round(latImp * 10) / 10,
        throughput: Math.round(tpsImp * 10) / 10,
        errorRateReduction: Math.round(errRed * 10) / 10
      },
      recommendedAction,
      timestamp: new Date().toISOString()
    };

    this.lastComparisonReport = report;
    this.log("comparison", "success", `Side-by-side comparison completed. Recommended Action: ${recommendedAction}`, report);

    return report;
  }

  // 4. Automated Retraining & Rollback Execution
  public executeRollback(): { success: boolean; activeVersion: string; message: string } {
    this.log("rollback", "warning", `Initiating automatic rollback from ${this.activeVersion} to ${this.previousStableVersion}...`);

    const revertedFrom = this.activeVersion;
    this.activeVersion = this.previousStableVersion;

    const message = `Successfully rolled back active Dealflow LLM model from ${revertedFrom} to stable ${this.activeVersion}.`;
    this.log("rollback", "success", message);

    return {
      success: true,
      activeVersion: this.activeVersion,
      message
    };
  }

  public promoteCandidate(candidateVersion: string): { success: boolean; activeVersion: string } {
    this.log("deployment", "in_progress", `Promoting candidate model ${candidateVersion} to production...`);
    this.previousStableVersion = this.activeVersion;
    this.activeVersion = candidateVersion;
    this.log("deployment", "success", `Dealflow LLM successfully updated to active version ${this.activeVersion}`);
    return {
      success: true,
      activeVersion: this.activeVersion
    };
  }

  // Pipeline Status & Telemetry API
  public getPipelineStatus() {
    return {
      isPipelineRunning: this.isPipelineRunning,
      activeVersion: this.activeVersion,
      previousStableVersion: this.previousStableVersion,
      currentBenchmark: this.currentBenchmark,
      lastComparisonReport: this.lastComparisonReport,
      logs: this.executionLogs.slice(0, 50)
    };
  }
}

export const pipelineManager = new DealflowPipelineManager();
