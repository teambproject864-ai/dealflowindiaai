import { NextRequest, NextResponse } from "next/server";
import { scrapeGraphService } from "@/lib/scrapegraph-service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isScrapeGraphFeatureAllowed, getScrapeGraphMaxPages } from "@/lib/scrapegraph-rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isScrapeGraphFeatureAllowed(user.role, "job_view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to view scraping jobs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const engine = searchParams.get("engine") || undefined;
    const search = searchParams.get("search") || undefined;

    const jobs = await scrapeGraphService.listJobs({
      userId: user.id,
      status,
      engine,
      search,
    });

    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (error: any) {
    console.error("[ScrapeGraph Jobs GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list scraping jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isScrapeGraphFeatureAllowed(user.role, "job_create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to create scraping jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: "Extraction prompt is required" },
        { status: 400 }
      );
    }

    const userRole = user.role || "customer";
    const maxPagesLimit = getScrapeGraphMaxPages(userRole);
    let requestedPages = 1;

    if (body.maxPages !== undefined && body.maxPages !== null) {
      const parsed = typeof body.maxPages === "number" ? body.maxPages : Number(body.maxPages);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid maxPages: must be a positive integer",
          },
          { status: 400 }
        );
      }
      requestedPages = parsed;
    }

    if (requestedPages > maxPagesLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Requested page count of ${requestedPages} exceeds your role limit of ${maxPagesLimit}`,
        },
        { status: 403 }
      );
    }

    const job = await scrapeGraphService.createJob({
      userId: user.id,
      userRole,
      title: body.title,
      engine: body.engine || "smart_scraper",
      prompt: body.prompt,
      url: body.url,
      searchQuery: body.searchQuery,
      targetSchema: body.targetSchema,
      renderJs: body.renderJs,
      maxPages: requestedPages,
      datasetName: body.datasetName,
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error("[ScrapeGraph Jobs POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger scraping job" },
      { status: 500 }
    );
  }
}
