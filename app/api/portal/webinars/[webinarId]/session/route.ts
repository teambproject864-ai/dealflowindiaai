import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import type {
  ChatMessage,
  QASubmission,
  WebinarPoll,
  WebinarSession,
} from "@/lib/portal-types";

export const dynamic = "force-dynamic";

type SessionAction =
  | "start"
  | "end"
  | "send_chat"
  | "submit_qa"
  | "answer_qa"
  | "escalate_qa"
  | "activate_poll"
  | "close_poll"
  | "vote_poll"
  | "send_message";

const COLLECTION = "webinar_sessions";
const AI_BOT_NAME = "AI Dealflow Bot";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSentimentLabel(score: number): "positive" | "neutral" | "negative" {
  if (score > 0.2) return "positive";
  if (score < -0.2) return "negative";
  return "neutral";
}

function analyzeSentiment(text: string): number {
  const positiveWords = [
    "great", "excellent", "amazing", "love", "awesome", "perfect",
    "fantastic", "wonderful", "helpful", "best", "thank", "thanks",
    "appreciate", "good", "nice", "impressive", "outstanding", "super",
    "valuable", "useful", "interesting", "excited", "happy", "glad",
    "recommend", "brilliant", "smart", "efficient", "easy", "clear",
  ];
  const negativeWords = [
    "bad", "terrible", "awful", "hate", "disappointing", "poor",
    "worst", "frustrating", "confusing", "broken", "bug", "issue",
    "problem", "difficult", "hard", "slow", "expensive", "useless",
    "unhelpful", "wrong", "fail", "failed", "error", "cannot",
    "can't", "doesn't", "not working", "stuck", "annoying",
  ];

  const lowerText = text.toLowerCase();
  let score = 0;
  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) score += matches.length * 0.15;
  });
  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) score -= matches.length * 0.15;
  });

  if (lowerText.includes("?")) score += 0.02;
  if (lowerText.includes("!")) score += 0.05;

  return Math.max(-1, Math.min(1, score));
}

function simulateRAGAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("pricing") || q.includes("price") || q.includes("cost") || q.includes("plan")) {
    return "DealFlow AI offers flexible pricing tiers to match your needs. Our Starter plan begins at $99/month for up to 500 leads, the Growth plan is $299/month for 5,000 leads, and Enterprise pricing is custom-scaled with dedicated support. All plans include the AI-powered dealflow automation, CRM integrations, and analytics dashboard. Would you like me to connect you with a sales specialist for a custom quote?";
  }

  if (q.includes("feature") || q.includes("capability") || q.includes("what can") || q.includes("do you support")) {
    return "DealFlow AI provides a comprehensive feature suite including: AI-powered outbound lead generation, automated meeting scheduling & rescheduling, multi-channel outreach (email, SMS, WhatsApp), RAG-based customer chatbots, real-time call transcription & sentiment analysis, CRM bi-directional sync, and custom agent training. We also support 40+ integrations including Salesforce, HubSpot, Pipedrive, and Slack.";
  }

  if (q.includes("trial") || q.includes("demo") || q.includes("free")) {
    return "Great question! We offer a 14-day free trial with full access to all Growth features — no credit card required to start. You can also book a live personalized demo with our solutions team where we'll tailor the walkthrough to your specific use case. Would you like me to share the trial signup link or schedule a demo slot for you?";
  }

  if (q.includes("integration") || q.includes("crm") || q.includes("hubspot") || q.includes("salesforce") || q.includes("pipedrive")) {
    return "DealFlow AI integrates natively with 40+ platforms including Salesforce, HubSpot (Operations Hub Professional+), Pipedrive, Zoho CRM, ActiveCampaign, and more. Our CRM sync is bidirectional — contacts, deals, notes, and activities update in real-time. We also offer REST & Webhook APIs for custom integrations, and our engineering team can build bespoke connectors for Enterprise customers.";
  }

  if (q.includes("security") || q.includes("compliance") || q.includes("gdpr") || q.includes("privacy") || q.includes("data")) {
    return "Security is foundational at DealFlow AI. We are SOC 2 Type II certified, fully GDPR compliant, and CCPA-ready. All customer data is encrypted in transit (TLS 1.3) and at rest (AES-256). We support SSO via SAML/OIDC for Enterprise, role-based access controls, audit logging, and offer data residency options in US, EU, and APAC. Subprocessors are documented in our DPA which is available on request.";
  }

  if (q.includes("support") || q.includes("help") || q.includes("customer service")) {
    return "We take pride in our support! All plans include email support with <24h response. Growth adds priority chat support (<4h), and Enterprise gets a dedicated Customer Success Manager + 24/7 phone support. We also maintain an extensive knowledge base, video tutorials, and monthly best-practice webinars. Critical production issues are routed to an on-call engineering team via our status page.";
  }

  if (q.includes("setup") || q.includes("onboard") || q.includes("implement") || q.includes("how long")) {
    return "Most customers go live in 3-5 business days. Our onboarding includes: a dedicated Implementation Specialist, CRM integration setup, AI agent persona configuration, data import from existing tools, email/SMS/WhatsApp channel warm-up, and a go-live checklist. Enterprise customers also receive a 30-day hypercare period with daily check-ins and custom training sessions.";
  }

  if (q.includes("ai") || q.includes("model") || q.includes("llm") || q.includes("gpt") || q.includes("claude")) {
    return "DealFlow AI uses a multi-model architecture combining OpenAI GPT-4o, Anthropic Claude 3.5, and domain-fine-tuned models for specialized tasks (lead scoring, objection handling, etc.). All LLM calls are logged for quality, and Enterprise customers can optionally route requests through their own VPC with customer-managed keys. We never train on your customer data — your knowledge base stays private.";
  }

  if (q.includes("refund") || q.includes("cancel") || q.includes("money back")) {
    return "We offer a 30-day money-back guarantee on all paid plans — if you're not satisfied for any reason, contact support and we'll process a full refund, no questions asked. Cancellation is self-serve from your billing dashboard (no retention hoops), and you'll retain access through the end of your billing period. Annual plans can be cancelled mid-year with a pro-rata credit for unused months.";
  }

  return `That's a great question! Based on our knowledge base, DealFlow AI is designed to streamline dealflow automation with AI-powered agents. For your specific question about "${question.slice(0, 60)}${question.length > 60 ? "..." : ""}", I'd recommend checking our detailed docs or I can escalate this to a human specialist who can provide a tailored answer. Would you like me to connect you with someone now?`;
}

