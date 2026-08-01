import { createHmac, randomBytes } from 'crypto';

export interface SignedRequestHeaders {
  'X-Kimi-Signature': string;
  'X-Kimi-Timestamp': string;
  'X-Kimi-Nonce': string;
}

/**
 * Signs outbound request payload to Kimi API using HMAC-SHA256.
 * Computes signature over (timestamp + "." + nonce + "." + body).
 */
export function signKimiRequest(body: string | object, secretKey: string): SignedRequestHeaders {
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');
  const payloadString = typeof body === 'string' ? body : JSON.stringify(body);

  const signatureData = `${timestamp}.${nonce}.${payloadString}`;
  const signature = createHmac('sha256', secretKey)
    .update(signatureData)
    .digest('hex');

  return {
    'X-Kimi-Signature': signature,
    'X-Kimi-Timestamp': timestamp,
    'X-Kimi-Nonce': nonce,
  };
}

/**
 * Verifies outbound request signature.
 */
export function verifyKimiSignature(
  body: string | object,
  headers: { 'X-Kimi-Signature'?: string; 'X-Kimi-Timestamp'?: string; 'X-Kimi-Nonce'?: string } | Headers,
  secretKey: string
): boolean {
  const getHeader = (key: string): string | null => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(key);
    }
    const record = headers as Record<string, string | undefined>;
    return record[key as keyof typeof record] || null;
  };

  const signature = getHeader('X-Kimi-Signature');
  const timestamp = getHeader('X-Kimi-Timestamp');
  const nonce = getHeader('X-Kimi-Nonce');

  if (!signature || !timestamp || !nonce) {
    return false;
  }

  // Reject requests older than 5 minutes
  if (Math.abs(Date.now() - parseInt(timestamp, 10)) > 300000) {
    return false;
  }

  const payloadString = typeof body === 'string' ? body : JSON.stringify(body);
  const signatureData = `${timestamp}.${nonce}.${payloadString}`;
  const expectedSignature = createHmac('sha256', secretKey)
    .update(signatureData)
    .digest('hex');

  return signature === expectedSignature;
}
