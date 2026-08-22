// lib/mcp/dealflow-mcp-client.ts
import { MCPClient as LegacyMCPClient, Transport, LocalTransport } from "./client";
import { 
  DealContextResource, 
  LeadProfileResource, 
  StrategyArtifactResource, 
  GovernancePolicyResource 
} from "./dealflow-mcp-protocol";

export class DealflowMCPClient extends LegacyMCPClient {
  constructor(transport?: Transport) {
    super(transport || new LocalTransport());
  }

  /**
   * Reads standardized deal context
   */
  public async getDealContext(dealId: string): Promise<DealContextResource | null> {
    try {
      const res = await this.readResource(`dealflow://deal/${dealId}`);
      if (res.contents && res.contents[0]?.text) {
        return JSON.parse(res.contents[0].text);
      }
      return null;
    } catch (err) {
      console.warn(`[DealflowMCPClient] Failed to read deal context (${dealId}):`, err);
      return null;
    }
  }

  /**
   * Reads lead intelligence profile
   */
  public async getLeadProfile(leadId: string): Promise<LeadProfileResource | null> {
    try {
      const res = await this.readResource(`dealflow://lead/${leadId}`);
      if (res.contents && res.contents[0]?.text) {
        return JSON.parse(res.contents[0].text);
      }
      return null;
    } catch (err) {
      console.warn(`[DealflowMCPClient] Failed to read lead profile (${leadId}):`, err);
      return null;
    }
  }

  /**
   * Evaluates proposed concession boundaries
   */
  public async evaluateNegotiation(params: {
    dealId: string;
    requestedDiscount: number;
    requestedPaymentTerms?: string;
  }): Promise<{ decision: string; withinBoundary: boolean; counterOffer?: string | null }> {
    const result = await this.callTool("dealflow_evaluate_negotiation", params);
    const parsed = JSON.parse(result.content[0].text || "{}");
    return parsed;
  }

  /**
   * Routes a deal to appropriate agent
   */
  public async routeDeal(params: {
    dealId: string;
    intentSignal?: string;
    urgency?: string;
  }): Promise<{ status: string; routedTo: string; reason: string }> {
    const result = await this.callTool("dealflow_route_deal", params);
    const parsed = JSON.parse(result.content[0].text || "{}");
    return parsed;
  }

  /**
   * Updates deal stage
   */
  public async updateDealStage(params: {
    dealId: string;
    newStage: string;
    notes?: string;
  }): Promise<{ status: string; updatedStage: string }> {
    const result = await this.callTool("dealflow_update_stage", params);
    const parsed = JSON.parse(result.content[0].text || "{}");
    return parsed;
  }

  /**
   * Generates MOM from transcript
   */
  public async generateMOM(params: {
    dealId: string;
    transcript: string;
    participants?: string[];
  }): Promise<{ dealId: string; momTitle: string; summary: string; actionItems: any[] }> {
    const result = await this.callTool("dealflow_generate_mom", params);
    const parsed = JSON.parse(result.content[0].text || "{}");
    return parsed;
  }
}
