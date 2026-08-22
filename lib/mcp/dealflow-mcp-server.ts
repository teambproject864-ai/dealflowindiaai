// lib/mcp/dealflow-mcp-server.ts
import { 
  JSONRPCRequest, 
  JSONRPCResponse, 
  MCPErrorCode,
  DealContextResource,
  LeadProfileResource,
  StrategyArtifactResource,
  GovernancePolicyResource,
  DEALFLOW_STANDARD_TOOLS,
  DealflowToolDefinition
} from "./dealflow-mcp-protocol";
import { MCPServer as LegacyMCPServer } from "./server";

export class DealflowMCPServer extends LegacyMCPServer {
  private deals: Map<string, DealContextResource> = new Map();
  private leads: Map<string, LeadProfileResource> = new Map();
  private strategies: Map<string, StrategyArtifactResource> = new Map();
  private governance: Map<string, GovernancePolicyResource> = new Map();

  constructor(serverName: string = "Dealflow MCP Server", version: string = "2.0.0") {
    super(serverName, version);
    this.seedDefaultDealContext();
    this.registerStandardDealflowTools();
    this.registerStandardDealflowResources();
  }

  /**
   * Seeds demo and baseline deal records into the context server
   */
  private seedDefaultDealContext() {
    const defaultDeal: DealContextResource = {
      dealId: "deal-101",
      organizationId: "org-acme",
      dealName: "Acme Corp Autonomous Sales Transformation",
      clientName: "Acme Corporation",
      stage: "negotiation",
      dealValue: 85000,
      currency: "USD",
      leadScore: 94,
      assignedAgent: {
        id: "agent-rev-1",
        name: "Alex Rivera",
        role: "Senior AI Revenue Specialist",
      },
      requirements: [
        "Autonomous outbound qualification via WhatsApp & Voice",
        "CRM Two-way sync with Salesforce & HubSpot",
        "Role-based multi-tenant compliance logs"
      ],
      objections: [
        "Concerns regarding autonomous pricing boundaries during live calls",
        "Data privacy compliance on WhatsApp chat archives"
      ],
      concessionBoundaries: {
        minDiscountPercent: 0,
        maxDiscountPercent: 15,
        paymentTerms: "Net 30",
        customSlaAllowed: true,
      },
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    };
    this.deals.set(defaultDeal.dealId, defaultDeal);

    const defaultLead: LeadProfileResource = {
      leadId: "lead-201",
      companyName: "Acme Corporation",
      industry: "B2B SaaS / Enterprise Infrastructure",
      headcount: "250-500",
      estimatedRevenue: "$25M - $50M",
      icpFitScore: 96,
      intentSignals: [
        { signal: "High frequency pricing page visits", confidence: 0.92, source: "Clearbit", timestamp: new Date().toISOString() },
        { signal: "Hiring 10+ Outbound SDRs", confidence: 0.88, source: "LinkedIn Jobs", timestamp: new Date().toISOString() }
      ],
      contactPerson: {
        name: "David Vance",
        title: "Chief Revenue Officer",
        email: "david.vance@acmecorp.com",
        phone: "+1 (555) 019-2831",
      },
      painPoints: [
        "High SDR turnover and onboarding delays",
        "Inconsistent objection handling across global timezones"
      ]
    };
    this.leads.set(defaultLead.leadId, defaultLead);

    const defaultStrategy: StrategyArtifactResource = {
      strategyId: "strat-301",
      dealId: "deal-101",
      playbookName: "Enterprise AI Workforce Acceleration",
      valueProposition: "Cut deal cycle time by 48% with 24/7 autonomous human-like negotiation & immediate MOM delivery.",
      competitiveBattlecards: [
        {
          competitor: "Traditional SDR Outsource",
          strengths: ["Human empathy"],
          weaknesses: ["High cost", "Slow response time", "High error rate"],
          killerPoints: ["10x lower CAC with zero ramp-up time"]
        }
      ],
      pitchScript: "DealFlow doesn't just suggest steps—it joins sales calls and closes deals within pre-approved boundary parameters.",
      objectionResponses: {
        "pricing": "We offer tiered performance models with immediate ROI guarantees.",
        "security": "All message payloads and meeting transcripts are SHA-256 hashed and vault-stored."
      },
      recommendedPricingTier: "enterprise",
    };
    this.strategies.set(defaultStrategy.strategyId, defaultStrategy);

    const defaultGov: GovernancePolicyResource = {
      orgId: "org-acme",
      policyName: "Enterprise Strict Governance Policy",
      maxAutonomousDiscount: 15,
      complianceAuditingEnabled: true,
      requiredDisclaimers: ["AI Representative disclosure", "Call recording notification"],
      dataResidencyRegion: "US-East",
      allowedChannels: ["whatsapp", "email", "call", "meet"],
    };
    this.governance.set(defaultGov.orgId, defaultGov);
  }

