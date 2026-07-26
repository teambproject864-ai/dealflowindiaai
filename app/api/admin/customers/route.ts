import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { demoCustomers } from "@/lib/portal-demo-data";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    let customers: any[] = [];
    let databaseHasData = false;

    if (db) {
      const snapshot = await db.collection("customers").get().catch(() => null);
      if (snapshot && !snapshot.empty) {
        databaseHasData = true;
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Restrict agent to only see assigned customers
          if (user!.role !== "agent" || data.assignedAgentId === user!.id || (data.assignedAgent && data.assignedAgent.agentId === user!.id)) {
            customers.push({ id: doc.id, ...data });
          }
        });
        // Sort by createdAt descending
        customers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    }

    // Fallback to demo customers ONLY if database is unconfigured or empty
    if (!databaseHasData) {
      if (user!.role === "agent") {
        const assigned = demoCustomers.filter(
          (c) => c.assignedAgentId === user!.id || (c as any).assignedAgent?.agentId === user!.id
        );
        customers = assigned;
      } else {
        customers = demoCustomers;
      }
    }

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("[admin-customers-get] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers list" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, customerId } = body;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    if (action === "onboard" || action === "create") {
      if (user!.role !== "admin") {
        return NextResponse.json({ success: false, error: "Forbidden: Only admins can onboard new customers" }, { status: 403 });
      }
      const customerData = action === "onboard" ? body : body.customer;
      const { name, email, phone, companyName, industry, assignedAgentId, assignedAgentName, businessModel, serviceConfigurations, status, personalIdentifiers, companyInformation, accountHistory } = customerData || body;

      const targetEmail = (personalIdentifiers?.email || email || "").toLowerCase();
      const targetName = personalIdentifiers?.fullName || name;
      const targetCompany = companyInformation?.companyName || companyName;

      if (!targetEmail || !targetName || !targetCompany) {
        return NextResponse.json(
          { success: false, error: "Name, email, and company name are required" },
          { status: 400 }
        );
      }

      // Check if user already exists
      const userSnap = await db.collection("users").where("email", "==", targetEmail).get();
      if (!userSnap.empty) {
        return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 409 });
      }

      const newCustomerId = customerId || `customer-${Date.now()}`;
      const defaultPassword = `Customer@${targetCompany.replace(/[^a-zA-Z0-9]/g, "") || "Brand"}!2026`;
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

      const customerUser = {
        id: newCustomerId,
        email: targetEmail,
        name: targetName,
        role: "customer",
        hashedPassword,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      // Construct proper nested ComprehensiveCustomer structure
      const customerRecord = {
        id: newCustomerId,
        personalIdentifiers: {
          fullName: targetName,
          email: targetEmail,
          phoneNumber: phone || personalIdentifiers?.phoneNumber || "",
        },
        companyInformation: {
          companyName: targetCompany,
          websiteUrl: companyInformation?.websiteUrl || "https://example.com",
          industry: industry || companyInformation?.industry || "SaaS",
          companySize: companyInformation?.companySize || "Mid-Market",
          headquarters: companyInformation?.headquarters || { country: "United States", city: "" },
          businessModel: businessModel || companyInformation?.businessModel || "b2b",
          revenueRange: companyInformation?.revenueRange || "$1M-$10M",
        },
        accountHistory: {
          status: status || accountHistory?.status || "onboarding",
          onboardedAt: accountHistory?.onboardedAt || new Date().toISOString(),
          totalInteractions: 0,
        },
        serviceConfigurations: serviceConfigurations || {},
        assignedAgentId: assignedAgentId || "",
        assignedAgentName: assignedAgentName || "",
        icpCategory: body.icpCategory || "Enterprise SaaS Buyer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("users").doc(newCustomerId).set(customerUser);
      await db.collection("customers").doc(newCustomerId).set(customerRecord);

      await db.collection("audit_logs").add({
        id: `audit-${Date.now()}`,
        actionType: "customer_onboard",
        actionDetails: `Admin onboarded new customer: ${targetName} (${targetCompany})`,
        performedBy: user!.id,
        performedByRole: user!.role,
        targetId: newCustomerId,
        targetType: "customer",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Customer onboarded successfully",
        customer: customerRecord,
        defaultPassword,
      });
    }

    // Default update behavior
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const customerDoc = await db.collection("customers").doc(customerId).get();
    if (!customerDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // If full nested structure is sent, save it
    const updateData = body.customer || body;
    delete updateData.id; // don't overwrite id in nested fields
    
    const finalUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await db.collection("customers").doc(customerId).set(finalUpdate, { merge: true });

    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "customer_edit",
      actionDetails: `Admin updated customer ${customerId} parameters.`,
      performedBy: user!.id,
      performedByRole: user!.role,
      targetId: customerId,
      targetType: "customer",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      customer: { id: customerId, ...customerDoc.data(), ...finalUpdate },
    });
  } catch (error) {
    console.error("[admin-customers-post] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update/onboard customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin"]);
  if (errorResponse) return errorResponse;

  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    // Delete customer doc and corresponding user credentials
    await db.collection("customers").doc(customerId).delete();
    await db.collection("users").doc(customerId).delete();

    // Log audit trail
    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "customer_delete",
      actionDetails: `Admin deleted customer ${customerId}`,
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
  } catch (error) {
    console.error("[admin-customers-delete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
