import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
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

async function verify() {
  console.log("=== CHECKING FIRESTORE CALLS & SESSIONS ===");
  try {
    const { db } = await import('../lib/firebase-admin.ts');
    if (db) {
      // 1. Check calls collection
      const callsSnap = await db.collection('calls').get();
      console.log(`Total calls found in DB: ${callsSnap.size}`);
      callsSnap.forEach(doc => {
        const d = doc.data();
        console.log(`Call ID [${doc.id}]:`, {
          scheduledAt: d.scheduledAt,
          meetingUrl: d.meetingUrl,
          status: d.status,
          recallBotId: d.recallBotId,
          botJoinAt: d.botJoinAt,
          botCreatedAt: d.botCreatedAt,
          agentPersona: d.agentPersona,
          callMode: d.callMode,
        });
      });

      // 2. Check meeting_bot_sessions collection
      const sessionsSnap = await db.collection('meeting_bot_sessions').get();
      console.log(`\nTotal meeting_bot_sessions found in DB: ${sessionsSnap.size}`);
      sessionsSnap.forEach(doc => {
        const d = doc.data();
        console.log(`Session ID [${doc.id}]:`, {
          meetingTitle: d.meetingTitle,
          meetingUrl: d.meetingUrl,
          startTime: d.startTime,
          status: d.status,
          botId: d.botId,
          recallBotId: d.recallBotId,
          recipients: d.recipients,
        });
      });
    } else {
      console.log("Firestore DB not configured or available.");
    }
  } catch (err) {
    console.error("Firestore check error:", err.message);
  }

  // 3. Check Recall.ai API for active or scheduled bots
  console.log("\n=== CHECKING RECALL.AI CLUSTER BOTS ===");
  const apiKey = process.env.RECALL_API_KEY;
  const region = process.env.RECALL_REGION || 'ap-northeast-1';
  if (apiKey) {
    try {
      const res = await fetch(`https://${region}.recall.ai/api/v1/bot/`, {
        headers: { Authorization: `Token ${apiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.results || (Array.isArray(data) ? data : []);
        console.log(`Recall bots found (${region}): ${results.length}`);
        results.slice(0, 10).forEach(b => {
          console.log(`Bot [${b.id}]:`, {
            bot_name: b.bot_name,
            meeting_url: b.meeting_url,
            join_at: b.join_at,
            status: b.status_changes?.[b.status_changes.length - 1]?.code,
            created_at: b.created_at,
          });
        });
      } else {
        console.log(`Recall API response: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error("Recall API error:", err.message);
    }
  }

  // 4. Check Google Calendar events if configured
  console.log("\n=== CHECKING GOOGLE CALENDAR ===");
  try {
    const { fetchGoogleCalendarEvent, getCalendarClient } = await import('../lib/google-meet.ts').catch(() => ({}));
    // Check if google calendar can list events for today
    const { google } = await import('googleapis');
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (saKey) {
      const sa = JSON.parse(saKey);
      const auth = new google.auth.JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      const calendar = google.calendar({ version: 'v3', auth });
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const eventsRes = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const items = eventsRes.data.items || [];
      console.log(`Google Calendar events for today: ${items.length}`);
      items.forEach(ev => {
        console.log(`Event [${ev.id}]:`, {
          summary: ev.summary,
          start: ev.start,
          hangoutLink: ev.hangoutLink,
          conferenceData: ev.conferenceData?.entryPoints,
        });
      });
    } else {
      console.log("No Google Service Account key in environment for calendar search.");
    }
  } catch (calErr) {
    console.log("Google Calendar check notice:", calErr.message);
  }
}

verify().catch(console.error);
