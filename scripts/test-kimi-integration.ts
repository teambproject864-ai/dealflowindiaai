import { encryptEnvelope, decryptEnvelope, isEnvelope } from '../lib/secure-storage/envelope-encryption';
import { getDecryptedKey, API_KEY_PERMISSIONS } from '../lib/secure-api-keys';
import { getInternalMTLSHeaders, verifyInternalMTLS } from '../lib/security/mtls';
import { signKimiRequest, verifyKimiSignature } from '../lib/security/request-signing';
import { validateGTMReportInput, validateImageryInput, validateVideoBlueprintInput } from '../lib/kimi/input-validator';
import { handleKimiError, KimiAPIError } from '../lib/kimi/error-handler';
import { KimiClient } from '../lib/kimi/client';
import { getLoadBalancedProvider } from '../lib/ai-provider-router';

async function runKimiValidation() {
  console.log("=================================================");
  console.log("   DEALFLOW AI - KIMI API INTEGRATION VALIDATION ");
  console.log("=================================================\n");

  const masterKey = process.env.LLM_API_KEY_ENCRYPTION_KEY || "4257dffb58918932fa4c47e3c6e928bbcdbf12063e20e3853b83ed187a85c932";
  const targetApiKey = process.env.ENC_KIMI_API_KEY ? decryptEnvelope(process.env.ENC_KIMI_API_KEY, masterKey) : (process.env.KIMI_API_KEY || "mock-test-key-12345");


  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Envelope Encryption
  console.log("1. Testing Envelope Encryption at Rest...");
  try {
    const envelope = encryptEnvelope(targetApiKey, masterKey);
    assert(isEnvelope(envelope), "Validates payload is AES-256-GCM envelope JSON");

    const decrypted = decryptEnvelope(envelope, masterKey);
    assert(decrypted === targetApiKey, "Decrypted envelope payload matches target Kimi key");
  } catch (err: any) {
    assert(false, `Envelope Encryption Error: ${err.message}`);
  }

  // 2. Matrix Access Control
  console.log("\n2. Testing Access Control Matrix & Permission Enforcement...");
  try {
    process.env.ENC_KIMI_API_KEY = encryptEnvelope(targetApiKey, masterKey);
    process.env.LLM_API_KEY_ENCRYPTION_KEY = masterKey;

    const grantedKey = getDecryptedKey('kimi_gtm_report', 'ai_automated_content', 'dynamic_report_generator');
    assert(grantedKey === targetApiKey, "Permission granted for authorized pillar & subOption");

    let unauthorizedBlocked = false;
    try {
      getDecryptedKey('kimi_gtm_report', 'unauthorized_pillar', 'dynamic_report_generator');
    } catch {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, "Access denied for unauthorized caller pillar");
  } catch (err: any) {
    assert(false, `Matrix Access Control Error: ${err.message}`);
  }

  // 3. mTLS & Request Signing
  console.log("\n3. Testing mTLS Auth & HMAC Request Signing...");
  try {
    const mtlsHeaders = getInternalMTLSHeaders('gtm-service');
    const mtlsResult = verifyInternalMTLS(mtlsHeaders);
    assert(mtlsResult.authenticated === true && mtlsResult.serviceId === 'gtm-service', "mTLS verification passed for internal service");

    const sampleBody = { model: 'moonshot-v1-8k', messages: [{ role: 'user', content: 'test' }] };
    const signedHeaders = signKimiRequest(sampleBody, targetApiKey);
    const isValidSignature = verifyKimiSignature(sampleBody, signedHeaders, targetApiKey);
    assert(isValidSignature, "Outbound HMAC-SHA256 signature verification passed");
  } catch (err: any) {
    assert(false, `mTLS/Signing Error: ${err.message}`);
  }

  // 4. Input Validation
  console.log("\n4. Testing Input Validation Schemas...");
  try {
    const validGTM = validateGTMReportInput({
      topic: 'AI Outbound Scaling',
      industry: 'B2B SaaS',
      targetAudience: 'CROs',
      tone: 'professional'
    });
    assert(validGTM.topic === 'AI Outbound Scaling', "GTM report schema validation passed");

    let rejectedInvalid = false;
    try {
      validateGTMReportInput({ topic: 'ab' });
    } catch {
      rejectedInvalid = true;
    }
    assert(rejectedInvalid, "Invalid input rejected before reaching Kimi API");
  } catch (err: any) {
    assert(false, `Input Validation Error: ${err.message}`);
  }

  // 5. Reliability & Error Mapping
  console.log("\n5. Testing Operational Reliability & Security Leak Prevention...");
  try {
    const client = new KimiClient(targetApiKey);
    const circuitStatus = client.getCircuitStatus();
    assert(circuitStatus.state === 'CLOSED', "Circuit breaker initialized in CLOSED state");

    const mappedError = handleKimiError(new Error("429 rate limit exceeded"), { requestId: "req-429" });
    assert(mappedError.error.code === 'KIMI_RATE_LIMIT_EXCEEDED', "Mapped 429 status code to KIMI_RATE_LIMIT_EXCEEDED");

    const serializedError = JSON.stringify(mappedError);
    assert(!serializedError.includes(targetApiKey), "Security check passed: API Key is never exposed in error outputs");
  } catch (err: any) {
    assert(false, `Reliability Error: ${err.message}`);
  }

  // 6. Traffic Distribution
  console.log("\n6. Testing Load Balanced Traffic Distribution...");
  try {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const p = getLoadBalancedProvider();
      counts[p] = (counts[p] || 0) + 1;
    }
    assert(counts['kimi'] > 0 && Object.keys(counts).length >= 2, "Traffic successfully distributed across integrated providers");
  } catch (err: any) {
    assert(false, `Traffic Distribution Error: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log(` Validation Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runKimiValidation().catch((err) => {
  console.error("Fatal error during validation:", err);
  process.exit(1);
});
