import { z } from "zod";

// Unified Meeting System Types
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
export type MeetingPlatform = "google_meet" | "zoom" | "microsoft_teams" | "other";
export type RecordingStatus = "not_recorded" | "recording" | "processed" | "failed";

export type MeetingParticipant = {
  id: string;
  name: string;
  email: string;
  role: "host" | "attendee" | "agent";
  joinedAt?: Date;
  leftAt?: Date;
  isPresent: boolean;
};

export type MeetingAgendaItem = {
  id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  completedAt?: Date;
  notes?: string;
};

export type MeetingRecording = {
  id: string;
  storageUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  recordedAt: Date;
  status: RecordingStatus;
};

export type MeetingTranscript = {
  id: string;
  content: string;
  segments: Array<{
    speakerId: string;
    speakerName: string;
    text: string;
    timestamp: number;
  }>;
  createdAt: Date;
};

export type Meeting = {
  id: string;
  title: string;
  description?: string;
  status: MeetingStatus;
  platform: MeetingPlatform;
  meetingUrl: string;
  startAt: Date;
  endAt: Date;
  participants: MeetingParticipant[];
  agenda?: MeetingAgendaItem[];
  recordings?: MeetingRecording[];
  transcript?: MeetingTranscript;
  summary?: string;
  actionItems?: string[];
  followUpTasks?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  hermesMemoryId?: string;
  vexaAnalysisId?: string;
  openspecValidationId?: string;
  metadata?: Record<string, any>;
};


// New options
export const caseStudyOptions = ["Yes", "No", "In Progress"] as const;
export const certificationOptions = ["GDPR", "ISO 27001", "SOC 2", "HIPAA", "PCI DSS", "Other"] as const;
export const channelOptions = ["LinkedIn", "YouTube", "X", "Other"] as const;
export const riskReversalOptions = ["Performance-based pricing", "Milestone billing", "Free trial", "Guarantee", "Other"] as const;
export const timeToStartOptions = ["Same Day", "<1 Week", "1–2 Weeks", "2–4 Weeks", "1+ Month"] as const;
export const companySizeStageOptions = ["Startup", "SMB", "Mid-Market", "Enterprise"] as const;
export const industryOptions = [
  "SaaS", "E-commerce", "Healthcare", "Finance", "Real Estate",
  "Education", "Professional Services", "Manufacturing", "Retail", "Other"
] as const;
export const regionOptions = [
  "North America", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"
] as const;
export const buyingTriggerOptions = ["Funding", "Hiring", "Leadership changes", "Tech adoption", "Expansion", "Other"] as const;
export const outreachToolOptions = ["Apollo", "HubSpot", "Salesforce", "Outreach", "Lemlist", "Other"] as const;
export const ctaOptions = ["Book a Call", "Demo", "Download Asset", "Webinar", "Other"] as const;
export const assetOptions = ["Loom", "One-pager", "Deck", "Checklist", "Case Study", "Other"] as const;
export const giftCardOptions = ["Yes", "No", "Maybe"] as const;

const urlWithProtocol = z.preprocess((val) => {
  if (typeof val !== "string") return val;
  const t = val.trim();
  if (!t) return t;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}, z.string().url("Enter a valid URL"));

