// app/features/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Search, 
  Brain, 
  Database, 
  Cpu, 
  Shield, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Zap,
  Star,
  Bot,
  Terminal,
  FileText,
  Users,
  Briefcase,
  Lock,
  Workflow,
  MessageSquare,
  Check,
  Code2,
  Activity,
  Layers,
  Globe
} from "lucide-react";
import { 
  IconAlertObjection, 
  IconArrowRight,
  IconAwardRoi,
  IconLaunchGtm,
  IconTargetAccount,
  IconChipPlatform
} from "@/components/gtm/GtmIcons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  FEATURE_CATEGORIES, 
  getIconComponent 
} from "@/lib/features";
import { useFeatures } from "@/lib/feature-hooks";
import Link from "next/link";

// 4 Core Features Detail Content
const CORE_ARCHITECTURE = [
  {
    id: "hermes",
    title: "Memory OS (Hermes)",
    icon: Brain,
    glow: "glow-violet",
    accent: "text-violet-400",
    borderColor: "dark:border-violet-500/30",
    bgGradient: "from-violet-500/10",
    definition: "The foundational operating system for unified memory management across the entire DealFlow.AI ecosystem.",
    capabilities: [
      "Multi-agent memory state synchronization in real-time.",
      "Real-time memory virtualization and state abstraction.",
      "Automatic priority zoning to separate short-term and persistent memory.",
      "Instant historical state hydration for returning prospects."
    ],
    synergy: "Feeds raw memory assets directly to MEM Palace for structured storage and provides the execution runtime context for ALMA's learning models.",
    benefit: "Instant, zero-latency context loading when agents hand over leads, ensuring no prospect interaction detail is ever lost."
  },
  {
    id: "mempalace",
    title: "MEM Palace",
    icon: Database,
    glow: "glow-teal",
    accent: "text-teal-400",
    borderColor: "dark:border-teal-500/30",
    bgGradient: "from-teal-500/10",
    definition: "The centralized, highly organized semantic storage layer that structures and indexes long-term memory assets.",
    capabilities: [
      "High-dimensional vector indexing for complex query operations.",
      "Auto-clustering memory associations for conversational relevance.",
      "Query-time contextual routing for rapid retrieval.",
      "Cross-channel memory recall (SMS, Email, Voice)."
    ],
    synergy: "Leverages the memory virtualization pipeline of Memory OS (Hermes) to structure data and serves as the semantic database that ALMA queries for adaptive learning.",
    benefit: "Lightning-fast retrieval of client preferences, past conversations, and objection-handling strategies in under 50ms."
  },
  {
    id: "alma",
    title: "ALMA (Agent Learning and Memory Architecture)",
    icon: Cpu,
    glow: "glow-cyan",
    accent: "text-cyan-400",
    borderColor: "dark:border-cyan-500/30",
    bgGradient: "from-cyan-500/10",
    definition: "The intelligent cognitive and adaptive learning engine that enables continuous optimization of agent decision-making.",
    capabilities: [
      "Self-supervised agent fine-tuning from historical engagement.",
      "Automated error reflection to continuously improve response logic.",
      "Context-aware prompt synthesis for localized communication.",
      "Outreach strategy feedback loops based on live conversion data."
    ],
    synergy: "Queries MEM Palace for deep context, writes updated decision patterns back to Memory OS (Hermes), and secures all learning states using Clawpatrol policies.",
    benefit: "AI agents get smarter with every customer interaction, translating to a 40% improvement in meeting booking rates over 30 days."
  },
  {
    id: "clawpatrol",
    title: "Agent Security Firewall",
    icon: Shield,
    glow: "glow-amber",
    accent: "text-amber-400",
    borderColor: "dark:border-amber-500/30",
    bgGradient: "from-amber-500/10",
    definition: "The enterprise-grade guardrails and security layer overseeing all agent execution, memory access, and data compliance.",
    capabilities: [
      "Real-time PII redacting across conversation streams.",
      "Role-based memory access control for secure team boundaries.",
      "Automated threat prevention guarding against prompt injections.",
      "Immutable cryptographic audit trails stored in compliance vaults."
    ],
    synergy: "Intercepts all memory operations in Memory OS (Hermes), inspects vectors in MEM Palace, and validates learning iterations inside ALMA.",
    benefit: "SOC 2 audit in progress & GDPR compliance by design, ensuring customer data remains secure, private, and audit-ready at all times."
  },
  {
    id: "dealflow-llm",
    title: "Dealflow LLM (Dealflow AI Core v1)",
    icon: Sparkles,
    glow: "glow-indigo",
    accent: "text-indigo-400",
    borderColor: "dark:border-indigo-500/30",
    bgGradient: "from-indigo-500/10",
    definition: "Our proprietary, fine-tuned high-precision intelligence engine engineered specifically for B2B SaaS deal analysis, financial metric extraction, and automated strategy & campaign content generation.",
    capabilities: [
      "Financial metric extraction (ARR, NRR, CAC, LTV) from pitch decks and financial statements.",
      "Automated strategy generation & outbound campaign content synthesis with 97.2%+ accuracy.",
      "Multi-model orchestration supporting NVIDIA & Hugging Face inference pipelines.",
      "Customer-provided AES-256 encrypted API key integration & role-based model authorization."
    ],
    synergy: "Powers the Strategy & Content Generation workspace in Content Hub, queries MEM Palace vectors, and interacts with ALMA learning loops.",
    benefit: "Delivers enterprise-grade B2B strategy recommendations in under 40ms, drastically accelerating deal evaluation and campaign execution."
  },
  {
    id: "dealflow-meeting-bot-core",
    title: "Dealflow Meeting Bot Core",
    icon: Bot,
    glow: "glow-teal",
    accent: "text-teal-400",
    borderColor: "dark:border-teal-500/30",
    bgGradient: "from-teal-500/10",
    definition: "Universal scenario-adaptive AI meeting agent engineered to autonomously handle client calls, team standups, customer onboarding, and deal closing meetings.",
    capabilities: [
      "Universal scenario adaptation across sales, client check-ins, standups, and onboarding calls.",
      "Real-time transcript processing & automated 15-minute MOM HTML email dispatch.",
      "Autonomous decision-making for low-complexity operational tasks & CRM stage progression.",
      "Integration via Dealflow Connect (BYOK API Key management, credit tracking, and pre-call bot training)."
    ],
    synergy: "Consumes Dealflow LLM for intent analysis, records interaction state into Memory OS (Hermes), and syncs deal score updates to CRM.",
    benefit: "Eliminates post-call admin work while achieving 91%+ alignment on action plan execution across historical call benchmarks."
  }
];

