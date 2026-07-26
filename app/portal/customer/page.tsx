"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import {
  CheckCircle2,
  MessageSquare,
  Star,
  FileText,
  Download,
  Plus,
  Settings,
  Bell,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Ticket as TicketIcon,
  CreditCard,
  BarChart2,
  Check,
  Users,
  ShoppingBag,
  Palette,
  Truck,
  Layers,
  ArrowRight,
  Phone,
  Target,
  Send,
  X,
  Loader2,
  Search,
  ArrowUpDown,
  Zap,
  Bot,
  Database,
  Table2,
  Play,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthProvider from "@/components/auth/AuthProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ContentWorkflowWorkspace } from "@/components/portal/ContentWorkflowWorkspace";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { DealflowCRMWorkspace } from "@/components/portal/DealflowCRMWorkspace";
import { AgentAssignmentModule } from "@/components/portal/AgentAssignmentModule";
import { APIKeyManagementModule } from "@/components/portal/APIKeyManagementModule";
import { UserCheck, Key } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "content-hub", label: "Content & Workflow Hub", icon: Target, color: "text-violet-400 border-violet-500/30 hover:border-violet-500/60 shadow-violet-500/10" },
  { id: "agent-assignment", label: "Agent Assignment", icon: UserCheck, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "api-keys", label: "API Key Vault", icon: Key, color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" },
  { id: "business-toolset", label: "Model Toolset", icon: Layers, color: "text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10" },
  { id: "icp-entries", label: "ICP Entries", icon: Users, color: "text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10" },
  { id: "gtm-analysis", label: "Automated GTM Analysis", icon: FileText, color: "text-blue-400 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10" },
  { id: "tickets", label: "Support Tickets", icon: TicketIcon, color: "text-rose-400 border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/10" },
  { id: "billing", label: "Billing & Credits", icon: CreditCard, color: "text-amber-400 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/10" },
  { id: "chat", label: "Messenger", icon: MessageSquare, color: "text-sky-400 border-sky-500/30 hover:border-sky-500/60 shadow-sky-500/10" },
  { id: "documents", label: "Documents", icon: FileText, color: "text-orange-400 border-orange-500/30 hover:border-orange-500/60 shadow-orange-500/10" },
  { id: "feedback", label: "Feedback", icon: Star, color: "text-pink-400 border-pink-500/30 hover:border-pink-500/60 shadow-pink-500/10" },
  { id: "ai-communications", label: "AI Interactions", icon: Phone, color: "text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10" },
  { id: "genbi", label: "Chatbot (Wren AI)", icon: Bot, color: "text-fuchsia-400 border-fuchsia-500/30 hover:border-fuchsia-500/60 shadow-fuchsia-500/10" },
  { id: "dealflow-crm", label: "Dealflow CRM", icon: Briefcase, color: "text-teal-400 border-teal-500/30 hover:border-teal-500/60 shadow-teal-500/10" },
] as const;


