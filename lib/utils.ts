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
