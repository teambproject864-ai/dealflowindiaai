import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
let region = 'ap-northeast-1';

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('RECALL_API_KEY=')) {
    apiKey = trimmed.split('=')[1].replace(/['"]/g, '').trim();
  }
  if (trimmed.startsWith('RECALL_REGION=')) {
    region = trimmed.split('=')[1].replace(/['"]/g, '').trim();
  }
}

async function checkRecall() {
  console.log(`Checking Recall bots in region: ${region}`);
  const res = await fetch(`https://${region}.recall.ai/api/v1/bot/`, {
    headers: { Authorization: `Token ${apiKey}` }
  });
  const data = await res.json();
  const list = data.results || (Array.isArray(data) ? data : []);
  console.log(`Total bots returned: ${list.length}`);
  for (const b of list) {
    const latestStatus = b.status_changes?.[b.status_changes.length - 1];
    console.log({
      id: b.id,
      bot_name: b.bot_name,
      meeting_url: b.meeting_url,
      join_at: b.join_at,
      status: latestStatus?.code,
      created_at: b.created_at,
    });
  }
}

checkRecall().catch(console.error);
