"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { StaggerReveal } from "@/components/immersive/StaggerReveal";
import {
  Users,
  Activity,
  BarChart3,
  MessageSquare,
  Phone,
  FileText,
  Download,
  Bell,
  Star,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  UserPlus,
  UserX,
  FolderOpen,
  Check,
  Archive,
  KeyRound,
  Settings,
  TrendingUp,
  Cpu,
  Menu,
  Globe,
  ShieldAlert,
  Layers,
  Sparkles,
  Briefcase,
  RefreshCw,
  CreditCard,
  Trash2,
  Lock,
} from "lucide-react";
import { DealflowCRMWorkspace } from "@/components/portal/DealflowCRMWorkspace";
import { cn } from "@/lib/utils";
import { generateRandomStrongPassword } from "@/lib/password-utils";
import { PasswordInput } from "@/components/ui/PasswordInput";
import AuthProvider from "@/components/auth/AuthProvider";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getDb } from "@/lib/firebase-client";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { AgentSession, AgentAssignmentNotification } from "@/lib/types";

import { UsersOrgsModule } from "@/components/portal/admin/UsersOrgsModule";
import { RolesPermissionsModule } from "@/components/portal/admin/RolesPermissionsModule";
import { SubscriptionsBillingModule } from "@/components/portal/admin/SubscriptionsBillingModule";
import { UsageAnalyticsModule } from "@/components/portal/admin/UsageAnalyticsModule";
import { SecurityManagementModule } from "@/components/portal/admin/SecurityManagementModule";
import { AuditLogsModule } from "@/components/portal/admin/AuditLogsModule";
import { SystemHealthModule } from "@/components/portal/admin/SystemHealthModule";
import { PlatformSettingsModule } from "@/components/portal/admin/PlatformSettingsModule";
import { AgentsModule } from "@/components/portal/admin/AgentsModule";
import { CustomersModule } from "@/components/portal/admin/CustomersModule";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Activity, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "users-orgs", label: "Users & Organizations", icon: Users, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "roles-permissions", label: "Roles & Permissions", icon: KeyRound, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10" },
  { id: "subscriptions-billing", label: "Subscriptions & Billing", icon: CreditCard, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "usage-analytics", label: "Usage & Analytics", icon: BarChart3, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10" },
  { id: "security-management", label: "Security Management", icon: ShieldAlert, color: "text-rose-400 border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/10" },
  { id: "audit-logs-module", label: "Audit Logs", icon: FileText, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
  { id: "system-health-module", label: "System Health", icon: Activity, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "platform-settings-module", label: "Platform Settings", icon: Settings, color: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10" },
  { id: "agents", label: "Agents", icon: UserPlus, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "customers", label: "Customers", icon: Users, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "tasks", label: "Tasks", icon: ClipboardList, color: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10" },
  { id: "dealflow-crm", label: "Dealflow CRM", icon: Briefcase, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
  { id: "llm-manager", label: "LLM Manager", icon: BarChart3, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10" },
  { id: "bot-monitor", label: "Bot Monitor", icon: Phone, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "orchestrator", label: "Orchestrator", icon: Cpu, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10" },
  { id: "password-requests", label: "Password Requests", icon: KeyRound, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
  { id: "gtm-reports", label: "GTM Reports", icon: BarChart3, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10" },
  { id: "documents", label: "Documents", icon: FolderOpen, color: "text-orange-400 border-orange-500/30 hover:border-orange-500/60 shadow-orange-500/10" },
  { id: "requirements", label: "Requirements", icon: FileText, color: "text-rose-400 border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/10" },
  { id: "resignations", label: "Resignations", icon: UserX, color: "text-pink-400 border-pink-500/30 hover:border-pink-500/60 shadow-pink-500/10" },
  { id: "interactions", label: "Interactions", icon: MessageSquare, color: "text-sky-400 border-sky-500/30 hover:border-sky-500/60 shadow-sky-500/10" },
  { id: "whatsapp-archive", label: "WhatsApp Vault", icon: MessageSquare, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "crm-sync-center", label: "CRM Sync Queue", icon: RefreshCw, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10" },
] as const;

function AdminPortalContent() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("dashboard");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Widget States for customizable dashboard
  const [widgets, setWidgets] = useState<string[]>([
    "llm-metrics",
    "revenue-credits",
    "system-health",
    "website-monitoring",
    "users",
    "audit-logs",
    "alerts"
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
    setWidgets(["llm-metrics", "revenue-credits", "system-health", "website-monitoring", "users", "audit-logs", "alerts"]);
  };
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [gtmReports, setGtmReports] = useState<any[]>([]);
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showChangeOwnPassword, setShowChangeOwnPassword] = useState(false);
  const [ownCurrentPassword, setOwnCurrentPassword] = useState("");
  const [ownNewPassword, setOwnNewPassword] = useState("");
  const [changingOwnPassword, setChangingOwnPassword] = useState(false);

  const [showDirectResetModal, setShowDirectResetModal] = useState(false);
  const [directResetEmail, setDirectResetEmail] = useState("");
  const [directResetRole, setDirectResetRole] = useState<"customer" | "agent">("customer");
  const [directResetPassword, setDirectResetPassword] = useState("");
  const [directResetting, setDirectResetting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [filterTaskAgent, setFilterTaskAgent] = useState("all");
  const [filterTaskCustomer, setFilterTaskCustomer] = useState("all");
  const [filterTaskDateRange, setFilterTaskDateRange] = useState("all");

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to remove agent "${agentName}"? Any assigned tasks will remain in records.`)) {
      return;
    }
    setAgents(prev => prev.filter(a => a.id !== agentId));
    toast.success(`Agent "${agentName}" removed successfully.`);
    try {
      await fetch(`/api/admin/agents?id=${agentId}`, { method: "DELETE" }).catch(() => null);
    } catch {}
  };

  // New Admin Dashboard State
  const [waArchiveMsgs, setWaArchiveMsgs] = useState<any[]>([]);
  const [crmQueueStatus, setCrmQueueStatus] = useState<any>(null);
  const [botOpsMetrics, setBotOpsMetrics] = useState<any>(null);
  const [retryingCrmQueue, setRetryingCrmQueue] = useState(false);

  useEffect(() => {
    fetchAdminSpecializedData();
  }, []);

  const fetchAdminSpecializedData = async () => {
    try {
      const waRes = await fetch("/api/whatsapp/messages?role=admin&archive=true");
      const waData = await waRes.json();
      if (waData.success) setWaArchiveMsgs(waData.archive || []);

      const crmRes = await fetch("/api/crm/sync?role=admin&queue=true");
      const crmData = await crmRes.json();
      if (crmData.success) setCrmQueueStatus(crmData);

      const botRes = await fetch("/api/portal/meeting-bot/control?role=admin");
      const botData = await botRes.json();
      if (botData.success) setBotOpsMetrics(botData);
    } catch (e) {
      console.error("Failed to load admin specialized data", e);
    }
  };

  const handleRetryCrmQueue = async () => {
    try {
      setRetryingCrmQueue(true);
      const res = await fetch("/api/crm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry_failed_queue" }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          title: "CRM Sync Queue Retried",
          message: `Successfully retried ${data.retriedCount} queue items. Remaining failed: ${data.remainingFailedCount}`,
        });
        fetchAdminSpecializedData();
      }
    } catch (e: any) {
      setNotification({
        type: "error",
        title: "Retry Failed",
        message: e?.message || "Sync queue retry error",
      });
    } finally {
      setRetryingCrmQueue(false);
    }
  };
  
  // Modals and forms
  const [showOnboardCustomer, setShowOnboardCustomer] = useState(false);
  const [onboardFormData, setOnboardFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    industry: "",
    assignedAgentId: "",
    businessModel: "b2b",
    serviceConfigs: {
      gtmReports: true,
      leadScoring: false,
      aiCalls: false,
      wrenChatbot: true,
      automatedGtmAnalysis: true,
      playbookGeneration: true,
    },
  });

  const [showProcessResignation, setShowProcessResignation] = useState(false);
  const [selectedResCustomer, setSelectedResCustomer] = useState<any>(null);
  const [resignationFormData, setResignationFormData] = useState({
    requestDate: new Date().toISOString().split("T")[0],
    effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    terminationReason: "",
    notes: "",
  });

  // Search & Filters state
  const [taskSearch, setTaskSearch] = useState("");
  const [filterTaskStatus, setFilterTaskStatus] = useState("all");
  const [filterTaskPriority, setFilterTaskPriority] = useState("all");
  const [filterTaskAssignee, setFilterTaskAssignee] = useState("all");

  const [customerSearch, setCustomerSearch] = useState("");
  const [filterCustomerStatus, setFilterCustomerStatus] = useState("all");

  const [documentSearch, setDocumentSearch] = useState("");
  const [filterDocumentType, setFilterDocumentType] = useState("all");

  const [reqSearch, setReqSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Core collections data
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [resignations, setResignations] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [localAuditLogs, setLocalAuditLogs] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Agent assignments and session logs
  const [agentAssignments, setAgentAssignments] = useState<AgentAssignmentNotification[]>([]);
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([]);
  
  // LLM Metrics
  const [llmMetrics, setLlmMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);

  // Agent Form
  const [agentFormData, setAgentFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Helper function to safely fetch and parse JSON without crashing on empty/non-JSON responses
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url).catch(() => null);
      if (!res || !res.ok) {
        return { success: false };
      }
      return await res.json().catch(() => ({ success: false }));
    } catch {
      return { success: false };
    }
  };

  // 1. Fetching logic (polling fallback for real-time cross-role sync)
  const fetchPortalData = async () => {
    try {
      const [
        agentsData,
        customersData,
        tasksData,
        reqsData,
        resignData,
        docsData,
        auditData,
        gtmData,
        feedbackData,
        callsData,
        chatData,
      ] = await Promise.all([
        safeFetchJson("/api/admin/agents"),
        safeFetchJson("/api/admin/customers"),
        safeFetchJson("/api/portal/tasks"),
        safeFetchJson("/api/portal/requirements"),
        safeFetchJson("/api/portal/resignations"),
        safeFetchJson("/api/portal/documents"),
        safeFetchJson("/api/admin/audit-logs"),
        safeFetchJson("/api/portal/gtm-reports"),
        safeFetchJson("/api/portal/feedback"),
        safeFetchJson("/api/portal/calls"),
        safeFetchJson("/api/portal/chat?sessionId=session-1"),
      ]);

      if (agentsData.success && agentsData.agents) setAgents(agentsData.agents);
      if (customersData.success && customersData.customers) setCustomers(customersData.customers);
      if (tasksData.success && tasksData.tasks) setTasks(tasksData.tasks);
      if (reqsData.success && reqsData.requirements) setRequirements(reqsData.requirements);
      if (resignData.success && resignData.resignations) setResignations(resignData.resignations);
      if (docsData.success && docsData.documents) setDocuments(docsData.documents);
      if (auditData.success && auditData.logs) setLocalAuditLogs(auditData.logs);
      if (gtmData.success && gtmData.reports) setGtmReports(gtmData.reports);
      if (feedbackData.success && feedbackData.feedback) setFeedbackList(feedbackData.feedback);
      if (callsData.success && callsData.calls) setCalls(callsData.calls);
      if (chatData.success && chatData.messages) setChatMessages(chatData.messages);

    } catch (error) {
      console.error("[Admin Portal] Polling error:", error);
    }
  };

  const fetchLlmMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await safeFetchJson("/api/llm-manager/metrics");
      if (data.success) {
        if (data.metrics) setLlmMetrics(data.metrics);
        if (data.recentInteractions) setRecentInteractions(data.recentInteractions);
      }
    } catch (error) {
      console.error("Failed to load LLM metrics:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchPasswordRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await safeFetchJson("/api/admin/password-requests");
      if (data.success && data.requests) {
        setPasswordRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch password requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Orchestrator metrics and events state
  const [orchestratorStats, setOrchestratorStats] = useState<any>(null);
  const [orchestratorEvents, setOrchestratorEvents] = useState<any[]>([]);
  const [isLoadingOrchestrator, setIsLoadingOrchestrator] = useState(false);

  const fetchOrchestratorData = async () => {
    setIsLoadingOrchestrator(true);
    try {
      const [statsData, eventsData] = await Promise.all([
        safeFetchJson("/api/integrated/observability/stats"),
        safeFetchJson("/api/integrated/observability/events?limit=50"),
      ]);
      if (statsData.success && statsData.stats) {
        setOrchestratorStats(statsData.stats);
      }
      if (eventsData.success && eventsData.events) {
        setOrchestratorEvents(eventsData.events);
      }
    } catch (error) {
      console.error("Failed to load Orchestrator data:", error);
    } finally {
      setIsLoadingOrchestrator(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "llm-manager") {
      fetchLlmMetrics();
    } else if (activeTab === "password-requests") {
      fetchPasswordRequests();
    } else if (activeTab === "orchestrator") {
      fetchOrchestratorData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "orchestrator") return;
    fetchOrchestratorData();
    const interval = setInterval(fetchOrchestratorData, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Real-time Firestore sync (for agent Sessions and Assignments if Firebase client is set up)
  useEffect(() => {
    const firestore = getDb();
    if (!firestore) return;

    const notificationsQuery = query(collection(firestore, "agent_notifications"), orderBy("sentAt", "desc"), limit(20));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const newAssignments = snapshot.docs.map(doc => ({
        ...doc.data(),
        sessionId: doc.id,
      })) as AgentAssignmentNotification[];
      setAgentAssignments(newAssignments);
    });

    const sessionsQuery = query(collection(firestore, "agentSessions"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const newSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AgentSession[];
      setAgentSessions(newSessions);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeSessions();
    };
  }, []);

  // Handlers
  const handleGenerateResetPassword = () => {
    setNewPassword(generateRandomStrongPassword());
  };

  const handleGenerateAgentPassword = () => {
    setAgentFormData((prev) => ({ ...prev, password: generateRandomStrongPassword() }));
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentFormData),
      });

      const data = await res.json();
      if (data.success) {
        setAgents([...agents, data.agent]);
        setShowCreateAgent(false);
        setAgentFormData({ name: "", email: "", password: "" });
        setNotification({
          type: "success",
          title: "Agent Created",
          message: `${data.agent.name}'s account has been successfully created.`,
        });
      } else {
        setNotification({ type: "error", title: "Error", message: data.error || "Failed to create agent" });
      }
    } catch (error) {
      setNotification({ type: "error", title: "Error", message: "Failed to connect to backend" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleOnboardCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboard",
          name: onboardFormData.name,
          email: onboardFormData.email,
          phone: onboardFormData.phone,
          companyName: onboardFormData.companyName,
          industry: onboardFormData.industry,
          assignedAgentId: onboardFormData.assignedAgentId,
          assignedAgentName: agents.find(a => a.id === onboardFormData.assignedAgentId)?.name || "",
          businessModel: onboardFormData.businessModel,
          serviceConfigurations: onboardFormData.serviceConfigs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowOnboardCustomer(false);
        setOnboardFormData({
          name: "",
          email: "",
          phone: "",
          companyName: "",
          industry: "",
          assignedAgentId: "",
          businessModel: "b2b",
          serviceConfigs: {
            gtmReports: true,
            leadScoring: false,
            aiCalls: false,
            wrenChatbot: true,
            automatedGtmAnalysis: true,
            playbookGeneration: true,
          },
        });
        setNotification({
          type: "success",
          title: "Customer Onboarded",
          message: `${data.customer.name} has been onboarded. Default Password: ${data.defaultPassword}`,
        });
        fetchPortalData();
      } else {
        setNotification({ type: "error", title: "Error", message: data.error || "Onboarding failed" });
      }
    } catch (err) {
      setNotification({ type: "error", title: "Error", message: "Failed to connect to backend" });
    } finally {
      setTimeout(() => setNotification(null), 8000);
    }
  };

  const handleUpdateBusinessModel = async (customerId: string, newModel: string) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, businessModel: newModel }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", title: "Business Model Updated", message: `Successfully updated to ${newModel.toUpperCase()}` });
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", title: "Task Updated", message: "Task status synced to database" });
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleInitiateResignation = (customer: any) => {
    setSelectedResCustomer(customer);
    setShowProcessResignation(true);
  };

  const handleProcessResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResCustomer) return;

    try {
      const res = await fetch("/api/portal/resignations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedResCustomer.id,
          customerName: selectedResCustomer.name,
          requestDate: resignationFormData.requestDate,
          effectiveDate: resignationFormData.effectiveDate,
          terminationReason: resignationFormData.terminationReason,
          notes: resignationFormData.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowProcessResignation(false);
        setSelectedResCustomer(null);
        setResignationFormData({
          requestDate: new Date().toISOString().split("T")[0],
          effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          terminationReason: "",
          notes: "",
        });
        setNotification({ type: "success", title: "Resignation Processed", message: "Customer status set to Resigned" });
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleProcessReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newPassword) return;
    setResettingPassword(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: selectedRequest.id, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          title: "Password Reset Approved",
          message: `Password has been successfully updated for ${selectedRequest.email}.`,
        });
        setShowResetModal(false);
        setSelectedRequest(null);
        setNewPassword("");
        fetchPasswordRequests();
      } else {
        setNotification({ type: "error", title: "Failed", message: data.error || "Reset failed" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingPassword(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownCurrentPassword || !ownNewPassword) return;
    setChangingOwnPassword(true);
    try {
      const res = await fetch("/api/admin/change-own-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: ownCurrentPassword, newPassword: ownNewPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          title: "Password Updated",
          message: "Your admin password has been successfully updated.",
        });
        setShowChangeOwnPassword(false);
        setOwnCurrentPassword("");
        setOwnNewPassword("");
      } else {
        setNotification({
          type: "error",
          title: "Update Failed",
          message: data.error || "Failed to update password.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setChangingOwnPassword(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDirectResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directResetEmail || !directResetPassword) return;
    setDirectResetting(true);
    try {
      const res = await fetch("/api/admin/direct-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: directResetEmail,
          targetRole: directResetRole,
          newPassword: directResetPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          title: "Password Reset Approved",
          message: data.message || `Password has been successfully updated for ${directResetEmail}.`,
        });
        setShowDirectResetModal(false);
        setDirectResetEmail("");
        setDirectResetPassword("");
      } else {
        setNotification({
          type: "error",
          title: "Reset Failed",
          message: data.error || "Failed to reset password.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setDirectResetting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleGenerateOwnPassword = () => {
    setOwnNewPassword(generateRandomStrongPassword());
  };

  const handleGenerateDirectPassword = () => {
    setDirectResetPassword(generateRandomStrongPassword());
  };

  const handleUpdateReqStatus = async (reqId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/portal/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", title: "Requirement Updated", message: `Status updated to ${newStatus}` });
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const autoAssignReq = async (reqId: string) => {
    if (agents.length === 0) return;
    // Workload assignment: pick the agent with the least assigned requirements
    const workloads = new Map<string, number>();
    agents.forEach(a => workloads.set(a.id, 0));
    requirements.forEach(r => {
      if (r.assignedAgentId && workloads.has(r.assignedAgentId)) {
        workloads.set(r.assignedAgentId, workloads.get(r.assignedAgentId)! + 1);
      }
    });

    let bestAgent = agents[0];
    let minLoad = workloads.get(bestAgent.id) || 0;
    agents.forEach(a => {
      const load = workloads.get(a.id) || 0;
      if (load < minLoad) {
        minLoad = load;
        bestAgent = a;
      }
    });

    try {
      await fetch("/api/portal/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reqId,
          assignedAgentId: bestAgent.id,
          assignedAgentName: bestAgent.name,
          status: "In Progress",
        }),
      });
      setNotification({ type: "success", title: "Auto-Assigned", message: `Assigned to ${bestAgent.name}` });
      fetchPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  // Stats Calculations
  const b2bCount = customers.filter(c => c.businessModel === "b2b").length;
  const b2cCount = customers.filter(c => c.businessModel === "b2c").length;
  const d2cCount = customers.filter(c => c.businessModel === "d2c").length;
  const customCount = customers.filter(c => c.businessModel === "custom").length;
  const activeCustomersCount = customers.filter(c => c.status === "active" || !c.status).length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  const avgRating = feedbackList.length
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
    : "4.8";

  const activeTabObj = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFBFD] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased">
      {/* Left Sidebar Navigation */}
      <PortalSidebar
        role="admin"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PortalHeader
          role="admin"
          activeTabLabel={activeTabObj?.label || "Dashboard"}
          userName="System Administrator"
          userEmail="admin@dealflow.ai"
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
                Administrator Governance Center
              </h1>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] mt-1 text-xs">
                Centralized orchestration dashboard for user governance, LLM metrics, CRM queues, and platform security
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!confirm("Are you sure you want to permanently purge all lingering dummy/sample records from the database?")) return;
                  try {
                    const res = await fetch("/api/admin/cleanup-default-data", { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(data.message || "Database clean-up successful!");
                      fetchPortalData();
                    } else {
                      toast.error(data.error || "Cleanup failed");
                    }
                  } catch {
                    toast.error("Cleanup request failed");
                  }
                }}
                className="btn-apple-secondary text-xs h-9 px-3.5 text-rose-400 hover:text-rose-300 border-rose-500/20 hover:border-rose-500/40"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 text-rose-400" />
                Purge Sample Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowChangeOwnPassword(true)}
                className="btn-apple-secondary text-xs h-9 px-4"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5 text-[#FF9500]" />
                Change Password
              </Button>
              <Button
                variant="outline"
                className="btn-apple-secondary relative text-xs h-9 px-4"
              >
                <Bell className="h-3.5 w-3.5 mr-1.5 text-[#0071E3]" />
                Notifications
                {(agentAssignments.length + localAuditLogs.length) > 0 && (
                  <span className="ml-1.5 bg-[#0071E3] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {agentAssignments.length + localAuditLogs.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

        {/* Tab Content Display Panels */}
        <div className="mt-4">
        
        {/* Create Agent Modal */}
        {showCreateAgent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
                <CardTitle className="text-lg text-slate-100 font-bold">Register New Agent</CardTitle>
                <button className="text-slate-400 hover:text-white p-1" onClick={() => setShowCreateAgent(false)}>
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateAgent} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-name" className="text-slate-350">Full Name</Label>
                    <Input
                      id="agent-name"
                      placeholder="e.g. Ashok Kumar"
                      value={agentFormData.name}
                      onChange={(e) => setAgentFormData({ ...agentFormData, name: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 text-slate-200 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-email" className="text-slate-350">Email Address</Label>
                    <Input
                      id="agent-email"
                      type="email"
                      placeholder="ashok@dealflow.ai"
                      value={agentFormData.email}
                      onChange={(e) => setAgentFormData({ ...agentFormData, email: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 text-slate-200 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="agent-password" className="text-slate-350">Password</Label>
                      <button
                        type="button"
                        onClick={handleGenerateAgentPassword}
                        className="text-[9px] font-bold text-teal-400 hover:text-teal-300 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <PasswordInput
                      id="agent-password"
                      placeholder="Enter secure password"
                      value={agentFormData.password}
                      onChange={(e) => setAgentFormData({ ...agentFormData, password: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 text-slate-200 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-800/80 mt-6">
                    <ExtrudedButton type="button" variant="outline" className="flex-1" onClick={() => setShowCreateAgent(false)}>
                      Cancel
                    </ExtrudedButton>
                    <ExtrudedButton type="submit" className="flex-1 bg-gradient-to-br from-teal-600 to-cyan-600" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                    </ExtrudedButton>
                  </div>
                </form>
              </CardContent>
            </GlassPanel>
          </div>
        )}

        {/* Onboard Customer Modal */}
        {showOnboardCustomer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassPanel tilt={false} className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
                <CardTitle className="text-lg text-slate-100 font-bold">Onboard New Customer</CardTitle>
                <button className="text-slate-400 hover:text-white p-1" onClick={() => setShowOnboardCustomer(false)}>
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 max-h-[75vh] overflow-y-auto space-y-4">
                <form onSubmit={handleOnboardCustomer} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-name" className="text-slate-350">Customer Full Name</Label>
                    <Input
                      id="customer-name"
                      placeholder="e.g. John Doe"
                      value={onboardFormData.name}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, name: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-email" className="text-slate-350">Email Address</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="john@example.com"
                      value={onboardFormData.email}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, email: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-phone" className="text-slate-350">Phone Number</Label>
                    <Input
                      id="customer-phone"
                      placeholder="+1-555-123-4567"
                      value={onboardFormData.phone}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, phone: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-company" className="text-slate-350">Company Name</Label>
                    <Input
                      id="customer-company"
                      placeholder="Acme Corp"
                      value={onboardFormData.companyName}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, companyName: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-industry" className="text-slate-350">Industry</Label>
                    <Input
                      id="customer-industry"
                      placeholder="e.g. Fintech, E-Commerce"
                      value={onboardFormData.industry}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, industry: e.target.value })}
                      className="bg-slate-950/80 border-slate-800 focus:border-teal-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assigned-agent" className="text-slate-350">Assigned Account Manager</Label>
                    <select
                      id="assigned-agent"
                      value={onboardFormData.assignedAgentId}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, assignedAgentId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Agent...</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="business-model" className="text-slate-350">Initial Operating Model</Label>
                    <select
                      id="business-model"
                      value={onboardFormData.businessModel}
                      onChange={(e) => setOnboardFormData({ ...onboardFormData, businessModel: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="b2b">B2B Enterprise</option>
                      <option value="b2c">B2C Retail</option>
                      <option value="d2c">D2C Storefront</option>
                      <option value="custom">Custom Parameters</option>
                    </select>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-slate-350 font-bold block mb-1">Service Modules Configuration</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.gtmReports}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, gtmReports: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                        />
                        GTM Reports (Legacy)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.leadScoring}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, leadScoring: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                        />
                        Lead Scoring
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.aiCalls}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, aiCalls: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                        />
                        AI Voice calls
                      </label>
                      <div className="h-px bg-slate-800/60 col-span-full my-1" />
                      <label className="flex items-center gap-2 text-sm text-fuchsia-300 font-bold cursor-pointer hover:text-fuchsia-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.wrenChatbot}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, wrenChatbot: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500"
                        />
                        Chatbot (Wren AI)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-blue-300 font-bold cursor-pointer hover:text-blue-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.automatedGtmAnalysis}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, automatedGtmAnalysis: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                        />
                        Automated GTM Analysis
                      </label>
                      <label className="flex items-center gap-2 text-sm text-purple-300 font-bold cursor-pointer hover:text-purple-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={onboardFormData.serviceConfigs.playbookGeneration}
                          onChange={(e) => setOnboardFormData({
                            ...onboardFormData,
                            serviceConfigs: { ...onboardFormData.serviceConfigs, playbookGeneration: e.target.checked }
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                        />
                        Playbook Generation
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6 border-t border-slate-800/80 mt-6">
                    <ExtrudedButton type="button" variant="outline" className="flex-1" onClick={() => setShowOnboardCustomer(false)}>
                      Cancel
                    </ExtrudedButton>
                    <button type="submit" className="flex-1 h-10 rounded-xl font-bold bg-gradient-to-br from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-950/20 active:scale-[0.98] transition-all">
                      Onboard Customer
                    </button>
                  </div>
                </form>
              </CardContent>
            </GlassPanel>
          </div>
        )}

        {/* Process Resignation Modal */}
        {showProcessResignation && selectedResCustomer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassPanel tilt={false} className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
                <CardTitle className="text-lg text-slate-100 font-bold">Process Resignation</CardTitle>
                <button className="text-slate-400 hover:text-white p-1" onClick={() => setShowProcessResignation(false)}>
                  <X className="h-5 w-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleProcessResignation} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-350">Customer Name</Label>
                    <p className="text-slate-100 font-bold text-sm bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {selectedResCustomer.name} ({selectedResCustomer.companyName})
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="resignation-reason" className="text-slate-350">Termination Reason</Label>
                    <Input
                      id="resignation-reason"
                      placeholder="e.g. Budget constraints, project finished"
                      value={resignationFormData.terminationReason}
                      onChange={(e) => setResignationFormData({ ...resignationFormData, terminationReason: e.target.value })}
                      className="bg-slate-950/80 border-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="resignation-notes" className="text-slate-350">Additional Notes</Label>
                    <textarea
                      id="resignation-notes"
                      placeholder="Notes for archiving..."
                      value={resignationFormData.notes}
                      onChange={(e) => setResignationFormData({ ...resignationFormData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-6 border-t border-slate-800/80 mt-6">
                    <ExtrudedButton type="button" variant="outline" className="flex-1" onClick={() => setShowProcessResignation(false)}>
                      Cancel
                    </ExtrudedButton>
                    <button type="submit" className="flex-1 h-10 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg active:scale-[0.98] transition-all">
                      Process Resignation
                    </button>
                  </div>
                </form>
              </CardContent>
            </GlassPanel>
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* High-Impact Top KPI Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatedMetricCard
                title="Active Customers"
                value={activeCustomersCount}
                change="+14% MoM"
                isPositive={true}
                subtitle={`${b2bCount} B2B · ${b2cCount} B2C · ${d2cCount} D2C`}
                icon={Users}
                accentColor="teal"
              />
              <AnimatedMetricCard
                title="Registered Agents"
                value={agents.length}
                change="+2 New"
                isPositive={true}
                subtitle="Active on call & task queue"
                icon={UserPlus}
                accentColor="violet"
              />
              <AnimatedMetricCard
                title="Task Completion Rate"
                value={`${completedTasks}/${totalTasks}`}
                change="94.2%"
                isPositive={true}
                subtitle="Platform tasks resolved"
                icon={Activity}
                accentColor="cyan"
              />
              <AnimatedMetricCard
                title="System CSAT Rating"
                value={`${avgRating} / 5`}
                change="+0.3"
                isPositive={true}
                subtitle={`Based on ${feedbackList.length || 12} reviews`}
                icon={Star}
                accentColor="amber"
              />
            </div>

            {widgets.length < 7 && (
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
                if (widgetId === "llm-metrics") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="LLM API Latency & Metrics"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Latency</span>
                            <span className="text-xl font-extrabold text-teal-400 mt-1 block">342ms</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Cache Hit Rate</span>
                            <span className="text-xl font-extrabold text-indigo-400 mt-1 block">78.4%</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>API Usage Cost (Est.)</span>
                            <span>$12.45 / $100 Limit</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: "12%" }} />
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("llm-manager")}
                          className="w-full text-center bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/5 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          LLM Config Manager
                        </button>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "revenue-credits") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Operating Models"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Revenue</span>
                            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">$24,500</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Average Rating</span>
                            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{avgRating} / 5</span>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-between text-xs pt-1">
                          <span className="text-slate-400">B2B: <strong className="text-slate-200">{b2bCount}</strong></span>
                          <span className="text-slate-400">B2C: <strong className="text-slate-200">{b2cCount}</strong></span>
                          <span className="text-slate-400">D2C: <strong className="text-slate-200">{d2cCount}</strong></span>
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "system-health") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="System Operations Uptime"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                          <span className="text-slate-400">Tasks Completed</span>
                          <span className="text-indigo-400 font-bold">{completedTasks} / {totalTasks} Tasks ({totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 100}%)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-slate-950/40 p-2 rounded border border-white/5 text-xs">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">Active Spans</span>
                            <span className="text-lg font-black text-blue-400">{orchestratorStats?.activeSpans ?? 2}</span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded border border-white/5 text-xs">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Events</span>
                            <span className="text-lg font-black text-purple-400">{orchestratorStats?.totalEvents ?? 12}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("orchestrator")}
                          className="w-full text-center bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/5 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          Open Orchestrator
                        </button>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "website-monitoring") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Website Monitoring (SDR Live)"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Uptime</span>
                            <span className="text-lg font-extrabold text-emerald-400 mt-1 block">99.98%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">SSL Status</span>
                            <span className="text-lg font-extrabold text-teal-400 mt-1 block">Valid (245d)</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                          <span className="text-slate-400 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-teal-400" /> dealflow.ai</span>
                          <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Online</span>
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "users") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Top Customer Accounts"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                          <span className="text-slate-400 font-bold">{customers.length} Onboarded</span>
                          <button onClick={() => setActiveTab("customers")} className="text-teal-400 hover:underline font-bold">Directory</button>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {customers.slice(0, 3).map((cust) => (
                            <div key={cust.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-200">{cust.companyName || cust.name}</p>
                                <p className="text-[9px] text-slate-550 mt-0.5">{cust.industry}</p>
                              </div>
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-400 font-bold uppercase">{cust.businessModel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "audit-logs") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="System Audit Trail Logs"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                          <span className="text-slate-450 font-bold">Live Stream</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {localAuditLogs.slice(0, 3).map((log) => (
                            <div key={log.id} className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-[11px] space-y-1">
                              <p className="font-bold text-slate-300 leading-tight">{log.actionDetails}</p>
                              <p className="text-[9px] text-slate-550 truncate">{log.performedBy || log.email}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                return (
                  <DashboardWidget
                    key={widgetId}
                    id={widgetId}
                    title="Active Alerts & Assignments"
                    onRemove={() => handleRemoveWidget(widgetId)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                        <span className="text-slate-400 font-bold">SDR Live Routing</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {agentAssignments.slice(0, 2).map((assign) => (
                          <div key={assign.sessionId} className="p-2 bg-slate-950/40 border border-white/5 rounded-xl flex gap-2 items-start">
                            <ShieldAlert className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-200 font-bold">Agent Assigned</p>
                              <p className="text-[10px] text-slate-550 mt-0.5">{assign.agentKey} for {assign.customerName}</p>
                            </div>
                          </div>
                        ))}
                        {agentAssignments.length === 0 && (
                          <p className="text-xs text-slate-550 italic py-6 text-center">No active assignments in stream.</p>
                        )}
                      </div>
                    </div>
                  </DashboardWidget>
                );
              })}
            </div>
          </div>
        )}

        {/* 13. ORCHESTRATOR MONITOR TAB */}
        {activeTab === "orchestrator" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-amber-400" />
                  Unified Workflow Orchestrator
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Monitoring task scheduling, message routing, and agent coordination in real time
                </p>
              </div>
              <ExtrudedButton 
                onClick={fetchOrchestratorData} 
                disabled={isLoadingOrchestrator}
                className="bg-amber-600 hover:bg-amber-700 text-xs py-2"
              >
                {isLoadingOrchestrator ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh Metrics"}
              </ExtrudedButton>
            </div>

            {/* Dashboard stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tasks</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-teal-400">{orchestratorStats?.totalTasks ?? 0}</p></CardContent>
              </GlassPanel>
              
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Traces / Spans</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-blue-400">{orchestratorStats?.activeSpans ?? 0}</p></CardContent>
              </GlassPanel>

              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-wider">Average Span Latency</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-extrabold text-amber-400">
                    {orchestratorStats?.averageSpanDuration ? `${(orchestratorStats.averageSpanDuration / 1000).toFixed(2)}s` : "0.00s"}
                  </p>
                </CardContent>
              </GlassPanel>

              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-xs font-bold uppercase tracking-wider">Workflow Events</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-purple-400">{orchestratorStats?.totalEvents ?? 0}</p></CardContent>
              </GlassPanel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task status overview */}
              <GlassPanel className="border-slate-800 p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-200">Execution Status Breakdown</h3>
                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Pending Tasks
                    </span>
                    <span className="font-extrabold text-slate-200">{orchestratorStats?.pendingTasks ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" /> In-Progress Tasks
                    </span>
                    <span className="font-extrabold text-slate-200">{orchestratorStats?.inProgressTasks ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed Tasks
                    </span>
                    <span className="font-extrabold text-slate-200">{orchestratorStats?.completedTasks ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed Tasks
                    </span>
                    <span className="font-extrabold text-slate-200">
                      {orchestratorEvents.filter(e => e.type === "task_failed").length}
                    </span>
                  </div>

                  {/* Calculated failure rate */}
                  {(() => {
                    const failedCount = orchestratorEvents.filter(e => e.type === "task_failed").length;
                    const completedCount = orchestratorStats?.completedTasks ?? 0;
                    const totalExecuted = failedCount + completedCount;
                    const failureRate = totalExecuted > 0 ? ((failedCount / totalExecuted) * 100).toFixed(1) : "0.0";
                    return (
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-center mt-4">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Calculated Failure Rate</p>
                        <p className={`text-4xl font-extrabold mt-1.5 ${Number(failureRate) > 15 ? 'text-rose-450' : Number(failureRate) > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {failureRate}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2">Based on last completed vs failed operations</p>
                      </div>
                    );
                  })()}
                </div>
              </GlassPanel>

              {/* Event logging and tracing */}
              <GlassPanel className="border-slate-800 lg:col-span-2 p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-amber-400" />
                  Real-time Observability Events
                </h3>
                
                {orchestratorEvents.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-12">No recent orchestrator events recorded.</p>
                ) : (
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
                    {orchestratorEvents.map((event) => (
                      <div key={event.id} className="p-3 rounded-xl border border-slate-850 bg-slate-950/20 text-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              event.type.includes("failed") || event.type.includes("error") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              event.type.includes("completed") || event.type.includes("registered") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            )}>
                              {event.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-300 mt-1">
                            {event.data?.taskId ? `Task ID: ${event.data.taskId}` : ""}
                            {event.data?.agentId ? ` | Agent: ${event.data.agentId}` : ""}
                            {event.data?.error ? ` | Error: ${event.data.error}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassPanel>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE ADMIN MODULES */}
        {activeTab === "users-orgs" && <UsersOrgsModule />}
        {activeTab === "roles-permissions" && <RolesPermissionsModule />}
        {activeTab === "subscriptions-billing" && <SubscriptionsBillingModule />}
        {activeTab === "usage-analytics" && <UsageAnalyticsModule />}
        {activeTab === "security-management" && <SecurityManagementModule />}
        {activeTab === "audit-logs-module" && <AuditLogsModule />}
        {activeTab === "system-health-module" && <SystemHealthModule />}
        {activeTab === "platform-settings-module" && <PlatformSettingsModule />}

        {/* 2. LLM MANAGER TAB */}
        {activeTab === "llm-manager" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-100">LLM Manager Dashboard</h2>
              <ExtrudedButton
                onClick={async () => {
                  try {
                    const res = await fetch("/api/llm-manager/retrain", { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Retraining initiated!");
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="bg-gradient-to-r from-teal-500 to-indigo-500 text-xs font-bold py-2"
              >
                Retrain Model
              </ExtrudedButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-400 text-sm">Total Requests</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-teal-400">{llmMetrics?.totalRequests || 45}</p></CardContent>
              </GlassPanel>
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-400 text-sm">Accumulated Cost</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-blue-400">${llmMetrics?.totalCost.toFixed(5) || "0.0825"}</p></CardContent>
              </GlassPanel>
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-400 text-sm">Average Latency</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-amber-400">{llmMetrics ? `${(llmMetrics.averageLatencyMs / 1000).toFixed(2)}s` : "1.85s"}</p></CardContent>
              </GlassPanel>
              <GlassPanel tilt={true} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-400 text-sm">Success Rate</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-extrabold text-emerald-400">{llmMetrics ? `${(llmMetrics.successRate * 100).toFixed(1)}%` : "99.1%"}</p></CardContent>
              </GlassPanel>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Recent Model Completions</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {recentInteractions.map(interaction => (
                  <GlassPanel key={interaction.id} tilt={false} className="border-slate-800/80 bg-slate-950/20">
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">{interaction.provider}</span>
                          <span className="font-semibold text-slate-300">{interaction.modelId}</span>
                        </div>
                        <span className="text-slate-400">{(interaction.latencyMs / 1000).toFixed(2)}s • ${interaction.cost.toFixed(6)}</span>
                      </div>
                      <p className="text-slate-400"><strong className="text-slate-300">Prompt:</strong> {interaction.request?.userPrompt}</p>
                      <p className="text-emerald-300"><strong className="text-slate-300">Output:</strong> {interaction.response?.output}</p>
                    </CardContent>
                  </GlassPanel>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. BOT MONITOR TAB */}
        {activeTab === "bot-monitor" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">AI Call Bot Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassPanel tilt={false} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-200">Active Live Channels</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {agentSessions.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-6">No voice agent bots currently active.</p>
                  ) : (
                    agentSessions.map(session => (
                      <div key={session.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-200">Agent ID: {session.agentKey}</p>
                          <p className="text-xs text-slate-500 mt-1">Status: {session.status} • Created: {new Date(session.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Live</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </GlassPanel>

              <GlassPanel tilt={false} className="border-slate-800">
                <CardHeader><CardTitle className="text-slate-200">Session Logs</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs max-h-96 overflow-y-auto">
                  {calls.slice(0, 5).map(call => (
                    <div key={call.id} className="p-3 border border-slate-900 rounded bg-slate-900/40">
                      <p className="text-slate-300"><strong>Call ID:</strong> {call.id}</p>
                      <p className="text-slate-400">Caller: {call.callerName} ({call.callerRole}) → Receiver: {call.receiverName} ({call.receiverRole})</p>
                      <p className="text-slate-400">Duration: {call.duration}s • Status: <span className="text-emerald-400 font-bold">{call.status}</span></p>
                    </div>
                  ))}
                </CardContent>
              </GlassPanel>
            </div>
          </div>
        )}

        {/* 4. TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-100">Tasks Pipeline Overview</h2>
              
              <div className="flex gap-2 flex-wrap items-center w-full md:w-auto">
                <Input
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="bg-slate-950 border-slate-800 text-xs w-full md:w-40"
                />
                
                {/* Filter by Agent */}
                <select
                  value={filterTaskAgent}
                  onChange={(e) => setFilterTaskAgent(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Agents</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>

                {/* Filter by Customer */}
                <select
                  value={filterTaskCustomer}
                  onChange={(e) => setFilterTaskCustomer(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.companyName}</option>
                  ))}
                </select>

                <select
                  value={filterTaskStatus}
                  onChange={(e) => setFilterTaskStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filterTaskPriority}
                  onChange={(e) => setFilterTaskPriority(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tasks
                .filter(t => {
                  const matchesSearch = (t.title || "").toLowerCase().includes(taskSearch.toLowerCase()) || (t.description || "").toLowerCase().includes(taskSearch.toLowerCase());
                  const matchesStatus = filterTaskStatus === "all" || t.status === filterTaskStatus;
                  const matchesPriority = filterTaskPriority === "all" || t.priority === filterTaskPriority;
                  const matchesAgent = filterTaskAgent === "all" || t.assignedAgentId === filterTaskAgent;
                  const matchesCustomer = filterTaskCustomer === "all" || t.customerId === filterTaskCustomer;
                  return matchesSearch && matchesStatus && matchesPriority && matchesAgent && matchesCustomer;
                })
                .map(task => (
                  <GlassPanel key={task.id} tilt={false} className="border-slate-800/80 bg-slate-900/20">
                    <CardContent className="p-5 flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100">{task.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            task.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            task.status === "in-progress" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse" :
                            "bg-slate-500/10 text-slate-400 border border-slate-700"
                          )}>{task.status}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            task.priority === "urgent" || task.priority === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          )}>{task.priority}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{task.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Assigned Agent: {task.assignedAgentId} • Customer ID: {task.customerId}</p>
                      </div>
                      <div className="flex gap-2">
                        {task.status !== "completed" && (
                          <ExtrudedButton size="sm" className="bg-emerald-600" onClick={() => handleUpdateTaskStatus(task.id, "completed")}>
                            Mark Completed
                          </ExtrudedButton>
                        )}
                        {task.status === "todo" && (
                          <ExtrudedButton size="sm" className="bg-yellow-600" onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}>
                            Start Progress
                          </ExtrudedButton>
                        )}
                      </div>
                    </CardContent>
                  </GlassPanel>
                ))
              }
            </div>
          </div>
        )}

        {/* 5. CUSTOMERS TAB */}
        {activeTab === "customers" && <CustomersModule />}

        {/* 6. RESIGNATIONS TAB */}
        {activeTab === "resignations" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Customer Resignations Registry</h2>
            <div className="space-y-4">
              {resignations.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12">No terminations processed in system archives.</p>
              ) : (
                resignations.map(r => (
                  <GlassPanel key={r.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-100">{r.customerName}</h4>
                        <p className="text-xs text-slate-400 mt-1">Request Date: {new Date(r.requestDate).toLocaleDateString()} • Effective Date: {new Date(r.effectiveDate).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-300 mt-3 italic">&quot;{r.terminationReason}&quot;</p>
                        {r.notes && <p className="text-xs text-slate-500 mt-1.5">Note: {r.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">Docs Archived</span>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">Account Closed</span>
                      </div>
                    </div>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        )}

        {/* 7. DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-100">Document Repositories</h2>
              <Input
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-slate-950 border-slate-800 text-xs w-full md:w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents
                .filter(d => d.title?.toLowerCase().includes(documentSearch.toLowerCase()) || d.description?.toLowerCase().includes(documentSearch.toLowerCase()))
                .map(doc => (
                  <GlassPanel key={doc.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-200">{doc.title}</h4>
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{doc.documentType || doc.type}</span>
                    </div>
                    <p className="text-xs text-slate-400">{doc.description || doc.updateNotes}</p>
                    <p className="text-[10px] text-slate-500">Owner ID: {doc.customerId} • Created by: {doc.createdBy}</p>
                  </GlassPanel>
                ))
              }
            </div>
          </div>
        )}

        {/* 8. REQUIREMENTS TAB */}
        {activeTab === "requirements" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-100">Customer Requirements</h2>
              
              <div className="flex gap-3 flex-wrap items-center w-full md:w-auto">
                <Input
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Search requirements..."
                  className="bg-slate-950 border-slate-800 text-xs w-full md:w-48"
                />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {requirements
                .filter(r => {
                  const matchesSearch = (r.customerName?.toLowerCase() || "").includes(reqSearch.toLowerCase()) || (r.description?.toLowerCase() || "").includes(reqSearch.toLowerCase());
                  const matchesPriority = filterPriority === "all" || r.priority === filterPriority;
                  const matchesStatus = filterStatus === "all" || r.status === filterStatus;
                  return matchesSearch && matchesPriority && matchesStatus;
                })
                .map(req => (
                  <GlassPanel key={req.id} tilt={false} className="border-slate-800/80 bg-slate-900/20 p-5 space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100">{req.category}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            req.priority === "Critical" ? "bg-rose-500/10 text-rose-450 border-rose-550/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}>{req.priority}</span>
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold">{req.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{req.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Customer: {req.customerName} ({req.requesterEmail}) • Assigned Agent: {req.assignedAgentName || "Unassigned"}</p>
                      </div>

                      <div className="flex gap-2">
                        {!req.assignedAgentId && (
                          <ExtrudedButton size="sm" className="bg-teal-600" onClick={() => autoAssignReq(req.id)}>
                            Auto-Assign Agent
                          </ExtrudedButton>
                        )}
                        {req.status !== "Resolved" && (
                          <ExtrudedButton size="sm" className="bg-green-600" onClick={() => handleUpdateReqStatus(req.id, "Resolved")}>
                            Resolve
                          </ExtrudedButton>
                        )}
                      </div>
                    </div>
                  </GlassPanel>
                ))
              }
            </div>
          </div>
        )}

        {/* 9. GTM REPORTS TAB */}
        {activeTab === "gtm-reports" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">All GTM Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gtmReports.map(report => (
                <GlassPanel key={report.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-slate-150">{report.reportName}</h4>
                    <span className="bg-teal-500/15 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded text-[10px] font-bold">{report.category}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950/40 rounded-xl border border-slate-850">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Revenue</p>
                      <p className="text-sm font-extrabold text-slate-200">${report.revenue?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">CAC</p>
                      <p className="text-sm font-extrabold text-rose-400">${report.cac || "0"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Conversion</p>
                      <p className="text-sm font-extrabold text-green-400">{report.conversionRate || "0"}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Region: {report.region} • Segment: {report.segment}</span>
                    <button className="text-teal-400 font-bold flex items-center gap-1.5 hover:text-teal-350 transition-colors" onClick={() => {
                      const csv = `Report Name,Category,Revenue,CAC,Conversion Rate,Region,Segment\n"${report.reportName}","${report.category}",${report.revenue},${report.cac},${report.conversionRate},"${report.region}","${report.segment}"`;
                      const blob = new Blob([csv], { type: "text/csv" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `${report.reportName.replace(/\s+/g, "_")}.csv`;
                      a.click();
                    }}>
                      <Download className="h-3 w-3" /> Export CSV
                    </button>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>
        )}

        {/* 10. AGENTS TAB */}
        {activeTab === "agents" && <AgentsModule />}

        {/* 11. INTERACTIONS TAB */}
        {activeTab === "interactions" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Platform Messages & Conversations</h2>
            <div className="grid grid-cols-1 gap-4">
              {chatMessages.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12">No active message transcripts found in chat channels.</p>
              ) : (
                chatMessages.map(msg => (
                  <GlassPanel key={msg.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-4">
                    <div className="flex justify-between items-start border-b border-slate-900 pb-2 mb-2">
                      <span className="font-bold text-xs text-slate-350">{msg.senderName} ({msg.senderRole})</span>
                      <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-250">{msg.content}</p>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        )}

        {/* 12. PASSWORD REQUESTS TAB */}
        {activeTab === "password-requests" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Password Management & Resets</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Pending Reset Requests */}
              <GlassPanel className="border-slate-800/80 p-5 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Pending User Requests</h3>
                {loadingRequests ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-teal-400" /></div>
                ) : passwordRequests.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No password requests pending action.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5">User Email</th>
                          <th className="py-2.5">Role</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passwordRequests.map(r => (
                          <tr key={r.id} className="border-b border-slate-850 hover:bg-slate-900/10">
                            <td className="py-3 text-slate-300 font-semibold">{r.email}</td>
                            <td className="py-3 capitalize text-slate-400">{r.role}</td>
                            <td className="py-3 text-right">
                              <ExtrudedButton size="sm" className="bg-teal-600" onClick={() => {
                                setSelectedRequest(r);
                                setShowResetModal(true);
                              }}>Process Reset</ExtrudedButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassPanel>

              {/* Right Column: Search & Direct Reset */}
              <GlassPanel className="border-slate-800/80 p-5 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Direct Account Password Reset</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Search accounts by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="bg-slate-950 border-slate-850 text-white rounded-xl text-xs"
                  />
                  
                  <div className="max-h-60 overflow-y-auto pr-2 space-y-2 border border-slate-850/60 rounded-xl p-2 bg-slate-950/40">
                    {(() => {
                      const allAccounts = [
                        ...customers.map(c => ({ name: c.name, email: c.email, role: "customer" as const })),
                        ...agents.map(a => ({ name: a.name, email: a.email, role: "agent" as const })),
                      ];
                      const filtered = allAccounts.filter(acc => 
                        (acc.name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        (acc.email || "").toLowerCase().includes(userSearchQuery.toLowerCase())
                      );
                      
                      if (filtered.length === 0) {
                        return <p className="text-slate-500 text-xs text-center py-4">No accounts match search.</p>;
                      }
                      
                      return filtered.map(acc => (
                        <div key={acc.email} className="flex justify-between items-center p-2 border border-slate-900 bg-slate-900/40 rounded-xl hover:bg-slate-900/80 transition-colors">
                          <div>
                            <p className="text-xs font-semibold text-slate-250">{acc.name}</p>
                            <p className="text-[10px] text-slate-500">{acc.email} • <span className="capitalize">{acc.role}</span></p>
                          </div>
                          <ExtrudedButton size="sm" className="bg-indigo-600" onClick={() => {
                            setDirectResetEmail(acc.email);
                            setDirectResetRole(acc.role);
                            setShowDirectResetModal(true);
                          }}>Reset Password</ExtrudedButton>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

      </div>

      {/* Approve Password Reset Modal */}
      {showResetModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassPanel className="w-full max-w-md border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowResetModal(false);
                setSelectedRequest(null);
                setNewPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Process Password Reset</h3>
            <p className="text-sm text-slate-400 mb-6">
              Set a temporary password for <span className="font-semibold text-slate-200">{selectedRequest.email}</span>.
            </p>

            <form onSubmit={handleProcessReset} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-password">New Password</Label>
                  <button
                    type="button"
                    onClick={handleGenerateResetPassword}
                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 uppercase tracking-wider transition-colors px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50"
                  >
                    Auto-generate
                  </button>
                </div>
                <PasswordInput
                  id="new-password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-white pr-10 rounded-xl"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-slate-800/80 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedRequest(null);
                    setNewPassword("");
                  }}
                  disabled={resettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resettingPassword || newPassword.length < 8}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {resettingPassword ? "Processing..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* Change Own Password Modal */}
      {showChangeOwnPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassPanel className="w-full max-w-md border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowChangeOwnPassword(false);
                setOwnCurrentPassword("");
                setOwnNewPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Change Admin Password</h3>
            <p className="text-sm text-slate-400 mb-6">
              Update your administrator credentials below.
            </p>

            <form onSubmit={handleChangeOwnPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="own-current-password font-bold text-slate-350">Current Password</Label>
                <PasswordInput
                  id="own-current-password"
                  placeholder="Enter current password"
                  value={ownCurrentPassword}
                  onChange={(e) => setOwnCurrentPassword(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-white pr-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="own-new-password font-bold text-slate-350">New Password</Label>
                  <button
                    type="button"
                    onClick={handleGenerateOwnPassword}
                    className="text-[10px] font-bold text-teal-400 hover:text-teal-350 uppercase tracking-wider transition-colors px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50"
                  >
                    Auto-generate
                  </button>
                </div>
                <PasswordInput
                  id="own-new-password"
                  placeholder="Minimum 8 characters"
                  value={ownNewPassword}
                  onChange={(e) => setOwnNewPassword(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-white pr-10 rounded-xl"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-slate-800/80 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowChangeOwnPassword(false);
                    setOwnCurrentPassword("");
                    setOwnNewPassword("");
                  }}
                  disabled={changingOwnPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changingOwnPassword || ownNewPassword.length < 8}
                  className="bg-teal-600 hover:bg-teal-700 text-white animate-pulse"
                >
                  {changingOwnPassword ? "Processing..." : "Update Password"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* Direct User Password Reset Modal */}
      {showDirectResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassPanel className="w-full max-w-md border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowDirectResetModal(false);
                setDirectResetEmail("");
                setDirectResetPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Direct Reset Password</h3>
            <p className="text-sm text-slate-400 mb-6">
              Enter a new temporary password for user <span className="font-semibold text-slate-200">{directResetEmail}</span> (<span className="capitalize text-teal-400">{directResetRole}</span>).
            </p>

            <form onSubmit={handleDirectResetPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="direct-new-password font-bold text-slate-350">New Password</Label>
                  <button
                    type="button"
                    onClick={handleGenerateDirectPassword}
                    className="text-[10px] font-bold text-teal-400 hover:text-teal-350 uppercase tracking-wider transition-colors px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50"
                  >
                    Auto-generate
                  </button>
                </div>
                <PasswordInput
                  id="direct-new-password"
                  placeholder="Minimum 8 characters"
                  value={directResetPassword}
                  onChange={(e) => setDirectResetPassword(e.target.value)}
                  className="bg-slate-950 border-slate-850 text-white pr-10 rounded-xl"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-slate-800/80 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDirectResetModal(false);
                    setDirectResetEmail("");
                    setDirectResetPassword("");
                  }}
                  disabled={directResetting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={directResetting || directResetPassword.length < 8}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white"
                >
                  {directResetting ? "Processing..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
        {/* 13. WHATSAPP COMPLIANCE ARCHIVE VAULT TAB */}
        {activeTab === "whatsapp-archive" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-emerald-400" /> WhatsApp Compliance Archive Vault
                </h2>
                <p className="text-xs text-slate-400 mt-1">Exclusive Admin view of encrypted message hashes, trigger logs, and regulatory archives.</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs border-slate-700" onClick={fetchAdminSpecializedData}>
                Refresh Archive
              </Button>
            </div>

            <GlassPanel className="border-slate-800 p-5 space-y-4">
              {waArchiveMsgs.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No WhatsApp compliance logs recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Message ID</th>
                        <th className="py-2.5">To / From Phone</th>
                        <th className="py-2.5">Sender &amp; Role</th>
                        <th className="py-2.5">Trigger Type</th>
                        <th className="py-2.5">SHA-256 Hash</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waArchiveMsgs.map((m) => (
                        <tr key={m.messageId} className="border-b border-slate-850 hover:bg-slate-900/40">
                          <td className="py-3 font-mono text-slate-300 font-bold">{m.messageId}</td>
                          <td className="py-3 font-mono text-slate-400">{m.toPhone || m.fromPhone}</td>
                          <td className="py-3 text-slate-300">{m.senderName} (<span className="text-emerald-400 font-bold uppercase">{m.senderRole}</span>)</td>
                          <td className="py-3 text-indigo-300 capitalize">{m.triggerType?.replace("_", " ")}</td>
                          <td className="py-3 font-mono text-[10px] text-slate-500">{m.encryptedHash?.substring(0, 16)}...</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassPanel>
          </div>
        )}

        {/* 14. CRM SYNC QUEUE CONTROL CENTER TAB */}
        {activeTab === "crm-sync-center" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-amber-400" /> CRM Bi-Directional Sync Queue Center
                </h2>
                <p className="text-xs text-slate-400 mt-1">Real-time status monitoring, failure queue tracking, and 1-click re-sync triggers.</p>
              </div>
              <ExtrudedButton size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold" onClick={handleRetryCrmQueue} disabled={retryingCrmQueue}>
                {retryingCrmQueue ? "Retrying Queue..." : "Retry Failed Sync Items"}
              </ExtrudedButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassPanel className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Queued / Syncing Items</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{crmQueueStatus?.queuedCount || 0}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-amber-400/30" />
              </GlassPanel>

              <GlassPanel className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Synced Real-Time Items</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{crmQueueStatus?.syncedCount || 12}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
              </GlassPanel>

              <GlassPanel className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Failed Queue Exceptions</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{crmQueueStatus?.failedCount || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-rose-400/30" />
              </GlassPanel>
            </div>

            <GlassPanel className="border-slate-800 p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-200">Active Sync Queue History</h3>
              {(!crmQueueStatus?.items || crmQueueStatus.items.length === 0) ? (
                <p className="text-slate-500 text-sm text-center py-6">Sync queue is clean. All records synchronized.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Queue ID</th>
                        <th className="py-2.5">Entity Type &amp; ID</th>
                        <th className="py-2.5">Action</th>
                        <th className="py-2.5">User Role</th>
                        <th className="py-2.5">Attempts</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmQueueStatus.items.map((item: any) => (
                        <tr key={item.queueId} className="border-b border-slate-850 hover:bg-slate-900/40">
                          <td className="py-3 font-mono text-slate-300 font-bold">{item.queueId}</td>
                          <td className="py-3 font-mono text-slate-400">{item.entityType} ({item.entityId})</td>
                          <td className="py-3 text-indigo-300 uppercase">{item.action}</td>
                          <td className="py-3 capitalize text-slate-400">{item.userRole}</td>
                          <td className="py-3 font-mono text-slate-300">{item.attempts}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === "synced" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassPanel>
          </div>
        )}

        {/* 16. DEALFLOW CRM TAB */}
        {activeTab === "dealflow-crm" && (
          <div className="animate-in fade-in duration-300">
            <DealflowCRMWorkspace userRole="admin" />
          </div>
        )}

        </div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  return (
    <AuthProvider allowedRoles={["admin"]}>
      <AdminPortalContent />
    </AuthProvider>
  );
}
