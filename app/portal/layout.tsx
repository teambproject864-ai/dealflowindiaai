"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, getCustomerDisplayName } from "@/lib/utils";
import { GlassPanel } from "@/components/immersive/GlassPanel";
import { Loader3D } from "@/components/immersive/Loader3D";
import { Magnetic } from "@/components/immersive/Magnetic";
import { ExtrudedButton } from "@/components/immersive/ExtrudedButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LogoutButton from "@/components/auth/LogoutButton";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, isLoading } = useCurrentUser();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Auth guard: redirect unauthenticated users to the correct login page
  useEffect(() => {
    if (isLoading) return; // Wait until user state is resolved

    const currentPath = pathname || "";

    // Determine if the current path is a login/public page
    const isLoginPage =
      currentPath === "/portal" ||
      currentPath === "/portal/admin/login" ||
      currentPath === "/portal/customer/login" ||
      currentPath === "/portal/agent/login";

    if (!currentUser && !isLoginPage) {
      // Redirect to the appropriate login based on path
      if (currentPath.startsWith("/portal/admin")) {
        router.push("/portal/admin/login");
      } else if (currentPath.startsWith("/portal/customer")) {
        router.push("/portal/customer/login");
      } else if (currentPath.startsWith("/portal/agent")) {
        router.push("/portal/agent/login");
      } else {
        router.push("/portal");
      }
    } else {
      setCheckingAccess(false);
    }
  }, [currentUser, isLoading, pathname, router]);

  if (checkingAccess || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] immersive-scene">
        <Loader3D label="Loading portal" />
      </div>
    );
  }

  // Role-based Access Control (N-01)
  const currentPath = pathname || "";
  const isLoginPage =
    currentPath === "/portal" ||
    currentPath === "/portal/admin/login" ||
    currentPath === "/portal/customer/login" ||
    currentPath === "/portal/agent/login";

  let isForbidden = false;
  if (currentUser && !isLoginPage) {
    if (currentPath.startsWith("/portal/admin") && currentUser.role !== "admin") {
      isForbidden = true;
    } else if (currentPath.startsWith("/portal/agent") && currentUser.role !== "agent" && currentUser.role !== "admin") {
      isForbidden = true;
    } else if (currentPath.startsWith("/portal/customer") && currentUser.role !== "customer" && currentUser.role !== "admin") {
      isForbidden = true;
    }
  }

  if (isForbidden) {
    const defaultAllowedPortal =
      currentUser?.role === "admin"
        ? "/portal/admin"
        : currentUser?.role === "agent"
        ? "/portal/agent"
        : "/portal/customer";

    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center immersive-scene">
        <GlassPanel className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-rose-400">403 — Access Forbidden</h2>
          <p className="text-sm text-slate-300">
            Your role (<strong className="capitalize">{currentUser?.role}</strong>) does not have permission to view this section.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              href={defaultAllowedPortal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Go to Your Authorized Portal
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const navLinks = [
    { href: "/portal/admin", label: "Admin Dashboard", match: "/portal/admin", allowedRoles: ["admin"] },
    { href: "/portal/agent", label: "Agent Portal", match: "/portal/agent", allowedRoles: ["admin", "agent"] },
    { href: "/portal/customer", label: "Customer Portal", match: "/portal/customer", allowedRoles: ["admin", "customer"] },
  ].filter(link => !currentUser || link.allowedRoles.includes(currentUser.role));

  return (
    <div className="min-h-[calc(100vh-8rem)] immersive-scene">
      <GlassPanel depth="front" tilt={false} className="mb-8 p-4 bg-slate-900/80 border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Magnetic>
              <Link href="/portal" className="text-xl font-extrabold tracking-wider text-gradient-teal flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-400 text-sm font-black">
                  DF
                </span>
                DEALFLOW<span className="text-violet-400">.AI</span>
              </Link>
            </Magnetic>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Portal navigation">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "relative rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 flex items-center gap-2",
                    isActive
                      ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  )}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser && (() => {
              const uName = typeof getCustomerDisplayName === "function"
                ? getCustomerDisplayName(currentUser)
                : (currentUser.name || currentUser.email?.split("@")[0] || "User");
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 font-bold text-xs">
                    {uName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 leading-none">{uName}</span>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-400">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              );
            })()}
            <LogoutButton />
          </div>
        </div>
      </GlassPanel>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
