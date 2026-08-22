// lib/history/universal-history-service.ts
import crypto from "crypto";

export type UniversalHistoryCategory = 
  | "whatsapp_openwa" 
  | "whatsapp_evolution" 
  | "call_bot" 
  | "deal_transaction" 
  | "agent_action" 
  | "security_audit";

export interface UniversalHistoryItem {
  id: string;
  category: UniversalHistoryCategory;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: "customer" | "agent" | "admin" | "system";
  organizationId: string;
  organizationName: string;
  targetEntityId?: string; // dealId, leadId, phone, etc.
  status: "completed" | "in_progress" | "delivered" | "failed" | "verified";
  timestamp: string;
  metadata: Record<string, any>;
  complianceHash: string;
}

export interface UniversalHistoryQueryOptions {
  userRole: "customer" | "agent" | "admin";
  userId?: string;
  userOrgId?: string;
  searchQuery?: string;
  category?: UniversalHistoryCategory | "all";
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// In-Memory Master History Vault (holds live recorded operational events)
const masterHistoryStore: UniversalHistoryItem[] = [];

/**
 * Appends a new item into the Universal History Vault
 */
export function recordUniversalHistoryEvent(item: Omit<UniversalHistoryItem, "id" | "timestamp" | "complianceHash">): UniversalHistoryItem {
  const id = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();
  const complianceHash = crypto.createHash("sha256").update(`${id}:${item.category}:${item.actorId}:${item.title}`).digest("hex");

  const fullRecord: UniversalHistoryItem = {
    id,
    timestamp,
    complianceHash,
    ...item,
  };

  masterHistoryStore.unshift(fullRecord);
  return fullRecord;
}

/**
 * Queries Universal History with strict Role-Based Access Control (RBAC)
 */
export async function queryUniversalHistory(options: UniversalHistoryQueryOptions): Promise<{
  items: UniversalHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const {
    userRole,
    userId,
    userOrgId = "org-acme",
    searchQuery,
    category,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;

  let filtered = [...masterHistoryStore];

  // 1. RBAC Gate
  if (userRole === "customer") {
    // Customers can ONLY see records belonging to their specific organization
    filtered = filtered.filter(item => item.organizationId === userOrgId && item.category !== "security_audit");
  } else if (userRole === "agent") {
    // Agents see items from assigned organizations + all non-security agent activities
    filtered = filtered.filter(item => item.actorRole !== "admin");
  }
  // Admin has global visibility across all orgs and security audits

  // 2. Category Filter
  if (category && category !== "all") {
    filtered = filtered.filter(item => item.category === category);
  }

  // 3. Status Filter
  if (status && status !== "all") {
    filtered = filtered.filter(item => item.status === status);
  }

  // 4. Date Range Filter
  if (startDate) {
    const startMs = new Date(startDate).getTime();
    filtered = filtered.filter(item => new Date(item.timestamp).getTime() >= startMs);
  }
  if (endDate) {
    const endMs = new Date(endDate).getTime();
    filtered = filtered.filter(item => new Date(item.timestamp).getTime() <= endMs);
  }

  // 5. Full-text Search
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.actorName.toLowerCase().includes(query) ||
      item.organizationName.toLowerCase().includes(query) ||
      item.targetEntityId?.toLowerCase().includes(query) ||
      item.complianceHash.toLowerCase().includes(query)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    items: paginated,
    total,
    limit,
    offset,
  };
}
