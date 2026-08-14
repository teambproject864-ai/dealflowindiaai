// components/Footer.tsx
"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github, Mail, ShieldCheck } from "lucide-react";
import { IconDealflowLogo } from "./gtm/GtmIcons";

export function Footer() {
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
              The AI Operating System for Revenue Teams. Pipeline intelligence, autonomous agents, and GTM clarity &mdash; unified.
            </p>
            {/* Social links */}
            <div className="flex gap-2 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#161618] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white hover:border-[#0071E3] transition-colors shadow-sm"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-3">
            <div>
              <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] uppercase tracking-wider mb-4">
                Product
              </h3>
              <ul className="space-y-2.5">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs font-normal text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-2.5">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs font-normal text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] uppercase tracking-wider mb-4">
                Legal & Privacy
              </h3>
              <ul className="space-y-2.5">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-xs font-normal text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#0071E3] dark:hover:text-white transition-colors"
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
        <div className="mt-12 pt-8 border-t border-black/[0.08] dark:border-white/[0.12] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#86868B]">
          <p>
            &copy; {new Date().getFullYear()} DealFlow AI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.12] text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" /> SOC 2 Type II (Audit in Progress)
            </span>
            <span className="text-[11px] text-[#86868B]">Enterprise Revenue Operations</span>
          </div>
        </div>
      </div>
    </footer>
  );
}