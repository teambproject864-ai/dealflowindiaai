// components/portal/ContentWorkflowWorkspace.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Target, 
  TrendingUp, 
  Users, 
  Sparkles, 
  RotateCw, 
  Check, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  MessageSquare, 
  Layers, 
  Zap, 
  Play, 
  HelpCircle, 
  AlertCircle,
  CornerDownRight,
  TrendingDown,
  ArrowRight,
  Send
} from "lucide-react";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { generateCampaignStrategy, regenerateSection, CampaignStrategyData } from "@/lib/campaign-generator";
import { CampaignContentGenerator } from "@/components/portal/CampaignContentGenerator";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModelForRole, ModelConfig } from "@/lib/model-registry";
import WorkflowNodeCanvas from "@/components/gtm/n8n/WorkflowNodeCanvas";
import TacticPresetSelector from "@/components/gtm/n8n/TacticPresetSelector";


interface ContentWorkflowWorkspaceProps {
  customerId: string;
  customerName: string;
  initialCustomerData: any;
  onSaveCustomer: (updatedFields: any) => Promise<boolean>;
  userRole: "agent" | "customer" | "admin";
}

export function ContentWorkflowWorkspace({
  customerId,
  customerName,
  initialCustomerData,
  onSaveCustomer,
  userRole = "customer",
}: ContentWorkflowWorkspaceProps) {
  // Studio Workspace Mode
  const [studioMode, setStudioMode] = useState<"strategy" | "n8n_dag" | "tactic_presets">("strategy");

  // Collapsible state for Intake Profile
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form Fields State
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessModel, setBusinessModel] = useState<"b2b" | "b2c" | "d2c" | "custom">("b2b");
  const [targetAudience, setTargetAudience] = useState("");
  const [businessGoals, setBusinessGoals] = useState("");
  const [marketingObjectives, setMarketingObjectives] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [marketingChannels, setMarketingChannels] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [geographicMarkets, setGeographicMarkets] = useState("");
  const [journeyStage, setJourneyStage] = useState("");

  // AI Model Selection State
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(() => getDefaultModelForRole(userRole));

  // Strategy State
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategyData | null>(null);

  
  // Loading & Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");

  // Section-specific Regeneration / Feedback States
  const [activeFeedbackSection, setActiveFeedbackSection] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRegeneratingSection, setIsRegeneratingSection] = useState<string | null>(null);

  const hasInitializedRef = useRef(false);
  const STORAGE_KEY_INTAKE = "dealflow_studio_intake_profile";

  // Load Initial Customer Data once on mount with localStorage backup
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      let savedIntake: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(STORAGE_KEY_INTAKE);
          if (raw) savedIntake = JSON.parse(raw);
        } catch (e) {
          // ignore
        }
      }

      if (savedIntake) {
        if (savedIntake.businessName !== undefined) setBusinessName(savedIntake.businessName);
        if (savedIntake.websiteUrl !== undefined) setWebsiteUrl(savedIntake.websiteUrl);
        if (savedIntake.industry !== undefined) setIndustry(savedIntake.industry);
        if (savedIntake.businessModel !== undefined) setBusinessModel(savedIntake.businessModel);
        if (savedIntake.targetAudience !== undefined) setTargetAudience(savedIntake.targetAudience);
        if (savedIntake.businessGoals !== undefined) setBusinessGoals(savedIntake.businessGoals);
        if (savedIntake.marketingObjectives !== undefined) setMarketingObjectives(savedIntake.marketingObjectives);
        if (savedIntake.brandTone !== undefined) setBrandTone(savedIntake.brandTone);
        if (savedIntake.brandVoice !== undefined) setBrandVoice(savedIntake.brandVoice);
        if (savedIntake.competitors !== undefined) setCompetitors(savedIntake.competitors);
        if (savedIntake.keywords !== undefined) setKeywords(savedIntake.keywords);
        if (savedIntake.geographicMarkets !== undefined) setGeographicMarkets(savedIntake.geographicMarkets);
        if (savedIntake.journeyStage !== undefined) setJourneyStage(savedIntake.journeyStage);
        if (Array.isArray(savedIntake.marketingChannels)) setMarketingChannels(savedIntake.marketingChannels);
      } else if (initialCustomerData) {
        const company = initialCustomerData.companyInformation || {};
        const personal = initialCustomerData.personalIdentifiers || {};
        
        setBusinessName(initialCustomerData.companyName || company.companyName || "");
        setWebsiteUrl(company.websiteUrl || "");
        setIndustry(company.industry || "");
        setBusinessModel(initialCustomerData.businessModel || company.businessModel || "b2b");
        
        setTargetAudience(initialCustomerData.targetAudience || initialCustomerData.icpCategory || company.targetAudience || "");
        setBusinessGoals(initialCustomerData.businessGoals || "");
        setMarketingObjectives(initialCustomerData.marketingObjectives || "");
        setBrandTone(initialCustomerData.brandTone || "");
        setBrandVoice(initialCustomerData.brandVoice || "");
        setCompetitors(initialCustomerData.competitors || "");
        setKeywords(initialCustomerData.keywords || "");
        setGeographicMarkets(initialCustomerData.geographicMarkets || company.headquarters?.country || "");
        setJourneyStage(initialCustomerData.customerJourneyStage || "Consideration");
        
        if (Array.isArray(initialCustomerData.marketingChannels)) {
          setMarketingChannels(initialCustomerData.marketingChannels);
        } else {
          setMarketingChannels(company.businessModel === "b2c" 
            ? ["Instagram Ads", "Influencer Marketing"]
            : ["LinkedIn Outreach", "Cold Email", "Content SEO"]
          );
        }

        if (initialCustomerData.campaignStrategy) {
          setCampaignStrategy(initialCustomerData.campaignStrategy);
        }
      }
    }
  }, [initialCustomerData]);

  // Persist intake profile state changes to localStorage
  useEffect(() => {
    if (!hasInitializedRef.current || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify({
        businessName,
        websiteUrl,
        industry,
        businessModel,
        targetAudience,
        businessGoals,
        marketingObjectives,
        brandTone,
        brandVoice,
        competitors,
        keywords,
        geographicMarkets,
        journeyStage,
        marketingChannels
      }));
    } catch (e) {
      // ignore
    }
  }, [
    businessName, websiteUrl, industry, businessModel, targetAudience,
    businessGoals, marketingObjectives, brandTone, brandVoice, competitors,
    keywords, geographicMarkets, journeyStage, marketingChannels
  ]);

  // Handle Profile Update & Save
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    
    const updatedFields = {
      companyName: businessName,
      businessModel: businessModel,
      companyInformation: {
        ...(initialCustomerData?.companyInformation || {}),
        companyName: businessName,
        websiteUrl: websiteUrl,
        industry: industry,
        businessModel: businessModel,
      },
      targetAudience,
      businessGoals,
      marketingObjectives,
      brandTone,
      brandVoice,
      competitors,
      marketingChannels,
      keywords,
      geographicMarkets,
      customerJourneyStage: journeyStage,
      updatedAt: new Date().toISOString()
    };

    const success = await onSaveCustomer(updatedFields);
    setIsSavingProfile(false);
    return success;
  };

  // Full GTM Strategy Generation
  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStage("Research Agent: Crawling domain profiles & indexing competitors...");
    await new Promise(r => setTimeout(r, 600));

    setGenerationProgress(40);
    setGenerationStage("Analysis Agent: Mapping industry pain points to ICP triggers...");
    await new Promise(r => setTimeout(r, 700));

    setGenerationProgress(75);
    setGenerationStage("Synthesis Agent: Building customized channels and actionable workflows...");
    await new Promise(r => setTimeout(r, 600));

    setGenerationProgress(100);
    setGenerationStage("Consensus Strategy Generation Complete.");
    await new Promise(r => setTimeout(r, 300));

    const businessParams = {
      officialBusinessName: businessName,
      companyName: businessName,
      industryVertical: industry,
      industry,
      businessType: businessModel,
      businessModel,
      idealCustomerProfile: targetAudience,
      targetAudience,
      primaryBusinessGoal: businessGoals,
      businessGoals,
      marketingObjectives,
      currentMarketingChannels: marketingChannels,
      primaryKeywords: keywords,
      customerJourneyStage: journeyStage
    };

    const generated = generateCampaignStrategy(businessParams);
    
    // Save generated strategy to database
    const updatedFields = {
      companyName: businessName,
      businessModel: businessModel,
      companyInformation: {
        ...(initialCustomerData?.companyInformation || {}),
        companyName: businessName,
        websiteUrl: websiteUrl,
        industry: industry,
        businessModel: businessModel,
      },
      targetAudience,
      businessGoals,
      marketingObjectives,
      brandTone,
      brandVoice,
      competitors,
      marketingChannels,
      keywords,
      geographicMarkets,
      customerJourneyStage: journeyStage,
      campaignStrategy: generated,
      updatedAt: new Date().toISOString()
    };

    await onSaveCustomer(updatedFields);
    setCampaignStrategy(generated);
    setIsGenerating(false);
    setProfileOpen(false); // collapse profile form on completion
  };

  // Section-specific Regeneration with Feedback
  const handleRegenerateSection = async (sectionKey: string) => {
    if (!campaignStrategy) return;
    setIsRegeneratingSection(sectionKey);
    
    // Simulate generation stages
    await new Promise(r => setTimeout(r, 500));
    
    const businessParams = {
      officialBusinessName: businessName,
      companyName: businessName,
      industryVertical: industry,
      industry,
      businessType: businessModel,
      businessModel,
      idealCustomerProfile: targetAudience,
      primaryBusinessGoal: businessGoals,
      primaryKeywords: keywords,
      customerJourneyStage: journeyStage
    };

    const regenerated = regenerateSection(
      sectionKey,
      campaignStrategy,
      feedbackText || "Make it more professional",
      businessParams
    );

    // Save regenerated strategy to database
    const updatedFields = {
      campaignStrategy: regenerated,
      updatedAt: new Date().toISOString()
    };

    await onSaveCustomer(updatedFields);
    setCampaignStrategy(regenerated);
    
    // Clear feedback states
    setFeedbackText("");
    setActiveFeedbackSection(null);
    setIsRegeneratingSection(null);
  };

  const toggleMarketingChannel = (channel: string) => {
    if (marketingChannels.includes(channel)) {
      setMarketingChannels(marketingChannels.filter(c => c !== channel));
    } else {
      setMarketingChannels([...marketingChannels, channel]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Info Banner */}
      <GlassPanel tilt={false} className="border-slate-850 p-5 bg-gradient-to-r from-slate-900/60 to-violet-950/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-slate-500 font-mono block">Unified Workspace</span>
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            Campaign Strategy & Integrated Workflows
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Generating unified campaigns and nested execution workflows for <span className="font-semibold text-slate-200">{customerName}</span> ({customerId})
          </p>
        </div>
        
        <div className="flex gap-2">
          <ExtrudedButton
            variant="outline"
            size="sm"
            onClick={() => setProfileOpen(!profileOpen)}
            className="rounded-xl border-slate-800 bg-slate-900/40 text-xs font-semibold text-slate-350 hover:text-white"
          >
            {profileOpen ? (
              <>Hide Profile Intake <ChevronUp className="h-4 w-4 ml-1" /></>
            ) : (
              <>View/Edit Business Intake <ChevronDown className="h-4 w-4 ml-1" /></>
            )}
          </ExtrudedButton>
          
          {campaignStrategy && (
            <button
              onClick={handleGenerateStrategy}
              disabled={isGenerating}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/15"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
              <span>Regenerate Strategy</span>
            </button>
          )}
        </div>
      </GlassPanel>

      {/* ── Studio Workspace Sub-Navigation Modes ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <button
          onClick={() => setStudioMode("strategy")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            studioMode === "strategy"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Strategy & AI Generator</span>
        </button>

        <button
          onClick={() => setStudioMode("n8n_dag")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            studioMode === "n8n_dag"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>n8n Workflow DAG Studio</span>
        </button>

        <button
          onClick={() => setStudioMode("tactic_presets")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            studioMode === "tactic_presets"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Marketing Tactics Library</span>
        </button>
      </div>

      {/* AI Model Selection Panel */}
      <GlassPanel tilt={false} overflowVisible={true} className="border-slate-800 p-5 bg-slate-900/30 relative z-30 overflow-visible">
        <ModelSelector

          selectedModelId={selectedModel.id}
          onSelectModel={setSelectedModel}
          userRole={userRole}
          label="AI Model Selection for Strategy & Content Generation"
        />
      </GlassPanel>

      {/* Intake Profile Editor (Collapsible) */}

      {profileOpen && (
        <GlassPanel tilt={false} className="border-slate-800 bg-slate-900/20 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" /> Business Strategy Profile Intake
            </h4>
            <span className="text-[10px] text-slate-500">Auto-saves to database</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
            
            {/* Grid 1: Basic Business Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-name" className="text-slate-400 text-xs">Official Business Name</Label>
                  <span className="text-[10px] font-mono text-slate-500">{businessName.length} / 300</span>
                </div>
                <Input
                  id="biz-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="e.g. Acme SaaS Corp"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-url" className="text-slate-400 text-xs">Primary Website URL</Label>
                  <span className="text-[10px] font-mono text-slate-500">{websiteUrl.length} / 300</span>
                </div>
                <Input
                  id="biz-url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="https://acme.com"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-industry" className="text-slate-400 text-xs">Industry Vertical</Label>
                  <span className="text-[10px] font-mono text-slate-500">{industry.length} / 300</span>
                </div>
                <Input
                  id="biz-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="e.g. Fintech, Healthcare"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs block">Business Type Model</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["b2b", "b2c"] as const).map(model => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setBusinessModel(model)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        businessModel === model
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/5"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {model.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid 2: Core parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-audience" className="text-slate-400 text-xs">Target Audience (ICP)</Label>
                  <span className="text-[10px] font-mono text-slate-500">{targetAudience.length} / 2000</span>
                </div>
                <textarea
                  id="biz-audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Mid-market CTOs and Directors of IT looking to automate pipeline security..."
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-goals" className="text-slate-400 text-xs">Primary Business Goals</Label>
                  <span className="text-[10px] font-mono text-slate-500">{businessGoals.length} / 2000</span>
                </div>
                <textarea
                  id="biz-goals"
                  value={businessGoals}
                  onChange={(e) => setBusinessGoals(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Increase qualified pipeline by 30% in Q3, reduce sales administrative overhead..."
                />
              </div>
            </div>

            {/* Grid 3: Advanced Marketing Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-objectives" className="text-slate-400 text-xs">Marketing Objectives</Label>
                  <span className="text-[10px] font-mono text-slate-500">{marketingObjectives.length} / 500</span>
                </div>
                <Input
                  id="biz-objectives"
                  value={marketingObjectives}
                  onChange={(e) => setMarketingObjectives(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="e.g. 50 new MQLs monthly"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-competitors" className="text-slate-400 text-xs">Competitors</Label>
                  <span className="text-[10px] font-mono text-slate-500">{competitors.length} / 500</span>
                </div>
                <Input
                  id="biz-competitors"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="Competitor A, Competitor B"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-keywords" className="text-slate-400 text-xs">Keywords</Label>
                  <span className="text-[10px] font-mono text-slate-500">{keywords.length} / 500</span>
                </div>
                <Input
                  id="biz-keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="CRM integration, revops tool"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-tone" className="text-slate-400 text-xs">Brand Tone</Label>
                  <span className="text-[10px] font-mono text-slate-500">{brandTone.length} / 300</span>
                </div>
                <Input
                  id="biz-tone"
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="Authoritative, informative"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="biz-markets" className="text-slate-400 text-xs">Geographic Markets</Label>
                  <span className="text-[10px] font-mono text-slate-500">{geographicMarkets.length} / 300</span>
                </div>
                <Input
                  id="biz-markets"
                  value={geographicMarkets}
                  onChange={(e) => setGeographicMarkets(e.target.value)}
                  className="bg-slate-950 border-slate-850 rounded-xl text-xs"
                  placeholder="North America, Western Europe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-stage" className="text-slate-400 text-xs">Customer Journey Stage</Label>
                <select
                  id="biz-stage"
                  value={journeyStage}
                  onChange={(e) => setJourneyStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Awareness">Awareness</option>
                  <option value="Consideration">Consideration</option>
                  <option value="Decision">Decision</option>
                  <option value="Onboarding">Onboarding</option>
                </select>
              </div>
            </div>

            {/* Channels Select */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Marketing Channels to Prioritize</Label>
              <div className="flex gap-2 flex-wrap">
                {["LinkedIn Outreach", "Cold Email", "Content SEO", "Google Search Ads", "Instagram Ads", "Influencer Marketing", "Referral Campaigns", "YouTube Content"].map(channel => {
                  const isSelected = marketingChannels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleMarketingChannel(channel)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected 
                          ? "bg-violet-500/10 border-violet-500/35 text-violet-300"
                          : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <ExtrudedButton
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 text-xs px-4"
              >
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Save Profile Draft"}
              </ExtrudedButton>
              
              <ExtrudedButton
                type="button"
                onClick={handleGenerateStrategy}
                disabled={isGenerating || !businessName}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs px-5 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Save & Generate Campaign</>
                )}
              </ExtrudedButton>
            </div>
          </form>
        </GlassPanel>
      )}

      {/* Strategy Generating Progress Bar */}
      {isGenerating && (
        <GlassPanel tilt={false} className="border-slate-800 p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
          <h4 className="font-extrabold text-white text-sm">Orchestrating Multi-Agent Campaign Consensus...</h4>
          <div className="max-w-md mx-auto h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">{generationStage}</p>
        </GlassPanel>
      )}

      {/* ── Sub-Mode Views (n8n DAG Workflow & Tactics Presets) ── */}
      {studioMode === "n8n_dag" && (
        <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/30">
          <WorkflowNodeCanvas />
        </GlassPanel>
      )}

      {studioMode === "tactic_presets" && (
        <GlassPanel tilt={false} className="border-slate-800 p-6 bg-slate-900/30">
          <TacticPresetSelector />
        </GlassPanel>
      )}

      {/* Main Campaign Strategy Views */}
      {studioMode === "strategy" && !campaignStrategy && !isGenerating && (
        <GlassPanel tilt={false} className="border-dashed border-slate-800 p-16 text-center bg-slate-900/5">
          <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-white">No Strategy Generated Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Provide the customer&apos;s business parameters in the profile configuration panel and run the generator to create strategies, tactics, content, and workflows together.
          </p>
          <ExtrudedButton
            onClick={() => setProfileOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl mt-4 py-2 px-4 inline-flex items-center gap-1.5"
          >
            Configure Strategy Profile
          </ExtrudedButton>
        </GlassPanel>
      )}

      {studioMode === "strategy" && campaignStrategy && !isGenerating && (
        <div className="space-y-8">
          
          {/* I. STRATEGIC FOUNDATION */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-violet-500 rounded-full"></span> I. Strategic Foundation
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Business Summary */}
              <GlassPanel tilt={false} className="border-slate-850 border-l-2 border-l-violet-500/60 p-5 bg-slate-900/10 space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <h5 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Business Summary</h5>
                  <button 
                    onClick={() => setActiveFeedbackSection(activeFeedbackSection === "businessSummary" ? null : "businessSummary")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Refine with Feedback
                  </button>
                </div>
                {isRegeneratingSection === "businessSummary" ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono uppercase">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{campaignStrategy.businessSummary}</p>
                )}

                {/* Inline Feedback Popover */}
                {activeFeedbackSection === "businessSummary" && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                    <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Make it more professional, Focus on B2B..."
                        className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                      />
                      <button 
                        onClick={() => handleRegenerateSection("businessSummary")}
                        className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </GlassPanel>

              {/* Marketing Strategy */}
              <GlassPanel tilt={false} className="border-slate-850 border-l-2 border-l-indigo-500/60 p-5 bg-slate-900/10 space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <h5 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Core Marketing Strategy</h5>
                  <button 
                    onClick={() => setActiveFeedbackSection(activeFeedbackSection === "marketingStrategy" ? null : "marketingStrategy")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Refine with Feedback
                  </button>
                </div>
                {isRegeneratingSection === "marketingStrategy" ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono uppercase">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{campaignStrategy.marketingStrategy}</p>
                )}

                {activeFeedbackSection === "marketingStrategy" && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                    <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Make it shorter, Improve CTA..."
                        className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                      />
                      <button 
                        onClick={() => handleRegenerateSection("marketingStrategy")}
                        className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </GlassPanel>

              {/* Target Audience Insights */}
              <GlassPanel tilt={false} className="border-slate-850 border-l-2 border-l-purple-500/60 p-5 bg-slate-900/10 space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <h5 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Target Audience Insights</h5>
                  <button 
                    onClick={() => setActiveFeedbackSection(activeFeedbackSection === "targetAudienceInsights" ? null : "targetAudienceInsights")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Refine with Feedback
                  </button>
                </div>
                {isRegeneratingSection === "targetAudienceInsights" ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono uppercase">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{campaignStrategy.targetAudienceInsights}</p>
                )}

                {activeFeedbackSection === "targetAudienceInsights" && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                    <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Focus on enterprise, Focus on startups..."
                        className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                      />
                      <button 
                        onClick={() => handleRegenerateSection("targetAudienceInsights")}
                        className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </GlassPanel>

              {/* Customer Journey & Channels */}
              <GlassPanel tilt={false} className="border-slate-850 border-l-2 border-l-pink-500/60 p-5 bg-slate-900/10 space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <h5 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Customer Journey Mapping</h5>
                  <button 
                    onClick={() => setActiveFeedbackSection(activeFeedbackSection === "customerJourney" ? null : "customerJourney")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Refine with Feedback
                  </button>
                </div>
                {isRegeneratingSection === "customerJourney" ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono uppercase">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 space-y-2 font-light whitespace-pre-line">
                    {campaignStrategy.customerJourney}
                  </div>
                )}

                {activeFeedbackSection === "customerJourney" && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                    <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Simplify journey, Make it shorter..."
                        className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                      />
                      <button 
                        onClick={() => handleRegenerateSection("customerJourney")}
                        className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </GlassPanel>

            </div>

            {/* Priority Recommendations Banner */}
            <GlassPanel tilt={false} className="border-slate-850 border-l-2 border-l-violet-400 p-5 bg-violet-900/5 space-y-3 relative group">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Immediate Priority Recommendations
                </h5>
                <button 
                  onClick={() => setActiveFeedbackSection(activeFeedbackSection === "priorityRecommendations" ? null : "priorityRecommendations")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                >
                  <RotateCw className="h-3 w-3" /> Refine list
                </button>
              </div>

              {isRegeneratingSection === "priorityRecommendations" ? (
                <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono uppercase">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaignStrategy.priorityRecommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-350 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/60 leading-normal">
                      <CornerDownRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}

              {activeFeedbackSection === "priorityRecommendations" && (
                <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                  <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. Add stronger CTAs, Make it shorter..."
                      className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                    />
                    <button 
                      onClick={() => handleRegenerateSection("priorityRecommendations")}
                      className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </GlassPanel>

          </div>

          {/* II. TARGET CHANNELS & TACTICS */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-amber-500 rounded-full"></span> II. Marketing Tactics
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaignStrategy.tactics.map((tactic, idx) => (
                <GlassPanel key={idx} tilt={true} className="border-slate-850 border-l-2 border-l-amber-500/50 hover:border-l-amber-400 p-5 bg-slate-900/10 space-y-3 flex flex-col justify-between group relative transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-bold text-amber-400 font-mono">{tactic.priority}</span>
                        <h5 className="font-extrabold text-white text-sm">{tactic.name}</h5>
                      </div>
                      
                      <button 
                        onClick={() => setActiveFeedbackSection(activeFeedbackSection === `tactic-${idx}` ? null : `tactic-${idx}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                      >
                        <RotateCw className="h-3 w-3" /> Refine
                      </button>
                    </div>

                    {isRegeneratingSection === `tactic-${idx}` ? (
                      <div className="flex items-center gap-2 py-8 justify-center text-xs text-slate-500 font-mono uppercase">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-400 font-light leading-normal">{tactic.description}</p>
                        
                        <div className="pt-2 text-xs space-y-1">
                          <p className="text-slate-350"><span className="text-slate-500 font-bold font-mono text-[10px] uppercase">Why Recommended:</span> {tactic.whyRecommended}</p>
                          <p className="text-slate-350"><span className="text-slate-500 font-bold font-mono text-[10px] uppercase">Expected Impact:</span> <span className="text-green-400 font-bold">{tactic.impact}</span></p>
                          <p className="text-slate-350"><span className="text-slate-500 font-bold font-mono text-[10px] uppercase">KPIs:</span> <span className="font-mono text-cyan-400">{tactic.kpi}</span></p>
                        </div>
                      </>
                    )}
                  </div>

                  {activeFeedbackSection === `tactic-${idx}` && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                      <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="e.g. Focus on B2B, Make it shorter..."
                          className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                        />
                        <button 
                          onClick={() => handleRegenerateSection(`tactic-${idx}`)}
                          className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              ))}
            </div>
          </div>

          {/* III. PERSONALIZED CONTENT IDEAS */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-purple-500 rounded-full"></span> III. Content Ideas Hub
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Loop over different categories */}
              {Object.keys(campaignStrategy.contentIdeas).map((categoryKey) => {
                const ideas = campaignStrategy.contentIdeas[categoryKey as keyof typeof campaignStrategy.contentIdeas];
                const displayName = categoryKey.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
                
                return (
                  <GlassPanel key={categoryKey} tilt={false} className="border-slate-850 border-l-2 border-l-purple-500/50 hover:border-l-purple-400 p-5 bg-slate-900/10 space-y-3 relative group transition-all duration-300">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h5 className="text-xs font-bold text-slate-350 uppercase tracking-wider">{displayName}</h5>
                      <button 
                        onClick={() => setActiveFeedbackSection(activeFeedbackSection === `content-${categoryKey}` ? null : `content-${categoryKey}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                      >
                        <RotateCw className="h-3 w-3" /> Refine
                      </button>
                    </div>

                    {isRegeneratingSection === `content-${categoryKey}` ? (
                      <div className="flex items-center gap-2 py-8 justify-center text-xs text-slate-500 font-mono uppercase">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> Applying feedback...
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {ideas.map((idea, i) => (
                          <li key={i} className="text-xs text-slate-300 bg-slate-950/30 border border-slate-900 rounded-lg p-2 leading-relaxed">
                            {idea}
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeFeedbackSection === `content-${categoryKey}` && (
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                        <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                        <div className="flex gap-2">
                          <Input
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="e.g. Add stronger CTAs, Target enterprise..."
                            className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                          />
                          <button 
                            onClick={() => handleRegenerateSection(`content-${categoryKey}`)}
                            className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </GlassPanel>
                );
              })}

            </div>
          </div>

          {/* IV. ACTIONABLE WORKFLOWS (INTEGRATED) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-indigo-500 rounded-full"></span> IV. Integrated Actionable Workflows
            </h4>
            
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-light">
              We have automatically mapped out step-by-step execution workflows based on your active campaign strategies. Each pipeline is context-aware and synchronized with your business outcomes.
            </p>

            <div className="space-y-8 pt-2">
              
              {/* Loop over workflows */}
              {Object.keys(campaignStrategy.workflows).map((wfKey) => {
                const workflow = campaignStrategy.workflows[wfKey as keyof typeof campaignStrategy.workflows];
                const displayName = wfKey === "seoWorkflow" ? "SEO & Authority Strategy Workflow" :
                                    wfKey === "linkedinWorkflow" ? "LinkedIn Outbound Campaign Workflow" :
                                    wfKey === "emailWorkflow" ? "Email Segment Nurture Workflow" :
                                    "Paid Search & Retargeting Workflow";
                
                return (
                  <GlassPanel key={wfKey} tilt={false} className="border-slate-850 border-t-2 border-t-indigo-500/80 bg-slate-900/10 p-6 space-y-6 relative group">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-900 pb-4">
                      <div>
                        <h5 className="font-extrabold text-white text-base flex items-center gap-2">
                          <Zap className="h-5 w-5 text-indigo-400" />
                          {displayName}
                        </h5>
                        <p className="text-xs text-slate-400 mt-1"><strong className="text-slate-500 font-mono text-[10px] uppercase">Objective:</strong> {workflow.objective}</p>
                        <p className="text-xs text-slate-400 mt-0.5"><strong className="text-slate-500 font-mono text-[10px] uppercase">Trigger:</strong> {workflow.trigger}</p>
                      </div>
                      
                      <div className="text-right">
                        <button 
                          onClick={() => setActiveFeedbackSection(activeFeedbackSection === `workflow-${wfKey.split("W")[0]}` ? null : `workflow-${wfKey.split("W")[0]}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                        >
                          <RotateCw className="h-3 w-3" /> Refine Workflow
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">Status: Active Autopilot</span>
                      </div>
                    </div>

                    {isRegeneratingSection === `workflow-${wfKey.split("W")[0]}` ? (
                      <div className="flex items-center gap-2 py-12 justify-center text-xs text-slate-500 font-mono uppercase">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> Optimizing workflow parameters...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Execution Timeline (Left 1/3) */}
                        <div className="space-y-4 lg:border-r lg:border-slate-900 lg:pr-6">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Execution Plan</span>
                          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-850">
                            {workflow.executionPlan.map((step, idx) => (
                              <div key={idx} className="relative text-xs">
                                <div className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border border-indigo-500 bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-[9px]">
                                  {idx + 1}
                                </div>
                                <p className="font-bold text-slate-200">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Task Division (Middle 1/3) */}
                        <div className="space-y-4 lg:border-r lg:border-slate-900 lg:px-6">
                          <div className="space-y-3">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">AI-Generated Agent Tasks</span>
                            <ul className="space-y-2">
                              {workflow.aiTasks.map((task, idx) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-350 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3 pt-2">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Manual Review Tasks</span>
                            <ul className="space-y-2">
                              {workflow.manualTasks.map((task, idx) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-350 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                                  <CornerDownRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Metrics & Deliverables (Right 1/3) */}
                        <div className="space-y-4 lg:pl-6 flex flex-col justify-between">
                          <div className="space-y-3">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">Campaign Deliverables</span>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                              {workflow.deliverables.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3 pt-4 border-t border-slate-900 mt-4">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">Work Target Metrics</span>
                            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-xs space-y-1">
                              <p className="text-slate-350"><span className="text-slate-500 font-bold uppercase text-[9px] font-mono">KPI:</span> <span className="text-cyan-400 font-mono">{workflow.kpi}</span></p>
                              <p className="text-slate-350"><span className="text-slate-500 font-bold uppercase text-[9px] font-mono">Target:</span> <span className="text-green-400 font-bold">{workflow.successMetrics}</span></p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {activeFeedbackSection === `workflow-${wfKey.split("W")[0]}` && (
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 border border-slate-800 p-3 rounded-b-2xl space-y-2 z-10">
                        <Label className="text-[10px] text-slate-400 block">AI Refinement Instructions:</Label>
                        <div className="flex gap-2">
                          <Input
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="e.g. Make it shorter, Focus on conversions..."
                            className="bg-slate-900 border-slate-800 text-xs py-1.5 h-8"
                          />
                          <button 
                            onClick={() => handleRegenerateSection(`workflow-${wfKey.split("W")[0]}`)}
                            className="bg-violet-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                  </GlassPanel>
                );
              })}

            </div>
          </div>
        </div>
      )}

      {/* V. DYNAMIC CAMPAIGN CONTENT GENERATOR & SUB-LIST WORKFLOWS */}
      <div className="pt-6 border-t border-slate-850">
        <CampaignContentGenerator
          customerData={initialCustomerData}
          customerName={customerName}
          onSaveContent={async (contentData) => {
            const updatedFields = {
              lastGeneratedCampaignContent: contentData,
              updatedAt: new Date().toISOString()
            };
            return await onSaveCustomer(updatedFields);
          }}
        />
      </div>

    </div>
  );
}
