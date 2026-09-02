// components/portal/ClientManagementPortalSuite.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { 
  Users, 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  Download, 
  Mail, 
  Phone, 
  Calendar, 
  Tag, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  MoreVertical, 
  Settings, 
  Database, 
  Activity, 
  Zap, 
  TrendingUp, 
  BarChart2, 
  Globe, 
  HelpCircle, 
  X, 
  Info, 
  Clock, 
  Play, 
  FileText, 
  Send, 
  Wifi, 
  WifiOff, 
  LayoutGrid, 
  ListFilter, 
  SlidersHorizontal, 
  UserPlus, 
  FileSpreadsheet, 
  Share2, 
  DollarSign,
  PieChart,
  HardDrive,
  Pin,
  Maximize2,
  Minimize2,
  ExternalLink,
  Bot
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BulkDataProcessorHub } from "@/components/portal/BulkDataProcessorHub";
import { cn } from "@/lib/utils";

// Types & Interfaces
export type UserRoleTier = "admin" | "manager" | "viewer";

export interface ClientRecord {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  industry: "SaaS" | "FinTech" | "HealthTech" | "E-commerce" | "CleanTech" | "AI/ML" | "Logistics";
  accountValue: number; // in USD
  healthScore: number; // 0 - 100
  status: "Active" | "Prospect" | "Onboarding" | "At-Risk" | "VIP" | "Churned";
  stage: "Discovery" | "Demo" | "Proposal" | "Negotiation" | "Closed Won";
  assignedAgent: string;
  lastInteraction: string;
  tags: string[];
  notesCount: number;
  activeBotsCount: number;
  dealVelocity: number; // e.g. +14%
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  metric: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  size: "1x1" | "2x1" | "wide";
  pinned: boolean;
  colorScheme: "emerald" | "cyan" | "indigo" | "violet" | "amber" | "rose";
  iconName: string;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  role: UserRoleTier;
  action: string;
  target: string;
  details: string;
  severity: "info" | "warning" | "critical";
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  isSystemDefault?: boolean;
  criteria: {
    industries: string[];
    minAccountValue: number;
    maxAccountValue: number;
    statuses: string[];
    minHealthScore: number;
    lastInteractionDays?: number;
  };
}

// Initial Mock Data
const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: "cli-101",
    name: "Apex HyperScale Technologies",
    contactName: "Elena Rostova",
    email: "elena.r@apexscale.io",
    phone: "+1 (415) 890-4421",
    industry: "AI/ML",
    accountValue: 340000,
    healthScore: 94,
    status: "VIP",
    stage: "Closed Won",
    assignedAgent: "Sarah Chen (AI Lead)",
    lastInteraction: "2026-08-18T14:30:00Z",
    tags: ["Enterprise", "AI Pilot", "High-Touch"],
    notesCount: 14,
    activeBotsCount: 3,
    dealVelocity: 28,
  },
  {
    id: "cli-102",
    name: "NovaPay Global Settlements",
    contactName: "Marcus Thorne",
    email: "m.thorne@novapay.com",
    phone: "+1 (212) 555-8832",
    industry: "FinTech",
    accountValue: 520000,
    healthScore: 88,
    status: "Active",
    stage: "Closed Won",
    assignedAgent: "David Miller",
    lastInteraction: "2026-08-17T09:15:00Z",
    tags: ["Enterprise", "Q3 Expansion"],
    notesCount: 8,
    activeBotsCount: 2,
    dealVelocity: 14,
  },
  {
    id: "cli-103",
    name: "BioSynthetix Genomics",
    contactName: "Dr. Aris Vance",
    email: "aris.vance@biosyn.org",
    phone: "+1 (617) 492-3001",
    industry: "HealthTech",
    accountValue: 185000,
    healthScore: 52,
    status: "At-Risk",
    stage: "Negotiation",
    assignedAgent: "Alex Rivera",
    lastInteraction: "2026-08-11T16:00:00Z",
    tags: ["At-Risk Churn", "Renewal Pending"],
    notesCount: 19,
    activeBotsCount: 1,
    dealVelocity: -8,
  },
  {
    id: "cli-104",
    name: "CloudVortex Infrastructure",
    contactName: "Priya Sharma",
    email: "priya@cloudvortex.net",
    phone: "+1 (408) 332-9011",
    industry: "SaaS",
    accountValue: 240000,
    healthScore: 78,
    status: "Onboarding",
    stage: "Proposal",
    assignedAgent: "Sarah Chen (AI Lead)",
    lastInteraction: "2026-08-18T11:20:00Z",
    tags: ["Fast-Track", "Automated GTM"],
    notesCount: 6,
    activeBotsCount: 4,
    dealVelocity: 22,
  },
  {
    id: "cli-105",
    name: "Verdant Energy Dynamics",
    contactName: "Julian Hayes",
    email: "julian@verdantdyn.com",
    phone: "+1 (303) 774-1290",
    industry: "CleanTech",
    accountValue: 95000,
    healthScore: 91,
    status: "Prospect",
    stage: "Demo",
    assignedAgent: "David Miller",
    lastInteraction: "2026-08-16T18:45:00Z",
    tags: ["CleanTech Pilot", "Inbound Lead"],
    notesCount: 4,
    activeBotsCount: 1,
    dealVelocity: 35,
  },
  {
    id: "cli-106",
    name: "OmniCart Commerce Matrix",
    contactName: "Chloe Dupont",
    email: "c.dupont@omnicart.io",
    phone: "+33 1 42 68 55 00",
    industry: "E-commerce",
    accountValue: 410000,
    healthScore: 82,
    status: "Active",
    stage: "Closed Won",
    assignedAgent: "Alex Rivera",
    lastInteraction: "2026-08-15T13:10:00Z",
    tags: ["Multi-Region", "High-Volume"],
    notesCount: 11,
    activeBotsCount: 2,
    dealVelocity: 9,
  },
  {
    id: "cli-107",
    name: "Orbit Logistics FreightAI",
    contactName: "Tariq Mansoor",
    email: "tmansoor@orbitfreight.ae",
    phone: "+971 4 332 9988",
    industry: "Logistics",
    accountValue: 275000,
    healthScore: 68,
    status: "Onboarding",
    stage: "Proposal",
    assignedAgent: "Sarah Chen (AI Lead)",
    lastInteraction: "2026-08-14T08:00:00Z",
    tags: ["Middle East", "Automated GTM"],
    notesCount: 7,
    activeBotsCount: 2,
    dealVelocity: 18,
  }
];

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "widget-arr",
    title: "Portfolio ARR Value",
    metric: "$2.06M",
    change: "+18.4% vs last Q",
    changeType: "up",
    size: "1x1",
    pinned: true,
    colorScheme: "emerald",
    iconName: "DollarSign",
    description: "Combined recurring annual revenue across all active enterprise accounts"
  },
  {
    id: "widget-clients",
    title: "Managed Client Accounts",
    metric: "7 Total",
    change: "+3 in onboarding",
    changeType: "up",
    size: "1x1",
    pinned: true,
    colorScheme: "cyan",
    iconName: "Building2",
    description: "Active enterprise contracts and validated high-touch prospect pipelines"
  },
  {
    id: "widget-health",
    title: "Avg Client Health Score",
    metric: "79 / 100",
    change: "+4 pts this month",
    changeType: "up",
    size: "1x1",
    pinned: true,
    colorScheme: "indigo",
    iconName: "Activity",
    description: "AI-calculated engagement index across meetings, ticket velocity, and usage"
  },
  {
    id: "widget-churn",
    title: "At-Risk Retention",
    metric: "1 Account",
    change: "Requires proactive touch",
    changeType: "down",
    size: "1x1",
    pinned: true,
    colorScheme: "rose",
    iconName: "AlertTriangle",
    description: "Accounts flagged with declining interaction velocity in the past 14 days"
  },
  {
    id: "widget-ai-bots",
    title: "Active Dealflow Bots",
    metric: "15 Agents",
    change: "100% operational",
    changeType: "up",
    size: "2x1",
    pinned: false,
    colorScheme: "violet",
    iconName: "Bot",
    description: "Automated autonomous meeting, GTM scraping, and intake assistant bots active"
  }
];

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "preset-high-value",
    name: "High-Value Enterprise ($300k+)",
    description: "Tier-1 accounts generating significant recurring contract value",
    isSystemDefault: true,
    criteria: {
      industries: [],
      minAccountValue: 300000,
      maxAccountValue: 1000000,
      statuses: [],
      minHealthScore: 0
    }
  },
  {
    id: "preset-at-risk",
    name: "At-Risk Churn Alert (<60 Health)",
    description: "Clients requiring immediate retention outreach or escalated support",
    isSystemDefault: true,
    criteria: {
      industries: [],
      minAccountValue: 0,
      maxAccountValue: 1000000,
      statuses: ["At-Risk"],
      minHealthScore: 0
    }
  },
  {
    id: "preset-onboarding",
    name: "Active Onboarding Queue",
    description: "New clients currently undergoing model calibration and bot provisioning",
    isSystemDefault: true,
    criteria: {
      industries: [],
      minAccountValue: 0,
      maxAccountValue: 1000000,
      statuses: ["Onboarding"],
      minHealthScore: 0
    }
  }
];

