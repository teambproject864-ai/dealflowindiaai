// lib/pricing.ts

export interface PricingPlan {
  name: string;
  price: { monthly: number; annual: number } | null; // null represents "Custom" pricing
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular?: boolean;
  color: string;
  glow: string;
}

export const PLANS: PricingPlan[] = [
  {
    name: "Starter Workforce",
    price: { monthly: 499, annual: 399 },
    description: "Deploy dedicated AI agents to understand your goals, find prospects, and run initial engagement.",
    features: [
      { text: "Business goal intake & AI analysis", included: true },
      { text: "Autonomous prospect discovery & research", included: true },
      { text: "Multi-channel adaptive outreach sequences", included: true },
      { text: "Up to 50 active prospect engagements/mo", included: true },
      { text: "Workforce command portal & dashboard", included: true },
      { text: "Live AI call representative on meetings", included: false },
      { text: "Autonomous negotiation & boundary engine", included: false },
      { text: "Post-sale requirement execution workflows", included: false },
    ],
    cta: "Deploy Starter Workforce",
    color: "border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-slate-900",
    glow: "shadow-slate-200/50 dark:shadow-white/5"
  },
  {
    name: "Growth Workforce",
    price: { monthly: 1299, annual: 999 },
    description: "Complete autonomous sales workforce with AI call representatives, real-time negotiation, and requirement execution.",
    features: [
      { text: "Business goal intake & AI analysis", included: true },
      { text: "Autonomous prospect discovery & research", included: true },
      { text: "Multi-channel adaptive outreach sequences", included: true },
      { text: "Up to 500 active prospect engagements/mo", included: true },
      { text: "Live AI call representative on meetings", included: true },
      { text: "Autonomous negotiation & boundary engine", included: true },
      { text: "Post-sale requirement execution workflows", included: true },
      { text: "ALMA self-supervised continuous learning", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
    color: "border-teal-300 dark:border-teal-500/30 bg-teal-50 dark:bg-slate-900 hover:border-teal-500",
    glow: "shadow-teal-500/10 dark:shadow-teal-500/5"
  },
  {
    name: "Enterprise Workforce",
    price: null,
    description: "Custom autonomous workforce clusters with dedicated AI representative personas, custom negotiation rules, and full requirement execution.",
    features: [
      { text: "Everything in Growth Workforce", included: true },
      { text: "Unlimited prospect discovery & deals", included: true },
      { text: "Dedicated custom AI representative personas", included: true },
      { text: "Custom contract negotiation & margin rules", included: true },
      { text: "Bespoke requirement execution & ERP sync", included: true },
      { text: "Compliance Auditing & SOC 2 In-Progress controls", included: true },
      { text: "99.9% uptime SLA & dedicated RevOps architect", included: true },
      { text: "Private VPC & BYOK cryptographic key isolation", included: true },
    ],
    cta: "Configure Enterprise Workforce",
    color: "border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-slate-900 hover:border-violet-500",
    glow: "shadow-violet-500/10 dark:shadow-violet-500/5"
  }
];

export const CONVERSION_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.93,
  GBP: 0.79,
  CAD: 1.38,
  INR: 83.5,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  INR: "₹",
};
