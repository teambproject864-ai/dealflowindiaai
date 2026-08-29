// lib/scrapegraph-rbac.ts
import { UserRole } from "./auth";

export type ScrapeGraphFeature =
  | "job_view"
  | "job_create"
  | "dataset_view"
  | "dataset_delete";

export interface RoleScrapeGraphPermissions {
  role: UserRole;
  allowedFeatures: ScrapeGraphFeature[];
  maxPagesPerJob: number;
  metadataLabel: string;
}

export const SCRAPEGRAPH_ROLE_PERMISSIONS: Record<UserRole, RoleScrapeGraphPermissions> = {
  admin: {
    role: "admin",
    allowedFeatures: [
      "job_view",
      "job_create",
      "dataset_view",
      "dataset_delete",
    ],
    maxPagesPerJob: 50,
    metadataLabel: "Admin: Full ScrapeGraphAI Extraction & Warehouse Access",
  },
  agent: {
    role: "agent",
    allowedFeatures: [
      "job_view",
      "job_create",
      "dataset_view",
    ],
    maxPagesPerJob: 20,
    metadataLabel: "Agent: Standard Extraction Pipeline Authorized",
  },
  customer: {
    role: "customer",
    allowedFeatures: [
      "job_view",
      "job_create",
      "dataset_view",
    ],
    maxPagesPerJob: 5,
    metadataLabel: "Customer: Standard Scraping Graph Execution",
  },
};

/**
 * Validates whether a specific ScrapeGraphAI feature is authorized for a given user role.
 */
export function isScrapeGraphFeatureAllowed(role: string = "customer", feature: ScrapeGraphFeature): boolean {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = SCRAPEGRAPH_ROLE_PERMISSIONS[normalizedRole];
  if (!config) return false;
  return config.allowedFeatures.includes(feature);
}

/**
 * Retrieves the maximum permitted scraping pages per job for a given user role.
 */
export function getScrapeGraphMaxPages(role: string = "customer"): number {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = SCRAPEGRAPH_ROLE_PERMISSIONS[normalizedRole] || SCRAPEGRAPH_ROLE_PERMISSIONS.customer;
  return config.maxPagesPerJob;
}
