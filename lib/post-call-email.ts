// lib/post-call-email.ts
import { getDb } from './firebase-admin';
import { sendEmailWithRetry } from './notifications';

// Resolve Firestore instance once at module load; individual functions also
// call getDb() lazily so they pick up a live instance even if Firebase was
// not yet initialised when this module was first imported.
const _db = getDb();
function db() {
  // Prefer the module-level instance, fall back to a fresh call.
  const instance = _db ?? getDb();
  if (!instance) throw new Error('Firestore is not configured');
  return instance;
}

export interface CallTranscript {
  callId: string;
  segments: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
}

export interface SentimentResult {
  rating: 'Positive' | 'Neutral' | 'Negative';
  score: number;
  positiveKeywords: string[];
  negativeKeywords: string[];
}

export interface PostCallAnalysis {
  callId: string;
  companyName: string;
  contactName: string;
  sentiment: SentimentResult;
  drawbacks: string[];
  improvements: string[];
  keyDiscussionPoints: string[];
  customerConcerns: string[];
  followUpRequirements: string[];
  overallSummary: string;
}

const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'love', 'perfect', 'fantastic', 'wonderful',
  'interested', 'excited', 'impressed', 'helpful', 'valuable', 'awesome',
  'brilliant', 'outstanding', 'superb', 'terrific', 'best', 'good', 'yes'
];

const NEGATIVE_KEYWORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointed', 'frustrated',
  'angry', 'upset', 'concerned', 'worried', 'difficult', 'problem', 'issue',
  'wrong', 'hate', 'dislike', 'complaint', 'fail', 'failure', 'cannot', "can't",
  "won't", 'never', 'disappointed', 'confused', 'unclear', 'expensive', 'slow'
];

const DRAWBACK_PATTERNS = [
  /price|cost|expensive|budget/i,
  /complex|complicated|difficult|hard/i,
  /integration|connect|compatibility/i,
  /support|customer service|response/i,
  /feature|missing|lack|need/i,
  /security|compliance|privacy/i,
  /training|learning curve/i
];

const CONCERN_PATTERNS = [
  /worried|concern|anxious|fear/i,
  /uncertain|unsure|doubt|hesitat/i,
  /question|unclear|confused|what if/i,
  /risk|danger|problem|issue/i
];

export async function analyzeSentiment(transcriptText: string): Promise<SentimentResult> {
  const lowerText = transcriptText.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  for (const keyword of POSITIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveCount += matches.length;
      if (!foundPositive.includes(keyword)) foundPositive.push(keyword);
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeCount += matches.length;
      if (!foundNegative.includes(keyword)) foundNegative.push(keyword);
    }
  }

  const netScore = positiveCount - negativeCount;
  const total = positiveCount + negativeCount;
  const normalizedScore = total > 0 ? (netScore / total) * 100 : 0;

  let rating: 'Positive' | 'Neutral' | 'Negative';
  if (normalizedScore > 20) {
    rating = 'Positive';
  } else if (normalizedScore < -20) {
    rating = 'Negative';
  } else {
    rating = 'Neutral';
  }

  return {
    rating,
    score: Math.max(-100, Math.min(100, Math.round(normalizedScore))),
    positiveKeywords: foundPositive.slice(0, 10),
    negativeKeywords: foundNegative.slice(0, 10)
  };
}

export function extractDrawbacks(transcriptText: string): string[] {
  const drawbacks: string[] = [];
  
  for (const pattern of DRAWBACK_PATTERNS) {
    const match = transcriptText.match(pattern);
    if (match) {
      const contextMatch = transcriptText.match(new RegExp(`.{0,50}${pattern.source}.{0,50}`, 'gi'));
      if (contextMatch && contextMatch[0]) {
        drawbacks.push(contextMatch[0].trim());
      }
    }
  }
  
  return [...new Set(drawbacks)].slice(0, 5);
}

export function extractImprovements(transcriptText: string): string[] {
  const improvements: string[] = [];
  const improvementPatterns = [
    /could improve|needs to|should consider|would help|would be better/i,
    /wish|hope|looking forward|prefer/i,
    /if only|it would be nice|in an ideal|ideal scenario/i
  ];

  for (const pattern of improvementPatterns) {
    const matches = transcriptText.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      for (const match of matches.slice(0, 2)) {
        improvements.push(match.trim());
      }
    }
  }

  return [...new Set(improvements)].slice(0, 5);
}

export function extractKeyDiscussionPoints(transcriptText: string): string[] {
  const points: string[] = [];
  const pointPatterns = [
    /discussed|talked about|mentioned|brought up|covered|reviewed/i,
    /key point|important|significant|notable|main takeaway/i,
    /decided|agreed|concluded|resolved|finalized/i
  ];

  const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    for (const pattern of pointPatterns) {
      if (pattern.test(sentence)) {
        points.push(sentence.trim());
        break;
      }
    }
  }

  return [...new Set(points)].slice(0, 5);
}

