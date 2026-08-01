import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = (process.env.PINECONE_API_KEY || "").trim();

const indexName = process.env.PINECONE_INDEX || 'quickstart';
const dimension = parseInt(process.env.PINECONE_DIMENSION || '384'); // Matching HuggingFace all-MiniLM-L6-v2
const metric = (process.env.PINECONE_METRIC as 'cosine' | 'euclidean' | 'dotproduct') || 'cosine';

let pcInstance: Pinecone | null = null;

export function getPineconeClient(): Pinecone | null {
  if (!apiKey) {
    return null;
  }
  if (!pcInstance) {
    try {
      pcInstance = new Pinecone({ apiKey });
    } catch (err) {
      console.warn('[Pinecone] Failed to initialize Pinecone client:', err);
      return null;
    }
  }
  return pcInstance;
}

if (!apiKey) {
  console.warn('PINECONE_API_KEY is missing or invalid. Vector operations will be limited.');
}

/**
 * Ensures the Pinecone index exists with the correct configuration.
 */
export async function initPineconeIndex() {
  const pc = getPineconeClient();
  if (!pc) {
    console.warn('[Pinecone] Cannot initialize index: PINECONE_API_KEY is not configured.');
    return null;
  }

  try {
    const response = await pc.listIndexes();
    const indexExists = response.indexes?.some(idx => idx.name === indexName);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName} (dim: ${dimension}, metric: ${metric})...`);
      await pc.createIndex({
        name: indexName,
        dimension,
        metric,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log('Pinecone index created successfully.');
      
      // Wait for index to be ready
      let ready = false;
      while (!ready) {
        const description = await pc.describeIndex(indexName);
        if (description.status?.ready) {
          ready = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return pc.index(indexName);
  } catch (error) {
    console.error('Failed to initialize Pinecone index:', error);
    return null;
  }
}

/**
 * Gets the Pinecone index instance with automatic initialization check.
 */
export async function getPineconeIndex() {
  const pc = getPineconeClient();
  if (!pc) {
    return null;
  }

  try {
    return pc.index(indexName);
  } catch (error) {
    console.error('Error getting Pinecone index:', error);
    return null;
  }
}

export default getPineconeClient();
