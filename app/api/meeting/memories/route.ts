// app/api/meeting/memories/route.ts
import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/firebase-admin';
import { getRelevantMemories } from '@/lib/mempalace';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get('callId');

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
    const memories = await getRelevantMemories(callData?.leadId || 'global');

    return NextResponse.json({ memories });
  } catch (error: any) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
