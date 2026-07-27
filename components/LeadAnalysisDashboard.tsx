"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadLeadContext, saveLeadContext, StoredLeadContext } from "@/lib/lead-context";
import { BookingWidget } from "@/components/BookingWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Download, WifiOff, Loader2, CheckCircle2, FileText, Users, TrendingUp, Target, 
  Shield, Check, ChevronRight, PieChart, X, ZoomIn, ZoomOut, ChevronLeft, 
  AlertCircle, ExternalLink 
} from "lucide-react";
import {
  IconAlertObjection,
  IconCheckCircle,
  IconRefreshPipeline,
  IconArrowLeft,
  IconArrowRight,
} from "@/components/gtm/GtmIcons";
import { type AnalysisResult, getRevenueAgentCatalog } from "@/lib/types";
import { getLeadOffline, saveLeadOffline } from "@/lib/offlineStore";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Mock data generator for offline mode
function generateMockCompleteGTM(companyName: string, formData?: any): AnalysisResult {
  // Extract all relevant fields from form data
  const targetIndustries = formData?.targetIndustries ? formData.targetIndustries.join(", ") : "SalesTech/MarTech";
  const targetGeographies = formData?.targetGeographics ? formData.targetGeographics.join(", ") : "United States (West/Northeast)";
  const targetCompanySizes = formData?.targetCompanySizes ? formData.targetCompanySizes.join(", ") : "25-100 employees";
  const icpDescription = formData?.icpDescription || "B2B SaaS companies with existing outbound sales motion";
  const companyDescription = formData?.companyDescription || `${companyName} is a B2B SaaS company.`;
  const keyChallenges = formData?.keyChallenges || "Manual lead qualification, pipeline visibility issues, long sales cycles.";
  const primaryOutcome = formData?.primaryOutcome || "Accelerate pipeline and increase close rates";
  const commonObjections = formData?.commonObjections || "No budget, too risky, not a priority right now";
  
  return {
    executiveSummary: `${companyName} has strong growth potential as a ${targetIndustries} company. ${companyDescription} This analysis identifies key segments, channels, and messaging strategies to achieve ${primaryOutcome}. Key challenges include ${keyChallenges} - we'll address these with targeted outreach, content, and sales process optimization.`,
    icpDefinition: {
      inclusionCriteria: [
        `${icpDescription}`,
        `Industry: ${targetIndustries}`,
        `Company size: ${targetCompanySizes}`,
        `Geography: ${targetGeographies}`,
        "Uses Salesforce or HubSpot CRM (or similar)",
        "Has existing outbound or inbound motion"
      ],
      exclusionCriteria: [
        "B2C companies",
        "Early-stage pre-revenue startups",
        "Enterprise companies >1000 employees requiring custom onboarding",
        "Already running a mature, analytics-driven solution in this category",
        "Single small operation with negligible spend or scale",
        "No operational authority to make or influence purchasing decisions"
      ]
    },
    table1FirmographicDemographic: [
      { 
        priorityTier: "Tier 1", 
        industryVertical: targetIndustries, 
        companySize: targetCompanySizes, 
        arrRange: "$2M-$20M", 
        location: targetGeographies, 
        keyDecisionMakerDemographics: formData?.targetSeniorities ? formData.targetSeniorities.join(", ") : "VP Sales, CRO, 35-50yo, data-driven", 
        notes: "Highest conversion, fastest sales cycles", 
        primaryCostDriver: "Tooling", 
        currentSolutionStatus: "Basic", 
        numberOfSitesTeamsLocations: "2-5", 
        sustainabilityEsgComplianceCommitment: "Yes" 
      },
      { 
        priorityTier: "Tier 2", 
        industryVertical: targetIndustries, 
        companySize: targetCompanySizes, 
        arrRange: "$5M-$50M", 
        location: targetGeographies, 
        keyDecisionMakerDemographics: formData?.targetSeniorities ? formData.targetSeniorities.join(", ") : "CRO/Director of Sales", 
        notes: "High ACV, higher retention", 
        primaryCostDriver: "Headcount", 
        currentSolutionStatus: "None", 
        numberOfSitesTeamsLocations: "5-10", 
        sustainabilityEsgComplianceCommitment: "In Progress" 
      }
    ],
    behavioralPsychographicTraits: {
      observableBehavioralPatterns: ["Downloads sales automation content", "Attends GTM webinars", "Active on LinkedIn Sales", "Uses multiple SaaS tools"],
      corePsychographicAttributes: ["Data-driven decision making", "Risk-tolerant for ROI-positive tools", "Innovation-focused"]
    },
    table2PainPointAnalysis: [
      { painPoint: "Manual lead qualification takes too long", severity: "Critical", businessImpact: "30% wasted sales time, $40k/year cost per rep", rootCause: "No AI-assisted scoring", dealFlowAISolution: "AI Lead Analysis + ICP Matching", frequencyOfPain: "Daily", howPainIsCurrentlyDiscovered: "Manual audit", competitorCurrentSolutionInUse: "None" },
      { painPoint: "No visibility into meeting quality", severity: "High", businessImpact: "10% lower close rate", rootCause: "No systematic call analysis", dealFlowAISolution: "Meeting Summaries + Sentiment Analysis", frequencyOfPain: "Weekly", howPainIsCurrentlyDiscovered: "Complaint", competitorCurrentSolutionInUse: "Gong (basic)" }
    ],
    table3DecisionMakerInfluence: [
      { role: "VP Sales / CRO", influenceScore: "10", coreDecisionRole: "Economic Buyer", top3Priorities: "Hit quota, increase pipeline, prove ROI", dealFlowAIMessagingFocus: "ROI case studies, enterprise pricing", preferredContactChannel: "LinkedIn", primaryObjectionType: "No budget", contentFormatPreference: "ROI calc" },
      { role: "Sales Ops Manager", influenceScore: "8", coreDecisionRole: "Gatekeeper + Champion", top3Priorities: "Process efficiency, adoption metrics", dealFlowAIMessagingFocus: "Implementation guides, integration docs", preferredContactChannel: "Email", primaryObjectionType: "Too risky / need a pilot first", contentFormatPreference: "Demo" },
      { role: "Operations Lead", influenceScore: "7", coreDecisionRole: "Champion", top3Priorities: "Process gaps, implementation risk", dealFlowAIMessagingFocus: "Implementation ease, process automation", preferredContactChannel: "Email", primaryObjectionType: "Already have an existing solution", contentFormatPreference: "Case study" },
      { role: "Technical Lead", influenceScore: "6", coreDecisionRole: "Champion", top3Priorities: "Integrations, system performance", dealFlowAIMessagingFocus: "API docs, integration guides", preferredContactChannel: "Phone", primaryObjectionType: "Need board or leadership approval", contentFormatPreference: "1-pager" }
    ],
    purchasingJourneyMapping: [
      { stage: "Awareness", duration: "Week 1-2", customerActions: "Reads content, attends webinars", customerNeedsQuestions: "What problems can AI solve?", channelPreferences: "LinkedIn, Google Search", dealFlowAIAssetsEngagement: "SEO content, thought leadership" },
      { stage: "Consideration", duration: "Week 2-4", customerActions: "Downloads assets, requests demo", customerNeedsQuestions: "Does this integrate with my stack?", channelPreferences: "Website, G2/Capterra", dealFlowAIAssetsEngagement: "Personalized demo, case studies" },
      { stage: "Decision", duration: "Week 4-6", customerActions: "Vendor comparison, internal approval, pilot scoping", customerNeedsQuestions: "What's the ROI and implementation timeline?", channelPreferences: "1:1 calls, proposal reviews", dealFlowAIAssetsEngagement: "Custom proposals, ROI calculators" },
      { stage: "Closed-Won", duration: "Week 6-8", customerActions: "Onboarding trigger, handoff SOP, success criteria set", customerNeedsQuestions: "How do we get up and running quickly?", channelPreferences: "CS onboarding calls", dealFlowAIAssetsEngagement: "Onboarding playbooks, success plan" },
      { stage: "Retention", duration: "Month 2-6", customerActions: "QBR cadence, expansion signals, upsell trigger", customerNeedsQuestions: "How can we get more value?", channelPreferences: "CS check-ins", dealFlowAIAssetsEngagement: "QBR templates, upsell playbooks" },
      { stage: "Expansion", duration: "Ongoing", customerActions: "Second-site or second-team rollout, land-and-expand path", customerNeedsQuestions: "How do we scale this across teams?", channelPreferences: "Account management", dealFlowAIAssetsEngagement: "Expansion playbooks, multi-team pricing" }
    ],
    table4LeadScoringFramework: {
      criteria: [
        { category: "Firmographics", criterion: "B2B SaaS Industry", points: "15" },
        { category: "Firmographics", criterion: "Uses Salesforce/HubSpot", points: "10" },
        { category: "Trigger Events", criterion: "Trigger event detected (expo, expansion, tariff hike)", points: "8" },
        { category: "Behavioral", criterion: "LinkedIn activity (engaged with industry-relevant content)", points: "5" },
        { category: "Firmographics", criterion: "Multi-site operations confirmed", points: "5" },
        { category: "Firmographics", criterion: "No existing solution or analytics layer confirmed", points: "5" },
        { category: "Decision Making", criterion: "Budget authority confirmed", points: "7" }
      ],
      qualificationThresholds: { mql: "40 points", sql: "70 points", sal: "80+ points" }
    },
    table5ChannelEffectiveness: [
      { channel: "LinkedIn Outbound", icpSegmentsBestFor: "All Tiers", monthlyLeadVolume: "120", conversionRate: "8.5%", costPerAcquisition: "$1,200", ltvToCacRatio: "12:1", budgetAllocation: "35%", optimizationRecommendations: "Focus on VP Sales roles" },
      { channel: "Paid Search", icpSegmentsBestFor: "Tiers 1-3", monthlyLeadVolume: "80", conversionRate: "5.2%", costPerAcquisition: "$1,800", ltvToCacRatio: "8:1", budgetAllocation: "25%", optimizationRecommendations: "High-intent keywords only" },
      { channel: "Cold Email Outbound", icpSegmentsBestFor: "Tiers 1-2", monthlyLeadVolume: "150", conversionRate: "6.0%", costPerAcquisition: "$900", ltvToCacRatio: "15:1", budgetAllocation: "20%", optimizationRecommendations: "Personalize to pain points" },
      { channel: "Industry Events / Expos", icpSegmentsBestFor: "Tier 1", monthlyLeadVolume: "30", conversionRate: "12.0%", costPerAcquisition: "$2,500", ltvToCacRatio: "10:1", budgetAllocation: "10%", optimizationRecommendations: "Sponsor speaking slots" },
      { channel: "Content / SEO", icpSegmentsBestFor: "All Tiers", monthlyLeadVolume: "60", conversionRate: "4.5%", costPerAcquisition: "$600", ltvToCacRatio: "20:1", budgetAllocation: "10%", optimizationRecommendations: "Focus on problem-focused content" }
    ],
    crossTeamAlignmentGuidelines: {
      raciFramework: [],
      communicationCadenceSlas: [],
      sharedSLAs: [
        { sla: "MQL to SDR assignment: <24h", owner: "SDR Manager", escalationPath: "Head of Sales" },
        { sla: "Hot lead follow-up: <15m", owner: "SDR on duty", escalationPath: "Sales Ops Lead" }
      ],
      weeklyReviewMeeting: { cadence: "Every Monday at 10am ET", owner: "Head of Sales Ops" },
      hotLeadCriteria: "ICP match + budget confirmed + trigger event"
    },
    icpValidationChecklist: {
      preQualificationChecklist: ["B2B SaaS?", "10-250 employees?", "CRM in use?"],
      quarterlyValidationReview: ["Review ICP performance", "Collect team feedback", "Check market shifts"],
      dataSourcesForValidation: ["CRM data", "Product analytics", "Win/loss interviews"],
      icpUpdateTriggers: ["Close rate drops", "Market shifts", "Product launches"],
      quarterlyReviewOwner: "Head of GTM",
      scoringThresholdForRevision: "Close rate <15%",
      reviewChecklist: ["Win/loss ratio", "Close rate by tier", "Churn signals"]
    },
    sectionACompetitiveLandscape: [
      { competitorName: "Apollo.io", coreOffering: "Sales intelligence platform", keyWeakness: "Limited AI analysis capabilities", companyDifferentiator: "Full GTM AI playbooks with lead scoring and meeting analysis", positioningStatement: `${companyName} doesn't just find leads; it turns them into closed deals with AI-powered GTM strategy.` },
      { competitorName: "Gong", coreOffering: "Conversation intelligence", keyWeakness: "No proactive lead scoring or ICP matching", companyDifferentiator: "End-to-end GTM platform from lead gen to close", positioningStatement: `While Gong analyzes calls, ${companyName} orchestrates your entire GTM motion.` }
    ],
    sectionBMessagingAndPositioning: [
      { painPoint: "Manual lead qualification takes too long", valuePillar: "Efficiency", hookLine: "Stop wasting 30% of your sales team's time on bad leads.", supportingProofPoint: "Customers reduce lead qualification time by 70% in 30 days.", cta: "Start your free audit", personaMessaging: [
        { persona: "VP Sales", messaging: "Hit your quota faster by focusing only on high-conversion leads." },
        { persona: "Sales Ops Manager", messaging: "Automate your lead routing and scoring to reduce manual work." }
      ] }
    ],
    sectionCObjectionHandlingMatrix: [
      { objection: "No budget", personaMostLikelyToRaiseIt: "VP Sales / CRO", responseFramework: "Highlight ROI and cost savings from efficiency gains.", supportingAsset: "ROI Calculator" },
      { objection: "Already have an existing solution", personaMostLikelyToRaiseIt: "Operations Lead", responseFramework: "Show how we complement and enhance their current stack.", supportingAsset: "Integration Guide" },
      { objection: "Not a priority right now", personaMostLikelyToRaiseIt: "VP Sales / CRO", responseFramework: "Highlight pain points and cost of inaction.", supportingAsset: "Pain Point Deck" },
      { objection: "Too risky / need a pilot first", personaMostLikelyToRaiseIt: "Sales Ops Manager / Technical Lead", responseFramework: "Offer a low-risk pilot with clear success metrics.", supportingAsset: "Pilot Agreement Template" },
      { objection: "Need board or leadership approval", personaMostLikelyToRaiseIt: "All", responseFramework: "Provide a clear business case with ROI projections.", supportingAsset: "Board Deck Template" }
    ],
    sectionDTamSamSom: {
      tam: "20,000 B2B SaaS companies in target markets",
      sam: "4,000 companies actively experiencing primary pain points",
      som: "200 companies (5% of SAM) in first 12 months"
    },
    sectionEPartnerAndChannelStrategy: {
      referralPartners: ["Sales consultants", "CRM implementation firms", "GTM agencies"],
      partnerIncentiveModel: "10% referral commission for closed deals",
      coMarketingOpportunities: ["Industry expos", "GTM summits", "Trade publications"]
    },
    sectionFRiskRegister: [
      { risk: "Competitive displacement", likelihood: "Medium", impact: "High", mitigation: "Focus on customer success and land-and-expand strategies." },
      { risk: "Low outreach reply rates", likelihood: "High", impact: "Medium", mitigation: "A/B test messaging and continuously optimize." },
      { risk: "Proof / case study gap", likelihood: "Medium", impact: "Medium", mitigation: "Offer free pilots in exchange for case studies." },
      { risk: "Long or stalled sales cycles", likelihood: "Medium", impact: "High", mitigation: "Implement clear milestones and checkpoints." },
      { risk: "Key person dependency", likelihood: "Low", impact: "High", mitigation: "Document processes and train the team." }
    ],
    campaignSuccessMetrics: {
      pipelineGeneratedTargetByTier: [
        { tier: "Tier 1", target: "$2M" },
        { tier: "Tier 2", target: "$1M" },
        { tier: "Tier 3", target: "$500k" }
      ],
      mqlToSqlConversionRateTarget: "25%",
      cacTargetByChannel: [
        { channel: "LinkedIn Outbound", target: "$1,200" },
        { channel: "Paid Search", target: "$1,800" },
        { channel: "Cold Email Outbound", target: "$900" }
      ],
      dealVelocityBenchmarkByTier: [
        { tier: "Tier 1", days: "45" },
        { tier: "Tier 2", days: "60" },
        { tier: "Tier 3", days: "90" }
      ]
    }
  };
}

