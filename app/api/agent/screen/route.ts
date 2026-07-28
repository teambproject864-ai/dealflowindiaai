import { NextResponse } from 'next/server';
import { navigateTo, getScreenshot } from '@/lib/screen-controller';
import { requireAuth } from '@/lib/auth';
import { validateSafeExternalUrl } from '@/lib/ssrf-guard';

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin", "agent"]);
    if (authResult.errorResponse) return authResult.errorResponse;

    const { callId, url } = await req.json();
    if (!callId || !url) {
      return NextResponse.json({ error: 'Missing callId or url' }, { status: 400 });
    }

    const urlCheck = validateSafeExternalUrl(url);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: `Invalid url: ${urlCheck.error}` }, { status: 400 });
    }

    await navigateTo(callId, url);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin", "agent"]);
    if (authResult.errorResponse) return authResult.errorResponse;

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get('callId');
    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }
    const screenshot = await getScreenshot(callId);
    return NextResponse.json({ screenshot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
