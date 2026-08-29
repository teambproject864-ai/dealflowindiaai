import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCustomerDisplayName(user?: { name?: string | null; email?: string | null } | null): string {
  if (!user) return "Customer Name";
  
  const rawName = user.name?.trim();
  const genericPlaceholders = ["valued customer", "customer", "customer account", "demo customer", "user", "dealflow user"];
  
  if (rawName && !genericPlaceholders.includes(rawName.toLowerCase())) {
    return rawName;
  }
  
  if (user.email && user.email.includes("@")) {
    const emailPrefix = user.email.split("@")[0];
    const cleaned = emailPrefix
      .replace(/[._\-+]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
    
    if (cleaned && cleaned.length > 1) {
      return cleaned;
    }
  }
  
  return "Customer Name";
}

export function isBuildPhase(): boolean {
  // Never treat as build phase if explicitly in production server runtime or running start command
  if (
    process.env.NEXT_PHASE === "phase-production-server" ||
    (Array.isArray(process.argv) && process.argv.includes("start"))
  ) {
    return false;
  }

  // 1. Next.js internal production build phase constant
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return true;
  }

  // 2. npm lifecycle script strictly equal to 'build'
  if (process.env.npm_lifecycle_event === "build") {
    return true;
  }

  // 3. CLI execution: only match when 'build' is the primary subcommand (e.g., `next build`)
  if (Array.isArray(process.argv) && process.argv.length >= 3) {
    const primaryCommand = process.argv[2]?.trim();
    if (primaryCommand === "build") {
      return true;
    }
  }

  return false;
}
