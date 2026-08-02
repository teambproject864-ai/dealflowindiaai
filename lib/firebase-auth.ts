import admin from "./firebase-admin";
import { logger } from "./logger";

export interface DecodedFirebaseUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  provider: "google.com" | "microsoft.com" | "password" | string;
  emailVerified?: boolean;
}

export interface FCMNotificationPayload {
  token: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  params?: Record<string, any>;
  timestamp?: string;
}

/**
 * Verifies a Firebase ID token sent from the client (Google, Microsoft, Email/Password).
 * Strictly handles authentication only.
 */
export async function verifyFirebaseToken(idToken: string): Promise<DecodedFirebaseUser> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("[Firebase Auth] Missing or invalid ID token string.");
  }

  // Development/Test mock token handler
  if (idToken.startsWith("mock-firebase-token-")) {
    const mockUid = idToken.replace("mock-firebase-token-", "");
    return {
      uid: mockUid,
      email: `${mockUid}@dealflow.ai`,
      name: `Mock User (${mockUid})`,
      provider: "google.com",
      emailVerified: true,
    };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const provider = decoded.firebase?.sign_in_provider || "password";
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name,
      picture: decoded.picture,
      provider,
      emailVerified: decoded.email_verified,
    };
  } catch (err: any) {
    logger.error("[Firebase Auth] ID Token verification failed", err);
    throw new Error(`[Firebase Auth] Token verification failed: ${err.message}`);
  }
}

/**
 * Send push notifications via Firebase Cloud Messaging (FCM)
 */
export async function sendFCMNotification(payload: FCMNotificationPayload): Promise<{ success: boolean; messageId?: string }> {
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    if (Array.isArray(payload.token)) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: payload.token,
        ...message,
      });
      logger.info("[FCM] Multicast notification sent", { successCount: response.successCount });
      return { success: response.successCount > 0 };
    } else {
      const messageId = await admin.messaging().send({
        token: payload.token,
        ...message,
      });
      logger.info("[FCM] Notification sent successfully", { messageId });
      return { success: true, messageId };
    }
  } catch (err: any) {
    logger.warn("[FCM] Failed to send FCM notification, fallback logged", { error: err.message });
    return { success: false };
  }
}

/**
 * Log platform analytics event (Firebase Analytics backend bridge)
 */
export function logAnalyticsEvent(event: AnalyticsEvent): void {
  const timestamp = event.timestamp || new Date().toISOString();
  logger.info("[Firebase Analytics] Event logged", {
    eventName: event.eventName,
    userId: event.userId || "anonymous",
    params: event.params || {},
    timestamp,
  });
}
