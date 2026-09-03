// scripts/test-realtime-meetbot.ts
import fs from "fs";
import path from "path";
import readline from "readline";

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

const apiKey = process.env.RECALL_API_KEY;
const region = process.env.RECALL_REGION || "ap-northeast-1";
const baseUrl = `https://${region}.recall.ai`;

const meetingUrl = process.argv[2] || "https://meet.google.com/det-frkt-iud";
const recipientEmail = process.argv[3] || "buradapraneeth@gmail.com";
const recipientName = "Praneeth Burada";

if (!apiKey) {
  console.error("\n[CRITICAL ERROR]: RECALL_API_KEY is missing from environment.\n");
  process.exit(1);
}

async function speakInCall(botId: string, text: string) {
  try {
    console.log(`\n[Bot Live Speech Injection]: "${text}"`);
    const cleanText = text.slice(0, 300);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=en&client=tw-ob`;
    const ttsRes = await fetch(ttsUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const buffer = Buffer.from(await ttsRes.arrayBuffer());

    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/output_audio/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "mp3",
        b64_data: buffer.toString("base64"),
      }),
    });

    if (res.ok) {
      console.log(`✓ Audio broadcast to Google Meet successfully (Status ${res.status})`);
    } else {
      console.warn(`[Audio Injection Notice]: ${res.status} ${await res.text().catch(() => "")}`);
    }
  } catch (err: any) {
    console.warn("[Audio Injection Warning]:", err?.message || err);
  }
}

async function sendChatInCall(botId: string, message: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/send_chat_message/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      console.log(`✓ In-call chat message delivered to Google Meet room.`);
    }
  } catch (err: any) {
    console.warn("[Chat Message Warning]:", err?.message || err);
  }
}

async function main() {
  console.log("======================================================");
  console.log("    DEALFLOW AI - REALTIME GOOGLE MEET BOT LAUNCHER    ");
  console.log("======================================================");
  console.log(`Target Meeting URL : ${meetingUrl}`);
  console.log(`Target Recipient   : ${recipientName} <${recipientEmail}>`);
  console.log(`Recall.ai Region   : ${region}`);
  console.log(`Bot Display Name   : DealFlow AI Live Assistant`);
  console.log("------------------------------------------------------");

  const appUrl = process.env.APP_URL || "https://dealsflowai.vercel.app";
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/meeting/webhook?token=dealflow_secret`;

  console.log("\n[Step 1/4] Dispatching Recall.ai Bot into Google Meet...");

  const payload = {
    meeting_url: meetingUrl,
    bot_name: "DealFlow AI Live Assistant",
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
          events: ["transcript.data", "participant_events.chat_message"],
        },
      ],
    },
  };

  const createRes = await fetch(`${baseUrl}/api/v1/bot/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await createRes.text();
  if (!createRes.ok) {
    console.error(`\n[ERROR] Failed to dispatch Recall bot: ${createRes.status} ${createRes.statusText}`);
    console.error(`Details: ${responseText}\n`);
    process.exit(1);
  }

  const botData = JSON.parse(responseText);
  const botId = botData.id;
  console.log(`✓ Bot successfully created in Recall.ai cluster!`);
  console.log(`  Recall Bot ID: ${botId}`);

  // Register session with our meeting bot controller
  console.log("\n[Step 2/4] Registering Meeting Bot Session & MOM Distribution Target...");
  const { scheduleMeetingBotSession } = await import("../lib/call-bot/meeting-bot-controller");
  const session = await scheduleMeetingBotSession({
    meetingTitle: "DealFlow AI Realtime Client Demonstration",
    meetingUrl: meetingUrl,
    startTime: new Date().toISOString(),
    callScenario: "client_sales",
    scheduledByUserId: "admin-user",
    scheduledByUserRole: "admin",
    recipients: [
      { email: recipientEmail, name: recipientName },
    ],
    remindersEnabled: false,
  });

  // Link recallBotId & botId to session
  session.recallBotId = botId;
  session.botId = botId;
  console.log(`✓ Platform Session ID: ${session.sessionId}`);
  console.log(`✓ Target MOM Recipient: ${recipientEmail}`);

  console.log("\n[Step 3/4] Connecting to Google Meet call...");
  console.log("👉 ACTION REQUIRED: If prompted with 'Someone wants to join this call', click 'Admit' in Google Meet!\n");

  let inCall = false;
  const startTime = Date.now();

  // Poll status up to 180 seconds
  while (Date.now() - startTime < 180000 && !inCall) {
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const statusRes = await fetch(`${baseUrl}/api/v1/bot/${botId}/`, {
        headers: { Authorization: `Token ${apiKey}` },
      });
      const data = await statusRes.json();
      const changes = data.status_changes || [];
      const latest = changes[changes.length - 1];

      if (latest) {
        const timeStr = new Date(latest.created_at).toLocaleTimeString();
        console.log(`[${timeStr}] Bot Status: ${latest.code} ${latest.sub_code ? `(${latest.sub_code})` : ""}`);

        if (latest.code === "in_call_recording" || latest.code === "in_call_not_recording") {
          inCall = true;
          break;
        }

        if (latest.code === "fatal" || latest.code === "done") {
          console.log(`\n⚠️ Bot session terminated: ${latest.message || latest.code}`);
          break;
        }
      }
    } catch (pollErr: any) {
      console.warn("Status poll notice:", pollErr?.message || pollErr);
    }
  }

  if (!inCall) {
    console.log("\n[Status]: Bot is still connecting or waiting in lobby. Bot ID is:", botId);
  } else {
    console.log("\n🎉 BOT IS INSIDE THE GOOGLE MEET CALL!");
    console.log("Broadcasting introduction and interactive speech...");

    await sendChatInCall(
      botId,
      "👋 Hello Praneeth! I am DealFlow AI Live Assistant. I am actively listening to this meeting and ready to answer any questions about our platform, enterprise features, or revenue analytics!"
    );

    await speakInCall(
      botId,
      "Hello Praneeth. I am your DealFlow AI Live Assistant. I have joined the Google Meet and I am ready to assist during this session."
    );
  }

  console.log("\n[Step 4/4] Automated MOM Generation Ready");
  console.log("When the call concludes or you type 'done', the bot will leave and immediately generate and email your Minutes of Meeting (MOM).");
  console.log("Type 'speak <text>' to make the bot speak live into the call, or 'done' to finish:\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question("MeetBot Console > ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptUser();
        return;
      }

      if (trimmed.toLowerCase() === "done" || trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("\nDisconnecting bot from Google Meet...");
        try {
          await fetch(`${baseUrl}/api/v1/bot/${botId}/leave_call/`, {
            method: "POST",
            headers: { Authorization: `Token ${apiKey}` },
          });
        } catch {}

        console.log("\nTriggering Immediate MOM Automated Generation & Distribution...");
        const { ensureMOMDistribution } = await import("../lib/call-bot/meeting-bot-controller");
        try {
          const momResult = await ensureMOMDistribution(session.sessionId, session);
          if (momResult.success && momResult.mom) {
            console.log("\n======================================================");
            console.log("      AUTOMATED MINUTES OF MEETING (MOM) GENERATED    ");
            console.log("======================================================");
            console.log(`Title    : ${session.meetingTitle}`);
            console.log(`Executive Summary:\n${momResult.mom.executiveSummary}\n`);
            console.log("Key Action Items:");
            momResult.mom.actionItems.forEach((item, idx) => {
              console.log(`  ${idx + 1}. [${item.priority || "Normal"}] ${item.task} (Owner: ${item.owner}, Due: ${item.timeline})`);
            });
            console.log(`\nDispatched to: ${recipientEmail}`);
            console.log("======================================================\n");
          } else {
            console.log("MOM result:", momResult);
          }
        } catch (momErr: any) {
          console.error("Failed to distribute MOM:", momErr?.message || momErr);
        }

        rl.close();
        process.exit(0);
      } else if (trimmed.startsWith("speak ")) {
        const textToSpeak = trimmed.slice(6);
        await speakInCall(botId, textToSpeak);
        await sendChatInCall(botId, textToSpeak);
        promptUser();
      } else {
        // Query Dealflow Auto-LLM and speak answer live!
        try {
          const { generateHumanResponse } = await import("../lib/auto-llm");
          console.log(`Generating AI response to: "${trimmed}"...`);
          const answer = await generateHumanResponse(trimmed, [], {
            personaName: "DealFlow Assistant",
            companyName: "Dealflow AI",
          });
          console.log(`AI Answer: "${answer}"`);
          await sendChatInCall(botId, answer);
          await speakInCall(botId, answer);
        } catch (e: any) {
          console.warn("LLM Error:", e?.message);
        }
        promptUser();
      }
    });
  };

  promptUser();
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