// Recently Deployed Implementations Catalog
const RECENT_IMPLEMENTATIONS = [
  {
    id: "dealflow-meeting-bot-hub",
    name: "Universal Dealflow Meeting Bot & Connect Hub",
    category: "AI & Automation",
    badge: "v2.4 Active",
    icon: Bot,
    accent: "text-teal-400",
    borderColor: "border-teal-500/30",
    bgColor: "bg-teal-950/10",
    purpose: "Universal AI meeting bot integrated into Agent & Customer portals for real-time meeting participation, automated MOM emails, BYOK key management, and pre-call bot training.",
    userBenefits: "Enables customers and sales agents to invite an AI bot to meetings, auto-generate action plans, track credits, and customize bot behavior before calls.",
    techSpecs: "`DealflowMeetingBot` engine in `lib/dealflow-llm/dealflow-meeting-bot.ts`, `/api/portal/agent/dealflow-bot`, 15-min MOM email dispatcher.",
    mediaReqs: "Meeting Bot interactive playground, BYOK key manager card, automated MOM preview."
  },
  {
    id: "dealflow-llm-engine",
    name: "Dealflow LLM Strategy & Content Engine",
    category: "AI & Automation",
    badge: "v2.0 Active",
    icon: Sparkles,
    accent: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-950/10",
    purpose: "Fine-tuned Dealflow AI Core v1 model integrated directly into the Strategy & Content Generation workspace for 1-click model selection and instant campaign generation.",
    userBenefits: "Enables customers, agents, and admins to select the proprietary Dealflow LLM model for high-precision GTM strategies, deal scoring, and outbound campaign assets.",
    techSpecs: "`dealflow-llm-v1` model ID in `/api/content/generate`, model registry access control, 65k context window.",
    mediaReqs: "AI Model selector interface mockup, Dealflow LLM performance card, prompt execution flow."
  },
  {
    id: "wren-ai-chatbot",
    name: "Chatbot (Wren AI / GenBI Agent)",

    category: "AI & Automation",
    badge: "v2.0 Active",
    icon: Bot,
    accent: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/30",
    bgColor: "bg-fuchsia-950/10",
    purpose: "Converts natural language questions into structured Firestore queries and executes live analytics in real-time.",
    userBenefits: "Eliminates custom SQL export bottlenecks, giving agents and clients instant data-backed decision capabilities.",
    techSpecs: "NL-to-Firestore translator engine, `/api/agent/genbi-chat` endpoint, schema-aware field mapper.",
    mediaReqs: "Interactive query playground widget, live execution preview, schema mapping diagram."
  },
  {
    id: "gtm-playbook-engine",
    name: "Customer GTM Playbook Engine",
    category: "AI & Automation",
    badge: "v2.0 Active",
    icon: FileText,
    accent: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-950/10",
    purpose: "Interactive playbook studio enabling agents to view, edit, save executive summaries, and generate strategic resources.",
    userBenefits: "Empowers revenue teams to customize GTM positioning, messaging hooks, and battlecards dynamically.",
    techSpecs: "RESTful `/api/gtm-playbook` API, reactive state synchronization, inline editor with autosave.",
    mediaReqs: "Playbook editor interface mockup, executive summary card preview, PDF export flow animation."
  },
  {
    id: "automated-gtm-analysis",
    name: "Automated GTM Analysis",
    category: "Analytics & Reporting",
    badge: "v2.0 Active",
    icon: TrendingUp,
    accent: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-950/10",
    purpose: "Real-time revenue intelligence dashboard tracking lead quality scores, automated pipeline values, and conversion bottlenecks.",
    userBenefits: "Delivers executive-ready performance metrics and automated pipeline health monitoring at a glance.",
    techSpecs: "Aggregate calculation pipeline, intent scoring algorithms, responsive metrics grid.",
    mediaReqs: "Dashboard analytics screenshot, lead intent distribution chart, metric pill infographics."
  },
  {
    id: "verification-code-hint",
    name: "Smart Verification Code Overwrite",
    category: "Security & Compliance",
    badge: "v2.0 Active",
    icon: Lock,
    accent: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-950/10",
    purpose: "Server-side 6-digit verification code generation displayed as a one-tap hint button that auto-fills and validates input fields.",
    userBenefits: "Streamlines user onboarding and registration while maintaining strict 6-digit MFA security standards.",
    techSpecs: "Crypto-secure random generator, auto-fill event listener (`#verification-code-hint-btn`), input sanitizer.",
    mediaReqs: "Clickable hint button UI recording, input validation state diagram, auth flow sequence chart."
  },
  {
    id: "dynamic-agent-sync",
    name: "Dynamic Agent Intake Sync",
    category: "Core Platform",
    badge: "v2.0 Active",
    icon: Users,
    accent: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-950/10",
    purpose: "Real-time synchronization between Admin agent management and the Customer Intake Form dropdown selectors.",
    userBenefits: "Guarantees newly provisioned revenue specialists appear instantly for prospect selection without code deploys.",
    techSpecs: "Firestore `users` collection query (`role == 'agent'`), `/api/agents` endpoint, reactive select hook.",
    mediaReqs: "Admin agent creation workflow video, intake form dropdown screenshot, sync flow diagram."
  },
  {
    id: "agent-workspace-hub",
    name: "Unified Agent Campaign Workspace",
    badge: "v2.0 Active",
    category: "Core Platform",
    icon: Briefcase,
    accent: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-950/10",
    purpose: "Dedicated workspace environment featuring live campaign management, GTM intakes, report generation, and dialer controls.",
    userBenefits: "Centralizes agent productivity in a single high-performance workspace with non-destructive session exit routing.",
    techSpecs: "`WorkspaceContent` module, sub-navigation router, isolated session state manager.",
    mediaReqs: "Workspace sidebar interface preview, exit workspace routing animation, tab switcher breakdown."
  },
  {
    id: "chrome-extension-assistant",
    name: "Dealflow AI Chrome Extension (Sales & RevOps Assistant)",
    category: "Outreach & Communication",
    badge: "v1.0 Active",
    icon: Globe,
    accent: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/10",
    purpose: "Browser side-panel assistant for real-time lead context extraction, prospect profile enrichment, and 1-click pipeline sync on LinkedIn, HubSpot, and Salesforce.",
    userBenefits: "Empowers sales reps to capture uncommitted prospect drafts directly from web pages, trigger automated AI follow-ups, and auto-sync to PocketBase & Supabase.",
    techSpecs: "Manifest V3, background service worker (`background.js`), DOM content script injector (`content.js`), PocketBase 5-minute transient draft sync API hook.",
    mediaReqs: "Chrome extension side panel preview, 1-click lead capture button, real-time sync status indicator."
  }
];