export function extractCustomerConcerns(transcriptText: string): string[] {
  const concerns: string[] = [];

  for (const pattern of CONCERN_PATTERNS) {
    const matches = transcriptText.match(new RegExp(`.{0,60}${pattern.source}.{0,60}`, 'gi'));
    if (matches) {
      for (const match of matches.slice(0, 2)) {
        concerns.push(match.trim());
      }
    }
  }

  return [...new Set(concerns)].slice(0, 5);
}

export function extractFollowUpRequirements(transcriptText: string): string[] {
  const followUps: string[] = [];
  const followUpPatterns = [
    /follow up|follow-up|next steps|action items|todo/i,
    /will send|will provide|will schedule|will call|will send/i,
    /need|required|must|has to|should|ought/i,
    /by friday|by monday|by end of|by next week|asap/i,
    /send|provide|share|schedule|call|email|contact/i
  ];

  for (const pattern of followUpPatterns) {
    const matches = transcriptText.match(new RegExp(`.{0,50}${pattern.source}.{0,50}`, 'gi'));
    if (matches) {
      for (const match of matches.slice(0, 2)) {
        followUps.push(match.trim());
      }
    }
  }

  return [...new Set(followUps)].slice(0, 5);
}

export async function generatePostCallAnalysis(
  callId: string,
  transcriptText: string,
  companyName: string,
  contactName: string
): Promise<PostCallAnalysis> {
  const sentiment = await analyzeSentiment(transcriptText);
  
  return {
    callId,
    companyName,
    contactName,
    sentiment,
    drawbacks: extractDrawbacks(transcriptText),
    improvements: extractImprovements(transcriptText),
    keyDiscussionPoints: extractKeyDiscussionPoints(transcriptText),
    customerConcerns: extractCustomerConcerns(transcriptText),
    followUpRequirements: extractFollowUpRequirements(transcriptText),
    overallSummary: generateSummary(transcriptText, sentiment, companyName)
  };
}

function generateSummary(transcriptText: string, sentiment: SentimentResult, companyName: string): string {
  const length = transcriptText.split(/\s+/).length;
  const duration = Math.max(1, Math.round(length / 2));
  
  let tone = 'productive';
  if (sentiment.rating === 'Positive') tone = 'highly positive and engaging';
  else if (sentiment.rating === 'Negative') tone = 'challenging with some concerns raised';
  
  return `This ${duration}-minute call with ${companyName} was ${tone}. The conversation covered key aspects of DealFlow.ai's value proposition. ${sentiment.positiveKeywords.length > sentiment.negativeKeywords.length ? 'Overall positive reception with interest in moving forward.' : 'Neutral to mixed reception requiring follow-up to address concerns.'}`;
}

