// lib/recall.ts
// NOTE:
// The original version used a Recall SDK package that isn't installed in this repo.
// To make the meeting bot actually join the call, we call Recall's REST API directly.

const RECALL_REGION_DEFAULT = "us-east-1";

function getRecallBaseUrl() {
  const region = process.env.RECALL_REGION || RECALL_REGION_DEFAULT;
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
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/meeting/webhook`;
  const workerUrl = process.env.SCREEN_SHARE_WORKER_URL || appUrl;

  // Creating a bot immediately dispatches it to the meeting (auto-join),
  // since we do not pass `join_at`.
  const res = await fetch(`${baseUrl}/api/v1/bot/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getRecallAuthHeader(),
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: `${personaName} (AI) | Dealflow.ai`,
      transcription_options: { 
        provider: "deepgram",
        language: "en"
      },
      recording_mode: "speaker_view",
      real_time_transcription: {
        enabled: true
      },
      output_media: {
        camera: {
          kind: "webpage",
          url: `${workerUrl}/display/${callId}`,
        },
      },
      ...(joinAtIso ? { join_at: joinAtIso } : {}),
      // Required by Recall for /output_audio to work.
      automatic_audio_output: {
        in_call_recording: {
          data: { kind: "mp3" },
        },
      },
      webhook_url: webhookUrl,
    }),
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
  const baseUrl = getRecallBaseUrl();

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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Recall bot.output_audio failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json().catch(() => ({}));
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