function shouldAutoAnswer(question: string): boolean {
  const autoAnswerKeywords = [
    "pricing", "price", "cost", "plan", "trial", "demo", "free",
    "feature", "capability", "integration", "crm", "security",
    "privacy", "compliance", "gdpr", "support", "help", "setup",
    "onboard", "implement", "ai", "model", "refund", "cancel",
    "hubspot", "salesforce", "pipedrive", "what can", "do you",
  ];
  const lower = question.toLowerCase();
  return autoAnswerKeywords.some((kw) => lower.includes(kw)) || Math.random() < 0.3;
}

async function getOrCreateSession(
  webinarId: string,
  user: { id: string; name: string; role: string }
): Promise<WebinarSession> {
  if (!db) {
    return createEmptySession(webinarId, user);
  }

  const querySnap = await db
    .collection(COLLECTION)
    .where("webinarId", "==", webinarId)
    .orderBy("startedAt", "desc")
    .limit(1)
    .get();

  if (querySnap && querySnap.docs && querySnap.docs.length > 0) {
    const doc = querySnap.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<WebinarSession, "id">) };
  }

  return createEmptySession(webinarId, user);
}

function createEmptySession(
  webinarId: string,
  user: { id: string; name: string; role: string }
): WebinarSession {
  return {
    id: generateId("wsess"),
    webinarId,
    startedAt: new Date().toISOString(),
    peakConcurrent: 1,
    chatMessages: [],
    qaSubmissions: [],
    polls: [],
    sentimentTrend: [
      {
        timestamp: new Date().toISOString(),
        score: 0,
        label: "neutral" as const,
      },
    ],
  };
}

async function saveSession(session: WebinarSession): Promise<void> {
  if (!db) return;
  const { id, ...rest } = session;
  await db.collection(COLLECTION).doc(id).set(rest, { merge: true });
}

function bumpPeakConcurrent(session: WebinarSession): WebinarSession {
  const newPeak = session.peakConcurrent + Math.floor(Math.random() * 3);
  return {
    ...session,
    peakConcurrent: Math.max(session.peakConcurrent, newPeak),
  };
}

