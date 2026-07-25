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
        initial: { opacity: 0, y: 16, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.94 },
        transition: { duration: 0.22, ease: [0.2, 1, 0.3, 1] as [number, number, number, number] },
      };

  return (
    <div
      ref={containerRef}
      className="relative animate-fade-in"
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
        className={`group relative inline-flex items-center gap-2 px-4.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
          isActive
            ? "text-teal-300 bg-gradient-to-r from-teal-500/15 to-teal-400/10 border border-teal-500/20"
            : "text-slate-400 hover:text-teal-300 hover:bg-white/10 border border-transparent hover:border-white/15"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060612]`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {link.name}
        {link.name === "Portal" && (
          <span className="relative flex h-1.5 w-1.5 select-none" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-all duration-300 ${
            isOpen ? "rotate-180 text-teal-300" : "text-slate-500 group-hover:text-slate-400"
          }`}
          aria-hidden="true"
        />
        {isActive && (
          <motion.div
            layoutId="nav-underline"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 via-violet-400 to-fuchsia-400"
          />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...contentAnimationProps}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[360px] rounded-3xl dropdown-glass shadow-2xl shadow-black/60 overflow-hidden z-[100] p-3"
            role="menu"
            aria-label={`${link.name} Submenu`}
          >
            {/* Header/Overview button */}
            <Link
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-4 rounded-xl text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10 transition-all duration-300 text-xs font-bold group border border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10"
            >
              <span className="flex items-center gap-2.5">
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
    ? "sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-b from-[#060612]/95 to-[#050510]/92 df-glass backdrop-blur-3xl !overflow-visible shadow-xl shadow-black/20"
    : "sticky top-0 z-50 w-full border-b border-white/8 bg-[#060612]/75 df-glass backdrop-blur-2xl !overflow-visible";

  if (!mounted) {
    return <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#060612]/75 df-glass backdrop-blur-2xl !overflow-visible" />;
  }

  return (
    <header className={headerClasses}>
    
      <div
        className={`container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 sm:gap-5 transition-all duration-500 ${
          isScrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Left Side: Logo & Main Navigation Links */}
        <div className="flex items-center gap-5 md:gap-7 xl:gap-9 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-2xl"
            aria-label="Go to DealFlow.AI homepage"
          >
            <div className="flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/25 via-cyan-500/20 to-violet-500/15 backdrop-blur-md border border-teal-500/25 shadow-[0_0_25px_rgba(20,184,166,0.25)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(20,184,166,0.45)] group-active:scale-95 animate-glow-pulse">
              <IconDealflowLogo className="h-5.5 sm:h-6.5 w-5.5 sm:w-6.5" aria-hidden />
            </div>
            <span className="font-display text-base sm:text-xl font-bold tracking-tight text-white inline-block">
              DealFlow<span className="gradient-text-teal">.AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex lg:flex items-center gap-1.5 md:gap-2" aria-label="Main navigation">
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
                  className={`relative px-3 sm:px-4.5 py-2.5 sm:py-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-teal-300 bg-gradient-to-r from-teal-500/15 to-teal-400/10 border border-teal-500/20 shadow-md shadow-teal-500/10"
                      : isAnchor
                        ? "text-slate-400/80 hover:text-teal-300 hover:bg-white/5 border border-transparent hover:border-white/10"
                        : "text-slate-400 hover:text-teal-300 hover:bg-white/10 border border-transparent hover:border-white/15"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isAnchor && <span className="text-teal-500/60 mr-1 font-bold">#</span>}
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 via-violet-400 to-fuchsia-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Quick Access Icons, Actions, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Browser Agent (All Sizes) */}
          <Link
            href="/browser-agent"
            className="relative inline-flex items-center justify-center p-2.5 sm:p-3 rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/20 via-cyan-500/15 to-teal-400/15 hover:from-teal-500/30 hover:via-cyan-500/25 hover:to-teal-400/25 text-teal-300 hover:text-teal-100 transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] group animate-glow-pulse"
            aria-label="Open Browser Agent"
          >
            <Bot className="h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,1)] animate-pulse" aria-hidden="true" />
          </Link>
          
          {/* More Options Icon */}
          <Link
            href="/all-options"
            className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-2xl border border-white/15 bg-white/6 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            aria-label="View all application options"
          >
            <MoreHorizontal className="h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform duration-300 group-hover:scale-110" />
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
          <div className="hidden md:flex items-center gap-2 md:gap-3 pl-0 md:pl-3 md:border-l md:border-white/10">
            <ExtrudedButton
              variant="outline"
              className="border-teal-500/30 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 hover:from-teal-500/25 hover:to-cyan-500/20 text-teal-300 font-semibold px-3 md:px-5 py-2 h-9 md:h-10 flex items-center gap-2 md:gap-2.5 shadow-[0_0_20px_rgba(20,184,166,0.15)] text-xs rounded-2xl"
              onClick={handleBookMeeting}
            >
              <Calendar className="h-4 w-4 md:h-4.5 md:w-4.5" />
              <span>Book a Demo</span>
            </ExtrudedButton>

            <ExtrudedButton
              className="bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-500 hover:from-teal-500 hover:via-cyan-400 hover:to-teal-400 text-white font-semibold px-4 md:px-6 py-2 md:py-2.5 h-9 md:h-10 shadow-xl shadow-teal-600/35 transition-all duration-300 hover:shadow-teal-500/50 text-xs rounded-2xl"
              onClick={handleGetStarted}
            >
              Get Started
            </ExtrudedButton>
          </div>

          {/* Mobile hamburger triggers full command drawer */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2.5 rounded-2xl border border-white/15 bg-white/6 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            aria-label="Open main menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Top Navigation Strip */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#060612]/95 border-t border-white/8 text-xs font-semibold scrollbar-none" aria-label="Mobile navigation">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? "text-teal-300 bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-500/30"
                  : "text-slate-300 hover:text-white bg-white/5 border border-white/10"
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