// New Content Hub Data Collection Schema
export const contentHubIntakeSchema = z.object({
  // 1. Required Business Information
  businessInfo: z.object({
    officialBusinessName: z.string().min(1, "Official business name is required"),
    primaryWebsiteUrl: z.string().url("Please provide a valid website URL"),
    industryVertical: z.string().min(1, "Industry vertical is required"),
    businessType: z.enum(["B2B", "B2C", "D2C", "eCommerce", "Other"], {
      errorMap: () => ({ message: "Please select a business type" }),
    }),
    companySize: z.object({
      numberOfEmployees: z.string().min(1, "Number of employees is required"),
      revenueBracket: z.string().min(1, "Revenue bracket is required"),
    }),
    coreProductServiceName: z.string().min(1, "Core product/service name is required"),
    productServiceDescription: z.string().min(1, "Detailed product/service description is required"),
    uniqueValueProposition: z.string().min(1, "Formal UVP is required"),
    pricingModel: z.string().min(1, "Current pricing model is required"),
    targetMarket: z.string().min(1, "Target market description is required"),
    targetCountries: z.array(z.string()).min(1, "Please select at least one target country"),
    targetLanguages: z.array(z.string()).min(1, "Please select at least one target language"),
  }),

  // 2. Required Customer Information
  customerInfo: z.object({
    idealCustomerProfile: z.string().min(1, "ICP description is required"),
    buyerPersonas: z.string().min(1, "Buyer personas are required"),
    keyDecisionMakers: z.string().min(1, "Key decision makers are required"),
    customerPainPoints: z.string().min(1, "Customer pain points are required"),
    customerChallenges: z.string().min(1, "Customer challenges are required"),
    buyingTriggers: z.string().min(1, "Buying triggers are required"),
    commonObjections: z.string().min(1, "Common objections are required"),
  }),

  // 3. Required Marketing Information
  marketingInfo: z.object({
    primaryBusinessGoal: z.string().min(1, "Primary business goal is required"),
    measurableMarketingObjectives: z.string().min(1, "Measurable objectives are required"),
    currentMarketingChannels: z.array(z.string()).min(1, "Please list current marketing channels"),
    existingMarketingAssets: z.string().min(1, "Inventory of existing assets is required"),
    competitors: z.string().min(1, "Competitors are required"),
    primaryKeywords: z.string().min(1, "Primary keywords are required"),
    longTailKeywords: z.string().min(1, "Long-tail keywords are required"),
    brandTone: z.string().min(1, "Brand tone guidelines are required"),
    brandVoice: z.string().min(1, "Brand voice parameters are required"),
    marketingBudget: z.string().min(1, "Marketing budget is required"),
    salesCycleLength: z.string().min(1, "Average sales cycle length is required"),
  }),
});

