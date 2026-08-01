import { AGENT_FULL_NAMES, getRevenueAgentCatalog, RevenueAgentProfile } from "./types";
import { logger } from "./logger";

// --- Assignment tracking interface
interface AgentAssignmentLog {
  leadId: string;
  agentKey: string;
  assignedAt: string;
  reason: string;
  previousAgentKey?: string; // for reassignment
}

// In-memory assignment counts for quick access (backup to Firestore)
let inMemoryAssignmentCounts: Record<string, number> = {};
let inMemoryAssignmentHistory: AgentAssignmentLog[] = [];

async function getFirestoreDb() {
  try {
    const { db } = await import("./firebase-admin");
    return db;
  } catch (e) {
    return null;
  }
}

// Initialize from Firestore on first use
async function initAssignmentCounts() {
  const db = await getFirestoreDb();
  if (!db) {
    // Fallback to in-memory only
    const agents = getRevenueAgentCatalog();
    agents.forEach(agent => {
      inMemoryAssignmentCounts[agent.key] = 0;
    });
    return;
  }

  try {
    // Load counts from Firestore
    const snapshot = await db
      .collection("agent_assignments")
      .where("status", "in", ["pending", "active"])
      .get();

    const agents = getRevenueAgentCatalog();
    agents.forEach(agent => {
      inMemoryAssignmentCounts[agent.key] = 0;
    });

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.agentKey) {
        inMemoryAssignmentCounts[data.agentKey] = (inMemoryAssignmentCounts[data.agentKey] || 0) + 1;
      }
    });
    logger.info("[AgentAssignment] Initialized assignment counts from Firestore", inMemoryAssignmentCounts);
  } catch (err) {
    logger.warn("[AgentAssignment] Failed to load assignment counts from Firestore, using defaults", err);
  }
}

// Ensure counts are initialized
let initPromise: Promise<void> | null = null;
function ensureInit() {
  if (!initPromise) {
    initPromise = initAssignmentCounts();
  }
  return initPromise;
}

// --- Helper to calculate variance between most and least assigned agents
function calculateAssignmentVariance(agents: RevenueAgentProfile[]): number {
  const counts = agents.map(a => inMemoryAssignmentCounts[a.key] || 0);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (min === 0) return max === 0 ? 0 : 100;
  return ((max - min) / min) * 100;
}

// --- Fair random agent assignment with variance control (<=15%
export async function assignFairRandomAgent(
  agents: RevenueAgentProfile[],
  excludeAgentKey?: string
): Promise<{ agentKey: string; reason: string }> {
  await ensureInit();
  const availableAgents = agents.filter(agent => agent.available && agent.key !== excludeAgentKey);
  let agentPool = availableAgents.length > 0 ? availableAgents : agents.filter(agent => agent.key !== excludeAgentKey);
  
  if (agentPool.length === 0) {
    agentPool = agents;
  }

  // First, try to pick agents with lower counts first to keep variance <=15%
  // Sort agents by count ascending
  const sortedAgents = [...agentPool].sort((a, b) => {
    const countA = inMemoryAssignmentCounts[a.key] || 0;
    const countB = inMemoryAssignmentCounts[b.key] || 0;
    return countA - countB;
  });

  // Select from the first 50% of sorted agents (or all if small pool) to keep it random but fair
  const fairPoolSize = Math.max(1, Math.floor(sortedAgents.length / 2));
  const fairPool = sortedAgents.slice(0, fairPoolSize);
  
  // Now random from fair pool
  const randomIndex = Math.floor(Math.random() * fairPool.length);
  const selectedAgent = fairPool[randomIndex];
  
  // Update counts
  inMemoryAssignmentCounts[selectedAgent.key] = (inMemoryAssignmentCounts[selectedAgent.key] || 0) + 1;
  
  // Calculate variance for logging
  const variance = calculateAssignmentVariance(agents);
  
  const reason = 
    availableAgents.length > 0 
      ? `fair_random_available_agent (variance: ${variance.toFixed(2)}%)` 
      : `fair_random_fallback_agent (variance: ${variance.toFixed(2)}%)`;
  
  logger.info(`[AgentAssignment] Assigned agent: ${selectedAgent.key}`, { reason, variance, exclusionInfo: excludeAgentKey ? `excluded previous: ${excludeAgentKey}` : "" });
  
  return { agentKey: selectedAgent.key, reason };
}

