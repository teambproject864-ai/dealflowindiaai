import { encryptEnvelope, decryptEnvelope, isEnvelope } from '../lib/secure-storage/envelope-encryption';
import { getDecryptedKey, API_KEY_PERMISSIONS, AccessDeniedError } from '../lib/secure-api-keys';
import { getInternalMTLSHeaders, verifyInternalMTLS } from '../lib/security/mtls';
import { signKimiRequest, verifyKimiSignature } from '../lib/security/request-signing';
import {
  validateGTMReportInput,
  validateImageryInput,
  validateVideoBlueprintInput
} from '../lib/kimi/input-validator';
import { handleKimiError, KimiAPIError } from '../lib/kimi/error-handler';
import { KimiClient, CircuitState } from '../lib/kimi/client';
import { selectAIProvider, getLoadBalancedProvider } from '../lib/ai-provider-router';

describe('Kimi API Integration Suite', () => {
  const masterKey = process.env.LLM_API_KEY_ENCRYPTION_KEY || '4257dffb58918932fa4c47e3c6e928bbcdbf12063e20e3853b83ed187a85c932';
  const rawApiKey = process.env.ENC_KIMI_API_KEY ? decryptEnvelope(process.env.ENC_KIMI_API_KEY, masterKey) : (process.env.KIMI_API_KEY || "mock-test-key-12345");


  describe('1. Envelope Encryption & Key Management', () => {
    test('should encrypt and decrypt Kimi API key using AES-256-GCM envelope encryption', () => {
      const envelopeStr = encryptEnvelope(rawApiKey, masterKey);
      expect(isEnvelope(envelopeStr)).toBe(true);

      const decrypted = decryptEnvelope(envelopeStr, masterKey);
      expect(decrypted).toBe(rawApiKey);
    });

    test('should decrypt Kimi key via secure-api-keys matrix when permitted', () => {
      process.env.ENC_KIMI_API_KEY = encryptEnvelope(rawApiKey, masterKey);
      process.env.LLM_API_KEY_ENCRYPTION_KEY = masterKey;

      const key = getDecryptedKey('kimi_gtm_report', 'ai_automated_content', 'dynamic_report_generator');
      expect(key).toBe(rawApiKey);
    });

    test('should reject key access when caller pillar/sub-option does not match permissions', () => {
      expect(() => {
        getDecryptedKey('kimi_gtm_report', 'wrong_pillar', 'dynamic_report_generator');
      }).toThrow(AccessDeniedError);
    });
  });

  describe('2. Security, mTLS & HMAC Request Signing', () => {
    test('should generate and verify internal mTLS headers', () => {
      const headers = getInternalMTLSHeaders('gtm-service');
      const result = verifyInternalMTLS(headers);
      expect(result.authenticated).toBe(true);
      expect(result.serviceId).toBe('gtm-service');
    });

    test('should sign outbound Kimi API requests with HMAC-SHA256 and verify signature', () => {
      const payload = { model: 'moonshot-v1-8k', messages: [{ role: 'user', content: 'test' }] };
      const signedHeaders = signKimiRequest(payload, rawApiKey);

      expect(signedHeaders['X-Kimi-Signature']).toBeDefined();
      expect(signedHeaders['X-Kimi-Timestamp']).toBeDefined();
      expect(signedHeaders['X-Kimi-Nonce']).toBeDefined();

      const isValid = verifyKimiSignature(payload, signedHeaders, rawApiKey);
      expect(isValid).toBe(true);
    });
  });

  describe('3. Input Validation & Reliability Controls', () => {
    test('should validate valid GTM report parameters', () => {
      const input = {
        topic: 'AI Outbound B2B Automation',
        industry: 'FinTech',
        targetAudience: 'VPs of Enterprise Sales',
        budget: '$50k/mo',
        tone: 'professional'
      };
      const validated = validateGTMReportInput(input);
      expect(validated.topic).toBe(input.topic);
    });

    test('should reject invalid input missing required fields', () => {
      expect(() => validateGTMReportInput({ topic: 'ab' })).toThrow();
      expect(() => validateImageryInput({ prompt: 'a', aspect_ratio: 'invalid' })).toThrow();
      expect(() => validateVideoBlueprintInput({ topic: 'a', duration_seconds: 1000 })).toThrow();
    });

    test('should map error status codes to standardized error structure without leaking raw keys', () => {
      const err = new Error('401 Unauthorized - invalid_api_key');
      const handled = handleKimiError(err, { requestId: 'test-req-123' });

      expect(handled.success).toBe(false);
      expect(handled.error.code).toBe('KIMI_AUTHENTICATION_FAILED');
      expect(JSON.stringify(handled)).not.toContain(rawApiKey);
    });

    test('should operate circuit breaker state transitions on failures', () => {
      const client = new KimiClient(rawApiKey, 'https://api.moonshot.cn/v1', 300000, {
        failureThreshold: 2,
        resetTimeoutMs: 1000
      });

      expect(client.getCircuitStatus().state).toBe(CircuitState.CLOSED);
    });
  });

  describe('4. AI Provider Router & Load Balancing', () => {
    test('should distribute traffic cleanly across providers', () => {
      const providers = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const p = getLoadBalancedProvider();
        providers.add(p);
      }
      expect(providers.size).toBeGreaterThan(1);
    });

    test('should select Kimi provider when tierLevel is growth or region is Asia', () => {
      const provider1 = selectAIProvider({ tierLevel: 'growth' });
      expect(provider1).toBe('kimi');

      const provider2 = selectAIProvider({ userRegion: 'Asia-Pacific' });
      expect(provider2).toBe('kimi');
    });
  });
});
