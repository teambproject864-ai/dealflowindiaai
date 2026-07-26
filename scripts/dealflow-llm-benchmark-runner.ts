// Benchmark Runner for DealFlow LLM 100% Resolution Verification
import { DealflowDomainEvaluator } from '../lib/dealflow-llm/dealflow-domain-evaluator';
import { DealflowLLM } from '../lib/dealflow-llm/dealflow-llm';
import * as fs from 'fs';
import * as path from 'path';

function runBenchmark() {
  console.log('🚀 Starting DealFlow LLM 100% Domain Knowledge Benchmark Execution...\n');
  
  const dealflowLLM = new DealflowLLM();
  // Train model on master domain dataset
  const trainingData = dealflowLLM.getDataPipeline().ingestDomainDataset();
  trainingData.forEach(dp => dealflowLLM.addTrainingData(dp));
  const learningState = dealflowLLM.train(5);

  console.log(`✅ Model Training Complete. Epochs: ${learningState.epoch}, Total Loss: ${learningState.loss.total.toFixed(4)}`);

  const evaluator = new DealflowDomainEvaluator(dealflowLLM);
  const report = evaluator.evaluateDomainCoverage();

  console.log('\n======================================================');
  console.log('📊 DEALFLOW LLM DOMAIN EVALUATION SUMMARY REPORT');
  console.log('======================================================');
  console.log(`Total Queries Evaluated : ${report.totalQueriesEvaluated}`);
  console.log(`Successful Resolutions  : ${report.successfulResolutions}`);
  console.log(`Resolution Percentage   : ${report.resolutionPercentage.toFixed(2)}%`);
  console.log(`Overall Accuracy Score  : ${(report.overallAccuracyScore * 100).toFixed(2)}%`);
  console.log(`Target Achieved (100%)  : ${report.isTargetAchieved ? 'YES ✅' : 'NO ❌'}`);

  console.log('\n--- Domain Cluster Breakdown ---');
  for (const [cluster, stats] of Object.entries(report.domainClusterCoverage)) {
    console.log(`• ${cluster.padEnd(30)} : ${stats.resolved}/${stats.total} (${stats.percentage.toFixed(0)}%)`);
  }

  console.log('\n--- Stakeholder Persona Performance ---');
  for (const [persona, stats] of Object.entries(report.personaPerformance)) {
    console.log(`• ${persona.padEnd(20)} : ${stats.resolved}/${stats.total} (${stats.percentage.toFixed(0)}%)`);
  }

  const failedQueries = report.results.filter(r => !r.isResolved);
  if (failedQueries.length > 0) {
    console.log('\n--- Unresolved Query Diagnostics ---');
    failedQueries.forEach(fq => {
      console.log(`❌ [${fq.testId}] (${fq.cluster}/${fq.subDomain}): "${fq.question}"`);
      console.log(`   Matched Concepts: [${fq.matchedConcepts.join(', ')}] | Unmatched: [${fq.unmatchedConcepts.join(', ')}]`);
      console.log(`   Selected Entry Title: "${fq.actualAnswer.split('\n')[0].slice(0, 80)}..."`);
    });
  }

  console.log('\n======================================================\n');


  if (!report.isTargetAchieved) {
    console.error('❌ Benchmark failed to reach 100% resolution target!');
    process.exit(1);
  }

  console.log('🎉 DealFlow LLM successfully achieved 100% domain knowledge resolution!');
  return report;
}

runBenchmark();
