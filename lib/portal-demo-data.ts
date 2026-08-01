import type {
  PortalUser,
  Task,
  ChatMessage,
  PortalCallRecord,
  CustomerFeedback,
  AgentPerformanceMetrics,
  AgentCredits,
  CustomerCredits,
  Requirement,
  GTMReportMetric,
  CustomerGTMData,
  ScheduledReport,
  Ticket,
  NotificationPreferences,
  Customer,
  CustomerResignation,
  Document,
  AuditLogEntry,
  B2BBulkOrder,
  B2CTransaction,
  D2CBrandingConfig,
} from "@/lib/portal-types";


// Demo users
export const demoUsers: PortalUser[] = [
  {
    id: "demo-admin-1",
    email: "admin@dealflow.ai",
    name: "DealFlow.AI Admin",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "agent-ashok",
    email: "ashok@dealflow.ai",
    name: "Ashok",
    role: "agent",
    createdAt: "2024-02-15T00:00:00Z",
    phoneNumber: "+15550100001",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Introduce DealFlow AI\n- Pitch pipeline optimization benefits\n- Identify customer decision makers\n\nMandatory Disclosures:\n- Call recorded for quality assurance",
    whatsAppMessageParameters: "Tone: Professional, direct.\nCall to Action: Schedule a 15-minute demo.\nTemplate: Hi {{name}}, this is Ashok from DealFlow AI. I noticed your recent pipeline analysis. Would you be open to a quick call?",
  },
  {
    id: "agent-harsha",
    email: "harsha@dealflow.ai",
    name: "Harsha",
    role: "agent",
    createdAt: "2024-02-20T00:00:00Z",
    phoneNumber: "+15550100002",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Explain content and GTM strategy\n- Outline product-led growth model",
    whatsAppMessageParameters: "Tone: Warm, consultative.",
  },
  {
    id: "agent-kiran",
    email: "kiran@dealflow.ai",
    name: "Kiran",
    role: "agent",
    createdAt: "2024-03-01T00:00:00Z",
    phoneNumber: "+15550100003",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Discuss growth metrics and paid ads acquisition",
    whatsAppMessageParameters: "Tone: Analytical, numbers-driven.",
  },
  {
    id: "agent-vijay",
    email: "vijay@dealflow.ai",
    name: "Vijay",
    role: "agent",
    createdAt: "2024-03-10T00:00:00Z",
    phoneNumber: "+15550100004",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Enterprise sales qualification\n- Discuss strategic planning timelines",
    whatsAppMessageParameters: "Tone: Formal, value-oriented.",
  },
  {
    id: "agent-avinash",
    email: "avinash@dealflow.ai",
    name: "Avinash",
    role: "agent",
    createdAt: "2024-03-15T00:00:00Z",
    phoneNumber: "+15550100005",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Account management and customer success reviews",
    whatsAppMessageParameters: "Tone: Supportive, partnership-focused.",
  },
  {
    id: "agent-kunal",
    email: "kunal@dealflow.ai",
    name: "Kunal",
    role: "agent",
    createdAt: "2024-03-20T00:00:00Z",
    phoneNumber: "+15550100006",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Marketing automation discussion\n- Lead generation strategy",
    whatsAppMessageParameters: "Tone: Innovative, tech-forward.",
  },
  {
    id: "agent-praneeth",
    email: "praneeth@dealflow.ai",
    name: "Praneeth",
    role: "agent",
    createdAt: "2024-02-10T00:00:00Z",
    phoneNumber: "+15550100007",
    countryCode: "US",
    callConversationFramework: "Core Objectives:\n- Assess ICP alignment\n- Review revenue operations inefficiencies",
    whatsAppMessageParameters: "Tone: Authoritative, strategic.",
  },
  {
    id: "customer-demo",
    email: "demo@customer.com",
    name: "Demo Customer",
    role: "customer",
    createdAt: "2024-03-10T00:00:00Z",
  },
];

