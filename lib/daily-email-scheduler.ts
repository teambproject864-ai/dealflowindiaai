// lib/daily-email-scheduler.ts
import { db } from './firebase-admin';
import { sendEmailWithRetry } from './notifications';
import { CallRecord, SummaryRecord } from './types';

export interface DailyEmailConfig {
  recipientEmail: string | string[];
  senderEmail?: string;
  senderName?: string;
  subject?: string;
  bodyTemplate?: (date: Date) => string;
  enabled?: boolean;
}

export interface EmailLogEntry {
  id?: string;
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  recipient: string | string[];
  subject: string;
  error?: string;
  retryCount: number;
  timezone: string;
}

export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: EmailLogEntry;
  totalSent: number;
  totalFailed: number;
  lastError?: string;
}

const DEFAULT_CONFIG: DailyEmailConfig = {
  recipientEmail: ['praneethburada@gmail.com', 'praneeth@growstack.ai', 'teambproject864@gmail.com'],
  senderEmail: 'noreply@dealflow.ai',
  senderName: 'Dealflow.ai',
  subject: 'Daily Update from Dealflow.ai',
  enabled: true
};

const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;

function getISTTime(date: Date = new Date()): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (IST_OFFSET_HOURS * 3600000) + (IST_OFFSET_MINUTES * 60000));
}

function isIST7PM(date: Date = new Date()): boolean {
  const ist = getISTTime(date);
  return ist.getHours() === 19 && ist.getMinutes() === 0;
}

function getNextIST7PM(fromDate: Date = new Date()): Date {
  const ist = getISTTime(fromDate);
  const nextIST = new Date(ist);
  nextIST.setHours(19, 0, 0, 0);
  
  if (ist.getHours() >= 19) {
    nextIST.setDate(nextIST.getDate() + 1);
  }
  
  return new Date(nextIST.getTime() - (IST_OFFSET_HOURS * 3600000) - (IST_OFFSET_MINUTES * 60000));
}

function getISTDateString(date: Date = new Date()): string {
  const ist = getISTTime(date);
  return ist.toISOString().split('T')[0];
}

async function logEmailEntry(entry: EmailLogEntry): Promise<void> {
  try {
    if (!db) return;
    const docRef = await db.collection('daily_email_logs').add({
      ...entry,
      createdAt: new Date().toISOString()
    });
    entry.id = docRef.id;
  } catch (error) {
    console.error('[DailyEmailScheduler] Failed to log email entry:', error);
  }
}

async function updateEmailLogEntry(id: string, updates: Partial<EmailLogEntry>): Promise<void> {
  try {
    if (!db) return;
    await db.collection('daily_email_logs').doc(id).update(updates);
  } catch (error) {
    console.error('[DailyEmailScheduler] Failed to update email log:', error);
  }
}

export async function sendDailyEmail(
  config: DailyEmailConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; logEntry?: EmailLogEntry; error?: string }> {
  const recipient = config.recipientEmail || DEFAULT_CONFIG.recipientEmail;
  const subject = config.subject || DEFAULT_CONFIG.subject || 'Daily Update from Dealflow.ai';
  
  const logEntry: EmailLogEntry = {
    scheduledFor: getISTDateString(),
    status: 'pending',
    recipient,
    subject,
    retryCount: 0,
    timezone: 'IST (UTC+5:30)'
  };

  await logEmailEntry(logEntry);

  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIso = yesterday.toISOString();

    let calls: CallRecord[] = [];
    let summaries: SummaryRecord[] = [];
    let errors: any[] = [];

    if (db) {
      // Fetch activities from past 24h
      const [callsSnapshot, summariesSnapshot, logsSnapshot] = await Promise.all([
        db.collection('calls').where('updatedAt', '>=', yesterdayIso).get(),
        db.collection('summaries').where('sentAt', '>=', yesterdayIso).get(),
        db.collection('audit_logs').where('createdAt', '>=', yesterdayIso).limit(50).get()
      ]);

      calls = callsSnapshot.docs.map(doc => doc.data() as CallRecord);
      summaries = summariesSnapshot.docs.map(doc => doc.data() as SummaryRecord);
      errors = logsSnapshot.docs
        .map(doc => doc.data())
        .filter(log => log.type?.includes('fail') || log.type?.includes('error') || log.error);
    }

    const body = config.bodyTemplate 
      ? config.bodyTemplate(new Date())
      : generateDetailedReportBody(new Date(), calls, summaries, errors);

    const istDate = getISTDateString(new Date());
    const finalSubject = `Daily Agent Report – ${istDate}`;

    await sendEmailWithRetry({
      to: recipient,
      subject: finalSubject,
      body
    });

    logEntry.status = 'sent';
    logEntry.sentAt = new Date().toISOString();
    await updateEmailLogEntry(logEntry.id!, logEntry);

    console.log(`[DailyEmailScheduler] Successfully sent daily email to ${recipient}`);
    return { success: true, logEntry };

  } catch (error: any) {
    logEntry.status = 'failed';
    logEntry.error = error.message || 'Unknown error';
    await updateEmailLogEntry(logEntry.id!, logEntry);
    
    console.error(`[DailyEmailScheduler] Failed to send daily email:`, error);
    return { success: false, logEntry, error: error.message };
  }
}

