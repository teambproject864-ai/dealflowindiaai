// app/api/meeting/webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { agentDecide } from '@/lib/agent-brain';
import { textToSpeech } from '@/lib/elevenlabs';
import { injectAudio } from '@/lib/recall';
import { navigateTo, deleteSession } from '@/lib/screen-controller';
import { PERSONAS } from '@/prompts/personas';
import { createToken } from '@/lib/auth';

export async function POST(req: Request) {
  const signature = req.headers.get('x-recall-signature');
  const secret = process.env.RECALL_WEBHOOK_SECRET;

  const bodyText = await req.text();
  const systemToken = createToken({ id: 'system', email: 'system@dealflow.ai', role: 'admin', name: 'System' });
  
  if (!secret || !signature) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 401 });
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(bodyText).digest('hex');
  if (digest !== signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = JSON.parse(bodyText);
  const { event, data } = payload;

  if (!db) return NextResponse.json({ received: true });

  if (event === 'transcript.data') {
    const { bot_id, transcript } = data;
    const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
    
    if (callSnapshot.empty) return NextResponse.json({ received: true });

    const callDoc = callSnapshot.docs[0];
    const callId = callDoc.id;
    const callData = callDoc.data();

    // Check if the speaker is an agent
    const persona = (PERSONAS as any)[callData.agentPersona] || PERSONAS.praneeth_assist;
    const speakerStr = String(transcript.speaker || "");
    const lowerSpeaker = speakerStr.toLowerCase();
    const isAgent =
      (!!speakerStr && speakerStr.includes(persona.name)) ||
      lowerSpeaker.includes("(ai)") ||
      lowerSpeaker.includes("dealflow.ai") ||
      lowerSpeaker.includes("dealflow") ||
      lowerSpeaker.includes("praneeth assist");

    // Append transcript segment
    const segment = {
      speaker: transcript.speaker || 'Unknown',
      text: transcript.text || transcript.words.map((w: any) => w.text).join(' '),
      timestamp: new Date().toISOString()
    };

    await db.collection('transcripts').doc(callId).set({
      callId,
      segments: admin.firestore.FieldValue.arrayUnion(segment),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const wordCount = String(segment.text || "").split(/\s+/).filter(Boolean).length;
    const isMeaningful = wordCount >= 4;
    if (!isAgent && isMeaningful) {
      await callDoc.ref.set(
        {
          firstParticipantAt: (callData as any)?.firstParticipantAt || new Date().toISOString(),
          participantSpeakers: admin.firestore.FieldValue.arrayUnion(segment.speaker),
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        },
        { merge: true }
      );
    } else {
      await callDoc.ref.set(
        {
          lastTranscriptAt: new Date().toISOString(),
          lastTranscriptAtMs: Date.now(),
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        },
        { merge: true }
      );
    }

    if (isAgent) return NextResponse.json({ received: true });

    // Process agent logic for client messages
    const transcriptDoc = await db.collection('transcripts').doc(callId).get();
    const segments = transcriptDoc.data()?.segments || [];
    const recentTranscript = segments.slice(-10).map((s: any) => `${s.speaker}: ${s.text}`);

    // Fetch lead and analysis context
    let leadData: any = null;
    if (callData.leadId) {
      const leadDoc = await db.collection('leads').doc(callData.leadId).get();
      leadData = leadDoc.data() || null;
    }

    let analysisData: any = null;
    if (callData.analysisId) {
      const analysisDoc = await db.collection('analyses').doc(callData.analysisId).get();
      analysisData = analysisDoc.exists ? analysisDoc.data() : null;
    } else if (callData.leadId) {
      const analysisSnapshot = await db.collection('analyses').where('leadId', '==', callData.leadId).limit(1).get();
      analysisData = analysisSnapshot.empty ? null : analysisSnapshot.docs[0].data();
    }

    const companyContext = {
      companyName: leadData?.companyName || callData.calendarEventTitle || 'the client',
      challenges: leadData?.challenges || [],
      currentTools: leadData?.currentTools || [],
      analysis: analysisData
    };

    const action = await agentDecide(
      recentTranscript,
      companyContext,
      callData.agentPersona,
      callData.currentStage,
      callData.leadId || 'global'
    );

    // Update call state
    await callDoc.ref.update({
      currentStage: action.stage_update,
      dealProbability: action.dealProbability,
      updatedAt: new Date().toISOString()
    });

    // Record signals/objections
    if (action.buyingSignal || action.objectionDetected) {
      const noteUpdate: any = {};
      if (action.buyingSignal) {
        noteUpdate.buyingSignals = admin.firestore.FieldValue.arrayUnion({
          timestamp: new Date().toISOString(),
          signal: action.content
        });
      }
      if (action.objectionDetected) {
        noteUpdate.objections = admin.firestore.FieldValue.arrayUnion({
          timestamp: new Date().toISOString(),
          objection: segment.text,
          response: action.content
        });
      }
      await db.collection('notes').doc(callId).set(noteUpdate, { merge: true });
    }

    // Execute actions
    if (action.action === 'speak' || action.action === 'handle_objection') {
      const audio = await textToSpeech(action.content, callData.agentPersona);
      await injectAudio(bot_id, audio);
    } else if (action.action === 'show_screen' && action.navigate_to) {
      await navigateTo(callId, action.navigate_to);
    } else if (action.action === 'close_deal') {
      await callDoc.ref.update({
        dealStatus: 'closed_won',
        dealProbability: 100
      });
      // Trigger post-call notification
      fetch(`${process.env.APP_URL}/api/notifications/post-call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${systemToken}`
        },
        body: JSON.stringify({ callId })
      }).catch(console.error);
    }

  } else if (event === 'bot.status_change' && data.status === 'joined_call') {
    const { bot_id } = data;
    const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
    
    if (!callSnapshot.empty) {
      const callDoc = callSnapshot.docs[0];
      const callData = callDoc.data();
      const alreadySpoken = !!callData?.openingLineSentAt;
      if (alreadySpoken) return NextResponse.json({ received: true });

      let companyName = callData.calendarEventTitle || 'the client';
      if (callData.leadId) {
        const leadDoc = await db.collection('leads').doc(callData.leadId).get();
        const leadData = leadDoc.data();
        companyName = leadData?.companyName || companyName;
      }

      const persona = (PERSONAS as any)[callData.agentPersona] || PERSONAS.praneeth_assist;
      const openingLine = persona.openingLine(companyName);
      
      const audio = await textToSpeech(openingLine, callData.agentPersona);
      await injectAudio(bot_id, audio);
      
      await callDoc.ref.update({
        status: 'in-progress',
        meetingStatus: 'joined',
        botJoinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
      });
    }
  } else if (event === 'bot.done') {
    const { bot_id } = data;
    const callSnapshot = await db.collection('calls').where('recallBotId', '==', bot_id).get();
    if (!callSnapshot.empty) {
      const callDoc = callSnapshot.docs[0];
      const callId = callDoc.id;
      
      await callDoc.ref.update({
        status: 'completed',
        meetingStatus: 'ended',
        endedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
      });
      await deleteSession(callId);
      
      // Trigger post-call notification
      fetch(`${process.env.APP_URL}/api/notifications/post-call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${systemToken}`
        },
        body: JSON.stringify({ callId })
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
