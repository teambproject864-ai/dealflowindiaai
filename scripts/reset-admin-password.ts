// scripts/reset-admin-password.ts
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

// Load environment variables from .env.local if present
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  lines.forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

async function resetAdminPassword() {
  const targetEmail = (process.argv[2] || "admin@dealflow.ai").toLowerCase();
  const newPassword = process.argv[3] || "Admin@123";

  console.log(`\n============================================================`);
  console.log(`🔐 RESETTING ADMIN ACCOUNT PASSWORD`);
  console.log(`Target Email: ${targetEmail}`);
  console.log(`New Password: ${newPassword}`);
  console.log(`============================================================\n`);

  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

  try {
    const { db } = await import("../lib/firebase-admin");

    if (!db) {
      console.log("⚠️ Firestore database instance not connected or offline.");
      console.log(`Generated BCrypt Hash for ${newPassword}:`);
      console.log(hashedPassword);
      console.log("\nYou can set ADMIN_PASSWORD_HASH in your .env.local to this hash.");
      return;
    }

    const snap = await db
      .collection("users")
      .where("email", "==", targetEmail)
      .get();

    if (snap.empty) {
      console.log(`Creating new admin record in Firestore for ${targetEmail}...`);
      const userId = `admin-${Date.now()}`;
      await db.collection("users").doc(userId).set({
        id: userId,
        email: targetEmail,
        name: "Administrator",
        role: "admin",
        hashedPassword,
        passwordUpdatedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Admin account created and password set successfully (User ID: ${userId}).`);
    } else {
      for (const doc of snap.docs) {
        await doc.ref.update({
          hashedPassword,
          passwordUpdatedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          isActive: true,
          updatedAt: new Date().toISOString(),
        });
        console.log(`✅ Updated Firestore user record: ${doc.id}`);
      }
      console.log(`✅ Admin password for ${targetEmail} reset and unlocked successfully.`);
    }
  } catch (err: any) {
    console.error("Error during admin password reset:", err.message);
  }
}

resetAdminPassword();