// Interactive Wren AI Live Query Simulator Component
function WrenAiSimulator() {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const samplePrompts = [
    {
      query: "Show all GTM playbooks by status",
      intent: "Filter playbooks by operational status",
      sqlOutput: "SELECT status, COUNT(*) FROM gtm_playbooks GROUP BY status;",
      resultSummary: "3 Playbooks Active · 1 Draft · 0 Archived",
      details: [
        { name: "Acme Enterprise SaaS", status: "Active", score: "94/100" },
        { name: "TechSolutions Cloud Migration", status: "Active", score: "88/100" },
        { name: "FinTech Compliance Suite", status: "Draft", score: "91/100" }
      ]
    },
    {
      query: "List customers with no playbook yet",
      intent: "Identify pipeline bottlenecks",
      sqlOutput: "SELECT customerId, name FROM customers WHERE playbookId IS NULL;",
      resultSummary: "2 Customers Pending Playbook Generation",
      details: [
        { name: "Global Logistics Corp", status: "Intake Submitted", score: "82/100" },
        { name: "HealthTech Innovations", status: "Review Required", score: "79/100" }
      ]
    },
    {
      query: "What are the top channels recommended across playbooks?",
      intent: "Aggregate GTM channel strategy distribution",
      sqlOutput: "SELECT channel, COUNT(*) FROM playbook_channels GROUP BY channel ORDER BY count DESC;",
      resultSummary: "Top 3 Channels: Outbound LinkedIn (85%), Cold Email (78%), Executive Events (62%)",
      details: [
        { name: "Outbound LinkedIn & InMail", status: "85% Usage", score: "Rank #1" },
        { name: "Personalized Cold Email", status: "78% Usage", score: "Rank #2" },
        { name: "Executive Briefing Events", status: "62% Usage", score: "Rank #3" }
      ]
    },
    {
      query: "Show GTM intakes from the last 7 days",
      intent: "Track recent lead intake volume",
      sqlOutput: "SELECT * FROM gtm_intakes WHERE createdAt >= NOW() - INTERVAL 7 DAY;",
      resultSummary: "14 Intakes Processed · 100% Validation Passed",
      details: [
        { name: "DataScale AI", status: "Completed", score: "96/100" },
        { name: "CyberGuard Systems", status: "Completed", score: "92/100" }
      ]
    }
  ];

  const currentPrompt = samplePrompts[selectedPromptIndex];

  const handleSelectPrompt = (index: number) => {
    setIsExecuting(true);
    setSelectedPromptIndex(index);
    setTimeout(() => {
      setIsExecuting(false);
    }, 400);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-fuchsia-500/30 bg-slate-950/80 backdrop-blur-xl space-y-6 shadow-2xl shadow-fuchsia-950/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Wren AI Query Simulator
              <span className="text-[10px] font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 rounded-full px-2 py-0.5">
                Live Interactive Demo
              </span>
            </h4>
            <p className="text-xs text-slate-400">Select a prompt below to see how Wren AI translates natural language into structured database intelligence.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono">
          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span>Latency: ~42ms</span>
        </div>
      </div>

      {/* Query Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPrompt(idx)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all text-left flex items-center gap-2 ${
              selectedPromptIndex === idx
                ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-500/25"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300 shrink-0" />
            <span>&ldquo;{p.query}&rdquo;</span>
          </button>
        ))}
      </div>

      {/* Output Console Simulation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs overflow-hidden">
        {isExecuting ? (
          <div className="flex items-center justify-center py-10 space-x-3 text-fuchsia-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-sans font-medium text-sm">Wren AI parsing natural language query & generating execution plan...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-fuchsia-400 font-bold">
                <Terminal className="h-4 w-4" /> User Query: &quot;{currentPrompt.query}&quot;
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{currentPrompt.intent}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-slate-300 overflow-x-auto">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 font-sans">Generated Database Query Plan</p>
              <code className="text-emerald-400">{currentPrompt.sqlOutput}</code>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Execution Result Summary</p>
              <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-xl text-fuchsia-300 font-sans text-xs font-bold flex items-center justify-between">
                <span>{currentPrompt.resultSummary}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">200 OK</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans">
              {currentPrompt.details.map((d, i) => (
                <div key={i} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{d.name}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{d.status}</span>
                    <span className="text-fuchsia-400 font-bold">{d.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Interactive Dealflow Meeting Bot Scenario Simulator Component
function DealflowBotSimulator() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const scenarios = [
    {
      id: "sales-client",
      title: "Sales & Client Call",
      badge: "Deal Velocity",
      focus: "Real-time objection handling, pricing inquiry logging & CRM stage advancement",
      transcriptSnippet: "Prospect: 'We like the features, but budget approval takes 3 weeks.' -> Bot: Logged objection 'Budget Delay', generated ROI justification slide deck link.",
      actionPlan: [
        "1. Send automated ROI One-Pager within 15 minutes",
        "2. Advance CRM Stage from Qualification to Negotiation",
        "3. Schedule executive sponsor follow-up for Thursday"
      ],
      momStatus: "MOM HTML Document Generated · 15-Min Email Queue Active",
      winAlignment: "94.2% Benchmark Match"
    },
    {
      id: "standup",
      title: "Internal Team Standup",
      badge: "Team Alignment",
      focus: "Blocker extraction, action item routing & daily sprint goal tracking",
      transcriptSnippet: "Engineer: 'Auth API integration is blocked by CORS policy.' -> Bot: Created JIRA ticket #ENG-402, assigned priority P1 to Lead Architect.",
      actionPlan: [
        "1. Dispatch daily standup summary matrix to #revenue-ops Slack channel",
        "2. Auto-tag assigned owners on CORS policy resolution task",
        "3. Update Sprint velocity board"
      ],
      momStatus: "Standup Summary Email Dispatched to 8 Team Members",
      winAlignment: "98.0% Action Tracking Accuracy"
    },
    {
      id: "onboarding",
      title: "Customer Onboarding",
      badge: "Time to Value",
      focus: "Milestone verification, tech stack readiness & setup guide dispatch",
      transcriptSnippet: "Client: 'We need BYOK API key setup for compliance.' -> Bot: Initialized Dealflow Connect BYOK key vault, sent step-by-step RSA/AES guide.",
      actionPlan: [
        "1. Provisions BYOK encryption credits on Customer Integration Hub",
        "2. Triggers automated SSO & SAML setup workflow",
        "3. Schedules 14-day check-in call with Customer Success"
      ],
      momStatus: "Onboarding Roadmap & MOM Sent to Client Admin",
      winAlignment: "96.5% Onboarding Completion Rate"
    },
    {
      id: "closing",
      title: "Deal Closing Call",
      badge: "Revenue Closing",
      focus: "Legal risk analysis, discount thresholds & autonomous contract trigger",
      transcriptSnippet: "VP Procurement: 'If you match 15% annual discount, we sign today.' -> Bot: Evaluated discount tier against deal margin threshold (Passed), generated e-sign link.",
      actionPlan: [
        "1. Auto-generate DocuSign Contract with 15% annual tier applied",
        "2. Update Deal Status to Closed-Won in Salesforce CRM",
        "3. Dispatch 15-Minute Executive MOM & Sign-Off Confirmation"
      ],
      momStatus: "Closed-Won MOM Document Dispatched to C-Suite",
      winAlignment: "99.1% High-Impact Deal Alignment"
    }
  ];

  const current = scenarios[selectedScenarioIndex];

  const handleSelectScenario = (index: number) => {
    setIsProcessing(true);
    setSelectedScenarioIndex(index);
    setTimeout(() => {
      setIsProcessing(false);
    }, 350);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-teal-500/30 bg-slate-950/80 backdrop-blur-xl space-y-6 shadow-2xl shadow-teal-950/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Dealflow Meeting Bot Scenario Engine
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full px-2 py-0.5">
                Live Scenario Adaptation
              </span>
            </h4>
            <p className="text-xs text-slate-400">Select any call scenario to see how Dealflow Bot dynamically adapts speech analysis, action plans, and MOM email dispatching.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono">
          <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
          <span>Alignment Score: {current.winAlignment}</span>
        </div>
      </div>

      {/* Scenario Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((sc, idx) => (
          <button
            key={sc.id}
            onClick={() => handleSelectScenario(idx)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all text-left flex items-center gap-2 ${
              selectedScenarioIndex === idx
                ? "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/25"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-300 shrink-0" />
            <span>{sc.title}</span>
          </button>
        ))}
      </div>

      {/* Output Console Simulation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs overflow-hidden">
        {isProcessing ? (
          <div className="flex items-center justify-center py-10 space-x-3 text-teal-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-sans font-medium text-sm">Dealflow LLM adapting scenario model parameters...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                <Bot className="h-4 w-4" /> Active Mode: {current.title}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{current.focus}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-slate-300 overflow-x-auto">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 font-sans">Live Transcript Reasoning &amp; Extraction</p>
              <code className="text-teal-300">{current.transcriptSnippet}</code>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Data-Driven Action Plan (Historical Win Pattern Derived)</p>
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl text-teal-200 font-sans text-xs space-y-1">
                {current.actionPlan.map((act, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span>{act}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-[11px] font-sans">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-400" />
                <span>{current.momStatus}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Auto-Dispatched</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Interactive Chrome Extension Lead Capture & Sync Simulator Component
function ChromeExtensionSimulator() {
  const [activeTab, setActiveTab] = useState<"linkedin" | "hubspot" | "salesforce">("linkedin");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  const targets = {
    linkedin: {
      platform: "LinkedIn Sales Navigator",
      profileName: "Sarah Jenkins",
      role: "VP Revenue Operations at CloudScale Inc",
      company: "CloudScale Inc",
      signal: "Hiring 5 Enterprise AEs · Active in SaaS Growth",
      extractedData: {
        email: "s.jenkins@cloudscale.io",
        intentScore: "94/100",
        recommendedAction: "Send ROI One-Pager + Schedule 15-min Discovery",
        transientDraftId: "pb_draft_9921_linkedin"
      }
    },
    hubspot: {
      platform: "HubSpot CRM",
      profileName: "David Vance",
      role: "Head of Growth at FinTech Flow",
      company: "FinTech Flow",
      signal: "MQL Stage · Visited Pricing Page 4x Today",
      extractedData: {
        email: "david@fintechflow.com",
        intentScore: "88/100",
        recommendedAction: "Trigger Dealflow Meeting Bot Pre-Call Training",
        transientDraftId: "pb_draft_9922_hubspot"
      }
    },
    salesforce: {
      platform: "Salesforce Lightning",
      profileName: "Elena Rostova",
      role: "Chief Commercial Officer at Apex Tech",
      company: "Apex Tech",
      signal: "Deal Stage: Negotiation · Contract Review",
      extractedData: {
        email: "elena.rostova@apextech.com",
        intentScore: "96/100",
        recommendedAction: "Generate Custom Dealflow LLM Executive Summary",
        transientDraftId: "pb_draft_9923_salesforce"
      }
    }
  };

  const current = targets[activeTab];

  const handleCapture = () => {
    setIsCapturing(true);
    setCaptured(false);
    setTimeout(() => {
      setIsCapturing(false);
      setCaptured(true);
    }, 400);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-slate-950/80 backdrop-blur-xl space-y-6 shadow-2xl shadow-amber-950/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Dealflow AI Chrome Extension Assistant
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
                Manifest V3 Active
              </span>
            </h4>
            <p className="text-xs text-slate-400">Capture prospect context &amp; sync transient drafts to PocketBase/Supabase with 1 click directly from your browser.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono">
          <Activity className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>Sync Status: 5-Min Sync Pipeline Ready</span>
        </div>
      </div>

      {/* Target Platform Selector */}
      <div className="flex flex-wrap gap-2">
        {(["linkedin", "hubspot", "salesforce"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCaptured(false); }}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 capitalize ${
              activeTab === tab
                ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/25"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span>{targets[tab].platform}</span>
          </button>
        ))}
      </div>

      {/* Extension Side-Panel Simulation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-xs">{current.platform} Active Page Injection</span>
          </div>
          <Button
            onClick={handleCapture}
            disabled={isCapturing}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm"
          >
            {isCapturing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            {isCapturing ? "Extracting..." : "1-Click Lead Capture"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-sans">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Detected Web Profile</p>
            <p className="text-sm font-bold text-white">{current.profileName}</p>
            <p className="text-xs text-amber-300">{current.role}</p>
            <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">{current.signal}</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-sans">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Dealflow AI Intelligence</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Extracted Email:</span>
              <span className="text-amber-400 font-mono font-bold">{current.extractedData.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Intent Score:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{current.extractedData.intentScore}</span>
            </div>
            <p className="text-xs text-slate-300 pt-1">
              <span className="text-slate-400 font-bold">Action:</span> {current.extractedData.recommendedAction}
            </p>
          </div>
        </div>

        {captured && (
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 font-sans text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Draft saved to PocketBase transient storage (`{current.extractedData.transientDraftId}`) · Auto-syncing to Supabase Primary Store</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Synced</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturesContent() {
  const { features, loading, error } = useFeatures();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setIsTimedOut(false);
    }
  }, [loading]);

  const filteredFeatures = (features || []).filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...FEATURE_CATEGORIES];

  if (error || (loading && isTimedOut)) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="flex justify-center mb-4">
          <IconAlertObjection className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isTimedOut ? "Request Timed Out" : "Unable to load features"}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isTimedOut ? "The features directory took too long to respond. Please try reloading." : error}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
          Try again
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
        <p className="mt-4 text-slate-400 animate-pulse font-medium">Loading Dealflow.ai capabilities...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-teal-600/5 dark:bg-teal-600/10 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 border-b border-slate-200 dark:border-white/5">
        <div className="max-w-5xl mx-auto text-center px-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 text-xs font-semibold uppercase tracking-wider mb-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
            <span>Autonomous AI Sales & Business Workforce Architecture</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight"
          >
            An Autonomous AI Workforce That{" "}
            <span className="bg-gradient-to-r from-fuchsia-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Executes End-to-End
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            DealFlow.ai doesn&apos;t just recommend what your business should do &mdash; it actually does the work. Discover prospects, join sales calls as an AI human rep, negotiate within boundaries, close deals, and execute agreed requirements.
          </motion.p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/portal/customer/login?signup=true">
              <Button size="lg" className="h-12 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/20">
                Deploy AI Workforce <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/book-demo">
              <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-semibold">
                Schedule Strategy Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Architecture Cards Section */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">The Core Systems</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Our platform is built upon four foundational technologies working in perfect synchronization to power intelligent revenue operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {CORE_ARCHITECTURE.map((core, idx) => (
            <motion.div
              key={core.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative p-8 rounded-3xl border border-slate-200 ${core.borderColor} bg-slate-50 dark:bg-slate-900 transition-all duration-500 overflow-hidden flex flex-col justify-between`}
            >
              {/* Card visual accent glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-slate-100 dark:bg-white/5 ${core.accent} border border-slate-200 dark:border-white/10 transition-transform duration-300 group-hover:scale-110`}>
                    <core.icon className="h-8 w-8" />
                  </div>
                  <Badge className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10">v2.4 Stable</Badge>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{core.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-6">{core.definition}</p>

                <div className="space-y-4 border-t border-slate-200 dark:border-white/5 pt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Key Capabilities</h4>
                  <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    {core.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${core.accent}`} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Integration & Synergy</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{core.synergy}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Tangible Business Impact</h4>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium leading-relaxed">{core.benefit}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURE SPOTLIGHT: DEALFLOW AI CHROME EXTENSION (SALES & REVOPS ASSISTANT) ─ */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Globe className="h-4 w-4" />
              <span>Feature Spotlight: Browser Extension Integration</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dealflow AI Chrome Extension (Sales &amp; RevOps Assistant)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Extract prospect intelligence, capture uncommitted lead drafts, and trigger 1-click pipeline sync on LinkedIn, HubSpot, and Salesforce without leaving your browser tab.
            </p>
          </div>

          {/* Interactive Chrome Extension Simulator */}
          <ChromeExtensionSimulator />
        </div>
      </section>

      {/* ── FEATURE SPOTLIGHT: CHATBOT (WREN AI / GENBI AGENT) ───────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Feature Spotlight: Conversational Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Chatbot (Wren AI / GenBI Agent)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Ask business questions in natural language. Wren AI instantly converts your intent into structured Firestore database queries and executes live analytics without manual SQL writing.
            </p>
          </div>

          {/* Interactive Live Query Simulator */}
          <WrenAiSimulator />

          {/* 3 Step-by-Step Deal Management Use Cases */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Deal Management Use Cases</h3>
              <p className="text-xs text-slate-400">How Wren AI transforms daily sales workflows for agents and revenue leaders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Lead Qualification & Intake Analysis",
                  desc: "Ask 'Show me new B2B leads from the last 48 hours with quality scores above 85.' Wren AI queries Firestore intakes, aggregates metrics, and returns prioritized call lists instantly.",
                  icon: Users,
                  color: "text-fuchsia-400",
                  borderColor: "border-fuchsia-500/30",
                  bgColor: "bg-fuchsia-950/10"
                },
                {
                  step: "02",
                  title: "Real-time Playbook Status Inspection",
                  desc: "Ask 'List customers with active playbooks lacking video avatars.' Wren AI cross-references GTM playbook documents, pinpointing content gaps so agents can trigger asset creation.",
                  icon: FileText,
                  color: "text-indigo-400",
                  borderColor: "border-indigo-500/30",
                  bgColor: "bg-indigo-950/10"
                },
                {
                  step: "03",
                  title: "Outreach & Conversion Diagnostics",
                  desc: "Ask 'Which channels generated the highest meeting booking rates this week?' Wren AI computes channel performance analytics across SMS, Email, and Voice in under 50ms.",
                  icon: TrendingUp,
                  color: "text-cyan-400",
                  borderColor: "border-cyan-500/30",
                  bgColor: "bg-cyan-950/10"
                }
              ].map((useCase) => (
                <div key={useCase.step} className={`p-6 rounded-3xl border ${useCase.borderColor} ${useCase.bgColor} backdrop-blur-xl space-y-3 relative overflow-hidden`}>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-slate-900 ${useCase.color} border border-slate-800`}>
                      <useCase.icon className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-extrabold font-mono text-slate-700 dark:text-slate-600">{useCase.step}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{useCase.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Integration Architecture & Visual Asset Requirements Callouts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Integration */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-fuchsia-400" /> Technical Integration Architecture
              </h4>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <span><strong>Endpoint &amp; Handler:</strong> Interfaces via `/api/agent/genbi-chat` (POST payload &#123; prompt: string &#125;), calling schema-aware Firestore query resolvers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <span><strong>Role-Based Security:</strong> Enforces Clawpatrol firewall rules, preventing cross-tenant data leaks and redacting confidential lead PII automatically.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <span><strong>Universal Accessibility:</strong> Integrated across Customer Portal, Agent Portal, and Agent Campaign Workspace tabs.</span>
                </li>
              </ul>
            </div>

            {/* Visual Asset Requirements & Media Callouts */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-400" /> Visual Assets &amp; Demonstration Media
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-teal-400">Interactive Playground</p>
                  <p className="text-[11px] text-slate-400">Live query chip simulation widget embedded in product documentation.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-indigo-400">Workflow Infographics</p>
                  <p className="text-[11px] text-slate-400">NL-to-Firestore translation pipeline diagrams and schema mappers.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-fuchsia-400">UI Screen Previews</p>
                  <p className="text-[11px] text-slate-400">High-resolution previews of Chatbot (Wren AI) in Agent and Customer portals.</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="font-bold text-cyan-400">Demo Video Callouts</p>
                  <p className="text-[11px] text-slate-400">End-to-end 30-second walkthrough showing real-time query execution.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SPOTLIGHT: UNIVERSAL DEALFLOW MEETING BOT ───────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Feature Spotlight: Universal Meeting Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Universal Dealflow Meeting Bot
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Powered by our pre-trained Dealflow LLM, the Dealflow Meeting Bot autonomously handles client sales calls, internal team standups, customer onboarding, and deal-closing meetings with scenario-aware speech analysis and 15-minute automated MOM dispatches.
            </p>
          </div>

          {/* Interactive Live Scenario Simulator */}
          <DealflowBotSimulator />

          {/* Core Functionalities & Value Propositions Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Core Capabilities &amp; Enterprise Value</h3>
              <p className="text-xs text-slate-400">Four pillar functionalities powering autonomous meeting management and deal execution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Scenario Adaptation",
                  desc: "Dynamically adjusts dialogue patterns, data collection parameters, and risk criteria to fit sales calls, standups, onboarding, or deal closing sessions.",
                  icon: Brain,
                  color: "text-teal-400",
                  borderColor: "border-teal-500/30",
                  bgColor: "bg-teal-950/10"
                },
                {
                  title: "Data-Driven Action Plans",
                  desc: "Synthesizes live transcript insights with historical CRM win records to output high-probability next steps and automate low-complexity decisions.",
                  icon: TrendingUp,
                  color: "text-cyan-400",
                  borderColor: "border-cyan-500/30",
                  bgColor: "bg-cyan-950/10"
                },
                {
                  title: "15-Min MOM Dispatch",
                  desc: "Generates executive-ready HTML Minutes of Meeting documents and automatically mails them to all meeting participants within 15 minutes of call end.",
                  icon: FileText,
                  color: "text-indigo-400",
                  borderColor: "border-indigo-500/30",
                  bgColor: "bg-indigo-950/10"
                },
                {
                  title: "Dealflow Connect (BYOK)",
                  desc: "Customer Portal integration enabling BYOK API key storage (AES-256 encrypted), credit balance management, calendar bot invitations, and pre-call bot training.",
                  icon: Shield,
                  color: "text-violet-400",
                  borderColor: "border-violet-500/30",
                  bgColor: "bg-violet-950/10"
                }
              ].map((cap, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border ${cap.borderColor} ${cap.bgColor} backdrop-blur-xl space-y-3 relative overflow-hidden flex flex-col justify-between`}>
                  <div>
                    <div className={`p-3 rounded-2xl bg-slate-900 ${cap.color} border border-slate-800 w-fit mb-3`}>
                      <cap.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{cap.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{cap.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Capability #{idx + 1}</span>
                    <span className={cap.color}>Production Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Portal & Customer Portal Workflow Integration Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-400" /> Agent Portal Integration Hub
              </h4>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Real-Time Intelligence:</strong> Processes post-call reports, user analytics, and stakeholder feedback directly inside the Agent Workspace.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Autonomous Execution:</strong> Executes low-complexity deal decisions (CRM stage update, discount tier check) during or after calls.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>91%+ Benchmark Alignment:</strong> Proven against 100 historical call benchmarks for maximum conversion efficiency.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-cyan-400" /> Customer Integration &amp; Training Hub
              </h4>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>BYOK &amp; Credit Management:</strong> Bring your own API key (OpenAI/Anthropic/DeepSeek) encrypted with AES-256 with live credit tracking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Calendar Bot Invitation:</strong> Paste any Google Meet, Zoom, or Teams link to invite Dealflow Bot to join and record meeting insights.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Pre-Call Bot Training:</strong> Provide custom instructions, tone preferences, or product guidelines on or before the call to prime bot behavior.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENTLY DEPLOYED PLATFORM IMPLEMENTATIONS ───────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            <span>Platform Release Inventory</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">
            Recently Deployed Implementations
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Complete inventory of newly completed platform features, security upgrades, and revenue workspace tools deployed in the DealFlow system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RECENT_IMPLEMENTATIONS.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border ${item.borderColor} ${item.bgColor} backdrop-blur-xl flex flex-col justify-between space-y-5 hover:scale-[1.01] transition-transform duration-300`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-slate-900/80 ${item.accent} border border-slate-800`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <Badge className="bg-slate-900 text-slate-200 border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                    {item.badge}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{item.purpose}</p>
                </div>

                <div className="space-y-2 border-t border-slate-800/60 pt-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-300 block mb-0.5">User Benefits:</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{item.userBenefits}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-300 block mb-0.5">Technical Specs:</span>
                    <p className="text-slate-500 font-mono text-[10px] leading-relaxed">{item.techSpecs}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{item.category}</span>
                <span className={item.accent}>Verified Production</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Explorer Section */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-slate-200 dark:border-white/5 pb-12 mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Capabilities Directory</h2>
            <p className="text-slate-600 dark:text-slate-400">Filter and explore the complete standard suite of DealFlow.AI modules.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
              <Input 
                placeholder="Search modules..." 
                className="pl-11 w-full bg-slate-100/50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-teal-500/50 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === "All" ? null : cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    (selectedCategory === cat || (cat === "All" && !selectedCategory))
                      ? "bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20"
                      : "bg-slate-100/50 dark:bg-white/3 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((f, i) => {
              const Icon = getIconComponent(f.iconName);
              return (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Card className="h-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
                    <CardHeader className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400 transition-all group-hover:bg-teal-500 group-hover:text-white group-hover:scale-105 border border-teal-500/20">
                          <Icon className="h-5 w-5" />
                        </div>
                        {f.isNew && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5">New</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                        {f.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {f.description}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <IconChipPlatform className="h-3.5 w-3.5 text-teal-500/70" />
                          {f.category}
                        </div>
                        {f.version && (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-600 font-semibold">
                            v{f.version}.0
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-6 border-b border-slate-200 dark:border-white/5">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Unmatched Accuracy",
              desc: "Our integrated validation layer ensures 99.9% factual accuracy in all AI-driven customer interactions.",
              icon: IconAwardRoi,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-100 dark:bg-amber-400/10",
              borderColor: "dark:border-amber-500/10"
            },
            {
              title: "Infinite Scalability",
              desc: "Deploy thousands of autonomous agents simultaneously across multiple timezones and languages.",
              icon: IconLaunchGtm,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-100 dark:bg-emerald-400/10",
              borderColor: "dark:border-emerald-500/10"
            },
            {
              title: "Data Intelligence",
              desc: "Leverage vector-based semantic search and intelligent data integration for deep lead understanding.",
              icon: IconTargetAccount,
              color: "text-sky-600 dark:text-sky-400",
              bg: "bg-sky-100 dark:bg-sky-400/10",
              borderColor: "dark:border-sky-500/10"
            }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 ${item.borderColor} hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-white/15 transition-all duration-300`}
            >
              <div className={`p-3 rounded-2xl w-fit mb-6 ${item.bg} ${item.color} border border-slate-200 dark:border-white/5`}>
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modern Redesigned CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 text-center">
        <div className="relative p-12 md:p-20 rounded-[2.5rem] border border-teal-500/20 bg-gradient-to-b from-teal-500/10 via-background/80 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.08),transparent_50%)] pointer-events-none" />
          
          <div className="relative max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">Why leading teams choose DealFlow.ai</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              {[
                { label: "Revenue Growth", value: "40%", desc: "Increase in velocity" },
                { label: "Cost Reduction", value: "65%", desc: "Lower overheads" },
                { label: "Agent Response", value: "< 2s", desc: "Instant interactions" },
                { label: "Data Accuracy", value: "100%", desc: "Secure & compliant" }
              ].map((stat, i) => (
                <div key={stat.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15">
                  <div className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">{stat.value}</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-0.5">{stat.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-500">{stat.desc}</div>
                </div>
              ))}
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/book-demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-xl bg-teal-500 hover:bg-teal-450 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all hover:-translate-y-0.5"
                >
                  Schedule Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/book-demo?trial=true" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 rounded-xl border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/3 text-slate-850 dark:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
                >
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        </div>
      }>
        <FeaturesContent />
      </Suspense>
    </div>
  );
}
