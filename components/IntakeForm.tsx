"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Upload, File, X, Check, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { saveLeadContext } from "@/lib/lead-context";
import { saveLeadOffline } from "@/lib/offlineStore";
import { intakeSchema } from "@/lib/types";
import { getPresetFormConfig } from "@/lib/intake-form-presets";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// TYPES & CONFIGURATION INTERFACES
// ---------------------------------------------------------------------------

export type FormFieldType =
  | "text"
  | "email"
  | "url"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "checkbox-group"
  | "radio"
  | "textarea"
  | "file";

export interface FormFieldOption {
  label: string;
  value: string;
  description?: string;
}

export interface FormValidationRule {
  required?: boolean | string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | { value: RegExp; message: string };
  custom?: (value: any, formData: Record<string, any>) => string | null | undefined | boolean;
}

export interface FormFieldConfig {
  id: string;
  name?: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: (string | FormFieldOption)[];
  validation?: FormValidationRule;
  dependsOn?: {
    fieldId: string;
    value: any | any[];
    operator?: "equals" | "contains" | "not_equals" | "truthy";
  };
  gridSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  acceptFiles?: string;
  allowMultipleFiles?: boolean;
  maxFileSizeBytes?: number;
  otherOptionFieldId?: string;
}

export interface FormStepConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  condition?: (formData: Record<string, any>) => boolean;
}

export interface FormThemeConfig {
  mode?: "dark" | "light" | "custom";
  primaryColor?: string;
  backgroundColor?: string;
  cardBackground?: string;
  borderColor?: string;
  textColor?: string;
  errorColor?: string;
  borderRadius?: string;
  glassmorphism?: boolean;
}

export interface FormLocalizationConfig {
  nextButtonText?: string;
  backButtonText?: string;
  submitButtonText?: string;
  submittingText?: string;
  stepIndicatorText?: (current: number, total: number) => string;
  requiredFieldSuffix?: string;
  dragAndDropText?: string;
  fileLimitText?: string;
  selectPlaceholder?: string;
  defaultRequiredMessage?: string;
  validationErrorTitle?: string;
}

export interface FormConfig {
  id?: string;
  title?: string;
  description?: string;
  steps: FormStepConfig[];
  theme?: FormThemeConfig;
  localization?: FormLocalizationConfig;
}

export interface FormSubmitResult {
  success: boolean;
  data?: any;
  error?: string;
  leadId?: string;
}

export interface IntakeFormProps {
  config?: FormConfig;
  preset?: "gtm" | "retail" | "professional_services" | "saas";
  initialData?: Record<string, any>;
  onSubmit?: (
    formData: Record<string, any>,
    config: FormConfig
  ) => Promise<FormSubmitResult | void> | FormSubmitResult | void;
  onStepChange?: (
    currentStepIndex: number,
    direction: "next" | "back",
    formData: Record<string, any>
  ) => void;
  onFieldChange?: (
    fieldId: string,
    value: any,
    formData: Record<string, any>
  ) => void;
  onValidationError?: (
    errors: Record<string, string>,
    stepIndex: number
  ) => void;
  onComplete?: (submissionResult?: any) => void;
  theme?: FormThemeConfig;
  localization?: FormLocalizationConfig;
  className?: string;
}

// Default localization strings
const DEFAULT_LOCALIZATION: FormLocalizationConfig = {
  nextButtonText: "Next",
  backButtonText: "Back",
  submitButtonText: "Submit",
  submittingText: "Saving...",
  stepIndicatorText: (current, total) => `Step ${current} of ${total}`,
  requiredFieldSuffix: "*",
  dragAndDropText: "Drag & drop files here or click to browse",
  fileLimitText: "Supports PDF, DOCX, PNG, MP4 up to 50MB",
  selectPlaceholder: "Select option...",
  defaultRequiredMessage: "This field is required",
  validationErrorTitle: "Please correct the following errors:",
};

