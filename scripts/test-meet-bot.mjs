import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
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
const region = process.env.RECALL_REGION || 'ap-northeast-1';
const baseUrl = `https://${region}.recall.ai`;

const meetingUrl = process.argv[2];

if (!meetingUrl) {
  console.error('\nUsage: node scripts/test-meet-bot.mjs <GOOGLE_MEET_OR_ZOOM_URL>');
  console.error('Example: node scripts/test-meet-bot.mjs https://meet.google.com/xxx-yyyy-zzz\n');
  process.exit(1);
}

if (!apiKey) {
  console.error('\nError: RECALL_API_KEY is not set in .env.local\n');
  process.exit(1);
}

import readline from 'readline';

async function speakInCall(botId, text) {
  try {
    console.log(`\n[Bot Speaking]: "${text}"`);
    const cleanText = text.slice(0, 300);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=en&client=tw-ob`;
    const ttsRes = await fetch(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buffer = Buffer.from(await ttsRes.arrayBuffer());

    const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/output_audio/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'mp3',
        b64_data: buffer.toString('base64'),
      }),
    });

    if (res.ok) {
      console.log(`[Audio Injected Successfully] Status: ${res.status}`);
    } else {
      console.warn(`[Audio Injection Failed] Status: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error('[Audio Error]:', err.message);
  }
}

async function sendChatInCall(botId, message) {
  try {
    await fetch(`${baseUrl}/api/v1/bot/${botId}/send_chat_message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    // Non-fatal
  }
}

async function runRealTimeTest() {
  console.log('\n======================================================');
  console.log('       DEALFLOW AI - INTERACTIVE LIVE MEET BOT        ');
  console.log('======================================================');
  console.log(`Target Meeting URL: ${meetingUrl}`);
  console.log(`Recall Region     : ${region}`);
  console.log(`Bot Name          : Praneeth (AI) | Dealflow.ai`);
  console.log('------------------------------------------------------');

  const appUrl = process.env.APP_URL || 'https://dealsflowai.vercel.app';
  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/meeting/webhook`;

  console.log('\n[1/3] Dispatching bot with real-time transcription enabled...');
  
  const payload = {
    meeting_url: meetingUrl,
    bot_name: 'Praneeth (AI) | Dealflow.ai',
    recording_config: {
      transcript: {
        provider: {
          recallai_streaming: {
            mode: 'prioritize_low_latency',
            language_code: 'en',
          },
        },
      },
      realtime_endpoints: [
        {
          type: 'webhook',
          url: webhookUrl,
          events: ['transcript.data'],
        },
      ],
    },
  };

  const createRes = await fetch(`${baseUrl}/api/v1/bot/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await createRes.text();
  if (!createRes.ok) {
    console.error(`\n[ERROR] Failed to dispatch bot: ${createRes.status} ${createRes.statusText}`);
    console.error(`Details: ${responseText}\n`);
    process.exit(1);
  }

  const botData = JSON.parse(responseText);
  const botId = botData.id;
  console.log(`[SUCCESS] Bot created with real-time streaming!`);
  console.log(`Bot ID: ${botId}`);

  console.log('\n[2/3] Waiting for bot to enter the meeting...');
  console.log('👉 Please click "Admit" in Google Meet if prompted!\n');

  let inCall = false;
  const startTime = Date.now();

  while (Date.now() - startTime < 60000 && !inCall) {
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
        console.log(`[${timeStr}] Status: ${latest.code} ${latest.sub_code ? `(${latest.sub_code})` : ''}`);

        if (latest.code === 'in_call_recording' || latest.code === 'in_call_not_recording') {
          inCall = true;
          break;
        }

        if (latest.code === 'fatal' || latest.code === 'done') {
          console.log(`\n⚠️ Bot exited: ${latest.message || latest.code}`);
          process.exit(0);
        }
      }
    } catch (pollErr) {
      console.warn('Poll error:', pollErr.message);
    }
  }

  if (!inCall) {
    console.log('\nTimeout waiting for bot to be admitted. Exiting.');
    return;
  }

  console.log('\n🎉 BOT IS INSIDE THE CALL!');
  console.log('Sending greeting and in-call chat message...');

  await sendChatInCall(
    botId,
    '👋 Hello! I am Praneeth (AI) from Dealflow.ai. I am listening live to this meeting and ready to answer any questions about our autonomous revenue platform!'
  );

  await speakInCall(
    botId,
    'Hello Praneeth. I am your Dealflow AI live assistant. I am listening and ready to answer any questions from the customer.'
  );

  console.log('\n======================================================');
  console.log(' 🎙️  INTERACTIVE MODE: ASK A QUESTION TO THE BOT     ');
  console.log(' Type any customer question below and press [ENTER]. ');
  console.log(' The bot will speak the answer live into Google Meet! ');
  console.log(' Type "exit" to disconnect the bot.                  ');
  console.log('======================================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const history = [];

  const promptUser = () => {
    rl.question('Customer Asks > ', async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptUser();
        return;
      }
      if (trimmed.toLowerCase() === 'exit') {
        console.log('\nDisconnecting bot from call...');
        await fetch(`${baseUrl}/api/v1/bot/${botId}/leave_call/`, {
          method: 'POST',
          headers: { Authorization: `Token ${apiKey}` },
        });
        console.log('Bot disconnected. Goodbye!');
        process.exit(0);
      }

      // Generate intelligent, natural human answer via Auto-LLM
      const { generateHumanResponse } = await import('../lib/auto-llm.ts');
      const answer = await generateHumanResponse(trimmed, history, {
        personaName: 'Praneeth',
        companyName: 'DealFlow AI',
      });

      history.push({ speaker: 'Customer', text: trimmed });
      history.push({ speaker: 'Praneeth (AI)', text: answer });

      await sendChatInCall(botId, answer);
      await speakInCall(botId, answer);
      promptUser();
    });
  };

  promptUser();
}

runRealTimeTest().catch((err) => {
  console.error('\nFatal test runner error:', err);
});
