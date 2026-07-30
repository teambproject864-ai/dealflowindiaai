// tests/agent-load.test.ts
import { retrieveMemories, storeMemory, evaluateContextRelevance } from "../lib/alma";

export async function runAgentLoadTest(options: { concurrency?: number; iterationsPerUser?: number } = {}) {
  const concurrency = options.concurrency || 50;
  const iterationsPerUser = options.iterationsPerUser || 10;
  const totalRequests = concurrency * iterationsPerUser;

  console.log(`=== Starting Agent MAG Load Test (${concurrency} concurrent sessions, ${totalRequests} total requests) ===`);

  const startTime = Date.now();
  const latencies: number[] = [];
  let errorCount = 0;

  // Run load batch
  const userSimulations = Array.from({ length: concurrency }).map(async (_, userIdx) => {
    const sessionId = `load_session_${userIdx}_${Date.now()}`;
    const leadId = `load_lead_${userIdx % 10}`;

    for (let i = 0; i < iterationsPerUser; i++) {
      const reqStart = Date.now();
      try {
        const memories = await retrieveMemories({
          leadId,
          sessionId,
          queryText: `budget pricing compliance security query ${i}`,
          limit: 5
        });
        const elapsed = Date.now() - reqStart;
        latencies.push(elapsed);
      } catch (err) {
        errorCount++;
        latencies.push(Date.now() - reqStart);
      }
    }
  });

  await Promise.all(userSimulations);

  const totalDurationMs = Date.now() - startTime;
  const requestsPerSec = Math.round((totalRequests / (totalDurationMs / 1000)) * 100) / 100;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  console.log(`Load Test Completed in ${totalDurationMs}ms`);
  console.log(`Throughput: ${requestsPerSec} req/sec`);
  console.log(`Latencies -> Avg: ${avgLatency}ms | P50: ${p50}ms | P90: ${p90}ms | P99: ${p99}ms`);
  console.log(`Errors: ${errorCount} (${(errorCount / totalRequests) * 100}%)`);

  return {
    totalRequests,
    totalDurationMs,
    requestsPerSec,
    avgLatencyMs: avgLatency,
    p50Ms: p50,
    p90Ms: p90,
    p99Ms: p99,
    errorCount
  };
}

runAgentLoadTest({ concurrency: 20, iterationsPerUser: 5 }).catch(console.error);

