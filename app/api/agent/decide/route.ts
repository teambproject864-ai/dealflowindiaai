import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { agentDecide } from '@/lib/agent-brain';
import { textToSpeech } from '@/lib/elevenlabs';
import { injectAudio } from '@/lib/recall';
import { navigateTo } from '@/lib/screen-controller';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin", "agent"]);
    if (authResult.errorResponse) return authResult.errorResponse;
    const user = authResult.user!;

    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const [callDoc, transcriptDoc] = await Promise.all([
      db.collection('calls').doc(callId).get(),
      db.collection('transcripts').doc(callId).get()
    ]);

    if (!callDoc.exists) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const callData = callDoc.data();
    if (user.role !== "admin" && callData?.assignedAgentId && callData.assignedAgentId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not assigned agent for this call" }, { status: 403 });
    }
    const transcriptData = transcriptDoc.data();
    const segments = transcriptData?.segments || [];
    const recentLines = segments.slice(-10).map((s: any) => `${s.speaker}: ${s.text}`);

    const leadDoc = await db.collection('leads').doc(callData?.leadId).get();
    const analysisDoc = await db.collection('analyses').where('leadId', '==', callData?.leadId).limit(1).get();

    const companyContext = {
      companyName: leadDoc.data()?.companyName || 'the client',
      challenges: leadDoc.data()?.challenges || [],
      currentTools: leadDoc.data()?.currentTools || [],
      analysis: analysisDoc.empty ? null : analysisDoc.docs[0].data()
    };

    const action = await agentDecide(
      recentLines,
      companyContext,
      callData?.agentPersona,
      callData?.currentStage,
      callData?.leadId || 'global'
    );

    await callDoc.ref.update({
      currentStage: action.stage_update,
      dealProbability: action.dealProbability,
      updatedAt: new Date().toISOString()
    });

    if (action.action === 'speak' || action.action === 'handle_objection') {
      const audio = await textToSpeech(action.content, callData?.agentPersona);
      if (callData?.recallBotId) {
        await injectAudio(callData.recallBotId, audio);
      }
    } else if (action.action === 'show_screen' && action.navigate_to) {
      await navigateTo(callId, action.navigate_to);
    }

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error('Agent decision error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
