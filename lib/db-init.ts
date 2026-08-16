import { db, markFirestoreQuotaExhausted } from "./firebase-admin";
import bcrypt from "bcrypt";

// Default passwords for essential administrative accounts
const DEV_PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || "Pranee@1909",
  admin1: process.env.ADMIN1_PASSWORD || "Pranee@1909",
};

let isInitialized = false;

/**
 * Initializes essential administrative access in Firestore.
 * Strictly avoids creating any hardcoded dummy customers, tasks, or sample records.
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
    console.log("[db-init] Checking system administrator accounts...");
    const essentialAdmins = [
      {
        id: "admin-1",
        email: "admin1@dealflow.ai",
        name: "Administrator",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin1, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "admin-2",
        email: "admin@dealflow.ai",
        name: "Admin One",
        role: "admin",
        hashedPassword: bcrypt.hashSync(DEV_PASSWORDS.admin, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    for (const adminUser of essentialAdmins) {
      const docRef = db.collection("users").doc(adminUser.id);
      const docSnap = await docRef.get();
      
      if (!docSnap || !docSnap.exists || !docSnap.data()?.email) {
        await docRef.set({
          ...adminUser,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        });
        console.log(`[db-init] Admin account initialized: ${adminUser.email}`);
      } else {
        await docRef.set({
          hashedPassword: adminUser.hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        }, { merge: true });
        console.log(`[db-init] Admin account verified: ${adminUser.email}`);
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
