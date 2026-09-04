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

async function checkCal() {
  try {
    const { google } = await import('googleapis');
    const { loadServiceAccount } = await import('../lib/service-account.ts');
    const sa = loadServiceAccount();
    if (!sa) {
      console.log('No service account found');
      return;
    }

    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'teambproject864@gmail.com';
    console.log(`Querying Google Calendar: ${calendarId}...`);

    const now = new Date();
    // Check 24 hours around now
    const timeMin = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = res.data.items || [];
    console.log(`Found ${items.length} calendar events:`);
    for (const ev of items) {
      console.log({
        id: ev.id,
        summary: ev.summary,
        start: ev.start,
        hangoutLink: ev.hangoutLink,
        meetLink: ev.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri,
        description: ev.description?.slice(0, 200),
      });
    }
  } catch (e) {
    console.error('Calendar error:', e.message);
  }
}

checkCal().catch(console.error);
