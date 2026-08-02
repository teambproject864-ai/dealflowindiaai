# Hybrid Backend Architecture Specification

## Overview & Mandate
DealFlow.AI operates a high-scale, production-ready hybrid backend architecture designed to:
1. **Dramatically reduce Firebase quota consumption and costs** by eliminating all Firestore usage for business data.
2. **Establish Supabase as the exclusive Primary Single Source of Truth** for all persistent application data, AI agent states, workflow logs, and vector embeddings.
3. **Utilize PocketBase exclusively for transient workloads** (unsaved user drafts, in-progress file uploads, offline dev) with a mandatory 5-minute synchronization pipeline to Supabase.
4. **Leverage Redis for high-performance distributed caching, session management, and asynchronous job queues**, reducing primary database query load by over 40%.
5. **Enforce 100% centralized request routing** through `backendOrchestrator`, blocking direct database access from frontend clients.

---

## 1. Service Responsibilities & Boundaries

| Service | Primary Role | Scope & Constraints |
| :--- | :--- | :--- |
| **Firebase** | Identity & Push Alerts | **Strictly restricted** to Google OAuth, Microsoft OAuth, Email/Password auth token verification, FCM push alerts, and analytics event logging. **Zero business/application data in Firestore.** |
| **Supabase** | Single Source of Truth | Exclusive primary database for persistent profiles, orgs, AI workflows, chat history, documents, knowledge base, and pgvector embeddings. |
| **PocketBase** | Transient Storage | Unsaved user drafts, temporary file chunks, and in-progress AI artifacts. Auto-synced to Supabase within 5 minutes. Auto-expired after 7 days. |
| **Redis** | Speed & Queues | Distributed caching for Supabase queries (TTL-based), session management, and job queues (FCM, PB sync, embeddings, workflows). |
| **Backend Orchestrator** | Centralized Router | Validates Firebase ID tokens, enforces Supabase RBAC user permissions, coordinates unified data access, and manages Redis caching. |

---

## 2. Supabase Connection & CLI Setup

### Production Connection Parameters
- **Project URL**: `https://vsbhpnqrjuxgacevxssq.supabase.co`
- **Publishable Key**: `sb_publishable_MttaUW2TWHQI5A2wD-WxCA_Dty9e-nE`
- **Direct Database Connection String**: `postgresql://postgres:[Praneeth@1909]@db.vsbhpnqrjuxgacevxssq.supabase.co:5432/postgres`

### Supabase CLI Link Commands
```bash
# 1. Login to Supabase CLI
supabase login

# 2. Initialize Supabase in project root
supabase init

# 3. Link local development environment to production project
supabase link --project-ref vsbhpnqrjuxgacevxssq
```

---

## 3. Data Synchronization & Retention Policies

### PocketBase to Supabase Sync Pipeline
1. **Draft Creation**: Unsaved user drafts or intermediate AI step outputs are saved in PocketBase as transient records (`isSynced = false`).
2. **5-Minute Sync Window**: Upon draft finalization or file upload completion, `pocketBaseService.syncPocketBaseToSupabase()` transfers the payload to Supabase.
3. **Dead-Letter Queue (DLQ)**: If sync fails after exponential backoff retries, the failed payload is enqueued into Supabase `sync_dead_letter_queue` for administrative review.
4. **7-Day Retention Cleanup**: `pocketBaseService.cleanupExpiredTransientData(7)` runs periodically to delete uncommitted or expired transient artifacts older than 7 days.

---

## 4. Centralized Request Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Orch as Backend Orchestrator
    participant FB as Firebase Auth Service
    participant Supa as Supabase Primary DB
    participant Redis as Redis Cache & Sessions
    participant PB as PocketBase Transient DB

    Client->>Orch: API Request with Bearer ID Token
    Orch->>FB: verifyIdToken(idToken)
    FB-->>Orch: Decoded User Payload (uid, email)
    Orch->>Supa: getUserByFirebaseUid(uid)
    Supa-->>Orch: Supabase User Profile & Role (RBAC)
    Orch->>Redis: createSession / getCache
    alt Cache Hit
        Redis-->>Orch: Cached Response Data
    else Cache Miss
        Orch->>Supa: Execute Business Logic Query
        Supa-->>Orch: Query Result
        Orch->>Redis: setCache(cacheKey, data, TTL)
    end
    Orch-->>Client: HTTP Response Payload
```

---

## 5. Code Structure & Modular Services

- `lib/services/firebase-auth.service.ts`: Firebase ID token verification, FCM notifications, analytics metadata.
- `lib/services/supabase.service.ts`: Supabase persistent CRUD operations, pgvector similarity search, DB retry logic, DLQ.
- `lib/services/pocketbase.service.ts`: Transient draft CRUD, 5-minute sync worker, 7-day retention cleanup.
- `lib/services/redis.service.ts`: Query cache, session store, background job queues (`fcm_dispatch`, `pocketbase_sync`, `vector_embedding`, `ai_workflow_execution`).
- `lib/services/ai-workflows.service.ts`: AI agent execution, persistent state updates, transient artifact management.
- `lib/backend-orchestrator.ts`: Centralized request routing, auth token verification, RBAC permission checks.

---

## 6. Verification & Test Suite Execution

Run the complete test suite:
```bash
npx tsx tests/hybrid-backend.test.ts
```
The test suite validates:
- Firebase ID token verification & analytics event logging.
- Supabase user, workflow, chat, agent state CRUD & pgvector similarity search.
- PocketBase transient draft saving, 5-minute sync worker, DLQ, and 7-day retention cleanup.
- Redis query caching with invalidation triggers, session store, and background job queue processing.
- AI workflow orchestrator step execution & transient artifact promotion.
- Unified backend orchestrator request routing & RBAC enforcement.
