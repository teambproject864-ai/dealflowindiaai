import type { CallRecord, AGENT_FULL_NAMES as TYPE_AGENT_FULL_NAMES, AGENT_EXPERTISE as TYPE_AGENT_EXPERTISE, RevenueAgentProfile } from "@/lib/types";
import { getAgentByKey as getAgentFromAssignment } from "./agent-assignment";

export function getAgentByKey(key: string): RevenueAgentProfile | undefined {
  return getAgentFromAssignment(key);
}

// Re-export so callers can `import type { RevenueAgentProfile } from "@/lib/revenue-agents"`
export type { RevenueAgentProfile };

// Use the new agent names from lib/types.ts
import { AGENT_FULL_NAMES, AGENT_EXPERTISE } from "./types";

export function getRevenueAgentCatalog(): Omit<RevenueAgentProfile, "activeSessions" | "available">[] {
  return Object.entries(AGENT_FULL_NAMES).map(([key, name]) => ({
    key: key as keyof typeof AGENT_FULL_NAMES,
    name,
    fullName: name,
    role: "AI Revenue Agent",
    expertise: AGENT_EXPERTISE[key as keyof typeof AGENT_EXPERTISE] || ["gtm"],
  }));
}

import { REVENUE_AGENTS } from "./revenue-agents-data";
export { REVENUE_AGENTS };


async function countActiveSessionsByPersona(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const key of Object.keys(AGENT_FULL_NAMES)) {
    counts[key] = 0;
  }

  if (typeof window !== "undefined") {
    return counts;
  }

  try {
    const { getDb } = await import("@/lib/firebase-admin");
    const dbInstance = getDb();
    if (dbInstance) {
      const snapshot = await dbInstance
        .collection("calls")
        .where("status", "==", "in-progress")
        .limit(50)
        .get();

      const now = Date.now();
      const recentThresholdMs = now - 2 * 60 * 1000;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as CallRecord;
        if (!data) return;
        const personaKey = (data.agentPersona || "").toLowerCase().trim();
        const lastHeartbeat = data.lastHeartbeat ? new Date(data.lastHeartbeat).getTime() : 0;
        const isActive = data.status === "in-progress" || (lastHeartbeat > 0 && lastHeartbeat >= recentThresholdMs);
        if (personaKey && counts[personaKey] !== undefined && isActive) {
          counts[personaKey] += 1;
        }
      });
    }
  } catch (error) {

    // Firestore may be unavailable in dev — return zero counts
  }

  return counts;
}

export async function listRevenueAgentsWithAvailability(): Promise<RevenueAgentProfile[]> {
  const activeCounts = await countActiveSessionsByPersona();
  const maxPerAgent = Number(process.env.MAX_SESSIONS_PER_AGENT) || 3;
  const catalog = getRevenueAgentCatalog();

  if (typeof window !== "undefined") {
    return catalog.map((agent) => {
      const detail = REVENUE_AGENTS.find((a) => a.key === agent.key);
      const activeSessions = activeCounts[agent.key] || 0;
      const maxCap = detail?.maxSessions || maxPerAgent;
      return {
        ...agent,
        title: detail?.title || agent.role,
        bio: detail?.bio || "Dedicated AI Revenue Specialist",
        specialties: detail?.specialties || agent.expertise,
        activeSessions,
        maxSessions: maxCap,
        available: activeSessions < maxCap,
        onlineStatus: (detail?.onlineStatus as any) || (activeSessions >= maxCap ? "busy" : "online"),
        rating: detail?.rating || 4.9,
        winRate: detail?.winRate || "35%",
        timeZone: detail?.timeZone || "America/New_York (EST)"
      };
    });
  }

  // Dynamically load active agent users created by Admin
  let dbAgents: RevenueAgentProfile[] = [];
  try {
    const { getDb } = await import("@/lib/firebase-admin");
    const db = getDb();
    if (db) {
      const snap = await db.collection("users").where("role", "==", "agent").get();
      snap.forEach((doc: any) => {
        const d = doc.data();
        if (d.isActive !== false) {
          const key = d.id || doc.id;
          dbAgents.push({
            key: key as any,
            name: d.name || "Agent",
            fullName: d.name || "Agent",
            role: "AI Revenue Agent",
            title: d.title || "Revenue Agent",
            bio: d.bio || "Specialized AI Revenue Agent",
            expertise: d.expertise || ["gtm", "sales"],
            specialties: d.specialties || ["GTM Strategy"],
            activeSessions: activeCounts[key] || 0,
            maxSessions: d.maxSessions || maxPerAgent,
            available: (activeCounts[key] || 0) < (d.maxSessions || maxPerAgent),
            onlineStatus: (activeCounts[key] || 0) >= (d.maxSessions || maxPerAgent) ? "busy" : "online",
            rating: d.rating || 4.9,
            winRate: d.winRate || "36%",
            timeZone: d.timeZone || "America/New_York (EST)"
          });
        }
      });
    }
  } catch (e) {
    // Fallback if DB query fails in dev environment
  }

  if (dbAgents.length > 0) {
    return dbAgents;
  }

  return catalog.map((agent) => {
    const detail = REVENUE_AGENTS.find((a) => a.key === agent.key);
    const activeSessions = activeCounts[agent.key] || 0;
    const maxCap = detail?.maxSessions || maxPerAgent;
    return {
      ...agent,
      title: detail?.title || agent.role,
      bio: detail?.bio || "Dedicated AI Revenue Specialist",
      specialties: detail?.specialties || agent.expertise,
      activeSessions,
      maxSessions: maxCap,
      available: activeSessions < maxCap,
      onlineStatus: (detail?.onlineStatus as any) || (activeSessions >= maxCap ? "busy" : "online"),
      rating: detail?.rating || 4.9,
      winRate: detail?.winRate || "35%",
      timeZone: detail?.timeZone || "America/New_York (EST)"
    };
  });
}

/**
 * Picks a fair random available agent (or random if all are busy) with variance control (<=15%)
 */
export async function assignRandomAgent(): Promise<{ agentKey: string; reason: string }> {
  const { assignFairRandomAgent } = await import("./agent-assignment");
  const agents = await listRevenueAgentsWithAvailability();
  return await assignFairRandomAgent(agents);
}

/**
 * Backward-compatible function for assigning agents.
 */
export async function assignOptimalAgent(
  preferredKeys: string[] = [],
  challengeTags: string[] = []
): Promise<{ agentKey: string; reason: string }> {
  // If automatic assignment is requested, use fair assignment
  if (preferredKeys.length === 0 || preferredKeys.includes("automatic")) {
    return await assignRandomAgent();
  }
  
  // Otherwise, try to pick the optimal agent from preferred keys
  const agents = await listRevenueAgentsWithAvailability();
  const normalizedTags = challengeTags.map((t) => t.toLowerCase());

  const scoreAgent = (agent: RevenueAgentProfile): number => {
    let score = 0;
    if (agent.available) score += 100;
    score -= agent.activeSessions * 25;
    if (preferredKeys.includes(agent.key)) score += 15;
    const overlap = agent.expertise.filter((e) =>
      normalizedTags.some((tag) => tag.includes(e) || e.includes(tag))
    ).length;
    score += overlap * 10;
    return score;
  };

  const ranked = [...agents].sort((a, b) => scoreAgent(b) - scoreAgent(a));
  const best = ranked[0] || agents[0];

  return {
    agentKey: best?.key || "ashok",
    reason: best?.available
      ? "lowest_workload_expertise_match"
      : "fallback_busy_pool",
  };
}
