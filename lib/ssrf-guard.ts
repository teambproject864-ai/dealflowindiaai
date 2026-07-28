// lib/ssrf-guard.ts
import { URL } from "url";

/**
 * Validates a meeting or webhook URL against Server-Side Request Forgery (SSRF) vulnerabilities.
 * Rejects non-HTTP/HTTPS schemes, localhost, private IP subnets (RFC 1918), and Cloud IMDS endpoints.
 */
export function validateSafeExternalUrl(inputUrl: string): { valid: boolean; error?: string } {
  if (!inputUrl || typeof inputUrl !== "string") {
    return { valid: false, error: "URL must be a non-empty string" };
  }

  const trimmed = inputUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // 1. Protocol check
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only http and https protocols are permitted" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Domain & Hostname blocklist
  if (
    hostname === "localhost" ||
    hostname === "loopback" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { valid: false, error: "Local/internal hostnames are forbidden" };
  }

  // 3. IP Address Checks (Loopback, Private Subnets RFC 1918, Link-Local, IMDS)
  // IPv4 regexes
  const ipv4Loopback = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const ipv4Private10 = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const ipv4Private172 = /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/;
  const ipv4Private192 = /^192\.168\.\d{1,3}\.\d{1,3}$/;
  const ipv4LinkLocal = /^169\.254\.\d{1,3}\.\d{1,3}$/;

  // IPv6 loopback / link-local / unique local
  const isIpv6Loopback = hostname === "::1" || hostname === "0:0:0:0:0:0:0:1" || hostname.startsWith("fe80:") || hostname.startsWith("fc00:") || hostname.startsWith("fd00:");

  if (
    ipv4Loopback.test(hostname) ||
    ipv4Private10.test(hostname) ||
    ipv4Private172.test(hostname) ||
    ipv4Private192.test(hostname) ||
    ipv4LinkLocal.test(hostname) ||
    isIpv6Loopback
  ) {
    return { valid: false, error: "Access to private, loopback, or cloud infrastructure IP ranges is restricted" };
  }

  return { valid: true };
}
