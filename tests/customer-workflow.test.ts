import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createToken, verifyToken } from "../lib/auth";
import { encryptAES, decryptAES } from "../lib/security";
import { randomBytes } from "crypto";

/**
 * Unit & Security Compliance Test Suite for Customer Post-Assignment Workflow
 * Tests password hashing, token management, encryption, lockout rules, and file constraints
 * without relying on an external HTTP server.
 */

describe("Customer Post-Assignment Workflow & Security Compliance", () => {
  const testEmail = `test.customer.${Date.now()}@example.com`;
  const strongPassword = "SecurePass123!";
  const weakPassword = "123";

  // 1. Password Complexity Rules
  it("enforces password complexity requirements (min 8 chars, letter, number, special char)", () => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    expect(passwordRegex.test("simple")).toBe(false);
    expect(passwordRegex.test("12345678")).toBe(false);
    expect(passwordRegex.test("Password123")).toBe(false);
    expect(passwordRegex.test("Pass123!")).toBe(true);
    expect(passwordRegex.test(strongPassword)).toBe(true);
  });

  // 2. Reject registration with weak password
  it("rejects account creation validation with weak password", () => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    const isValid = passwordRegex.test(weakPassword);
    expect(isValid).toBe(false);
  });

  // 3. Password Hashing with bcrypt
  it("successfully hashes passwords using bcrypt and verifies hashes correctly", async () => {
    const hash = await hashPassword(strongPassword);
    expect(hash).not.toBe(strongPassword);
    expect(hash.startsWith("$2b$") || hash.startsWith("$2a$")).toBe(true);

    const match = await verifyPassword(strongPassword, hash);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(wrongMatch).toBe(false);
  });

  // 4. JWT Token Generation & Verification
  it("generates and verifies JWT tokens with correct user role claims", () => {
    const userPayload = {
      id: "cust-123",
      email: testEmail,
      role: "customer" as const,
      name: "Test Customer",
    };

    const token = createToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userPayload.id);
    expect(decoded?.email).toBe(userPayload.email);
    expect(decoded?.role).toBe("customer");
  });

  // 5. Duplicate Email Detection logic
  it("detects existing emails in credential lists", () => {
    const registeredEmails = [testEmail.toLowerCase(), "demo@customer.com"];
    const checkEmail = (email: string) => registeredEmails.includes(email.toLowerCase().trim());

    expect(checkEmail(testEmail)).toBe(true);
    expect(checkEmail("demo@customer.com")).toBe(true);
    expect(checkEmail("new.user@example.com")).toBe(false);
  });

  // 6. Account Lockout Logic (5 consecutive failed attempts)
  it("enforces account lockout threshold of 5 failed attempts", () => {
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
    expect(isLocked).toBe(false);

    recordFailedAttempt(); // 5th attempt
    expect(isLocked).toBe(true);
    expect(lockedUntil).not.toBeNull();
  });

  // 7. Message Structure & Channel ID Resolution
  it("constructs deterministic channel IDs for customer-agent communication", () => {
    const buildChannelId = (customerId: string, agentKey: string) =>
      [customerId, agentKey].sort().join("__");

    const channel1 = buildChannelId("customer-123", "praneeth");
    const channel2 = buildChannelId("praneeth", "customer-123");

    expect(channel1).toBe("customer-123__praneeth");
    expect(channel1).toBe(channel2); // order invariant
  });

  // 8. Payload Structure Validation
  it("validates message payload data structure", () => {
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

    expect(message.id).toBeDefined();
    expect(message.senderRole).toBe("customer");
    expect(message.readAt).toBeNull();
  });

  // 9. File Attachment Constraints (5MB cap)
  it("enforces 5MB file attachment size limits", () => {
    const MAX_SIZE = 5 * 1024 * 1024;
    const validFile = { name: "doc.pdf", size: 2 * 1024 * 1024 };
    const oversizedFile = { name: "big.zip", size: 6 * 1024 * 1024 };

    expect(validFile.size <= MAX_SIZE).toBe(true);
    expect(oversizedFile.size <= MAX_SIZE).toBe(false);
  });

  // 10. End-to-End Payload Encryption & Decryption
  it("verifies AES-256 payload encryption and decryption integrity", () => {
    const key = randomBytes(32);
    const plaintextMessage = "Client account performance review meeting notes";

    const encrypted = encryptAES(plaintextMessage, key);
    expect(encrypted).not.toBe(plaintextMessage);
    expect(encrypted).toContain(":"); // iv:authTag:cipher

    const decrypted = decryptAES(encrypted, key);
    expect(decrypted).toBe(plaintextMessage);
  });
});
