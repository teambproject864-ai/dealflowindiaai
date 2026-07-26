// app/api/portal/customer/credits/route.ts
import { NextResponse } from "next/server";

let demoCreditsBalance = 2450;
const demoTransactionHistory = [
  { id: "tx-1", type: "topup", amount: 500, costUsd: 50, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
  { id: "tx-2", type: "usage", amount: -50, description: "Dealflow Bot Meeting Analysis", date: new Date(Date.now() - 5 * 60 * 1000).toISOString(), status: "completed" },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    credits: {
      balance: demoCreditsBalance,
      currency: "USD",
      tier: "Enterprise Tier",
      transactions: demoTransactionHistory,
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, creditTier = 100 } = body;

    const creditAmount = creditTier * 10; // $100 -> 1000 credits
    demoCreditsBalance += creditAmount;

    const newTx = {
      id: `tx-${Date.now()}`,
      type: "topup",
      amount: creditAmount,
      costUsd: creditTier,
      date: new Date().toISOString(),
      status: "completed",
    };
    demoTransactionHistory.unshift(newTx);

    return NextResponse.json({
      success: true,
      newBalance: demoCreditsBalance,
      transaction: newTx,
      message: `Successfully added ${creditAmount} credits ($${creditTier} USD).`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to add credits" }, { status: 500 });
  }
}
