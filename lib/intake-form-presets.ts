import {
  FormConfig,
  FormStepConfig,
  FormFieldConfig,
  FormThemeConfig,
  FormLocalizationConfig,
} from "@/components/IntakeForm";

// ---------------------------------------------------------------------------
// BUSINESS CATEGORY OPTIONS
// ---------------------------------------------------------------------------
export const businessCategoryOptions = [
  { label: "SaaS & Cloud Software", value: "saas", description: "B2B / B2C subscription software, web & mobile apps" },
  { label: "Retail & E-Commerce", value: "retail", description: "Physical stores, D2C storefronts, omnichannel, wholesale" },
  { label: "Manufacturing & Hardware", value: "manufacturing", description: "Industrial goods, consumer electronics, OEM/ODM production" },
  { label: "Professional Services & Consulting", value: "professional_services", description: "Legal, accounting, IT advisory, management consulting" },
  { label: "Healthcare & Life Sciences", value: "healthcare", description: "Clinics, digital health, biotech, medical devices" },
  { label: "Other / General Business", value: "other", description: "All other commercial business verticals" },
];

// ---------------------------------------------------------------------------
// 1. DEFAULT UNIVERSAL DYNAMIC INTAKE FORM CONFIGURATION (With Category-Based Conditional Logic)
// ---------------------------------------------------------------------------
export const defaultGtmFormConfig: FormConfig = {
  id: "gtm-intake-form",
  title: "DealFlow.AI Business & Revenue Intake",
  description: "Capture industry-aligned metrics and business parameters for tailored GTM analysis.",
  steps: [
    {
      id: "company-info",
      title: "Core Business Identity & Category",
      description: "Basic identity details and primary business category.",
      fields: [
        {
          id: "businessCategory",
          name: "businessCategory",
          label: "Primary Business Category / Industry Vertical",
          type: "radio",
          options: businessCategoryOptions,
          gridSpan: 12,
          validation: { required: "Please select your primary business category" },
        },
        {
          id: "name",
          name: "name",
          label: "Full Name",
          type: "text",
          placeholder: "John Doe",
          gridSpan: 6,
          validation: { required: "Full name is required" },
        },
        {
          id: "emailPersonal",
          name: "emailPersonal",
          label: "Primary Email",
          type: "email",
          placeholder: "john@company.com",
          gridSpan: 6,
          validation: {
            required: "Primary email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          },
        },
        {
          id: "companyName",
          name: "companyName",
          label: "Company / Organization Name",
          type: "text",
          placeholder: "Acme Corp",
          gridSpan: 6,
          validation: { required: "Company name is required" },
        },
        {
          id: "websiteUrl",
          name: "websiteUrl",
          label: "Company Website",
          type: "url",
          placeholder: "https://acme.com",
          gridSpan: 6,
          validation: { required: "Company website is required" },
        },
        {
          id: "businessModel",
          name: "businessModel",
          label: "Primary Go-To-Market Business Model",
          type: "select",
          options: ["B2B Enterprise", "B2B SMB", "B2C", "B2B2C", "D2C Direct", "Marketplace / Platform"],
          gridSpan: 6,
          validation: { required: "Business model is required" },
        },
        {
          id: "companyStage",
          name: "companyStage",
          label: "Company Growth Stage",
          type: "select",
          options: ["Pre-Revenue / Seed", "Early Growth ($100k-$1M)", "Scale-Up ($1M-$10M)", "Mid-Market ($10M-$50M)", "Enterprise ($50M+)"],
          gridSpan: 6,
          validation: { required: "Company stage is required" },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // INDUSTRY-SPECIFIC CONDITIONAL STEPS
    // -----------------------------------------------------------------------

    // A. SAAS SPECIFIC METRICS
    {
      id: "saas-metrics",
      title: "SaaS Cloud Architecture & Metrics",
      description: "Subsciption revenue metrics, user licensing, and cloud stack.",
      condition: (data) => data.businessCategory === "saas",
      fields: [
        {
          id: "saasArrMrr",
          name: "saasArrMrr",
          label: "Current ARR / MRR",
          type: "text",
          placeholder: "e.g., $120,000 MRR / $1.44M ARR",
          gridSpan: 6,
          validation: { required: "ARR / MRR is required for SaaS companies" },
        },
        {
          id: "activeSeatsCount",
          name: "activeSeatsCount",
          label: "Total Active Seats / Licensed Users",
          type: "number",
          placeholder: "1500",
          gridSpan: 6,
          validation: { required: "Active seat count is required", min: 0 },
        },
        {
          id: "cloudProvider",
          name: "cloudProvider",
          label: "Primary Cloud Infrastructure Provider",
          type: "checkbox-group",
          options: ["Amazon Web Services (AWS)", "Google Cloud Platform (GCP)", "Microsoft Azure", "Cloudflare", "DigitalOcean"],
          gridSpan: 12,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one cloud provider" : null),
          },
        },
        {
          id: "deploymentModel",
          name: "deploymentModel",
          label: "SaaS Deployment Architecture",
          type: "select",
          options: ["Multi-Tenant Public Cloud", "Single-Tenant Dedicated", "Hybrid Cloud", "On-Premises / Air-Gapped"],
          gridSpan: 6,
          validation: { required: "Deployment model is required" },
        },
        {
          id: "releaseVelocity",
          name: "releaseVelocity",
          label: "Software Release Frequency",
          type: "select",
          options: ["Continuous (Multiple times daily)", "Weekly", "Bi-Weekly", "Monthly", "Quarterly"],
          gridSpan: 6,
        },
      ],
    },

    // B. RETAIL & E-COMMERCE SPECIFIC METRICS
    {
      id: "retail-metrics",
      title: "Retail Stores & Inventory Operations",
      description: "Store locations, POS systems, inventory turnover, and footfall.",
      condition: (data) => data.businessCategory === "retail",
      fields: [
        {
          id: "posSystem",
          name: "posSystem",
          label: "Current Point of Sale (POS) System",
          type: "select",
          options: ["Square", "Shopify POS", "Toast", "Lightspeed", "Clover", "NetSuite POS", "Other"],
          gridSpan: 6,
          validation: { required: "POS system is required for retail businesses" },
        },
        {
          id: "storeLocationCount",
          name: "storeLocationCount",
          label: "Number of Physical Store Locations",
          type: "number",
          placeholder: "4",
          gridSpan: 6,
          validation: { required: "Location count is required", min: 0 },
        },
        {
          id: "monthlyFootfall",
          name: "monthlyFootfall",
          label: "Estimated Monthly Store Footfall / Web Traffic",
          type: "text",
          placeholder: "e.g., 35,000 store visitors / 120,000 web sessions",
          gridSpan: 6,
          validation: { required: "Monthly traffic/footfall is required" },
        },
        {
          id: "averageBasketSize",
          name: "averageBasketSize",
          label: "Average Transaction Value (ATV) / Basket Size",
          type: "text",
          placeholder: "e.g., $68 per customer order",
          gridSpan: 6,
          validation: { required: "Average basket size is required" },
        },
        {
          id: "inventoryTurnoverRate",
          name: "inventoryTurnoverRate",
          label: "Annual Inventory Turnover Ratio",
          type: "text",
          placeholder: "e.g., 4.2x turns per year",
          gridSpan: 12,
        },
      ],
    },

    // C. MANUFACTURING & HARDWARE SPECIFIC METRICS
    {
      id: "manufacturing-metrics",
      title: "Manufacturing Capacity & Supply Chain",
      description: "Production capacity, MOQ, lead times, and quality control.",
      condition: (data) => data.businessCategory === "manufacturing",
      fields: [
        {
          id: "productionModel",
          name: "productionModel",
          label: "Manufacturing Model Type",
          type: "radio",
          options: [
            { label: "Original Equipment Manufacturer (OEM)", value: "oem" },
            { label: "Original Design Manufacturer (ODM)", value: "odm" },
            { label: "In-House Proprietary Production Facility", value: "in_house" },
            { label: "Contract Manufacturing Partner", value: "contract_mfg" },
          ],
          gridSpan: 12,
          validation: { required: "Manufacturing model selection is required" },
        },
        {
          id: "monthlyProductionCapacity",
          name: "monthlyProductionCapacity",
          label: "Monthly Maximum Production Capacity (Units)",
          type: "text",
          placeholder: "e.g., 50,000 units / month",
          gridSpan: 6,
          validation: { required: "Production capacity is required" },
        },
        {
          id: "supplyChainLeadTime",
          name: "supplyChainLeadTime",
          label: "Average Supply Chain Fulfillment Lead Time",
          type: "text",
          placeholder: "e.g., 4-6 weeks from order receipt",
          gridSpan: 6,
          validation: { required: "Supply chain lead time is required" },
        },
        {
          id: "minimumOrderQuantityMoq",
          name: "minimumOrderQuantityMoq",
          label: "Minimum Order Quantity (MOQ)",
          type: "text",
          placeholder: "e.g., 500 units per production run",
          gridSpan: 6,
          validation: { required: "MOQ is required" },
        },
        {
          id: "qualityDefectRatePercent",
          name: "qualityDefectRatePercent",
          label: "Target Quality Defect Rate (%)",
          type: "text",
          placeholder: "e.g., < 0.1% PPM defect rate",
          gridSpan: 6,
        },
      ],
    },

    // D. PROFESSIONAL SERVICES SPECIFIC METRICS
    {
      id: "services-metrics",
      title: "Professional Services & Billing Operations",
      description: "Consultant utilization, fee models, and engagement terms.",
      condition: (data) => data.businessCategory === "professional_services",
      fields: [
        {
          id: "feeEarnerCount",
          name: "feeEarnerCount",
          label: "Number of Active Consultants / Fee Earners",
          type: "number",
          placeholder: "15",
          gridSpan: 6,
          validation: { required: "Fee earner count is required", min: 1 },
        },
        {
          id: "billableUtilizationPercent",
          name: "billableUtilizationPercent",
          label: "Target Billable Utilization Rate (%)",
          type: "text",
          placeholder: "e.g., 75% target billable hours",
          gridSpan: 6,
          validation: { required: "Utilization rate is required" },
        },
        {
          id: "billingModel",
          name: "billingModel",
          label: "Primary Commercial Billing Model",
          type: "radio",
          options: [
            { label: "Fixed-Fee Milestone Projects", value: "fixed_fee" },
            { label: "Time & Materials (Hourly / Daily Rate)", value: "time_materials" },
            { label: "Monthly Retainer", value: "monthly_retainer" },
            { label: "Performance / Contingency Fee", value: "contingency" },
          ],
          gridSpan: 12,
          validation: { required: "Billing model is required" },
        },
        {
          id: "averageHourlyRate",
          name: "averageHourlyRate",
          label: "Average Hourly / Day Rate ($)",
          type: "text",
          placeholder: "$250/hr or $2,000/day",
          gridSpan: 6,
          validation: { required: "Average rate is required" },
        },
        {
          id: "conflictCheckRequired",
          name: "conflictCheckRequired",
          label: "Formal Conflict of Interest & Independence Check Required?",
          type: "checkbox",
          defaultValue: true,
          gridSpan: 6,
        },
      ],
    },

    // E. HEALTHCARE & LIFE SCIENCES SPECIFIC METRICS
    {
      id: "healthcare-metrics",
      title: "Healthcare Compliance & Clinical Operations",
      description: "HIPAA standards, EHR integration, and clinical volume.",
      condition: (data) => data.businessCategory === "healthcare",
      fields: [
        {
          id: "patientClientVolume",
          name: "patientClientVolume",
          label: "Monthly Patient / Clinical Client Volume",
          type: "text",
          placeholder: "e.g., 1,200 patient visits / month",
          gridSpan: 6,
          validation: { required: "Patient/client volume is required" },
        },
        {
          id: "ehrSystem",
          name: "ehrSystem",
          label: "Primary EHR / Practice Management Software",
          type: "select",
          options: ["Epic Systems", "Cerner / Oracle Health", "Athenahealth", "Kareo / Tebra", "SimplePractice", "Custom / Other"],
          gridSpan: 6,
          validation: { required: "EHR system selection is required" },
        },
        {
          id: "hipaaComplianceVerified",
          name: "hipaaComplianceVerified",
          label: "HIPAA / HITECH Data Privacy Compliance Verified?",
          type: "checkbox",
          defaultValue: true,
          gridSpan: 12,
        },
      ],
    },

    // -----------------------------------------------------------------------
    // CORE COMMON STEPS FOR ALL BUSINESS CATEGORIES
    // -----------------------------------------------------------------------
    {
      id: "credibility",
      title: "Proof of Results & Credibility",
      description: "Social proof, case studies, and compliance certifications.",
      fields: [
        {
          id: "caseStudies",
          name: "caseStudies",
          label: "Share at least three case studies with measurable outcomes",
          type: "textarea",
          placeholder: "Case 1: Grew revenue by 40%... Case 2: Reduced churn... (Include customer quotes or success stories)",
          gridSpan: 12,
          validation: { required: "Please share at least three case studies" },
        },
        {
          id: "uploadedDocuments",
          name: "uploadedDocuments",
          label: "Upload Supporting Documents",
          type: "file",
          acceptFiles: ".pdf,.docx,.png,.mp4",
          allowMultipleFiles: true,
          helpText: "Supports PDF, DOCX, PNG, MP4 up to 50MB",
          gridSpan: 12,
        },
        {
          id: "certifications",
          name: "certifications",
          label: "Certifications & Compliance Standards",
          type: "checkbox-group",
          options: ["GDPR", "ISO 27001", "SOC 2", "HIPAA", "PCI DSS", "Other (Specify)"],
          otherOptionFieldId: "certificationsOther",
          gridSpan: 12,
        },
        {
          id: "certificationsOther",
          name: "certificationsOther",
          label: "Specify Other Certification",
          type: "text",
          placeholder: "Specify other certification...",
          gridSpan: 12,
          dependsOn: { fieldId: "certifications", value: "Other (Specify)", operator: "contains" },
        },
        {
          id: "trustFactors",
          name: "trustFactors",
          label: "Why should prospects trust your company? (Social proof, reviews, guarantees)",
          type: "text",
          placeholder: "G2 leadership badges, 99% SLA uptime, references...",
          gridSpan: 12,
          validation: { required: "Please explain why prospects should trust your company" },
        },
      ],
    },
    {
      id: "icp-market",
      title: "Target Market Demographics",
      description: "Ideal customer profiles, decision makers, and geographic reach.",
      fields: [
        {
          id: "icpDescription",
          name: "icpDescription",
          label: "Who is your Ideal Customer Profile (ICP)?",
          type: "textarea",
          placeholder: "Describe your target buyer persona, demographics, and key attributes...",
          gridSpan: 12,
          validation: { required: "Please describe your ICP" },
        },
        {
          id: "targetIndustries",
          name: "targetIndustries",
          label: "Target Industry Verticals",
          type: "checkbox-group",
          options: ["SaaS", "FinTech", "Healthcare", "Manufacturing", "Retail", "Logistics", "Education", "Real Estate", "IT Services", "E-commerce", "Other"],
          otherOptionFieldId: "targetIndustriesOther",
          gridSpan: 6,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one industry" : null),
          },
        },
        {
          id: "targetIndustriesOther",
          name: "targetIndustriesOther",
          label: "Specify Other Industry",
          type: "text",
          placeholder: "Specify other industry...",
          gridSpan: 6,
          dependsOn: { fieldId: "targetIndustries", value: "Other", operator: "contains" },
        },
        {
          id: "targetCompanySizes",
          name: "targetCompanySizes",
          label: "Target Company Sizes",
          type: "checkbox-group",
          options: [
            "Startup (1–10 Employees)",
            "Early Stage (11–50 Employees)",
            "Growth Stage (51–200 Employees)",
            "Mid-Market (201–1000 Employees)",
            "Enterprise (1000+ Employees)",
          ],
          gridSpan: 6,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one company size" : null),
          },
        },
        {
          id: "targetGeographicRegionsText",
          name: "targetGeographicRegionsText",
          label: "Target Geographic Regions (comma separated)",
          type: "textarea",
          placeholder: "North America, Europe, APAC...",
          gridSpan: 12,
          validation: { required: "Please specify target geographic regions" },
        },
        {
          id: "decisionMakers",
          name: "decisionMakers",
          label: "Key Decision Maker Roles",
          type: "checkbox-group",
          options: ["Founder", "CEO", "COO", "CTO", "CIO", "VP Sales", "VP Marketing", "Head of Operations", "Procurement", "HR Leadership", "Other"],
          otherOptionFieldId: "decisionMakersOther",
          gridSpan: 6,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one decision maker" : null),
          },
        },
        {
          id: "decisionMakersOther",
          name: "decisionMakersOther",
          label: "Specify Other Decision Maker",
          type: "text",
          placeholder: "Specify other decision maker...",
          gridSpan: 6,
          dependsOn: { fieldId: "decisionMakers", value: "Other", operator: "contains" },
        },
      ],
    },
    {
      id: "competitive-landscape",
      title: "Competitive Landscape & Pricing",
      description: "Top competitors, moat, pricing position, and threat assessment.",
      fields: [
        {
          id: "topCompetitors",
          name: "topCompetitors",
          label: "Top 3-5 Competitors & Key Strengths/Weaknesses",
          type: "textarea",
          placeholder: "1. Competitor A: Strength X, Weakness Y\n2. Competitor B: ...\n3. Competitor C: ...",
          gridSpan: 12,
          validation: { required: "Top competitors are required" },
        },
        {
          id: "competitiveAdvantageMoat",
          name: "competitiveAdvantageMoat",
          label: "Your Sustainable Competitive Advantage / Moat",
          type: "textarea",
          placeholder: "Network effects, proprietary IP, switching costs, patents, brand equity, distribution advantage...",
          gridSpan: 12,
          validation: { required: "Competitive advantage / moat is required" },
        },
        {
          id: "pricingVsCompetitors",
          name: "pricingVsCompetitors",
          label: "Pricing Position vs Competitors",
          type: "text",
          placeholder: "15% premium / 20% value / match pricing",
          gridSpan: 6,
          validation: { required: "Pricing position vs competitors is required" },
        },
        {
          id: "competitorThreatLevel",
          name: "competitorThreatLevel",
          label: "Overall Competitive Threat Level",
          type: "select",
          options: ["Low", "Medium", "High", "Critical"],
          defaultValue: "Medium",
          gridSpan: 6,
        },
      ],
    },
    {
      id: "customer-satisfaction",
      title: "Customer Satisfaction Benchmarks",
      description: "NPS, CSAT scores, retention benchmarks, and customer support SLAs.",
      fields: [
        {
          id: "netPromoterScoreNps",
          name: "netPromoterScoreNps",
          label: "Net Promoter Score (NPS)",
          type: "text",
          placeholder: "e.g., +45 NPS score",
          gridSpan: 6,
          validation: { required: "NPS score benchmark is required" },
        },
        {
          id: "customerSatisfactionCsat",
          name: "customerSatisfactionCsat",
          label: "Customer Satisfaction Score (CSAT %)",
          type: "text",
          placeholder: "e.g., 94% CSAT score",
          gridSpan: 6,
          validation: { required: "CSAT score benchmark is required" },
        },
        {
          id: "churnRatePercent",
          name: "churnRatePercent",
          label: "Customer Churn / Attrition Rate (%)",
          type: "text",
          placeholder: "e.g., 1.5% monthly churn rate",
          gridSpan: 6,
          validation: { required: "Churn rate benchmark is required" },
        },
        {
          id: "customerSupportSla",
          name: "customerSupportSla",
          label: "Customer Support First Response Time SLA",
          type: "select",
          options: ["< 15 minutes", "< 1 hour", "< 4 hours", "< 24 hours", "No formal SLA"],
          gridSpan: 6,
          validation: { required: "Customer support SLA selection is required" },
        },
      ],
    },
    {
      id: "risk-mitigation",
      title: "Risk Mitigation & Compliance",
      description: "Business risks, contingencies, and data security.",
      fields: [
        {
          id: "keyBusinessRisks",
          name: "keyBusinessRisks",
          label: "Top Key Business Risks (Market, Tech, Regulatory, Competitive, Execution)",
          type: "textarea",
          placeholder: "1. Risk: Description + Likelihood + Impact\n2. Risk: ...",
          gridSpan: 12,
          validation: { required: "Key business risks are required" },
        },
        {
          id: "riskMitigationPlans",
          name: "riskMitigationPlans",
          label: "Mitigation Plans & Contingency for Each Risk",
          type: "textarea",
          placeholder: "For each risk above, describe specific mitigation steps and playbooks.",
          gridSpan: 12,
          validation: { required: "Risk mitigation plans are required" },
        },
        {
          id: "dataPrivacySecurityMeasures",
          name: "dataPrivacySecurityMeasures",
          label: "Data Privacy & Security Measures Currently In Place / Planned",
          type: "textarea",
          placeholder: "Encryption, access controls, audits, backups, incident response, DPA, SSO/SAML...",
          gridSpan: 12,
          validation: { required: "Data privacy & security measures are required" },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. RETAIL BUSINESS INTAKE FORM CONFIGURATION
// ---------------------------------------------------------------------------
export const retailFormConfig: FormConfig = {
  id: "retail-intake-form",
  title: "Retail & E-Commerce Business Intake",
  description: "Capture store inventory requirements, point-of-sale systems, and retail growth targets.",
  steps: [
    {
      id: "retail-business-details",
      title: "Store & Brand Details",
      description: "Basic information regarding your retail locations and digital storefront.",
      fields: [
        {
          id: "storeName",
          name: "storeName",
          label: "Retail Brand / Store Name",
          type: "text",
          placeholder: "Aura Boutique & Goods",
          gridSpan: 6,
          validation: { required: "Store name is required" },
        },
        {
          id: "contactEmail",
          name: "contactEmail",
          label: "Manager / Owner Email",
          type: "email",
          placeholder: "manager@auraboutique.com",
          gridSpan: 6,
          validation: {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          },
        },
        {
          id: "businessType",
          name: "businessType",
          label: "Retail Channel Type",
          type: "radio",
          options: [
            { label: "Brick & Mortar Only", value: "brick_mortar" },
            { label: "E-Commerce Direct-to-Consumer (D2C)", value: "ecom_d2c" },
            { label: "Omnichannel (Physical Stores + Online)", value: "omnichannel" },
            { label: "Wholesale & Department Stores", value: "wholesale" },
          ],
          gridSpan: 12,
          validation: { required: "Please select your retail channel type" },
        },
        {
          id: "locationCount",
          name: "locationCount",
          label: "Number of Physical Locations",
          type: "number",
          placeholder: "5",
          gridSpan: 6,
          dependsOn: { fieldId: "businessType", value: ["brick_mortar", "omnichannel"], operator: "equals" },
          validation: { min: 1 },
        },
        {
          id: "ecomPlatform",
          name: "ecomPlatform",
          label: "Primary E-Commerce Platform",
          type: "select",
          options: ["Shopify", "Shopify Plus", "WooCommerce", "Magento / Adobe Commerce", "BigCommerce", "Custom Stack", "None"],
          gridSpan: 6,
          dependsOn: { fieldId: "businessType", value: ["ecom_d2c", "omnichannel"], operator: "equals" },
        },
      ],
    },
    {
      id: "retail-operations",
      title: "Inventory & POS Infrastructure",
      description: "Details on inventory management, supplier lead times, and POS systems.",
      fields: [
        {
          id: "posSystem",
          name: "posSystem",
          label: "Current Point of Sale (POS) System",
          type: "select",
          options: ["Square", "Shopify POS", "Lightspeed", "Clover", "Toast", "Toast POS", "NetSuite POS", "Other"],
          gridSpan: 6,
          validation: { required: "Please select your current POS system" },
        },
        {
          id: "productCategories",
          name: "productCategories",
          label: "Primary Product Categories Sold",
          type: "checkbox-group",
          options: ["Apparel & Fashion", "Health & Beauty", "Home & Furniture", "Electronics", "Food & Beverage", "Jewelry & Luxury", "Sports & Outdoors"],
          gridSpan: 12,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one product category" : null),
          },
        },
        {
          id: "monthlyFootfallVolume",
          name: "monthlyFootfallVolume",
          label: "Estimated Monthly Footfall / Unique Store Visitors",
          type: "text",
          placeholder: "e.g., 25,000 monthly visitors across 3 stores",
          gridSpan: 12,
          validation: { required: "Monthly visitor volume estimate is required" },
        },
        {
          id: "catalogFile",
          name: "catalogFile",
          label: "Upload Product Catalog or Inventory Export (Optional)",
          type: "file",
          acceptFiles: ".csv,.pdf,.xlsx",
          helpText: "Attach product catalog spreadsheet or inventory manifest",
          gridSpan: 12,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. MANUFACTURING & HARDWARE INTAKE FORM CONFIGURATION
// ---------------------------------------------------------------------------
export const manufacturingFormConfig: FormConfig = {
  id: "manufacturing-intake-form",
  title: "Manufacturing & Hardware Operations Intake",
  description: "Capture production capacity, supply chain lead times, and quality control benchmarks.",
  steps: [
    {
      id: "mfg-details",
      title: "Facility & Production Identity",
      description: "Details regarding production facilities and manufacturing model.",
      fields: [
        {
          id: "facilityName",
          name: "facilityName",
          label: "Manufacturing Plant / Company Name",
          type: "text",
          placeholder: "Titan Manufacturing Corp",
          gridSpan: 6,
          validation: { required: "Facility name is required" },
        },
        {
          id: "contactEmail",
          name: "contactEmail",
          label: "Operations Lead / Plant Manager Email",
          type: "email",
          placeholder: "plant.manager@titanmfg.com",
          gridSpan: 6,
          validation: { required: "Email is required" },
        },
        {
          id: "productionModel",
          name: "productionModel",
          label: "Manufacturing Model Type",
          type: "radio",
          options: [
            { label: "Original Equipment Manufacturer (OEM)", value: "oem" },
            { label: "Original Design Manufacturer (ODM)", value: "odm" },
            { label: "In-House Proprietary Production", value: "in_house" },
            { label: "Contract Manufacturing Partner", value: "contract_mfg" },
          ],
          gridSpan: 12,
          validation: { required: "Production model is required" },
        },
      ],
    },
    {
      id: "mfg-operations",
      title: "Capacity, MOQ & Supply Chain",
      description: "Production throughput, MOQ thresholds, and defect benchmarks.",
      fields: [
        {
          id: "monthlyCapacity",
          name: "monthlyCapacity",
          label: "Monthly Maximum Production Capacity (Units)",
          type: "text",
          placeholder: "100,000 units / month",
          gridSpan: 6,
          validation: { required: "Monthly capacity is required" },
        },
        {
          id: "minimumOrderQuantityMoq",
          name: "minimumOrderQuantityMoq",
          label: "Minimum Order Quantity (MOQ)",
          type: "text",
          placeholder: "1,000 units",
          gridSpan: 6,
          validation: { required: "MOQ is required" },
        },
        {
          id: "leadTimeWeeks",
          name: "leadTimeWeeks",
          label: "Fulfillment Lead Time (Weeks)",
          type: "number",
          placeholder: "6",
          gridSpan: 6,
          validation: { required: "Lead time is required", min: 1 },
        },
        {
          id: "defectRateTarget",
          name: "defectRateTarget",
          label: "Quality Defect Rate Benchmark (%)",
          type: "text",
          placeholder: "< 0.05% PPM",
          gridSpan: 6,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. PROFESSIONAL SERVICES FIRM INTAKE FORM CONFIGURATION
// ---------------------------------------------------------------------------
export const professionalServicesFormConfig: FormConfig = {
  id: "prof-services-intake-form",
  title: "Professional Services Client Onboarding",
  description: "Define consulting scope, billing model, practice areas, and compliance guidelines.",
  steps: [
    {
      id: "firm-info",
      title: "Firm & Contact Context",
      description: "Information about your advisory, legal, accounting, or consulting practice.",
      fields: [
        {
          id: "firmName",
          name: "firmName",
          label: "Firm / Practice Name",
          type: "text",
          placeholder: "Apex Advisory Group",
          gridSpan: 6,
          validation: { required: "Firm name is required" },
        },
        {
          id: "primaryContactEmail",
          name: "primaryContactEmail",
          label: "Managing Partner / Lead Email",
          type: "email",
          placeholder: "partner@apexadvisory.com",
          gridSpan: 6,
          validation: {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          },
        },
        {
          id: "practiceArea",
          name: "practiceArea",
          label: "Primary Practice Areas",
          type: "checkbox-group",
          options: [
            "Management Consulting",
            "Legal Services",
            "Financial & Tax Advisory",
            "IT & Cybersecurity Consulting",
            "Human Resources & Talent",
            "Architecture & Engineering",
          ],
          gridSpan: 12,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one practice area" : null),
          },
        },
        {
          id: "teamSize",
          name: "teamSize",
          label: "Number of Active Consultants / Fee Earners",
          type: "number",
          placeholder: "12",
          gridSpan: 6,
          validation: { required: "Team size is required", min: 1 },
        },
        {
          id: "targetStartDate",
          name: "targetStartDate",
          label: "Desired Engagement Start Date",
          type: "date",
          gridSpan: 6,
          validation: { required: "Target start date is required" },
        },
      ],
    },
    {
      id: "engagement-scope",
      title: "Engagement Model & Budget",
      description: "Select billing structures, retainer terms, and risk compliance policies.",
      fields: [
        {
          id: "billingModel",
          name: "billingModel",
          label: "Preferred Billing & Commercial Model",
          type: "radio",
          options: [
            { label: "Fixed Fee / Project-Based Milestone", value: "fixed_fee" },
            { label: "Time & Materials (Hourly / Daily Rate)", value: "time_materials" },
            { label: "Monthly Retainer", value: "monthly_retainer" },
            { label: "Success / Performance Contingency Fee", value: "contingency" },
          ],
          gridSpan: 12,
          validation: { required: "Please select a billing model" },
        },
        {
          id: "estimatedBudget",
          name: "estimatedBudget",
          label: "Estimated Engagement Budget Range",
          type: "select",
          options: ["$10,000 - $25,000", "$25,000 - $50,000", "$50,000 - $100,000", "$100,000 - $250,000", "$250,000+"],
          gridSpan: 6,
          validation: { required: "Estimated budget is required" },
        },
        {
          id: "conflictCheckRequired",
          name: "conflictCheckRequired",
          label: "Formal Conflict of Interest / Independence Check Required?",
          type: "checkbox",
          defaultValue: true,
          gridSpan: 6,
        },
        {
          id: "scopeDescription",
          name: "scopeDescription",
          label: "Detailed Scope Statement or Problem Brief",
          type: "textarea",
          placeholder: "Describe the primary objectives, deliverables, and expectations for this engagement...",
          gridSpan: 12,
          validation: { required: "Scope statement is required" },
        },
        {
          id: "rfpDocument",
          name: "rfpDocument",
          label: "Upload RFP or Project Brief Document (Optional)",
          type: "file",
          acceptFiles: ".pdf,.docx",
          gridSpan: 12,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 5. SAAS COMPANY INTAKE FORM CONFIGURATION
// ---------------------------------------------------------------------------
export const saasFormConfig: FormConfig = {
  id: "saas-intake-form",
  title: "SaaS Product & Tech Infrastructure Intake",
  description: "Collect cloud infrastructure, API capabilities, user licensing, and enterprise security compliance.",
  steps: [
    {
      id: "product-overview",
      title: "SaaS Product & Architecture",
      description: "Core cloud architecture, deployment model, and user base details.",
      fields: [
        {
          id: "productName",
          name: "productName",
          label: "SaaS Product Name",
          type: "text",
          placeholder: "CloudPulse AI",
          gridSpan: 6,
          validation: { required: "Product name is required" },
        },
        {
          id: "techLeadEmail",
          name: "techLeadEmail",
          label: "Technical Lead / Founder Email",
          type: "email",
          placeholder: "cto@cloudpulse.io",
          gridSpan: 6,
          validation: {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          },
        },
        {
          id: "deploymentModel",
          name: "deploymentModel",
          label: "Cloud Deployment Architecture",
          type: "select",
          options: [
            "Multi-Tenant SaaS (Public Cloud)",
            "Single-Tenant Dedicated Instance",
            "Hybrid Cloud",
            "On-Premises / Air-Gapped Enterprise",
          ],
          gridSpan: 6,
          validation: { required: "Deployment architecture selection is required" },
        },
        {
          id: "activeSeatsCount",
          name: "activeSeatsCount",
          label: "Total Active Users / Licensed Seats",
          type: "number",
          placeholder: "1500",
          gridSpan: 6,
          validation: { required: "Active seat count is required", min: 0 },
        },
        {
          id: "cloudProvider",
          name: "cloudProvider",
          label: "Primary Cloud Infrastructure Provider",
          type: "checkbox-group",
          options: ["Amazon Web Services (AWS)", "Google Cloud Platform (GCP)", "Microsoft Azure", "Cloudflare", "DigitalOcean"],
          gridSpan: 12,
          validation: {
            custom: (val) => (!val || val.length === 0 ? "Select at least one cloud provider" : null),
          },
        },
      ],
    },
    {
      id: "security-integrations",
      title: "Security & Integrations",
      description: "SSO/SAML options, API endpoints, and regulatory compliance.",
      fields: [
        {
          id: "ssoSupport",
          name: "ssoSupport",
          label: "Does your software support Enterprise SSO / SAML 2.0 / OIDC?",
          type: "checkbox",
          defaultValue: true,
          gridSpan: 6,
        },
        {
          id: "complianceFrameworks",
          name: "complianceFrameworks",
          label: "Active Security & Data Compliance Certifications",
          type: "checkbox-group",
          options: ["SOC 2 Type II", "ISO 27001", "GDPR Compliant", "HIPAA BAA Ready", "PCI DSS Tier 1"],
          gridSpan: 12,
        },
        {
          id: "apiSpecFile",
          name: "apiSpecFile",
          label: "Upload OpenAPI / Swagger Specification or Architecture Diagram (Optional)",
          type: "file",
          acceptFiles: ".json,.yaml,.pdf,.png",
          gridSpan: 12,
        },
        {
          id: "integrationNotes",
          name: "integrationNotes",
          label: "Special Webhook or Data Sync Requirements",
          type: "textarea",
          placeholder: "List bi-directional webhooks, REST API rate limits, or custom OAuth workflow rules...",
          gridSpan: 12,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PRESET RESOLVER HELPER
// ---------------------------------------------------------------------------
export function getPresetFormConfig(
  presetName?: "gtm" | "retail" | "professional_services" | "saas" | "manufacturing"
): FormConfig {
  switch (presetName) {
    case "retail":
      return retailFormConfig;
    case "manufacturing":
      return manufacturingFormConfig;
    case "professional_services":
      return professionalServicesFormConfig;
    case "saas":
      return saasFormConfig;
    case "gtm":
    default:
      return defaultGtmFormConfig;
  }
}
