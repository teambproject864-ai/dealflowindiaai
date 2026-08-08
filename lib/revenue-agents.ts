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

export const REVENUE_AGENTS = [
  { key: "ashok", name: "Ashok", title: "Outbound Lead Specialist", bio: "Expert in outbound pipeline generation, enterprise B2B sales development, and cold outreach.", specialties: ["B2B SaaS", "Outbound", "Pipeline"], rating: 4.9, winRate: "38%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 3 },
  { key: "harsha", name: "Harsha", title: "Content & GTM Architect", bio: "Specializes in product-led growth, content automation pipelines, and ICP alignment.", specialties: ["Content", "GTM", "Product-Led"], rating: 4.8, winRate: "35%", timeZone: "America/Chicago (CST)", onlineStatus: "online", maxSessions: 3 },
  { key: "kiran", name: "Kiran", title: "Growth & Performance Strategist", bio: "Focuses on paid ad optimization, conversion funnel analytics, and CAC reduction.", specialties: ["Growth", "Paid Ads", "Metrics"], rating: 4.9, winRate: "41%", timeZone: "America/Los_Angeles (PST)", onlineStatus: "online", maxSessions: 3 },
  { key: "vijay", name: "Vijay", title: "Enterprise Sales Director", bio: "Strategic account executive managing multi-stakeholder enterprise deals and contract negotiations.", specialties: ["Enterprise Sales", "Strategic Planning"], rating: 5.0, winRate: "44%", timeZone: "America/New_York (EST)", onlineStatus: "busy", maxSessions: 3 },
  { key: "avinash", name: "Avinash", title: "Customer Success & Expansion Lead", bio: "Drives account retention, expansion playbooks, and post-sale onboarding experience.", specialties: ["Account Management", "Customer Success"], rating: 4.8, winRate: "32%", timeZone: "Europe/London (GMT)", onlineStatus: "online", maxSessions: 3 },
  { key: "kunal", name: "Kunal", title: "Marketing Automation Lead", bio: "Engineers automated lead generation workflows and multi-channel drip campaigns.", specialties: ["Marketing Automation", "Lead Generation"], rating: 4.7, winRate: "30%", timeZone: "Asia/Kolkata (IST)", onlineStatus: "online", maxSessions: 3 },
  { key: "praneeth", name: "Praneeth", title: "Chief RevOps & Pipeline Specialist", bio: "Pioneers B2B RevOps optimization, deal velocity acceleration, and custom GTM frameworks.", specialties: ["B2B SaaS", "GTM Strategy", "RevOps", "Pipeline Optimization"], rating: 5.0, winRate: "46%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 4 }
];


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
