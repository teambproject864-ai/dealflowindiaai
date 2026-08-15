import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createToken, setAuthCookie, hashPassword, verifyPassword, DEMO_CUSTOMERS, NEW_CUSTOMERS } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let profileData: Record<string, any> = {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      phone: "",
      companyName: "Acme Corp",
      industry: "SaaS & Tech",
      businessModel: "b2b",
      companySize: "Mid-Market",
    };

    if (db) {
      try {
        // Fetch from users collection
        const userDoc = await db.collection("users").doc(user.id).get();
        if (userDoc.exists) {
          const uData = userDoc.data() || {};
          profileData = { ...profileData, ...uData };
        }

        // Fetch from customers collection
        const custDoc = await db.collection("customers").doc(user.id).get();
        if (custDoc.exists) {
          const cData = custDoc.data() || {};
          profileData = {
            ...profileData,
            name: cData.name || profileData.name,
            email: cData.email || profileData.email,
            phone: cData.phone || profileData.phone,
            companyName: cData.companyName || profileData.companyName,
            industry: cData.industry || profileData.industry,
            businessModel: cData.businessModel || profileData.businessModel,
            companyInformation: cData.companyInformation || {},
          };
        }
      } catch (err) {
        logger.warn("[GET /api/user/profile] Firestore lookup fallback", err);
      }
    }

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error: any) {
    logger.error("[GET /api/user/profile] Failed to fetch profile", error);
    return NextResponse.json(
      { success: false, error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, phone, companyName, industry, businessModel, currentPassword, newPassword } = body;

    const updatedName = name && typeof name === "string" && name.trim() ? name.trim() : authUser.name;
    const updatedEmail = email && typeof email === "string" && email.trim() ? email.trim().toLowerCase() : authUser.email;
    const updatedPhone = typeof phone === "string" ? phone.trim() : "";
    const updatedCompany = typeof companyName === "string" ? companyName.trim() : "";
    const updatedIndustry = typeof industry === "string" ? industry.trim() : "";
    const updatedModel = ["b2b", "b2c", "d2c", "custom"].includes(businessModel) ? businessModel : "b2b";

    // 1. Password update logic (if requested)
    let newPasswordHash: string | undefined = undefined;
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      
      // Verify current password against database or demo record
      let existingHash = "";
      if (db) {
        const uDoc = await db.collection("users").doc(authUser.id).get();
        if (uDoc.exists) {
          existingHash = uDoc.data()?.hashedPassword || "";
        }
      }
      
      if (!existingHash) {
        const demoUser = [...DEMO_CUSTOMERS, ...NEW_CUSTOMERS].find((c) => c.id === authUser.id || c.email === authUser.email);
        existingHash = demoUser?.hashedPassword || "";
      }

      if (existingHash) {
        const isPasswordValid = await verifyPassword(currentPassword, existingHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }
      newPasswordHash = await hashPassword(newPassword.trim());
    }

    // 2. Update Firestore records
    if (db) {
      try {
        const userUpdates: Record<string, any> = {
          name: updatedName,
          email: updatedEmail,
          phone: updatedPhone,
          companyName: updatedCompany,
          industry: updatedIndustry,
          businessModel: updatedModel,
          updatedAt: new Date().toISOString(),
        };
        if (newPasswordHash) {
          userUpdates.hashedPassword = newPasswordHash;
          userUpdates.passwordUpdatedAt = new Date().toISOString();
        }

        await db.collection("users").doc(authUser.id).set(userUpdates, { merge: true });

        // Update customers collection
        const customerUpdates: Record<string, any> = {
          name: updatedName,
          email: updatedEmail,
          phone: updatedPhone,
          companyName: updatedCompany,
          industry: updatedIndustry,
          businessModel: updatedModel,
          updatedAt: new Date().toISOString(),
          personalIdentifiers: {
            fullName: updatedName,
            email: updatedEmail,
            phoneNumber: updatedPhone,
          },
        };
        await db.collection("customers").doc(authUser.id).set(customerUpdates, { merge: true });
      } catch (err) {
        logger.warn("[PUT /api/user/profile] Firestore update failed, relying on session", err);
      }
    }

    // 3. Update in-memory collections for fast dev/test environments
    const foundNewCustomer = NEW_CUSTOMERS.find((c) => c.id === authUser.id || c.email === authUser.email);
    if (foundNewCustomer) {
      foundNewCustomer.name = updatedName;
      foundNewCustomer.email = updatedEmail;
      if (newPasswordHash) foundNewCustomer.hashedPassword = newPasswordHash;
    }

    const foundDemoCustomer = DEMO_CUSTOMERS.find((c) => c.id === authUser.id || c.email === authUser.email);
    if (foundDemoCustomer) {
      foundDemoCustomer.name = updatedName;
      foundDemoCustomer.email = updatedEmail;
      if (newPasswordHash) foundDemoCustomer.hashedPassword = newPasswordHash;
    }

    // 4. Update session JWT token & cookie so changes reflect immediately everywhere
    const updatedUser = {
      id: authUser.id,
      email: updatedEmail,
      name: updatedName,
      role: authUser.role,
    };
    const newToken = createToken(updatedUser);
    await setAuthCookie(newToken);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      profile: {
        id: authUser.id,
        name: updatedName,
        email: updatedEmail,
        phone: updatedPhone,
        companyName: updatedCompany,
        industry: updatedIndustry,
        businessModel: updatedModel,
      },
    });
  } catch (error: any) {
    logger.error("[PUT /api/user/profile] Failed to update profile", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile details" },
      { status: 500 }
    );
  }
}
