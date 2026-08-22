/**
 * Dealflow Model Context Protocol (MCP) Specification
 * Standardized framework for managing context data across all deal-related workflows.
 */

import { JSONRPCId, JSONRPCRequest, JSONRPCResponse, JSONRPCError, MCPErrorCode } from "./protocol";

export { MCPErrorCode };
export type { JSONRPCId, JSONRPCRequest, JSONRPCResponse, JSONRPCError };

// Standardized Dealflow Context Resources
export interface DealContextResource {
  dealId: string;
  organizationId: string;
  dealName: string;
  clientName: string;
  stage: "prospecting" | "qualification" | "discovery" | "demo" | "negotiation" | "closing" | "delivered";
  dealValue: number;
  currency: string;
  leadScore: number;
  assignedAgent: {
    id: string;
    name: string;
    role: string;
  };
  requirements: string[];
  objections: string[];
  concessionBoundaries: {
    minDiscountPercent: number;
    maxDiscountPercent: number;
    paymentTerms: string;
    customSlaAllowed: boolean;
  };
  lastActivityAt: string;
  createdAt: string;
}

export interface LeadProfileResource {
  leadId: string;
  companyName: string;
  industry: string;
  headcount: string;
  estimatedRevenue: string;
  icpFitScore: number;
  intentSignals: Array<{
    signal: string;
    confidence: number;
    source: string;
    timestamp: string;
  }>;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
    linkedinUrl?: string;
  };
  painPoints: string[];
}

export interface StrategyArtifactResource {
  strategyId: string;
  dealId?: string;
  playbookName: string;
  valueProposition: string;
  competitiveBattlecards: Array<{
    competitor: string;
    strengths: string[];
    weaknesses: string[];
    killerPoints: string[];
  }>;
  pitchScript: string;
  objectionResponses: Record<string, string>;
  recommendedPricingTier: "starter" | "growth" | "enterprise";
}

export interface GovernancePolicyResource {
  orgId: string;
  policyName: string;
  maxAutonomousDiscount: number;
  complianceAuditingEnabled: boolean;
  requiredDisclaimers: string[];
  dataResidencyRegion: string;
  allowedChannels: Array<"whatsapp" | "email" | "call" | "meet">;
}

// Dealflow MCP Tool Definitions
export interface DealflowToolDefinition {
  name: string;
  description: string;
  category: "deal_pipeline" | "lead_intelligence" | "negotiation" | "meeting_mom" | "compliance";
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const DEALFLOW_STANDARD_TOOLS: DealflowToolDefinition[] = [
  {
    name: "dealflow_route_deal",
    description: "Intelligently routes a deal to the optimal AI agent persona or human escalation specialist.",
    category: "deal_pipeline",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string" },
        intentSignal: { type: "string" },
        urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
      },
      required: ["dealId"],
    },
  },
  {
    name: "dealflow_update_stage",
    description: "Updates deal pipeline stage, recalculates win probability, and dispatches multi-channel webhooks.",
    category: "deal_pipeline",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string" },
        newStage: { 
          type: "string", 
          enum: ["prospecting", "qualification", "discovery", "demo", "negotiation", "closing", "delivered"] 
        },
        notes: { type: "string" },
      },
      required: ["dealId", "newStage"],
    },
  },
  {
    name: "dealflow_evaluate_negotiation",
    description: "Evaluates proposed concessions (discounts, terms, SLAs) against organizational governance bounds.",
    category: "negotiation",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string" },
        requestedDiscount: { type: "number" },
        requestedPaymentTerms: { type: "string" },
        customSlaRequested: { type: "boolean" },
      },
      required: ["dealId", "requestedDiscount"],
    },
  },
  {
    name: "dealflow_generate_mom",
    description: "Generates structured Minutes of Meeting (MOM), action items, and next milestones from transcript.",
    category: "meeting_mom",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string" },
        transcript: { type: "string" },
        participants: { type: "array", items: { type: "string" } },
      },
      required: ["dealId", "transcript"],
    },
  },
  {
    name: "dealflow_sync_context",
    description: "Synchronizes deal state across WhatsApp (Evolution/OpenWA), Live Call Bot, and CRM.",
    category: "deal_pipeline",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string" },
        channel: { type: "string", enum: ["whatsapp_openwa", "whatsapp_evolution", "call_bot", "crm"] },
        contextUpdates: { type: "object" },
      },
      required: ["dealId", "channel", "contextUpdates"],
    },
  }
];
