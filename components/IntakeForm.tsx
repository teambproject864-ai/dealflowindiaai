"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  intakeSchema,
  type IntakeFormData,
  getRevenueAgentCatalog,
} from "@/lib/types";
import { saveLeadContext } from "@/lib/lead-context";
import { saveLeadOffline } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, File, X, CheckCircle2 } from "lucide-react";
import { IconArrowLeft, IconArrowRight } from "@/components/gtm/GtmIcons";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

// --- Custom field options as per user's request ---
const certificationOptions = [
  "GDPR", "ISO 27001", "SOC 2", "HIPAA", "PCI DSS", "Other (Specify)"
];
const socialOptions = [
  "LinkedIn", "YouTube", "X (Twitter)", "Facebook", "Instagram", "Industry Communities", "Not Active"
];
const publishingOptions = [
  "Daily", "Multiple Times per Week", "Weekly", "Monthly", "Occasionally", "Rarely/Never"
];
const riskReversalOptions = [
  "Performance-Based Pricing", "Milestone-Based Billing", "Money-Back Guarantee", "Pilot Program", "Free Trial", "None", "Other (Specify)"
];
const timeToStartOptions = [
  "Same Day", "Within 1–3 Days", "Within 1 Week", "Within 2–4 Weeks", "More than 1 Month"
];
const primaryCtaOptions = [
  "Book a Call", "Schedule a Demo", "Free Audit", "Download Resource", "Sign Up for Trial", "Consultation Request", "Other"
];
const outreachAssets = [
  "Loom Video", "One-pager", "Mini Case Study", "Pitch Deck", "Checklist", "Whitepaper", "Audit Report", "Other"
];
const targetIndustries = [
  "SaaS", "FinTech", "Healthcare", "Manufacturing", "Retail", "Logistics", "Education", "Real Estate", "IT Services", "E-commerce", "Other"
];
const targetCompanySizes = [
  "Startup (1–10 Employees)", "Early Stage (11–50 Employees)", "Growth Stage (51–200 Employees)", "Mid-Market (201–1000 Employees)", "Enterprise (1000+ Employees)"
];
const targetRegions = [
  "North America", "Europe", "United Kingdom", "APAC", "Middle East", "LATAM", "Africa", "Global"
];
const decisionMakers = [
  "Founder", "CEO", "COO", "CTO", "CIO", "VP Sales", "VP Marketing", "Head of Operations", "Procurement", "HR Leadership", "Other"
];
const buyingTriggers = [
  "Funding Rounds", "Leadership Changes", "Hiring Growth", "Expansion into New Markets", "Technology Adoption", "Mergers & Acquisitions", "Compliance Deadlines", "Product Launches", "Other"
];
const techTools = [
  "Apollo", "HubSpot", "Salesforce", "Outreach", "Lemlist", "Clay", "Instantly", "Salesloft", "Zoho CRM", "Pipedrive", "Other"
];
const giftCardOptions = ["Yes", "No", "Depends on the Prospect"];
const salesChannelOptions = [
  "Direct Sales (In-Person / Field)",
  "Inside Sales (Remote / SDR-led)",
  "E-commerce / Self-Serve",
  "Channel Partners / Resellers",
  "Referral Program",
  "Affiliate Marketing",
  "Marketplaces",
  "Other (Specify)"
];
const complianceFrameworkOptions = [
  "GDPR (EU)",
  "CCPA / CPRA (California)",
  "HIPAA (Healthcare)",
  "SOC 2 Type I/II",
  "ISO 27001",
  "PCI DSS (Payments)",
  "FERPA (Education)",
  "FINRA / SEC (Financial)",
  "NIST 800-53 (US Gov)",
  "Other (Specify)"
];

// --- Empty Initial State, including defaults for schema-required fields ---
const empty: Partial<IntakeFormData> & Record<string, any> = {
  // --- User-specified fields ---
  name: "",
  additionalEmail: "",
  companyName: "",
  websiteUrl: "",
  emailPersonal: "",

  caseStudies: "",
  uploadedDocuments: [],
  certifications: [],
  certificationsOther: "",
  trustFactors: "",

  socialPlatforms: [],
  linkedInContent: "",
  publishingFrequency: "",
  offerPromise: "",
  irresistibleHook: "",
  painPoint: "",

  riskReversal: [],
  riskReversalOther: "",
  timeToStart: "",
  primaryCta: "",
  primaryCtaOther: "",
  minimumAsset: [],
  minimumAssetOther: "",
  objectionsHandling: "",
  emailSequenceThemes: "",
  giftCard: "",

  icpDescription: "",
  targetIndustries: [],
  targetIndustriesOther: "",
  targetCompanySizes: [],
  targetGeographicRegionsText: "", // User wants this as a TEXT AREA
  decisionMakers: [],
  decisionMakersOther: "",
  buyingTriggers: [],
  buyingTriggersOther: "",

  currentTools: [],
  currentToolsOther: "",
  additionalNotes: "",

  // --- Schema-required defaults (backward compatibility) ---
  jobTitle: "Not specified",
  headquartersCountry: "Not specified",
  headquartersCity: "Not specified",
  companyDescription: "Not specified",
  productsServices: "Not specified",
  primaryOutcome: "Not specified",
  keyChallenges: "Not specified",
  uniqueValueProp: "Not specified",
  successStories: "Not specified",
  customerTestimonials: "Not specified",
  credibilityFactors: "Not specified",
  contentTypes: [],
  riskReductions: [],
  timeToValue: "Not specified",
  targetRevenues: ["Not specified"],
  preferredLanguages: ["English"],
  buyingRoles: ["Not specified"],
  budgetDepartments: ["Not specified"],
  targetSeniorities: ["Not specified"],
  prospectTechnologies: "Not specified",
  commonObjections: "Not specified",
  overcomeObjections: "Not specified",
  messagingThemes: "Not specified",
  targetGeographics: [], // Missing required field
  buyingSignals: [], // Missing required field

  // --- NEW MANDATORY FIELDS: Market Sizing & Financials ---
  currentArr: "",
  tamSamSom: "",
  marketSharePercent: "",
  companyGrowthRatePercent: "",
  cacCustomerAcquisitionCost: "",
  ltvToCacRatio: "",
  churnRatePercent: "",
  netPromoterScoreNps: "",

  // --- NEW MANDATORY: Competitive Landscape ---
  topCompetitors: "",
  competitiveAdvantageMoat: "",
  differentiatorsVsCompetitors: "",
  pricingVsCompetitors: "",
  competitorThreatLevel: "Medium",

  // --- NEW MANDATORY: Pricing Model Validation ---
  pricingModel: "Subscription (Recurring)",
  averageDealSizeAcv: "",
  pricingTiersStructure: "",
  willingnessToPayFeedback: "",
  discountStrategy: "",

  // --- NEW MANDATORY: Channel Strategy Development ---
  currentSalesChannels: [],
  currentSalesChannelsOther: "",
  currentMarketingChannelMix: "",
  idealChannelMix: "",
  partnerReferralPrograms: "No active program",

  // --- NEW MANDATORY: Risk Mitigation Planning ---
  keyBusinessRisks: "",
  riskMitigationPlans: "",
  complianceRequirements: [],
  complianceRequirementsOther: "",
  dataPrivacySecurityMeasures: "",
};

