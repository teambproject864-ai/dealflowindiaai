/**
 * Synthetic seed datasets for GTM, Sales, and Marketing 3D modules.
 *
 * These are used as fallback data when Firestore collections are empty,
 * ensuring the 3D scenes always render a rich, demo-ready view on first load.
 * Once real data exists in Firestore the live onSnapshot listener takes over.
 */

// ─── GTM Launch Roadmap ───────────────────────────────────────────────────────

export interface GtmMilestone {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "upcoming";
  dueDate: string;
  owner: string;
  dependencies: string[]; // ids of blocking milestones
  territory: string;
  completionPct: number;
  position: [number, number, number]; // 3D canvas position
}

export const seedGtmMilestones: GtmMilestone[] = [];

// ─── Sales Pipeline ───────────────────────────────────────────────────────────

export interface SalesLead {
  id: string;
  companyName: string;
  contactName: string;
  stage: "prospect" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  dealValue: number;
  salesRep: string;
  probability: number;
  closingDate: string;
  industry: string;
}

export const seedSalesLeads: SalesLead[] = [];

export const pipelineStages = ["prospect", "qualified", "proposal", "negotiation", "closed-won"] as const;

// ─── Marketing Campaigns ──────────────────────────────────────────────────────

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: "email" | "linkedin" | "paid" | "organic" | "events";
  region: string;
  lat: number;
  lng: number;
  reach: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpl: number; // cost per lead
  status: "active" | "paused" | "completed";
}

export const seedMarketingCampaigns: MarketingCampaign[] = [];
