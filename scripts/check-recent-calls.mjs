import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
}

async function checkRecentFirestore() {
  const { db } = await import('../lib/firebase-admin.ts');
  if (!db) {
    console.log("No DB");
    return;
  }
  // Check calls created in the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  console.log(`Checking calls created after ${twoHoursAgo}...`);
  const snap = await db.collection('calls').where('createdAt', '>=', twoHoursAgo).get();
  console.log(`Calls created in last 2 hours: ${snap.size}`);
  snap.forEach(doc => {
    console.log("Recent Call:", doc.id, doc.data());
  });

  const sessSnap = await db.collection('meeting_bot_sessions').where('createdAt', '>=', twoHoursAgo).get();
  console.log(`Sessions created in last 2 hours: ${sessSnap.size}`);
  sessSnap.forEach(doc => {
    console.log("Recent Session:", doc.id, doc.data());
  });
}

checkRecentFirestore().catch(console.error);
