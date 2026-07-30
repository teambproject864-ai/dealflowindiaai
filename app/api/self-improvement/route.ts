// app/api/self-improvement/route.ts
import { NextResponse } from "next/server";
import {
  executeAutomatedSelfImprovementCycle,
  getRefinementHistory,
  ingestTrainingData
} from "@/lib/self-improvement/continuous-learning";
import { optimizeMAGMemoryEngine } from "@/lib/self-improvement/mag-optimizer";
import {
  getFeedbackQueue,
  recordExplicitFeedback,
  recordImplicitNegativeSignal
} from "@/lib/self-improvement/feedback-loop";
import { evaluateABTestExperiment } from "@/lib/self-improvement/ab-testing";

export async function GET(request: Request) {
  try {
    const refinementHistory = getRefinementHistory();
    const feedbackQueue = getFeedbackQueue();
    const abExperiment = evaluateABTestExperiment();

    return NextResponse.json({
      success: true,
      refinementHistory,
      feedbackQueue,
      abExperiment,
      automatedCycleConfig: {
        frequency: "Monthly",
        targetRecallImprovementPct: "30%",
        targetLatencyReductionPct: "20%",
        status: "ACTIVE"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch self-improvement data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "trigger_cycle";

    if (action === "trigger_cycle") {
      const run = await executeAutomatedSelfImprovementCycle();
      const magOpt = await optimizeMAGMemoryEngine();

      return NextResponse.json({
        success: true,
        message: "Automated self-improvement cycle and MAG memory optimization executed successfully.",
        refinementRun: run,
        magOptimizationStats: magOpt
      });
    }

    if (action === "submit_feedback") {
      const feedback = recordExplicitFeedback(
        body.sessionId || `sess_${Date.now()}`,
        body.rating || 5,
        body.feedbackText
      );

      // Ingest high-quality feedback into training pool
      if (body.rating >= 4 && body.promptText && body.agentResponseText) {
        ingestTrainingData({
          promptText: body.promptText,
          agentResponseText: body.agentResponseText,
          sessionId: body.sessionId || `sess_${Date.now()}`,
          csatScore: body.rating,
          hallucinationScore: 0.0
        });
      }

      return NextResponse.json({
        success: true,
        message: "User feedback recorded and queued for model refinement.",
        feedback
      });
    }

    if (action === "record_implicit_negative") {
      const signal = recordImplicitNegativeSignal(
        body.sessionId || `sess_${Date.now()}`,
        body.signalType || "REPHRASE_DETECTED",
        { rephraseCount: body.rephraseCount, sentimentScore: body.sentimentScore }
      );

      return NextResponse.json({
        success: true,
        message: "Implicit negative signal logged for priority model fine-tuning.",
        signal
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute self-improvement action" },
      { status: 500 }
    );
  }
}