export function LeadAnalysisDashboard({ leadId }: { leadId?: string }) {
  const [context, setContext] = useState<StoredLeadContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showICPDocument, setShowICPDocument] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Download states
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Document viewer states
  const [showViewer, setShowViewer] = useState(false);
  const [zoom, setZoom] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Regenerate and feedback states
  const [regenerating, setRegenerating] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const userFeedbackRef = useRef("");
  userFeedbackRef.current = userFeedback;

  // Ref to prevent multiple runs
  const lastProcessedLeadIdRef = useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function runAnalysis(forceRegenerate = false) {
      // Skip if we've already processed this leadId and not forcing regenerate
      if (!forceRegenerate && lastProcessedLeadIdRef.current === leadId) {
        return;
      }

      lastProcessedLeadIdRef.current = leadId || null;
      
      if (forceRegenerate) {
        setRegenerating(true);
        setLoading(true);
        setError(null);
      }
      
      let stored = null;
      try {
        stored = loadLeadContext();
        setContext(stored);

        let companyData = stored?.form;
        let cachedLead = null;

        if (leadId && !forceRegenerate) {
          cachedLead = await getLeadOffline(leadId);
          if (cachedLead?.readout) {
            setAnalysis(cachedLead.readout);
            setIsOfflineData(!cachedLead.synced);
            setLoading(false);
            return;
          }
        }

        if (!companyData && !leadId) {
          setError("No lead data found.");
          setLoading(false);
          return;
        }

        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
        if (!isOnline) throw new Error("offline");

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            companyData,
            regenerate: forceRegenerate,
            feedback: forceRegenerate ? (stored?.feedback || userFeedbackRef.current) : undefined
          })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Analysis failed");
        
        setAnalysis(data);
        if (leadId) await saveLeadOffline(leadId, companyData as any, data, true);
      } catch (err) {
        console.warn("Using mock offline data", err);
        let fallbackData = loadLeadContext()?.form;
        if (leadId) {
          const cached = await getLeadOffline(leadId);
          if (cached?.data) fallbackData = cached.data as any;
        }
        
        if (fallbackData) {
          const mockData = generateMockCompleteGTM(fallbackData.companyName || "Company", fallbackData);
          setAnalysis(mockData);
          setIsOfflineData(true);
          if (leadId) await saveLeadOffline(leadId, fallbackData as any, mockData, false);
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        setLoading(false);
        setRegenerating(false);
      }
    }

    runAnalysis();

    // Attach regenerate to window for easy access
    (window as any).regenerateAnalysis = () => runAnalysis(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Enhanced download with multiple options
  const handleDownloadMarkdown = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDownloadProgress(i);
      }

      // Generate the document
      const docContent = generateFullMarkdownReport(analysis, context);
      const blob = new Blob([docContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis?.companyName || "company"}-gtm-analysis.md`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Download failed. Please try again.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${analysis?.companyName || "Company"} - GTM Analysis</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; color: #0f172a; line-height: 1.6; }
            h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
            h2 { margin-top: 32px; margin-bottom: 16px; color: #1e293b; }
            h3 { margin-top: 24px; margin-bottom: 12px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; }
            .journey-stage { margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
          </style>
        </head>
        <body>
          ${renderMarkdownToHtml(analysis, context)}
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.companyName || "company"}-gtm-analysis.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${analysis?.companyName || "Company"} - GTM Analysis</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 20px; color: #0f172a; }
              h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
              th { background: #f8fafc; }
              @media print { body { max-width: 100%; } }
            </style>
          </head>
          <body>
            ${renderMarkdownToHtml(analysis, context)}
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4" role="status" aria-live="polite">
        <IconRefreshPipeline className="h-10 w-10 animate-spin text-teal-400" aria-hidden="true" />
        <p className="text-lg font-medium text-slate-300">Generating Complete GTM AI Analysis...</p>
        <p className="text-sm text-slate-500">Scraping website and building your 11-section playbook</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-4" role="alert" aria-live="assertive">
        <IconAlertObjection className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-bold text-red-300 mb-2">Analysis Failed</h3>
          <p className="text-red-200/80">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
          aria-label="Retry analysis"
        >
          <IconRefreshPipeline className="h-4 w-4" aria-hidden="true" />
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  // Determine whether we have new-style complete analysis
  const hasCompleteGTM = !!analysis.executiveSummary;

  return (
    <div className="space-y-12">

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-8">
          {/* Header & Action Controls */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2" id="analysis-title">
                  GTM AI Analysis <span className="text-teal-400">Playbook</span>
                </h1>
                <p className="text-lg text-slate-400" aria-describedby="analysis-title">
                  Complete 11-section analysis for {analysis.companyName || "your company"}
                </p>
              </div>
            </div>
            {/* Feedback & Regeneration Section */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="user-feedback" className="text-sm font-semibold text-slate-300 mb-2 block">
                    Provide Feedback to Improve Analysis
                  </Label>
                  <textarea
                    id="user-feedback"
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="What would you like to change in the analysis? E.g., Focus more on a specific region, adjust ICP, include certain competitors, etc."
                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/30 transition-all"
                    rows={2}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <Button
                    onClick={() => {
                      // Save feedback and regenerate
                      if (context) {
                        saveLeadContext(context.form, context.analysis, userFeedback);
                        setContext({ ...context, feedback: userFeedback });
                      }
                      // Call the regenerate function we attached to window
                      const win = window as any;
                      if (win.regenerateAnalysis) win.regenerateAnalysis();
                    }}
                    disabled={loading || regenerating}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    aria-label="Regenerate analysis with feedback"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Regenerating with Feedback...
                      </>
                    ) : (
                      <>
                        <IconRefreshPipeline className="w-4 h-4 mr-2" aria-hidden="true" />
                        Regenerate with Feedback
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      // Regenerate without feedback
                      const win = window as any;
                      if (win.regenerateAnalysis) win.regenerateAnalysis();
                    }}
                    disabled={loading || regenerating}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                    aria-label="Regenerate analysis without feedback"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <IconRefreshPipeline className="w-4 h-4 mr-2" aria-hidden="true" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Other Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowViewer(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                aria-label="View analysis document in viewer"
              >
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                View Document
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-slate-700 hover:bg-slate-600 text-white"
                aria-label="Print or save as PDF"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print/PDF
              </Button>
              <Button
                onClick={handleDownloadHtml}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                aria-label="Download as HTML"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                HTML
              </Button>
              <Button
                onClick={handleDownloadMarkdown}
                disabled={downloading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                aria-live="polite"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Downloading... {downloadProgress}%
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                    Markdown
                  </>
                )}
              </Button>
            </div>
          </div>

        {/* Download Progress/Error */}
        <AnimatePresence>
          {downloading && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900/50 border border-slate-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Preparing download...</span>
                <span className="text-teal-400 font-semibold">{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" aria-hidden="true" />
            </motion.div>
          )}
          {downloadError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-300">Download Failed</h4>
                <p className="text-red-200/80 text-sm">{downloadError}</p>
                <Button
                  onClick={handleDownloadMarkdown}
                  className="mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                >
                  Retry Download
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasCompleteGTM ? (
          <CompleteGTMDisplay analysis={analysis} context={context} setAnalysis={setAnalysis} />
        ) : (
          <LegacyGTMDisplay analysis={analysis} />
        )}


        {/* Booking Widget Section */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="mt-16 pt-16 border-t border-white/10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4" id="booking-title">Let&apos;s Fix Your Pipeline</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto" aria-describedby="booking-title">Book a strategy call to review this AI GTM analysis.</p>
          </div>
          <BookingWidget
            name={context?.form?.name || ""}
            email={context?.form?.emailPersonal || ""}
            companyName={analysis.companyName || ""}
            leadId={leadId}
            analysisId={analysis.analysisId}
            contactPhone=""
            challengeTags={context?.form?.challenges || []}
          />
        </motion.div>
      </motion.div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {showViewer && (
          <DocumentViewer
            analysis={analysis}
            context={context}
            zoom={zoom}
            setZoom={setZoom}
            onClose={() => setShowViewer(false)}
            scrollRef={scrollRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Full Markdown report generator
function generateFullMarkdownReport(analysis: AnalysisResult | null, context: StoredLeadContext | null): string {
  if (!analysis) return "";

  let md = `# ${analysis.companyName || "Company"} - GTM Analysis Playbook\n\n`;
  
  // Input Customer Data section
  md += `## Input Customer Data\n\n`;
  md += `> **User-Provided**: Data you submitted in the intake form\n\n`;
  if (context?.form) {
    md += `- **Company Name**: ${context.form.companyName || "Not provided"}\n`;
    md += `- **Website**: ${context.form.websiteUrl || "Not provided"}\n`;
    md += `- **Contact Name**: ${context.form.name || "Not provided"}\n`;
    md += `- **Contact Email**: ${context.form.emailPersonal || "Not provided"}\n`;
    md += `- **Target Industries**: ${Array.isArray(context.form.targetIndustries) ? context.form.targetIndustries.join(", ") : "Not provided"}\n`;
    md += `- **Target Geographic Regions**: ${Array.isArray(context.form.targetGeographics) ? context.form.targetGeographics.join(", ") : "Not provided"}\n`;
    md += `- **ICP Description**: ${context.form.icpDescription || "Not provided"}\n`;
  }
  // User Feedback section
  if (context?.feedback) {
    md += `\n## User Feedback for Regeneration\n\n`;
    md += `> **Feedback Provided for This Analysis**: ${context.feedback}\n\n`;
  }
  md += `\n`;
  
  if (analysis.executiveSummary) md += `## 1. Executive Summary\n\n> **AI-Generated**: Analysis output from DealFlow AI\n\n${analysis.executiveSummary}\n\n`;
  if (analysis.icpDefinition) {
    md += `## 2. ICP Definition\n\n### Inclusion Criteria\n\n${analysis.icpDefinition.inclusionCriteria.map(i => `- ${i}`).join("\n")}\n\n### Exclusion Criteria\n\n${analysis.icpDefinition.exclusionCriteria.map(e => `- ${e}`).join("\n")}\n\n`;
  }

  // Table 1
  if (analysis.table1FirmographicDemographic?.length) {
    md += `## 3. Table 1: Firmographic & Demographic Segmentation\n\n`;
    md += `| Priority Tier | Industry | Company Size | ARR Range | Location | Notes | Primary Cost Driver | Current Solution Status | Number of Sites/Teams/Locations | Sustainability/ESG/Compliance Commitment |\n`;
    md += `|---------------|----------|--------------|-----------|----------|-------|--------------------|-------------------------|---------------------------------|------------------------------------------|\n`;
    for (let entry of analysis.table1FirmographicDemographic) {
      md += `| ${entry.priorityTier} | ${entry.industryVertical} | ${entry.companySize} | ${entry.arrRange} | ${entry.location} | ${entry.notes} | ${entry.primaryCostDriver || ''} | ${entry.currentSolutionStatus || ''} | ${entry.numberOfSitesTeamsLocations || ''} | ${entry.sustainabilityEsgComplianceCommitment || ''} |\n`;
    }
    md += `\n`;
  }

  if (analysis.behavioralPsychographicTraits) {
    md += `## 4. Behavioral & Psychographic Traits\n\n`;
    md += `### Observable Behavioral Patterns\n\n${analysis.behavioralPsychographicTraits.observableBehavioralPatterns.map(b => `- ${b}`).join("\n")}\n\n`;
    md += `### Core Psychographic Attributes\n\n${analysis.behavioralPsychographicTraits.corePsychographicAttributes.map(b => `- ${b}`).join("\n")}\n\n`;
  }

  // Table 2
  if (analysis.table2PainPointAnalysis?.length) {
    md += `## 5. Table 2: Pain Point Analysis\n\n`;
    md += `| Pain Point | Severity | Business Impact | Root Cause | DealFlow Solution | Frequency of Pain | How Pain is Currently Discovered | Competitor/Current Solution in Use |\n`;
    md += `|------------|----------|-----------------|------------|-------------------|------------------|---------------------------------|-------------------------------------|\n`;
    for (let entry of analysis.table2PainPointAnalysis) {
      md += `| ${entry.painPoint} | ${entry.severity} | ${entry.businessImpact} | ${entry.rootCause} | ${entry.dealFlowAISolution} | ${entry.frequencyOfPain || ''} | ${entry.howPainIsCurrentlyDiscovered || ''} | ${entry.competitorCurrentSolutionInUse || ''} |\n`;
    }
    md += `\n`;
  }

  // Table 3
  if (analysis.table3DecisionMakerInfluence?.length) {
    md += `## 6. Table 3: Decision-Maker Influence Matrix\n\n`;
    md += `| Role | Influence Score | Core Role | Top 3 Priorities | DealFlow AI Messaging Focus | Preferred Contact Channel | Primary Objection Type | Content Format Preference |\n`;
    md += `|------|-----------------|-----------|------------------|-----------------------------|--------------------------|----------------------|---------------------------|\n`;
    for (let entry of analysis.table3DecisionMakerInfluence) {
      md += `| ${entry.role} | ${entry.influenceScore} | ${entry.coreDecisionRole} | ${entry.top3Priorities} | ${entry.dealFlowAIMessagingFocus} | ${entry.preferredContactChannel || ''} | ${entry.primaryObjectionType || ''} | ${entry.contentFormatPreference || ''} |\n`;
    }
    md += `\n`;
  }

  // Purchasing Journey
  if (analysis.purchasingJourneyMapping?.length) {
    md += `## 7. Purchasing Journey Mapping\n\n`;
    for (let stage of analysis.purchasingJourneyMapping) {
      md += `### ${stage.stage} (${stage.duration})\n\n`;
      md += `- **Customer Actions**: ${stage.customerActions}\n`;
      md += `- **Customer Needs**: ${stage.customerNeedsQuestions}\n`;
      md += `- **Channel Preferences**: ${stage.channelPreferences}\n`;
      md += `- **DealFlow AI Assets & Engagement**: ${stage.dealFlowAIAssetsEngagement}\n\n`;
    }
  }

  // Table 4
  if (analysis.table4LeadScoringFramework) {
    md += `## 8. Table 4: Lead Scoring Framework\n\n`;
    md += `| Category | Criterion | Points |\n`;
    md += `|----------|-----------|--------|\n`;
    for (let entry of analysis.table4LeadScoringFramework.criteria) {
      md += `| ${entry.category} | ${entry.criterion} | ${entry.points} |\n`;
    }
    md += `\n### Qualification Thresholds\n\n`;
    md += `- MQL: ${analysis.table4LeadScoringFramework.qualificationThresholds.mql}\n`;
    md += `- SQL: ${analysis.table4LeadScoringFramework.qualificationThresholds.sql}\n`;
    md += `- SAL: ${analysis.table4LeadScoringFramework.qualificationThresholds.sal}\n\n`;
  }

  // Table 5
  if (analysis.table5ChannelEffectiveness?.length) {
    md += `## 9. Table 5: Channel Effectiveness Analysis\n\n`;
    md += `| Channel | ICP Segments Best For | Monthly Lead Volume | Conversion Rate | CAC | LTV:CAC | Budget Allocation | Optimization Recommendations |\n`;
    md += `|---------|-----------------------|---------------------|-----------------|-----|---------|-------------------|----------------------------|\n`;
    for (let entry of analysis.table5ChannelEffectiveness) {
      md += `| ${entry.channel} | ${entry.icpSegmentsBestFor} | ${entry.monthlyLeadVolume} | ${entry.conversionRate} | ${entry.costPerAcquisition} | ${entry.ltvToCacRatio} | ${entry.budgetAllocation} | ${entry.optimizationRecommendations} |\n`;
    }
    md += `\n`;
  }

  if (analysis.crossTeamAlignmentGuidelines) {
    md += `## 10. Cross-Team Alignment Guidelines\n\n`;
    md += `### Shared SLAs\n\n`;
    if (Array.isArray(analysis.crossTeamAlignmentGuidelines.sharedSLAs)) {
      for (const sla of analysis.crossTeamAlignmentGuidelines.sharedSLAs) {
        if (typeof sla === 'string') {
          md += `- ${sla}\n`;
        } else if (typeof sla === 'object' && sla !== null && 'sla' in sla) {
          md += `- **${sla.sla}** (Owner: ${sla.owner}, Escalation Path: ${sla.escalationPath})\n`;
        }
      }
    }
    if (analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting) {
      md += `\n### Weekly Review Meeting\n\n- Cadence: ${analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.cadence}\n- Owner: ${analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.owner}\n\n`;
    }
    if (analysis.crossTeamAlignmentGuidelines.hotLeadCriteria) {
      md += `### Hot Lead Criteria\n\n${analysis.crossTeamAlignmentGuidelines.hotLeadCriteria}\n\n`;
    }
    md += `\n`;
  }

  if (analysis.icpValidationChecklist) {
    md += `## 11. ICP Validation Checklist\n\n`;
    md += `### Pre-Qualification Checklist\n\n`;
    for (let item of analysis.icpValidationChecklist.preQualificationChecklist) {
      md += `- [ ] ${item}\n`;
    }
    md += `\n### Data Sources for Validation\n\n`;
    for (let source of analysis.icpValidationChecklist.dataSourcesForValidation) {
      md += `- ${source}\n`;
    }
    md += `\n### ICP Update Triggers\n\n`;
    for (let trigger of analysis.icpValidationChecklist.icpUpdateTriggers) {
      md += `- ${trigger}\n`;
    }
    if (analysis.icpValidationChecklist.quarterlyReviewOwner) {
      md += `\n### Quarterly Review Owner\n\n${analysis.icpValidationChecklist.quarterlyReviewOwner}\n\n`;
    }
    if (analysis.icpValidationChecklist.scoringThresholdForRevision) {
      md += `### Scoring Threshold for Revision\n\n${analysis.icpValidationChecklist.scoringThresholdForRevision}\n\n`;
    }
    if (analysis.icpValidationChecklist.reviewChecklist?.length) {
      md += `### Review Checklist\n\n${analysis.icpValidationChecklist.reviewChecklist.map((i: string) => `- ${i}`).join("\n")}\n\n`;
    }
  }

  // New Sections A-F
  if (analysis.sectionACompetitiveLandscape?.length) {
    md += `## A. Competitive Landscape\n\n`;
    md += `| Competitor Name | Core Offering | Key Weakness | Company Differentiator | Positioning Statement |\n`;
    md += `|-----------------|---------------|--------------|-----------------------|------------------------|\n`;
    for (const competitor of analysis.sectionACompetitiveLandscape) {
      md += `| ${competitor.competitorName} | ${competitor.coreOffering} | ${competitor.keyWeakness} | ${competitor.companyDifferentiator} | ${competitor.positioningStatement} |\n`;
    }
    md += `\n`;
  }

  if (analysis.sectionBMessagingAndPositioning?.length) {
    md += `## B. Messaging & Positioning\n\n`;
    for (const msg of analysis.sectionBMessagingAndPositioning) {
      md += `### Pain Point: ${msg.painPoint}\n\n`;
      md += `- **Value Pillar**: ${msg.valuePillar}\n`;
      md += `- **Hook Line**: ${msg.hookLine}\n`;
      md += `- **Supporting Proof Point**: ${msg.supportingProofPoint}\n`;
      md += `- **CTA**: ${msg.cta}\n\n`;
      if (msg.personaMessaging?.length) {
        md += `#### Persona-Specific Messaging\n\n`;
        for (const personaMsg of msg.personaMessaging) {
          md += `- **${personaMsg.persona}**: ${personaMsg.messaging}\n`;
        }
        md += `\n`;
      }
    }
  }

  if (analysis.sectionCObjectionHandlingMatrix?.length) {
    md += `## C. Objection Handling Matrix\n\n`;
    md += `| Objection | Persona Most Likely to Raise It | Response Framework | Supporting Asset |\n`;
    md += `|-----------|---------------------------------|--------------------|------------------|\n`;
    for (const obj of analysis.sectionCObjectionHandlingMatrix) {
      md += `| ${obj.objection} | ${obj.personaMostLikelyToRaiseIt} | ${obj.responseFramework} | ${obj.supportingAsset} |\n`;
    }
    md += `\n`;
  }

  if (analysis.sectionDTamSamSom) {
    md += `## D. TAM / SAM / SOM\n\n`;
    md += `- **TAM**: ${analysis.sectionDTamSamSom.tam}\n`;
    md += `- **SAM**: ${analysis.sectionDTamSamSom.sam}\n`;
    md += `- **SOM**: ${analysis.sectionDTamSamSom.som}\n\n`;
  }

  if (analysis.sectionEPartnerAndChannelStrategy) {
    md += `## E. Partner & Channel Strategy\n\n`;
    md += `### Referral Partners\n\n${analysis.sectionEPartnerAndChannelStrategy.referralPartners.map(i => `- ${i}`).join("\n")}\n\n`;
    md += `### Partner Incentive Model\n\n${analysis.sectionEPartnerAndChannelStrategy.partnerIncentiveModel}\n\n`;
    md += `### Co-Marketing Opportunities\n\n${analysis.sectionEPartnerAndChannelStrategy.coMarketingOpportunities.map(i => `- ${i}`).join("\n")}\n\n`;
  }

  if (analysis.sectionFRiskRegister?.length) {
    md += `## F. Risk Register\n\n`;
    md += `| Risk | Likelihood | Impact | Mitigation |\n`;
    md += `|------|------------|--------|------------|\n`;
    for (const risk of analysis.sectionFRiskRegister) {
      md += `| ${risk.risk} | ${risk.likelihood} | ${risk.impact} | ${risk.mitigation} |\n`;
    }
    md += `\n`;
  }

  if (analysis.campaignSuccessMetrics) {
    md += `## Campaign Success Metrics\n\n`;
    md += `### Pipeline Generated Target by Tier\n\n`;
    for (const tier of analysis.campaignSuccessMetrics.pipelineGeneratedTargetByTier) {
      md += `- **${tier.tier}**: ${tier.target}\n`;
    }
    md += `\n- **MQL → SQL Conversion Rate Target**: ${analysis.campaignSuccessMetrics.mqlToSqlConversionRateTarget}\n\n`;
    md += `### CAC Target by Channel\n\n`;
    for (const channel of analysis.campaignSuccessMetrics.cacTargetByChannel) {
      md += `- **${channel.channel}**: ${channel.target}\n`;
    }
    md += `\n### Deal Velocity Benchmark by Tier\n\n`;
    for (const tier of analysis.campaignSuccessMetrics.dealVelocityBenchmarkByTier) {
      md += `- **${tier.tier}**: ${tier.days} days to close\n`;
    }
    md += `\n`;
  }

  return md;
}

