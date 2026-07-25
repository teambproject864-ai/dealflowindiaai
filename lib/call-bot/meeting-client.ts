// lib/call-bot/meeting-client.ts

const RECALL_REGION_DEFAULT = "us-east-1";

export interface BotMetadata {
  callId?: string;
  callType?: string;
  intakeFormId?: string;
  personaName?: string;
  [key: string]: any;
}

export interface BotResponse {
  id: string;
  status?: string;
  meeting_url?: string;
  bot_name?: string;
  [key: string]: any;
}

/**
 * Validates existence of RECALL_API_KEY.
 * Fails loudly with log & console.error if missing.
 */
function getRecallApiKey(): string {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) {
    const errorMsg = "[CallBot:MeetingClient] CRITICAL ERROR: RECALL_API_KEY environment variable is missing!";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return apiKey;
}

function getRecallBaseUrl(): string {
  const region = process.env.RECALL_REGION || RECALL_REGION_DEFAULT;
  return `https://${region}.recall.ai`;
}

function getRecallAuthHeader(): Record<string, string> {
  const apiKey = getRecallApiKey();
  return { Authorization: `Token ${apiKey}` };
}

/**
 * Retries an asynchronous operation once on failure before rethrowing.
 */
async function retryOnce<T>(operation: () => Promise<T>, opName: string): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    console.warn(`[CallBot:MeetingClient] ${opName} failed on first attempt (${err?.message || err}). Retrying once...`);
    try {
      return await operation();
    } catch (retryErr: any) {
      console.error(`[CallBot:MeetingClient] ${opName} failed on retry attempt (${retryErr?.message || retryErr}).`);
      throw retryErr;
    }
  }
}

/**
 * Creates a Recall.ai meeting bot and dispatches it to join the specified meeting URL.
 */
export async function createBot(meetingUrl: string, metadata: BotMetadata = {}): Promise<BotResponse> {
  const baseUrl = getRecallBaseUrl();
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const webhookUrl = `${appUrl}/api/call-bot/webhook`;
  const botName = metadata.personaName 
    ? `${metadata.personaName} (AI) | Dealflow.ai` 
    : "DealFlow AI Live Assistant";

  const payload = {
    meeting_url: meetingUrl,
    bot_name: botName,
    transcription_options: {
      provider: "deepgram",
      language: "en"
    },
    recording_mode: "speaker_view",
    real_time_transcription: {
      enabled: true
    },
    automatic_audio_output: {
      in_call_recording: {
        data: { kind: "mp3" }
      }
    },
    webhook_url: webhookUrl,
    metadata: {
      callId: metadata.callId || "",
      callType: metadata.callType || "discovery",
      intakeFormId: metadata.intakeFormId || "",
      ...metadata
    }
  };

  return retryOnce(async () => {
    const res = await fetch(`${baseUrl}/api/v1/bot/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRecallAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Recall API createBot failed [${res.status} ${res.statusText}]: ${errorText}`);
    }

    const data = await res.json();
    const botId = data?.id || data?.bot_id || data?.botId || data?.uuid;
    if (!botId) {
      throw new Error(`Recall API response missing bot ID: ${JSON.stringify(data)}`);
    }

    return { ...data, id: botId };
  }, `createBot(${meetingUrl})`);
}

/**
 * Fetches current bot status from Recall.ai.
 */
export async function getBotStatus(botId: string): Promise<BotResponse> {
  if (!botId) throw new Error("[CallBot:MeetingClient] getBotStatus requires botId");
  const baseUrl = getRecallBaseUrl();

  return retryOnce(async () => {
    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/`, {
      method: "GET",
      headers: getRecallAuthHeader()
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Recall API getBotStatus failed for ${botId} [${res.status} ${res.statusText}]: ${errorText}`);
    }

    return res.json();
  }, `getBotStatus(${botId})`);
}

/**
 * Signals the Recall.ai bot to leave the meeting call.
 */
export async function endBot(botId: string): Promise<{ success: boolean; data?: any }> {
  if (!botId) throw new Error("[CallBot:MeetingClient] endBot requires botId");
  const baseUrl = getRecallBaseUrl();

  return retryOnce(async () => {
    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/leave_call/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRecallAuthHeader()
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Recall API endBot failed for ${botId} [${res.status} ${res.statusText}]: ${errorText}`);
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  }, `endBot(${botId})`);
}

/**
 * Inject audio stream / buffer back into the Recall.ai bot output channel.
 */
export async function sendAudioToBot(botId: string, audioBuffer: Buffer): Promise<{ success: boolean; data?: any }> {
  if (!botId) throw new Error("[CallBot:MeetingClient] sendAudioToBot requires botId");
  const baseUrl = getRecallBaseUrl();

  return retryOnce(async () => {
    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/output_audio/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRecallAuthHeader()
      },
      body: JSON.stringify({
        kind: "mp3",
        b64_data: audioBuffer.toString("base64")
      })
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Recall API sendAudioToBot failed for ${botId} [${res.status} ${res.statusText}]: ${errorText}`);
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  }, `sendAudioToBot(${botId})`);
}
