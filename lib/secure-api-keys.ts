import { decryptAES, encryptAES } from './security';
import { createHash, randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

// Error Classes
export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

// Access Control Matrix Registry
export interface APIKeyPermission {
  envVar: string;
  provider: 'huggingface' | 'nvidia' | 'kimi' | 'billionmail' | 'scrapegraph';
  permittedPillar: string;
  permittedSubOption: string;
}

export const API_KEY_PERMISSIONS: Record<string, APIKeyPermission> = {
  'automated_personalization_hf': { envVar: 'ENC_HF_KEY_AUTO_PERS', provider: 'huggingface', permittedPillar: 'ai_automated_content', permittedSubOption: 'automated_personalization' },
  'automated_personalization_nv': { envVar: 'ENC_NV_KEY_AUTO_PERS', provider: 'nvidia', permittedPillar: 'ai_automated_content', permittedSubOption: 'automated_personalization' },
  'dynamic_report_generator_hf': { envVar: 'ENC_HF_KEY_REPORT_GEN', provider: 'huggingface', permittedPillar: 'ai_automated_content', permittedSubOption: 'dynamic_report_generator' },
  'dynamic_report_generator_nv': { envVar: 'ENC_NV_KEY_REPORT_GEN', provider: 'nvidia', permittedPillar: 'ai_automated_content', permittedSubOption: 'dynamic_report_generator' },
  'ai_copy_generator_hf': { envVar: 'ENC_HF_KEY_COPY_GEN', provider: 'huggingface', permittedPillar: 'ai_automated_content', permittedSubOption: 'ai_copy_generator' },
  'ai_copy_generator_nv': { envVar: 'ENC_NV_KEY_COPY_GEN', provider: 'nvidia', permittedPillar: 'ai_automated_content', permittedSubOption: 'ai_copy_generator' },
  'faq_auto_bots_hf': { envVar: 'ENC_HF_KEY_FAQ_BOT', provider: 'huggingface', permittedPillar: 'ai_automated_content', permittedSubOption: 'faq_auto_bots' },
  'faq_auto_bots_nv': { envVar: 'ENC_NV_KEY_FAQ_BOT', provider: 'nvidia', permittedPillar: 'ai_automated_content', permittedSubOption: 'faq_auto_bots' },
  'synthetic_data_generator_hf': { envVar: 'ENC_HF_KEY_SYNTH_GEN', provider: 'huggingface', permittedPillar: 'ai_automated_content', permittedSubOption: 'synthetic_data_generator' },
  'synthetic_data_generator_nv': { envVar: 'ENC_NV_KEY_SYNTH_GEN', provider: 'nvidia', permittedPillar: 'ai_automated_content', permittedSubOption: 'synthetic_data_generator' },
  // Kimi API Permissions
  'kimi_gtm_report': { envVar: 'ENC_KIMI_API_KEY', provider: 'kimi', permittedPillar: 'ai_automated_content', permittedSubOption: 'dynamic_report_generator' },
  'kimi_imagery_gen': { envVar: 'ENC_KIMI_API_KEY', provider: 'kimi', permittedPillar: 'ai_automated_content', permittedSubOption: 'automated_personalization' },
  'kimi_video_blueprint': { envVar: 'ENC_KIMI_API_KEY', provider: 'kimi', permittedPillar: 'ai_automated_content', permittedSubOption: 'ai_copy_generator' },
  'kimi_general_chat': { envVar: 'ENC_KIMI_API_KEY', provider: 'kimi', permittedPillar: 'ai_automated_content', permittedSubOption: 'faq_auto_bots' },
  // Billionmail & ScrapeGraphAI Permissions
  'billionmail_campaigns': { envVar: 'ENC_BILLIONMAIL_API_KEY', provider: 'billionmail', permittedPillar: 'communications_and_campaigns', permittedSubOption: 'billionmail_hub' },
  'scrapegraph_extractions': { envVar: 'ENC_SCRAPEGRAPH_API_KEY', provider: 'scrapegraph', permittedPillar: 'data_intelligence_scraping', permittedSubOption: 'scrapegraph_studio' },
};


// Rate limiting state
const rateLimits: Map<string, number[]> = new Map();
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 5;

// Audit log path
const AUDIT_LOG_DIR = path.join('C:', 'Users', 'Praneeth Burada', '.gemini', 'antigravity-ide', 'brain', '31b214e4-784b-4e2c-add4-28b6a7b6f289', 'scratch');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'api_keys_audit.json');

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  keyId: string;
  provider: string;
  callerPillarId: string;
  callerSubOptionId: string;
  status: 'GRANTED' | 'DENIED_UNAUTHORIZED' | 'DENIED_RATE_LIMITED';
  estimatedTokens?: number;
  previousHash: string;
  hash: string;
}

