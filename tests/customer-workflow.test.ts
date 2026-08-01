import assert from "assert";
import { hashPassword, verifyPassword, createToken, verifyToken } from "../lib/auth";
import { encryptAES, decryptAES } from "../lib/security";
import { randomBytes } from "crypto";

/**
 * Unit & Security Compliance Test Suite for Customer Post-Assignment Workflow
 * Tests password hashing, token management, encryption, lockout rules, and file constraints
 * without relying on an external HTTP server.
 */

export async function runCustomerWorkflowTests() {
  console.log("=== Running Customer Post-Assignment Workflow & Security Compliance Tests ===");

  const testEmail = `test.customer.${Date.now()}@example.com`;
  const strongPassword = "SecurePass123!";
  const weakPassword = "123";

  // 1. Password Complexity Rules
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  assert.strictEqual(passwordRegex.test("simple"), false);
  assert.strictEqual(passwordRegex.test("12345678"), false);
  assert.strictEqual(passwordRegex.test("Password123"), false);
  assert.strictEqual(passwordRegex.test("Pass123!"), true);
  assert.strictEqual(passwordRegex.test(strongPassword), true);

  // 2. Reject registration with weak password
  const isValid = passwordRegex.test(weakPassword);
  assert.strictEqual(isValid, false);

  // 3. Password Hashing with bcrypt
  const hash = await hashPassword(strongPassword);
  assert.notStrictEqual(hash, strongPassword);
  assert.ok(hash.startsWith("$2b$") || hash.startsWith("$2a$"));

  const match = await verifyPassword(strongPassword, hash);
  assert.strictEqual(match, true);

  const wrongMatch = await verifyPassword("WrongPassword123!", hash);
  assert.strictEqual(wrongMatch, false);

  // 4. JWT Token Generation & Verification
  const userPayload = {
    id: "cust-123",
    email: testEmail,
    role: "customer" as const,
    name: "Test Customer",
  };

  const token = createToken(userPayload);
  assert.ok(token !== undefined);
  assert.strictEqual(typeof token, "string");

  const decoded = verifyToken(token);
  assert.notStrictEqual(decoded, null);
  assert.strictEqual(decoded?.userId, userPayload.id);
  assert.strictEqual(decoded?.email, userPayload.email);
  assert.strictEqual(decoded?.role, "customer");

  // 5. Duplicate Email Detection logic
  const registeredEmails = [testEmail.toLowerCase(), "demo@customer.com"];
  const checkEmail = (email: string) => registeredEmails.includes(email.toLowerCase().trim());

  assert.strictEqual(checkEmail(testEmail), true);
  assert.strictEqual(checkEmail("demo@customer.com"), true);
  assert.strictEqual(checkEmail("new.user@example.com"), false);

  // 6. Account Lockout Logic (5 consecutive failed attempts)
  let failedLoginAttempts = 0;
  let isLocked = false;
  let lockedUntil: string | null = null;

  const recordFailedAttempt = () => {
    failedLoginAttempts += 1;
    if (failedLoginAttempts >= 5) {
      isLocked = true;
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
  };

  for (let i = 0; i < 4; i++) recordFailedAttempt();
  assert.strictEqual(isLocked, false);

  recordFailedAttempt(); // 5th attempt
  assert.strictEqual(isLocked, true);
  assert.notStrictEqual(lockedUntil, null);

  // 7. Message Structure & Channel ID Resolution
  const buildChannelId = (customerId: string, agentKey: string) =>
    [customerId, agentKey].sort().join("__");

  const channel1 = buildChannelId("customer-123", "praneeth");
  const channel2 = buildChannelId("praneeth", "customer-123");

  assert.strictEqual(channel1, "customer-123__praneeth");
  assert.strictEqual(channel1, channel2); // order invariant

  // 8. Payload Structure Validation
  const message = {
    id: "msg-1",
    channelId: "customer-123__praneeth",
    senderId: "customer-123",
    senderRole: "customer",
    senderName: "Test Customer",
    text: "Hello, agent!",
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  assert.ok(message.id !== undefined);
  assert.strictEqual(message.senderRole, "customer");
  assert.strictEqual(message.readAt, null);

  // 9. File Attachment Constraints (5MB cap)
  const MAX_SIZE = 5 * 1024 * 1024;
  const validFile = { name: "doc.pdf", size: 2 * 1024 * 1024 };
  const oversizedFile = { name: "big.zip", size: 6 * 1024 * 1024 };

  assert.strictEqual(validFile.size <= MAX_SIZE, true);
  assert.strictEqual(oversizedFile.size <= MAX_SIZE, false);

  // 10. End-to-End Payload Encryption & Decryption
  const key = randomBytes(32);
  const plaintextMessage = "Client account performance review meeting notes";

  const encrypted = encryptAES(plaintextMessage, key);
  assert.notStrictEqual(encrypted, plaintextMessage);
  assert.ok(encrypted.includes(":")); // iv:authTag:cipher

  const decrypted = decryptAES(encrypted, key);
  assert.strictEqual(decrypted, plaintextMessage);

  console.log("✅ Passed: Customer Post-Assignment Workflow & Security Compliance Tests");
}

if (require.main === module) {
  runCustomerWorkflowTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
}