const INTEGRATIONS_CATALOG = [
  {
    id: "salesforce",
    name: "Salesforce CRM",
    category: "CRM & Pipelines",
    icon: Globe,
    status: "connected",
    lastSync: "3 mins ago",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    description: "Two-way live synchronization of contacts, accounts, and deal stages with dealflow.ai"
  },
  {
    id: "hubspot",
    name: "HubSpot Enterprise",
    category: "Marketing & Inbound",
    icon: Sparkles,
    status: "connected",
    lastSync: "12 mins ago",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    description: "Automatic lead ingestion, automated GTM analysis triggers, and contact timeline logging"
  },
  {
    id: "stripe",
    name: "Stripe Billing & Metering",
    category: "Payments & Invoicing",
    icon: DollarSign,
    status: "connected",
    lastSync: "Real-time Webhook",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    description: "Credit balance deductions, automated subscription tier enforcement, and payment receipts"
  },
  {
    id: "slack",
    name: "Slack Alert Dispatcher",
    category: "Communications",
    icon: Send,
    status: "connected",
    lastSync: "Active Listener",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    description: "Real-time channel notifications for VIP deal progression, meeting summaries, and at-risk alerts"
  },
  {
    id: "twilio",
    name: "Twilio WhatsApp & Voice",
    category: "Telephony & SMS",
    icon: Phone,
    status: "connected",
    lastSync: "Evolution API Active",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    description: "Automated outbound campaign dials, WhatsApp reminder dispatches, and in-portal calls"
  },
  {
    id: "google_cal",
    name: "Google Calendar & Meet",
    category: "Scheduling",
    icon: Calendar,
    status: "standby",
    lastSync: "Requires Re-auth",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    description: "Automatic standup booking synchronization and meeting bot attendance routing"
  }
];