// Demo tasks
export const demoTasks: Task[] = [
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
      { id: "m1", title: "Initial outreach", completed: true, completedAt: "2024-05-10T09:30:00Z" },
      { id: "m2", title: "Needs assessment", completed: false },
      { id: "m3", title: "Proposal sent", completed: false },
    ],
    createdAt: "2024-05-10T09:00:00Z",
    updatedAt: "2024-05-20T14:30:00Z",
  },
  {
    id: "task-2",
    title: "Prepare onboarding materials",
    description: "Create onboarding guide for new clients",
    status: "todo",
    assignedAgentId: "agent-ashok",
    customerId: "customer-demo",
    priority: "medium",
    progressNotes: [],
    milestones: [
      { id: "m1", title: "Draft guide", completed: false },
      { id: "m2", title: "Review and finalize", completed: false },
    ],
    createdAt: "2024-05-15T11:00:00Z",
    updatedAt: "2024-05-15T11:00:00Z",
  },
  {
    id: "task-3",
    title: "Collect customer feedback",
    description: "Get feedback from Demo Customer on initial meeting",
    status: "completed",
    assignedAgentId: "agent-kiran",
    customerId: "customer-demo",
    priority: "low",
    progressNotes: ["Feedback collected", "Analysis complete"],
    milestones: [
      { id: "m1", title: "Send survey", completed: true, completedAt: "2024-05-18T10:00:00Z" },
      { id: "m2", title: "Analyze results", completed: true, completedAt: "2024-05-19T15:00:00Z" },
    ],
    createdAt: "2024-05-17T09:00:00Z",
    updatedAt: "2024-05-19T15:00:00Z",
  },
];

// Demo chat messages
export const demoChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    sessionId: "session-1",
    senderId: "customer-demo",
    senderName: "Demo Customer",
    senderRole: "customer",
    content: "Hi, I'd like to discuss my GTM strategy.",
    timestamp: "2024-05-20T10:00:00Z",
    read: true,
  },
  {
    id: "msg-2",
    sessionId: "session-1",
    senderId: "agent-praneeth",
    senderName: "Praneeth",
    senderRole: "agent",
    content: "Great! Let's schedule a call this week. Here's the GTM analysis report for reference.",
    timestamp: "2024-05-20T10:15:00Z",
    read: true,
    attachments: [
      {
        id: "file-1",
        fileName: "GTM_Analysis_Report.pdf",
        fileSize: 1234567,
        fileType: "application/pdf",
        url: "#", // In real app, this would be a file URL
        uploadedAt: "2024-05-20T10:14:00Z",
        uploadedBy: "agent-praneeth"
      }
    ]
  },
];

// Demo calls
export const demoCallRecords: PortalCallRecord[] = [
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
    duration: 960, // 16 minutes
    startedAt: "2024-05-20T11:00:00Z",
    endedAt: "2024-05-20T11:16:00Z",
  },
];

// Demo feedback
export const demoCustomerFeedback: CustomerFeedback[] = [
  {
    id: "fb-1",
    sessionId: "session-1",
    agentId: "agent-praneeth",
    customerId: "customer-demo",
    rating: 5,
    comment: "Excellent service! Very helpful.",
    createdAt: "2024-05-20T12:00:00Z",
  },
];

// Demo metrics
export const demoAgentMetrics: AgentPerformanceMetrics[] = [
  {
    agentId: "agent-vijay",
    periodStart: "2024-05-01T00:00:00Z",
    periodEnd: "2024-05-30T23:59:59Z",
    tasksCompleted: 23,
    totalTasks: 28,
    averageResolutionTime: 1440, // 24 hours
    averageRating: 4.7,
    totalInteractions: 87,
    totalFeedback: 21,
  },
  {
    agentId: "agent-ashok",
    periodStart: "2024-05-01T00:00:00Z",
    periodEnd: "2024-05-30T23:59:59Z",
    tasksCompleted: 18,
    totalTasks: 22,
    averageResolutionTime: 2880, // 48 hours
    averageRating: 4.3,
    totalInteractions: 56,
    totalFeedback: 15,
  },
  {
    agentId: "agent-kiran",
    periodStart: "2024-05-01T00:00:00Z",
    periodEnd: "2024-05-30T23:59:59Z",
    tasksCompleted: 31,
    totalTasks: 34,
    averageResolutionTime: 960, // 16 hours
    averageRating: 4.9,
    totalInteractions: 102,
    totalFeedback: 28,
  },
  {
    agentId: "agent-praneeth",
    periodStart: "2024-05-01T00:00:00Z",
    periodEnd: "2024-05-30T23:59:59Z",
    tasksCompleted: 26,
    totalTasks: 30,
    averageResolutionTime: 1200, // 20 hours
    averageRating: 4.8,
    totalInteractions: 95,
    totalFeedback: 24,
  },
];

