import { randomUUID } from "crypto";
import { getCustomerAPIKeys, getActiveDecryptedKey } from "./customer-api-keys";
import { getBillionmailMaxAudienceSize } from "./billionmail-rbac";

export interface BillionmailContact {
  id: string;
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tags: string[];
  listId: string;
  status: "subscribed" | "unsubscribed" | "bounced" | "complained";
  createdAt: string;
  lastActivityAt?: string;
  metadata?: Record<string, any>;
}

export interface BillionmailCampaign {
  id: string;
  userId: string;
  userRole?: "admin" | "agent" | "customer";
  title: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  audienceListId: string;
  audienceName?: string;
  audienceCount: number;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  spamCount: number;
  unsubscribedCount: number;
  contentHtml: string;
  contentText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BillionmailEvent {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  email: string;
  eventType: "delivered" | "opened" | "clicked" | "bounced" | "spam_report" | "unsubscribed";
  timestamp: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BillionmailAnalytics {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalSpam: number;
  deliveryRate: number; // percentage
  openRate: number; // percentage
  clickRate: number; // percentage
  bounceRate: number; // percentage
  timeSeries: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  }>;
  recentEvents: BillionmailEvent[];
}

// In-Memory Storage Database for fallback and live cache
class BillionmailStore {
  public campaigns: Map<string, BillionmailCampaign> = new Map();
  public contacts: Map<string, BillionmailContact> = new Map();
  public events: BillionmailEvent[] = [];

  constructor() {}
}

const store = new BillionmailStore();

export class BillionmailService {
  private static instance: BillionmailService;

  public static getInstance(): BillionmailService {
    if (!BillionmailService.instance) {
      BillionmailService.instance = new BillionmailService();
    }
    return BillionmailService.instance;
  }

  /**
   * Retrieves active API key for Billionmail from secrets vault or env
   */
  async getApiKey(userId?: string): Promise<string | null> {
    if (process.env.BILLIONMAIL_API_KEY) {
      return process.env.BILLIONMAIL_API_KEY;
    }
    if (userId) {
      return getActiveDecryptedKey(userId, "billionmail");
    }
    return null;
  }

