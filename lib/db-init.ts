import { db, markFirestoreQuotaExhausted } from "./firebase-admin";

import bcrypt from "bcrypt";

// Default passwords for seed accounts
const DEV_PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || "Pranee@1909",
  admin1: process.env.ADMIN1_PASSWORD || "Pranee@1909",
  praneethAgent: process.env.AGENT_PRANEETH_PASSWORD || "Praneeth123!",
  ashokAgent: process.env.AGENT_ASHOK_PASSWORD || "AgentAshok456!",
  demoCustomer: process.env.CUSTOMER_DEMO_PASSWORD || "CustomerDemo123!",
  praneethCustomer: process.env.CUSTOMER_PRANEETH_PASSWORD || "Praneeth@123",
};

let isSeeded = false;

export async function seedFirestore() {
  if (isSeeded) {
    return;
  }

  if (!db) {
    console.log("[db-init] Firestore not configured. Skipping seeding.");
    return;
  }

  isSeeded = true;

  try {
    // 1. Seed users collection
    console.log("[db-init] Checking and seeding default users...");
    const defaultUsers = [
      {
        id: "admin-1",
        email: "admin1@dealflow.ai",
        name: "Administrator",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin1, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "admin-2",
        email: "admin@dealflow.ai",
        name: "Admin One",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "agent-praneeth",
        email: "praneeth@dealflow.ai",
        name: "Praneeth",
        role: "agent",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.praneethAgent, 10),
        phoneNumber: "+15550100007",
        countryCode: "US",
        callConversationFramework: "Core Objectives:\n- Assess ICP alignment\n- Review revenue operations inefficiencies",
        whatsAppMessageParameters: "Tone: Authoritative, strategic.",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "agent-ashok",
        email: "agent.ashok@dealflow.ai",
        name: "Ashok Agent",
        role: "agent",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.ashokAgent, 10),
        phoneNumber: "+15550100001",
        countryCode: "US",
        callConversationFramework: "Core Objectives:\n- Introduce DealFlow AI\n- Pitch pipeline optimization benefits",
        whatsAppMessageParameters: "Tone: Professional, direct.",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "customer-demo",
        email: "demo@customer.com",
        name: "Demo Customer",
        role: "customer",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.demoCustomer, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "customer-praneeth",
        email: "praneethburada@gmail.com",
        name: "Praneeth Burada",
        role: "customer",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.praneethCustomer, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    for (const u of defaultUsers) {
      const docRef = db.collection("users").doc(u.id);
      const docSnap = await docRef.get();
      // Write user if missing OR if they have corrupted field values
      if (!docSnap || !docSnap.exists || !docSnap.data()?.email) {

        await docRef.set({
          ...u,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        });
        console.log(`[db-init] Seeded default user ${u.email} successfully.`);
      } else if (u.role === "admin") {
        await docRef.set({
          hashedPassword: u.hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        }, { merge: true });
        console.log(`[db-init] Updated admin password for ${u.email}`);
      }
    }
    console.log("[db-init] Default users validation complete.");

    // 2. Seed customers collection
    const customersSnap = await db.collection("customers").limit(1).get().catch(() => null);
    if (customersSnap?.empty) {
      console.log("[db-init] Seeding customers collection...");
      const defaultCustomers = [
        {
          id: "customer-demo",
          name: "Demo Customer",
          email: "demo@customer.com",
          phone: "+1-555-019-9999",
          companyName: "Acme Corp",
          industry: "Technology",
          status: "active",
          assignedAgentId: "agent-praneeth",
          assignedAgentName: "Praneeth",
          serviceConfigurations: {
            gtmReports: true,
            leadScoring: true,
            aiCalls: true,
            wrenChatbot: true,
            automatedGtmAnalysis: true,
            playbookGeneration: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          businessModel: "b2b",
        },
        {
          id: "customer-praneeth",
          name: "Praneeth Burada",
          email: "praneethburada@gmail.com",
          phone: "+1-555-987-6543",
          companyName: "TechStartup Premium Goods",
          industry: "Technology",
          status: "active",
          assignedAgentId: "agent-praneeth",
          assignedAgentName: "Praneeth",
          serviceConfigurations: {
            gtmReports: true,
            leadScoring: true,
            aiCalls: false,
            wrenChatbot: true,
            automatedGtmAnalysis: true,
            playbookGeneration: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          businessModel: "d2c",
        },
      ];

      for (const c of defaultCustomers) {
        await db.collection("customers").doc(c.id).set(c);
      }
      console.log("[db-init] Seeded customers collection successfully.");
    }

    // 3. Seed tasks collection
    const tasksSnap = await db.collection("tasks").limit(1).get().catch(() => null);
    if (tasksSnap?.empty) {
      console.log("[db-init] Seeding tasks collection...");
      const defaultTasks = [
        {
          id: "task-1",
          title: "Follow up with Demo Customer",
          description: "Contact Demo Customer to discuss GTM strategy",
          status: "in-progress",
          assignedAgentId: "agent-praneeth",
          customerId: "customer-demo",
          priority: "high",
          progressNotes: ["Initial contact made", "Schedule meeting for next week"],
          milestones: [
            { id: "m1", title: "Initial outreach", completed: true, completedAt: "2026-05-10T09:30:00Z" },
            { id: "m2", title: "Needs assessment", completed: false },
            { id: "m3", title: "Proposal sent", completed: false },
          ],
          createdAt: "2026-05-10T09:00:00Z",
          updatedAt: "2026-05-20T14:30:00Z",
        },
        {
          id: "task-3",
          title: "Collect customer feedback",
          description: "Get feedback from Demo Customer on initial meeting",
          status: "completed",
          assignedAgentId: "agent-praneeth",
          customerId: "customer-demo",
          priority: "low",
          progressNotes: ["Feedback collected", "Analysis complete"],
          milestones: [
            { id: "m1", title: "Send survey", completed: true, completedAt: "2026-05-18T10:00:00Z" },
            { id: "m2", title: "Analyze results", completed: true, completedAt: "2026-05-19T15:00:00Z" },
          ],
          createdAt: "2026-05-17T09:00:00Z",
          updatedAt: "2026-05-19T15:00:00Z",
        },
      ];

      for (const t of defaultTasks) {
        await db.collection("tasks").doc(t.id).set(t);
      }
      console.log("[db-init] Seeded tasks collection successfully.");
    }

    // 4. Seed documents collection
    const docsSnap = await db.collection("documents").limit(1).get().catch(() => null);
    if (docsSnap?.empty) {
      console.log("[db-init] Seeding documents collection...");
      const defaultDocs = [
        {
          id: "doc-1",
          customerId: "customer-demo",
          documentType: "icp",
          title: "Demo Corp ICP Profile",
          description: "Ideal Customer Profile for Demo Corp",
          icpId: "icp-demo-1",
          createdBy: "admin-1",
          createdAt: "2026-03-15T00:00:00Z",
          updatedAt: "2026-03-15T00:00:00Z",
          accessRoles: ["admin", "agent", "customer"],
          name: "Enterprise Segment ICP Profile.pdf",
          type: "pdf",
          size: "2.8 MB",
          version: "1.1",
          updateNotes: "Updated target geographies and CRM tool parameters.",
          isNew: true,
        },
        {
          id: "doc-3",
          customerId: "customer-demo",
          documentType: "onboarding",
          title: "Demo Corp Onboarding Guide",
          description: "Complete onboarding documentation",
          createdBy: "agent-praneeth",
          createdAt: "2026-03-12T00:00:00Z",
          updatedAt: "2026-03-12T00:00:00Z",
          accessRoles: ["admin", "agent", "customer"],
          name: "Demo Corp Onboarding Guide.pdf",
          type: "pdf",
          size: "2.5 MB",
          version: "1.0",
          updateNotes: "Initial publication.",
          isNew: false,
        },
      ];

      for (const d of defaultDocs) {
        await db.collection("documents").doc(d.id).set(d);
      }
      console.log("[db-init] Seeded documents collection successfully.");
    }

    // 5. Seed gtm_reports collection
    const reportsSnap = await db.collection("gtm_reports").limit(1).get().catch(() => null);
    if (reportsSnap?.empty) {
      console.log("[db-init] Seeding gtm_reports collection...");
      const defaultReports = [
        {
          id: "gtm-1",
          customerId: "customer-demo",
          reportName: "North America Expansion Blueprint",
          category: "Market Expansion",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const r of defaultReports) {
        await db.collection("gtm_reports").doc(r.id).set(r);
      }
      console.log("[db-init] Seeded gtm_reports collection successfully.");
    }

    // 6. Seed requirements collection
    const reqsSnap = await db.collection("requirements").limit(1).get().catch(() => null);
    if (reqsSnap?.empty) {
      console.log("[db-init] Seeding requirements collection...");
      const defaultReqs = [
        {
          id: "req-1",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          requesterName: "Demo Customer",
          requesterEmail: "demo@customer.com",
          category: "Technical Support",
          description: "Integration errors with HubSpot CRM synchronization",
          priority: "High",
          status: "In Progress",
          assignedAgentId: "agent-praneeth",
          assignedAgentName: "Praneeth",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const r of defaultReqs) {
        await db.collection("requirements").doc(r.id).set(r);
      }
      console.log("[db-init] Seeded requirements collection successfully.");
    }

    // 7. Seed resignations collection
    const resignationsSnap = await db.collection("resignations").limit(1).get().catch(() => null);
    if (resignationsSnap?.empty) {
      console.log("[db-init] Seeding resignations collection...");
      const defaultResignations = [
        {
          id: "resign-1",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          requestDate: "2026-06-05T00:00:00Z",
          effectiveDate: "2026-07-10T00:00:00Z",
          terminationReason: "Pricing model changes",
          notes: "Seeking lower entry point for smaller projects.",
          documentsArchived: true,
          accountClosed: false,
          processedBy: "admin-1",
          processedAt: new Date().toISOString(),
        },
      ];

      for (const r of defaultResignations) {
        await db.collection("resignations").doc(r.id).set(r);
      }
      console.log("[db-init] Seeded resignations collection successfully.");
    }

    // 8. Seed tickets collection
    const ticketsSnap = await db.collection("tickets").limit(1).get().catch(() => null);
    if (ticketsSnap?.empty) {
      console.log("[db-init] Seeding tickets collection...");
      const defaultTickets = [
        {
          id: "ticket-1",
          customerId: "customer-demo",
          requesterName: "Demo Customer",
          requesterEmail: "demo@customer.com",
          category: "Technical Support",
          subject: "HubSpot CRM integration failing",
          description: "Auth token keeps expiring every hour instead of 24h.",
          priority: "high",
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const t of defaultTickets) {
        await db.collection("tickets").doc(t.id).set(t);
      }
      console.log("[db-init] Seeded tickets collection successfully.");
    }

    // 9. Seed calls collection
    const callsSnap = await db.collection("calls").limit(1).get().catch(() => null);
    if (callsSnap?.empty) {
      console.log("[db-init] Seeding calls collection...");
      const defaultCalls = [
        {
          id: "call-1",
          sessionId: "session-1",
          callerId: "agent-praneeth",
          callerName: "Praneeth",
          callerRole: "agent",
          receiverId: "customer-demo",
          receiverName: "Demo Customer",
          receiverRole: "customer",
          status: "completed",
          duration: 960,
          startedAt: "2026-06-20T11:00:00Z",
          endedAt: "2026-06-20T11:16:00Z",
        },
      ];

      for (const c of defaultCalls) {
        await db.collection("calls").doc(c.id).set(c);
      }
      console.log("[db-init] Seeded calls collection successfully.");
    }

    // 10. Seed feedback collection
    const feedbackSnap = await db.collection("feedback").limit(1).get().catch(() => null);
    if (feedbackSnap?.empty) {
      console.log("[db-init] Seeding feedback collection...");
      const defaultFeedback = [
        {
          id: "fb-1",
          sessionId: "session-1",
          agentId: "agent-praneeth",
          customerId: "customer-demo",
          rating: 5,
          comment: "Excellent service! Very helpful.",
          createdAt: new Date().toISOString(),
        },
      ];

      for (const f of defaultFeedback) {
        await db.collection("feedback").doc(f.id).set(f);
      }
      console.log("[db-init] Seeded feedback collection successfully.");
    }

    // 11. Seed chat messages collection
    const chatSnap = await db.collection("chat_messages").limit(1).get().catch(() => null);
    if (chatSnap?.empty) {
      console.log("[db-init] Seeding chat_messages collection...");
      const defaultMessages = [
        {
          id: "msg-1",
          sessionId: "session-1",
          senderId: "customer-demo",
          senderName: "Demo Customer",
          senderRole: "customer",
          content: "Hi, I'd like to discuss my GTM strategy.",
          timestamp: "2026-06-20T10:00:00Z",
          read: true,
        },
        {
          id: "msg-2",
          sessionId: "session-1",
          senderId: "agent-praneeth",
          senderName: "Praneeth",
          senderRole: "agent",
          content: "Great! Let's schedule a call this week. Here's the GTM analysis report for reference.",
          timestamp: "2026-06-20T10:15:00Z",
          read: true,
          attachments: [
            {
              id: "file-1",
              fileName: "GTM_Analysis_Report.pdf",
              fileSize: 1234567,
              fileType: "application/pdf",
              url: "#",
              uploadedAt: "2026-06-20T10:14:00Z",
              uploadedBy: "agent-praneeth",
            },
          ],
        },
      ];

      for (const m of defaultMessages) {
        await db.collection("chat_messages").doc(m.id).set(m);
      }
      console.log("[db-init] Seeded chat_messages collection successfully.");
    }

    // 12. Seed content_assets collection
    const contentSnap = await db.collection("content_assets").limit(1).get().catch(() => null);
    if (contentSnap?.empty) {
      console.log("[db-init] Seeding content_assets collection...");
      
      const tacticsList = [
        "Blog Posts",
        "SEO Landing Pages",
        "Case Studies",
        "Customer Testimonials",
        "Product Demo Videos",
        "Explainer Videos",
        "Webinars",
        "LinkedIn Marketing",
        "Instagram/Facebook Marketing",
        "YouTube Content",
        "Email Automation",
        "Google Ads",
        "Meta Ads",
        "LinkedIn Ads",
        "Retargeting Ads",
        "Cold Email",
        "Referral Programs",
        "Affiliate Marketing",
        "Community Building",
        "Customer Reviews",
        "Interactive Tools (ROI Calculator, Quiz)",
        "AI Content Repurposing",
        "AI Personalization",
        "Product Tours",
        "Industry Reports & Research"
      ];

      const defaultContentAssets = [
        {
          id: "asset-1",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "Scaling B2B Revenue Operations in 2026",
          tactic: "Blog Posts",
          status: "published",
          content: "In 2026, scaling revenue operations requires alignment across sales, marketing, and customer success. By automating pipeline synchronization and using AI-assisted outbound dialing, teams can recover up to 15 hours per week of lost administrative time. This guide breaks down the core objectives: 1. Audit your tech stack to remove duplicate entries. 2. Establish clear data handoffs between systems. 3. Monitor data quality metrics in real-time.",
          versions: [
            {
              version: 1,
              title: "SaaS Scaling Strategies in 2026",
              content: "Scaling revenue operations is crucial. Use AI to automate pipeline sync. Audit your CRM data regularly.",
              updatedAt: "2026-06-01T09:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            },
            {
              version: 2,
              title: "Scaling B2B Revenue Operations in 2026",
              content: "In 2026, scaling revenue operations requires alignment across sales, marketing, and customer success. By automating pipeline synchronization and using AI-assisted outbound dialing, teams can recover up to 15 hours per week of lost administrative time. This guide breaks down the core objectives: 1. Audit your tech stack to remove duplicate entries. 2. Establish clear data handoffs between systems. 3. Monitor data quality metrics in real-time.",
              updatedAt: "2026-06-05T14:30:00Z",
              updatedBy: "customer-demo",
              updatedByRole: "customer"
            }
          ],
          comments: [
            {
              id: "comm-1",
              comment: "Looks excellent! I updated the title to specify 'B2B Revenue Operations'. Please review.",
              authorName: "Demo Customer",
              authorRole: "customer",
              createdAt: "2026-06-05T14:30:00Z"
            }
          ],
          performanceMetrics: { views: 1450, clicks: 390, conversions: 28, conversionRate: 1.93, roi: 185 },
          publishedPlatforms: ["WordPress", "LinkedIn"],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-01T09:00:00Z" },
            { action: "updated", details: "Draft updated to version 2 by Demo Customer", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-05T14:30:00Z" },
            { action: "approved", details: "Asset approved by Demo Customer", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-06T10:00:00Z" },
            { action: "published", details: "Published to WordPress & LinkedIn", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-06T10:15:00Z" }
          ],
          createdAt: "2026-06-01T09:00:00Z",
          updatedAt: "2026-06-06T10:15:00Z"
        },
        {
          id: "asset-2",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "Ideal Customer Profile (ICP) Analysis & Setup",
          tactic: "SEO Landing Pages",
          status: "published",
          content: "Find and lock down your high-value enterprise accounts. This interactive landing page walks you through identifying firmographic markers, matching technology stacks, and finding key decision-makers (VP Sales, VP RevOps, CTO). Scale your outbound pipeline with structured, clean lead entries.",
          versions: [
            {
              version: 1,
              title: "Ideal Customer Profile (ICP) Analysis & Setup",
              content: "Find and lock down your high-value enterprise accounts. This interactive landing page walks you through identifying firmographic markers, matching technology stacks, and finding key decision-makers (VP Sales, VP RevOps, CTO). Scale your outbound pipeline with structured, clean lead entries.",
              updatedAt: "2026-06-10T10:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 2800, clicks: 640, conversions: 55, conversionRate: 1.96 },
          publishedPlatforms: ["Webflow"],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-10T10:00:00Z" },
            { action: "published", details: "Published to Webflow", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-12T11:00:00Z" }
          ],
          createdAt: "2026-06-10T10:00:00Z",
          updatedAt: "2026-06-12T11:00:00Z"
        },
        {
          id: "asset-3",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "How Acme Corp Accelerated Deal Flow by 250%",
          tactic: "Case Studies",
          status: "approved",
          content: "Learn how manufacturing giant Acme Corp integrated DealFlow AI into their legacy Salesforce setup. In less than 30 days, they eliminated duplicate entries, established automated phone dialing for hot leads, and saw sales representative conversion rates jump from 1.5% to 3.8%. Download the complete performance audit report inside.",
          versions: [
            {
              version: 1,
              title: "How Acme Corp Accelerated Deal Flow by 250%",
              content: "Learn how manufacturing giant Acme Corp integrated DealFlow AI into their legacy Salesforce setup. In less than 30 days, they eliminated duplicate entries, established automated phone dialing for hot leads, and saw sales representative conversion rates jump from 1.5% to 3.8%. Download the complete performance audit report inside.",
              updatedAt: "2026-06-15T09:30:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [
            { id: "comm-2", comment: "Excellent case study draft. Ready for publication.", authorName: "Praneeth", authorRole: "agent", createdAt: "2026-06-16T11:00:00Z" }
          ],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-15T09:30:00Z" },
            { action: "approved", details: "Approved for publication", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-17T15:00:00Z" }
          ],
          createdAt: "2026-06-15T09:30:00Z",
          updatedAt: "2026-06-17T15:00:00Z"
        },
        {
          id: "asset-4",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "Why TechStartup Loves DealFlow AI's Real-time Dashboards",
          tactic: "Customer Testimonials",
          status: "under_review",
          content: "\"DealFlow AI gave our developers and sales team a single source of truth. We went from manually copying Leads from custom hooks to a fully automated pipeline. The real-time notification alerts kept us on top of high-intent buyers immediately.\" - Founder, TechStartup",
          versions: [
            {
              version: 1,
              title: "Why TechStartup Loves DealFlow AI's Real-time Dashboards",
              content: "\"DealFlow AI gave our developers and sales team a single source of truth. We went from manually copying Leads from custom hooks to a fully automated pipeline. The real-time notification alerts kept us on top of high-intent buyers immediately.\" - Founder, TechStartup",
              updatedAt: "2026-06-18T14:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [
            { id: "comm-3", comment: "Can we include the specific metrics of our pipeline growth?", authorName: "Praneeth Burada", authorRole: "customer", createdAt: "2026-06-19T08:30:00Z" }
          ],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-18T14:00:00Z" },
            { action: "submitted", details: "Submitted for customer review", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-18T14:15:00Z" }
          ],
          createdAt: "2026-06-18T14:00:00Z",
          updatedAt: "2026-06-18T14:15:00Z"
        },
        {
          id: "asset-5",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "DealFlow Platform Feature walkthrough Video Script",
          tactic: "Product Demo Videos",
          status: "draft",
          content: "[Opening Shot: Screen share of DealFlow dashboard] \"Hello everyone! Today we are showing how DealFlow tracks, updates, and scores leads automatically. See this dashboard? The metrics update every 3 seconds. Watch what happens when a lead registers on our custom landing page...\"",
          versions: [
            {
              version: 1,
              title: "DealFlow Platform Feature walkthrough Video Script",
              content: "[Opening Shot: Screen share of DealFlow dashboard] \"Hello everyone! Today we are showing how DealFlow tracks, updates, and scores leads automatically. See this dashboard? The metrics update every 3 seconds. Watch what happens when a lead registers on our custom landing page...\"",
              updatedAt: "2026-06-20T10:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-20T10:00:00Z" }
          ],
          createdAt: "2026-06-20T10:00:00Z",
          updatedAt: "2026-06-20T10:00:00Z"
        },
        {
          id: "asset-7",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "SaaS Growth Secrets: Live Webinar Presentation",
          tactic: "Webinars",
          status: "scheduled",
          content: "Join B2B growth leaders on July 20th as we unpack advanced outbound orchestration frameworks. Learn: - Setting up dynamic segment routing. - Managing WhatsApp triggers programmatically. - Calculating ROI metrics for multi-channel sales sequences.",
          versions: [
            {
              version: 1,
              title: "SaaS Growth Secrets: Live Webinar Presentation",
              content: "Join B2B growth leaders on July 20th as we unpack advanced outbound orchestration frameworks. Learn: - Setting up dynamic segment routing. - Managing WhatsApp triggers programmatically. - Calculating ROI metrics for multi-channel sales sequences.",
              updatedAt: "2026-06-24T16:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: ["Zoom", "LinkedIn Events"],
          scheduledAt: "2026-07-20T18:00:00Z",
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-24T16:00:00Z" },
            { action: "scheduled", details: "Scheduled for publication on July 20th", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-25T11:00:00Z" }
          ],
          createdAt: "2026-06-24T16:00:00Z",
          updatedAt: "2026-06-25T11:00:00Z"
        },
        {
          id: "asset-8",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "5 CRM Traps Destroying Your Sales Velocity",
          tactic: "LinkedIn Marketing",
          status: "published",
          content: "If your sales reps are spending 4 hours a day manually entering phone calls and logging chat sessions, your CRM is a trap. ❌ 1. Expired Auth Tokens ❌ 2. Untracked Lead Paths ❌ 3. Fragmented WhatsApp sequences. Here is how we automated operations at Acme Corp to double lead velocity. 👇 [Link]",
          versions: [
            {
              version: 1,
              title: "5 CRM Traps Destroying Your Sales Velocity",
              content: "If your sales reps are spending 4 hours a day manually entering phone calls and logging chat sessions, your CRM is a trap. ❌ 1. Expired Auth Tokens ❌ 2. Untracked Lead Paths ❌ 3. Fragmented WhatsApp sequences. Here is how we automated operations at Acme Corp to double lead velocity. 👇 [Link]",
              updatedAt: "2026-06-25T08:00:00Z",
              updatedBy: "customer-demo",
              updatedByRole: "customer"
            }
          ],
          comments: [],
          performanceMetrics: { views: 7600, clicks: 1200, conversions: 65, conversionRate: 0.85, engagementRate: 6.8 },
          publishedPlatforms: ["LinkedIn"],
          auditLogs: [
            { action: "created", details: "Asset created by Demo Customer", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-25T08:00:00Z" },
            { action: "published", details: "Published to LinkedIn", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-06-25T09:00:00Z" }
          ],
          createdAt: "2026-06-25T08:00:00Z",
          updatedAt: "2026-06-25T09:00:00Z"
        },
        {
          id: "asset-9",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "RevOps Life: Before & After DealFlow AI Automation",
          tactic: "Instagram/Facebook Marketing",
          status: "published",
          content: "[Reel Concept] Split-screen. Left: RevOps engineer surrounded by spreadsheets, coffee spilled, phone ringing off the hook. Right: Calm engineer drinking tea while the DealFlow dialer runs in the background. Caption: Work smarter, not harder. #RevOps #Automation #Productivity",
          versions: [
            {
              version: 1,
              title: "RevOps Life: Before & After DealFlow AI Automation",
              content: "[Reel Concept] Split-screen. Left: RevOps engineer surrounded by spreadsheets, coffee spilled, phone ringing off the hook. Right: Calm engineer drinking tea while the DealFlow dialer runs in the background. Caption: Work smarter, not harder. #RevOps #Automation #Productivity",
              updatedAt: "2026-06-26T12:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 9800, clicks: 520, conversions: 18, conversionRate: 0.18, engagementRate: 9.2 },
          publishedPlatforms: ["Instagram", "Facebook"],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-26T12:00:00Z" },
            { action: "published", details: "Published to Instagram and Facebook", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-06-27T10:00:00Z" }
          ],
          createdAt: "2026-06-26T12:00:00Z",
          updatedAt: "2026-06-27T10:00:00Z"
        },
        {
          id: "asset-11",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "Onboarding Sequence: Welcome to DealFlow AI",
          tactic: "Email Automation",
          status: "under_review",
          content: "Subject: Welcome to DealFlow AI, {first_name}! \n\nWe are excited to help you scale your GTM operations. Here is a quick 3-step list to get you started: \n1. Complete your business profile configuration. \n2. Seed your initial customer database. \n3. Trigger your first GTM audit workflow. \n\nClick here to log into your portal: {portal_link}.",
          versions: [
            {
              version: 1,
              title: "Onboarding Sequence: Welcome to DealFlow AI",
              content: "Subject: Welcome to DealFlow AI, {first_name}! \n\nWe are excited to help you scale your GTM operations. Here is a quick 3-step list to get you started: \n1. Complete your business profile configuration. \n2. Seed your initial customer database. \n3. Trigger your first GTM audit workflow. \n\nClick here to log into your portal: {portal_link}.",
              updatedAt: "2026-07-01T09:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [
            { id: "comm-4", comment: "Can we add a discount code for purchasing extra credits to this email?", authorName: "Praneeth Burada", authorRole: "customer", createdAt: "2026-07-02T10:00:00Z" }
          ],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-01T09:00:00Z" },
            { action: "submitted", details: "Submitted for review", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-01T09:10:00Z" }
          ],
          createdAt: "2026-07-01T09:00:00Z",
          updatedAt: "2026-07-01T09:10:00Z"
        },
        {
          id: "asset-14",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "LinkedIn Ads: Account Based Marketing InMail",
          tactic: "LinkedIn Ads",
          status: "draft",
          content: "Subject: Streamlining your RevOps workload\n\nDear {first_name},\n\nIf you are managing enterprise growth, you know administrative bottlenecks are draining your team. DealFlow AI automatically handles lead synchronization, dial logs, and security-compliance requirements. Let's discuss an integration for {company_name}.",
          versions: [
            {
              version: 1,
              title: "LinkedIn Ads: Account Based Marketing InMail",
              content: "Subject: Streamlining your RevOps workload\n\nDear {first_name},\n\nIf you are managing enterprise growth, you know administrative bottlenecks are draining your team. DealFlow AI automatically handles lead synchronization, dial logs, and security-compliance requirements. Let's discuss an integration for {company_name}.",
              updatedAt: "2026-07-04T14:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-04T14:00:00Z" }
          ],
          createdAt: "2026-07-04T14:00:00Z",
          updatedAt: "2026-07-04T14:00:00Z"
        },
        {
          id: "asset-15",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "GDN Retargeting Banner: Re-engage Visitors",
          tactic: "Retargeting Ads",
          status: "published",
          content: "Tagline: The Outbound Sales Dialer that Thinks. \nSubtext: Double contact rates and automate dial tracking. Claim 100 free credits. \nCall To Action: Launch Free Trial",
          versions: [
            {
              version: 1,
              title: "GDN Retargeting Banner: Re-engage Visitors",
              content: "Tagline: The Outbound Sales Dialer that Thinks. \nSubtext: Double contact rates and automate dial tracking. Claim 100 free credits. \nCall To Action: Launch Free Trial",
              updatedAt: "2026-07-05T09:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 22000, clicks: 510, conversions: 22, conversionRate: 4.31, roi: 125 },
          publishedPlatforms: ["Google Ads"],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-05T09:00:00Z" },
            { action: "published", details: "Published to Google Display Network", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-05T12:00:00Z" }
          ],
          createdAt: "2026-07-05T09:00:00Z",
          updatedAt: "2026-07-05T12:00:00Z"
        },
        {
          id: "asset-16",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "Cold Email: Scaling Sales Pipeline Automations",
          tactic: "Cold Email",
          status: "under_review",
          content: "Subject: Eliminating manual dial logs for {company_name}\n\nHi {first_name},\n\nI noticed you have a growing sales team. Most teams lose 15+ hours weekly to manual logs. DealFlow AI automates this, syncing direct records into your CRM. Would you be open to a 5-minute chat next Tuesday?\n\nBest,\n{my_name}",
          versions: [
            {
              version: 1,
              title: "Cold Email: Scaling Sales Pipeline Automations",
              content: "Subject: Eliminating manual dial logs for {company_name}\n\nHi {first_name},\n\nI noticed you have a growing sales team. Most teams lose 15+ hours weekly to manual logs. DealFlow AI automates this, syncing direct records into your CRM. Would you be open to a 5-minute chat next Tuesday?\n\nBest,\n{my_name}",
              updatedAt: "2026-07-06T10:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [
            { id: "comm-5", comment: "Please replace '{my_name}' with the active agent's signature block.", authorName: "Demo Customer", authorRole: "customer", createdAt: "2026-07-07T11:00:00Z" }
          ],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-06T10:00:00Z" },
            { action: "submitted", details: "Submitted for review", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-06T10:15:00Z" }
          ],
          createdAt: "2026-07-06T10:00:00Z",
          updatedAt: "2026-07-06T10:15:00Z"
        },
        {
          id: "asset-18",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "Affiliate Creators Commission structure guide",
          tactic: "Affiliate Marketing",
          status: "draft",
          content: "Earn 20% recurring monthly commission on all subscriptions referred for up to 12 months. Access prebuilt promotional banners, explainer videos, and social templates to share with your audience.",
          versions: [
            {
              version: 1,
              title: "Affiliate Creators Commission structure guide",
              content: "Earn 20% recurring monthly commission on all subscriptions referred for up to 12 months. Access prebuilt promotional banners, explainer videos, and social templates to share with your audience.",
              updatedAt: "2026-07-09T12:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-09T12:00:00Z" }
          ],
          createdAt: "2026-07-09T12:00:00Z",
          updatedAt: "2026-07-09T12:00:00Z"
        },
        {
          id: "asset-23",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "Personalized Landing Page for Fintech Prospects",
          tactic: "AI Personalization",
          status: "published",
          content: "Dynamic content header: 'The Secure, Compliant Way to Automate Fintech Pipelines.' Adjusts references from standard Salesforce to specific financial-compliant systems based on visitor industry classification tags.",
          versions: [
            {
              version: 1,
              title: "Personalized Landing Page for Fintech Prospects",
              content: "Dynamic content header: 'The Secure, Compliant Way to Automate Fintech Pipelines.' Adjusts references from standard Salesforce to specific financial-compliant systems based on visitor industry classification tags.",
              updatedAt: "2026-07-13T14:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 9200, clicks: 2100, conversions: 235, conversionRate: 2.55 },
          publishedPlatforms: ["Webflow"],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-13T14:00:00Z" },
            { action: "published", details: "Published to Webflow personalization blocks", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-13T15:00:00Z" }
          ],
          createdAt: "2026-07-13T14:00:00Z",
          updatedAt: "2026-07-13T15:00:00Z"
        },
        {
          id: "asset-24",
          customerId: "customer-praneeth",
          customerName: "Praneeth Burada",
          title: "Interactive User Onboarding Guided Product Tour",
          tactic: "Product Tours",
          status: "approved",
          content: "Interactive tour highlighting: Step 1: Navigating your active workspace. Step 2: Creating a custom voice dialing framework. Step 3: Triggering outbound sync sequences. Step 4: Tracking analytics dashboards.",
          versions: [
            {
              version: 1,
              title: "Interactive User Onboarding Guided Product Tour",
              content: "Interactive tour highlighting: Step 1: Navigating your active workspace. Step 2: Creating a custom voice dialing framework. Step 3: Triggering outbound sync sequences. Step 4: Tracking analytics dashboards.",
              updatedAt: "2026-07-14T09:00:00Z",
              updatedBy: "agent-praneeth",
              updatedByRole: "agent"
            }
          ],
          comments: [],
          performanceMetrics: { views: 0, clicks: 0, conversions: 0, conversionRate: 0 },
          publishedPlatforms: [],
          auditLogs: [
            { action: "created", details: "Asset created by Praneeth (Agent)", performedBy: "agent-praneeth", performedByRole: "agent", createdAt: "2026-07-14T09:00:00Z" },
            { action: "approved", details: "Approved for publication by Customer Praneeth", performedBy: "customer-praneeth", performedByRole: "customer", createdAt: "2026-07-14T10:00:00Z" }
          ],
          createdAt: "2026-07-14T09:00:00Z",
          updatedAt: "2026-07-14T10:00:00Z"
        },
        {
          id: "asset-25",
          customerId: "customer-demo",
          customerName: "Demo Customer",
          title: "2026 Enterprise GTM Tech Stack Report",
          tactic: "Industry Reports & Research",
          status: "published",
          content: "Our annual research survey of 300+ enterprise VP Sales and CTOs reveals: - 78% report CRM entry bottlenecks. - AI voice dialers boost sales pipeline velocity by 3.2x. - Security compliance is the #1 priority for cloud tools.",
          versions: [
            {
              version: 1,
              title: "2026 Enterprise GTM Tech Stack Report",
              content: "Our annual research survey of 300+ enterprise VP Sales and CTOs reveals: - 78% report CRM entry bottlenecks. - AI voice dialers boost sales pipeline velocity by 3.2x. - Security compliance is the #1 priority for cloud tools.",
              updatedAt: "2026-07-14T11:00:00Z",
              updatedBy: "customer-demo",
              updatedByRole: "customer"
            }
          ],
          comments: [],
          performanceMetrics: { views: 3400, clicks: 1350, conversions: 380, conversionRate: 11.17, roi: 320 },
          publishedPlatforms: ["WordPress"],
          auditLogs: [
            { action: "created", details: "Asset created by Demo Customer", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-07-14T11:00:00Z" },
            { action: "published", details: "Published to WordPress reports page", performedBy: "customer-demo", performedByRole: "customer", createdAt: "2026-07-14T12:00:00Z" }
          ],
          createdAt: "2026-07-14T11:00:00Z",
          updatedAt: "2026-07-14T12:00:00Z"
        }
      ];

      for (const asset of defaultContentAssets) {
        await db.collection("content_assets").doc(asset.id).set(asset);
      }
      console.log("[db-init] Seeded content_assets collection successfully.");
    }

  } catch (error: any) {
    isSeeded = false;
    if (error?.code === 8 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.details?.includes("Quota exceeded")) {
      markFirestoreQuotaExhausted();
      console.warn("[db-init] Firestore quota exceeded. System operating in local seed fallback mode.");
    } else {
      console.error("[db-init] Error seeding Firestore:", error);
    }
  }
}

