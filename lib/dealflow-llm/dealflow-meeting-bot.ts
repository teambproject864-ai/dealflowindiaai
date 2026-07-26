// lib/dealflow-llm/dealflow-meeting-bot.ts
import { DealflowLLM } from "./dealflow-llm";
import { getCallTypeConfig, CallTypeConfig } from "../call-bot/call-router";
import { searchCRMRecords } from "../crm-store";
import { generateMOMDocument, MinutesOfMeeting } from "../call-bot/mom-generator";
import { sendPostCallMOMEmail } from "../post-call-email";

export type CallScenario = "client_sales" | "customer_checkin" | "internal_standup" | "onboarding" | "cross_functional";

export interface BotCustomizationInput {
  companyName?: string;
  contactName?: string;
  customTalkTrack?: string;
  keyObjectionRules?: Array<{ objectionPattern: string; recommendedResponse: string }>;
  productFocus?: string;
  pricingGuardrails?: { maxDiscountPercent: number; requireApprovalForSLA: boolean };
  inCallPromptOverrides?: string[];
}

export interface LiveTranscriptChunk {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface InMeetingDecision {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  requiresAgentApproval: boolean;
  status: "autonomous_executed" | "pending_agent_review" | "approved" | "rejected";
  proposedAction: string;
  impactScore: number;
}

export interface LiveMeetingBotState {
  botId: string;
  meetingUrl: string;
  callScenario: CallScenario;
  status: "initializing" | "connected" | "analyzing" | "completed" | "failed";
  participants: string[];
  transcript: LiveTranscriptChunk[];
  sentimentScore: number; // 0 to 1
  sentimentRating: "Positive" | "Neutral" | "Negative";
  detectedObjections: Array<{ objection: string; suggestedResolution: string; confidence: number }>;
  extractedActionItems: Array<{ task: string; owner: string; priority: "high" | "medium" | "low" }>;
  decisions: InMeetingDecision[];
  customizations?: BotCustomizationInput;
  startTime: string;
  endTime?: string;
}

export interface GeneratedActionPlan {
  planId: string;
  callId: string;
  companyName: string;
  overallStrategy: string;
  dealConversionProbability: number;
  recommendedSteps: Array<{
    stepNumber: number;
    action: string;
    targetOwner: string;
    timeline: string;
    rationale: string;
  }>;
  riskMitigation: string[];
  alignmentScore: number; // 0 to 1
}

export class DealflowMeetingBot {
  private llm: DealflowLLM;
  private state: LiveMeetingBotState;
  private callConfig: CallTypeConfig;

  constructor(botId: string, meetingUrl: string, scenario: CallScenario = "client_sales", customizations?: BotCustomizationInput) {
    this.llm = new DealflowLLM({ fusionStrategy: "llm_primary_with_enhancements" });
    this.callConfig = getCallTypeConfig(scenario);
    this.state = {
      botId,
      meetingUrl,
      callScenario: scenario,
      status: "initializing",
      participants: [],
      transcript: [],
      sentimentScore: 0.85,
      sentimentRating: "Positive",
      detectedObjections: [],
      extractedActionItems: [],
      decisions: [],
      customizations: customizations || {},
      startTime: new Date().toISOString(),
    };
  }

  public getBotState(): LiveMeetingBotState {
    return { ...this.state };
  }

  public setCustomizations(customizations: BotCustomizationInput) {
    this.state.customizations = {
      ...this.state.customizations,
      ...customizations,
    };
  }

  public injectInCallOverride(overridePrompt: string) {
    if (!this.state.customizations) {
      this.state.customizations = {};
    }
    if (!this.state.customizations.inCallPromptOverrides) {
      this.state.customizations.inCallPromptOverrides = [];
    }
    this.state.customizations.inCallPromptOverrides.push(overridePrompt);
  }

  public async connect(): Promise<boolean> {
    this.state.status = "connected";
    return true;
  }

