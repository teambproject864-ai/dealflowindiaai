// components/Header.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Bot, 
  Shield, 
  User, 
  Zap, 
  PhoneCall, 
  Workflow, 
  LayoutGrid, 
  Database,
  ArrowUpRight
} from "lucide-react";

import { IconDealflowLogo, IconRevenueAcceleration } from "@/components/gtm/GtmIcons";
import { NotificationCenter } from "./header/NotificationCenter";
import { AccountMenu } from "./header/AccountMenu";
import { MobileCommandDrawer } from "./header/MobileCommandDrawer";
import { ThemeToggle } from "./ThemeToggle";

export interface NavLink {
  name: string;
  href: string;
  icon?: React.ElementType;
  subOptions?: { 
    name: string; 
    href: string; 
    description?: string;
    icon?: React.ElementType;
    badge?: string;
  }[];
}

export interface FlowingHeaderProps {
  /**
   * Scroll offset in pixels at which the header begins its flowing transition to condensed state
   * @default 24
   */
  scrollThreshold?: number;
  /**
   * Whether the flowing morphing behavior is enabled
   * @default true
   */
  flowing?: boolean;
  /**
   * Whether to condense into a floating pill island with inset margins
   * @default true
   */
  floatingIsland?: boolean;
  /**
   * Additional custom CSS classes for the header container
   */
  className?: string;
  /**
   * Destination for the brand logo link
   * @default "/"
   */
  homeHref?: string;
}

/**
 * Unified Quick Tools & AI Agent Selector Dropdown
 * Combines "Browser Agent", "All Options", and fast system shortcuts into a compact controller
 */
