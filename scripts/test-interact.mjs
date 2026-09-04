import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
let key = '';
for (const line of env.split('\n')) {
  if (line.trim().startsWith('RECALL_API_KEY=')) {
    key = line.trim().split('=')[1].replace(/['"]/g, '').trim();
    break;
  }
}
const region = 'ap-northeast-1';
const botId = 'd9ba1e80-68e7-48b0-8d61-5a913187f391';
const baseUrl = `https://${region}.recall.ai`;

async function testInteract() {
  console.log(`Testing interaction with bot ${botId} in ${region}...`);

  // 1. Send chat message
  const chatMsg = "Hello! I am DealFlow AI Live Assistant. Can you hear me now?";
  const chatRes = await fetch(`${baseUrl}/api/v1/bot/${botId}/send_chat_message/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: chatMsg }),
  });
  console.log('Chat message status:', chatRes.status, await chatRes.text());

  // 2. Send TTS audio
  const text = "Hello Praneeth! I am Dealflow AI. I am now active and speaking in your Google Meet.";
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
  const ttsRes = await fetch(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buffer = Buffer.from(await ttsRes.arrayBuffer());

  const audioRes = await fetch(`${baseUrl}/api/v1/bot/${botId}/output_audio/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: 'mp3',
      b64_data: buffer.toString('base64'),
    }),
  });
  console.log('Audio injection status:', audioRes.status, await audioRes.text());
}

testInteract().catch(console.error);
