import { HermesMemoryOS } from '../lib/hermes';

describe('HermesMemoryOS', () => {
  let hermes: HermesMemoryOS;

  beforeEach(() => {
    hermes = new HermesMemoryOS({
      consolidationIntervalMs: 1000, // Fast for testing
      enableEncryption: false, // Disable for easier testing
    });
  });

  afterEach(() => {
    hermes.stopConsolidationProcess();
  });

  test('should store and retrieve a memory', async () => {
    const stored = await hermes.storeMemory({
      content: 'Test memory content',
      category: 'test',
      keywords: ['test', 'memory'],
      importance: 8,
      metadata: {},
    });

    expect(stored.id).toBeDefined();
    expect(stored.content).toBe('Test memory content');

    const retrieved = await hermes.retrieveMemory(stored.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.content).toBe('Test memory content');
  });

  test('should search memories semantically', async () => {
    await hermes.storeMemory({
      content: 'Customer inquiry about pricing',
      category: 'support',
      keywords: ['pricing', 'inquiry'],
      importance: 7,
      metadata: {},
    });

    await hermes.storeMemory({
      content: 'Product feature specification',
      category: 'product',
      keywords: ['feature', 'spec'],
      importance: 6,
      metadata: {},
    });

    const results = await hermes.searchMemories({
      query: 'How much does it cost?',
      limit: 2,
    });

    expect(results.length).toBeGreaterThan(0);
  });

  test('should track metrics', async () => {
    await hermes.storeMemory({
      content: 'Test',
      category: 'test',
      keywords: ['test'],
      importance: 5,
      metadata: {},
    });

    const metrics = hermes.getMetrics();
    expect(metrics.totalMemories).toBeGreaterThan(0);
    expect(metrics.byTier['short-term']).toBeGreaterThan(0);
  });
});
