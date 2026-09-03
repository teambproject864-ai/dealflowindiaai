// app/api/portal/translate/route.ts
import { NextResponse } from "next/server";
import { translateText, detectLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, targetLang = "en", sourceLang } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "text parameter is required" }, { status: 400 });
    }

    const detected = detectLanguage(text);
    const result = await translateText(text, targetLang, sourceLang || detected.code);

    return NextResponse.json({
      success: true,
      result,
      supportedLanguages: SUPPORTED_LANGUAGES,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Translation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    languages: SUPPORTED_LANGUAGES,
  });
}
