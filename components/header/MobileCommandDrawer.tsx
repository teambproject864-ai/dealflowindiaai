"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  X, 
  Calendar, 
  Sun, 
  Moon, 
  ChevronDown, 
  Sparkles, 
  Bot, 
  LayoutGrid, 
  Database,
  ArrowRight
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NavLink {
  name: string;
  href: string;
  icon?: any;
  subOptions?: { name: string; href: string; description?: string; badge?: string }[];
}

interface MobileCommandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  portalLinks: Array<{
    name: string;
    href: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }>;
  handleBookMeeting: (e: any) => void;
  handleGetStarted: (e: any) => void;
}

export function MobileCommandDrawer({
  isOpen,
  onClose,
  navLinks,
  portalLinks,
  handleBookMeeting,
  handleGetStarted,
}: MobileCommandDrawerProps) {
  const pathname = usePathname();
  const [expandedNav, setExpandedNav] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("df_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("df_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.dataset.theme = "light";
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    }
  }, [theme]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const animationProps = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {}, transition: { duration: 0 } }
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "spring" as const, damping: 26, stiffness: 220, mass: 0.8 },
      };

  const quickTools = [
    {
      name: "Autonomous Browser Agent",
      href: "/browser-agent",
      icon: Bot,
      badge: "Active",
      badgeColor: "bg-[#34C759]/10 text-[#248A3D] dark:text-[#30D158] border-[#34C759]/20",
      description: "Deploy AI web automation agents"
    },
    {
      name: "RAG Knowledge Explorer",
      href: "/rag",
      icon: Database,
      badge: "AI RAG",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      description: "Vector intelligence & semantic search"
    },
    {
      name: "All Features Directory",
      href: "/all-options",
      icon: LayoutGrid,
      badge: "Tools",
      badgeColor: "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border-[#0071E3]/20",
      description: "Full directory of systems & portals"
    }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] lg:hidden flex justify-end" 
          role="dialog" 
          aria-modal="true" 
          aria-label="Main navigation menu"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            {...animationProps}
            className="relative w-full max-w-sm h-full bg-[#FAFAFC] dark:bg-[#0A0A10] border-l border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] px-5 py-4 bg-white/80 dark:bg-[#121216]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071E3] to-[#2997FF] text-white shadow-sm">
                  <span className="font-bold text-xs">DF</span>
                </div>
                <span className="font-bold text-sm text-[#110F24] dark:text-white">
                  Menu & Navigation
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.1] text-[#110F24] dark:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                aria-label="Close menu"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              
              {/* Theme & Mode Quick Toggle */}
              <div className="flex items-center justify-between bg-white dark:bg-[#14141A] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4 text-[#2997FF]" />
                    ) : (
                      <Sun className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#110F24] dark:text-white">Theme</p>
                    <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6]">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-[#110F24] dark:text-white transition-colors"
                >
                  Switch to {theme === "dark" ? "Light" : "Dark"}
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] px-1">
                  Main Navigation
                </h3>
                <div className="space-y-1.5">
                  {navLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    const isExpanded = expandedNav === link.name;
                    const Icon = link.icon;

                    if (link.subOptions) {
                      return (
                        <div key={link.name} className="space-y-1">
                          <button
                            onClick={() => setExpandedNav(isExpanded ? null : link.name)}
                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                              isActive
                                ? "border-[#0071E3]/30 bg-[#0071E3]/5 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] font-semibold"
                                : "border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#14141A] text-[#110F24] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                            }`}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-2.5">
                              {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]"}`} />}
                              <span className="font-medium text-xs text-left">{link.name}</span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-[#86868B] transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-[#0071E3] dark:text-[#2997FF]" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-3 pr-1 py-1 space-y-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.04] dark:border-white/[0.04] mt-1">
                                  <Link
                                    href={link.href}
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>All {link.name} Overview</span>
                                  </Link>
                                  {link.subOptions.map((option) => (
                                    <Link
                                      key={option.href}
                                      href={option.href}
                                      onClick={onClose}
                                      className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-xs hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="font-medium text-[#110F24] dark:text-white">{option.name}</span>
                                        {option.badge && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                                            {option.badge}
                                          </span>
                                        )}
                                      </div>
                                      {option.description && (
                                        <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6]">
                                          {option.description}
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                          isActive
                            ? "border-[#0071E3]/30 bg-[#0071E3]/5 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] font-semibold"
                            : "border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#14141A] text-[#110F24] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]"}`} />}
                        <span className="font-medium text-xs">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* AI & System Quick Tools */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] px-1">
                  AI Tools & Intelligence
                </h3>
                <div className="space-y-1.5">
                  {quickTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={onClose}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? "border-[#0071E3]/30 bg-[#0071E3]/5 dark:bg-[#2997FF]/10"
                            : "border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#14141A] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#110F24] dark:text-white shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[#110F24] dark:text-white truncate">
                              {tool.name}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${tool.badgeColor}`}>
                              {tool.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Portals & Workspaces */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] px-1">
                  System Portals
                </h3>
                <div className="space-y-1.5">
                  {portalLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#14141A] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all shadow-sm"
                      >
                        <div className={`p-2 rounded-lg bg-black/[0.04] dark:${link.bgColor}`}>
                          <Icon className={`h-4 w-4 ${link.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-xs text-[#110F24] dark:text-white truncate">
                            {link.name}
                          </div>
                          <div className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] truncate">
                            {link.description}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#86868B] shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sticky Actions Footer */}
            <div className="border-t border-black/[0.06] dark:border-white/[0.08] p-4 bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md space-y-2 shrink-0">
              <Button
                variant="outline"
                className="w-full border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-[#161618]/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#110F24] dark:text-white font-semibold h-10 flex items-center justify-center gap-2 rounded-xl text-xs"
                onClick={(e) => {
                  onClose();
                  handleBookMeeting(e);
                }}
              >
                <Calendar className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                Book Strategy Demo
              </Button>

              <Button
                className="btn-apple-primary w-full font-semibold h-10 rounded-xl text-xs flex items-center justify-center gap-1.5"
                onClick={(e) => {
                  onClose();
                  handleGetStarted(e);
                }}
              >
                Deploy AI Workforce
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
