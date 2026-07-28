import assert from "assert";
import { matchICP, distributeICPDocument, ICP_DEFINITIONS } from "@/lib/icp";
import { IntakeFormData } from "@/lib/types";

/**
 * ICP Document Matching and Distribution Tests
 */

async function testICPMatchingEnterpriseSaaS() {
  console.log("[Test] Verifying ICP matching for Enterprise SaaS...");
  
  const enterpriseData: Partial<IntakeFormData> = {
    companyName: "CloudTech Global",
    industry: "Enterprise SaaS & Cloud Computing",
    websiteUrl: "https://cloudtech.global",
    companySize: "501-1000",
    revenue: "$100M+",
    currentTools: ["Salesforce", "HubSpot"],
    challenges: ["Manual follow-up bottlenecks"],
    targetAudience: "Enterprise IT Leaders",
    monthlyLeads: "500+",
    salesCycle: "6+ months",
    name: "Jane Smith",
    emailPersonal: "jane@cloudtech.global"
  };

  const match = matchICP(enterpriseData);
  assert.ok(match, "Should find a match for Enterprise SaaS");
  assert.equal(match.matchedICP.id, "enterprise-saas", "Should match the enterprise-saas ICP");
  assert.ok(match.matchScore >= 80, "Match score should be high for clear enterprise profile");
  console.log("✅ Enterprise SaaS matching passed.");
}

async function testICPMatchingSMBAgency() {
  console.log("[Test] Verifying ICP matching for SMB Agencies...");
  
  const agencyData: Partial<IntakeFormData> = {
    companyName: "Creative Pulse Media",
    industry: "Digital Marketing Agency",
    websiteUrl: "https://creativepulse.io",
    companySize: "11-50",
    revenue: "$1M - $5M",
    currentTools: ["Mailchimp"],
    challenges: ["Scaling outbound without burning domains"],
    targetAudience: "Small Business Owners",
    monthlyLeads: "50-100",
    salesCycle: "1-2 months",
    name: "Mike Jones",
    emailPersonal: "mike@creativepulse.io"
  };

  const match = matchICP(agencyData);
  assert.ok(match, "Should find a match for SMB Agency");
  assert.equal(match.matchedICP.id, "smb-agencies", "Should match the smb-agencies ICP");
  console.log("✅ SMB Agency matching passed.");
}

async function testICPMatchingNoMatch() {
  console.log("[Test] Verifying ICP matching for non-matching profile...");
  
  const unknownData: Partial<IntakeFormData> = {
    companyName: "Generic Corp",
    industry: "Heavy Manufacturing",
    websiteUrl: "https://genericcorp.com",
    companySize: "10000+",
    revenue: "$1B+",
    currentTools: ["SAP"],
    challenges: ["Other"],
    targetAudience: "Distributors",
    monthlyLeads: "1000+",
    salesCycle: "12+ months",
    name: "Bob Brown",
    emailPersonal: "bob@genericcorp.com"
  };

  const match = matchICP(unknownData);
  assert.strictEqual(match, null, "Should return null for non-matching profile");
  console.log("✅ No-match handling passed.");
}

async function testICPDistribution() {
  console.log("[Test] Verifying ICP document distribution logic...");
  
  const mockMatch = {
    leadId: "lead_123",
    companyName: "Test Co",
    matchedICP: ICP_DEFINITIONS[0],
    matchScore: 100,
    matchReason: "Test",
    timestamp: new Date().toISOString()
  };

  const result = await distributeICPDocument(mockMatch);
  assert.ok(result.success, "Distribution should be successful");
  assert.ok(result.message.includes("Successfully distributed"), "Message should indicate success");
  console.log("✅ Document distribution passed.");
}

export async function runICPTests() {
  console.log("🚀 Running ICP Logic Test Suite...");
  await testICPMatchingEnterpriseSaaS();
  await testICPMatchingSMBAgency();
  await testICPMatchingNoMatch();
  await testICPDistribution();
  console.log("🎉 All ICP tests passed.");
}