const stepTitles = [
  "Company Information",
  "Proof of Results & Credibility",
  "Brand Presence & Positioning",
  "Offer & Sales Process",
  "Ideal Customer Profile",
  "Tech Stack & Outreach",
  "Market Sizing & Financials",
  "Competitive Landscape",
  "Pricing Model Validation",
  "Channel Strategy",
  "Risk Mitigation & Compliance"
];

export function IntakeForm({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);

  const { user } = useCurrentUser();
  const [availableAgents, setAvailableAgents] = useState<Array<{ key: string; name: string; fullName?: string }>>([]);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        if (data.success && Array.isArray(data.agents)) {
          setAvailableAgents(data.agents);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic agents for intake form:", e);
      }
    }
    fetchAgents();
  }, []);

  useEffect(() => {
    if (user) {
      setData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        emailPersonal: prev.emailPersonal || user.email || "",
      }));
    }
  }, [user]);

  // Helper: Toggle array items (for checkboxes)
  function toggleArrayItem(key: string, item: string) {
    setData((prev) => {
      const currentArray = (prev[key] as string[]) || [];
      return {
        ...prev,
        [key]: currentArray.includes(item)
          ? currentArray.filter((i) => i !== item)
          : [...currentArray, item],
      };
    });
  }

  // File upload handling
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((f) => f.name);
      setData((prev) => ({
        ...prev,
        uploadedDocuments: [...(prev.uploadedDocuments || []), ...filesArray],
      }));
    }
  }
  function removeUploadedDocument(index: number) {
    setData((prev) => ({
      ...prev,
      uploadedDocuments: (prev.uploadedDocuments || []).filter((_, i) => i !== index),
    }));
  }

  // Step validation
  function validateStep(): boolean {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!data.name?.trim()) e.name = "Full name is required";
      if (!data.emailPersonal?.trim()) e.emailPersonal = "Primary email is required";
      if (!data.companyName?.trim()) e.companyName = "Company name is required";
      if (!data.websiteUrl?.trim()) e.websiteUrl = "Company website is required";
    } else if (step === 1) {
      if (!data.caseStudies?.trim()) e.caseStudies = "Please share at least three case studies";
      if (!data.trustFactors?.trim()) e.trustFactors = "Please explain why prospects should trust your company";
    } else if (step === 2) {
      if (data.socialPlatforms.length === 0) e.socialPlatforms = "Select at least one option";
      if (!data.publishingFrequency) e.publishingFrequency = "Content publishing frequency is required";
      if (!data.offerPromise?.trim()) e.offerPromise = "Please share your offer promise";
      if (!data.painPoint?.trim()) e.painPoint = "Please share the pain point your offer solves";
    } else if (step === 3) {
      if (!data.timeToStart) e.timeToStart = "Please select how quickly customers can get started";
      if (!data.primaryCta) e.primaryCta = "Please select your primary CTA";
      if (!data.objectionsHandling?.trim()) e.objectionsHandling = "Please share common objections and how you address them";
      if (!data.giftCard) e.giftCard = "Please select your answer";
    } else if (step === 4) {
      if (!data.icpDescription?.trim()) e.icpDescription = "Please describe your ICP";
      if ((data.targetIndustries || []).length === 0) e.targetIndustries = "Select at least one industry";
      if ((data.targetCompanySizes || []).length === 0) e.targetCompanySizes = "Select at least one company size";
      if (!data.targetGeographicRegionsText?.trim()) e.targetGeographicRegionsText = "Please specify target geographic regions";
      if (data.decisionMakers.length === 0) e.decisionMakers = "Select at least one decision maker";
    } else if (step === 5) {
      // Tech Stack & Outreach
      if ((data.currentTools || []).includes("Other") && !data.currentToolsOther?.trim()) {
        e.currentToolsOther = "Please specify the 'Other' outreach/CRM tool";
      }
    } else if (step === 6) {
      // Market Sizing & Financials
      if (!data.currentArr?.trim()) e.currentArr = "Current ARR / Revenue is required";
      if (!data.tamSamSom?.trim()) e.tamSamSom = "TAM / SAM / SOM is required";
      if (!data.marketSharePercent?.trim()) e.marketSharePercent = "Market share % is required";
      if (!data.companyGrowthRatePercent?.trim()) e.companyGrowthRatePercent = "Growth rate % is required";
      if (!data.cacCustomerAcquisitionCost?.trim()) e.cacCustomerAcquisitionCost = "CAC is required";
      if (!data.ltvToCacRatio?.trim()) e.ltvToCacRatio = "LTV:CAC ratio is required";
      if (!data.churnRatePercent?.trim()) e.churnRatePercent = "Churn rate % is required";
      if (!data.netPromoterScoreNps?.trim()) e.netPromoterScoreNps = "NPS is required";
    } else if (step === 7) {
      // Competitive Landscape
      if (!data.topCompetitors?.trim()) e.topCompetitors = "Top competitors are required";
      if (!data.competitiveAdvantageMoat?.trim()) e.competitiveAdvantageMoat = "Competitive advantage / moat is required";
      if (!data.differentiatorsVsCompetitors?.trim()) e.differentiatorsVsCompetitors = "Key differentiators are required";
      if (!data.pricingVsCompetitors?.trim()) e.pricingVsCompetitors = "Pricing vs competitors is required";
    } else if (step === 8) {
      // Pricing Model Validation
      if (!data.pricingModel) e.pricingModel = "Pricing model selection is required";
      if (!data.averageDealSizeAcv?.trim()) e.averageDealSizeAcv = "Average deal size / ACV is required";
      if (!data.pricingTiersStructure?.trim()) e.pricingTiersStructure = "Pricing tiers structure is required";
      if (!data.willingnessToPayFeedback?.trim()) e.willingnessToPayFeedback = "Willingness-to-pay feedback is required";
      if (!data.discountStrategy?.trim()) e.discountStrategy = "Discount strategy is required";
    } else if (step === 9) {
      // Channel Strategy
      if ((data.currentSalesChannels || []).length === 0) e.currentSalesChannels = "Select at least one sales channel";
      if ((data.currentSalesChannels || []).includes("Other (Specify)") && !data.currentSalesChannelsOther?.trim()) {
        e.currentSalesChannelsOther = "Please specify the 'Other' sales channel";
      }
      if (!data.currentMarketingChannelMix?.trim()) e.currentMarketingChannelMix = "Current marketing channel mix is required";
      if (!data.idealChannelMix?.trim()) e.idealChannelMix = "Ideal channel mix is required";
      if (!data.partnerReferralPrograms) e.partnerReferralPrograms = "Partner / referral program status is required";
    } else if (step === 10) {
      // Risk Mitigation & Compliance
      if (!data.keyBusinessRisks?.trim()) e.keyBusinessRisks = "Key business risks are required";
      if (!data.riskMitigationPlans?.trim()) e.riskMitigationPlans = "Risk mitigation plans are required";
      if ((data.complianceRequirements || []).length === 0) e.complianceRequirements = "Select at least one compliance framework";
      if ((data.complianceRequirements || []).includes("Other (Specify)") && !data.complianceRequirementsOther?.trim()) {
        e.complianceRequirementsOther = "Please specify the 'Other' compliance framework";
      }
      if (!data.dataPrivacySecurityMeasures?.trim()) e.dataPrivacySecurityMeasures = "Data privacy & security measures are required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // --- Handle Submit ---
  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setSchemaErrors([]);

    // --- Map user's form data to schema fields ---
    const submissionData: any = {
      ...data,
      website: data.websiteUrl, // Backward compatibility
      brandTrust: data.trustFactors,
      contentAndPosting: `Frequency: ${data.publishingFrequency}, LinkedIn content: ${data.linkedInContent || "Not specified"}`,
      offerPromise: data.offerPromise,
      painPoint: data.painPoint,
      timeToValue: data.timeToStart,
      timeToGetStarted: data.timeToStart,
      irresistibleOffer: data.irresistibleHook,
      targetCompanySize: data.targetCompanySizes?.[0] || "SMB",
      targetGeographics: data.targetGeographicRegionsText.split(",").map((s: string) => s.trim()), // Map to required targetGeographics
      targetRegions: data.targetGeographicRegionsText.split(",").map((s: string) => s.trim()), // Convert text area to array for schema
      targetDecisionMakers: data.decisionMakers?.join(", "),
      keyBuyingTriggers: data.buyingTriggers,
      buyingSignals: data.buyingTriggers, // Map to required buyingSignals
      currentOutreachTools: data.currentTools,
      primaryCampaignCta: data.primaryCta,
      assetsAvailable: data.minimumAsset,
      coldEmailSequence: data.emailSequenceThemes,
      giftCardOffer: data.giftCard,
    };

    // Validate against zod schema
    const fullValidation = intakeSchema.safeParse(submissionData);
    if (!fullValidation.success) {
      const flatErrors = fullValidation.error.flatten().fieldErrors;
      const e: Record<string, string> = {};
      const schemaErrorList: string[] = [];
      Object.entries(flatErrors).forEach(([key, messages]) => {
        if (messages?.length) {
          e[key] = messages[0];
          schemaErrorList.push(`${key}: ${messages[0]}`);
        }
      });
      setErrors(e);
      setSchemaErrors(schemaErrorList);
      setSubmitting(false);
      console.error("Schema validation failed:", fullValidation.error);
      return;
    }

    // Combine validated schema data with original user input (including targetGeographicRegionsText)
    const combinedData = {
      ...fullValidation.data,
      targetGeographicRegionsText: data.targetGeographicRegionsText,
    };

    // --- Submit (online/offline) ---
    try {
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      const leadPayload = {
        ...combinedData, // Include all data for full storage
        companyName: combinedData.companyName,
        contactName: combinedData.name,
        contactEmail: combinedData.emailPersonal,
        contactPhone: "", // We don't collect phone in intake form yet, so leave empty
        source: "intake_form",
      };
      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      });
      const result = await res.json();
      if (result.success && result.leadId) {
        saveLeadContext(combinedData as any, null);
        await saveLeadOffline(result.leadId, combinedData as any, null, true);
        // Skip agent selection step, go directly to analysis!
        if (onComplete) {
          onComplete();
        } else {
          router.push(`/analysis?leadId=${result.leadId}`);
        }
      } else {
        toast.error(result.error || "Failed to save lead");
        setSubmitting(false);
      }
    } catch (error) {
      console.warn("API save failed, caching offline:", error);
      const tempLeadId = "offline-" + Math.random().toString(36).substring(2, 11);
      saveLeadContext(combinedData as any, null);
      await saveLeadOffline(tempLeadId, combinedData as any, null, false);
      router.push(`/analysis?leadId=${tempLeadId}`);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Step Navigation ---
  function next() {
    if (!validateStep()) return;
    if (step === stepTitles.length - 1) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
      setErrors({});
    }
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
    setSchemaErrors([]);
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-[#24252a] bg-[#111219]/60 p-6 md:p-8 relative overflow-hidden">
      
      {/* Header and Step Indicators */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24252a]/60 pb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c]">
            Step {step + 1} of {stepTitles.length}
          </p>
          <h2 className="text-xl font-display font-light text-white tracking-tight mt-1">{stepTitles[step]}</h2>
        </div>
        <div className="flex gap-1.5 w-full sm:w-32 items-center">
          {stepTitles.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 transition-all duration-300 ${
                i <= step ? "bg-[#d4a017]" : "bg-[#24252a]"
              }`}
            />
          ))}
        </div>
      </div>

      {schemaErrors.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-rose-950/20 border border-rose-800/40 p-4 mb-6 rounded-md text-xs text-rose-300 relative z-10"
        >
          <p className="font-semibold mb-1 text-rose-400">Please correct the following fields:</p>
          <ul className="list-disc pl-4 text-rose-300 space-y-0.5">
            {schemaErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="space-y-6 relative z-10 min-h-[340px]"
        >
          {/* --- Step 1: Company Information --- */}
          {step === 0 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Company Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-350">Full Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder="John Doe"
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-xs text-red-400 font-light">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPersonal" className="text-xs font-semibold text-slate-350">Primary Email</Label>
                  <Input
                    id="emailPersonal"
                    type="email"
                    value={data.emailPersonal}
                    onChange={(e) => setData({ ...data, emailPersonal: e.target.value })}
                    placeholder="john@company.com"
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                  />
                  {errors.emailPersonal && <p className="text-xs text-red-400 font-light">{errors.emailPersonal}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalEmail" className="text-xs font-semibold text-slate-350">Secondary Email (Optional)</Label>
                <Input
                  id="additionalEmail"
                  type="email"
                  value={data.additionalEmail}
                  onChange={(e) => setData({ ...data, additionalEmail: e.target.value })}
                  placeholder="operations@company.com"
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                />
                <p className="text-[10px] text-slate-400 font-light">We will copy this address on onboarding updates and GTM reports.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-semibold text-slate-350">Company Name</Label>
                  <Input
                    id="companyName"
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    placeholder="Acme Corp"
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                  />
                  {errors.companyName && <p className="text-xs text-red-400 font-light">{errors.companyName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-xs font-semibold text-slate-350">Company Website</Label>
                  <Input
                    id="websiteUrl"
                    value={data.websiteUrl}
                    onChange={(e) => setData({ ...data, websiteUrl: e.target.value })}
                    placeholder="https://acme.com"
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                  />
                  {errors.websiteUrl && <p className="text-xs text-red-400 font-light">{errors.websiteUrl}</p>}
                </div>
              </div>
            </div>
          )}
          {/* --- Step 2: Proof of Results & Credibility --- */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Proof of Results & Credibility
              </h3>

              <div className="space-y-2">
                <Label htmlFor="caseStudies" className="text-xs font-semibold text-slate-350">
                  Share at least three case studies with measurable outcomes:
                </Label>
                <Textarea
                  id="caseStudies"
                  value={data.caseStudies}
                  onChange={(e) => setData({ ...data, caseStudies: e.target.value })}
                  placeholder="Case 1: Grew revenue by 40%... Case 2: Reduced churn... (Include customer quotes or success stories)"
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[110px]"
                />
                {errors.caseStudies && <p className="text-xs text-red-400 font-light">{errors.caseStudies}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-study-upload" className="text-xs font-semibold text-slate-350">Upload Supporting Documents</Label>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Click to upload case study documents"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#24252a] hover:border-[#8a704c] bg-[#16181f]/40 rounded-lg p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload className="mx-auto h-7 w-7 text-[#d4a017] mb-2" aria-hidden="true" />
                  <p className="text-xs font-semibold text-white">Drag & drop files here or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, PNG, MP4 up to 50MB</p>
                  <input
                    id="case-study-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="sr-only"
                  />
                </div>
                {(data.uploadedDocuments || []).length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
                    {(data.uploadedDocuments || []).map((doc: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-[#16181f] border border-[#24252a] rounded px-3 py-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <File className="h-3.5 w-3.5 text-[#d4a017] flex-shrink-0" />
                          <span className="truncate">{doc}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeUploadedDocument(idx); }} className="text-slate-500 hover:text-red-400 p-0.5 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-355">Certifications & Compliance Standards</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {certificationOptions.map((c) => (
                    <div key={c} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox
                        id={`cert-${c}`}
                        checked={(data.certifications || []).includes(c)}
                        onCheckedChange={() => toggleArrayItem("certifications", c)}
                      />
                      <label htmlFor={`cert-${c}`} className="text-xs text-slate-300 cursor-pointer select-none">
                        {c}
                      </label>
                    </div>
                  ))}
                </div>
                {(data.certifications || []).includes("Other (Specify)") && (
                  <Input
                    placeholder="Specify other certification..."
                    value={data.certificationsOther}
                    onChange={(e) => setData({ ...data, certificationsOther: e.target.value })}
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trustFactors" className="text-xs font-semibold text-slate-355">
                  Why should prospects trust your company? (Social proof, reviews, guarantees)
                </Label>
                <Input
                  id="trustFactors"
                  value={data.trustFactors}
                  onChange={(e) => setData({ ...data, trustFactors: e.target.value })}
                  placeholder="G2 leadership badges, 99% SLA uptime, references..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                />
                {errors.trustFactors && <p className="text-xs text-red-400 font-light">{errors.trustFactors}</p>}
              </div>
            </div>
          )}

          {/* --- Step 3: Brand Presence & Positioning --- */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Brand Presence & Positioning
              </h3>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">Which social platforms is your company most active on?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {socialOptions.map((s) => (
                    <div key={s} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox
                        id={`social-${s}`}
                        checked={(data.socialPlatforms || []).includes(s)}
                        onCheckedChange={() => toggleArrayItem("socialPlatforms", s)}
                      />
                      <label htmlFor={`social-${s}`} className="text-xs text-slate-300 cursor-pointer select-none">
                        {s}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.socialPlatforms && <p className="text-xs text-red-400 font-light">{errors.socialPlatforms}</p>}
              </div>

              {(data.socialPlatforms || []).includes("LinkedIn") && (
                <div className="space-y-2">
                  <Label htmlFor="linkedInContent" className="text-xs font-semibold text-slate-350">What type of content do you share on LinkedIn?</Label>
                  <Textarea
                    id="linkedInContent"
                    value={data.linkedInContent || ""}
                    onChange={(e) => setData({ ...data, linkedInContent: e.target.value })}
                    placeholder="We publish client case studies, industry trend commentary, etc..."
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[70px]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="publishingFrequency" className="text-xs font-semibold text-slate-350">How consistently do you publish content?</Label>
                <Select value={data.publishingFrequency} onValueChange={(v) => setData({ ...data, publishingFrequency: v })}>
                  <SelectTrigger className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-[#111219] border-[#24252a] text-[#f4f3f0]">
                    {publishingOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-[#16181f] focus:bg-[#16181f] focus:text-white">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.publishingFrequency && <p className="text-xs text-red-400 font-light">{errors.publishingFrequency}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerPromise" className="text-xs font-semibold text-slate-350">What is the clear, no-fluff promise your offer delivers?</Label>
                <Textarea
                  id="offerPromise"
                  value={data.offerPromise}
                  onChange={(e) => setData({ ...data, offerPromise: e.target.value })}
                  placeholder="Example: We build a fully functional outbound agent campaign in 7 days..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[70px]"
                />
                {errors.offerPromise && <p className="text-xs text-red-400 font-light">{errors.offerPromise}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="irresistibleHook" className="text-xs font-semibold text-slate-350">Do you have an irresistible hook or offer?</Label>
                <Textarea
                  id="irresistibleHook"
                  value={data.irresistibleHook}
                  onChange={(e) => setData({ ...data, irresistibleHook: e.target.value })}
                  placeholder="Example: Get a free customized target account dataset when you book a meeting..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[70px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="painPoint" className="text-xs font-semibold text-slate-355">What pain point does your offer solve in one sentence?</Label>
                <Textarea
                  id="painPoint"
                  value={data.painPoint}
                  onChange={(e) => setData({ ...data, painPoint: e.target.value })}
                  placeholder="Sales reps waste hours manually dialing and writing personalized emails..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[70px]"
                />
                {errors.painPoint && <p className="text-xs text-red-400 font-light">{errors.painPoint}</p>}
              </div>
            </div>
          )}

          {/* --- Step 4: Offer & Sales Process --- */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Offer & Sales Process
              </h3>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">Do you offer any risk-reversal mechanisms?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {riskReversalOptions.map((rr) => (
                    <div key={rr} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox
                        id={`rr-${rr}`}
                        checked={(data.riskReversal || []).includes(rr)}
                        onCheckedChange={() => toggleArrayItem("riskReversal", rr)}
                      />
                      <label htmlFor={`rr-${rr}`} className="text-xs text-slate-300 cursor-pointer select-none">
                        {rr}
                      </label>
                    </div>
                  ))}
                </div>
                {(data.riskReversal || []).includes("Other (Specify)") && (
                  <Input
                    placeholder="Specify other guarantee..."
                    value={data.riskReversalOther}
                    onChange={(e) => setData({ ...data, riskReversalOther: e.target.value })}
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeToStart" className="text-xs font-semibold text-slate-350">How quickly can a customer get started with your offer?</Label>
                <Select value={data.timeToStart} onValueChange={(v) => setData({ ...data, timeToStart: v })}>
                  <SelectTrigger className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-[#111219] border-[#24252a] text-[#f4f3f0]">
                    {timeToStartOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-[#16181f] focus:bg-[#16181f] focus:text-white">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timeToStart && <p className="text-xs text-red-400 font-light">{errors.timeToStart}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCta" className="text-xs font-semibold text-slate-355">What is your primary Call-to-Action (CTA) for this campaign?</Label>
                <Select value={data.primaryCta} onValueChange={(v) => setData({ ...data, primaryCta: v })}>
                  <SelectTrigger className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-[#111219] border-[#24252a] text-[#f4f3f0]">
                    {primaryCtaOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-[#16181f] focus:bg-[#16181f] focus:text-white">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primaryCta && <p className="text-xs text-red-400 font-light">{errors.primaryCta}</p>}
                {data.primaryCta === "Other" && (
                  <Input
                    placeholder="Specify other CTA..."
                    value={data.primaryCtaOther}
                    onChange={(e) => setData({ ...data, primaryCtaOther: e.target.value })}
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">What is the minimum viable outreach asset we can share?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {outreachAssets.map((oa) => (
                    <div key={oa} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox
                        id={`asset-${oa}`}
                        checked={(data.minimumAsset || []).includes(oa)}
                        onCheckedChange={() => toggleArrayItem("minimumAsset", oa)}
                      />
                      <label htmlFor={`asset-${oa}`} className="text-xs text-slate-300 cursor-pointer select-none">
                        {oa}
                      </label>
                    </div>
                  ))}
                </div>
                {(data.minimumAsset || []).includes("Other") && (
                  <Input
                    placeholder="Specify other outreach asset..."
                    value={data.minimumAssetOther}
                    onChange={(e) => setData({ ...data, minimumAssetOther: e.target.value })}
                    className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectionsHandling" className="text-xs font-semibold text-slate-355">What objections do prospects most commonly raise, and how do you address them?</Label>
                <Textarea
                  id="objectionsHandling"
                  value={data.objectionsHandling}
                  onChange={(e) => setData({ ...data, objectionsHandling: e.target.value })}
                  placeholder="Objection details and responses..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[80px]"
                />
                {errors.objectionsHandling && <p className="text-xs text-red-400 font-light">{errors.objectionsHandling}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSequenceThemes" className="text-xs font-semibold text-slate-355">If you were writing a 5-email outbound sequence, what messaging points would you include?</Label>
                <Textarea
                  id="emailSequenceThemes"
                  value={data.emailSequenceThemes}
                  onChange={(e) => setData({ ...data, emailSequenceThemes: e.target.value })}
                  placeholder="Messaging and proof points..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="giftCard" className="text-xs font-semibold text-slate-350">Offer a small thank-you incentive (e.g. $50 gift card) for research calls?</Label>
                <Select value={data.giftCard} onValueChange={(v) => setData({ ...data, giftCard: v })}>
                  <SelectTrigger className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="bg-[#111219] border-[#24252a] text-[#f4f3f0]">
                    {giftCardOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-[#16181f] focus:bg-[#16181f] focus:text-white">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.giftCard && <p className="text-xs text-red-400 font-light">{errors.giftCard}</p>}
              </div>
            </div>
          )}

          {/* --- Step 5: Ideal Customer Profile --- */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Ideal Customer Profile
              </h3>

              <div className="space-y-2">
                <Label htmlFor="icpDescription" className="text-xs font-semibold text-slate-355">Who is your Ideal Customer Profile (ICP)?</Label>
                <Textarea
                  id="icpDescription"
                  value={data.icpDescription}
                  onChange={(e) => setData({ ...data, icpDescription: e.target.value })}
                  placeholder="Describe your ICP in detail..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[90px]"
                />
                {errors.icpDescription && <p className="text-xs text-red-400 font-light">{errors.icpDescription}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-355">Target Industry Verticals</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {targetIndustries.map((ind) => (
                      <div key={ind} className="flex items-center space-x-2 rounded border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                        <Checkbox
                          id={`ind-${ind}`}
                          checked={(data.targetIndustries || []).includes(ind)}
                          onCheckedChange={() => toggleArrayItem("targetIndustries", ind)}
                        />
                        <label htmlFor={`ind-${ind}`} className="text-xs text-slate-300 cursor-pointer select-none">
                          {ind}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.targetIndustries && <p className="text-xs text-red-400 font-light">{errors.targetIndustries}</p>}
                  {(data.targetIndustries || []).includes("Other") && (
                    <Input
                      placeholder="Specify other industry..."
                      value={data.targetIndustriesOther}
                      onChange={(e) => setData({ ...data, targetIndustriesOther: e.target.value })}
                      className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-355">Target Company Sizes</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {targetCompanySizes.map((sz) => (
                      <div key={sz} className="flex items-center space-x-2 rounded border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                        <Checkbox
                          id={`size-${sz}`}
                          checked={(data.targetCompanySizes || []).includes(sz)}
                          onCheckedChange={() => toggleArrayItem("targetCompanySizes", sz)}
                        />
                        <label htmlFor={`size-${sz}`} className="text-xs text-slate-300 cursor-pointer select-none truncate">
                          {sz}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.targetCompanySizes && <p className="text-xs text-red-400 font-light">{errors.targetCompanySizes}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetGeographicRegionsText" className="text-xs font-semibold text-slate-355">Target Geographic Regions (comma separated)</Label>
                <Textarea
                  id="targetGeographicRegionsText"
                  value={data.targetGeographicRegionsText}
                  onChange={(e) => setData({ ...data, targetGeographicRegionsText: e.target.value })}
                  placeholder="North America, Europe, APAC..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[60px]"
                />
                {errors.targetGeographicRegionsText && <p className="text-xs text-red-400 font-light">{errors.targetGeographicRegionsText}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-355">Key Decision Maker Roles</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[130px] overflow-y-auto pr-1">
                    {decisionMakers.map((dm) => (
                      <div key={dm} className="flex items-center space-x-2 rounded border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                        <Checkbox
                          id={`dm-${dm}`}
                          checked={(data.decisionMakers || []).includes(dm)}
                          onCheckedChange={() => toggleArrayItem("decisionMakers", dm)}
                        />
                        <label htmlFor={`dm-${dm}`} className="text-xs text-slate-300 cursor-pointer select-none">
                          {dm}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.decisionMakers && <p className="text-xs text-red-400 font-light">{errors.decisionMakers}</p>}
                  {(data.decisionMakers || []).includes("Other") && (
                    <Input
                      placeholder="Specify other decision maker..."
                      value={data.decisionMakersOther}
                      onChange={(e) => setData({ ...data, decisionMakersOther: e.target.value })}
                      className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-355">Target Buying Triggers</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[130px] overflow-y-auto pr-1">
                    {buyingTriggers.map((bt) => (
                      <div key={bt} className="flex items-center space-x-2 rounded border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                        <Checkbox
                          id={`bt-${bt}`}
                          checked={(data.buyingTriggers || []).includes(bt)}
                          onCheckedChange={() => toggleArrayItem("buyingTriggers", bt)}
                        />
                        <label htmlFor={`bt-${bt}`} className="text-xs text-slate-300 cursor-pointer select-none">
                          {bt}
                        </label>
                      </div>
                    ))}
                  </div>
                  {(data.buyingTriggers || []).includes("Other") && (
                    <Input
                      placeholder="Specify other trigger..."
                      value={data.buyingTriggersOther}
                      onChange={(e) => setData({ ...data, buyingTriggersOther: e.target.value })}
                      className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 mt-2"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- Step 6: Tech Stack & Outreach --- */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Tech Stack & Outreach
              </h3>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">What tools or platforms do you currently use for outreach/CRM?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {techTools.map((tool) => (
                    <div key={tool} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox
                        id={`tool-${tool}`}
                        checked={(data.currentTools || []).includes(tool)}
                        onCheckedChange={() => toggleArrayItem("currentTools", tool)}
                      />
                      <label htmlFor={`tool-${tool}`} className="text-xs text-slate-300 cursor-pointer select-none">
                        {tool}
                      </label>
                    </div>
                  ))}
                </div>
                {(data.currentTools || []).includes("Other") && (
                  <div className="space-y-1 mt-2">
                    <Input
                      placeholder="Specify other tool..."
                      value={data.currentToolsOther}
                      onChange={(e) => setData({ ...data, currentToolsOther: e.target.value })}
                      className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
                    />
                    {errors.currentToolsOther && <p className="text-xs text-red-400 font-light">{errors.currentToolsOther}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedAgent" className="text-xs font-semibold text-slate-355">Assigned AI Revenue Agent / Specialist</Label>
                <select
                  id="assignedAgent"
                  value={data.assignedAgentId || ""}
                  onChange={(e) => setData({ ...data, assignedAgentId: e.target.value })}
                  className="w-full bg-[#16181f] border border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md px-3 py-2.5 text-xs transition-colors"
                >
                  <option value="">Auto-Assign Fair Optimal Agent (Default)</option>
                  {availableAgents.map((ag) => (
                    <option key={ag.key} value={ag.key}>
                      {ag.fullName || ag.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">List dynamically updates when agents are added or deleted by administrators.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes" className="text-xs font-semibold text-slate-355">Additional Notes or Special Requirements</Label>
                <Textarea
                  id="additionalNotes"
                  value={data.additionalNotes}
                  onChange={(e) => setData({ ...data, additionalNotes: e.target.value })}
                  placeholder="Tell us any other parameters, details, or custom workflow ideas..."
                  className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[110px]"
                />
              </div>
            </div>
          )}

          {/* --- NEW Step 7: Market Sizing & Financials --- */}
          {step === 6 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Market Sizing & Financial Performance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentArr" className="text-xs font-semibold text-slate-350">Current Annual Revenue / ARR</Label>
                  <Input id="currentArr" value={data.currentArr} onChange={(e) => setData({ ...data, currentArr: e.target.value })} placeholder="e.g., $1.2M ARR" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.currentArr && <p className="text-xs text-red-400 font-light">{errors.currentArr}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyGrowthRatePercent" className="text-xs font-semibold text-slate-350">Company Growth Rate (%)</Label>
                  <Input id="companyGrowthRatePercent" value={data.companyGrowthRatePercent} onChange={(e) => setData({ ...data, companyGrowthRatePercent: e.target.value })} placeholder="e.g., 45% YoY" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.companyGrowthRatePercent && <p className="text-xs text-red-400 font-light">{errors.companyGrowthRatePercent}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tamSamSom" className="text-xs font-semibold text-slate-350">TAM / SAM / SOM Market Sizing</Label>
                <Textarea id="tamSamSom" value={data.tamSamSom} onChange={(e) => setData({ ...data, tamSamSom: e.target.value })} placeholder={`TAM: $X B (global market)\nSAM: $Y M (addressable market)\nSOM: $Z M (serviceable obtainable in 3 years)`} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.tamSamSom && <p className="text-xs text-red-400 font-light">{errors.tamSamSom}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketSharePercent" className="text-xs font-semibold text-slate-350">Current Market Share (%)</Label>
                  <Input id="marketSharePercent" value={data.marketSharePercent} onChange={(e) => setData({ ...data, marketSharePercent: e.target.value })} placeholder="e.g., 0.2%" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.marketSharePercent && <p className="text-xs text-red-400 font-light">{errors.marketSharePercent}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netPromoterScoreNps" className="text-xs font-semibold text-slate-350">Net Promoter Score (NPS)</Label>
                  <Input id="netPromoterScoreNps" value={data.netPromoterScoreNps} onChange={(e) => setData({ ...data, netPromoterScoreNps: e.target.value })} placeholder="e.g., +42" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.netPromoterScoreNps && <p className="text-xs text-red-400 font-light">{errors.netPromoterScoreNps}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cacCustomerAcquisitionCost" className="text-xs font-semibold text-slate-350">CAC ($)</Label>
                  <Input id="cacCustomerAcquisitionCost" value={data.cacCustomerAcquisitionCost} onChange={(e) => setData({ ...data, cacCustomerAcquisitionCost: e.target.value })} placeholder="$1,200" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.cacCustomerAcquisitionCost && <p className="text-xs text-red-400 font-light">{errors.cacCustomerAcquisitionCost}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltvToCacRatio" className="text-xs font-semibold text-slate-350">LTV : CAC Ratio</Label>
                  <Input id="ltvToCacRatio" value={data.ltvToCacRatio} onChange={(e) => setData({ ...data, ltvToCacRatio: e.target.value })} placeholder="3.5 : 1" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.ltvToCacRatio && <p className="text-xs text-red-400 font-light">{errors.ltvToCacRatio}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churnRatePercent" className="text-xs font-semibold text-slate-350">Churn Rate (%)</Label>
                  <Input id="churnRatePercent" value={data.churnRatePercent} onChange={(e) => setData({ ...data, churnRatePercent: e.target.value })} placeholder="2.1% monthly" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.churnRatePercent && <p className="text-xs text-red-400 font-light">{errors.churnRatePercent}</p>}
                </div>
              </div>
            </div>
          )}

          {/* --- NEW Step 8: Competitive Landscape --- */}
          {step === 7 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Competitive Landscape Assessment
              </h3>

              <div className="space-y-2">
                <Label htmlFor="topCompetitors" className="text-xs font-semibold text-slate-350">Top 3-5 Competitors & Key Strengths/Weaknesses</Label>
                <Textarea id="topCompetitors" value={data.topCompetitors} onChange={(e) => setData({ ...data, topCompetitors: e.target.value })} placeholder={`1. Competitor A: Strength X, Weakness Y\n2. Competitor B: ...\n3. Competitor C: ...`} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[100px]" />
                {errors.topCompetitors && <p className="text-xs text-red-400 font-light">{errors.topCompetitors}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitiveAdvantageMoat" className="text-xs font-semibold text-slate-350">Your Sustainable Competitive Advantage / Moat</Label>
                <Textarea id="competitiveAdvantageMoat" value={data.competitiveAdvantageMoat} onChange={(e) => setData({ ...data, competitiveAdvantageMoat: e.target.value })} placeholder="Network effects, proprietary data, switching costs, patents, brand equity, distribution advantage..." className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.competitiveAdvantageMoat && <p className="text-xs text-red-400 font-light">{errors.competitiveAdvantageMoat}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="differentiatorsVsCompetitors" className="text-xs font-semibold text-slate-350">Key Differentiators vs Competitors</Label>
                <Textarea id="differentiatorsVsCompetitors" value={data.differentiatorsVsCompetitors} onChange={(e) => setData({ ...data, differentiatorsVsCompetitors: e.target.value })} placeholder="Feature differences, pricing advantages, user experience superiority, integrations, support level, speed..." className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.differentiatorsVsCompetitors && <p className="text-xs text-red-400 font-light">{errors.differentiatorsVsCompetitors}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricingVsCompetitors" className="text-xs font-semibold text-slate-350">Pricing Position vs Competitors</Label>
                  <Input id="pricingVsCompetitors" value={data.pricingVsCompetitors} onChange={(e) => setData({ ...data, pricingVsCompetitors: e.target.value })} placeholder="15% more premium / 20% cheaper / same but with more features" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.pricingVsCompetitors && <p className="text-xs text-red-400 font-light">{errors.pricingVsCompetitors}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competitorThreatLevel" className="text-xs font-semibold text-slate-350">Overall Competitive Threat Level</Label>
                  <select id="competitorThreatLevel" value={data.competitorThreatLevel} onChange={(e) => setData({ ...data, competitorThreatLevel: e.target.value })} className="w-full bg-[#16181f] border border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md px-3 py-2.5 text-xs h-10">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* --- NEW Step 9: Pricing Model Validation --- */}
          {step === 8 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Pricing Model Validation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricingModel" className="text-xs font-semibold text-slate-350">Primary Pricing Model</Label>
                  <select id="pricingModel" value={data.pricingModel} onChange={(e) => setData({ ...data, pricingModel: e.target.value })} className="w-full bg-[#16181f] border border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md px-3 py-2.5 text-xs h-10">
                    <option>Subscription (Recurring)</option><option>One-Time Purchase</option><option>Usage-Based</option><option>Freemium</option><option>Tiered</option><option>Hybrid</option><option>Custom / Enterprise</option>
                  </select>
                  {errors.pricingModel && <p className="text-xs text-red-400 font-light">{errors.pricingModel}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageDealSizeAcv" className="text-xs font-semibold text-slate-350">Average Deal Size / ACV</Label>
                  <Input id="averageDealSizeAcv" value={data.averageDealSizeAcv} onChange={(e) => setData({ ...data, averageDealSizeAcv: e.target.value })} placeholder="$24,000 ACV / $5k SMB / $80k enterprise" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                  {errors.averageDealSizeAcv && <p className="text-xs text-red-400 font-light">{errors.averageDealSizeAcv}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingTiersStructure" className="text-xs font-semibold text-slate-350">Pricing Tiers Structure & Features by Tier</Label>
                <Textarea id="pricingTiersStructure" value={data.pricingTiersStructure} onChange={(e) => setData({ ...data, pricingTiersStructure: e.target.value })} placeholder={`Tier 1 - Starter ($X/mo): A, B, C features\nTier 2 - Growth ($Y/mo): +D, +E, +F\nTier 3 - Enterprise (Custom): +G, +H, +SLA`} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[100px]" />
                {errors.pricingTiersStructure && <p className="text-xs text-red-400 font-light">{errors.pricingTiersStructure}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="willingnessToPayFeedback" className="text-xs font-semibold text-slate-350">Customer Willingness-to-Pay Research / Feedback</Label>
                <Textarea id="willingnessToPayFeedback" value={data.willingnessToPayFeedback} onChange={(e) => setData({ ...data, willingnessToPayFeedback: e.target.value })} placeholder="Survey data, win/loss analysis, customer interviews, price sensitivity tests..." className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.willingnessToPayFeedback && <p className="text-xs text-red-400 font-light">{errors.willingnessToPayFeedback}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountStrategy" className="text-xs font-semibold text-slate-350">Discount Strategy & Approval Process</Label>
                <Textarea id="discountStrategy" value={data.discountStrategy} onChange={(e) => setData({ ...data, discountStrategy: e.target.value })} placeholder="What discounts are allowed? Who approves? Thresholds? Promo calendar? Annual vs monthly pricing? Multi-year terms?" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.discountStrategy && <p className="text-xs text-red-400 font-light">{errors.discountStrategy}</p>}
              </div>
            </div>
          )}

          {/* --- NEW Step 10: Channel Strategy --- */}
          {step === 9 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Channel Strategy Development
              </h3>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">Current Sales Channels (Select all that apply)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {salesChannelOptions.map((channel) => (
                    <div key={channel} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox id={`sales-channel-${channel}`} checked={(data.currentSalesChannels || []).includes(channel)} onCheckedChange={() => toggleArrayItem("currentSalesChannels", channel)} />
                      <label htmlFor={`sales-channel-${channel}`} className="text-xs text-slate-300 cursor-pointer select-none">{channel}</label>
                    </div>
                  ))}
                </div>
                {(data.currentSalesChannels || []).includes("Other (Specify)") && (
                  <div className="space-y-1 mt-2">
                    <Input placeholder="Specify other sales channels..." value={data.currentSalesChannelsOther} onChange={(e) => setData({ ...data, currentSalesChannelsOther: e.target.value })} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                    {errors.currentSalesChannelsOther && <p className="text-xs text-red-400 font-light">{errors.currentSalesChannelsOther}</p>}
                  </div>
                )}
                {errors.currentSalesChannels && <p className="text-xs text-red-400 font-light">{errors.currentSalesChannels}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMarketingChannelMix" className="text-xs font-semibold text-slate-350">Current Marketing Channel Performance (% of leads / revenue by channel)</Label>
                <Textarea id="currentMarketingChannelMix" value={data.currentMarketingChannelMix} onChange={(e) => setData({ ...data, currentMarketingChannelMix: e.target.value })} placeholder={`LinkedIn: 40% leads, $18 CAC\nGoogle Ads: 25% leads, $32 CAC\nContent / SEO: 15% leads, $6 CAC\nReferral: 12% leads, $2 CAC\nPartners: 8% leads, $10 CAC`} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[100px]" />
                {errors.currentMarketingChannelMix && <p className="text-xs text-red-400 font-light">{errors.currentMarketingChannelMix}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idealChannelMix" className="text-xs font-semibold text-slate-350">Target / Ideal Channel Mix in 12 Months</Label>
                <Textarea id="idealChannelMix" value={data.idealChannelMix} onChange={(e) => setData({ ...data, idealChannelMix: e.target.value })} placeholder="How would you shift the mix? New channels to test? Channels to scale back? Budget reallocation?" className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[90px]" />
                {errors.idealChannelMix && <p className="text-xs text-red-400 font-light">{errors.idealChannelMix}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerReferralPrograms" className="text-xs font-semibold text-slate-350">Partner / Referral Programs Status</Label>
                <select id="partnerReferralPrograms" value={data.partnerReferralPrograms} onChange={(e) => setData({ ...data, partnerReferralPrograms: e.target.value })} className="w-full bg-[#16181f] border border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] rounded-md px-3 py-2.5 text-xs h-10">
                  <option>Yes, formal program</option><option>Yes, informal</option><option>No active program</option>
                </select>
                {errors.partnerReferralPrograms && <p className="text-xs text-red-400 font-light">{errors.partnerReferralPrograms}</p>}
              </div>
            </div>
          )}

          {/* --- NEW Step 11: Risk Mitigation & Compliance --- */}
          {step === 10 && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
                Risk Mitigation & Compliance Planning
              </h3>

              <div className="space-y-2">
                <Label htmlFor="keyBusinessRisks" className="text-xs font-semibold text-slate-350">Top 5-8 Key Business Risks (Market, Tech, Regulatory, Competitive, Execution)</Label>
                <Textarea id="keyBusinessRisks" value={data.keyBusinessRisks} onChange={(e) => setData({ ...data, keyBusinessRisks: e.target.value })} placeholder={`1. Risk: Description + Likelihood + Impact\n2. Risk: ...`} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[110px]" />
                {errors.keyBusinessRisks && <p className="text-xs text-red-400 font-light">{errors.keyBusinessRisks}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskMitigationPlans" className="text-xs font-semibold text-slate-350">Mitigation Plans & Contingency for Each Risk</Label>
                <Textarea id="riskMitigationPlans" value={data.riskMitigationPlans} onChange={(e) => setData({ ...data, riskMitigationPlans: e.target.value })} placeholder="For each risk above, describe specific mitigation steps, owners, early warning signals, and playbooks if it materializes." className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[110px]" />
                {errors.riskMitigationPlans && <p className="text-xs text-red-400 font-light">{errors.riskMitigationPlans}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-350">Compliance Frameworks You Must Follow</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {complianceFrameworkOptions.map((fw) => (
                    <div key={fw} className="flex items-center space-x-2 rounded-md border border-[#24252a] bg-[#111219]/40 px-3 py-2">
                      <Checkbox id={`compliance-${fw}`} checked={(data.complianceRequirements || []).includes(fw)} onCheckedChange={() => toggleArrayItem("complianceRequirements", fw)} />
                      <label htmlFor={`compliance-${fw}`} className="text-xs text-slate-300 cursor-pointer select-none">{fw}</label>
                    </div>
                  ))}
                </div>
                {(data.complianceRequirements || []).includes("Other (Specify)") && (
                  <div className="space-y-1 mt-2">
                    <Input placeholder="Specify other compliance requirements..." value={data.complianceRequirementsOther} onChange={(e) => setData({ ...data, complianceRequirementsOther: e.target.value })} className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md h-10" />
                    {errors.complianceRequirementsOther && <p className="text-xs text-red-400 font-light">{errors.complianceRequirementsOther}</p>}
                  </div>
                )}
                {errors.complianceRequirements && <p className="text-xs text-red-400 font-light">{errors.complianceRequirements}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataPrivacySecurityMeasures" className="text-xs font-semibold text-slate-350">Data Privacy & Security Measures Currently In Place / Planned</Label>
                <Textarea id="dataPrivacySecurityMeasures" value={data.dataPrivacySecurityMeasures} onChange={(e) => setData({ ...data, dataPrivacySecurityMeasures: e.target.value })} placeholder="Encryption, access controls, audits, backups, incident response, DPA, SSO/SAML, data residency, deletion policies..." className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md min-h-[110px]" />
                {errors.dataPrivacySecurityMeasures && <p className="text-xs text-red-400 font-light">{errors.dataPrivacySecurityMeasures}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- Step Navigation --- */}
      <div className="mt-8 flex justify-between gap-4 border-t border-[#24252a]/60 pt-5 relative z-10">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={back}
            className="border border-[#24252a] bg-[#16181f] hover:bg-[#20232d] text-white hover:text-white rounded-md font-semibold px-5 h-10 transition-colors"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={next}
          disabled={submitting}
          className="bg-[#d4a017] hover:bg-[#c29014] text-[#090a0f] rounded-md font-semibold px-6 h-10 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin animate-none" /> Saving...
            </>
          ) : step === stepTitles.length - 1 ? (
            "Submit"
          ) : (
            <>
              Next <IconArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

