export type SpeakerType = "AI_BOT" | "HUMAN_AI";
export type PlatformType = "Zoom" | "Teams" | "Google Meet" | "WebRTC";
export type PrivacyType = "Public" | "Private" | "Invite-only";
export type WebinarStatus = "draft" | "scheduled" | "live" | "completed" | "archived";

export interface AgendaItem {
  id: string;
  timeSlot: string;
  topic: string;
  speaker: string;
  description: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface WebinarPoll {
  id: string;
  question: string;
  options: PollOption[];
  active?: boolean;
}

export interface WebinarSurvey {
  id: string;
  question: string;
  type: "text" | "rating" | "multiple_choice";
}

export interface ReminderSchedule {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  timingMinutesBefore: number[];
}

export interface BrandingConfig {
  logoUrl?: string;
  bannerGradient: string;
  primaryColor: string;
  accentColor: string;
}

export interface WebinarWizardData {
  title: string;
  objective: string;
  topic: string;
  description: string;
  targetAudience: string;
  industry: string;
  date: string;
  time: string;
  duration: number; // in minutes
  timezone: string;
  speakerType: SpeakerType;
  speakerName: string;
  speakerBio: string;
  language: string;
  registrationFields: string[];
  branding: BrandingConfig;
  meetingPlatform: PlatformType;
  privacy: PrivacyType;
  recordingOption: boolean;
  agenda: AgendaItem[];
  qaEnabled: boolean;
  polls: WebinarPoll[];
  surveys: WebinarSurvey[];
  resources: { title: string; url: string; size?: string }[];
  reminders: ReminderSchedule;
}

export type SocialPlatformId =
  | "linkedin"
  | "facebook"
  | "instagram"
  | "twitter"
  | "threads"
  | "whatsapp"
  | "telegram"
  | "youtube"
  | "email";

export interface SocialPlatformCreative {
  platform: SocialPlatformId;
  platformName: string;
  caption: string;
  hashtags: string[];
  cta: string;
  recommendedImageSize: string;
  previewCardType: "carousel" | "banner" | "story" | "text_card" | "video_script" | "html_email";
  published?: boolean;
  scheduledTime?: string;
  clicks?: number;
  conversions?: number;
}

export interface PresentationSlide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualPrompt: string;
}

export interface AIContentGeneration {
  agenda: AgendaItem[];
  slides: PresentationSlide[];
  speakerNotes: string;
  faqs: { question: string; answer: string }[];
  landingPage: {
    headline: string;
    subheadline: string;
    heroDescription: string;
    keyTakeaways: string[];
    ctaText: string;
  };
  registrationPage: {
    headline: string;
    formIntro: string;
    guaranteeText: string;
  };
  emailSequence: {
    invitation: { subject: string; body: string };
    reminder24h: { subject: string; body: string };
    reminder1h: { subject: string; body: string };
    thankYou: { subject: string; body: string };
    followUp: { subject: string; body: string };
  };
  promotionalContent: {
    tagline: string;
    valueProposition: string;
    pressSnippet: string;
  };
  socialCreatives: Record<SocialPlatformId, SocialPlatformCreative>;
}

export type RegistrationStatus = "approved" | "pending" | "waitlist" | "rejected";

export interface RegistrationItem {
  id: string;
  webinarId: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  phone?: string;
  status: RegistrationStatus;
  registeredAt: string;
  qrCodeToken: string;
  calendarInviteSent: boolean;
  customAnswers?: Record<string, string>;
  leadScore: number;
  attended?: boolean;
  watchTimeMinutes?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: "host" | "bot" | "attendee" | "system";
  text: string;
  timestamp: string;
  sentiment?: "positive" | "neutral" | "negative";
  escalatedToHuman?: boolean;
}

export interface AIHostState {
  isHosting: boolean;
  currentSlideIndex: number;
  totalSlides: number;
  botStatus: "speaking" | "listening" | "processing_rag" | "idle";
  ragKnowledgeBaseConnected: boolean;
  activePollId?: string;
  chatMessages: ChatMessage[];
  sentimentOverall: "positive" | "neutral" | "negative";
  humanEscalationRequired: boolean;
  escalationReason?: string;
}

export interface PostWebinarData {
  webinarId: string;
  recordingUrl: string;
  transcript: { speaker: string; text: string; time: string }[];
  summary: {
    overview: string;
    keyTakeaways: string[];
    actionItems: string[];
  };
  leadScores: { attendeeId: string; name: string; score: number; classification: "Hot" | "Warm" | "Cold" }[];
  certificatesGenerated: number;
  feedbackSurveyResults: {
    averageRating: number;
    responsesCount: number;
    topFeedback: string[];
  };
  crmSyncStatus: "synced" | "pending" | "failed";
  followUpSequenceSent: boolean;
}

export interface WebinarAnalytics {
  webinarId: string;
  totalRegistrations: number;
  totalAttended: number;
  attendanceRate: number; // percentage
  avgWatchTimeMinutes: number;
  engagementScore: number; // 0-100
  pollResponseRate: number;
  qaQuestionsCount: number;
  leadQualityBreakdown: { hot: number; warm: number; cold: number };
  estimatedROI: string;
  socialPerformance: {
    platform: SocialPlatformId;
    impressions: number;
    clicks: number;
    registrations: number;
  }[];
}

export interface Webinar {
  id: string;
  wizardData: WebinarWizardData;
  aiContent?: AIContentGeneration;
  registrations: RegistrationItem[];
  hostState: AIHostState;
  postWebinar?: PostWebinarData;
  analytics?: WebinarAnalytics;
  status: WebinarStatus;
  createdAt: string;
  updatedAt: string;
}