function appendSentiment(
  session: WebinarSession,
  text: string
): WebinarSession {
  const score = analyzeSentiment(text);
  const lastScore =
    session.sentimentTrend && session.sentimentTrend.length > 0
      ? session.sentimentTrend[session.sentimentTrend.length - 1].score
      : 0;
  const smoothedScore = lastScore * 0.6 + score * 0.4;
  const trend = session.sentimentTrend || [];
  return {
    ...session,
    sentimentTrend: [
      ...trend,
      {
        timestamp: new Date().toISOString(),
        score: Math.round(smoothedScore * 100) / 100,
        label: getSentimentLabel(smoothedScore),
      },
    ],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webinarId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { webinarId } = await params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "webinarId is required" },
        { status: 400 }
      );
    }

    const session = await getOrCreateSession(webinarId, user);

    return NextResponse.json(
      {
        success: true,
        session,
        chatMessages: session.chatMessages,
        qaSubmissions: session.qaSubmissions,
        polls: session.polls,
        sentimentTrend: session.sentimentTrend,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api-webinar-session-get] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch webinar session" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webinarId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { webinarId } = await params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "webinarId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, ...payload } = body as {
      action: SessionAction;
      [key: string]: unknown;
    };

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 }
      );
    }

    let session = await getOrCreateSession(webinarId, user);
    let resultData: Record<string, unknown> = {};

    switch (action) {
      case "start": {
        if (session.endedAt) {
          session = createEmptySession(webinarId, user);
        } else {
          session.startedAt = new Date().toISOString();
        }
        session = bumpPeakConcurrent(session);
        await saveSession(session);
        resultData = { message: "Webinar session started" };
        break;
      }

      case "end": {
        session.endedAt = new Date().toISOString();
        await saveSession(session);
        resultData = { message: "Webinar session ended" };
        break;
      }

      case "send_chat": {
        const { message, attendeeId, attendeeName, flagged } = payload as {
          message: string;
          attendeeId?: string;
          attendeeName?: string;
          flagged?: boolean;
        };

        if (!message || typeof message !== "string") {
          return NextResponse.json(
            { success: false, error: "message string is required" },
            { status: 400 }
          );
        }

        const chatMsg: ChatMessage = {
          id: generateId("chat"),
          webinarId,
          attendeeId: attendeeId || user.id,
          attendeeName: attendeeName || user.name,
          message,
          timestamp: new Date().toISOString(),
          isModerated: user.role === "admin" || user.role === "agent",
          flagged: !!flagged,
        };

        session.chatMessages = [...session.chatMessages, chatMsg];
        session = appendSentiment(session, message);
        session = bumpPeakConcurrent(session);
        await saveSession(session);
        resultData = { chatMessage: chatMsg };
        break;
      }

      case "submit_qa": {
        const { question, attendeeId, attendeeName } = payload as {
          question: string;
          attendeeId?: string;
          attendeeName?: string;
        };

        if (!question || typeof question !== "string") {
          return NextResponse.json(
            { success: false, error: "question string is required" },
            { status: 400 }
          );
        }

        const qa: QASubmission = {
          id: generateId("qa"),
          webinarId,
          attendeeId: attendeeId || user.id,
          attendeeName: attendeeName || user.name,
          question,
          status: "pending",
          upvotes: 0,
          createdAt: new Date().toISOString(),
        };

        if (shouldAutoAnswer(question)) {
          qa.answer = simulateRAGAnswer(question);
          qa.answeredBy = AI_BOT_NAME;
          qa.status = "answered";
          qa.answeredAt = new Date().toISOString();
        }

        session.qaSubmissions = [...session.qaSubmissions, qa];
        session = appendSentiment(session, question);
        session = bumpPeakConcurrent(session);
        await saveSession(session);
        resultData = { qaSubmission: qa, autoAnswered: qa.status === "answered" };
        break;
      }

      case "answer_qa": {
        const { qaId, answer, answeredBy } = payload as {
          qaId: string;
          answer: string;
          answeredBy?: string;
        };

        if (!qaId || !answer) {
          return NextResponse.json(
            { success: false, error: "qaId and answer are required" },
            { status: 400 }
          );
        }

        const qaIndex = session.qaSubmissions.findIndex((q) => q.id === qaId);
        if (qaIndex === -1) {
          return NextResponse.json(
            { success: false, error: "QA submission not found" },
            { status: 404 }
          );
        }

        session.qaSubmissions[qaIndex] = {
          ...session.qaSubmissions[qaIndex],
          answer,
          answeredBy: answeredBy || user.name,
          status: "answered",
          answeredAt: new Date().toISOString(),
        };

        await saveSession(session);
        resultData = { qaSubmission: session.qaSubmissions[qaIndex] };
        break;
      }

      case "escalate_qa": {
        const { qaId } = payload as { qaId: string };

        if (!qaId) {
          return NextResponse.json(
            { success: false, error: "qaId is required" },
            { status: 400 }
          );
        }

        const qaIndex = session.qaSubmissions.findIndex((q) => q.id === qaId);
        if (qaIndex === -1) {
          return NextResponse.json(
            { success: false, error: "QA submission not found" },
            { status: 404 }
          );
        }

        session.qaSubmissions[qaIndex] = {
          ...session.qaSubmissions[qaIndex],
          status: "escalated",
        };

        await saveSession(session);
        resultData = { qaSubmission: session.qaSubmissions[qaIndex] };
        break;
      }

      case "activate_poll": {
        const { pollId, question, options } = payload as {
          pollId?: string;
          question?: string;
          options?: Array<{ id: string; label: string }>;
        };

        let poll: WebinarPoll;

        if (pollId) {
          const pollIndex = session.polls.findIndex((p) => p.id === pollId);
          if (pollIndex === -1) {
            return NextResponse.json(
              { success: false, error: "Poll not found" },
              { status: 404 }
            );
          }
          session.polls[pollIndex] = {
            ...session.polls[pollIndex],
            status: "active",
          };
          poll = session.polls[pollIndex];
        } else {
          if (!question || !options || options.length === 0) {
            return NextResponse.json(
              { success: false, error: "question and options are required for new poll" },
              { status: 400 }
            );
          }
          poll = {
            id: generateId("poll"),
            webinarId,
            question,
            options: options.map((opt) => ({
              id: opt.id || generateId("opt"),
              label: opt.label,
              votes: 0,
            })),
            status: "active",
            orderIndex: session.polls.length,
            createdAt: new Date().toISOString(),
            createdBy: user.id,
            totalVotes: 0,
            voterIds: [],
          } as WebinarPoll;
          session.polls = [...session.polls, poll];
        }

        await saveSession(session);
        resultData = { poll };
        break;
      }

      case "close_poll": {
        const { pollId } = payload as { pollId: string };

        if (!pollId) {
          return NextResponse.json(
            { success: false, error: "pollId is required" },
            { status: 400 }
          );
        }

        const pollIndex = session.polls.findIndex((p) => p.id === pollId);
        if (pollIndex === -1) {
          return NextResponse.json(
            { success: false, error: "Poll not found" },
            { status: 404 }
          );
        }

        session.polls[pollIndex] = {
          ...session.polls[pollIndex],
          status: "closed",
        };

        await saveSession(session);
        resultData = { poll: session.polls[pollIndex] };
        break;
      }

      case "vote_poll": {
        const { pollId, optionId, voterId } = payload as {
          pollId: string;
          optionId: string;
          voterId?: string;
        };

        if (!pollId || !optionId) {
          return NextResponse.json(
            { success: false, error: "pollId and optionId are required" },
            { status: 400 }
          );
        }

        const pollIndex = session.polls.findIndex((p) => p.id === pollId);
        if (pollIndex === -1) {
          return NextResponse.json(
            { success: false, error: "Poll not found" },
            { status: 404 }
          );
        }

        const poll = session.polls[pollIndex];
        if (poll.status !== "active") {
          return NextResponse.json(
            { success: false, error: "Poll is not active" },
            { status: 400 }
          );
        }

        const optionIndex = poll.options.findIndex((o) => o.id === optionId);
        if (optionIndex === -1) {
          return NextResponse.json(
            { success: false, error: "Option not found" },
            { status: 404 }
          );
        }

        const voter = voterId || user.id;
        const voterIds = (poll as any).voterIds || [];
        if (voterIds.includes(voter)) {
          return NextResponse.json(
            { success: false, error: "Already voted" },
            { status: 409 }
          );
        }

        poll.options[optionIndex].votes += 1;
        (poll as any).totalVotes = ((poll as any).totalVotes || 0) + 1;
        (poll as any).voterIds = [...voterIds, voter];
        session.polls[pollIndex] = poll;
        session = bumpPeakConcurrent(session);

        await saveSession(session);
        resultData = { poll };
        break;
      }

      case "send_message": {
        const { message, to } = payload as {
          message: string;
          to?: "all" | "attendees" | "hosts";
        };

        if (!message || typeof message !== "string") {
          return NextResponse.json(
            { success: false, error: "message string is required" },
            { status: 400 }
          );
        }

        const broadcastMsg: ChatMessage & { broadcast?: boolean; to?: string } = {
          id: generateId("msg"),
          webinarId,
          attendeeId: user.id,
          attendeeName: `${user.name} (Host)`,
          message,
          timestamp: new Date().toISOString(),
          isModerated: true,
          broadcast: true,
          to: to || "all",
        };

        session.chatMessages = [...session.chatMessages, broadcastMsg as ChatMessage];
        session = appendSentiment(session, message);
        await saveSession(session);
        resultData = { message: broadcastMsg };
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        session,
        chatMessages: session.chatMessages,
        qaSubmissions: session.qaSubmissions,
        polls: session.polls,
        sentimentTrend: session.sentimentTrend,
        ...resultData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api-webinar-session-post] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webinar session action" },
      { status: 500 }
    );
  }
}