export async function sendDailyEmailWithFallback(
  config: DailyEmailConfig = DEFAULT_CONFIG,
  fallbackEmail?: string
): Promise<{ success: boolean; method: 'primary' | 'fallback' | 'none'; logEntry?: EmailLogEntry; error?: string }> {
  const primaryResult = await sendDailyEmail(config);
  
  if (primaryResult.success) {
    return { success: true, method: 'primary', logEntry: primaryResult.logEntry };
  }

  if (fallbackEmail) {
    console.log(`[DailyEmailScheduler] Primary method failed, attempting fallback to ${fallbackEmail}`);
    
    const fallbackConfig = { ...config, recipientEmail: fallbackEmail };
    const fallbackResult = await sendDailyEmail(fallbackConfig);
    
    if (fallbackResult.success) {
      return { success: true, method: 'fallback', logEntry: fallbackResult.logEntry };
    }
    
    return { 
      success: false, 
      method: 'none', 
      logEntry: fallbackResult.logEntry,
      error: `Primary: ${primaryResult.error}, Fallback: ${fallbackResult.error}` 
    };
  }

  return { 
    success: false, 
    method: 'none', 
    logEntry: primaryResult.logEntry,
    error: primaryResult.error 
  };
}

function generateDetailedReportBody(date: Date, calls: CallRecord[], summaries: SummaryRecord[], errors: any[]): string {
  const ist = getISTTime(date);
  const formattedDate = ist.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });

  const successfulCalls = calls.filter(c => c.status === 'completed').length;
  const failedCalls = calls.filter(c => c.status === 'failed').length;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Agent Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #F3F4F6;">
  
  <div style="background: #1E3A5F; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Daily Agent Report</h1>
    <p style="color: #93C5FD; margin: 10px 0 0; font-size: 16px;">${formattedDate} IST</p>
  </div>
  
  <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
    
    <!-- Summary Stats -->
    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; background: #F0FDF4; padding: 20px; border-radius: 8px; border: 1px solid #BBF7D0; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #166534;">${calls.length}</div>
        <div style="font-size: 14px; color: #166534;">Total Calls</div>
      </div>
      <div style="flex: 1; background: #EFF6FF; padding: 20px; border-radius: 8px; border: 1px solid #BFDBFE; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #1E40AF;">${summaries.length}</div>
        <div style="font-size: 14px; color: #1E40AF;">Summaries Sent</div>
      </div>
      <div style="flex: 1; background: #FEF2F2; padding: 20px; border-radius: 8px; border: 1px solid #FECACA; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #991B1B;">${errors.length}</div>
        <div style="font-size: 14px; color: #991B1B;">Errors Flagged</div>
      </div>
    </div>

    <!-- Call Activity -->
    <h3 style="color: #1E3A5F; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">Call Activity (Past 24h)</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: #F9FAFB; text-align: left;">
          <th style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Time (UTC)</th>
          <th style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Lead ID</th>
          <th style="padding: 12px; border-bottom: 1px solid #E5E7EB;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${calls.length > 0 ? calls.map(c => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #F3F4F6; font-size: 14px;">${new Date(c.createdAt).toLocaleTimeString()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #F3F4F6; font-size: 14px;">${c.leadId}</td>
            <td style="padding: 12px; border-bottom: 1px solid #F3F4F6;">
              <span style="padding: 4px 8px; border-radius: 9999px; font-size: 12px; background: ${c.status === 'completed' ? '#DCFCE7' : '#FEE2E2'}; color: ${c.status === 'completed' ? '#166534' : '#991B1B'};">
                ${c.status}
              </span>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6B7280;">No call activity recorded.</td></tr>'}
      </tbody>
    </table>

    <!-- System Health / Errors -->
    <h3 style="color: #1E3A5F; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">System Health & Errors</h3>
    <div style="background: #F9FAFB; padding: 15px; border-radius: 8px;">
      ${errors.length > 0 ? errors.map(e => `
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #E5E7EB;">
          <strong style="color: #991B1B; font-size: 14px;">[${e.type}]</strong>
          <span style="font-size: 14px; color: #4B5563;">${e.error || e.reason || 'Unknown error'}</span>
          <div style="font-size: 12px; color: #9CA3AF;">${new Date(e.createdAt).toLocaleString()}</div>
        </div>
      `).join('') : '<div style="text-align: center; color: #059669; padding: 10px;">All systems operational. No errors detected.</div>'}
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">This is an automated report from Dealflow.ai.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  try {
    if (!db) {
      return { isRunning: false, totalSent: 0, totalFailed: 0 };
    }
    const lastRunSnapshot = await db.collection('daily_email_logs')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const statsSnapshot = await db.collection('daily_email_logs')
      .where('status', 'in', ['sent', 'failed'])
      .get();

    let totalSent = 0;
    let totalFailed = 0;
    let lastError: string | undefined;

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'sent') totalSent++;
      else if (data.status === 'failed') {
        totalFailed++;
        if (!lastError) lastError = data.error;
      }
    });

    const lastRun = lastRunSnapshot.empty ? undefined : lastRunSnapshot.docs[0].data() as EmailLogEntry;

    return {
      isRunning: false,
      lastRun,
      totalSent,
      totalFailed,
      lastError
    };
  } catch (error) {
    console.error('[DailyEmailScheduler] Failed to get scheduler status:', error);
    return {
      isRunning: false,
      totalSent: 0,
      totalFailed: 0,
      lastError: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getEmailLogs(limit: number = 30): Promise<EmailLogEntry[]> {
  try {
    if (!db) return [];
    const snapshot = await db.collection('daily_email_logs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as EmailLogEntry);
  } catch (error) {
    console.error('[DailyEmailScheduler] Failed to get email logs:', error);
    return [];
  }
}

export function checkSchedulingConditions(): { shouldRun: boolean; nextRun: Date; currentIST: Date } {
  const now = new Date();
  const ist = getISTTime(now);
  const shouldRun = isIST7PM(now);
  const nextRun = getNextIST7PM(now);

  return {
    shouldRun,
    nextRun,
    currentIST: ist
  };
}

export function calculateNextRunDuration(): number {
  const nextRun = getNextIST7PM();
  return nextRun.getTime() - Date.now();
}
