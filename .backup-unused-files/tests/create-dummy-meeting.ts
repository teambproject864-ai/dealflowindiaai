
import { db } from "../lib/firebase-admin";

async function createDummyMeeting() {
  console.log("Creating dummy lead...");
  const leadRef = await db.collection("leads").add({
    companyName: "Dummy Corp",
    contactName: "John Doe",
    contactEmail: "john@dummy.com",
    challenges: ["Low conversion", "Manual follow-ups"],
    currentTools: ["Spreadsheets", "Email"],
    createdAt: new Date(),
    analysisId: "",
  });
  const leadId = leadRef.id;
  console.log(`Lead created with ID: ${leadId}`);

  console.log("Creating dummy analysis...");
  const analysisRef = await db.collection("analyses").add({
    leadId,
    healthScore: 45,
    painPoints: [
      { issue: "Manual outreach", severity: "high", impact: "$100k loss" },
      { issue: "No lead tracking", severity: "medium", impact: "Leads falling through cracks" }
    ],
    missedRevenue: "$100k/year",
    stackGaps: ["No CRM", "No Automation"],
    createdAt: new Date(),
  });
  const analysisId = analysisRef.id;
  console.log(`Analysis created with ID: ${analysisId}`);

  // Update lead with analysisId
  await leadRef.update({ analysisId });

  console.log("Creating dummy meeting (call)...");
  const callRef = await db.collection("calls").add({
    leadId,
    analysisId,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    guests: ["john@dummy.com"],
    status: "scheduled",
    callMode: "calendar",
    agentPersona: "praneeth_assist",
    currentStage: "intro",
    dealProbability: 50,
    dealStatus: "interested",
    scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
    updatedAt: new Date().toISOString(),
    updatedAtMs: Date.now(),
  });
  const callId = callRef.id;
  console.log(`Meeting (call) created with ID: ${callId}`);

  console.log("\nDummy meeting setup complete!");
  console.log(`Lead ID: ${leadId}`);
  console.log(`Analysis ID: ${analysisId}`);
  console.log(`Call ID: ${callId}`);
}

createDummyMeeting().catch(error => {
  console.error("Error creating dummy meeting:", error);
  process.exit(1);
});
