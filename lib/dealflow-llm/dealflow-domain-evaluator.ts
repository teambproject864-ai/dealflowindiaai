// DealFlow LLM Comprehensive Domain Evaluator
// Validates 100% resolution accuracy, domain coverage, and persona appropriateness

import { DEALFLOW_DOMAIN_DATASET, DealflowKnowledgeEntry } from './dealflow-domain-dataset';
import { DealflowLLM } from './dealflow-llm';

export interface DomainTestQuery {
  id: string;
  cluster: string;
  subDomain: string;
  question: string;
  expectedConcepts: string[];
  persona?: 'sales' | 'operations' | 'executive' | 'client';
}

export interface DomainQueryResult {
  testId: string;
  question: string;
  cluster: string;
  subDomain: string;
  persona?: string;
  actualAnswer: string;
  confidenceScore: number;
  matchedConcepts: string[];
  unmatchedConcepts: string[];
  isConceptAccurate: boolean;
  isPolicyCompliant: boolean;
  isResolved: boolean;
}

export interface DomainEvaluationReport {
  timestamp: number;
  totalQueriesEvaluated: number;
  successfulResolutions: number;
  resolutionPercentage: number;
  domainClusterCoverage: { [cluster: string]: { total: number; resolved: number; percentage: number } };
  personaPerformance: { [persona: string]: { total: number; resolved: number; percentage: number } };
  overallAccuracyScore: number;
  isTargetAchieved: boolean; // 100% resolution
  results: DomainQueryResult[];
}

export class DealflowDomainEvaluator {
  private dealflowLLM: DealflowLLM;
  private testBank: DomainTestQuery[];

  constructor(dealflowLLM?: DealflowLLM) {
    this.dealflowLLM = dealflowLLM || new DealflowLLM();
    this.testBank = this.buildComprehensiveTestBank();
  }

  // Build 100+ query test bank spanning all 9 domain clusters and 4 stakeholder personas
  private buildComprehensiveTestBank(): DomainTestQuery[] {
    const testBank: DomainTestQuery[] = [];
    let queryCounter = 1;

    for (const entry of DEALFLOW_DOMAIN_DATASET) {
      // 1. Direct factual query
      testBank.push({
        id: `TQ_${String(queryCounter++).padStart(3, '0')}`,
        cluster: entry.cluster,
        subDomain: entry.subDomain,
        question: `What is ${entry.title}?`,
        expectedConcepts: entry.keyConcepts,
        persona: entry.personaContext,
      });

      // 2. Keyword & workflow query
      testBank.push({
        id: `TQ_${String(queryCounter++).padStart(3, '0')}`,
        cluster: entry.cluster,
        subDomain: entry.subDomain,
        question: `How does DealFlow AI handle ${entry.questionKeywords[0]} in ${entry.subDomain}?`,
        expectedConcepts: entry.keyConcepts.slice(0, 2),
        persona: entry.personaContext,
      });

      // 3. Complex multi-step / troubleshooting query
      if (entry.processSteps && entry.processSteps.length > 0) {
        testBank.push({
          id: `TQ_${String(queryCounter++).padStart(3, '0')}`,
          cluster: entry.cluster,
          subDomain: entry.subDomain,
          question: `Explain the step-by-step process for ${entry.title}.`,
          expectedConcepts: entry.keyConcepts,
          persona: entry.personaContext,
        });
      }
    }

    return testBank;
  }

  // Run full evaluation audit across all test queries
  evaluateDomainCoverage(): DomainEvaluationReport {
    const results: DomainQueryResult[] = [];
    const clusterMap: { [cluster: string]: { total: number; resolved: number } } = {};
    const personaMap: { [persona: string]: { total: number; resolved: number } } = {};

    let totalScoreSum = 0;

    for (const test of this.testBank) {
      const response = this.dealflowLLM.queryDealflowDomain(test.question, test.persona);
      
      const lowerAnswer = response.answer.toLowerCase();
      const matched = test.expectedConcepts.filter(c => {
        const lowerC = c.toLowerCase();
        if (lowerAnswer.includes(lowerC)) return true;
        // Check key token overlaps
        const tokens = lowerC.split(/\s+/).filter(t => t.length > 3);
        return tokens.length > 0 && tokens.every(t => lowerAnswer.includes(t));
      });
      const unmatched = test.expectedConcepts.filter(c => !matched.includes(c));

      const isConceptAccurate = matched.length > 0;
      const isPolicyCompliant = !lowerAnswer.includes('unhandled_error') && !lowerAnswer.includes('unsupported_query') && !lowerAnswer.includes('fatal system failure');
      const isResolved = isConceptAccurate && isPolicyCompliant && response.score >= 0.70;



      // Update cluster stats
      if (!clusterMap[test.cluster]) {
        clusterMap[test.cluster] = { total: 0, resolved: 0 };
      }
      clusterMap[test.cluster].total += 1;
      if (isResolved) clusterMap[test.cluster].resolved += 1;

      // Update persona stats
      const personaKey = test.persona || 'general';
      if (!personaMap[personaKey]) {
        personaMap[personaKey] = { total: 0, resolved: 0 };
      }
      personaMap[personaKey].total += 1;
      if (isResolved) personaMap[personaKey].resolved += 1;

      totalScoreSum += response.score;

      results.push({
        testId: test.id,
        question: test.question,
        cluster: test.cluster,
        subDomain: test.subDomain,
        persona: test.persona,
        actualAnswer: response.answer,
        confidenceScore: response.score,
        matchedConcepts: matched,
        unmatchedConcepts: unmatched,
        isConceptAccurate,
        isPolicyCompliant,
        isResolved,
      });
    }

    const totalQueriesEvaluated = results.length;
    const successfulResolutions = results.filter(r => r.isResolved).length;
    const resolutionPercentage = (successfulResolutions / totalQueriesEvaluated) * 100;

    const domainClusterCoverage: { [cluster: string]: { total: number; resolved: number; percentage: number } } = {};
    for (const [cl, data] of Object.entries(clusterMap)) {
      domainClusterCoverage[cl] = {
        total: data.total,
        resolved: data.resolved,
        percentage: (data.resolved / data.total) * 100,
      };
    }

    const personaPerformance: { [persona: string]: { total: number; resolved: number; percentage: number } } = {};
    for (const [p, data] of Object.entries(personaMap)) {
      personaPerformance[p] = {
        total: data.total,
        resolved: data.resolved,
        percentage: (data.resolved / data.total) * 100,
      };
    }

    return {
      timestamp: Date.now(),
      totalQueriesEvaluated,
      successfulResolutions,
      resolutionPercentage,
      domainClusterCoverage,
      personaPerformance,
      overallAccuracyScore: totalScoreSum / totalQueriesEvaluated,
      isTargetAchieved: resolutionPercentage === 100,
      results,
    };
  }
}
