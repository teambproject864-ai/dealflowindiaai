// app/api/whatsapp/integrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export interface WhatsAppConfiguredIntegration {
  id: string;
  name: string;
  gateway: "evolution" | "openwa";
  phoneNumber: string;
  status: "active" | "pending" | "inactive" | "disconnected";
  instanceName: string;
  dailyQuotaLimit: number;
  dailyQuotaUsed: number;
  lastSyncTimestamp: string;
  qrRequired: boolean;
  complianceHash: string;
  channelType: "outbound_bot" | "two_way_chat" | "meeting_reminders" | "backup_gateway";
  createdAt: string;
}

// In-Memory store for active session WhatsApp integrations
let CONFIGURED_INTEGRATIONS: WhatsAppConfiguredIntegration[] = [];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");
    const gatewayFilter = url.searchParams.get("gateway");

    const db = getDb();
    if (db) {
      try {
        const snap = await db.collection("whatsapp_integrations").get();
        if (!snap.empty) {
          const dbIntegrations: WhatsAppConfiguredIntegration[] = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "WhatsApp Integration",
              gateway: data.gateway || "evolution",
              phoneNumber: data.phoneNumber || "+1 (555) 000-0000",
              status: data.status || "active",
              instanceName: data.instanceName || doc.id,
              dailyQuotaLimit: data.dailyQuotaLimit || 5000,
              dailyQuotaUsed: data.dailyQuotaUsed || 0,
              lastSyncTimestamp: data.lastSyncTimestamp || new Date().toISOString(),
              qrRequired: !!data.qrRequired,
              complianceHash: data.complianceHash || "sha256-verified-integration",
              channelType: data.channelType || "two_way_chat",
              createdAt: data.createdAt || new Date().toISOString(),
            };
          });

          // Merge db items with in-memory store
          const map = new Map<string, WhatsAppConfiguredIntegration>();
          CONFIGURED_INTEGRATIONS.forEach(i => map.set(i.id, i));
          dbIntegrations.forEach(i => map.set(i.id, i));
          let all = Array.from(map.values());

          if (statusFilter && statusFilter !== "all") {
            all = all.filter(i => i.status === statusFilter);
          }
          if (gatewayFilter && gatewayFilter !== "all") {
            all = all.filter(i => i.gateway === gatewayFilter);
          }

          return NextResponse.json({
            success: true,
            integrations: all,
            totalCount: all.length,
            activeCount: all.filter(i => i.status === "active").length,
            pendingCount: all.filter(i => i.status === "pending").length,
            inactiveCount: all.filter(i => i.status === "inactive" || i.status === "disconnected").length,
          });
        }
      } catch (dbErr) {
        console.warn("[WhatsAppIntegrationsAPI] Firestore query warning:", dbErr);
      }
    }

    let result = [...CONFIGURED_INTEGRATIONS];
    if (statusFilter && statusFilter !== "all") {
      result = result.filter(i => i.status === statusFilter);
    }
    if (gatewayFilter && gatewayFilter !== "all") {
      result = result.filter(i => i.gateway === gatewayFilter);
    }

    return NextResponse.json({
      success: true,
      integrations: result,
      totalCount: result.length,
      activeCount: result.filter(i => i.status === "active").length,
      pendingCount: result.filter(i => i.status === "pending").length,
      inactiveCount: result.filter(i => i.status === "inactive" || i.status === "disconnected").length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load WhatsApp integrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gateway = "evolution", phoneNumber, channelType = "two_way_chat" } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Integration name and linked phone number are required." },
        { status: 400 }
      );
    }

    const id = `wa-int-${gateway}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newIntegration: WhatsAppConfiguredIntegration = {
      id,
      name: name.trim(),
      gateway,
      phoneNumber: phoneNumber.trim(),
      status: gateway === "openwa" ? "pending" : "active",
      instanceName: `dealflow-${gateway}-${Date.now().toString(36)}`,
      dailyQuotaLimit: gateway === "evolution" ? 10000 : 5000,
      dailyQuotaUsed: 0,
      lastSyncTimestamp: now,
      qrRequired: gateway === "openwa",
      complianceHash: `hash-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      channelType,
      createdAt: now,
    };

    CONFIGURED_INTEGRATIONS.unshift(newIntegration);

    const db = getDb();
    if (db) {
      try {
        await db.collection("whatsapp_integrations").doc(id).set(newIntegration);
      } catch (dbErr) {
        console.warn("[WhatsAppIntegrationsAPI] Firestore save warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp integration configured successfully.",
      integration: newIntegration,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create WhatsApp integration" },
      { status: 500 }
    );
  }
}
