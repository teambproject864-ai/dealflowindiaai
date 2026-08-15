"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Settings, Shield, UserCheck, Users, LogIn, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getCustomerDisplayName } from "@/lib/utils";

export function AccountMenu() {
  const router = useRouter();
  const { user, isLoading, refetchUser } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          const focusableElements =
            dropdownRef.current?.querySelectorAll<
              HTMLAnchorElement | HTMLButtonElement
            >('a, button, [role="menuitem"]');
          if (focusableElements?.length) {
            (focusableElements[0] as HTMLElement).focus();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus first element when menu opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsOpen(false);
      window.location.replace("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const portalLinks = [
    { name: "Admin Portal", href: "/portal/admin/login", icon: Shield, color: "text-orange-400" },
    { name: "Agent Portal", href: "/portal/agent/login", icon: UserCheck, color: "text-teal-400" },
    { name: "Customer Portal", href: "/portal/customer/login", icon: Users, color: "text-violet-400" },
  ];

  if (!mounted) {
    return (
      <div className="relative z-40">
        {/* Server-rendered placeholder to match client structure */}
        <button
          className="flex items-center justify-center h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-slate-300 overflow-hidden"
          aria-label="User account menu"
          aria-expanded="false"
          aria-haspopup="true"
          data-testid="account-menu-trigger"
        >
          <User className="h-4.5 w-4.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative z-40">
      {/* Account Avatar Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
        aria-label="User account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="account-menu-trigger"
      >
        {user ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/15 text-teal-300 font-bold text-xs">
            {getInitials(getCustomerDisplayName(user))}
          </div>
        ) : (
          <User className="h-4.5 w-4.5" />
        )}
      </button>

      {/* Account Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-80 rounded-3xl dropdown-glass shadow-2xl shadow-black/60 overflow-hidden p-4 space-y-4 transition-all duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          {user ? (
            // Authenticated User Menu
            <>
              {/* User Info */}
              <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4 px-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/15 text-teal-700 dark:text-teal-300 font-bold text-sm border border-teal-500/20">
                  {getInitials(getCustomerDisplayName(user))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate leading-none mb-1.5">
                    {getCustomerDisplayName(user)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none">
                    {user.email}
                  </div>
                  <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/20">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-1.5 scrim-bg rounded-2xl p-1.5 border border-slate-200/50 dark:border-white/5">
                <Link
                  ref={firstFocusableRef}
                  href="/portal/customer?tab=account-settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:text-violet-755 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                  role="menuitem"
                >
                  <Settings className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-semibold">Account Settings</span>
                </Link>
                <Link
                  href="/portal/saved"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:text-violet-755 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                  role="menuitem"
                >
                  <User className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-semibold">Saved Items</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-250 dark:border-white/10 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-red-650 dark:text-red-400 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 text-left border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                  role="menuitem"
                  data-testid="account-logout-btn"
                >
                  <LogOut className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </>
          ) : (
            // Guest Menu with Portal Logins
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Access Portal
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Portal Links */}
              <div className="px-1.5 py-1.5 space-y-2 scrim-bg rounded-2xl border border-slate-200/50 dark:border-white/5">
                {portalLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    ref={index === 0 ? firstFocusableRef : undefined}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/15 text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white transition-all duration-300 shadow-sm"
                    role="menuitem"
                  >
                    <div className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 ${link.color}`}>
                      <link.icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-semibold text-sm leading-none">{link.name}</span>
                  </Link>
                ))}
              </div>

              {/* Sign In Button */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-3 px-1">
                <Link
                  href="/portal/customer/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-xs bg-gradient-to-r from-teal-700 to-cyan-600 hover:from-teal-650 hover:to-cyan-550 text-white font-bold transition-all duration-300 shadow-lg shadow-teal-700/20 hover:shadow-teal-650/40"
                  role="menuitem"
                >
                  <LogIn className="h-4.5 w-4.5" />
                  <span>Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