export function generateProfessionalEmail(analysis: PostCallAnalysis): string {
  const sentimentColor = {
    Positive: '#22c55e',
    Neutral: '#f59e0b',
    Negative: '#ef4444'
  }[analysis.sentiment.rating];

  const sentimentBg = {
    Positive: '#f0fdf4',
    Neutral: '#fffbeb',
    Negative: '#fef2f2'
  }[analysis.sentiment.rating];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post-Call Analysis Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb; color: #374151;">
  
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px;">
      <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Post-Call Analysis Report</h1>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">DealFlow.ai x ${analysis.companyName}</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Contact</p>
        <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0;">${analysis.contactName}</p>
      </div>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Company</p>
        <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0;">${analysis.companyName}</p>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Sentiment Analysis</h2>
      <div style="background: ${sentimentBg}; border: 1px solid ${sentimentColor}; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: ${sentimentColor}; font-size: 32px; font-weight: 700; margin: 0 0 8px 0;">${analysis.sentiment.rating}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Score: ${analysis.sentiment.score}/100</p>
      </div>
      ${analysis.sentiment.positiveKeywords.length > 0 ? `
      <div style="margin-top: 12px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">Positive Signals:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${analysis.sentiment.positiveKeywords.map(k => `<span style="background: #f0fdf4; color: #166534; padding: 4px 10px; border-radius: 16px; font-size: 12px;">${k}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      ${analysis.sentiment.negativeKeywords.length > 0 ? `
      <div style="margin-top: 12px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">Areas of Concern:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${analysis.sentiment.negativeKeywords.map(k => `<span style="background: #fef2f2; color: #991b1b; padding: 4px 10px; border-radius: 16px; font-size: 12px;">${k}</span>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    ${analysis.drawbacks.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Drawbacks & Challenges Identified</h2>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
        ${analysis.drawbacks.map(d => `<li style="margin-bottom: 8px;">${d}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.improvements.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Areas for Improvement</h2>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
        ${analysis.improvements.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.keyDiscussionPoints.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Key Discussion Points</h2>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
        ${analysis.keyDiscussionPoints.map(p => `<li style="margin-bottom: 8px;">${p}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.customerConcerns.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Customer Concerns</h2>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
        ${analysis.customerConcerns.map(c => `<li style="margin-bottom: 8px;">${c}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.followUpRequirements.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Follow-Up Requirements</h2>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
        ${analysis.followUpRequirements.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px 20px; margin-bottom: 32px;">
      <h2 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Overall Summary</h2>
      <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.6;">${analysis.overallSummary}</p>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Generated by the Agent Learning System</p>
      <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">${new Date().toISOString()}</p>
    </div>

  </div>

</body>
</html>
  `.trim();
}

export async function processAndSendPostCallEmail(
  callId: string,
  stakeholderEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [callDoc, transcriptDoc, notesDoc] = await Promise.all([
      db().collection('calls').doc(callId).get(),
      db().collection('transcripts').doc(callId).get(),
      db().collection('notes').doc(callId).get()
    ]);

    if (!callDoc.exists) {
      return { success: false, error: 'Call not found' };
    }

    const callData = callDoc.data() || {};
    const transcriptData = transcriptDoc.data();
    const notesData = notesDoc.data() || {};

    const segments = transcriptData?.segments || [];
    if (segments.length === 0) {
      return { success: false, error: 'No transcript data available' };
    }

    const fullTranscriptText = segments.map((s: any) => `${s.speaker}: ${s.text}`).join(' ');

    let leadData: any = null;
    if (callData.leadId) {
      const leadDoc = await db().collection('leads').doc(callData.leadId).get();
      leadData = leadDoc.data() || null;
    }

    const companyName = leadData?.companyName || callData.calendarEventTitle || 'the client';
    const contactName = leadData?.contactName || 'the contact';

    const analysis = await generatePostCallAnalysis(callId, fullTranscriptText, companyName, contactName);

    const emailHtml = generateProfessionalEmail(analysis);
    const subject = `Post-Call Analysis: DealFlow.ai x ${companyName}`;

    await sendEmailWithRetry({
      to: stakeholderEmail,
      subject,
      body: emailHtml
    });

    await db().collection('post_call_reports').add({
      callId,
      analysis,
      sentTo: stakeholderEmail,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });

    console.log(`[PostCallEmail] Successfully sent report for call ${callId} to ${stakeholderEmail}`);
    return { success: true };

  } catch (error: any) {
    console.error(`[PostCallEmail] Failed to process call ${callId}:`, error);
    
    await db().collection('post_call_reports').add({
      callId,
      sentTo: stakeholderEmail,
      sentAt: new Date().toISOString(),
      status: 'failed',
      error: error.message
    });

    return { success: false, error: error.message };
  }
}

export async function getCompletedCallsForDay(): Promise<Array<{ callId: string; leadId?: string }>> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const snapshot = await db().collection('calls')
    .where('status', '==', 'completed')
    .where('updatedAtMs', '>=', startOfDay.getTime())
    .where('updatedAtMs', '<=', endOfDay.getTime())
    .get();

  return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    callId: doc.id,
    leadId: doc.data().leadId
  }));
}

export async function executeEndOfDayEmailRun(stakeholderEmail: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  console.log(`[PostCallEmail] Starting end-of-day email run for ${stakeholderEmail}`);

  const completedCalls = await getCompletedCallsForDay();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const call of completedCalls) {
    results.processed++;
    const result = await processAndSendPostCallEmail(call.callId, stakeholderEmail);
    
    if (result.success) {
      results.succeeded++;
    } else {
      results.failed++;
      if (result.error) results.errors.push(`${call.callId}: ${result.error}`);
    }
  }

  await db().collection('post_call_batch_runs').add({
    email: stakeholderEmail,
    processedAt: new Date().toISOString(),
    ...results
  });

  console.log(`[PostCallEmail] End-of-day run complete: ${results.succeeded}/${results.processed} succeeded`);
  return results;
}

export async function sendPostCallMOMEmail(params: {
  recipients: string[];
  mom: import('./call-bot/mom-generator').MinutesOfMeeting;
}): Promise<{ success: boolean; dispatchedAt: string; recipients: string[] }> {
  console.log(`[PostCallEmail] Dispatching 15-minute MOM email for Call ID ${params.mom.callId} to ${params.recipients.join(', ')}`);

  const subject = `[Minutes of Meeting] ${params.mom.callScenario.toUpperCase()} Call - ${params.mom.callId}`;
  const htmlBody = params.mom.htmlDocument;

  for (const email of params.recipients) {
    try {
      await sendEmailWithRetry({ to: email, subject, body: htmlBody });
    } catch (err: any) {
      console.warn(`[PostCallEmail] Failed to send email to ${email}:`, err?.message || err);
    }
  }

  return {
    success: true,
    dispatchedAt: new Date().toISOString(),
    recipients: params.recipients,
  };
}

