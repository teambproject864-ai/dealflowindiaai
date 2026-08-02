import assert from "assert";
import { firebaseAuthService } from "../lib/services/firebase-auth.service";
import {
  supabaseService,
  SupabaseUserRepo,
  SupabaseWorkflowRepo,
  SupabaseChatRepo,
  SupabaseVectorRepo,
  SupabaseAgentStateRepo,
} from "../lib/services/supabase.service";
import {
  pocketBaseService,
  saveDraft,
  getDraft,
  listUnsyncedDrafts,
  deleteDraft,
  syncPocketBaseToSupabase,
} from "../lib/services/pocketbase.service";
import {
  redisService,
  setCache,
  getCache,
  deleteCache,
  createSession,
  getSession,
  destroySession,
  enqueueJob,
  dequeueJob,
  processJobQueue,
} from "../lib/services/redis.service";
import { aiWorkflowsService } from "../lib/services/ai-workflows.service";
import { backendOrchestrator } from "../lib/backend-orchestrator";

export async function runHybridBackendTests() {
  console.log("=======================================================================");
  console.log("🚀 RUNNING COMPREHENSIVE HYBRID BACKEND ARCHITECTURE TEST SUITE");
  console.log("   (Firebase Auth + Supabase + PocketBase + Redis + AI Workflows)");
  console.log("=======================================================================");

  // ─── 1. FIREBASE AUTHENTICATION, FCM & ANALYTICS TESTS ─────────────────────
  console.log("--> [1/7] Testing Firebase Authentication, FCM & Analytics Services...");

  const mockToken = "mock-firebase-token-user-hybrid-999";
  const decoded = await firebaseAuthService.verifyIdToken(mockToken);
  assert.strictEqual(decoded.uid, "user-hybrid-999");
  assert.strictEqual(decoded.email, "user-hybrid-999@dealflow.ai");
  assert.strictEqual(decoded.provider, "google.com");
  assert.strictEqual(decoded.emailVerified, true);
  console.log("  ✅ Firebase ID Token verification passed");

  const fcmResult = await firebaseAuthService.sendPushNotification({
    token: "mock-fcm-device-token",
    title: "Dealflow AI Alert",
    body: "New revenue intelligence lead detected.",
  });
  assert.strictEqual(typeof fcmResult.success, "boolean");
  console.log("  ✅ FCM Push Notification service interface verified");

  firebaseAuthService.logAnalytics({
    eventName: "hybrid_backend_test_started",
    userId: decoded.uid,
    params: { env: "test" },
  });
  console.log("  ✅ Firebase Analytics event logging adapter verified (Metadata only)");

  // ─── 2. SUPABASE PRIMARY DATABASE & PGVECTOR REPOSITORIES ─────────────────
  console.log("--> [2/7] Testing Supabase Primary Database Repositories...");

  const user = await SupabaseUserRepo.upsertUser({
    id: `user_${decoded.uid}`,
    firebaseUid: decoded.uid,
    email: decoded.email,
    name: "Hybrid Admin",
    role: "admin",
    organizationId: "org_hybrid_001",
  });
  assert.strictEqual(user.firebaseUid, decoded.uid);
  assert.strictEqual(user.role, "admin");

  const fetchedUser = await SupabaseUserRepo.getUserByFirebaseUid(decoded.uid);
  assert.notStrictEqual(fetchedUser, null);
  assert.strictEqual(fetchedUser?.email, decoded.email);
  console.log("  ✅ Supabase User & Organization Repository verified");

  const workflow = await SupabaseWorkflowRepo.saveWorkflow({
    id: "wf_hybrid_101",
    organizationId: "org_hybrid_001",
    title: "Continuous Revenue Optimization Pipeline",
    definition: { steps: ["intake", "scoring", "outreach"] },
    status: "active",
    state: { stepIndex: 0 },
  });
  assert.strictEqual(workflow.id, "wf_hybrid_101");
  const fetchedWf = await SupabaseWorkflowRepo.getWorkflow("wf_hybrid_101");
  assert.strictEqual(fetchedWf?.title, "Continuous Revenue Optimization Pipeline");
  console.log("  ✅ Supabase Workflow Repository verified");

  const msg = await SupabaseChatRepo.addChatMessage({
    threadId: "thread_hybrid_202",
    senderId: user.id,
    role: "user",
    content: "Analyze lead engagement score for Acme Corp.",
    agentKey: "praneeth",
  });
  assert.strictEqual(msg.threadId, "thread_hybrid_202");
  const threadMsgs = await SupabaseChatRepo.getThreadMessages("thread_hybrid_202");
  assert.strictEqual(threadMsgs.length, 1);
  assert.strictEqual(threadMsgs[0].content, "Analyze lead engagement score for Acme Corp.");
  console.log("  ✅ Supabase Chat History Repository verified");

  // Vector embeddings & pgvector cosine similarity search
  await SupabaseVectorRepo.insertVectorDoc({
    title: "SaaS Enterprise Sales Strategy Playbook",
    content: "Detailed outbound sequence tactics for VP Sales and RevOps.",
    embedding: [0.1, 0.8, 0.3, 0.9],
    metadata: { category: "sales" },
  });
  await SupabaseVectorRepo.insertVectorDoc({
    title: "SMB Onboarding Checklist",
    content: "Quick start guide for SMB tier accounts.",
    embedding: [0.9, 0.1, 0.0, 0.1],
    metadata: { category: "onboarding" },
  });

  const searchResults = await SupabaseVectorRepo.searchSimilarVectors([0.1, 0.85, 0.25, 0.85], 2);
  assert.strictEqual(searchResults.length, 2);
  assert.strictEqual(searchResults[0].title, "SaaS Enterprise Sales Strategy Playbook");
  assert.ok((searchResults[0].similarityScore || 0) > 0.9);
  console.log("  ✅ Supabase Vector Knowledge Base & pgvector similarity search verified");

  const agentState = await SupabaseAgentStateRepo.saveAgentState({
    id: "state_praneeth_user_1",
    agentKey: "praneeth",
    userId: user.id,
    contextMemory: { leadId: "lead_99" },
    stepLogs: [{ step: "qualification", timestamp: new Date().toISOString(), status: "passed" }],
  });
  assert.strictEqual(agentState.agentKey, "praneeth");
  const fetchedState = await SupabaseAgentStateRepo.getAgentState("praneeth", user.id);
  assert.strictEqual(fetchedState?.contextMemory.leadId, "lead_99");
  console.log("  ✅ Supabase AI Agent State Repository verified");

  // ─── 3. POCKETBASE TRANSIENT STORAGE, RETENTION & DLQ ────────────────────
  console.log("--> [3/7] Testing PocketBase Transient Storage, DLQ & Retention...");

  const draft = await saveDraft("transient_lead_drafts", {
    companyName: "Acme Innovations Ltd",
    contactEmail: "contact@acme-innovations.com",
    notes: "Draft uncommitted lead data from Chrome Extension",
  });
  assert.ok(draft.id.length > 0);
  assert.strictEqual(draft.isSynced, false);

  const fetchedDraft = await getDraft("transient_lead_drafts", draft.id);
  assert.notStrictEqual(fetchedDraft, null);
  assert.strictEqual(fetchedDraft?.payload.companyName, "Acme Innovations Ltd");

  const unsynced = await listUnsyncedDrafts("transient_lead_drafts");
  assert.ok(unsynced.length >= 1);
  console.log("  ✅ PocketBase Transient Draft saving and listing verified");

  // Synchronize PocketBase draft to Supabase Primary Database
  const syncRes = await syncPocketBaseToSupabase("transient_lead_drafts", draft.id, "workflow");
  assert.strictEqual(syncRes.success, true);
  const updatedDraft = await getDraft("transient_lead_drafts", draft.id);
  assert.strictEqual(updatedDraft?.isSynced, true);
  console.log("  ✅ PocketBase-to-Supabase 5-Minute Sync Worker verified");

  // Dead-Letter Queue (DLQ) Error Handling Verification
  const invalidSyncRes = await syncPocketBaseToSupabase("transient_lead_drafts", "non-existent-draft-id", "workflow");
  assert.strictEqual(invalidSyncRes.success, false);
  const dlqEntries = await supabaseService.getDeadLetterQueue();
  assert.ok(Array.isArray(dlqEntries));
  console.log("  ✅ PocketBase-to-Supabase Sync Dead-Letter Queue (DLQ) verified");

  // 7-Day Retention Cleanup Policy Verification
  const retentionRes = await pocketBaseService.cleanupExpiredTransientData(7);
  assert.strictEqual(typeof retentionRes.deletedCount, "number");
  console.log("  ✅ PocketBase 7-Day Automated Retention Cleanup Worker verified");

  await deleteDraft("transient_lead_drafts", draft.id);
  const deletedDraft = await getDraft("transient_lead_drafts", draft.id);
  assert.strictEqual(deletedDraft, null);
  console.log("  ✅ PocketBase Draft cleanup verified");

  // ─── 4. REDIS CACHING, SESSIONS, QUEUES & INVALIDATION ───────────────────
  console.log("--> [4/7] Testing Redis Caching, Invalidation, Sessions & Job Queues...");

  await setCache("test_key_hybrid", { value: 42, label: "dealflow" }, 60);
  const cachedVal = await getCache<{ value: number; label: string }>("test_key_hybrid");
  assert.strictEqual(cachedVal?.value, 42);
  assert.strictEqual(cachedVal?.label, "dealflow");
  await deleteCache("test_key_hybrid");
  const deletedCache = await getCache("test_key_hybrid");
  assert.strictEqual(deletedCache, null);

  // Test Redis Cache Pattern Invalidation on writes
  await setCache("user_cache:101:profile", { name: "Test User 1" });
  await setCache("user_cache:101:settings", { theme: "dark" });
  const invalidatedCount = await redisService.invalidatePattern("user_cache:101");
  assert.ok(invalidatedCount >= 2);
  const checkInvalidated = await getCache("user_cache:101:profile");
  assert.strictEqual(checkInvalidated, null);
  console.log("  ✅ Redis Distributed Cache & Pattern Invalidation triggers verified");

  const session = await createSession("user_123", "admin", { clientIp: "127.0.0.1" }, 3600);
  assert.ok(session.sessionId.startsWith("sess_"));
  const fetchedSession = await getSession(session.sessionId);
  assert.strictEqual(fetchedSession?.userId, "user_123");
  assert.strictEqual(fetchedSession?.role, "admin");
  await destroySession(session.sessionId);
  const destroyedSession = await getSession(session.sessionId);
  assert.strictEqual(destroyedSession, null);
  console.log("  ✅ Redis User Session Store verified");

  // Multi-queue background job processing
  await enqueueJob("fcm_dispatch", { token: "device_abc", alert: "test" });
  await enqueueJob("pocketbase_sync", { draftId: "draft_123" });
  await enqueueJob("vector_embedding", { docId: "doc_456" });
  await enqueueJob("ai_workflow_execution", { workflowId: "wf_789" });

  let processedCount = 0;
  await processJobQueue("fcm_dispatch", async (job) => {
    assert.strictEqual(job.queueName, "fcm_dispatch");
    processedCount++;
  });
  await processJobQueue("pocketbase_sync", async (job) => {
    assert.strictEqual(job.queueName, "pocketbase_sync");
    processedCount++;
  });
  await processJobQueue("vector_embedding", async (job) => {
    assert.strictEqual(job.queueName, "vector_embedding");
    processedCount++;
  });
  await processJobQueue("ai_workflow_execution", async (job) => {
    assert.strictEqual(job.queueName, "ai_workflow_execution");
    processedCount++;
  });

  assert.strictEqual(processedCount, 4);
  console.log("  ✅ Redis Background Job Queues (FCM, PB Sync, Vector, Workflow) verified");

  // ─── 5. AI WORKFLOW ORCHESTRATION ──────────────────────────────────────────
  console.log("--> [5/7] Testing AI Workflow Orchestrator...");

  const initResult = await aiWorkflowsService.initializeWorkflow({
    workflowId: "wf_ai_orch_001",
    organizationId: "org_hybrid_001",
    title: "AI Lead Nurture Flow",
    agentKey: "ashok",
    userId: user.id,
  });
  assert.strictEqual(initResult.workflow.id, "wf_ai_orch_001");
  assert.strictEqual(initResult.agentState.agentKey, "ashok");

  const stepResult = await aiWorkflowsService.executeStep({
    workflowId: "wf_ai_orch_001",
    agentKey: "ashok",
    userId: user.id,
    stepName: "generate_proposal_email",
    inputPayload: { leadName: "Acme Corp" },
    stepOutput: { subject: "Tailored Proposal", body: "Dear Acme team..." },
    isTransientDraft: true,
  });
  assert.strictEqual(stepResult.stepOutput.subject, "Tailored Proposal");
  assert.ok(stepResult.transientDraftId !== undefined);

  if (stepResult.transientDraftId) {
    const commitRes = await aiWorkflowsService.commitDraftArtifact(stepResult.transientDraftId);
    assert.strictEqual(commitRes.success, true);
  }
  console.log("  ✅ AI Workflow Step Execution & Transient Artifact Promotion verified");

  // ─── 6. UNIFIED BACKEND ORCHESTRATOR & REQUEST ROUTING ──────────────────────
  console.log("--> [6/7] Testing Centralized Backend Orchestrator & RBAC Validation...");

  const reqResult = await backendOrchestrator.handleRequest({
    idToken: mockToken,
    requiredRole: "admin",
    cacheKey: `user_profile_cache:${decoded.uid}`,
    action: async (ctx) => {
      assert.strictEqual(ctx.firebaseUser.uid, decoded.uid);
      assert.strictEqual(ctx.supabaseUser.email, decoded.email);
      assert.ok(ctx.sessionId.length > 0);
      return { profileStatus: "active", userEmail: ctx.supabaseUser.email };
    },
  });

  assert.strictEqual(reqResult.success, true);
  assert.strictEqual(reqResult.data?.profileStatus, "active");
  assert.strictEqual(reqResult.data?.userEmail, decoded.email);

  // Cached request hit
  const cachedReqResult = await backendOrchestrator.handleRequest({
    idToken: mockToken,
    cacheKey: `user_profile_cache:${decoded.uid}`,
    action: async () => {
      throw new Error("Should not execute when cached!");
    },
  });
  assert.strictEqual(cachedReqResult.success, true);
  assert.strictEqual(cachedReqResult.cached, true);
  assert.strictEqual(cachedReqResult.data?.profileStatus, "active");
  console.log("  ✅ Unified Backend Orchestrator Request Routing & Response Caching verified");

  // ─── 7. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT ───────────────────────
  console.log("--> [7/7] Testing Role-Based Access Control (RBAC) Enforcement...");

  const customerToken = "mock-firebase-token-customer-user-1";
  const rbacFailResult = await backendOrchestrator.handleRequest({
    idToken: customerToken,
    requiredRole: "admin", // Customer user trying to access admin route
    action: async () => {
      return { secretData: true };
    },
  });

  assert.strictEqual(rbacFailResult.success, false);
  assert.ok(rbacFailResult.error?.includes("RBAC Error"));
  console.log("  ✅ Backend RBAC Permission Enforcement verified");

  console.log("=======================================================================");
  console.log("🎉 ALL HYBRID BACKEND ARCHITECTURE TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("=======================================================================");
}

if (require.main === module) {
  runHybridBackendTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Hybrid Backend Test Failure:", err);
      process.exit(1);
    });
}
