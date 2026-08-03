// --- Portal & Agent Workspace Core Types ---

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent" | "customer";
  createdAt: string;
  phoneNumber?: string;
  countryCode?: string;
  callConversationFramework?: string;
  whatsAppMessageParameters?: string;
}

export type TaskStatus = "todo" | "in-progress" | "completed" | "blocked";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgentId: string;
  customerId: string;
  priority: "urgent" | "high" | "medium" | "low";
  progressNotes: string[];
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
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

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: "admin" | "agent" | "customer";
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: FileAttachment[];
}

export interface PortalCallRecord {
  id: string;
  sessionId: string;
  callerId: string;
  callerName: string;
  callerRole: "admin" | "agent" | "customer";
  receiverId: string;
  receiverName: string;
  receiverRole: "admin" | "agent" | "customer";
  status: "completed" | "failed" | "canceled" | "scheduled" | "in-progress";
  duration: number;
  startedAt: string;
  endedAt?: string;
}

export interface CustomerFeedback {
  id: string;
  sessionId: string;
  agentId: string;
  customerId: string;
  rating: number;
  comment: string;
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
    type: "onboarding" | "lead" | "call" | "analysis" | "message";
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export interface CustomerCredits {
  customerId: string;
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  transactions: Array<{
    id: string;
    type: "purchase" | "consultation" | "call" | "analysis" | "message" | "bonus";
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

// --- CRM Requirement Types
export type RequirementCategory = "Technical Support" | "Feature Request" | "Billing Issue" | "General Inquiry";
export type RequirementPriority = "Low" | "Medium" | "High" | "Critical";
export type RequirementStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Requirement {
  id: string;
  customerId: string;
  customerName: string;
  requesterName: string;
  requesterEmail: string;
  category: RequirementCategory;
  description: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
}

// --- GTM Report Types
export type GTMReportType = "internal" | "customer-submitted";
export type GTMReportFrequency = "daily" | "weekly";

export interface GTMReportMetric {
  id: string;
  customerId: string;
  reportName: string;
  reportType: GTMReportType;
  reportFrequency: GTMReportFrequency;
  dateRange: {
    start: string;
    end: string;
  };
  leadConversionRate: number;
  marketPenetration: number;
  pipelineValue: number;
  campaignEffectiveness: number;
  region?: string;
  segment?: string;
  dailyMetrics?: Array<{
    date: string;
    leadConversionRate: number;
    marketPenetration: number;
    pipelineValue: number;
    campaignEffectiveness: number;
  }>;
  weeklyTrendComparisons?: Array<{
    weekStart: string;
    weekEnd: string;
    leadConversionRateChange: number;
    marketPenetrationChange: number;
    pipelineValueChange: number;
    campaignEffectivenessChange: number;
  }>;
  actionableSuggestions: Array<{
    id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    estimatedImpact: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  customerId: string;
  reportFrequency: GTMReportFrequency;
  recipients: string[];
  fileFormats: Array<"pdf" | "xlsx">;
  enabled: boolean;
  nextSendDate: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  requesterName: string;
  requesterEmail: string;
  category: "technical-support" | "feature-request" | "billing" | "general";
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  preferredReportFormats: Array<"pdf" | "xlsx" | "csv">;
  dailyReportTime: string;
  weeklyReportDay: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
}

export interface CustomerGTMData {
  id: string;
  customerId: string;
  submittedBy: string;
  submittedAt: string;
  data: Record<string, any>;
  attachments?: FileAttachment[];
}

export interface ICPEntry {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  description: string;
  targetIndustries: string[];
  targetCompanySizes: string[];
  targetGeographicRegions: string[];
  decisionMakers: string[];
  painPoints: string[];
  valueProposition: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

// --- New Types for Comprehensive Admin Portal ---
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  industry?: string;
  status: "active" | "resigned" | "onboarding";
  assignedAgentId?: string;
  assignedAgentName?: string;
  serviceConfigurations: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  businessModel?: "b2b" | "b2c" | "d2c" | "custom";
}

// --- Modular Business Toolset Structures ---
export interface B2BBulkOrder {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "pending" | "approved" | "shipped" | "cancelled";
  orderDate: string;
  notes?: string;
}

export interface B2CTransaction {
  id: string;
  consumerName: string;
  itemCount: number;
  amount: number;
  paymentStatus: "paid" | "failed" | "refunded";
  deviceType: "desktop" | "mobile" | "tablet";
  checkoutTimestamp: string;
}

export interface D2CBrandingConfig {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customCss?: string;
  instagramHandle?: string;
}


export interface CustomerResignation {
  id: string;
  customerId: string;
  customerName: string;
  requestDate: string;
  effectiveDate: string;
  terminationReason: string;
  notes?: string;
  documentsArchived: boolean;
  accountClosed: boolean;
  processedBy: string;
  processedAt: string;
}

export interface Document {
  id: string;
  customerId?: string;
  documentType: "icp" | "requirement" | "contract" | "onboarding" | "other";
  title: string;
  description: string;
  fileAttachment?: FileAttachment;
  icpId?: string;
  requirementId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessRoles: Array<"admin" | "agent" | "customer">;
}

export interface AuditLogEntry {
  id: string;
  actionType: "customer_onboard" | "customer_resign" | "task_create" | "task_update" | "document_access" | "document_update" | "agent_assign" | "other" | "document_upload" | "agent_activity" | "customer_edit" | "customer_delete" | "alert_triggered" | "report_generated";
  actionDetails: string;
  performedBy: string;
  performedByRole: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// --- Comprehensive Admin Portal Types ---

// Customer Management
export interface ComprehensiveCustomer {
  id: string;
  personalIdentifiers: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    secondaryEmail?: string;
    linkedinProfile?: string;
  };
  companyInformation: {
    companyName: string;
    websiteUrl: string;
    industry: string;
    companySize: string;
    headquarters: {
      country: string;
      city: string;
    };
    businessModel: "b2b" | "b2c" | "d2c" | "custom";
    revenueRange: string;
    foundingYear?: string;
  };
  accountHistory: {
    status: "active" | "resigned" | "onboarding" | "inactive";
    onboardedAt: string;
    resignedAt?: string;
    totalInteractions: number;
    lastInteractionAt?: string;
  };
  assignedAgent?: {
    agentId: string;
    agentName: string;
    assignedAt: string;
  };
  icpId?: string;
  icpCategory?: string;
  serviceConfigurations: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Document Repository
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  changeDescription: string;
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  action: "upload" | "view" | "download" | "edit" | "delete" | "version_create";
  performedBy: string;
  performedAt: string;
  ipAddress?: string;
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

export interface EnhancedDocument {
  id: string;
  customerId?: string;
  documentType: "icp" | "requirement" | "contract" | "onboarding" | "other" | "identification" | "financial" | "meeting_notes";
  title: string;
  description: string;
  fileAttachment?: FileAttachment;
  versions: DocumentVersion[];
  currentVersion: number;
  accessLogs: DocumentAuditLog[];
  icpId?: string;
  requirementId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessRoles: Array<"admin" | "agent" | "customer">;
  isArchived: boolean;
}

// Agent Activity Monitoring
export interface AgentActivityEntry {
  id: string;
  agentId: string;
  activityType: "task_start" | "task_complete" | "customer_interaction" | "document_access" | "login" | "logout";
  targetId?: string;
  targetType?: string;
  durationSeconds?: number;
  details: string;
  timestamp: string;
}

export interface AgentAssignment {
  id: string;
  agentId: string;
  customerId: string;
  assignedAt: string;
  assignedBy: string;
  status: "active" | "inactive";
}

// Task Management & Collaboration
export interface CollaborationNote {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorRole: "admin" | "agent";
  content: string;
  createdAt: string;
}

export interface EnhancedTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "urgent" | "high" | "medium" | "low";
  assignedAgentId?: string;
  assignedAgentName?: string;
  customerId: string;
  customerName?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  progressNotes: string[];
  collaborationNotes: CollaborationNote[];
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  sharedFiles: SharedFile[];
  sharedLinks: SharedLink[];
}

// RBAC (Role-Based Access Control)
export interface RolePermission {
  id: string;
  role: "admin" | "agent" | "customer";
  permissions: string[];
}

// Real-Time Alerts
export type AlertType = "task_deadline_warning" | "task_overdue" | "customer_inactive" | "agent_low_performance" | "icp_mismatch";
export type AlertPriority = "low" | "medium" | "high" | "urgent";

export interface RealTimeAlert {
  id: string;
  alertType: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  createdAt: string;
}

// Automated Reporting
export interface ProductivityReport {
  id: string;
  reportType: "agent_productivity" | "customer_engagement" | "task_completion";
  periodStart: string;
  periodEnd: string;
  data: Record<string, any>;
  generatedAt: string;
  generatedBy: string;
}

// ICP Tracking
export interface EnhancedICPEntry extends ICPEntry {
  matchingCustomers: string[];
  conversionRate: number;
  averageDealSize: number;
}

// --- Content Types & Marketing Tactics ---
export type ContentType = "blog-post" | "social-media" | "email-campaign" | "video" | "infographic" | "whitepaper" | "case-study";
export type ContentLifecycle = "draft" | "review" | "approved" | "scheduled" | "published" | "archived";

export interface ContentAsset {
  id: string;
  customerId: string;
  title: string;
  type: ContentType;
  content: string;
  metadata: {
    keywords?: string[];
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];
    targetAudience?: string;
  };
  lifecycle: ContentLifecycle;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  accessRoles: Array<"admin" | "agent" | "customer">;
}

export type TacticChannel = "email" | "social" | "search" | "display" | "influencer" | "events" | "content";
export type TacticStatus = "draft" | "planned" | "active" | "paused" | "completed" | "archived";

export interface MarketingTactic {
  id: string;
  customerId: string;
  name: string;
  description: string;
  channel: TacticChannel;
  status: TacticStatus;
  contentAssets: string[]; // Array of ContentAsset IDs
  targetAudience: string;
  budget?: number;
  startDate: string;
  endDate?: string;
  performanceMetrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    roi?: number;
    ctr?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessRoles: Array<"admin" | "agent" | "customer">;
}

// --- MAO (Multi-Agent Orchestration) ---
export type MAOAgentRole = "content-creator" | "audience-segmenter" | "campaign-optimizer" | "performance-analyst";

export interface MAOAgent {
  id: string;
  role: MAOAgentRole;
  name: string;
  status: "idle" | "working" | "error" | "offline";
  currentTaskId?: string;
  tasksCompleted: number;
  lastActive: string;
  createdAt: string;
}

export type MAOTaskStatus = "pending" | "assigned" | "in-progress" | "completed" | "failed" | "cancelled";

export interface MAOTask {
  id: string;
  type: "content-generation" | "audience-analysis" | "campaign-optimization" | "performance-report";
  status: MAOTaskStatus;
  assignedAgentId?: string;
  customerId: string;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface MAOMetrics {
  activeAgents: number;
  totalAgents: number;
  tasksPending: number;
  tasksInProgress: number;
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskDuration: number;
  systemUptime: number;
}

// ============ AI WEBINAR MODULE TYPES ============

export type WebinarStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled" | "archived";
export type WebinarPrivacy = "public" | "private" | "invite-only";
export type WebinarHostType = "ai-bot" | "human" | "hybrid";
export type MeetingPlatform = "zoom" | "teams" | "google-meet" | "webrtc";
export type AttendeeStatus = "registered" | "confirmed" | "attended" | "no-show" | "cancelled" | "waitlisted";
export type PollStatus = "draft" | "active" | "closed";
export type QAStatus = "pending" | "answered" | "escalated";

export interface WebinarSpeaker {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  avatarUrl?: string;
  isAIBot: boolean;
  contactEmail?: string;
}

export interface WebinarBranding {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export interface WebinarAgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  durationMinutes: number;
  speakerId?: string;
  slideDeckUrl?: string;
}

export interface RegistrationField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "checkbox" | "textarea" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface WebinarPoll {
  id: string;
  webinarId: string;
  question: string;
  options: PollOption[];
  status: PollStatus;
  orderIndex: number;
  scheduledTime?: string;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: "rating" | "single-choice" | "multi-choice" | "text";
  required: boolean;
  options?: string[];
  scaleMax?: number;
}

export interface WebinarSurvey {
  id: string;
  webinarId: string;
  title: string;
  questions: SurveyQuestion[];
  createdAt: string;
}

export interface DownloadableResource {
  id: string;
  name: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  uploadDate: string;
  downloadCount?: number;
}

export interface ReminderSchedule {
  id: string;
  webinarId: string;
  channels: Array<"email" | "sms" | "whatsapp">;
  timing: Array<{
    offsetMinutes: number;
    sent?: boolean;
    sentAt?: string;
  }>;
  templateOverride?: {
    emailSubject?: string;
    emailBody?: string;
    smsBody?: string;
    whatsAppBody?: string;
  };
}

export interface QASubmission {
  id: string;
  webinarId: string;
  attendeeId: string;
  attendeeName: string;
  question: string;
  status: QAStatus;
  answer?: string;
  answeredBy?: string;
  upvotes: number;
  createdAt: string;
  answeredAt?: string;
}

export interface ChatMessage {
  id: string;
  webinarId: string;
  attendeeId: string;
  attendeeName: string;
  message: string;
  timestamp: string;
  isModerated: boolean;
  flagged?: boolean;
}

export interface GeneratedContent {
  id: string;
  webinarId: string;
  contentType:
    | "agenda"
    | "slides"
    | "speaker_notes"
    | "faqs"
    | "landing_page"
    | "registration_page"
    | "email_invitation"
    | "reminder_email"
    | "thank_you_email"
    | "follow_up_email"
    | "promo_linkedin"
    | "promo_facebook"
    | "promo_instagram"
    | "promo_x"
    | "promo_threads"
    | "promo_whatsapp"
    | "promo_telegram"
    | "promo_youtube"
    | "promo_email";
  content: any;
  metadata?: Record<string, any>;
  status: "generating" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  webinarId: string;
  platform:
    | "linkedin"
    | "facebook"
    | "instagram"
    | "x"
    | "threads"
    | "whatsapp"
    | "telegram"
    | "youtube"
    | "email";
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  imageSize?: string;
  ctaText?: string;
  ctaUrl?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  publishedAt?: string;
  performance?: {
    impressions: number;
    clicks: number;
    likes: number;
    shares: number;
    comments: number;
    conversions: number;
  };
  createdAt: string;
}

export interface WebinarRegistrant {
  id: string;
  webinarId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  country?: string;
  customFields?: Record<string, any>;
  status: AttendeeStatus;
  source?: string;
  referralCode?: string;
  qrCodeUrl?: string;
  registrationIp?: string;
  confirmedAt?: string;
  attendedAt?: string;
  leftAt?: string;
  watchTimeSeconds?: number;
  leadScore?: number;
  joinedFromWaitlist?: boolean;
  waitlistPosition?: number;
  responses?: {
    pollResponses?: Record<string, string>;
    surveyResponses?: Record<string, any>;
    qaQuestionsAsked?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Webinar {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  objective: string;
  topic: string;
  description: string;
  targetAudience: string;
  industry: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  durationMinutes: number;
  language: string;
  hostType: WebinarHostType;
  speakers: WebinarSpeaker[];
  meetingPlatform: MeetingPlatform;
  meetingUrl?: string;
  meetingPassword?: string;
  privacy: WebinarPrivacy;
  allowedDomains?: string[];
  allowedEmails?: string[];
  invitationCodes?: string[];
  maxAttendees: number;
  enableWaitlist: boolean;
  waitlistLimit?: number;
  allowRecording: boolean;
  recordingUrl?: string;
  recordingViewCount?: number;
  branding: WebinarBranding;
  registrationFields: RegistrationField[];
  requireApproval: boolean;
  agenda: WebinarAgendaItem[];
  qaSettings: {
    enabled: boolean;
    allowAnonymous: boolean;
    enableUpvoting: boolean;
    moderationRequired: boolean;
    autoAnswerWithRAG: boolean;
  };
  pollIds: string[];
  surveyIds: string[];
  resources: DownloadableResource[];
  reminderScheduleIds: string[];
  generatedContentIds: string[];
  socialPostIds: string[];
  status: WebinarStatus;
  stats: {
    registeredCount: number;
    confirmedCount: number;
    attendedCount: number;
    noShowCount: number;
    waitlistCount: number;
    cancelledCount: number;
    averageWatchTimeSeconds?: number;
    totalWatchTimeSeconds?: number;
    engagementScore?: number;
  };
  aiBotConfig?: {
    avatarId?: string;
    voiceId?: string;
    knowledgeBaseIds?: string[];
    personaPrompt?: string;
    multilingual: boolean;
    enableSentimentAnalysis: boolean;
    humanEscalationThreshold: number;
  };
  postWebinarConfig?: {
    sendRecording: boolean;
    sendTranscript: boolean;
    sendSummary: boolean;
    generateCertificates: boolean;
    crmSync: boolean;
    followUpSequenceDays: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  accessRoles: Array<"admin" | "agent" | "customer">;
}

export interface WebinarSession {
  id: string;
  webinarId: string;
  startedAt: string;
  endedAt?: string;
  peakConcurrent: number;
  transcriptUrl?: string;
  transcriptId?: string;
  chatMessages: ChatMessage[];
  qaSubmissions: QASubmission[];
  polls: WebinarPoll[];
  slidesPresented?: Array<{
    slideIndex: number;
    timestamp: string;
    durationSeconds: number;
  }>;
  recordingUrl?: string;
  recordingSize?: number;
  sentimentTrend?: Array<{
    timestamp: string;
    score: number;
    label: "positive" | "neutral" | "negative";
  }>;
}

export interface WebinarTranscript {
  id: string;
  webinarId: string;
  sessionId: string;
  segments: Array<{
    timestamp: string;
    speaker: string;
    speakerType: "ai" | "human" | "attendee";
    text: string;
    sentiment?: number;
  }>;
  summary?: string;
  actionItems?: Array<{
    id: string;
    item: string;
    assignee?: string;
    dueDate?: string;
  }>;
  keyHighlights?: string[];
  createdAt: string;
}

export interface WebinarCertificate {
  id: string;
  registrantId: string;
  webinarId: string;
  certificateNumber: string;
  issuedDate: string;
  templateId?: string;
  downloadUrl: string;
  verified?: boolean;
}

export interface WebinarLeadScore {
  registrantId: string;
  webinarId: string;
  totalScore: number;
  breakdown: {
    registration: number;
    attendance: number;
    watchTime: number;
    engagement: number;
    qaParticipation: number;
    pollParticipation: number;
    resourceDownloads: number;
    surveyResponse: number;
  };
  grade: "A+" | "A" | "B" | "C" | "D";
  recommendedNextAction: string;
  calculatedAt: string;
}

export interface WebinarMetrics {
  webinarId: string;
  registrations: Array<{ date: string; count: number; source: string }>;
  attendance: {
    liveCount: number;
    onDemandCount: number;
    dropOffRate: number;
    averageWatchMinutes: number;
    watchTimeDistribution?: Array<{
      minute: number;
      viewers: number;
    }>;
  };
  engagement: {
    messagesPerAttendee: number;
    questionsPerAttendee: number;
    pollParticipationRate: number;
    resourceDownloadRate: number;
    surveyResponseRate: number;
  };
  conversions: {
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    pipelineValue?: number;
    crmSynced: number;
  };
  roi: {
    totalSpend: number;
    revenueAttributed?: number;
    cac?: number;
    roiPercentage?: number;
  };
  socialCampaigns: Array<{
    postId: string;
    platform: string;
    impressions: number;
    clicks: number;
    ctr: number;
    registrationsFromPost: number;
  }>;
}