// Helper to get decryption key
function getDecryptionKey(): Buffer {
  const rawKey = process.env.API_KEY_MASTER_DECRYPTION_KEY || 'default-master-key-dealflow-value';
  return createHash('sha256').update(rawKey).digest();
}

// Retrieve last audit log hash to construct the hash chain
export function getLastAuditLogHash(): string {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      const logs = JSON.parse(content) as AuditLogEntry[];
      if (logs.length > 0) {
        return logs[logs.length - 1].hash;
      }
    }
  } catch (error) {
    console.error('[SecureAPIKeys] Error reading last audit log hash:', error);
  }
  return 'GENESIS_HASH';
}

// Log audit event
export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'previousHash' | 'hash'>): void {
  try {
    if (!fs.existsSync(AUDIT_LOG_DIR)) {
      fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
    }

    let logs: AuditLogEntry[] = [];
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      logs = JSON.parse(content) as AuditLogEntry[];
    }

    const previousHash = logs.length > 0 ? logs[logs.length - 1].hash : 'GENESIS_HASH';
    const id = `audit-${randomUUID()}`;
    const timestamp = new Date().toISOString();

    const payload = {
      id,
      timestamp,
      keyId: entry.keyId,
      provider: entry.provider,
      callerPillarId: entry.callerPillarId,
      callerSubOptionId: entry.callerSubOptionId,
      status: entry.status,
      estimatedTokens: entry.estimatedTokens || 0,
      previousHash
    };

    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const completeEntry: AuditLogEntry = { ...payload, hash };

    logs.push(completeEntry);
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error('[SecureAPIKeys] Error writing audit log:', error);
  }
}

// Rate Limiting checker
function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  if (!rateLimits.has(keyId)) {
    rateLimits.set(keyId, [now]);
    return true;
  }

  const timestamps = rateLimits.get(keyId)!.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  timestamps.push(now);
  rateLimits.set(keyId, timestamps);
  return true;
}

// Helper to encrypt a raw key (can be used to setup env vars)
export function encryptRawKey(rawKey: string): string {
  return encryptAES(rawKey, getDecryptionKey());
}

// Retrieve and decrypt a key under strict policy constraints
export function getDecryptedKey(
  keyId: string,
  callerPillarId: string,
  callerSubOptionId: string,
  estimatedTokens?: number
): string {
  const permission = API_KEY_PERMISSIONS[keyId];

  // 1. Check if key is registered in permission matrix
  if (!permission) {
    throw new AccessDeniedError(`API Key with ID '${keyId}' is not registered in the Access Control Matrix.`);
  }

  // 2. Enforce Least Privilege / Zero-Trust access control
  if (
    permission.permittedPillar !== callerPillarId ||
    permission.permittedSubOption !== callerSubOptionId
  ) {
    logAuditEvent({
      keyId,
      provider: permission.provider,
      callerPillarId,
      callerSubOptionId,
      status: 'DENIED_UNAUTHORIZED',
      estimatedTokens
    });
    throw new AccessDeniedError(
      `Access denied: Strategy pillar '${callerPillarId}' and sub-option '${callerSubOptionId}' is not permitted to access key '${keyId}'.`
    );
  }

  // 3. Enforce Rate Limiting
  if (!checkRateLimit(keyId)) {
    logAuditEvent({
      keyId,
      provider: permission.provider,
      callerPillarId,
      callerSubOptionId,
      status: 'DENIED_RATE_LIMITED',
      estimatedTokens
    });
    throw new RateLimitExceededError(`Rate limit exceeded for API key: '${keyId}'.`);
  }

  // 4. Retrieve encrypted key from environment
  const encryptedValue = process.env[permission.envVar];
  if (!encryptedValue) {
    // For test verification and development fallbacks: if not set in the environment,
    // we return a simulation credential, but still log the event.
    console.warn(`[SecureAPIKeys] Environment variable ${permission.envVar} not found. Returning simulation credential.`);
    logAuditEvent({
      keyId,
      provider: permission.provider,
      callerPillarId,
      callerSubOptionId,
      status: 'GRANTED',
      estimatedTokens
    });
    return `simulated-decrypted-key-for-${keyId}`;
  }

  // 5. Decrypt and return key
  try {
    const { decryptEnvelope, isEnvelope } = require('./secure-storage/envelope-encryption');
    let decrypted: string;
    if (isEnvelope(encryptedValue)) {
      decrypted = decryptEnvelope(encryptedValue);
    } else {
      decrypted = decryptAES(encryptedValue, getDecryptionKey());
    }

    logAuditEvent({
      keyId,
      provider: permission.provider,
      callerPillarId,
      callerSubOptionId,
      status: 'GRANTED',
      estimatedTokens
    });
    return decrypted;
  } catch (error) {
    console.error(`[SecureAPIKeys] Error decrypting API key ${keyId}:`, error);
    throw new Error(`Failed to decrypt API Key for ${keyId}. Invalid encryption configuration.`);
  }

}
