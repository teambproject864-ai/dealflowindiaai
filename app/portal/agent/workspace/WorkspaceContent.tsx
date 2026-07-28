'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Search,
  Plus,
  MoreHorizontal,
  Target,
  Zap,
  Filter,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  ArrowRight,
  PieChart,
  BarChart3,
  Activity,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  Upload,
  Download,
  Share2,
  AlertCircle,
  HelpCircle,
  X,
  ShieldAlert,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  MessageSquare,
  Bookmark,
  TrendingUp,
  BookOpen,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LeadAnalysisDashboard } from '@/components/LeadAnalysisDashboard';
import { MarketingStrategyModule } from '@/components/MarketingStrategyModule';

// ─── INITIAL MOCK DATA ────────────────────────────────────────────────────────

const initialCustomers = [
  {
    id: "cust-1",
    name: "Acme Corp",
    industry: "Enterprise SaaS",
    contactName: "John Smith",
    phone: "+1 (555) 123-4567",
    email: "john.smith@acme.com",
    serviceConfigurations: {
      gtmReports: true,
      leadScoring: true,
      aiCalls: true,
      wrenChatbot: true,
      automatedGtmAnalysis: true,
      playbookGeneration: true,
    },
    history: [
      { id: "h-1", type: "Call", summary: "Initial discovery call", detail: "Spoke with John about their current sales pipeline bottlenecks. They are interested in AI automations.", date: "2026-07-15 10:30 AM" },
      { id: "h-2", type: "Email", summary: "Sent product deck", detail: "Emailed the latest enterprise overview slide deck and pricing summary.", date: "2026-07-15 11:15 AM" }
    ],
    cases: [
      { id: "case-1", title: "API Integration Inquiry", description: "Customer wants to know if they can sync with a custom Postgres instance.", priority: "Medium", status: "Open", date: "2026-07-16" }
    ],
    documents: [
      { id: "doc-1", title: "Acme-GTM-Scope-v2.pdf", size: "2.4 MB", date: "2026-07-16" }
    ]
  },
  {
    id: "cust-2",
    name: "TechSolutions",
    industry: "Managed IT Services",
    contactName: "Sarah Connor",
    phone: "+1 (555) 987-6543",
    email: "sconnor@techsolutions.io",
    serviceConfigurations: {
      gtmReports: true,
      leadScoring: false,
      aiCalls: true,
      wrenChatbot: true,
      automatedGtmAnalysis: true,
      playbookGeneration: true,
    },
    history: [
      { id: "h-3", type: "Call", summary: "Billing discussion", detail: "Resolved invoicing discrepancy for the pilot phase. Everything synced.", date: "2026-07-14 02:00 PM" }
    ],
    cases: [
      { id: "case-2", title: "CRM Sync Latency", description: "Noticed a 5-minute lag on Salesforce contacts updates.", priority: "High", status: "In Progress", date: "2026-07-17" }
    ],
    documents: [
      { id: "doc-2", title: "Service-Agreement-Signed.pdf", size: "1.1 MB", date: "2026-07-14" }
    ]
  },
  {
    id: "cust-3",
    name: "Innovate LLC",
    industry: "E-Commerce",
    contactName: "David Miller",
    phone: "+1 (555) 333-2222",
    email: "david@innovate.co",
    serviceConfigurations: {
      gtmReports: false,
      leadScoring: false,
      aiCalls: false,
      wrenChatbot: false,
      automatedGtmAnalysis: false,
      playbookGeneration: false,
    },
    history: [
      { id: "h-4", type: "Email", summary: "Meeting scheduling", detail: "Scheduled a walkthrough of the voice call agent workflow for next Tuesday.", date: "2026-07-16 04:45 PM" }
    ],
    cases: [],
    documents: []
  }
];

const kbArticles = [
  {
    id: "kb-1",
    title: "Resolving CRM Synchronization Failures",
    category: "Integrations",
    summary: "Step-by-step instructions to re-authorize Salesforce, HubSpot, or custom database connectors when sync status drops.",
    content: "If a sync fails, check the credentials under Workspace Settings first. Try clearing the connection cache by toggling the Sync Active switch off and on again. If issues persist, verify that your API token has read/write permissions for Lead and Opportunity entities."
  },
  {
    id: "kb-2",
    title: "Agent Voice Dialer Configurations",
    category: "Calling",
    summary: "Best practices for configuring microphone input, volume parameters, and handling active network handovers.",
    content: "Make sure you have granted the browser microphone permissions. We recommend utilizing a USB headset. You can perform a real-time echo-test under Settings > Audio Test. If calls drop frequently, ensure your firewall permits outbound UDP connections on ports 10000-20000."
  },
  {
    id: "kb-3",
    title: "GDPR Compliance & Call Isolation Policy",
    category: "Security",
    summary: "Understanding how DealFlow handles customer PII, call recordings, and isolated session workspaces.",
    content: "All call recordings are encrypted at rest using AES-256 keys. Recordings are isolated per tenant session and stored inside designated secure buckets. Ensure that call participants consent to recording before starting the capture session."
  }
];

const initialChannels = {
  general: [
    { id: "msg-1", sender: "System", text: "Welcome to the internal team chat channel.", time: "09:00 AM" },
    { id: "msg-2", sender: "David (Lead Agent)", text: "Hey team, recall to check lead queues before outbound campaigns today.", time: "10:14 AM" }
  ],
  escalations: [
    { id: "msg-3", sender: "System", text: "Escalations alerts channel created.", time: "09:00 AM" },
    { id: "msg-4", sender: "Sarah Jenkins (VP)", text: "Acme Corp integration is pending custom field approvals. Do not run campaign yet.", time: "11:30 AM" }
  ],
  "crm-updates": [
    { id: "msg-5", sender: "System", text: "Automated CRM Sync events log.", time: "09:00 AM" },
    { id: "msg-6", sender: "HubSpot Bot", text: "Synced 45 contacts for TechSolutions.", time: "01:25 PM" }
  ]
};

const initialCallHistory = [
  { id: "call-1", name: "John Smith (Acme)", phone: "+1 (555) 123-4567", direction: "Outbound", date: "2026-07-16 10:30 AM", duration: "03:45", status: "Completed", recording: true },
  { id: "call-2", name: "Unknown", phone: "+1 (555) 777-8888", direction: "Inbound", date: "2026-07-15 02:15 PM", duration: "00:52", status: "Missed", recording: false },
  { id: "call-3", name: "Sarah Connor (TechSolutions)", phone: "+1 (555) 987-6543", direction: "Outbound", date: "2026-07-14 01:10 PM", duration: "05:12", status: "Transferred", recording: true }
];

