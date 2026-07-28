// app/api/meeting/create/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getBotStatus, injectAudio } from '@/lib/recall';
import { PERSONAS } from '@/prompts/personas';
import { textToSpeech } from '@/lib/elevenlabs';
import { ensureBotForCall } from '@/lib/call-bot';

export async function POST(req: Request) {
  try {
    const { callId, meetingUrl, personaKey } = await req.json();

    if (!callId || !meetingUrl || !personaKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const persona = PERSONAS[personaKey];
    if (!persona) {
      return NextResponse.json({ error: 'Invalid persona key' }, { status: 400 });
    }

    const ensured = await ensureBotForCall({
      callId,
      meetingUrl,
      personaKey,
      forceJoinNow: true,
      reason: "manual_meeting_create",
    });

    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: 500 });
    }

    const botId = ensured.botId;

    // If webhooks are delayed/unreliable, ensure the agent speaks as soon as
    // Recall reports the bot joined the meeting.
    void (async () => {
      try {
        const currentDb = db;
        if (!currentDb) return;
        const callDoc = await currentDb.collection('calls').doc(callId).get();
        const callData = callDoc.data();
        if (!callData?.leadId) return;

        const leadDoc = await currentDb.collection('leads').doc(callData.leadId).get();
        const leadData = leadDoc.data();
        if (!leadData) return;

        const openingLine = persona.openingLine(leadData.companyName || 'the client');

        // Poll briefly for joined_call
        for (let i = 0; i < 25; i++) {
          const status = await getBotStatus(botId).catch(() => null);
          const botStatus = (status as any)?.status;
          if (botStatus === 'joined_call') {
            const audio = await textToSpeech(openingLine, personaKey);
            await injectAudio(botId, audio);
            await currentDb.collection('calls').doc(callId).update({
              openingLineSentAt: new Date().toISOString(),
            });
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (e) {
        console.error('Post-create opening line failed:', e);
      }
    })();

    return NextResponse.json({ success: true, botId });
  } catch (error: any) {
    console.error('Meeting creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
