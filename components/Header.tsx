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
  MoreHorizontal,
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

/**
 * Unified Quick Tools & AI Agent Selector Dropdown
 * Combines "Browser Agent", "All Options", and fast system shortcuts into a compact controller
 */
function QuickToolsDropdown({ pathname }: { pathname: string }) {
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
        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 h-8.5 rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
          isOpen
            ? "border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3] dark:text-[#2997FF]"
            : "border-black/[0.08] dark:border-white/[0.12] bg-white/60 dark:bg-[#161618]/60 text-[#110F24] dark:text-white hover:border-black/[0.15] dark:hover:border-white/[0.25]"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <Bot className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.9)] animate-pulse" aria-hidden="true" />
        </div>
        <span className="hidden xl:inline text-xs font-semibold">AI Tools</span>
        <ChevronDown 
          className={`h-3 w-3 text-[#86868B] transition-transform duration-200 ${
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
            className="absolute top-full right-0 mt-2 w-[340px] rounded-2xl bg-white/95 dark:bg-[#121214]/95 border border-black/[0.08] dark:border-white/[0.14] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-2 z-[100]"
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
  onClose 
}: { 
  link: NavLink; 
  isOpen: boolean; 
  onToggle: () => void; 
  onOpen: () => void; 
  pathname: string; 
  onClose: () => void; 
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

  const isActive = pathname.startsWith(link.href);

  return (
    <div
      ref={containerRef}
      className="relative"
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
          isActive || isOpen
            ? "text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 font-semibold"
            : "text-[#55526A] dark:text-[#A1A1A6] hover:text-[#110F24] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
        }`}
      >
        <span>{link.name}</span>
        <ChevronDown 
          className={`h-3.5 w-3.5 text-[#86868B] transition-transform duration-200 ${
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
            className="absolute top-full left-0 mt-2 w-[340px] rounded-2xl bg-white/95 dark:bg-[#121214]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-2 z-[100]"
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

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Scroll listener for border luminance & shadow
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return <header className="sticky top-0 z-50 w-full h-16 border-b border-black/[0.05] dark:border-white/[0.08] bg-[#FBFBFD]/80 dark:bg-[#000000]/80 backdrop-blur-xl" />;
  }

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b transition-all duration-200 bg-[#FBFBFD]/80 dark:bg-[#000000]/80 backdrop-blur-2xl ${
        isScrolled 
          ? "border-black/[0.08] dark:border-white/[0.12] shadow-sm" 
          : "border-black/[0.05] dark:border-white/[0.08]"
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 sm:gap-4">
        
        {/* Left: Clean Brand Logo */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 flex-shrink-0 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-xl shrink-0"
            aria-label="DealFlow.AI Homepage"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071E3] to-[#2997FF] text-white shadow-sm transition-transform group-hover:scale-105 group-active:scale-95 shrink-0">
              <IconDealflowLogo className="h-5 w-5" aria-hidden />
            </div>
            <span className="font-sans text-base lg:text-lg font-bold tracking-tight text-[#110F24] dark:text-[#F5F5F7] whitespace-nowrap">
              DEALFLOW<span className="text-[#0071E3] dark:text-[#2997FF]">.AI</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main Navigation">
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
                  />
                );
              }

              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-tight whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
                    isActive
                      ? "text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 font-semibold"
                      : "text-[#55526A] dark:text-[#A1A1A6] hover:text-[#110F24] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Consolidated Tools & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          
          {/* Combined AI Tools & Browser Agent Dropdown */}
          <QuickToolsDropdown pathname={pathname} />

          {/* Notification Center */}
          <div className="hidden sm:block shrink-0">
            <NotificationCenter />
          </div>

          {/* Theme Switcher */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* Account Profile Menu */}
          <div className="hidden sm:block shrink-0">
            <AccountMenu />
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.12] shrink-0">
            <Link
              href="/book-demo"
              onClick={handleBookMeeting}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 h-8.5 text-xs font-semibold text-[#110F24] dark:text-white bg-white/80 dark:bg-[#161618]/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] rounded-lg transition-all whitespace-nowrap shadow-sm shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
              <span>Book Strategy Demo</span>
            </Link>

            <Link
              href="/portal/customer/login?signup=true"
              onClick={handleGetStarted}
              className="btn-apple-primary font-semibold px-4 py-1.5 h-8.5 flex items-center gap-1.5 text-xs shadow-sm rounded-lg transition-all whitespace-nowrap shrink-0"
            >
              Deploy AI Workforce
            </Link>
          </div>

          {/* Mobile Drawer Hamburger (screens < lg) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-[#161618]/80 text-[#110F24] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] shrink-0"
            aria-label="Open Navigation Menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Responsive Mobile Command Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileCommandDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            navLinks={navLinks}
            portalLinks={portalLinks}
            handleBookMeeting={handleBookMeeting}
            handleGetStarted={handleGetStarted}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