  /**
   * Registers all standardized Dealflow Context tools
   */
  private registerStandardDealflowTools() {
    // 1. Route Deal Tool
    this.registerTool(
      {
        name: "dealflow_route_deal",
        description: "Intelligently routes a deal to the optimal AI agent persona or human escalation specialist.",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            intentSignal: { type: "string" },
            urgency: { type: "string" }
          },
          required: ["dealId"]
        }
      },
      async (args: { dealId: string; intentSignal?: string; urgency?: string }) => {
        const deal = this.deals.get(args.dealId);
        if (!deal) {
          return {
            content: [{ type: "text", text: `Deal not found: ${args.dealId}` }],
            isError: true,
          };
        }

        const isHighUrgency = args.urgency === "high" || args.urgency === "critical";
        const assignedRole = isHighUrgency ? "Executive Deal Closer Agent" : "Senior AI Revenue Specialist";

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                dealId: args.dealId,
                routedTo: assignedRole,
                reason: `Assigned based on urgency '${args.urgency || "standard"}' and stage '${deal.stage}'.`,
                timestamp: new Date().toISOString(),
              }, null, 2),
            }
          ]
        };
      }
    );

    // 2. Update Stage Tool
    this.registerTool(
      {
        name: "dealflow_update_stage",
        description: "Updates deal pipeline stage, recalculates win probability, and dispatches multi-channel webhooks.",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            newStage: { type: "string" },
            notes: { type: "string" }
          },
          required: ["dealId", "newStage"]
        }
      },
      async (args: { dealId: string; newStage: any; notes?: string }) => {
        const deal = this.deals.get(args.dealId);
        if (!deal) {
          return {
            content: [{ type: "text", text: `Deal not found: ${args.dealId}` }],
            isError: true,
          };
        }

        deal.stage = args.newStage;
        deal.lastActivityAt = new Date().toISOString();
        this.deals.set(args.dealId, deal);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                dealId: args.dealId,
                updatedStage: args.newStage,
                notes: args.notes || "Stage updated via Dealflow MCP",
                updatedAt: deal.lastActivityAt,
              }, null, 2),
            }
          ]
        };
      }
    );

    // 3. Evaluate Negotiation Tool
    this.registerTool(
      {
        name: "dealflow_evaluate_negotiation",
        description: "Evaluates proposed concessions against organizational governance bounds.",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            requestedDiscount: { type: "number" },
            requestedPaymentTerms: { type: "string" }
          },
          required: ["dealId", "requestedDiscount"]
        }
      },
      async (args: { dealId: string; requestedDiscount: number; requestedPaymentTerms?: string }) => {
        const deal = this.deals.get(args.dealId);
        const maxDiscount = deal?.concessionBoundaries?.maxDiscountPercent ?? 15;
        const isApproved = args.requestedDiscount <= maxDiscount;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                decision: isApproved ? "APPROVED" : "REQUIRES_HUMAN_OVERRIDE",
                dealId: args.dealId,
                requestedDiscount: `${args.requestedDiscount}%`,
                maxAllowedDiscount: `${maxDiscount}%`,
                withinBoundary: isApproved,
                counterOffer: isApproved ? null : `${maxDiscount}% discount with annual upfront payment terms`,
                evaluationTime: new Date().toISOString(),
              }, null, 2),
            }
          ]
        };
      }
    );

    // 4. Generate MOM Tool
    this.registerTool(
      {
        name: "dealflow_generate_mom",
        description: "Generates structured Minutes of Meeting (MOM) and action items.",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            transcript: { type: "string" }
          },
          required: ["dealId", "transcript"]
        }
      },
      async (args: { dealId: string; transcript: string; participants?: string[] }) => {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                dealId: args.dealId,
                momTitle: "Dealflow AI Strategy Alignment Session",
                summary: "Reviewed outbound qualification workflow, integration timeline, and pricing framework.",
                actionItems: [
                  { owner: "Dealflow AI", task: "Configure OpenWA WhatsApp Gateway channel", deadline: "24h" },
                  { owner: "Client", task: "Approve concession boundary guidelines", deadline: "48h" }
                ],
                generatedAt: new Date().toISOString(),
              }, null, 2),
            }
          ]
        };
      }
    );

    // 5. Sync Context Tool
    this.registerTool(
      {
        name: "dealflow_sync_context",
        description: "Synchronizes deal state across WhatsApp, CRM, and Call Bot.",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            channel: { type: "string" },
            contextUpdates: { type: "object" }
          },
          required: ["dealId", "channel", "contextUpdates"]
        }
      },
      async (args: { dealId: string; channel: string; contextUpdates: Record<string, any> }) => {
        const deal = this.deals.get(args.dealId);
        if (deal && args.contextUpdates) {
          Object.assign(deal, args.contextUpdates);
          deal.lastActivityAt = new Date().toISOString();
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "synced",
                dealId: args.dealId,
                channel: args.channel,
                synchronizedAt: new Date().toISOString(),
              }, null, 2),
            }
          ]
        };
      }
    );
  }

  /**
   * Registers URI-based resource readers
   */
  private registerStandardDealflowResources() {
    // 1. Deal Context Resource Provider
    this.registerResource(
      {
        uri: "dealflow://deal/deal-101",
        name: "Acme Deal Context",
        description: "Full deal pipeline context, requirements, boundaries, and assignment.",
        mimeType: "application/json",
      },
      async () => {
        const deal = this.deals.get("deal-101");
        return {
          contents: [{ uri: "dealflow://deal/deal-101", mimeType: "application/json", text: JSON.stringify(deal, null, 2) }]
        };
      }
    );

    // 2. Lead Profile Resource Provider
    this.registerResource(
      {
        uri: "dealflow://lead/lead-201",
        name: "Acme Lead Intelligence Profile",
        description: "ICP Fit Score, intent signals, firmographics, and pain points.",
        mimeType: "application/json",
      },
      async () => {
        const lead = this.leads.get("lead-201");
        return {
          contents: [{ uri: "dealflow://lead/lead-201", mimeType: "application/json", text: JSON.stringify(lead, null, 2) }]
        };
      }
    );

    // 3. Strategy Resource Provider
    this.registerResource(
      {
        uri: "dealflow://strategy/strat-301",
        name: "Enterprise GTM Playbook Strategy",
        description: "Competitive battlecards, pitch scripts, and pricing recommendations.",
        mimeType: "application/json",
      },
      async () => {
        const strategy = this.strategies.get("strat-301");
        return {
          contents: [{ uri: "dealflow://strategy/strat-301", mimeType: "application/json", text: JSON.stringify(strategy, null, 2) }]
        };
      }
    );

    // 4. Governance Resource Provider
    this.registerResource(
      {
        uri: "dealflow://governance/org-acme",
        name: "Enterprise Governance & Compliance Policy",
        description: "Concession boundaries, disclaimers, and auditing parameters.",
        mimeType: "application/json",
      },
      async () => {
        const gov = this.governance.get("org-acme");
        return {
          contents: [{ uri: "dealflow://governance/org-acme", mimeType: "application/json", text: JSON.stringify(gov, null, 2) }]
        };
      }
    );
  }

  /**
   * Allows dynamic deal creation/upsert for workflows
   */
  public upsertDealContext(deal: DealContextResource) {
    this.deals.set(deal.dealId, deal);
    this.registerResource(
      {
        uri: `dealflow://deal/${deal.dealId}`,
        name: deal.dealName,
        description: `Deal Context for ${deal.clientName}`,
        mimeType: "application/json",
      },
      async () => ({
        contents: [{ uri: `dealflow://deal/${deal.dealId}`, mimeType: "application/json", text: JSON.stringify(deal, null, 2) }]
      })
    );
  }
}