// Demo Agent Credits
export const demoAgentCredits: AgentCredits[] = [
  {
    agentId: "agent-praneeth",
    balance: 1250,
    totalEarned: 1500,
    totalSpent: 250,
    transactions: [
      {
        id: "tx-1",
        type: "onboarding",
        amount: 500,
        description: "Initial onboarding bonus",
        createdAt: "2024-02-15T09:00:00Z",
      },
      {
        id: "tx-2",
        type: "lead",
        amount: 250,
        description: "Earned for closing demo customer",
        createdAt: "2024-03-20T14:30:00Z",
      },
      {
        id: "tx-3",
        type: "call",
        amount: -150,
        description: "Spent on 15 premium calls",
        createdAt: "2024-05-10T10:15:00Z",
      },
      {
        id: "tx-4",
        type: "analysis",
        amount: 750,
        description: "Earned for completing 3 high-value analysis",
        createdAt: "2024-05-18T16:00:00Z",
      },
      {
        id: "tx-5",
        type: "message",
        amount: -100,
        description: "Spent on 50 premium messages",
        createdAt: "2024-05-22T11:45:00Z",
      },
    ],
  },
  {
    agentId: "agent-ashok",
    balance: 950,
    totalEarned: 1200,
    totalSpent: 250,
    transactions: [
      {
        id: "tx-1",
        type: "onboarding",
        amount: 500,
        description: "Initial onboarding bonus",
        createdAt: "2024-02-20T08:30:00Z",
      },
      {
        id: "tx-2",
        type: "lead",
        amount: 300,
        description: "Earned for 3 new leads closed",
        createdAt: "2024-04-05T15:00:00Z",
      },
      {
        id: "tx-3",
        type: "call",
        amount: -200,
        description: "Spent on 20 premium calls",
        createdAt: "2024-05-08T09:00:00Z",
      },
      {
        id: "tx-4",
        type: "analysis",
        amount: 400,
        description: "Earned for 2 technical integration analyses",
        createdAt: "2024-05-19T13:30:00Z",
      },
      {
        id: "tx-5",
        type: "message",
        amount: -50,
        description: "Spent on 25 premium messages",
        createdAt: "2024-05-25T10:00:00Z",
      },
    ],
  },
  {
    agentId: "agent-kiran",
    balance: 1750,
    totalEarned: 2100,
    totalSpent: 350,
    transactions: [
      {
        id: "tx-1",
        type: "onboarding",
        amount: 500,
        description: "Initial onboarding bonus",
        createdAt: "2024-03-01T10:00:00Z",
      },
      {
        id: "tx-2",
        type: "lead",
        amount: 400,
        description: "Earned for closing 4 enterprise leads",
        createdAt: "2024-04-12T11:00:00Z",
      },
      {
        id: "tx-3",
        type: "call",
        amount: -250,
        description: "Spent on 25 premium calls",
        createdAt: "2024-05-05T14:30:00Z",
      },
      {
        id: "tx-4",
        type: "analysis",
        amount: 1200,
        description: "Earned for 5 executive strategy analyses",
        createdAt: "2024-05-20T09:15:00Z",
      },
      {
        id: "tx-5",
        type: "message",
        amount: -100,
        description: "Spent on 50 premium messages",
        createdAt: "2024-05-28T16:45:00Z",
      },
    ],
  },
  {
    agentId: "agent-praneeth",
    balance: 1400,
    totalEarned: 1650,
    totalSpent: 250,
    transactions: [
      {
        id: "tx-1",
        type: "onboarding",
        amount: 500,
        description: "Initial onboarding bonus",
        createdAt: "2024-03-15T10:00:00Z",
      },
      {
        id: "tx-2",
        type: "lead",
        amount: 350,
        description: "Earned for closing 3 GTM strategy leads",
        createdAt: "2024-04-25T13:30:00Z",
      },
      {
        id: "tx-3",
        type: "call",
        amount: -200,
        description: "Spent on 20 premium calls",
        createdAt: "2024-05-12T09:45:00Z",
      },
      {
        id: "tx-4",
        type: "analysis",
        amount: 800,
        description: "Earned for 4 RevOps and pipeline analyses",
        createdAt: "2024-05-23T16:00:00Z",
      },
      {
        id: "tx-5",
        type: "message",
        amount: -50,
        description: "Spent on 25 premium messages",
        createdAt: "2024-05-29T11:15:00Z",
      },
    ],
  },
];