// Component to display complete GTM analysis
function CompleteGTMDisplay({ analysis, context, setAnalysis }: { analysis: AnalysisResult, context: StoredLeadContext | null, setAnalysis?: (analysis: AnalysisResult) => void }) {
  const sections = [
    { id: "input-data", icon: <FileText />, title: "Input Customer Data" },
    { id: "executive", icon: <FileText />, title: "1. Executive Summary" },
    { id: "icp", icon: <Target />, title: "2. ICP Definition" },
    { id: "firmographics", icon: <Users />, title: "3. Table 1: Firmographics" },
    { id: "behavioral", icon: <PieChart />, title: "4. Behavioral Traits" },
    { id: "painpoints", icon: <IconAlertObjection />, title: "5. Table 2: Pain Points" },
    { id: "decisionmakers", icon: <Users />, title: "6. Table 3: Decision Makers" },
    { id: "journey", icon: <ChevronRight />, title: "7. Purchasing Journey" },
    { id: "scoring", icon: <TrendingUp />, title: "8. Table 4: Lead Scoring" },
    { id: "channels", icon: <Target />, title: "9. Table 5: Channels" },
    { id: "alignment", icon: <CheckCircle2 />, title: "10. Cross-Team Alignment" },
    { id: "checklist", icon: <Check />, title: "11. Validation Checklist" },
    { id: "competitive", icon: <Shield />, title: "A. Competitive Landscape" },
    { id: "messaging", icon: <FileText />, title: "B. Messaging & Positioning" },
    { id: "objections", icon: <IconAlertObjection />, title: "C. Objection Handling" },
    { id: "tamsamsom", icon: <TrendingUp />, title: "D. TAM/SAM/SOM" },
    { id: "partners", icon: <Users />, title: "E. Partner Strategy" },
    { id: "risks", icon: <Shield />, title: "F. Risk Register" },
    { id: "metrics", icon: <TrendingUp />, title: "Campaign Success Metrics" }
  ];

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>(
    context?.form ? { ...context.form } : {}
  );

  // Helper to render input field
  const InputField = ({ label, name, value, type = "text" }: { label: string, name: string, value: string | string[] | undefined, type?: "text" | "textarea" }) => {
    if (isEditing) {
      if (type === "textarea") {
        return (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-400">{label}</label>
            <textarea
              value={editForm[name] || ""}
              onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value })}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white text-sm"
              rows={3}
            />
          </div>
        );
      }
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-400">{label}</label>
            <input
              value={editForm[name]?.join(", ") || ""}
              onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value.split(",").map(s => s.trim()) })}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white text-sm"
            />
          </div>
        );
      }
      return (
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-400">{label}</label>
          <input
            type={type}
            value={editForm[name] || ""}
            onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value })}
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white text-sm"
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-400">{label}</label>
          <p className="text-slate-300">
            {Array.isArray(value) ? value.join(", ") : (value || "Not provided")}
          </p>
        </div>
      );
    }
  };

  const handleRegenerate = async () => {
    if (!setAnalysis) return;
    const newMockData = generateMockCompleteGTM(
      editForm.companyName || "Company",
      editForm
    );
    setAnalysis(newMockData);
  };

  const handleSaveEdit = () => {
    // Save editForm to lead context
    if (context) {
      saveLeadContext({ ...context.form, ...editForm }, null);
    }
    setIsEditing(false);
  };

  return (    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Navigation - Mobile & Desktop */}
      <div className="lg:col-span-3">
        <div className="sticky top-6 border border-[#24252a]/60 bg-[#111219]/40 p-5 rounded-md space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/60 pb-3">
            Analysis Sections
          </div>
          <nav aria-label="Analysis sections">
            <ul className="space-y-1">
              {sections.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      const el = document.getElementById(section.id);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setActiveSection(section.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${
                      activeSection === section.id 
                        ? "bg-[#8a704c]/20 text-[#d4a017] font-semibold border-l-2 border-l-[#d4a017] pl-2.5" 
                        : "text-slate-400 hover:text-white hover:bg-white/5 pl-3"
                    }`}
                    aria-current={activeSection === section.id ? "true" : "false"}
                  >
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-6">
        {/* Input Customer Data Section */}
        <GTMSection title="Input Customer Data" id="input-data" icon={<FileText />}>
          <div className="rounded-lg bg-[#111219]/40 border border-[#24252a] p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#24252a]/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#8a704c]/10 text-[#d4a017] uppercase tracking-wider">
                  User-Provided
                </span>
                <p className="text-xs text-slate-400 font-light">Data you submitted in the intake form</p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold px-4 h-9">
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} className="bg-[#16181f] border border-[#24252a] hover:bg-[#20232d] text-white rounded-md text-xs font-semibold px-4 h-9">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#16181f] border border-[#24252a] hover:bg-[#20232d] text-white rounded-md text-xs font-semibold px-4 h-9">
                    Edit
                  </Button>
                )}
                <Button onClick={handleRegenerate} className="bg-[#d4a017] hover:bg-[#c29014] text-[#090a0f] rounded-md text-xs font-semibold px-4 h-9">
                  Regenerate Analysis
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" name="companyName" value={context?.form?.companyName} />
              <InputField label="Website" name="websiteUrl" value={context?.form?.websiteUrl} />
              <InputField label="Contact Name" name="name" value={context?.form?.name} />
              <InputField label="Contact Email" name="emailPersonal" value={context?.form?.emailPersonal} />
              <InputField label="Target Industries" name="targetIndustries" value={context?.form?.targetIndustries} />
              <InputField label="Target Geographic Regions" name="targetGeographics" value={context?.form?.targetGeographics} />
              <InputField label="ICP Description" name="icpDescription" value={context?.form?.icpDescription} type="textarea" />
            </div>
          </div>
        </GTMSection>

        {/* Section 1: Executive Summary */}
        <div className="rounded-lg bg-[#111219]/20 border border-[#24252a]/40 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#8a704c]/10 text-[#d4a017] uppercase tracking-wider">
              AI-Generated
            </span>
            <p className="text-xs text-slate-400 font-light">Analysis output from DealFlow AI</p>
          </div>
        </div>
        <GTMSection title="1. Executive Summary" id="executive" icon={<FileText />}>
          <p className="text-[#f4f3f0] leading-relaxed font-light">{analysis.executiveSummary}</p>
        </GTMSection>

        {/* Section 2: ICP Definition */}
        <GTMSection title="2. ICP Definition" id="icp" icon={<Target />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-green-950/30 border border-green-500/20 p-6">
              <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                <Check className="w-4 h-4" aria-hidden="true" />
                Inclusion Criteria
              </h4>
              <ul className="space-y-2">
                {analysis.icpDefinition?.inclusionCriteria.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-6">
              <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" aria-hidden="true" />
                Exclusion Criteria
              </h4>
              <ul className="space-y-2">
                {analysis.icpDefinition?.exclusionCriteria.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <IconAlertObjection className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GTMSection>

        {/* Section 3: Table 1 Firmographics */}
        <GTMSection title="3. Table 1: Firmographic & Demographic Segmentation" id="firmographics" icon={<Users />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="table" aria-label="Firmographic segmentation data">
              <thead>
                <tr className="border-b border-[#24252a]">
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Priority Tier</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Industry</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Company Size</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">ARR Range</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Location</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Primary Cost Driver</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Current Solution</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Sites/Teams</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">ESG/Compliance</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.table1FirmographicDemographic?.map((entry, i) => (
                  <tr key={i} className="border-b border-[#24252a]/40 hover:bg-[#111219]/25 transition-colors">
                    <td className="p-3 text-xs text-[#f4f3f0] font-light">{entry.priorityTier}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.industryVertical}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.companySize}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-medium">{entry.arrRange}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.location}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.primaryCostDriver}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.currentSolutionStatus}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.numberOfSitesTeamsLocations}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{entry.sustainabilityEsgComplianceCommitment}</td>
                    <td className="p-3 text-xs text-slate-450 font-light">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GTMSection>

        {/* Section 4: Behavioral Traits */}
        <GTMSection title="4. Behavioral & Psychographic Traits" id="behavioral" icon={<PieChart />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h4 className="text-slate-200 font-semibold mb-4">Observable Behavioral Patterns</h4>
              <ul className="space-y-2">
                {analysis.behavioralPsychographicTraits?.observableBehavioralPatterns.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span className="text-slate-300">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h4 className="text-slate-200 font-semibold mb-4">Core Psychographic Attributes</h4>
              <ul className="space-y-2">
                {analysis.behavioralPsychographicTraits?.corePsychographicAttributes.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" aria-hidden="true" />
                    <span className="text-slate-300">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GTMSection>

        {/* Section 5: Table 2 Pain Points */}
        <GTMSection title="5. Table 2: Pain Point Analysis" id="painpoints" icon={<IconAlertObjection />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="table" aria-label="Pain point analysis">
              <thead>
                <tr className="border-b border-[#24252a]">
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Pain Point</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Severity</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Business Impact</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Frequency</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">How Discovered</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Current Solution</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">DealFlow Solution</th>
                </tr>
              </thead>
              <tbody>
                {analysis.table2PainPointAnalysis?.map((p, i) => (
                  <tr key={i} className="border-b border-[#24252a]/40 hover:bg-[#111219]/25 transition-colors">
                    <td className="p-3 text-xs text-[#f4f3f0] font-light">{p.painPoint}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${p.severity === "Critical" ? "bg-rose-950/40 text-rose-450 border border-rose-900/40" : p.severity === "High" ? "bg-amber-950/40 text-amber-450 border border-amber-900/40" : "bg-neutral-800/40 text-neutral-350"}`}>
                        {p.severity}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-300 font-light">{p.businessImpact}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{p.frequencyOfPain}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{p.howPainIsCurrentlyDiscovered}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{p.competitorCurrentSolutionInUse}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-medium">{p.dealFlowAISolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GTMSection>

        {/* Section 6: Table 3 Decision Makers */}
        <GTMSection title="6. Table 3: Decision-Maker Influence Matrix" id="decisionmakers" icon={<Users />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="table" aria-label="Decision maker influence matrix">
              <thead>
                <tr className="border-b border-[#24252a]">
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Role</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Influence</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Core Role</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Top Priorities</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Preferred Channel</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Primary Objection</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Content Preference</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Messaging</th>
                </tr>
              </thead>
              <tbody>
                {analysis.table3DecisionMakerInfluence?.map((d, i) => (
                  <tr key={i} className="border-b border-[#24252a]/40 hover:bg-[#111219]/25 transition-colors">
                    <td className="p-3 text-xs text-[#f4f3f0] font-light">{d.role}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-semibold">{d.influenceScore}/10</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{d.coreDecisionRole}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{d.top3Priorities}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{d.preferredContactChannel}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{d.primaryObjectionType}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{d.contentFormatPreference}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-medium">{d.dealFlowAIMessagingFocus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GTMSection>

        {/* Section 7: Purchasing Journey */}
        <GTMSection title="7. Purchasing Journey Mapping" id="journey" icon={<ChevronRight />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.purchasingJourneyMapping?.map((stage, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300 font-bold">
                    {i + 1}
                  </div>
                  {stage.stage} <span className="text-sm text-slate-500">({stage.duration})</span>
                </h4>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-300"><strong className="text-slate-200">Customer Actions:</strong> {stage.customerActions}</p>
                  <p className="text-sm text-slate-300"><strong className="text-slate-200">Needs:</strong> {stage.customerNeedsQuestions}</p>
                  <p className="text-sm text-slate-300"><strong className="text-slate-200">Channels:</strong> {stage.channelPreferences}</p>
                  <p className="text-sm text-slate-300"><strong className="text-slate-200">DealFlow Assets:</strong> {stage.dealFlowAIAssetsEngagement}</p>
                </div>
              </div>
            ))}
          </div>
        </GTMSection>

        {/* Section 8: Table 4 Lead Scoring */}
        <GTMSection title="8. Table 4: Lead Scoring Framework" id="scoring" icon={<TrendingUp />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 overflow-x-auto">
              <table className="w-full border-collapse" role="table" aria-label="Lead scoring framework">
                <thead>
                  <tr className="border-b border-[#24252a]">
                    <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Category</th>
                    <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Criterion</th>
                    <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.table4LeadScoringFramework?.criteria.map((c, i) => (
                    <tr key={i} className="border-b border-[#24252a]/40 hover:bg-[#111219]/25 transition-colors">
                      <td className="p-3 text-xs text-slate-350 font-light">{c.category}</td>
                      <td className="p-3 text-xs text-[#f4f3f0] font-light">{c.criterion}</td>
                      <td className="p-3 text-xs text-[#d4a017] font-semibold">{c.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-md bg-[#111219]/40 border border-[#24252a] p-6 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/60 pb-2">Qualification Thresholds</h4>
              <ul className="space-y-3">
                <li className="flex items-center justify-between">
                  <span className="text-xs text-slate-350">MQL</span>
                  <span className="text-xs font-semibold text-amber-400">{analysis.table4LeadScoringFramework?.qualificationThresholds.mql}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-xs text-slate-355">SQL</span>
                  <span className="text-xs font-semibold text-orange-400">{analysis.table4LeadScoringFramework?.qualificationThresholds.sql}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">SAL</span>
                  <span className="text-xs font-semibold text-emerald-400">{analysis.table4LeadScoringFramework?.qualificationThresholds.sal}</span>
                </li>
              </ul>
            </div>
          </div>
        </GTMSection>

        {/* Section 9: Table 5 Channels */}
        <GTMSection title="9. Table 5: Channel Effectiveness" id="channels" icon={<Target />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" role="table" aria-label="Channel effectiveness analysis">
              <thead>
                <tr className="border-b border-[#24252a]">
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Channel</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Best For</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Monthly Volume</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Conversion</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">CAC</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">LTV:CAC</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Budget</th>
                  <th scope="col" className="text-left p-3 text-xs font-semibold text-[#8a704c] uppercase tracking-wider">Optimization</th>
                </tr>
              </thead>
              <tbody>
                {analysis.table5ChannelEffectiveness?.map((ch, i) => (
                  <tr key={i} className="border-b border-[#24252a]/40 hover:bg-[#111219]/25 transition-colors">
                    <td className="p-3 text-xs text-[#f4f3f0] font-light">{ch.channel}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{ch.icpSegmentsBestFor}</td>
                    <td className="p-3 text-xs text-slate-350 font-light">{ch.monthlyLeadVolume}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-semibold">{ch.conversionRate}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{ch.costPerAcquisition}</td>
                    <td className="p-3 text-xs text-[#d4a017] font-semibold">{ch.ltvToCacRatio}</td>
                    <td className="p-3 text-xs text-slate-300 font-light">{ch.budgetAllocation}</td>
                    <td className="p-3 text-xs text-slate-400 font-light">{ch.optimizationRecommendations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GTMSection>

        {/* Section 10: Cross-Team Alignment */}
        <GTMSection title="10. Cross-Team Alignment Guidelines" id="alignment" icon={<CheckCircle2 />}>
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-6">
                <h4 className="font-semibold text-white mb-4">Shared SLAs</h4>
                <ul className="space-y-2">
                  {analysis.crossTeamAlignmentGuidelines?.sharedSLAs.map((sla, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <p className="text-slate-300 font-medium">{typeof sla === 'string' ? sla : sla.sla}</p>
                        {typeof sla === 'object' && sla !== null && (
                          <p className="text-xs text-slate-400">
                            Owner: {sla.owner} • Escalation: {sla.escalationPath}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {analysis.crossTeamAlignmentGuidelines?.weeklyReviewMeeting && (
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-white mb-4">Weekly Review Meeting</h4>
                  <p className="text-slate-300">
                    <strong>Cadence:</strong> {analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.cadence} • <strong>Owner:</strong> {analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.owner}
                  </p>
                </CardContent>
              </Card>
            )}

            {analysis.crossTeamAlignmentGuidelines?.hotLeadCriteria && (
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-white mb-4">Hot Lead Criteria</h4>
                  <p className="text-slate-300">{analysis.crossTeamAlignmentGuidelines.hotLeadCriteria}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </GTMSection>

        {/* Section 11: Validation Checklist */}
        <GTMSection title="11. ICP Validation Checklist" id="checklist" icon={<Check />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h4 className="font-semibold text-white mb-4">Pre-Qualification Checklist</h4>
              <ul className="space-y-2">
                {analysis.icpValidationChecklist?.preQualificationChecklist.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Check className="w-3 h-3 text-teal-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h4 className="font-semibold text-white mb-4">ICP Update Triggers</h4>
              <ul className="space-y-2">
                {analysis.icpValidationChecklist?.icpUpdateTriggers.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <IconAlertObjection className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.icpValidationChecklist?.quarterlyReviewOwner && (
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
                <h4 className="font-semibold text-white mb-4">Quarterly Review Owner</h4>
                <p className="text-slate-300">{analysis.icpValidationChecklist.quarterlyReviewOwner}</p>
              </div>
            )}

            {analysis.icpValidationChecklist?.scoringThresholdForRevision && (
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
                <h4 className="font-semibold text-white mb-4">Scoring Threshold for Revision</h4>
                <p className="text-slate-300">{analysis.icpValidationChecklist.scoringThresholdForRevision}</p>
              </div>
            )}
          </div>

          {analysis.icpValidationChecklist?.reviewChecklist?.length && (
            <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h4 className="font-semibold text-white mb-4">Review Checklist</h4>
              <ul className="space-y-2">
                {analysis.icpValidationChecklist.reviewChecklist.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Check className="w-3 h-3 text-teal-400 opacity-0 group-hover:opacity-100" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-teal-500/5 border border-teal-500/10 p-6">
            <h4 className="font-semibold text-teal-300 mb-2">Data Sources for Validation</h4>
            <ul className="flex flex-wrap gap-2">
              {analysis.icpValidationChecklist?.dataSourcesForValidation.map((ds: string, i: number) => (
                <li key={i} className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-slate-300 text-sm border border-white/10">
                  {ds}
                </li>
              ))}
            </ul>
          </div>
        </GTMSection>

        {/* Section A: Competitive Landscape */}
        {analysis.sectionACompetitiveLandscape?.length && (
          <GTMSection title="A. Competitive Landscape" id="competitive" icon={<Shield />}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Competitor</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Core Offering</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Key Weakness</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Our Differentiator</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Positioning Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sectionACompetitiveLandscape.map((comp, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-3 text-sm text-slate-200">{comp.competitorName}</td>
                      <td className="p-3 text-sm text-slate-300">{comp.coreOffering}</td>
                      <td className="p-3 text-sm text-slate-300">{comp.keyWeakness}</td>
                      <td className="p-3 text-sm text-teal-300">{comp.companyDifferentiator}</td>
                      <td className="p-3 text-sm text-slate-300">{comp.positioningStatement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GTMSection>
        )}

        {/* Section B: Messaging & Positioning */}
        {analysis.sectionBMessagingAndPositioning?.length && (
          <GTMSection title="B. Messaging & Positioning" id="messaging" icon={<FileText />}>
            <div className="space-y-6">
              {analysis.sectionBMessagingAndPositioning.map((msg, i) => (
                <Card key={i} className="border-white/10 bg-white/[0.03]">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-white mb-4">Pain Point: {msg.painPoint}</h4>
                    <p className="text-slate-300 mb-2"><strong>Value Pillar:</strong> {msg.valuePillar}</p>
                    <p className="text-slate-300 mb-2"><strong>Hook Line:</strong> {msg.hookLine}</p>
                    <p className="text-slate-300 mb-4"><strong>Supporting Proof Point:</strong> {msg.supportingProofPoint}</p>
                    <p className="text-slate-300 mb-4"><strong>CTA:</strong> {msg.cta}</p>
                    {msg.personaMessaging?.length && (
                      <div className="mt-4">
                        <h5 className="font-semibold text-slate-200 mb-2">Persona-Specific Messaging</h5>
                        <ul className="space-y-2">
                          {msg.personaMessaging.map((pm, j) => (
                            <li key={j} className="text-slate-300"><strong>{pm.persona}:</strong> {pm.messaging}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </GTMSection>
        )}

        {/* Section C: Objection Handling Matrix */}
        {analysis.sectionCObjectionHandlingMatrix?.length && (
          <GTMSection title="C. Objection Handling Matrix" id="objections" icon={<IconAlertObjection />}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Objection</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Persona Most Likely to Raise It</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Response Framework</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Supporting Asset</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sectionCObjectionHandlingMatrix.map((obj, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-3 text-sm text-slate-200">{obj.objection}</td>
                      <td className="p-3 text-sm text-slate-300">{obj.personaMostLikelyToRaiseIt}</td>
                      <td className="p-3 text-sm text-slate-300">{obj.responseFramework}</td>
                      <td className="p-3 text-sm text-teal-300">{obj.supportingAsset}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GTMSection>
        )}

        {/* Section D: TAM/SAM/SOM */}
        {analysis.sectionDTamSamSom && (
          <GTMSection title="D. TAM/SAM/SOM" id="tamsamsom" icon={<TrendingUp />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-4">
              <div className="border-l border-[#8a704c]/40 pl-4 space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c]">Total Addressable Market (TAM)</h4>
                <p className="text-2xl font-display font-light text-white">{analysis.sectionDTamSamSom.tam}</p>
              </div>
              <div className="border-l border-[#8a704c]/40 pl-4 space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c]">Serviceable Addressable Market (SAM)</h4>
                <p className="text-2xl font-display font-light text-white">{analysis.sectionDTamSamSom.sam}</p>
              </div>
              <div className="border-l border-[#8a704c]/40 pl-4 space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c]">Serviceable Obtainable Market (SOM)</h4>
                <p className="text-2xl font-display font-light text-white">{analysis.sectionDTamSamSom.som}</p>
              </div>
            </div>
          </GTMSection>
        )}

        {/* Section E: Partner & Channel Strategy */}
        {analysis.sectionEPartnerAndChannelStrategy && (
          <GTMSection title="E. Partner & Channel Strategy" id="partners" icon={<Users />}>
            <div className="space-y-6">
              {analysis.sectionEPartnerAndChannelStrategy.referralPartners?.length && (
                <div>
                  <h4 className="font-semibold text-white mb-4">Referral Partners</h4>
                  <ul className="space-y-2">
                    {analysis.sectionEPartnerAndChannelStrategy.referralPartners.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.sectionEPartnerAndChannelStrategy.partnerIncentiveModel && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Partner Incentive Model</h4>
                  <p className="text-slate-300">{analysis.sectionEPartnerAndChannelStrategy.partnerIncentiveModel}</p>
                </div>
              )}
              {analysis.sectionEPartnerAndChannelStrategy.coMarketingOpportunities?.length && (
                <div>
                  <h4 className="font-semibold text-white mb-4">Co-Marketing Opportunities</h4>
                  <ul className="space-y-2">
                    {analysis.sectionEPartnerAndChannelStrategy.coMarketingOpportunities.map((o, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </GTMSection>
        )}

        {/* Section F: Risk Register */}
        {analysis.sectionFRiskRegister?.length && (
          <GTMSection title="F. Risk Register" id="risks" icon={<Shield />}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Risk</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Likelihood</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Impact</th>
                    <th className="text-left p-3 text-sm font-semibold text-teal-300">Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sectionFRiskRegister.map((risk, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-3 text-sm text-slate-200">{risk.risk}</td>
                      <td className="p-3 text-sm text-slate-300">{risk.likelihood}</td>
                      <td className="p-3 text-sm text-slate-300">{risk.impact}</td>
                      <td className="p-3 text-sm text-slate-300">{risk.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GTMSection>
        )}

        {/* Campaign Success Metrics */}
        {analysis.campaignSuccessMetrics && (
          <GTMSection title="Campaign Success Metrics" id="metrics" icon={<TrendingUp />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
                <h4 className="font-semibold text-white mb-4">Pipeline Generated Target by Tier</h4>
                <ul className="space-y-2">
                  {analysis.campaignSuccessMetrics.pipelineGeneratedTargetByTier.map((t, i) => (
                    <li key={i} className="text-slate-300"><strong>{t.tier}:</strong> {t.target}</li>
                  ))}
                </ul>
                <p className="mt-4 text-slate-300">
                  <strong>MQL → SQL Conversion Rate Target:</strong> {analysis.campaignSuccessMetrics.mqlToSqlConversionRateTarget}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
                <h4 className="font-semibold text-white mb-4">CAC Target by Channel</h4>
                <ul className="space-y-2">
                  {analysis.campaignSuccessMetrics.cacTargetByChannel.map((c, i) => (
                    <li key={i} className="text-slate-300"><strong>{c.channel}:</strong> {c.target}</li>
                  ))}
                </ul>
                <h4 className="font-semibold text-white mt-6 mb-4">Deal Velocity Benchmark by Tier</h4>
                <ul className="space-y-2">
                  {analysis.campaignSuccessMetrics.dealVelocityBenchmarkByTier.map((t, i) => (
                    <li key={i} className="text-slate-300"><strong>{t.tier}:</strong> {t.days}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GTMSection>
        )}
      </div>
    </div>
  );
}

// Simple wrapper for sections
function GTMSection({ title, id, icon, children }: any) {
  return (
    <motion.section 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      id={id} 
      className="mb-12 scroll-mt-24 border-t border-[#24252a]/60 pt-8" 
      aria-labelledby={`${id}-title`}
    >
      <div className="flex items-center gap-2.5 mb-6">
        <div className="text-[#8a704c]" aria-hidden="true">
          {icon}
        </div>
        <h3 className="font-display text-2xl font-light text-white tracking-tight" id={`${id}-title`}>
          {title}
        </h3>
      </div>
      <div className="text-[#f4f3f0] font-light leading-relaxed">
        {children}
      </div>
    </motion.section>
  );
}

// Document Viewer Modal
function DocumentViewer({ analysis, context, zoom, setZoom, onClose, scrollRef }: any) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${analysis?.companyName || "Company"} - GTM Analysis</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 20px; color: #0f172a; }
              h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
              th { background: #f8fafc; }
              @media print { body { max-width: 100%; } }
            </style>
          </head>
          <body>
            ${renderMarkdownToHtml(analysis, context)}
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${analysis?.companyName || "Company"} - GTM Analysis</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; color: #0f172a; line-height: 1.6; }
            h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
            h2 { margin-top: 32px; margin-bottom: 16px; color: #1e293b; }
            h3 { margin-top: 24px; margin-bottom: 12px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; }
            .journey-stage { margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
          </style>
        </head>
        <body>
          ${renderMarkdownToHtml(analysis, context)}
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.companyName || "company"}-gtm-analysis.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="GTM Analysis Document Viewer"
    >
      {/* Viewer Header */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between bg-slate-900/95">
        <div className="flex items-center gap-4">
          <FileText className="w-6 h-6 text-teal-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">{analysis?.companyName || "Company"} - GTM Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              disabled={zoom <= 50}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </Button>
            <span className="text-slate-300 text-sm w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              disabled={zoom >= 200}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
          <Button
            onClick={handlePrint}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            aria-label="Print or save as PDF"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print/PDF
          </Button>
          <Button
            onClick={handleDownloadHtml}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            aria-label="Download as HTML"
          >
            <Download className="w-4 h-4 mr-1" aria-hidden="true" />
            HTML
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            aria-label="Close document viewer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Viewer Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6"
        style={{ fontSize: `${zoom / 100}rem` }}
      >
        <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-12">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(analysis, context) }} />
        </div>
      </div>
    </motion.div>
  );
}

// Convert analysis to HTML for viewer
function renderMarkdownToHtml(analysis: AnalysisResult | null, context: StoredLeadContext | null): string {
  if (!analysis) return "";

  let html = `
    <h1 style="margin-bottom: 24px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px;">${analysis.companyName || "Company"} - GTM Analysis Playbook</h1>
  `;

  // Input Customer Data section
  html += `<h2 style="margin-top: 32px; margin-bottom: 16px; color: #1e293b;">Input Customer Data</h2>`;
  html += `<p style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 16px; color: #1e3a8a;"><strong>User-Provided</strong>: Data you submitted in the intake form</p>`;
  if (context?.form) {
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    html += `<li><strong>Company Name:</strong> ${context.form.companyName || "Not provided"}</li>`;
    html += `<li><strong>Website:</strong> ${context.form.websiteUrl || "Not provided"}</li>`;
    html += `<li><strong>Contact Name:</strong> ${context.form.name || "Not provided"}</li>`;
    html += `<li><strong>Contact Email:</strong> ${context.form.emailPersonal || "Not provided"}</li>`;
    html += `<li><strong>Target Industries:</strong> ${Array.isArray(context.form.targetIndustries) ? context.form.targetIndustries.join(", ") : "Not provided"}</li>`;
    html += `<li><strong>Target Geographic Regions:</strong> ${Array.isArray(context.form.targetGeographics) ? context.form.targetGeographics.join(", ") : "Not provided"}</li>`;
    html += `<li><strong>ICP Description:</strong> ${context.form.icpDescription || "Not provided"}</li>`;
    html += `</ul>`;
  }

  if (analysis.executiveSummary) {
    html += `<p style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 12px; margin-bottom: 16px; color: #4c1d9d;"><strong>AI-Generated</strong>: Analysis output from DealFlow AI</p>`;
    html += `<h2 style="margin-top: 32px; margin-bottom: 16px; color: #1e293b;">1. Executive Summary</h2>`;
    html += `<p style="line-height: 1.8; color: #334155;">${analysis.executiveSummary}</p>`;
  }

  if (analysis.icpDefinition) {
    html += `<h2 style="margin-top: 32px; margin-bottom: 16px; color: #1e293b;">2. ICP Definition</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Inclusion Criteria</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">${analysis.icpDefinition.inclusionCriteria.map(i => `<li>${i}</li>`).join("")}</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Exclusion Criteria</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">${analysis.icpDefinition.exclusionCriteria.map(i => `<li>${i}</li>`).join("")}</ul>`;
  }

  // Table 1
  if (analysis.table1FirmographicDemographic?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">3. Table 1: Firmographic & Demographic Segmentation</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead>`;
    html += `<tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Priority Tier</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Industry</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Company Size</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">ARR Range</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Location</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Notes</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Primary Cost Driver</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Current Solution Status</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Number of Sites/Teams</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">ESG/Compliance</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    for (let entry of analysis.table1FirmographicDemographic) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${entry.priorityTier}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.industryVertical}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.companySize}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.arrRange}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.location}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.notes}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.primaryCostDriver || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.currentSolutionStatus || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.numberOfSitesTeamsLocations || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.sustainabilityEsgComplianceCommitment || ''}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  // Section 4: Behavioral Traits
  if (analysis.behavioralPsychographicTraits) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">4. Behavioral & Psychographic Traits</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Observable Behavioral Patterns</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">${analysis.behavioralPsychographicTraits.observableBehavioralPatterns.map(b => `<li>${b}</li>`).join("")}</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Core Psychographic Attributes</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">${analysis.behavioralPsychographicTraits.corePsychographicAttributes.map(b => `<li>${b}</li>`).join("")}</ul>`;
  }

  // Table 2
  if (analysis.table2PainPointAnalysis?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">5. Table 2: Pain Point Analysis</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead>`;
    html += `<tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Pain Point</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Severity</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Business Impact</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">DealFlow Solution</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Frequency</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">How Discovered</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Current Solution</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    for (let entry of analysis.table2PainPointAnalysis) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${entry.painPoint}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.severity}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.businessImpact}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight: 600;">${entry.dealFlowAISolution}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.frequencyOfPain || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.howPainIsCurrentlyDiscovered || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.competitorCurrentSolutionInUse || ''}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  // Table 3
  if (analysis.table3DecisionMakerInfluence?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">6. Table 3: Decision-Maker Influence Matrix</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead>`;
    html += `<tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Role</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Influence Score</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Core Role</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Top 3 Priorities</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">DealFlow Messaging</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Preferred Channel</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Primary Objection</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Content Preference</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    for (let entry of analysis.table3DecisionMakerInfluence) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${entry.role}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.influenceScore}/10</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.coreDecisionRole}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.top3Priorities}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight: 600;">${entry.dealFlowAIMessagingFocus}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.preferredContactChannel || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.primaryObjectionType || ''}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.contentFormatPreference || ''}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  // Purchasing Journey
  if (analysis.purchasingJourneyMapping?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">7. Purchasing Journey Mapping</h2>`;
    for (let stage of analysis.purchasingJourneyMapping) {
      html += `<div style="margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">`;
      html += `<h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a;">${stage.stage} <span style="font-weight: 400; color: #64748b;">(${stage.duration})</span></h3>`;
      html += `<p style="line-height: 1.7; color: #334155; margin: 8px 0;"><strong>Customer Actions:</strong> ${stage.customerActions}</p>`;
      html += `<p style="line-height: 1.7; color: #334155; margin: 8px 0;"><strong>Customer Needs:</strong> ${stage.customerNeedsQuestions}</p>`;
      html += `<p style="line-height: 1.7; color: #334155; margin: 8px 0;"><strong>Channel Preferences:</strong> ${stage.channelPreferences}</p>`;
      html += `<p style="line-height: 1.7; color: #334155; margin: 8px 0;"><strong>DealFlow Assets:</strong> ${stage.dealFlowAIAssetsEngagement}</p>`;
      html += `</div>`;
    }
  }

  // Table 4
  if (analysis.table4LeadScoringFramework) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">8. Table 4: Lead Scoring Framework</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead>`;
    html += `<tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Category</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Criterion</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Points</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    for (let entry of analysis.table4LeadScoringFramework.criteria) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${entry.category}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.criterion}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight: 600;">${entry.points}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Qualification Thresholds</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    html += `<li><strong>MQL:</strong> ${analysis.table4LeadScoringFramework.qualificationThresholds.mql}</li>`;
    html += `<li><strong>SQL:</strong> ${analysis.table4LeadScoringFramework.qualificationThresholds.sql}</li>`;
    html += `<li><strong>SAL:</strong> ${analysis.table4LeadScoringFramework.qualificationThresholds.sal}</li>`;
    html += `</ul>`;
  }

  // Table 5
  if (analysis.table5ChannelEffectiveness?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">9. Table 5: Channel Effectiveness Analysis</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead>`;
    html += `<tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Channel</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Best For</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Monthly Volume</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Conversion Rate</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">CAC</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">LTV:CAC</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Budget Allocation</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Optimization</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    for (let entry of analysis.table5ChannelEffectiveness) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${entry.channel}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.icpSegmentsBestFor}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.monthlyLeadVolume}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight: 600;">${entry.conversionRate}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.costPerAcquisition}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight: 600;">${entry.ltvToCacRatio}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.budgetAllocation}</td>`;
      html += `<td style="padding:12px; color: #334155;">${entry.optimizationRecommendations}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  if (analysis.crossTeamAlignmentGuidelines) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">10. Cross-Team Alignment Guidelines</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Shared SLAs</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    if (Array.isArray(analysis.crossTeamAlignmentGuidelines.sharedSLAs)) {
      for (const sla of analysis.crossTeamAlignmentGuidelines.sharedSLAs) {
        if (typeof sla === 'string') {
          html += `<li>${sla}</li>`;
        } else if (typeof sla === 'object' && sla !== null && 'sla' in sla) {
          html += `<li><strong>${sla.sla}</strong> (Owner: ${sla.owner}, Escalation: ${sla.escalationPath})</li>`;
        }
      }
    }
    html += `</ul>`;
    if (analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Weekly Review Meeting</h3>`;
      html += `<p style="line-height: 1.8; color: #334155;">Cadence: ${analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.cadence}, Owner: ${analysis.crossTeamAlignmentGuidelines.weeklyReviewMeeting.owner}</p>`;
    }
    if (analysis.crossTeamAlignmentGuidelines.hotLeadCriteria) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Hot Lead Criteria</h3>`;
      html += `<p style="line-height: 1.8; color: #334155;">${analysis.crossTeamAlignmentGuidelines.hotLeadCriteria}</p>`;
    }
  }

  if (analysis.icpValidationChecklist) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">11. ICP Validation Checklist</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Pre-Qualification Checklist</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (let item of analysis.icpValidationChecklist.preQualificationChecklist) {
      html += `<li>${item}</li>`;
    }
    html += `</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Data Sources for Validation</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (let source of analysis.icpValidationChecklist.dataSourcesForValidation) {
      html += `<li>${source}</li>`;
    }
    html += `</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">ICP Update Triggers</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (let trigger of analysis.icpValidationChecklist.icpUpdateTriggers) {
      html += `<li>${trigger}</li>`;
    }
    html += `</ul>`;
    if (analysis.icpValidationChecklist.quarterlyReviewOwner) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Quarterly Review Owner</h3>`;
      html += `<p style="line-height:1.8; color: #334155;">${analysis.icpValidationChecklist.quarterlyReviewOwner}</p>`;
    }
    if (analysis.icpValidationChecklist.scoringThresholdForRevision) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Scoring Threshold for Revision</h3>`;
      html += `<p style="line-height:1.8; color: #334155;">${analysis.icpValidationChecklist.scoringThresholdForRevision}</p>`;
    }
    if (analysis.icpValidationChecklist.reviewChecklist?.length) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Review Checklist</h3>`;
      html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
      for (let item of analysis.icpValidationChecklist.reviewChecklist) {
        html += `<li>${item}</li>`;
      }
      html += `</ul>`;
    }
  }

  // New Sections
  if (analysis.sectionACompetitiveLandscape?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">A. Competitive Landscape</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead><tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Competitor</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Core Offering</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Key Weakness</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Our Differentiator</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Positioning</th>`;
    html += `</tr></thead>`;
    html += `<tbody>`;
    for (const comp of analysis.sectionACompetitiveLandscape) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${comp.competitorName}</td>`;
      html += `<td style="padding:12px; color: #334155;">${comp.coreOffering}</td>`;
      html += `<td style="padding:12px; color: #334155;">${comp.keyWeakness}</td>`;
      html += `<td style="padding:12px; color: #0f172a; font-weight:600;">${comp.companyDifferentiator}</td>`;
      html += `<td style="padding:12px; color: #334155;">${comp.positioningStatement}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  if (analysis.sectionBMessagingAndPositioning?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">B. Messaging & Positioning</h2>`;
    for (const msg of analysis.sectionBMessagingAndPositioning) {
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">${msg.painPoint}</h3>`;
      html += `<p style="line-height: 1.7; color: #334155;"><strong>Value Pillar:</strong> ${msg.valuePillar}</p>`;
      html += `<p style="line-height: 1.7; color: #334155;"><strong>Hook:</strong> ${msg.hookLine}</p>`;
      html += `<p style="line-height: 1.7; color: #334155;"><strong>Proof:</strong> ${msg.supportingProofPoint}</p>`;
      html += `<p style="line-height: 1.7; color: #334155;"><strong>CTA:</strong> ${msg.cta}</p>`;
      if (msg.personaMessaging?.length) {
        html += `<h4 style="margin-top: 16px; margin-bottom:8px; color:#1e293b;">Persona-Specific Messaging</h4>`;
        html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
        for (const pm of msg.personaMessaging) {
          html += `<li><strong>${pm.persona}:</strong> ${pm.messaging}</li>`;
        }
        html += `</ul>`;
      }
    }
  }

  if (analysis.sectionCObjectionHandlingMatrix?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">C. Objection Handling Matrix</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead><tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Objection</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Persona</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Response</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Supporting Asset</th>`;
    html += `</tr></thead>`;
    html += `<tbody>`;
    for (const obj of analysis.sectionCObjectionHandlingMatrix) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${obj.objection}</td>`;
      html += `<td style="padding:12px; color: #334155;">${obj.personaMostLikelyToRaiseIt}</td>`;
      html += `<td style="padding:12px; color: #334155;">${obj.responseFramework}</td>`;
      html += `<td style="padding:12px; color: #334155;">${obj.supportingAsset}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  if (analysis.sectionDTamSamSom) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">D. TAM/SAM/SOM</h2>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    html += `<li><strong>TAM:</strong> ${analysis.sectionDTamSamSom.tam}</li>`;
    html += `<li><strong>SAM:</strong> ${analysis.sectionDTamSamSom.sam}</li>`;
    html += `<li><strong>SOM:</strong> ${analysis.sectionDTamSamSom.som}</li>`;
    html += `</ul>`;
  }

  if (analysis.sectionEPartnerAndChannelStrategy) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">E. Partner & Channel Strategy</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Referral Partners</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (const p of analysis.sectionEPartnerAndChannelStrategy.referralPartners) {
      html += `<li>${p}</li>`;
    }
    html += `</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Partner Incentive Model</h3>`;
    html += `<p style="line-height:1.8; color: #334155;">${analysis.sectionEPartnerAndChannelStrategy.partnerIncentiveModel}</p>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Co-Marketing Opportunities</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (const o of analysis.sectionEPartnerAndChannelStrategy.coMarketingOpportunities) {
      html += `<li>${o}</li>`;
    }
    html += `</ul>`;
  }

  if (analysis.sectionFRiskRegister?.length) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">F. Risk Register</h2>`;
    html += `<table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
    html += `<thead><tr style="border-bottom:2px solid #e2e8f0;">`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Risk</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Likelihood</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Impact</th>`;
    html += `<th style="text-align:left; padding:12px; background:#f8fafc; color: #0f172a;">Mitigation</th>`;
    html += `</tr></thead>`;
    html += `<tbody>`;
    for (const risk of analysis.sectionFRiskRegister) {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
      html += `<td style="padding:12px; color: #334155;">${risk.risk}</td>`;
      html += `<td style="padding:12px; color: #334155;">${risk.likelihood}</td>`;
      html += `<td style="padding:12px; color: #334155;">${risk.impact}</td>`;
      html += `<td style="padding:12px; color: #334155;">${risk.mitigation}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
  }

  if (analysis.campaignSuccessMetrics) {
    html += `<h2 style="margin-top:32px; margin-bottom:16px; color:#1e293b;">Campaign Success Metrics</h2>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Pipeline Targets by Tier</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (const t of analysis.campaignSuccessMetrics.pipelineGeneratedTargetByTier) {
      html += `<li><strong>${t.tier}:</strong> ${t.target}</li>`;
    }
    html += `</ul>`;
    html += `<p style="line-height:1.8; color: #334155;"><strong>MQL → SQL Conversion Target:</strong> ${analysis.campaignSuccessMetrics.mqlToSqlConversionRateTarget}</p>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">CAC Targets by Channel</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (const c of analysis.campaignSuccessMetrics.cacTargetByChannel) {
      html += `<li><strong>${c.channel}:</strong> ${c.target}</li>`;
    }
    html += `</ul>`;
    html += `<h3 style="margin-top:24px; margin-bottom:12px; color:#0f172a;">Deal Velocity Benchmarks</h3>`;
    html += `<ul style="margin-left:24px; margin-bottom:16px; line-height:1.8; color: #334155;">`;
    for (const t of analysis.campaignSuccessMetrics.dealVelocityBenchmarkByTier) {
      html += `<li><strong>${t.tier}:</strong> ${t.days} days</li>`;
    }
    html += `</ul>`;
  }

  return html;
}

// Legacy display for backward compatibility
function LegacyGTMDisplay({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md md:col-span-1">
          <CardHeader><CardTitle className="text-xs uppercase text-slate-400">GTM Health Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-white mb-4 flex items-baseline gap-1">
              {analysis.healthScore} <span className="text-xl text-slate-500 font-semibold">/100</span>
            </div>
            <Progress value={analysis.healthScore} className="h-2" />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md md:col-span-2">
          <CardHeader><CardTitle className="text-xs uppercase text-slate-400">Complete GTM Plan</CardTitle></CardHeader>
          <CardContent><p className="text-base leading-relaxed text-slate-300 font-medium">{analysis.gtmPlan}</p></CardContent>
        </Card>
      </div>
      <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
        <CardHeader className="border-b border-white/5"><CardTitle className="text-lg font-bold text-white">Comprehensive Brand Overview</CardTitle></CardHeader>
        <CardContent className="p-6"><p className="text-sm text-slate-300 leading-relaxed">{analysis.comprehensiveBrandOverview}</p></CardContent>
      </Card>
    </div>
  );
}