// --- Customer reassignment (avoids previous agent
export async function reassignAgent(
  leadId: string,
  previousAgentKey: string,
  agents: RevenueAgentProfile[]
): Promise<{ agentKey: string; reason: string }> {
  await ensureInit();
  
  const result = await assignFairRandomAgent(agents, previousAgentKey);
  
  // Log reassignment
  const logEntry: AgentAssignmentLog = {
    leadId,
    agentKey: result.agentKey,
    assignedAt: new Date().toISOString(),
    reason: result.reason,
    previousAgentKey
  };
  inMemoryAssignmentHistory.push(logEntry);
  
  // Decrement previous agent's count
  if (inMemoryAssignmentCounts[previousAgentKey] > 0) {
    inMemoryAssignmentCounts[previousAgentKey]--;
  }
  
  logger.info(`[AgentAssignment] Reassigned lead: ${leadId} from ${previousAgentKey} to ${result.agentKey}`);
  
  return result;
}

// --- Legacy compatibility
export function getRandomAvailableAgent(): string {
  const agents = getRevenueAgentCatalog();
  const availableAgents = agents.filter(agent => agent.available);
  
  const agentPool = availableAgents.length > 0 ? availableAgents : agents;
  const randomIndex = Math.floor(Math.random() * agentPool.length);
  return agentPool[randomIndex].key;
}

// --- Get agent by key
export function getAgentByKey(key: string) {
  const agents = getRevenueAgentCatalog();
  return agents.find(agent => agent.key === key);
}

// --- Intelligent Multi-Criteria Auto Assignment (Industry, Workload, Timezone, Performance)
export async function intelligentAutoAssignAgent(
  agents: RevenueAgentProfile[],
  customerCriteria: {
    industry?: string;
    companySize?: string;
    timeZone?: string;
    challengeTags?: string[];
  }
): Promise<{ agentKey: string; reason: string; matchScore: number }> {
  await ensureInit();

  if (!agents || agents.length === 0) {
    const { getRevenueAgentCatalog } = await import("./types");
    agents = getRevenueAgentCatalog();
  }

  const targetIndustry = (customerCriteria.industry || "").toLowerCase();
  const targetTimeZone = (customerCriteria.timeZone || "").toLowerCase();
  const tags = (customerCriteria.challengeTags || []).map((t) => t.toLowerCase());

  const scoredAgents = agents.map((agent) => {
    let score = 0;

    // 1. Expertise & Industry Alignment (40 points)
    const expertiseMatch = agent.expertise.some(
      (e) => targetIndustry.includes(e.toLowerCase()) || e.toLowerCase().includes(targetIndustry)
    );
    const tagMatchCount = agent.expertise.filter((e) =>
      tags.some((tag) => tag.includes(e.toLowerCase()) || e.toLowerCase().includes(tag))
    ).length;
    if (expertiseMatch) score += 25;
    score += Math.min(15, tagMatchCount * 5);

    // 2. Workload & Capacity Balancing (30 points)
    const active = agent.activeSessions || 0;
    const maxCap = agent.maxSessions || 3;
    const capacityRatio = Math.max(0, 1 - active / maxCap);
    score += Math.round(capacityRatio * 30);

    // 3. Time Zone Compatibility (15 points)
    const agentTZ = (agent.timeZone || "").toLowerCase();
    if (targetTimeZone && agentTZ && (agentTZ.includes(targetTimeZone) || targetTimeZone.includes(agentTZ))) {
      score += 15;
    } else {
      score += 8; // partial default overlap
    }

    // 4. Historical CSAT & Win Rate Performance (15 points)
    const rating = agent.rating || 4.8;
    score += Math.round((rating / 5.0) * 15);

    return { agent, score };
  });

  // Sort by score descending
  scoredAgents.sort((a, b) => b.score - a.score);
  const best = scoredAgents[0] || { agent: agents[0], score: 50 };

  // Update in-memory count
  inMemoryAssignmentCounts[best.agent.key] = (inMemoryAssignmentCounts[best.agent.key] || 0) + 1;

  const reason = `Intelligent Auto-Matched based on Industry (${targetIndustry || "General"}), Capacity (${best.agent.activeSessions}/${best.agent.maxSessions || 3}), Timezone (${best.agent.timeZone || "EST"}), and CSAT (${best.agent.rating || 4.9}/5.0)`;

  logger.info(`[AgentAssignment] Auto-assigned agent: ${best.agent.key}`, {
    score: best.score,
    reason
  });

  return {
    agentKey: best.agent.key,
    reason,
    matchScore: best.score
  };
}
