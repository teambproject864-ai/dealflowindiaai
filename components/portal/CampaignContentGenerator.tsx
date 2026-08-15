"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Check, 
  Copy, 
  AlertCircle, 
  Edit3, 
  Layers, 
  Loader2,
  CheckCircle2,
  Filter,
  Grid,
  Zap,
  Target,
  ArrowUpRight,
  Sliders,
  Bookmark,
  FileCode,
  Globe,
  Share2,
  Video,
  Mic,
  Image as ImageIcon,
  MousePointer,
  Send,
  BookOpen,
  MessageSquare,
  RotateCw,
  History,
  Code,
  Eye,
  X,
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  COMPLETE_CAMPAIGN_SCHEMA, 
  CoreContentType, 
  ContentSubType, 
  FieldDefinition,
  getTaxonomyMetrics,
  validateFieldInputs
} from "@/lib/campaign-options-schema";
import { DeliverableBuilder } from "@/lib/deliverable-builder";
import { PrePublishValidationReport } from "@/lib/pre-publish-validator";
import type { DiscoveredKeywordSet, ContentVersion } from "@/app/api/content/keyword-studio/route";

interface CampaignContentGeneratorProps {
  customerData?: any;
  customerName?: string;
  onSaveContent?: (contentData: any) => Promise<boolean>;
}

