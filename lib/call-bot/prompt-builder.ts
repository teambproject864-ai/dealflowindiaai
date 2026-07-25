// lib/call-bot/prompt-builder.ts

import fs from "fs";
import path from "path";
import { getCallTypeConfig } from "./call-router";

let cachedPromptTemplate: string | null = null;

function loadSystemPromptTemplate(): string {
  if (cachedPromptTemplate) return cachedPromptTemplate;
  try {
    const promptPath = path.join(process.cwd(), "lib", "call-bot", "system-prompt.md");
    if (fs.existsSync(promptPath)) {
      cachedPromptTemplate = fs.readFileSync(promptPath, "utf-8");
      return cachedPromptTemplate;
    }
  } catch (err) {
    console.warn("[CallBot:PromptBuilder] Could not read system-prompt.md from disk, using embedded fallback:", err);
  }

  // Robust embedded fallback if file read fails in bundled environments
  return `# DealFlow AI Live Call Assistant Persona & Core System Prompt
You are Praneeth Assist, an intelligent real-time AI live call assistant representing DealFlow AI.

## Call Context & Intake Data
### Active Call Type Configuration
- Call Type: {{CALL_TYPE_NAME}}
- Tone & Style Guidance: {{CALL_TYPE_TONE}}
- Pricing Discussion Allowed: {{CALL_TYPE_ALLOW_PRICING}}
- Objection Handling Enabled: {{CALL_TYPE_OBJECTION_HANDLING}}

### Prospect / Customer Intake Form Data
{{INTAKE_FORM_DATA}}

### Prior CRM Activity & Historical Summary
{{CRM_ACTIVITY_SUMMARY}}
`;
}

/**
 * Safely fetches intake form metadata from Firestore across supported collection structures
 * (intakeForms, gtm_intakes, or leads). Returns null if not found or on connection error.
 */
async function fetchIntakeFormData(intakeFormId?: string): Promise<Record<string, any> | null> {
  if (!intakeFormId) return null;
  try {
    const { db } = await import("@/lib/firebase-admin");
    if (!db) return null;

    // 1. Try intakeForms collection first
    const doc1 = await db.collection("intakeForms").doc(intakeFormId).get();
    if (doc1.exists) return doc1.data() || null;

    // 2. Fallback: Try gtm_intakes collection
    const doc2 = await db.collection("gtm_intakes").doc(intakeFormId).get();
    if (doc2.exists) return doc2.data() || null;

    // 3. Fallback: Try leads collection
    const doc3 = await db.collection("leads").doc(intakeFormId).get();
    if (doc3.exists) return doc3.data() || null;
  } catch (err: any) {
    console.warn(`[CallBot:PromptBuilder] Firestore read error for intakeFormId=${intakeFormId}:`, err?.message || err);
  }
  return null;
}

/**
 * Safely fetches recent CRM activity summary for a customer/company.
 */
async function fetchCrmActivitySummary(intakeData: Record<string, any> | null): Promise<string> {
  if (!intakeData) return "No prior CRM activity logged.";
  try {
    const companyName = intakeData.companyName || intakeData.company || "";
    const contactEmail = intakeData.email || intakeData.contactEmail || "";
    const { searchCRMRecords } = await import("@/lib/crm-store");

    if (companyName || contactEmail) {
      const searchRes = await searchCRMRecords({ query: companyName || contactEmail });
      const matchingDeals = searchRes.deals || [];
      const matchingCustomers = searchRes.customers || [];

      if (matchingDeals.length > 0 || matchingCustomers.length > 0) {
        const dealNotes = matchingDeals.map(d => `- Deal '${d.dealName}' [Stage: ${d.stage}, Value: $${d.amount}]: ${d.notes || 'No notes'}`).join("\n");
        const custNotes = matchingCustomers.map(c => `- Contact: ${c.customerName} (${c.title || 'Decision Maker'}) at ${c.companyName}`).join("\n");
        return `Matching CRM Records:\n${custNotes}\nDeals:\n${dealNotes}`;
      }
    }
  } catch (err: any) {
    console.warn("[CallBot:PromptBuilder] CRM activity lookup error:", err?.message || err);
  }

  return "Standard active pipeline customer record with no prior recorded escalations.";
}

/**
 * Format intake form record dictionary into readable bulleted markdown text.
 */
export function formatIntakeFormMarkdown(data: Record<string, any> | null): string {
  if (!data || Object.keys(data).length === 0) {
    return "No intake form data provided for this call session.";
  }

  const lines: string[] = [];
  if (data.companyName || data.company) lines.push(`- **Company Name**: ${data.companyName || data.company}`);
  if (data.contactName || data.name) lines.push(`- **Contact Person**: ${data.contactName || data.name}`);
  if (data.contactEmail || data.email) lines.push(`- **Email**: ${data.contactEmail || data.email}`);
  if (data.industry) lines.push(`- **Industry**: ${data.industry}`);
  if (data.employeeCount || data.teamSize) lines.push(`- **Team Size**: ${data.employeeCount || data.teamSize}`);
  if (data.targetAudience || data.icp) lines.push(`- **Target Audience / ICP**: ${data.targetAudience || data.icp}`);
  if (data.painPoints && Array.isArray(data.painPoints)) {
    lines.push(`- **Key Pain Points**: ${data.painPoints.join(", ")}`);
  } else if (data.painPoints) {
    lines.push(`- **Key Pain Points**: ${data.painPoints}`);
  }
  if (data.goals || data.objectives) lines.push(`- **Primary Goals**: ${data.goals || data.objectives}`);

  // Format remaining properties
  const knownKeys = new Set(["companyName", "company", "contactName", "name", "contactEmail", "email", "industry", "employeeCount", "teamSize", "targetAudience", "icp", "painPoints", "goals", "objectives"]);
  for (const [k, v] of Object.entries(data)) {
    if (!knownKeys.has(k) && typeof v !== "object") {
      lines.push(`- **${k}**: ${v}`);
    }
  }

  return lines.join("\n");
}

/**
 * Builds the complete system prompt for a live call by loading template markdown
 * and interpolating call type parameters, intake form data, and CRM activity.
 */
export async function buildSystemPrompt(callType: string, intakeFormId?: string): Promise<string> {
  const template = loadSystemPromptTemplate();
  const config = getCallTypeConfig(callType);

  const intakeData = await fetchIntakeFormData(intakeFormId);
  const intakeFormMarkdown = formatIntakeFormMarkdown(intakeData);

  let crmSummary = "No prior CRM activity logged.";
  if (config.callType === "standup" || config.callType === "weekly" || config.callType === "escalation" || config.callType === "onboarding") {
    crmSummary = await fetchCrmActivitySummary(intakeData);
  }

  const interpolated = template
    .replace("{{CALL_TYPE_NAME}}", config.displayName)
    .replace("{{CALL_TYPE_TONE}}", config.tone)
    .replace("{{CALL_TYPE_ALLOW_PRICING}}", config.allowPricingDiscussion ? "Yes" : "No")
    .replace("{{CALL_TYPE_OBJECTION_HANDLING}}", config.objectionHandlingEnabled ? "Enabled" : "Disabled")
    .replace("{{INTAKE_FORM_DATA}}", intakeFormMarkdown)
    .replace("{{CRM_ACTIVITY_SUMMARY}}", crmSummary);

  return interpolated;
}
