/**
 * Input & HTML sanitization to prevent XSS and injection attacks.
 * Strips dangerous HTML tags, attributes, and script execution contexts.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  let sanitized = String(input);

  // Remove script tags and other potentially dangerous elements
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous attributes like onload, onclick, etc.
  sanitized = sanitized.replace(/\s(on\w+)\s*=/gi, ' data-disallowed-$1=');

  // Escape HTML characters to prevent XSS
  const escapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  sanitized = sanitized.replace(/[&<>"]/g, (char) => escapeMap[char]);

  return sanitized;
}

/**
 * Strips dangerous tags (script, iframe, embed, object) and event handlers
 * while preserving safe semantic layout markup (p, h1-h6, table, ul, span, div).
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  let sanitized = String(html);

  // Remove script tags and their contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe, object, embed, form, meta, link, base tags
  sanitized = sanitized.replace(/<\/?(iframe|object|embed|form|meta|link|base|style)[^>]*>/gi, '');

  // Remove javascript: and vbscript: URIs
  sanitized = sanitized.replace(/href\s*=\s*["']?\s*(javascript|vbscript|data):/gi, 'href="about:blank" data-blocked-uri=');
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*(javascript|vbscript):/gi, 'src="" data-blocked-uri=');

  // Remove on* event handlers (onclick, onerror, onload, onmouseover, etc.)
  sanitized = sanitized.replace(/\s(on\w+)\s*=/gi, ' data-disallowed-$1=');

  return sanitized;
}

/**
 * Recursively sanitize all string values in an object or array
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj && typeof obj === 'object') {
    const sanitizedObj: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeObject(value);
    }
    return sanitizedObj;
  }
  return obj;
}
