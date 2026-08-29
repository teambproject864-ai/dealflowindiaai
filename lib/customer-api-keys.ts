import { encryptAES, decryptAES } from "./security";
import { createHash, randomUUID } from "crypto";
import { db } from "./firebase-admin";

export type APIKeyProvider = "openai" | "anthropic" | "huggingface" | "pinecone" | "billionmail" | "scrapegraph" | "custom";

export interface CustomerAPIKeyRecord {
  id: string;
  customerId: string;
  provider: APIKeyProvider;
  label: string;
  encryptedKey: string;
  maskedKey: string;
  status: "active" | "inactive";
  usageTokens: number;
  requestCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// In-Memory map fallback
const inMemoryCustomerKeys = new Map<string, CustomerAPIKeyRecord>();

function getMasterKey(): Buffer {
  const raw = process.env.API_KEY_MASTER_DECRYPTION_KEY || "default-master-key-dealflow-value";
  return createHash("sha256").update(raw).digest();
}

/**
 * Validates raw API Key format for supported providers
 */
export function validateAPIKeyFormat(provider: APIKeyProvider, rawKey: string): { isValid: boolean; error?: string } {
  if (!rawKey || rawKey.trim().length < 8) {
    return { isValid: false, error: "API Key must be at least 8 characters long" };
  }

  if (provider === "openai" && !rawKey.startsWith("sk-")) {
    return { isValid: false, error: "OpenAI API keys must start with 'sk-'" };
  }
  if (provider === "anthropic" && !rawKey.startsWith("sk-ant-")) {
    return { isValid: false, error: "Anthropic API keys must start with 'sk-ant-'" };
  }
  if (provider === "huggingface" && !rawKey.startsWith("hf_")) {
    return { isValid: false, error: "Hugging Face tokens must start with 'hf_'" };
  }
  if (provider === "billionmail" && !rawKey.startsWith("bm_") && !rawKey.startsWith("billion_")) {
    return { isValid: false, error: "Billionmail API keys must start with 'bm_' or 'billion_'" };
  }
  if (provider === "scrapegraph" && !rawKey.startsWith("sgai-") && !rawKey.startsWith("sg_")) {
    return { isValid: false, error: "ScrapeGraphAI API keys must start with 'sgai-' or 'sg_'" };
  }

  return { isValid: true };
}

/**
 * Creates a masked version of an API Key string (e.g. sk-••••••••1234)
 */
export function maskAPIKey(rawKey: string): string {
  const k = rawKey.trim();
  if (k.length <= 8) return "••••••••";
  const prefix = k.substring(0, 4);
  const suffix = k.substring(k.length - 4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Saves an encrypted customer API key
 */
export async function saveCustomerAPIKey(args: {
  customerId: string;
  provider: APIKeyProvider;
  label: string;
  rawKey: string;
}): Promise<CustomerAPIKeyRecord> {
  const { isValid, error } = validateAPIKeyFormat(args.provider, args.rawKey);
  if (!isValid) {
    throw new Error(error || "Invalid API key format");
  }

  const id = `key-${randomUUID()}`;
  const encryptedKey = encryptAES(args.rawKey.trim(), getMasterKey());
  const maskedKey = maskAPIKey(args.rawKey.trim());

  const record: CustomerAPIKeyRecord = {
    id,
    customerId: args.customerId,
    provider: args.provider,
    label: args.label || `${args.provider.toUpperCase()} Key`,
    encryptedKey,
    maskedKey,
    status: "active",
    usageTokens: 0,
    requestCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryCustomerKeys.set(id, record);

  if (db) {
    try {
      await db.collection("customer_api_keys").doc(id).set(record);
    } catch (e) {
      console.warn("[CustomerAPIKeys] Firestore write error, saved to in-memory store:", e);
    }
  }

  return record;
}

/**
 * Gets all saved API keys for a customer (masked)
 */
export async function getCustomerAPIKeys(customerId: string): Promise<CustomerAPIKeyRecord[]> {
  let keys: CustomerAPIKeyRecord[] = [];

  if (db) {
    try {
      const snap = await db.collection("customer_api_keys").where("customerId", "==", customerId).get();
      snap.forEach(doc => keys.push(doc.data() as CustomerAPIKeyRecord));
    } catch (e) {
      console.warn("[CustomerAPIKeys] Firestore read error, using in-memory store:", e);
      keys = Array.from(inMemoryCustomerKeys.values()).filter(k => k.customerId === customerId);
    }
  } else {
    keys = Array.from(inMemoryCustomerKeys.values()).filter(k => k.customerId === customerId);
  }

  keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return keys;
}

/**
 * Decrypts active customer API key for content generation inference
 */
export async function getActiveDecryptedKey(customerId: string, provider: APIKeyProvider): Promise<string | null> {
  const keys = await getCustomerAPIKeys(customerId);
  const activeKey = keys.find(k => k.provider === provider && k.status === "active");
  if (!activeKey) return null;

  try {
    const decrypted = decryptAES(activeKey.encryptedKey, getMasterKey());
    
    // Update consumption telemetry
    activeKey.requestCount += 1;
    activeKey.usageTokens += 150; // average token usage estimate
    activeKey.lastUsedAt = new Date().toISOString();
    
    inMemoryCustomerKeys.set(activeKey.id, activeKey);
    if (db) {
      try {
        await db.collection("customer_api_keys").doc(activeKey.id).update({
          requestCount: activeKey.requestCount,
          usageTokens: activeKey.usageTokens,
          lastUsedAt: activeKey.lastUsedAt
        });
      } catch (e) {
        console.warn("[CustomerAPIKeys] Telemetry update error:", e);
      }
    }

    return decrypted;
  } catch (err) {
    console.error(`[CustomerAPIKeys] Decryption error for key ${activeKey.id}:`, err);
    return null;
  }
}

/**
 * Deletes a customer API key
 */
export async function deleteCustomerAPIKey(customerId: string, keyId: string): Promise<boolean> {
  inMemoryCustomerKeys.delete(keyId);
  if (db) {
    try {
      const docRef = db.collection("customer_api_keys").doc(keyId);
      const doc = await docRef.get();
      if (doc.exists && doc.data()?.customerId === customerId) {
        await docRef.delete();
      }
    } catch {}
  }
  return true;
}

/**
 * Updates a customer API key status or label
 */
export async function updateCustomerAPIKey(customerId: string, keyId: string, updates: { status?: "active" | "inactive"; label?: string }): Promise<boolean> {
  let record = inMemoryCustomerKeys.get(keyId);
  if (!record && db) {
    try {
      const doc = await db.collection("customer_api_keys").doc(keyId).get();
      if (doc.exists) record = doc.data() as CustomerAPIKeyRecord;
    } catch {}
  }

  if (!record || record.customerId !== customerId) return false;


  if (updates.status) record.status = updates.status;
  if (updates.label) record.label = updates.label;
  record.updatedAt = new Date().toISOString();

  inMemoryCustomerKeys.set(keyId, record);
  if (db) {
    await db.collection("customer_api_keys").doc(keyId).set(record, { merge: true });
  }

  return true;
}
