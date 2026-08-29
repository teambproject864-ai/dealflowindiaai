import { NextRequest, NextResponse } from "next/server";
import { scrapeGraphService } from "@/lib/scrapegraph-service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isScrapeGraphFeatureAllowed } from "@/lib/scrapegraph-rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isScrapeGraphFeatureAllowed(user.role, "dataset_view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to view datasets" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search") || undefined;

    if (id) {
      const dataset = await scrapeGraphService.getDataset(id);
      if (!dataset) {
        return NextResponse.json({ success: false, error: "Dataset not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, dataset });
    }

    const datasets = await scrapeGraphService.listDatasets({
      userId: user.id,
      search,
    });

    return NextResponse.json({ success: true, count: datasets.length, datasets });
  } catch (error: any) {
    console.error("[ScrapeGraph Datasets GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list datasets" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isScrapeGraphFeatureAllowed(user.role, "dataset_delete")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: role not authorized to delete datasets" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing dataset id" }, { status: 400 });
    }

    const dataset = await scrapeGraphService.getDataset(id);
    if (!dataset) {
      return NextResponse.json({ success: false, error: "Dataset not found" }, { status: 404 });
    }

    if (user.role !== "admin" && dataset.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this dataset" },
        { status: 403 }
      );
    }

    const deleted = await scrapeGraphService.deleteDataset(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("[ScrapeGraph Datasets DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete dataset" },
      { status: 500 }
    );
  }
}
