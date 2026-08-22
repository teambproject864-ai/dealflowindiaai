// components/Footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Twitter, Linkedin, Github, Mail, ShieldCheck } from "lucide-react";
import { IconDealflowLogo } from "./gtm/GtmIcons";

export function Footer() {
  const pathname = usePathname();

  // Completely hide footer across all pages within Admin, Agent, and Customer portals
  if (pathname && pathname.startsWith("/portal")) {
    return null;
  }

  const navigation = {
    product: [
      { name: "Solutions", href: "/solutions" },
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "RAG Analysis", href: "/rag" },
    ],
    company: [
      { name: "Book a Demo", href: "/book-demo" },
      { name: "Support", href: "/support" },
      { name: "Docs", href: "/docs" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Security", href: "/security" },
      { name: "Do Not Sell My Info", href: "/account/privacy" },
      { name: "Privacy Preferences", href: "/account/privacy" },
    ],
  };

  const socialLinks = [
    { name: "Email", icon: Mail, href: "mailto:hello@dealsflow.ai" },
  ];

  return (
    <footer className="w-full bg-[#F5F5F7]/90 dark:bg-[#0A0A0C] border-t border-black/[0.08] dark:border-white/[0.12] transition-colors">
      <div className="mx-auto max-w-7xl px-6 py-14">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="DealFlow AI homepage"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0071E3] text-white shadow-sm transition-transform group-hover:scale-105">
                <IconDealflowLogo className="h-5 w-5" aria-hidden />
              </div>
              <span className="font-sans text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                DEALFLOW<span className="text-[#0071E3]">.AI</span>
              </span>
            </Link>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed max-w-xs font-normal">
              DealFlow.ai is an autonomous AI workforce that doesn&apos;t just recommend what your business should do &mdash; it actually does the work. From objective intake to closed deals and requirement delivery.
            </p>
            {/* Social links */}
            <div className="flex gap-2 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div className="grid grid-cols-3 gap-8 lg:col-span-3">
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                Company
              </p>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                Trust & Security
              </p>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#34C759]" />
            <span>SOC2 Type II Certified · ISO 27001 · GDPR Compliant</span>
          </div>
          <p>© {new Date().getFullYear()} DealFlow AI, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}