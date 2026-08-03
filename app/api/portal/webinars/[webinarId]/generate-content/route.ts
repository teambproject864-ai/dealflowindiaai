import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, addAuditLog } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { logAuditEvent } from "@/lib/audit-logger";
import { logger } from "@/lib/logger";
import type { Webinar, GeneratedContent } from "@/lib/portal-types";

export const dynamic = "force-dynamic";

function generateId(): string {
  return `gc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  return realIp || "unknown";
}

function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}

function generateAgenda(webinar: Webinar) {
  const items = [
    { id: "a1", title: "Welcome & Introductions", description: "Host welcomes attendees, introduces speakers, outlines webinar goals and housekeeping.", startTime: "00:00", durationMinutes: 5, speakerId: webinar.speakers?.[0]?.id },
    { id: "a2", title: "The Current Landscape", description: `Overview of ${webinar.industry} industry challenges, market trends, and the problem space.`, startTime: "00:05", durationMinutes: 10, speakerId: webinar.speakers?.[0]?.id },
    { id: "a3", title: "Key Insights & Research Findings", description: "Data-backed insights, benchmarks, and proprietary research findings from recent studies.", startTime: "00:15", durationMinutes: 15, speakerId: webinar.speakers?.[1]?.id },
    { id: "a4", title: "Live Demo & Walkthrough", description: "Interactive demonstration of the solution in action, showing real workflows and outcomes.", startTime: "00:30", durationMinutes: 20, speakerId: webinar.speakers?.[0]?.id },
    { id: "a5", title: "Case Study: Customer Success Story", description: `Deep dive into how a leading ${webinar.industry} company achieved measurable results.`, startTime: "00:50", durationMinutes: 10, speakerId: webinar.speakers?.[1]?.id },
    { id: "a6", title: "Live Q&A Session", description: "Speakers answer attendee questions submitted throughout the presentation.", startTime: "01:00", durationMinutes: 15, speakerId: webinar.speakers?.[0]?.id },
    { id: "a7", title: "Next Steps & Exclusive Offer", description: "Clear call-to-action, next steps for attendees, and exclusive webinar-only offer.", startTime: "01:15", durationMinutes: 5, speakerId: webinar.speakers?.[0]?.id },
  ];
  return {
    title: `${webinar.title} - Webinar Agenda`,
    durationMinutes: webinar.durationMinutes || 90,
    items,
    breakouts: [],
    materials: [
      { name: "Presentation Deck", type: "pdf", url: "#" },
      { name: "Resource Guide", type: "pdf", url: "#" },
      { name: "ROI Calculator", type: "xlsx", url: "#" },
    ],
  };
}

function generateSlides(webinar: Webinar) {
  const slides = [
    { id: "s1", slideNumber: 1, title: webinar.title, subtitle: webinar.objective, type: "title", content: { headline: webinar.title, subhead: webinar.objective, presenters: webinar.speakers?.map(s => ({ name: s.name, title: s.title, org: s.organization })) || [] } },
    { id: "s2", slideNumber: 2, title: "The Problem We're Solving", type: "content", content: { bullets: [`67% of ${webinar.industry} organizations face this challenge daily`, "Teams lose 15+ hours per week to manual processes", "Competitors are already adopting AI-powered solutions", "The cost of inaction is accelerating quarter over quarter"] } },
    { id: "s3", slideNumber: 3, title: "Market Opportunity Overview", type: "chart", content: { chartType: "bar", title: "Market Growth Projection (2024-2028)", data: [{ label: "2024", value: 1.2 }, { label: "2025", value: 1.8 }, { label: "2026", value: 2.5 }, { label: "2027", value: 3.6 }, { label: "2028", value: 5.2 }], unit: "$B" } },
    { id: "s4", slideNumber: 4, title: "Our Solution Architecture", type: "diagram", content: { headline: "End-to-End Platform", components: ["Data Ingestion Layer", "AI Processing Engine", "Real-Time Analytics", "Automated Workflows", "Integration Hub", "Reporting Dashboard"] } },
    { id: "s5", slideNumber: 5, title: "Key Features & Capabilities", type: "grid", content: { items: [{ icon: "⚡", title: "Lightning Fast", desc: "90% reduction in processing time" }, { icon: "🎯", title: "Precision Targeting", desc: "3x improvement in match accuracy" }, { icon: "📊", title: "Advanced Analytics", desc: "Real-time visibility & insights" }, { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 Type II certified" }] } },
    { id: "s6", slideNumber: 6, title: "Customer Success Story", type: "casestudy", content: { company: `Global ${webinar.industry} Leader`, headline: "420% ROI in First 6 Months", metrics: [{ label: "Cost Savings", value: "$2.4M" }, { label: "Efficiency Gain", value: "78%" }, { label: "Time Savings", value: "1,200 hrs/mo" }], quote: "This transformed how our entire team operates. We couldn't imagine going back.", author: "VP of Operations" } },
    { id: "s7", slideNumber: 7, title: "Pricing & Packages", type: "pricing", content: { tiers: [{ name: "Starter", price: "$499", features: ["Up to 50 users", "Core features", "Email support", "Monthly reporting"] }, { name: "Professional", price: "$1,299", features: ["Up to 250 users", "All features", "Priority support", "Custom integrations"], highlighted: true }, { name: "Enterprise", price: "Custom", features: ["Unlimited users", "Dedicated CSM", "SLA guarantee", "On-premise option"] }] } },
    { id: "s8", slideNumber: 8, title: "Your Exclusive Webinar Offer", type: "cta", content: { headline: "Get Started Today", offer: "30-day free trial + 20% off your first 3 months", deadline: "Offer valid for 48 hours", ctaButton: "Claim Your Offer Now", bonus: "Bonus: Free onboarding & strategy session" } },
    { id: "s9", slideNumber: 9, title: "Q&A", type: "closing", content: { title: "Questions & Discussion", contactInfo: { email: "webinar@company.com", website: "www.company.com", linkedin: "/company/company-name" } } },
  ];
  return {
    totalSlides: slides.length,
    theme: { primary: webinar.branding?.primaryColor || "#2563eb", secondary: webinar.branding?.secondaryColor || "#1e40af" },
    slides,
  };
}

function generateSpeakerNotes(webinar: Webinar) {
  return {
    speakingTips: {
      pace: "Speak at 130-150 words per minute for optimal comprehension",
      pauses: "Use 2-second pauses after key points for absorption",
      energy: "Vary vocal pitch and energy; avoid monotone delivery",
      engagement: "Reference the chat periodically to acknowledge attendees",
    },
    slideBySlideNotes: [
      { slideNumber: 1, title: "Title Slide", notes: `Welcome everyone! Thank you for joining today's session: "${webinar.title}". I'm [Speaker 1] and with me is [Speaker 2]. Today we'll cover ${webinar.objective}. Please use the Q&A panel for questions — we'll address them live at the end. Housekeeping: The session is being recorded and will be sent to your email within 24 hours.` },
      { slideNumber: 2, title: "The Problem", notes: `Let's start with the reality on the ground. In ${webinar.industry}, 67% of organizations are grappling with this daily. What does this mean for YOUR team? 15+ hours weekly spent on tasks that should be automated. Your competitors are moving — 73% already have initiatives underway. The cost of inaction isn't linear — it compounds.` },
      { slideNumber: 3, title: "Market Opportunity", notes: "This isn't a trend — it's a structural shift. Look at this trajectory: from $1.2B to $5.2B in just 4 years. That's a compound annual growth rate of 44%. The early movers are locking in advantages now. The question is: will you be among them?" },
      { slideNumber: 4, title: "Solution Architecture", notes: "Now let's look at HOW we solve this. Our platform is built on six interconnected layers. Starting with Data Ingestion that pulls from your existing systems. The AI Engine processes in real-time. Analytics gives you visibility. Workflows automate action. Integration Hub connects to everything. And the Dashboard makes it all accessible." },
      { slideNumber: 5, title: "Key Features", notes: "Walk through each quadrant. Lightning Fast: We're not talking marginal improvements — 90% reduction in processing time. Precision Targeting: 3x better accuracy means less waste. Advanced Analytics: What gets measured gets managed. Enterprise Security: This is non-negotiable for B2B teams." },
      { slideNumber: 6, title: "Case Study", notes: "Let's make this concrete. A global leader in your space — $2.4M in savings, 78% efficiency gain, 1,200 hours back every month. That's 5 full-time employees reallocated to strategic work. The VP quote isn't hyperbole — we hear versions of this every week." },
      { slideNumber: 7, title: "Pricing", notes: "Three tiers to match your journey. Starter for teams getting going. Professional is the sweet spot — it's what 70% of our customers choose. Enterprise for when you need custom everything. Pay attention to the Professional tier highlight — it's the best value by far." },
      { slideNumber: 8, title: "Exclusive Offer", notes: "Now here's why attending LIVE matters. 30-day free trial PLUS 20% off your first 3 months. That's a value of $2,600 on the Professional tier. But this vanishes in 48 hours. Click the CTA button now — it takes you to a special landing page only for webinar attendees." },
      { slideNumber: 9, title: "Q&A", notes: "Alright, let's open it up! We've already gotten some great questions in the queue. [Scan Q&A panel] Let's start with [Attendee Name] who asks... [After last question] Thank you all for your excellent questions. If we didn't get to yours, we'll follow up personally via email within 24 hours." },
    ],
    transitionPhrases: ["Now, let's dive into...", "Building on that last point...", "To illustrate this...", "Speaking of results...", "Putting this all together..."],
  };
}

function generateFAQs(webinar: Webinar) {
  return {
    faqs: [
      { id: "faq1", category: "General", question: `What is "${webinar.title}" about?`, answer: `${webinar.title} is a ${webinar.durationMinutes}-minute deep dive into ${webinar.objective}. Designed for ${webinar.targetAudience}, you'll leave with actionable frameworks, proven strategies, and an exclusive offer to implement immediately.` },
      { id: "faq2", category: "General", question: "Who should attend this webinar?", answer: `This webinar is ideal for ${webinar.targetAudience} within the ${webinar.industry} industry. Specifically: decision-makers evaluating solutions, practitioners who'll use the platform daily, and leaders who need to build business cases for investment.` },
      { id: "faq3", category: "Access", question: "Will the webinar be recorded?", answer: "Yes! All registrants automatically receive the recording, slide deck, and resource pack via email within 24 hours of the live session. Even if you can't make it live, register to get all the materials." },
      { id: "faq4", category: "Access", question: "Can I watch on demand at my own pace?", answer: "Absolutely. The on-demand recording will be available for 30 days after the live date. You'll get unlimited views during that window. Note: The exclusive live offer is only available for 48 hours after the broadcast." },
      { id: "faq5", category: "Technical", question: "What platform do you use? Do I need to download anything?", answer: `We use ${webinar.meetingPlatform} (Zoom/Teams/Google Meet). No downloads required — it works directly in your browser on desktop or mobile. For the best experience, use Chrome or Edge, and test your audio/video beforehand.` },
      { id: "faq6", category: "Technical", question: "Will there be closed captions or a transcript?", answer: "Yes. Live closed captions are enabled during the session. A full transcript with timestamps will be included in the follow-up email. If you need additional accessibility accommodations, reply to your confirmation email and we'll arrange it." },
      { id: "faq7", category: "Interaction", question: "Can I ask questions during the webinar?", answer: "Definitely! We encourage it. Use the Q&A panel (not the chat) to submit questions at any time. Our team moderates and prioritizes the most popular ones. If we don't get to yours live, we answer via email within 24 hours." },
      { id: "faq8", category: "Interaction", question: "Are there any interactive elements or polls?", answer: "Yes, we've built in 3 live polls to benchmark your experience against peers. The aggregated, anonymized results are shared in real-time and included in your resource pack." },
      { id: "faq9", category: "Offer", question: "Tell me more about the exclusive offer.", answer: "Live attendees get a 30-day free trial (no credit card required) PLUS 20% off their first 3 months on any paid plan. The value on the Professional tier is $2,600. This is only for webinar attendees and expires 48 hours after the live session." },
      { id: "faq10", category: "Offer", question: "Can my whole team take advantage of the offer?", answer: "Yes! The offer applies to the account level, so everyone on your team benefits. When you claim, just select the appropriate tier for your team size. For Enterprise inquiries, mention 'webinar team offer' during your intro call." },
      { id: "faq11", category: "Speakers", question: "Will I have direct access to the speakers?", answer: "During the live Q&A, yes — you'll interact with them directly. Afterward, you can connect with them on LinkedIn (links in the resource email). For deeper conversations, our team can schedule a private briefing as part of your onboarding." },
      { id: "faq12", category: "Follow-Up", question: "What happens after I register?", answer: "You'll get an immediate confirmation with calendar invites (.ics for Google, Outlook, Apple). 24 hours before the webinar, you'll receive a reminder with access details and prep materials. Within 24 hours after the webinar, you'll get the full resource pack." },
    ],
  };
}