// Demo Customer Credits
export const demoCustomerCredits: CustomerCredits[] = [
  {
    customerId: "customer-demo",
    balance: 25,
    totalPurchased: 30,
    totalSpent: 5,
    transactions: [
      {
        id: "ctx-1",
        type: "bonus",
        amount: 10,
        description: "Welcome bonus for new customers",
        createdAt: "2024-03-10T10:00:00Z",
      },
      {
        id: "ctx-2",
        type: "purchase",
        amount: 20,
        description: "Purchased 20 credits",
        createdAt: "2024-04-15T14:30:00Z",
      },
      {
        id: "ctx-3",
        type: "consultation",
        amount: -5,
        description: "Spent on GTM strategy consultation",
        createdAt: "2024-05-01T09:15:00Z",
      },
    ],
  },
];

// Demo Requirements
export const demoRequirements: Requirement[] = [
  {
    id: "req-1",
    customerId: "customer-demo",
    customerName: "Demo Customer",
    requesterName: "Demo Customer",
    requesterEmail: "demo@customer.com",
    category: "Feature Request",
    description: "We need a mobile app integration for our CRM.",
    priority: "High",
    status: "In Progress",
    assignedAgentId: "agent-praneeth",
    assignedAgentName: "Praneeth",
    createdAt: "2026-06-14T10:00:00Z",
    updatedAt: "2026-06-14T11:30:00Z",
  },
];

// Demo GTM Reports
export const demoGTMReports: GTMReportMetric[] = [
  {
    id: "gtm-daily-1",
    customerId: "customer-demo",
    reportName: "Daily GTM Analysis - June 15, 2026",
    reportType: "customer-submitted",
    reportFrequency: "daily",
    dateRange: {
      start: "2026-06-15T00:00:00Z",
      end: "2026-06-15T23:59:59Z",
    },
    leadConversionRate: 26.1,
    marketPenetration: 19.3,
    pipelineValue: 265000,
    campaignEffectiveness: 87.2,
    region: "North America",
    segment: "Enterprise",
    dailyMetrics: [
      { date: "2026-06-13", leadConversionRate: 25.5, marketPenetration: 18.9, pipelineValue: 260000, campaignEffectiveness: 86.5 },
      { date: "2026-06-14", leadConversionRate: 25.8, marketPenetration: 19.1, pipelineValue: 262000, campaignEffectiveness: 86.9 },
      { date: "2026-06-15", leadConversionRate: 26.1, marketPenetration: 19.3, pipelineValue: 265000, campaignEffectiveness: 87.2 },
    ],
    actionableSuggestions: [
      {
        id: "suggestion-1",
        title: "Optimize Ad Copy for Mid-Market Segment",
        description: "Recent data shows 12% lower conversion rates for mid-market leads. Refine messaging to highlight scalability features.",
        priority: "high",
        estimatedImpact: "Increase conversion rate by 3-5%",
      },
      {
        id: "suggestion-2",
        title: "Expand Content Marketing in Europe",
        description: "European market penetration remains below target. Increase blog and whitepaper production in local languages.",
        priority: "medium",
        estimatedImpact: "Increase market share by 2-3% in 90 days",
      },
    ],
    createdAt: "2026-06-15T00:00:00Z",
    updatedAt: "2026-06-15T00:00:00Z",
  },
  {
    id: "gtm-weekly-1",
    customerId: "customer-demo",
    reportName: "Weekly GTM Analysis - Week of June 10, 2026",
    reportType: "customer-submitted",
    reportFrequency: "weekly",
    dateRange: {
      start: "2026-06-10T00:00:00Z",
      end: "2026-06-16T23:59:59Z",
    },
    leadConversionRate: 25.8,
    marketPenetration: 19.1,
    pipelineValue: 263000,
    campaignEffectiveness: 87.1,
    region: "North America",
    segment: "Enterprise",
    weeklyTrendComparisons: [
      {
        weekStart: "2026-06-03",
        weekEnd: "2026-06-09",
        leadConversionRateChange: 0.8,
        marketPenetrationChange: 0.5,
        pipelineValueChange: 3000,
        campaignEffectivenessChange: 0.9,
      },
    ],
    actionableSuggestions: [
      {
        id: "suggestion-3",
        title: "Leverage New Sales Enablement Tools",
        description: "New tools released last week show 15% faster close times. Ensure all reps are trained by end of month.",
        priority: "high",
        estimatedImpact: "Reduce sales cycle length by 10-12%",
      },
    ],
    createdAt: "2026-06-16T00:00:00Z",
    updatedAt: "2026-06-16T00:00:00Z",
  },
];

