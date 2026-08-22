// app/api/portal/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { CustomerAccountOption } from "@/lib/customer-accounts";

// In-Memory fallback store for live session customer records
const inMemoryCustomers: CustomerAccountOption[] = [];

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (db) {
      try {
        const snap = await db.collection("customers").get();
        if (!snap.empty) {
          const dbCustomers: CustomerAccountOption[] = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.contactName || "Customer Account",
              companyName: data.companyName || data.company || "Enterprise Company",
              email: data.email || "",
              industry: data.industry || "Enterprise SaaS",
              status: data.status || "active",
            };
          });

          // Merge db customers with in-memory ones without duplicates
          const customerMap = new Map<string, CustomerAccountOption>();
          inMemoryCustomers.forEach(c => customerMap.set(c.id, c));
          dbCustomers.forEach(c => customerMap.set(c.id, c));

          return NextResponse.json({
            success: true,
            customers: Array.from(customerMap.values()),
          });
        }
      } catch (dbErr) {
        console.warn("[CustomersAPI] Firestore read warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      customers: inMemoryCustomers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, companyName, email, industry, phone, plan } = body;

    // Strict Field Validations
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

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newCustomer: CustomerAccountOption = {
      id: customerId,
      name: name.trim(),
      companyName: companyName.trim(),
      email: email ? email.trim() : `admin@${companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      industry: industry || "Enterprise SaaS",
      status: "active",
    };

    // Save to in-memory store immediately
    inMemoryCustomers.unshift(newCustomer);

    // Save to Firestore if available
    const db = getDb();
    if (db) {
      try {
        await db.collection("customers").doc(customerId).set({
          id: customerId,
          name: newCustomer.name,
          contactName: newCustomer.name,
          company: newCustomer.companyName,
          companyName: newCustomer.companyName,
          email: newCustomer.email,
          industry: newCustomer.industry,
          phone: phone || "",
          plan: plan || "Enterprise Pilot",
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      } catch (dbErr) {
        console.warn("[CustomersAPI] Firestore save warning (in-memory preserved):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Customer account '${newCustomer.companyName}' created successfully.`,
      customer: newCustomer,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer account" },
      { status: 500 }
    );
  }
}
