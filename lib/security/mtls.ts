import { createHash, createHmac } from 'crypto';

export interface MTLSVerificationResult {
  authenticated: boolean;
  serviceId?: string;
  error?: string;
}

const ALLOWED_INTERNAL_SERVICES = new Set([
  'gtm-service',
  'content-studio-service',
  'orchestrator-service',
  'campaign-engine',
  'crm-sync-engine',
  'dealflow-llm-router',
  'api-gateway'
]);

const INTERNAL_MTLS_SECRET = process.env.INTERNAL_MTLS_SECRET || process.env.JWT_SECRET || 'internal-mtls-secret-dealflow-default';

/**
 * Generates secure internal service headers simulating mutual TLS authentication token
 * and client certificate fingerprint.
 */
export function getInternalMTLSHeaders(serviceId: string): Record<string, string> {
  const timestamp = Date.now().toString();
  const certThumbprint = createHash('sha256').update(`cert-${serviceId}-${INTERNAL_MTLS_SECRET}`).digest('hex');
  const signature = createHmac('sha256', INTERNAL_MTLS_SECRET)
    .update(`${serviceId}:${certThumbprint}:${timestamp}`)
    .digest('hex');

  return {
    'X-Client-Cert-Thumbprint': certThumbprint,
    'X-Internal-Service-Id': serviceId,
    'X-Internal-Timestamp': timestamp,
    'X-Internal-Service-Auth': signature,
  };
}

/**
 * Verifies mutual TLS (mTLS) credentials and headers for internal microservice requests.
 */
export function verifyInternalMTLS(headers: Headers | Record<string, string>): MTLSVerificationResult {
  const getHeader = (key: string): string | null => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(key);
    }
    const lowerKey = key.toLowerCase();
    const record = headers as Record<string, string>;
    for (const k of Object.keys(record)) {
      if (k.toLowerCase() === lowerKey) return record[k];
    }
    return null;
  };

  const serviceId = getHeader('X-Internal-Service-Id') || 'api-gateway';
  const certThumbprint = getHeader('X-Client-Cert-Thumbprint');
  const timestampStr = getHeader('X-Internal-Timestamp');
  const authSignature = getHeader('X-Internal-Service-Auth');

  // Allow development / internal bypass if headers are omitted in test mode
  if (!certThumbprint && !authSignature) {
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_MTLS === 'true') {
      return { authenticated: true, serviceId };
    }
    return { authenticated: false, error: 'Missing mTLS authentication headers (X-Client-Cert-Thumbprint, X-Internal-Service-Auth)' };
  }

  if (!ALLOWED_INTERNAL_SERVICES.has(serviceId)) {
    return { authenticated: false, error: `Unauthorized internal service: ${serviceId}` };
  }

  if (timestampStr) {
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Math.abs(Date.now() - timestamp) > 300000) { // 5 min window
      return { authenticated: false, error: 'mTLS authentication timestamp expired or invalid' };
    }
  }

  // Verify signature
  const expectedThumbprint = createHash('sha256').update(`cert-${serviceId}-${INTERNAL_MTLS_SECRET}`).digest('hex');
  if (certThumbprint && certThumbprint !== expectedThumbprint) {
    return { authenticated: false, error: 'Invalid client certificate thumbprint' };
  }

  if (authSignature && timestampStr && certThumbprint) {
    const expectedSig = createHmac('sha256', INTERNAL_MTLS_SECRET)
      .update(`${serviceId}:${certThumbprint}:${timestampStr}`)
      .digest('hex');

    if (authSignature !== expectedSig) {
      return { authenticated: false, error: 'Invalid internal mTLS auth signature' };
    }
  }

  return { authenticated: true, serviceId };
}