// Demo Scheduled Reports
export const demoScheduledReports: ScheduledReport[] = [
  {
    id: "scheduled-1",
    customerId: "customer-demo",
    reportFrequency: "daily",
    recipients: ["demo@customer.com"],
    fileFormats: ["pdf", "xlsx"],
    enabled: true,
    nextSendDate: "2026-06-16T08:00:00Z",
    createdAt: "2026-06-10T00:00:00Z",
  },
];

// Demo Tickets
export const demoTickets: Ticket[] = [
  {
    id: "ticket-1",
    customerId: "customer-demo",
    requesterName: "Demo Customer",
    requesterEmail: "demo@customer.com",
    category: "technical-support",
    subject: "Issue with report generation",
    description: "Unable to download reports in PDF format since yesterday",
    priority: "high",
    status: "in-progress",
    assignedAgentId: "agent-jane",
    assignedAgentName: "Jane Smith",
    createdAt: "2026-06-14T10:00:00Z",
    updatedAt: "2026-06-14T14:30:00Z",
  },
];

// Demo Notification Preferences
export const demoNotificationPreferences: Record<string, NotificationPreferences> = {
  "customer-demo": {
    emailNotifications: true,
    inAppNotifications: true,
    preferredReportFormats: ["pdf", "xlsx"],
    dailyReportTime: "08:00",
    weeklyReportDay: "monday",
  },
};

// Demo Customer GTM Data (customer-submitted)
export const demoCustomerGTMData: CustomerGTMData[] = [
  {
    id: "customer-gtm-1",
    customerId: "customer-demo",
    submittedBy: "Demo Customer",
    submittedAt: "2026-06-12T10:00:00Z",
    data: {
      companyName: "Demo Corp",
      targetIndustry: "SaaS",
      currentPipeline: 200000,
      goals: ["Increase conversion rate", "Expand to Europe"],
    },
  },
];

// Demo Customers
export const demoCustomers: Customer[] = [
  {
    id: "customer-demo",
    name: "Demo Customer",
    email: "demo@customer.com",
    phone: "+1-555-123-4567",
    companyName: "Demo Corp",
    industry: "SaaS",
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
    createdAt: "2024-03-10T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
    businessModel: "b2b",
  },
  {
    id: "customer-john",
    name: "John Doe",
    email: "john@techstartup.io",
    phone: "+1-555-987-6543",
    companyName: "TechStartup Inc",
    industry: "Technology",
    status: "resigned",
    assignedAgentId: "agent-kiran",
    assignedAgentName: "Kiran",
    serviceConfigurations: {
      gtmReports: false,
      leadScoring: false,
      aiCalls: false,
      wrenChatbot: false,
      automatedGtmAnalysis: false,
      playbookGeneration: false,
    },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-06-10T00:00:00Z",
    businessModel: "d2c",
  },
  {
    id: "customer-creator",
    name: "Emerging Creator",
    email: "creator@youtube.io",
    phone: "+1-555-444-3333",
    companyName: "CreatorBrand",
    industry: "Media",
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
    createdAt: "2026-06-18T00:00:00Z",
    updatedAt: "2026-06-18T00:00:00Z",
    businessModel: "custom",
  },
];

// Mock data for B2B Bulk Orders
export const demoB2BBulkOrders: B2BBulkOrder[] = [
  {
    id: "b2b-ord-1",
    productName: "Enterprise Seat Licenses (Tier 1)",
    quantity: 120,
    unitPrice: 45,
    totalAmount: 4860, // 10% discount applied for >100 units
    status: "approved",
    orderDate: "2026-06-10T10:00:00Z",
    notes: "Q3 Seat expansion.",
  },
  {
    id: "b2b-ord-2",
    productName: "API Infrastructure Pack",
    quantity: 15,
    unitPrice: 200,
    totalAmount: 3000,
    status: "shipped",
    orderDate: "2026-06-14T14:30:00Z",
    notes: "Pre-paid contract.",
  },
  {
    id: "b2b-ord-3",
    productName: "Advanced Security Module",
    quantity: 500,
    unitPrice: 15,
    totalAmount: 6000, // 20% discount applied for >500 units
    status: "pending",
    orderDate: "2026-06-22T09:00:00Z",
    notes: "Awaiting pilot approval.",
  },
];

