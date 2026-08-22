export interface RevenueAgentItem {
  key: string;
  name: string;
  title: string;
  bio: string;
  specialties: string[];
  rating: number;
  winRate: string;
  timeZone: string;
  onlineStatus: string;
  maxSessions: number;
}

export const REVENUE_AGENTS: RevenueAgentItem[] = [
  { key: "ashok", name: "Ashok", title: "Autonomous Prospecting & Research Agent", bio: "Autonomously researches target markets, uncovers buyer pain points, and profiles high-intent decision makers.", specialties: ["Prospect Discovery", "Pain Point Research", "ICP Profiling"], rating: 4.9, winRate: "38%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 3 },
  { key: "harsha", name: "Harsha", title: "AI Sales Representative (Calls & Demos)", bio: "Joins sales calls as an interactive AI human representative, conducts discovery, and resolves objections in real time.", specialties: ["AI Call Presence", "Live Objection Handling", "Discovery Calls"], rating: 4.8, winRate: "35%", timeZone: "America/Chicago (CST)", onlineStatus: "online", maxSessions: 3 },
  { key: "kiran", name: "Kiran", title: "Autonomous Negotiation & Boundaries Specialist", bio: "Handles commercial conversations, navigates pricing boundaries, and structures win-win closing proposals.", specialties: ["Deal Negotiation", "Boundary Control", "Commercial Structuring"], rating: 4.9, winRate: "41%", timeZone: "America/Los_Angeles (PST)", onlineStatus: "online", maxSessions: 3 },
  { key: "vijay", name: "Vijay", title: "Autonomous Deal Closer & Contracting Lead", bio: "Executes final contract terms, coordinates stakeholder sign-offs, and autonomously closes enterprise deals.", specialties: ["Deal Closing", "Contract Finalization", "Enterprise Agreements"], rating: 5.0, winRate: "44%", timeZone: "America/New_York (EST)", onlineStatus: "busy", maxSessions: 3 },
  { key: "avinash", name: "Avinash", title: "Post-Sale Requirement Execution Specialist", bio: "Takes closed deal specifications and autonomously orchestrates onboarding, delivery, and requirement fulfillment.", specialties: ["Requirement Execution", "Post-Sale Delivery", "Client Onboarding"], rating: 4.8, winRate: "32%", timeZone: "Europe/London (GMT)", onlineStatus: "online", maxSessions: 3 },
  { key: "kunal", name: "Kunal", title: "Autonomous Multi-Channel Engagement Agent", bio: "Dispatches personalized multi-touch sequences across email, SMS, and WhatsApp with self-improving reply loops.", specialties: ["Multi-Channel Outreach", "Adaptive Sequences", "Conversation Routing"], rating: 4.7, winRate: "30%", timeZone: "Asia/Kolkata (IST)", onlineStatus: "online", maxSessions: 3 },
  { key: "praneeth", name: "Praneeth", title: "Chief Workforce Orchestrator & RevOps Lead", bio: "Orchestrates the entire AI workforce lifecycle — from business goal intake through close and requirement delivery.", specialties: ["Workforce Orchestration", "Goal Execution", "ALMA Self-Learning", "End-to-End Pipeline"], rating: 5.0, winRate: "46%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 4 }
];