export const intakeSchema = z.object({
  // Step 1: Contact Information
  name: z.string().min(1, "Full name is required"),
  emailPersonal: z.string().email("Business email address is required"),
  emailAdditional: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  websiteUrl: urlWithProtocol,
  website: urlWithProtocol.optional(), // backward compatibility
  linkedinPage: z.string().optional(),
  headquartersCountry: z.string().min(1, "Headquarters country is required"),
  headquartersCity: z.string().min(1, "Headquarters city is required"),

  // Step 2: Company & Offer Overview
  companyDescription: z.string().min(1, "Company description is required"),
  productsServices: z.string().min(1, "Products/services description is required"),
  primaryOutcome: z.string().min(1, "Primary outcome description is required"),
  keyChallenges: z.string().min(1, "Key challenges description is required"),
  uniqueValueProp: z.string().min(1, "Unique value proposition is required"),

  // Step 3: Social Proof & Credibility
  successStories: z.string().min(1, "Success stories are required"),
  uploadedDocuments: z.array(z.string()).optional(),
  customerTestimonials: z.string().min(1, "Required"),
  credibilityFactors: z.string().min(1, "Credibility factors are required"),
  certifications: z.array(z.string()).optional(),
  certificationsOther: z.string().optional(),

  // Step 4: Brand Presence & Market Positioning
  brandChannels: z.array(z.string()).optional(),
  brandChannelsOther: z.string().optional(),
  contentTypes: z.array(z.string()).optional(),
  contentTypesOther: z.string().optional(),
  publishingFrequency: z.string().min(1, "Publishing frequency is required"),

  // Step 5: Offer Structure & Sales Motion
  riskReductions: z.array(z.string()).optional(),
  riskReductionsOther: z.string().optional(),
  timeToValue: z.string().min(1, "Time to value is required"),
  primaryCta: z.string().min(1, "Primary CTA is required"),
  primaryCtaOther: z.string().optional(),
  outreachAssets: z.array(z.string()).optional(),
  outreachAssetsOther: z.string().optional(),

  // Step 6: Ideal Customer Profile (ICP)
  icpDescription: z.string().min(1, "ICP description is required"),
  targetIndustries: z.array(z.string()).min(1, "Select at least one industry"),
  targetIndustriesOther: z.string().optional(),
  targetCompanySizes: z.array(z.string()).min(1, "Select at least one company size"),
  targetRevenues: z.array(z.string()).min(1, "Select at least one revenue range"),
  targetGeographics: z.array(z.string()).min(1, "Select at least one geographic market"),
  preferredLanguages: z.array(z.string()).min(1, "Select at least one preferred language"),

  // Step 7: Decision Makers & Buying Committee
  buyingRoles: z.array(z.string()).min(1, "Select at least one buying role"),
  buyingRolesOther: z.string().optional(),
  budgetDepartments: z.array(z.string()).min(1, "Select at least one budget department"),
  targetSeniorities: z.array(z.string()).min(1, "Select at least one seniority level"),

  // Step 8: Buying Signals & Market Intelligence
  buyingSignals: z.array(z.string()).min(1, "Select at least one buying signal"),
  buyingSignalsOther: z.string().optional(),
  prospectTechnologies: z.string().min(1, "Prospect technologies are required"),

  // Step 9: Sales & Marketing Technology Stack
  crmSystems: z.array(z.string()).optional(),
  crmSystemsOther: z.string().optional(),
  outreachTools: z.array(z.string()).optional(),
  outreachToolsOther: z.string().optional(),
  marketingAutomationTools: z.array(z.string()).optional(),
  marketingAutomationToolsOther: z.string().optional(),

  // Step 10: Messaging & Campaign Strategy
  commonObjections: z.string().min(1, "Common objections are required"),
  overcomeObjections: z.string().min(1, "Objection responses are required"),
  messagingThemes: z.string().min(1, "Messaging themes are required"),
  doNotTarget: z.string().optional(),
  additionalNotes: z.string().optional(),

  // --- NEW MANDATORY: Market Sizing & Financials ---
  currentArr: z.string().min(1, "Current annual revenue / ARR is required"),
  tamSamSom: z.string().min(1, "TAM / SAM / SOM market sizing is required"),
  marketSharePercent: z.string().min(1, "Current market share percentage is required"),
  companyGrowthRatePercent: z.string().min(1, "Company growth rate (%) is required"),
  cacCustomerAcquisitionCost: z.string().min(1, "Customer Acquisition Cost (CAC) is required"),
  ltvToCacRatio: z.string().min(1, "LTV to CAC ratio is required"),
  churnRatePercent: z.string().min(1, "Monthly/annual churn rate (%) is required"),
  netPromoterScoreNps: z.string().min(1, "Net Promoter Score (NPS) is required"),

  // --- NEW MANDATORY: Competitive Landscape ---
  topCompetitors: z.string().min(1, "Top 3-5 competitors are required"),
  competitiveAdvantageMoat: z.string().min(1, "Competitive advantage / moat is required"),
  differentiatorsVsCompetitors: z.string().min(1, "Key differentiators vs competitors are required"),
  pricingVsCompetitors: z.string().min(1, "Pricing position vs competitors is required"),
  competitorThreatLevel: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),

  // --- NEW MANDATORY: Pricing Model Validation ---
  pricingModel: z.enum(["Subscription (Recurring)", "One-Time Purchase", "Usage-Based", "Freemium", "Tiered", "Hybrid", "Custom / Enterprise"]).refine(v => v.length > 0, "Pricing model selection is required"),
  averageDealSizeAcv: z.string().min(1, "Average deal size / ACV is required"),
  pricingTiersStructure: z.string().min(1, "Pricing tiers / structure is required"),
  willingnessToPayFeedback: z.string().min(1, "Customer willingness-to-pay feedback is required"),
  discountStrategy: z.string().min(1, "Discount strategy & approval process is required"),

  // --- NEW MANDATORY: Channel Strategy Development ---
  currentSalesChannels: z.array(z.string()).min(1, "Select at least one current sales channel"),
  currentSalesChannelsOther: z.string().optional(),
  currentMarketingChannelMix: z.string().min(1, "Current marketing channel performance (% of leads by channel) is required"),
  idealChannelMix: z.string().min(1, "Target ideal channel mix is required"),
  partnerReferralPrograms: z.enum(["Yes, formal program", "Yes, informal", "No active program"]).refine(v => v.length > 0, "Partner / referral program status is required"),

  // --- NEW MANDATORY: Risk Mitigation Planning ---
  keyBusinessRisks: z.string().min(1, "Key business risks (market / tech / regulatory / competitive) are required"),
  riskMitigationPlans: z.string().min(1, "Risk mitigation plans for top risks are required"),
  complianceRequirements: z.array(z.string()).min(1, "Select at least one compliance framework you must follow"),
  complianceRequirementsOther: z.string().optional(),
  dataPrivacySecurityMeasures: z.string().min(1, "Data privacy & security measures are required"),

  // --- BACKWARD COMPATIBILITY FIELDS (Optional) ---
  hasCaseStudies: z.enum(caseStudyOptions).optional(),
  brandTrust: z.string().optional(),
  contentAndPosting: z.string().optional(),
  offerPromise: z.string().optional(),
  painPoint: z.string().optional(),
  timeToGetStarted: z.string().optional(),
  irresistibleOffer: z.string().optional(),
  targetCompanySize: z.string().optional(),
  targetRegions: z.array(z.string()).optional(),
  targetDecisionMakers: z.string().optional(),
  keyBuyingTriggers: z.array(z.string()).optional(),
  keyBuyingTriggersOther: z.string().optional(),
  currentOutreachTools: z.array(z.string()).optional(),
  currentOutreachToolsOther: z.string().optional(),
  primaryCampaignCta: z.string().optional(),
  assetsAvailable: z.array(z.string()).optional(),
  assetsAvailableOther: z.string().optional(),
  coldEmailSequence: z.string().optional(),
  giftCardOffer: z.string().optional(),

  // Additional fields used by matchICP in test suite
  industry: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.string().optional(),
  currentTools: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  monthlyLeads: z.string().optional(),
  salesCycle: z.string().optional(),
});

