/**
 * Modular Service Layer Hub for Hybrid Backend Architecture
 * Strict Separation of Responsibilities:
 * - firebaseAuthService: Authentication, FCM Push Notifications, Analytics (NO business data storage)
 * - supabaseService: Primary Single Source of Truth for persistent application data & pgvector
 * - pocketBaseService: Temporary/transient drafts & file uploads with 5-min sync & 7-day retention
 * - redisService: Query caching, session store, background job queues
 * - aiWorkflowsService: Orchestration for persistent & transient AI agent execution
 */

export * from "./firebase-auth.service";
export * from "./supabase.service";
export * from "./pocketbase.service";
export * from "./redis.service";
export * from "./ai-workflows.service";
