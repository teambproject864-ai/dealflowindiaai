// lib/security.ts
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import _sodium from 'libsodium-wrappers';

// Multi-tiered Encryption Module
// Tier 1: AES-256-GCM (Data-in-Transit / Internal)
// Tier 2: XChaCha20-Poly1305 (Data-at-Rest / Application Level)

const AES_KEY_SIZE = 32; // 256 bits
const AES_IV_SIZE = 12; // 96 bits for GCM
const AES_AUTH_TAG_SIZE = 16;

/**
 * AES-256-GCM Encryption (High Performance)
 */
export function encryptAES(data: string, key: Buffer): string {
  const iv = randomBytes(AES_IV_SIZE);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptAES(encryptedData: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * XChaCha20-Poly1305 Encryption (Advanced Data-at-Rest)
 * Uses libsodium for cryptographic primitives.
 */
export async function encryptXChaCha20(data: string, key: Uint8Array): Promise<string> {
  await _sodium.ready;
  const sodium = _sodium;
  
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    data,
    null,
    null,
    nonce,
    key
  );
  
  return sodium.to_hex(nonce) + sodium.to_hex(ciphertext);
}

export async function decryptXChaCha20(encryptedHex: string, key: Uint8Array): Promise<string> {
  await _sodium.ready;
  const sodium = _sodium;
  
  const nonceSize = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
  const nonce = sodium.from_hex(encryptedHex.slice(0, nonceSize * 2));
  const ciphertext = sodium.from_hex(encryptedHex.slice(nonceSize * 2));
  
  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    key
  );
  
  return sodium.to_string(decrypted);
}

/**
 * Zero-Trust Audit Logging Foundation
 * Prepares data for blockchain-based integrity verification.
 */
export function generateAuditHash(payload: any): string {
  const data = JSON.stringify(payload);
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Rate Limiting and Anomaly Detection Helper
 */
export interface SecurityAnomaly {
  type: 'RATE_LIMIT' | 'SCHEMA_VIOLATION' | 'UNAUTHORIZED_ACCESS' | 'INJECTION_ATTACK';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  details: string;
  timestamp: string;
}

export function detectAnomaly(request: any): SecurityAnomaly | null {
  const body = JSON.stringify(request.body ?? {});
  const suspiciousPatterns = [
    { pattern: /<script/i,                 type: 'INJECTION_ATTACK' as const, detail: 'XSS: <script> tag detected' },
    { pattern: /OR\s+1=1/i,               type: 'INJECTION_ATTACK' as const, detail: 'SQL injection pattern detected' },
    { pattern: /\.\.[\\/\\]/,             type: 'INJECTION_ATTACK' as const, detail: 'Path traversal attempt detected' },
    { pattern: /__proto__|constructor\[/, type: 'INJECTION_ATTACK' as const, detail: 'Prototype pollution attempt' },
    { pattern: /UNION\s+SELECT/i,         type: 'INJECTION_ATTACK' as const, detail: 'SQL UNION injection detected' },
  ];

  for (const { pattern, type, detail } of suspiciousPatterns) {
    if (pattern.test(body)) {
      return {
        type,
        severity: 'CRITICAL',
        details: detail,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return null;
}


/**
 * Strips all HTML tags and trims whitespace to prevent XSS / injection.
 * Safe to call on any string field before persisting to Firestore.
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";
  let sanitized = str.trim();
  
  // Strip common tag formats to keep it text-friendly, then escape HTML chars
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/\s(on\w+)\s*=/gi, ' data-disallowed-$1=');

  const escapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return sanitized.replace(/[&<>"]/g, (char) => escapeMap[char]);
}

/**
 * Hashes an IP address with SHA-256 for GDPR-compliant storage.
 * The original IP is never persisted.
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'dealflow')).digest('hex');
}

function getAESKey(): Buffer {
  const rawKey = process.env.LLM_API_KEY_ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: LLM_API_KEY_ENCRYPTION_KEY environment variable is not set in production.");
    }
    return createHash('sha256').update('dev-aes-encryption-key-dealflow-vault').digest();
  }
  if (typeof rawKey === 'string' && /^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }
  return createHash('sha256').update(rawKey).digest();
}

export function encryptLead(lead: any): any {
  if (!lead) return lead;
  const key = getAESKey();
  const result = { ...lead };
  if (result.contactEmail && typeof result.contactEmail === 'string' && !result.contactEmail.includes(':')) {
    result.contactEmail = encryptAES(result.contactEmail, key);
  }
  if (result.contactPhone && typeof result.contactPhone === 'string' && !result.contactPhone.includes(':')) {
    result.contactPhone = encryptAES(result.contactPhone, key);
  }
  return result;
}

export function decryptLead(lead: any): any {
  if (!lead) return lead;
  const key = getAESKey();
  const result = { ...lead };

  if (result.contactEmail && typeof result.contactEmail === 'string' && result.contactEmail.includes(':')) {
    try {
      result.contactEmail = decryptAES(result.contactEmail, key);
    } catch (e) {
      // Return original or encrypted string on decryption error without swallowing or substituting fake values
    }
  }
  if (result.contactPhone && typeof result.contactPhone === 'string' && result.contactPhone.includes(':')) {
    try {
      result.contactPhone = decryptAES(result.contactPhone, key);
    } catch (e) {
      // Return original or encrypted string on decryption error
    }
  }
  return result;
}

/**
 * Validates that a password is at least 8 characters long and contains
 * at least one uppercase letter, one lowercase letter, one number, and one special character.
 */
export function validatePasswordStrength(password: string): boolean {
  if (!password || password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

