import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export interface EnvelopePayload {
  algorithm: 'aes-256-gcm';
  version: 'v1';
  encryptedDek: string; // hex
  dekIv: string;        // hex
  dekAuthTag: string;   // hex
  encryptedData: string;// hex
  iv: string;           // hex
  authTag: string;      // hex
}

function getMasterKey(masterKeyInput?: string): Buffer {
  const rawKey = masterKeyInput || process.env.LLM_API_KEY_ENCRYPTION_KEY || process.env.API_KEY_MASTER_DECRYPTION_KEY || 'default-master-key-dealflow-value';
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }
  return createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a plaintext string (e.g. an API Key) using Envelope Encryption.
 * Master Key (KEK) encrypts a randomly generated Data Encryption Key (DEK).
 * The DEK encrypts the plaintext payload.
 */
export function encryptEnvelope(plaintext: string, masterKeyInput?: string): string {
  const kek = getMasterKey(masterKeyInput);

  // 1. Generate a random DEK (32 bytes)
  const dek = randomBytes(32);

  // 2. Encrypt plaintext using DEK
  const dataIv = randomBytes(12);
  const dataCipher = createCipheriv('aes-256-gcm', dek, dataIv);
  let encryptedData = dataCipher.update(plaintext, 'utf8', 'hex');
  encryptedData += dataCipher.final('hex');
  const dataAuthTag = dataCipher.getAuthTag();

  // 3. Encrypt DEK using KEK
  const dekIv = randomBytes(12);
  const dekCipher = createCipheriv('aes-256-gcm', kek, dekIv);
  let encryptedDek = dekCipher.update(dek.toString('hex'), 'utf8', 'hex');
  encryptedDek += dekCipher.final('hex');
  const dekAuthTag = dekCipher.getAuthTag();

  const payload: EnvelopePayload = {
    algorithm: 'aes-256-gcm',
    version: 'v1',
    encryptedDek,
    dekIv: dekIv.toString('hex'),
    dekAuthTag: dekAuthTag.toString('hex'),
    encryptedData,
    iv: dataIv.toString('hex'),
    authTag: dataAuthTag.toString('hex'),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts an envelope-encrypted JSON payload to retrieve the original plaintext string.
 */
export function decryptEnvelope(envelopeJson: string, masterKeyInput?: string): string {
  const kek = getMasterKey(masterKeyInput);
  let payload: EnvelopePayload;

  try {
    payload = JSON.parse(envelopeJson);
  } catch (err) {
    throw new Error('Invalid envelope JSON format');
  }

  if (payload.algorithm !== 'aes-256-gcm' || payload.version !== 'v1') {
    throw new Error(`Unsupported envelope algorithm (${payload.algorithm}) or version (${payload.version})`);
  }

  // 1. Decrypt DEK using KEK
  const dekDecipher = createDecipheriv('aes-256-gcm', kek, Buffer.from(payload.dekIv, 'hex'));
  dekDecipher.setAuthTag(Buffer.from(payload.dekAuthTag, 'hex'));
  let decryptedDekHex = dekDecipher.update(payload.encryptedDek, 'hex', 'utf8');
  decryptedDekHex += dekDecipher.final('utf8');
  const dek = Buffer.from(decryptedDekHex, 'hex');

  // 2. Decrypt data using DEK
  const dataDecipher = createDecipheriv('aes-256-gcm', dek, Buffer.from(payload.iv, 'hex'));
  dataDecipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  let plaintext = dataDecipher.update(payload.encryptedData, 'hex', 'utf8');
  plaintext += dataDecipher.final('utf8');

  return plaintext;
}

/**
 * Helper to check if a string is an envelope JSON payload.
 */
export function isEnvelope(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = JSON.parse(value);
    return parsed && parsed.algorithm === 'aes-256-gcm' && parsed.version === 'v1' && !!parsed.encryptedData;
  } catch {
    return false;
  }
}
