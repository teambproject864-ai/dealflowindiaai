// lib/email/email-types.ts

export type EmailStatus = "unread" | "read" | "flagged" | "archived";
export type EmailFolder = "inbox" | "sent" | "drafts" | "archived" | "trash";
export type EmailActionType = "open" | "reply" | "forward" | "delete" | "archive" | "flag" | "mark_unread";
export type EmailProviderProtocol = "imap_smtp" | "gmail_api" | "graph_api";

export interface EmailAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
}

export interface PortalEmail {
  id: string;
  threadId: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  status: EmailStatus;
  folder: EmailFolder;
  ticketId?: string;
  customerId?: string;
  isEncrypted: boolean;
  encryptionTag?: string;
  encryptionIV?: string;
  complianceLabels: ("GDPR" | "CCPA" | "HIPAA" | "INTERNAL")[];
  attachments?: EmailAttachment[];
  timestamp: string;
  syncedWithServer: boolean;
  serverMessageId?: string;
  inReplyTo?: string;
}

export interface EmailFilterOptions {
  status?: EmailStatus | "all";
  folder?: EmailFolder | "all";
  sender?: string;
  customerId?: string;
  ticketId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface ComposeEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  threadId?: string;
  inReplyTo?: string;
  ticketId?: string;
  customerId?: string;
  actionType?: "compose" | "reply" | "forward";
  attachments?: EmailAttachment[];
}

export interface EmailAuditTrailEntry {
  id: string;
  emailId: string;
  agentId: string;
  action: EmailActionType;
  timestamp: string;
  ipHash: string;
  complianceHash: string;
  details?: Record<string, any>;
}

export interface RealtimeEmailAlert {
  id: string;
  emailId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  preview: string;
  ticketId?: string;
  timestamp: string;
}
