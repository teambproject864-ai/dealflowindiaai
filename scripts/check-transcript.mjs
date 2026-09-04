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
const baseUrl = 'https://ap-northeast-1.recall.ai';

async function checkTranscript() {
  const res = await fetch(`${baseUrl}/api/v1/bot/${botId}/transcript/`, {
    headers: { Authorization: `Token ${key}` }
  });
  console.log('Transcript endpoint status:', res.status);
  if (res.ok) {
    const data = await res.json();
    console.log('Transcript data count:', Array.isArray(data) ? data.length : typeof data);
    console.log('Transcript snippet:', JSON.stringify(data).slice(0, 500));
  } else {
    console.log('Response:', await res.text());
  }
}

checkTranscript().catch(console.error);