function CustomerPortalContent() {
  const { user, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("dashboard");
  const [businessModel, setBusinessModel] = useState<"b2b" | "b2c" | "d2c" | "custom">("b2b");
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, any>>({});

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

  // Billing & Credit Purchase States
  const [creditsCount, setCreditsCount] = useState(750);
  const [creditsToBuy, setCreditsToBuy] = useState(100);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<Array<{ id: string; date: string; amount: number; type: 'purchase' | 'spend'; details: string }>>([
    { id: "tx-1", date: "2026-07-01", amount: 500, type: "purchase", details: "Self-service Stripe Credit Allocation" },
    { id: "tx-2", date: "2026-07-03", amount: -50, type: "spend", details: "Campaign execution Stark Industries" },
    { id: "tx-3", date: "2026-07-04", amount: -15, type: "spend", details: "15 minutes outbound AI voice dial logs" },
  ]);

  const handleBuyCreditsSimulated = () => {
    setIsPurchasing(true);
    setTimeout(() => {
      setCreditsCount((prev) => prev + Number(creditsToBuy));
      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        amount: Number(creditsToBuy),
        type: "purchase" as const,
        details: `Simulated self-service credit allocation`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      setIsPurchasing(false);
      showToast("success", "Credits Purchased", `Successfully allocated ${creditsToBuy} credits to your account balance.`);
    }, 1000);
  };

  // Core Data States
  const [tasks, setTasks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [gtmReports, setGtmReports] = useState<any[]>([]);
  const [gtmPlaybooks, setGtmPlaybooks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [icpEntries, setIcpEntries] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [callsList, setCallsList] = useState<any[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<any | null>(null);

  // Content Hub States
  const [contentSubTab, setContentSubTab] = useState<"workspace" | "assets">("workspace");
  const [contentAssets, setContentAssets] = useState<any[]>([]);
  const [contentSearch, setContentSearch] = useState("");
  const [contentTacticFilter, setContentTacticFilter] = useState("all");
  const [contentStatusFilter, setContentStatusFilter] = useState("all");
  const [contentSortField, setContentSortField] = useState("updatedAt");
  const [contentSortOrder, setContentSortOrder] = useState<"asc" | "desc">("desc");

  // Selected Content Asset for Review & Publishing
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

  // Form States
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketCategory, setTicketCategory] = useState("General Support");

  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");

  const [icpName, setIcpName] = useState("");
  const [icpValueProposition, setIcpValueProposition] = useState("");
  const [icpDescription, setIcpDescription] = useState("");

  const [newMessage, setNewMessage] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Widget States for customizable dashboard
  const [widgets, setWidgets] = useState<string[]>([
    "credit-usage",
    "tasks",
    "projects",
    "conversations",
    "analytics",
    "billing",
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
    setWidgets(["credit-usage", "projects", "conversations", "analytics", "billing", "notifications"]);
  };

  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Real-time synchronization polling (3s interval)
  const fetchCustomerData = useCallback(async () => {
    try {
      const safeFetchJson = async (url: string) => {
        try {
          const res = await fetch(url).catch(() => null);
          if (!res || !res.ok) return { success: false };
          return await res.json().catch(() => ({ success: false }));
        } catch {
          return { success: false };
        }
      };

      const [tasksData, ticketsData, gtmData, docsData, chatData, icpData, feedbackData, callsData, configData, contentData] = await Promise.all([
        safeFetchJson("/api/portal/tasks"),
        safeFetchJson("/api/portal/tickets"),
        safeFetchJson("/api/portal/gtm-reports"),
        safeFetchJson("/api/portal/documents"),
        safeFetchJson("/api/portal/chat?sessionId=session-1"),
        safeFetchJson("/api/customer/icp"),
        safeFetchJson("/api/portal/feedback"),
        safeFetchJson("/api/portal/calls"),
        safeFetchJson("/api/customer/config"),
        safeFetchJson("/api/portal/content"),
      ]);

      if (tasksData.success) setTasks(tasksData.tasks || []);
      if (ticketsData.success) setTickets(ticketsData.tickets);
      if (gtmData.success) setGtmReports(gtmData.reports);
      if (docsData.success) setDocuments(docsData.documents);
      if (chatData.success) setChatMessages(chatData.messages);
      if (icpData.success) setIcpEntries(icpData.icpEntries);
      if (feedbackData.success) setFeedbackList(feedbackData.feedback);
      if (callsData.success) setCallsList(callsData.calls);

      // Fetch AI-generated GTM Playbooks
      try {
        const playbookRes = await fetch("/api/gtm-playbook");
        if (playbookRes.ok) {
          const playbookData = await playbookRes.json();
          if (playbookData.success && playbookData.playbooks) {
            setGtmPlaybooks(playbookData.playbooks);
            if (!selectedPlaybook && playbookData.playbooks.length > 0) {
              setSelectedPlaybook(playbookData.playbooks[0]);
            }
          }
        }
      } catch { /* non-critical */ }
      if (contentData.success) {
        setContentAssets(contentData.assets);
        // Sync selected asset detail in real-time
        setSelectedAsset((curr: any) => {
          if (!curr) return null;
          const updated = contentData.assets.find((a: any) => a.id === curr.id);
          return updated || curr;
        });
      }

      if (configData.success && configData.customer) {
        setBusinessModel(configData.customer.businessModel || "b2b");
        setServiceConfigs(configData.customer.serviceConfigurations || {});
      }
    } catch (error) {
      console.error("[Customer Portal] polling error:", error);
    }
  }, [selectedPlaybook]);

  useEffect(() => {
    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 3000);
    return () => clearInterval(interval);
  }, [fetchCustomerData]);


  // Actions
  const handleUpdateBusinessModel = async (newModel: string) => {
    try {
      const res = await fetch("/api/customer/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessModel: newModel }),
      });
      const data = await res.json();
      if (data.success) {
        setBusinessModel(newModel as any);
        showToast("success", "Operating Model Updated", `Successfully switched workflow to ${newModel.toUpperCase()}`);
        fetchCustomerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAsset = async (assetId: string | null, title: string, tactic: string, content: string, status?: string) => {
    setIsSavingAsset(true);
    try {
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
          customerId: user?.id,
          customerName: user?.name
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Asset Saved", `Asset "${title}" saved successfully.`);
        setIsEditing(false);
        fetchCustomerData();
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
        fetchCustomerData();
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
        fetchCustomerData();
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
        fetchCustomerData();
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
        fetchCustomerData();
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

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    try {
      const res = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          description: ticketDescription,
          priority: ticketPriority,
          category: ticketCategory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Ticket Submitted", "Your support request has been logged.");
        setTicketSubject("");
        setTicketDescription("");
        fetchCustomerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    try {
      const res = await fetch("/api/portal/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Number(feedbackRating),
          comment: feedbackComment,
          agentId: "agent-vijay", // default PM
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Feedback Submitted", "Thank you for rating your Account Manager.");
        setFeedbackComment("");
        fetchCustomerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitIcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icpName.trim()) return;

    try {
      const res = await fetch("/api/customer/icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: icpName,
          valueProposition: icpValueProposition,
          description: icpDescription,
          targetIndustries: ["Technology"],
          targetCompanySizes: ["100-500"],
          targetGeographicRegions: ["North America"],
          painPoints: ["Scaling problems"],
          decisionMakers: ["VP Engineering"],
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "ICP Profile Saved", "Ideal Customer Profile entry updated.");
        setIcpName("");
        setIcpValueProposition("");
        setIcpDescription("");
        fetchCustomerData();
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
        fetchCustomerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

      return matchesSearch && matchesTactic && matchesStatus;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-teal-400 mx-auto" />
          <p className="text-slate-400 text-sm">Initializing your secure workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-450 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            DealFlow Customer Hub
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Manage operating models, GTM campaigns, and sync task execution in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Active Flow:</span>
            <span className={cn(
              "text-xs px-2.5 py-0.5 rounded-md font-extrabold uppercase",
              businessModel === "b2b" ? "bg-indigo-950 text-indigo-400 border border-indigo-800" :
              businessModel === "b2c" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
              "bg-pink-950 text-pink-400 border border-pink-850"
            )}>
              {businessModel}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs List — responsive wrap layout */}
      <div className="w-full pb-1">
        <div className="flex flex-wrap gap-1.5 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-xl w-full">
          {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isNew = tab.id === "gtm-analysis";
            return (
              <ExtrudedButton
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-xl transition-all duration-300 gap-2 font-semibold text-xs py-2 px-3.5 whitespace-nowrap relative",
                  isActive
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "border-transparent bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", tab.color.split(" ")[0])} />
                {tab.label}
                {isNew && !isActive && (
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-1 leading-tight">
                    AI
                  </span>
                )}
              </ExtrudedButton>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <div className="mt-4">
        {/* 1. DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <GlassPanel className="border-slate-850 p-6 flex justify-between items-center flex-wrap gap-4 bg-gradient-to-r from-slate-900/60 to-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                    Operating Workflow: {businessModel.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your platform workflows, KPIs, and dashboards are dynamically tailored to this operating model.
                  </p>
                </div>
              </div>
              <div>
                <select
                  value={businessModel}
                  onChange={(e) => handleUpdateBusinessModel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 font-bold"
                >
                  <option value="b2b">B2B Enterprise</option>
                  <option value="b2c">B2C Retail</option>
                  <option value="d2c">D2C Direct Brand</option>
                  <option value="custom">Custom Creator</option>
                </select>
              </div>
            </GlassPanel>

            {widgets.length < 6 && (
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
                if (widgetId === "tasks") {
                  const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "done");
                  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done");
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Assigned Tasks"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Open</span>
                            <span className="text-2xl font-black text-orange-400">{openTasks.length}</span>
                          </div>
                          <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Completed</span>
                            <span className="text-2xl font-black text-emerald-400">{completedTasks.length}</span>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {tasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="p-2.5 bg-slate-950/40 rounded-lg border border-white/5 text-xs space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-bold text-slate-200 line-clamp-1">{task.title}</p>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0",
                                  task.status === "todo" ? "bg-slate-700/40 text-slate-300 border border-slate-600/30" :
                                  task.status === "in-progress" || task.status === "in_progress" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                                  task.status === "review" ? "bg-violet-500/10 text-violet-400 border border-violet-500/30" :
                                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                )}>
                                  {task.status === "in-progress" || task.status === "in_progress" ? "In Progress" :
                                    (task.status || "todo").charAt(0).toUpperCase() + (task.status || "todo").slice(1)}
                                </span>
                              </div>
                              {task.assignedAgentName && (
                                <p className="text-[10px] text-slate-500">Assigned to: {task.assignedAgentName}</p>
                              )}
                              {task.dueDate && (
                                <p className="text-[10px] text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          ))}
                          {tasks.length === 0 && (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No assigned tasks yet.</p>
                          )}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "credit-usage") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Platform Credit Usage"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-6">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Available Balance</span>
                            <span className="text-3xl font-extrabold text-amber-400 block mt-1">{creditsCount} Credits</span>
                          </div>
                          <div className="h-10 w-10 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-center justify-center text-amber-400 font-extrabold">
                            {creditsCount > 100 ? "OK" : "LOW"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>SDR Outbound Dialer</span>
                            <span>Spent: 120 / 750 Units</span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-amber-500 rounded-full" style={{ width: "16%" }} />
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("billing")}
                          className="w-full text-center bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/5 py-2.5 rounded-xl text-xs font-bold transition-all"
                        >
                          Buy More Credits
                        </button>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "projects") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Campaign Profiles (ICP)"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs text-slate-400 font-bold">{icpEntries.length} Active ICP Profiles</span>
                          <button onClick={() => setActiveTab("icp-entries")} className="text-xs text-teal-400 hover:text-teal-300 font-bold">Manage</button>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {icpEntries.slice(0, 3).map((icp) => (
                            <div key={icp.id} className="p-2.5 bg-slate-950/40 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-200">{icp.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">{icp.description}</p>
                              </div>
                              <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">Active</span>
                            </div>
                          ))}
                          {icpEntries.length === 0 && (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No campaign profiles defined yet.</p>
                          )}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "conversations") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Recent Conversations"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs text-slate-400 font-bold">Account Manager Session</span>
                          <button onClick={() => setActiveTab("chat")} className="text-xs text-teal-400 hover:text-teal-300 font-bold">Open Chat</button>
                        </div>
                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {chatMessages.slice(-3).map((msg) => (
                            <div key={msg.id} className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span className="font-bold text-slate-350">{msg.senderName}</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-300 truncate">{msg.content}</p>
                            </div>
                          ))}
                          {chatMessages.length === 0 && (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No messages exchanged yet.</p>
                          )}
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "analytics") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="GTM Strategy Analytics"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Average Conversion</span>
                            <span className="text-2xl font-black text-emerald-400">
                              {(gtmReports.reduce((acc, curr) => acc + (curr.conversionRate || curr.leadConversionRate || 0), 0) / (gtmReports.length || 1)).toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Pipeline Created</span>
                            <span className="text-2xl font-black text-blue-400">
                              ${(gtmReports.reduce((acc, curr) => acc + (curr.pipelineValue || curr.revenue || 0), 0) / 1000).toFixed(1)}k
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Top Reporting Region</p>
                          <div className="flex justify-between items-center text-xs bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-slate-300 font-semibold">{gtmReports[0]?.reportName || "N/A"}</span>
                            <span className="text-emerald-400 font-bold">{gtmReports[0]?.conversionRate || 0}% Conv</span>
                          </div>
                        </div>
                      </div>
                    </DashboardWidget>
                  );
                }

                if (widgetId === "billing") {
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      title="Billing & Invoicing"
                      onRemove={() => handleRemoveWidget(widgetId)}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs text-slate-400 font-bold">Recent Billing Actions</span>
                          <button onClick={() => setActiveTab("billing")} className="text-xs text-teal-400 hover:text-teal-300 font-bold">Billing Tab</button>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {transactions.slice(0, 3).map((tx) => (
                            <div key={tx.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-slate-200 truncate max-w-[180px]">{tx.details}</p>
                                <p className="text-[9px] text-slate-550 font-mono mt-0.5">{tx.date}</p>
                              </div>
                              <span className={cn(
                                "font-bold font-mono",
                                tx.type === "purchase" ? "text-emerald-400" : "text-slate-455"
                              )}>
                                {tx.type === "purchase" ? "+" : ""}{tx.amount}
                              </span>
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
                    title="Active Alerts & Notifications"
                    onRemove={() => handleRemoveWidget(widgetId)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-slate-400 font-bold">Live Portal Stream</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl flex gap-2.5 items-start">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-200 font-bold">Workspace Ready</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Secure session initialized successfully</p>
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl flex gap-2.5 items-start">
                          <Star className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-200 font-bold">Campaign Status</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{icpEntries.length} active targeting parameters loaded</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DashboardWidget>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTENT HUB */}
        {activeTab === "content-hub" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sub-navigation Toggles */}
            <div className="flex justify-start items-center gap-2 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/85 mb-6">
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

            {contentSubTab === "workspace" ? (
              user ? (
                <ContentWorkflowWorkspace
                  customerId={user.id}
                  customerName={user.name}
                  initialCustomerData={user}
                  userRole="customer"
                  onSaveCustomer={async (updatedFields) => {
                    try {
                      const res = await fetch("/api/customer/config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          customerId: user.id,
                          ...updatedFields
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        await fetchCustomerData();
                        return true;
                      }
                      return false;
                    } catch (err) {
                      console.error(err);
                      return false;
                    }
                  }}
                />
              ) : (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                  <p className="text-sm text-slate-400">Loading user profile details...</p>
                </div>
              )
            ) : (
              <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Centralized Marketing Content Hub</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access, review, approve, and publish content assets across all 25 high-performing marketing channels.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditTitle("");
                  setEditContent("");
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
                <p className="text-[10px] text-slate-500 uppercase font-bold">Active Tactics</p>
                <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
                  {new Set(contentAssets.filter(a => a.status === "published" || a.status === "scheduled").map(a => a.tactic)).size} / 25
                </h3>
              </GlassPanel>
            </div>

            {/* Filters and Controls */}
            <GlassPanel tilt={false} className="border-slate-800 p-4 bg-slate-900/20 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl w-full md:w-80">
                  <Search className="h-4 w-4 text-slate-500" />
                  <label htmlFor="content-search" className="sr-only">Search Content Assets</label>
                  <input
                    id="content-search"
                    type="text"
                    placeholder="Search by title or content keywords..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
                  />
                </div>

                <div className="flex gap-4 flex-wrap w-full md:w-auto items-center">
                  {/* Tactic dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="content-tactic-filter" className="text-slate-400 font-medium">Tactic:</label>
                    <select
                      id="content-tactic-filter"
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
                    <label htmlFor="content-status-filter" className="text-slate-400 font-medium">Status:</label>
                    <select
                      id="content-status-filter"
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
                    <label htmlFor="content-sort-field" className="text-slate-400 font-medium">Sort By:</label>
                    <select
                      id="content-sort-field"
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
                        <span className="bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase truncate max-w-[150px]">
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
                        <span>Ver: {asset.versions?.length || 1} • Comm: {asset.comments?.length || 0}</span>
                        <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setEditTitle(asset.title);
                          setEditContent(asset.content);
                          setIsEditing(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        Review & Manage <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}

            {/* Preview & Review Dialog/Drawer */}
            {selectedAsset && (
              <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                        <span className="bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
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
                      <h3 className="font-extrabold text-white text-lg mt-2">{selectedAsset.id ? selectedAsset.title : "New Draft"}</h3>
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
                                onClick={() => handleSaveAsset(selectedAsset.id, editTitle, selectedAsset.tactic, editContent, selectedAsset.status)}
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
                            <div className="space-y-1">
                              <label htmlFor="edit-title" className="text-[10px] text-slate-500 font-bold uppercase">Asset Title</label>
                              <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-slate-950 border-slate-850 text-xs text-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label htmlFor="edit-content" className="text-[10px] text-slate-500 font-bold uppercase">Content Body</label>
                              <textarea
                                id="edit-content"
                                rows={8}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
                              />
                            </div>
                            {selectedAsset.id === null && (
                              <div className="space-y-1">
                                <label htmlFor="select-tactic" className="text-[10px] text-slate-500 font-bold uppercase">Marketing Tactic</label>
                                <select
                                  id="select-tactic"
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
                                onClick={() => handleSaveAsset(null, editTitle, selectedAsset.tactic, editContent, "draft")}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2 rounded-xl text-xs shadow-md"
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
                                <div key={idx} className="p-3 bg-slate-950/40 border border-slate-855 rounded-xl flex justify-between items-center text-xs">
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
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
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
                                      <label htmlFor="schedule-time" className="text-[9px] text-slate-500 font-bold uppercase block">Schedule Date & Time</label>
                                      <input
                                        id="schedule-time"
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
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[10px] space-y-2 text-slate-400">
                                <p className="font-bold text-emerald-400 flex items-center gap-1">
                                  <ShieldCheck className="h-4 w-4" /> Secure Sync Active
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
                              <label htmlFor="drawer-comment-text" className="sr-only">Add comment</label>
                              <Input
                                id="drawer-comment-text"
                                placeholder="Add revision request..."
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
          </div>
        )}

        {/* AGENT ASSIGNMENT MODULE TAB */}
        {activeTab === "agent-assignment" && (
          <div className="animate-in fade-in duration-300">
            <AgentAssignmentModule />
          </div>
        )}

        {/* API KEY VAULT MODULE TAB */}
        {activeTab === "api-keys" && (
          <div className="animate-in fade-in duration-300">
            <APIKeyManagementModule />
          </div>
        )}

        {/* 2. OPERATING MODEL TOOLSET */}
        {activeTab === "business-toolset" && (

          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Business Operating Model Configurations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassPanel tilt={false} className="border-slate-800 p-5 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Submit Operating Order / Leads</h3>
                <p className="text-xs text-slate-400">Process wholesale contracts or retail orders directly mapped to your active model.</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                  <p className="text-slate-300 font-bold">Volume Contract Rates Enabled:</p>
                  <p className="text-slate-500 mt-1">Tier 1 discount: 15% wholesale allowance on purchases &gt; 50 credits.</p>
                </div>
              </GlassPanel>

              <GlassPanel tilt={false} className="border-slate-800 p-5 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Parameters Control</h3>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Change Operating Workflow Type</Label>
                  <select
                    value={businessModel}
                    onChange={(e) => handleUpdateBusinessModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  >
                    <option value="b2b">B2B Wholesale contract model</option>
                    <option value="b2c">B2C Retail store checkout</option>
                    <option value="d2c">D2C Custom Branding config</option>
                  </select>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {/* 3. ICP ENTRIES */}
        {activeTab === "icp-entries" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <GlassPanel tilt={false} className="border-slate-800 p-5 h-fit">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Define Campaign ICP Profile</h3>
              <form onSubmit={handleSubmitIcp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="icp-name" className="text-slate-400">Campaign Profile Name</Label>
                  <Input
                    id="icp-name"
                    placeholder="e.g. Enterprise SaaS"
                    value={icpName}
                    onChange={(e) => setIcpName(e.target.value)}
                    className="bg-slate-950 border-slate-850 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="icp-val-prop" className="text-slate-400">Value Proposition</Label>
                  <Input
                    id="icp-val-prop"
                    placeholder="e.g. Automate sales reporting"
                    value={icpValueProposition}
                    onChange={(e) => setIcpValueProposition(e.target.value)}
                    className="bg-slate-950 border-slate-850 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="icp-desc" className="text-slate-400">Target Segment Description</Label>
                  <textarea
                    id="icp-desc"
                    placeholder="Describe target demographics & pain points..."
                    value={icpDescription}
                    onChange={(e) => setIcpDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <ExtrudedButton type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                  Save ICP Parameters
                </ExtrudedButton>
              </form>
            </GlassPanel>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Saved Campaign Target Profiles</h3>
              {icpEntries.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center bg-slate-900/10 rounded-xl border border-slate-800">No ICP entries saved.</p>
              ) : (
                icpEntries.map(icp => (
                  <GlassPanel key={icp.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-2">
                    <h4 className="text-base font-bold text-slate-250">{icp.name}</h4>
                    <p className="text-xs text-slate-355">{icp.description}</p>
                    {icp.valueProposition && <p className="text-xs text-emerald-400"><strong>Val Prop:</strong> {icp.valueProposition}</p>}
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. GTM ANALYSIS & PLAYBOOK */}
        {activeTab === "gtm-analysis" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">GTM Analysis & Playbook</h2>
                <p className="text-slate-400 text-xs mt-1">Your AI-generated go-to-market strategy and actionable playbook</p>
              </div>
              {gtmPlaybooks.length > 1 && (
                <select
                  value={selectedPlaybook?.trackingId || ""}
                  onChange={(e) => setSelectedPlaybook(gtmPlaybooks.find(p => p.trackingId === e.target.value) || null)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  {gtmPlaybooks.map(p => (
                    <option key={p.trackingId} value={p.trackingId}>{p.productName} — {p.trackingId}</option>
                  ))}
                </select>
              )}
            </div>

            {/* No playbook yet */}
            {gtmPlaybooks.length === 0 && (
              <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-10 text-center space-y-5">
                <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">No GTM Playbook Yet</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                    Submit the GTM intake form to generate your personalized AI-powered Go-to-Market Playbook. It will appear here automatically within 30 seconds.
                  </p>
                </div>
                <a
                  href="/gtm-intake"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Submit GTM Intake Form
                  <ArrowRight className="h-4 w-4" />
                </a>
              </GlassPanel>
            )}

            {/* Generating state */}
            {selectedPlaybook?.status === "generating" && (
              <GlassPanel tilt={false} className="border-blue-500/20 bg-blue-950/10 p-6 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                <h3 className="text-base font-bold text-blue-300">Generating Your GTM Playbook...</h3>
                <p className="text-blue-400/70 text-xs">AI agents are analyzing your intake data and building a comprehensive strategy. This takes 15-30 seconds.</p>
              </GlassPanel>
            )}

            {/* Full playbook view */}
            {selectedPlaybook && selectedPlaybook.status === "ready" && (
              <div className="space-y-5">
                {/* Header card */}
                <GlassPanel tilt={false} className="border-emerald-500/20 bg-emerald-950/10 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/25 uppercase">GTM Playbook Ready</span>
                        <span className="text-slate-500 text-[10px] font-mono">{selectedPlaybook.trackingId}</span>
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">Confidence: {selectedPlaybook.confidence}%</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-100">{selectedPlaybook.productName}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{selectedPlaybook.companyName} · Generated {new Date(selectedPlaybook.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </button>
                  </div>
                  <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">Executive Summary</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedPlaybook.executiveSummary}</p>
                  </div>
                </GlassPanel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* ICP Profile */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Target className="h-4 w-4 text-violet-400" /> ICP Profile</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedPlaybook.icpProfile?.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Industries</p>
                        <div className="flex flex-wrap gap-1">{(selectedPlaybook.icpProfile?.industries || []).map((i: string) => <span key={i} className="bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-violet-500/20">{i}</span>)}</div>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Decision Makers</p>
                        <div className="flex flex-wrap gap-1">{(selectedPlaybook.icpProfile?.decisionMakers || []).map((d: string) => <span key={d} className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-500/20">{d}</span>)}</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Key Pain Points</p>
                      <ul className="space-y-1">{(selectedPlaybook.icpProfile?.painPoints || []).map((p: string, i: number) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-red-400 mt-0.5">•</span>{p}</li>)}</ul>
                    </div>
                  </GlassPanel>

                  {/* Channel Strategy */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> Channel Strategy</h4>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Priority Channels</p>
                      <div className="flex flex-wrap gap-1">{(selectedPlaybook.channelStrategy?.priorityChannels || []).map((c: string) => <span key={c} className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-500/20">{c}</span>)}</div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Messaging Framework</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{selectedPlaybook.channelStrategy?.messagingFramework}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Irresistible Hooks</p>
                      <ul className="space-y-1">{(selectedPlaybook.channelStrategy?.hooks || []).map((h: string, i: number) => <li key={i} className="text-xs text-slate-400 italic flex gap-1.5"><span className="text-amber-400">&quot;</span>{h}</li>)}</ul>
                    </div>
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Primary CTA</p>
                      <p className="text-xs font-bold text-emerald-400">{selectedPlaybook.channelStrategy?.cta}</p>
                    </div>
                  </GlassPanel>
                </div>

                {/* Launch Timeline */}
                <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-400" /> Launch Timeline · Target: {selectedPlaybook.launchTimeline?.launchDate}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[selectedPlaybook.launchTimeline?.phase1, selectedPlaybook.launchTimeline?.phase2, selectedPlaybook.launchTimeline?.phase3].map((phase: any, i: number) => phase && (
                      <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'border-blue-500/25 bg-blue-950/10' : i === 1 ? 'border-amber-500/25 bg-amber-950/10' : 'border-emerald-500/25 bg-emerald-950/10'}`}>
                        <p className={`text-[10px] font-extrabold mb-2 ${i === 0 ? 'text-blue-400' : i === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>{phase.title}</p>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{phase.content}</p>
                        <ul className="space-y-1">{(phase.bullets || []).map((b: string, j: number) => <li key={j} className="text-[10px] text-slate-500 flex gap-1.5"><span className={i === 0 ? 'text-blue-400' : i === 1 ? 'text-amber-400' : 'text-emerald-400'}>→</span>{b}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </GlassPanel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Sales Enablement */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Phone className="h-4 w-4 text-cyan-400" /> Sales Enablement</h4>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Objections & Rebuttals</p>
                      <div className="space-y-2">
                        {(selectedPlaybook.salesEnablement?.objectionsAndRebuttals || []).slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
                            <p className="font-bold text-red-400 mb-1">❌ &quot;{item.objection}&quot;</p>
                            <p className="text-slate-400 leading-relaxed">✅ {item.rebuttal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Call Script Opening</p>
                      <p className="text-xs text-slate-400 italic leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">{selectedPlaybook.salesEnablement?.callScript}</p>
                    </div>
                  </GlassPanel>

                  {/* Risk Assessment & KPIs */}
                  <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-400" /> Risk Assessment & KPIs</h4>
                    <div className="space-y-2">
                      {(selectedPlaybook.riskAssessment || []).slice(0, 3).map((risk: any, i: number) => (
                        <div key={i} className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-slate-300">{risk.risk}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${risk.likelihood === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/25' : risk.likelihood === 'medium' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'}`}>{risk.likelihood}</span>
                          </div>
                          <p className="text-slate-500 text-[10px]">→ {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1.5">Success KPIs</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedPlaybook.kpis || []).map((kpi: string, i: number) => (
                          <span key={i} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px] font-bold">{kpi}</span>
                        ))}
                      </div>
                    </div>
                  </GlassPanel>
                </div>

                {/* Playbook Steps */}
                <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><ArrowRight className="h-4 w-4 text-teal-400" /> Outreach Playbook Steps</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">#</th>
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">Action</th>
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">Owner</th>
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">When</th>
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2 pr-3">Channel</th>
                          <th className="text-left text-[9px] text-slate-500 uppercase font-bold pb-2">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {(selectedPlaybook.playbookSteps || []).map((step: any) => (
                          <tr key={step.step} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-2.5 pr-3"><span className="bg-teal-500/15 text-teal-400 border border-teal-500/25 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">{step.step}</span></td>
                            <td className="py-2.5 pr-3 text-slate-300 font-semibold whitespace-nowrap">{step.action}</td>
                            <td className="py-2.5 pr-3 text-slate-500">{step.owner}</td>
                            <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap">{step.timeframe}</td>
                            <td className="py-2.5 pr-3"><span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">{step.channel}</span></td>
                            <td className="py-2.5 text-slate-500 max-w-xs truncate">{step.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassPanel>
              </div>
            )}

            {/* Legacy GTM Reports (simple metrics) */}
            {gtmReports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-300">GTM Metric Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gtmReports.map(report => (
                    <GlassPanel key={report.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <h4 className="font-bold text-sm text-slate-200">{report.reportName}</h4>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{report.reportType || report.category}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Conversion Rate</p>
                          <p className="text-xl font-extrabold text-green-400">{report.leadConversionRate || report.conversionRate}%</p>
                        </div>
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Pipeline Value</p>
                          <p className="text-xl font-extrabold text-blue-400">${(report.pipelineValue || report.revenue || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SUPPORT TICKETS */}
        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <GlassPanel tilt={false} className="border-slate-800 p-5 h-fit">
              <h3 className="text-lg font-bold text-slate-200 mb-4">File Support Request</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-subj" className="text-slate-400">Subject</Label>
                  <Input
                    id="ticket-subj"
                    placeholder="e.g. API billing issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="bg-slate-950 border-slate-850 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-cat" className="text-slate-400">Category</Label>
                  <select
                    id="ticket-cat"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Technical Bug">Technical Bug</option>
                    <option value="Billing Dispute">Billing Dispute</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-priority" className="text-slate-400">Priority</Label>
                  <select
                    id="ticket-priority"
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-desc" className="text-slate-400">Details of Request</Label>
                  <textarea
                    id="ticket-desc"
                    placeholder="Provide details..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <ExtrudedButton type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                  Submit Support Ticket
                </ExtrudedButton>
              </form>
            </GlassPanel>            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Ticket History Stream</h3>
              {tickets.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center bg-slate-900/10 rounded-xl border border-slate-800">
                  No active support tickets found.
                </p>
              ) : (
                tickets.map((t) => (
                  <GlassPanel key={t.id} tilt={false} className="border border-slate-800 bg-slate-900/20 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">{t.subject}</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-bold border capitalize",
                        t.status === "open" ? "bg-yellow-500/10 text-yellow-450 border-yellow-500/25" : "bg-emerald-500/10 text-emerald-450 border-emerald-500/25"
                      )}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-350">{t.description}</p>
                    
                    {/* Event Timeline History Stream */}
                    <div className="border-t border-slate-850 pt-3 space-y-2 text-[10px]">
                      <span className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Status Timeline</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        <span>Ticket created by client ({new Date(t.createdAt).toLocaleDateString()})</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                        <span>SDR Campaign manager (Vijay) assigned to review request details</span>
                      </div>
                      {t.status === "resolved" && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>Resolved: administrative changes applied successfully</span>
                        </div>
                      )}
                    </div>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        )}

        {/* 6. BILLING & CREDITS */}
        {activeTab === "billing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Purchase Form */}
            <GlassPanel tilt={false} className="border border-slate-800 p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-100">Self-Service Credit Purchaser</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Credits power your outbound dial sessions and campaign sequencing. Buy credits dynamically to load GTM budgets.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Balance</span>
                  <span className="text-3xl font-extrabold text-amber-400 block mt-1">{creditsCount} Credits</span>
                </div>
                <CreditCard className="h-8 w-8 text-slate-700" />
              </div>

              <div className="space-y-3">
                <Label htmlFor="credit-slider" className="text-xs text-slate-350">Quantity to allocate</Label>
                <div className="flex gap-2">
                  <input
                    id="credit-slider"
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={creditsToBuy}
                    onChange={(e) => setCreditsToBuy(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white font-bold w-12 text-right">{creditsToBuy}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Unit Price: $1.00</span>
                  {creditsToBuy >= 250 && <span className="text-emerald-400 font-bold">15% Bulk Discount Applied!</span>}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-850 pt-4">
                <span className="text-xs text-slate-400">Total Purchase Cost:</span>
                <span className="text-lg font-extrabold text-white">
                  ${creditsToBuy >= 250 ? (creditsToBuy * 0.85).toFixed(2) : (creditsToBuy * 1.0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleBuyCreditsSimulated}
                disabled={isPurchasing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Purchase Credits
                  </>
                )}
              </button>
            </GlassPanel>

            {/* Credit Transaction History */}
            <GlassPanel tilt={false} className="border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Transaction History</h3>
                <p className="text-xs text-slate-500 mt-1">Recent credit deposits and usage logs</p>
              </div>

              <div className="space-y-3 my-4 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-black/45 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="block font-bold text-slate-200">{tx.details}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{tx.date}</span>
                    </div>
                    <span className={cn(
                      "font-bold font-mono",
                      tx.type === "purchase" ? "text-emerald-400" : "text-slate-400"
                    )}>
                      {tx.type === "purchase" ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-600 block text-right">
                SECURE STRIPE SANDBOX ACTIVE
              </span>
            </GlassPanel>
          </div>
        )}

        {/* 7. CHAT MESSENGER */}
        {activeTab === "chat" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Workspace Chat Messenger</h2>
            <GlassPanel className="border-slate-800 bg-slate-900/20 p-4 h-[500px] flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-500 text-center py-12 text-sm">No recent messages in this session.</p>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.senderRole === "customer" || msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex flex-col max-w-[70%] space-y-1", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                        <span className="text-[10px] text-slate-500">{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                        <div className={cn(
                          "p-3 rounded-2xl text-xs",
                          isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
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
                  placeholder="Type message to account manager..."
                  className="bg-slate-950 border-slate-850 rounded-xl"
                />
                <ExtrudedButton type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </ExtrudedButton>
              </form>
            </GlassPanel>
          </div>
        )}

        {/* 8. DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Document Vault</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8 col-span-2">No documents stored in vault.</p>
              ) : (
                documents.map(doc => (
                  <GlassPanel key={doc.id} tilt={false} className="border-slate-800 bg-slate-900/20 p-5 space-y-3">
                    <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                      <h4 className="font-bold text-sm text-slate-200">{doc.title}</h4>
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{doc.documentType || doc.type}</span>
                    </div>
                    <p className="text-xs text-slate-400">{doc.description || doc.updateNotes}</p>
                    <p className="text-[10px] text-slate-500">Size: {doc.size || "N/A"} • Version: {doc.version || "1.0"}</p>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        )}

        {/* 9. FEEDBACK */}
        {activeTab === "feedback" && (
          <GlassPanel tilt={false} className="border-slate-800 p-6 max-w-lg mx-auto space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-100">Rate Your Account Manager</h3>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fb-rating" className="text-slate-350">Rating (1 to 5 Stars)</Label>
                <select
                  id="fb-rating"
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
                  <option value="3">⭐⭐⭐ (3 - Average)</option>
                  <option value="2">⭐⭐ (2 - Poor)</option>
                  <option value="1">⭐ (1 - Unacceptable)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fb-comment" className="text-slate-350">Written Comment</Label>
                <textarea
                  id="fb-comment"
                  placeholder="Share details on communication or support..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <ExtrudedButton type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                Submit AM Feedback
              </ExtrudedButton>
            </form>
          </GlassPanel>
        )}

        {/* 10. AI COMMUNICATIONS */}
        {activeTab === "ai-communications" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-100">Outbound Call & Messaging History</h2>
            <div className="space-y-4">
              {callsList.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No call events tracked in history logs.</p>
              ) : (
                callsList.map(call => (
                  <div key={call.id} className="p-3.5 border border-slate-900 bg-slate-950/40 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{call.callerName} → {call.receiverName}</p>
                      <p className="text-slate-500 mt-0.5">Started: {new Date(call.startedAt).toLocaleString()}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">{call.status} ({call.duration}s)</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {/* 13. CHATBOT (WREN AI) TAB */}
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
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* 14. DEALFLOW CRM TAB */}
        {activeTab === "dealflow-crm" && (
          <div className="animate-in fade-in duration-300">
            <DealflowCRMWorkspace userRole="customer" userId={user?.id} />
          </div>
        )}

      </div>
    </div>
  );
}

export default function CustomerPortal() {
  return (
    <AuthProvider allowedRoles={["customer"]}>
      <CustomerPortalContent />
    </AuthProvider>
  );
}
