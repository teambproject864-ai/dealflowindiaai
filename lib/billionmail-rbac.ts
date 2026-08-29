// lib/billionmail-rbac.ts
import { UserRole } from "./auth";

export type BillionmailFeature =
  | "campaign_view"
  | "campaign_create"
  | "campaign_delete"
  | "analytics_view"
  | "contact_management";

export interface RoleBillionmailPermissions {
  role: UserRole;
  allowedFeatures: BillionmailFeature[];
  maxAudienceSize: number;
  metadataLabel: string;
}

export const BILLIONMAIL_ROLE_PERMISSIONS: Record<UserRole, RoleBillionmailPermissions> = {
  admin: {
    role: "admin",
    allowedFeatures: [
      "campaign_view",
      "campaign_create",
      "campaign_delete",
      "analytics_view",
      "contact_management",
    ],
    maxAudienceSize: 100000,
    metadataLabel: "Admin: Full Billionmail Autonomous Engine Access",
  },
  agent: {
    role: "agent",
    allowedFeatures: [
      "campaign_view",
      "campaign_create",
      "analytics_view",
      "contact_management",
    ],
    maxAudienceSize: 25000,
    metadataLabel: "Agent: Campaign Broadcast & Contact Management Authorized",
  },
  customer: {
    role: "customer",
    allowedFeatures: [
      "campaign_view",
      "campaign_create",
      "analytics_view",
      "contact_management",
    ],
    maxAudienceSize: 5000,
    metadataLabel: "Customer: Tier-Bounded Campaign Automation",
  },
};

/**
 * Validates whether a specific Billionmail feature is authorized for a given user role.
 */
export function isBillionmailFeatureAllowed(role: string = "customer", feature: BillionmailFeature): boolean {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = BILLIONMAIL_ROLE_PERMISSIONS[normalizedRole];
  if (!config) return false;
  return config.allowedFeatures.includes(feature);
}

/**
 * Retrieves the maximum permitted audience size for a given user role.
 */
export function getBillionmailMaxAudienceSize(role: string = "customer"): number {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = BILLIONMAIL_ROLE_PERMISSIONS[normalizedRole] || BILLIONMAIL_ROLE_PERMISSIONS.customer;
  return config.maxAudienceSize;
}
