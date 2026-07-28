// tests/dgx-spark-deployment.test.ts
import assert from 'assert';
import { validateExecutionEnvironment } from '../lib/infrastructure-config';
import { SecureAgentOrchestrator } from '../lib/secure-agent-framework';
import { PlaybookEngine, Playbook } from '../lib/playbook-engine';

/**
 * Automated Integration Tests for Nvidia DGX Spark Deployment
 */
async function testEndToEndDeployment() {
  console.log('🚀 Starting end-to-end validation of DGX Spark Deployment...');

  // 1. Validate Infrastructure
  const env = await validateExecutionEnvironment();
  assert.strictEqual(env.drivers, 'PASSED');
  assert.strictEqual(env.nvlink, 'ACTIVE');
  console.log('✅ Infrastructure validation successful.');

  // 2. Setup Secure Agent Stack
  const orchestrator = new SecureAgentOrchestrator();
  await orchestrator.initializeStack();
  console.log('✅ Secure agent stack initialized.');

  // 3. Execute Sample Playbook
  const engine = new PlaybookEngine(orchestrator);
  const samplePlaybook: Playbook = {
    id: 'ai-experiment-001',
    version: '1.0.0',
    name: 'Sample Playbook',
    description: 'DGX Spark Deployment Test Playbook',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      { id: '1', name: 'Provision Namespace', action: 'provision_namespace', parameters: {}, requiresApproval: false },
      { id: '2', name: 'Load Model', action: 'load_model', parameters: { modelId: 'llama-2-70b' }, requiresApproval: true }
    ]
  };

  engine.createPlaybook(samplePlaybook);
  await engine.executePlaybook(samplePlaybook.id, 'admin-user');
  console.log('✅ End-to-end playbook execution successful.');
  
  console.log('🎉 Deployment Validation Complete.');
}

testEndToEndDeployment().catch(err => {
  console.error('❌ Deployment Validation Failed:', err);
  process.exit(1);
});