function generateLandingPage(webinar: Webinar) {
  return {
    seo: { title: `${webinar.title} | Free Live Webinar`, metaDescription: `${webinar.description.substring(0, 160)} Join industry experts for this exclusive session.`, canonicalUrl: "#", ogImage: "#" },
    hero: { headline: webinar.title, subheadline: webinar.objective, dateLine: `Live on ${new Date(webinar.startDateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(webinar.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} ${webinar.timezone}`, duration: `${webinar.durationMinutes} minutes`, speakers: webinar.speakers?.map(s => ({ name: s.name, title: s.title, organization: s.organization, avatarUrl: s.avatarUrl || "#", isAIBot: s.isAIBot })) || [] },
    whatYoullLearn: [
      `The 3 biggest ${webinar.industry} trends reshaping your competitive landscape — and how to exploit them`,
      "A proven framework used by 500+ teams to cut operational costs by 40%+ in 90 days",
      "Live demo: See the platform solve REAL customer scenarios in real time",
      "Live Q&A with industry veterans — get your specific questions answered",
      "Exclusive webinar-only offer: 30-day trial + 20% off (valued at $2,600)",
    ],
    agendaPreview: [
      { time: "00:00", title: "Welcome & Industry Context", speaker: webinar.speakers?.[0]?.name || "Speaker 1" },
      { time: "00:15", title: "Research Insights & Data", speaker: webinar.speakers?.[1]?.name || "Speaker 2" },
      { time: "00:30", title: "Live Platform Demo", speaker: webinar.speakers?.[0]?.name || "Speaker 1" },
      { time: "01:00", title: "Case Study & Results", speaker: webinar.speakers?.[1]?.name || "Speaker 2" },
      { time: "01:15", title: "Live Q&A + Exclusive Offer", speaker: "All Speakers" },
    ],
    testimonials: [
      { quote: "Attending that webinar was the turning point for our team. We implemented the framework within a week and saw results immediately.", author: "Sarah Chen", title: "Director of Operations", company: "Fortune 1000 Company" },
      { quote: "The content wasn't fluff — it was tactical. I had three pages of notes before the Q&A even started.", author: "Marcus Rivera", title: "VP of Strategy", company: "Series B SaaS Startup" },
    ],
    faqSection: generateFAQs(webinar).faqs.slice(0, 6),
    footer: { privacy: "#", terms: "#", contact: "webinar@company.com" },
  };
}

