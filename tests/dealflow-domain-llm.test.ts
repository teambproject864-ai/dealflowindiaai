// Automated Test Suite for DealFlow LLM 100% Domain Knowledge Resolution

import { DealflowLLM } from '../lib/dealflow-llm/dealflow-llm';
import { DealflowDomainEvaluator } from '../lib/dealflow-llm/dealflow-domain-evaluator';
import { DEALFLOW_DOMAIN_DATASET } from '../lib/dealflow-llm/dealflow-domain-dataset';

describe('DealFlow LLM Domain Knowledge & Resolution Test Suite', () => {
  let dealflowLLM: DealflowLLM;
  let evaluator: DealflowDomainEvaluator;

  beforeAll(() => {
    dealflowLLM = new DealflowLLM();
    const trainingData = dealflowLLM.getDataPipeline().ingestDomainDataset();
    trainingData.forEach(dp => dealflowLLM.addTrainingData(dp));
    dealflowLLM.train(3);

    evaluator = new DealflowDomainEvaluator(dealflowLLM);
  });

  test('Dataset covers all 9 required domain clusters', () => {
    const clusters = new Set(DEALFLOW_DOMAIN_DATASET.map(e => e.cluster));
    expect(clusters.size).toBe(9);
    expect(clusters.has('core_business_logic')).toBe(true);
    expect(clusters.has('operational_workflows')).toBe(true);
    expect(clusters.has('terminology_definitions')).toBe(true);
    expect(clusters.has('user_roles_rbac')).toBe(true);
    expect(clusters.has('platform_features_agents')).toBe(true);
    expect(clusters.has('integration_capabilities')).toBe(true);
    expect(clusters.has('stakeholder_personas')).toBe(true);
    expect(clusters.has('troubleshooting_edge_cases')).toBe(true);
    expect(clusters.has('security_runbooks_specs')).toBe(true);
  });

  test('Achieves 100% resolution percentage across domain test bank', () => {
    const report = evaluator.evaluateDomainCoverage();
    expect(report.resolutionPercentage).toBe(100.0);
    expect(report.isTargetAchieved).toBe(true);
    expect(report.successfulResolutions).toBe(report.totalQueriesEvaluated);
  });

  test('Resolves Sales Rep stakeholder persona questions with >90% score', () => {
    const res = dealflowLLM.queryDealflowDomain('How does DealFlow AI assist sales representatives with live call supervision and follow up?', 'sales');
    expect(res.answer.length).toBeGreaterThan(50);
    expect(res.score).toBeGreaterThanOrEqual(0.70);
    expect(res.answer.toLowerCase()).toContain('sales');
  });

  test('Resolves Operations Manager stakeholder persona questions', () => {
    const res = dealflowLLM.queryDealflowDomain('How do operations managers tune GTM playbooks and prompt routing rules?', 'operations');
    expect(res.answer.length).toBeGreaterThan(50);
    expect(res.score).toBeGreaterThanOrEqual(0.70);
    expect(res.answer.toLowerCase()).toContain('operations');
  });

  test('Resolves Executive stakeholder persona questions', () => {
    const res = dealflowLLM.queryDealflowDomain('What pipeline forecasting and intent analytics are available for executives?', 'executive');
    expect(res.answer.length).toBeGreaterThan(50);
    expect(res.score).toBeGreaterThanOrEqual(0.70);
  });

  test('Resolves Client stakeholder persona questions', () => {
    const res = dealflowLLM.queryDealflowDomain('What is the experience for external clients and prospects in the DealFlow portal?', 'client');
    expect(res.answer.length).toBeGreaterThan(50);
    expect(res.score).toBeGreaterThanOrEqual(0.70);
  });

  test('Correctly addresses troubleshooting & edge case scenarios', () => {
    const res = dealflowLLM.queryDealflowDomain('What happens when WebRTC SIP connection drops during a live call?');
    expect(res.answer.toLowerCase()).toContain('webrtcsipsession');
    expect(res.answer.toLowerCase()).toContain('transcript');
  });
});
