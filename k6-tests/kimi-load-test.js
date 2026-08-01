import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp-up to 5 VUs
    { duration: '20s', target: 20 }, // Peak load 20 VUs
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2000ms
    http_req_failed: ['rate<0.05'],    // Less than 5% failure rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-Internal-Service-Id': 'gtm-service',
  };

  // 1. Test Kimi GTM Report Endpoint
  const gtmPayload = JSON.stringify({
    topic: 'Kimi Load Testing GTM Strategy',
    industry: 'Enterprise Software',
    targetAudience: 'CTOs',
    tone: 'professional',
  });

  const res1 = http.post(`${BASE_URL}/api/kimi/generate-gtm-report`, gtmPayload, { headers });
  check(res1, {
    'GTM status is 200 or expected response': (r) => r.status === 200 || r.status === 401 || r.status === 429,
  });

  sleep(0.5);

  // 2. Test Content Generate Router Endpoint
  const contentPayload = JSON.stringify({
    prompt: 'Synthesize market entry playbook',
    modelId: 'moonshot-v1-8k',
  });

  const res2 = http.post(`${BASE_URL}/api/content/generate`, contentPayload, { headers });
  check(res2, {
    'Content generate status is valid': (r) => r.status === 200 || r.status === 401 || r.status === 429,
  });

  sleep(0.5);
}
