// app/api/content/keyword-studio/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import {
  KeywordStudioEngine,
  DiscoveredKeywordSet,
  SeoKeywordItem,
  GeoKeywordItem,
  KeywordStudioConfig,
  GroundingInputContext,
} from "@/lib/keyword-studio-engine";
import { FormValidator } from "@/lib/form-validator";

export type { DiscoveredKeywordSet, SeoKeywordItem, GeoKeywordItem, KeywordStudioConfig };

export interface ContentVersion {
  versionId: string;
  versionNumber: number;
  subTypeId: string;
  subTypeTitle: string;
  categoryTitle: string;
  customerName: string;
  customerId: string;
  htmlContent: string;
  keywordsUsed: string[];
  actionType: "generate" | "rewrite";
  createdAt: string;
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth(req, ["admin", "agent", "customer"]);
  if (errorResponse) return errorResponse;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const action = body.action || "discover_keywords";

    // 1. Keyword Discovery Action (Grounded in customer profile + project requirements)
    if (action === "discover_keywords") {
      const customerProfile = body.customerProfile || {};
      const customerName = (body.customerName || customerProfile.companyName || "").trim();

      if (customerName.length > 200) {
        return NextResponse.json(
          { success: false, error: "Customer name exceeds maximum allowed length of 200 characters." },
          { status: 400 }
        );
      }

      const context: GroundingInputContext = {
        customerProfile,
        customerName: customerName || user!.name || "Valued Client",
        industry: body.industry || customerProfile.industry,
        categoryTitle: body.categoryTitle,
        subTypeTitle: body.subTypeTitle,
        badge: body.badge,
        formValues: body.formValues || {},
      };

      const config: Partial<KeywordStudioConfig> = body.config || {};
      const keywordSet = KeywordStudioEngine.extractGroundedKeywords(context, config);

      return NextResponse.json({
        success: true,
        keywordSet,
      });
    }

    // 2. Keyword Search Action (Live query against profile & project)
    if (action === "search_keywords") {
      const query = (body.query || "").trim();
      
      const searchError = FormValidator.validateSearchQuery(query);
      if (searchError) {
        return NextResponse.json(
          { success: false, error: searchError },
          { status: 400 }
        );
      }

      const customerProfile = body.customerProfile || {};
      const context: GroundingInputContext = {
        customerProfile,
        customerName: body.customerName || customerProfile.companyName || user!.name,
        industry: body.industry || customerProfile.industry,
        categoryTitle: body.categoryTitle,
        subTypeTitle: body.subTypeTitle,
        formValues: body.formValues || {},
        searchQuery: query,
      };

      const baseSet: DiscoveredKeywordSet =
        body.keywordSet || KeywordStudioEngine.extractGroundedKeywords(context);

      const searchedSet = KeywordStudioEngine.searchKeywords(baseSet, query, context);

      return NextResponse.json({
        success: true,
        keywordSet: searchedSet,
      });
    }

    // 3. Intelligent Keyword Rewrite Action
    if (action === "rewrite_keywords") {
      const customerProfile = body.customerProfile || {};
      const context: GroundingInputContext = {
        customerProfile,
        customerName: body.customerName || customerProfile.companyName || user!.name,
        industry: body.industry || customerProfile.industry,
        categoryTitle: body.categoryTitle,
        subTypeTitle: body.subTypeTitle,
        formValues: body.formValues || {},
      };

      const existingSet: DiscoveredKeywordSet =
        body.keywordSet || KeywordStudioEngine.extractGroundedKeywords(context);

      const rewrittenSet = KeywordStudioEngine.intelligentlyRewriteKeywords(
        existingSet,
        context,
        body.rewriteAngle
      );

      return NextResponse.json({
        success: true,
        keywordSet: rewrittenSet,
      });
    }

