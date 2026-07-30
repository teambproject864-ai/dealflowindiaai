// lib/testing/agent-testing-suite.ts
import { ALMAMemory, evaluateContextRelevance, detectMemoryHallucination } from '../alma';

/**
 * Voice Recognition Accuracy (ASR) Metrics Evaluator
 */
export interface ASREvalSample {
  reference: string;
  hypothesis: string;
}

export interface ASREvalResult {
  wordErrorRate: number; // WER = (S + D + I) / N
  characterErrorRate: number; // CER
  accuracy: number; // 1 - WER
  totalWords: number;
}

export function evaluateASRAccuracy(samples: ASREvalSample[]): ASREvalResult {
  let totalErrors = 0;
  let totalWords = 0;
  let totalCharErrors = 0;
  let totalChars = 0;

  for (const sample of samples) {
    const refWords = sample.reference.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const hypWords = sample.hypothesis.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // Compute Levenshtein distance for words
    const wordDistance = levenshteinDistance(refWords, hypWords);
    totalErrors += wordDistance;
    totalWords += refWords.length;

    // Compute Levenshtein distance for characters
    const refChars = sample.reference.toLowerCase().replace(/\s+/g, '');
    const hypChars = sample.hypothesis.toLowerCase().replace(/\s+/g, '');
    const charDistance = levenshteinDistance(refChars.split(''), hypChars.split(''));
    totalCharErrors += charDistance;
    totalChars += refChars.length;
  }

  const wer = totalWords > 0 ? Math.min(1.0, totalErrors / totalWords) : 0;
  const cer = totalChars > 0 ? Math.min(1.0, totalCharErrors / totalChars) : 0;
  const accuracy = Math.max(0, 1.0 - wer);

  return {
    wordErrorRate: Math.round(wer * 1000) / 1000,
    characterErrorRate: Math.round(cer * 1000) / 1000,
    accuracy: Math.round(accuracy * 1000) / 1000,
    totalWords
  };
}

/**
 * Chat Intent Classification Evaluator
 */
export interface IntentEvalSample {
  utterance: string;
  expectedIntent: string;
  predictedIntent: string;
}

export interface IntentEvalResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalSamples: number;
  correctCount: number;
  intentBreakdown: Record<string, { precision: number; recall: number; f1: number }>;
}

export function evaluateIntentClassification(samples: IntentEvalSample[]): IntentEvalResult {
  if (!samples || samples.length === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1Score: 0, totalSamples: 0, correctCount: 0, intentBreakdown: {} };
  }

  let correctCount = 0;
  const intents = new Set<string>();
  samples.forEach(s => {
    intents.add(s.expectedIntent);
    intents.add(s.predictedIntent);
    if (s.expectedIntent === s.predictedIntent) correctCount++;
  });

  const accuracy = correctCount / samples.length;
  const intentBreakdown: Record<string, { precision: number; recall: number; f1: number }> = {};

  let sumPrecision = 0;
  let sumRecall = 0;

  intents.forEach(intent => {
    let tp = 0, fp = 0, fn = 0;
    samples.forEach(s => {
      if (s.predictedIntent === intent && s.expectedIntent === intent) tp++;
      else if (s.predictedIntent === intent && s.expectedIntent !== intent) fp++;
      else if (s.predictedIntent !== intent && s.expectedIntent === intent) fn++;
    });

    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    intentBreakdown[intent] = {
      precision: Math.round(prec * 1000) / 1000,
      recall: Math.round(rec * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000
    };

    sumPrecision += prec;
    sumRecall += rec;
  });

  const avgPrecision = sumPrecision / intents.size;
  const avgRecall = sumRecall / intents.size;
  const f1Score = avgPrecision + avgRecall > 0 ? (2 * avgPrecision * avgRecall) / (avgPrecision + avgRecall) : 0;

  return {
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(avgPrecision * 1000) / 1000,
    recall: Math.round(avgRecall * 1000) / 1000,
    f1Score: Math.round(f1Score * 1000) / 1000,
    totalSamples: samples.length,
    correctCount,
    intentBreakdown
  };
}

/**
 * MAG Memory Retrieval & Context Recall Evaluator
 */
export interface MAGRetrievalEvalSample {
  query: string;
  expectedMemoryIds: string[];
  retrievedMemories: ALMAMemory[];
  retrievalLatencyMs: number;
}

export interface MAGRetrievalEvalResult {
  precisionAtK: number;
  recallAtK: number;
  ndcgScore: number;
  averageLatencyMs: number;
  contextRelevanceScore: number;
}

