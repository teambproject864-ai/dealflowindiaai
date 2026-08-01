// lib/kimi-rbac.ts
import { UserRole } from "./auth";

export type KimiFeature =
  | "inference"
  | "task_reporting"
  | "system_analytics"
  | "config_management"
  | "fine_tuning"
  | "permission_adjustment"
  | "advanced_params";

export interface RoleKimiPermissions {
  role: UserRole;
  allowedFeatures: KimiFeature[];
  maxContextWindow: number;
  allowedParameters: string[];
  metadataLabel: string;
}

export const KIMI_ROLE_PERMISSIONS: Record<UserRole, RoleKimiPermissions> = {
  admin: {
    role: "admin",
    allowedFeatures: [
      "inference",
      "task_reporting",
      "system_analytics",
      "config_management",
      "fine_tuning",
      "permission_adjustment",
      "advanced_params",
    ],
    maxContextWindow: 131072, // Full 128k context
    allowedParameters: [
      "temperature",
      "top_p",
      "max_tokens",
      "frequency_penalty",
      "presence_penalty",
      "system_prompt",
      "fine_tuning_id",
      "config_override",
      "stream",
    ],
    metadataLabel: "Admin: Full System Config, Analytics & Fine-Tuning Authorized",
  },
  agent: {
    role: "agent",
    allowedFeatures: ["inference", "task_reporting"],
    maxContextWindow: 131072, // Up to 128k context for assigned operational playbooks
    allowedParameters: ["temperature", "max_tokens", "top_p", "stream"],
    metadataLabel: "Agent: Inference & Task Reporting Enabled",
  },
  customer: {
    role: "customer",
    allowedFeatures: ["inference"],
    maxContextWindow: 32768, // Tier-bounded context limit
    allowedParameters: ["stream"],
    metadataLabel: "Customer: Standard Tier Inference Authorized",
  },
};

/**
 * Validates whether a specific Kimi LLM feature is authorized for a given user role.
 */
export function isKimiFeatureAllowed(role: string = "customer", feature: KimiFeature): boolean {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = KIMI_ROLE_PERMISSIONS[normalizedRole] || KIMI_ROLE_PERMISSIONS.customer;
  return config.allowedFeatures.includes(feature);
}

/**
 * Validates request parameters against role-based boundaries.
 * Returns sanitized parameters stripped of unauthorized parameter overrides.
 */
export function validateKimiParameters(
  role: string = "customer",
  params: Record<string, any> = {}
): {
  allowed: boolean;
  sanitizedParams: Record<string, any>;
  unauthorizedParams: string[];
  reason?: string;
} {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const config = KIMI_ROLE_PERMISSIONS[normalizedRole] || KIMI_ROLE_PERMISSIONS.customer;
  const allowedSet = new Set(config.allowedParameters);

  const sanitizedParams: Record<string, any> = {};
  const unauthorizedParams: string[] = [];

  // #region debug-point A:kimi-param-validate-enter
  (() => {
    if (typeof window !== "undefined") return;
    const fs = require("fs"),
      p = ".dbg/rbac-param-login.env";
    let u = "http://127.0.0.1:7777/event",
      s = "rbac-param-login";
    try {
      const e = fs.readFileSync(p, "utf8");
      u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u;
      s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s;
    } catch {}
    fetch(u, {
      method: "POST",
      body: JSON.stringify({
        sessionId: s,
        runId: "pre",
        hypothesisId: "A",
        location: "lib/kimi-rbac.ts:validateKimiParameters",
        msg: "[DEBUG] validateKimiParameters enter",
        data: { normalizedRole, paramKeys: Object.keys(params || {}) },
        ts: Date.now(),
      }),
    }).catch(() => {});
  })();
  // #endregion

  for (const [key, value] of Object.entries(params)) {
    // Basic body keys (messages, model, topic, prompt, etc.) are always allowed
    if (["messages", "model", "prompt", "topic", "industry", "targetAudience", "region", "tone", "budget"].includes(key)) {
      sanitizedParams[key] = value;
      continue;
    }

    if (allowedSet.has(key)) {
      sanitizedParams[key] = value;
    } else {
      unauthorizedParams.push(key);
    }
  }

  if (unauthorizedParams.length > 0) {
    // #region debug-point A:kimi-param-validate-deny-customer
    (() => {
      if (typeof window !== "undefined") return;
      const fs = require("fs"),
        p = ".dbg/rbac-param-login.env";
      let u = "http://127.0.0.1:7777/event",
        s = "rbac-param-login";
      try {
        const e = fs.readFileSync(p, "utf8");
        u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u;
        s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s;
      } catch {}
      fetch(u, {
        method: "POST",
        body: JSON.stringify({
          sessionId: s,
          runId: "post",
          hypothesisId: "A",
          location: "lib/kimi-rbac.ts:106-113",
          msg: "[DEBUG] validateKimiParameters deny (all roles)",
          data: { normalizedRole, unauthorizedParams },
          ts: Date.now(),
        }),
      }).catch(() => {});
    })();
    // #endregion
    return {
      allowed: false,
      sanitizedParams,
      unauthorizedParams,
      reason: `Role '${normalizedRole}' is not authorized to override parameters: ${unauthorizedParams.join(", ")}`,
    };
  }

  // #region debug-point A:kimi-param-validate-allow
  (() => {
    if (typeof window !== "undefined") return;
    const fs = require("fs"),
      p = ".dbg/rbac-param-login.env";
    let u = "http://127.0.0.1:7777/event",
      s = "rbac-param-login";
    try {
      const e = fs.readFileSync(p, "utf8");
      u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u;
      s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s;
    } catch {}
    fetch(u, {
      method: "POST",
      body: JSON.stringify({
        sessionId: s,
        runId: "pre",
        hypothesisId: "A",
        location: "lib/kimi-rbac.ts:return",
        msg: "[DEBUG] validateKimiParameters allow",
        data: { normalizedRole, unauthorizedParams, sanitizedKeys: Object.keys(sanitizedParams) },
        ts: Date.now(),
      }),
    }).catch(() => {});
  })();
  // #endregion

  return {
    allowed: true,
    sanitizedParams,
    unauthorizedParams,
  };
}

/**
 * Returns role metadata label for display in model selection UI.
 */
export function getRoleMetadataLabel(role: string = "customer"): string {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  return KIMI_ROLE_PERMISSIONS[normalizedRole]?.metadataLabel || KIMI_ROLE_PERMISSIONS.customer.metadataLabel;
}

/**
 * Returns detailed capability summary object for UI feature-gating.
 */
export function getKimiCapabilitiesSummary(role: string = "customer") {
  const normalizedRole = (role?.toLowerCase() || "customer") as UserRole;
  const allowedFeatures = KIMI_ROLE_PERMISSIONS[normalizedRole]?.allowedFeatures || KIMI_ROLE_PERMISSIONS.customer.allowedFeatures;

  return {
    canManageConfig: allowedFeatures.includes("config_management"),
    canAccessFineTuning: allowedFeatures.includes("fine_tuning"),
    canViewSystemAnalytics: allowedFeatures.includes("system_analytics"),
    canAdjustPermissions: allowedFeatures.includes("permission_adjustment"),
    canViewTaskReporting: allowedFeatures.includes("task_reporting"),
    canUseAdvancedParams: allowedFeatures.includes("advanced_params"),
    canRunInference: allowedFeatures.includes("inference"),
  };
}
