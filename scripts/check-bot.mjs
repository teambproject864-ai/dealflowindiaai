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

async function check() {
  const res = await fetch(`https://${region}.recall.ai/api/v1/bot/${botId}/`, {
    headers: { Authorization: `Token ${key}` }
  });
  const data = await res.json();
  console.log('BOT ID:', data.id);
  console.log('STATUS CHANGES:', JSON.stringify(data.status_changes?.slice(-5), null, 2));
  console.log('RECORDING_CONFIG:', JSON.stringify(data.recording_config?.realtime_endpoints, null, 2));
}

check().catch(console.error);
