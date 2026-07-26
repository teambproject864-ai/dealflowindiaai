import { initPineconeIndex, getPineconeIndex } from '../lib/pinecone';
import { syncMemoryToPinecone, deleteMemoryFromPinecone } from '../lib/vector-sync';
import { vectorSearch } from '../lib/vector-search';
import { ALMAMemory } from '../lib/alma';

async function testPineconeIntegration() {
  console.log('--- Starting Pinecone + Firebase Integration Test ---');

  try {
    // 1. Initialize Index
    console.log('Step 1: Initializing Pinecone index...');
    const index = await initPineconeIndex();
    if (!index) throw new Error('Failed to initialize Pinecone index');
    console.log('✓ Pinecone index ready.');

    // 2. Mock Memory Data
    const testMemoryId = 'test-memory-' + Date.now();
    const mockMemory: ALMAMemory = {
      leadId: 'test-lead-123',
      sessionId: 'test-session-456',
      agentName: 'TestAgent',
      category: 'Insight',
      content: 'The client is interested in scaling their outbound outreach using AI domains.',
      importance: 9,
      keywords: ['outbound', 'AI', 'scaling'],
      layer: 'short-term',
      createdAt: new Date().toISOString(),
    };

    // 3. Test Sync
    console.log('Step 2: Syncing mock memory to Pinecone...');
    await syncMemoryToPinecone(testMemoryId, mockMemory);
    console.log('✓ Memory synced.');

    // 4. Wait for indexing (Pinecone is eventually consistent)
    console.log('Waiting 5 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Test Search
    console.log('Step 3: Performing semantic search...');
    const results = await vectorSearch({
      query: 'How to scale outreach?',
      leadId: 'test-lead-123',
      limit: 1,
    });

    if (results.length > 0) {
      console.log('✓ Search successful!');
      console.log(`Match: "${results[0].memory.content}" (Score: ${results[0].score.toFixed(4)})`);
    } else {
      console.warn('! No search results found. This might be due to indexing delay.');
    }

    // 6. Test Delete
    console.log('Step 4: Deleting test memory...');
    await deleteMemoryFromPinecone(testMemoryId);
    console.log('✓ Memory deleted.');

    console.log('--- Integration Test Complete ---');
  } catch (error) {
    console.error('--- Integration Test Failed ---');
    console.error(error);
    process.exit(1);
  }
}

testPineconeIntegration();
