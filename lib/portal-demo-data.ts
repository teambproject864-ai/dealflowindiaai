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

// Clean schema exports with zero hardcoded sample records
export const demoUsers: PortalUser[] = [];
export const demoTasks: Task[] = [];
export const demoChatMessages: ChatMessage[] = [];
export const demoCalls: PortalCallRecord[] = [];
export const demoFeedback: CustomerFeedback[] = [];
export const demoAgentPerformance: Record<string, AgentPerformanceMetrics> = {};
export const demoAgentCredits: Record<string, AgentCredits> = {};
export const demoCustomerCredits: Record<string, CustomerCredits> = {};
export const demoRequirements: Requirement[] = [];
export const demoGTMReportMetrics: GTMReportMetric[] = [];
export const demoCustomerGTMData: CustomerGTMData[] = [];
export const demoScheduledReports: ScheduledReport[] = [];
export const demoTickets: Ticket[] = [];
export const demoNotificationPreferences: NotificationPreferences = {
  email: true,
  sms: false,
  push: true,
};
export const demoCustomers: Customer[] = [];
export const demoB2BBulkOrders: B2BBulkOrder[] = [];
export const demoB2CTransactions: B2CTransaction[] = [];
export const demoD2CBrandingConfigs: Record<string, D2CBrandingConfig> = {};
export const demoCustomerResignations: CustomerResignation[] = [];
export const demoDocuments: Document[] = [];
export const demoAuditLogs: AuditLogEntry[] = [];
