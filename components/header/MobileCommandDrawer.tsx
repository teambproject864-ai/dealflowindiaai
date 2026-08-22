"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Calendar, Bell, Shield, User, Globe, Sun, Moon, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NavLink {
  name: string;
  href: string;
  icon?: any;
  subOptions?: { name: string; href: string; description?: string }[];
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
  const shouldReduceMotion = useReducedMotion();

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("df_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const animationProps = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {}, transition: { duration: 0 } }
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "spring" as const, damping: 25, stiffness: 200, mass: 0.8 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Main menu">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-200/60 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            {...animationProps}
            className="relative w-full max-w-sm h-full bg-gradient-to-b from-white to-slate-50 dark:from-[#060612] dark:to-[#040410] border-l border-slate-200 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/15 to-teal-400/10 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                  <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">DF</span>
                </div>
                <span className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Menu
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-450 px-2">
                  Quick Actions
                </h3>
                <div className="flex items-center gap-3 bg-gradient-to-r from-slate-100/50 dark:from-white/5 to-transparent p-4 rounded-3xl border border-slate-200 dark:border-white/10">
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all duration-300"
                    aria-label="Toggle system color theme"
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4.5 w-4.5 text-teal-400" />
                    ) : (
                      <Sun className="h-4.5 w-4.5 text-amber-500" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Theme</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-450 px-2">
                  Navigation
                </h3>
                <div className="space-y-2">
                  {navLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    const isExpanded = expandedNav === link.name;
                    const Icon = link.icon;

                    if (link.subOptions) {
                      return (
                        <div key={link.name} className="space-y-1.5">
                          <button
                            onClick={() => setExpandedNav(isExpanded ? null : link.name)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
                              isActive
                                ? "border-teal-500/30 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-700 dark:text-teal-300 font-bold"
                                : "border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10"
                            }`}
                            aria-expanded={isExpanded}
                            aria-controls={`mobile-subnav-${link.name}`}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <Icon className={`h-5 w-5 ${isActive ? "text-teal-650 dark:text-teal-400" : "text-slate-500"}`} />}
                              <span className="font-bold text-sm">{link.name}</span>
                              {link.name === "Portal" && (
                                <span className="relative flex h-1.5 w-1.5 ml-0.5" aria-hidden="true">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`h-4.5 w-4.5 transition-all duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                id={`mobile-subnav-${link.name}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.2, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pr-1 pb-1 space-y-1.5 scrim-bg rounded-2xl border border-slate-200/50 dark:border-white/5 p-1.5 mt-1">
                                  <Link
                                    href={link.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                                  >
                                    <Sparkles className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                                    <span className="font-bold">Overview</span>
                                  </Link>
                                  {link.subOptions.map((option) => (
                                    <Link
                                      key={option.href}
                                      href={option.href}
                                      onClick={onClose}
                                      className="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl text-xs text-slate-655 dark:text-slate-400 hover:text-slate-955 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                                    >
                                      <span className="font-bold">{option.name}</span>
                                      {option.description && (
                                        <span className="text-[10px] text-slate-500 dark:text-slate-500">
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

                    const isAnchor = link.href.includes("#");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
                          isActive
                            ? "border-teal-500/30 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-700 dark:text-teal-300 font-bold"
                            : isAnchor
                              ? "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6"
                              : "border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10"
                        }`}
                      >
                        {Icon && <Icon className={`h-5 w-5 ${isActive ? "text-teal-650 dark:text-teal-400" : "text-slate-500"}`} />}
                        {isAnchor && <span className="text-teal-600 dark:text-teal-550/60 mr-1 font-bold">#</span>}
                        <span className="font-bold text-sm">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Portals */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-650 dark:text-slate-450 px-2">
                  Portals
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {portalLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3.5 px-4 py-4 rounded-xl border transition-all duration-300 border-slate-200 dark:${link.borderColor} bg-white/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-350 dark:hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 shadow-sm`}
                      >
                        <div className={`p-2.5 rounded-xl bg-slate-100 dark:${link.bgColor}`}>
                          <Icon className={`h-5 w-5 ${link.color}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-sm text-slate-800 dark:text-white">{link.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{link.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-200 dark:border-white/10 p-5 space-y-3">
              <Button
                variant="outline"
                className="w-full border border-teal-200 dark:border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-teal-400/5 dark:from-teal-500/15 dark:to-cyan-500/10 hover:from-teal-500/20 dark:hover:from-teal-500/25 dark:hover:to-cyan-500/20 text-teal-700 dark:text-teal-300 font-bold h-12 flex items-center justify-center gap-2.5 rounded-3xl shadow-lg shadow-teal-700/5 dark:shadow-none"
                onClick={(e) => {
                  onClose();
                  handleBookMeeting(e);
                }}
              >
                <Calendar className="h-4.5 w-4.5" />
                Book Strategy Demo
              </Button>

              <Button
                className="w-full bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-650 hover:from-teal-650 hover:via-cyan-550 hover:to-teal-550 text-white font-bold h-12 rounded-3xl shadow-xl shadow-teal-700/20 dark:shadow-teal-500/30 transition-all duration-300 hover:shadow-teal-650/40"
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
    </AnimatePresence>
  );
}