export function QuickToolsDropdown({ pathname, isCompact = false }: { pathname: string; isCompact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 160);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        containerRef.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Quick tools list
  const toolOptions = [
    {
      name: "Autonomous Browser Agent",
      href: "/browser-agent",
      icon: Bot,
      badge: "Active",
      badgeColor: "bg-[#34C759]/10 text-[#248A3D] dark:text-[#30D158] border-[#34C759]/20",
      description: "Deploy autonomous AI agents for research & web automation"
    },
    {
      name: "All System Options & Features",
      href: "/all-options",
      icon: LayoutGrid,
      badge: "Directory",
      badgeColor: "bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border-[#0071E3]/20",
      description: "Full directory of system tools, portals & operations"
    },
    {
      name: "RAG Knowledge Explorer",
      href: "/rag",
      icon: Database,
      badge: "AI RAG",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      description: "Vector intelligence & multi-tenant semantic retrieval"
    }
  ];

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsOpen(true)}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setIsOpen(false);
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="AI Tools & System Options"
        className={`group relative flex items-center gap-1.5 rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
          isCompact ? "px-2 py-1 h-7.5 text-xs" : "px-2 sm:px-2.5 py-1.5 h-8.5 text-xs"
        } ${
          isOpen
            ? "border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3] dark:text-[#2997FF]"
            : "border-black/[0.08] dark:border-white/[0.12] bg-white/60 dark:bg-[#161618]/60 text-[#110F24] dark:text-white hover:border-black/[0.15] dark:hover:border-white/[0.25]"
        }`}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Bot className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.9)] animate-pulse" aria-hidden="true" />
        </div>
        <span className="hidden 2xl:inline text-xs font-semibold whitespace-nowrap">AI Tools</span>
        <ChevronDown 
          className={`h-3 w-3 text-[#86868B] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#0071E3] dark:text-[#2997FF]" : ""
          }`} 
          aria-hidden="true" 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-[320px] sm:w-[340px] rounded-2xl bg-white/95 dark:bg-[#121214]/95 border border-black/[0.08] dark:border-white/[0.14] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-2 z-[100]"
            role="menu"
            aria-label="AI Tools Selector"
          >
            <div className="px-3 py-2 text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider">
              Quick AI Tools & Features
            </div>

            <div className="space-y-1">
              {toolOptions.map((tool) => {
                const IconComponent = tool.icon;
                const isSelected = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-all group ${
                      isSelected
                        ? "bg-[#0071E3]/5 dark:bg-[#2997FF]/10 border border-[#0071E3]/20"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/[0.06] border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.08]"
                    }`}
                    role="menuitem"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#110F24] dark:text-white group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-[#110F24] dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-colors">
                          {tool.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${tool.badgeColor}`}>
                          {tool.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Premium Apple/Linear-style Nav Dropdown with Frosted Glass Flyout
 */
export function NavDropdown({ 
  link, 
  isOpen, 
  onToggle, 
  onOpen, 
  pathname, 
  onClose,
  isCompact = false
}: { 
  link: NavLink; 
  isOpen: boolean; 
  onToggle: () => void; 
  onOpen: () => void; 
  pathname: string; 
  onClose: () => void; 
  isCompact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => onClose(), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        containerRef.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isActive = pathname.startsWith(link.href);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={onOpen}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) onClose();
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${link.name} Menu`}
        className={`inline-flex items-center gap-1 rounded-lg tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] whitespace-nowrap shrink-0 ${
          isCompact 
            ? "px-2 py-1 text-[12px] xl:text-[12.5px] font-medium" 
            : "px-2 xl:px-2.5 2xl:px-3 py-1.5 text-[12.5px] xl:text-[13px] font-medium"
        } ${
          isActive || isOpen
            ? "text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 font-semibold"
            : "text-[#55526A] dark:text-[#A1A1A6] hover:text-[#110F24] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
        }`}
      >
        <span>{link.name}</span>
        <ChevronDown 
          className={`transition-transform duration-200 shrink-0 ${
            isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
          } ${
            isOpen ? "rotate-180 text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B]"
          }`} 
          aria-hidden="true" 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-[320px] sm:w-[340px] rounded-2xl bg-white/95 dark:bg-[#121214]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-2 z-[100]"
            role="menu"
            aria-label={`${link.name} Submenu`}
          >
            {/* Overview / Header Card */}
            <Link
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#110F24] dark:text-white hover:bg-[#0071E3]/5 dark:hover:bg-[#2997FF]/10 hover:text-[#0071E3] dark:hover:text-[#2997FF] transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                <span>All {link.name}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-[#86868B] group-hover:translate-x-0.5 group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-all" />
            </Link>

            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-1 mx-1" />

            {/* Sub-options List */}
            <div className="space-y-0.5">
              {link.subOptions?.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  onClick={onClose}
                  className="block px-3 py-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group text-left"
                  role="menuitem"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-medium text-[#110F24] dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-colors">
                      {option.name}
                    </span>
                    {option.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5 leading-snug">
                      {option.description}
                    </p>
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

/**
 * Flowing Header Component
 *
 * Implements a responsive, fluid header that seamlessly transitions between
 * a full-width Expanded State at the top of the viewport and a floating
 * Condensed Command Dock as the user scrolls. Optimized for 60fps performance
 * via GPU transforms and opacity transitions.
 */
export function Header({
  scrollThreshold = 24,
  flowing = true,
  floatingIsland = true,
  className = "",
  homeHref = "/"
}: FlowingHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Primary Navigation Architecture
  const navLinks: NavLink[] = [
    {
      name: "Solutions",
      href: "/solutions",
      icon: IconRevenueAcceleration,
      subOptions: [
        { 
          name: "Autonomous Sales Workforce", 
          href: "/solutions/sales", 
          description: "End-to-end autonomous prospecting, selling & closing",
          icon: Zap,
          badge: "Core"
        },
        { 
          name: "AI Call Rep & Negotiation", 
          href: "/solutions/gtm", 
          description: "Live AI human presence on sales meetings & objection handling",
          icon: PhoneCall,
          badge: "Live"
        },
        { 
          name: "Requirement Execution Engine", 
          href: "/solutions/marketing", 
          description: "Autonomous post-sale customer requirement delivery",
          icon: Workflow,
          badge: "Auto"
        },
      ],
    },
    {
      name: "Workforce Architecture",
      href: "/features",
    },
    {
      name: "GTM Analysis",
      href: "/solutions/gtm",
    },
    {
      name: "Pricing",
      href: "/pricing",
    },
    {
      name: "Portals",
      href: "/portal",
      icon: Users,
      subOptions: [
        { 
          name: "Customer Portal", 
          href: "/portal/customer/login", 
          description: "Monitor your autonomous AI workforce and pipeline results",
          icon: Users,
          badge: "Clients"
        },
        { 
          name: "Agent Command Center", 
          href: "/portal/agent/login", 
          description: "Workstation for AI Revenue & Execution Agents",
          icon: User,
          badge: "Agents"
        },
        { 
          name: "Admin Governance Portal", 
          href: "/portal/admin/login", 
          description: "System security, compliance, and multi-tenant policies",
          icon: Shield,
          badge: "Security"
        },
      ],
    },
  ];

  const portalLinks = [
    {
      name: "Admin Governance Portal",
      href: "/portal/admin/login",
      icon: Shield,
      description: "For system administrators and compliance",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      name: "Agent Command Center",
      href: "/portal/agent/login",
      icon: User,
      description: "For AI Workforce Agents & Operations",
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
    },
    {
      name: "Customer Portal",
      href: "/portal/customer/login",
      icon: Users,
      description: "For DealFlow customers & business leaders",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
  ];

  const handleGetStarted = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/portal/customer/login?signup=true");
  }, [router]);

  const handleBookMeeting = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/book-demo");
  }, [router]);

  // High-performance 60fps Scroll Listener with RAF and hardware metrics
  useEffect(() => {
    if (!flowing) return;

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY || document.documentElement.scrollTop || 0;
        const scrolled = currentY > scrollThreshold;
        setIsScrolled(scrolled);

        // Smooth progress from 0 to 1 over [0, 80px]
        const progress = Math.min(Math.max(currentY / 80, 0), 1);
        setScrollProgress(progress);

        rafId = null;
      });
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [flowing, scrollThreshold]);

  // Close menus on path change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  // Global Escape key listener for open menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full h-14 sm:h-16 border-b border-black/[0.05] dark:border-white/[0.08] bg-[#FBFBFD]/80 dark:bg-[#000000]/80 backdrop-blur-xl" />
    );
  }

  const isCondensed = flowing && isScrolled;

  return (
    <>
      {/* Accessibility Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 z-[9999] px-4 py-2 bg-[#0071E3] text-white text-xs font-bold rounded-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0071E3] transition-all"
      >
        Skip to main content
      </a>

      {/* Main Flowing Header Wrapper */}
      <header
        role="banner"
        aria-label="Site Header"
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out ${
          isCondensed && floatingIsland
            ? "pt-2 sm:pt-3 px-3 sm:px-4 lg:px-6"
            : "pt-0 px-0"
        } ${className}`}
      >
        {/* Animated Morphing Container */}
        <div
          className={`mx-auto transition-all duration-300 ease-out ${
            isCondensed && floatingIsland
              ? "w-full max-w-[1440px] rounded-2xl lg:rounded-full bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.14] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] px-3 sm:px-5 lg:px-6"
              : "w-full rounded-none bg-[#FBFBFD]/80 dark:bg-[#000000]/80 backdrop-blur-2xl border-b border-black/[0.05] dark:border-white/[0.08] px-3 sm:px-5 lg:px-6"
          }`}
          style={{
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div 
            className={`w-full max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 transition-all duration-300 ${
              isCondensed 
                ? "h-12 sm:h-13" 
                : "h-14 sm:h-16"
            }`}
          >
            {/* Left: Brand Logo & Desktop Nav */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 xl:gap-5 shrink-0">
              <Link
                href={homeHref}
                className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-xl shrink-0 transition-transform active:scale-95"
                aria-label="DealFlow.AI Homepage"
              >
                <div 
                  className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0071E3] via-[#1a85ff] to-[#2997FF] text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(0,113,227,0.4)] shrink-0 ${
                    isCondensed ? "h-7.5 w-7.5" : "h-8 w-8 sm:h-8.5 sm:w-8.5"
                  }`}
                >
                  <IconDealflowLogo className={isCondensed ? "h-4 w-4" : "h-4.5 w-4.5"} aria-hidden />
                </div>
                <span 
                  className={`font-sans font-bold tracking-tight text-[#110F24] dark:text-[#F5F5F7] whitespace-nowrap transition-all duration-300 ${
                    isCondensed ? "text-xs sm:text-[13px] xl:text-sm" : "text-sm sm:text-base"
                  }`}
                >
                  DEALFLOW<span className="text-[#0071E3] dark:text-[#2997FF]">.AI</span>
                </span>
              </Link>

              {/* Center: Desktop Navigation Links (Large screens only) */}
              <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0" aria-label="Main Navigation">
                {navLinks.map((link) => {
                  if (link.subOptions) {
                    return (
                      <NavDropdown
                        key={link.name}
                        link={link}
                        isOpen={openDropdown === link.name}
                        onToggle={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                        onOpen={() => setOpenDropdown(link.name)}
                        pathname={pathname}
                        onClose={() => setOpenDropdown(null)}
                        isCompact={isCondensed}
                      />
                    );
                  }

                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-lg tracking-tight whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] shrink-0 ${
                        isCondensed
                          ? "px-2 xl:px-2.5 py-1 text-[12px] xl:text-[12.5px] font-medium"
                          : "px-2 xl:px-2.5 2xl:px-3 py-1.5 text-[12.5px] xl:text-[13px] font-medium"
                      } ${
                        isActive
                          ? "text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 font-semibold"
                          : "text-[#55526A] dark:text-[#A1A1A6] hover:text-[#110F24] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Consolidated Tools & Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Combined AI Tools & Browser Agent Dropdown (Hidden on mobile) */}
              <div className="hidden sm:block">
                <QuickToolsDropdown pathname={pathname} isCompact={isCondensed} />
              </div>

              {/* Notification Center (Hidden on mobile & tablet) */}
              <div className="hidden lg:block shrink-0">
                <NotificationCenter />
              </div>

              {/* Theme Switcher */}
              <div className="shrink-0">
                <ThemeToggle />
              </div>

              {/* Account Profile Menu (Hidden on mobile & tablet) */}
              <div className="hidden lg:block shrink-0">
                <AccountMenu />
              </div>

              {/* Action CTAs (Desktop lg+ only) */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.12] shrink-0">
                <Link
                  href="/book-demo"
                  onClick={handleBookMeeting}
                  className={`hidden 2xl:flex items-center gap-1.5 text-xs font-semibold text-[#110F24] dark:text-white bg-white/80 dark:bg-[#161618]/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-lg transition-all whitespace-nowrap shadow-sm shrink-0 ${
                    isCondensed ? "px-2.5 py-1 h-7.5" : "px-3 py-1.5 h-8"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF] shrink-0" />
                  <span>Book Strategy Demo</span>
                </Link>

                <Link
                  href="/portal/customer/login?signup=true"
                  onClick={handleGetStarted}
                  className={`btn-apple-primary font-semibold flex items-center gap-1.5 text-xs shadow-sm rounded-lg transition-all whitespace-nowrap shrink-0 group ${
                    isCondensed ? "px-3 py-1 h-7.5 text-[11.5px]" : "px-3.5 py-1.5 h-8"
                  }`}
                >
                  <span>Deploy AI Workforce</span>
                  <Sparkles className="h-3 w-3 opacity-80 group-hover:rotate-12 transition-transform shrink-0" />
                </Link>
              </div>

              {/* Mobile & Tablet Drawer Hamburger (screens < lg) */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`lg:hidden flex items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-[#161618]/80 text-[#110F24] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] shrink-0 ${
                  isCondensed ? "h-7.5 w-7.5 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-8.5 sm:w-8.5"
                }`}
                aria-label="Open main menu (Navigation Menu)"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-command-drawer"
              >
                <Menu className={isCondensed ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-4.5 sm:w-4.5"} />
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Mobile Command Drawer */}
        <MobileCommandDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          navLinks={navLinks}
          portalLinks={portalLinks}
          handleBookMeeting={handleBookMeeting}
          handleGetStarted={handleGetStarted}
        />
      </header>
    </>
  );
}
