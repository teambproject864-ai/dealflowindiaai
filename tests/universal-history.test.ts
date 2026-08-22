// tests/universal-history.test.ts
import assert from "assert";
import { 
  queryUniversalHistory, 
  recordUniversalHistoryEvent 
} from "../lib/history/universal-history-service";
import { 
  exportHistoryToCSV, 
  generateHistoryExport 
} from "../lib/history/history-export";

async function runUniversalHistoryTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING UNIVERSAL ACCESS HISTORY TEST SUITE");
  console.log("=======================================================\n");

  // 1. Ingestion & Event Recording
  console.log("--> [1/5] Testing Universal History Ingestion & Cryptographic Hash...");
  const newEvent = recordUniversalHistoryEvent({
    category: "whatsapp_openwa",
    title: "Live Negotiation Concession Agreed",
    description: "Client accepted 10% discount with annual upfront commitment via WhatsApp OpenWA.",
    actorId: "agent-101",
    actorName: "Alex Rivera",
    actorRole: "agent",
    organizationId: "org-acme",
    organizationName: "Acme Corporation",
    targetEntityId: "deal-101",
    status: "verified",
    metadata: {
      discount: "10%",
      paymentTerms: "Annual Upfront",
    },
  });

  assert.ok(newEvent.id.startsWith("hist-"));
  assert.ok(newEvent.complianceHash.length === 64, "SHA-256 compliance hash generated");
  console.log("  ✅ Universal history event recorded with ID:", newEvent.id);

  // 2. Admin Global Query (All Orgs & Security Audits)
  console.log("\n--> [2/5] Testing Admin Global Access Control...");
  const adminRes = await queryUniversalHistory({
    userRole: "admin",
  });
  assert.ok(adminRes.items.length >= 6, "Admin sees all cross-system events");
  const hasSecurityEvent = adminRes.items.some(i => i.category === "security_audit");
  assert.strictEqual(hasSecurityEvent, true, "Admin can view security audits");
  console.log(`  ✅ Admin RBAC verified: ${adminRes.items.length} total events visible.`);

  // 3. Customer Tenant Isolation RBAC
  console.log("\n--> [3/5] Testing Customer Tenant Isolation & Privacy Gates...");
  const custRes = await queryUniversalHistory({
    userRole: "customer",
    userOrgId: "org-acme",
  });
  
  // Customer must only see org-acme records, and NO security_audit records
  const anyNonAcme = custRes.items.some(i => i.organizationId !== "org-acme");
  assert.strictEqual(anyNonAcme, false, "Customer cannot see other tenants' data");

  const anySecurityAudit = custRes.items.some(i => i.category === "security_audit");
  assert.strictEqual(anySecurityAudit, false, "Customer cannot access internal security audit logs");
  console.log("  ✅ Customer tenant isolation & privacy rules strictly enforced.");

  // 4. Search and Multi-Criteria Filtering
  console.log("\n--> [4/5] Testing Search & Category Filtering...");
  const filteredRes = await queryUniversalHistory({
    userRole: "admin",
    category: "whatsapp_openwa",
    searchQuery: "negotiation",
  });
  assert.ok(filteredRes.items.length > 0, "Filtered search returned results");
  assert.strictEqual(filteredRes.items.every(i => i.category === "whatsapp_openwa"), true);
  console.log(`  ✅ Search & filter verified (${filteredRes.items.length} matching OpenWA negotiation records).`);

  // 5. CSV and JSON Export Generation
  console.log("\n--> [5/5] Testing CSV and JSON Export Package Generation...");
  const csvExport = generateHistoryExport(adminRes.items, "csv");
  assert.strictEqual(csvExport.format, "csv");
  assert.strictEqual(csvExport.mimeType, "text/csv;charset=utf-8;");
  assert.ok(csvExport.data.includes("ID,Timestamp,Category,Title"), "CSV headers present");
  assert.ok(csvExport.manifestHash.length === 64, "SHA-256 manifest hash generated");

  const jsonExport = generateHistoryExport(adminRes.items, "json");
  assert.strictEqual(jsonExport.format, "json");
  assert.ok(jsonExport.data.includes('"exportVersion": "1.0.0"'), "JSON manifest present");
  console.log("  ✅ CSV and JSON export packages generated with valid SHA-256 manifests.");

  console.log("\n=======================================================");
  console.log("✨ ALL UNIVERSAL ACCESS HISTORY TESTS PASSED!");
  console.log("=======================================================\n");
}

runUniversalHistoryTests().catch(err => {
  console.error("❌ Universal History Test Failed:", err);
  process.exit(1);
});
