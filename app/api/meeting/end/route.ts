// app/api/meeting/end/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { endMeetingBot } from '@/lib/recall';
import { deleteSession } from '@/lib/screen-controller';

export async function POST(req: Request) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const callDoc = await db.collection('calls').doc(callId).get();
    if (!callDoc.exists) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const callData = callDoc.data();
    
    // End Recall bot and delete screen session in parallel
    const cleanupPromises: Promise<any>[] = [];
    if (callData?.recallBotId) {
      cleanupPromises.push(endMeetingBot(callData.recallBotId));
    }
    cleanupPromises.push(deleteSession(callId));
    
    await Promise.allSettled(cleanupPromises);

    await callDoc.ref.update({
      status: 'completed',
      meetingStatus: 'ended',
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
    });

    // Trigger post-call notification
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim();
    if (appUrl) {
      fetch(`${appUrl}/api/notifications/post-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Meeting end error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
