// app/api/portal/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CustomerStorageService } from "@/lib/customer-storage";

export const dynamic = "force-dynamic";

/**
 * GET: Lists all persistent customers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const agentKey = searchParams.get("agentKey") || searchParams.get("agentId") || undefined;

    const customers = await CustomerStorageService.getAllCustomers({
      search,
      agentKey,
    });

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error: any) {
    console.error("[CustomersAPI GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve customers from storage." },
      { status: 500 }
    );
  }
}

/**
 * POST: Creates and permanently stores a new customer account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, companyName, email, industry, phone, plan, assignedAgentKey, assignedAgentName, assignedAgentId } = body;

    // Strict Validations
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Customer Contact Name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Company Name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (email && typeof email === "string" && email.trim().length > 0) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: "Please provide a valid email address (e.g., name@company.com)." },
          { status: 400 }
        );
      }
    }

    const createdCustomer = await CustomerStorageService.createCustomer({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email ? email.trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      industry: industry ? String(industry).trim() : undefined,
      assignedAgentKey,
      assignedAgentName,
      assignedAgentId,
      plan,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Customer account '${createdCustomer.companyName}' created successfully.`,
        customer: createdCustomer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[CustomersAPI POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer account." },
      { status: error.message?.includes("required") || error.message?.includes("Invalid") ? 400 : 500 }
    );
  }
}

/**
 * PATCH: Updates or reassigns an existing customer account
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, companyName, email, phone, industry, status, assignedAgentKey, assignedAgentName, assignedAgentId } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Customer ID is required for updates." },
        { status: 400 }
      );
    }

    const updatedCustomer = await CustomerStorageService.updateCustomer(id, {
      name,
      companyName,
      email,
      phone,
      industry,
      status,
      assignedAgentKey,
      assignedAgentName,
      assignedAgentId,
    });

    return NextResponse.json({
      success: true,
      message: `Customer account '${updatedCustomer.companyName}' updated successfully.`,
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error("[CustomersAPI PATCH Error]:", error);
    const isNotFound = error.message?.includes("not found");
    const isValidation = error.message?.includes("required") || error.message?.includes("Invalid") || error.message?.includes("Unknown agent");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer account." },
      { status: isNotFound ? 404 : isValidation ? 400 : 500 }
    );
  }
}

/**
 * DELETE: Permanently deletes a customer account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // query param was primary
      }
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Customer ID is required for deletion." },
        { status: 400 }
      );
    }

    await CustomerStorageService.deleteCustomer(id);

    return NextResponse.json({
      success: true,
      message: `Customer account '${id}' deleted successfully.`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("[CustomersAPI DELETE Error]:", error);
    const isNotFound = error.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer account." },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
