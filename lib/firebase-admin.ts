import * as admin from "firebase-admin";
import { loadServiceAccount } from "./service-account";
import { validateEnv } from "./env-validator";
import { logger } from "./logger";

const ADMIN_APP_NAME = "dealflow-admin";

console.log("[Firebase Admin] DISABLE_FIRESTORE: ", process.env.DISABLE_FIRESTORE);

function makeNoopChain(): any {
  const noopFn = (...args: any[]) => {
    return chainProxy;
  };
  const chainProxy = new Proxy(noopFn, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve(null);
      }
      if (prop === "catch") {
        return (reject: any) => {
          // Return a noop chain so nested catches work
          return chainProxy;
        };
      }
      return chainProxy;
    }
  });
  return chainProxy;
}

let firestoreInstance: admin.firestore.Firestore | null = null;

/** Returns true if Firebase Admin SDK is properly configured and ready for use. */
export function isFirebaseConfigured(): boolean {
  return !!loadServiceAccount();
}

function ensureFirebaseApp(): admin.app.App | null {
  const sa = loadServiceAccount();
  if (!sa) {
    return null;
  }

  try {
    const existing = admin.app(ADMIN_APP_NAME);
    if (existing.options.projectId === sa.project_id) {
      return existing;
    }
  } catch {
    // Named app not created yet
  }

  try {
    return admin.initializeApp(
      {
        credential: admin.credential.cert(sa as admin.ServiceAccount),
        projectId: sa.project_id,
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          `${sa.project_id}.appspot.com`,
      },
      ADMIN_APP_NAME
    );
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK", error);
    return null;
  }
}

let firestoreQuotaExhausted = false;

export function markFirestoreQuotaExhausted(): void {
  firestoreQuotaExhausted = true;
  (globalThis as any).firestoreQuotaExhausted = true;
}

/** Returns Firestore bound to the named Admin app, or null if Firebase not configured or quota exhausted */
export function getDb(): admin.firestore.Firestore | null {
  const mock = (globalThis as any).firestoreMock;
  if (mock) return mock;
  if (process.env.DISABLE_FIRESTORE === "true" || firestoreQuotaExhausted || (globalThis as any).firestoreQuotaExhausted) return null;
  if (!firestoreInstance) {
    const app = ensureFirebaseApp();
    if (app) {
      firestoreInstance = app.firestore();
    } else {
      return null;
    }
  }
  return firestoreInstance;
}

/** Lazy Firestore handle for existing imports — initializes on first property access. Returns null if not configured. */
export const db: admin.firestore.Firestore | null =
  (typeof window === "undefined" && (process.env.DISABLE_FIRESTORE !== "true" || process.env.NODE_ENV === "test") && (loadServiceAccount() || process.env.NODE_ENV === "test"))
    ? new Proxy({} as admin.firestore.Firestore, {
        get(_target, prop) {
          if (prop === "then" || prop === "catch" || prop === "toJSON" || typeof prop === "symbol") {
            return undefined;
          }
          const mock = (globalThis as any).firestoreMock;
          const real = mock || getDb();
          if (!real) {
            logger.warn("Firebase not configured or quota exceeded; skipping operation on", prop);
            return makeNoopChain();
          }
          const value = (real as unknown as Record<string | symbol, unknown>)[prop];
          if (typeof value === "function") {
            return (...args: unknown[]) => {
              try {
                const res = (value as (...args: unknown[]) => unknown).apply(real, args);
                if (res && typeof (res as any).catch === "function") {
                  return (res as any).catch((err: any) => {
                    if (err?.code === 8 || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.details?.includes("Quota exceeded")) {
                      logger.warn("[Firebase Admin] Firestore quota exceeded; switching to local fallback mode.");
                      markFirestoreQuotaExhausted();
                      return null;
                    }
                    throw err;
                  });
                }
                return res;
              } catch (err: any) {
                if (err?.code === 8 || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.details?.includes("Quota exceeded")) {
                  logger.warn("[Firebase Admin] Firestore quota exceeded; switching to local fallback mode.");
                  markFirestoreQuotaExhausted();
                  return null;
                }
                throw err;
              }
            };
          }
          return value;
        },
      })
    : null;


export function getStorage(): admin.storage.Storage | null {
  const app = ensureFirebaseApp();
  return app ? app.storage() : null;
}

export const storage: admin.storage.Storage | null =
  (typeof window === "undefined" && loadServiceAccount())
    ? new Proxy({} as admin.storage.Storage, {
        get(_target, prop) {
          const real = getStorage();
          if (!real) {
            // Return a no-op function if property accessed is a function
            if (typeof prop === "string" && !["then", "catch"].includes(prop)) {
              return (...args: any[]) => {
                logger.warn("Firebase not configured; skipping storage operation");
                return Promise.resolve(null);
              };
            }
            return undefined;
          }
          const value = (real as unknown as Record<string | symbol, unknown>)[prop];
          if (typeof value === "function") {
            return (value as (...args: unknown[]) => unknown).bind(real);
          }
          return value;
        },
      })
    : null;

export default admin;

