// lib/mempalace.ts
import { db } from './firebase-admin';
import type { MemoryEntry, MemoryCategory } from './types';
import admin from './firebase-admin';

const MEMORY_COLLECTION = 'mempalace';

/**
 * Saves a new memory entry to the MemPalace.
 */
export async function saveMemory(memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessCount' | 'lastAccessed'>) {
  if (!db) return null;
  
  const entry: MemoryEntry = {
    ...memory,
    createdAt: new Date().toISOString(),
    accessCount: 0,
    lastAccessed: new Date().toISOString()
  };

  const ref = await db.collection(MEMORY_COLLECTION).add(entry);
  return { ...entry, id: ref.id };
}

/**
 * Retrieves memories relevant to the current lead and conversation context.
 * For now, we fetch lead-specific memories and general "Rule" or "Knowledge" entries.
 */
export async function getRelevantMemories(leadId: string, queryKeywords: string[] = []): Promise<MemoryEntry[]> {
  if (!db) return [];

  try {
    // 1. Fetch lead-specific memories
    const leadMemories = await db.collection(MEMORY_COLLECTION)
      .where('leadId', '==', leadId)
      .orderBy('importance', 'desc')
      .limit(5)
      .get();

    // 2. Fetch global knowledge/rules (no specific leadId)
    const globalMemories = await db.collection(MEMORY_COLLECTION)
      .where('leadId', '==', 'global')
      .orderBy('importance', 'desc')
      .limit(5)
      .get();

    const results: MemoryEntry[] = [];
    
    leadMemories.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() } as MemoryEntry);
    });

    globalMemories.forEach(doc => {
      // Avoid duplicates
      if (!results.find(r => r.id === doc.id)) {
        results.push({ id: doc.id, ...doc.data() } as MemoryEntry);
      }
    });

    // Update access stats for retrieved memories
    if (db) {
      const currentDb = db;
      const batch = currentDb.batch();
      results.forEach(m => {
        if (m.id) {
          batch.update(currentDb.collection(MEMORY_COLLECTION).doc(m.id), {
            accessCount: admin.firestore.FieldValue.increment(1),
            lastAccessed: new Date().toISOString()
          });
        }
      });
      await batch.commit().catch(e => console.error('Error updating memory stats:', e));
    }

    return results;
  } catch (error) {
    console.error('Error fetching memories from MemPalace:', error);
    return [];
  }
}

/**
 * Helper to extract potential keywords from a transcript segment for memory retrieval.
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'and', 'for', 'you', 'that', 'with', 'this', 'have', 'from', 'but', 'what']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
}
