import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
let key = '';
for (const line of env.split('\n')) {
  if (line.trim().startsWith('RECALL_API_KEY=')) {
    key = line.trim().split('=')[1].replace(/['"]/g, '').trim();
    break;
  }
}
const bots = ['b0f107fc-40c1-4a26-a870-f574352062c9', 'bc12f861-01fa-4fd9-ab5c-1dd0e6eab36c'];
for (const id of bots) {
  const res = await fetch(`https://ap-northeast-1.recall.ai/api/v1/bot/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Token ${key}` }
  });
  console.log(`Deleted bot ${id}: status ${res.status}`);
}