export type IntakeFormData = z.infer<typeof intakeSchema>;
export type ContentHubIntakeData = z.infer<typeof contentHubIntakeSchema>;

export type PainPoint = {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
};

export type SolutionMapping = {
  painPoint: string;
  solution: string;
  expectedOutcome: string;
  roiEstimate: string;
  beforeAfter: {
    before: string;
    after: string;
  };
};

export type GtmInsightSection = {
  title: string;
  content: string;
};

// New types for complete GTM analysis
export type Table1FirmographicEntry = {
  priorityTier: string;
  industryVertical: string;
  companySize: string;
  arrRange: string;
  location: string;
  keyDecisionMakerDemographics: string;
  notes: string;
  // New columns per requirements
  primaryCostDriver: string;
  currentSolutionStatus: string;
  numberOfSitesTeamsLocations: string;
  sustainabilityEsgComplianceCommitment: string;
};

export type Table2PainPointEntry = {
  painPoint: string;
  severity: string;
  businessImpact: string;
  rootCause: string;
  dealFlowAISolution: string;
  // New columns per requirements
  frequencyOfPain: string;
  howPainIsCurrentlyDiscovered: string;
  competitorCurrentSolutionInUse: string;
};

export type Table3DecisionMakerEntry = {
  role: string;
  influenceScore: string;
  coreDecisionRole: string;
  top3Priorities: string;
  dealFlowAIMessagingFocus: string;
  // New columns per requirements
  preferredContactChannel: string;
  primaryObjectionType: string;
  contentFormatPreference: string;
};

export type Table4LeadScoringEntry = {
  category: string;
  criterion: string;
  points: string;
};

export type Table5ChannelEntry = {
  channel: string;
  icpSegmentsBestFor: string;
  monthlyLeadVolume: string;
  conversionRate: string;
  costPerAcquisition: string;
  ltvToCacRatio: string;
  budgetAllocation: string;
  optimizationRecommendations: string;
};

export type PurchasingJourneyStage = {
  stage: string;
  duration: string;
  customerActions: string;
  customerNeedsQuestions: string;
  channelPreferences: string;
  dealFlowAIAssetsEngagement: string;
};

export type CrossTeamAlignmentGuidelines = {
  raciFramework: any[];
  communicationCadenceSlas: any[];
  sharedSLAs: Array<{ sla: string; owner: string; escalationPath: string }>;
  weeklyReviewMeeting: { cadence: string; owner: string };
  hotLeadCriteria: string;
};

export type ICPValidationChecklist = {
  preQualificationChecklist: string[];
  quarterlyValidationReview: string[];
  dataSourcesForValidation: string[];
  icpUpdateTriggers: string[];
  quarterlyReviewOwner: string;
  scoringThresholdForRevision: string;
  reviewChecklist: string[];
};

