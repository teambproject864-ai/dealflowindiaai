// tests/security-penetration.test.ts
import assert from 'assert';
import { LevelByLevelSecurityTester } from '../lib/security-testing';
import { WafFirewall, IpFirewall, DlpScanner } from '../lib/security-firewall';
import { SecurityAlertManager } from '../lib/security-alerting';
import { AutomatedDataProtection } from '../lib/security-protection';
import { TamperProofAuditLogger, WeeklySecurityReportGenerator } from '../lib/security-audit-report';

export async function runEndToEndPenetrationTest() {
  console.log('\n================================================================');
  console.log('STARTING END-TO-END SECURITY PENETRATION TEST & VALIDATION SUITE');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    return (async () => {
      try {
        await fn();
        passedTests++;
        console.log(`  [PASS] ${name}`);
      } catch (e: any) {
        console.error(`  [FAIL] ${name}`);
        console.error(`         Error: ${e.message}`);
      }
    })();
  }

  // --- 1. Level-by-Level Vulnerability Identification ---
  await test('1. Level-by-Level Security Audit (Network, Transport, App, Data)', async () => {
    const summary = await LevelByLevelSecurityTester.runFullSecurityAudit('198.51.100.22');
    assert.strictEqual(summary.totalTests, 12, 'Should run all 12 security checks');
    assert.strictEqual(summary.vulnerabilitiesIdentified, 0, 'Zero unhandled vulnerabilities should exist');
    assert.strictEqual(summary.isSecure, true, 'System should pass full security audit');
  });

  // --- 2. Real-Time Traffic & WAF Threat Detection ---
  await test('2. WAF Injection Payload Scanning (SQLi, XSS, CmdInjection, SSRF)', () => {
    const sqli = WafFirewall.scanString("1' OR '1'='1");
    assert.strictEqual(sqli.isMalicious, true, 'SQLi payload must be detected');

    const xss = WafFirewall.scanString("<script>alert('PEN_TEST')</script>");
    assert.strictEqual(xss.isMalicious, true, 'XSS payload must be detected');

    const cmd = WafFirewall.scanString("; rm -rf /var/data");
    assert.strictEqual(cmd.isMalicious, true, 'Command injection payload must be detected');

    const ssrf = WafFirewall.isSsrfThreat("http://169.254.169.254/latest/meta-data/");
    assert.strictEqual(ssrf, true, 'AWS Metadata SSRF target must be blocked');
  });

  // --- 3. Sub-10-Second Multi-Channel Alerting SLA ---
  await test('3. Multi-Channel Alert Dispatch within < 10s SLA', async () => {
    const startTime = Date.now();
    const alert = await SecurityAlertManager.triggerIncidentAlert({
      attackType: 'SIMULATED_PENETRATION_ATTACK',
      sourceIp: '203.0.113.88',
      affectedResources: ['/api/auth/login'],
      severity: 'CRITICAL',
      details: 'Simulated penetration test breach attempt'
    });

    const elapsed = Date.now() - startTime;
    assert.strictEqual(alert.dispatchLatencyMs < 10000, true, 'Alert dispatch must complete in under 10 seconds');
    assert.strictEqual(alert.channelsDispatched.length >= 2, true, 'Multi-channel dispatch must succeed');
  });

  // --- 4. Automated Incident Data Protection Protocols ---
  await test('4. Automated Data Isolation, Snapshots & AES-256 Encryption', async () => {
    const protectionRes = await AutomatedDataProtection.activateProtectionProtocols({
      attackType: 'SQL_INJECTION',
      sourceIp: '198.51.100.77',
      affectedResources: ['users_collection'],
      severity: 'CRITICAL',
      details: 'Automated data protection trigger test'
    });

    assert.strictEqual(protectionRes.success, true, 'Protection protocols must execute successfully');
    assert.strictEqual(protectionRes.ipIsolated, true, 'Attacker IP must be isolated');
    assert.strictEqual(protectionRes.snapshot.dataEncrypted, true, 'Forensic snapshot must be created');

    // Test AES-256-GCM encryption/decryption
    const rawData = 'CONFIDENTIAL_CUSTOMER_LEAD_DATA';
    const encrypted = AutomatedDataProtection.encryptDataPayload(rawData);
    const decrypted = AutomatedDataProtection.decryptDataPayload(encrypted);
    assert.strictEqual(decrypted, rawData, 'Decrypted data must exactly match original string');
  });

  // --- 5. Tamper-Proof Audit Logging & Hash Chain Integrity ---
  await test('5. Tamper-Proof Audit Log Hash Chain Verification', () => {
    TamperProofAuditLogger.logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'HIGH',
      sourceIp: '198.51.100.55',
      details: 'Attempted access to restricted admin vault'
    });

    const integrity = TamperProofAuditLogger.verifyChainIntegrity();
    assert.strictEqual(integrity.isValid, true, 'Audit log chain must be cryptographically valid');
  });

  // --- 7. Phase 0 Security & Auth Hardening Verification ---
  await test('7. JWT Strict Signature & SSRF Guard Verification', async () => {
    const { verifyToken, createToken } = await import('../lib/auth');
    const { validateSafeExternalUrl } = await import('../lib/ssrf-guard');

    // Reject dummy token header bypass
    const dummyToken = 'dummyHeader.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBkZWFsZmxvdy5haSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiJ9.signature';
    assert.strictEqual(verifyToken(dummyToken), null, 'Dummy token bypass must be strictly rejected');

    // Valid JWT sign and verify roundtrip
    const testToken = createToken({ id: 'test-u1', email: 'test@dealflow.ai', role: 'admin', name: 'Test User' });
    const verified = verifyToken(testToken);
    assert.ok(verified, 'Valid JWT signature must be verified successfully');
    assert.strictEqual(verified?.userId, 'test-u1');

    // SSRF Guard Checks
    assert.strictEqual(validateSafeExternalUrl('http://127.0.0.1/admin').valid, false, 'Loopback IP must be blocked');
    assert.strictEqual(validateSafeExternalUrl('http://169.254.169.254/latest/meta-data').valid, false, 'Cloud IMDS IP must be blocked');
    assert.strictEqual(validateSafeExternalUrl('http://10.0.0.1/internal').valid, false, 'RFC1918 private subnet must be blocked');
    assert.strictEqual(validateSafeExternalUrl('https://meet.google.com/abc-defg-hij').valid, true, 'Valid external HTTPS URL must be allowed');
  });

  console.log(`\n================================================================`);
  console.log(`PENETRATION TEST COMPLETE: Passed ${passedTests}/${totalTests} Verification Steps`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runEndToEndPenetrationTest().catch(console.error);