// Mock data for B2C Transactions
export const demoB2CTransactions: B2CTransaction[] = [
  {
    id: "b2c-tx-1",
    consumerName: "Alice Smith",
    itemCount: 2,
    amount: 89.90,
    paymentStatus: "paid",
    deviceType: "mobile",
    checkoutTimestamp: "2026-06-22T18:45:00Z",
  },
  {
    id: "b2c-tx-2",
    consumerName: "Bob Jones",
    itemCount: 1,
    amount: 45.00,
    paymentStatus: "paid",
    deviceType: "desktop",
    checkoutTimestamp: "2026-06-23T11:20:00Z",
  },
  {
    id: "b2c-tx-3",
    consumerName: "Charlie Brown",
    itemCount: 5,
    amount: 245.50,
    paymentStatus: "failed",
    deviceType: "tablet",
    checkoutTimestamp: "2026-06-23T15:05:00Z",
  },
];

// Mock data for D2C Branding Configurations
export const demoD2CBrandingConfigs: Record<string, D2CBrandingConfig> = {
  "customer-john": {
    brandName: "TechStartup Premium Goods",
    logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60",
    primaryColor: "#6366f1", // Indigo
    secondaryColor: "#ec4899", // Pink
    customCss: ".brand-header { font-weight: 800; letter-spacing: -0.05em; }",
    instagramHandle: "@techstartup_goods",
  },
  "customer-demo": {
    brandName: "Demo Brand Co",
    logoUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&auto=format&fit=crop&q=60",
    primaryColor: "#0d9488", // Teal
    secondaryColor: "#0891b2", // Cyan
    customCss: "",
    instagramHandle: "@demo_brand_co",
  },
};


// Demo Customer Resignations
export const demoCustomerResignations: CustomerResignation[] = [
  {
    id: "resign-1",
    customerId: "customer-john",
    customerName: "John Doe",
    requestDate: "2026-06-05T00:00:00Z",
    effectiveDate: "2026-06-10T00:00:00Z",
    terminationReason: "Switching to competitor",
    notes: "Customer cited better pricing as main reason",
    documentsArchived: true,
    accountClosed: true,
    processedBy: "demo-admin-1",
    processedAt: "2026-06-10T00:00:00Z",
  },
];

// Demo Documents
export const demoDocuments: Document[] = [
  {
    id: "doc-1",
    customerId: "customer-demo",
    documentType: "icp",
    title: "Demo Corp ICP Profile",
    description: "Ideal Customer Profile for Demo Corp",
    icpId: "icp-demo-1",
    createdBy: "demo-admin-1",
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-03-15T00:00:00Z",
    accessRoles: ["admin", "agent", "customer"],
  },
  {
    id: "doc-3",
    customerId: "customer-demo",
    documentType: "onboarding",
    title: "Demo Corp Onboarding Guide",
    description: "Complete onboarding documentation",
    createdBy: "agent-praneeth",
    createdAt: "2024-03-12T00:00:00Z",
    updatedAt: "2024-03-12T00:00:00Z",
    accessRoles: ["admin", "agent", "customer"],
  },
];

// Demo Audit Logs
export const demoAuditLogs: AuditLogEntry[] = [
  {
    id: "audit-2",
    actionType: "customer_resign",
    actionDetails: "Processed resignation for: John Doe",
    performedBy: "demo-admin-1",
    performedByRole: "admin",
    targetId: "customer-john",
    targetType: "customer",
    createdAt: "2026-06-10T14:00:00Z",
  },
  {
    id: "audit-3",
    actionType: "task_create",
    actionDetails: "Created new task: Follow up with Demo Customer",
    performedBy: "agent-praneeth",
    performedByRole: "agent",
    targetId: "task-1",
    targetType: "task",
    createdAt: "2024-05-10T09:00:00Z",
  },
  {
    id: "audit-4",
    actionType: "document_access",
    actionDetails: "Accessed document: Demo Corp ICP Profile",
    performedBy: "agent-kiran",
    performedByRole: "agent",
    targetId: "doc-1",
    targetType: "document",
    createdAt: "2026-06-14T10:30:00Z",
  },
];
