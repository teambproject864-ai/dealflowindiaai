"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, User, Shield, Users, Menu, X, ChevronDown, ChevronRight, Sparkles, Bot, MoreHorizontal } from "lucide-react";

import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import {
  IconDealflowLogo,
  IconShieldCompliance,
  IconRevenueAcceleration,
} from "@/components/gtm/GtmIcons";

import { NotificationCenter } from "./header/NotificationCenter";
import { AccountMenu } from "./header/AccountMenu";
import { MobileCommandDrawer } from "./header/MobileCommandDrawer";
import { ThemeToggle } from "./ThemeToggle";

interface NavLink {
  name: string;
  href: string;
  icon?: React.ElementType;
  subOptions?: { name: string; href: string; description?: string }[];
}

function NavDropdown({ 
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      buttonRef.current?.focus();
    }
  }, [onClose]);

  const isActive = pathname.startsWith(link.href);

  const contentAnimationProps = shouldReduceMotion
    ? { initial: false as any, animate: false as any, exit: false as any }
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.96 },
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Nav button */}
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`group relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
          isActive
            ? "text-[#5A4BFF] bg-[#5A4BFF]/10 dark:text-[#6E61FF] dark:bg-[#6E61FF]/15 border border-[#5A4BFF]/20"
            : "text-[#4E4A67] dark:text-[#B4B0C8] hover:text-[#19162F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BFF]`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {link.name}
        {link.name === "Portal" && (
          <span className="relative flex h-1.5 w-1.5 select-none" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A4BFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5A4BFF]"></span>
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#5A4BFF]" : "text-[#7D7992] group-hover:text-[#19162F] dark:group-hover:text-white"
          }`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...contentAnimationProps}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] rounded-2xl bg-[#FFFFFF] dark:bg-[#141322] border border-[#E2DDD0] dark:border-[#282542] shadow-xl p-2.5 z-[100]"
            role="menu"
            aria-label={`${link.name} Submenu`}
          >
            {/* Header/Overview button */}
            <Link
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[#19162F] dark:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1B192E] border border-transparent hover:border-[#E2DDD0] dark:hover:border-[#282542] transition-colors text-xs font-bold group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                <span>View All {link.name}</span>
                <span className="text-[9px] font-bold border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/15 px-2.5 py-1 rounded-full text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Overview
                </span>
              </span>
              <ChevronRight className="h-4.5 w-4.5 text-slate-500 group-hover:text-teal-300 transition-all duration-300 group-hover:translate-x-1" />
            </Link>

            <div className="border-t border-slate-200 dark:border-white/10 my-2 mx-1" />

            <div className="space-y-1.5 scrim-bg rounded-2xl p-1.5 border border-slate-200/50 dark:border-white/5">
              {link.subOptions?.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  onClick={onClose}
                  className="block px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 border border-transparent hover:border-teal-500/20 dark:hover:border-teal-500/20 border-l-2 border-l-transparent hover:border-l-teal-400"
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-300">
                      {option.name}
                    </span>
                    {option.description && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 mt-1.5 leading-relaxed">
                        {option.description}
                      </span>
                    )}
                  </div>
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
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks: NavLink[] = [
    {
      name: "Solutions",
      href: "/solutions",
      icon: IconRevenueAcceleration,
      subOptions: [
        { name: "GTM Playbooks", href: "/solutions/gtm", description: "Go-to-market strategy automation" },
        { name: "Sales Acceleration", href: "/solutions/sales", description: "AI-powered sales workflows" },
        { name: "Marketing Optimization", href: "/solutions/marketing", description: "Intelligent marketing automation" },
      ],
    },
    {
      name: "GTM Analysis",
      href: "/solutions/gtm",
    },
    {
      name: "Features",
      href: "/features",
    },
    {
      name: "Support",
      href: "/support",
    },
    {
      name: "Portal",
      href: "/portal",
      icon: Users,
      subOptions: [
        { name: "Customer Portal", href: "/portal/customer/login", description: "Access client dashboard and metrics" },
        { name: "Agent Portal", href: "/portal/agent/login", description: "Workspace for AI Revenue Agents" },
        { name: "Admin Portal", href: "/portal/admin/login", description: "System administrators control center" },
      ],
    },
  ];

  const portalLinks = [
    {
      name: "Admin Portal",
      href: "/portal/admin/login",
      icon: Shield,
      description: "For system administrators",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      name: "Agent Portal",
      href: "/portal/agent/login",
      icon: User,
      description: "For AI Revenue Agents",
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
    },
    {
      name: "Customer Portal",
      href: "/portal/customer/login",
      icon: Users,
      description: "For DealFlow customers",
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

  // Scroll handler for header transformation
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

  // Close dropdowns on path change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  const headerClasses = isScrolled
    ? "sticky top-0 z-50 w-full border-b border-black/[0.08] dark:border-white/[0.12] bg-[#FBFBFD]/80 dark:bg-[#000000]/80 backdrop-blur-2xl !overflow-visible shadow-sm"
    : "sticky top-0 z-50 w-full border-b border-black/[0.05] dark:border-white/[0.08] bg-[#FBFBFD]/70 dark:bg-[#000000]/70 backdrop-blur-xl !overflow-visible";

  if (!mounted) {
    return <header className="sticky top-0 z-50 w-full border-b border-black/[0.05] dark:border-white/[0.08] bg-[#FBFBFD]/70 dark:bg-[#000000]/70 backdrop-blur-xl !overflow-visible" />;
  }

  return (
    <header className={headerClasses}>
    
      <div
        className={`container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 sm:gap-5 transition-all duration-300 ${
          isScrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-5 md:gap-7 xl:gap-8 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-2xl"
            aria-label="Go to DealFlow.AI homepage"
          >
            <div className="flex h-9 sm:h-9.5 w-9 sm:w-9.5 items-center justify-center rounded-2xl bg-[#0071E3] text-white shadow-sm transition-transform group-hover:scale-105 group-active:scale-95">
              <IconDealflowLogo className="h-5 w-5" aria-hidden />
            </div>
            <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] inline-block">
              DEALFLOW<span className="text-[#0071E3]">.AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex lg:flex items-center gap-1 md:gap-1.5" aria-label="Main navigation">
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
              const isAnchor = link.href.includes("#");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-[#0071E3] bg-[#0071E3]/10 dark:text-[#2997FF] dark:bg-[#2997FF]/15 border border-[#0071E3]/20"
                      : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isAnchor && <span className="text-[#0071E3] mr-0.5 font-bold">#</span>}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Quick Access Icons, Actions, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Browser Agent (All Sizes) */}
          <Link
            href="/browser-agent"
            className="relative inline-flex items-center justify-center p-2 sm:p-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#161618]/70 text-[#1D1D1F] dark:text-white hover:border-[#0071E3] hover:text-[#0071E3] transition-colors shadow-sm"
            aria-label="Open Browser Agent"
          >
            <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse" aria-hidden="true" />
          </Link>
          
          {/* More Options Icon */}
          <Link
            href="/all-options"
            className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#161618]/70 text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors shadow-sm"
            aria-label="View all application options"
          >
            <MoreHorizontal className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </Link>

          {/* Notifications Center (Tablet & Desktop) */}
          <div className="hidden sm:block">
            <NotificationCenter />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Streamlined Account management menu (Tablet & Desktop) */}
          <div className="hidden sm:block">
            <AccountMenu />
          </div>

          {/* Action CTAs (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.12]">
            <Link
              href="/book-demo"
              onClick={handleBookMeeting}
              className="border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-[#161618]/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[#1D1D1F] dark:text-white font-semibold px-4 py-2 h-9 flex items-center gap-1.5 text-xs rounded-full shadow-sm transition-all"
            >
              <Calendar className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Book a Demo</span>
            </Link>

            <Link
              href="/portal/customer/login?signup=true"
              onClick={handleGetStarted}
              className="btn-apple-primary font-semibold px-4.5 py-2 h-9 flex items-center gap-1.5 text-xs shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger triggers full command drawer */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#161618]/70 text-[#1D1D1F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
            aria-label="Open main menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Top Navigation Strip */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#FBFBFD]/90 dark:bg-[#000000]/90 border-t border-black/[0.06] dark:border-white/[0.1] text-xs font-semibold scrollbar-none" aria-label="Mobile navigation">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? "text-[#0071E3] bg-[#0071E3]/10 dark:text-[#2997FF] dark:bg-[#2997FF]/15 border border-[#0071E3]/20"
                  : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white bg-white/70 dark:bg-[#161618]/70 border border-black/[0.06] dark:border-white/[0.1]"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Slide-out Mobile Command Drawer */}
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