// ---------------------------------------------------------------------------
// HELPER: EVALUATE DEPENDENCY RULES
// ---------------------------------------------------------------------------
function evaluateDependency(
  dependsOn: FormFieldConfig["dependsOn"],
  formData: Record<string, any>
): boolean {
  if (!dependsOn) return true;
  const targetVal = formData[dependsOn.fieldId];
  const operator = dependsOn.operator || "equals";
  const expectedVal = dependsOn.value;

  if (operator === "truthy") {
    return Boolean(targetVal);
  }

  if (operator === "contains") {
    if (Array.isArray(targetVal)) {
      if (Array.isArray(expectedVal)) {
        return expectedVal.some((v) => targetVal.includes(v));
      }
      return targetVal.includes(expectedVal);
    }
    if (typeof targetVal === "string") {
      return targetVal.includes(String(expectedVal));
    }
    return false;
  }

  if (operator === "not_equals") {
    if (Array.isArray(expectedVal)) {
      return !expectedVal.includes(targetVal);
    }
    return targetVal !== expectedVal;
  }

  // default 'equals'
  if (Array.isArray(expectedVal)) {
    return expectedVal.includes(targetVal);
  }
  return targetVal === expectedVal;
}

// Helper: Normalize options format
function normalizeOptions(options?: (string | FormFieldOption)[]): FormFieldOption[] {
  if (!options) return [];
  return options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );
}

