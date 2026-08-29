import { db, markFirestoreQuotaExhausted } from "./firebase-admin";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "./auth";
import { isBuildPhase } from "./utils";

// S-01: In production runtime, required database seed credentials MUST come from environment variables.
// In development/testing and build phase, a stable default is permitted.
function getSeedPassword(envVar: string, devDefault: string): string {
  const value = process.env[envVar];
  if (value && value.trim() !== "") {
    return value.trim();
  }
  if (process.env.NODE_ENV === "production") {
    if (isBuildPhase()) {
      return devDefault;
    }
    throw new Error(`CRITICAL SECURITY ERROR: Required database seed environment variable '${envVar}' must be configured in production.`);
  }
  return devDefault;
}

// Passwords for essential administrative accounts
const DEV_PASSWORDS = {
  admin: getSeedPassword("ADMIN_PASSWORD", "DealFlowDev!Admin2026"),
  admin1: getSeedPassword("ADMIN1_PASSWORD", "DealFlowDev!Admin12026"),
  admin3: getSeedPassword("ADMIN3_PASSWORD", "DealFlowDev!Admin32026"),
  agentPraneeth: getSeedPassword("AGENT_PRANEETH_PASSWORD", "DealFlowDev!Agent12026"),
  agentAshok: getSeedPassword("AGENT_ASHOK_PASSWORD", "DealFlowDev!Agent22026"),
  customerDemo: getSeedPassword("CUSTOMER_DEMO_PASSWORD", "DealFlowDev!Cust12026"),
  customerPraneeth: getSeedPassword("CUSTOMER_PRANEETH_PASSWORD", "DealFlowDev!Cust22026"),
};

let isInitialized = false;

/**
 * Initializes essential portal role access in Firestore.
 */
export async function seedFirestore() {
  if (isInitialized) {
    return;
  }

  if (!db) {
    console.log("[db-init] Firestore not configured. Skipping initialization.");
    return;
  }

  isInitialized = true;

  try {
    console.log("[db-init] Checking system role accounts...");
    const essentialAccounts = [
      {
        id: "admin-1",
        email: "admin1@dealflow.ai",
        name: "Administrator",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin1, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "admin-2",
        email: "admin@dealflow.ai",
        name: "Admin One",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "admin-3",
        email: "admin3@dealflow.ai",
        name: "Admin Ops",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin3, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "agent-1",
        email: "praneeth@dealflow.ai",
        name: "Praneeth",
        role: "agent",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.agentPraneeth, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "agent-2",
        email: "agent.ashok@dealflow.ai",
        name: "Ashok",
        role: "agent",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.agentAshok, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "cust-1",
        email: "demo@customer.com",
        name: "Demo Customer",
        role: "customer",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.customerDemo, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "cust-2",
        email: "praneethburada@gmail.com",
        name: "Praneeth Burada",
        role: "customer",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.customerPraneeth, SALT_ROUNDS),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    for (const accountUser of essentialAccounts) {
      const docRef = db.collection("users").doc(accountUser.id);
      const docSnap = await docRef.get();
      
      if (!docSnap || !docSnap.exists || !docSnap.data()?.email) {
        await docRef.set({
          ...accountUser,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          isVerified: true,
        });
        console.log(`[db-init] Role account initialized: ${accountUser.email} (${accountUser.role})`);
      } else {
        await docRef.set({
          hashedPassword: accountUser.hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          isVerified: true,
        }, { merge: true });
        console.log(`[db-init] Role account verified: ${accountUser.email} (${accountUser.role})`);
      }
    }
    console.log("[db-init] System accounts verification complete. Zero sample/dummy data injected.");

  } catch (error: any) {
    isInitialized = false;
    if (error?.code === 8 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.details?.includes("Quota exceeded")) {
      markFirestoreQuotaExhausted();
      console.warn("[db-init] Firestore quota limit reached.");
    } else {
      console.error("[db-init] Error verifying system accounts:", error);
    }
  }
}
