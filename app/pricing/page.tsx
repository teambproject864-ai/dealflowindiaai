"use client";

import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, HelpCircle, Sparkles, ArrowRight, Shield, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import Link from "next/link";
import { PLANS, CONVERSION_RATES, CURRENCY_SYMBOLS } from "@/lib/pricing";

const renderFeatureText = (text: string) => {
  if (text.includes("ALMA")) {
    return (
      <span className="relative inline-block group">
        <Link
          href="/features#alma"
          className="underline decoration-dotted decoration-teal-400/50 hover:text-teal-300 transition-colors cursor-help"
        >
          {text}
        </Link>
        <span className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-xl bg-slate-950 border border-white/10 text-[11px] normal-case tracking-normal leading-relaxed text-slate-350 shadow-xl z-55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <strong className="text-teal-455 block mb-1">ALMA (Agent Learning & Memory Architecture)</strong>
          Our proprietary self-supervised AI engine that fine-tunes email templates and outreach logic based on actual sales success rates in your CRM.
        </span>
      </span>
    );
  }
  return text;
};

const faqItems = [
  {
    question: "Can I switch workforce tiers or cancel at any time?",
    answer: "Yes, absolutely. You can upgrade, downgrade, or cancel your autonomous workforce subscription directly from your billing dashboard. When upgrading, new agent capabilities (such as live AI call representation or custom post-sale execution pipelines) are provisioned immediately."
  },
  {
    question: "How does the AI join sales calls as a human representative?",
    answer: "Our AI Sales Representative agent seamlessly joins Zoom, Microsoft Teams, and Google Meet meetings. Equipped with low-latency conversational speech models and real-time knowledge retrieval, the AI conducts product discovery, answers complex technical queries, handles objections, and takes live meeting notes with instant MOM generation."
  },
  {
    question: "How do commercial boundaries prevent unauthorized discounts?",
    answer: "You define strict negotiation floors, maximum discounting allowances, and approved payment structures in your governance dashboard. The Autonomous Closer & Negotiation agents are mathematically constrained by these guardrails and cannot execute or approve any deal terms outside your approved boundaries."
  },
  {
    question: "What happens after the AI closes a deal?",
    answer: "DealFlow.ai doesn't stop at closing. Our Autonomous Post-Sale Execution Engine ingests agreed customer requirements, provisions starter workflows, syncs contracts to your CRM and billing tools, and triggers milestone tracking to ensure end-to-end requirement fulfillment."
  },
  {
    question: "Is there a trial period available?",
    answer: "Yes, we offer a 14-day trial on the Growth Workforce tier. You can define your business objectives, launch autonomous prospect research, and test simulated call representation without upfront commitment."
  }
];

const featureCategories = [
  {
    name: "Autonomous Prospecting & Research",
    items: [
      { name: "Business Objective Intake", starter: "Standard intake", growth: "Advanced multi-goal", enterprise: "Continuous goal orchestration" },
      { name: "Pain Point & Requirement Research", starter: "Basic profiles", growth: "Deep ICP dossiers", enterprise: "Custom signals & intent scraping" },
      { name: "Multi-Channel Autonomous Outreach", starter: "Email only", growth: "Email + SMS + LinkedIn", enterprise: "Omni-channel + Custom Voice" },
    ]
  },
  {
    name: "Live AI Call Rep & Negotiation",
    items: [
      { name: "AI Human Call Representative", starter: "❌", growth: "Up to 50 calls/mo", enterprise: "Unlimited live calls & demos" },
      { name: "Real-Time Objection Handling", starter: "Basic playbooks", growth: "Dynamic memory retrieval", enterprise: "ALMA real-time adaptive synthesis" },
      { name: "Boundary-Enforced Negotiation", starter: "Fixed pricing only", growth: "Tiered discount guardrails", enterprise: "Full contractual & term boundaries" },
      { name: "Autonomous Deal Closure & Contracts", starter: "❌", growth: "Standard e-sign sync", enterprise: "Full redlining & custom agreements" },
    ]
  },
  {
    name: "Post-Sale Execution & Governance",
    items: [
      { name: "Requirement Fulfillment Engine", starter: "Task handover", growth: "Automated onboarding sync", enterprise: "Full delivery orchestration" },
      { name: "ALMA Self-Learning Loop", starter: "Standard", growth: "Continuous improvement", enterprise: "Dedicated company fine-tuning" },
      { name: "Agent Security & PII Redaction", starter: "Standard", growth: "Advanced guardrails", enterprise: "SOC 2 compliant vaults & firewalls" },
      { name: "Support & RevOps SLA", starter: "Email (24h)", growth: "Priority (4h SLA)", enterprise: "Dedicated RevOps workforce strategist" },
    ]
  }
];

function FAQAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-white/5 py-4.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 text-slate-800 dark:text-white font-semibold hover:text-teal-650 dark:hover:text-teal-400 transition-colors focus:outline-none"
      >
        <span className="text-base sm:text-lg flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />
          {question}
        </span>
        <span className="text-xl text-slate-500 font-light select-none ml-4 transition-transform duration-300">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-slate-650 dark:text-slate-400 text-sm pl-8 pr-4 py-2.5 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP" | "CAD" | "INR">("USD");

  const formatCurrency = (amount: number, currencyCode: string) => {
    switch (currencyCode) {
      case "EUR": return `€${Math.round(amount * 0.92)}`;
      case "GBP": return `£${Math.round(amount * 0.79)}`;
      case "CAD": return `C$${Math.round(amount * 1.35)}`;
      case "INR": return `₹${Math.round(amount * 83)}`;
      default: return `$${amount}`;
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-[35rem] h-[35rem] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Header Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 text-center px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous AI Workforce Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
            Deploy an AI Workforce That{" "}
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-violet-700 dark:from-teal-400 dark:via-cyan-400 dark:to-violet-500 bg-clip-text text-transparent">
              Actually Does The Work
            </span>
          </h1>
          <p className="text-slate-650 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            From business goal intake to autonomous prospecting, live AI call representation, and post-sale requirement fulfillment.
          </p>

          {/* Monthly/Annual Toggle Switch & Currency Selector */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="inline-flex items-center bg-slate-105 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-white/15">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  !isAnnual 
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-350 flex items-center gap-1.5 ${
                  isAnnual 
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-normal">Save 20%</span>
              </button>
            </div>

            {/* Currency selector */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-slate-400">Currency:</span>
              <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-full p-0.5">
                {["USD", "EUR", "GBP", "CAD", "INR"].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                      currency === curr
                        ? "bg-gradient-to-r from-teal-500 to-cyan-400 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, idx) => {
            const isPopular = plan.popular;
            const isEnterprise = plan.price === null;
            
            const formattedPrice = isEnterprise 
              ? "Custom" 
              : formatCurrency(isAnnual ? plan.price!.annual : plan.price!.monthly, currency);

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                <GlassPanel
                  material={isPopular ? "neon" : "glass"}
                  glow={isPopular ? "accent" : "none"}
                  className={`h-full flex flex-col justify-between p-8 border ${plan.color} transition-all duration-500 shadow-2xl relative ${plan.glow}`}
                  tilt={true}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-bl-xl shadow-lg z-20 border-l border-b border-teal-500/30">
                      Most Popular
                    </div>
                  )}
                  
                  <div>
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed min-h-[40px]">{plan.description}</p>
                      <div className="mt-6 flex items-baseline">
                        <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                          {formattedPrice}
                        </span>
                        {!isEnterprise && (
                          <span className="text-slate-500 dark:text-slate-455 ml-2 text-sm">/ month</span>
                        )}
                      </div>
                      {!isEnterprise && isAnnual && (
                        <p className="text-[10px] text-emerald-650 dark:text-emerald-400 mt-1.5 font-bold uppercase tracking-wider">Billed annually</p>
                      )}
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/5 my-6"></div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-slate-400 dark:text-slate-655 shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm leading-tight ${feature.included ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500 line-through"}`}>
                            {renderFeatureText(feature.text)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
                    <Link href={isEnterprise ? "/book-demo" : "/book-demo?trial=true"}>
                      <Button
                        className={`w-full h-13 rounded-xl font-semibold uppercase tracking-wider text-xs transition-all duration-300 ${
                          isPopular 
                            ? "bg-teal-600 dark:bg-teal-500 hover:bg-teal-500 dark:hover:bg-teal-400 text-white shadow-lg shadow-teal-500/25" 
                            : "bg-slate-100 dark:bg-white/3 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-800 dark:text-white"
                        }`}
                        variant={isPopular ? "default" : "outline"}
                      >
                        <span>{plan.cta}</span>
                        <ChevronRight className="ml-1.5 h-4 w-4 shrink-0" />
                      </Button>
                    </Link>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table Section */}
      <section className="py-16 max-w-7xl mx-auto px-6 border-t border-slate-200 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">Compare Plan Features</h2>
          <p className="text-slate-605 dark:text-slate-400">Deep-dive comparison matrix of active modules, SLAs, and technical limitations.</p>
        </div>

        <GlassPanel material="glass" depth="mid" tilt={false} className="border-slate-200 dark:border-white/8 p-0 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/2 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-5 px-6">Operational Capabilities</th>
                  <th className="py-5 px-6 w-[20%]">Starter</th>
                  <th className="py-5 px-6 w-[20%]">Growth</th>
                  <th className="py-5 px-6 w-[20%]">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {featureCategories.map((category) => (
                  <Fragment key={category.name}>
                    <tr className="bg-slate-50/50 dark:bg-[#070715]/40 text-sm">
                      <td colSpan={4} className="py-4 px-6 font-bold text-teal-650 dark:text-teal-400 bg-slate-100/10 dark:bg-white/[0.01] uppercase tracking-wider text-xs border-b border-slate-200 dark:border-white/5">
                        {category.name}
                      </td>
                    </tr>
                    {category.items.map((item) => (
                      <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors text-sm">
                        <td className="py-4.5 px-6 text-slate-705 dark:text-slate-300 font-medium">{item.name}</td>
                        <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400 text-xs">{item.starter}</td>
                        <td className="py-4.5 px-6 text-slate-800 dark:text-slate-200 text-xs font-semibold">{item.growth}</td>
                        <td className="py-4.5 px-6 text-teal-600 dark:text-teal-300 text-xs font-semibold">{item.enterprise}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="py-20 max-w-4xl mx-auto px-6 border-t border-slate-200 dark:border-white/5">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-slate-605 dark:text-slate-400">Everything you need to know about billing, architecture sync, and data guardrails.</p>
        </div>

        <GlassPanel material="glass" depth="mid" tilt={false} className="border-slate-200 dark:border-white/8 p-6 sm:p-8">
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {faqItems.map((item, idx) => (
              <FAQAccordionItem 
                key={idx}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </GlassPanel>
      </section>

      {/* Trust Badges Bar */}
      <section className="py-12 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-around gap-8 text-center text-slate-550 dark:text-slate-500 font-semibold uppercase tracking-widest text-[10px]">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-teal-600/70 dark:text-teal-500/50" />
            <span>SOC 2 Type II (Audit in Progress)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-teal-600/70 dark:text-teal-500/50" />
            <span>GDPR Ready Infrastructure</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-teal-600/70 dark:text-teal-500/50" />
            <span>30-Day Money-Back Guarantee</span>
          </div>
        </div>
      </section>
    </div>
  );
}
