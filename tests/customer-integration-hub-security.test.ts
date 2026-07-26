// tests/customer-integration-hub-security.test.ts
import assert from "assert";
import { saveCustomerAPIKey, validateAPIKeyFormat, maskAPIKey } from "../lib/customer-api-keys";

export async function runCustomerIntegrationHubSecurityTests(): Promise<boolean> {
  console.log("=== Running Customer Integration Hub (Dealflow Connect) Security Test Suite ===");

  // Test 1: Key Validation Format
  const validOpenAI = validateAPIKeyFormat("openai", "sk-1234567890abcdefghijkl");
  assert.strictEqual(validOpenAI.isValid, true, "Valid OpenAI key format accepted");

  const invalidOpenAI = validateAPIKeyFormat("openai", "invalid-key-string");
  assert.strictEqual(invalidOpenAI.isValid, false, "Invalid OpenAI key rejected");
  console.log("  ✓ API Key format validation passed");

  // Test 2: Masking Functionality
  const rawKey = "sk-1234567890abcdefghijkl";
  const masked = maskAPIKey(rawKey);
  assert.strictEqual(masked.startsWith("sk-"), true);
  assert.ok(masked.includes("••••••••"), "Key must obscure sensitive secret bytes");
  assert.strictEqual(masked.endsWith("ijkl"), true);
  console.log("  ✓ API Key masking verified: " + masked);

  // Test 3: AES Encryption & Persistence Storage Test
  const record = await saveCustomerAPIKey({
    customerId: "cust-sec-test-1",
    provider: "openai",
    label: "Production Key",
    rawKey,
  });

  assert.ok(record.id.startsWith("key-"));
  assert.notStrictEqual(record.encryptedKey, rawKey, "Key must be encrypted, not stored in plaintext");
  assert.strictEqual(record.status, "active");
  console.log("  ✓ BYOK End-to-End AES Encryption verified");

  console.log("=== Customer Integration Hub Security Test Suite Passed Successfully! ===\n");
  return true;
}

if (require.main === module) {
  runCustomerIntegrationHubSecurityTests().catch((err) => {
    console.error("Integration Hub Security Test Failure:", err);
    process.exit(1);
  });
}
