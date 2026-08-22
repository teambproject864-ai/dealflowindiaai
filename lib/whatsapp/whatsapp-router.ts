// lib/whatsapp/whatsapp-router.ts
import { 
  sendWhatsAppMessage as sendEvolutionMessage, 
  WhatsAppMessagePayload as EvolutionPayload,
  checkWhatsAppRateLimit as checkEvolutionRateLimit
} from "./evolution-whatsapp-client";
import { 
  sendOpenWAMessage, 
  OpenWAMessagePayload,
  checkOpenWARateLimit,
  initializeOpenWASession,
  confirmOpenWAConnection,
  disconnectOpenWASession,
  getOpenWAHistory
} from "./openwa-whatsapp-client";

export type WhatsAppGatewayProvider = "evolution" | "openwa" | "auto";

export interface UnifiedWhatsAppSendParams {
  toPhone: string;
  content: string;
  senderRole: "customer" | "agent" | "admin" | "system";
  senderId?: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "audio" | "video";
  triggerType?: "manual_chat" | "meeting_confirmation" | "meeting_reminder" | "deal_status_update" | "mom_dispatch" | "onboarding";
  preferredGateway?: WhatsAppGatewayProvider;
}

export interface UnifiedWhatsAppResult {
  success: boolean;
  gatewayUsed: "evolution" | "openwa";
  messageId: string;
  status: string;
  encryptedHash: string;
  fallbackOccurred: boolean;
  error?: string;
}

/**
 * Dispatches a WhatsApp message through the selected or auto-failing gateway.
 */
export async function sendUnifiedWhatsAppMessage(
  params: UnifiedWhatsAppSendParams
): Promise<UnifiedWhatsAppResult> {
  const preferred = params.preferredGateway || (process.env.DEFAULT_WHATSAPP_GATEWAY as WhatsAppGatewayProvider) || "auto";

  // If OpenWA is explicitly requested
  if (preferred === "openwa") {
    const openwaRes = await sendOpenWAMessage({
      toPhone: params.toPhone,
      content: params.content,
      senderRole: params.senderRole,
      senderId: params.senderId,
      senderName: params.senderName,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      triggerType: params.triggerType,
    });

    if (openwaRes.success) {
      return {
        success: true,
        gatewayUsed: "openwa",
        messageId: openwaRes.message.messageId,
        status: openwaRes.message.status,
        encryptedHash: openwaRes.message.encryptedHash,
        fallbackOccurred: false,
      };
    }

    // Fallback to Evolution API
    console.warn(`[WhatsAppRouter] OpenWA dispatch failed (${openwaRes.error}), falling back to Evolution API.`);
    const evoRes = await sendEvolutionMessage({
      toPhone: params.toPhone,
      content: params.content,
      senderRole: params.senderRole,
      senderId: params.senderId,
      senderName: params.senderName,
      triggerType: params.triggerType,
    });

    return {
      success: evoRes.success,
      gatewayUsed: "evolution",
      messageId: evoRes.message?.messageId || "unknown",
      status: evoRes.message?.status || "failed",
      encryptedHash: evoRes.message?.encryptedHash || "",
      fallbackOccurred: true,
      error: evoRes.error,
    };
  }

  // If Evolution is explicitly requested or Auto with Evolution primary
  const evoRes = await sendEvolutionMessage({
    toPhone: params.toPhone,
    content: params.content,
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName,
    triggerType: params.triggerType,
  });

  if (evoRes.success) {
    return {
      success: true,
      gatewayUsed: "evolution",
      messageId: evoRes.message.messageId,
      status: evoRes.message.status,
      encryptedHash: evoRes.message.encryptedHash,
      fallbackOccurred: false,
    };
  }

  // Automatic Failover to OpenWA
  console.warn(`[WhatsAppRouter] Primary Evolution dispatch failed (${evoRes.error}), falling back to OpenWA.`);
  const openwaRes = await sendOpenWAMessage({
    toPhone: params.toPhone,
    content: params.content,
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName,
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType,
    triggerType: params.triggerType,
  });

  return {
    success: openwaRes.success,
    gatewayUsed: "openwa",
    messageId: openwaRes.message?.messageId || "unknown",
    status: openwaRes.message?.status || "failed",
    encryptedHash: openwaRes.message?.encryptedHash || "",
    fallbackOccurred: true,
    error: openwaRes.error,
  };
}

export {
  initializeOpenWASession,
  confirmOpenWAConnection,
  disconnectOpenWASession,
  getOpenWAHistory
};