  public async ingestTranscriptChunk(chunk: LiveTranscriptChunk): Promise<void> {
    this.state.transcript.push(chunk);
    if (!this.state.participants.includes(chunk.speaker)) {
      this.state.participants.push(chunk.speaker);
    }
    this.state.status = "analyzing";

    // Analyze chunk for objections & action items
    await this.processChunkAnalysis(chunk);
  }

  private async processChunkAnalysis(chunk: LiveTranscriptChunk): Promise<void> {
    const text = chunk.text.toLowerCase();

    // 1. Objections handling per scenario
    if (this.callConfig.objectionHandlingEnabled || this.state.callScenario === "client_sales") {
      if (text.includes("expensive") || text.includes("cost") || text.includes("budget") || text.includes("price")) {
        const customRule = this.state.customizations?.keyObjectionRules?.find(r => text.includes(r.objectionPattern.toLowerCase()));
        this.state.detectedObjections.push({
          objection: "Pricing / Budget Concern",
          suggestedResolution: customRule ? customRule.recommendedResponse : "Demonstrate direct ROI metrics & offer phased rollouts.",
          confidence: 0.92,
        });

        // Trigger decision logic
        const maxDisc = this.state.customizations?.pricingGuardrails?.maxDiscountPercent ?? 15;
        if (text.includes("discount") || text.includes("lower rate")) {
          this.evaluateDecision({
            title: "Custom Discount Request",
            description: `Participant requested discount during ${this.state.callScenario} meeting.`,
            riskLevel: "high",
            requiresAgentApproval: true,
            proposedAction: `Flagged for Agent Review (Max allowed autonomous: ${maxDisc}%)`,
            impactScore: 0.88,
          });
        }
      } else if (text.includes("security") || text.includes("compliance") || text.includes("soc2") || text.includes("sla")) {
        this.state.detectedObjections.push({
          objection: "Security & Compliance Requirement",
          suggestedResolution: "Provide SOC2 Type II audit report & enterprise data residency terms.",
          confidence: 0.89,
        });

        if (this.state.customizations?.pricingGuardrails?.requireApprovalForSLA) {
          this.evaluateDecision({
            title: "Custom SLA & Compliance Terms Request",
            description: "Participant requested custom SLA terms requiring legal exception.",
            riskLevel: "high",
            requiresAgentApproval: true,
            proposedAction: "Escalate to Agent Portal Approval Queue",
            impactScore: 0.95,
          });
        }
      }
    }

    // 2. Action items extraction per scenario
    if (text.includes("will send") || text.includes("follow up") || text.includes("action item") || text.includes("next step") || text.includes("assign")) {
      this.state.extractedActionItems.push({
        task: `Follow up on: "${chunk.text.slice(0, 80)}..."`,
        owner: chunk.speaker,
        priority: text.includes("urgent") || text.includes("asap") ? "high" : "medium",
      });

      // Low risk autonomous decision
      this.evaluateDecision({
        title: "Schedule Automated CRM Task & Follow-up",
        description: `Auto-create task for ${chunk.speaker} in CRM.`,
        riskLevel: "low",
        requiresAgentApproval: false,
        proposedAction: "Autonomous Execution: Logged CRM Task & Scheduled Follow-up Reminder",
        impactScore: 0.3,
      });
    }

    // 3. Sentiment update
    if (text.includes("great") || text.includes("love") || text.includes("perfect") || text.includes("awesome")) {
      this.state.sentimentScore = Math.min(1.0, this.state.sentimentScore + 0.05);
      this.state.sentimentRating = "Positive";
    } else if (text.includes("frustrated") || text.includes("problem") || text.includes("bad") || text.includes("unhappy")) {
      this.state.sentimentScore = Math.max(0.0, this.state.sentimentScore - 0.1);
      this.state.sentimentRating = this.state.sentimentScore < 0.4 ? "Negative" : "Neutral";
    }
  }