export type AnalysisResult = {
  // Legacy fields (for compatibility)
  analysisId?: string;
  leadId?: string;
  companyName?: string;
  healthScore?: number;
  gtmPlan?: string;
  idealCustomerProfiles?: GtmInsightSection[];
  comprehensiveBrandOverview?: string;
  strategicOutreachApproach?: string;
  marketDifferentiationTriggers?: string[];
  goToMarketCoreFramework?: string;
  customerJourneyPipeline?: GtmInsightSection[];

  // New complete GTM analysis fields
  executiveSummary?: string;
  icpDefinition?: {
    inclusionCriteria: string[];
    exclusionCriteria: string[];
  };
  table1FirmographicDemographic?: Table1FirmographicEntry[];
  behavioralPsychographicTraits?: {
    observableBehavioralPatterns: string[];
    corePsychographicAttributes: string[];
  };
  table2PainPointAnalysis?: Table2PainPointEntry[];
  table3DecisionMakerInfluence?: Table3DecisionMakerEntry[];
  purchasingJourneyMapping?: PurchasingJourneyStage[];
  table4LeadScoringFramework?: {
    criteria: Table4LeadScoringEntry[];
    qualificationThresholds: {
      mql: string;
      sql: string;
      sal: string;
    };
  };
  table5ChannelEffectiveness?: Table5ChannelEntry[];
  crossTeamAlignmentGuidelines?: CrossTeamAlignmentGuidelines;
  icpValidationChecklist?: ICPValidationChecklist;

  // New sections per requirements
  sectionACompetitiveLandscape?: Array<{
    competitorName: string;
    coreOffering: string;
    keyWeakness: string;
    companyDifferentiator: string;
    positioningStatement: string;
  }>;
  sectionBMessagingAndPositioning?: Array<{
    painPoint: string;
    valuePillar: string;
    hookLine: string;
    supportingProofPoint: string;
    cta: string;
    personaMessaging: Array<{ persona: string; messaging: string }>;
  }>;
  sectionCObjectionHandlingMatrix?: Array<{
    objection: string;
    personaMostLikelyToRaiseIt: string;
    responseFramework: string;
    supportingAsset: string;
  }>;
  sectionDTamSamSom?: {
    tam: string;
    sam: string;
    som: string;
  };
  sectionEPartnerAndChannelStrategy?: {
    referralPartners: string[];
    partnerIncentiveModel: string;
    coMarketingOpportunities: string[];
  };
  sectionFRiskRegister?: Array<{
    risk: string;
    likelihood: "High" | "Medium" | "Low";
    impact: "High" | "Medium" | "Low";
    mitigation: string;
  }>;
  campaignSuccessMetrics?: {
    pipelineGeneratedTargetByTier: Array<{ tier: string; target: string }>;
    mqlToSqlConversionRateTarget: string;
    cacTargetByChannel: Array<{ channel: string; target: string }>;
    dealVelocityBenchmarkByTier: Array<{ tier: string; days: string }>;
  };
};

export const STORAGE_KEY = "dealflow_lead_context_v1";

export type StoredLeadContext = {
  form: IntakeFormData;
  analysis: AnalysisResult | null;
  feedback?: string; // New: User feedback for regeneration
  updatedAt: string;
};

// --- Agent Learning Memory (MemPalace) Architecture ---
export type MemoryCategory = 'Knowledge' | 'Rule' | 'Experience' | 'Insight' | 'Objection' | 'Preference';

export type MemoryEntry = {
  id?: string;
  leadId: string;
  agentName: string;
  category: MemoryCategory;
  content: string;
  keywords: string[];
  createdAt: string;
  importance: number; // 1-10
  lastAccessed?: string;
  accessCount?: number;
};

export type MemPalaceContext = {
  relevantMemories: MemoryEntry[];
  summary?: string;
};

export type CallStatus = 'scheduled' | 'in-progress' | 'completed' | 'failed' | 'canceled';
export type CallMode = 'calendar' | 'immediate';

export interface CallRecord {
  id?: string;
  leadId: string;
  analysisId: string;
  status: CallStatus;
  callMode: CallMode;
  meetingUrl?: string;
  recallBotId?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  updatedAtMs: number;
  dealStatus?: string;
  dealProbability?: number;
  guests?: string[];
  agentPersona?: string;
  lastHeartbeat?: string;
}

