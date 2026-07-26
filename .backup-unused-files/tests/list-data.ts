
import { db } from "../lib/firebase-admin";

async function listLeadsAndAnalyses() {
  const callId = "ifNeccquC1HnAaK9a97q";
  const callDoc = await db.collection("calls").doc(callId).get();

  if (callDoc.exists) {
    console.log(`Call ${callId} exists! Data: ${JSON.stringify(callDoc.data())}`);
  } else {
    console.log(`Call ${callId} NOT found.`);
  }

  const leadsSnapshot = await db.collection("leads").limit(5).get();
  const analysesSnapshot = await db.collection("analyses").limit(5).get();
  const callsSnapshot = await db.collection("calls").limit(5).get();

  console.log("Existing Leads:");
  leadsSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
  });

  console.log("\nExisting Analyses:");
  analysesSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
  });

  console.log("\nExisting Calls:");
  callsSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
  });
}

listLeadsAndAnalyses().catch(console.error);