function generateRegistrationPage(webinar: Webinar) {
  return {
    hero: { headline: `Reserve Your Spot: ${webinar.title}`, subheadline: `Limited to ${webinar.maxAttendees} live attendees. Free registration includes recording, slide deck, resource pack, and exclusive offer.` },
    form: {
      fields: [
        { id: "firstName", name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John", autocomplete: "given-name" },
        { id: "lastName", name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Doe", autocomplete: "family-name" },
        { id: "email", name: "email", label: "Work Email", type: "email", required: true, placeholder: "john@company.com", autocomplete: "email" },
        { id: "phone", name: "phone", label: "Phone (Optional)", type: "phone", required: false, placeholder: "+1 (555) 000-0000", autocomplete: "tel", helpText: "We'll SMS you 10 minutes before the webinar starts" },
        { id: "company", name: "company", label: "Company", type: "text", required: true, placeholder: "Acme Inc.", autocomplete: "organization" },
        { id: "jobTitle", name: "jobTitle", label: "Job Title", type: "select", required: true, options: ["Executive (C-Suite, VP)", "Director", "Manager", "Individual Contributor", "Founder / Owner", "Other"] },
        { id: "industry", name: "industry", label: "Industry", type: "select", required: true, options: ["SaaS / Technology", "Healthcare", "Finance / FinTech", "E-commerce / Retail", "Manufacturing", "Education", "Professional Services", "Other"] },
        { id: "companySize", name: "companySize", label: "Company Size", type: "select", required: true, options: ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1001+ employees"] },
        { id: "whatBringsYou", name: "whatBringsYou", label: "What brings you to this webinar? (Optional)", type: "textarea", required: false, placeholder: "Share what you're hoping to learn or any specific challenges...", rows: 3 },
      ],
      gdpr: {
        required: true,
        consentText: "By registering, I agree to receive webinar communications (confirmation, reminders, follow-up resources). I understand I can unsubscribe at any time.",
        privacyLink: "#",
      },
      submitButton: { text: "Register Now — It's Free", processingText: "Securing Your Spot..." },
    },
    trustIndicators: [
      { icon: "🔒", text: "Your data is secure & private" },
      { icon: "📧", text: "Confirmation email sent instantly" },
      { icon: "📅", text: "Auto-add to Google / Outlook Calendar" },
      { icon: "🎁", text: "Free bonus: Resource pack included" },
    ],
    scarcityNotice: `Only ${Math.max(0, webinar.maxAttendees - 42)} spots remaining. Last session sold out 3 days early.`,
    socialProof: { registrations: 1247, attendeeCompanies: ["Fortune 500", "Tech Unicorns", "Leading Startups"] },
  };
}

function generateEmailInvitation(webinar: Webinar) {
  return {
    subject: `You're Invited: [Free Live Webinar] ${webinar.title}`,
    preheader: `${webinar.durationMinutes} minutes. Zero fluff. Actionable strategies + exclusive offer for attendees.`,
    from: { name: "DealFlow AI Webinars", email: "webinars@dealflow.ai" },
    replyTo: "webinar-support@dealflow.ai",
    template: {
      greeting: "Hi {{firstName}}",
      bodySections: [
        { type: "headline", content: `[FREE LIVE WEBINAR] ${webinar.title}` },
        { type: "paragraph", content: `I wanted to personally invite you to an exclusive session tailored for ${webinar.targetAudience} in the ${webinar.industry} space.` },
        { type: "paragraph", content: `This isn't theory. We're pulling back the curtain on what's ACTUALLY working for teams like yours right now.` },
        { type: "divider" },
        { type: "eventDetails", data: { date: new Date(webinar.startDateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), time: `${new Date(webinar.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ${webinar.timezone}`, duration: `${webinar.durationMinutes} minutes`, platform: webinar.meetingPlatform.toUpperCase(), speakers: webinar.speakers?.map(s => `${s.name}, ${s.title} at ${s.organization}`).join(" & ") || "Industry Experts" } },
        { type: "divider" },
        { type: "subheadline", content: "What you'll walk away with:" },
        { type: "bullets", items: [
          `3 underused ${webinar.industry} trends you can capitalize on THIS quarter`,
          "Live demo: Real problems solved in real time — not canned slides",
          "A benchmark report so you can see where you stand vs. peers",
          "LIVE Q&A with 20+ minutes dedicated to YOUR questions",
          "EXCLUSIVE: 30-day free trial + 20% off (valued at $2,600)",
        ]},
        { type: "cta", data: { buttonText: "RESERVE MY FREE SPOT NOW", buttonUrl: "#", supportingText: "Takes 30 seconds. Recording sent to all registrants." } },
        { type: "paragraph", content: "Seats are filling fast. The last webinar in this series sold out 3 days early with 1,200+ waitlisted.", style: "urgent" },
        { type: "signoff", content: "Looking forward to seeing you live!" },
        { type: "signature", lines: ["The DealFlow AI Webinar Team", "P.S. Can't make it live? Register anyway and we'll send the recording + full resource pack. But note: the exclusive offer is ONLY available for 48 hours after the live broadcast."] },
      ],
      branding: { primaryColor: webinar.branding?.primaryColor || "#2563eb", logoUrl: "#" },
    },
    personalizationVariables: ["{{firstName}}", "{{lastName}}", "{{company}}", "{{jobTitle}}", "{{registrationLink}}"],
  };
}

function generateReminderEmail(webinar: Webinar) {
  return {
    subject: `[Starting Soon] Don't Miss: ${webinar.title} — Live in {{hoursUntil}} Hours`,
    preheader: "Check your tech now, add to calendar, and submit early questions. Exclusive offer details inside.",
    from: { name: "DealFlow AI Webinars", email: "webinars@dealflow.ai" },
    replyTo: "webinar-support@dealflow.ai",
    template: {
      greeting: "Hi {{firstName}}",
      bodySections: [
        { type: "headline", content: `⏰ Starting Soon: ${webinar.title}` },
        { type: "paragraph", content: `You're registered! The webinar goes LIVE on ${new Date(webinar.startDateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${new Date(webinar.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ${webinar.timezone}.` },
        { type: "divider" },
        { type: "subheadline", content: "✅ Before you join (takes 2 minutes):" },
        { type: "checklist", items: [
          { text: "Test your audio/video connection:", subtext: "Click 'Join Test Meeting' in your confirmation email" },
          { text: "Add to your calendar:", subtext: "Google Calendar | Outlook | Apple (.ics links below)" },
          { text: "Submit your question early:", subtext: "We prioritize pre-submitted questions during Q&A" },
          { text: "Invite a colleague:", subtext: "Forward this email — they can still register" },
        ]},
        { type: "divider" },
        { type: "cta", data: { buttonText: "JOIN WEBINAR NOW (LIVE ROOM)", buttonUrl: "#", supportingText: "Link goes live 15 minutes before start time." } },
        { type: "divider" },
        { type: "subheadline", content: "🎁 What's in it for you today:" },
        { type: "bullets", items: [
          "Live benchmark polls — see how you compare to peers in real-time",
          "Resource pack: ROI calculator, implementation checklist, framework PDF",
          "EXCLUSIVE OFFER: 30-day free trial + 20% off first 3 months",
          "Direct Q&A access to our speaker panel",
        ]},
        { type: "paragraph", content: "Pro tip: Join 10 minutes early to get a front-row seat in the Q&A queue.", style: "tip" },
        { type: "signature", lines: ["See you live!", "— The DealFlow AI Webinar Team", "P.S. The offer we're announcing today is only for LIVE attendees and expires in 48 hours. Don't miss it."] },
      ],
      branding: { primaryColor: webinar.branding?.primaryColor || "#2563eb", logoUrl: "#" },
    },
    calendarLinks: { google: "#", outlook: "#", apple: "#" },
    techSupport: { email: "webinar-support@dealflow.ai", phone: "+1 (555) 123-4567", hours: "9am-8pm ET on webinar day" },
  };
}

function generateThankYouEmail(webinar: Webinar) {
  return {
    subject: `🎉 Thank You for Attending: ${webinar.title} — Your Resources Inside`,
    preheader: "Recording, slide deck, resource pack, and your EXCLUSIVE OFFER are all ready for you.",
    from: { name: "DealFlow AI Webinars", email: "webinars@dealflow.ai" },
    replyTo: "webinar-support@dealflow.ai",
    template: {
      greeting: "Hi {{firstName}}",
      bodySections: [
        { type: "headline", content: "Thank You For Joining Us Today!" },
        { type: "paragraph", content: `We had ${Math.floor(Math.random() * 400) + 600}+ attendees live for "${webinar.title}" — thank YOU for being one of them. The questions were fantastic, and the energy was through the roof.` },
        { type: "divider" },
        { type: "subheadline", content: "📦 Everything you asked for is below:" },
        { type: "resources", items: [
          { name: "🎥 Full Webinar Recording", description: "Watch on demand, skip to sections, share with your team. Available for 30 days.", url: "#" },
          { name: "📊 Presentation Slide Deck", description: "All 53 slides in PDF format. Includes data, frameworks, and speaker notes.", url: "#" },
          { name: "📋 Implementation Resource Pack", description: "ROI Calculator + Checklist + Framework Template. Start applying what you learned.", url: "#" },
          { name: "📝 Poll Results & Benchmarks", description: "Aggregated anonymous data from today's audience. Where do you stand?", url: "#" },
          { name: "❓ Q&A Transcript", description: "Every question asked — and answered — including ones we couldn't cover live.", url: "#" },
        ]},
        { type: "divider" },
        { type: "offerCard", data: { headline: "🔥 YOUR EXCLUSIVE WEBINAR OFFER (Expires in 48 Hours)", subheadline: "30-Day Free Trial + 20% Off Your First 3 Months", valueProposition: "On the Professional tier: That's $2,600 in total value. No credit card required for the trial.", ctaText: "CLAIM MY EXCLUSIVE OFFER NOW", ctaUrl: "#", finePrint: "Offer expires: {{offerExpiryDate}}. One per organization. Cannot be combined with other promotions." } },
        { type: "divider" },
        { type: "subheadline", content: "👥 What's Next?" },
        { type: "nextSteps", items: [
          { step: "1", title: "Dive into the resources", description: "Start with the Implementation Checklist in your Resource Pack." },
          { step: "2", title: "Schedule a strategy session", description: "Book a 30-minute 1:1 with our team to map out your specific use case." },
          { step: "3", title: "Claim your offer", description: "Click the offer button above before the 48-hour window closes." },
        ]},
        { type: "cta", data: { buttonText: "BOOK MY FREE STRATEGY SESSION", buttonUrl: "#", supportingText: "Limited spots available this week." } },
        { type: "paragraph", content: "As always, if you have any questions, reply to this email — we read and respond to every single one.", style: "friendly" },
        { type: "signature", lines: ["Until next time,", "— The DealFlow AI Webinar Team", "P.S. Seriously, that 48-hour offer timer is ticking. Don't leave $2,600 on the table. Claim it now: {{offerLink}}"] },
      ],
      branding: { primaryColor: webinar.branding?.primaryColor || "#2563eb", logoUrl: "#" },
    },
    certificateOfAttendance: { available: true, url: "#", credits: "1.0 CPE / PDUs (if applicable)" },
    survey: { url: "#", prompt: "2-minute feedback survey — your input shapes future webinars!" },
  };
}

function generateFollowUpEmail(webinar: Webinar) {
  return {
    subject: `[Last Chance] Your ${webinar.title} Exclusive Offer Expires Tonight`,
    preheader: "48-hour window closes at midnight. Here's everything again — don't let this slip.",
    from: { name: "DealFlow AI Webinars", email: "webinars@dealflow.ai" },
    replyTo: "webinars@dealflow.ai",
    template: {
      greeting: "Hi {{firstName}}",
      bodySections: [
        { type: "headline", content: "⏰ Your Exclusive Offer Expires TONIGHT at Midnight" },
        { type: "paragraph", content: `On {{attendanceDate}}, you joined ${Math.floor(Math.random() * 400) + 600}+ peers for "${webinar.title}" — and qualified for our attendee-only offer.` },
        { type: "paragraph", content: "I'm reaching out because your 48-hour window closes at midnight TONIGHT. After that, the trial goes back to 14 days and the 20% discount vanishes forever.", style: "urgent" },
        { type: "divider" },
        { type: "subheadline", content: "Just to recap what you're getting:" },
        { type: "comparison", data: { rows: [
          { label: "Trial Length", regular: "14 days (public)", offer: "30 DAYS (yours)" },
          { label: "First 3 Months", regular: "Full Price", offer: "20% OFF (saves ~$780)" },
          { label: "Onboarding Support", regular: "Email only", offer: "STRATEGY CALL INCLUDED" },
          { label: "Total Value", regular: "$499", offer: "$2,600+" },
        ]}},
        { type: "divider" },
        { type: "cta", data: { buttonText: "YES — I WANT TO CLAIM MY OFFER NOW", buttonUrl: "#", supportingText: "One-click activation. No credit card for the trial." } },
        { type: "divider" },
        { type: "subheadline", content: "Still deciding? Let's address the top 3 objections:" },
        { type: "faq", items: [
          { q: "What if I don't have time to implement right now?", a: "That's the beauty of 30 days. Activate your license today, lock in the 20% discount, and start when you're ready. The clock starts on YOUR schedule." },
          { q: "Can I change my tier later?", a: "Absolutely. Upgrade, downgrade, or cancel at any time. The 20% discount applies to whichever tier you're on during those first 3 months." },
          { q: "What if it's not a fit?", a: "Cancel within the 30-day trial and you pay $0. Nothing. Nada. The risk is ENTIRELY on us." },
        ]},
        { type: "paragraph", content: "Still on the fence? Reply to this email with 'Strategy Call' and I'll book you in for 30 minutes with my team. No pressure. No sales pitch. Just answers.", style: "friendly" },
        { type: "signature", lines: ["Don't let this slip — midnight is the hard cutoff.", "Cheers,", "— The DealFlow AI Webinar Team", "P.S. This is the LAST email you'll get about this offer. After midnight, we'll go radio silent. No follow-ups. No extensions. Fair warning."] },
      ],
      branding: { primaryColor: webinar.branding?.primaryColor || "#ef4444", logoUrl: "#" },
    },
    countdown: { deadlineUnit: "hours", value: 8, message: "Your exclusive offer expires in:" },
  };
}

const PROMO_PLATFORMS = [
  { key: "linkedin", platform: "linkedin", name: "LinkedIn" },
  { key: "facebook", platform: "facebook", name: "Facebook" },
  { key: "instagram", platform: "instagram", name: "Instagram" },
  { key: "x", platform: "x", name: "X (Twitter)" },
  { key: "threads", platform: "threads", name: "Threads" },
  { key: "whatsapp", platform: "whatsapp", name: "WhatsApp" },
  { key: "telegram", platform: "telegram", name: "Telegram" },
  { key: "youtube", platform: "youtube", name: "YouTube" },
  { key: "email", platform: "email", name: "Email Newsletter" },
] as const;

type PromoPlatformKey = typeof PROMO_PLATFORMS[number]["key"];

function generateSocialPromo(webinar: Webinar, platformKey: PromoPlatformKey) {
  const dateStr = new Date(webinar.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = new Date(webinar.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const registrationUrl = "#";

  const configs: Record<PromoPlatformKey, any> = {
    linkedin: {
      imageSize: "1200x628",
      caption: `🎯 LIVE WEBINAR ALERT — ${dateStr} at ${timeStr} ${webinar.timezone}\n\n📌 Topic: ${webinar.title}\n💡 Outcome: ${webinar.objective}\n👥 Audience: ${webinar.targetAudience}\n\nHere's why you should clear your calendar:\n\n✅ 3 game-changing ${webinar.industry} trends you can exploit THIS quarter\n✅ Live demo: Real customer challenges solved in real time\n✅ Benchmark yourself against peers via live polls\n✅ 20-minute dedicated Q&A with our expert panel\n✅ EXCLUSIVE OFFER: 30-day free trial + 20% off (valued at $2,600)\n\nFeaturing:\n${webinar.speakers?.map(s => `🔹 ${s.name} — ${s.title}, ${s.organization}`).join('\n') || '🔹 Industry Expert Panel'}\n\n⏰ Only ${webinar.maxAttendees} live spots. Last session sold out 3 days early with 1,200+ on the waitlist.\n\n👇 Register FREE (takes 30 seconds):\n${registrationUrl}\n\nTag a colleague who needs to see this. 👇\n\n#${webinar.industry.replace(/\s+/g, '')} #Webinar #ProfessionalDevelopment #Leadership #Innovation #BusinessGrowth #TechTrends #B2B #CareerGrowth #Networking`,
      hashtags: [`${webinar.industry.replace(/\s+/g, '')}Webinar`, "LiveWebinar", "ProfessionalDevelopment", webinar.industry.replace(/\s+/g, ''), "Leadership", "Innovation", "BusinessGrowth", "TechTrends", "B2BMarketing", "CareerGrowth"],
      ctaText: "Register Free Now",
      ctaUrl: registrationUrl,
      carousels: [
        { slide: 1, headline: webinar.title, subheadline: "Free Live Webinar" },
        { slide: 2, headline: "What You'll Learn", subheadline: "3 trends + Live demo + Benchmark data" },
        { slide: 3, headline: "Speaker Lineup", subheadline: webinar.speakers?.[0]?.name || "Industry Experts" },
        { slide: 4, headline: "Exclusive Offer", subheadline: "30-day trial + 20% off ($2,600 value)" },
        { slide: 5, headline: "Claim Your Spot", subheadline: `${webinar.maxAttendees} seats only` },
      ],
    },
    facebook: {
      imageSize: "1200x630",
      caption: `✨ You're personally invited to a FREE live webinar! ✨\n\n📣 ${webinar.title}\n📅 ${dateStr} · ${timeStr} ${webinar.timezone}\n⏱️ ${webinar.durationMinutes} minutes of pure value\n\n🎯 If you're a ${webinar.targetAudience} working in ${webinar.industry}, this session was MADE for you.\n\n💎 What's inside:\n• LIVE platform demo (not just slides!)\n• Real customer success story — $2.4M in savings\n• Interactive polls — see how you rank vs peers\n• Your questions answered LIVE\n• 🎁 EXCLUSIVE: 30-day free trial + 20% off for attendees!\n\n👉 Spots are LIMITED. Click the link to register now →\n${registrationUrl}\n\n❤️ Love this? Tag someone who'd benefit from joining! 🙏\n\n#Webinar #FreeWebinar #${webinar.industry.replace(/\s+/g, '')} #LearnLive #FacebookLive #BusinessTips #CareerDevelopment #OnlineEvent`,
      hashtags: ["FreeWebinar", "LiveWebinar", `${webinar.industry.replace(/\s+/g, '')}Tips`, "FacebookEvent", "OnlineLearning", "BusinessGrowth", "CareerDevelopment", "OnlineEvent", "WorkSmarter", "SkillBuilding"],
      ctaText: "Get Your Free Ticket",
      ctaUrl: registrationUrl,
      eventDetails: { coverPhoto: "#", location: "Online", category: "Education · Online Event" },
    },
    instagram: {
      imageSize: "1080x1080",
      storySize: "1080x1920",
      caption: `🔥 WEBINAR DROP 🔥\n\n${webinar.title}\n\n📅 ${dateStr} · ${timeStr}\n📍 Your screen, anywhere\n💸 FREE (but PRICELESS value)\n\nSave this post ✅ Tag your team 👥 Drop a 🔥 if you're IN\n\nHere's the tea 👇\nWe're pulling back the curtain on what's ACTUALLY working in ${webinar.industry} right now. Not theory. Not fluff. Just proven frameworks from people who DO this every day.\n\n🎁 Bonus for LIVE attendees only:\n→ 30-day free trial (no CC)\n→ 20% off 3 months ($2,600 value)\n→ Full resource pack\n\nLink in bio to claim your spot → 💻\n\n#${webinar.industry.replace(/\s+/g, '')} #Webinar #FreeWebinar #OnlineEvent #LearnOnInstagram #BusinessTips #CareerTips #GrowthHacks #SkillShare #IGWebinar`,
      hashtags: [`${webinar.industry.replace(/\s+/g, '')}Webinar`, "FreeWebinar", "OnlineLearning", "IGLive", "InstagramLive", "BusinessGrowth", "CareerTips", "SkillBuilding", "PersonalDevelopment", "WorkSmarterNotHarder"],
      ctaText: "Link in Bio → Register Free",
      ctaUrl: registrationUrl,
      storyFrames: [
        { frame: 1, template: "headline", content: webinar.title, sticker: "link-sticker" },
        { frame: 2, template: "details", content: `${dateStr} · ${timeStr}\n${webinar.timezone}\nFree Registration` },
        { frame: 3, template: "countdown", content: "Spots filling fast!" },
        { frame: 4, template: "cta", content: "Swipe up to save your seat", sticker: "link" },
      ],
      reels: { hook: "Stop scrolling — this webinar will change how you work.", duration: "60s", script: ["Hook: 3s (bold headline)", "Problem: 10s", "Teaser: 20s (clip from demo)", "Social Proof: 10s", "CTA: 17s (register link in bio)"] },
    },
    x: {
      imageSize: "1200x675",
      caption: `🚨 WEBINAR ALERT: ${webinar.title}\n\n📅 ${dateStr} · ${timeStr} ${webinar.timezone}\n👥 ${webinar.targetAudience} in ${webinar.industry}\n⏱️ ${webinar.durationMinutes} min · FREE\n\nYou'll get:\n• Live ${webinar.meetingPlatform} demo\n• $2.4M customer case study\n• Benchmark polls\n• ${webinar.speakers?.length || 2} experts Q&A\n• 30-day FREE trial + 20% OFF (attendees only)\n\n🔗 Register: ${registrationUrl}\n\n${[...Array(3)].map(() => '#').join('')}${webinar.industry.replace(/\s+/g, '')} #Webinar #FreeEvent`,
      hashtags: [`${webinar.industry.replace(/\s+/g, '')}`, "Webinar", "LiveEvent", "FreeWebinar", "TechTwitter", "BizTwitter", "Learning", "OnlineEvent"],
      ctaText: "Register Now",
      ctaUrl: registrationUrl,
      thread: [
        { tweet: 1, text: `🧵 Thread: 5 reasons you CAN'T miss our ${dateStr} webinar on "${webinar.title}" 👇\n\nIf you're in ${webinar.industry}, this is non-negotiable.` },
        { tweet: 2, text: "1️⃣ The trends we're covering aren't in any blog post yet.\n\nWe paid $50K for the research. You're getting it for FREE.\n\nWhich ones? The ones moving the needle RIGHT NOW for 500+ teams." },
        { tweet: 3, text: "2️⃣ Live demo = REAL customer scenarios.\n\nNot the scripted, 'everything works perfectly' demo.\n\nWe're pulling from actual support tickets, real edge cases, true implementation horror stories. Raw. Real. Useful." },
        { tweet: 4, text: "3️⃣ Benchmarking.\n\n3 live polls. You see how your team stacks up against 600+ peers in real-time.\n\nThis alone is worth 10x the price of admission (which is $0, by the way)." },
        { tweet: 5, text: "4️⃣ The offer.\n\n30-day free trial + 20% off your first 3 months.\n\nOn the Professional tier, that's $2,600 in YOUR pocket.\n\nOnly for attendees. Expires 48 hours post-webinar.\n\nRegister → " + registrationUrl },
        { tweet: 6, text: "5️⃣ Q&A with ${webinar.speakers?.length || 2} people who've DONE this.\n\nNot marketing people. Actual operators.\n\nThey're taking 20 MINUTES of raw, unfiltered questions.\n\nNothing is off-limits." },
        { tweet: 7, text: "The catch?\n\nOnly ${webinar.maxAttendees} live spots.\n\nLast time: Sold out 3 days early. 1,200+ people waitlisted.\n\nDon't be waitlisted.\n\nRegister NOW:\n${registrationUrl}\n\nRT for your network 🙏" },
      ],
    },
    threads: {
      imageSize: "1080x1080",
      caption: `New webinar drop 👀\n\n"${webinar.title}"\n\n📅 ${dateStr} · ${timeStr}\n🎯 For: ${webinar.targetAudience}\n🏢 Industry: ${webinar.industry}\n💰 Cost: $0\n\nHere's everything you need to know 🧵👇\n\n---\n\nLive demo: We're not just talking about it. We're showing it. Real workflows, real data, real outcomes.\n\nLive polls: See how your team compares to hundreds of peers in real time. Spoiler: The results are always interesting.\n\nLive Q&A: 20 minutes. ${webinar.speakers?.length || 2} experts. No pre-screened questions. Ask us anything.\n\nLIVE-ONLY OFFER: 30-day free trial + 20% off your first 3 months. Value: $2,600. Expires 48 hours post-webinar.\n\nRegistration takes 30 seconds. Link in bio.\n\nTag a teammate who needs to be there 👇`,
      hashtags: [`${webinar.industry.replace(/\s+/g, '')}`, "Webinar", "ThreadsEvent", "OnlineLearning", "BusinessGrowth", "Career", "WorkLife", "SkillBuilding"],
      ctaText: "Link in Bio · Register Free",
      ctaUrl: registrationUrl,
    },
    whatsapp: {
      imageSize: "1080x1440",
      caption: `🔥 *FREE LIVE WEBINAR — Limited Spots!*\n\n📌 *${webinar.title}*\n\n📅 *Date:* ${dateStr}\n⏰ *Time:* ${timeStr} ${webinar.timezone}\n📍 *Platform:* ${webinar.meetingPlatform}\n⏱️ *Duration:* ${webinar.durationMinutes} min\n\n👤 *For:* ${webinar.targetAudience} in ${webinar.industry}\n\n✅ *What you get:*\n• Live platform demo\n• Benchmark polls (see where you rank)\n• Real case study ($2.4M savings)\n• Live Q&A with ${webinar.speakers?.length || 2} experts\n• 🎁 *EXCLUSIVE:* 30-day free trial + 20% off (only for attendees!)\n\n🔗 *Register here (FREE):* ${registrationUrl}\n\n⏳ Only ${webinar.maxAttendees} seats! Last session sold out EARLY.\n\n👉 Forward this to your team — everyone benefits!`,
      hashtags: [],
      ctaText: "Register FREE",
      ctaUrl: registrationUrl,
      isWhatsAppFormat: true,
      broadcastLists: ["Customers", "Leads", "Partners"],
    },
    telegram: {
      imageSize: "1200x675",
      caption: `⚡ [FREE WEBINAR] ${webinar.title}\n\n📅 ${dateStr} · ${timeStr} ${webinar.timezone}\n👥 Target: ${webinar.targetAudience}\n🏢 Industry: ${webinar.industry}\n⏱️ ${webinar.durationMinutes} min · ${webinar.meetingPlatform}\n\n🔥 *Why join:*\n\n1️⃣ Live demo — real scenarios, not slides\n2️⃣ Benchmark polls — compare vs 600+ peers\n3️⃣ Case study — $2.4M customer savings deep dive\n4️⃣ 20-min raw Q&A with ${webinar.speakers?.length || 2} experts\n5️⃣ 🎁 *Attendees-only offer:* 30-day FREE trial + 20% OFF (value $2,600)\n\n🚨 Capacity: ${webinar.maxAttendees} live viewers only\n\n🔗 Register now (FREE, 30 sec):\n${registrationUrl}\n\n#Webinar #FreeEvent #${webinar.industry.replace(/\s+/g, '')} #OnlineLearning #TelegramEvent`,
      hashtags: ["Webinar", "FreeEvent", `${webinar.industry.replace(/\s+/g, '')}`, "OnlineLearning", "TelegramCommunity", "LiveEvent"],
      ctaText: "Register — It's Free",
      ctaUrl: registrationUrl,
      channel: { pinMessage: true, notifySubscribers: true },
    },
    youtube: {
      imageSize: "1280x720",
      thumbnailText: `${webinar.title} | ${dateStr} | FREE Live Webinar`,
      caption: `📹 [LIVE WEBINAR] ${webinar.title}\n\n🔔 SUBSCRIBE and hit the notification bell so you don't miss it!\n\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr} ${webinar.timezone}\n⏱️ Duration: ${webinar.durationMinutes} minutes\n📍 Where: RIGHT HERE on YouTube Live!\n\n━━━━━━━━━━━━━━━━━━━━━━\n📝 CHAPTERS (Timestamps):\n00:00 Welcome & Introductions\n05:00 The Current ${webinar.industry} Landscape\n15:00 Research Insights & Data\n30:00 LIVE DEMO: Platform Walkthrough\n50:00 Customer Case Study — $2.4M in Savings\n01:00:00 LIVE Q&A (Ask us ANYTHING)\n01:15:00 Exclusive Offer & Next Steps\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🎯 Who should watch:\n• ${webinar.targetAudience}\n• Professionals in ${webinar.industry}\n• Anyone responsible for strategy, operations, or growth\n\n🎁 WHAT YOU'LL LEARN:\n✅ 3 underused trends you can act on THIS quarter\n✅ Live benchmarking — see how you compare\n✅ Real implementation frameworks you can copy\n✅ Exclusive OFFER for LIVE viewers: 30-day FREE trial + 20% off your first 3 months (valued at $2,600)\n\n━━━━━━━━━━━━━━━━━━━━━━\n🔗 RESOURCES MENTIONED:\n• Register for the LIVE experience (polls + Q&A): ${registrationUrl}\n• Resource Pack + ROI Calculator: (link in pinned comment post-webinar)\n• Connect with speakers on LinkedIn: (links in description post-webinar)\n\n━━━━━━━━━━━━━━━━━━━━━━\n💬 QUESTIONS?\nDrop them in the chat during the live stream! We'll answer as many as we can. If we don't get to yours live, we'll respond in the comments within 24 hours.\n\n━━━━━━━━━━━━━━━━━━━━━━\n#${webinar.industry.replace(/\s+/g, '')} #Webinar #LiveWebinar #YouTubeLive #FreeWebinar #BusinessGrowth #Innovation #Tech #CareerDevelopment #OnlineLearning #YouTubeEvent`,
      hashtags: [`${webinar.industry.replace(/\s+/g, '')}Webinar`, "LiveWebinar", "YouTubeLive", "FreeWebinar", "BusinessWebinar", "Innovation", "TechTrends", "CareerDevelopment", "OnlineLearning", "YouTubeEvent"],
      ctaText: "Set Reminder + Register for LIVE Access",
      ctaUrl: registrationUrl,
      liveStream: { scheduledStartTime: webinar.startDateTime, enableChat: true, enableLiveChatReplay: true, category: "Education" },
      videoSeo: { tags: [webinar.title, webinar.industry, webinar.topic, "free webinar", "live webinar", "online learning", "business growth", "professional development"], category: "Education", privacyStatus: "public" },
    },
    email: {
      imageSize: "600x300",
      caption: `📬 NEWSLETTER EXCLUSIVE: Your Priority Registration Access\n\n${webinar.title}\n\n${webinar.objective}\n\n📅 ${new Date(webinar.startDateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n⏰ ${new Date(webinar.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ${webinar.timezone}\n⏱️ ${webinar.durationMinutes} Minutes · ${webinar.meetingPlatform.toUpperCase()}\n\n🎟️ YOUR PRIORITY ACCESS: Skip the general registration queue and secure your spot before we announce to the public.\n\nFEATURING:\n${webinar.speakers?.map(s => `→ ${s.name}, ${s.title} — ${s.organization}`).join('\n') || '→ Industry Expert Panel'}\n\n🎁 PRIORITY BENEFITS:\n• Guaranteed spot even if we sell out (you're in first!)\n• Early access to resource pack (24 hours pre-webinar)\n• Priority in Q&A queue\n• BONUS: 3 extra days on your free trial (33 days total!)\n\n━━━━━━━━━━━━━━━━━━\n👉 CLAIM YOUR PRIORITY SPOT NOW:\n${registrationUrl}\n━━━━━━━━━━━━━━━━━━\n\nForward this email to your team — they can use the same priority link too!\n\nUnsubscribe: #   Privacy: #`,
      hashtags: [],
      ctaText: "Claim My Priority Spot",
      ctaUrl: registrationUrl,
      subject: `🚨 Priority Access: ${webinar.title} — [Subscriber Exclusive]`,
      preheader: "Skip the line: Your guaranteed spot + bonus 3 extra days on your trial. Before public announcement.",
      audienceSegments: ["Subscribers", "Newsletter Members", "Past Attendees"],
    },
  };

  const config = configs[platformKey];
  const platform = PROMO_PLATFORMS.find(p => p.key === platformKey)!.platform;

  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    webinarId: webinar.id,
    platform,
    platformName: PROMO_PLATFORMS.find(p => p.key === platformKey)!.name,
    caption: config.caption,
    hashtags: config.hashtags,
    imageUrl: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`Professional webinar promotional banner for ${webinar.title}, ${webinar.industry} industry, clean modern design, text overlay ready, high quality`)}&image_size=square_hd`,
    imageSize: config.imageSize,
    storySize: config.storySize,
    thumbnailText: config.thumbnailText,
    ctaText: config.ctaText,
    ctaUrl: config.ctaUrl,
    registrationUrl,
    carousels: config.carousels,
    storyFrames: config.storyFrames,
    reels: config.reels,
    thread: config.thread,
    eventDetails: config.eventDetails,
    broadcastLists: config.broadcastLists,
    channel: config.channel,
    liveStream: config.liveStream,
    videoSeo: config.videoSeo,
    subject: config.subject,
    preheader: config.preheader,
    audienceSegments: config.audienceSegments,
  };
}

const CONTENT_GENERATORS: Record<string, (w: Webinar) => any> = {
  agenda: generateAgenda,
  slides: generateSlides,
  speaker_notes: generateSpeakerNotes,
  faqs: generateFAQs,
  landing_page: generateLandingPage,
  registration_page: generateRegistrationPage,
  email_invitation: generateEmailInvitation,
  reminder_email: generateReminderEmail,
  thank_you_email: generateThankYouEmail,
  follow_up_email: generateFollowUpEmail,
};

PROMO_PLATFORMS.forEach(p => {
  CONTENT_GENERATORS[`promo_${p.key}`] = (w: Webinar) => generateSocialPromo(w, p.key);
});

const PROMO_PREFIX = "promo_";

function isValidContentType(type: string): boolean {
  if (CONTENT_GENERATORS[type]) return true;
  if (type.startsWith(PROMO_PREFIX)) {
    const platform = type.slice(PROMO_PREFIX.length);
    return PROMO_PLATFORMS.some(p => p.key === platform);
  }
  return false;
}

function resolveContentType(type: string): string {
  if (CONTENT_GENERATORS[type]) return type;
  if (type.startsWith(PROMO_PREFIX)) {
    const platform = type.slice(PROMO_PREFIX.length);
    if (PROMO_PLATFORMS.some(p => p.key === platform)) return type;
  }
  throw new Error(`Unsupported content type: ${type}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { webinarId } = params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "Webinar ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { contentTypes } = body;
    if (!contentTypes || !Array.isArray(contentTypes) || contentTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "contentTypes (non-empty array) is required in body" },
        { status: 400 }
      );
    }

    const invalidTypes = contentTypes.filter((t: any) => typeof t !== "string" || !isValidContentType(t));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid or unsupported content types: ${invalidTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const webinarSnap = await db.collection("webinars").doc(webinarId).get();
    let webinar: Webinar | null = null;
    if (webinarSnap.exists) {
      webinar = { id: webinarSnap.id, ...webinarSnap.data() } as Webinar;
    } else {
      webinar = {
        id: webinarId,
        customerId: user.id,
        customerName: user.name,
        title: "Mastering Modern Strategies",
        objective: "Learn proven frameworks to accelerate growth and efficiency",
        topic: "Growth Strategies",
        description: "A comprehensive deep dive into modern strategies used by industry leaders.",
        targetAudience: "B2B decision-makers, department heads, and team leads",
        industry: "SaaS / Technology",
        startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        timezone: "America/New_York",
        durationMinutes: 90,
        language: "English",
        hostType: "hybrid",
        speakers: [
          { id: "sp1", name: "Alex Thompson", title: "Chief Strategy Officer", organization: "InnovateCorp", bio: "20+ years driving transformation in enterprise SaaS.", isAIBot: false },
          { id: "sp2", name: "Jordan Lee", title: "VP of Customer Success", organization: "ScaleUp Global", bio: "Helped 300+ teams adopt modern platforms successfully.", isAIBot: false },
        ],
        meetingPlatform: "zoom",
        privacy: "public",
        maxAttendees: 500,
        enableWaitlist: true,
        allowRecording: true,
        branding: { primaryColor: "#2563eb", secondaryColor: "#1e40af", accentColor: "#3b82f6", fontFamily: "Inter" },
        registrationFields: [
          { id: "f1", name: "firstName", label: "First Name", type: "text", required: true },
          { id: "f2", name: "lastName", label: "Last Name", type: "text", required: true },
          { id: "f3", name: "email", label: "Email", type: "email", required: true },
          { id: "f4", name: "company", label: "Company", type: "text", required: true },
        ],
        requireApproval: false,
        agenda: [],
        qaSettings: { enabled: true, allowAnonymous: true, enableUpvoting: true, moderationRequired: false, autoAnswerWithRAG: true },
        pollIds: [],
        surveyIds: [],
        resources: [],
        reminderScheduleIds: [],
        generatedContentIds: [],
        socialPostIds: [],
        status: "draft",
        stats: { registeredCount: 0, confirmedCount: 0, attendedCount: 0, noShowCount: 0, waitlistCount: 0, cancelledCount: 0 },
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessRoles: ["admin", "agent", "customer"],
      };
    }

    if (user.role === "customer" && webinar.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only generate content for your own webinars" },
        { status: 403 }
      );
    }

    const uniqueTypes = [...new Set(contentTypes)];
    const generatedContent: GeneratedContent[] = [];
    const now = new Date().toISOString();

    for (const rawType of uniqueTypes) {
      const resolvedType = resolveContentType(rawType);
      let generator = CONTENT_GENERATORS[resolvedType];

      if (!generator && rawType.startsWith(PROMO_PREFIX)) {
        const platform = rawType.slice(PROMO_PREFIX.length) as PromoPlatformKey;
        generator = (w: Webinar) => generateSocialPromo(w, platform);
      }

      if (!generator) continue;

      const content = generator(webinar);
      const id = generateId();

      const record: GeneratedContent = {
        id,
        webinarId,
        contentType: resolvedType as GeneratedContent["contentType"],
        content,
        status: "ready",
        createdAt: now,
        updatedAt: now,
        metadata: {
          generatedBy: user.id,
          generatedByName: user.name,
          generatedByRole: user.role,
          contentVersion: "1.0",
        },
      };

      try {
        await db.collection("generated_content").doc(id).set(record);
      } catch (writeErr: any) {
        logger.error(`Failed to persist generated_content ${id}:`, writeErr);
      }
      generatedContent.push(record);
    }

    try {
      const existingIds: string[] = (webinar as any).generatedContentIds || [];
      const merged = Array.from(new Set([...existingIds, ...generatedContent.map(g => g.id)]));
      await db.collection("webinars").doc(webinarId).set(
        { generatedContentIds: merged, updatedAt: now },
        { merge: true }
      );
    } catch (mergeErr) {
      logger.warn("Could not update webinar.generatedContentIds", mergeErr);
    }

    try {
      await logAuditEvent(
        request,
        user.id,
        "webinar_generated_content",
        { webinarId, count: generatedContent.length, types: generatedContent.map(g => g.contentType), role: user.role }
      );
      addAuditLog(
        user.email,
        user.role,
        true,
        `Generated ${generatedContent.length} content items for webinar ${webinarId}: ${generatedContent.map(g => g.contentType).join(", ")}`,
        getClientIp(request),
        getUserAgent(request)
      );
    } catch (_audit) {}

    return NextResponse.json(
      { success: true, generatedContent },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error("[api-portal-webinars-generate-content]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
