import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, SALT_ROUNDS } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || searchParams.get("q") || "").toLowerCase().trim();
    const statusFilter = (searchParams.get("status") || "all").toLowerCase();
    const agentFilter = searchParams.get("agentId") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 50;

    let customersMap = new Map<string, any>();

    if (db) {
      // 1. Fetch from customers collection
      const custSnapshot = await db.collection("customers").get().catch(() => null);
      if (custSnapshot && !custSnapshot.empty) {
        custSnapshot.forEach((doc) => {
          const data = doc.data();
          customersMap.set(doc.id, { id: doc.id, ...data });
        });
      }

      // 2. Cross-check users collection with role="customer" to catch any newly registered users
      const usersSnapshot = await db.collection("users").where("role", "==", "customer").get().catch(() => null);
      if (usersSnapshot && !usersSnapshot.empty) {
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const existing = customersMap.get(doc.id) || {};
          customersMap.set(doc.id, {
            id: doc.id,
            name: existing.name || userData.name || userData.email?.split("@")[0] || "Customer",
            email: existing.email || userData.email,
            phone: existing.phone || userData.phoneNumber || "",
            companyName: existing.companyName || (userData.name ? `${userData.name}'s Org` : "Customer Org"),
            industry: existing.industry || "General",
            status: existing.status || (userData.isVerified ? "active" : "onboarding"),
            assignedAgentId: existing.assignedAgentId || "",
            assignedAgentName: existing.assignedAgentName || "",
            businessModel: existing.businessModel || "b2b",
            isVerified: userData.isVerified ?? existing.isVerified ?? true,
            serviceConfigurations: existing.serviceConfigurations || {
              gtmReports: true,
              leadScoring: true,
              aiCalls: true,
              wrenChatbot: true,
              automatedGtmAnalysis: true,
              playbookGeneration: true,
            },
            createdAt: existing.createdAt || userData.createdAt || new Date().toISOString(),
            updatedAt: existing.updatedAt || userData.updatedAt || new Date().toISOString(),
          });
        });
      }
    }

    let allCustomers = Array.from(customersMap.values());

    // Agent RBAC: Restrict agents to only see customers assigned to them
    if (user!.role === "agent") {
      allCustomers = allCustomers.filter(
        (c) => c.assignedAgentId === user!.id || c.assignedAgent?.agentId === user!.id
      );
    }

    // Filter by search query
    if (search) {
      allCustomers = allCustomers.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const company = (c.companyName || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        const industry = (c.industry || "").toLowerCase();
        return (
          name.includes(search) ||
          company.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          industry.includes(search)
        );
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      allCustomers = allCustomers.filter((c) => (c.status || "active").toLowerCase() === statusFilter);
    }

    // Filter by assigned agent
    if (agentFilter !== "all") {
      allCustomers = allCustomers.filter((c) => c.assignedAgentId === agentFilter);
    }

    // Sort by createdAt descending
    allCustomers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const totalCount = allCustomers.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = limitParam ? allCustomers.slice(startIndex, startIndex + limit) : allCustomers;

    return NextResponse.json({
      success: true,
      customers: paginatedCustomers,
      totalCount,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error("[admin-customers-get] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers list" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { action, customerId } = body;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    // 1. Onboard / Create New Customer
    if (action === "onboard" || action === "create") {
      if (user!.role !== "admin") {
        return NextResponse.json({ success: false, error: "Forbidden: Only admins can onboard new customers" }, { status: 403 });
      }
      const customerData = action === "onboard" ? body : body.customer;
      const {
        name,
        email,
        phone,
        companyName,
        industry,
        assignedAgentId,
        assignedAgentName,
        businessModel,
        serviceConfigurations,
        status = "active",
      } = customerData || body;

      const targetEmail = (email || "").toLowerCase().trim();
      const targetName = name?.trim();
      const targetCompany = companyName?.trim() || `${targetName}'s Org`;

      if (!targetEmail || !targetName) {
        return NextResponse.json(
          { success: false, error: "Name and email are required" },
          { status: 400 }
        );
      }

      // Check if user already exists
      const userSnap = await db.collection("users").where("email", "==", targetEmail).get();
      if (!userSnap.empty) {
        return NextResponse.json({ success: false, error: "A user with this email already exists" }, { status: 409 });
      }

      const newCustomerId = customerId || `customer-${Date.now()}`;
      const { randomBytes } = await import("crypto");
      const randomSecret = randomBytes(6).toString("hex");
      const defaultPassword = `Df#${randomSecret.slice(0, 4)}_${randomSecret.slice(4)}!9`;
      const hashedPassword = bcrypt.hashSync(defaultPassword, SALT_ROUNDS);
      const nowIso = new Date().toISOString();

      const customerUser = {
        id: newCustomerId,
        email: targetEmail,
        name: targetName,
        role: "customer" as const,
        hashedPassword,
        isVerified: true,
        phoneNumber: phone || "",
        createdAt: nowIso,
        updatedAt: nowIso,
        isActive: true,
      };

      const customerRecord = {
        id: newCustomerId,
        name: targetName,
        email: targetEmail,
        phone: phone || "",
        companyName: targetCompany,
        industry: industry || "Technology",
        status,
        assignedAgentId: assignedAgentId || "",
        assignedAgentName: assignedAgentName || "",
        businessModel: businessModel || "b2b",
        isVerified: true,
        serviceConfigurations: serviceConfigurations || {
          gtmReports: true,
          leadScoring: true,
          aiCalls: true,
          wrenChatbot: true,
          automatedGtmAnalysis: true,
          playbookGeneration: true,
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.collection("users").doc(newCustomerId).set(customerUser);
      await db.collection("customers").doc(newCustomerId).set(customerRecord);

      // Audit Log
      await db.collection("audit_logs").add({
        id: `audit-${Date.now()}`,
        actionType: "customer_onboard",
        actionDetails: `Onboarded customer: ${targetName} (${targetEmail}) - Org: ${targetCompany}`,
        performedBy: user!.id,
        performedByRole: user!.role,
        targetId: newCustomerId,
        targetType: "customer",
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: "Customer onboarded successfully",
        customer: customerRecord,
        defaultPassword,
      });
    }

    // 2. Update Customer Details / Business Model / Agent Assignment
    if (customerId) {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (body.name !== undefined) updateData.name = body.name;
      if (body.companyName !== undefined) updateData.companyName = body.companyName;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.industry !== undefined) updateData.industry = body.industry;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.businessModel !== undefined) updateData.businessModel = body.businessModel;
      if (body.assignedAgentId !== undefined) updateData.assignedAgentId = body.assignedAgentId;
      if (body.assignedAgentName !== undefined) updateData.assignedAgentName = body.assignedAgentName;
      if (body.serviceConfigurations !== undefined) updateData.serviceConfigurations = body.serviceConfigurations;

      await db.collection("customers").doc(customerId).set(updateData, { merge: true });
      if (body.name || body.phone) {
        const userUpdates: any = { updatedAt: new Date().toISOString() };
        if (body.name) userUpdates.name = body.name;
        if (body.phone) userUpdates.phoneNumber = body.phone;
        await db.collection("users").doc(customerId).set(userUpdates, { merge: true });
      }

      return NextResponse.json({
        success: true,
        message: "Customer updated successfully",
        customer: { id: customerId, ...updateData },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or missing customer ID" }, { status: 400 });
  } catch (error: any) {
    console.error("[admin-customers-post] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process customer request" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || searchParams.get("id");

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    await db.collection("customers").doc(customerId).delete().catch(() => null);
    await db.collection("users").doc(customerId).delete().catch(() => null);

    // Audit log
    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "customer_delete",
      actionDetails: `Admin deleted customer ID: ${customerId}`,
      performedBy: user!.id,
      performedByRole: user!.role,
      targetId: customerId,
      targetType: "customer",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("[admin-customers-delete] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
