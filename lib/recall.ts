// lib/recall.ts
// NOTE:
// The original version used a Recall SDK package that isn't installed in this repo.
// To make the meeting bot actually join the call, we call Recall's REST API directly.

const RECALL_REGION_DEFAULT = "ap-northeast-1";

function getRecallBaseUrl(regionOverride?: string) {
  const region = regionOverride || process.env.RECALL_REGION || RECALL_REGION_DEFAULT;
  return `https://${region}.recall.ai`;
}

function getRecallAuthHeader() {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) throw new Error("RECALL_API_KEY is missing");
  return { Authorization: `Token ${apiKey}` };
}

export async function createMeetingBot(
  meetingUrl: string,
  personaName: string,
  callId: string,
  joinAtIso?: string
) {
  const baseUrl = getRecallBaseUrl();
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://dealsflowai.vercel.app";
  const secret = process.env.RECALL_WEBHOOK_SECRET?.trim();
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/meeting/webhook`;
  const workerUrl = process.env.SCREEN_SHARE_WORKER_URL || appUrl;

  const payload: Record<string, any> = {
    meeting_url: meetingUrl,
    bot_name: `${personaName} (AI) | Dealflow.ai`,
    recording_config: {
      transcript: {
        provider: {
          recallai_streaming: {
            mode: "prioritize_low_latency",
            language_code: "en",
          },
        },
      },
      realtime_endpoints: [
        {
          type: "webhook",
          url: webhookUrl,
          ...(secret ? {
            headers: {
              "Authorization": `Token ${secret}`,
              "X-Webhook-Secret": secret,
            },
          } : {}),
          events: ["transcript.data", "participant_events.chat_message"],
        },
      ],
    },
    ...(joinAtIso ? { join_at: joinAtIso } : {}),
  };

  const res = await fetch(`${baseUrl}/api/v1/bot/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getRecallAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Recall bot.create failed: ${res.status} ${res.statusText} ${text}`);
  }

  const data = await res.json();

  // The webhook identifies the bot with `bot_id`; in most responses it's `id`.
  // Keep a robust fallback so the rest of the app can persist `recallBotId`.
  return data?.id ? data : { ...data, id: data?.bot_id || data?.botId || data?.uuid };
}

export async function injectAudio(botId: string, audioBuffer: Buffer) {
  const primaryRegion = process.env.RECALL_REGION || RECALL_REGION_DEFAULT;
  const fallbackRegion = primaryRegion === "ap-northeast-1" ? "us-east-1" : "ap-northeast-1";
  const regions = [primaryRegion, fallbackRegion];

  let lastError: any = null;
  for (const region of regions) {
    const baseUrl = `https://${region}.recall.ai`;
    try {
      const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/output_audio/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRecallAuthHeader(),
        },
        body: JSON.stringify({
          kind: "mp3",
          b64_data: audioBuffer.toString("base64"),
        }),
      });

      if (res.ok) {
        return res.json().catch(() => ({}));
      }

      const text = await res.text().catch(() => "");
      console.warn(`[Recall:injectAudio] Region ${region} returned ${res.status} (${text}), trying fallback...`);
      lastError = new Error(`Recall bot.output_audio failed on ${region} [${res.status} ${res.statusText}]: ${text}`);
      continue;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Recall bot.output_audio failed across all regions`);
}

export async function endMeetingBot(botId: string) {
  const baseUrl = getRecallBaseUrl();

  const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/leave_call/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getRecallAuthHeader(),
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Recall bot.leave_call failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json().catch(() => ({}));
}

export async function getBotStatus(botId: string) {
  const baseUrl = getRecallBaseUrl();

  const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/`, {
    method: "GET",
    headers: getRecallAuthHeader(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Recall bot.retrieve failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}
