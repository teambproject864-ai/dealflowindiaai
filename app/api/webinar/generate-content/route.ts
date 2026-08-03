import { NextResponse } from "next/server";
import { AIContentGeneration, SocialPlatformCreative, WebinarWizardData } from "@/types/webinar";

export async function POST(request: Request) {
  try {
    const { wizardData }: { wizardData: WebinarWizardData } = await request.json();

    const title = wizardData?.title || "AI Webinar";
    const topic = wizardData?.topic || "Autonomous Sales Agents";
    const audience = wizardData?.targetAudience || "Revenue Leaders";

    const generatedContent: AIContentGeneration = {
      agenda: [
        {
          id: "ag-1",
          timeSlot: "00:00 - 00:05",
          topic: `Opening & Keynote: ${title}`,
          speaker: wizardData?.speakerName || "AI Dealflow Bot",
          description: `Welcome and overview of ${topic} for ${audience}.`,
        },
        {
          id: "ag-2",
          timeSlot: "00:05 - 00:20",
          topic: "Core Framework & Case Studies",
          speaker: wizardData?.speakerName || "AI Dealflow Bot",
          description: "Data-driven breakdown of 10x ROI pipelines using autonomous agents.",
        },
        {
          id: "ag-3",
          timeSlot: "00:20 - 00:35",
          topic: "Live AI Host Demonstration & Interactive Q&A",
          speaker: wizardData?.speakerName || "AI Dealflow Bot",
          description: "Real-time query resolution using dynamic RAG knowledge base.",
        },
        {
          id: "ag-4",
          timeSlot: "00:35 - 00:45",
          topic: "Implementation Roadmap & Exclusive Offer",
          speaker: wizardData?.speakerName || "AI Dealflow Bot",
          description: "Step-by-step onboarding plan for enterprise deployment.",
        },
      ],
      slides: [
        {
          slideNumber: 1,
          title: title,
          bulletPoints: [
            `Topic: ${topic}`,
            `Targeted for: ${audience}`,
            "Hosted by: AI Dealflow Autonomous Bot",
          ],
          speakerNotes: `Welcome everyone to today's session on ${topic}. Today we will explore how AI revolutionizes revenue operations.`,
          visualPrompt: "Futuristic digital grid with glowing neon teal nodes and abstract revenue growth vectors.",
        },
        {
          slideNumber: 2,
          title: "The Problem: Manual Outbound Friction",
          bulletPoints: [
            "70% of rep time wasted on manual research & data entry",
            "Inbound leads cold within 15 minutes",
            "Generic outreach yields less than 1.5% reply rate",
          ],
          speakerNotes: "Highlight how traditional manual SDR efforts bottleneck growth and cause missed quota.",
          visualPrompt: "Comparison graphic showing a slow manual hourglass vs high-speed fiber optic AI stream.",
        },
        {
          slideNumber: 3,
          title: "The Solution: Autonomous AI Dealflow Agents",
          bulletPoints: [
            "Hyper-personalized 1:1 buyer interactions at scale",
            "Sub-second response times for incoming inquiries",
            "Continuous RAG knowledge synthesis across CRM & product docs",
          ],
          speakerNotes: "Walk through how our AI bot operates asynchronously 24/7 with enterprise governance.",
          visualPrompt: "Architecture diagram showing AI Bot connecting CRM, Email, Voice, WhatsApp, and WebRTC.",
        },
        {
          slideNumber: 4,
          title: "Live Interactive Host Q&A",
          bulletPoints: [
            "Ask any complex technical or pricing question live",
            "Real-time RAG context retrieval",
            "Seamless human-in-the-loop escalation",
          ],
          speakerNotes: "Transition to live audience Q&A. Encourage attendees to type questions in the chat window.",
          visualPrompt: "Live streaming avatar frame with glowing waveform and instant response metrics.",
        },
      ],
      speakerNotes: `Full transcript guide for ${title}. Ensure high energy, emphasize quantifiable outcomes, and run Poll #1 during slide 2.`,
      faqs: [
        {
          question: "Will a recording be made available after the session?",
          answer: "Yes, all registered attendees receive instant access to the full HD recording, AI transcript, and action summary.",
        },
        {
          question: "Can the AI Dealflow Bot answer custom product questions?",
          answer: "Absolutely! The AI Host connects to your custom documentation and knowledge base via instant RAG integration.",
        },
        {
          question: "How does the AI hand off leads to human SDRs?",
          answer: "When buyer sentiment reaches high intent or explicit requests for demo, the bot routes the context directly to your CRM and notifies the designated agent.",
        },
      ],
      landingPage: {
        headline: `Master ${topic} with AI Automation`,
        subheadline: `Join our live interactive webinar: ${title}`,
        heroDescription: wizardData?.description || `Discover how top revenue teams leverage AI agents to accelerate pipeline conversion for ${audience}.`,
        keyTakeaways: [
          `Proven strategies for implementing ${topic} in under 14 days`,
          "Live demonstration of AI Dealflow Bot answering complex buyer questions",
          "Exclusive access to downloadable 2026 AI Revenue Playbook",
        ],
        ctaText: "Reserve Your Spot Now",
      },
      registrationPage: {
        headline: `Register for ${title}`,
        formIntro: "Fill out the quick form below to receive your personalized calendar invite & access link.",
        guaranteeText: "Free 45-minute live masterclass. Limited interactive seats available.",
      },
      emailSequence: {
        invitation: {
          subject: `🚀 [Live Masterclass] ${title}`,
          body: `Hi {{FirstName}},\n\nAre you ready to transform your revenue workflow? Join us for "${title}" where we'll cover ${topic}.\n\n📅 Date: ${wizardData?.date}\n⏰ Time: ${wizardData?.time} ${wizardData?.timezone}\n\nClick here to register: {{RegistrationLink}}\n\nBest regards,\nDealsflowsAI Team`,
        },
        reminder24h: {
          subject: `⏰ 24 Hours Away: ${title}`,
          body: `Hi {{FirstName}},\n\nJust a quick reminder that "${title}" is tomorrow at ${wizardData?.time} ${wizardData?.timezone}.\n\nAdd to calendar: {{CalendarLink}}\n\nSee you there!`,
        },
        reminder1h: {
          subject: `🔴 Starting in 1 Hour: ${title}`,
          body: `Hi {{FirstName}},\n\nWe are starting in 60 minutes! Grab your coffee and join the stream using your unique link below:\n\nJoin Link: {{JoinLink}}\n\nSee you inside!`,
        },
        thankYou: {
          subject: `🎉 Thank you for attending ${title}`,
          body: `Hi {{FirstName}},\n\nThank you for joining our live masterclass today! As promised, here is your access package:\n\n📹 Watch Recording: {{RecordingLink}}\n📄 Download Presentation & Playbook: {{ResourceLink}}\n\nLet's connect!`,
        },
        followUp: {
          subject: `💡 Next steps for implementing ${topic}`,
          body: `Hi {{FirstName}},\n\nFollowing up on our session, would you like a personalized 1:1 strategy audit for your team's pipeline?\n\nBook a 15-min call with our team here: {{BookingLink}}`,
        },
      },
      promotionalContent: {
        tagline: `Scale pipeline 10x with ${topic}`,
        valueProposition: `The definitive masterclass for ${audience} looking to automate lead conversion with enterprise AI bots.`,
        pressSnippet: `DealsflowsAI announces live interactive webinar "${title}" showcasing autonomous AI Dealflow Bot host capabilities.`,
      },
      socialCreatives: {
        linkedin: {
          platform: "linkedin",
          platformName: "LinkedIn",
          caption: `🚀 Ready to scale revenue ops without adding headcount?\n\nJoin our upcoming live webinar: "${title}"!\n\nWhat you'll learn:\n✅ ${topic}\n✅ Live AI Dealflow Bot hosting & RAG Q&A\n✅ Actionable enterprise playbooks\n\n🎯 Target Audience: ${audience}\n📅 Date: ${wizardData?.date} @ ${wizardData?.time} ${wizardData?.timezone}\n\n👉 Reserve your seat: {{Link}} #AI #RevenueOps #SalesAutomation #B2B`,
          hashtags: ["#RevenueOps", "#B2BSales", "#AIAgents", "#Dealflow", "#Leadership"],
          cta: "Register on LinkedIn",
          recommendedImageSize: "1200 x 627 px (Landscape Banner)",
          previewCardType: "carousel",
        },
        facebook: {
          platform: "facebook",
          platformName: "Facebook",
          caption: `🔥 Don't miss our live masterclass: ${title}!\n\nLearn how autonomous AI agents handle live Q&A, qualify leads, and boost sales conversion automatically.\n\nSave your spot here: {{Link}}`,
          hashtags: ["#TechWebinar", "#AISales", "#BusinessGrowth"],
          cta: "Sign Up Now",
          recommendedImageSize: "1200 x 630 px",
          previewCardType: "banner",
        },
        instagram: {
          platform: "instagram",
          platformName: "Instagram",
          caption: `✨ Modern Revenue Teams are switching to Autonomous AI Hosts!\n\nJoin us live for "${title}" with our AI Dealflow Bot.\n\nSwipe left to check the agenda 📲\n\nLink in bio to register! 🎟️`,
          hashtags: ["#AISalesBot", "#FutureOfWork", "#SalesMasterclass", "#TechTrends"],
          cta: "Link in Bio to Register",
          recommendedImageSize: "1080 x 1350 px (Portrait 4:5)",
          previewCardType: "story",
        },
        twitter: {
          platform: "twitter",
          platformName: "X (Twitter)",
          caption: `🤖 How do top B2B companies automate live buyer conversations?\n\nWe're hosting a live webinar: "${title}" featuring an interactive AI Host.\n\n📅 ${wizardData?.date}\n⏰ ${wizardData?.time}\n\nSign up here 👇 {{Link}}`,
          hashtags: ["#AI", "#SalesTech", "#BuildInPublic"],
          cta: "Register Today",
          recommendedImageSize: "1200 x 675 px",
          previewCardType: "text_card",
        },
        threads: {
          platform: "threads",
          platformName: "Threads",
          caption: `We're letting an AI Bot host our upcoming live webinar on ${topic}. 🤯\n\nWant to see real-time RAG Q&A and instant lead qualification in action?\n\nGrab your invite link in the comments! 🔗`,
          hashtags: ["#ThreadsTech", "#AIRevolution"],
          cta: "Get Access Link",
          recommendedImageSize: "1080 x 1080 px (Square)",
          previewCardType: "text_card",
        },
        whatsapp: {
          platform: "whatsapp",
          platformName: "WhatsApp",
          caption: `👋 Hi! You're invited to an exclusive live session: *${title}*.\n\nLearn how AI agents double sales velocity for ${audience}.\n\n📅 Date: ${wizardData?.date}\n⏰ Time: ${wizardData?.time} ${wizardData?.timezone}\n\nTap to register: {{Link}}`,
          hashtags: [],
          cta: "Register via WhatsApp",
          recommendedImageSize: "800 x 800 px",
          previewCardType: "text_card",
        },
        telegram: {
          platform: "telegram",
          platformName: "Telegram",
          caption: `📢 **LIVE WEBINAR ANNOUNCEMENT**\n\n**${title}**\n\nTopic: ${topic}\nSpeaker: AI Dealflow Bot Host\nDate: ${wizardData?.date} @ ${wizardData?.time}\n\nKey Highlights:\n• Live synthetic host avatar\n• Real-time context QA engine\n• PDF Certificate for attendees\n\n👉 Join channel event: {{Link}}`,
          hashtags: ["#Webinar", "#TelegramAI"],
          cta: "Join Telegram Event",
          recommendedImageSize: "1280 x 720 px",
          previewCardType: "banner",
        },
        youtube: {
          platform: "youtube",
          platformName: "YouTube",
          caption: `🔴 Live Stream Premier: ${title}\n\nIn this livestream masterclass, our AI Dealflow Bot presents the complete blueprint for ${topic}.\n\nChapters:\n00:00 Introduction\n05:00 Architecture Overview\n20:00 Live RAG Q&A\n35:00 Implementation\n\nSubscribe & set reminder: {{Link}}`,
          hashtags: ["#YouTubeLive", "#AITutorial", "#SalesStrategy"],
          cta: "Set Reminder on YouTube",
          recommendedImageSize: "1280 x 720 px (HD Thumbnail)",
          previewCardType: "video_script",
        },
        email: {
          platform: "email",
          platformName: "Email Newsletter",
          caption: `Subject: [Invitation] ${title}\n\nDear Partner,\n\nWe invite you to attend our flagship webinar on ${topic}. Discover how top enterprise brands achieve 10x ROI with autonomous revenue agents.\n\nClick below to reserve your ticket.`,
          hashtags: [],
          cta: "Confirm Attendance",
          recommendedImageSize: "600 x 300 px (Header Banner)",
          previewCardType: "html_email",
        },
      },
    };

    return NextResponse.json({ success: true, aiContent: generatedContent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
