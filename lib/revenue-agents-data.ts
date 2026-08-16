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
  { key: "ashok", name: "Ashok", title: "Outbound Lead Specialist", bio: "Expert in outbound pipeline generation, enterprise B2B sales development, and cold outreach.", specialties: ["B2B SaaS", "Outbound", "Pipeline"], rating: 4.9, winRate: "38%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 3 },
  { key: "harsha", name: "Harsha", title: "Content & GTM Architect", bio: "Specializes in product-led growth, content automation pipelines, and ICP alignment.", specialties: ["Content", "GTM", "Product-Led"], rating: 4.8, winRate: "35%", timeZone: "America/Chicago (CST)", onlineStatus: "online", maxSessions: 3 },
  { key: "kiran", name: "Kiran", title: "Growth & Performance Strategist", bio: "Focuses on paid ad optimization, conversion funnel analytics, and CAC reduction.", specialties: ["Growth", "Paid Ads", "Metrics"], rating: 4.9, winRate: "41%", timeZone: "America/Los_Angeles (PST)", onlineStatus: "online", maxSessions: 3 },
  { key: "vijay", name: "Vijay", title: "Enterprise Sales Director", bio: "Strategic account executive managing multi-stakeholder enterprise deals and contract negotiations.", specialties: ["Enterprise Sales", "Strategic Planning"], rating: 5.0, winRate: "44%", timeZone: "America/New_York (EST)", onlineStatus: "busy", maxSessions: 3 },
  { key: "avinash", name: "Avinash", title: "Customer Success & Expansion Lead", bio: "Drives account retention, expansion playbooks, and post-sale onboarding experience.", specialties: ["Account Management", "Customer Success"], rating: 4.8, winRate: "32%", timeZone: "Europe/London (GMT)", onlineStatus: "online", maxSessions: 3 },
  { key: "kunal", name: "Kunal", title: "Marketing Automation Lead", bio: "Engineers automated lead generation workflows and multi-channel drip campaigns.", specialties: ["Marketing Automation", "Lead Generation"], rating: 4.7, winRate: "30%", timeZone: "Asia/Kolkata (IST)", onlineStatus: "online", maxSessions: 3 },
  { key: "praneeth", name: "Praneeth", title: "Chief RevOps & Pipeline Specialist", bio: "Pioneers B2B RevOps optimization, deal velocity acceleration, and custom GTM frameworks.", specialties: ["B2B SaaS", "GTM Strategy", "RevOps", "Pipeline Optimization"], rating: 5.0, winRate: "46%", timeZone: "America/New_York (EST)", onlineStatus: "online", maxSessions: 4 }
];
