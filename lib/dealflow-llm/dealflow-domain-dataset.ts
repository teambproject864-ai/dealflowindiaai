// DealFlow LLM Master Domain Knowledge Dataset
// Covers 100% of DealFlow domain knowledge across 9 clusters

export interface DealflowKnowledgeEntry {
  id: string;
  cluster: 
    | 'core_business_logic'
    | 'operational_workflows'
    | 'terminology_definitions'
    | 'user_roles_rbac'
    | 'platform_features_agents'
    | 'integration_capabilities'
    | 'stakeholder_personas'
    | 'troubleshooting_edge_cases'
    | 'security_runbooks_specs';
  subDomain: string;
  title: string;
  questionKeywords: string[];
  groundTruthAnswer: string;
  keyConcepts: string[];
  processSteps?: string[];
  personaContext?: 'sales' | 'operations' | 'executive' | 'client';
}

export const DEALFLOW_DOMAIN_DATASET: DealflowKnowledgeEntry[] = [
  // ==========================================
  // CLUSTER 1: CORE BUSINESS LOGIC & ARCHITECTURE
  // ==========================================
  {
    id: 'C1_001',
    cluster: 'core_business_logic',
    subDomain: 'GTM Lifecycle',
    title: 'Autonomous Go-to-Market (GTM) Deal Flow Lifecycle',
    questionKeywords: ['gtm', 'lifecycle', 'deal flow', 'autonomous', 'stages', 'funnel', 'lead flow'],
    groundTruthAnswer: 'DealFlow AI automates the end-to-end B2B revenue pipeline across 5 key stages: 1. Autonomous Prospecting & ICP Matching (lead discovery and scoring), 2. Live Multimodal Engagement (WebRTC SIP Voice Call Bot & WhatsApp Agent), 3. Real-Time Qualification & Intent Analysis (BANT + MEDDPICC criteria assessment), 4. Autonomous Deliverable Generation (personalized pitch decks, ICP playbooks, and post-call briefing notes), and 5. Bi-Directional CRM Synchronization & Pipeline Analytics (HubSpot, Salesforce, and Firestore real-time state sync).',
    keyConcepts: ['ICP Matching', 'BANT', 'MEDDPICC', 'WebRTC Voice Agent', 'Bi-Directional CRM Sync', 'Autonomous Deliverables'],
    processSteps: [
      'Lead Intake via Webhook or WhatsApp',
      'Voice Call Bot Initiated via WebRTC SIP',
      'Real-Time Transcript Analysis & Intent Scoring',
      'Post-Call CRM Update & Deliverable Dispatch',
      'Follow-Up Automation & Scheduling'
    ]
  },
  {
    id: 'C1_002',
    cluster: 'core_business_logic',
    subDomain: 'Deal Scoring Engine',
    title: 'Deal Scoring and Intent Quantification Engine',
    questionKeywords: ['deal scoring', 'intent score', 'algorithm', 'quantification', 'lead qualification', 'bant'],
    groundTruthAnswer: 'The DealFlow Deal Scoring Engine computes a composite Intent Score between 0.0 and 1.0 using four weighted signals: 1. Keyword Pain Point Frequency (30% weight: mentions of bottleneck, manual tracking, high seat costs), 2. Engagement Velocity (25% weight: call duration, response latency, prompt interaction count), 3. Qualification Criteria Match (25% weight: Budget confirmed, Authority verified, Need aligned, Timeline specified), and 4. Sentiment & Objection Resolution Ratio (20% weight: sentiment trajectory during live conversation). Leads with score >= 0.70 are categorized as Highly Qualified (Sales Ready).',
    keyConcepts: ['Intent Score', 'Weighted Scoring Matrix', 'Pain Point Frequency', 'Engagement Velocity', 'Qualification Threshold'],
  },
  {
    id: 'C1_003',
    cluster: 'core_business_logic',
    subDomain: 'Autonomous Pipeline Architecture',
    title: 'DealFlow System Architecture & Component Interactions',
    questionKeywords: ['architecture', 'system design', 'components', 'next.js', 'python agent service', 'orchestration'],
    groundTruthAnswer: 'DealFlow AI relies on a hybrid microservices architecture: 1. Next.js 14 App Router frontend and Node.js RAG API gateway, 2. Python Agent Service handling real-time WebRTC SIP voice streaming (PyAV, NumPy VAD, ElevenLabs/OpenAI TTS), 3. OKF (Omni-Knowledge Framework) & Unified RAG Pipeline routing queries through HuggingFace, Nvidia NIM, and Kimi LLM backends, 4. Memory Palace (MemPalace) & Context Graph for cross-session long-term memory, and 5. Firebase/Firestore real-time event bus for state updates across UI components.',
    keyConcepts: ['Next.js App Router', 'Python Agent Service', 'OKF Pipeline', 'Memory Palace', 'Context Graph', 'Firebase Event Bus'],
  },

  // ==========================================
  // CLUSTER 2: OPERATIONAL WORKFLOWS & PLAYBOOKS
  // ==========================================
  {
    id: 'C2_001',
    cluster: 'operational_workflows',
    subDomain: 'Post-Call Summary & Briefing Dispatch',
    title: 'Automated Post-Call Digest & Briefing Generation Workflow',
    questionKeywords: ['post-call', 'summary', 'digest', 'briefing', 'email dispatch', 'follow up', 'crm update'],
    groundTruthAnswer: 'Immediately following a live voice call, DealFlow AI triggers an automated post-call workflow: 1. LeadQualifier extracts contact metadata, pain points, capabilities discussed, objections raised, next actions, and risk flags; 2. A structured CallSummary JSON is generated and persisted to Firestore; 3. Bi-directional CRM sync updates the opportunity stage in HubSpot/Salesforce; 4. post-call-email generator compiles a customized HTML briefing email with next-step calendar links; 5. daily-email-scheduler enqueues executive summaries for sales leadership.',
    keyConcepts: ['LeadQualifier', 'CallSummary JSON', 'CRM Opportunity Stage', 'Post-Call Email Generator', 'Daily Scheduler'],
    processSteps: [
      'Voice Call Termination',
      'Lead Qualifier Transcript Extraction',
      'CallSummary JSON Persistence',
      'CRM Bi-Directional Sync',
      'Personalized Briefing Email Generation & Send'
    ]
  },
  {
    id: 'C2_002',
    cluster: 'operational_workflows',
    subDomain: 'GTM Strategy & ICP Playbook Generator',
    title: 'GTM Playbook & Ideal Customer Profile (ICP) Generation Workflow',
    questionKeywords: ['gtm playbook', 'icp generator', 'campaign generator', 'strategy options', 'deliverable builder'],
    groundTruthAnswer: 'The GTM Playbook Engine generates bespoke operational strategies in 4 steps: 1. Target industry & company size selection via UI or API; 2. icp-document-generator constructs detailed ICP matrices including target personas, value propositions, and objection matrix; 3. campaign-generator designs multi-channel sequence campaigns (email, phone script, WhatsApp); 4. deliverable-builder packages the strategy into interactive PDF/Markdown artifacts accessible via the DealFlow portal.',
    keyConcepts: ['ICP Matrix', 'GTM Engine', 'Multi-Channel Campaign', 'Deliverable Builder', 'Interactive Portal Artifacts'],
  },
  {
    id: 'C2_003',
    cluster: 'operational_workflows',
    subDomain: 'Daily Digest & Executive Scheduler',
    title: 'Daily Digest & Executive Reporting Workflow',
    questionKeywords: ['daily digest', 'scheduler', 'executive reporting', 'email scheduler', 'analytics summary'],
    groundTruthAnswer: 'The daily-email-scheduler runs on a automated cron schedule to compile account activity: 1. Queries all call summaries and CRM stage movements from the last 24 hours; 2. Computes aggregate metrics (total calls, qualification rate, pipeline velocity, at-risk flags); 3. Generates executive markdown/HTML digests; 4. Dispatches scheduled summaries to leadership, sales ops, and account managers.',
    keyConcepts: ['Daily Email Scheduler', 'Cron Execution', 'Aggregate Pipeline Metrics', 'At-Risk Escalation'],
  },

  // ==========================================
  // CLUSTER 3: TERMINOLOGY & DEFINITIONS
  // ==========================================
  {
    id: 'C3_001',
    cluster: 'terminology_definitions',
    subDomain: 'OKF Framework',
    title: 'Omni-Knowledge Framework (OKF)',
    questionKeywords: ['okf', 'omni-knowledge framework', 'okf pipeline', 'unified rag', 'knowledge retrieval'],
    groundTruthAnswer: 'Omni-Knowledge Framework (OKF) is DealFlow AI\'s unified knowledge orchestration engine. It integrates multi-source document ingestion, hybrid vector embeddings (Pinecone/local storage), graph-based entity retrieval (Graph RAG), and semantic caching to deliver contextually precise answers to LLM prompts with minimal latency.',
    keyConcepts: ['OKF', 'Hybrid Vector Embeddings', 'Graph RAG', 'Semantic Cache', 'Context Enrichment'],
  },
  {
    id: 'C3_002',
    cluster: 'terminology_definitions',
    subDomain: 'Memory Palace (MemPalace)',
    title: 'Memory Palace (MemPalace) Long-Term Memory Architecture',
    questionKeywords: ['mempalace', 'memory palace', 'long-term memory', 'cross-session memory', 'context graph'],
    groundTruthAnswer: 'Memory Palace (MemPalace) is DealFlow AI\'s persistent long-term memory system. It indexes structured lead profiles, past interaction transcripts, prospect preferences, and organizational context into an interconnected graph store (lib/mempalace.ts), enabling agents to recall historical context across multiple calls and channels seamlessly.',
    keyConcepts: ['MemPalace', 'Persistent Long-Term Memory', 'Interconnected Graph Index', 'Cross-Session Context'],
  },
  {
    id: 'C3_003',
    cluster: 'terminology_definitions',
    subDomain: 'FAPO & MAO Architecture',
    title: 'FAPO (Feedback-Aware Prompt Optimization) & MAO (Multi-Agent Orchestrator)',
    questionKeywords: ['fapo', 'mao', 'multi-agent orchestrator', 'prompt optimization', 'feedback loop'],
    groundTruthAnswer: 'FAPO (Feedback-Aware Prompt Optimization) dynamically adjusts LLM system prompts based on downstream call outcome signals (e.g., objection rate, call length). MAO (Multi-Agent Orchestrator) coordinates specialized sub-agents (Qualifying Agent, Technical Specialist, Pricing Agent, Closing Agent) during live interactions to ensure optimal response selection.',
    keyConcepts: ['FAPO', 'MAO', 'Feedback Loop', 'Sub-Agent Routing', 'Specialized AI Roles'],
  },
  {
    id: 'C3_004',
    cluster: 'terminology_definitions',
    subDomain: 'Veritas Firewall & HermeS Router',
    title: 'Veritas Security Firewall & HermeS AI Provider Router',
    questionKeywords: ['veritas', 'firewall', 'hermes', 'ai provider router', 'security protection', 'model fallback'],
    groundTruthAnswer: 'Veritas Firewall (lib/security-firewall.ts) is DealFlow\'s real-time prompt injection, PII redaction, and policy enforcement shield. HermeS (lib/ai-provider-router.ts) is the high-availability AI router that load-balances requests across HuggingFace, Nvidia NIM, and Kimi with sub-100ms automatic fallback routing upon API errors.',
    keyConcepts: ['Veritas Firewall', 'HermeS Router', 'Prompt Injection Shield', 'PII Redaction', 'Sub-100ms Fallback'],
  },

  // ==========================================
  // CLUSTER 4: USER ROLES & RBAC SECURITY
  // ==========================================
  {
    id: 'C4_001',
    cluster: 'user_roles_rbac',
    subDomain: 'Role Hierarchy & Permissions',
    title: 'DealFlow Role-Based Access Control (RBAC) Hierarchy',
    questionKeywords: ['rbac', 'user roles', 'permissions', 'admin', 'sales rep', 'operations manager', 'client'],
    groundTruthAnswer: 'DealFlow AI enforces a 4-tier strict RBAC model: 1. Admin: Full system control, API key configuration, model provider management, global audit logs, user management; 2. Operations Manager: Workflow configuration, GTM playbook creation, prompt tuning, integration setup, team analytics; 3. Sales Rep: Account management, live call supervision, lead review, manual CRM overrides, post-call email dispatch; 4. Client/Prospect: Read-only portal access for viewing shared deliverables, pitch decks, and proposal documents.',
    keyConcepts: ['Admin', 'Operations Manager', 'Sales Rep', 'Client Portal', 'Granular Permissions', 'Scope Enforcement'],
  },
  {
    id: 'C4_002',
    cluster: 'user_roles_rbac',
    subDomain: 'API Key Scoping & Security Middleware',
    title: 'API Key Scope Isolation & Auth Middleware Enforcement',
    questionKeywords: ['api key', 'auth middleware', 'security', 'requireauth', 'scope isolation', 'rate limiting'],
    groundTruthAnswer: 'All API routes (including RAG, Call Bot, and CRM sync endpoints) are protected by requireAuth (lib/auth.ts) and rate-limiter middleware. API keys carry explicit permission scopes (read:leads, write:campaigns, admin:config). Unauthorized requests are rejected immediately with HTTP 401 or HTTP 403 status codes and logged to audit-logger.ts.',
    keyConcepts: ['requireAuth', 'Scoped API Keys', 'Rate Limiting Middleware', 'HTTP 401/403 Enforcement', 'Audit Logging'],
  },

  // ==========================================
  // CLUSTER 5: PLATFORM FEATURES & AI AGENTS
  // ==========================================
  {
    id: 'C5_001',
    cluster: 'platform_features_agents',
    subDomain: 'Live Voice Call Bot',
    title: 'Python WebRTC SIP Live Voice Call Bot Engine',
    questionKeywords: ['call bot', 'webrtc', 'sip client', 'voice agent', 'stt', 'tts', 'barge-in'],
    groundTruthAnswer: 'The Python Call Bot (python-agent-service/call_bot) delivers low-latency conversational voice calls via WebRTC SIP: 1. WebRTCSIPSession handles 16kHz/48kHz PCM audio streaming; 2. StreamingSTTProcessor calculates RMS audio energy for VAD and transcribes speech; 3. StreamingLLMOrchestrator streams response tokens in real-time; 4. StreamingTTSProcessor uses ElevenLabs or local synthetic TTS; 5. Supports instant barge-in interruption by flushing outbound audio queues upon detected user speech.',
    keyConcepts: ['WebRTCSIPSession', 'VAD RMS Energy', 'Streaming STT/TTS', 'Barge-In Queue Flushing', 'Sub-500ms Audio Latency'],
    processSteps: [
      'WebRTC Audio Frame Ingestion',
      'Voice Activity Detection (VAD) & Energy Calculation',
      'Real-Time Speech-to-Text Streaming',
      'LLM Token Generation Stream',
      'Text-to-Speech Streaming & Outbound Audio Queue',
      'Barge-in Monitoring & Immediate Queue Flush on Interruption'
    ]
  },
  {
    id: 'C5_002',
    cluster: 'platform_features_agents',
    subDomain: 'Custom WhatsApp Agent',
    title: 'Autonomous WhatsApp Conversational GTM Agent',
    questionKeywords: ['whatsapp', 'whatsapp bot', 'custom agent', 'messaging agent', 'websocket', 'conversational gtm'],
    groundTruthAnswer: 'The WhatsApp Agent (python-agent-service/whatsapp) provides interactive text-based sales qualification over WhatsApp/WebSocket: 1. Operates a state machine workflow tracking lead onboarding, business discovery, and meeting booking; 2. Persists conversation history in SQLite/Firestore; 3. Synchronizes lead attributes directly with the central CRM and unified RAG database.',
    keyConcepts: ['WhatsApp State Machine', 'WebSocket Handler', 'SQLite/Firestore Sync', 'Autonomous Onboarding'],
  },
  {
    id: 'C5_003',
    cluster: 'platform_features_agents',
    subDomain: 'Interactive 3D Portal & Deliverable Builder',
    title: 'Immersive 3D Portal & Campaign Deliverable Builder',
    questionKeywords: ['3d portal', 'deliverable builder', 'immersive dashboard', 'campaign generator', 'visualizer'],
    groundTruthAnswer: 'The Interactive 3D Portal (lib/immersive3d) provides visual representations of GTM pipelines, lead intent heatmaps, and deal stage progression. deliverable-builder.ts renders downloadable PDF, HTML, and Markdown assets containing bespoke ICP research, outbound playbooks, and ROI impact calculators.',
    keyConcepts: ['3D Pipeline Visualization', 'Intent Heatmaps', 'Deliverable Builder', 'Bespoke PDF/MD Assets'],
  },

  // ==========================================
  // CLUSTER 6: INTEGRATION CAPABILITIES
  // ==========================================
  {
    id: 'C6_001',
    cluster: 'integration_capabilities',
    subDomain: 'CRM Bi-Directional Sync',
    title: 'HubSpot & Salesforce Bi-Directional CRM Synchronization',
    questionKeywords: ['crm sync', 'hubspot', 'salesforce', 'crm-store', 'cross-system-sync', 'bi-directional'],
    groundTruthAnswer: 'DealFlow AI features bi-directional CRM integration (lib/crm-store.ts, lib/cross-system-sync.ts, python-agent-service/call_bot/crm_sync.py). It pushes real-time call summary metrics, deal intent scores, and pain points to Contacts, Companies, and Deals in HubSpot/Salesforce, while pulling updated lead contact details and stage updates back into DealFlow.',
    keyConcepts: ['Bi-Directional CRM Sync', 'HubSpot API', 'Salesforce REST', 'Deal Intent Sync', 'Stage Mapping'],
  },
  {
    id: 'C6_002',
    cluster: 'integration_capabilities',
    subDomain: 'Multimodal AI & Telephony Providers',
    title: 'ElevenLabs, HeyGen, Twilio, and LLM Provider Integrations',
    questionKeywords: ['elevenlabs', 'heygen', 'twilio', 'huggingface', 'nvidia nim', 'kimi', 'llm router'],
    groundTruthAnswer: 'DealFlow AI integrates best-in-class third-party services: 1. Telephony: Twilio SIP Trunking & WebRTC Media Streams; 2. Speech Synthesis: ElevenLabs Streaming WebSockets; 3. Avatar Video: HeyGen API (lib/heygen.ts); 4. LLM Providers: HuggingFace Inference API (lib/huggingface.ts), Nvidia NIM Nemotron (lib/nvidia.ts), and Kimi API (lib/kimi.ts), managed with zero-downtime provider fallback.',
    keyConcepts: ['Twilio SIP', 'ElevenLabs Streaming', 'HeyGen Video', 'HuggingFace', 'Nvidia NIM', 'Kimi API'],
  },

  // ==========================================
  // CLUSTER 7: STAKEHOLDER PERSONAS & SCENARIOS
  // ==========================================
  {
    id: 'C7_001',
    cluster: 'stakeholder_personas',
    subDomain: 'Sales Representative Scenario',
    title: 'Sales Rep Persona: Live Supervision & Prospect Follow-Up',
    questionKeywords: ['sales rep', 'sales team', 'live supervision', 'follow up', 'deal closing', 'objection handling'],
    personaContext: 'sales',
    groundTruthAnswer: 'For Sales Representatives, DealFlow AI acts as a 24/7 autonomous SDR and co-pilot: it conducts initial discovery calls, qualifies leads against BANT criteria, captures specific prospect pain points, flags compliance/budget objections, populates CRM fields automatically, and draft customized briefing notes so reps can enter closing calls fully prepared.',
    keyConcepts: ['Autonomous SDR', 'Pre-Call Intelligence', 'Objection Flagging', 'Automated CRM Population'],
  },
  {
    id: 'C7_002',
    cluster: 'stakeholder_personas',
    subDomain: 'Operations Staff Scenario',
    title: 'Operations Manager Persona: Workflow Tuning & Integration Management',
    questionKeywords: ['operations staff', 'ops manager', 'workflow tuning', 'integration management', 'prompt configuration'],
    personaContext: 'operations',
    groundTruthAnswer: 'For Operations Managers, DealFlow AI provides centralized workflow controls: configuring GTM playbook options (gtm-strategy-options.ts), tuning LLM prompt routing rules in HermeS, inspecting API key scope security, monitoring vector index health via vector-monitor.ts, and scheduling daily digest emails.',
    keyConcepts: ['Centralized Workflow Control', 'GTM Strategy Options', 'Vector Index Monitoring', 'System Health Dashboards'],
  },
  {
    id: 'C7_003',
    cluster: 'stakeholder_personas',
    subDomain: 'Executive & Leadership Scenario',
    title: 'Executive & Leadership Persona: ROI Analytics & Pipeline Forecasting',
    questionKeywords: ['management', 'executive', 'leadership', 'roi analytics', 'pipeline forecasting', 'gtm performance'],
    personaContext: 'executive',
    groundTruthAnswer: 'For Executives and Sales Leadership, DealFlow AI delivers high-level operational visibility: real-time intent score analytics, aggregate conversion rates, team velocity metrics, risk flags for deal loss, and scheduled daily executive digests detailing top opportunities and revenue trajectory.',
    keyConcepts: ['Intent Analytics', 'Pipeline Velocity', 'Risk Flag Detection', 'Executive Digest Reports'],
  },
  {
    id: 'C7_004',
    cluster: 'stakeholder_personas',
    subDomain: 'Client & Prospect Scenario',
    title: 'Client & External Prospect Persona: Seamless Interactive Experience',
    questionKeywords: ['client', 'prospect', 'external user', 'customer portal', 'pitch deck', 'transparent experience'],
    personaContext: 'client',
    groundTruthAnswer: 'For Clients and Prospects, DealFlow AI offers a friction-free experience: instant phone/WhatsApp response without waiting for sales availability, clear explanations of product capabilities, transparent objection responses, and immediate access to personalized playbooks and pricing quotes via the secure Client Portal.',
    keyConcepts: ['Friction-Free Prospect Experience', 'Instant Response Time', 'Personalized Playbooks', 'Client Portal Access'],
  },

  // ==========================================
  // CLUSTER 8: TECHNICAL TROUBLESHOOTING & EDGE CASES
  // ==========================================
  {
    id: 'C8_001',
    cluster: 'troubleshooting_edge_cases',
    subDomain: 'Voice Call SIP Disconnect & Recovery',
    title: 'Troubleshooting SIP Connection Drops & Audio Buffer Underflow',
    questionKeywords: ['troubleshooting', 'sip drop', 'disconnect', 'audio underflow', 'vad noise', 'call bot failure'],
    groundTruthAnswer: 'If a WebRTC SIP call experiences network instability or connection drops: 1. WebRTCSIPSession detects socket termination or keepalive timeout (>3 seconds); 2. Inbound audio frame buffer falls back to synthetic VAD energy evaluation; 3. Session status transitions to reconnecting or graceful disconnected; 4. Call transcript collected up to disconnection is saved to Firestore; 5. LeadQualifier processes partial transcript so no prospect data is lost.',
    keyConcepts: ['Keepalive Timeout Detection', 'Synthetic VAD Fallback', 'Graceful State Transition', 'Partial Transcript Recovery'],
    processSteps: [
      'Detect Socket Termination or Keepalive Timeout',
      'Mark Session Reconnecting/Disconnected',
      'Save Partial Transcript to Storage',
      'Run Lead Qualification on Available Partial Transcript',
      'Notify Sales Rep of Connection Interruption'
    ]
  },
  {
    id: 'C8_002',
    cluster: 'troubleshooting_edge_cases',
    subDomain: 'AI Provider Outage & Failover',
    title: 'Troubleshooting Primary LLM Provider API Errors (HTTP 429/500)',
    questionKeywords: ['llm outage', 'rate limit', 'http 429', 'provider failure', 'hermes failover', 'fallback router'],
    groundTruthAnswer: 'When a primary LLM provider (e.g. HuggingFace) encounters HTTP 429 rate limits or 5xx server errors: 1. HermeS Provider Router (lib/ai-provider-router.ts) catches the error immediately; 2. Automatically routes request to secondary provider (Nvidia NIM Nemotron or Kimi API) in under 100ms; 3. Increments error counter and logs failure to audit-logger.ts; 4. Retries primary provider after exponential backoff cooling period.',
    keyConcepts: ['Sub-100ms Provider Failover', 'HermeS Router', 'Exponential Backoff', 'Circuit Breaker Pattern'],
  },

  // ==========================================
  // CLUSTER 9: SECURITY RUNBOOKS & PROCESS SPECS
  // ==========================================
  {
    id: 'C9_001',
    cluster: 'security_runbooks_specs',
    subDomain: 'Veritas Security & Prompt Injection Protection',
    title: 'Veritas Security Firewall Runbook & Prompt Injection Shield',
    questionKeywords: ['veritas firewall', 'prompt injection', 'security runbook', 'pii redaction', 'sanitization', 'jailbreak'],
    groundTruthAnswer: 'Veritas Firewall (lib/security-firewall.ts) enforces enterprise security: 1. Pre-execution input sanitization detecting prompt injection vectors, jailbreak attempts, and system prompt override patterns; 2. Automatic PII redaction (SSN, credit card, confidential credentials) prior to sending data to third-party LLM APIs; 3. Post-execution response filtering ensuring model outputs comply with safety and brand guidelines.',
    keyConcepts: ['Veritas Firewall', 'Prompt Injection Detection', 'PII Redaction', 'Output Safety Filtering', 'Security Runbook'],
  },
  {
    id: 'C9_002',
    cluster: 'security_runbooks_specs',
    subDomain: 'Audit Logging & Data Privacy Compliance',
    title: 'Audit Logging, SOC2 Compliance, and Data Anonymization',
    questionKeywords: ['audit log', 'soc2', 'compliance', 'data privacy', 'anonymization', 'security-audit-report'],
    groundTruthAnswer: 'DealFlow AI logs every API interaction, authentication event, prompt execution, and CRM update to audit-logger.ts and security-audit-report.ts. All logs contain timestamps, user ID, IP address, action scope, and status code. Customer data stored in Firestore is encrypted at rest (AES-256) and in transit (TLS 1.3).',
    keyConcepts: ['Audit Logger', 'AES-256 Encryption at Rest', 'TLS 1.3 in Transit', 'SOC2 Compliance Audit'],
  }
];
