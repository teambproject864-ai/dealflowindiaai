import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function aggregateRegistrantStats(webinarId: string): Promise<{
  registeredCount: number;
  confirmedCount: number;
  attendedCount: number;
  noShowCount: number;
  waitlistCount: number;
  cancelledCount: number;
}> {
  const stats = {
    registeredCount: 0,
    confirmedCount: 0,
    attendedCount: 0,
    noShowCount: 0,
    waitlistCount: 0,
    cancelledCount: 0,
  };

  if (!db) return stats;

  try {
    const snap = await db
      .collection("registrants")
      .where("webinarId", "==", webinarId)
      .get();

    if (snap && snap.forEach) {
      snap.forEach((doc: any) => {
        const data = doc.data();
        stats.registeredCount++;
        switch (data.status) {
          case "confirmed":
            stats.confirmedCount++;
            break;
          case "attended":
            stats.confirmedCount++;
            stats.attendedCount++;
            break;
          case "no-show":
            stats.confirmedCount++;
            stats.noShowCount++;
            break;
          case "cancelled":
            stats.cancelledCount++;
            break;
          case "waitlisted":
            stats.waitlistCount++;
            break;
          case "registered":
          default:
            break;
        }
      });
    }
  } catch (e) {
    // Registrants collection may not exist; fallback to stored stats
  }

  return stats;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let webinars: any[] = [];
    if (db) {
      const queryRef: any = db.collection("webinars");

      if (user.role === "customer") {
        const snap = await queryRef.where("customerId", "==", user.id).get();
        if (snap && snap.forEach) {
          snap.forEach((doc: any) => {
            webinars.push({ id: doc.id, ...doc.data() });
          });
        }
      } else if (user.role === "agent") {
        const snap = await queryRef.get();
        if (snap && snap.forEach) {
          snap.forEach((doc: any) => {
            const data = doc.data();
            if (data.assignedAgentId === user.id || !data.assignedAgentId) {
              webinars.push({ id: doc.id, ...data });
            }
          });
        }
      } else {
        const snap = await queryRef.get();
        if (snap && snap.forEach) {
          snap.forEach((doc: any) => {
            webinars.push({ id: doc.id, ...doc.data() });
          });
        }
      }

      for (const webinar of webinars) {
        const liveStats = await aggregateRegistrantStats(webinar.id);
        webinar.stats = {
          ...(webinar.stats || {}),
          registeredCount: liveStats.registeredCount || webinar.stats?.registeredCount || 0,
          confirmedCount: liveStats.confirmedCount || webinar.stats?.confirmedCount || 0,
          attendedCount: liveStats.attendedCount || webinar.stats?.attendedCount || 0,
          noShowCount: liveStats.noShowCount || webinar.stats?.noShowCount || 0,
          waitlistCount: liveStats.waitlistCount || webinar.stats?.waitlistCount || 0,
          cancelledCount: liveStats.cancelledCount || webinar.stats?.cancelledCount || 0,
        };
      }

      webinars.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return NextResponse.json({ success: true, webinars }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-webinars-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch webinars" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      customerId,
      customerName,
      title,
      objective,
      topic,
      description,
      targetAudience,
      industry,
      startDateTime,
      endDateTime,
      timezone,
      durationMinutes,
      language,
      hostType,
      speakers,
      meetingPlatform,
      meetingUrl,
      meetingPassword,
      privacy,
      allowedDomains,
      allowedEmails,
      invitationCodes,
      maxAttendees,
      enableWaitlist,
      waitlistLimit,
      allowRecording,
      recordingUrl,
      recordingViewCount,
      branding,
      registrationFields,
      requireApproval,
      agenda,
      qaSettings,
      pollIds,
      surveyIds,
      resources,
      reminderScheduleIds,
      generatedContentIds,
      socialPostIds,
      status,
      stats,
      aiBotConfig,
      postWebinarConfig,
      assignedAgentId,
      assignedAgentName,
      accessRoles,
    } = body;

    if (user.role === "customer") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const webinarId = id || `webinar-${Date.now()}`;
    const now = new Date().toISOString();

    const webinarData: any = {
      customerId,
      customerName: customerName || "",
      title,
      objective: objective || "",
      topic: topic || "",
      description: description || "",
      targetAudience: targetAudience || "",
      industry: industry || "",
      startDateTime,
      endDateTime,
      timezone: timezone || "UTC",
      durationMinutes: durationMinutes || 0,
      language: language || "English",
      hostType: hostType || "human",
      speakers: speakers || [],
      meetingPlatform: meetingPlatform || "zoom",
      meetingUrl: meetingUrl || "",
      meetingPassword: meetingPassword || "",
      privacy: privacy || "public",
      allowedDomains: allowedDomains || [],
      allowedEmails: allowedEmails || [],
      invitationCodes: invitationCodes || [],
      maxAttendees: maxAttendees || 100,
      enableWaitlist: enableWaitlist || false,
      waitlistLimit: waitlistLimit || 0,
      allowRecording: allowRecording || true,
      recordingUrl: recordingUrl || "",
      recordingViewCount: recordingViewCount || 0,
      branding: branding || { primaryColor: "#0066cc", secondaryColor: "#ffffff" },
      registrationFields: registrationFields || [],
      requireApproval: requireApproval || false,
      agenda: agenda || [],
      qaSettings: qaSettings || {
        enabled: true,
        allowAnonymous: true,
        enableUpvoting: true,
        moderationRequired: false,
        autoAnswerWithRAG: false,
      },
      pollIds: pollIds || [],
      surveyIds: surveyIds || [],
      resources: resources || [],
      reminderScheduleIds: reminderScheduleIds || [],
      generatedContentIds: generatedContentIds || [],
      socialPostIds: socialPostIds || [],
      status: status || "draft",
      stats: stats || {
        registeredCount: 0,
        confirmedCount: 0,
        attendedCount: 0,
        noShowCount: 0,
        waitlistCount: 0,
        cancelledCount: 0,
      },
      aiBotConfig: aiBotConfig || {
        multilingual: false,
        enableSentimentAnalysis: false,
        humanEscalationThreshold: 5,
      },
      postWebinarConfig: postWebinarConfig || {
        sendRecording: true,
        sendTranscript: true,
        sendSummary: true,
        generateCertificates: false,
        crmSync: false,
        followUpSequenceDays: 3,
      },
      assignedAgentId: assignedAgentId || (user.role === "agent" ? user.id : undefined),
      assignedAgentName: assignedAgentName || (user.role === "agent" ? user.name : ""),
      accessRoles: accessRoles || ["admin", "agent", "customer"],
      updatedAt: now,
    };

    if (!id) {
      webinarData.id = webinarId;
      webinarData.createdAt = now;
      webinarData.createdBy = user.id;
    }

    await db.collection("webinars").doc(webinarId).set(webinarData, { merge: true });

    const actionType = id ? "webinar_update" : "webinar_create";
    const action = id ? "updated" : "created";

    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType,
      actionDetails: `${user.name} (${user.role}) ${action} webinar: ${title}`,
      performedBy: user.id,
      performedByRole: user.role,
      targetId: webinarId,
      targetType: "webinar",
      createdAt: now,
    });

    return NextResponse.json({ success: true, webinar: { id: webinarId, ...webinarData } }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-webinars-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save webinar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let webinarId: string | null = null;
    const url = new URL(request.url);
    webinarId = url.searchParams.get("webinarId");
    if (!webinarId) {
      try {
        const body = await request.json();
        webinarId = body.id;
      } catch (e) {
        // Body might be empty, that's okay
      }
    }

    if (!webinarId) {
      return NextResponse.json({ success: false, error: "Webinar ID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const webinarDoc = await db.collection("webinars").doc(webinarId).get();
    if (!webinarDoc.exists) {
      return NextResponse.json({ success: false, error: "Webinar not found" }, { status: 404 });
    }

    const webinarData = webinarDoc.data();

    if (user.role === "agent" && webinarData?.assignedAgentId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "customer") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.collection("webinars").doc(webinarId).delete();

    await db.collection("audit_logs").add({
      id: `audit-${Date.now()}`,
      actionType: "webinar_delete",
      actionDetails: `${user.name} (${user.role}) deleted webinar ID: ${webinarId}`,
      performedBy: user.id,
      performedByRole: user.role,
      targetId: webinarId,
      targetType: "webinar",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Webinar deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[api-portal-webinars-delete] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete webinar" }, { status: 500 });
  }
}
