import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getInMemoryLeads, getInMemoryAnalyses } from "@/lib/memory-storage";
import { ExtendedLeadRecord } from "@/lib/types";
import { checkRateLimitSensitive } from "@/lib/rate-limiter-middleware";
import { db } from "@/lib/firebase-admin";
import { encryptLead, decryptLead } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit-logger";
import { terminateLLMJobsForAnalysis } from "@/lib/llm-job-tracker";
import { cached, invalidateCache } from "@/lib/cache";
import { taskQueue } from "@/lib/task-queue";
import { perf } from "@/lib/performance";
import { resolveLeadRecord } from "@/lib/lead-resolver";
import { initializeIntegratedSystem } from "@/lib/integrated-system";
import { TaskStatus } from "@/lib/unified-orchestrator/types";

export const maxDuration = 120; // Extended from 60 to allow more time
export const dynamic = "force-dynamic";

const inMemoryLeads = getInMemoryLeads();
const inMemoryAnalyses = getInMemoryAnalyses();

// Performance monitoring store
interface AnalysisPerformanceEntry {
  id?: string;
  analysisId: string;
  startTime: number;
  durationMs: number;
  success: boolean;
  modelUsed?: string;
  createdAt?: string;
}

// Endpoint to get performance metrics
export async function GET() {
  let metrics: AnalysisPerformanceEntry[] = [];
  let total = 0;
  let successCount = 0;
  let totalDuration = 0;

  try {
    if (db) {
      const snap = await db.collection("analysis_metrics")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
      metrics = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnalysisPerformanceEntry));
      
      total = metrics.length;
      successCount = metrics.filter(m => m.success).length;
      totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);
    }
  } catch (err) {
    console.error("[GET /api/analyze] Failed to load metrics", err);
  }

  return NextResponse.json({
    success: true,
    metrics, // Last 100 entries
    stats: {
      total,
      successCount,
      avgDurationMs: total > 0 
        ? Math.round(totalDuration / total) 
        : 0
    }
  });
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let success = false;
  let analysisId: string | undefined;

  // Check rate limit first
  const rateLimitResponse = await checkRateLimitSensitive(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    console.log("[analyze/route] Starting analysis request...");
    const { leadId, companyData: providedData, regenerate, feedback } = await req.json();

    // Generate analysis ID early to track LLM jobs
    analysisId = uuidv4();

    let companyData = providedData;
    if (!companyData && leadId) {
      companyData = (await resolveLeadRecord(leadId)) as any;
      if (!companyData) {
        return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
      }
    }

    if (!companyData?.websiteUrl) {
      return NextResponse.json(
        { success: false, error: "Company website URL is required for GTM analysis" },
        { status: 400 }
      );
    }

    // Add analysisId, regenerate, and feedback to companyData so it's available in analysisGraph
    const companyDataWithAnalysisId = { 
      ...companyData, 
      analysisId,
      regenerate,
      feedback: feedback || companyData?.feedback || ""
    };

    console.log("[analyze/route] Dispatching task to Vexa agent via orchestrator...");
    const gtmResult = await perf.measure("gtmAgentWorkflow", async () => {
      const { orchestrator } = initializeIntegratedSystem();
      
      const task = orchestrator.createTask({
        type: "process_intake_form",
        input: {
          formData: companyDataWithAnalysisId,
          leadId: leadId || "unauth-analysis",
        },
        priority: "high",
        tags: ["gtm_analysis", "playbook"],
        metadata: { analysisId },
      });

      // Poll orchestrator for task completion
      const timeoutMs = 80000; // 80 seconds max
      const startMs = Date.now();
      let polledTask = orchestrator.getTask(task.id);

      while (
        polledTask &&
        polledTask.status !== TaskStatus.COMPLETED &&
        polledTask.status !== TaskStatus.FAILED &&
        polledTask.status !== TaskStatus.CANCELLED
      ) {
        if (Date.now() - startMs > timeoutMs) {
          throw new Error("GTM agent workflow timed out");
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        polledTask = orchestrator.getTask(task.id);
      }

      if (!polledTask || polledTask.status === TaskStatus.FAILED) {
        throw new Error(polledTask?.error || "GTM agent workflow failed");
      }

      return polledTask.result;
    }, { companyName: companyData.companyName });

    if (!gtmResult || !gtmResult.gtmAnalysis || !gtmResult.playbook) {
      throw new Error("Failed to receive completed report from Vexa agent");
    }

    // Merge GTM Analysis and Strategic Playbook outputs
    const analysis = {
      ...gtmResult.gtmAnalysis,
      ...gtmResult.playbook,
    };
    success = true;

    const analysisRecord = {
      id: analysisId,
      leadId,
      companyName: companyData.companyName || null,
      feedback: feedback || companyData?.feedback || null,
      ...analysis,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore asynchronously
    if (db && analysisId) {
      const safeDb = db;
      const safeAnalysisId = analysisId;
      taskQueue.addTask("save-analysis", async () => {
        if (safeDb && safeAnalysisId) {
          await safeDb.collection("analyses").doc(safeAnalysisId).set(analysisRecord);
          console.log(`[TaskQueue] Saved analysis ${safeAnalysisId} to Firestore`);
          invalidateCache(`analysis:${safeAnalysisId}`);
        }
      });
    }
    
    // Log audit event asynchronously
    taskQueue.addTask("log-audit-event", async () => {
      await logAuditEvent(req, leadId || "unauth-analysis", "ANALYSIS_RUN", { analysisId, companyName: companyData.companyName });
    });
    
    inMemoryAnalyses.set(analysisId, analysisRecord);

    if (leadId) {
      let leadRecord = inMemoryLeads.get(leadId);
      if (!leadRecord && db) {
        const doc = await db.collection("leads").doc(leadId).get();
        if (doc.exists) {
          leadRecord = decryptLead(doc.data() as ExtendedLeadRecord);
        }
      }
      
      if (leadRecord) {
        const updatedLead = {
          ...leadRecord,
          analysisId,
        };
        if (db && analysisId) {
          const safeDb = db;
          const safeLeadId = leadId;
          const safeAnalysisId = analysisId;
          taskQueue.addTask("save-updated-lead", async () => {
            if (safeDb && safeLeadId && safeAnalysisId) {
              await safeDb.collection("leads").doc(safeLeadId).set(encryptLead(updatedLead));
              console.log(`[TaskQueue] Saved updated lead ${safeLeadId} to Firestore`);
              invalidateCache(`lead:${safeLeadId}`);
            }
          });
        }
        inMemoryLeads.set(leadId, updatedLead);
      }
    }

    console.log("[analyze/route] Analysis complete, returning response");
    return NextResponse.json({
      success: true,
      analysisId,
      leadId,
      companyName: companyData.companyName || null,
      ...analysis,
    });
  } catch (error) {
    console.error("[analyze/route] Error analyzing company:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze company";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    // Terminate all LLM jobs associated with this analysis, whether successful or failed
    if (analysisId) {
      try {
        console.log(`[analyze/route] Terminating LLM jobs for analysis ${analysisId}`);
        terminateLLMJobsForAnalysis(`gtm-analysis-${analysisId}`);
      } catch (terminateErr) {
        console.error(`[analyze/route] Failed to terminate LLM jobs for analysis ${analysisId}:`, terminateErr);
      }
    }

    // Record performance metrics
    const durationMs = Date.now() - startTime;
    console.log(`[analyze/route] Request complete. Duration: ${durationMs}ms, Success: ${success}`);
    
    if (analysisId) {
      const metricEntry: AnalysisPerformanceEntry = {
        analysisId,
        startTime,
        durationMs,
        success,
        createdAt: new Date().toISOString()
      };
      
      // Save to Firestore
      if (db) {
        try {
          await db.collection("analysis_metrics").doc(analysisId).set(metricEntry);
        } catch (err) {
          console.error("[analyze/route] Failed to save performance metric", err);
        }
      }
    }
  }
}
