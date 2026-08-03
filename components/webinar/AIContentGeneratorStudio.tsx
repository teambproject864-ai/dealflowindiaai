"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Presentation,
  Mail,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
  Layers,
  Globe,
  MessageCircle,
  Video,
  Send,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { AIContentGeneration, SocialPlatformId, WebinarWizardData } from "@/types/webinar";

interface AIContentGeneratorStudioProps {
  wizardData: WebinarWizardData;
  existingContent?: AIContentGeneration;
  onSaveContent?: (content: AIContentGeneration) => void;
}

export function AIContentGeneratorStudio({ wizardData, existingContent, onSaveContent }: AIContentGeneratorStudioProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<AIContentGeneration | null>(existingContent || null);
  const [activeTab, setActiveTab] = useState<"slides" | "email" | "social" | "landing">("social");
  const [activePlatform, setActivePlatform] = useState<SocialPlatformId>("linkedin");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webinar/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizardData }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.aiContent);
        if (onSaveContent) onSaveContent(data.aiContent);
      }
    } catch (e) {
      console.error("Content generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const platformIcons: Record<SocialPlatformId, { label: string; color: string }> = {
    linkedin: { label: "LinkedIn", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
    facebook: { label: "Facebook", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    instagram: { label: "Instagram", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
    twitter: { label: "X (Twitter)", color: "text-slate-200 bg-slate-500/10 border-slate-500/30" },
    threads: { label: "Threads", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
    whatsapp: { label: "WhatsApp", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    telegram: { label: "Telegram", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    youtube: { label: "YouTube", color: "text-red-400 bg-red-500/10 border-red-500/30" },
    email: { label: "Email Newsletter", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  };

  return (
    <GlassPanel className="p-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4" /> AI Content & Creative Studio
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">Multi-Asset & Social Copy Generator</h2>
          <p className="text-xs text-slate-400">Automatically generate slides, emails, and 9-platform social media campaigns</p>
        </div>

        <ExtrudedButton
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-500/20 border-indigo-500/40 text-indigo-200 flex items-center gap-2 text-xs font-bold shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {content ? "Regenerate Assets" : "Generate All AI Assets"}
        </ExtrudedButton>
      </div>

      {!content && !loading && (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Generated Assets Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Generate All AI Assets" above to synthesize customized slide decks, landing pages, email invitations, and 9-platform social copy.
          </p>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">AI Dealflow Engine Synthesizing Content...</h3>
            <p className="text-xs text-slate-400 font-mono">Generating slides, speaker notes, emails, and 9-platform social creatives</p>
          </div>
        </div>
      )}

      {content && !loading && (
        <div className="space-y-6">
          {/* Top Asset Nav Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {[
              { id: "social", label: "9 Social Platforms", icon: Share2 },
              { id: "slides", label: "Presentation Deck", icon: Presentation },
              { id: "email", label: "Email Sequences", icon: Mail },
              { id: "landing", label: "Landing & Reg Page", icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-md"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Social Platforms Sub-Tab View */}
          {activeTab === "social" && (
            <div className="space-y-4">
              {/* 9 Social Platform Selectors */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {(Object.keys(platformIcons) as SocialPlatformId[]).map((platformId) => {
                  const info = platformIcons[platformId];
                  const isActive = activePlatform === platformId;
                  return (
                    <button
                      key={platformId}
                      onClick={() => setActivePlatform(platformId)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                        isActive ? `${info.color} shadow-md` : "bg-slate-900/50 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-[11px] font-extrabold truncate w-full">{info.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Platform Creative Card */}
              {content.socialCreatives[activePlatform] && (
                <GlassPanel className="p-5 space-y-4 bg-slate-900/60 border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${platformIcons[activePlatform].color}`}>
                        {platformIcons[activePlatform].label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Optimal Size: {content.socialCreatives[activePlatform].recommendedImageSize}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          content.socialCreatives[activePlatform].caption,
                          `soc-${activePlatform}`
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {copiedKey === `soc-${activePlatform}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === `soc-${activePlatform}` ? "Copied!" : "Copy Post"}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Generated Caption & Copy</label>
                    <textarea
                      readOnly
                      rows={6}
                      value={content.socialCreatives[activePlatform].caption}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Hashtags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {content.socialCreatives[activePlatform].hashtags.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Call to Action (CTA)</span>
                      <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold block w-max">
                        🎯 {content.socialCreatives[activePlatform].cta}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              )}
            </div>
          )}

          {/* Presentation Deck View */}
          {activeTab === "slides" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.slides.map((slide) => (
                  <div key={slide.slideNumber} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono">Slide {slide.slideNumber}</span>
                      <span className="text-[10px] text-slate-400">AI Visual Generation Prompt</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-100">{slide.title}</h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {slide.bulletPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-[11px] text-slate-400 italic">
                      <strong className="text-slate-300 not-italic">Speaker Notes:</strong> {slide.speakerNotes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Sequences View */}
          {activeTab === "email" && (
            <div className="space-y-4">
              {Object.entries(content.emailSequence).map(([type, email]) => (
                <div key={type} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{type} Email</span>
                    <button
                      onClick={() => copyToClipboard(`${email.subject}\n\n${email.body}`, type)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">Subject: {email.subject}</div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-[11px] text-slate-300 font-sans whitespace-pre-wrap">
                    {email.body}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Landing & Registration Page Copy View */}
          {activeTab === "landing" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Landing Page Hero Copy</h3>
                <div className="text-base font-extrabold text-slate-100">{content.landingPage.headline}</div>
                <div className="text-xs text-slate-300">{content.landingPage.subheadline}</div>
                <p className="text-xs text-slate-400">{content.landingPage.heroDescription}</p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-200 block mb-1">Key Takeaways:</span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {content.landingPage.keyTakeaways.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Registration Form Copy</h3>
                <div className="text-base font-extrabold text-slate-100">{content.registrationPage.headline}</div>
                <p className="text-xs text-slate-300">{content.registrationPage.formIntro}</p>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  🛡️ {content.registrationPage.guaranteeText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
