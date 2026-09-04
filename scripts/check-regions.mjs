import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
let key = '';
for (const line of env.split('\n')) {
  if (line.trim().startsWith('RECALL_API_KEY=')) {
    key = line.trim().split('=')[1].replace(/['"]/g, '').trim();
    break;
  }
}
const botId = 'd9ba1e80-68e7-48b0-8d61-5a913187f391';

async function testRegions() {
  const regions = ['us-east-1', 'ap-northeast-1'];
  for (const reg of regions) {
    const res = await fetch(`https://${reg}.recall.ai/api/v1/bot/${botId}/`, {
      headers: { Authorization: `Token ${key}` }
    });
    console.log(`Region ${reg} returned status: ${res.status}`);
  }
}

testRegions().catch(console.error);