export function evaluateMAGRetrieval(samples: MAGRetrievalEvalSample[]): MAGRetrievalEvalResult {
  if (!samples || samples.length === 0) {
    return { precisionAtK: 0, recallAtK: 0, ndcgScore: 0, averageLatencyMs: 0, contextRelevanceScore: 0 };
  }

  let totalPrecision = 0;
  let totalRecall = 0;
  let totalNDCG = 0;
  let totalLatency = 0;
  let totalRelevance = 0;

  samples.forEach(sample => {
    const k = Math.max(1, sample.retrievedMemories.length);
    const retrievedIds = sample.retrievedMemories.map(m => m.id).filter(Boolean) as string[];
    const expectedSet = new Set(sample.expectedMemoryIds);

    const relevantCount = retrievedIds.filter(id => expectedSet.has(id)).length;
    const precision = relevantCount / k;
    const recall = expectedSet.size > 0 ? relevantCount / expectedSet.size : 1;

    // Calculate Normalized Discounted Cumulative Gain (NDCG)
    let dcg = 0;
    let idcg = 0;
    retrievedIds.forEach((id, idx) => {
      const rel = expectedSet.has(id) ? 1 : 0;
      dcg += rel / Math.log2(idx + 2);
    });
    sample.expectedMemoryIds.forEach((_, idx) => {
      idcg += 1 / Math.log2(idx + 2);
    });
    const ndcg = idcg > 0 ? dcg / idcg : 0;

    const relevanceScore = evaluateContextRelevance(sample.query, sample.retrievedMemories);

    totalPrecision += precision;
    totalRecall += recall;
    totalNDCG += ndcg;
    totalLatency += sample.retrievalLatencyMs;
    totalRelevance += relevanceScore;
  });

  const count = samples.length;

  return {
    precisionAtK: Math.round((totalPrecision / count) * 1000) / 1000,
    recallAtK: Math.round((totalRecall / count) * 1000) / 1000,
    ndcgScore: Math.round((totalNDCG / count) * 1000) / 1000,
    averageLatencyMs: Math.round(totalLatency / count),
    contextRelevanceScore: Math.round((totalRelevance / count) * 1000) / 1000
  };
}

/**
 * End-to-End User Journey Evaluator
 */
export interface UserJourneyStep {
  userTurnText: string;
  agentResponseText: string;
  expectedKeywords: string[];
  latencyMs: number;
  retrievedMemories?: ALMAMemory[];
}

export interface UserJourneyEvalResult {
  overallCoherenceScore: number;
  averageTurnLatencyMs: number;
  hallucinationRate: number;
  relevanceScore: number;
  successStatus: boolean;
}

export function evaluateUserJourney(steps: UserJourneyStep[]): UserJourneyEvalResult {
  if (!steps || steps.length === 0) {
    return { overallCoherenceScore: 0, averageTurnLatencyMs: 0, hallucinationRate: 0, relevanceScore: 0, successStatus: false };
  }

  let totalLatency = 0;
  let totalCoherence = 0;
  let totalHallucinations = 0;
  let totalRelevance = 0;

  steps.forEach(step => {
    totalLatency += step.latencyMs;

    // Evaluate Keyword Match Coherence
    const responseText = step.agentResponseText.toLowerCase();
    const matchedKeywords = step.expectedKeywords.filter(k => responseText.includes(k.toLowerCase())).length;
    const coherence = step.expectedKeywords.length > 0 ? matchedKeywords / step.expectedKeywords.length : 1.0;
    totalCoherence += coherence;

    // Evaluate Memory Hallucination
    const memories = step.retrievedMemories || [];
    const hallucinationCheck = detectMemoryHallucination(step.agentResponseText, memories);
    if (hallucinationCheck.isHallucination) {
      totalHallucinations++;
    }

    const relevance = evaluateContextRelevance(step.userTurnText, memories);
    totalRelevance += relevance;
  });

  const count = steps.length;
  const overallCoherence = totalCoherence / count;
  const hallucinationRate = totalHallucinations / count;
  const relevanceScore = totalRelevance / count;
  const averageLatency = totalLatency / count;

  const successStatus = overallCoherence >= 0.7 && hallucinationRate <= 0.2 && averageLatency < 3000;

  return {
    overallCoherenceScore: Math.round(overallCoherence * 1000) / 1000,
    averageTurnLatencyMs: Math.round(averageLatency),
    hallucinationRate: Math.round(hallucinationRate * 1000) / 1000,
    relevanceScore: Math.round(relevanceScore * 1000) / 1000,
    successStatus
  };
}

/**
 * Levenshtein distance helper
 */
function levenshteinDistance(a: string[], b: string[]): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
