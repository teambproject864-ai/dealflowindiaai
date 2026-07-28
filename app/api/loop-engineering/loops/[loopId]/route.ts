
import { NextRequest, NextResponse } from "next/server";
import { LoopEngine } from "@/lib/loop-engineering";
import { KimiClient } from "@/lib/kimi";

let loopEngine: LoopEngine | null = null;

function getLoopEngine(): LoopEngine {
  if (!loopEngine) {
    const kimiClient = new KimiClient();
    loopEngine = new LoopEngine(kimiClient);
  }
  return loopEngine;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loopId: string }> }
) {
  try {
    const { loopId } = await params;
    const engine = getLoopEngine();
    const loop = engine.getLoop(loopId);

    if (!loop) {
      return NextResponse.json({ error: "Loop not found" }, { status: 404 });
    }

    return NextResponse.json(loop);
  } catch (error) {
    console.error("Error fetching loop:", error);
    return NextResponse.json({ error: "Failed to fetch loop" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loopId: string }> }
) {
  try {
    const { loopId } = await params;
    const engine = getLoopEngine();
    const body = await request.json();

    if (body.action === "start") {
      const loop = await engine.startLoop(loopId);
      return NextResponse.json(loop);
    } else if (body.action === "pause") {
      engine.pauseLoop(loopId);
      return NextResponse.json({ message: "Loop paused" });
    } else if (body.action === "resume") {
      const loop = await engine.resumeLoop(loopId);
      if (loop) {
        return NextResponse.json(loop);
      } else {
        return NextResponse.json({ error: "Loop not found" }, { status: 404 });
      }
    } else if (body.action === "add-feedback") {
      engine.addFeedback(loopId, body.feedback);
      return NextResponse.json({ message: "Feedback added" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with loop operation:", error);
    return NextResponse.json({ error: "Failed to perform loop operation" }, { status: 500 });
  }
}

