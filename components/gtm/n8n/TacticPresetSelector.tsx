"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  Mail,
  Share2,
  TrendingUp,
  BarChart3,
  Search,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TacticPreset {
  id: string;
  name: string;
  category: "Content & SEO" | "Paid Ads" | "Outbound & Email" | "Interactive & AI";
  icon: any;
  conversionRate: string;
  roi: string;
  description: string;
  recommendedRole: "admin" | "agent" | "customer";
}

const TACTIC_PRESETS: TacticPreset[] = [
  {
    id: "tactic-1",
    name: "Blog Posts & Thought Leadership",
    category: "Content & SEO",
    icon: FileText,
    conversionRate: "2.4%",
    roi: "210%",
    description: "Long-form search optimized blog articles with automated ICP lead magnets.",
    recommendedRole: "customer",
  },
  {
    id: "tactic-2",
    name: "Explainer Video Script (90s)",
    category: "Interactive & AI",
    icon: Video,
    conversionRate: "3.8%",
    roi: "340%",
    description: "High-impact video script formatted for YouTube, Vimeo, and landing pages.",
    recommendedRole: "agent",
  },
  {
    id: "tactic-3",
    name: "Cold Email Outbound Sequence",
    category: "Outbound & Email",
    icon: Mail,
    conversionRate: "4.1%",
    roi: "420%",
    description: "Personalized multi-touch cold email sequence targeting VP RevOps & Sales decision makers.",
    recommendedRole: "agent",
  },
  {
    id: "tactic-4",
    name: "LinkedIn Retargeting Campaign",
    category: "Paid Ads",
    icon: Share2,
    conversionRate: "5.2%",
    roi: "280%",
    description: "Account-Based Marketing InMail & sponsored carousel ads.",
    recommendedRole: "customer",
  },
  {
    id: "tactic-5",
    name: "Interactive GTM Sales ROI Calculator",
    category: "Interactive & AI",
    icon: BarChart3,
    conversionRate: "7.8%",
    roi: "510%",
    description: "Embedded interactive tool that calculates RevOps productivity savings in real-time.",
    recommendedRole: "admin",
  },
];

interface TacticPresetSelectorProps {
  onSelectTactic?: (tactic: TacticPreset) => void;
  selectedTacticId?: string;
}

export default function TacticPresetSelector({
  onSelectTactic,
  selectedTacticId,
}: TacticPresetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string>(selectedTacticId || TACTIC_PRESETS[0].id);

  const categories = ["All", "Content & SEO", "Paid Ads", "Outbound & Email", "Interactive & AI"];

  const filteredTactics = TACTIC_PRESETS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (tactic: TacticPreset) => {
    setSelectedId(tactic.id);
    if (onSelectTactic) onSelectTactic(tactic);
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search marketing tactics..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-white/8 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTactics.map((tactic) => {
          const Icon = tactic.icon;
          const isSelected = tactic.id === selectedId;

          return (
            <motion.div
              key={tactic.id}
              onClick={() => handleSelect(tactic)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-200 flex flex-col justify-between",
                isSelected
                  ? "bg-gradient-to-br from-teal-900/40 via-slate-900 to-violet-900/30 border-teal-400/60 shadow-[0_0_25px_rgba(20,184,166,0.2)]"
                  : "bg-slate-900/60 border-white/8 hover:border-white/20 hover:bg-slate-900/80"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <Icon className="h-4 w-4 text-teal-400" />
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-teal-400" />}
                </div>

                <h4 className="text-sm font-bold text-white mb-1">{tactic.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {tactic.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-teal-400 font-bold">Conv Rate: {tactic.conversionRate}</span>
                <span className="text-violet-400 font-bold">Est ROI: {tactic.roi}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
