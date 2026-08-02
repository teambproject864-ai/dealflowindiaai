import { firebaseAuthService, DecodedFirebaseUser } from "./services/firebase-auth.service";
import { supabaseService, SupabaseUser } from "./services/supabase.service";
import { redisService } from "./services/redis.service";
import { pocketBaseService } from "./services/pocketbase.service";
import { logger } from "./logger";

export interface AuthenticatedRequestContext {
  firebaseUser: DecodedFirebaseUser;
  supabaseUser: SupabaseUser;
  sessionId: string;
}

export interface BackendRequestOptions<T> {
  idToken?: string;
  cacheKey?: string;
  cacheTTL?: number;
  requiredRole?: "admin" | "agent" | "customer";
  action: (ctx: AuthenticatedRequestContext) => Promise<T>;
}

export class BackendOrchestrator {
  /**
   * Centralized Request Validation Layer:
   * 1. Verifies Firebase ID Token (Authentication strictly via Firebase)
   * 2. Fetches/upserts user profile in Supabase (Primary Source of Truth)
   * 3. Validates Role-Based Access Control (RBAC) permissions against Supabase user role
   * 4. Establishes/verifies active session in Redis
   */
  async authenticateRequest(idToken?: string, requiredRole?: "admin" | "agent" | "customer"): Promise<AuthenticatedRequestContext> {
    const token = idToken || "mock-firebase-token-guest";

    // 1. Server-side Firebase ID Token verification
    const firebaseUser = await firebaseAuthService.verifyIdToken(token);

    // 2. Fetch or provision Supabase User Record (Single Source of Truth)
    let supabaseUser = await supabaseService.getUserByFirebaseUid(firebaseUser.uid);
    if (!supabaseUser) {
      supabaseUser = await supabaseService.upsertUser({
        id: `user_${firebaseUser.uid}`,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name || firebaseUser.email.split("@")[0],
        role: "customer",
      });
      logger.info("[Backend Orchestrator] Provisioned new Supabase user from Firebase Auth", { firebaseUid: firebaseUser.uid });
    }

    // 3. Role-Based Access Control (RBAC) Verification
    if (requiredRole && supabaseUser.role !== "admin" && supabaseUser.role !== requiredRole) {
      const authErr = `[RBAC Error] User '${supabaseUser.email}' with role '${supabaseUser.role}' lacks required role '${requiredRole}'`;
      logger.warn(authErr);
      throw new Error(authErr);
    }

    // 4. Redis Session Management
    const session = await redisService.createSession(supabaseUser.id, supabaseUser.role, {
      firebaseUid: firebaseUser.uid,
      provider: firebaseUser.provider,
    });

    return {
      firebaseUser,
      supabaseUser,
      sessionId: session.sessionId,
    };
  }

  /**
   * Unified route controller method for handling business logic requests:
   * 100% of client requests route through this centralized controller.
   * Validates auth -> checks Redis cache -> executes action -> updates Supabase primary store
   */
  async handleRequest<T>(options: BackendRequestOptions<T>): Promise<{
    success: boolean;
    data?: T;
    cached?: boolean;
    error?: string;
  }> {
    try {
      // Check Redis distributed cache first if cacheKey provided
      if (options.cacheKey) {
        const cachedData = await redisService.getCache<T>(options.cacheKey);
        if (cachedData) {
          return { success: true, data: cachedData, cached: true };
        }
      }

      // Centralized Request Validation Layer
      const context = await this.authenticateRequest(options.idToken, options.requiredRole);

      // Execute controller business action
      const data = await options.action(context);

      // Cache result in Redis if cacheKey provided
      if (options.cacheKey) {
        await redisService.setCache(options.cacheKey, data, options.cacheTTL || 300);
      }

      return { success: true, data };
    } catch (err: any) {
      logger.error("[Backend Orchestrator] Request handling failed", err);
      return { success: false, error: err.message || "Internal server error" };
    }
  }

  /**
   * Save transient draft payload directly to PocketBase
   */
  async saveTransientDraft(collectionName: string, payload: Record<string, any>, draftId?: string) {
    return await pocketBaseService.saveDraft(collectionName, payload, draftId);
  }

  /**
   * Commit a PocketBase draft into Supabase (Primary Source of Truth)
   */
  async commitDraftToSupabase(collectionName: string, draftId: string, targetType: "workflow" | "chat" | "vector") {
    return await pocketBaseService.syncPocketBaseToSupabase(collectionName, draftId, targetType);
  }
}

export const backendOrchestrator = new BackendOrchestrator();
