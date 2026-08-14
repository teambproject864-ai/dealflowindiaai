// lib/community-mining/router.ts

import { db } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/notifications";
import type {
  CMTheme,
  CMRoutingRule,
  CMNotification,
  CMSeverity,
} from "@/types/community-mining";

/**
 * Checks whether a theme matches a routing rule's keywords or categories.
 */
export function matchesRoutingRule(theme: CMTheme, rule: CMRoutingRule): boolean {
  if (!rule.enabled) return false;

  // 1. Severity filter check
  if (rule.minSeverity) {
    const severityRank: Record<CMSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    if (severityRank[theme.severity] < severityRank[rule.minSeverity]) {
      return false;
    }
  }

  // 2. Threshold check
  if (rule.alertOnThemeThreshold && theme.itemCount < rule.alertOnThemeThreshold) {
    return false;
  }

  const themeText = `${theme.label} ${theme.description} ${theme.topEntities.join(" ")}`.toLowerCase();

  // 3. Keyword match check
  const hasKeywordMatch = rule.keywords.some((kw) =>
    themeText.includes(kw.trim().toLowerCase())
  );

  // 4. Category / Team match check
  const hasCategoryMatch = rule.categories.some(
    (cat) =>
      themeText.includes(cat.trim().toLowerCase()) ||
      theme.assignedTeam.toLowerCase() === cat.trim().toLowerCase()
  );

  return (
    (rule.keywords.length === 0 || hasKeywordMatch) &&
    (rule.categories.length === 0 || hasCategoryMatch)
  );
}

/**
 * Dispatches a notification payload to Slack, Email, or generic Webhook.
 */
export async function dispatchNotification(
  notification: CMNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    if (notification.destinationType === "slack" || notification.destinationType === "webhook") {
      // Dispatch Slack / Webhook
      if (notification.destination.startsWith("http")) {
        const slackPayload = {
          text: `🚨 *[DealFlow AI Community Alert]* New Theme Detected: *${notification.themeLabel}*`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🚨 Community Insight Alert: ${notification.themeLabel}`,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Severity:* \`${notification.severity.toUpperCase()}\`` },
                { type: "mrkdwn", text: `*Channel:* ${notification.destinationType}` },
              ],
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Summary:*\n${notification.summary}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Sample Quotes:*\n${notification.sampleQuotes.map((q) => `> "${q}"`).join("\n")}`,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "View Theme in Agent Portal" },
                  url: notification.deepLink,
                  style: "primary",
                },
              ],
            },
          ],
        };

        const res = await fetch(notification.destination, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });

        if (!res.ok) {
          throw new Error(`Webhook responded with status ${res.status}: ${res.statusText}`);
        }
      }
    } else if (notification.destinationType === "email") {
      // Dispatch Email via existing DealFlow notification service
      const subject = `[DealFlow AI Alert] High-Priority Theme: ${notification.themeLabel} (${notification.severity.toUpperCase()})`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #334155; border-radius: 12px; overflow: hidden; background-color: #0f172a; color: #f8fafc;">
          <div style="background-color: #6366f1; padding: 20px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Community Mining Alert</h2>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Severity: ${notification.severity.toUpperCase()}</p>
          </div>
          <div style="padding: 24px;">
            <h3 style="font-size: 18px; color: #38bdf8; margin-top: 0;">${notification.themeLabel}</h3>
            <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">${notification.summary}</p>
            <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Sample Customer Feedback:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px;">
                ${notification.sampleQuotes.map((q) => `<li style="margin-bottom: 6px;"><em>"${q}"</em></li>`).join("")}
              </ul>
            </div>
            <div style="margin-top: 24px;">
              <a href="${notification.deepLink}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Open in Agent Portal →
              </a>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: notification.destination,
        subject,
        body: html,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error(`[CommunityMining:Router] Dispatch error to ${notification.destination}:`, err?.message || err);
    return { success: false, error: err?.message || "Dispatch failed" };
  }
}

/**
 * Evaluates themes against active routing rules and triggers notifications.
 */
export async function evaluateAndRouteThemes(
  themes: CMTheme[],
  baseUrl = "https://dealflow.ai"
): Promise<{ dispatched: number; notifications: CMNotification[] }> {
  let rules: CMRoutingRule[] = [];

  if (db) {
    try {
      const snap = await db.collection("cm_routing_rules").where("enabled", "==", true).get();
      rules = snap.docs.map((d) => d.data() as CMRoutingRule);
    } catch (err) {
      console.warn("[CommunityMining:Router] Firestore rules read error:", err);
    }
  }

  // If no rules in DB, provide default fallback rules
  if (rules.length === 0) {
    rules = [
      {
        id: "default_critical_rule",
        name: "Critical / Churn Escalations",
        keywords: ["churn", "cancel", "broken", "crash"],
        categories: ["cs", "product"],
        assignedTeam: "cs",
        destinationChannel: "email",
        destinationTarget: "praneethb1909@gmail.com",
        minSeverity: "high",
        enabled: true,
        alertOnThemeThreshold: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const notifications: CMNotification[] = [];
  const now = new Date().toISOString();

  for (const theme of themes) {
    for (const rule of rules) {
      if (matchesRoutingRule(theme, rule)) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const deepLink = `${baseUrl}/agent-portal/community-mining?themeId=${encodeURIComponent(theme.id)}`;

        const notification: CMNotification = {
          id: notifId,
          ruleId: rule.id,
          themeId: theme.id,
          themeLabel: theme.label,
          summary: theme.description,
          severity: theme.severity,
          destinationType: rule.destinationChannel,
          destination: rule.destinationTarget,
          sampleQuotes: theme.sampleQuotes.slice(0, 3),
          deepLink,
          status: "pending",
          createdAt: now,
        };

        // Dispatch notification
        const res = await dispatchNotification(notification);
        notification.status = res.success ? "sent" : "failed";
        notification.sentAt = res.success ? new Date().toISOString() : undefined;
        notification.errorMessage = res.error;

        notifications.push(notification);

        // Write to cm_notifications in Firestore
        if (db) {
          try {
            await db.collection("cm_notifications").doc(notifId).set(notification);
          } catch (notifErr) {
            console.error("[CommunityMining:Router] Error writing notification to DB:", notifErr);
          }
        }
      }
    }
  }

  return {
    dispatched: notifications.filter((n) => n.status === "sent").length,
    notifications,
  };
}
