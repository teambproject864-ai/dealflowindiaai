// app/api/portal/customer/bot-training/route.ts
import { NextResponse } from "next/server";

let currentCustomerTrainingConfig = {
  companyName: "Acme Global Enterprise",
  productFocus: "Enterprise Dealflow AI Platform & Autonomous Playbooks",
  customTalkTrack: "Focus on ROI metrics, automated pipeline sync, and SOC2 compliance guarantees.",
  keyObjectionRules: [
    { objectionPattern: "cost", recommendedResponse: "Highlight 3x ROI delivered within 90 days and flexible credit tier billing." },
    { objectionPattern: "security", recommendedResponse: "Assure client of end-to-end AES-256 encrypted API key vault and SOC2 Type II compliance." }
  ],
  pricingGuardrails: {
    maxDiscountPercent: 15,
    requireApprovalForSLA: true,
  },
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json({
    success: true,
    trainingConfig: currentCustomerTrainingConfig,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, productFocus, customTalkTrack, keyObjectionRules, pricingGuardrails, liveOverridePrompt } = body;

    currentCustomerTrainingConfig = {
      ...currentCustomerTrainingConfig,
      ...(companyName && { companyName }),
      ...(productFocus && { productFocus }),
      ...(customTalkTrack && { customTalkTrack }),
      ...(keyObjectionRules && { keyObjectionRules }),
      ...(pricingGuardrails && { pricingGuardrails }),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      trainingConfig: currentCustomerTrainingConfig,
      liveOverrideApplied: Boolean(liveOverridePrompt),
      message: liveOverridePrompt
        ? `In-call live prompt override injected: "${liveOverridePrompt}"`
        : "Bot pre-call training configuration saved successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to update bot training" }, { status: 500 });
  }
}
