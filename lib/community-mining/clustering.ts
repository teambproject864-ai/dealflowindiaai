// lib/community-mining/clustering.ts

import { db } from "@/lib/firebase-admin";
import type {
  CMInsight,
  CMTheme,
  CMTeam,
  CMSeverity,
  CMThemeTrendPoint,
} from "@/types/community-mining";

/**
 * Calculates cosine similarity between two unit/normalized vectors.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Automatically maps theme tags and keywords to the most relevant internal team.
 */
export function autoAssignTeam(tags: string[], rawTexts: string[]): CMTeam {
  const combined = (tags.join(" ") + " " + rawTexts.join(" ")).toLowerCase();

  if (combined.includes("bug") || combined.includes("error") || combined.includes("feature") || combined.includes("integration") || combined.includes("api") || combined.includes("ux friction")) {
    return "product";
  }
  if (combined.includes("churn") || combined.includes("ticket") || combined.includes("slow response") || combined.includes("help") || combined.includes("onboarding")) {
    return "cs";
  }
  if (combined.includes("price") || combined.includes("pricing") || combined.includes("competitor") || combined.includes("upgrade") || combined.includes("enterprise plan")) {
    return "sales";
  }
  if (combined.includes("praise") || combined.includes("campaign") || combined.includes("seo") || combined.includes("brand") || combined.includes("content")) {
    return "marketing";
  }

  return "product";
}

/**
 * Clusters a list of insights into aggregated theme documents.
 */
export function clusterInsights(
  insights: CMInsight[],
  similarityThreshold = 0.65
): CMTheme[] {
  if (!insights || insights.length === 0) return [];

  const clusters: CMInsight[][] = [];

  for (const insight of insights) {
    let matchedCluster: CMInsight[] | null = null;
    let maxSim = -1;

    for (const cluster of clusters) {
      // Compare with the first/seed item of cluster
      const seed = cluster[0];
      
      // Tag overlap boost
      const sharedTags = insight.themeTags.filter((t) => seed.themeTags.includes(t));
      const tagBoost = sharedTags.length > 0 ? 0.25 : 0.0;

      const vecSim = calculateCosineSimilarity(
        insight.embeddingVector || [],
        seed.embeddingVector || []
      );

      const totalSim = Math.min(1.0, vecSim + tagBoost);

      if (totalSim >= similarityThreshold && totalSim > maxSim) {
        maxSim = totalSim;
        matchedCluster = cluster;
      }
    }

    if (matchedCluster) {
      matchedCluster.push(insight);
    } else {
      clusters.push([insight]);
    }
  }

  // Convert clusters to CMTheme objects
  const now = new Date().toISOString();
  const themes: CMTheme[] = clusters.map((cluster, idx) => {
    const seed = cluster[0];
    const totalItems = cluster.length;

    // Aggregate sentiment
    const sentimentSum = cluster.reduce((sum, item) => sum + (item.sentimentScore || 0), 0);
    const sentimentAvg = Number((sentimentSum / totalItems).toFixed(2));

    // Highest severity in cluster
    const severities: CMSeverity[] = ["low", "medium", "high", "critical"];
    let highestSeverity: CMSeverity = "low";
    for (const it of cluster) {
      if (severities.indexOf(it.severity) > severities.indexOf(highestSeverity)) {
        highestSeverity = it.severity;
      }
    }

    // Aggregate tags and entities
    const tagCount = new Map<string, number>();
    const entityCount = new Map<string, number>();
    for (const it of cluster) {
      for (const tag of it.themeTags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
      for (const ent of it.entities) {
        entityCount.set(ent.name, (entityCount.get(ent.name) || 0) + 1);
      }
    }

    const primaryTag = [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "User Feedback";
    const topEntities = [...entityCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0]);

    // Sample Quotes
    const sampleQuotes = cluster
      .map((it) => it.rawSnippet || it.summary)
      .filter(Boolean)
      .slice(0, 4);

    // Date trends (last 7 days)
    const dateMap = new Map<string, number>();
    for (const it of cluster) {
      const dateKey = (it.processedAt || now).split("T")[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    }

    const trend: CMThemeTrendPoint[] = [...dateMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // Auto assigned team
    const assignedTeam = autoAssignTeam(
      [...tagCount.keys()],
      cluster.map((c) => c.rawSnippet || "")
    );

    // Build concise label
    let label = `${primaryTag.toUpperCase()}: `;
    if (topEntities.length > 0) {
      label += `${topEntities.slice(0, 2).join(", ")}`;
    } else {
      label += `${(seed.summary || "User feedback").slice(0, 45)}...`;
    }

    const themeId = `theme_${primaryTag.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${idx + 1}`;

    return {
      id: themeId,
      label,
      description: seed.summary || `Cluster of ${totalItems} community feedback items regarding ${primaryTag}.`,
      itemCount: totalItems,
      trend,
      sentimentAvg,
      severity: highestSeverity,
      status: "new",
      assignedTeam,
      sampleQuotes,
      topEntities,
      relatedInsightIds: cluster.map((c) => c.id),
      firstSeenAt: cluster[cluster.length - 1]?.processedAt || now,
      lastUpdatedAt: now,
      velocityScore: totalItems > 3 ? 45 : 10,
    };
  });

  return themes.sort((a, b) => b.itemCount - a.itemCount);
}

/**
 * Runs the daily clustering job over all stored `cm_insights` and persists `cm_themes`.
 */
export async function runDailyClusteringJob(): Promise<{
  themeCount: number;
  themes: CMTheme[];
}> {
  let insights: CMInsight[] = [];

  if (db) {
    try {
      const snap = await db.collection("cm_insights").limit(500).get();
      insights = snap.docs.map((d) => d.data() as CMInsight);
    } catch (err) {
      console.warn("[CommunityMining:Clustering] Firestore read error:", err);
    }
  }

  if (insights.length === 0) {
    return { themeCount: 0, themes: [] };
  }

  const themes = clusterInsights(insights);

  if (db && themes.length > 0) {
    try {
      const batch = db.batch();
      for (const theme of themes) {
        const themeRef = db.collection("cm_themes").doc(theme.id);
        batch.set(themeRef, theme, { merge: true });
      }
      await batch.commit();
    } catch (dbErr) {
      console.error("[CommunityMining:Clustering] Firestore batch write error:", dbErr);
    }
  }

  return {
    themeCount: themes.length,
    themes,
  };
}
