"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { ContentWorkflowWorkspace } from "@/components/portal/ContentWorkflowWorkspace";
import { DealflowCRMWorkspace } from "@/components/portal/DealflowCRMWorkspace";
import { WhatsAppIntegrationsList } from "@/components/whatsapp/WhatsAppIntegrationsList";
import { WhatsAppConfiguredIntegration } from "@/app/api/whatsapp/integrations/route";
import {
  Phone,
  MessageSquare,
  Star,
  Sparkles,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  X,
  Zap,
  ChevronRight,
  Filter,
  Search,
  Upload,
  Download,
  FileText,
  Settings,
  PhoneCall,
  Send,
  Briefcase,
  Mail,
  Brain,
  SearchIcon,
  CreditCard,
  CalendarCheck,
  PhoneOff,
  Play,
  ArrowUpDown,
  Target,
  ShieldCheck,
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Bot,
  Database,
  Table2,
  RefreshCw,
  TrendingUp,
  Video,
  Globe,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { cn, getCustomerDisplayName } from "@/lib/utils";
import AuthProvider from "@/components/auth/AuthProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { BarChart3 } from "lucide-react";

import { CustomerICPDetailsView } from "@/components/portal/CustomerICPDetailsView";
import { EmbeddedCampaignPlaybooks } from "@/components/portal/EmbeddedCampaignPlaybooks";
import { CalendarBookingModule } from "@/components/portal/CalendarBookingModule";
import { CustomerContactProfiles } from "@/components/portal/CustomerContactProfiles";
import { AgentDealflowBotHub } from "@/components/portal/AgentDealflowBotHub";
import { AIWebinarModule } from "@/components/webinar/AIWebinarModule";
import CommunityMiningPage from "@/app/agent-portal/community-mining/page";
import { AssignedCustomersWorkspace } from "@/components/portal/AssignedCustomersWorkspace";
import { CustomerProfileSettingsTab } from "@/components/portal/CustomerProfileSettingsTab";
import { BillionmailHub } from "@/components/portal/BillionmailHub";
import { ScrapeGraphStudio } from "@/components/portal/ScrapeGraphStudio";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "assigned-customers", label: "Assigned Customers", icon: Users, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "community-mining", label: "Community Mining", icon: Sparkles, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "ai-webinar", label: "AI Webinar Module", icon: Video, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "icp-details", label: "Customer ICP Breakdown", icon: Target, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "campaign-playbooks", label: "Campaign Playbooks", icon: FileText, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "standup-calendar", label: "Standup Calendar Sync", icon: Calendar, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "dealflow-bot", label: "Dealflow Meeting Bot", icon: Bot, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "contact-profiles", label: "Customer Contact Profiles", icon: Users, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "customers", label: "Customers", icon: Users, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10" },
  { id: "content-hub", label: "Content & Workflow Hub", icon: Target, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "requirements", label: "Requirements", icon: FileText, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "tasks", label: "Tasks", icon: CheckCircle2, color: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10" },
  { id: "chat", label: "Chat Messenger", icon: MessageSquare, color: "text-sky-400 border-sky-500/30 hover:border-sky-500/60 shadow-sky-500/10" },
  { id: "calls", label: "Calls Dialer", icon: Phone, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "voice-whatsapp", label: "AI Voice & WhatsApp", icon: Settings, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
  { id: "gtm-playbook", label: "Playbook Generation", icon: Calendar, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "gtm-analysis", label: "Automated GTM Analysis", icon: TrendingUp, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10" },
  { id: "genbi", label: "Chatbot (Wren AI)", icon: Bot, color: "text-fuchsia-400 border-fuchsia-500/30 hover:border-fuchsia-500/60 shadow-fuchsia-500/10" },
  { id: "whatsapp-chat", label: "WhatsApp Workbench & Live Chat", icon: Zap, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "dealflow-crm", label: "Dealflow CRM", icon: Briefcase, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
  { id: "billionmail-hub", label: "Billionmail Outbound Hub", icon: Send, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "scrapegraph-studio", label: "ScrapeGraphAI Studio", icon: Globe, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "account-settings", label: "Account Settings & Profile", icon: Settings, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
] as const;



function AgentPortalContent() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Widget States for customizable dashboard
  const [widgets, setWidgets] = useState<string[]>([
    "chat-queue",
    "active-conversations",
    "ai-suggestions",
    "performance",
    "notifications"
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...widgets];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    setWidgets(reordered);
    setDraggedIndex(null);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w !== widgetId));
  };

  const handleResetWidgets = () => {
    setWidgets(["chat-queue", "active-conversations", "ai-suggestions", "performance", "notifications"]);
  };
  
  // Data States
  const [tasks, setTasks] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [callsList, setCallsList] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeWorkspaceCustomerId, setActiveWorkspaceCustomerId] = useState<string>("");

  const activeCustomer = useMemo(() => {
    if (!customers || customers.length === 0) return null;
    return customers.find(c => c.id === activeWorkspaceCustomerId) || customers[0] || null;
  }, [customers, activeWorkspaceCustomerId]);

  // Customer Switcher Handler for top panel & workspace modules
  const handleCustomerSwitch = (selectedCust: any) => {
    if (!selectedCust) return;
    const targetId = selectedCust.id || (typeof selectedCust === "string" ? selectedCust : "");
    const fullCust = typeof selectedCust === "object" ? selectedCust : customers.find(c => c.id === targetId) || { id: targetId };
    setActiveWorkspaceCustomerId(fullCust.id || targetId);
    setActiveStrategyCustomerId(fullCust.id || targetId);
    setSelectedWorkflowCustomer(fullCust.id || targetId);
    setSelectedPlaybookCustomerId(fullCust.id || targetId);
    showToast("success", "Active Customer Switched", `Workspace context switched to ${fullCust.companyName || fullCust.name || "Customer"}`);
  };

  // Content Hub States
  const [contentSubTab, setContentSubTab] = useState<"workspace" | "assets">("workspace");
  const [activeStrategyCustomerId, setActiveStrategyCustomerId] = useState<string>("");
  const [contentAssets, setContentAssets] = useState<any[]>([]);
  const [contentSearch, setContentSearch] = useState("");
  const [contentTacticFilter, setContentTacticFilter] = useState("all");
  const [contentStatusFilter, setContentStatusFilter] = useState("all");
  const [contentSortField, setContentSortField] = useState("updatedAt");
  const [contentSortOrder, setContentSortOrder] = useState<"asc" | "desc">("desc");
  const [contentCustomerFilter, setContentCustomerFilter] = useState("all");

  // Selected Content Asset for details modal / drawer
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isPublishingAsset, setIsPublishingAsset] = useState(false);
  const [publishScheduleDate, setPublishScheduleDate] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Edit states for content assets
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");

  // Customers filtering/search/sorting states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("all");
  const [customerSortField, setCustomerSortField] = useState("companyName");
  const [customerSortOrder, setCustomerSortOrder] = useState<"asc" | "desc">("asc");

  // GTM Workflows states
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<any>({ cacheHits: 0, totalRequests: 0, hitRate: 0, latencySavedMs: 0 });
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);
  const [selectedWorkflowCustomer, setSelectedWorkflowCustomer] = useState("");
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<"gtm-audit" | "outreach-campaign">("gtm-audit");

  // GTM Playbooks (agent view)
  const [agentPlaybooks, setAgentPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookCustomerId, setSelectedPlaybookCustomerId] = useState("");
  const [selectedAgentPlaybook, setSelectedAgentPlaybook] = useState<any | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);

  // GenBI Assistant states
  const [genbMessages, setGenbMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    query?: any;
    results?: any[];
    rowCount?: number;
    error?: string;
    mode?: string;
    timestamp: string;
  }>>([]);
  const [genbInput, setGenbInput] = useState("");
  const [genbLoading, setGenbLoading] = useState(false);
  const [lastGeneratedQuery, setLastGeneratedQuery] = useState<any | null>(null);
  const [lastQueryError, setLastQueryError] = useState<string | null>(null);
  const genbEndRef = useRef<HTMLDivElement>(null);

  // Interactive Dialer States
  const [dialedNumber, setDialedNumber] = useState("");
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">("idle");
  const [callDuration, setCallDuration] = useState(0);

  // Form States
  const [newMessage, setNewMessage] = useState("");
  const [newRequirementDesc, setNewRequirementDesc] = useState("");
  const [newRequirementCategory, setNewRequirementCategory] = useState("General Inquiry");
  const [newRequirementPriority, setNewRequirementPriority] = useState("Medium");
  
  // Settings States
  const [whatsAppParams, setWhatsAppParams] = useState("Default Campaign Sequence");
  const [callFramework, setCallFramework] = useState("Objective Discovery Framework");

  // Live WhatsApp Chat State
  const [selectedChatContactId, setSelectedChatContactId] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState("");
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [liveWhatsAppMessages, setLiveWhatsAppMessages] = useState<Record<string, Array<{ id: string; sender: "customer" | "agent"; text: string; time: string }>>>({});

  const handleSendWhatsAppChat = async (targetPhone: string, contactId: string) => {
    if (!chatInputText.trim()) return;
    const msgText = chatInputText.trim();
    setChatInputText("");
    setIsSendingWhatsApp(true);

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "agent" as const,
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setLiveWhatsAppMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    try {
      await fetch("/api/whatsapp/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: targetPhone,
          content: msgText,
          senderRole: "agent",
          triggerType: "manual_chat",
        }),
      });
      showToast("success", "Message Dispatched", `Sent WhatsApp message to ${targetPhone}`);
    } catch {
      showToast("info", "Dispatched (Local)", `Message queued for ${targetPhone}`);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Real-time synchronization polling
  const fetchAgentData = useCallback(async () => {
    try {

      // Helper function to safely fetch and parse JSON
      const safeFetchJson = async (url: string) => {
        try {
          const res = await fetch(url).catch(() => null);
          if (!res || !res.ok) {
            console.warn(`[Agent Portal] Failed to fetch ${url}: ${res?.statusText || "Network/Server error"}`);
            return { success: false };
          }
          return await res.json().catch(() => ({ success: false }));
        } catch (err) {
          console.warn(`[Agent Portal] Error fetching ${url}:`, err);
          return { success: false };
        }
      };

      const [tasksData, reqsData, chatData, callsData, feedbackData, customersData, workflowsData, contentData] = await Promise.all([
        safeFetchJson("/api/portal/tasks"),
        safeFetchJson("/api/portal/requirements"),
        safeFetchJson("/api/portal/chat?sessionId=session-1"),
        safeFetchJson("/api/portal/calls"),
        safeFetchJson("/api/portal/feedback"),
        safeFetchJson("/api/admin/customers"),
        safeFetchJson("/api/portal/workflows"),
        safeFetchJson("/api/portal/content"),
      ]);

      if (tasksData.success && tasksData.tasks) setTasks(tasksData.tasks);
      if (reqsData.success && reqsData.requirements) setRequirements(reqsData.requirements);
      if (chatData.success && chatData.messages) setChatMessages(chatData.messages);
      if (callsData.success && callsData.calls) setCallsList(callsData.calls);
      if (feedbackData.success && feedbackData.feedback) setFeedback(feedbackData.feedback);
      if (contentData.success && contentData.assets) {
        setContentAssets(contentData.assets);
        // Sync selected asset detail in real-time
        setSelectedAsset((curr: any) => {
          if (!curr) return null;
          const updated = contentData.assets.find((a: any) => a.id === curr.id);
          return updated || curr;
        });
      }
      if (customersData.success && customersData.customers) {
        setCustomers(customersData.customers);
        // Pre-select first customer for workspace & workflow contexts if not set
        if (customersData.customers.length > 0) {
          const firstCustomer = customersData.customers[0];
          setActiveWorkspaceCustomerId(prev => prev || firstCustomer.id);
          if (!selectedWorkflowCustomer) {
            setSelectedWorkflowCustomer(firstCustomer.id);
          }
          if (!activeStrategyCustomerId) {
            setActiveStrategyCustomerId(firstCustomer.id);
          }
          if (!selectedPlaybookCustomerId) {
            setSelectedPlaybookCustomerId(firstCustomer.id);
          }
        }
      }
      if (workflowsData.success) {
        if (workflowsData.workflows) setWorkflows(workflowsData.workflows);
        if (workflowsData.performance) setWorkflowMetrics(workflowsData.performance);
      }
    } catch (error) {
      console.error("[Agent Portal] polling error:", error);
    }
  }, [selectedWorkflowCustomer, activeStrategyCustomerId]);

  // Fetch GTM Playbook for selected customer
  const fetchPlaybookForCustomer = async (cId: string) => {
    if (!cId) return;
    setPlaybookLoading(true);
    try {
      const res = await fetch(`/api/gtm-playbook?customerId=${encodeURIComponent(cId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.playbooks?.length > 0) {
          setAgentPlaybooks(data.playbooks);
          setSelectedAgentPlaybook(data.playbooks[0]);
        } else {
          setAgentPlaybooks([]);
          setSelectedAgentPlaybook(null);
        }
      }
    } catch { /* non-critical */ }
    setPlaybookLoading(false);
  };

  // GenBI: send a message
  const sendGenbMessage = async (msg: string, mode: "nl" | "execute" | "fix" = "nl") => {
    if (!msg.trim() && mode === "nl") return;
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setGenbMessages(prev => [...prev, userMsg]);
    setGenbInput("");
    setGenbLoading(true);

    try {
      const payload: any = { message: msg };
      if (mode === "execute" && lastGeneratedQuery) {
        payload.executeQuery = true;
        payload.parsedQuery = lastGeneratedQuery;
      } else if (mode === "fix" && lastQueryError && lastGeneratedQuery) {
        payload.errorContext = lastQueryError;
        payload.previousQuery = lastGeneratedQuery;
      }

      const res = await fetch("/api/agent/genbi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: data.message || (data.success ? "Done." : data.error || "Error occurred"),
        query: data.generatedQuery || data.correctedQuery || null,
        results: data.results || null,
        rowCount: data.rowCount,
        error: data.success ? undefined : (data.error || "Request failed"),
        mode: data.mode,
        timestamp: new Date().toISOString(),
      };

      if (data.generatedQuery && !data.generatedQuery.error) setLastGeneratedQuery(data.generatedQuery);
      if (data.correctedQuery) setLastGeneratedQuery(data.correctedQuery);
      if (!data.success) setLastQueryError(data.error || "Unknown error");
      else setLastQueryError(null);

      setGenbMessages(prev => [...prev, assistantMsg]);
      setTimeout(() => genbEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setGenbMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `Error: ${err.message}`,
        error: err.message,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setGenbLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 3000);
    return () => clearInterval(interval);
  }, [fetchAgentData]);


  // Call timer ticking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === "connected") {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Actions
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Task Updated", `Task marked as ${newStatus}`);
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequirementDesc.trim()) return;

    try {
      const res = await fetch("/api/portal/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newRequirementDesc,
          category: newRequirementCategory,
          priority: newRequirementPriority,
          status: "Open",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Requirement Created", "A new requirement has been saved and queued.");
        setNewRequirementDesc("");
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-1",
          content: newMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAsset = async (assetId: string | null, title: string, tactic: string, content: string, status?: string, targetCustomerId?: string) => {
    setIsSavingAsset(true);
    try {
      const cId = targetCustomerId || editCustomerId || "";
      const cObj = customers.find(c => c.id === cId);
      const cName = cObj ? (cObj.companyName || cObj.name) : "Selected Customer";

      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: assetId,
          title,
          tactic,
          content,
          status: status || "draft",
          customerId: cId,
          customerName: cName
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Asset Saved", `Asset "${title}" saved successfully.`);
        setIsEditing(false);
        fetchAgentData();
      } else {
        showToast("error", "Failed to Save", data.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "Failed to connect to the server.");
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handlePostComment = async (assetId: string, comment: string) => {
    if (!comment.trim()) return;
    try {
      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          id: assetId,
          comment
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Comment Added", "Your comment has been posted.");
        setNewCommentText("");
        fetchAgentData();
      } else {
        showToast("error", "Comment Failed", data.error || "Could not save comment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewAsset = async (assetId: string, status: string) => {
    try {
      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          id: assetId,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Review Updated", `Status marked as ${status.replace("_", " ").toUpperCase()}`);
        fetchAgentData();
      } else {
        showToast("error", "Review Failed", data.error || "Failed to update review status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollbackAsset = async (assetId: string, versionNumber: number) => {
    try {
      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rollback",
          id: assetId,
          versionNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Rollback Complete", `Successfully rolled back to version ${versionNumber}.`);
        if (isEditing) {
          setEditTitle(data.title);
          setEditContent(data.content);
        }
        fetchAgentData();
      } else {
        showToast("error", "Rollback Failed", data.error || "Failed to restore version");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishAsset = async (assetId: string, dateStr?: string) => {
    setIsPublishingAsset(true);
    try {
      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          id: assetId,
          scheduledDate: dateStr || null
        })
      });
      const data = await res.json();
      if (data.success) {
        const msg = dateStr 
          ? `Scheduled successfully to publish to: ${data.platforms.join(", ")}` 
          : `Published successfully to: ${data.platforms.join(", ")}`;
        showToast("success", dateStr ? "Campaign Scheduled" : "Campaign Published", msg);
        setIsScheduling(false);
        setPublishScheduleDate("");
        fetchAgentData();
      } else {
        showToast("error", "Publish Failed", data.error || "Could not publish");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "Failed to connect to server");
    } finally {
      setIsPublishingAsset(false);
    }
  };

  const handleInitiateCall = async () => {
    if (!dialedNumber.trim()) return;
    setCallState("ringing");
    setTimeout(() => {
      setCallState("connected");
    }, 2000);
  };

  const handleEndCall = async () => {
    if (callState !== "connected") {
      setCallState("idle");
      return;
    }
    const finalDuration = callDuration;
    setCallState("idle");
    
    // Save call record to Firestore
    try {
      await fetch("/api/portal/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: "customer-demo",
          receiverName: "Customer Demo",
          duration: finalDuration,
          status: "completed",
        }),
      });
      showToast("success", "Call Saved", "Outbound session recorded.");
      fetchAgentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowCustomer) return;
    const targetCustomer = customers.find(c => c.id === selectedWorkflowCustomer);
    if (!targetCustomer) return;

    setTriggeringWorkflow(true);
    try {
      const res = await fetch("/api/portal/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedWorkflowType,
          customerId: targetCustomer.id,
          customerName: targetCustomer.personalIdentifiers?.fullName || targetCustomer.name || targetCustomer.companyName || "Unknown",
          metadata: {
            websiteUrl: targetCustomer.companyInformation?.websiteUrl || "https://example.com",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Workflow Triggered", `Successfully started ${selectedWorkflowType === "gtm-audit" ? "GTM Audit" : "Outreach Campaign"} for ${targetCustomer.companyName || targetCustomer.name}`);
        fetchAgentData();
      } else {
        showToast("error", "Trigger Failed", data.error || "Failed to start workflow");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Trigger Failed", "Network error encountered.");
    } finally {
      setTriggeringWorkflow(false);
    }
  };

  // Tasks Queue State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "todo" | "in-progress" | "completed">("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"all" | "Low" | "Medium" | "High" | "Critical">("all");
  const [taskSortField, setTaskSortField] = useState<"createdAt" | "priority" | "title">("createdAt");
  const [taskSortOrder, setTaskSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState<"todo" | "in-progress" | "completed">("todo");

  // Calculations
  const currentAgentId = user?.id || "";
  const myTasks = tasks.filter(t => t.assignedAgentId === currentAgentId || !t.assignedAgentId);
  const pendingTasks = myTasks.filter(t => t.status !== "completed").length;
  const completedTasks = myTasks.filter(t => t.status === "completed").length;
  const totalTasks = myTasks.length;
  const rating = feedback.length 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) 
    : "4.8";

  // Filter and Sort Tasks
  const filteredTasks = myTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase()));
    const matchesStatus = taskStatusFilter === "all" || t.status === taskStatusFilter;
    const matchesPriority = taskPriorityFilter === "all" || t.priority === taskPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    if (taskSortField === "priority") {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return taskSortOrder === "asc" 
        ? (priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]) 
        : (priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);
    } else if (taskSortField === "title") {
      return taskSortOrder === "asc" 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else { // createdAt
      return taskSortOrder === "asc" 
        ? new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() 
        : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          assignedAgentId: newTaskAssignee || currentAgentId,
          status: "todo"
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("Medium");
        setNewTaskAssignee("");
        showToast("success", "Task Created", "New task added to queue successfully.");
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/portal/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Task Deleted", "Task removed from queue.");
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority || "Medium");
    setEditTaskAssignee(task.assignedAgentId || "");
    setEditTaskStatus(task.status || "todo");
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId) return;
    try {
      const res = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTaskId,
          title: editTaskTitle,
          description: editTaskDescription,
          priority: editTaskPriority,
          assignedAgentId: editTaskAssignee || currentAgentId,
          status: editTaskStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingTaskId(null);
        showToast("success", "Task Updated", "Task details saved successfully.");
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkMarkComplete = async () => {
    for (const id of selectedTaskIds) {
      await handleUpdateTaskStatus(id, "completed");
    }
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) {
      for (const id of selectedTaskIds) {
        await handleDeleteTask(id);
      }
      setSelectedTaskIds([]);
    }
  };

  // Search & Filter & Sort Customers List
  const filteredCustomers = customers
    .filter((c) => {
      const personal = c.personalIdentifiers || {};
      const company = c.companyInformation || {};
      const matchesSearch =
        (c.name || personal.fullName || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.companyName || company.companyName || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.email || personal.email || "").toLowerCase().includes(customerSearch.toLowerCase());
      
      const statusValue = c.status || "active";
      const matchesStatus = customerStatusFilter === "all" || statusValue.toLowerCase() === customerStatusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aPersonal = a.personalIdentifiers || {};
      const bPersonal = b.personalIdentifiers || {};
      const aCompany = a.companyInformation || {};
      const bCompany = b.companyInformation || {};

      let fieldA = "";
      let fieldB = "";

      if (customerSortField === "companyName") {
        fieldA = a.companyName || aCompany.companyName || "";
        fieldB = b.companyName || bCompany.companyName || "";
      } else if (customerSortField === "contactName") {
        fieldA = a.name || aPersonal.fullName || "";
        fieldB = b.name || bPersonal.fullName || "";
      } else if (customerSortField === "createdAt") {
        fieldA = a.createdAt || "";
        fieldB = b.createdAt || "";
      }

      const comparison = fieldA.localeCompare(fieldB);
      return customerSortOrder === "asc" ? comparison : -comparison;
    });

  const MARKETING_TACTICS = [
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

  const filteredContentAssets = contentAssets
    .filter((asset) => {
      const matchesSearch =
        (asset.title || "").toLowerCase().includes(contentSearch.toLowerCase()) ||
        (asset.content || "").toLowerCase().includes(contentSearch.toLowerCase());
      
      const matchesTactic = contentTacticFilter === "all" || asset.tactic === contentTacticFilter;
      const matchesStatus = contentStatusFilter === "all" || asset.status === contentStatusFilter;
      const matchesCustomer = contentCustomerFilter === "all" || asset.customerId === contentCustomerFilter;

      return matchesSearch && matchesTactic && matchesStatus && matchesCustomer;
    })
    .sort((a, b) => {
      let fieldA: any = "";
      let fieldB: any = "";

      if (contentSortField === "updatedAt") {
        fieldA = a.updatedAt || "";
        fieldB = b.updatedAt || "";
      } else if (contentSortField === "title") {
        fieldA = a.title || "";
        fieldB = b.title || "";
      } else if (contentSortField === "views") {
        fieldA = a.performanceMetrics?.views || 0;
        fieldB = b.performanceMetrics?.views || 0;
      } else if (contentSortField === "conversionRate") {
        fieldA = a.performanceMetrics?.conversionRate || 0;
        fieldB = b.performanceMetrics?.conversionRate || 0;
      }

      if (typeof fieldA === "string") {
        const comparison = fieldA.localeCompare(fieldB);
        return contentSortOrder === "asc" ? comparison : -comparison;
      } else {
        return contentSortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
    });

  const activeTabObj = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFBFD] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased">
      {/* Left Sidebar Navigation */}
      <PortalSidebar
        role="agent"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PortalHeader
          role="agent"
          activeTabLabel={activeTabObj?.label || "Dashboard"}
          userName={user?.name || "Revenue Specialist"}
          userEmail={user?.email || "agent@dealflow.ai"}
          customers={customers.map(c => ({
            id: c.id,
            name: c.name || c.customerName || "Customer",
            companyName: c.companyName || c.companyInformation?.name || "Enterprise Account",
            email: c.email,
            industry: c.industry || c.companyInformation?.industry,
            status: c.status || "active"
          }))}
          selectedCustomerId={activeWorkspaceCustomerId}
          onSelectCustomer={handleCustomerSwitch}
          onAddCustomer={(newCust) => {
            setCustomers(prev => [newCust, ...prev]);
            handleCustomerSwitch(newCust);
            return true;
          }}
        />

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar relative">
          {/* Toast Notification (Portalled to document.body with z-[999999] to prevent clipping behind headers/glass panels) */}
          {notification && typeof document !== "undefined" && createPortal(
            <div className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[999999] animate-in slide-in-from-top-3 fade-in duration-300 pointer-events-auto">
              <div className={cn(
                "w-80 sm:w-96 shadow-2xl rounded-2xl border p-4 backdrop-blur-2xl text-xs flex items-start gap-3 ring-1 ring-black/10 dark:ring-white/10",
                notification.type === "success" ? "border-[#34C759] bg-white/98 dark:bg-[#161618]/98 text-[#248A3D] dark:text-[#30D158] shadow-[0_10px_30px_rgba(52,199,89,0.25)]" :
                notification.type === "error" ? "border-[#FF3B30] bg-white/98 dark:bg-[#161618]/98 text-[#D70015] dark:text-[#FF453A] shadow-[0_10px_30px_rgba(255,59,48,0.25)]" :
                "border-[#0071E3] bg-white/98 dark:bg-[#161618]/98 text-[#0071E3] dark:text-[#2997FF] shadow-[0_10px_30px_rgba(0,113,227,0.25)]"
              )}>
                {notification.type === "success" ? <CheckCircle2 className="h-5 w-5 text-[#34C759] shrink-0 mt-0.5" /> :
                 notification.type === "error" ? <AlertCircle className="h-5 w-5 text-[#FF3B30] shrink-0 mt-0.5" /> :
                 <AlertCircle className="h-5 w-5 text-[#0071E3] shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-[#1D1D1F] dark:text-white leading-tight">{notification.title}</p>
                  <p className="text-[11px] text-[#6E6E73] dark:text-slate-300 mt-1 leading-normal break-words">{notification.message}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setNotification(null)} 
                  className="p-1 rounded-lg text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>,
            document.body
          )}

          {/* Main Title Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                Revenue Specialist Workstation
              </h1>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-1 text-xs">
                Welcome back, <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">{user?.name || "Agent"}</span> · Omni-channel pipeline execution &amp; autonomous dealflow intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#34C759]/10 border border-[#34C759]/20 rounded-full px-3 py-1.5 text-xs font-semibold text-[#248A3D] dark:text-[#30D158]">
                <span className="h-2 w-2 rounded-full bg-[#34C759] animate-pulse" />
                <span>Workstation Online</span>
              </div>
            </div>
          </div>

      {/* ── QUICK STATS CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedMetricCard
          title="Pending Workload"
          value={pendingTasks}
          change={`${Math.min(100, Math.round((pendingTasks / Math.max(totalTasks, 1)) * 100))}% queued`}
          isPositive={true}
          subtitle="Active tasks assigned to workflow queue"
          icon={Clock}
          accentColor="violet"
        />
        <AnimatedMetricCard
          title="Customer CSAT Score"
          value={rating}
          change="+0.4"
          isPositive={true}
          subtitle="CSAT score across customer accounts"
          icon={Star}
          accentColor="emerald"
        />
        <AnimatedMetricCard
          title="Active Customers"
          value={customers.length}
          change="+12% MoM"
          isPositive={true}
          subtitle="Currently active in your book of business"
          icon={Users}
          accentColor="cyan"
        />
      </div>

      {/* Progress & Dialer Stats */}
      <GlassPanel className="border border-slate-800 p-5 bg-slate-900/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">Outbound Dial Tracking & Workload Completeness</h3>
            <p className="text-xs text-slate-500">Your live activity tracking metrics for this GTM segment</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            <div>
              <span className="text-slate-400">Completed Workload:</span>
              <span className="text-teal-400 font-bold ml-1">
                {completedTasks} / {totalTasks} Tasks ({totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 100}%)
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400">Recent Calls Made:</span>
              <span className="text-cyan-400 font-bold ml-1">{callsList.length} Sessions</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-4 border border-white/5">
          <div
            className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100}%` }}
          />
        </div>
      </GlassPanel>

      {/* Tab Control List — responsive wrap layout so all tabs are visible */}
      <div className="w-full pb-1">
        <div className="flex flex-wrap gap-1.5 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-xl relative w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isNew = tab.id === "gtm-playbook" || tab.id === "genbi";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative rounded-xl transition-all duration-300 gap-2 font-semibold text-xs py-2 px-3.5 flex items-center justify-center overflow-hidden outline-none whitespace-nowrap",
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <Icon className={cn("h-4 w-4 relative z-10 shrink-0", tab.color.split(" ")[0])} />
                <span className="relative z-10">{tab.label}</span>
                {isNew && !isActive && (
                  <span className="relative z-10 ml-0.5 text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 rounded-full px-1 leading-tight">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        <AnimatePresence mode="wait">

        {/* AI WEBINAR MODULE TAB */}
        {activeTab === "ai-webinar" && (
          <motion.div
            key="ai-webinar"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <AIWebinarModule />
          </motion.div>
        )}

        {/* NEW: CUSTOMER ICP BREAKDOWN TAB */}
        {activeTab === "icp-details" && (
          <motion.div
            key="icp-details"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <CustomerICPDetailsView
              customerId={activeWorkspaceCustomerId || activeCustomer?.id}
              customerData={activeCustomer}
            />
          </motion.div>
        )}

        {/* NEW: CAMPAIGN PLAYBOOKS TAB */}
        {activeTab === "campaign-playbooks" && (
          <motion.div
            key="campaign-playbooks"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <EmbeddedCampaignPlaybooks
              customerId={activeWorkspaceCustomerId || activeCustomer?.id}
              customerData={activeCustomer}
              companyName={activeCustomer?.companyName || activeCustomer?.name || "Client Account"}
            />
          </motion.div>
        )}

        {/* NEW: STANDUP CALENDAR SYNC TAB */}
        {activeTab === "standup-calendar" && (
          <motion.div
            key="standup-calendar"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <CalendarBookingModule isAgentView={true} />
          </motion.div>
        )}

        {activeTab === "contact-profiles" && (
          <motion.div
            key="contact-profiles"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <CustomerContactProfiles />
          </motion.div>
        )}

        {/* ASSIGNED CUSTOMERS TAB */}
        {activeTab === "assigned-customers" && (
          <motion.div
            key="assigned-customers"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <AssignedCustomersWorkspace
              customers={customers}
              currentAgent={user}
              onSelectCustomerContext={handleCustomerSwitch}
              onNavigateTab={(t) => setActiveTab(t as any)}
            />
          </motion.div>
        )}

        {/* COMMUNITY MINING AUTOMATION TAB */}
        {activeTab === "community-mining" && (
          <motion.div
            key="community-mining"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <CommunityMiningPage />
          </motion.div>
        )}

        {/* 0. DASHBOARD TAB */}
        {activeTab === "dashboard" && (

          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            {widgets.length < 5 && (
              <div className="flex justify-end">
                <button
                  onClick={handleResetWidgets}
                  className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-teal-400 font-semibold px-3 py-1.5 rounded-xl transition-all"
                >
                  Reset Layout Grid
                </button>
              </div>
            )}

            <div className="df-widget-grid">
              {widgets.map((widgetId, index) => {
                if (widgetId === "chat-queue") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Chat Messenger Queue"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs text-slate-400 font-bold">Active Chat Queue</span>
                          <button onClick={() => setActiveTab("chat")} className="text-xs text-teal-400 hover:text-teal-300 font-bold">Open Messenger</button>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {customers.slice(0, 3).map((cust) => (
                            <div key={cust.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-200">{cust.companyName || cust.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{cust.email}</p>
                              </div>
                              <span className="bg-amber-500/10 text-amber-450 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">Pending</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "active-conversations") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Active Call Sessions"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs text-slate-400 font-bold">Recent Dial Logs</span>
                          <button onClick={() => setActiveTab("calls")} className="text-xs text-teal-400 hover:text-teal-300 font-bold">Open Dialer</button>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {callsList.slice(0, 3).map((call) => (
                            <div key={call.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-200">{call.receiverPhone}</p>
                                <p className="text-[9px] text-slate-550 mt-0.5">Started: {new Date(call.startedAt).toLocaleTimeString()}</p>
                              </div>
                              <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">{call.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "ai-suggestions") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="AI Outreach Suggestions"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-3.5">
                        <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl text-xs space-y-1.5">
                          <p className="font-bold text-teal-300 flex items-center gap-1.5">
                            <Zap className="h-4 w-4 fill-teal-400 animate-pulse" /> Suggested Lead Followup
                          </p>
                          <p className="text-slate-355 leading-relaxed text-[11px]">
                            &quot;Based on recent API latency queries from TechSolutions, suggest scheduling a call to walk through the custom Postgres configurations.&quot;
                          </p>
                          <button onClick={() => setActiveTab("chat")} className="text-[10px] text-teal-400 font-bold underline hover:text-teal-300 mt-1 block">Apply to Messenger</button>
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "performance") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Agent Operations Performance"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Task Progress</span>
                            <span className="text-2xl font-black text-indigo-400">
                              {totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 100}%
                            </span>
                          </div>
                          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Feedback Rating</span>
                            <span className="text-2xl font-black text-emerald-400">{rating} / 5</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-center uppercase font-mono italic">
                          Target SLAs Met: 98.4% this quarter
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                return (
                  <DashboardWidget
                    key={widgetId}
                    id={widgetId}
                    title="Active Alerts & Notifications"
                    onRemove={() => handleRemoveWidget(widgetId)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-slate-400 font-bold">System Alerts</span>
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl flex gap-2 items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-300 text-[11px]">Next.js SDR pipelines compiled successfully</span>
                        </div>
                        <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl flex gap-2 items-center">
                          <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span className="text-slate-300 text-[11px]">{customers.length} total customer accounts synced</span>
                        </div>
                      </div>
                    </div>
                  </DashboardWidget>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 0. CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <motion.div
            key="customers"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Search, Filter, Sort Controls */}
            <GlassPanel tilt={false} className="border-slate-800 p-5 bg-slate-900/10 flex flex-col md:flex-row gap-4 justify-between items-center flex-wrap">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl w-full md:w-80">
                <Search className="h-4 w-4 text-slate-500" />
                <label htmlFor="customer-search" className="sr-only">Search Customers</label>
                <input
                  id="customer-search"
                  type="text"
                  placeholder="Search company, contact name, or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
                />
              </div>

              <div className="flex gap-4 flex-wrap w-full md:w-auto items-center">
                <div className="flex items-center gap-2 text-xs">
                  <label htmlFor="customer-status-filter" className="text-slate-400 font-medium">Status:</label>
                  <select
                    id="customer-status-filter"
                    value={customerStatusFilter}
                    onChange={(e) => setCustomerStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="onboarded">Onboarded</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label htmlFor="customer-sort-field" className="text-slate-400 font-medium">Sort By:</label>
                  <select
                    id="customer-sort-field"
                    value={customerSortField}
                    onChange={(e) => setCustomerSortField(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="companyName">Company Name</option>
                    <option value="contactName">Contact Name</option>
                    <option value="createdAt">Date Created</option>
                  </select>
                </div>

                <button
                  onClick={() => setCustomerSortOrder(o => o === "asc" ? "desc" : "asc")}
                  className="p-2 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200"
                  aria-label={`Toggle sort order. Current order: ${customerSortOrder}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </div>
            </GlassPanel>

            {/* Customers Listing */}
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <Users className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No customers found matching filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((c: any) => {
                  const personal = c.personalIdentifiers || {};
                  const company = c.companyInformation || {};
                  const nameVal = c.name || personal.fullName || "Unspecified";
                  const emailVal = c.email || personal.email || "";
                  const companyNameVal = c.companyName || company.companyName || "Unknown Company";
                  const statusVal = c.status || "Active";

                  return (
                    <GlassPanel key={c.id} tilt={true} className="border-slate-800 bg-slate-900/20 p-5 space-y-4 hover:border-blue-500/30 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-extrabold text-white leading-snug">{companyNameVal}</h4>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {c.id}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                            statusVal.toLowerCase() === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            statusVal.toLowerCase() === "onboarded" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          )}>
                            {statusVal}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-slate-350"><span className="text-slate-500">Contact:</span> {nameVal}</p>
                          {emailVal && <p className="text-slate-400 font-mono text-[11px]">{emailVal}</p>}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-850 flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-500">Created: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}</span>
                        <ExtrudedButton
                          size="sm"
                          onClick={() => router.push(`/portal/agent/workspace?leadId=${c.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl py-1.5 px-3"
                        >
                          Open Workspace
                        </ExtrudedButton>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
        {/* CONTENT & WORKFLOW HUB */}
        {activeTab === "content-hub" && (
          <motion.div
            key="content-hub"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Sub-navigation Toggles */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex gap-2">
                <button
                  onClick={() => setContentSubTab("workspace")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    contentSubTab === "workspace"
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-300 shadow-lg"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Campaign Strategy & Workflows
                </button>
                <button
                  onClick={() => setContentSubTab("assets")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    contentSubTab === "assets"
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-300 shadow-lg"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Asset Review & Publishing
                </button>
              </div>

              {contentSubTab === "workspace" && customers.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <label htmlFor="agent-strategy-customer-select" className="text-slate-400 font-medium">Select Client Account:</label>
                  <select
                    id="agent-strategy-customer-select"
                    value={activeStrategyCustomerId}
                    onChange={(e) => setActiveStrategyCustomerId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {contentSubTab === "workspace" ? (
              (() => {
                const activeCust = customers.find(c => c.id === activeStrategyCustomerId) || customers[0] || {
                  id: "agent_default_workspace",
                  companyName: "Strategy Workspace",
                  name: "Strategy Workspace",
                  businessModel: "b2b"
                };
                return (

                  <ContentWorkflowWorkspace
                    customerId={activeCust.id}
                    customerName={activeCust.companyName || activeCust.name}
                    initialCustomerData={activeCust}
                    userRole="agent"
                    onSaveCustomer={async (updatedFields: any) => {
                      try {
                        const res = await fetch("/api/admin/customers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "update",
                            customerId: activeCust.id,
                            customer: updatedFields
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          await fetchAgentData();
                          return true;
                        }
                        return false;
                      } catch (err) {
                        console.error(err);
                        return false;
                      }
                    }}
                  />
                );
              })()
            ) : (
              <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Centralized Marketing Content Hub (Oversight View)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Agent moderation panel: manage, review, edit, approve, and publish content assets for all active customer accounts.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditTitle("");
                  setEditContent("");
                  setEditCustomerId("");
                  setEditCustomerName("");
                  setIsEditing(true);
                  setSelectedAsset({
                    id: null,
                    title: "",
                    tactic: "Blog Posts",
                    content: "",
                    status: "draft",
                    versions: [],
                    comments: [],
                    auditLogs: []
                  });
                }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/15"
              >
                <Plus className="h-4 w-4" /> Create Draft Asset
              </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/10 p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Reach (Views)</p>
                <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                  {contentAssets.reduce((sum, a) => sum + (a.performanceMetrics?.views || 0), 0).toLocaleString()}
                </h3>
              </GlassPanel>
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/10 p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Interactions (Clicks)</p>
                <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                  {contentAssets.reduce((sum, a) => sum + (a.performanceMetrics?.clicks || 0), 0).toLocaleString()}
                </h3>
              </GlassPanel>
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/10 p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Average Conversion</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {(
                    contentAssets.filter(a => (a.performanceMetrics?.views || 0) > 0).reduce((sum, a) => sum + (a.performanceMetrics?.conversionRate || 0), 0) /
                    (contentAssets.filter(a => (a.performanceMetrics?.views || 0) > 0).length || 1)
                  ).toFixed(2)}%
                </h3>
              </GlassPanel>
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/10 p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Assets Categorized</p>
                <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
                  {contentAssets.length} Assets
                </h3>
              </GlassPanel>
            </div>

            {/* Filters and Controls */}
            <GlassPanel tilt={false} className="border-slate-800 p-4 bg-slate-900/20 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl w-full md:w-80">
                  <Search className="h-4 w-4 text-slate-500" />
                  <label htmlFor="agent-content-search" className="sr-only">Search Content Assets</label>
                  <input
                    id="agent-content-search"
                    type="text"
                    placeholder="Search by title or content keywords..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
                  />
                </div>

                <div className="flex gap-4 flex-wrap w-full md:w-auto items-center">
                  {/* Customer Select filter */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="agent-customer-filter" className="text-slate-400 font-medium">Customer Account:</label>
                    <select
                      id="agent-customer-filter"
                      value={contentCustomerFilter}
                      onChange={(e) => setContentCustomerFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="all">All Customers</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tactic dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="agent-content-tactic-filter" className="text-slate-400 font-medium">Tactic:</label>
                    <select
                      id="agent-content-tactic-filter"
                      value={contentTacticFilter}
                      onChange={(e) => setContentTacticFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none max-w-[200px]"
                    >
                      <option value="all">All 25 Tactics</option>
                      {MARKETING_TACTICS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="agent-content-status-filter" className="text-slate-400 font-medium">Status:</label>
                    <select
                      id="agent-content-status-filter"
                      value={contentStatusFilter}
                      onChange={(e) => setContentStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="agent-content-sort-field" className="text-slate-400 font-medium">Sort By:</label>
                    <select
                      id="agent-content-sort-field"
                      value={contentSortField}
                      onChange={(e) => setContentSortField(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="updatedAt">Last Updated</option>
                      <option value="title">Title</option>
                      <option value="views">Views</option>
                      <option value="conversionRate">Conversion Rate</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setContentSortOrder(o => o === "asc" ? "desc" : "asc")}
                    className="p-2 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200"
                    aria-label={`Toggle sort order. Current order: ${contentSortOrder}`}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassPanel>

            {/* Content Assets Grid */}
            {filteredContentAssets.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
                <FileText className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No content assets found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContentAssets.map((asset) => (
                  <GlassPanel
                    key={asset.id}
                    tilt={true}
                    className="border-slate-800 bg-slate-900/15 p-5 space-y-4 hover:border-violet-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase truncate max-w-[120px]">
                          {asset.tactic}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                          asset.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          asset.status === "approved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          asset.status === "scheduled" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          asset.status === "under_review" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-800 text-slate-400 border-slate-700"
                        )}>
                          {asset.status.replace("_", " ")}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-sm mt-3 line-clamp-2">{asset.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">For: {asset.customerName || "N/A"} ({asset.customerId})</p>
                      <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 font-light">{asset.content}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-900 mt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div>
                          <span className="block text-slate-500 uppercase font-mono">Views</span>
                          <span className="font-bold text-slate-300 font-mono">{(asset.performanceMetrics?.views || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 uppercase font-mono">Clicks</span>
                          <span className="font-bold text-slate-300 font-mono">{(asset.performanceMetrics?.clicks || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 uppercase font-mono">Conv %</span>
                          <span className="font-bold text-emerald-400 font-mono">{asset.performanceMetrics?.conversionRate || 0}%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                        <span>Ver: {asset.versions?.length || 1} â€¢ Comm: {asset.comments?.length || 0}</span>
                        <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setEditTitle(asset.title);
                          setEditContent(asset.content);
                          setEditCustomerId(asset.customerId || "");
                          setEditCustomerName(asset.customerName || "");
                          setIsEditing(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        Oversight & Manage <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}

            {/* Preview & Review Dialog/Drawer */}
            {selectedAsset && (
              <div className="fixed inset-0 z-45 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <GlassPanel tilt={false} className="border-slate-800 bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setSelectedAsset(null);
                      setIsEditing(false);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="flex justify-between items-start gap-2 pr-6 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="bg-slate-955 border border-slate-850 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                          {selectedAsset.tactic}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                          selectedAsset.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          selectedAsset.status === "approved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          selectedAsset.status === "scheduled" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          selectedAsset.status === "under_review" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-800 text-slate-400 border-slate-700"
                        )}>
                          {selectedAsset.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-white text-lg mt-2">{selectedAsset.id ? selectedAsset.title : "New Draft (Agent Creation)"}</h3>
                      {selectedAsset.id && (
                        <p className="text-xs text-slate-500">Customer Account: <span className="font-semibold text-slate-300">{selectedAsset.customerName}</span> ({selectedAsset.customerId})</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 space-y-6 pr-2 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left 2/3 Content Preview / Edit */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Asset Copy Content</h5>
                          {!isEditing ? (
                            <button
                              onClick={() => {
                                setEditTitle(selectedAsset.title);
                                setEditContent(selectedAsset.content);
                                setEditCustomerId(selectedAsset.customerId || "");
                                setEditCustomerName(selectedAsset.customerName || "");
                                setIsEditing(true);
                              }}
                              className="text-violet-400 hover:text-violet-300 text-xs font-bold"
                            >
                              Edit Copy
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setIsEditing(false)}
                                className="text-slate-400 hover:text-slate-300 text-xs font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveAsset(selectedAsset.id, editTitle, selectedAsset.tactic, editContent, selectedAsset.status, editCustomerId)}
                                disabled={isSavingAsset}
                                className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                              >
                                {isSavingAsset && <Loader2 className="h-3 w-3 animate-spin" />} Save
                              </button>
                            </div>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text max-h-[300px] overflow-y-auto">
                            {selectedAsset.content || <em className="text-slate-500">No content text entered yet. Click Edit Copy to begin writing.</em>}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedAsset.id === null && (
                              <div className="space-y-1">
                                <label htmlFor="agent-select-customer-field" className="text-[10px] text-slate-500 font-bold uppercase block">Associate with Customer</label>
                                <select
                                  id="agent-select-customer-field"
                                  value={editCustomerId}
                                  onChange={(e) => {
                                    setEditCustomerId(e.target.value);
                                    const cObj = customers.find(c => c.id === e.target.value);
                                    setEditCustomerName(cObj ? (cObj.companyName || cObj.name) : "");
                                  }}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                                >
                                  <option value="">Select Customer Account...</option>
                                  {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.companyName || c.name} ({c.id})</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label htmlFor="agent-edit-title-field" className="text-[10px] text-slate-500 font-bold uppercase">Asset Title</label>
                              <Input
                                id="agent-edit-title-field"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-slate-950 border-slate-850 text-xs text-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label htmlFor="agent-edit-content-field" className="text-[10px] text-slate-500 font-bold uppercase">Content Body</label>
                              <textarea
                                id="agent-edit-content-field"
                                rows={8}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-slate-955 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
                              />
                            </div>
                            {selectedAsset.id === null && (
                              <div className="space-y-1">
                                <label htmlFor="agent-select-tactic-field" className="text-[10px] text-slate-500 font-bold uppercase">Marketing Tactic</label>
                                <select
                                  id="agent-select-tactic-field"
                                  value={selectedAsset.tactic}
                                  onChange={(e) => setSelectedAsset({ ...selectedAsset, tactic: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                                >
                                  {MARKETING_TACTICS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {selectedAsset.id === null && (
                              <button
                                onClick={() => handleSaveAsset(null, editTitle, selectedAsset.tactic, editContent, "draft", editCustomerId)}
                                disabled={!editCustomerId || !editTitle || !editContent}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2 rounded-xl text-xs shadow-md disabled:opacity-50"
                              >
                                Save New Asset Draft
                              </button>
                            )}
                          </div>
                        )}

                        {/* Version Control and Audits */}
                        {selectedAsset.id && (
                          <div className="space-y-4 pt-4 border-t border-slate-850">
                            <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Version History & Revisions</h5>
                            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                              {(selectedAsset.versions || []).slice().reverse().map((ver: any, idx: number) => (
                                <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-slate-200">Version {ver.version} <span className="text-[10px] font-normal text-slate-500">by {ver.updatedBy} ({ver.updatedByRole})</span></p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(ver.updatedAt).toLocaleString()}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRollbackAsset(selectedAsset.id, ver.version)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded text-[10px] transition-all"
                                  >
                                    Restore
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right 1/3 Workflow Actions & Comments */}
                      <div className="space-y-6">
                        {/* Approval Workflows */}
                        {selectedAsset.id && (
                          <GlassPanel tilt={false} className="border-slate-800 bg-black/45 p-4 space-y-3.5">
                            <h5 className="text-xs text-slate-355 font-bold uppercase tracking-wider">Review & Publish Workflow</h5>
                            
                            {/* Draft / Under Review States */}
                            {(selectedAsset.status === "draft" || selectedAsset.status === "under_review") && (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleReviewAsset(selectedAsset.id, "approved")}
                                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                  <Check className="h-4 w-4" /> Approve Content
                                </button>
                                {selectedAsset.status !== "under_review" && (
                                  <button
                                    onClick={() => handleReviewAsset(selectedAsset.id, "under_review")}
                                    className="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                                  >
                                    Submit for Review
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Approved State */}
                            {selectedAsset.status === "approved" && (
                              <div className="space-y-3">
                                <button
                                  onClick={() => handlePublishAsset(selectedAsset.id)}
                                  disabled={isPublishingAsset}
                                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-50 hover:to-indigo-505 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                                >
                                  {isPublishingAsset ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                                      Publishing...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4" /> Publish Now
                                    </>
                                  )}
                                </button>

                                <div className="border-t border-slate-850 pt-2.5 space-y-2">
                                  {!isScheduling ? (
                                    <button
                                      onClick={() => setIsScheduling(true)}
                                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 py-1.5 rounded-xl text-xs font-bold"
                                    >
                                      Schedule Publication
                                    </button>
                                  ) : (
                                    <div className="space-y-2">
                                      <label htmlFor="agent-schedule-time" className="text-[9px] text-slate-500 font-bold uppercase block">Schedule Date & Time</label>
                                      <input
                                        id="agent-schedule-time"
                                        type="datetime-local"
                                        value={publishScheduleDate}
                                        onChange={(e) => setPublishScheduleDate(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setIsScheduling(false)}
                                          className="flex-1 bg-slate-800 text-slate-300 py-1 rounded-xl text-[10px] font-semibold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handlePublishAsset(selectedAsset.id, publishScheduleDate)}
                                          disabled={isPublishingAsset || !publishScheduleDate}
                                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-1 rounded-xl text-[10px] font-bold"
                                        >
                                          Schedule
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Published / Scheduled States */}
                            {(selectedAsset.status === "published" || selectedAsset.status === "scheduled") && (
                              <div className="bg-slate-955 p-3 rounded-xl border border-slate-850 text-[10px] space-y-2 text-slate-400">
                                <p className="font-bold text-emerald-450 flex items-center gap-1">
                                  <ShieldCheck className="h-4 w-4 text-emerald-450" /> Secure Sync Active
                                </p>
                                <p>Connected Platforms:</p>
                                <div className="flex flex-wrap gap-1">
                                  {(selectedAsset.publishedPlatforms || []).map((p: string) => (
                                    <span key={p} className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">{p}</span>
                                  ))}
                                </div>
                                <p className="text-[9px] text-slate-555 italic mt-1 truncate">
                                  Payload AES-256 encrypted in transit
                                </p>
                                <button
                                  onClick={() => handleReviewAsset(selectedAsset.id, "draft")}
                                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 mt-2 py-1 rounded border border-slate-800 text-[10px]"
                                >
                                  Revert to Draft
                                </button>
                              </div>
                            )}
                          </GlassPanel>
                        )}

                        {/* Comments System */}
                        {selectedAsset.id && (
                          <div className="space-y-3.5">
                            <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comments & Revisions</h5>
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                              {(selectedAsset.comments || []).length === 0 ? (
                                <p className="text-slate-500 text-xs italic py-4">No comments left on this asset yet.</p>
                              ) : (
                                (selectedAsset.comments || []).map((comm: any) => (
                                  <div key={comm.id} className="p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl space-y-1 text-xs">
                                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                      <span className="font-bold text-slate-350">{comm.authorName} ({comm.authorRole})</span>
                                      <span>{new Date(comm.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-300 font-light">{comm.comment}</p>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex gap-2">
                              <label htmlFor="agent-drawer-comment-text-field" className="sr-only">Add comment</label>
                              <Input
                                id="agent-drawer-comment-text-field"
                                placeholder="Write response/feedback..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                className="bg-slate-950 border-slate-850 text-xs"
                              />
                              <button
                                onClick={() => handlePostComment(selectedAsset.id, newCommentText)}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-bold p-2.5 rounded-xl text-xs"
                                aria-label="Post comment"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </div>
            )}
            </>
            )}
          </motion.div>
        )}

        {/* 1. REQUIREMENTS TAB */}
        {activeTab === "requirements" && (
          <motion.div
            key="requirements"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Create requirement form */}
            <GlassPanel tilt={false} className="border-slate-800 p-5 h-fit">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Request CRM Resource</h3>
              <form onSubmit={handleCreateRequirement} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="req-category" className="text-slate-400">Tactic / Category</Label>
                  <select
                    id="req-category"
                    value={newRequirementCategory}
                    onChange={(e) => setNewRequirementCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Billing Issue">Billing Issue</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-priority" className="text-slate-400">Target Priority</Label>
                  <select
                    id="req-priority"
                    value={newRequirementPriority}
                    onChange={(e) => setNewRequirementPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-desc" className="text-slate-400">Description of Requirements</Label>
                  <textarea
                    id="req-desc"
                    placeholder="Enter CRM onboarding or feature requirements..."
                    value={newRequirementDesc}
                    onChange={(e) => setNewRequirementDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <ExtrudedButton type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                  Submit CRM Request
                </ExtrudedButton>
              </form>
            </GlassPanel>

            {/* List requirements */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">CRM Requirements Status</h3>
              {requirements.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center bg-slate-900/10 rounded-xl border border-slate-800">No requirements loaded.</p>
              ) : (
                requirements.map(req => (
                  <GlassPanel key={req.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm">{req.category}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          req.priority === "Critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>{req.priority}</span>
                      </div>
                      <span className="bg-slate-850 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-350">{req.status}</span>
                    </div>
                    <p className="text-xs text-slate-300">{req.description}</p>
                    <p className="text-[10px] text-slate-500">Submitted by: {req.requesterName} ({req.requesterEmail})</p>
                  </GlassPanel>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* 2. TASKS TAB */}
        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-100">Tasks Queue</h2>
              {selectedTaskIds.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-400">{selectedTaskIds.length} selected</span>
                  <ExtrudedButton size="sm" onClick={handleBulkMarkComplete} className="bg-emerald-600">
                    Mark Complete
                  </ExtrudedButton>
                  <ExtrudedButton size="sm" onClick={handleBulkDelete} className="bg-rose-600">
                    Delete Selected
                  </ExtrudedButton>
                </div>
              )}
            </div>

            {/* Top Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Create Task Form */}
              <GlassPanel tilt={false} className="lg:col-span-1 border-slate-800 p-5">
                <h3 className="text-base font-bold text-slate-100 mb-4">Add New Task</h3>
                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Task Title</Label>
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Description</Label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Task details..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Priority</Label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <ExtrudedButton type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-xs">
                    Create Task
                  </ExtrudedButton>
                </form>
              </GlassPanel>

              {/* Filters, Search & Sort */}
              <GlassPanel tilt={false} className="lg:col-span-3 border-slate-800 p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <Label className="text-slate-400 text-xs mb-1 block">Search Tasks</Label>
                    <Input
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Search by title or description..."
                      className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Status</Label>
                    <select
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    >
                      <option value="all">All</option>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Priority</Label>
                    <select
                      value={taskPriorityFilter}
                      onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    >
                      <option value="all">All</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Sort By</Label>
                    <select
                      value={taskSortField}
                      onChange={(e) => setTaskSortField(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Order</Label>
                    <select
                      value={taskSortOrder}
                      onChange={(e) => setTaskSortOrder(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <p className="text-slate-500 text-sm py-12 text-center bg-slate-900/20 border border-slate-800 rounded-xl">No tasks match your filters.</p>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(t => (
                  <GlassPanel key={t.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5">
                    {editingTaskId === t.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Title</Label>
                            <Input
                              value={editTaskTitle}
                              onChange={(e) => setEditTaskTitle(e.target.value)}
                              className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-slate-400 text-xs">Priority</Label>
                              <select
                                value={editTaskPriority}
                                onChange={(e) => setEditTaskPriority(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-slate-400 text-xs">Status</Label>
                              <select
                                value={editTaskStatus}
                                onChange={(e) => setEditTaskStatus(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200"
                              >
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Description</Label>
                          <textarea
                            value={editTaskDescription}
                            onChange={(e) => setEditTaskDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <ExtrudedButton size="sm" onClick={() => setEditingTaskId(null)} className="bg-slate-600">
                            Cancel
                          </ExtrudedButton>
                          <ExtrudedButton size="sm" onClick={handleSaveEdit} className="bg-purple-600">
                            Save Changes
                          </ExtrudedButton>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds([...selectedTaskIds, t.id]);
                            } else {
                              setSelectedTaskIds(selectedTaskIds.filter(id => id !== t.id));
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-950"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-slate-200">{t.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                              t.priority === "Critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                              t.priority === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                              t.priority === "Medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                              "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            )}>{t.priority || "Medium"}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                              t.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                              t.status === "in-progress" ? "bg-yellow-500/10 text-yellow-400 animate-pulse" :
                              "bg-slate-500/10 text-slate-400"
                            )}>{t.status}</span>
                          </div>
                          <p className="text-xs text-slate-450">{t.description}</p>
                          {t.createdAt && (
                            <p className="text-[10px] text-slate-500">Created: {new Date(t.createdAt).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {t.status !== "completed" && (
                            <ExtrudedButton size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateTaskStatus(t.id, "completed")}>
                              Complete
                            </ExtrudedButton>
                          )}
                          {t.status === "todo" && (
                            <ExtrudedButton size="sm" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => handleUpdateTaskStatus(t.id, "in-progress")}>
                              Start
                            </ExtrudedButton>
                          )}
                          <ExtrudedButton size="sm" className="bg-slate-600 hover:bg-slate-700" onClick={() => handleEditTask(t)}>
                            Edit
                          </ExtrudedButton>
                          <ExtrudedButton size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => handleDeleteTask(t.id)}>
                            Delete
                          </ExtrudedButton>
                        </div>
                      </div>
                    )}
                  </GlassPanel>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 3. CHAT MESSENGER TAB */}
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-slate-100">Live Client Messenger</h2>
            <GlassPanel className="border-slate-800 bg-slate-900/20 p-4 h-[500px] flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-500 text-center py-12 text-sm">No recent messages in this session.</p>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.senderRole === "agent" || msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex flex-col max-w-[70%] space-y-1", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                        <span className="text-[10px] text-slate-500">{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                        <div className={cn(
                          "p-3 rounded-2xl text-xs",
                          isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-slate-800/80 mt-4">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message to client..."
                  className="bg-slate-950 border-slate-850 rounded-xl"
                />
                <ExtrudedButton type="submit" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4" />
                </ExtrudedButton>
              </form>
            </GlassPanel>
          </motion.div>
        )}

        {/* 4. CALLS DIALER TAB */}
        {activeTab === "calls" && (
          <motion.div
            key="calls"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Interactive Dialer Card */}
            <GlassPanel tilt={false} className="border-slate-800 p-5 h-fit text-center space-y-6">
              <h3 className="text-lg font-bold text-slate-200">Outbound Softphone</h3>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-right">
                <span className="text-2xl font-mono tracking-wider text-slate-100">{dialedNumber || "Enter Number"}</span>
              </div>

              {callState === "idle" && (
                <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(k => (
                    <motion.button
                      key={k}
                      whileHover={{ scale: 1.08, borderColor: "rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDialedNumber(n => n + k)}
                      className="h-12 w-12 rounded-full border border-slate-800 hover:bg-slate-800/50 text-slate-200 text-lg font-bold flex items-center justify-center transition-colors duration-150"
                    >
                      {k}
                    </motion.button>
                  ))}
                </div>
              )}

              {callState === "ringing" && (
                <div className="py-6 space-y-2">
                  <p className="text-sm text-yellow-400 font-bold animate-pulse">Ringing outbound...</p>
                  <p className="text-xs text-slate-500">Connecting lines</p>
                </div>
              )}

              {callState === "connected" && (
                <div className="py-6 space-y-2">
                  <p className="text-sm text-green-400 font-bold">Line Connected</p>
                  <p className="text-xl font-mono text-slate-100">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {callState === "idle" ? (
                  <>
                    <button
                      onClick={() => setDialedNumber("")}
                      className="p-3.5 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleInitiateCall}
                      disabled={!dialedNumber}
                      className="p-3.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <PhoneCall className="h-6 w-6" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="p-3.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </button>
                )}
              </div>
            </GlassPanel>

            {/* List Call History */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Recent Calling Sessions</h3>
              <div className="space-y-3">
                {callsList.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No call records loaded.</p>
                ) : (
                  callsList.map(call => (
                    <div key={call.id} className="p-3.5 border border-slate-900 bg-slate-950/40 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{call.callerName} → {call.receiverName}</p>
                        <p className="text-slate-500 mt-0.5">{new Date(call.startedAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">{call.status}</span>
                        <p className="text-slate-450 mt-1">{call.duration}s</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. VOICE & WHATSAPP CONFIG TAB */}
        {activeTab === "voice-whatsapp" && (
          <motion.div
            key="voice-whatsapp"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto"
          >
            <GlassPanel tilt={false} className="border-slate-800 p-6 space-y-6">
            <h3 className="text-xl font-bold text-slate-100">AI Voice & Messaging Parameters</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="agent-call-framework" className="text-slate-350">Discovery Call Conversation Framework</Label>
                <textarea
                  id="agent-call-framework"
                  rows={4}
                  value={callFramework}
                  onChange={(e) => setCallFramework(e.target.value)}
                  placeholder="Insert prompt strategy for discovery calls..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-whatsapp-framework" className="text-slate-350">WhatsApp Message Sequence Parameters</Label>
                <textarea
                  id="agent-whatsapp-framework"
                  rows={4}
                  value={whatsAppParams}
                  onChange={(e) => setWhatsAppParams(e.target.value)}
                  placeholder="Insert WhatsApp message framework sequence..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                />
              </div>

              <ExtrudedButton className="bg-gradient-to-r from-purple-600 to-indigo-600 font-bold py-2 w-full" onClick={() => showToast("success", "Settings Saved", "AI voice and WhatsApp parameters updated.")}>
                Save AI Settings
              </ExtrudedButton>
            </div>
          </GlassPanel>
        </motion.div>
      )}

        {/* 6. GTM PLAYBOOKS TAB */}
        {activeTab === "gtm-playbook" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">GTM Playbooks</h2>
                <p className="text-slate-400 text-xs mt-1">View AI-generated Go-to-Market Playbooks for your customers</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPlaybookCustomerId}
                  onChange={(e) => {
                    setSelectedPlaybookCustomerId(e.target.value);
                    fetchPlaybookForCustomer(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 min-w-[220px]"
                >
                  <option value="">— Select a customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name || c.email || c.id}
                    </option>
                  ))}
                </select>
                {selectedPlaybookCustomerId && (
                  <button
                    onClick={() => fetchPlaybookForCustomer(selectedPlaybookCustomerId)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {!selectedPlaybookCustomerId && (
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-8 text-center space-y-3">
                <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Select a customer above to view their GTM Playbook</p>
              </GlassPanel>
            )}

            {selectedPlaybookCustomerId && playbookLoading && (
              <GlassPanel tilt={false} className="border-blue-500/20 bg-blue-950/10 p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                <p className="text-blue-300 text-sm font-bold">Loading playbook...</p>
              </GlassPanel>
            )}

            {selectedPlaybookCustomerId && !playbookLoading && agentPlaybooks.length === 0 && (
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-8 text-center space-y-3">
                <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No Playbook Found</h3>
                <p className="text-slate-500 text-xs">This customer has not completed the GTM intake form yet, or their playbook is still generating.</p>
              </GlassPanel>
            )}

            {selectedAgentPlaybook && (
              <div className="space-y-5">
                {agentPlaybooks.length > 1 && (
                  <select
                    value={selectedAgentPlaybook?.trackingId || ""}
                    onChange={(e) => setSelectedAgentPlaybook(agentPlaybooks.find(p => p.trackingId === e.target.value) || null)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {agentPlaybooks.map(p => (
                      <option key={p.trackingId} value={p.trackingId}>{p.productName} — {p.trackingId}</option>
                    ))}
                  </select>
                )}

                {selectedAgentPlaybook.status === "generating" && (
                  <GlassPanel tilt={false} className="border-blue-500/20 bg-blue-950/10 p-6 text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                    <h3 className="text-base font-bold text-blue-300">AI is generating this playbook...</h3>
                    <p className="text-blue-400/70 text-xs">Refresh in a moment to see the completed playbook.</p>
                  </GlassPanel>
                )}

                {selectedAgentPlaybook.status === "ready" && (
                  <div className="space-y-5">
                    <GlassPanel tilt={false} className="border-indigo-500/20 bg-indigo-950/10 p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/25 uppercase">Playbook Ready</span>
                            <span className="text-slate-500 text-[10px] font-mono">{selectedAgentPlaybook.trackingId}</span>
                            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">Confidence: {selectedAgentPlaybook.confidence}%</span>
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-100">{selectedAgentPlaybook.productName}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{selectedAgentPlaybook.companyName} · Generated {new Date(selectedAgentPlaybook.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                          <Download className="h-3.5 w-3.5" /> Export PDF
                        </button>
                      </div>
                      <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">Executive Summary</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{selectedAgentPlaybook.executiveSummary}</p>
                      </div>
                    </GlassPanel>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Target className="h-4 w-4 text-violet-400" /> ICP Profile</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{selectedAgentPlaybook.icpProfile?.description}</p>
                        <div><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Pain Points</p><ul className="space-y-1">{(selectedAgentPlaybook.icpProfile?.painPoints || []).map((p: string, i: number) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-red-400">•</span>{p}</li>)}</ul></div>
                        <div><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Decision Makers</p><div className="flex flex-wrap gap-1">{(selectedAgentPlaybook.icpProfile?.decisionMakers || []).map((d: string) => <span key={d} className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-500/20">{d}</span>)}</div></div>
                      </GlassPanel>
                      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> Channel Strategy</h4>
                        <div><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Priority Channels</p><div className="flex flex-wrap gap-1">{(selectedAgentPlaybook.channelStrategy?.priorityChannels || []).map((c: string) => <span key={c} className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-500/20">{c}</span>)}</div></div>
                        <div><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Hooks</p><ul className="space-y-1">{(selectedAgentPlaybook.channelStrategy?.hooks || []).map((h: string, i: number) => <li key={i} className="text-xs text-slate-400 italic flex gap-1.5"><span className="text-amber-400">&quot;</span>{h}</li>)}</ul></div>
                        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl"><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">CTA</p><p className="text-xs font-bold text-emerald-400">{selectedAgentPlaybook.channelStrategy?.cta}</p></div>
                      </GlassPanel>
                    </div>

                    <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><ArrowRight className="h-4 w-4 text-teal-400" /> Outreach Playbook Steps</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-slate-800"><th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">#</th><th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">Action</th><th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">Owner</th><th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">When</th><th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2">Channel</th></tr></thead>
                          <tbody className="divide-y divide-slate-900">
                            {(selectedAgentPlaybook.playbookSteps || []).map((step: any) => (
                              <tr key={step.step} className="hover:bg-slate-900/30 transition-colors">
                                <td className="py-2.5 pr-3"><span className="bg-teal-500/15 text-teal-400 border border-teal-500/25 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{step.step}</span></td>
                                <td className="py-2.5 pr-3 text-slate-300 font-semibold">{step.action}</td>
                                <td className="py-2.5 pr-3 text-slate-500">{step.owner}</td>
                                <td className="py-2.5 pr-3 text-slate-400">{step.timeframe}</td>
                                <td className="py-2.5"><span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">{step.channel}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </GlassPanel>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-400" /> Risk Assessment</h4>
                        <div className="space-y-2">{(selectedAgentPlaybook.riskAssessment || []).map((risk: any, i: number) => (<div key={i} className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs"><div className="flex justify-between items-start mb-1"><p className="font-bold text-slate-300">{risk.risk}</p><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${risk.likelihood === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/25' : risk.likelihood === 'medium' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'}`}>{risk.likelihood}</span></div><p className="text-slate-500 text-[10px]">→ {risk.mitigation}</p></div>))}</div>
                      </GlassPanel>
                      <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Brain className="h-4 w-4 text-purple-400" /> KPIs & Success Metrics</h4>
                        <div className="flex flex-wrap gap-1.5">{(selectedAgentPlaybook.kpis || []).map((kpi: string, i: number) => <span key={i} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px] font-bold">{kpi}</span>)}</div>
                        <div><p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Call Script</p><p className="text-xs text-slate-400 italic leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">{selectedAgentPlaybook.salesEnablement?.callScript}</p></div>
                      </GlassPanel>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AUTOMATED GTM ANALYSIS TAB */}
        {activeTab === "gtm-analysis" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-400" /> Automated GTM Analysis
              </h2>
              <p className="text-slate-400 text-xs mt-1">Real-time revenue intelligence, conversion bottlenecks, and lead quality scoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassPanel tilt={false} className="border-blue-500/20 bg-blue-950/10 p-5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-blue-400">Total Leads Analyzed</p>
                <p className="text-2xl font-extrabold text-white">1,248</p>
                <p className="text-xs text-blue-300/80">↑ 18% increase from last month</p>
              </GlassPanel>
              <GlassPanel tilt={false} className="border-violet-500/20 bg-violet-950/10 p-5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-violet-400">Avg Lead Quality Score</p>
                <p className="text-2xl font-extrabold text-white">88.4 / 100</p>
                <p className="text-xs text-violet-300/80">High intent qualification rate</p>
              </GlassPanel>
              <GlassPanel tilt={false} className="border-emerald-500/20 bg-emerald-950/10 p-5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Automated Pipeline Value</p>
                <p className="text-2xl font-extrabold text-white">$4.2M</p>
                <p className="text-xs text-emerald-300/80">Active opportunity volume</p>
              </GlassPanel>
            </div>

            <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200">GTM Analysis Summary</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated GTM analysis has processed all incoming prospect responses and firmographic data points.
                Key growth triggers identified include enterprise technology upgrades, compliance deadlines (SOC 2, ISO 27001), and expansion into NA/EMEA regions.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-bold">ICP Match: Enterprise SaaS</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold">Top Channel: Outbound Email & LinkedIn</span>
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-3 py-1 rounded-full font-bold">Avg Sales Cycle: 14 Days</span>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* 7. GENBI ASSISTANT TAB */}
        {activeTab === "genbi" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Bot className="h-6 w-6 text-fuchsia-400" /> Chatbot (Wren AI)</h2>
              <p className="text-slate-400 text-xs mt-1">Ask business questions in natural language — the AI converts them to Firestore queries and executes them live</p>
            </div>

            {/* Suggested query chips */}
            <div className="flex flex-wrap gap-2">
              {[
                "Show all GTM playbooks by status",
                "List customers with no playbook yet",
                "What are the top channels recommended across playbooks?",
                "Show GTM intakes from the last 7 days",
                "List leads by status",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setGenbInput(suggestion); }}
                  className="text-[10px] bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/25 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat thread */}
            <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/10 flex flex-col" style={{ minHeight: '500px' }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar" style={{ maxHeight: '520px' }}>
                {genbMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                    <Database className="h-10 w-10 text-slate-700" />
                    <p className="text-slate-500 text-sm font-bold">Ask anything about your data</p>
                    <p className="text-slate-600 text-xs max-w-sm">The Chatbot (Wren AI) converts your natural language questions into Firestore queries and returns live results from your data.</p>
                  </div>
                )}

                {genbMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Message bubble */}
                      <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-fuchsia-600/20 border border-fuchsia-500/30 text-slate-200 rounded-tr-sm'
                          : msg.error
                          ? 'bg-red-950/20 border border-red-500/20 text-red-300 rounded-tl-sm'
                          : 'bg-slate-900/60 border border-slate-800 text-slate-300 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>

                      {/* Generated Query display */}
                      {msg.query && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-bold">
                            <Database className="h-3 w-3" />
                            Generated Query
                            {msg.query.explanation && <span className="text-slate-600 normal-case font-normal ml-1">{msg.query.explanation}</span>}
                          </div>
                          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(msg.query, null, 2)}</pre>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setLastGeneratedQuery(msg.query);
                                sendGenbMessage(`Execute the query: ${msg.query.collection}`, "execute");
                              }}
                              className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Play className="h-3 w-3" /> Execute Query
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(msg.query, null, 2))}
                              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Download className="h-3 w-3" /> Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Results table */}
                      {msg.results && msg.results.length > 0 && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-bold">
                            <Table2 className="h-3 w-3" />
                            Results — {msg.rowCount} row{msg.rowCount !== 1 ? 's' : ''}
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-[10px]">
                              <thead className="bg-slate-900">
                                <tr>
                                  {Object.keys(msg.results[0]).slice(0, 8).map((k) => (
                                    <th key={k} className="text-left text-[9px] text-slate-500 uppercase font-bold px-3 py-2 border-b border-slate-800">{k}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900">
                                {msg.results.slice(0, 20).map((row: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-900/30">
                                    {Object.keys(msg.results![0]).slice(0, 8).map((k) => (
                                      <td key={k} className="px-3 py-2 text-slate-400 max-w-[150px] truncate">
                                        {typeof row[k] === 'object' ? JSON.stringify(row[k]).slice(0, 40) : String(row[k] ?? '—')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {msg.results && msg.results.length === 0 && (
                        <p className="text-xs text-slate-500 italic">Query returned 0 results.</p>
                      )}

                      {/* Error + Fix button */}
                      {msg.error && lastGeneratedQuery && (
                        <button
                          onClick={() => {
                            setLastQueryError(msg.error || "Unknown error");
                            sendGenbMessage(`Fix this error: ${msg.error}`, "fix");
                          }}
                          className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" /> Fix with AI
                        </button>
                      )}

                      <span className="text-[9px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}

                {genbLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-fuchsia-400" />
                      <span className="text-xs text-slate-400">Generating query...</span>
                    </div>
                  </div>
                )}
                <div ref={genbEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-slate-800 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={genbInput}
                    onChange={(e) => setGenbInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGenbMessage(genbInput); } }}
                    placeholder="Ask a question about your data... (e.g. 'Show GTM playbooks generated this week')"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-fuchsia-500/50"
                    disabled={genbLoading}
                  />
                  <button
                    onClick={() => sendGenbMessage(genbInput)}
                    disabled={genbLoading || !genbInput.trim()}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Generate SQL
                  </button>
                </div>
                {lastGeneratedQuery && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => sendGenbMessage("Execute the last query", "execute")}
                      disabled={genbLoading}
                      className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/25 text-emerald-400 font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" /> Execute Last Query
                    </button>
                    {lastQueryError && (
                      <button
                        onClick={() => sendGenbMessage(`Fix this: ${lastQueryError}`, "fix")}
                        disabled={genbLoading}
                        className="text-[10px] bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/25 text-amber-400 font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Fix Error with AI
                      </button>
                    )}
                    <button
                      onClick={() => setGenbMessages([])}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-500 font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* 8. DEALFLOW CRM TAB */}
        {activeTab === "dealflow-crm" && (
          <motion.div
            key="dealflow-crm"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <DealflowCRMWorkspace userRole="agent" userId={user?.id} />
          </motion.div>
        )}

        {/* 9. DEALFLOW MEETING BOT TAB */}
        {activeTab === "dealflow-bot" && (
          <motion.div
            key="dealflow-bot"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <AgentDealflowBotHub />
          </motion.div>
        )}

        {/* 10. EVOLUTION API WHATSAPP WORKBENCH & LIVE CHAT TAB */}
        {activeTab === "whatsapp-chat" && (
          <motion.div
            key="whatsapp-chat"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-emerald-400" /> WhatsApp Workbench &amp; Live Chat
                </h2>
                <p className="text-xs text-slate-400 mt-1">Multi-gateway encrypted WhatsApp communication hub supporting Evolution API and Open WA clusters with quota meters and live sync.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                Agent Meter: 200 msgs/day
              </span>
            </div>

            {/* Configured WhatsApp Integrations List */}
            <GlassPanel className="p-6 border-slate-800">
              <WhatsAppIntegrationsList />
            </GlassPanel>

            {/* Live WhatsApp Prospect Conversation Workspace */}
            <GlassPanel className="p-6 border-slate-800 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Dynamic CRM Prospect WhatsApp Contacts */}
                <div className="lg:col-span-1 space-y-3 border-r border-slate-800 pr-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">Prospect WhatsApp Contacts</h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {customers.length} Contacts
                    </span>
                  </div>

                  {customers.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                      <Users className="h-6 w-6 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">No customer accounts available.</p>
                      <p className="text-[10px] text-slate-500">Create or switch customer accounts to start WhatsApp conversations.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                      {customers.map((cust) => {
                        const targetId = cust.id;
                        const isSelected = (selectedChatContactId || customers[0]?.id) === targetId;
                        const cName = getCustomerDisplayName(cust);
                        const cPhone = cust.personalDetails?.phone || cust.phone || "+1 (555) 019-2831";
                        const cStage = cust.stage || cust.lifecycleStage || "Active Lead";

                        return (
                          <div
                            key={targetId}
                            onClick={() => setSelectedChatContactId(targetId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? "bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/30"
                                : "bg-slate-950/60 border-slate-850 hover:bg-slate-900/50 hover:border-slate-750"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200 text-xs truncate max-w-[140px]">{cName}</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {cStage}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{cPhone}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-1">
                              {cust.companyDetails?.companyName || cust.industry || "Dealflow Managed Client"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Dynamic Encrypted Chat Thread & Composer */}
                {(() => {
                  const activeCust = customers.find(c => c.id === (selectedChatContactId || customers[0]?.id)) || customers[0] || null;
                  const activeCustName = activeCust ? getCustomerDisplayName(activeCust) : "Selected Prospect";
                  const activeCustPhone = activeCust?.personalDetails?.phone || activeCust?.phone || "+1 (555) 019-2831";
                  const activeCustId = activeCust?.id || "default";
                  const currentMessages = liveWhatsAppMessages[activeCustId] || [];

                  return (
                    <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-bold text-slate-200 text-sm">
                              Chatting with {activeCustName} ({activeCustPhone})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            SHA-256 Encrypted
                          </span>
                        </div>

                        {/* Thread Messages */}
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2 py-3">
                          {currentMessages.length === 0 ? (
                            <div className="p-8 text-center rounded-xl bg-slate-950/30 border border-dashed border-slate-850 space-y-2">
                              <MessageSquare className="h-6 w-6 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-300 font-semibold">
                                Ready to message {activeCustName}
                              </p>
                              <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                                Type a message below to dispatch autonomous meeting invitations, proposals, or live deal updates via WhatsApp.
                              </p>
                            </div>
                          ) : (
                            currentMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-3 text-xs max-w-[80%] rounded-2xl ${
                                  msg.sender === "agent"
                                    ? "bg-emerald-950/40 border border-emerald-500/20 text-slate-200 ml-auto rounded-tr-sm"
                                    : "bg-slate-900/80 border border-slate-800 text-slate-300 rounded-tl-sm"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`text-[10px] font-bold ${msg.sender === "agent" ? "text-emerald-300" : "text-slate-400"}`}>
                                    {msg.sender === "agent" ? "You (Agent)" : activeCustName}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500">{msg.time}</span>
                                </div>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Message Composer */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <Textarea
                          placeholder={`Type an encrypted WhatsApp message to ${activeCustName}...`}
                          rows={2}
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendWhatsAppChat(activeCustPhone, activeCustId);
                            }
                          }}
                          className="bg-slate-950 border-slate-800 text-white text-xs focus:border-emerald-500 rounded-xl"
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setChatInputText("Hi, following up regarding your sales proposal and scheduled strategy call.")}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[10px] transition"
                            >
                              Insert Demo Template
                            </button>
                            <button
                              type="button"
                              onClick={() => setChatInputText("Please find our calendar availability to finalize next steps: https://calendly.com/dealflow-strategy")}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[10px] transition"
                            >
                              Insert Calendar Link
                            </button>
                          </div>
                          <ExtrudedButton
                            size="sm"
                            onClick={() => handleSendWhatsAppChat(activeCustPhone, activeCustId)}
                            disabled={isSendingWhatsApp || !chatInputText.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center gap-1.5 shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSendingWhatsApp ? "Sending..." : "Send WhatsApp Message"}</span>
                          </ExtrudedButton>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* 22. BILLIONMAIL OUTBOUND HUB TAB */}
        {activeTab === "billionmail-hub" && (
          <motion.div
            key="billionmail-hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <BillionmailHub />
          </motion.div>
        )}

        {/* 23. SCRAPEGRAPH-AI STUDIO TAB */}
        {activeTab === "scrapegraph-studio" && (
          <motion.div
            key="scrapegraph-studio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <ScrapeGraphStudio />
          </motion.div>
        )}

        {/* 24. ACCOUNT SETTINGS & PROFILE TAB */}
        {activeTab === "account-settings" && (
          <motion.div
            key="account-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <CustomerProfileSettingsTab />
          </motion.div>
        )}

        </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}



export default function AgentPortal() {
  return (
    <AuthProvider allowedRoles={["agent"]}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      }>
        <AgentPortalContent />
      </Suspense>
    </AuthProvider>
  );
}
