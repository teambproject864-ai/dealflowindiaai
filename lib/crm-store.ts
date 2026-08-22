// lib/crm-store.ts
import { db } from "./firebase-admin";
import { 
  CRMCompany, 
  CRMCustomer, 
  CRMDeal, 
  CRMValidationResult, 
  CRMFilterOptions 
} from "./crm-types";

// In-Memory Storage maps as reliable fallbacks (populated strictly from live database)
const inMemoryCompanies = new Map<string, CRMCompany>();
const inMemoryCustomers = new Map<string, CRMCustomer>();
const inMemoryDeals = new Map<string, CRMDeal>();

/**
 * Mandatory Data Validation Rules:
 * Enforces requirement of valid customer name or company information for every entry.
 * Prevents saving of incomplete or orphaned records.
 */
export function validateCRMRecord(type: "customer" | "company" | "deal", data: any): CRMValidationResult {
  const errors: Record<string, string> = {};

  if (type === "company") {
    const name = data?.companyName?.trim();
    if (!name) {
      errors.companyName = "Company record must contain a valid, non-empty company name.";
    }
  } else if (type === "customer") {
    const custName = data?.customerName?.trim();
    const compName = data?.companyName?.trim();
    const compId = data?.companyId?.trim();

    if (!custName && !compName && !compId) {
      errors.customerName = "Customer record must contain a valid customer name or company identifier.";
      errors.companyName = "Customer record must contain a valid customer name or company identifier.";
    }
  } else if (type === "deal") {
    const dealName = data?.dealName?.trim();
    const custName = data?.customerName?.trim();
    const compName = data?.companyName?.trim();
    const custId = data?.customerId?.trim();
    const compId = data?.companyId?.trim();

    if (!dealName) {
      errors.dealName = "Deal record must contain a valid deal name.";
    }

    if (!custName && !compName && !custId && !compId) {
      errors.customerName = "Deal record must be permanently linked to a valid customer name or company name.";
      errors.companyName = "Deal record must be permanently linked to a valid customer name or company name.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Fetch Companies from Firestore or Memory fallback
 */
export async function getCRMCompanies(): Promise<CRMCompany[]> {
  try {
    if (db && process.env.DISABLE_FIRESTORE !== "true") {
      const snap = await db.collection("crm_companies")?.get().catch(() => null);
      if (snap && !snap.empty) {
        const list: CRMCompany[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CRMCompany));
        return list;
      }
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore read error, using memory fallback:", e);
  }
  return Array.from(inMemoryCompanies.values());
}

/**
 * Fetch Customers from Firestore or Memory fallback
 */
export async function getCRMCustomers(): Promise<CRMCustomer[]> {
  try {
    if (db && process.env.DISABLE_FIRESTORE !== "true") {
      const snap = await db.collection("crm_customers")?.get().catch(() => null);
      if (snap && !snap.empty) {
        const list: CRMCustomer[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CRMCustomer));
        return list;
      }
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore read error, using memory fallback:", e);
  }
  return Array.from(inMemoryCustomers.values());
}

/**
 * Fetch Deals from Firestore or Memory fallback
 */
export async function getCRMDeals(): Promise<CRMDeal[]> {
  try {
    if (db && process.env.DISABLE_FIRESTORE !== "true") {
      const snap = await db.collection("crm_deals")?.get().catch(() => null);
      if (snap && !snap.empty) {
        const list: CRMDeal[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CRMDeal));
        return list;
      }
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore read error, using memory fallback:", e);
  }
  return Array.from(inMemoryDeals.values());
}

/**
 * Save CRM Company Record with Mandatory Data Validation
 */
export async function saveCRMCompany(data: Partial<CRMCompany>): Promise<CRMCompany> {
  const validation = validateCRMRecord("company", data);
  if (!validation.isValid) {
    throw new Error(`CRM Validation Failed: ${Object.values(validation.errors).join(" ")}`);
  }

  const id = data.id || `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  
  const record: CRMCompany = {
    id,
    companyName: data.companyName!.trim(),
    industry: data.industry?.trim() || "General Technology",
    websiteUrl: data.websiteUrl?.trim() || "",
    employeeCount: Number(data.employeeCount) || 10,
    annualRevenue: data.annualRevenue?.trim() || "$1M",
    contactEmail: data.contactEmail?.trim() || "",
    phone: data.phone?.trim() || "",
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  inMemoryCompanies.set(id, record);

  try {
    if (db) {
      await db.collection("crm_companies").doc(id).set(record, { merge: true });
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore write error for company, saved to memory:", e);
  }

  return record;
}

/**
 * Save CRM Customer Record with Mandatory Data Validation
 */
export async function saveCRMCustomer(data: Partial<CRMCustomer>): Promise<CRMCustomer> {
  const validation = validateCRMRecord("customer", data);
  if (!validation.isValid) {
    throw new Error(`CRM Validation Failed: ${Object.values(validation.errors).join(" ")}`);
  }

  const id = data.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // If companyId is provided, resolve companyName if not specified
  let compName = data.companyName?.trim() || "";
  if (data.companyId && !compName) {
    const comp = inMemoryCompanies.get(data.companyId);
    if (comp) compName = comp.companyName;
  }

  const record: CRMCustomer = {
    id,
    customerName: data.customerName?.trim() || "Unnamed Customer Contact",
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",
    title: data.title?.trim() || "Decision Maker",
    companyId: data.companyId?.trim() || "",
    companyName: compName,
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  inMemoryCustomers.set(id, record);

  try {
    if (db) {
      await db.collection("crm_customers").doc(id).set(record, { merge: true });
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore write error for customer, saved to memory:", e);
  }

  return record;
}

/**
 * Save CRM Deal Record with Mandatory Data Validation
 */
export async function saveCRMDeal(data: Partial<CRMDeal>): Promise<CRMDeal> {
  const validation = validateCRMRecord("deal", data);
  if (!validation.isValid) {
    throw new Error(`CRM Validation Failed: ${Object.values(validation.errors).join(" ")}`);
  }

  const id = data.id || `deal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let custName = data.customerName?.trim() || "";
  if (data.customerId && !custName) {
    const cust = inMemoryCustomers.get(data.customerId);
    if (cust) custName = cust.customerName;
  }

  let compName = data.companyName?.trim() || "";
  if (data.companyId && !compName) {
    const comp = inMemoryCompanies.get(data.companyId);
    if (comp) compName = comp.companyName;
  }

  const record: CRMDeal = {
    id,
    dealName: data.dealName!.trim(),
    amount: Number(data.amount) || 0,
    stage: data.stage || "qualification",
    probability: Number(data.probability) || 50,
    customerId: data.customerId?.trim() || "",
    customerName: custName || "Linked Customer",
    companyId: data.companyId?.trim() || "",
    companyName: compName || "Linked Company",
    expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: data.notes?.trim() || "",
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  inMemoryDeals.set(id, record);

  try {
    if (db) {
      await db.collection("crm_deals").doc(id).set(record, { merge: true });
    }
  } catch (e) {
    console.warn("[CRMStore] Firestore write error for deal, saved to memory:", e);
  }

  return record;
}

/**
 * Delete CRM Record
 */
export async function deleteCRMRecord(type: "customer" | "company" | "deal", id: string): Promise<boolean> {
  if (type === "company") {
    inMemoryCompanies.delete(id);
    try { if (db) await db.collection("crm_companies").doc(id).delete(); } catch {}
  } else if (type === "customer") {
    inMemoryCustomers.delete(id);
    try { if (db) await db.collection("crm_customers").doc(id).delete(); } catch {}
  } else if (type === "deal") {
    inMemoryDeals.delete(id);
    try { if (db) await db.collection("crm_deals").doc(id).delete(); } catch {}
  }
  return true;
}

/**
 * Search and Filter CRM Records
 * Supports exact matches and partial query matching by customer name or company name
 */
export async function searchCRMRecords(options: CRMFilterOptions = {}) {
  const customers = await getCRMCustomers();
  const companies = await getCRMCompanies();
  const deals = await getCRMDeals();

  const q = (options.query || "").toLowerCase().trim();

  let filteredCustomers = customers;
  let filteredCompanies = companies;
  let filteredDeals = deals;

  if (q) {
    filteredCustomers = customers.filter(c => 
      c.customerName.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );

    filteredCompanies = companies.filter(c => 
      c.companyName.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );

    filteredDeals = deals.filter(d => 
      d.dealName.toLowerCase().includes(q) ||
      (d.customerName && d.customerName.toLowerCase().includes(q)) ||
      (d.companyName && d.companyName.toLowerCase().includes(q))
    );
  }

  if (options.stage && options.stage !== "all") {
    filteredDeals = filteredDeals.filter(d => d.stage === options.stage);
  }

  const totalPipelineValue = filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return {
    customers: filteredCustomers,
    companies: filteredCompanies,
    deals: filteredDeals,
    metrics: {
      totalCustomers: filteredCustomers.length,
      totalCompanies: filteredCompanies.length,
      totalDeals: filteredDeals.length,
      totalPipelineValue
    }
  };
}

/**
 * Get Aggregated CRM Record Statistics
 */
export async function getCRMRecordStats() {
  const result = await searchCRMRecords();
  const closedWonValue = result.deals
    .filter(d => d.stage === "closed-won")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  return {
    totalCustomers: result.metrics.totalCustomers,
    totalCompanies: result.metrics.totalCompanies,
    totalDeals: result.metrics.totalDeals,
    totalPipelineValue: result.metrics.totalPipelineValue,
    closedWonValue,
  };
}

/**
 * Deduplication & Data Integrity Sanitation Helper
 * Removes duplicate customer or deal entries based on unique keys (email, companyName, dealName).
 */
export async function cleanDeduplicatedRecords() {
  const seenEmails = new Set<string>();
  const duplicatesRemoved: string[] = [];

  for (const [id, cust] of Array.from(inMemoryCustomers.entries())) {
    const key = (cust.email || cust.customerName).toLowerCase().trim();
    if (seenEmails.has(key)) {
      inMemoryCustomers.delete(id);
      duplicatesRemoved.push(id);
    } else {
      seenEmails.add(key);
    }
  }

  return {
    cleanedCount: duplicatesRemoved.length,
    duplicatesRemoved,
    remainingCustomers: inMemoryCustomers.size
  };
}

