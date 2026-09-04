// app/api/meeting/webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { agentDecide } from '@/lib/agent-brain';
import { generateHumanResponse } from '@/lib/auto-llm';
import { textToSpeech } from '@/lib/elevenlabs';
import { injectAudio } from '@/lib/recall';
import { navigateTo, deleteSession } from '@/lib/screen-controller';
import { PERSONAS } from '@/prompts/personas';
import { createToken } from '@/lib/auth';

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  const secret = process.env.RECALL_WEBHOOK_SECRET?.trim();
  const bodyText = await req.text();

  if (secret) {
    let isValid = false;

    // 1. Recall.ai realtime_endpoints header authentication (Authorization or X-Webhook-Secret)
    const authHeader = req.headers.get('authorization');
    const secretHeader = req.headers.get('x-webhook-secret');

    if (secretHeader && safeCompare(secretHeader.trim(), secret)) {
      isValid = true;
    } else if (authHeader) {
      const cleanAuth = authHeader.trim();
      if (cleanAuth.startsWith('Bearer ') && safeCompare(cleanAuth.slice(7).trim(), secret)) {
        isValid = true;
      } else if (cleanAuth.startsWith('Token ') && safeCompare(cleanAuth.slice(6).trim(), secret)) {
        isValid = true;
      } else if (safeCompare(cleanAuth, secret)) {
        isValid = true;
      }
    }

    // 2. Check Svix headers (Recall.ai standard format)
    const webhookId = req.headers.get('webhook-id') || req.headers.get('svix-id');
    const webhookTimestamp = req.headers.get('webhook-timestamp') || req.headers.get('svix-timestamp');
    const webhookSignature = req.headers.get('webhook-signature') || req.headers.get('svix-signature');

    if (!isValid && webhookId && webhookTimestamp && webhookSignature) {
      // Svix signature verification: HMAC-SHA256 over "${webhookId}.${webhookTimestamp}.${bodyText}"
      const secretKey = secret.startsWith('whsec_')
        ? Buffer.from(secret.slice(6), 'base64')
        : Buffer.from(secret, 'utf-8');

      const toSign = `${webhookId}.${webhookTimestamp}.${bodyText}`;
      const expectedDigest = crypto.createHmac('sha256', secretKey).update(toSign).digest('base64');

      // webhook-signature can contain multiple space-separated signatures (e.g., "v1,abc... v1,def...")
      const signatures = webhookSignature.split(' ');
      isValid = signatures.some((sig) => {
        const parts = sig.split(',');
        if (parts.length === 2 && parts[0] === 'v1') {
          return safeCompare(parts[1], expectedDigest);
        }
        return false;
      });
    }

    // 3. Check legacy headers
    const legacySignature = req.headers.get('x-recall-signature');
    if (!isValid && legacySignature) {
      // Legacy signature verification: hex HMAC over bodyText
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(bodyText).digest('hex');
      isValid = safeCompare(digest, legacySignature);
    }

    if (!isValid) {
      console.warn('[RecallWebhook] Webhook signature validation failed.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  } else {
    // If no secret is configured yet in environment, log warning but accept
    console.warn('[RecallWebhook] RECALL_WEBHOOK_SECRET is not set in environment variables. Allowing webhook in unverified mode.');
  }

  const systemToken = createToken({ id: 'system', email: 'system@dealflow.ai', role: 'admin', name: 'System' });
  const payload = JSON.parse(bodyText);
  const { event, data } = payload;

  if (event === 'transcript.data' || event === 'participant_events.chat_message') {
    const bot_id = data.bot_id || data.botId;
    let transcript = data.transcript;

    if (event === 'participant_events.chat_message') {
      const messageText = data.data?.text || data.message || data.text;
      const speakerName = data.participant?.name || 'Customer';
      if (!messageText) return NextResponse.json({ received: true });
      transcript = {
        speaker: speakerName,
        text: messageText,
      };
    }

    if (!transcript) return NextResponse.json({ received: true });

    let callDoc: any = null;
    let callId = bot_id;
    let callData: any = {
      agentPersona: 'praneeth_assist',
      currentStage: 'discovery',
      leadId: 'global',
    };

    if (db) {
      try {
        const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
        if (callSnapshot && !callSnapshot.empty) {
          callDoc = callSnapshot.docs[0];
          callId = callDoc.id;
          callData = { ...callData, ...callDoc.data() };
        }
      } catch (err) {
        console.warn('[MeetingWebhook] Firestore call lookup notice:', err);
      }
    }

    // Precise bot speaker detection (never filter out human participants like "Praneeth" or "assistant")
    const persona = (PERSONAS as any)[callData.agentPersona] || PERSONAS.praneeth_assist;
    const speakerStr = String(transcript.speaker || "").trim();
    const lowerSpeaker = speakerStr.toLowerCase();
    const isBotSelf =
      Boolean(transcript.is_bot) ||
      Boolean(transcript.is_self) ||
      lowerSpeaker.endsWith("(ai) | dealflow.ai") ||
      lowerSpeaker.includes("(ai)") ||
      lowerSpeaker === "dealflow ai live assistant" ||
      lowerSpeaker === "dealflow assistant" ||
      lowerSpeaker === `${persona.name.toLowerCase()} (ai) | dealflow.ai` ||
      lowerSpeaker === `${persona.name.toLowerCase()} assist (ai)`;

    if (isBotSelf) {
      return NextResponse.json({ received: true, ignored: "bot_self_utterance" });
    }

    // Extract participant speech
    const transcriptText = String(
      transcript.text ||
      (Array.isArray(transcript.words) ? transcript.words.map((w: any) => w.text).join(' ') : '')
    ).trim();

    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
    if (!transcriptText || wordCount < 1) {
      return NextResponse.json({ received: true });
    }

    // If chunk is not final, buffer it to allow complete questions before generating response
    const isFinal = transcript.is_final !== false;
    if (!isFinal && transcriptText.split(/\s+/).length < 3) {
      return NextResponse.json({ received: true, status: "buffering_partial" });
    }

    console.log(`[MeetingWebhook] Customer spoke in meeting: "${transcriptText}" (speaker: ${speakerStr})`);

    // Append to Firestore transcripts if DB is available
    const segment = {
      speaker: transcript.speaker || 'Customer',
      text: transcriptText,
      timestamp: new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('transcripts').doc(callId).set({
          callId,
          segments: admin.firestore.FieldValue.arrayUnion(segment),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (callDoc?.ref) {
          await callDoc.ref.set(
            {
              lastTranscriptAt: new Date().toISOString(),
              lastTranscriptAtMs: Date.now(),
              currentPhase: 'active_qa',
              updatedAt: new Date().toISOString(),
              updatedAtMs: Date.now(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        // Non-critical logging
      }
    }

    // Process AI Agent Decision & Response
    let recentTranscript: string[] = [`${segment.speaker}: ${segment.text}`];
    if (db) {
      try {
        const transcriptDoc = await db.collection('transcripts').doc(callId).get();
        const segments = transcriptDoc.data()?.segments || [];
        if (segments.length > 0) {
          recentTranscript = segments.slice(-8).map((s: any) => `${s.speaker}: ${s.text}`);
        }
      } catch (e) {}
    }

    const companyContext = {
      companyName: callData.calendarEventTitle || 'the client',
      challenges: [],
      currentTools: [],
      analysis: null
    };

    // Generate fluid human-like conversational response using Auto-LLM
    let spokenContent = '';
    try {
      spokenContent = await generateHumanResponse(
        transcriptText,
        recentTranscript.map((t) => ({ speaker: t.split(':')[0] || 'Customer', text: t.split(':')[1] || t })),
        { personaName: 'Praneeth', companyName: 'DealFlow AI' }
      );
    } catch (llmErr: any) {
      console.warn('[MeetingWebhook] AutoLLM notice:', llmErr.message);
    }

    if (!spokenContent) {
      const action = await agentDecide(
        recentTranscript,
        companyContext,
        callData.agentPersona,
        callData.currentStage,
        callData.leadId || 'global'
      );
      spokenContent = action?.content || '';
    }

    console.log(`[MeetingWebhook] Human-like Spoken Response: "${spokenContent}"`);

    if (spokenContent) {
      // 1. Speak answer out loud via Call Voice Audio Injection
      try {
        const audio = await textToSpeech(spokenContent, callData.agentPersona);
        if (audio && audio.length > 0) {
          await injectAudio(bot_id, audio);
          console.log(`[MeetingWebhook] Injected voice audio into Google Meet bot ${bot_id}`);
        }
      } catch (audioErr: any) {
        console.error('[MeetingWebhook] Failed to inject audio:', audioErr.message);
      }

      // 2. Also send response simultaneously in Google Meet chat for dual reliability
      try {
        const primaryRegion = process.env.RECALL_REGION || 'ap-northeast-1';
        const regions = [primaryRegion, primaryRegion === 'ap-northeast-1' ? 'us-east-1' : 'ap-northeast-1'];
        const apiKey = process.env.RECALL_API_KEY;
        if (apiKey) {
          for (const reg of regions) {
            const baseUrl = `https://${reg}.recall.ai`;
            const chatRes = await fetch(`${baseUrl}/api/v1/bot/${bot_id}/send_chat_message/`, {
              method: 'POST',
              headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: spokenContent }),
            });
            if (chatRes.ok) {
              console.log(`[MeetingWebhook] Sent chat message to bot ${bot_id} via ${reg}`);
              break;
            }
          }
        }
      } catch (chatErr: any) {
        console.warn('[MeetingWebhook] Chat dispatch warning:', chatErr?.message);
      }
    }

    return NextResponse.json({ received: true, answered: Boolean(spokenContent) });
  } else if (
    event === 'bot.status_change' && 
    (data?.status === 'joined_call' || data?.status?.code === 'joined_call' || data?.status?.code === 'in_call_recording')
  ) {
    const { bot_id } = data || {};
    if (db && bot_id) {
      const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
      
      if (!callSnapshot.empty) {
        const callDoc = callSnapshot.docs[0];
        const callData = callDoc.data();
        const alreadySpoken = !!callData?.openingLineSentAt;
        if (alreadySpoken) return NextResponse.json({ received: true, message: "Introduction already delivered" });

        let companyName = callData.calendarEventTitle || 'the client';
        if (callData.leadId) {
          const leadDoc = await db.collection('leads').doc(callData.leadId).get();
          const leadData = leadDoc.data();
          companyName = leadData?.companyName || companyName;
        }

        const persona = (PERSONAS as any)[callData.agentPersona] || PERSONAS.praneeth_assist;
        const openingLine = persona.openingLine(companyName);
        
        const audio = await textToSpeech(openingLine, callData.agentPersona);
        if (audio && audio.length > 0) {
          await injectAudio(bot_id, audio);
        }

        // Send opening line in chat as well
        try {
          const primaryRegion = process.env.RECALL_REGION || 'ap-northeast-1';
          const regions = [primaryRegion, primaryRegion === 'ap-northeast-1' ? 'us-east-1' : 'ap-northeast-1'];
          const apiKey = process.env.RECALL_API_KEY;
          if (apiKey) {
            for (const reg of regions) {
              const baseUrl = `https://${reg}.recall.ai`;
              const chatRes = await fetch(`${baseUrl}/api/v1/bot/${bot_id}/send_chat_message/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Token ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: openingLine }),
              });
              if (chatRes.ok) break;
            }
          }
        } catch (e: any) {
          console.warn('[MeetingWebhook] Failed to send opening line chat:', e?.message);
        }
        
        await callDoc.ref.update({
          status: 'in-progress',
          meetingStatus: 'joined',
          openingLineSentAt: new Date().toISOString(),
          currentPhase: 'active_qa',
          botJoinedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        });
      }
    }
  } else if (event === 'bot.done') {
    const { bot_id } = data || {};

    let resolvedSessionId: string | null = null;
    let targetCallId: string | null = null;

    if (db && bot_id) {
      try {
        const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
        if (!callSnapshot.empty) {
          const callDoc = callSnapshot.docs[0];
          targetCallId = callDoc.id;
          const callData = callDoc.data();
          resolvedSessionId = callData.sessionId || callData.meetingSessionId || callDoc.id;
          
          await callDoc.ref.update({
            status: 'completed',
            meetingStatus: 'ended',
            endedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedAtMs: Date.now(),
          });
          await deleteSession(targetCallId);
        }
      } catch (dbErr: any) {
        console.warn('[MeetingWebhook] Failed to query calls collection for recallBotId:', dbErr?.message);
      }
    }

    // If not found in DB calls, check in-memory bot sessions
    if (bot_id && !resolvedSessionId) {
      try {
        const { getMeetingBotSessions } = await import('@/lib/call-bot/meeting-bot-controller');
        const sessions = await getMeetingBotSessions("admin");
        const matched = sessions.find((s: any) => s.recallBotId === bot_id || s.botId === bot_id || s.sessionId === bot_id);
        if (matched) {
          resolvedSessionId = matched.sessionId;
        }
      } catch (memErr: any) {
        console.warn('[MeetingWebhook] Failed to search in-memory sessions for bot_id:', memErr?.message);
      }
    }

    // Trigger immediate automated MOM generation & distribution with the valid sessionId
    if (resolvedSessionId) {
      try {
        const { ensureMOMDistribution } = await import('@/lib/call-bot/meeting-bot-controller');
        await ensureMOMDistribution(resolvedSessionId);
        console.log(`[MeetingWebhook] Post-meeting MOM automated generation & distribution completed for session ${resolvedSessionId} (bot ${bot_id})`);
      } catch (momErr: any) {
        console.warn('[MeetingWebhook] Post-meeting MOM automated distribution notice:', momErr?.message);
      }
    } else if (bot_id) {
      console.error(`[MeetingWebhook] Cannot trigger MOM distribution: No call document or meeting session found for recallBotId "${bot_id}". Aborting to prevent unauthorized disclosure.`);
    }
  }

  return NextResponse.json({ received: true });
}
