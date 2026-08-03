import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, addAuditLog } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { logAuditEvent } from "@/lib/audit-logger";
import { logger } from "@/lib/logger";
import type { WebinarRegistrant, Webinar, AttendeeStatus } from "@/lib/portal-types";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}

function generateQrCodeUrl(registrantId: string, webinarId: string, email: string): string {
  const payload = JSON.stringify({ registrantId, webinarId, email, ts: Date.now() });
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

function generateId(): string {
  return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface WaitlistInfo {
  isWaitlisted: boolean;
  waitlistPosition?: number;
  totalWaitlisted: number;
  maxAttendees: number;
  registeredCount: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { webinarId } = params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "Webinar ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const webinarSnap = await db.collection("webinars").doc(webinarId).get();
    let webinar: Webinar | null = null;
    if (webinarSnap.exists) {
      webinar = webinarSnap.data() as Webinar;
    }

    const registrants: WebinarRegistrant[] = [];
    const queryRef = db.collection("webinar_registrants").where("webinarId", "==", webinarId);

    if (user.role === "customer") {
      const snap = await queryRef.where("email", "==", user.email).get();
      if (snap && snap.forEach) {
        snap.forEach((doc: any) => {
          registrants.push({ id: doc.id, ...doc.data() } as WebinarRegistrant);
        });
      }
    } else {
      const snap = await queryRef.get();
      if (snap && snap.forEach) {
        snap.forEach((doc: any) => {
          registrants.push({ id: doc.id, ...doc.data() } as WebinarRegistrant);
        });
      }
    }

    registrants.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    let waitlistInfo: WaitlistInfo = {
      isWaitlisted: false,
      totalWaitlisted: 0,
      maxAttendees: webinar?.maxAttendees ?? 0,
      registeredCount: webinar?.stats?.registeredCount ?? 0,
    };

    if (webinar) {
      const waitlistedSnap = await db
        .collection("webinar_registrants")
        .where("webinarId", "==", webinarId)
        .where("status", "==", "waitlisted")
        .get();

      let totalWaitlisted = 0;
      if (waitlistedSnap && waitlistedSnap.size !== undefined) {
        totalWaitlisted = waitlistedSnap.size;
      } else if (waitlistedSnap && waitlistedSnap.forEach) {
        waitlistedSnap.forEach(() => totalWaitlisted++);
      }

      waitlistInfo = {
        ...waitlistInfo,
        totalWaitlisted,
      };

      if (user.role === "customer" && registrants.length > 0) {
        const customerReg = registrants[0];
        waitlistInfo.isWaitlisted = customerReg.status === "waitlisted";
        waitlistInfo.waitlistPosition = customerReg.waitlistPosition;
      }
    }

    await logAuditEvent(
      request,
      user.id,
      "webinar_registrants_list",
      { webinarId, count: registrants.length, role: user.role }
    );

    addAuditLog(
      user.email,
      user.role,
      true,
      `Listed ${registrants.length} registrants for webinar ${webinarId}`,
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json(
      { success: true, registrants, waitlistInfo },
      { status: 200 }
    );
  } catch (error) {
    logger.error("[api-portal-webinar-registrants-get] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registrants" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { webinarId } = params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "Webinar ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      industry,
      country,
      customFields,
      source,
      referralCode,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const webinarSnap = await db.collection("webinars").doc(webinarId).get();
    if (!webinarSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Webinar not found" },
        { status: 404 }
      );
    }

    const webinar = webinarSnap.data() as Webinar;

    if (user.role === "customer" && webinar.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const existingSnap = await db
      .collection("webinar_registrants")
      .where("webinarId", "==", webinarId)
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    let existingExists = false;
    if (existingSnap && existingSnap.forEach) {
      existingSnap.forEach(() => { existingExists = true; });
    }
    if (existingExists) {
      return NextResponse.json(
        { success: false, error: "Email is already registered for this webinar" },
        { status: 409 }
      );
    }

    const registeredSnap = await db
      .collection("webinar_registrants")
      .where("webinarId", "==", webinarId)
      .where("status", "in", ["registered", "confirmed", "attended"])
      .get();

    let currentRegisteredCount = 0;
    if (registeredSnap && registeredSnap.size !== undefined) {
      currentRegisteredCount = registeredSnap.size;
    } else if (registeredSnap && registeredSnap.forEach) {
      registeredSnap.forEach(() => currentRegisteredCount++);
    }

    let status: AttendeeStatus = "registered";
    let waitlistPosition: number | undefined;
    let joinedFromWaitlist = false;
    const maxAttendees = webinar.maxAttendees || 0;

    if (maxAttendees > 0 && currentRegisteredCount >= maxAttendees) {
      if (!webinar.enableWaitlist) {
        return NextResponse.json(
          { success: false, error: "Webinar is full and waitlist is not enabled" },
          { status: 409 }
        );
      }

      if (webinar.waitlistLimit !== undefined && webinar.waitlistLimit > 0) {
        const waitlistedSnap = await db
          .collection("webinar_registrants")
          .where("webinarId", "==", webinarId)
          .where("status", "==", "waitlisted")
          .get();

        let currentWaitlistCount = 0;
        if (waitlistedSnap && waitlistedSnap.size !== undefined) {
          currentWaitlistCount = waitlistedSnap.size;
        } else if (waitlistedSnap && waitlistedSnap.forEach) {
          waitlistedSnap.forEach(() => currentWaitlistCount++);
        }

        if (currentWaitlistCount >= webinar.waitlistLimit) {
          return NextResponse.json(
            { success: false, error: "Webinar waitlist is full" },
            { status: 409 }
          );
        }
        waitlistPosition = currentWaitlistCount + 1;
      } else {
        const waitlistedSnap = await db
          .collection("webinar_registrants")
          .where("webinarId", "==", webinarId)
          .where("status", "==", "waitlisted")
          .get();

        let currentWaitlistCount = 0;
        if (waitlistedSnap && waitlistedSnap.size !== undefined) {
          currentWaitlistCount = waitlistedSnap.size;
        } else if (waitlistedSnap && waitlistedSnap.forEach) {
          waitlistedSnap.forEach(() => currentWaitlistCount++);
        }
        waitlistPosition = currentWaitlistCount + 1;
      }

      status = "waitlisted";
    }

    const registrantId = generateId();
    const now = new Date().toISOString();
    const qrCodeUrl = generateQrCodeUrl(registrantId, webinarId, email.toLowerCase());

    const registrantData: WebinarRegistrant = {
      id: registrantId,
      webinarId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      company,
      jobTitle,
      industry,
      country,
      customFields: customFields || {},
      status,
      source,
      referralCode,
      qrCodeUrl,
      registrationIp: getClientIp(request),
      joinedFromWaitlist,
      waitlistPosition,
      responses: {
        pollResponses: {},
        surveyResponses: {},
        qaQuestionsAsked: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("webinar_registrants").doc(registrantId).set(registrantData);

    const webinarStats = webinar.stats || {
      registeredCount: 0,
      confirmedCount: 0,
      attendedCount: 0,
      noShowCount: 0,
      waitlistCount: 0,
      cancelledCount: 0,
    };

    if (status === "waitlisted") {
      webinarStats.waitlistCount = (webinarStats.waitlistCount || 0) + 1;
    } else {
      webinarStats.registeredCount = (webinarStats.registeredCount || 0) + 1;
    }

    await db.collection("webinars").doc(webinarId).set(
      {
        stats: webinarStats,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAuditEvent(
      request,
      user.id,
      status === "waitlisted" ? "webinar_registrant_waitlisted" : "webinar_registrant_created",
      {
        webinarId,
        registrantId,
        email: email.toLowerCase(),
        status,
        waitlistPosition,
        role: user.role,
      }
    );

    addAuditLog(
      user.email,
      user.role,
      true,
      `Created registrant ${email.toLowerCase()} for webinar ${webinarId} (status: ${status}${waitlistPosition ? `, position: ${waitlistPosition}` : ""})`,
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json(
      { success: true, registrant: registrantData },
      { status: 201 }
    );
  } catch (error) {
    logger.error("[api-portal-webinar-registrants-post] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create registrant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { webinarId } = params;
    if (!webinarId) {
      return NextResponse.json(
        { success: false, error: "Webinar ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    let registrantId: string | null = null;
    const url = new URL(request.url);
    registrantId = url.searchParams.get("registrantId");

    if (!registrantId) {
      try {
        const body = await request.json();
        registrantId = body.registrantId || body.id;
      } catch (e) {
        // Body might be empty
      }
    }

    if (!registrantId) {
      return NextResponse.json(
        { success: false, error: "Registrant ID is required" },
        { status: 400 }
      );
    }

    const registrantDoc = await db.collection("webinar_registrants").doc(registrantId).get();
    if (!registrantDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Registrant not found" },
        { status: 404 }
      );
    }

    const registrant = registrantDoc.data() as WebinarRegistrant;

    if (registrant.webinarId !== webinarId) {
      return NextResponse.json(
        { success: false, error: "Registrant does not belong to this webinar" },
        { status: 400 }
      );
    }

    if (user.role === "customer" && registrant.email !== user.email) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const previousStatus = registrant.status;

    await db.collection("webinar_registrants").doc(registrantId).delete();

    const webinarSnap = await db.collection("webinars").doc(webinarId).get();
    if (webinarSnap.exists) {
      const webinar = webinarSnap.data() as Webinar;
      const webinarStats = webinar.stats || {
        registeredCount: 0,
        confirmedCount: 0,
        attendedCount: 0,
        noShowCount: 0,
        waitlistCount: 0,
        cancelledCount: 0,
      };

      if (previousStatus === "waitlisted") {
        webinarStats.waitlistCount = Math.max(0, (webinarStats.waitlistCount || 0) - 1);
      } else if (previousStatus === "registered" || previousStatus === "confirmed" || previousStatus === "attended") {
        webinarStats.registeredCount = Math.max(0, (webinarStats.registeredCount || 0) - 1);
        if (previousStatus === "confirmed") {
          webinarStats.confirmedCount = Math.max(0, (webinarStats.confirmedCount || 0) - 1);
        }
        if (previousStatus === "attended") {
          webinarStats.attendedCount = Math.max(0, (webinarStats.attendedCount || 0) - 1);
        }
      } else if (previousStatus === "no-show") {
        webinarStats.noShowCount = Math.max(0, (webinarStats.noShowCount || 0) - 1);
        webinarStats.registeredCount = Math.max(0, (webinarStats.registeredCount || 0) - 1);
      } else if (previousStatus === "cancelled") {
        webinarStats.cancelledCount = Math.max(0, (webinarStats.cancelledCount || 0) - 1);
      }

      webinarStats.cancelledCount = (webinarStats.cancelledCount || 0) + 1;

      await db.collection("webinars").doc(webinarId).set(
        {
          stats: webinarStats,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (
        previousStatus === "registered" ||
        previousStatus === "confirmed" ||
        previousStatus === "attended" ||
        previousStatus === "no-show"
      ) {
        const nextWaitlistedSnap = await db
          .collection("webinar_registrants")
          .where("webinarId", "==", webinarId)
          .where("status", "==", "waitlisted")
          .orderBy("waitlistPosition", "asc")
          .limit(1)
          .get();

        let nextWaitlisted: { id: string; data: WebinarRegistrant } | null = null;
        if (nextWaitlistedSnap && nextWaitlistedSnap.forEach) {
          nextWaitlistedSnap.forEach((doc: any) => {
            nextWaitlisted = { id: doc.id, data: doc.data() as WebinarRegistrant };
          });
        }

        if (nextWaitlisted) {
          const nextId = nextWaitlisted.id;
          const nextData = nextWaitlisted.data;
          await db.collection("webinar_registrants").doc(nextId).set(
            {
              status: "registered",
              joinedFromWaitlist: true,
              waitlistPosition: null,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          const waitlistedAllSnap = await db
            .collection("webinar_registrants")
            .where("webinarId", "==", webinarId)
            .where("status", "==", "waitlisted")
            .get();

          if (waitlistedAllSnap && waitlistedAllSnap.forEach) {
            waitlistedAllSnap.forEach((doc: any) => {
              const d = doc.data();
              if (d.waitlistPosition && d.waitlistPosition > (nextData.waitlistPosition || 0)) {
                db.collection("webinar_registrants").doc(doc.id).set(
                  { waitlistPosition: d.waitlistPosition - 1 },
                  { merge: true }
                ).catch((err: any) =>
                  logger.error("[api-portal-webinar-registrants-delete] Failed to update waitlist position:", err)
                );
              }
            });
          }

          webinarStats.waitlistCount = Math.max(0, (webinarStats.waitlistCount || 0) - 1);
          webinarStats.registeredCount = (webinarStats.registeredCount || 0) + 1;

          await db.collection("webinars").doc(webinarId).set(
            {
              stats: webinarStats,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          await logAuditEvent(
            request,
            user.id,
            "webinar_waitlist_promoted",
            {
              webinarId,
              promotedRegistrantId: nextId,
              promotedEmail: nextData.email,
              role: user.role,
            }
          );
        }
      }
    }

    await logAuditEvent(
      request,
      user.id,
      "webinar_registrant_deleted",
      {
        webinarId,
        registrantId,
        email: registrant.email,
        previousStatus,
        role: user.role,
      }
    );

    addAuditLog(
      user.email,
      user.role,
      true,
      `Deleted registrant ${registrant.email} from webinar ${webinarId} (previous status: ${previousStatus})`,
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json(
      { success: true, message: "Registrant deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("[api-portal-webinar-registrants-delete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete registrant" },
      { status: 500 }
    );
  }
}
