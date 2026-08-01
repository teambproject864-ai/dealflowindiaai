import { NextResponse } from "next/server";
import {
  getInMemoryCustomerCredentials,
  getInMemoryLeads,
} from "@/lib/memory-storage";
import { CustomerCredentials, ExtendedLeadRecord } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth, hashPassword, NEW_CUSTOMERS, DEMO_CUSTOMERS } from "@/lib/auth";
import { encryptLead, decryptLead } from "@/lib/security";
import { getAgentByKey } from "@/lib/agent-assignment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Check rate limit first
  const rateLimitCheck = await checkRateLimit(req);
  if (!rateLimitCheck.allowed) {
    const headers = new Headers();
    if (rateLimitCheck.msBeforeNext) {
      headers.set('Retry-After', Math.ceil(rateLimitCheck.msBeforeNext / 1000).toString());
    }
    return NextResponse.json(
      { success: false, error: "Too many requests, please try again later" },
      { status: 429, headers }
    );
  }

  try {
    const body = await req.json();
    const { leadId, email, password } = body;

    // 1. Basic field presence checks
    if (!leadId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (leadId, email)" },
        { status: 400 }
      );
    }

    // 2. Email format validation
    const sanitizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // 3. Password presence & strength validation
    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Password must be at least 8 characters and include at least one letter, one number, and one special character" 
        },
        { status: 400 }
      );
    }

    // 4. Verify lead exists first
    const leadsMap = getInMemoryLeads();
    let lead: any = leadsMap.get(leadId);
    if (!lead && db) {
      const doc = await db.collection("leads").doc(leadId).get();
      if (doc.exists) {
        lead = decryptLead(doc.data() as ExtendedLeadRecord);
      }
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found for the provided ID" },
        { status: 404 }
      );
    }

    // 5. Duplicate Email Check
    let emailExists = false;
    if (db) {
      const snapshot = await db.collection("users").where("email", "==", sanitizedEmail).get();
      if (!snapshot.empty) {
        emailExists = true;
      }
    }
    if (!emailExists) {
      const credsMap = getInMemoryCustomerCredentials();
      const list = Array.from(credsMap.values());
      if (list.some(c => c.email.toLowerCase().trim() === sanitizedEmail)) {
        emailExists = true;
      }
    }
    if (!emailExists) {
      emailExists = [...DEMO_CUSTOMERS, ...NEW_CUSTOMERS].some(
        (c) => c.email.toLowerCase().trim() === sanitizedEmail
      );
    }

    if (emailExists) {
      return NextResponse.json(
        { success: false, error: "This email address is already registered" },
        { status: 409 }
      );
    }

    // 6. Generate Credentials & Hash Password
    const hashedPassword = await hashPassword(password);

    const customerId = `customer-${Date.now()}`;

    const credentials: CustomerCredentials & { customerId?: string } = {
      id: uuidv4(),
      leadId,
      customerId,
      email: sanitizedEmail,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    const credsMap = getInMemoryCustomerCredentials();
    credsMap.set(credentials.id, credentials);

    // Save to Firestore
    if (db) {
      await db.collection("customer_credentials").doc(credentials.id).set(credentials);
    }

    const newUser = {
      id: customerId,
      email: sanitizedEmail,
      hashedPassword,
      name: lead?.contactName || body.displayName || body.name || "Customer",
      role: "customer" as const,
      isVerified: true, // Mark verified explicitly for GTM assessment accounts
      isLocked: false,
      failedLoginAttempts: 0,
      passwordUpdatedAt: new Date().toISOString(),
      source: "gtm_assessment",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    // Save to in-memory list for test/local fallback auth
    NEW_CUSTOMERS.push(newUser);

    if (db) {
      await db.collection("users").doc(customerId).set(newUser);
      
      // Auto-link matching gtm_intakes for this email
      try {
        const intakesSnap = await db.collection("gtm_intakes").where("productOwnerEmail", "==", sanitizedEmail).get();
        if (intakesSnap && !intakesSnap.empty) {
          for (const intakeDoc of intakesSnap.docs) {
            await db.collection("gtm_intakes").doc(intakeDoc.id).update({ customerId }).catch(() => {});
          }
        }
      } catch (e) {}

      // Also create a customer record in the customers collection
      const agentProfile = lead?.assignedAgentKey ? getAgentByKey(lead.assignedAgentKey as any) : null;
      const customerRecord = {
        id: customerId,
        name: lead?.contactName || body.displayName || body.name || "Customer",
        email: sanitizedEmail,
        phone: lead?.contactPhone || "",
        companyName: lead?.companyName || "Company",
        industry: lead?.industry || (lead?.targetIndustries?.[0]) || "SaaS",
        status: "active",
        businessModel: lead?.businessModel || "b2b",
        assignedAgentId: lead?.assignedAgentKey ? `agent-${lead.assignedAgentKey}` : "",
        assignedAgentName: agentProfile ? agentProfile.name : "",
        personalIdentifiers: {
          fullName: lead?.contactName || body.displayName || body.name || "Customer",
          email: sanitizedEmail,
          phoneNumber: lead?.contactPhone || "",
        },
        companyInformation: {
          companyName: lead?.companyName || "Company",
          websiteUrl: lead?.websiteUrl || "https://example.com",
          industry: lead?.industry || (lead?.targetIndustries?.[0]) || "SaaS",
          companySize: (lead?.targetCompanySizes?.[0]) || "Mid-Market",
          headquarters: { country: lead?.headquartersCountry || "United States", city: lead?.headquartersCity || "" },
          businessModel: lead?.businessModel || "b2b",
          revenueRange: (lead?.targetRevenues?.[0]) || "$1M-$10M",
        },
        accountHistory: {
          status: "active",
          onboardedAt: new Date().toISOString(),
          totalInteractions: 0,
        },
        serviceConfigurations: {
          gtmReports: true,
          leadScoring: true,
          aiCalls: true,
        },
        icpCategory: lead?.icpCategory || "Enterprise SaaS Buyer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        intakeData: lead || {},
      };
      await db.collection("customers").doc(customerId).set(customerRecord);
    }

    if (lead) {
      const updatedLead = {
        ...lead,
        customerId,
        customerCredentialsId: credentials.id,
      };
      leadsMap.set(leadId, updatedLead);
      if (db) {
        await db.collection("leads").doc(leadId).set(encryptLead(updatedLead));
      }
    }

    return NextResponse.json({
      success: true,
      credentials: { ...credentials, passwordHash: undefined },
    });
  } catch (error) {
    console.error("[customer-credentials POST] failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create credentials" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const email = searchParams.get("email");

    // Public email availability check (used by registration modal before login)
    if (email && !leadId) {
      const sanitizedEmail = email.toLowerCase().trim();
      let emailExists = false;
      if (db) {
        const snapshot = await db.collection("users").where("email", "==", sanitizedEmail).get();
        if (!snapshot.empty) emailExists = true;
      }
      if (!emailExists) {
        const credsMap = getInMemoryCustomerCredentials();
        const list = Array.from(credsMap.values());
        if (list.some((c) => c.email.toLowerCase().trim() === sanitizedEmail)) {
          emailExists = true;
        }
      }
      if (!emailExists) {
        emailExists = [...DEMO_CUSTOMERS, ...NEW_CUSTOMERS].some(
          (c) => c.email.toLowerCase().trim() === sanitizedEmail
        );
      }
      return NextResponse.json({
        success: true,
        available: !emailExists,
        credentials: emailExists ? [{ email: sanitizedEmail }] : [],
      });
    }

    // Authenticated query for lead credentials
    const { errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;


    let creds: CustomerCredentials[] = [];

    // Retrieve from Firestore if available
    if (db) {
      let query: any = db.collection("customer_credentials");
      if (leadId) {
        query = query.where("leadId", "==", leadId);
      }
      if (email) {
        query = query.where("email", "==", email);
      }
      const snap = await query.get();
      snap.forEach((doc: any) => {
        creds.push(doc.data() as CustomerCredentials);
      });
    } else {
      creds = Array.from(getInMemoryCustomerCredentials().values());
      if (leadId) {
        creds = creds.filter(c => c.leadId === leadId);
      }
      if (email) {
        creds = creds.filter(c => c.email === email);
      }
    }

    // Return without password hash
    const sanitized = creds.map(c => ({ ...c, passwordHash: undefined }));
    return NextResponse.json({ success: true, credentials: sanitized });
  } catch (error) {
    console.error("[customer-credentials GET] failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}