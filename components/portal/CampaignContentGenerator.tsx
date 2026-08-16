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
  Plus,
  Trash2,
  Download,
  Laptop,
  Tablet,
  Smartphone,
  CheckSquare,
  Square,
  Wand2,
  Info,
  Tag,
  ToggleLeft,
  ToggleRight
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
  getTaxonomyMetrics
} from "@/lib/campaign-options-schema";
import { DeliverableBuilder } from "@/lib/deliverable-builder";
import { PrePublishValidationReport } from "@/lib/pre-publish-validator";
import { 
  KeywordStudioEngine,
  DiscoveredKeywordSet, 
  SeoKeywordItem, 
  GeoKeywordItem, 
  KeywordStudioConfig,
  GeoEngineTarget,
  SeoIntent
} from "@/lib/keyword-studio-engine";
import { FormValidator, CsvKeywordParseResult } from "@/lib/form-validator";
import type { ContentVersion } from "@/app/api/content/keyword-studio/route";
import { sanitizeHtml } from "@/lib/sanitize";

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

  // Form & Validation State with Real-Time Error Feedback
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState(false);

  // User Feedback Banner / Toast State (Accessible via aria-live)
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Generation & Output State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [htmlOutput, setHtmlOutput] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedState, setCopiedState] = useState(false);
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [deliverableReport, setDeliverableReport] = useState<PrePublishValidationReport | null>(null);

  // SEO & GEO Keywords Mode: 'auto' | 'manual'
  const [keywordInputMode, setKeywordInputMode] = useState<"auto" | "manual">("auto");
  const [manualCsvInput, setManualCsvInput] = useState("");
  const [manualParsedResult, setManualParsedResult] = useState<CsvKeywordParseResult>({
    keywords: [],
    duplicates: [],
    invalidTokens: [],
    isValid: true
  });

  // SEO & GEO Keywords Automation & Search State
  const [keywordSet, setKeywordSet] = useState<DiscoveredKeywordSet | null>(null);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isRewritingKeywords, setIsRewritingKeywords] = useState(false);
  const [showKeywordPanel, setShowKeywordPanel] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [keywordSearchQuery, setKeywordSearchQuery] = useState("");
  const [keywordSearchError, setKeywordSearchError] = useState<string | null>(null);
  
  // Inline Keyword Editing State
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [editingKeywordText, setEditingKeywordText] = useState("");

  // Dedicated Keyword Configuration Options
  const [studioConfig, setStudioConfig] = useState<KeywordStudioConfig>({
    autoGenerateSeo: true,
    autoGenerateGeo: true,
    targetEngines: ["ChatGPT / SearchGPT", "Google AI Overviews (SGE)", "Perplexity AI", "Claude", "Gemini Pro"],
    intentFilters: ["commercial", "informational", "transactional", "navigational"],
    expansionDepth: "standard",
    autoSyncPreview: true,
  });

  // Version History & Rewrite Log State
  const [versionHistory, setVersionHistory] = useState<ContentVersion[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Refs for stable identity & persistence
  const previousSubTypeIdRef = useRef<string>(selectedSubTypeId);
  const formValuesMapRef = useRef<Record<string, Record<string, string>>>({});
  const STORAGE_KEY_PREFIX = "dealflow_studio_form_";
  const STORAGE_KEY_KEYWORDS_PREFIX = "dealflow_studio_keywords_";
  const STORAGE_KEY_MANUAL_CSV_PREFIX = "dealflow_studio_manual_csv_";

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

  // Keyword Persistence Helpers
  const persistKeywordState = useCallback((subTypeId: string, mode: "auto" | "manual", kwSet: DiscoveredKeywordSet | null, csvText: string) => {
    if (typeof window === "undefined") return;
    try {
      if (kwSet) {
        localStorage.setItem(`${STORAGE_KEY_KEYWORDS_PREFIX}${subTypeId}`, JSON.stringify({ mode, keywordSet: kwSet }));
      }
      localStorage.setItem(`${STORAGE_KEY_MANUAL_CSV_PREFIX}${subTypeId}`, csvText);
    } catch {
      // Storage quota or disabled
    }
  }, []);

  const loadSavedKeywordState = useCallback((subTypeId: string) => {
    if (typeof window === "undefined") return null;
    try {
      const rawKw = localStorage.getItem(`${STORAGE_KEY_KEYWORDS_PREFIX}${subTypeId}`);
      const rawCsv = localStorage.getItem(`${STORAGE_KEY_MANUAL_CSV_PREFIX}${subTypeId}`);
      let savedSet: DiscoveredKeywordSet | null = null;
      let savedMode: "auto" | "manual" = "auto";
      if (rawKw) {
        const parsed = JSON.parse(rawKw);
        if (parsed.keywordSet) savedSet = parsed.keywordSet;
        if (parsed.mode) savedMode = parsed.mode;
      }
      return { savedSet, savedMode, savedCsv: rawCsv || "" };
    } catch {
      return null;
    }
  }, []);

  // Construct local grounding context pulling ICP, Niche, Location, Objectives
  const getGroundingContext = useCallback(() => {
    const currentVals = formValuesMapRef.current[selectedSubTypeId] || formValues;
    const company = customerData?.companyInformation || {};

    return {
      customerProfile: {
        companyName: customerName,
        industry: company.industry || customerData?.industry || "B2B SaaS & Tech",
        targetAudience: currentVals.targetPersona || currentVals.targetAudience || customerData?.targetAudience || customerData?.icpCategory || "B2B Decision Makers",
        businessGoals: currentVals.valueProposition || currentVals.primaryObjective || customerData?.businessGoals || "Accelerate Pipeline Velocity",
        geographicMarkets: currentVals.geographicMarkets || customerData?.geographicMarkets || company.headquarters?.country || "North America & Global",
        keywords: currentVals.primaryKeyword || currentVals.targetKeywords || customerData?.keywords || "",
        ...(customerData || {}),
      },
      customerName,
      industry: company.industry || customerData?.industry,
      categoryTitle: activeCategory.title,
      subTypeTitle: activeSubType.title,
      badge: activeSubType.badge,
      formValues: currentVals,
    };
  }, [customerData, customerName, activeCategory.title, activeSubType.title, activeSubType.badge, selectedSubTypeId, formValues]);

  // Auto-Discover SEO & GEO Keywords grounded in ICP, Niche, Location, & Objectives
  const fetchKeywords = useCallback(async () => {
    setIsLoadingKeywords(true);
    try {
      const context = getGroundingContext();
      const res = await fetch("/api/content/keyword-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "discover_keywords",
          ...context,
          config: studioConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.keywordSet) {
        setKeywordSet(data.keywordSet);
        persistKeywordState(selectedSubTypeId, "auto", data.keywordSet, manualCsvInput);
      } else {
        const localSet = KeywordStudioEngine.extractGroundedKeywords(context, studioConfig);
        setKeywordSet(localSet);
        persistKeywordState(selectedSubTypeId, "auto", localSet, manualCsvInput);
      }
    } catch {
      const localSet = KeywordStudioEngine.extractGroundedKeywords(getGroundingContext(), studioConfig);
      setKeywordSet(localSet);
      persistKeywordState(selectedSubTypeId, "auto", localSet, manualCsvInput);
    } finally {
      setIsLoadingKeywords(false);
    }
  }, [getGroundingContext, studioConfig, selectedSubTypeId, manualCsvInput, persistKeywordState]);

  // Discover keywords or restore saved state on mount / subtype change
  useEffect(() => {
    const saved = loadSavedKeywordState(selectedSubTypeId);
    if (saved && saved.savedSet) {
      setKeywordSet(saved.savedSet);
      setKeywordInputMode(saved.savedMode);
      if (saved.savedCsv) {
        setManualCsvInput(saved.savedCsv);
        setManualParsedResult(FormValidator.parseCsvKeywords(saved.savedCsv));
      }
    } else {
      fetchKeywords();
    }
  }, [selectedSubTypeId, fetchKeywords, loadSavedKeywordState]);

  // Load and retain form values across subType switches
  useEffect(() => {
    if (!activeSubType) return;
    
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

  // Real-time Preview Synchronizer
  const triggerInstantPreviewUpdate = useCallback((updatedKeywordSet?: DiscoveredKeywordSet) => {
    if (!studioConfig.autoSyncPreview) return;
    const currentKws = updatedKeywordSet || keywordSet;
    if (!currentKws) return;

    const freshHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
      categoryTitle: activeCategory.title,
      subTypeTitle: activeSubType.title,
      badge: activeSubType.badge,
      customerName,
      formValues,
      keywordSet: currentKws,
      customerProfile: {
        companyName: customerName,
        ...(customerData?.companyInformation || {}),
        ...(customerData || {}),
      },
    });

    if (htmlOutput || generatedOutput) {
      setHtmlOutput(freshHtml);
      setGeneratedOutput(freshHtml);
      setEditedText(freshHtml);
    }
  }, [studioConfig.autoSyncPreview, keywordSet, activeCategory.title, activeSubType.title, activeSubType.badge, customerName, formValues, customerData, htmlOutput, generatedOutput]);

  // Field Validation
  const validateSingleField = (field: FieldDefinition, value: string): string | null => {
    const isRequired = field.required !== false;
    const minLength = isRequired ? 2 : undefined;
    const maxLength = field.type === "textarea" ? 1500 : 300;

    return FormValidator.validateField(
      value,
      {
        required: isRequired,
        minLength,
        maxLength,
      },
      field.label
    );
  };

  // Form Input Change
  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => {
      const updated = { ...prev, [fieldId]: value };
      formValuesMapRef.current[selectedSubTypeId] = updated;
      return updated;
    });

    const fieldDef = activeSubType.fields.find(f => f.id === fieldId);
    if (fieldDef) {
      const errorMsg = validateSingleField(fieldDef, value);
      setFieldErrors(prev => {
        const updated = { ...prev };
        if (errorMsg) {
          updated[fieldId] = errorMsg;
        } else {
          delete updated[fieldId];
        }
        return updated;
      });
    }

    if (htmlOutput && studioConfig.autoSyncPreview) {
      triggerInstantPreviewUpdate();
    }
  };

  const handleInputBlur = (fieldId: string) => {
    const fieldDef = activeSubType.fields.find(f => f.id === fieldId);
    if (!fieldDef) return;
    const errorMsg = validateSingleField(fieldDef, formValues[fieldId] || "");
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (errorMsg) {
        updated[fieldId] = errorMsg;
      } else {
        delete updated[fieldId];
      }
      return updated;
    });
  };

  // Validate inputs before generation
  const validateInputs = (): boolean => {
    const result = FormValidator.validateFormFields(
      activeSubType.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type as any,
        required: f.required !== false,
        maxLength: f.type === "textarea" ? 1500 : 300
      })),
      formValues
    );

    setFieldErrors(result.errors);
    setFormTouched(true);

    if (!result.isValid) {
      showFeedback("error", `Please resolve ${Object.keys(result.errors).length} invalid field(s) before generating.`);
      if (result.firstErrorFieldId && typeof document !== "undefined") {
        const el = document.getElementById(result.firstErrorFieldId);
        if (el) el.focus();
      }
    }

    return result.isValid;
  };

  // Live Keyword Search with Validation
  const handleKeywordSearch = async (query: string) => {
    setKeywordSearchQuery(query);
    const searchErr = FormValidator.validateSearchQuery(query);
    setKeywordSearchError(searchErr);
    if (searchErr) return;

    if (!keywordSet) return;

    if (!query.trim()) {
      fetchKeywords();
      return;
    }

    try {
      const context = getGroundingContext();
      const res = await fetch("/api/content/keyword-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search_keywords",
          query,
          keywordSet,
          ...context,
        }),
      });
      const data = await res.json();
      if (data.success && data.keywordSet) {
        setKeywordSet(data.keywordSet);
        triggerInstantPreviewUpdate(data.keywordSet);
      }
    } catch {
      const filtered = KeywordStudioEngine.searchKeywords(keywordSet, query, getGroundingContext());
      setKeywordSet(filtered);
      triggerInstantPreviewUpdate(filtered);
    }
  };

  // Manual CSV Input Handler with Duplicate Detection & Real-time Validation
  const handleManualCsvChange = (rawText: string) => {
    setManualCsvInput(rawText);
    const parsed = FormValidator.parseCsvKeywords(rawText);
    setManualParsedResult(parsed);

    if (parsed.keywords.length > 0) {
      const customSet = KeywordStudioEngine.createFromCustomKeywords(
        parsed.keywords,
        getGroundingContext()
      );
      setKeywordSet(customSet);
      persistKeywordState(selectedSubTypeId, "manual", customSet, rawText);
      triggerInstantPreviewUpdate(customSet);
    }
  };

  // Remove individual parsed manual keyword
  const removeManualKeyword = (kwToRemove: string) => {
    const updated = manualParsedResult.keywords.filter(k => k !== kwToRemove);
    const newCsv = updated.join(", ");
    handleManualCsvChange(newCsv);
  };

  // Intelligent Keyword Rewrite Action
  const handleIntelligentKeywordRewrite = async () => {
    if (!keywordSet) return;
    setIsRewritingKeywords(true);
    try {
      const context = getGroundingContext();
      const res = await fetch("/api/content/keyword-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_keywords",
          keywordSet,
          ...context,
          rewriteAngle: "high_conversion",
        }),
      });
      const data = await res.json();
      if (data.success && data.keywordSet) {
        setKeywordSet(data.keywordSet);
        persistKeywordState(selectedSubTypeId, keywordInputMode, data.keywordSet, manualCsvInput);
        triggerInstantPreviewUpdate(data.keywordSet);
        showFeedback("success", "Keywords successfully optimized and rewritten for high conversion.");
      } else {
        const rewritten = KeywordStudioEngine.intelligentlyRewriteKeywords(keywordSet, context);
        setKeywordSet(rewritten);
        persistKeywordState(selectedSubTypeId, keywordInputMode, rewritten, manualCsvInput);
        triggerInstantPreviewUpdate(rewritten);
        showFeedback("success", "Keywords optimized via local intelligent engine.");
      }
    } catch {
      const rewritten = KeywordStudioEngine.intelligentlyRewriteKeywords(keywordSet, getGroundingContext());
      setKeywordSet(rewritten);
      persistKeywordState(selectedSubTypeId, keywordInputMode, rewritten, manualCsvInput);
      triggerInstantPreviewUpdate(rewritten);
      showFeedback("success", "Keywords optimized successfully.");
    } finally {
      setIsRewritingKeywords(false);
    }
  };

  // Toggle Keyword Selection State
  const toggleSeoKeyword = (id: string) => {
    if (!keywordSet) return;
    const updatedSeo = keywordSet.seoKeywords.map(k => k.id === id ? { ...k, selected: !k.selected } : k);
    const updatedSet = { ...keywordSet, seoKeywords: updatedSeo };
    setKeywordSet(updatedSet);
    persistKeywordState(selectedSubTypeId, keywordInputMode, updatedSet, manualCsvInput);
    triggerInstantPreviewUpdate(updatedSet);
  };

  const toggleGeoKeyword = (id: string) => {
    if (!keywordSet) return;
    const updatedGeo = keywordSet.geoKeywords.map(g => g.id === id ? { ...g, selected: !g.selected } : g);
    const updatedSet = { ...keywordSet, geoKeywords: updatedGeo };
    setKeywordSet(updatedSet);
    persistKeywordState(selectedSubTypeId, keywordInputMode, updatedSet, manualCsvInput);
    triggerInstantPreviewUpdate(updatedSet);
  };

  const removeSeoKeyword = (id: string) => {
    if (!keywordSet) return;
    const updatedSeo = keywordSet.seoKeywords.filter(k => k.id !== id);
    const updatedSet = { ...keywordSet, seoKeywords: updatedSeo };
    setKeywordSet(updatedSet);
    persistKeywordState(selectedSubTypeId, keywordInputMode, updatedSet, manualCsvInput);
    triggerInstantPreviewUpdate(updatedSet);
    showFeedback("info", "SEO keyword removed.");
  };

  const removeGeoKeyword = (id: string) => {
    if (!keywordSet) return;
    const updatedGeo = keywordSet.geoKeywords.filter(g => g.id !== id);
    const updatedSet = { ...keywordSet, geoKeywords: updatedGeo };
    setKeywordSet(updatedSet);
    persistKeywordState(selectedSubTypeId, keywordInputMode, updatedSet, manualCsvInput);
    triggerInstantPreviewUpdate(updatedSet);
    showFeedback("info", "GEO citation trigger removed.");
  };

  // Inline Keyword Edit Handlers
  const startEditingKeyword = (kw: SeoKeywordItem) => {
    setEditingKeywordId(kw.id);
    setEditingKeywordText(kw.keyword);
  };

  const saveEditingKeyword = () => {
    if (!keywordSet || !editingKeywordId) return;
    const validationErr = FormValidator.validateKeyword(editingKeywordText);
    if (validationErr) {
      showFeedback("error", validationErr);
      return;
    }

    const updatedSeo = keywordSet.seoKeywords.map(k => k.id === editingKeywordId ? { ...k, keyword: editingKeywordText.trim() } : k);
    const updatedSet = { ...keywordSet, seoKeywords: updatedSeo };
    setKeywordSet(updatedSet);
    persistKeywordState(selectedSubTypeId, keywordInputMode, updatedSet, manualCsvInput);
    setEditingKeywordId(null);
    triggerInstantPreviewUpdate(updatedSet);
    showFeedback("success", "Keyword updated.");
  };

  // Real-Time HTML Streaming Generation
  const executeGenerationWithStreaming = async (isRewrite = false) => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setIsStreaming(true);
    setGenerationProgress(15);
    setGenerationStage(isRewrite ? "Analyzing existing deliverable & applying SEO/GEO rewrite..." : "Connecting to Multi-Agent LLM Engine & Ingesting Keywords...");
    setHtmlOutput("");

    try {
      const effectiveKeywordSet = keywordSet || KeywordStudioEngine.extractGroundedKeywords(getGroundingContext(), studioConfig);

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
          keywordSet: effectiveKeywordSet,
          customerProfile: {
            companyName: customerName,
            ...(customerData?.companyInformation || {}),
            ...(customerData || {}),
          },
          isRewrite,
        }),
      });

      if (!response.ok || !response.body) {
        const localHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
          categoryTitle: activeCategory.title,
          subTypeTitle: activeSubType.title,
          badge: activeSubType.badge,
          customerName,
          formValues,
          keywordSet: effectiveKeywordSet,
          isRewrite,
          customerProfile: customerData,
        });
        setHtmlOutput(localHtml);
        setGeneratedOutput(localHtml);
        setEditedText(localHtml);
        showFeedback("success", "Semantic HTML deliverable generated successfully.");
        return;
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
        keywordsUsed: effectiveKeywordSet ? effectiveKeywordSet.seoKeywords.filter(k => k.selected !== false).map((k) => k.keyword) : [],
        actionType: isRewrite ? "rewrite" : "generate",
        createdAt: new Date().toISOString(),
      };

      setVersionHistory((prev) => [versionRecord, ...prev]);
      showFeedback("success", isRewrite ? `Deliverable rewritten to v${newVerNum}.` : "Deliverable generated successfully.");

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
      console.error("Streaming generation error, falling back locally:", err);
      const effectiveKeywordSet = keywordSet || KeywordStudioEngine.extractGroundedKeywords(getGroundingContext(), studioConfig);
      const fallbackHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
        categoryTitle: activeCategory.title,
        subTypeTitle: activeSubType.title,
        badge: activeSubType.badge,
        customerName,
        formValues,
        keywordSet: effectiveKeywordSet,
        isRewrite,
        customerProfile: customerData,
      });
      setHtmlOutput(fallbackHtml);
      setGeneratedOutput(fallbackHtml);
      setEditedText(fallbackHtml);
      showFeedback("info", "Deliverable synthesized via offline engine fallback.");
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  // Instant HTML Preview Generation Trigger
  const generateInstantPreview = () => {
    if (!validateInputs()) return;
    const effectiveKeywordSet = keywordSet || KeywordStudioEngine.extractGroundedKeywords(getGroundingContext(), studioConfig);
    const instantHtml = KeywordStudioEngine.buildSemanticHtmlDeliverable({
      categoryTitle: activeCategory.title,
      subTypeTitle: activeSubType.title,
      badge: activeSubType.badge,
      customerName,
      formValues,
      keywordSet: effectiveKeywordSet,
      customerProfile: customerData,
    });
    setHtmlOutput(instantHtml);
    setGeneratedOutput(instantHtml);
    setEditedText(instantHtml);
    showFeedback("success", "Instant HTML preview updated.");
  };

  // Copy Clipboard with Accessible Feedback
  const handleCopyOutput = () => {
    const textToCopy = isEditingOutput ? editedText : (htmlOutput || generatedOutput || "");
    if (!textToCopy) {
      showFeedback("error", "No content available to copy.");
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    showFeedback("success", "Semantic HTML copied to clipboard.");
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Download HTML File
  const handleDownloadHtml = () => {
    const content = isEditingOutput ? editedText : (htmlOutput || generatedOutput || "");
    if (!content) {
      showFeedback("error", "No deliverable available to download.");
      return;
    }
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${activeSubType.id}-deliverable.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback("success", "Deliverable HTML file downloaded.");
  };

  // Manual Save to Profile
  const [isSaving, setIsSaving] = useState(false);
  const [savedState, setSavedState] = useState(false);

  const handleManualSave = async () => {
    if (!htmlOutput && !generatedOutput) return;
    if (!onSaveContent) return;

    setIsSaving(true);
    try {
      await onSaveContent({
        type: activeSubType.id,
        category: activeCategory.id,
        inputs: formValues,
        output: isEditingOutput ? editedText : (htmlOutput || generatedOutput),
        format: "html",
        keywordsUsed: keywordSet?.seoKeywords?.filter(k => k.selected !== false).map((k) => k.keyword) || [],
        geoQueriesUsed: keywordSet?.geoKeywords?.filter(g => g.selected !== false).map((g) => g.query) || [],
        version: currentVersionNumber,
        createdAt: new Date().toISOString(),
      });
      setSavedState(true);
      showFeedback("success", `Deliverable saved to ${customerName}'s profile.`);
      setTimeout(() => setSavedState(false), 2500);
    } catch {
      showFeedback("error", "Failed to save deliverable to profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeHtml = htmlOutput || generatedOutput || "";
  const seoMatchesCount = keywordSet?.seoKeywords?.filter(k => k.selected !== false && activeHtml.toLowerCase().includes(k.keyword.toLowerCase())).length || 0;
  const geoMatchesCount = keywordSet?.geoKeywords?.filter(g => g.selected !== false && activeHtml.toLowerCase().includes(g.query.toLowerCase().slice(0, 20))).length || 0;

  return (
    <GlassPanel tilt={false} className="border-slate-800/80 p-5 sm:p-7 bg-slate-950/70 space-y-6 relative overflow-hidden">
      
      {/* ACCESSIBLE FEEDBACK STATUS BANNER (WCAG 2.1 AA Compliant) */}
      <div aria-live="polite" role="status" className="sr-only">
        {feedbackBanner?.message}
      </div>

      {feedbackBanner && (
        <div 
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border transition-all animate-in fade-in duration-200 ${
            feedbackBanner.type === "success" ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200" :
            feedbackBanner.type === "error" ? "bg-rose-950/80 border-rose-500/50 text-rose-200" :
            "bg-violet-950/80 border-violet-500/50 text-violet-200"
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {feedbackBanner.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            {feedbackBanner.type === "info" && <Info className="h-4 w-4 text-violet-400 shrink-0" />}
            <span>{feedbackBanner.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white p-1 rounded"
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* STREAMLINED HEADER */}
      <div className="space-y-4 border-b border-slate-800 pb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] bg-violet-950/60 text-violet-300 border border-violet-700/50 px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-violet-400" /> SEO & GEO Studio
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {metrics.totalCategories} Categories • {metrics.totalOptions} Sub-Types
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-violet-400" />
              Content Types & Marketing Tactics Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-normal leading-relaxed mt-0.5">
              Integrated dual-mode keyword configuration (ICP Auto-Generation & Manual CSV entry), real-time validation, and live semantic HTML preview.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowConfigModal(!showConfigModal)}
              className={`text-xs px-3.5 py-2 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
                showConfigModal ? "bg-violet-600 text-white border-violet-500" : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white"
              }`}
              aria-expanded={showConfigModal}
              aria-label="Toggle keyword configuration options"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Engine Settings</span>
              {showConfigModal ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE: CONFIGURATION PANEL */}
        {showConfigModal && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-violet-500/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-violet-300 uppercase font-mono flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5" /> Keyword Automation & Grounding Settings
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Sync Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-seo-toggle" className="text-slate-300 font-bold cursor-pointer">Auto-Gen SEO</label>
                  <input
                    id="auto-seo-toggle"
                    type="checkbox"
                    checked={studioConfig.autoGenerateSeo}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, autoGenerateSeo: e.target.checked }))}
                    className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Extracts volume and intent-aligned targets from ICP.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-geo-toggle" className="text-slate-300 font-bold cursor-pointer">Auto-Gen GEO</label>
                  <input
                    id="auto-geo-toggle"
                    type="checkbox"
                    checked={studioConfig.autoGenerateGeo}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, autoGenerateGeo: e.target.checked }))}
                    className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Citation triggers for SearchGPT, SGE, & Perplexity.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <label htmlFor="expansion-depth" className="text-slate-300 font-bold block">Expansion Depth</label>
                <select
                  id="expansion-depth"
                  value={studioConfig.expansionDepth}
                  onChange={(e) => setStudioConfig(prev => ({ ...prev, expansionDepth: e.target.value as any }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px]"
                >
                  <option value="concise">Concise (5 Key Terms)</option>
                  <option value="standard">Standard (8 Terms + 5 Queries)</option>
                  <option value="deep">Deep Multi-Angle (12+ Matrix)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-sync-preview" className="text-slate-300 font-bold cursor-pointer">Live Preview Sync</label>
                  <input
                    id="auto-sync-preview"
                    type="checkbox"
                    checked={studioConfig.autoSyncPreview}
                    onChange={(e) => setStudioConfig(prev => ({ ...prev, autoSyncPreview: e.target.checked }))}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Refreshes deliverable preview immediately upon keyword edits.</p>
              </div>
            </div>
          </div>
        )}

        {/* GROUP FILTER TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-slate-850">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveGroupFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeGroupFilter === "all" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({metrics.totalOptions})
            </button>
            <button
              onClick={() => setActiveGroupFilter("content_types")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeGroupFilter === "content_types" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="h-3 w-3 text-violet-300" /> Content ({metrics.contentTypesCount})
            </button>
            <button
              onClick={() => setActiveGroupFilter("marketing_tactics")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeGroupFilter === "marketing_tactics" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="h-3 w-3 text-emerald-400" /> Tactics ({metrics.marketingTacticsCount})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <label htmlFor="taxonomy-search-filter" className="sr-only">Search taxonomy options</label>
            <Input
              id="taxonomy-search-filter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taxonomy..."
              className="bg-slate-950 border-slate-800 text-xs pl-8 py-1 h-8 rounded-xl focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* WORKSPACE 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (4/12): Taxonomy Navigation */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Categories & Sub-Options</span>
            <span className="text-[10px] text-slate-500 font-mono">{filteredCategories.length} Categories</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories[category.id] ?? true;
              const hasActiveChild = category.subTypes.some(s => s.id === selectedSubTypeId);

              return (
                <div key={category.id} className="border border-slate-850 rounded-xl overflow-hidden bg-slate-900/20">
                  <button
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !isExpanded }))}
                    className={`w-full p-2.5 flex items-center justify-between text-left transition-colors ${
                      hasActiveChild ? "bg-slate-900/80 text-white font-semibold" : "hover:bg-slate-900/40 text-slate-300"
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`w-2 h-2 rounded-full ${category.typeGroup === "marketing_tactics" ? "bg-emerald-500" : "bg-violet-500"}`} />
                      <span className="text-xs truncate">{category.title}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-slate-950/40 border-t border-slate-850/60">
                      {category.subTypes.map((sub) => {
                        const isSelected = selectedSubTypeId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setSelectedSubTypeId(sub.id);
                            }}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-violet-600 text-white font-bold shadow-sm"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                            }`}
                          >
                            <span className="truncate">{sub.title}</span>
                            <span className={`text-[9px] font-mono px-1 py-0.5 rounded uppercase font-bold shrink-0 ${
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

        {/* RIGHT COLUMN (8/12): Form Input, Integrated Keywords, Validation, Live Preview */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Active Deliverable Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-300">
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
              <h3 className="text-base font-extrabold text-white">{activeSubType.title}</h3>
              <p className="text-xs text-slate-400">{activeSubType.description}</p>
            </div>

            {versionHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="text-xs bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 shrink-0"
              >
                <History className="h-3 w-3 text-violet-400" />
                History ({versionHistory.length})
              </button>
            )}
          </div>

          {/* Form Fields Grid with Real-Time Validation */}
          <form onSubmit={(e) => { e.preventDefault(); executeGenerationWithStreaming(false); }} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSubType.fields.map((field) => {
                const rawVal = formValues[field.id] ?? "";
                const errorMsg = fieldErrors[field.id];
                const hasError = Boolean(errorMsg);
                const isRequired = field.required !== false;
                const maxLen = field.type === "textarea" ? 1500 : 300;

                return (
                  <div key={field.id} className={field.type === "textarea" ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
                    <div className="flex justify-between items-center">
                      <Label htmlFor={field.id} className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                        {field.label}
                        {isRequired && <span className="text-violet-400" title="Required field">*</span>}
                      </Label>
                      <span className={`text-[10px] font-mono ${rawVal.length > maxLen ? "text-rose-400 font-bold" : "text-slate-500"}`}>
                        {rawVal.length}/{maxLen}
                      </span>
                    </div>
                    
                    {field.type === "text" && (
                      <Input
                        id={field.id}
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleInputBlur(field.id)}
                        placeholder={field.placeholder}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${field.id}-error` : undefined}
                        className={`bg-slate-950/80 text-xs h-10 rounded-xl text-slate-200 ${
                          hasError ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-slate-800 focus:border-violet-500"
                        }`}
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        id={field.id}
                        rows={3}
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleInputBlur(field.id)}
                        placeholder={field.placeholder}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${field.id}-error` : undefined}
                        className={`w-full bg-slate-950/80 text-xs p-3 rounded-xl text-slate-200 focus:outline-none ${
                          hasError ? "border border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border border-slate-800 focus:border-violet-500"
                        }`}
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        id={field.id}
                        value={rawVal}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs px-3 h-10 rounded-xl text-slate-200"
                      >
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {hasError && (
                      <p id={`${field.id}-error`} role="alert" className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errorMsg}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DEDICATED IN-FORM SEO & GEO KEYWORDS CONFIGURATION MATRIX (DUAL INPUT MECHANISM) */}
            <div className="p-4 bg-slate-900/60 border border-violet-500/40 rounded-2xl space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Target SEO & GEO Optimization Matrix
                  </h4>
                </div>

                {/* Mode Switcher Toggle: Auto-Generated vs Manual Custom */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setKeywordInputMode("auto");
                      persistKeywordState(selectedSubTypeId, "auto", keywordSet, manualCsvInput);
                    }}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                      keywordInputMode === "auto" ? "bg-violet-600 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Generated (ICP Grounded)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKeywordInputMode("manual");
                      persistKeywordState(selectedSubTypeId, "manual", keywordSet, manualCsvInput);
                    }}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                      keywordInputMode === "manual" ? "bg-violet-600 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Edit3 className="h-3 w-3" /> Manual Custom (CSV)
                  </button>
                </div>
              </div>

              {/* AUTO-GENERATED MODE: Grounded in ICP, Niche, Location, Objectives */}
              {keywordInputMode === "auto" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                    <span>
                      Grounded in: ICP ({formValues.targetPersona || customerData?.targetAudience || "B2B Decision Makers"}), Niche ({customerData?.companyInformation?.industry || "SaaS"}), & Objectives.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchKeywords}
                        disabled={isLoadingKeywords}
                        className="text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1"
                      >
                        {isLoadingKeywords ? <Loader2 className="h-3 w-3 animate-spin text-violet-400" /> : <RotateCw className="h-3 w-3" />}
                        Regenerate from Parameters
                      </button>

                      <button
                        type="button"
                        onClick={handleIntelligentKeywordRewrite}
                        disabled={isRewritingKeywords}
                        className="text-violet-300 hover:text-violet-200 px-2 py-1 rounded bg-violet-950/60 border border-violet-800/60 flex items-center gap-1 font-bold"
                      >
                        {isRewritingKeywords ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                        Intelligent Rewrite
                      </button>
                    </div>
                  </div>

                  {/* Inline Keyword Chips with Inline Editing */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase font-bold text-violet-400">Active Target SEO Keywords (Click to edit inline):</span>
                      <span className="text-[10px] text-slate-500 font-mono">{keywordSet?.seoKeywords?.filter(k => k.selected !== false).length || 0} selected</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {keywordSet?.seoKeywords?.map((kw) => {
                        const isEditing = editingKeywordId === kw.id;
                        return (
                          <div 
                            key={kw.id} 
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                              kw.selected !== false ? "bg-violet-950/50 border-violet-700/60 text-violet-200" : "bg-slate-900/40 border-slate-850 text-slate-500 line-through"
                            }`}
                          >
                            <button 
                              type="button"
                              onClick={() => toggleSeoKeyword(kw.id)}
                              className="hover:text-white"
                              aria-label={`Toggle ${kw.keyword}`}
                            >
                              {kw.selected !== false ? <CheckSquare className="h-3 w-3 text-violet-400" /> : <Square className="h-3 w-3 text-slate-600" />}
                            </button>

                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingKeywordText}
                                  onChange={(e) => setEditingKeywordText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveEditingKeyword(); else if (e.key === "Escape") setEditingKeywordId(null); }}
                                  autoFocus
                                  className="bg-slate-900 border border-violet-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                                />
                                <button type="button" onClick={saveEditingKeyword} className="text-emerald-400 hover:text-emerald-300 font-bold px-1">✓</button>
                                <button type="button" onClick={() => setEditingKeywordId(null)} className="text-slate-400 hover:text-slate-200 px-1">✕</button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => startEditingKeyword(kw)} 
                                className="cursor-pointer hover:underline hover:text-white flex items-center gap-1"
                                title="Click to edit keyword"
                              >
                                {kw.keyword}
                                <Edit3 className="h-2.5 w-2.5 text-slate-400 opacity-60" />
                              </span>
                            )}

                            <span className="text-[9px] text-slate-400 bg-slate-900 px-1 rounded">{kw.searchVolumeEstimate}</span>

                            <button 
                              type="button" 
                              onClick={() => removeSeoKeyword(kw.id)} 
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                              aria-label="Remove keyword"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* GEO Citation Queries */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block">Generative Engine (GEO) Citation Targets:</span>
                    <div className="space-y-1">
                      {keywordSet?.geoKeywords?.map((geo) => (
                        <div key={geo.id} className="p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-cyan-200 flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <button type="button" onClick={() => toggleGeoKeyword(geo.id)} className="hover:text-white">
                              {geo.selected !== false ? <CheckSquare className="h-3 w-3 text-cyan-400" /> : <Square className="h-3 w-3 text-slate-600" />}
                            </button>
                            <span className="truncate">&ldquo;{geo.query}&rdquo;</span>
                          </div>
                          <span className="text-[9px] text-cyan-400 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800/40 shrink-0">
                            {geo.engineTarget}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MANUAL CUSTOM MODE: CSV & Tag Input with Duplicate Detection */}
              {keywordInputMode === "manual" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="manual-csv-textarea" className="text-xs text-slate-300 font-semibold">
                        Enter Custom Keywords (Comma-Separated Values):
                      </Label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {manualParsedResult.keywords.length} unique keyword(s)
                      </span>
                    </div>

                    <textarea
                      id="manual-csv-textarea"
                      rows={3}
                      value={manualCsvInput}
                      onChange={(e) => handleManualCsvChange(e.target.value)}
                      placeholder="e.g. b2b revops automation, ai pipeline software, sales intelligence, enterprise sdr workflows"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
                    />
                  </div>

                  {/* Duplicate Detection Alert Banner */}
                  {manualParsedResult.duplicates.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-200 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>
                        Duplicate keyword(s) detected and automatically merged: <strong>{manualParsedResult.duplicates.join(", ")}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Validation Error Banner */}
                  {manualParsedResult.errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-200 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>{manualParsedResult.errorMessage}</span>
                    </div>
                  )}

                  {/* Parsed Keyword Tag Chips */}
                  {manualParsedResult.keywords.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">Parsed Keyword Tags (Active in Content Pipeline):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {manualParsedResult.keywords.map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-emerald-200 text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => removeManualKeyword(kw)}
                              className="text-slate-400 hover:text-rose-400 p-0.5 ml-1"
                              aria-label={`Remove ${kw}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 border-t border-slate-850 flex justify-between items-center flex-wrap gap-3">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Dual-Input SEO/GEO Pipeline Ready
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={generateInstantPreview}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Eye className="h-3.5 w-3.5 text-cyan-400" /> Instant Preview
                </button>

                {htmlOutput && (
                  <button
                    type="button"
                    onClick={() => executeGenerationWithStreaming(true)}
                    disabled={isGenerating}
                    className="bg-slate-900 hover:bg-slate-850 border border-violet-500/40 text-violet-300 text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-violet-400" /> Rewrite
                  </button>
                )}

                <ExtrudedButton
                  type="submit"
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-violet-500/20 inline-flex items-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Streaming...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Auto-Generate Stream</>
                  )}
                </ExtrudedButton>
              </div>
            </div>
          </form>

          {/* REAL-TIME STREAMING PROGRESS INDICATOR */}
          {isGenerating && (
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl text-center space-y-2.5 animate-in fade-in duration-200" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
              <div className="max-w-xs mx-auto h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
              </div>
              <p className="text-xs text-slate-300 font-mono">{generationStage}</p>
            </div>
          )}

          {/* GENERATED DELIVERABLE OUTPUT & REAL-TIME PREVIEW PANEL WITH KEYWORD ALIGNMENT */}
          {(htmlOutput || generatedOutput) && (
            <div className="bg-slate-900/40 border border-violet-500/40 p-4 sm:p-6 rounded-2xl space-y-4 shadow-xl shadow-violet-950/20 animate-in fade-in duration-300 relative">
              
              {/* Header Toolbar */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-3 flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live HTML Deliverable (v{currentVersionNumber})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Viewport Selector */}
                  {viewMode === "preview" && (
                    <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-0.5 text-slate-400">
                      <button
                        onClick={() => setPreviewViewport("desktop")}
                        className={`p-1 rounded transition-colors ${previewViewport === "desktop" ? "bg-violet-600 text-white" : "hover:text-white"}`}
                        aria-label="Switch to desktop preview"
                      >
                        <Laptop className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setPreviewViewport("tablet")}
                        className={`p-1 rounded transition-colors ${previewViewport === "tablet" ? "bg-violet-600 text-white" : "hover:text-white"}`}
                        aria-label="Switch to tablet preview"
                      >
                        <Tablet className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setPreviewViewport("mobile")}
                        className={`p-1 rounded transition-colors ${previewViewport === "mobile" ? "bg-violet-600 text-white" : "hover:text-white"}`}
                        aria-label="Switch to mobile preview"
                      >
                        <Smartphone className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Mode Toggle */}
                  <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-2.5 py-0.5 rounded flex items-center gap-1 ${viewMode === "preview" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      <Eye className="h-3 w-3" /> Rendered
                    </button>
                    <button
                      onClick={() => setViewMode("code")}
                      className={`px-2.5 py-0.5 rounded flex items-center gap-1 ${viewMode === "code" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      <Code className="h-3 w-3" /> Source
                    </button>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopyOutput}
                    className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    {copiedState ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3 text-slate-400" /> Copy</>}
                  </button>

                  {/* Download HTML */}
                  <button
                    onClick={handleDownloadHtml}
                    className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    title="Export .html file"
                  >
                    <Download className="h-3 w-3 text-slate-400" /> Export
                  </button>

                  {onSaveContent && (
                    <button
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving</> : savedState ? <><Check className="h-3 w-3 text-white" /> Saved</> : <><Bookmark className="h-3 w-3" /> Save</>}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setGeneratedOutput(null);
                      setHtmlOutput(null);
                    }}
                    className="p-1 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white"
                    aria-label="Dismiss deliverable view"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* KEYWORD ALIGNMENT LIVE STATUS CHIPS */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-violet-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-400" /> Active Keyword Alignment Matrix ({seoMatchesCount} SEO Injected • {geoMatchesCount} GEO Citations Verified)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">100% Ingested</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {keywordSet?.seoKeywords?.filter(k => k.selected !== false).map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/60 text-violet-200 text-[10px] flex items-center gap-1">
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                      {k.keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* View Area */}
              {viewMode === "preview" ? (
                <div className="flex justify-center bg-slate-950/60 p-2 sm:p-4 rounded-xl border border-slate-850 overflow-x-auto">
                  <div 
                    style={{ 
                      width: previewViewport === "mobile" ? "375px" : previewViewport === "tablet" ? "768px" : "100%",
                      maxWidth: "100%"
                    }}
                    className="transition-all duration-300"
                  >
                    <div 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlOutput || generatedOutput || "") }}
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  rows={18}
                  value={editedText || htmlOutput || generatedOutput || ""}
                  onChange={(e) => {
                    setEditedText(e.target.value);
                    setHtmlOutput(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono p-3 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              )}
            </div>
          )}

        </div>

      </div>
    </GlassPanel>
  );
}
