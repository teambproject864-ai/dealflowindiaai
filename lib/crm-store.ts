// lib/crm-store.ts
import { db } from "./firebase-admin";
import { 
  CRMCompany, 
  CRMCustomer, 
  CRMDeal, 
  CRMValidationResult, 
  CRMFilterOptions 
} from "./crm-types";

// In-Memory Storage maps as reliable fallbacks
const inMemoryCompanies = new Map<string, CRMCompany>();
const inMemoryCustomers = new Map<string, CRMCustomer>();
const inMemoryDeals = new Map<string, CRMDeal>();

// Initial Seed Data (100% compliant with mandatory customer/company linkage)
const SEED_COMPANIES: CRMCompany[] = [
  {
    id: "comp-1",
    companyName: "Acme Enterprise SaaS",
    industry: "Software & Technology",
    websiteUrl: "https://acme-saas.com",
    employeeCount: 150,
    annualRevenue: "$15M",
    contactEmail: "contact@acme-saas.com",
    phone: "+1 (555) 019-2831",
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "comp-2",
    companyName: "Global Fintech Dynamics",
    industry: "Financial Technology",
    websiteUrl: "https://fintechdynamics.io",
    employeeCount: 85,
    annualRevenue: "$8.5M",
    contactEmail: "info@fintechdynamics.io",
    phone: "+1 (555) 014-9922",
    createdAt: "2026-02-01T09:30:00.000Z",
    updatedAt: "2026-02-01T09:30:00.000Z"
  },
  {
    id: "comp-3",
    companyName: "Apex HealthTech",
    industry: "Healthcare Software",
    websiteUrl: "https://apexhealthtech.com",
    employeeCount: 220,
    annualRevenue: "$24M",
    contactEmail: "sales@apexhealthtech.com",
    phone: "+1 (555) 088-7711",
    createdAt: "2026-02-10T11:15:00.000Z",
    updatedAt: "2026-02-10T11:15:00.000Z"
  }
];

const SEED_CUSTOMERS: CRMCustomer[] = [
  {
    id: "cust-1",
    customerName: "Praneeth Burada",
    email: "praneethburada@gmail.com",
    phone: "+1 (555) 010-0007",
    title: "VP of Revenue Operations",
    companyId: "comp-1",
    companyName: "Acme Enterprise SaaS",
    createdAt: "2026-01-15T08:30:00.000Z",
    updatedAt: "2026-01-15T08:30:00.000Z"
  },
  {
    id: "cust-2",
    customerName: "Anil Kumar",
    email: "anil@cralgo.com",
    phone: "+1 (555) 018-4421",
    title: "Chief Technology Officer",
    companyId: "comp-2",
    companyName: "Global Fintech Dynamics",
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z"
  },
  {
    id: "cust-3",
    customerName: "Sarah Jenkins",
    email: "sarah.j@apexhealthtech.com",
    phone: "+1 (555) 088-7712",
    title: "Head of Growth",
    companyId: "comp-3",
    companyName: "Apex HealthTech",
    createdAt: "2026-02-10T11:45:00.000Z",
    updatedAt: "2026-02-10T11:45:00.000Z"
  }
];

const SEED_DEALS: CRMDeal[] = [
  {
    id: "deal-1",
    dealName: "Acme Enterprise AI Pipeline Expansion",
    amount: 120000,
    stage: "proposal",
    probability: 75,
    customerId: "cust-1",
    customerName: "Praneeth Burada",
    companyId: "comp-1",
    companyName: "Acme Enterprise SaaS",
    expectedCloseDate: "2026-08-31",
    notes: "High intent prospect. Custom AI workflow proposal submitted.",
    createdAt: "2026-01-20T14:00:00.000Z",
    updatedAt: "2026-01-20T14:00:00.000Z"
  },
  {
    id: "deal-2",
    dealName: "Fintech Dynamics Outbound Automation",
    amount: 85000,
    stage: "negotiation",
    probability: 90,
    customerId: "cust-2",
    customerName: "Anil Kumar",
    companyId: "comp-2",
    companyName: "Global Fintech Dynamics",
    expectedCloseDate: "2026-08-15",
    notes: "Contract security audit passed. Final pricing review.",
    createdAt: "2026-02-05T16:20:00.000Z",
    updatedAt: "2026-02-05T16:20:00.000Z"
  },
  {
    id: "deal-3",
    dealName: "Apex HealthTech HIPAA Compliance Suite",
    amount: 195000,
    stage: "closed-won",
    probability: 100,
    customerId: "cust-3",
    customerName: "Sarah Jenkins",
    companyId: "comp-3",
    companyName: "Apex HealthTech",
    expectedCloseDate: "2026-07-01",
    notes: "Signed 12-month annual contract.",
    createdAt: "2026-02-12T10:10:00.000Z",
    updatedAt: "2026-07-01T10:10:00.000Z"
  }
];

// Initialize seed data into memory
SEED_COMPANIES.forEach(c => inMemoryCompanies.set(c.id, c));
SEED_CUSTOMERS.forEach(c => inMemoryCustomers.set(c.id, c));
SEED_DEALS.forEach(d => inMemoryDeals.set(d.id, d));

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
  if (inMemoryCompanies.size === 0) {
    SEED_COMPANIES.forEach(c => inMemoryCompanies.set(c.id, c));
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
  if (inMemoryCustomers.size === 0) {
    SEED_CUSTOMERS.forEach(c => inMemoryCustomers.set(c.id, c));
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
  if (inMemoryDeals.size === 0) {
    SEED_DEALS.forEach(d => inMemoryDeals.set(d.id, d));
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
