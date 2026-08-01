# Generic & Business-Category Dynamic IntakeForm Guide

The `IntakeForm` component (`components/IntakeForm.tsx`) is a fully dynamic, schema-driven, WCAG 2.1 accessible, themeable, and business-agnostic form engine. It enables developers to create multi-step or single-step intake forms for **any business category** (SaaS, Retail, Manufacturing, Professional Services, Healthcare, etc.) without modifying core component code.

---

## Key Features

1. **Business Category Selection & Dynamic Conditional Logic**:
   - Step 1 presents a primary **Business Category** selector (`businessCategory`: SaaS, Retail/E-Commerce, Manufacturing & Hardware, Professional Services & Consulting, Healthcare & Life Sciences, Other).
   - Form steps and fields dynamically re-evaluate so customers only answer questions aligned with their industry.
2. **Tailored Go-To-Market Analysis Workflow Triggering**:
   - Submissions automatically segment input data and attach `analysisWorkflowTrigger` tags:
     - `saas` $\rightarrow$ `saas_gtm_analysis`
     - `retail` $\rightarrow$ `retail_pos_analysis`
     - `manufacturing` $\rightarrow$ `manufacturing_supplychain_analysis`
     - `professional_services` $\rightarrow$ `professional_services_analysis`
     - `healthcare` $\rightarrow$ `healthcare_compliance_analysis`
     - `other` $\rightarrow$ `general_gtm_analysis`
3. **Comprehensive Input Controls**:
   - `text`, `email`, `url`, `number`, `date`
   - `select` (dropdown)
   - `checkbox` (single boolean toggle)
   - `checkbox-group` (multi-select grid with optional "Other specify" text inputs)
   - `radio` (radio button selection group)
   - `textarea`
   - `file` (drag-and-drop file uploader with preview & removal)
4. **Flexible Event Hooks**: Seamlessly integrate with any API backend or CRM system via `onSubmit`, `onStepChange`, `onFieldChange`, `onValidationError`, and `onComplete`.
5. **Built-in Validation & Customer Satisfaction Benchmarks**: Mandatory fields cover core identity, operational metrics (footfall, MOQ, utilization, ARR), competitive moat, and CSAT/NPS benchmarks (+NPS score, CSAT %, churn %, support SLA).
6. **WCAG 2.1 Accessibility & Themeability**: WAI-ARIA attributes (`aria-invalid`, `aria-describedby`, `aria-required`, `role="alert"`), full keyboard navigation (`Tab`, `Enter`, `Space`), responsive 12-column grid layouts (`gridSpan`), and theme customization (`theme` prop).
7. **Pre-Built Business Presets**: Includes out-of-the-box configurations for **Manufacturing**, **Retail**, **Professional Services**, **SaaS**, and **Universal GTM** (`lib/intake-form-presets.ts`).

---

## Quick Start Example

### 1. Using a Pre-Built Business Preset

```tsx
import { IntakeForm } from "@/components/IntakeForm";

export default function ManufacturingOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#090a0f] p-8 flex justify-center items-center">
      <IntakeForm
        preset="manufacturing"
        onComplete={(res) => console.log("Manufacturing Form Completed:", res)}
      />
    </main>
  );
}
```

### 2. Universal Dynamic Intake Form with Category-Driven Workflow Triggering

```tsx
import { IntakeForm } from "@/components/IntakeForm";

export default function UniversalIntakePage() {
  return (
    <IntakeForm
      preset="gtm"
      onComplete={(result) => {
        // Automatically contains businessCategory, industrySegment, and analysisWorkflowTrigger
        console.log("Analysis Triggered:", result.analysisWorkflowTrigger);
      }}
    />
  );
}
```

---

## Analysis Workflow Triggering Payload Example

When a user selects **SaaS & Cloud Software** and submits the form, the output payload automatically formats data for tailored GTM report generation:

```json
{
  "businessCategory": "saas",
  "industrySegment": "saas",
  "analysisWorkflowTrigger": "saas_gtm_analysis",
  "companyName": "CloudPulse AI",
  "contactName": "Jane Doe",
  "contactEmail": "jane@cloudpulse.io",
  "saasArrMrr": "$120,000 MRR / $1.44M ARR",
  "activeSeatsCount": 1500,
  "cloudProvider": ["Amazon Web Services (AWS)", "Cloudflare"],
  "deploymentModel": "Multi-Tenant Public Cloud",
  "netPromoterScoreNps": "+48 NPS",
  "customerSatisfactionCsat": "96% CSAT",
  "churnRatePercent": "1.2% monthly",
  "customerSupportSla": "< 15 minutes",
  "source": "gtm-intake-form"
}
```

---

## Cross-Industry Preset Reference

Available in `lib/intake-form-presets.ts`:

1. **`gtm` (`defaultGtmFormConfig`)**: Dynamic category selector + category-specific conditional steps (SaaS, Retail, Manufacturing, Professional Services, Healthcare) + Common Credibility, Market Demographics, Competitive Moat, and CSAT benchmarks.
2. **`manufacturing` (`manufacturingFormConfig`)**: Plant identity, OEM/ODM production models, monthly unit capacity, MOQ thresholds, lead times, and quality defect rate targets.
3. **`retail` (`retailFormConfig`)**: Retail channel (brick & mortar, D2C, omnichannel), POS system (Square, Toast, Lightspeed, Shopify POS), store locations, inventory turnover, and footfall volume.
4. **`professional_services` (`professionalServicesFormConfig`)**: Practice areas, fee earner count, billable utilization %, fixed-fee vs hourly billing models, budget ranges, and conflict checks.
5. **`saas` (`saasFormConfig`)**: Cloud deployment architecture (AWS, GCP, Azure), seat count, multi-tenant deployment, SAML SSO, and enterprise security compliance (SOC 2, GDPR).

---

## Verification & Functional Testing

Automated tests are available in `tests/intake-form-generic.test.ts` and integrated into `npm test`:

```bash
npx tsx tests/intake-form-generic.test.ts
```

Output:
```
ALL GENERIC & CROSS-INDUSTRY INTAKE FORM TESTS PASSED SUCCESSFULLY!
```