// ---------------------------------------------------------------------------
// GENERIC INTAKE FORM COMPONENT
// ---------------------------------------------------------------------------
export function IntakeForm({
  config: providedConfig,
  preset = "gtm",
  initialData = {},
  onSubmit,
  onStepChange,
  onFieldChange,
  onValidationError,
  onComplete,
  theme: themeOverride,
  localization: locOverride,
  className = "",
}: IntakeFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useCurrentUser();

  // 1. Resolve Effective Form Configuration & Localization
  const activeConfig = useMemo(() => {
    return providedConfig || getPresetFormConfig(preset);
  }, [providedConfig, preset]);

  const loc = useMemo(
    () => ({ ...DEFAULT_LOCALIZATION, ...activeConfig.localization, ...locOverride }),
    [activeConfig.localization, locOverride]
  );

  const theme = useMemo(
    () => ({
      primaryColor: "#d4a017",
      backgroundColor: "#111219",
      borderColor: "#24252a",
      textColor: "#f4f3f0",
      errorColor: "#f87171",
      ...activeConfig.theme,
      ...themeOverride,
    }),
    [activeConfig.theme, themeOverride]
  );

  const [stepIndex, setStepIndex] = useState(0);

  // 2. Initialize Form State from field defaults and initialData
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    activeConfig.steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.id] = field.defaultValue;
        } else if (field.type === "checkbox-group" || field.type === "file") {
          defaults[field.id] = [];
        } else if (field.type === "checkbox") {
          defaults[field.id] = false;
        } else {
          defaults[field.id] = "";
        }
      });
    });
    return { ...defaults, ...initialData };
  });

  // 3. Visible Steps calculation (filtering based on step condition)
  const visibleSteps = useMemo(() => {
    return activeConfig.steps.filter(
      (s) => !s.condition || s.condition(formData)
    );
  }, [activeConfig.steps, formData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<
    Array<{ key: string; name: string; fullName?: string }>
  >([]);

  // 4. Fetch dynamic agents if agent selection field exists in current config
  useEffect(() => {
    const hasAgentField = activeConfig.steps.some((s) =>
      s.fields.some((f) => f.id === "assignedAgentId")
    );
    if (!hasAgentField) return;

    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        if (data.success && Array.isArray(data.agents)) {
          setAvailableAgents(data.agents);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic agents:", e);
      }
    }
    fetchAgents();
  }, [activeConfig]);

  // 5. Update user defaults if user session changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        emailPersonal: prev.emailPersonal || user.email || "",
      }));
    }
  }, [user]);

  // Current Step Config
  const currentStep = visibleSteps[stepIndex] || visibleSteps[0];

  // Visible fields in current step based on dependsOn
  const currentStepVisibleFields = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.fields.filter((field) =>
      evaluateDependency(field.dependsOn, formData)
    );
  }, [currentStep, formData]);

  // 6. Generic Value Mutation Handler
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => {
      const nextData = { ...prev, [fieldId]: value };
      if (onFieldChange) {
        onFieldChange(fieldId, value, nextData);
      }
      return nextData;
    });

    // Clear error for edited field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Toggle array item (checkbox-group)
  const toggleArrayItem = (fieldId: string, itemValue: string) => {
    const currentList: string[] = (formData[fieldId] as string[]) || [];
    const nextList = currentList.includes(itemValue)
      ? currentList.filter((i) => i !== itemValue)
      : [...currentList, itemValue];
    handleFieldChange(fieldId, nextList);
  };

  // File Upload Handlers
  const handleFileUpload = (
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => f.name);
      const existing = (formData[fieldId] as string[]) || [];
      handleFieldChange(fieldId, [...existing, ...newFiles]);
    }
  };

  const removeUploadedFile = (fieldId: string, index: number) => {
    const existing = (formData[fieldId] as string[]) || [];
    handleFieldChange(
      fieldId,
      existing.filter((_, i) => i !== index)
    );
  };

  // 7. Step Validation Engine
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    currentStepVisibleFields.forEach((field) => {
      const val = formData[field.id];
      const rules = field.validation;

      if (!rules) return;

      // Required check
      if (rules.required) {
        const reqMsg =
          typeof rules.required === "string"
            ? rules.required
            : loc.defaultRequiredMessage || "This field is required";

        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0) ||
          (field.type === "checkbox" && val === false)
        ) {
          newErrors[field.id] = reqMsg;
          return;
        }
      }

      // Min / Max checks for numbers
      if (field.type === "number" && val !== "" && val !== undefined) {
        const numVal = Number(val);
        if (rules.min !== undefined && numVal < rules.min) {
          newErrors[field.id] = `Minimum value is ${rules.min}`;
          return;
        }
        if (rules.max !== undefined && numVal > rules.max) {
          newErrors[field.id] = `Maximum value is ${rules.max}`;
          return;
        }
      }

      // MinLength / MaxLength checks for text
      if (typeof val === "string" && val.trim().length > 0) {
        if (rules.minLength && val.length < rules.minLength) {
          newErrors[field.id] = `Must be at least ${rules.minLength} characters`;
          return;
        }
        if (rules.maxLength && val.length > rules.maxLength) {
          newErrors[field.id] = `Must be at most ${rules.maxLength} characters`;
          return;
        }
      }

      // Pattern (regex) check
      if (rules.pattern && typeof val === "string" && val.trim().length > 0) {
        const reg =
          rules.pattern instanceof RegExp
            ? rules.pattern
            : rules.pattern.value;
        const msg =
          rules.pattern instanceof RegExp
            ? "Invalid format"
            : rules.pattern.message;

        if (!reg.test(val)) {
          newErrors[field.id] = msg;
          return;
        }
      }

      // Custom validation function
      if (rules.custom) {
        const customRes = rules.custom(val, formData);
        if (typeof customRes === "string") {
          newErrors[field.id] = customRes;
          return;
        }
        if (customRes === false) {
          newErrors[field.id] = "Invalid input";
          return;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (onValidationError) {
        onValidationError(newErrors, stepIndex);
      }
      return false;
    }
    return true;
  };

  // 8. Submit Handler Pipeline
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setSubmitting(true);
    setSchemaErrors([]);

    try {
      if (onSubmit) {
        const customResult = await onSubmit(formData, activeConfig);
        if (customResult && typeof customResult === "object") {
          if (!customResult.success) {
            toast.error(customResult.error || "Form submission failed");
            setSubmitting(false);
            return;
          }
        }
        if (onComplete) onComplete(customResult);
        setSubmitting(false);
        return;
      }

      // Default Built-in Submission Pipeline (DealFlow GTM Save)
      const categoryToWorkflowMap: Record<string, string> = {
        saas: "saas_gtm_analysis",
        retail: "retail_pos_analysis",
        manufacturing: "manufacturing_supplychain_analysis",
        professional_services: "professional_services_analysis",
        healthcare: "healthcare_compliance_analysis",
        other: "general_gtm_analysis",
      };

      const selectedCategory = formData.businessCategory || preset || "other";
      const workflowTrigger = categoryToWorkflowMap[selectedCategory] || "general_gtm_analysis";

      const submissionData: any = {
        ...formData,
        businessCategory: selectedCategory,
        industrySegment: selectedCategory,
        analysisWorkflowTrigger: workflowTrigger,

        // Field mappings
        website: formData.websiteUrl || formData.website || "https://example.com",
        websiteUrl: formData.websiteUrl || formData.website || "https://example.com",
        brandTrust: formData.trustFactors || "Verified Credentials",
        contentAndPosting: `Frequency: ${formData.publishingFrequency || "Weekly"}, Content: ${formData.linkedInContent || "N/A"}`,
        offerPromise: formData.offerPromise || "High performance solutions",
        painPoint: formData.painPoint || "Operational inefficiencies",
        timeToValue: formData.timeToStart || "Same Day",
        timeToGetStarted: formData.timeToStart || "Same Day",
        irresistibleOffer: formData.irresistibleHook || "Free initial consultation",
        targetCompanySize: formData.targetCompanySizes?.[0] || "SMB",
        targetGeographics: (formData.targetGeographicRegionsText || "Global")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        targetRegions: (formData.targetGeographicRegionsText || "Global")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        targetDecisionMakers: formData.decisionMakers?.join(", ") || "Founders & Executives",
        keyBuyingTriggers: formData.buyingTriggers?.length ? formData.buyingTriggers : ["Growth"],
        buyingSignals: formData.buyingTriggers?.length ? formData.buyingTriggers : ["Growth"],
        currentOutreachTools: formData.currentTools?.length ? formData.currentTools : ["HubSpot"],
        primaryCampaignCta: formData.primaryCta || "Book a Call",
        primaryCta: formData.primaryCta || "Book a Call",
        assetsAvailable: formData.minimumAsset?.length ? formData.minimumAsset : ["One-pager"],
        coldEmailSequence: formData.emailSequenceThemes || "Value-first intro",
        giftCardOffer: formData.giftCard || "No",

        // Mandatory Schema Fallbacks for legacy intakeSchema compatibility
        jobTitle: formData.jobTitle || "Executive Leader",
        headquartersCountry: formData.headquartersCountry || "United States",
        headquartersCity: formData.headquartersCity || "New York",
        companyDescription: formData.companyDescription || formData.companyName || "Commercial business enterprise",
        productsServices: formData.productsServices || "B2B products & services",
        primaryOutcome: formData.primaryOutcome || "Accelerated revenue growth",
        keyChallenges: formData.keyChallenges || formData.painPoint || "Market scaling & acquisition",
        uniqueValueProp: formData.uniqueValueProp || formData.offerPromise || "Industry leading performance",
        successStories: formData.caseStudies || formData.successStories || "Proven client case studies available",
        customerTestimonials: formData.trustFactors || formData.customerTestimonials || "Highly rated by industry leaders",
        credibilityFactors: formData.trustFactors || formData.credibilityFactors || "Certified operational standards",
        publishingFrequency: formData.publishingFrequency || "Weekly",
        targetRevenues: formData.targetRevenues?.length ? formData.targetRevenues : ["$1M - $10M"],
        preferredLanguages: formData.preferredLanguages?.length ? formData.preferredLanguages : ["English"],
        buyingRoles: formData.decisionMakers?.length ? formData.decisionMakers : ["CEO / Founder"],
        budgetDepartments: formData.budgetDepartments?.length ? formData.budgetDepartments : ["Executive"],
        targetSeniorities: formData.targetSeniorities?.length ? formData.targetSeniorities : ["C-Level"],
        prospectTechnologies: formData.prospectTechnologies || "Modern Cloud Infrastructure",
        commonObjections: formData.objectionsHandling || formData.commonObjections || "Budget & timing constraints",
        overcomeObjections: formData.objectionsHandling || formData.overcomeObjections || "ROI demonstration & pilot proof",
        messagingThemes: formData.emailSequenceThemes || formData.messagingThemes || "ROI & growth optimization",

        // Financial & Market Sizing Fallbacks
        currentArr: formData.currentArr || formData.saasArrMrr || "$1M ARR",
        tamSamSom: formData.tamSamSom || "TAM: $10B, SAM: $1B, SOM: $100M",
        marketSharePercent: formData.marketSharePercent || "1%",
        companyGrowthRatePercent: formData.companyGrowthRatePercent || "30% YoY",
        cacCustomerAcquisitionCost: formData.cacCustomerAcquisitionCost || "$1,000",
        ltvToCacRatio: formData.ltvToCacRatio || "3:1",
        differentiatorsVsCompetitors: formData.differentiatorsVsCompetitors || formData.competitiveAdvantageMoat || "Superior product quality & speed",
        pricingModel: formData.pricingModel || "Subscription / Project",
        averageDealSizeAcv: formData.averageDealSizeAcv || "$25,000 ACV",
        pricingTiersStructure: formData.pricingTiersStructure || "Standard & Enterprise Tiers",
        willingnessToPayFeedback: formData.willingnessToPayFeedback || "Strong customer willingness to pay for value",
        discountStrategy: formData.discountStrategy || "Annual upfront discount available",
        currentSalesChannels: formData.currentSalesChannels?.length ? formData.currentSalesChannels : ["Direct Inside Sales"],
        currentMarketingChannelMix: formData.currentMarketingChannelMix || "Inbound & Outbound Direct",
        idealChannelMix: formData.idealChannelMix || "Omnichannel scale",
        partnerReferralPrograms: formData.partnerReferralPrograms || "Active referral network",
        complianceRequirements: formData.complianceRequirements?.length ? formData.complianceRequirements : ["GDPR (EU)"],
      };

      // Safe validate against Zod schema for data enrichment
      const fullValidation = intakeSchema.safeParse(submissionData);
      let payloadToSave = submissionData;

      if (!fullValidation.success) {
        console.warn("Legacy schema safeParse notice (proceeding with dynamic submissionData):", fullValidation.error);
      } else {
        payloadToSave = {
          ...fullValidation.data,
          ...submissionData,
        };
      }

      const leadPayload = {
        ...payloadToSave,
        companyName: formData.companyName || formData.storeName || formData.firmName || formData.productName || "Unknown Company",
        contactName: formData.name || formData.contactName || "Unknown Contact",
        contactEmail: formData.emailPersonal || formData.contactEmail || formData.primaryContactEmail || formData.techLeadEmail || "",
        contactPhone: formData.contactPhone || "",
        source: activeConfig.id || "intake_form",
      };

      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      });

      const result = await res.json();
      if (result.success && result.leadId) {
        saveLeadContext(payloadToSave as any, null);
        await saveLeadOffline(result.leadId, payloadToSave as any, null, true);
        if (onComplete) {
          onComplete(result);
        } else {
          router.push(`/analysis?leadId=${result.leadId}`);
        }
      } else {
        toast.error(result.error || "Failed to save lead details");
        setSubmitting(false);
      }
    } catch (error) {
      console.warn("API save failed, caching offline:", error);
      const tempLeadId = "offline-" + Math.random().toString(36).substring(2, 11);
      saveLeadContext(formData as any, null);
      await saveLeadOffline(tempLeadId, formData as any, null, false);
      if (onComplete) {
        onComplete({ success: true, leadId: tempLeadId, data: formData });
      } else {
        router.push(`/analysis?leadId=${tempLeadId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 9. Step Navigation logic
  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (stepIndex === visibleSteps.length - 1) {
      handleSubmit();
    } else {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      setErrors({});
      if (onStepChange) onStepChange(nextIndex, "next", formData);
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    setStepIndex(prevIndex);
    setErrors({});
    setSchemaErrors([]);
    if (onStepChange) onStepChange(prevIndex, "back", formData);
  };

  // Helper: Get grid column span CSS class
  const getGridSpanClass = (span?: number) => {
    switch (span) {
      case 1: return "col-span-1";
      case 2: return "col-span-1 sm:col-span-2";
      case 3: return "col-span-1 sm:col-span-3";
      case 4: return "col-span-1 sm:col-span-4";
      case 5: return "col-span-1 sm:col-span-5";
      case 6: return "col-span-1 sm:col-span-6";
      case 7: return "col-span-1 sm:col-span-7";
      case 8: return "col-span-1 sm:col-span-8";
      case 9: return "col-span-1 sm:col-span-9";
      case 10: return "col-span-1 sm:col-span-10";
      case 11: return "col-span-1 sm:col-span-11";
      case 12:
      default: return "col-span-1 sm:col-span-12";
    }
  };

  // 10. RENDER INDIVIDUAL FIELD ENGINE
  const renderField = (field: FormFieldConfig) => {
    const fieldValue = formData[field.id];
    const fieldError = errors[field.id];
    const options = normalizeOptions(field.options);
    const isRequired = Boolean(field.validation?.required);

    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "number":
      case "date":
        return (
          <div className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={fieldValue ?? ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 rounded-2xl transition-all h-10 text-xs shadow-sm"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? `${field.id}-error` : undefined}
              aria-required={isRequired}
            />
            {field.helpText && <p className="text-[10px] text-[#86868B]">{field.helpText}</p>}
            {fieldError && (
              <p id={`${field.id}-error`} role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <Textarea
              id={field.id}
              value={fieldValue ?? ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 rounded-2xl transition-all min-h-[90px] text-xs shadow-sm"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? `${field.id}-error` : undefined}
              aria-required={isRequired}
            />
            {field.helpText && <p className="text-[10px] text-[#86868B]">{field.helpText}</p>}
            {fieldError && (
              <p id={`${field.id}-error`} role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );

      case "select": {
        // Resolve dynamic options (e.g. for assignedAgentId)
        const activeOptions =
          field.id === "assignedAgentId" && availableAgents.length > 0
            ? [
                { label: "Auto-Assign Fair Optimal Agent (Default)", value: "" },
                ...availableAgents.map((ag) => ({
                  label: ag.fullName || ag.name,
                  value: ag.key,
                })),
              ]
            : options;

        return (
          <div className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <Select
              value={fieldValue ?? ""}
              onValueChange={(val) => handleFieldChange(field.id, val)}
            >
              <SelectTrigger
                id={field.id}
                className="bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 rounded-2xl h-10 text-xs w-full shadow-sm"
                aria-invalid={!!fieldError}
                aria-required={isRequired}
              >
                <SelectValue placeholder={field.placeholder || loc.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7]">
                {activeOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && <p className="text-[10px] text-[#86868B]">{field.helpText}</p>}
            {fieldError && (
              <p id={`${field.id}-error`} role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );
      }

      case "checkbox":
        return (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={field.id}
              checked={Boolean(fieldValue)}
              onCheckedChange={(checked) => handleFieldChange(field.id, Boolean(checked))}
            />
            <label
              htmlFor={field.id}
              className="text-xs text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer select-none font-medium"
            >
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </label>
            {fieldError && (
              <p role="alert" className="text-xs text-[#FF3B30] font-medium ml-2">
                {fieldError}
              </p>
            )}
          </div>
        );

      case "checkbox-group":
        return (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {options.map((opt) => {
                const checked = ((fieldValue as string[]) || []).includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-2 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#161618] px-3 py-2 hover:border-[#0071E3] transition-colors"
                  >
                    <Checkbox
                      id={`${field.id}-${opt.value}`}
                      checked={checked}
                      onCheckedChange={() => toggleArrayItem(field.id, opt.value)}
                    />
                    <label
                      htmlFor={`${field.id}-${opt.value}`}
                      className="text-xs text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer select-none"
                    >
                      {opt.label}
                    </label>
                  </div>
                );
              })}
            </div>
            {field.helpText && <p className="text-[10px] text-[#86868B]">{field.helpText}</p>}
            {fieldError && (
              <p role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    fieldValue === opt.value
                      ? "border-[#0071E3] bg-[#0071E3]/5 shadow-sm"
                      : "border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#161618] hover:border-[#0071E3]/50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="radio"
                      name={field.id}
                      value={opt.value}
                      checked={fieldValue === opt.value}
                      onChange={() => handleFieldChange(field.id, opt.value)}
                      className="text-[#0071E3] focus:ring-[#0071E3]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{opt.label}</p>
                      {opt.description && (
                        <p className="text-[10px] text-[#86868B]">{opt.description}</p>
                      )}
                    </div>
                  </div>
                  {fieldValue === opt.value && (
                    <Check className="h-4 w-4 text-[#0071E3]" />
                  )}
                </label>
              ))}
            </div>
            {fieldError && (
              <p role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );

      case "file": {
        const fileList = (fieldValue as string[]) || [];
        return (
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-upload`} className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {field.label} {isRequired && <span className="text-[#0071E3]">{loc.requiredFieldSuffix}</span>}
            </Label>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Upload files for ${field.label}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-black/[0.08] dark:border-white/[0.12] hover:border-[#0071E3] bg-white dark:bg-[#161618] rounded-3xl p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="mx-auto h-7 w-7 text-[#0071E3] mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{loc.dragAndDropText}</p>
              <p className="text-[10px] text-[#86868B] mt-1">{field.helpText || loc.fileLimitText}</p>
              <input
                id={`${field.id}-upload`}
                type="file"
                ref={fileInputRef}
                accept={field.acceptFiles}
                multiple={field.allowMultipleFiles !== false}
                onChange={(e) => handleFileUpload(field.id, e)}
                className="sr-only"
              />
            </div>
            {fileList.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
                {fileList.map((doc: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl px-3 py-1.5 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File className="h-3.5 w-3.5 text-[#0071E3] shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploadedFile(field.id, idx);
                      }}
                      className="text-[#86868B] hover:text-[#FF3B30] p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fieldError && (
              <p role="alert" className="text-xs text-[#FF3B30] font-medium">
                {fieldError}
              </p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      suppressHydrationWarning
      className={`w-full max-w-3xl rounded-3xl apple-glass-card p-6 md:p-8 relative overflow-hidden shadow-sm ${className}`}
    >
      {/* Header & Multi-Step Progress Indicators */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <p suppressHydrationWarning className="text-[10px] font-semibold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
            {loc.stepIndicatorText!(stepIndex + 1, visibleSteps.length)}
          </p>
          <h2 suppressHydrationWarning className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight mt-1">
            {currentStep?.title}
          </h2>
          {currentStep?.description && (
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] mt-0.5">{currentStep.description}</p>
          )}
        </div>
        <div className="flex gap-1.5 w-full sm:w-36 items-center">
          {visibleSteps.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= stepIndex ? "bg-[#0071E3] dark:bg-[#2997FF]" : "bg-black/[0.08] dark:bg-white/[0.12]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Schema / Validation Alert Region */}
      {schemaErrors.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 p-4 mb-6 rounded-2xl text-xs text-[#D70015] dark:text-[#FF453A] relative z-10"
        >
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {loc.validationErrorTitle}
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            {schemaErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Animated Step Fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="space-y-6 relative z-10 min-h-[300px]"
        >
          <div className="grid grid-cols-12 gap-4">
            {currentStepVisibleFields.map((field) => (
              <div key={field.id} className={getGridSpanClass(field.gridSpan)}>
                {renderField(field)}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step Navigation Bar */}
      <div className="mt-8 flex justify-between gap-4 border-t border-black/[0.06] dark:border-white/[0.08] pt-5 relative z-10">
        {stepIndex > 0 ? (
          <Button
            variant="outline"
            onClick={handleBack}
            className="btn-apple-secondary text-xs h-10 px-5"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" /> {loc.backButtonText}
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={handleNext}
          disabled={submitting}
          className="btn-apple-primary text-xs h-10 px-6"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {loc.submittingText}
            </>
          ) : stepIndex === visibleSteps.length - 1 ? (
            loc.submitButtonText
          ) : (
            <>
              {loc.nextButtonText} <ChevronRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
