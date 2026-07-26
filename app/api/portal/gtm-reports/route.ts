import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { seedFirestore } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await seedFirestore();

    let reports: any[] = [];
    if (db) {
      let queryRef: any = db.collection("gtm_reports");

      if (user.role === "customer") {
        queryRef = queryRef.where("customerId", "==", user.id);
      }

      const snap = await queryRef.orderBy("updatedAt", "desc").get().catch(() => null);
      if (snap && !snap.empty) {
        snap.forEach((doc: any) => {
          reports.push({ id: doc.id, ...doc.data() });
        });
      }
    }

    return NextResponse.json({ success: true, reports }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-gtm-reports-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role === "customer") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, customerId, reportName, category, status, region, segment, revenue, conversionRate, cac, ltv } = body;

    if (!customerId || !reportName) {
      return NextResponse.json({ success: false, error: "Customer ID and Report Name are required" }, { status: 400 });
    }

    const reportId = id || `gtm-${Date.now()}`;
    const reportData: any = {
      customerId,
      reportName,
      category: category || "General",
      status: status || "active",
      region: region || "All",
      segment: segment || "All",
      revenue: Number(revenue) || 0,
      conversionRate: Number(conversionRate) || 0,
      cac: Number(cac) || 0,
      ltv: Number(ltv) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (!id) {
      reportData.id = reportId;
      reportData.createdAt = new Date().toISOString();
    }

    await db.collection("gtm_reports").doc(reportId).set(reportData, { merge: true });

    return NextResponse.json({ success: true, report: { id: reportId, ...reportData } }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-gtm-reports-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save report" }, { status: 500 });
  }
}