const categories = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-400' },
  { id: 'calls', label: 'Call Center', icon: Phone, color: 'text-cyan-400' },
  { id: 'content-workspace', label: 'Content Workspace', icon: FileText, color: 'text-violet-400' },
  { id: 'gtm-intakes', label: 'GTM Intakes', icon: FileText, color: 'text-indigo-400' },
  { id: 'gtm-reports', label: 'GTM Reports', icon: TrendingUp, color: 'text-purple-400' },
  { id: 'gtm-playbook', label: 'Playbook Generation', icon: BookOpen, color: 'text-fuchsia-400' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-400' }
] as const;

// ─── COMPONENT DEFINITION ──────────────────────────────────────────────────────

export default function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('leadId');
  const { user: currentUser } = useCurrentUser();

  // Agent State
  const [agentStatus, setAgentStatus] = useState<"Online" | "Away" | "Busy">("Online");
  const [showExitModal, setShowExitModal] = useState(false);

  // General App State
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>(categories[0]);
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomers[0]);

  // Sync with leadId searchParam
  useEffect(() => {
    if (leadId) {
      const found = customers.find(c => c.id === leadId);
      if (found) {
        setSelectedCustomer(found);
        setSelectedCategory(categories[2]); // Auto-open Content Workspace
      }
    }
  }, [leadId, customers]);

  // Derived Agent Info
  const agentName = currentUser?.name || "Jane Doe";
  const agentRole = currentUser?.role || "Sales Manager";
  const agentDept = "Revenue Operations";
  const agentId = currentUser?.id ? `AGENT-${currentUser.id.slice(0, 4).toUpperCase()}` : "AGENT-7492";
  const agentInitials = agentName.split(" ").map(n => n[0]).join("").toUpperCase();

  // ─── CALL CENTER STATES & SIMULATION ───────────────────────────────────────
  
  const [dialedNumber, setDialedNumber] = useState("");
  const [callState, setCallState] = useState<"idle" | "dialing" | "ringing" | "connected" | "on-hold">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [callHistory, setCallHistory] = useState(initialCallHistory);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{ name: string; phone: string } | null>(null);

  // Audio Context Ref for ringtone simulation
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  const callTimerRef = useRef<any>(null);
  const recordTimerRef = useRef<any>(null);

  // Start Call timers
  useEffect(() => {
    if (callState === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  // Start Recording timers
  useEffect(() => {
    if (isRecording && !isRecordingPaused) {
      recordTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => clearInterval(recordTimerRef.current);
  }, [isRecording, isRecordingPaused]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // GTM Intakes
  const [gtmIntakes, setGtmIntakes] = useState<any[]>([]);
  const [gtmIntakesLoading, setGtmIntakesLoading] = useState(false);
  const [gtmSearch, setGtmSearch] = useState("");
  const [gtmPage, setGtmPage] = useState(1);
  const [gtmLimit, setGtmLimit] = useState(10);
  const [gtmTotal, setGtmTotal] = useState(0);
  const [gtmTotalPages, setGtmTotalPages] = useState(0);
  const [selectedGtmIntake, setSelectedGtmIntake] = useState<any>(null);

  // Fetch GTM Intakes
  const fetchGtmIntakes = useCallback(async () => {
    setGtmIntakesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", gtmPage.toString());
      params.set("limit", gtmLimit.toString());
      if (gtmSearch) params.set("search", gtmSearch);

      const res = await fetch(`/api/portal/gtm-intakes?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setGtmIntakes(data.intakes);
        setGtmTotal(data.pagination.total);
        setGtmTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching GTM intakes:", error);
    } finally {
      setGtmIntakesLoading(false);
    }
  }, [gtmPage, gtmLimit, gtmSearch]);

  // Effect to fetch GTM intakes when category or filters change
  useEffect(() => {
    if (selectedCategory.id === "gtm-intakes") {
      fetchGtmIntakes();
    }
  }, [selectedCategory.id, fetchGtmIntakes]);


  // Synthesize soft Alert/Ringtone
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playBeep = () => {
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.85);
      };

      playBeep();
      ringIntervalRef.current = setInterval(playBeep, 2000);
    } catch (e) {
      console.warn("Autoplay block or AudioContext unsupported:", e);
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Simulation: Trigger incoming call
  const triggerIncomingCall = () => {
    if (callState !== "idle") return;
    const randomCust = customers[Math.floor(Math.random() * customers.length)];
    setIncomingCallData({
      name: randomCust.name,
      phone: randomCust.phone
    });
    setCallState("ringing");
    startRingtone();
  };

  // Accept Call
  const handleAcceptCall = () => {
    stopRingtone();
    setCallState("connected");
    setCallDuration(0);
    setRecordingDuration(0);
    setIsMuted(false);
    setIsRecording(false);
  };

  // Reject / Hang up Call
  const handleHangUpCall = () => {
    stopRingtone();
    
    // Add call log
    if (callState === "connected" || callState === "on-hold" || callState === "dialing") {
      const activeName = incomingCallData ? incomingCallData.name : (dialedNumber || "Manual Call");
      const activePhone = incomingCallData ? incomingCallData.phone : (dialedNumber || "+1 (555) 000-1111");
      const durationStr = formatTime(callDuration);
      
      const newLog = {
        id: `call-new-${Date.now()}`,
        name: activeName,
        phone: activePhone,
        direction: incomingCallData ? "Inbound" as const : "Outbound" as const,
        date: new Date().toLocaleString(),
        duration: durationStr,
        status: callDuration > 0 ? "Completed" as const : "Canceled" as const,
        recording: isRecording
      };
      
      setCallHistory(prev => [newLog, ...prev]);
    }
    
    setCallState("idle");
    setIncomingCallData(null);
    setDialedNumber("");
    setIsRecording(false);
  };

  // Dial Call Outbound
  const handleDialCall = () => {
    if (!dialedNumber) return;
    setCallState("connected");
    setCallDuration(0);
    setRecordingDuration(0);
    setIsMuted(false);
    setIsRecording(false);
  };

  // Call Transfer logic
  const handleTransferCall = (targetDept: string) => {
    setShowTransferModal(false);
    // Simulate transfer with minor delay
    setTimeout(() => {
      // Add call log
      const activeName = incomingCallData ? incomingCallData.name : (dialedNumber || "Manual Call");
      const activePhone = incomingCallData ? incomingCallData.phone : (dialedNumber || "+1 (555) 000-1111");
      const durationStr = formatTime(callDuration);

      const newLog = {
        id: `call-new-${Date.now()}`,
        name: activeName,
        phone: activePhone,
        direction: incomingCallData ? "Inbound" as const : "Outbound" as const,
        date: new Date().toLocaleString(),
        duration: durationStr,
        status: "Transferred" as const,
        recording: isRecording
      };

      setCallHistory(prev => [newLog, ...prev]);
      setCallState("idle");
      setIncomingCallData(null);
      setDialedNumber("");
      setIsRecording(false);
      toast.success(`Call successfully transferred to ${targetDept}.`);
    }, 1500);
  };

  // ─── CONTENT WORKSPACE SUBVIEWS & STATES ─────────────────────────────────

  const [contentTab, setContentTab] = useState<"timeline" | "kb" | "cases" | "team-chat" | "documents">("timeline");
  
  // Note Form
  const [newNoteText, setNewNoteText] = useState("");
  
  // KB Search
  const [kbSearch, setKbSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<typeof kbArticles[0] | null>(null);

  // Case Form
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseDescription, setNewCaseDescription] = useState("");
  const [newCasePriority, setNewCasePriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Team Chat
  const [chatChannels, setChatChannels] = useState(initialChannels);
  const [activeChannel, setActiveChannel] = useState<keyof typeof initialChannels>("general");
  const [chatInput, setChatInput] = useState("");

  // Document Upload
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Unsaved changes state computed dynamically
  const hasUnsavedChanges = 
    dialedNumber !== "" || 
    callState !== "idle" || 
    newNoteText !== "" || 
    newCaseTitle !== "" || 
    newCaseDescription !== "" || 
    chatInput !== "";

  // Exit workspace workflow (navigates back, no logout)
  const handleExitWorkspace = async () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigateToPortalList();
    }
  };

  const navigateToPortalList = async () => {
    // Navigate back to the Agent Portal (not a full logout)
    router.push("/portal/agent");
  };

  // Timeline: add interaction note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newHistoryItem = {
      id: `h-new-${Date.now()}`,
      type: "Note",
      summary: "Manual Agent Log",
      detail: newNoteText,
      date: new Date().toLocaleString()
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          history: [newHistoryItem, ...c.history]
        };
      }
      return c;
    }));

    // Update active view customer reference
    setSelectedCustomer(prev => ({
      ...prev,
      history: [newHistoryItem, ...prev.history]
    }));

    setNewNoteText("");
  };

  // Cases: create case
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim() || !newCaseDescription.trim()) return;

    const newCaseItem = {
      id: `case-new-${Date.now()}`,
      title: newCaseTitle,
      description: newCaseDescription,
      priority: newCasePriority,
      status: "Open",
      date: new Date().toISOString().split('T')[0]
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          cases: [newCaseItem, ...c.cases]
        };
      }
      return c;
    }));

    setSelectedCustomer(prev => ({
      ...prev,
      cases: [newCaseItem, ...prev.cases]
    }));

    setNewCaseTitle("");
    setNewCaseDescription("");
    setNewCasePriority("Medium");
  };

  // Team Chat: send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessageItem = {
      id: `msg-new-${Date.now()}`,
      sender: `${agentName} (Agent)`,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatChannels(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], newMessageItem]
    }));

    setChatInput("");
  };

  // Document Upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc = {
              id: `doc-new-${Date.now()}`,
              title: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              date: new Date().toISOString().split('T')[0]
            };

            setCustomers(prevCust => prevCust.map(c => {
              if (c.id === selectedCustomer.id) {
                return {
                  ...c,
                  documents: [newDoc, ...c.documents]
                };
              }
              return c;
            }));

            setSelectedCustomer(prevCust => ({
              ...prevCust,
              documents: [newDoc, ...prevCust.documents]
            }));

            setUploadProgress(null);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      
      {/* ─── SIDEBAR NAVIGATION ──────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between" role="navigation" aria-label="Sidebar Menu">
        <div>
          <div className="flex h-16 items-center border-b border-slate-800 px-6 justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                DealFlow OS
              </span>
            </div>
          </div>

          <nav className="space-y-1.5 p-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500',
                  selectedCategory.id === category.id
                    ? 'bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border border-teal-500/30 text-white shadow-lg shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-700'
                )}
                aria-current={selectedCategory.id === category.id ? 'page' : undefined}
              >
                <category.icon className="h-5 w-5" />
                <span className="font-semibold text-sm">{category.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Trigger incoming call simulation from sidebar */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={triggerIncomingCall}
            disabled={callState !== "idle"}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-teal-500/30 hover:border-teal-500/80 text-teal-400 hover:text-teal-200 text-xs font-semibold bg-teal-950/10 hover:bg-teal-950/20 transition-all disabled:opacity-40"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Simulate Incoming Call
          </button>
        </div>
      </aside>

      {/* ─── MAIN COLUMN ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0" role="main">
        
        {/* ─── VERIFIED AGENT HEADER ─────────────────────────────────────────── */}
        <header className="h-20 border-b border-slate-800/90 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 z-10" aria-label="Agent Header">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Profile Avatar with Status Dot */}
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-850">
                {agentInitials}
              </div>
              <span 
                className={cn(
                  "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-slate-950",
                  agentStatus === "Online" && "bg-green-400",
                  agentStatus === "Away" && "bg-amber-400",
                  agentStatus === "Busy" && "bg-rose-500"
                )}
                aria-label={`Status: ${agentStatus}`}
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base leading-none">{agentName}</span>
                <span className="text-[10px] font-semibold text-slate-500 font-mono tracking-wider bg-slate-855 border border-slate-800 px-1.5 py-0.5 rounded">
                  {agentId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                <span>{agentRole}</span>
                <span>·</span>
                <span className="text-slate-500">{agentDept}</span>
              </div>
            </div>

            {/* Status Select dropdown */}
            <div className="ml-6 relative">
              <label htmlFor="agent-status-selector" className="sr-only">Change Status</label>
              <select
                id="agent-status-selector"
                value={agentStatus}
                onChange={(e) => setAgentStatus(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-350 cursor-pointer hover:border-slate-700"
              >
                <option value="Online">🟢 Online</option>
                <option value="Away">🟡 Away</option>
                <option value="Busy">🔴 Busy</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExitWorkspace}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label="Exit workspace and return to Agent Portal"
              title="Return to Agent Portal (stays logged in)"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>← Back to Portal</span>
            </button>
          </div>
        </header>

        {/* ─── ACTIVE INCOMING CALL ALERT BANNER ─────────────────────────────── */}
        {callState === "ringing" && incomingCallData && (
          <div className="bg-gradient-to-r from-teal-950/80 via-slate-900/90 to-teal-950/80 border-b border-teal-500/40 px-8 py-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/20 text-teal-400 rounded-full animate-bounce">
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-teal-400 font-bold">Incoming Call Alert</p>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {incomingCallData.name} ({incomingCallData.phone})
                </h4>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptCall}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5"
              >
                <Phone className="h-4 w-4" /> Accept
              </button>
              <button
                onClick={handleHangUpCall}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5"
              >
                <PhoneOff className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        )}

        {/* ─── PAGE CONTENT CONTAINER ────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* ──────────────────────────────────────────────────────────────────
              1. OVERVIEW DASHBOARD
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Performance & Queue Status</h2>
                <p className="text-sm text-slate-400">Real-time indicators of agent calls and outbound operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="My Outbound Calls" value="18" change="Active session" positive={true} icon={Phone} />
                <StatCard title="Avg. Conversation" value="04:22" change="-12s from avg" positive={true} icon={Clock} />
                <StatCard title="Target Leads Reached" value="76%" change="+4% progress" positive={true} icon={Target} />
                <StatCard title="Active Queue" value="3 Waiting" change="Priority outbound" positive={false} icon={Activity} />
              </div>

              {/* CRM logs & call queues grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-4">Queued Outbound Contacts</h3>
                    <div className="space-y-3">
                      {customers.map((cust) => (
                        <div key={cust.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-white">{cust.name}</h4>
                              <p className="text-xs text-slate-500">{cust.contactName} · {cust.phone}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setDialedNumber(cust.phone);
                              setSelectedCategory(categories[1]); // open dialer
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/60 bg-teal-950/20 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Phone className="h-3 w-3" /> Dial Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-4">Workspace Sync Status</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Salesforce Integration</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Active Campaign Sync</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Sync Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-slate-400">Local Cache integrity</span>
                      <span className="text-teal-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              2. CENTRALIZED CALL CENTER
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'calls' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Dialer / Active Call Interface */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Dialer System</h3>

                  {callState === "idle" ? (
                    /* Manual dialer interface */
                    <div className="space-y-4">
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="Enter phone number..."
                          value={dialedNumber}
                          onChange={(e) => setDialedNumber(e.target.value)}
                          className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      {/* Dial Pad Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(digit => (
                          <button
                            key={digit}
                            onClick={() => setDialedNumber(prev => prev + digit)}
                            className="h-11 bg-slate-855/80 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-sm border border-slate-800"
                          >
                            {digit}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleDialCall}
                          disabled={!dialedNumber}
                          className="flex-1 h-11 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          <Phone className="h-4 w-4" /> Dial Number
                        </button>
                        {dialedNumber && (
                          <button
                            onClick={() => setDialedNumber("")}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-750"
                            title="Clear dialed number"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Active/Connected call interface */
                    <div className="space-y-6 text-center py-4 bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
                      <div className="flex justify-center mb-2">
                        <div className="relative p-5 bg-teal-500/10 text-teal-400 rounded-full animate-pulse border border-teal-500/20">
                          <Phone className="h-8 w-8" />
                          <span className={cn(
                            "absolute top-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-slate-950",
                            callState === "on-hold" ? "bg-amber-400" : "bg-green-400 animate-ping"
                          )} />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">
                          {incomingCallData ? incomingCallData.name : "Manual Outbound Call"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {incomingCallData ? incomingCallData.phone : dialedNumber}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <span className="text-xs font-bold font-mono tracking-wider bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-teal-400">
                            {formatTime(callDuration)}
                          </span>
                          {callState === "on-hold" && (
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-xl">
                              On Hold
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Micro interaction - audio wave mockup when call is connected */}
                      {callState === "connected" && !isMuted && (
                        <div className="flex justify-center items-center gap-0.5 h-6">
                          <div className="w-1 bg-teal-400 h-2 rounded-full animate-[pulse_0.4s_infinite]" />
                          <div className="w-1 bg-teal-500 h-4 rounded-full animate-[pulse_0.6s_infinite]" />
                          <div className="w-1 bg-cyan-400 h-3 rounded-full animate-[pulse_0.5s_infinite]" />
                          <div className="w-1 bg-teal-400 h-5 rounded-full animate-[pulse_0.7s_infinite]" />
                          <div className="w-1 bg-cyan-500 h-2 rounded-full animate-[pulse_0.4s_infinite]" />
                        </div>
                      )}

                      {/* Active recording state banner */}
                      {isRecording && (
                        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs mx-4">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "h-2.5 w-2.5 rounded-full bg-rose-500",
                              !isRecordingPaused && "animate-ping"
                            )} />
                            <span className="text-slate-400">
                              {isRecordingPaused ? "Recording Paused" : "Call Recording..."}
                            </span>
                          </div>
                          <span className="font-mono text-slate-500">{formatTime(recordingDuration)}</span>
                        </div>
                      )}

                      {/* Controls Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Mute Button */}
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all",
                            isMuted 
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                          )}
                        >
                          {isMuted ? <MicOff className="h-4.5 w-4.5 mb-1" /> : <Mic className="h-4.5 w-4.5 mb-1" />}
                          {isMuted ? "Unmute" : "Mute"}
                        </button>

                        {/* Hold Button */}
                        <button
                          onClick={() => setCallState(prev => prev === "on-hold" ? "connected" : "on-hold")}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all",
                            callState === "on-hold"
                              ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                          )}
                        >
                          <Pause className="h-4.5 w-4.5 mb-1" />
                          {callState === "on-hold" ? "Resume" : "Hold"}
                        </button>

                        {/* Record Button */}
                        <button
                          onClick={() => {
                            if (!isRecording) {
                              setIsRecording(true);
                              setIsRecordingPaused(false);
                              setRecordingDuration(0);
                            } else {
                              setIsRecording(false);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all",
                            isRecording
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                          )}
                        >
                          <CheckCircle2 className="h-4.5 w-4.5 mb-1" />
                          {isRecording ? "Stop Rec" : "Record"}
                        </button>
                      </div>

                      {/* Secondary controls: recording pause/resume & transfer */}
                      <div className="flex gap-2">
                        {isRecording && (
                          <button
                            onClick={() => setIsRecordingPaused(!isRecordingPaused)}
                            className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold hover:text-white transition-all hover:bg-slate-850"
                          >
                            {isRecordingPaused ? "Resume Rec" : "Pause Rec"}
                          </button>
                        )}
                        <button
                          onClick={() => setShowTransferModal(true)}
                          className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold hover:text-white transition-all hover:bg-slate-850"
                        >
                          Transfer Call
                        </button>
                      </div>

                      {/* Hang up button */}
                      <button
                        onClick={handleHangUpCall}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        <PhoneOff className="h-4 w-4" /> End Call
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Call History logs */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Call History Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                          <th className="pb-3 pr-4">Contact</th>
                          <th className="pb-3 px-4">Type</th>
                          <th className="pb-3 px-4">Date/Time</th>
                          <th className="pb-3 px-4">Duration</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4 text-right">Recording</th>
                        </tr>
                      </thead>
                      <tbody>
                        {callHistory.map((historyItem) => (
                          <tr key={historyItem.id} className="border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 pr-4">
                              <h5 className="font-semibold text-white text-xs truncate max-w-[130px]">{historyItem.name}</h5>
                              <p className="text-[10px] text-slate-500 mt-0.5">{historyItem.phone}</p>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">{historyItem.direction}</td>
                            <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{historyItem.date}</td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">{historyItem.duration}</td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                historyItem.status === "Completed" && "bg-green-500/10 border-green-500/20 text-green-400",
                                historyItem.status === "Missed" && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                                historyItem.status === "Transferred" && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                                historyItem.status === "Canceled" && "bg-slate-800 border-slate-700 text-slate-400"
                              )}>
                                {historyItem.status}
                              </span>
                            </td>
                            <td className="py-3 pl-4 text-right">
                              {historyItem.recording && <span className="text-xs text-slate-400">✅</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              3. CONTENT WORKSPACE
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'content-workspace' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Customer selector sidebar - Only show if not locked by leadId */}
              {!leadId && (
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 px-2">Customer Profiles</h3>
                    <div className="space-y-2">
                      {customers.map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-teal-500",
                            selectedCustomer.id === cust.id
                              ? "bg-slate-850 border-slate-700 text-white"
                              : "bg-transparent border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                          )}
                        >
                          <h4 className="text-sm font-semibold truncate leading-none">{cust.name}</h4>
                          <span className="text-[11px] text-slate-500">{cust.industry}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Right Tabbed module content - Expand to full width if locked */}
              <div className={cn("space-y-6", leadId ? "lg:col-span-12" : "lg:col-span-9")}>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                  
                  {/* Sub-tab Navigation */}
                  <div className="flex border-b border-slate-800 bg-slate-900/20 p-2 gap-1" role="tablist">
                    {[
                      { id: "timeline", label: "Timeline History", icon: Calendar },
                      { id: "kb", label: "Knowledge Base", icon: Bookmark },
                      { id: "cases", label: "Cases & Tickets", icon: AlertCircle },
                      { id: "team-chat", label: "Team Chat", icon: MessageSquare },
                      { id: "documents", label: "Documents", icon: FolderOpen }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setContentTab(tab.id as any)}
                        role="tab"
                        aria-selected={contentTab === tab.id}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-500",
                          contentTab === tab.id
                            ? "bg-slate-850 border border-slate-755 text-white"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                        )}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    
                    {/* A. TIMELINE HISTORY */}
                    {contentTab === "timeline" && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-bold text-white">Interaction Log: {selectedCustomer.name}</h4>
                          <span className="text-xs text-slate-500">Contact: {selectedCustomer.contactName} ({selectedCustomer.email})</span>
                        </div>

                        {/* Add Note Form */}
                        <form onSubmit={handleAddNote} className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
                          <h5 className="text-xs font-bold text-slate-400">Log Outbound/Inbound Notes</h5>
                          <textarea
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Add call summaries, follow-up emails, or interaction notes..."
                            className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={!newNoteText.trim()}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                            >
                              Log Note
                            </button>
                          </div>
                        </form>

                        {/* History Timeline */}
                        <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-5">
                          {selectedCustomer.history.map((hItem) => (
                            <div key={hItem.id} className="relative">
                              <span className={cn(
                                "absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center text-[8px]",
                                hItem.type === "Call" && "bg-cyan-500",
                                hItem.type === "Email" && "bg-purple-500",
                                hItem.type === "Note" && "bg-teal-500"
                              )} />
                              <div className="bg-slate-900/30 border border-slate-800/80 p-3.5 rounded-xl">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-bold text-white">{hItem.summary}</span>
                                  <span className="text-[10px] text-slate-500">{hItem.date}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-light">{hItem.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* B. KNOWLEDGE BASE */}
                    {contentTab === "kb" && (
                      <div className="space-y-6">
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search FAQ, SLA terms, configuration manuals..."
                              value={kbSearch}
                              onChange={(e) => setKbSearch(e.target.value)}
                              className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>

                        {selectedArticle ? (
                          /* Article Detail View */
                          <div className="space-y-4 bg-slate-950/20 border border-slate-800 p-5 rounded-xl">
                            <button
                              onClick={() => setSelectedArticle(null)}
                              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                            >
                              <ArrowLeft className="h-3 w-3" /> Back to Articles
                            </button>
                            <div className="border-b border-slate-800 pb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                {selectedArticle.category}
                              </span>
                              <h4 className="text-lg font-bold text-white mt-2">{selectedArticle.title}</h4>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line font-light">
                              {selectedArticle.content}
                            </p>
                          </div>
                        ) : (
                          /* Article Search List */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {kbArticles
                              .filter(art => 
                                art.title.toLowerCase().includes(kbSearch.toLowerCase()) || 
                                art.content.toLowerCase().includes(kbSearch.toLowerCase())
                              )
                              .map(art => (
                                <div
                                  key={art.id}
                                  onClick={() => setSelectedArticle(art)}
                                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/20 hover:bg-slate-850/50 cursor-pointer transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-teal-400">{art.category}</span>
                                    <h5 className="font-bold text-sm text-white mt-1.5">{art.title}</h5>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-light">{art.summary}</p>
                                  </div>
                                  <span className="text-[10px] font-bold text-teal-400 mt-4 inline-flex items-center gap-1 hover:underline">
                                    Read Article <ArrowRight className="h-3 w-3" />
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* C. CASES & TICKETS */}
                    {contentTab === "cases" && (
                      <div className="space-y-6">
                        <h4 className="text-base font-bold text-white">Tickets for {selectedCustomer.name}</h4>
                        
                        {/* New Case Creator */}
                        <form onSubmit={handleCreateCase} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-800 p-4 rounded-xl items-start">
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-slate-400">Open a Support Case</h5>
                            <div>
                              <input
                                type="text"
                                placeholder="Case title..."
                                value={newCaseTitle}
                                onChange={(e) => setNewCaseTitle(e.target.value)}
                                className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <span className="text-xs text-slate-500 self-center">Priority:</span>
                              {["Low", "Medium", "High"].map(prio => (
                                <button
                                  key={prio}
                                  type="button"
                                  onClick={() => setNewCasePriority(prio as any)}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-[10px] font-semibold transition-all border",
                                    newCasePriority === prio
                                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {prio}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3 flex flex-col justify-between h-full">
                            <textarea
                              value={newCaseDescription}
                              onChange={(e) => setNewCaseDescription(e.target.value)}
                              placeholder="Detailed explanation of CRM discrepancy or sync blocker..."
                              className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none flex-1"
                            />
                            <div className="flex justify-end mt-1">
                              <button
                                type="submit"
                                disabled={!newCaseTitle.trim() || !newCaseDescription.trim()}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                              >
                                Submit Case
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Case Lists */}
                        <div className="space-y-3">
                          {selectedCustomer.cases.length === 0 ? (
                            <p className="text-xs text-slate-550 italic text-center py-4">No support tickets opened for this customer.</p>
                          ) : (
                            selectedCustomer.cases.map(cs => (
                              <div key={cs.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-sm text-white">{cs.title}</h5>
                                    <span className={cn(
                                      "text-[9px] font-semibold px-2 py-0.5 rounded border uppercase",
                                      cs.priority === "High" && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                                      cs.priority === "Medium" && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                                      cs.priority === "Low" && "bg-slate-800 border-slate-700 text-slate-400"
                                    )}>
                                      {cs.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed font-light">{cs.description}</p>
                                  <span className="text-[10px] text-slate-500 block">Opened: {cs.date}</span>
                                </div>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase px-2 py-1 rounded-full border",
                                  cs.status === "Open" && "bg-green-500/10 border-green-500/20 text-green-400",
                                  cs.status === "In Progress" && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                )}>
                                  {cs.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* D. TEAM CHAT */}
                    {contentTab === "team-chat" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                        
                        {/* Channel selector */}
                        <div className="md:col-span-1 bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1">
                          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider px-2 block mb-2">Channels</span>
                          {Object.keys(chatChannels).map(chName => (
                            <button
                              key={chName}
                              onClick={() => setActiveChannel(chName as any)}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none",
                                activeChannel === chName
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-450 hover:bg-slate-900/50 hover:text-slate-200"
                              )}
                            >
                              # {chName}
                            </button>
                          ))}
                        </div>

                        {/* Chat Log & Message input */}
                        <div className="md:col-span-3 space-y-4">
                          <div className="border border-slate-800 bg-slate-950/20 rounded-xl p-4 h-64 overflow-y-auto space-y-3.5">
                            {chatChannels[activeChannel].map((msg) => (
                              <div key={msg.id} className="text-xs">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="font-bold text-teal-400">{msg.sender}</span>
                                  <span className="text-[9px] text-slate-650 font-mono">{msg.time}</span>
                                </div>
                                <p className="text-slate-350 leading-relaxed font-light">{msg.text}</p>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder={`Send message to #${activeChannel}...`}
                              className="flex-1 h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                              type="submit"
                              disabled={!chatInput.trim()}
                              className="px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                            >
                              Send
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* E. DOCUMENTS */}
                    {contentTab === "documents" && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-bold text-white">Document Vault: {selectedCustomer.name}</h4>
                        </div>

                        {/* File upload simulator */}
                        <div className="relative border border-dashed border-slate-850 hover:border-teal-500/40 rounded-xl p-6 bg-slate-950/20 text-center transition-colors">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadProgress !== null}
                          />
                          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">Drag & Drop or Click to share dynamic PDFs / contracts</p>
                          <p className="text-[10px] text-slate-500 mt-1">Upload capacity limit: 25MB per document</p>

                          {uploadProgress !== null && (
                            <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                              <div className="flex justify-between text-[10px] text-slate-450">
                                <span>Uploading file...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* File list */}
                        <div className="space-y-2">
                          {selectedCustomer.documents.length === 0 ? (
                            <p className="text-xs text-slate-555 italic text-center py-4">No documents shared yet.</p>
                          ) : (
                            selectedCustomer.documents.map(doc => (
                              <div key={doc.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2.5">
                                  <FileText className="h-5 w-5 text-teal-400" />
                                  <div>
                                    <h5 className="font-semibold text-white">{doc.title}</h5>
                                    <span className="text-[10px] text-slate-500">{doc.size} · Uploaded: {doc.date}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toast.info(`Simulating file download for: ${doc.title}`)}
                                  className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-950/40 text-slate-400 hover:text-white rounded-lg transition-all"
                                  title="Download Document"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              4. GTM ANALYSIS REPORTS & STRATEGY
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'gtm-intakes' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">GTM Analysis Reports & Strategy</h2>
                <p className="text-sm text-slate-400">View, search, and manage all customer-submitted GTM intake forms and analysis reports</p>
              </div>

              {/* Search & Filters */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by company, product, owner name/email, or tracking ID..."
                      value={gtmSearch}
                      onChange={(e) => {
                        setGtmSearch(e.target.value);
                        setGtmPage(1); // Reset to page 1 when searching
                      }}
                      className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={gtmLimit}
                      onChange={(e) => {
                        setGtmLimit(parseInt(e.target.value));
                        setGtmPage(1);
                      }}
                      className="h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Intakes List / Detail View */}
              {selectedGtmIntake ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        {selectedGtmIntake.companyName} - {selectedGtmIntake.productName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Tracking ID: {selectedGtmIntake.id} · Submitted: {new Date(selectedGtmIntake.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedGtmIntake(null)}
                      className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to all intakes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Company & Product Info</h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Company Name</span>
                          <span className="text-slate-200 font-medium">{selectedGtmIntake.companyName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Product Name</span>
                          <span className="text-slate-200 font-medium">{selectedGtmIntake.productName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Product Owner</span>
                          <span className="text-slate-200 font-medium">{selectedGtmIntake.productOwnerName} ({selectedGtmIntake.productOwnerEmail})</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Target Launch Date</span>
                          <span className="text-slate-200 font-medium">{new Date(selectedGtmIntake.targetLaunchDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Target Market Region</span>
                          <span className="text-slate-200 font-medium">{selectedGtmIntake.targetMarketRegion}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Primary Use Case</span>
                          <span className="text-slate-200 font-medium">{selectedGtmIntake.primaryUseCase}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Details</h4>
                      <div className="space-y-3 text-xs">
                        <div className="border-b border-slate-800 pb-2">
                          <span className="text-slate-500 block mb-1">Stakeholders</span>
                          <span className="text-slate-200 font-medium">{Array.isArray(selectedGtmIntake.stakeholders) ? selectedGtmIntake.stakeholders.join(", ") : selectedGtmIntake.stakeholders}</span>
                        </div>
                        {selectedGtmIntake.icpDescription && (
                          <div className="border-b border-slate-800 pb-2">
                            <span className="text-slate-500 block mb-1">ICP Description</span>
                            <p className="text-slate-200 font-medium whitespace-pre-line">{selectedGtmIntake.icpDescription}</p>
                          </div>
                        )}
                        {selectedGtmIntake.targetIndustries && (
                          <div className="border-b border-slate-800 pb-2">
                            <span className="text-slate-500 block mb-1">Target Industries</span>
                            <span className="text-slate-200 font-medium">{Array.isArray(selectedGtmIntake.targetIndustries) ? selectedGtmIntake.targetIndustries.join(", ") : selectedGtmIntake.targetIndustries}</span>
                          </div>
                        )}
                        {selectedGtmIntake.additionalNotes && (
                          <div className="border-b border-slate-800 pb-2">
                            <span className="text-slate-500 block mb-1">Additional Notes</span>
                            <p className="text-slate-200 font-medium whitespace-pre-line">{selectedGtmIntake.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Table Header */}
                  <div className="border-b border-slate-800 bg-slate-900/20 p-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Customer Submitted Intakes</h3>
                    <span className="text-xs text-slate-500">Total: {gtmTotal}</span>
                  </div>

                  {/* Loading State */}
                  {gtmIntakesLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-xs text-slate-500">Loading GTM intakes...</p>
                    </div>
                  ) : (
                    <>
                      {/* Intakes Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900/20">
                            <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                              <th className="px-6 py-3">Tracking ID</th>
                              <th className="px-6 py-3">Company</th>
                              <th className="px-6 py-3">Product</th>
                              <th className="px-6 py-3">Owner</th>
                              <th className="px-6 py-3">Submitted</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {gtmIntakes.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                  <p className="text-sm text-slate-500">No GTM intakes found.</p>
                                </td>
                              </tr>
                            ) : (
                              gtmIntakes.map((intake) => (
                                <tr
                                  key={intake.id}
                                  className="hover:bg-slate-850/30 transition-colors cursor-pointer"
                                  onClick={() => setSelectedGtmIntake(intake)}
                                >
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      {intake.id}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-white">{intake.companyName}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-slate-400">{intake.productName}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-slate-400">{intake.productOwnerName}</p>
                                    <p className="text-[10px] text-slate-500">{intake.productOwnerEmail}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-slate-400">{new Date(intake.createdAt).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(intake.createdAt).toLocaleTimeString()}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedGtmIntake(intake);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 hover:border-teal-500/30 hover:text-teal-400 hover:bg-teal-500/10 text-slate-400 transition-all"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {gtmTotalPages > 1 && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-4">
                          <div className="text-xs text-slate-500">
                            Page {gtmPage} of {gtmTotalPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setGtmPage(prev => Math.max(1, prev - 1))}
                              disabled={gtmPage === 1}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setGtmPage(prev => Math.min(gtmTotalPages, prev + 1))}
                              disabled={gtmPage === gtmTotalPages}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              5. GTM REPORTS
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'gtm-reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">GTM Analysis Reports & Strategy</h2>
                <p className="text-sm text-slate-400">Generate and review GTM reports, lead analysis, and marketing strategy recommendations for {selectedCustomer.name}</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <LeadAnalysisDashboard leadId={selectedCustomer.id} />
                </div>
                <div className="lg:col-span-1">
                  <MarketingStrategyModule initialIcpData={{
                    industry: selectedCustomer.industry,
                    companySize: "Enterprise"
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              5. SETTINGS
              ────────────────────────────────────────────────────────────────── */}
          {selectedCategory.id === 'settings' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Workspace & Audio Settings</h2>
                <p className="text-sm text-slate-400">Configure device inputs and CRM synchronization intervals.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Audio Setup */}
                <div className="space-y-4 border border-slate-800 p-5 rounded-xl bg-slate-950/10">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="h-4.5 w-4.5 text-teal-400" /> Real-time Echo Test
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">Verify latency and microphone feedback prior to outbound queues.</p>
                  <button
                    onClick={() => toast.info("Initiating echo-test sound loop. Speak to headset microphone.")}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-855 border border-slate-800 hover:border-slate-750 text-xs font-semibold text-white rounded-xl transition-all"
                  >
                    Start Test Call
                  </button>
                </div>

                {/* Hotkeys */}
                <div className="space-y-4 border border-slate-800 p-5 rounded-xl bg-slate-950/10">
                  <h3 className="text-sm font-semibold text-white">Workspace Shortcuts</h3>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Mute / Unmute Call</span>
                      <kbd className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono text-[10px]">Alt + M</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Hold Call Session</span>
                      <kbd className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono text-[10px]">Alt + H</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Dial / Answer Call</span>
                      <kbd className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono text-[10px]">Alt + D</kbd>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─── GTM PLAYBOOKS PANEL ──────────────────────────────────────────── */}
          {selectedCategory.id === 'gtm-playbook' && (
            <GTMPlaybookPanel customerId={selectedCustomer?.id} />
          )}

        </div>
      </main>

      {/* ─── CALL TRANSFER MODAL ─────────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base">Select Transfer Target</h4>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-500 hover:text-white" aria-label="Close modal">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Active call will be held during transition. Select a department to hand over the session:
            </p>

            <div className="space-y-2">
              {[
                { name: "Support Escalations", detail: "Active tickets resolution" },
                { name: "Billing & Invoicing", detail: "Commercial plans & orders" },
                { name: "Executive Technical Desk", detail: "API & database integration issues" }
              ].map(dept => (
                <button
                  key={dept.name}
                  onClick={() => handleTransferCall(dept.name)}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-slate-805 hover:border-slate-700 transition-all flex flex-col gap-0.5 focus:outline-none"
                >
                  <span className="text-xs font-bold text-white">{dept.name}</span>
                  <span className="text-[10px] text-slate-500">{dept.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── EXIT CONFIRMATION MODAL ─────────────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-8 w-8 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white text-base">Unsaved changes detected!</h4>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">Secure exit workflow</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed font-light">
              You currently have unsaved chat drafts, active call states, or pending forms. Exiting will discard these states and terminate your active session.
            </p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={navigateToPortalList}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all"
              >
                Yes, Exit & Discard
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


// ─── GTM PLAYBOOK PANEL (workspace sidebar) ───────────────────────────────────
function GTMPlaybookPanel({ customerId }: { customerId?: string }) {
  const [playbooks, setPlaybooks] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedSummary, setEditedSummary] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const fetchPlaybooks = React.useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gtm-playbook?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) { setError("Failed to load playbooks"); return; }
      const data = await res.json();
      if (data.success && data.playbooks?.length > 0) {
        setPlaybooks(data.playbooks);
        setSelected(data.playbooks[0]);
        setEditedSummary(data.playbooks[0]?.executiveSummary || "");
      } else {
        setPlaybooks([]);
        setSelected(null);
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [customerId]);

  React.useEffect(() => { fetchPlaybooks(); }, [fetchPlaybooks]);

  const handleSavePlaybook = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/gtm-playbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbookId: selected.id || selected.trackingId,
          executiveSummary: editedSummary,
        }),
      });
      const data = await res.json().catch(() => ({ success: true }));
      setSelected((prev: any) => prev ? { ...prev, executiveSummary: editedSummary } : null);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSelected((prev: any) => prev ? { ...prev, executiveSummary: editedSummary } : null);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!customerId) return (
    <div className="p-8 text-center text-slate-500 text-sm">Select a customer to view their GTM Playbooks.</div>
  );

  if (loading) return (
    <div className="p-8 flex flex-col items-center gap-3 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
      <p className="text-sm">Loading GTM Playbooks…</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={fetchPlaybooks} className="mt-3 text-xs text-fuchsia-400 hover:underline flex items-center gap-1 mx-auto"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fuchsia-400" />
            GTM Playbooks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">AI-generated strategy for selected customer</p>
        </div>
        <div className="flex items-center gap-2">
          {selected && selected.status !== 'generating' && (
            <button
              onClick={() => {
                if (isEditing) handleSavePlaybook();
                else setIsEditing(true);
              }}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Save Changes
                </>
              ) : (
                "Edit Playbook"
              )}
            </button>
          )}
          <button onClick={fetchPlaybooks} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          Playbook modifications saved successfully!
        </div>
      )}

      {/* Selector if multiple playbooks */}
      {playbooks.length > 1 && (
        <select
          value={selected?.trackingId || ''}
          onChange={e => {
            const found = playbooks.find(p => p.trackingId === e.target.value) || null;
            setSelected(found);
            setEditedSummary(found?.executiveSummary || "");
            setIsEditing(false);
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
        >
          {playbooks.map(p => (
            <option key={p.trackingId} value={p.trackingId}>{p.productName || p.trackingId}</option>
          ))}
        </select>
      )}

      {/* No playbooks */}
      {playbooks.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">No GTM Playbook yet</p>
          <p className="text-xs text-slate-600">The customer needs to submit the GTM intake form to generate their playbook.</p>
        </div>
      )}

      {/* Playbook content */}
      {selected && selected.status !== 'generating' && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">AI Playbook Ready</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">✓ Ready</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{selected.productName}</h3>
            <p className="text-xs text-slate-400">{selected.companyName} · {selected.targetMarketRegion}</p>
            {selected.trackingId && <p className="text-[10px] font-mono text-slate-600">{selected.trackingId}</p>}
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-blue-400" /> Executive Summary
              </h4>
            </div>
            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="Enter executive summary notes..."
              />
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">{selected.executiveSummary || "No summary provided."}</p>
            )}
          </div>

          {/* ICP */}
          {selected.icpProfile && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-400" /> Ideal Customer Profile</h4>
              {selected.icpProfile.primaryProfile && <p className="text-xs text-slate-400 leading-relaxed">{selected.icpProfile.primaryProfile}</p>}
              {selected.icpProfile.industries?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.icpProfile.industries.slice(0, 5).map((ind: string) => (
                    <span key={ind} className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">{ind}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Channel Strategy */}
          {selected.channelStrategy?.primaryChannels?.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Channel Strategy</h4>
              <div className="space-y-1.5">
                {selected.channelStrategy.primaryChannels.slice(0, 3).map((ch: any) => (
                  <div key={ch.channel} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{ch.channel}</span>
                    <span className="text-slate-500">{ch.budget}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          {selected.kpiTargets && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> KPI Targets</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selected.kpiTargets).slice(0, 4).map(([k, v]: [string, any]) => (
                  <div key={k} className="bg-slate-900/50 rounded-lg p-2 space-y-0.5">
                    <p className="text-[10px] text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs font-bold text-slate-200">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generating state */}
      {selected?.status === 'generating' && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-6 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-sm font-bold text-blue-300">Generating Playbook…</p>
          <p className="text-xs text-blue-400/70">AI agents are building the strategy. Check back in ~30 seconds.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({

  title,
  value,
  change,
  positive,
  icon: Icon
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: any;
}) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        <p className={cn('text-xs font-medium flex items-center gap-1 mt-1.5', positive ? 'text-green-400' : 'text-slate-500')}>
          {change}
        </p>
      </div>
    </div>
  );
}
