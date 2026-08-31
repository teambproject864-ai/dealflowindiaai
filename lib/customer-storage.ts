// lib/customer-storage.ts
import fs from "fs";
import path from "path";
import { getDb } from "./firebase-admin";
import { CustomerAccountOption } from "./customer-accounts";
import { getAgentByKey, REVENUE_AGENTS } from "./types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CUSTOMERS_FILE_PATH = path.resolve(DATA_DIR, "customers.json");

export interface CreateCustomerInput {
  name: string;
  companyName: string;
  email?: string;
  phone?: string;
  industry?: string;
  assignedAgentKey?: string;
  assignedAgentName?: string;
  assignedAgentId?: string;
  plan?: string;
  status?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  assignedAgentKey?: string;
  assignedAgentName?: string;
  assignedAgentId?: string;
  status?: string;
}

/**
 * In-memory mirror for fast synchronous reads and offline resilience
 */
let inMemoryStore: Map<string, CustomerAccountOption> = new Map();
let isInitialized = false;

/**
 * Ensures data directory and JSON storage file exist
 */
function ensureStorageFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CUSTOMERS_FILE_PATH)) {
      fs.writeFileSync(CUSTOMERS_FILE_PATH, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err: any) {
    console.error("[CustomerStorage] Failed to ensure storage directory/file:", err);
    throw new Error(`Storage initialization failed: ${err.message}`);
  }
}

/**
 * Reads all customers from persistent local JSON file
 */