export interface LeadRecord {
  id?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  industry?: string;
  companySize?: string;
  revenue?: string;
  currentTools?: string[];
  challenges?: string[];
  targetAudience?: string;
  monthlyLeads?: string;
  salesCycle?: string;
  analysisId?: string;
  createdAt: any;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface TranscriptRecord {
  id?: string;
  callId: string;
  segments: TranscriptSegment[];
  updatedAt: string;
}

export interface SummaryRecord {
  id?: string;
  callId: string;
  content: string;
  type: 'pre-call' | 'post-call';
  sentTo?: string[];
  sentAt: string;
}

export interface ScreenSession {
  callId: string;
  url: string;
  lastActive: number;
}

export const createCallSchema = z.object({
  leadId: z.string().min(1),
  analysisId: z.string().optional().default(""),
  meetingUrl: z.string().optional(),
  scheduledAt: z.string().datetime(),
  guests: z.array(z.string().email()).optional(),
});

export const immediateCallSchema = z.object({
  leadId: z.string().min(1),
  analysisId: z.string().optional().default(""),
  personaKey: z.string().optional(),
});

// --- Missing exports for revenue-agents.ts ---
export const AGENT_FULL_NAMES = {
  ashok: "Ashok",
  harsha: "Harsha",
  kiran: "Kiran",
  vijay: "Vijay",
  avinash: "Avinash",
  kunal: "Kunal",
  praneeth: "Praneeth",
};

export const AGENT_EXPERTISE = {
  ashok: ["B2B SaaS", "Outbound", "Pipeline"],
  harsha: ["Content", "GTM", "Product-Led"],
  kiran: ["Growth", "Paid Ads", "Metrics"],
  vijay: ["Enterprise Sales", "Strategic Planning"],
  avinash: ["Account Management", "Customer Success"],
  kunal: ["Marketing Automation", "Lead Generation"],
  praneeth: ["B2B SaaS", "GTM Strategy", "RevOps", "Pipeline Optimization"],
};

export const REVENUE_AGENTS = [

  { key: "ashok", name: "Ashok", title: "Outbound Lead Specialist", bio: "Expert in outbound pipeline generation, enterprise B2B sales development, and cold outreach.", specialties: ["B2B SaaS", "Outbound", "Pipeline"] },
  { key: "harsha", name: "Harsha", title: "Content & GTM Architect", bio: "Specializes in product-led growth, content automation pipelines, and ICP alignment.", specialties: ["Content", "GTM", "Product-Led"] },
  { key: "kiran", name: "Kiran", title: "Growth & Performance Strategist", bio: "Focuses on paid ad optimization, conversion funnel analytics, and CAC reduction.", specialties: ["Growth", "Paid Ads", "Metrics"] },
  { key: "vijay", name: "Vijay", title: "Enterprise Sales Director", bio: "Strategic account executive managing multi-stakeholder enterprise deals and contract negotiations.", specialties: ["Enterprise Sales", "Strategic Planning"] },
  { key: "avinash", name: "Avinash", title: "Customer Success & Expansion Lead", bio: "Drives account retention, expansion playbooks, and post-sale onboarding experience.", specialties: ["Account Management", "Customer Success"] },
  { key: "kunal", name: "Kunal", title: "Marketing Automation Lead", bio: "Engineers automated lead generation workflows and multi-channel drip campaigns.", specialties: ["Marketing Automation", "Lead Generation"] },
  { key: "praneeth", name: "Praneeth", title: "Chief RevOps & Pipeline Specialist", bio: "Pioneers B2B RevOps optimization, deal velocity acceleration, and custom GTM frameworks.", specialties: ["B2B SaaS", "GTM Strategy", "RevOps", "Pipeline Optimization"] }
];


export type RevenueAgentProfile = {
  key: keyof typeof AGENT_FULL_NAMES;
  name: string;
  fullName: string;
  role: string;
  expertise: string[];
  activeSessions: number;
  available: boolean;
};

export function getRevenueAgentCatalog(): RevenueAgentProfile[] {
  return Object.entries(AGENT_FULL_NAMES).map(([key, name]) => ({
    key: key as keyof typeof AGENT_FULL_NAMES,
    name,
    fullName: name,
    role: "AI Revenue Agent",
    expertise: AGENT_EXPERTISE[key as keyof typeof AGENT_EXPERTISE],
    activeSessions: 0,
    available: true,
  }));
}

export function getAgentByKey(key: keyof typeof AGENT_FULL_NAMES): RevenueAgentProfile | undefined {
  return getRevenueAgentCatalog().find(agent => agent.key === key);
}

export interface AgentSession {
  id?: string;
  agentKey: string;
  leadId: string;
  companyName: string;
  status: "active" | "ended";
  startedAt: string;
  createdAt: string;
  endedAt?: string;
  updatedAt?: string;
}

export interface AgentAssignmentNotification {
  sessionId: string;
  agentKey: string;
  leadId: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  startedAt: string;
  icpDocumentContent: string;
  sqlQueriesContent: string;
  sentAt: string;
}

// --- New Types for Role-Based Pages and Tasks ---
export type UserRole = "admin" | "agent" | "customer";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  agentKey?: keyof typeof AGENT_FULL_NAMES; // For agents only
  phoneNumber?: string;
  countryCode?: string;
  callConversationFramework?: string;
  whatsAppMessageParameters?: string;
}

