import fs from 'fs';
import path from 'path';

// Load .env.local
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

async function findTodayCalls() {
  const { db } = await import('../lib/firebase-admin.ts');
  if (!db) {
    console.log("No DB");
    return;
  }

  console.log("Searching Firestore 'calls' for calls on or around 2026-09-04...");
  const snap = await db.collection('calls').get();
  const allCalls = [];
  snap.forEach(doc => {
    const d = doc.data();
    let dateStr = '';
    if (d.scheduledAt) {
      if (typeof d.scheduledAt === 'string') dateStr = d.scheduledAt;
      else if (d.scheduledAt.toDate) dateStr = d.scheduledAt.toDate().toISOString();
      else if (d.scheduledAt._seconds) dateStr = new Date(d.scheduledAt._seconds * 1000).toISOString();
    }
    allCalls.push({ id: doc.id, ...d, scheduledAtParsed: dateStr });
  });

  // Sort by scheduledAt or createdAt descending
  allCalls.sort((a, b) => {
    const da = new Date(a.scheduledAtParsed || a.createdAt || 0).getTime();
    const db = new Date(b.scheduledAtParsed || b.createdAt || 0).getTime();
    return db - da;
  });

  console.log("Top 10 Most Recent / Scheduled Calls:");
  for (const c of allCalls.slice(0, 10)) {
    console.log({
      id: c.id,
      scheduledAt: c.scheduledAtParsed,
      scheduledAtLocalIST: c.scheduledAtParsed ? new Date(c.scheduledAtParsed).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) : null,
      createdAt: c.createdAt,
      meetingUrl: c.meetingUrl,
      status: c.status,
      recallBotId: c.recallBotId,
      botJoinAt: c.botJoinAt,
      callMode: c.callMode,
    });
  }

  // Also check meeting_bot_sessions
  console.log("\nSearching 'meeting_bot_sessions'...");
  const sessSnap = await db.collection('meeting_bot_sessions').get();
  sessSnap.forEach(doc => {
    const d = doc.data();
    console.log("Session:", {
      id: doc.id,
      meetingTitle: d.meetingTitle,
      meetingUrl: d.meetingUrl,
      startTime: d.startTime,
      startTimeIST: d.startTime ? new Date(d.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) : null,
      status: d.status,
      botId: d.botId,
      recallBotId: d.recallBotId,
    });
  });
}

findTodayCalls().catch(console.error);