  private evaluateDecision(params: {
    title: string;
    description: string;
    riskLevel: "low" | "medium" | "high";
    requiresAgentApproval: boolean;
    proposedAction: string;
    impactScore: number;
  }) {
    const decision: InMeetingDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      title: params.title,
      description: params.description,
      riskLevel: params.riskLevel,
      requiresAgentApproval: params.requiresAgentApproval,
      status: params.requiresAgentApproval ? "pending_agent_review" : "autonomous_executed",
      proposedAction: params.proposedAction,
      impactScore: params.impactScore,
    };
    this.state.decisions.push(decision);
  }

  public async generateDataDrivenActionPlan(): Promise<GeneratedActionPlan> {
    const companyName = this.state.customizations?.companyName || "Client Enterprise";
    const crmRecords = await searchCRMRecords({ query: companyName });
    const historicalDeals = crmRecords.deals || [];

    const winCount = historicalDeals.filter(d => d.stage === "closed-won").length;
    const totalCount = Math.max(historicalDeals.length, 1);
    const winRate = historicalDeals.length > 0 ? winCount / totalCount : 0.75;

    // Use Dealflow LLM to synthesize meeting context with historical win patterns
    const prompt = `Synthesize action plan for company ${companyName}.
Scenario: ${this.state.callScenario}.
Transcript summary: ${this.state.transcript.map(t => t.text).slice(0, 10).join(" | ")}.
Action items count: ${this.state.extractedActionItems.length}.
Objections count: ${this.state.detectedObjections.length}.
Historical Win Rate: ${(winRate * 100).toFixed(1)}%.`;

    const llmResult = await this.llm.infer(prompt, "You are a senior Dealflow strategy engine.");

    const recommendedSteps = [
      {
        stepNumber: 1,
        action: `Dispatch tailored GTM ROI model to ${this.state.customizations?.contactName || "Decision Maker"}.`,
        targetOwner: "Account Executive",
        timeline: "Within 24 Hours",
        rationale: "Addresses price/ROI concern raised during the meeting.",
      },
      {
        stepNumber: 2,
        action: "Confirm technical integration prerequisites & API access.",
        targetOwner: "Solutions Engineer",
        timeline: "Day 2",
        rationale: "Accelerates technical validation based on historical deal velocity.",
      },
      {
        stepNumber: 3,
        action: "Conduct executive alignment review & finalize contract terms.",
        targetOwner: "Sales Director",
        timeline: "Day 5",
        rationale: "Secures stakeholder consensus before quarter-end closing.",
      },
    ];

    if (this.state.extractedActionItems.length > 0) {
      recommendedSteps.push({
        stepNumber: 4,
        action: `Complete captured in-meeting commitment: ${this.state.extractedActionItems[0].task}`,
        targetOwner: this.state.extractedActionItems[0].owner,
        timeline: "Immediate",
        rationale: "Directly fulfills participant commitment logged in meeting notes.",
      });
    }

    const strategyText = (llmResult?.fusedOutput || llmResult?.llmOutput || "Execute structured multi-touch outreach focusing on high-ROI deliverables and technical validation.").slice(0, 300);

    return {
      planId: `plan-${Date.now()}`,
      callId: this.state.botId,
      companyName,
      overallStrategy: strategyText,
      dealConversionProbability: Math.min(0.98, Math.max(0.45, winRate + 0.15 * this.state.sentimentScore)),
      recommendedSteps,
      riskMitigation: [
        "Address custom discount expectations via value-add services rather than price cuts.",
        "Ensure enterprise security audit docs are delivered prior to technical review.",
      ],
      alignmentScore: 0.91,
    };

  }

  public async finishCallAndDistributeMOM(recipientEmails: string[]): Promise<MinutesOfMeeting> {
    this.state.status = "completed";
    this.state.endTime = new Date().toISOString();

    const actionPlan = await this.generateDataDrivenActionPlan();
    const mom = generateMOMDocument(this.state, actionPlan);

    if (recipientEmails && recipientEmails.length > 0) {
      await sendPostCallMOMEmail({
        recipients: recipientEmails,
        mom,
      });
    }

    return mom;
  }
}