export type TaskStatus = "todo" | "pending" | "in-progress" | "completed" | "blocked" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  assignedAgentKey?: keyof typeof AGENT_FULL_NAMES;
  customerId: string;
  customerName?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  progressNotes: string[];
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  taskId?: string;
  sessionId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
  timestamp?: string;
  read?: boolean;
  attachments?: FileAttachment[];
}

export interface SharedFile {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface SharedLink {
  id: string;
  taskId: string;
  addedBy: string;
  url: string;
  title: string;
  createdAt: string;
}

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface PortalCallRecord {
  id: string;
  sessionId: string;
  callerId: string;
  callerName: string;
  callerRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt: string;
}

export interface CustomerFeedback {
  id: string;
  sessionId: string;
  agentId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  periodStart: string;
  periodEnd: string;
  tasksCompleted: number;
  totalTasks: number;
  averageResolutionTime: number;
  averageRating: number;
  totalInteractions: number;
  totalFeedback: number;
}

export interface AgentCredits {
  agentId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

// --- HeyGen Types ---
export interface HeyGenAvatar {
  id: string;
  name: string;
  thumbnailUrl: string;
  gender?: string;
  language?: string;
}

export interface HeyGenTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export type HeyGenVideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface HeyGenVideo {
  id: string;
  status: HeyGenVideoStatus;
  title?: string;
  prompt?: string;
  avatarId?: string;
  templateId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface HeyGenSettings {
  apiKey?: string;
}

export interface HeyGenError {
  code: string;
  message: string;
  details?: any;
}

// --- New Features: Page Locking ---
export interface PageLockState {
  id?: string;
  leadId: string;
  pageIndex: number;
  locked: boolean;
  lockedAt: string;
  lockedBy: string;
}

// --- New Features: Agent Assignment ---
export interface AgentAssignment {
  id: string;
  leadId: string;
  agentKey: keyof typeof AGENT_FULL_NAMES;
  agentName: string;
  customerId?: string;
  assignedAt: string;
  status: "pending" | "active" | "completed";
}

// --- New Features: Customer Credentials ---
export interface CustomerCredentials {
  id: string;
  leadId: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  isVerified: boolean;
}

// --- Extend existing interfaces ---
export interface ExtendedLeadRecord extends LeadRecord {
  assignedAgentKey?: keyof typeof AGENT_FULL_NAMES;
  pageLocks?: number[];
  customerCredentialsId?: string;
  agentAssignmentId?: string;
}

// --- Multi-Agent RAG System Types ---
export type AgentRole = "Retrieval" | "ContextSynthesis" | "ResponseGeneration" | "Verification" | "Audit" | "Graph" | "Equip" | "Network" | "Track" | "Influence" | "Convert";

export interface AgentTask {
  id: string;
  role: AgentRole;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed" | "failed" | "reassigned";
  input: Record<string, any>;
  output?: Record<string, any>;
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retries: number;
  maxRetries: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  vector?: number[];
  metadata: {
    source: string;
    pageNumber?: number;
    chunkIndex: number;
    documentType: "text" | "manual" | "research" | "other";
    [key: string]: any;
  };
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to?: AgentRole | "all";
  type: "task" | "data" | "status" | "error" | "completion";
  content: any;
  timestamp: string;
}

// --- A.G.E.N.T.I.C. Framework Types ---
export interface AgenticContext {
  conversationId: string;
  tasks: AgentTask[];
  messages: AgentMessage[];
  contextualMemory: Record<string, any>;
  timestamp: string;
}

export interface FrameworkMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageLatency: number;
  uptime: number;
  agentLoad: Record<AgentRole, number>;
}

export interface FrameworkConfig {
  maxConcurrentTasks: number;
  defaultTimeoutMs: number;
  selfHealingEnabled: boolean;
  retryBackoffMs: number;
}
