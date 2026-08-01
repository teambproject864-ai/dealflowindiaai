/**
 * Migration & Repair Script for GTM Assessment Customer Accounts
 * 
 * Audits and fixes existing GTM Assessment customer accounts in Firestore:
 * 1. Backfills missing records in the `users` collection from `customer_credentials`.
 * 2. Normalizes `role: "customer"`, `isVerified: true`, `status: "active"`, and `source: "gtm_assessment"`.
 * 3. Links orphaned `gtm_intakes` and `leads` to customer accounts by email address.
 */

import { db } from "../lib/firebase-admin";

export interface MigrationSummary {
  auditedCredentials: number;
  createdUsers: number;
  updatedUsers: number;
  linkedIntakes: number;
  linkedLeads: number;
  errors: string[];
}

export async function migrateGTMCustomerAccounts(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    auditedCredentials: 0,
    createdUsers: 0,
    updatedUsers: 0,
    linkedIntakes: 0,
    linkedLeads: 0,
    errors: [],
  };

  if (!db) {
    summary.errors.push("Firestore database connection is not available.");
    console.log("[Migration] ⚠️ Firestore database not initialized. Skipping database migration.");
    return summary;
  }

  console.log("[Migration] 🚀 Starting GTM Assessment Customer Account Migration...");

  try {
    // 1. Audit customer_credentials collection
    const credSnap = await db.collection("customer_credentials").get();
    summary.auditedCredentials = credSnap.docs.length;

    for (const credDoc of credSnap.docs) {
      const credData = credDoc.data() as any;
      const email = (credData.email || "").toLowerCase().trim();
      if (!email) continue;

      const customerId = credData.customerId || credDoc.id || `customer-${Date.now()}`;
      const hashedPassword = credData.passwordHash || credData.hashedPassword;

      if (!hashedPassword) {
        summary.errors.push(`Credentials doc ${credDoc.id} has no password hash.`);
        continue;
      }

      // Check if user exists in users collection
      const userSnap = await db.collection("users").where("email", "==", email).get();

      if (userSnap.empty) {
        // Create user document
        const newUser = {
          id: customerId,
          email,
          hashedPassword,
          name: credData.name || credData.displayName || "Customer",
          role: "customer",
          isVerified: true,
          isLocked: false,
          failedLoginAttempts: 0,
          passwordUpdatedAt: new Date().toISOString(),
          source: "gtm_assessment",
          status: "active",
          createdAt: credData.createdAt || new Date().toISOString(),
        };

        await db.collection("users").doc(customerId).set(newUser);
        summary.createdUsers++;
        console.log(`[Migration] ✓ Created missing user doc for ${email} (${customerId})`);
      } else {
        // Update user document if needed
        const existingDoc = userSnap.docs[0];
        const existingData = existingDoc.data();
        const updates: any = {};

        if (existingData.role !== "customer") updates.role = "customer";
        if (existingData.isVerified !== true) updates.isVerified = true;
        if (existingData.isLocked !== false) updates.isLocked = false;
        if (existingData.status !== "active") updates.status = "active";
        if (!existingData.source) updates.source = "gtm_assessment";

        if (Object.keys(updates).length > 0) {
          await db.collection("users").doc(existingDoc.id).update(updates);
          summary.updatedUsers++;
          console.log(`[Migration] ✓ Updated user flags for ${email} (${existingDoc.id}):`, updates);
        }
      }
    }

    // 2. Link unlinked gtm_intakes
    const intakesSnap = await db.collection("gtm_intakes").get();
    for (const intakeDoc of intakesSnap.docs) {
      const intakeData = intakeDoc.data() as any;
      if (!intakeData.customerId && intakeData.productOwnerEmail) {
        const email = intakeData.productOwnerEmail.toLowerCase().trim();
        const matchedUser = await db.collection("users").where("email", "==", email).get();
        if (!matchedUser.empty) {
          const matchedUserId = matchedUser.docs[0].id;
          await db.collection("gtm_intakes").doc(intakeDoc.id).update({ customerId: matchedUserId });
          summary.linkedIntakes++;
          console.log(`[Migration] ✓ Linked intake ${intakeDoc.id} to customer ${matchedUserId}`);
        }
      }
    }

    // 3. Link unlinked leads
    const leadsSnap = await db.collection("leads").get();
    for (const leadDoc of leadsSnap.docs) {
      const leadData = leadDoc.data() as any;
      if (!leadData.customerId && (leadData.contactEmail || leadData.email)) {
        const email = (leadData.contactEmail || leadData.email).toLowerCase().trim();
        const matchedUser = await db.collection("users").where("email", "==", email).get();
        if (!matchedUser.empty) {
          const matchedUserId = matchedUser.docs[0].id;
          await db.collection("leads").doc(leadDoc.id).update({ customerId: matchedUserId });
          summary.linkedLeads++;
          console.log(`[Migration] ✓ Linked lead ${leadDoc.id} to customer ${matchedUserId}`);
        }
      }
    }

    console.log("[Migration] 🎉 GTM Assessment Migration Completed Summary:", summary);
  } catch (err: any) {
    summary.errors.push(err.message || String(err));
    console.error("[Migration] ✗ Error during migration:", err);
  }

  return summary;
}

// Allow direct execution from command line via npx tsx
if (require.main === module) {
  migrateGTMCustomerAccounts()
    .then((summary) => {
      console.log("Migration finished:", summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