function readCustomersFromFile(): CustomerAccountOption[] {
  ensureStorageFile();
  try {
    const raw = fs.readFileSync(CUSTOMERS_FILE_PATH, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    console.error("[CustomerStorage] Error reading customers.json:", err);
    return [];
  }
}

/**
 * Writes all customers atomically to persistent local JSON file
 */
function writeCustomersToFile(customers: CustomerAccountOption[]): void {
  ensureStorageFile();
  try {
    const tempPath = `${CUSTOMERS_FILE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(customers, null, 2), "utf8");
    fs.renameSync(tempPath, CUSTOMERS_FILE_PATH);
  } catch (err: any) {
    console.error("[CustomerStorage] Error writing customers.json:", err);
    throw new Error(`Failed to persist customer data to local storage: ${err.message}`);
  }
}

/**
 * Validates customer input fields strictly
 */
export function validateCustomerData(input: Partial<CreateCustomerInput>): { isValid: boolean; error?: string } {
  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name || name.length < 2 || name.length > 80) {
      return { isValid: false, error: "Customer Contact Name must be between 2 and 80 characters." };
    }
  }

  if (input.companyName !== undefined) {
    const company = String(input.companyName).trim();
    if (!company || company.length < 2 || company.length > 100) {
      return { isValid: false, error: "Company Name must be between 2 and 100 characters." };
    }
  }

  if (input.email !== undefined && input.email !== null && String(input.email).trim() !== "") {
    const email = String(input.email).trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return { isValid: false, error: "Please provide a valid email address (e.g., name@company.com)." };
    }
  }

  if (input.assignedAgentKey) {
    const key = String(input.assignedAgentKey).trim().toLowerCase();
    const knownAgent = REVENUE_AGENTS.find((a) => a.key === key);
    if (!knownAgent) {
      return { isValid: false, error: `Invalid agent key '${input.assignedAgentKey}'. Available agents: ${REVENUE_AGENTS.map((a) => a.key).join(", ")}.` };
    }
  }

  return { isValid: true };
}

/**
 * Initializes persistent customer storage layer from Firestore & local file
 */
export async function initializeCustomerStorage(): Promise<void> {
  ensureStorageFile();
  const fileCustomers = readCustomersFromFile();
  fileCustomers.forEach((c) => inMemoryStore.set(c.id, c));

  // Sync with Firestore if connected
  const db = getDb();
  if (db) {
    try {
      const snap = await db.collection("customers").get();
      if (!snap.empty) {
        snap.docs.forEach((doc) => {
          const data = doc.data();
          const record: CustomerAccountOption = {
            id: doc.id,
            name: data.name || data.contactName || "Customer Account",
            companyName: data.companyName || data.company || "Enterprise Company",
            email: data.email || "",
            phone: data.phone || "",
            industry: data.industry || "Enterprise SaaS",
            status: data.status || "active",
            assignedAgentId: data.assignedAgentId || "",
            assignedAgentName: data.assignedAgentName || "",
            assignedAgentKey: data.assignedAgentKey || "",
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          inMemoryStore.set(record.id, record);
        });
        // Update local file with latest cloud snapshot
        writeCustomersToFile(Array.from(inMemoryStore.values()));
      }
    } catch (dbErr) {
      console.warn("[CustomerStorage] Firestore sync warning (local storage used):", dbErr);
    }
  }

  isInitialized = true;
}

export class CustomerStorageService {
  /**
   * Retrieves all customer accounts with optional query and agent filtering
   */
  static async getAllCustomers(filter?: { agentKey?: string; search?: string }): Promise<CustomerAccountOption[]> {
    if (!isInitialized) {
      await initializeCustomerStorage();
    } else {
      // Refresh from file in case another worker/process wrote
      const fromFile = readCustomersFromFile();
      fromFile.forEach((c) => inMemoryStore.set(c.id, c));
    }

    let list = Array.from(inMemoryStore.values());

    if (filter?.agentKey && filter.agentKey !== "all") {
      const targetKey = filter.agentKey.toLowerCase();
      list = list.filter((c) => c.assignedAgentKey?.toLowerCase() === targetKey || c.assignedAgentId?.toLowerCase().includes(targetKey));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.industry && c.industry.toLowerCase().includes(q)) ||
          (c.assignedAgentName && c.assignedAgentName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Retrieves a single customer account by ID
   */
  static async getCustomerById(id: string): Promise<CustomerAccountOption | null> {
    if (!isInitialized) {
      await initializeCustomerStorage();
    }
    return inMemoryStore.get(id) || null;
  }

  /**
   * Creates and permanently stores a new customer account
   */
  static async createCustomer(input: CreateCustomerInput): Promise<CustomerAccountOption> {
    if (!isInitialized) {
      await initializeCustomerStorage();
    }

    // 1. Validation
    if (!input.name || String(input.name).trim().length < 2) {
      throw new Error("Customer Contact Name is required (minimum 2 characters).");
    }
    if (!input.companyName || String(input.companyName).trim().length < 2) {
      throw new Error("Company Name is required (minimum 2 characters).");
    }

    const validation = validateCustomerData(input);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid customer data provided.");
    }

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let assignedAgentName = input.assignedAgentName || "";
    let assignedAgentKey = input.assignedAgentKey || "";
    let assignedAgentId = input.assignedAgentId || "";

    if (assignedAgentKey && !assignedAgentName) {
      const agent = getAgentByKey(assignedAgentKey.toLowerCase() as any);
      if (agent) {
        assignedAgentName = agent.name;
        assignedAgentId = `agent-${agent.key}`;
      }
    }

    const newCustomer: CustomerAccountOption = {
      id: customerId,
      name: input.name.trim(),
      companyName: input.companyName.trim(),
      email: input.email ? input.email.trim() : `admin@${input.companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      phone: input.phone?.trim() || "",
      industry: input.industry?.trim() || "Enterprise SaaS",
      status: input.status || "active",
      assignedAgentKey: assignedAgentKey || "ashok",
      assignedAgentName: assignedAgentName || "Ashok",
      assignedAgentId: assignedAgentId || "agent-ashok",
      createdAt: now,
      updatedAt: now,
    };

    // 2. Save in memory
    inMemoryStore.set(customerId, newCustomer);

    // 3. Persist to local JSON file
    writeCustomersToFile(Array.from(inMemoryStore.values()));

    // 4. Persist to Firestore if available
    const db = getDb();
    if (db) {
      try {
        await db.collection("customers").doc(customerId).set({
          ...newCustomer,
          contactName: newCustomer.name,
          company: newCustomer.companyName,
          plan: input.plan || "Enterprise Pilot",
        });
      } catch (dbErr) {
        console.warn("[CustomerStorage] Firestore save warning (persisted to local file):", dbErr);
      }
    }

    return newCustomer;
  }

  /**
   * Updates an existing customer account (including agent reassignment)
   */
  static async updateCustomer(id: string, updates: UpdateCustomerInput): Promise<CustomerAccountOption> {
    if (!isInitialized) {
      await initializeCustomerStorage();
    }

    const existing = inMemoryStore.get(id);
    if (!existing) {
      throw new Error(`Customer account with ID '${id}' not found.`);
    }

    const validation = validateCustomerData(updates);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid customer update data provided.");
    }

    const now = new Date().toISOString();
    let assignedAgentName = updates.assignedAgentName !== undefined ? updates.assignedAgentName : existing.assignedAgentName;
    let assignedAgentKey = updates.assignedAgentKey !== undefined ? updates.assignedAgentKey : existing.assignedAgentKey;
    let assignedAgentId = updates.assignedAgentId !== undefined ? updates.assignedAgentId : existing.assignedAgentId;

    if (updates.assignedAgentKey && (!updates.assignedAgentName || updates.assignedAgentKey !== existing.assignedAgentKey)) {
      const agent = getAgentByKey(updates.assignedAgentKey.toLowerCase() as any);
      if (agent) {
        assignedAgentName = agent.name;
        assignedAgentId = `agent-${agent.key}`;
        assignedAgentKey = agent.key;
      }
    }

    const updatedCustomer: CustomerAccountOption = {
      ...existing,
      ...updates,
      name: updates.name ? updates.name.trim() : existing.name,
      companyName: updates.companyName ? updates.companyName.trim() : existing.companyName,
      email: updates.email !== undefined ? (updates.email.trim() || undefined) : existing.email,
      phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
      industry: updates.industry ? updates.industry.trim() : existing.industry,
      assignedAgentKey,
      assignedAgentName,
      assignedAgentId,
      updatedAt: now,
    };

    // Update in-memory
    inMemoryStore.set(id, updatedCustomer);

    // Persist to local JSON file
    writeCustomersToFile(Array.from(inMemoryStore.values()));

    // Persist to Firestore
    const db = getDb();
    if (db) {
      try {
        await db.collection("customers").doc(id).set({
          ...updatedCustomer,
          contactName: updatedCustomer.name,
          company: updatedCustomer.companyName,
        }, { merge: true });
      } catch (dbErr) {
        console.warn("[CustomerStorage] Firestore update warning (persisted to local file):", dbErr);
      }
    }

    return updatedCustomer;
  }

  /**
   * Reassigns a customer account to another agent
   */
  static async reassignCustomer(id: string, newAgentKey: string): Promise<CustomerAccountOption> {
    const key = newAgentKey.trim().toLowerCase();
    const agent = getAgentByKey(key as any);
    if (!agent) {
      throw new Error(`Cannot reassign customer: Unknown agent '${newAgentKey}'.`);
    }

    return this.updateCustomer(id, {
      assignedAgentKey: agent.key,
      assignedAgentName: agent.name,
      assignedAgentId: `agent-${agent.key}`,
    });
  }

  /**
   * Permanently deletes a customer account
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    if (!isInitialized) {
      await initializeCustomerStorage();
    }

    if (!inMemoryStore.has(id)) {
      // Check file directly
      const fileCustomers = readCustomersFromFile();
      const existsInFile = fileCustomers.some((c) => c.id === id);
      if (!existsInFile) {
        throw new Error(`Customer account with ID '${id}' not found.`);
      }
    }

    // Remove from in-memory
    inMemoryStore.delete(id);

    // Persist updated list to local JSON file
    writeCustomersToFile(Array.from(inMemoryStore.values()));

    // Delete from Firestore
    const db = getDb();
    if (db) {
      try {
        await db.collection("customers").doc(id).delete();
      } catch (dbErr) {
        console.warn("[CustomerStorage] Firestore delete warning (deleted from local file):", dbErr);
      }
    }

    return true;
  }

  /**
   * Resets in-memory store (primarily for unit / e2e test simulations)
   */
  static _resetMemoryStore(): void {
    inMemoryStore.clear();
    isInitialized = false;
  }
}
