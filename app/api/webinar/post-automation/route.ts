import { NextResponse } from "next/server";
import { PostWebinarData } from "@/types/webinar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webinarId } = body;

    const mockPostData: PostWebinarData = {
      webinarId: webinarId || "webinar-1",
      recordingUrl: "https://storage.googleapis.com/dealflow-webinars/recordings/ai-revops-2026.mp4",
      transcript: [
        { time: "00:02", speaker: "AI Dealflow Bot", text: "Welcome everyone to AI-Powered Revenue Operations 2026." },
        { time: "05:14", speaker: "AI Dealflow Bot", text: "Notice how automated qualification saves 15 hours per rep per week." },
        { time: "22:40", speaker: "Sarah Jenkins (Audience)", text: "How does the bot handle multi-currency pricing questions?" },
        { time: "23:05", speaker: "AI Dealflow Bot", text: "Great question Sarah! The RAG knowledge engine reads live rate sheets and localizes quotes dynamically." },
      ],
      summary: {
        overview: "The session covered autonomous revenue operations, live RAG knowledge integration, and SDR workflow transformation.",
        keyTakeaways: [
          "AI agents reduce inbound response time from 4 hours to sub-5 seconds.",
          "RAG integration enables real-time context-aware buyer Q&A without human intervention.",
          "Lead scoring automation accurately flags hot enterprise deals for immediate co-host transfer.",
        ],
        actionItems: [
          "Deploy AI Dealflow Bot snippet to company landing page.",
          "Connect CRM pipeline webhooks for lead sync.",
          "Send PDF Certificates of Completion to 142 qualified attendees.",
        ],
      },
      leadScores: [
        { attendeeId: "reg-101", name: "Sarah Jenkins", score: 95, classification: "Hot" },
        { attendeeId: "reg-102", name: "David Miller", score: 84, classification: "Warm" },
        { attendeeId: "reg-103", name: "Elena Rostova", score: 91, classification: "Hot" },
      ],
      certificatesGenerated: 142,
      feedbackSurveyResults: {
        averageRating: 4.9,
        responsesCount: 88,
        topFeedback: [
          "The live AI Bot Q&A response speed was mind-blowing!",
          "Best revenue masterclass of the year.",
          "Super smooth slide progression and presentation.",
        ],
      },
      crmSyncStatus: "synced",
      followUpSequenceSent: true,
    };

    return NextResponse.json({ success: true, postWebinar: mockPostData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
