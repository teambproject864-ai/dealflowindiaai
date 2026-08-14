// app/api/community-mining/rules/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { dispatchNotification } from "@/lib/community-mining/router";
import type { CMRoutingRule, CMNotification } from "@/types/community-mining";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    let rules: CMRoutingRule[] = [];

    if (db) {
      const snap = await db.collection("cm_routing_rules").get();
      rules = snap.docs.map((d) => d.data() as CMRoutingRule);
    }

    if (rules.length === 0) {
      rules = [
        {
          id: "rule_product_bugs",
          name: "Product & Infrastructure Bugs → Engineering",
          keywords: ["bug", "crash", "error", "latency", "failure", "broken"],
          categories: ["product", "bug"],
          assignedTeam: "product",
          destinationChannel: "slack",
          destinationTarget: "https://hooks.slack.com/services/DEALFLOW/ENG/ALERTS",
          minSeverity: "high",
          enabled: true,
          alertOnThemeThreshold: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "rule_churn_risk",
          name: "High Churn & Cancellation Threats → Customer Success",
          keywords: ["churn", "cancel", "switch to", "unsubscribing", "leaving"],
          categories: ["cs", "churn risk"],
          assignedTeam: "cs",
          destinationChannel: "email",
          destinationTarget: "praneethb1909@gmail.com",
          minSeverity: "high",
          enabled: true,
          alertOnThemeThreshold: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "rule_pricing_sales",
          name: "Enterprise Inquiries & Pricing Pushback → Sales",
          keywords: ["pricing", "cost", "enterprise", "quote", "discount"],
          categories: ["sales", "pricing complaint"],
          assignedTeam: "sales",
          destinationChannel: "slack",
          destinationTarget: "https://hooks.slack.com/services/DEALFLOW/SALES/LEADS",
          minSeverity: "medium",
          enabled: true,
          alertOnThemeThreshold: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "rule_marketing_praise",
          name: "Customer Praise & Testimonials → Marketing",
          keywords: ["love", "amazing", "best", "great", "roi"],
          categories: ["marketing", "praise"],
          assignedTeam: "marketing",
          destinationChannel: "slack",
          destinationTarget: "https://hooks.slack.com/services/DEALFLOW/MKTG/SHOUTOUTS",
          minSeverity: "low",
          enabled: true,
          alertOnThemeThreshold: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch routing rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // Check if this is a test notification trigger action
    if (body.action === "test_dispatch") {
      const testNotif: CMNotification = {
        id: `test_${Date.now()}`,
        themeLabel: "TEST: Urgent Bug / Feature Request Escalation",
        summary: "This is a simulated verification ping from DealFlow AI Community Mining Routing Engine.",
        severity: body.severity || "high",
        destinationType: body.destinationChannel || "email",
        destination: body.destinationTarget || "praneethb1909@gmail.com",
        sampleQuotes: ["Simulated quote: The test verification ping was dispatched successfully."],
        deepLink: "https://dealflow.ai/agent-portal/community-mining",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const dispatchRes = await dispatchNotification(testNotif);
      return NextResponse.json({ success: dispatchRes.success, error: dispatchRes.error });
    }

    const { name, keywords, categories, assignedTeam, destinationChannel, destinationTarget, minSeverity, enabled, alertOnThemeThreshold } = body;

    if (!name || !destinationChannel || !destinationTarget) {
      return NextResponse.json(
        { success: false, error: "Missing required rule parameters: name, destinationChannel, destinationTarget" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const ruleId = body.id || `rule_${Date.now().toString(36)}`;

    const ruleObj: CMRoutingRule = {
      id: ruleId,
      name,
      keywords: Array.isArray(keywords) ? keywords : (keywords ? String(keywords).split(",").map((s) => s.trim()) : []),
      categories: Array.isArray(categories) ? categories : (categories ? String(categories).split(",").map((s) => s.trim()) : []),
      assignedTeam: assignedTeam || "product",
      destinationChannel: destinationChannel || "slack",
      destinationTarget: destinationTarget.trim(),
      minSeverity: minSeverity || "medium",
      enabled: enabled !== false,
      alertOnThemeThreshold: Number(alertOnThemeThreshold) || 1,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      await db.collection("cm_routing_rules").doc(ruleId).set(ruleObj, { merge: true });
    }

    return NextResponse.json({ success: true, rule: ruleObj });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save routing rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("id");

    if (!ruleId) {
      return NextResponse.json({ success: false, error: "Missing rule ID" }, { status: 400 });
    }

    if (db) {
      await db.collection("cm_routing_rules").doc(ruleId).delete();
    }

    return NextResponse.json({ success: true, deletedId: ruleId });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete routing rule" },
      { status: 500 }
    );
  }
}
