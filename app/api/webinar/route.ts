import { NextResponse } from "next/server";
import { Webinar } from "@/types/webinar";

// In-memory mock store for webinars demonstration
let webinarsStore: Webinar[] = [
  {
    id: "webinar-1",
    wizardData: {
      title: "AI-Powered Revenue Operations 2026",
      objective: "Demonstrate how autonomous AI dealflow agents scale pipeline generation by 10x.",
      topic: "Autonomous AI Sales & Marketing Automation",
      description: "Learn how modern enterprise sales teams leverage AI dealflow bots to automate lead qualification, personalized outreach, and live buyer interactions.",
      targetAudience: "VPs of Revenue, Demand Gen Directors, Enterprise CROs",
      industry: "B2B SaaS & Tech Enterprise",
      date: "2026-08-15",
      time: "14:00",
      duration: 45,
      timezone: "PST (UTC-8)",
      speakerType: "AI_BOT",
      speakerName: "AI Dealflow Bot Host",
      speakerBio: "Autonomous AI Revenue Agent trained on top B2B sales playbooks and enterprise deal flow telemetry.",
      language: "English",
      registrationFields: ["Full Name", "Work Email", "Company Name", "Job Title", "Team Size"],
      branding: {
        bannerGradient: "from-cyan-500 via-indigo-500 to-purple-600",
        primaryColor: "#06b6d4",
        accentColor: "#6366f1",
      },
      meetingPlatform: "WebRTC",
      privacy: "Public",
      recordingOption: true,
      agenda: [
        { id: "a1", timeSlot: "00:00 - 00:05", topic: "Welcome & AI Host Introduction", speaker: "AI Dealflow Bot", description: "Interactive opening and polling" },
        { id: "a2", timeSlot: "00:05 - 00:20", topic: "The 2026 Autonomous Revenue Architecture", speaker: "AI Dealflow Bot", description: "Slide presentation with live data" },
        { id: "a3", timeSlot: "00:20 - 00:35", topic: "Live RAG Q&A & Knowledge Base Deep Dive", speaker: "AI Dealflow Bot", description: "Real-time answers to audience questions" },
        { id: "a4", timeSlot: "00:35 - 00:45", topic: "Next Steps & Instant CRM Audit", speaker: "AI Dealflow Bot", description: "Closing call to action" },
      ],
      qaEnabled: true,
      polls: [
        {
          id: "p1",
          question: "What is your biggest bottleneck in scaling sales outreach?",
          options: [
            { id: "o1", text: "Manual lead qualification", votes: 42 },
            { id: "o2", text: "Generic message personalization", votes: 38 },
            { id: "o3", text: "Slow response time to inbound leads", votes: 65 },
            { id: "o4", text: "Lack of CRM data enrichment", votes: 21 },
          ],
        },
      ],
      surveys: [
        { id: "s1", question: "How likely are you to implement AI sales agents in the next quarter?", type: "rating" },
      ],
      resources: [
        { title: "2026 Enterprise AI Revenue Playbook.pdf", url: "#", size: "4.2 MB" },
      ],
      reminders: {
        email: true,
        sms: true,
        whatsapp: true,
        timingMinutesBefore: [1440, 60, 15],
      },
    },
    registrations: [
      {
        id: "reg-101",
        webinarId: "webinar-1",
        name: "Sarah Jenkins",
        email: "sarah.j@acmecorp.com",
        company: "Acme Enterprise",
        jobTitle: "VP of Global Sales",
        status: "approved",
        registeredAt: "2026-08-01T10:30:00Z",
        qrCodeToken: "QR-ACME-9912",
        calendarInviteSent: true,
        leadScore: 92,
        attended: true,
        watchTimeMinutes: 42,
      },
      {
        id: "reg-102",
        webinarId: "webinar-1",
        name: "David Miller",
        email: "d.miller@techflow.io",
        company: "TechFlow Systems",
        jobTitle: "Head of Growth",
        status: "approved",
        registeredAt: "2026-08-02T14:15:00Z",
        qrCodeToken: "QR-TECH-4410",
        calendarInviteSent: true,
        leadScore: 84,
        attended: true,
        watchTimeMinutes: 38,
      },
    ],
    hostState: {
      isHosting: false,
      currentSlideIndex: 0,
      totalSlides: 6,
      botStatus: "idle",
      ragKnowledgeBaseConnected: true,
      chatMessages: [
        { id: "c1", sender: "AI Host Bot", role: "bot", text: "Welcome everyone! We will begin in 2 minutes.", timestamp: "14:00" },
      ],
      sentimentOverall: "positive",
      humanEscalationRequired: false,
    },
    status: "scheduled",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-03T12:00:00Z",
  },
];

export async function GET(request: Request) {
  return NextResponse.json({ success: true, webinars: webinarsStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newWebinar: Webinar = {
      id: `webinar-${Date.now()}`,
      wizardData: body.wizardData,
      registrations: [],
      hostState: {
        isHosting: false,
        currentSlideIndex: 0,
        totalSlides: 5,
        botStatus: "idle",
        ragKnowledgeBaseConnected: true,
        chatMessages: [],
        sentimentOverall: "neutral",
        humanEscalationRequired: false,
      },
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    webinarsStore.unshift(newWebinar);

    return NextResponse.json({ success: true, webinar: newWebinar });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