    // 4. Real-Time Instant HTML Generation (Non-streaming for rapid live preview)
    if (action === "generate_html_instant") {
      const {
        categoryTitle = "Written Content",
        subTypeTitle = "SEO Optimized Blog Post",
        badge = "SEO-1",
        customerName = user!.name || "Valued Customer",
        formValues = {},
        customerProfile = {},
        isRewrite = false,
      } = body;

      if (!customerName || typeof customerName !== "string") {
        return NextResponse.json(
          { success: false, error: "Customer name is required for HTML deliverable generation." },
          { status: 400 }
        );
      }

      const keywordSet =
        body.keywordSet ||
        KeywordStudioEngine.extractGroundedKeywords({
          customerProfile,
          customerName,
          categoryTitle,
          subTypeTitle,
          badge,
          formValues,
        });

      const fullHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
        categoryTitle,
        subTypeTitle,
        badge,
        customerName,
        formValues,
        keywordSet,
        isRewrite,
        customerProfile,
      });

      return NextResponse.json({
        success: true,
        html: fullHtml,
      });
    }

    // 5. Real-Time HTML Streaming Generation / Rewrite Action
    if (action === "generate_stream" || action === "rewrite_stream") {
      const {
        categoryTitle = "Written Content",
        subTypeTitle = "SEO Optimized Blog Post",
        badge = "SEO-1",
        customerName = user!.name || "Valued Customer",
        formValues = {},
        customerProfile = {},
        isRewrite = false,
      } = body;

      if (!customerName || typeof customerName !== "string") {
        return NextResponse.json(
          { success: false, error: "Customer name is required for streaming generation." },
          { status: 400 }
        );
      }

      const keywordSet =
        body.keywordSet ||
        KeywordStudioEngine.extractGroundedKeywords({
          customerProfile,
          customerName,
          categoryTitle,
          subTypeTitle,
          badge,
          formValues,
        });

      const fullHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
        categoryTitle,
        subTypeTitle,
        badge,
        customerName,
        formValues,
        keywordSet,
        isRewrite,
        customerProfile,
      });

      // Stream the HTML chunks back to the client
      const encoder = new TextEncoder();
      const chunkSize = 45;
      let offset = 0;

      const stream = new ReadableStream({
        async start(controller) {
          while (offset < fullHtml.length) {
            const chunk = fullHtml.slice(offset, offset + chunkSize);
            controller.enqueue(encoder.encode(chunk));
            offset += chunkSize;
            await new Promise((r) => setTimeout(r, 10));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 6. Save Version to Customer Rewrite History
    if (action === "save_version") {
      const targetCustomerId = user!.role === "customer" ? user!.id : (body.customerId || user!.id);
      const { versionData } = body;
      if (!targetCustomerId || typeof targetCustomerId !== "string" || !versionData) {
        return NextResponse.json(
          { success: false, error: "Valid customerId and versionData are required to save version history." },
          { status: 400 }
        );
      }

      if (!versionData.htmlContent) {
        return NextResponse.json(
          { success: false, error: "HTML content is required to save deliverable version." },
          { status: 400 }
        );
      }

      const versionId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newVersion: ContentVersion = {
        versionId,
        versionNumber: Number(versionData.versionNumber) || 1,
        subTypeId: versionData.subTypeId || "general",
        subTypeTitle: versionData.subTypeTitle || "Deliverable",
        categoryTitle: versionData.categoryTitle || "Content",
        customerName: versionData.customerName || user!.name || "Customer",
        customerId: targetCustomerId,
        htmlContent: versionData.htmlContent || "",
        keywordsUsed: versionData.keywordsUsed || [],
        actionType: versionData.actionType || "generate",
        createdAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await db
            .collection("customers")
            .doc(targetCustomerId)
            .collection("content_versions")
            .doc(versionId)
            .set(newVersion);
        } catch (err) {
          console.warn("[KeywordStudio] Firestore version save error:", err);
        }
      }

      return NextResponse.json({ success: true, version: newVersion });
    }

    // 7. Retrieve Version History
    if (action === "get_history") {
      const targetCustomerId = user!.role === "customer" ? user!.id : (body.customerId || user!.id);
      const { subTypeId } = body;
      if (!targetCustomerId || typeof targetCustomerId !== "string") {
        return NextResponse.json(
          { success: false, error: "Valid customerId is required to fetch history." },
          { status: 400 }
        );
      }

      let versions: ContentVersion[] = [];

      if (db && targetCustomerId) {
        try {
          const q = db
            .collection("customers")
            .doc(targetCustomerId)
            .collection("content_versions")
            .orderBy("createdAt", "desc")
            .limit(10);
          const snap = await q.get();
          versions = snap.docs.map((d) => d.data() as ContentVersion);
          if (subTypeId) {
            versions = versions.filter((v) => v.subTypeId === subTypeId);
          }
        } catch (err) {
          console.warn("[KeywordStudio] Firestore version fetch error:", err);
        }
      }

      return NextResponse.json({ success: true, versions });
    }

    return NextResponse.json({ success: false, error: `Unsupported action '${action}'.` }, { status: 400 });
  } catch (error: any) {
    console.error("[KeywordStudio:Route] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Keyword Studio operation encountered an unexpected error." },
      { status: 500 }
    );
  }
}