export function CampaignContentGenerator({
  customerData,
  customerName = "Customer",
  onSaveContent
}: CampaignContentGeneratorProps) {
  const metrics = getTaxonomyMetrics();

  // Filter & Navigation State
  const [activeGroupFilter, setActiveGroupFilter] = useState<"all" | "content_types" | "marketing_tactics">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("written_content");
  const [selectedSubTypeId, setSelectedSubTypeId] = useState<string>("blog_posts_seo");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Collapsible Categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    written_content: true,
    social_media_content: true,
    outreach_tactics: true,
    seo_tactics: true,
    paid_marketing_tactics: true
  });

  // Form & Validation State
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState(false);

  // Generation & Output State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [htmlOutput, setHtmlOutput] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copiedState, setCopiedState] = useState(false);
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [deliverableReport, setDeliverableReport] = useState<PrePublishValidationReport | null>(null);

  // SEO & GEO Keywords Automation State
  const [keywordSet, setKeywordSet] = useState<DiscoveredKeywordSet | null>(null);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [showKeywordPanel, setShowKeywordPanel] = useState(true);

  // Version History & Rewrite Log State
  const [versionHistory, setVersionHistory] = useState<ContentVersion[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Refs for stable identity
  const previousSubTypeIdRef = useRef<string>(selectedSubTypeId);
  const formValuesMapRef = useRef<Record<string, Record<string, string>>>({});
  const STORAGE_KEY_PREFIX = "dealflow_studio_form_";

  // Filter Categories Logic
  const filteredCategories = COMPLETE_CAMPAIGN_SCHEMA.map(cat => {
    if (activeGroupFilter !== "all" && cat.typeGroup !== activeGroupFilter) {
      return null;
    }

    const matchesCat = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchingSubTypes = cat.subTypes.filter(sub => 
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchesCat || matchingSubTypes.length > 0) {
      return {
        ...cat,
        subTypes: matchesCat ? cat.subTypes : matchingSubTypes
      };
    }
    return null;
  }).filter(Boolean) as CoreContentType[];

  // Resolvers
  const activeCategory = COMPLETE_CAMPAIGN_SCHEMA.find(c => c.id === selectedCategoryId) || COMPLETE_CAMPAIGN_SCHEMA[0];
  const activeSubType = activeCategory.subTypes.find(s => s.id === selectedSubTypeId) || activeCategory.subTypes[0];

  const getSavedFormValues = (subTypeId: string): Record<string, string> | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subTypeId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed._manuallySaved ? parsed : null;
    } catch (e) {
      return null;
    }
  };

  const setSavedFormValues = (subTypeId: string, values: Record<string, string>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subTypeId}`, JSON.stringify(values));
    } catch (e) {
      // ignore
    }
  };

  // Auto-Discover SEO & GEO Keywords grounded in customer profile
  const fetchKeywords = useCallback(async () => {
    setIsLoadingKeywords(true);
    try {
      const res = await fetch("/api/content/keyword-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "discover_keywords",
          customerProfile: {
            companyName: customerName,
            ...(customerData?.companyInformation || {}),
            ...(customerData || {}),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.keywordSet) {
        setKeywordSet(data.keywordSet);
      }
    } catch (err) {
      console.error("Keyword discovery error:", err);
    } finally {
      setIsLoadingKeywords(false);
    }
  }, [customerData, customerName]);

  // Discover keywords once on mount or when customer data changes
  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  // Load and retain form values across subType switches (FIX FOR SCROLL BUG: does NOT reset generated output on page scroll / re-renders)
  useEffect(() => {
    if (!activeSubType) return;
    
    // Only reset generated output if the user deliberately switched to a DIFFERENT subType
    const hasSubTypeChanged = previousSubTypeIdRef.current !== selectedSubTypeId;
    if (hasSubTypeChanged) {
      previousSubTypeIdRef.current = selectedSubTypeId;
      setGeneratedOutput(null);
      setHtmlOutput(null);
      setDeliverableReport(null);
    }

    let currentVals = formValuesMapRef.current[selectedSubTypeId];

    if (!currentVals) {
      const saved = getSavedFormValues(selectedSubTypeId);
      if (saved) {
        currentVals = saved;
        formValuesMapRef.current[selectedSubTypeId] = saved;
      }
    }

    if (!currentVals) {
      const initialVals: Record<string, string> = {};
      const company = customerData?.companyInformation || {};
      
      activeSubType.fields.forEach(field => {
        if (field.defaultValue) {
          initialVals[field.id] = field.defaultValue;
        } else if (field.id === "targetPersona" || field.id === "targetAudience") {
          initialVals[field.id] = customerData?.targetAudience || customerData?.icpCategory || "B2B Decision Makers";
        } else if (field.id === "targetIndustry" || field.id === "industry") {
          initialVals[field.id] = company.industry || customerData?.industry || "SaaS & Enterprise Tech";
        } else if (field.id === "primaryKeyword" || field.id === "targetKeywords") {
          initialVals[field.id] = customerData?.keywords || "AI pipeline automation, B2B deal flow";
        } else if (field.id === "valueProposition" || field.id === "valueHook") {
          initialVals[field.id] = customerData?.businessGoals || `Accelerate ${customerName} growth and automate outbound pipelines.`;
        } else {
          initialVals[field.id] = "";
        }
      });
      currentVals = initialVals;
      formValuesMapRef.current[selectedSubTypeId] = initialVals;
    }

    setFormValues(currentVals);
    setFieldErrors({});
    setFormTouched(false);
  }, [selectedSubTypeId, activeSubType, customerData, customerName]);

  // Handle Form Input Change
  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => {
      const updated = { ...prev, [fieldId]: value };
      formValuesMapRef.current[selectedSubTypeId] = updated;
      return updated;
    });
    
    if (fieldErrors[fieldId]) {
      const fieldDef = activeSubType.fields.find(f => f.id === fieldId);
      if (fieldDef) {
        const { errors } = validateFieldInputs([fieldDef], { ...formValues, [fieldId]: value });
        if (!errors[fieldId]) {
          setFieldErrors(prev => {
            const updated = { ...prev };
            delete updated[fieldId];
            return updated;
          });
        }
      }
    }
  };

  const handleInputBlur = (fieldId: string) => {
    const fieldDef = activeSubType.fields.find(f => f.id === fieldId);
    if (!fieldDef) return;
    const { errors } = validateFieldInputs([fieldDef], formValues);
    if (errors[fieldId]) {
      setFieldErrors(prev => ({ ...prev, [fieldId]: errors[fieldId] }));
    }
  };

  const validateInputs = (): boolean => {
    const { isValid, errors } = validateFieldInputs(activeSubType.fields, formValues);
    setFieldErrors(errors);
    setFormTouched(true);
    return isValid;
  };

  // Real-Time HTML Streaming Generation / Rewrite Action
  const executeGenerationWithStreaming = async (isRewrite = false) => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setIsStreaming(true);
    setGenerationProgress(15);
    setGenerationStage(isRewrite ? "Analyzing existing deliverable & applying SEO/GEO rewrite..." : "Connecting to Multi-Agent LLM Engine & Discovering Keywords...");
    setHtmlOutput("");

    try {
      const response = await fetch("/api/content/keyword-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isRewrite ? "rewrite_stream" : "generate_stream",
          categoryTitle: activeCategory.title,
          subTypeTitle: activeSubType.title,
          badge: activeSubType.badge,
          customerName,
          formValues,
          keywordSet,
          customerProfile: {
            companyName: customerName,
            ...(customerData?.companyInformation || {}),
            ...(customerData || {}),
          },
          isRewrite,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming generation request failed");
      }

      setGenerationProgress(50);
      setGenerationStage("Streaming semantic HTML tokens in real-time...");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedHtml = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedHtml += chunk;
        setHtmlOutput(accumulatedHtml);
      }

      setGenerationProgress(100);
      setGeneratedOutput(accumulatedHtml);
      setEditedText(accumulatedHtml);

      // Pre-publishing Validation
      const deliverable = DeliverableBuilder.buildDeliverable({
        categoryKey: activeCategory.id,
        categoryTitle: activeCategory.title,
        subTypeKey: activeSubType.id,
        subTypeTitle: activeSubType.title,
        badge: activeSubType.badge,
        customerName,
        formValues,
      });
      setDeliverableReport(deliverable.validationReport);

      // Save version to rewrite history
      const newVerNum = isRewrite ? currentVersionNumber + 1 : 1;
      setCurrentVersionNumber(newVerNum);

      const versionRecord: ContentVersion = {
        versionId: `v_${Date.now()}`,
        versionNumber: newVerNum,
        subTypeId: activeSubType.id,
        subTypeTitle: activeSubType.title,
        categoryTitle: activeCategory.title,
        customerName,
        customerId: customerData?.id || "default_customer",
        htmlContent: accumulatedHtml,
        keywordsUsed: keywordSet ? keywordSet.seoKeywords.map((k) => k.keyword) : [],
        actionType: isRewrite ? "rewrite" : "generate",
        createdAt: new Date().toISOString(),
      };

      setVersionHistory((prev) => [versionRecord, ...prev]);

      // Persist to server version history
      if (customerData?.id) {
        fetch("/api/content/keyword-studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_version",
            customerId: customerData.id,
            versionData: versionRecord,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Streaming generation error:", err);
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  // Copy Clipboard
  const handleCopyOutput = () => {
    const textToCopy = isEditingOutput ? editedText : (htmlOutput || generatedOutput || "");
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Manual Save to Profile
  const [isSaving, setIsSaving] = useState(false);
  const [savedState, setSavedState] = useState(false);

  const handleManualSave = async () => {
    if (!htmlOutput && !generatedOutput) return;
    if (!onSaveContent) return;

    setIsSaving(true);
    await onSaveContent({
      type: activeSubType.id,
      category: activeCategory.id,
      inputs: formValues,
      output: isEditingOutput ? editedText : (htmlOutput || generatedOutput),
      format: "html",
      keywordsUsed: keywordSet?.seoKeywords?.map((k) => k.keyword) || [],
      version: currentVersionNumber,
      createdAt: new Date().toISOString(),
    });
    setIsSaving(false);
    setSavedState(true);
    setTimeout(() => setSavedState(false), 2500);
  };

  return (
    <GlassPanel tilt={false} className="border-slate-850 p-6 lg:p-8 bg-slate-950/60 space-y-8 relative overflow-hidden">
      {/* Decorative Blur Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER BANNER & STATS */}
      <div className="space-y-6 border-b border-slate-850 pb-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="h-3 w-3 text-violet-400" /> Complete Campaign Taxonomy & SEO/GEO Studio
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time HTML Streaming</span>
            </div>
            
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-3">
              <Layers className="h-6 w-6 text-violet-400" />
              Content Types & Marketing Tactics Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl font-light leading-relaxed">
              Explore all <span className="text-violet-400 font-bold">20 major categories</span> and <span className="text-white font-bold">{metrics.totalOptions} selectable options</span>. Automated SEO and GEO keyword extraction, live streaming HTML generation, and rewrite versioning.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0 font-mono">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Options</span>
              <span className="text-lg font-black text-white">{metrics.totalOptions}</span>
            </div>
            <div className="bg-violet-950/30 border border-violet-850/60 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-violet-400 font-bold uppercase block">Content Types</span>
              <span className="text-lg font-black text-violet-300">{metrics.contentTypesCount}</span>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-850/60 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Tactics</span>
              <span className="text-lg font-black text-emerald-300">{metrics.marketingTacticsCount}</span>
            </div>
          </div>
        </div>

        {/* SECTION 8: SEO & GEO KEYWORDS AUTOMATION PANEL */}
        <div className="p-4 bg-slate-900/40 border border-violet-500/30 rounded-2xl space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Auto-Discovered SEO & GEO Keywords (Client-Grounded)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchKeywords}
                disabled={isLoadingKeywords}
                className="text-[11px] bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 px-3 py-1 rounded-xl font-mono flex items-center gap-1.5"
              >
                {isLoadingKeywords ? <Loader2 className="h-3 w-3 animate-spin text-violet-400" /> : <RotateCw className="h-3 w-3" />}
                Refresh Keywords
              </button>

              <button
                onClick={() => setShowKeywordPanel(!showKeywordPanel)}
                className="text-[11px] text-slate-400 hover:text-white font-mono px-2 py-1"
              >
                {showKeywordPanel ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {showKeywordPanel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs animate-in fade-in duration-200">
              {/* SEO Keywords Column */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] font-mono uppercase font-bold text-violet-400 block">
                  🎯 SEO Target Keywords (Volume & Intent)
                </span>
                {isLoadingKeywords ? (
                  <p className="text-[11px] text-slate-500 font-mono">Analyzing customer profile...</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {keywordSet?.seoKeywords?.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 bg-violet-950/40 border border-violet-850/60 rounded-lg text-violet-300 text-[11px] font-mono flex items-center gap-1.5">
                        <strong>{kw.keyword}</strong>
                        <span className="text-[9px] text-slate-400 bg-slate-900 px-1 rounded">{kw.searchVolumeEstimate}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* GEO Keywords Column */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block">
                  🤖 GEO (Generative Engine Optimization) Queries
                </span>
                {isLoadingKeywords ? (
                  <p className="text-[11px] text-slate-500 font-mono">Extracting citation patterns...</p>
                ) : (
                  <div className="space-y-1.5">
                    {keywordSet?.geoKeywords?.map((geo, i) => (
                      <div key={i} className="p-1.5 bg-cyan-950/20 border border-cyan-850/40 rounded-lg text-cyan-200 text-[11px] font-mono flex justify-between items-center gap-2">
                        <span className="truncate">&quot;{geo.query}&quot;</span>
                        <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded shrink-0 border border-cyan-800/40">
                          {geo.engineTarget}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* GROUP FILTER TABS & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-850">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setActiveGroupFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeGroupFilter === "all" ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              All {metrics.totalOptions} Options
            </button>
            <button
              onClick={() => setActiveGroupFilter("content_types")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeGroupFilter === "content_types" ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="h-3.5 w-3.5 text-violet-300" /> Content Types ({metrics.contentTypesCount})
            </button>
            <button
              onClick={() => setActiveGroupFilter("marketing_tactics")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeGroupFilter === "marketing_tactics" ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" /> Marketing Tactics ({metrics.marketingTacticsCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taxonomy options..."
              className="bg-slate-950 border-slate-800 text-xs pl-9 py-1.5 h-9 rounded-xl focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* WORKSPACE 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN (4/12): Interactive Taxonomy Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Categories & Sub-Options</span>
            <span className="text-[10px] text-slate-500 font-mono">{filteredCategories.length} Categories</span>
          </div>

          <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1.5 custom-scrollbar">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories[category.id] ?? true;
              const hasActiveChild = category.subTypes.some(s => s.id === selectedSubTypeId);

              return (
                <div key={category.id} className="border border-slate-850/80 rounded-2xl overflow-hidden bg-slate-900/30">
                  <button
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !isExpanded }))}
                    className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                      hasActiveChild ? "bg-slate-900/90 text-white" : "hover:bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`w-2 h-2 rounded-full ${category.typeGroup === "marketing_tactics" ? "bg-emerald-500" : "bg-violet-500"}`} />
                      <span className="text-xs font-bold truncate">{category.title}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="p-2 space-y-1 bg-slate-950/40 border-t border-slate-850/60">
                      {category.subTypes.map((sub) => {
                        const isSelected = selectedSubTypeId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setSelectedSubTypeId(sub.id);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-violet-600 text-white font-bold shadow-md shadow-violet-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                          >
                            <span className="truncate">{sub.title}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}>
                              {sub.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (8/12): Form Input, Real-Time HTML Streaming, & Preview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Deliverable Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {activeCategory.title}
                </span>
                <span className="text-[10px] font-mono uppercase bg-violet-950/40 border border-violet-850 text-violet-300 px-2 py-0.5 rounded">
                  [{activeSubType.badge}]
                </span>
                {currentVersionNumber > 1 && (
                  <span className="text-[10px] font-mono uppercase bg-emerald-950/40 border border-emerald-850 text-emerald-300 px-2 py-0.5 rounded">
                    v{currentVersionNumber}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white">{activeSubType.title}</h3>
              <p className="text-xs text-slate-400">{activeSubType.description}</p>
            </div>

            {/* Version History Trigger */}
            {versionHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="text-xs bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5"
              >
                <History className="h-3.5 w-3.5 text-violet-400" />
                History ({versionHistory.length})
              </button>
            )}
          </div>

          {/* Form Fields Grid */}
          <form onSubmit={(e) => { e.preventDefault(); executeGenerationWithStreaming(false); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSubType.fields.map((field) => {
                const rawVal = formValues[field.id] ?? "";
                const hasError = Boolean(fieldErrors[field.id]);

                return (
                  <div key={field.id} className={field.type === "textarea" ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
                    <Label className="text-xs text-slate-300 font-semibold">{field.label}</Label>
                    
                    {field.type === "text" && (
                      <Input
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleInputBlur(field.id)}
                        placeholder={field.placeholder}
                        className="bg-slate-950/80 border-slate-800 text-xs h-10 rounded-xl text-slate-200"
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        rows={3}
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleInputBlur(field.id)}
                        placeholder={field.placeholder}
                        className="w-full bg-slate-950/80 border border-slate-800 text-xs p-3 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs px-3 h-10 rounded-xl text-slate-200"
                      >
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {hasError && <p className="text-[10px] text-red-400">{fieldErrors[field.id]}</p>}
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTONS: AUTO-GENERATE & REWRITE */}
            <div className="pt-4 border-t border-slate-850 flex justify-between items-center flex-wrap gap-3">
              <div className="text-[10px] text-slate-500 font-mono">
                Outputs clean semantic HTML in real-time
              </div>

              <div className="flex items-center gap-3">
                {/* REWRITE ACTION */}
                {htmlOutput && (
                  <button
                    type="button"
                    onClick={() => executeGenerationWithStreaming(true)}
                    disabled={isGenerating}
                    className="bg-slate-900 hover:bg-slate-850 border border-violet-500/40 text-violet-300 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-violet-400" /> Rewrite Content
                  </button>
                )}

                {/* AUTO-GENERATE ACTION */}
                <ExtrudedButton
                  type="submit"
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-3 px-7 rounded-xl shadow-lg shadow-violet-500/20 inline-flex items-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Streaming Deliverable...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Auto-Generate (HTML Stream)</>
                  )}
                </ExtrudedButton>
              </div>
            </div>
          </form>

          {/* REAL-TIME STREAMING PROGRESS INDICATOR */}
          {isGenerating && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-3 animate-in fade-in duration-200">
              <Loader2 className="h-7 w-7 animate-spin text-violet-400 mx-auto" />
              <div className="max-w-xs mx-auto h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{generationStage}</p>
            </div>
          )}

          {/* GENERATED DELIVERABLE OUTPUT PANEL (PRESERVED ACROSS SCROLL) */}
          {(htmlOutput || generatedOutput) && (
            <div className="bg-slate-900/40 border border-violet-500/40 p-6 lg:p-8 rounded-2xl space-y-6 shadow-xl shadow-violet-950/20 animate-in fade-in duration-300 relative">
              
              {/* Header Toolbar */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Generated Semantic HTML Deliverable
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Format: Clean Semantic HTML • Version {currentVersionNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle: Preview vs Code */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 ${viewMode === "preview" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      <Eye className="h-3 w-3" /> Rendered HTML
                    </button>
                    <button
                      onClick={() => setViewMode("code")}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 ${viewMode === "code" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      <Code className="h-3 w-3" /> HTML Code
                    </button>
                  </div>

                  <button
                    onClick={handleCopyOutput}
                    className="text-[11px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    {copiedState ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</> : <><Copy className="h-3.5 w-3.5 text-slate-400" /> Copy HTML</>}
                  </button>

                  {onSaveContent && (
                    <button
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className="text-[11px] bg-violet-600 hover:bg-violet-500 text-white font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-500/20"
                    >
                      {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : savedState ? <><Check className="h-3.5 w-3.5 text-white" /> Saved!</> : <><Bookmark className="h-3.5 w-3.5" /> Save to Profile</>}
                    </button>
                  )}

                  {/* Explicit Close / Dismiss Button (Section 9) */}
                  <button
                    onClick={() => {
                      setGeneratedOutput(null);
                      setHtmlOutput(null);
                    }}
                    className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Dismiss deliverable view"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Display Area: Live Semantic HTML Render vs Raw HTML Code */}
              {viewMode === "preview" ? (
                <div 
                  className="bg-slate-950/90 border border-slate-850 rounded-xl p-6 text-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: htmlOutput || generatedOutput || "" }}
                />
              ) : (
                <textarea
                  rows={18}
                  value={editedText || htmlOutput || generatedOutput || ""}
                  onChange={(e) => {
                    setEditedText(e.target.value);
                    setHtmlOutput(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono p-4 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              )}
            </div>
          )}

        </div>

      </div>
    </GlassPanel>
  );
}
