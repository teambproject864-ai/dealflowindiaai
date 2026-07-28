import { getPineconeIndex } from './pinecone';
import { hfEmbed } from './huggingface';
import { ALMAMemory } from './alma';
import { db } from './firebase-admin';

export interface VectorSearchParams {
  query: string;
  leadId?: string;
  sessionId?: string;
  category?: string;
  layer?: string;
  limit?: number;
  minScore?: number;
  includeFullDoc?: boolean; // Whether to fetch the full document from Firestore
}

export interface VectorSearchResult {
  memory: ALMAMemory;
  score: number;
}

/**
 * Performs a comprehensive semantic search in vector storage with advanced metadata filtering
 * and optional document enrichment.
 */
export async function vectorSearch(params: VectorSearchParams): Promise<VectorSearchResult[]> {
  const index = await getPineconeIndex();
  if (!index) {
    console.error('[Search] Vector storage not available');
    return [];
  }

  try {
    // 1. Generate query embedding
    console.log(`[Search] Generating embedding for query: "${params.query.substring(0, 50)}..."`);
    const queryEmbedding = await hfEmbed(params.query);
    if (!queryEmbedding) {
      console.error('[Search] Failed to generate embedding');
      return [];
    }

    // 2. Build filter for retrieval
    const filter: any = {};
    if (params.leadId) {
      // Search specifically for this lead or global knowledge
      filter.leadId = { $in: [params.leadId, 'global'] };
    }
    if (params.sessionId) {
      filter.sessionId = params.sessionId;
    }
    if (params.category) {
      filter.category = params.category;
    }
    if (params.layer) {
      filter.layer = params.layer;
    }

    // 3. Query vector storage
    console.log('[Search] Querying vector storage with filters:', JSON.stringify(filter));
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: params.limit || 10,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeMetadata: true,
    });

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log('[Search] No matches found');
      return [];
    }

    // 4. Map results and filter by minScore
    let results: VectorSearchResult[] = queryResponse.matches
      .filter(match => !params.minScore || (match.score && match.score >= params.minScore))
      .map(match => ({
        memory: {
          id: match.id,
          ...(match.metadata as any),
        } as ALMAMemory,
        score: match.score || 0,
      }));

    // 5. Optionally enrich with full data records
    const currentDb = db;
    if (params.includeFullDoc && results.length > 0 && currentDb) {
      console.log(`[Search] Enriching ${results.length} results with record data...`);
      const enrichedResults = await Promise.all(
        results.map(async (res) => {
          try {
            const memoryId = res.memory.id;
            if (!memoryId) return res;
            const doc = await currentDb.collection('alma_memory').doc(memoryId).get();
            if (doc.exists) {
              return {
                ...res,
                memory: {
                  ...res.memory,
                  ...(doc.data() as ALMAMemory),
                  id: doc.id
                }
              };
            }
            return res;
          } catch (e) {
            console.warn(`[VectorSearch] Could not fetch full doc for ${res.memory.id || "unknown"}:`, e);
            return res;
          }
        })
      );
      results = enrichedResults;
    }

    console.log(`[VectorSearch] Found ${results.length} relevant memories`);
    return results;
  } catch (error) {
    console.error('[VectorSearch] Error during vector search:', error);
    return [];
  }
}

/**
 * Combined search that uses both vector similarity and specific Firestore queries if needed.
 */
export async function hybridSearch(params: VectorSearchParams) {
  // Currently, we primarily use vector search with metadata filtering as it's most efficient
  // for the agent memory system. 
  const results = await vectorSearch(params);
  return results.slice(0, params.limit || 10);
}