export function ClientManagementPortalSuite({ initialRole }: { initialRole?: UserRoleTier } = {}) {
  // 1. Authenticated User & RBAC Enforcement
  const { user } = useCurrentUser();

  const authenticatedRole: UserRoleTier = useMemo(() => {
    if (initialRole) return initialRole;
    if (user?.role === "admin") return "admin";
    if (user?.role === "agent") return "manager";
    return "viewer"; // Default non-admin / non-agent to restricted viewer
  }, [user, initialRole]);

  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [userRole, setUserRole] = useState<UserRoleTier>(authenticatedRole);

  useEffect(() => {
    setUserRole(authenticatedRole);
  }, [authenticatedRole]);

  const isAdminUser = user?.role === "admin";
  const [viewLayout, setViewLayout] = useState<"cards" | "table">("cards");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [activeClientDrawer, setActiveClientDrawer] = useState<ClientRecord | null>(null);

  // 2. Widget Customizer State (Saved in LocalStorage)
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dealflow_client_widgets_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_WIDGETS;
  });
  const [isWidgetSettingsOpen, setIsWidgetSettingsOpen] = useState(false);

  // 3. Search & Multi-Parameter Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [minAccountVal, setMinAccountVal] = useState<number>(0);
  const [minHealthVal, setMinHealthVal] = useState<number>(0);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // 4. Bulk Action Modals
  const [bulkActionType, setBulkActionType] = useState<"none" | "status" | "tag" | "email">("none");
  const [bulkStatusValue, setBulkStatusValue] = useState<ClientRecord["status"]>("Active");
  const [bulkTagValue, setBulkTagValue] = useState("");
  const [bulkEmailSubject, setBulkEmailSubject] = useState("Important Partnership & Roadmap Update — Q3");
  const [bulkEmailBody, setBulkEmailBody] = useState("Hi {{contactName}},\n\nWe wanted to share our latest AI pipeline performance report and discuss scaling opportunities for {{companyName}}.\n\nBest,\nDealFlow AI Team");
  const [isExecutingBulk, setIsExecutingBulk] = useState(false);

  // 5. Audit Logging State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      operator: "System Orchestrator",
      role: "admin",
      action: "HEALTH_SCORE_RECALCULATED",
      target: "All Active Accounts",
      details: "Automated neural evaluation indexed 7 accounts based on weekly meeting sentiment.",
      severity: "info"
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      operator: "Sarah Chen (AI Lead)",
      role: "manager",
      action: "CLIENT_STATUS_UPDATED",
      target: "Apex HyperScale Technologies",
      details: "Promoted client tier from Active to VIP after $340k ARR commitment.",
      severity: "info"
    }
  ]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isBulkProcessorOpen, setIsBulkProcessorOpen] = useState(false);

  // 6. Integration Wizard & Drawer State
  const [selectedIntegration, setSelectedIntegration] = useState<typeof INTEGRATIONS_CATALOG[0] | null>(null);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [apiConnectionKey, setApiConnectionKey] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestSuccess, setWebhookTestSuccess] = useState<boolean | null>(null);

  // 7. Advanced Settings & RBAC Policy State
  const [isAdvancedSettingsModalOpen, setIsAdvancedSettingsModalOpen] = useState(false);
  const [allowClientExports, setAllowClientExports] = useState(true);
  const [require2FAForFinancials, setRequire2FAForFinancials] = useState(true);
  const [customBrandColor, setCustomBrandColor] = useState("#0071E3");
  const [whitelabelDomain, setWhitelabelDomain] = useState("portal.apexscale.io");
  const [dataRetentionDays, setDataRetentionDays] = useState(365);

  // 8. Real-Time Sync Simulation & Offline Fallback
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(15); // seconds

  // 9. Interactive Guided Onboarding Tour State
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  // 10. Notification Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((type: "success" | "error" | "info", title: string, text: string) => {
    setToastMessage({ title, text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Save widgets to LocalStorage
  const handleSaveWidgets = (updatedWidgets: DashboardWidgetConfig[]) => {
    setWidgets(updatedWidgets);
    if (typeof window !== "undefined") {
      localStorage.setItem("dealflow_client_widgets_v1", JSON.stringify(updatedWidgets));
    }
    showToast("success", "Layout Preserved", "Custom dashboard widgets saved and synced to your profile.");
  };

  const togglePinWidget = (widgetId: string) => {
    const next = widgets.map(w => w.id === widgetId ? { ...w, pinned: !w.pinned } : w);
    handleSaveWidgets(next);
  };

  const toggleWidgetSize = (widgetId: string) => {
    const next = widgets.map(w => {
      if (w.id === widgetId) {
        const nextSize: "1x1" | "2x1" = w.size === "1x1" ? "2x1" : "1x1";
        return { ...w, size: nextSize };
      }
      return w;
    });
    handleSaveWidgets(next);
  };

  // Real-time synchronization heartbeat
  useEffect(() => {
    if (autoSyncInterval <= 0) return;
    const interval = setInterval(() => {
      setSyncStatus("syncing");
      setTimeout(() => {
        setSyncStatus("synced");
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }, 800);
    }, autoSyncInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSyncInterval]);

  const handleManualSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast("success", "Live Sync Complete", "7 client pipelines and 15 agent telemetry channels updated in real time.");
    }, 600);
  };

  // Preset Filters Manager
  const applyPreset = (preset: FilterPreset) => {
    setActivePresetId(preset.id);
    setSelectedIndustries(preset.criteria.industries);
    setSelectedStatuses(preset.criteria.statuses as any);
    setMinAccountVal(preset.criteria.minAccountValue);
    setMinHealthVal(preset.criteria.minHealthScore);
    showToast("info", "Preset Applied", `Loaded filter preset: "${preset.name}"`);
  };

  const clearAllFilters = () => {
    setActivePresetId(null);
    setSelectedIndustries([]);
    setSelectedStatuses([]);
    setMinAccountVal(0);
    setMinHealthVal(0);
    setSearchQuery("");
  };

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newP: FilterPreset = {
      id: `preset-custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: "Custom saved segment filter",
      criteria: {
        industries: selectedIndustries,
        minAccountValue: minAccountVal,
        maxAccountValue: 1000000,
        statuses: selectedStatuses,
        minHealthScore: minHealthVal
      }
    };
    setCustomPresets(prev => [...prev, newP]);
    setNewPresetName("");
    setActivePresetId(newP.id);
    showToast("success", "Preset Created", `Saved new custom filter segment: "${newP.name}"`);
  };

  // Filtered Client List
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = client.name.toLowerCase().includes(q);
        const matchContact = client.contactName.toLowerCase().includes(q);
        const matchEmail = client.email.toLowerCase().includes(q);
        const matchIndustry = client.industry.toLowerCase().includes(q);
        const matchAgent = client.assignedAgent.toLowerCase().includes(q);
        const matchTag = client.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchContact && !matchEmail && !matchIndustry && !matchAgent && !matchTag) {
          return false;
        }
      }

      // 2. Industry Filter
      if (selectedIndustries.length > 0 && !selectedIndustries.includes(client.industry)) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(client.status)) {
        return false;
      }

      // 4. Account Value
      if (client.accountValue < minAccountVal) {
        return false;
      }

      // 5. Health Score
      if (client.healthScore < minHealthVal) {
        return false;
      }

      return true;
    });
  }, [clients, searchQuery, selectedIndustries, selectedStatuses, minAccountVal, minHealthVal]);

  // Aggregate Dynamic Metrics
  const calculatedMetrics = useMemo(() => {
    const totalArr = clients.reduce((acc, c) => acc + c.accountValue, 0);
    const avgHealth = Math.round(clients.reduce((acc, c) => acc + c.healthScore, 0) / (clients.length || 1));
    const atRiskCount = clients.filter(c => c.status === "At-Risk" || c.healthScore < 60).length;
    const vipCount = clients.filter(c => c.status === "VIP").length;
    return {
      formattedArr: `$${(totalArr / 1000000).toFixed(2)}M`,
      avgHealth,
      atRiskCount,
      vipCount
    };
  }, [clients]);

  // Select all or toggle single
  const handleToggleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleToggleSelectClient = (id: string) => {
    setSelectedClientIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions Execution
  const executeBulkStatusChange = () => {
    if (userRole === "viewer") {
      showToast("error", "RBAC Restricted", "Viewer tier lacks permission to perform bulk updates. Contact an Administrator.");
      return;
    }
    setIsExecutingBulk(true);
    setTimeout(() => {
      setClients(prev => prev.map(c => {
        if (selectedClientIds.includes(c.id)) {
          return { ...c, status: bulkStatusValue };
        }
        return c;
      }));

      // Add to audit log
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: `Demo User (${userRole.toUpperCase()})`,
        role: userRole,
        action: "BULK_STATUS_UPDATE",
        target: `${selectedClientIds.length} Selected Clients`,
        details: `Batch modified client lifecycle state to "${bulkStatusValue}".`,
        severity: "warning"
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setIsExecutingBulk(false);
      setBulkActionType("none");
      showToast("success", "Bulk Status Updated", `Successfully updated ${selectedClientIds.length} client accounts to "${bulkStatusValue}".`);
      setSelectedClientIds([]);
    }, 700);
  };

  const executeBulkTagging = () => {
    if (!bulkTagValue.trim()) return;
    if (userRole === "viewer") {
      showToast("error", "RBAC Restricted", "Viewer tier lacks permission to modify tags.");
      return;
    }
    setIsExecutingBulk(true);
    setTimeout(() => {
      setClients(prev => prev.map(c => {
        if (selectedClientIds.includes(c.id)) {
          const updatedTags = Array.from(new Set([...c.tags, bulkTagValue.trim()]));
          return { ...c, tags: updatedTags };
        }
        return c;
      }));

      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: `Demo User (${userRole.toUpperCase()})`,
        role: userRole,
        action: "BULK_TAG_ASSIGNED",
        target: `${selectedClientIds.length} Selected Clients`,
        details: `Assigned tag [${bulkTagValue.trim()}] across batch records.`,
        severity: "info"
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setIsExecutingBulk(false);
      setBulkActionType("none");
      setBulkTagValue("");
      showToast("success", "Tags Assigned", `Appended tag "${bulkTagValue.trim()}" to ${selectedClientIds.length} clients.`);
      setSelectedClientIds([]);
    }, 600);
  };

  const executeBulkEmailOutreach = () => {
    if (userRole === "viewer") {
      showToast("error", "RBAC Restricted", "Viewer tier lacks permission to trigger mass email outreach.");
      return;
    }
    setIsExecutingBulk(true);
    setTimeout(() => {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: `Demo User (${userRole.toUpperCase()})`,
        role: userRole,
        action: "BULK_OUTREACH_DISPATCHED",
        target: `${selectedClientIds.length} Enterprise Contacts`,
        details: `Subject: "${bulkEmailSubject}". Dispatched through Twilio / SendGrid mailer pipeline.`,
        severity: "info"
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setIsExecutingBulk(false);
      setBulkActionType("none");
      showToast("success", "Campaign Dispatched", `Sent personalized emails to ${selectedClientIds.length} client contacts.`);
      setSelectedClientIds([]);
    }, 800);
  };

  // Client Data Export with RBAC Check
  const handleExportClients = (format: "CSV" | "JSON") => {
    if (userRole === "viewer" && !allowClientExports) {
      showToast("error", "Export Restricted", "Administrative policy blocks data export for Viewer roles.");
      return;
    }

    const payload = JSON.stringify(filteredClients, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dealflow-clients-export-${new Date().toISOString().split("T")[0]}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operator: `User (${userRole.toUpperCase()})`,
      role: userRole,
      action: `DATA_EXPORT_${format}`,
      target: "Client Records",
      details: `Exported ${filteredClients.length} client records in ${format} format.`,
      severity: "warning"
    };
    setAuditLogs(prev => [newLog, ...prev]);

    showToast("success", "Export Ready", `Downloaded ${filteredClients.length} records as ${format}.`);
  };

  // Integration Connection Test
  const handleTestIntegrationWebhook = () => {
    setIsTestingWebhook(true);
    setWebhookTestSuccess(null);
    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookTestSuccess(true);
      showToast("success", "Webhook Verified", `Handshake with ${selectedIntegration?.name} succeeded in 42ms.`);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Dynamic Toast Notification (Portalled to document.body with z-[999999]) */}
      {toastMessage && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
          <div className={cn(
            "p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 max-w-md ring-1 ring-black/10 dark:ring-white/10",
            toastMessage.type === "success" ? "bg-emerald-950/98 border-emerald-500 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.25)]" :
            toastMessage.type === "error" ? "bg-rose-950/98 border-rose-500 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.25)]" :
            "bg-indigo-950/98 border-indigo-500 text-indigo-100 shadow-[0_10px_30px_rgba(99,102,241,0.25)]"
          )}>
            {toastMessage.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toastMessage.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
            {toastMessage.type === "info" && <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs uppercase tracking-wider">{toastMessage.title}</h4>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed break-words">{toastMessage.text}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white shrink-0 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Top Command Bar & RBAC Switcher */}
      <GlassPanel material="glass" depth="mid" className="p-6 border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/40">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Client & Customer Management Suite
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">
                    v3.2 3D Realtime
                  </span>
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Autonomous enterprise relationship orchestration, multi-touch health telemetry, and RBAC governance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Hub & RBAC Tier Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Sync Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-700/70 text-xs text-slate-300">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full animate-pulse",
                syncStatus === "synced" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" :
                syncStatus === "syncing" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" :
                "bg-rose-400"
              )} />
              <span className="font-semibold text-[11px]">
                {syncStatus === "synced" ? `Live Synced (${lastSyncedTime})` : syncStatus === "syncing" ? "Synchronizing..." : "Offline Cached"}
              </span>
              <button 
                onClick={handleManualSync}
                title="Force refresh client state"
                className="ml-1 p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", syncStatus === "syncing" && "animate-spin")} />
              </button>
            </div>

            {/* RBAC Role Selector Simulator (Admin-Only Privilege) */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-700/70 px-3 py-1 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span className="text-[11px] text-slate-400 font-semibold">Role:</span>
              {isAdminUser ? (
                <select
                  value={userRole}
                  onChange={(e) => {
                    setUserRole(e.target.value as UserRoleTier);
                    showToast("info", "Role Switched", `Simulating interface permissions for "${e.target.value.toUpperCase()}".`);
                  }}
                  className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
                >
                  <option value="admin" className="bg-slate-900 text-white">Super Admin (Full Access)</option>
                  <option value="manager" className="bg-slate-900 text-white">Sales Ops Manager</option>
                  <option value="viewer" className="bg-slate-900 text-white">Client Viewer (Read Only)</option>
                </select>
              ) : (
                <span className="text-xs font-bold text-cyan-300 uppercase font-mono px-1">
                  {userRole === "manager" ? "Sales Ops Manager" : "Client Viewer (Read Only)"}
                </span>
              )}
            </div>

            {/* Guided Tour Trigger */}
            <ExtrudedButton
              onClick={() => {
                setTourStep(1);
                setIsOnboardingTourOpen(true);
              }}
              variant="outline"
              className="py-1.5 px-3 text-xs font-bold border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Feature Tour
            </ExtrudedButton>

            {/* Audit Log Trigger */}
            <ExtrudedButton
              onClick={() => setIsAuditDrawerOpen(true)}
              variant="outline"
              className="py-1.5 px-3 text-xs font-bold border-slate-700 text-slate-200 hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Audit Log ({auditLogs.length})
            </ExtrudedButton>

            {/* Advanced Settings (RBAC Protected) */}
            <ExtrudedButton
              onClick={() => setIsAdvancedSettingsModalOpen(true)}
              className="py-1.5 px-3 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings & RBAC
            </ExtrudedButton>
          </div>
        </div>
      </GlassPanel>

      {/* 2. Interactive 3D Customizable Dashboard Widgets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
              Live Relationship & Revenue Metrics
            </h3>
          </div>
          <button
            onClick={() => setIsWidgetSettingsOpen(!isWidgetSettingsOpen)}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all"
          >
            <Sliders className="h-3.5 w-3.5" />
            {isWidgetSettingsOpen ? "Hide Layout Controls" : "Customize Widgets"}
          </button>
        </div>

        {/* Widget Customization Tray */}
        {isWidgetSettingsOpen && (
          <GlassPanel className="p-4 border-indigo-500/30 bg-indigo-950/30 space-y-3 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
                Toggle Widget Pinning, Resizing, and Layout Order
              </span>
              <button
                onClick={() => handleSaveWidgets(DEFAULT_WIDGETS)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Reset to Default Grid
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {widgets.map(w => (
                <div key={w.id} className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">{w.title}</p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{w.size}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleWidgetSize(w.id)}
                      title={`Current size: ${w.size}. Click to toggle width`}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      {w.size === "1x1" ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => togglePinWidget(w.id)}
                      title={w.pinned ? "Pinned to top" : "Unpinned"}
                      className={cn(
                        "p-1 rounded text-xs transition-colors",
                        w.pinned ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"
                      )}
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* 3D KPI Cards Grid with Parallax Depth and Hover Tilt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {widgets.map((widget) => {
            const isWide = widget.size === "2x1";
            return (
              <div
                key={widget.id}
                className={cn(
                  "group relative transition-all duration-300 hover:-translate-y-1.5 cursor-pointer",
                  isWide ? "lg:col-span-2" : "col-span-1"
                )}
                style={{
                  perspective: "1000px",
                  willChange: "transform"
                }}
              >
                {/* 3D Card Body */}
                <div className={cn(
                  "p-5 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-between shadow-xl",
                  widget.colorScheme === "emerald" ? "bg-gradient-to-br from-slate-900/90 to-emerald-950/50 border-emerald-500/30 hover:border-emerald-500/70 shadow-emerald-500/5 hover:shadow-emerald-500/20" :
                  widget.colorScheme === "cyan" ? "bg-gradient-to-br from-slate-900/90 to-cyan-950/50 border-cyan-500/30 hover:border-cyan-500/70 shadow-cyan-500/5 hover:shadow-cyan-500/20" :
                  widget.colorScheme === "indigo" ? "bg-gradient-to-br from-slate-900/90 to-indigo-950/50 border-indigo-500/30 hover:border-indigo-500/70 shadow-indigo-500/5 hover:shadow-indigo-500/20" :
                  widget.colorScheme === "rose" ? "bg-gradient-to-br from-slate-900/90 to-rose-950/50 border-rose-500/30 hover:border-rose-500/70 shadow-rose-500/5 hover:shadow-rose-500/20" :
                  "bg-gradient-to-br from-slate-900/90 to-violet-950/50 border-violet-500/30 hover:border-violet-500/70 shadow-violet-500/5 hover:shadow-violet-500/20"
                )}>
                  {/* Holographic light sweep reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {widget.title}
                      </span>
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center text-white border shadow-md",
                        widget.colorScheme === "emerald" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" :
                        widget.colorScheme === "cyan" ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" :
                        widget.colorScheme === "indigo" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" :
                        widget.colorScheme === "rose" ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                        "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      )}>
                        {widget.iconName === "DollarSign" && <DollarSign className="h-4 w-4" />}
                        {widget.iconName === "Building2" && <Building2 className="h-4 w-4" />}
                        {widget.iconName === "Activity" && <Activity className="h-4 w-4" />}
                        {widget.iconName === "AlertTriangle" && <AlertTriangle className="h-4 w-4" />}
                        {widget.iconName === "Bot" && <Bot className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Dynamic Metric Value */}
                    <div className="text-3xl font-black text-white tracking-tight my-1">
                      {widget.id === "widget-arr" ? calculatedMetrics.formattedArr :
                       widget.id === "widget-clients" ? `${filteredClients.length} Accounts` :
                       widget.id === "widget-health" ? `${calculatedMetrics.avgHealth} / 100` :
                       widget.id === "widget-churn" ? `${calculatedMetrics.atRiskCount} Account` :
                       widget.metric}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className={cn(
                      "font-bold flex items-center gap-1",
                      widget.changeType === "up" ? "text-emerald-400" :
                      widget.changeType === "down" ? "text-rose-400" :
                      "text-slate-300"
                    )}>
                      {widget.changeType === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
                      {widget.changeType === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
                      {widget.change}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Intelligent Multi-Parameter Filtering & Preset Management */}
      <GlassPanel material="glass" depth="mid" className="p-5 border-slate-700/70 bg-slate-900/80 space-y-4">
        {/* Preset Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="h-3.5 w-3.5 text-cyan-400" />
              Filter Presets:
            </span>
            {customPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "text-xs px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 border",
                  activePresetId === preset.id
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-500/20"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                )}
              >
                <span>{preset.name}</span>
                {activePresetId === preset.id && <Check className="h-3 w-3 text-cyan-400" />}
              </button>
            ))}
            {activePresetId && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all",
                isFilterPanelOpen ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Advanced Parameters ({selectedIndustries.length + selectedStatuses.length + (minAccountVal > 0 ? 1 : 0) + (minHealthVal > 0 ? 1 : 0)})
            </button>
          </div>
        </div>

        {/* Search Input & Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, contact, industry, agent, or tags (e.g. 'Apex', 'Elena', 'AI Pilot')..."
              className="pl-10 bg-slate-950/70 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus:border-cyan-500 text-xs h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Toggles & Export Triggers */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 flex items-center">
              <button
                onClick={() => setViewLayout("cards")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all",
                  viewLayout === "cards" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                )}
                title="3D Interactive Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewLayout("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all",
                  viewLayout === "table" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                )}
                title="High-Density Table"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </button>
            </div>

            {/* Export & Bulk Ingest Buttons */}
            <ExtrudedButton
              onClick={() => setIsBulkProcessorOpen(true)}
              variant="outline"
              className="py-1.5 px-3 text-xs font-bold border-emerald-700/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Bulk CSV / Sheets
            </ExtrudedButton>

            <ExtrudedButton
              onClick={() => handleExportClients("CSV")}
              variant="outline"
              className="py-1.5 px-3 text-xs font-bold border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              Export CSV
            </ExtrudedButton>
          </div>
        </div>

        {/* Collapsible Advanced Filter Drawer */}
        {isFilterPanelOpen && (
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Industry Multi-select */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Target Industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["AI/ML", "FinTech", "HealthTech", "SaaS", "CleanTech", "E-commerce", "Logistics"] as const).map(ind => {
                    const active = selectedIndustries.includes(ind);
                    return (
                      <button
                        key={ind}
                        onClick={() => setSelectedIndustries(prev => 
                          active ? prev.filter(i => i !== ind) : [...prev, ind]
                        )}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all",
                          active ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50" : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                        )}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Multi-select */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Lifecycle Status</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["VIP", "Active", "Onboarding", "Prospect", "At-Risk"] as const).map(st => {
                    const active = selectedStatuses.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => setSelectedStatuses(prev => 
                          active ? prev.filter(s => s !== st) : [...prev, st]
                        )}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all",
                          active ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                        )}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ARR & Health Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Min ARR Contract Value:</span>
                    <span className="text-emerald-400 font-black">${(minAccountVal / 1000).toFixed(0)}k</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500000}
                    step={25000}
                    value={minAccountVal}
                    onChange={(e) => setMinAccountVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Min Client Health Score:</span>
                    <span className="text-cyan-400 font-black">{minHealthVal} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={95}
                    step={5}
                    value={minHealthVal}
                    onChange={(e) => setMinHealthVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Save As New Preset Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Name this custom segment preset..."
                  className="bg-slate-900 border-slate-700 text-white text-xs h-8 rounded-lg"
                />
                <button
                  onClick={handleSaveCustomPreset}
                  disabled={!newPresetName.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                >
                  Save Preset
                </button>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear All Parameters
              </button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* 4. Floating Bulk Action Toolbar (When 1+ clients are checked) */}
      {selectedClientIds.length > 0 && (
        <div className="sticky top-4 z-40 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-xs">
                {selectedClientIds.length}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {selectedClientIds.length} Client Records Selected
                </h4>
                <p className="text-[11px] text-slate-300">Execute mass lifecycle transitions or outreach</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ExtrudedButton
                onClick={() => setBulkActionType("status")}
                className="py-1.5 px-3 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Change Status
              </ExtrudedButton>

              <ExtrudedButton
                onClick={() => setBulkActionType("tag")}
                className="py-1.5 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
              >
                <Tag className="h-3.5 w-3.5" />
                Assign Tag
              </ExtrudedButton>

              <ExtrudedButton
                onClick={() => setBulkActionType("email")}
                className="py-1.5 px-3 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                Email Outreach
              </ExtrudedButton>

              <button
                onClick={() => setSelectedClientIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Client Directory Views (3D Cards or Table Layout) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg"
            >
              <Check className={cn("h-3.5 w-3.5", selectedClientIds.length === filteredClients.length && selectedClientIds.length > 0 && "text-emerald-400")} />
              {selectedClientIds.length === filteredClients.length && selectedClientIds.length > 0 ? "Deselect All" : "Select All Visible"}
            </button>
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredClients.length}</strong> of {clients.length} accounts
            </span>
          </div>
        </div>

        {/* View Option A: 3D Perspective Client Profile Cards */}
        {viewLayout === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const isSelected = selectedClientIds.includes(client.id);
              return (
                <div
                  key={client.id}
                  className="group relative transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                  style={{
                    perspective: "1000px",
                    willChange: "transform"
                  }}
                  onClick={() => setActiveClientDrawer(client)}
                >
                  <div className={cn(
                    "p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full shadow-2xl",
                    isSelected
                      ? "bg-indigo-950/90 border-indigo-400 shadow-indigo-500/30 ring-2 ring-indigo-400/50"
                      : "bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50 shadow-black/40"
                  )}>
                    {/* Top Layer: Checkbox, Status Pill, and Value */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelectClient(client.id);
                            }}
                            className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={cn(
                            "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            client.status === "VIP" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                            client.status === "Active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                            client.status === "Onboarding" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" :
                            client.status === "At-Risk" ? "bg-rose-500/20 text-rose-300 border-rose-500/40" :
                            "bg-slate-800 text-slate-300 border-slate-700"
                          )}>
                            {client.status}
                          </span>
                        </div>

                        {/* Health Score Gauge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">Health:</span>
                          <span className={cn(
                            "text-xs font-black px-2 py-0.5 rounded-lg border",
                            client.healthScore >= 85 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            client.healthScore >= 65 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          )}>
                            {client.healthScore}%
                          </span>
                        </div>
                      </div>

                      {/* Client Title & Industry */}
                      <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-tight mb-1">
                        {client.name}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mb-4">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{client.industry}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-semibold">{client.contactName}</span>
                      </p>

                      {/* 3D Depth Spec Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">ARR Contract</span>
                          <p className="text-sm font-black text-emerald-400">
                            ${(client.accountValue / 1000).toFixed(0)}k / yr
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Active AI Bots</span>
                          <p className="text-sm font-black text-cyan-400 flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            {client.activeBotsCount} Assigned
                          </p>
                        </div>
                      </div>

                      {/* Tag Cloud */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {client.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Assigned Agent & Deep Dive CTA */}
                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                      <div className="truncate text-slate-400 text-[11px]">
                        Agent: <strong className="text-slate-200">{client.assignedAgent}</strong>
                      </div>
                      <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Option B: High-Density Table Layout */}
        {viewLayout === "table" && (
          <GlassPanel className="p-0 border-slate-700/80 bg-slate-900/90 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.length === filteredClients.length && selectedClientIds.length > 0}
                        onChange={handleToggleSelectAll}
                        className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Client / Enterprise</th>
                    <th className="p-4">Primary Contact</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">ARR Value</th>
                    <th className="p-4">Health Index</th>
                    <th className="p-4">Lifecycle Status</th>
                    <th className="p-4">Assigned Agent</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    return (
                      <tr
                        key={client.id}
                        onClick={() => setActiveClientDrawer(client)}
                        className={cn(
                          "hover:bg-slate-800/60 transition-colors cursor-pointer",
                          isSelected && "bg-indigo-950/40"
                        )}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectClient(client.id)}
                            className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-cyan-400" />
                          <span>{client.name}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-200">{client.contactName}</p>
                            <p className="text-[11px] text-slate-500">{client.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{client.industry}</td>
                        <td className="p-4 font-black text-emerald-400">
                          ${(client.accountValue / 1000).toFixed(0)}k
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md font-bold text-[11px]",
                            client.healthScore >= 85 ? "bg-emerald-500/20 text-emerald-300" :
                            client.healthScore >= 65 ? "bg-amber-500/20 text-amber-300" :
                            "bg-rose-500/20 text-rose-300"
                          )}>
                            {client.healthScore}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                            client.status === "VIP" ? "bg-amber-500/20 text-amber-300" :
                            client.status === "Active" ? "bg-emerald-500/20 text-emerald-300" :
                            client.status === "Onboarding" ? "bg-cyan-500/20 text-cyan-300" :
                            client.status === "At-Risk" ? "bg-rose-500/20 text-rose-300" :
                            "bg-slate-800 text-slate-300"
                          )}>
                            {client.status}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-300">{client.assignedAgent}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveClientDrawer(client)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* 6. One-Click Integrations Catalog & Health Drawer */}
      <GlassPanel material="glass" depth="mid" className="p-6 border-slate-700/80 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Pre-Configured Enterprise Integration Triggers
            </h3>
            <p className="text-xs text-slate-400">
              One-click synchronization with your CRM, billing webhooks, messaging hubs, and voice dialers.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
            5 of 6 Systems Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INTEGRATIONS_CATALOG.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                onClick={() => {
                  setSelectedIntegration(integration);
                  setIsIntegrationModalOpen(true);
                }}
                className="p-4 bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
                        <Icon className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{integration.name}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{integration.category}</span>
                      </div>
                    </div>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", integration.badgeColor)}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {integration.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{integration.lastSync}</span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1">
                    Manage <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* MODAL 1: Client Profile Progressive Disclosure Drawer */}
      {activeClientDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 p-6 md:p-8 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className={cn(
                  "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                  activeClientDrawer.status === "VIP" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                )}>
                  {activeClientDrawer.status} Account
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{activeClientDrawer.name}</h3>
                <p className="text-xs text-slate-400">{activeClientDrawer.industry} • Managed by {activeClientDrawer.assignedAgent}</p>
              </div>
              <button
                onClick={() => setActiveClientDrawer(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Annual Contract</span>
                <p className="text-lg font-black text-emerald-400">${(activeClientDrawer.accountValue / 1000).toFixed(0)}k</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Health Score</span>
                <p className="text-lg font-black text-cyan-400">{activeClientDrawer.healthScore}%</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Pipeline Velocity</span>
                <p className="text-lg font-black text-indigo-400">+{activeClientDrawer.dealVelocity}%</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Executive Contact Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Contact Name:</span>
                  <p className="font-bold text-white">{activeClientDrawer.contactName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-bold text-cyan-400">{activeClientDrawer.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p className="font-bold text-white">{activeClientDrawer.phone}</p>
                </div>
                <div>
                  <span className="text-slate-500">Last Synced:</span>
                  <p className="font-bold text-slate-300">{new Date(activeClientDrawer.lastInteraction).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* AI Bots & Workflow Deployment */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Provisioned Autonomous AI Agents</h4>
              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Dealflow Meeting Scribe Bot</p>
                      <p className="text-[10px] text-slate-500">Live attendance & automated transcript extraction</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Continuous GTM Web Scraper</p>
                      <p className="text-[10px] text-slate-500">Extracts weekly competitor movements & market signals</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">STANDBY</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  showToast("info", "Voice Dialing Initiated", `Connecting outbound AI line to ${activeClientDrawer.contactName}...`);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Trigger Voice Call
              </button>
              <button
                onClick={() => setActiveClientDrawer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Actions Dialog */}
      {bulkActionType !== "none" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel className="max-w-md w-full p-6 border-indigo-500/50 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {bulkActionType === "status" && "Bulk Change Client Status"}
                {bulkActionType === "tag" && "Bulk Assign Client Tag"}
                {bulkActionType === "email" && "Bulk Personalized Email Outreach"}
              </h3>
              <button onClick={() => setBulkActionType("none")} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {bulkActionType === "status" && (
              <div className="space-y-3">
                <Label className="text-xs text-slate-300">Target Lifecycle Stage for {selectedClientIds.length} Clients:</Label>
                <select
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Active">Active</option>
                  <option value="VIP">VIP (High-Touch Tier)</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Prospect">Prospect</option>
                  <option value="At-Risk">At-Risk (Churn Alert)</option>
                  <option value="Churned">Churned</option>
                </select>
                <ExtrudedButton
                  onClick={executeBulkStatusChange}
                  disabled={isExecutingBulk}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2"
                >
                  {isExecutingBulk ? "Applying Updates..." : `Update ${selectedClientIds.length} Accounts`}
                </ExtrudedButton>
              </div>
            )}

            {bulkActionType === "tag" && (
              <div className="space-y-3">
                <Label className="text-xs text-slate-300">Enter Tag to Assign:</Label>
                <Input
                  value={bulkTagValue}
                  onChange={(e) => setBulkTagValue(e.target.value)}
                  placeholder="e.g. Q4-Expansion, High-Touch, AI-Pilot"
                  className="bg-slate-950 border-slate-700 text-white text-xs"
                />
                <ExtrudedButton
                  onClick={executeBulkTagging}
                  disabled={isExecutingBulk || !bulkTagValue.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2"
                >
                  {isExecutingBulk ? "Assigning Tags..." : `Append Tag to ${selectedClientIds.length} Accounts`}
                </ExtrudedButton>
              </div>
            )}

            {bulkActionType === "email" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-300">Subject Line:</Label>
                  <Input
                    value={bulkEmailSubject}
                    onChange={(e) => setBulkEmailSubject(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Message Body (Supports dynamic tags):</Label>
                  <textarea
                    rows={4}
                    value={bulkEmailBody}
                    onChange={(e) => setBulkEmailBody(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white mt-1 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <ExtrudedButton
                  onClick={executeBulkEmailOutreach}
                  disabled={isExecutingBulk}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2"
                >
                  {isExecutingBulk ? "Dispatching..." : `Send Email to ${selectedClientIds.length} Contacts`}
                </ExtrudedButton>
              </div>
            )}
          </GlassPanel>
        </div>
      )}

      {/* MODAL 3: Audit Log History Drawer */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700 p-6 md:p-8 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                <h3 className="text-xl font-black text-white">Client Governance Audit Trail</h3>
              </div>
              <button onClick={() => setIsAuditDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Immutable historical event records for security compliance, data modifications, exports, and bulk actions.
            </p>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-cyan-400">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900">
                    <span>Operator: <strong className="text-slate-400">{log.operator}</strong></span>
                    <span>Target: <strong className="text-slate-400">{log.target}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsAuditDrawerOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Integration Connection Wizard */}
      {isIntegrationModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel className="max-w-lg w-full p-6 border-indigo-500/50 bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <selectedIntegration.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedIntegration.name} Wizard</h3>
                  <p className="text-xs text-slate-400">{selectedIntegration.category}</p>
                </div>
              </div>
              <button onClick={() => setIsIntegrationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedIntegration.description}
            </p>

            <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <Label className="text-xs text-slate-300">API Connection Key / Webhook Endpoint:</Label>
              <Input
                type="password"
                value={apiConnectionKey}
                onChange={(e) => setApiConnectionKey(e.target.value)}
                placeholder="sk_live_dealflow_enterprise_..."
                className="bg-slate-900 border-slate-700 text-white text-xs"
              />
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTestIntegrationWebhook}
                  disabled={isTestingWebhook}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isTestingWebhook && "animate-spin")} />
                  {isTestingWebhook ? "Verifying..." : "Test Handshake"}
                </button>
                {webhookTestSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Valid Connection
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsIntegrationModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <ExtrudedButton
                onClick={() => {
                  showToast("success", "Integration Updated", `Saved connection configurations for ${selectedIntegration.name}.`);
                  setIsIntegrationModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Save & Activate Sync
              </ExtrudedButton>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* MODAL 5: Advanced Settings & RBAC Policy Center */}
      {isAdvancedSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel className="max-w-xl w-full p-6 border-indigo-500/50 bg-slate-900 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-black text-white">Portal Governance & RBAC Policies</h3>
                  <p className="text-xs text-slate-400">Security configurations, white-label branding, and data export rules</p>
                </div>
              </div>
              <button onClick={() => setIsAdvancedSettingsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {userRole === "viewer" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-200">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>You are currently viewing in Read-Only Viewer mode. Settings cannot be modified without Admin tier permissions.</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Export Rules */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Allow Client Data Exports</p>
                  <p className="text-[11px] text-slate-400">Permit non-admin users to download CSV/JSON client rosters</p>
                </div>
                <input
                  type="checkbox"
                  disabled={userRole === "viewer"}
                  checked={allowClientExports}
                  onChange={(e) => setAllowClientExports(e.target.checked)}
                  className="h-5 w-5 rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                />
              </div>

              {/* 2FA Enforcement */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Enforce 2FA for Financial & ARR Metrics</p>
                  <p className="text-[11px] text-slate-400">Requires hardware biometric or OTP verification before viewing contract ARR</p>
                </div>
                <input
                  type="checkbox"
                  disabled={userRole === "viewer"}
                  checked={require2FAForFinancials}
                  onChange={(e) => setRequire2FAForFinancials(e.target.checked)}
                  className="h-5 w-5 rounded bg-slate-900 border-slate-700 text-indigo-600 cursor-pointer"
                />
              </div>

              {/* White-Label Domain */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Custom White-Label Portal Subdomain</Label>
                <Input
                  disabled={userRole === "viewer"}
                  value={whitelabelDomain}
                  onChange={(e) => setWhitelabelDomain(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white text-xs"
                />
              </div>

              {/* Data Retention */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Audit & Interaction Data Retention Policy</Label>
                <select
                  disabled={userRole === "viewer"}
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value={90}>90 Days (GDPR Standard)</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>365 Days (Enterprise Standard)</option>
                  <option value={730}>730 Days (Extended Audit)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAdvancedSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <ExtrudedButton
                disabled={userRole === "viewer"}
                onClick={() => {
                  showToast("success", "Settings Saved", "RBAC governance policies and domain routing updated.");
                  setIsAdvancedSettingsModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Apply Policies
              </ExtrudedButton>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* MODAL 6: Interactive Guided Feature Tour */}
      {isOnboardingTourOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel className="max-w-lg w-full p-6 border-indigo-500/50 bg-slate-900 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Client Management Portal Tour (Step {tourStep} of 4)</h3>
              </div>
              <button onClick={() => setIsOnboardingTourOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {tourStep === 1 && (
              <div className="space-y-3">
                <div className="h-32 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <BarChart2 className="h-12 w-12" />
                </div>
                <h4 className="font-bold text-sm text-white">1. Customizable 3D Metric Widgets</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pin, unpin, and resize high-priority metrics like Portfolio ARR, Active Dealflow Bots, and Client Health Indexes. All custom layouts persist automatically in your browser and sync across sessions.
                </p>
              </div>
            )}

            {tourStep === 2 && (
              <div className="space-y-3">
                <div className="h-32 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                  <SlidersHorizontal className="h-12 w-12" />
                </div>
                <h4 className="font-bold text-sm text-white">2. Multi-Parameter Segment Filters & Presets</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Isolate accounts by ARR value, industry vertical, or churn vulnerability in one click. Save custom segments into quick-access preset chips to streamline team operations.
                </p>
              </div>
            )}

            {tourStep === 3 && (
              <div className="space-y-3">
                <div className="h-32 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Layers className="h-12 w-12" />
                </div>
                <h4 className="font-bold text-sm text-white">3. Batch Management & Immutable Audit Trail</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Select multiple client accounts to trigger mass lifecycle updates, tag allocations, or personalized email outreach. Every single operation is cryptographically logged in the Audit Trail.
                </p>
              </div>
            )}

            {tourStep === 4 && (
              <div className="space-y-3">
                <div className="h-32 rounded-xl bg-gradient-to-br from-violet-950 to-slate-900 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <h4 className="font-bold text-sm text-white">4. Enterprise RBAC & 1-Click Integrations</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Protect sensitive data exports with role-based policies. Connect seamlessly with Salesforce, HubSpot, Stripe, and Twilio using built-in handshake verification wizards.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setTourStep(prev => Math.max(1, prev - 1))}
                disabled={tourStep === 1}
                className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
              >
                Previous
              </button>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(s => (
                  <span
                    key={s}
                    className={cn("h-2 w-2 rounded-full", s === tourStep ? "bg-cyan-400" : "bg-slate-700")}
                  />
                ))}
              </div>

              {tourStep < 4 ? (
                <button
                  onClick={() => setTourStep(prev => Math.min(4, prev + 1))}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOnboardingTourOpen(false);
                    showToast("success", "Tour Complete", "You are ready to manage your client accounts!");
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Get Started
                </button>
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Bulk CSV & Spreadsheet Ingestion Modal */}
      {isBulkProcessorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
                Bulk Lead & Client Ingestion Hub
              </span>
              <button
                onClick={() => setIsBulkProcessorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <BulkDataProcessorHub
              defaultProcessorType="leads"
              onComplete={(results) => {
                showToast("success", "Bulk Import Complete", `Processed and appended ${results.length} records!`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
