import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const DEFAULT_MAX_IMMEDIATE_CALLS = 3;

function parseMaxImmediateCalls() {
  const raw = process.env.MAX_IMMEDIATE_CALLS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_IMMEDIATE_CALLS;
  return Math.floor(parsed);
}

export async function GET() {
  try {
    const maxImmediateCalls = parseMaxImmediateCalls();
    if (!db) {
      return NextResponse.json({ available: true, activeCount: 0, maxAllowed: maxImmediateCalls });
    }

    const snapshot = await db
      .collection("calls")
      .where("status", "==", "in-progress")
      .limit(50)
      .get();

    const now = Date.now();
    const recentThresholdMs = now - 2 * 60 * 1000;
    const activeImmediateCount = snapshot.docs.reduce((count, doc) => {
      const data: any = doc.data();
      if (data.callMode !== "immediate") return count;
      const updatedAtMs = Number(data.updatedAtMs || 0);
      const createdAtMs =
        typeof data.createdAt?.toMillis === "function"
          ? data.createdAt.toMillis()
          : data.createdAt
            ? new Date(data.createdAt).getTime()
            : 0;
      const parsedUpdatedAtMs = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
      const lastSeenMs = updatedAtMs || parsedUpdatedAtMs || createdAtMs;
      if (lastSeenMs && lastSeenMs < recentThresholdMs) return count;
      return count + 1;
    }, 0);

    const available = activeImmediateCount < maxImmediateCalls;
    const estimatedWaitMinutes = available
      ? 0
      : Math.max(2, (activeImmediateCount - maxImmediateCalls + 1) * 4);

    return NextResponse.json({
      success: true,
      available,
      activeImmediateCount,
      maxImmediateCalls,
      estimatedWaitMinutes,
      message: available
        ? "AI specialist is available now."
        : "All specialists are currently busy. Please retry shortly.",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking immediate call availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