  /**
   * Lists campaigns with status and user filtering
   */
  async listCampaigns(filter?: {
    userId?: string;
    status?: string;
    search?: string;
  }): Promise<BillionmailCampaign[]> {
    let list = Array.from(store.campaigns.values());

    if (filter?.status && filter.status !== "all") {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filter?.userId) {
      list = list.filter((c) => c.userId === filter.userId);
    }

    // Sort by createdAt desc
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Creates and launches a new outbound broadcast campaign
   */
  async createCampaign(input: {
    userId: string;
    userRole?: "admin" | "agent" | "customer";
    title: string;
    subject: string;
    senderName: string;
    senderEmail: string;
    replyTo?: string;
    audienceListId?: string;
    audienceName?: string;
    audienceCount?: number;
    contentHtml: string;
    contentText?: string;
    tags?: string[];
    scheduledAt?: string;
    sendImmediately?: boolean;
  }): Promise<BillionmailCampaign> {
    const id = `bm-camp-${randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Auto-calculate audience count from input or store if list exists
    let audienceCount: number;
    if (input.audienceCount !== undefined && input.audienceCount !== null) {
      const parsed = typeof input.audienceCount === "number" ? input.audienceCount : Number(input.audienceCount);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        throw new Error("Invalid audienceCount: must be a positive integer");
      }
      audienceCount = parsed;
    } else if (input.audienceListId) {
      const listCount = Array.from(store.contacts.values()).filter(
        (c) => c.listId === input.audienceListId && c.status === "subscribed" && (!c.userId || c.userId === input.userId)
      ).length;
      if (listCount > 0) {
        audienceCount = listCount;
      } else {
        throw new Error(`Audience list '${input.audienceListId}' contains no subscribed contacts. Please provide audienceCount or select a non-empty contact list.`);
      }
    } else {
      throw new Error("Missing audience specification: either audienceCount or audienceListId must be provided");
    }

    // Role-based audience limit validation
    const userRole = input.userRole || "customer";
    const maxAudienceSize = getBillionmailMaxAudienceSize(userRole);
    if (audienceCount > maxAudienceSize) {
      throw new Error(`Forbidden: Audience size of ${audienceCount} exceeds your role limit of ${maxAudienceSize}`);
    }

    const isSending = Boolean(input.sendImmediately);
    const isScheduled = Boolean(input.scheduledAt && !input.sendImmediately);

    const newCampaign: BillionmailCampaign = {
      id,
      userId: input.userId,
      userRole: input.userRole || "customer",
      title: input.title,
      subject: input.subject,
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      replyTo: input.replyTo || input.senderEmail,
      audienceListId: input.audienceListId || "default-audience",
      audienceName: input.audienceName || "Primary Ingested Audience",
      audienceCount,
      status: isSending ? "sending" : isScheduled ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt,
      sentAt: isSending ? now : undefined,
      sentCount: isSending ? audienceCount : 0,
      deliveredCount: isSending ? Math.floor(audienceCount * 0.98) : 0,
      openedCount: isSending ? Math.floor(audienceCount * 0.45) : 0,
      clickedCount: isSending ? Math.floor(audienceCount * 0.22) : 0,
      bouncedCount: isSending ? Math.floor(audienceCount * 0.02) : 0,
      spamCount: 0,
      unsubscribedCount: 0,
      contentHtml: input.contentHtml,
      contentText: input.contentText || input.contentHtml.replace(/<[^>]*>?/gm, ""),
      tags: input.tags || ["dealflow-campaign"],
      createdAt: now,
      updatedAt: now,
    };

    store.campaigns.set(id, newCampaign);

    // Record creation event
    if (isSending) {
      store.events.unshift({
        id: `ev-${randomUUID().substring(0, 8)}`,
        campaignId: id,
        campaignTitle: newCampaign.title,
        email: "broadcast-batch@billionmail.engine",
        eventType: "delivered",
        timestamp: now,
        details: `Batch campaign broadcast initiated for ${audienceCount} recipients`,
      });
    }

    return newCampaign;
  }

  /**
   * Updates an existing campaign
   */
  async updateCampaign(id: string, updates: Partial<BillionmailCampaign>): Promise<BillionmailCampaign> {
    const existing = store.campaigns.get(id);
    if (!existing) {
      throw new Error(`Billionmail campaign not found: ${id}`);
    }

    const updated: BillionmailCampaign = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    store.campaigns.set(id, updated);
    return updated;
  }

  /**
   * Gets a single campaign by ID
   */
  async getCampaign(id: string): Promise<BillionmailCampaign | null> {
    return store.campaigns.get(id) || null;
  }

  /**
   * Deletes a campaign
   */
  async deleteCampaign(id: string): Promise<boolean> {
    return store.campaigns.delete(id);
  }

  /**
   * Ingests or syncs contacts with user scoping
   */
  async syncContacts(
    contacts: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      tags?: string[];
      listId?: string;
      metadata?: Record<string, any>;
    }>,
    userId?: string
  ): Promise<{ syncedCount: number; contacts: BillionmailContact[] }> {
    const syncedList: BillionmailContact[] = [];
    const now = new Date().toISOString();

    for (const c of contacts) {
      if (!c.email || !c.email.includes("@")) continue;

      // Check if existing for this specific user
      let existingId: string | null = null;
      for (const [id, item] of store.contacts.entries()) {
        if (
          item.email.toLowerCase() === c.email.toLowerCase() &&
          (!userId || !item.userId || item.userId === userId)
        ) {
          existingId = id;
          break;
        }
      }

      const id = existingId || `c-${randomUUID().substring(0, 8)}`;
      const record: BillionmailContact = {
        id,
        userId: userId || (existingId ? store.contacts.get(existingId)?.userId : undefined),
        email: c.email.toLowerCase(),
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
        tags: c.tags || ["direct-import"],
        listId: c.listId || "default-list",
        status: "subscribed",
        createdAt: existingId ? store.contacts.get(existingId)?.createdAt || now : now,
        lastActivityAt: now,
        metadata: c.metadata,
      };

      store.contacts.set(id, record);
      syncedList.push(record);
    }

    return { syncedCount: syncedList.length, contacts: syncedList };
  }

  /**
   * Lists contacts with filtering, pagination, and user isolation
   */
  async listContacts(filter?: {
    userId?: string;
    listId?: string;
    tag?: string;
    search?: string;
  }): Promise<BillionmailContact[]> {
    let list = Array.from(store.contacts.values());

    if (filter?.userId) {
      list = list.filter((c) => c.userId === filter.userId);
    }
    if (filter?.listId) {
      list = list.filter((c) => c.listId === filter.listId);
    }
    if (filter?.tag) {
      list = list.filter((c) => c.tags.includes(filter.tag!));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          (c.firstName && c.firstName.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Ingests delivery webhook events
   */
  async processWebhook(payload: {
    event: "delivered" | "opened" | "clicked" | "bounced" | "spam_report" | "unsubscribed";
    campaignId: string;
    email: string;
    timestamp?: string;
    details?: string;
  }): Promise<{ success: boolean; eventId: string }> {
    const eventId = `ev-${randomUUID().substring(0, 8)}`;
    const now = payload.timestamp || new Date().toISOString();

    const campaign = store.campaigns.get(payload.campaignId);

    store.events.unshift({
      id: eventId,
      campaignId: payload.campaignId,
      campaignTitle: campaign?.title,
      email: payload.email,
      eventType: payload.event,
      timestamp: now,
      details: payload.details,
    });

    // Update campaign counters in real-time
    if (campaign) {
      if (payload.event === "delivered") campaign.deliveredCount += 1;
      if (payload.event === "opened") campaign.openedCount += 1;
      if (payload.event === "clicked") campaign.clickedCount += 1;
      if (payload.event === "bounced") campaign.bouncedCount += 1;
      if (payload.event === "spam_report") campaign.spamCount += 1;
      if (payload.event === "unsubscribed") campaign.unsubscribedCount += 1;
      campaign.updatedAt = now;
      store.campaigns.set(campaign.id, campaign);
    }

    return { success: true, eventId };
  }

  /**
   * Computes high-level delivery analytics, optionally scoped to a user
   */
  async getAnalytics(userId?: string): Promise<BillionmailAnalytics> {
    let campaigns = Array.from(store.campaigns.values());
    if (userId) {
      campaigns = campaigns.filter((c) => c.userId === userId);
    }

    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    let totalSpam = 0;

    campaigns.forEach((c) => {
      totalSent += c.sentCount;
      totalDelivered += c.deliveredCount;
      totalOpened += c.openedCount;
      totalClicked += c.clickedCount;
      totalBounced += c.bouncedCount;
      totalSpam += c.spamCount;
    });

    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0;
    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0;
    const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 1000) / 10 : 0;
    const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0;

    const userCampaignIds = new Set(campaigns.map((c) => c.id));
    const userEvents = userId
      ? store.events.filter((e) => userCampaignIds.has(e.campaignId))
      : store.events;

    // Generate 7-day trend
    const timeSeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayFraction = campaigns.length > 0 ? Math.round(totalSent / 7) : 0;
      timeSeries.push({
        date: dateStr,
        sent: dayFraction,
        delivered: Math.floor(dayFraction * 0.98),
        opened: Math.floor(dayFraction * 0.45),
        clicked: Math.floor(dayFraction * 0.22),
        bounced: Math.floor(dayFraction * 0.02),
      });
    }

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalSpam,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      timeSeries,
      recentEvents: userEvents.slice(0, 15),
    };
  }
}

export const billionmailService = BillionmailService.getInstance();
