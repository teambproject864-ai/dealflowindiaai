import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { demoCustomers } from "@/lib/portal-demo-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return errorResponse;

  const customerId = user!.id;

  try {
    let customer: any = null;

    if (db) {
      const doc = await db.collection("customers").doc(customerId).get().catch(() => null);
      if (doc && doc.exists) {
        customer = { id: doc.id, ...doc.data() };
      }
    }

    if (!customer) {
      // Fallback to demo data
      customer = demoCustomers.find((c) => c.id === customerId);
    }

    if (!customer) {
      // Return a basic mock customer matching credentials if not found
      customer = {
        id: customerId,
        name: user!.name,
        email: user!.email,
        companyName: "New Brand",
        status: "active",
        businessModel: "b2b",
        serviceConfigurations: { gtmReports: true },
      };
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("[customer-config-get] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load customer configuration" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return errorResponse;

  const customerId = user!.id;

  try {
    const body = await req.json();

    // Cross-customer data isolation check
    if (body.customerId && body.customerId !== user!.id && user!.role === "customer") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot modify another customer's data" },
        { status: 403 }
      );
    }

    const {

      businessModel,
      serviceConfigurations,
      companyName,
      industry,
      name,
      email,
      phone,
      targetAudience,
      businessGoals,
      marketingObjectives,
      brandTone,
      brandVoice,
      competitors,
      marketingChannels,
      keywords,
      geographicMarkets,
      customerJourneyStage,
      campaignStrategy
    } = body;

    let updatedData: any = {};
    if (businessModel) updatedData.businessModel = businessModel;
    if (serviceConfigurations) updatedData.serviceConfigurations = serviceConfigurations;
    if (companyName) updatedData.companyName = companyName;
    if (industry) updatedData.industry = industry;
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (phone) updatedData.phone = phone;
    
    if (targetAudience !== undefined) updatedData.targetAudience = targetAudience;
    if (businessGoals !== undefined) updatedData.businessGoals = businessGoals;
    if (marketingObjectives !== undefined) updatedData.marketingObjectives = marketingObjectives;
    if (brandTone !== undefined) updatedData.brandTone = brandTone;
    if (brandVoice !== undefined) updatedData.brandVoice = brandVoice;
    if (competitors !== undefined) updatedData.competitors = competitors;
    if (marketingChannels !== undefined) updatedData.marketingChannels = marketingChannels;
    if (keywords !== undefined) updatedData.keywords = keywords;
    if (geographicMarkets !== undefined) updatedData.geographicMarkets = geographicMarkets;
    if (customerJourneyStage !== undefined) updatedData.customerJourneyStage = customerJourneyStage;
    if (campaignStrategy !== undefined) updatedData.campaignStrategy = campaignStrategy;

    updatedData.updatedAt = new Date().toISOString();

    // 1. Update Firestore
    if (db) {
      await db.collection("customers").doc(customerId).set(updatedData, { merge: true });
    }

    // 2. Update demoCustomers in-memory
    const idx = demoCustomers.findIndex((c) => c.id === customerId);
    if (idx !== -1) {
      demoCustomers[idx] = {
        ...demoCustomers[idx],
        ...updatedData,
      };
    } else {
      // Add if missing
      demoCustomers.push({
        id: customerId,
        name: name || user!.name,
        email: email || user!.email,
        companyName: companyName || "New Brand",
        status: "active",
        serviceConfigurations: serviceConfigurations || { gtmReports: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessModel: businessModel || "b2b",
        ...updatedData,
      });
    }

    // Log the configuration change in audit logs if db is available
    if (db) {
      await db.collection("audit_logs").add({
        id: `audit-${Date.now()}`,
        actionType: "document_update",
        actionDetails: `Updated business model to ${businessModel} for customer ${customerId}`,
        performedBy: user!.id,
        performedByRole: user!.role,
        targetId: customerId,
        targetType: "customer",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Customer configuration updated successfully",
      customer: demoCustomers.find((c) => c.id === customerId) || updatedData,
    });
  } catch (error) {
    console.error("[customer-config-post] Error updating:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save customer configuration" },
      { status: 500 }
    );
  }
}
