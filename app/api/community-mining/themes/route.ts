// app/api/community-mining/themes/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import type { CMTheme, CMThemeStatus, CMTeam } from "@/types/community-mining";

export async function GET(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const team = searchParams.get("team");
    const query = (searchParams.get("q") || "").toLowerCase();

    let themes: CMTheme[] = [];

    if (db) {
      const snap = await db.collection("cm_themes").orderBy("itemCount", "desc").get();
      themes = snap.docs.map((d) => d.data() as CMTheme);
    }

    if (themes.length === 0) {
      // Fetch stats endpoint fallback if DB not populated yet
      const statsUrl = new URL("/api/community-mining/stats", req.url);
      const statsRes = await fetch(statsUrl.toString(), {
        headers: { cookie: req.headers.get("cookie") || "" },
      }).catch(() => null);
      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        themes = data.stats?.trendingThemes || [];
      }
    }

    let filtered = themes;
    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (team && team !== "all") {
      filtered = filtered.filter((t) => t.assignedTeam === team);
    }
    if (query) {
      filtered = filtered.filter((t) =>
        t.label.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.topEntities.some((e) => e.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ success: true, themes: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch themes" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { themeId, status, assignedTeam } = body;

    if (!themeId) {
      return NextResponse.json({ success: false, error: "Missing themeId" }, { status: 400 });
    }

    const updates: Partial<CMTheme> = {
      lastUpdatedAt: new Date().toISOString(),
    };

    if (status) updates.status = status as CMThemeStatus;
    if (assignedTeam) updates.assignedTeam = assignedTeam as CMTeam;

    if (db) {
      await db.collection("cm_themes").doc(themeId).set(updates, { merge: true });
    }

    return NextResponse.json({ success: true, themeId, updates });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update theme" },
      { status: 500 }
    );
  }
}
