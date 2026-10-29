/**
 * Comprehensive Input Sanitization and XSS Prevention Utilities
 * Ensures all user-submitted text, HTML, URLs, and file inputs are safely sanitized and escaped
 * before rendering, storing, or processing.
 */

// HTML entity map for escaping
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes unsafe characters for HTML rendering to prevent DOM-based XSS attacks.
 */
export function escapeHTML(str: string | null | undefined): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips HTML tags, script payloads, dangerous protocols, and control characters.
 * Trims whitespace and enforces maximum length limits.
 */
export function sanitizeText(
  input: string | null | undefined,
  maxLength: number = 2000
): string {
  if (typeof input !== 'string') return '';

  let cleaned = input
    // Remove null bytes and non-printable control characters (except newline / tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove dangerous inline protocols like javascript:, vbscript:, data:text/html
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Remove inline event handlers (onload=, onerror=, etc.)
    .replace(/on\w+\s*=/gi, '')
    .trim();

  // Enforce maximum length limit
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Strictly sanitizes and validates URLs (e.g. image URLs, website links).
 * Rejects javascript:, file:, data:text/html, or malicious protocols.
 * Allows safe http:, https:, and verified base64 image data URLs.
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Allow safe base64 images
  if (/^data:image\/(png|jpeg|jpg|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Strictly validate HTTP / HTTPS protocols
  try {
    let origin = 'https://localhost';
    if (typeof window !== 'undefined' && window.location && typeof window.location.origin === 'string' && window.location.origin !== 'null' && window.location.origin !== '') {
      origin = window.location.origin;
    }
    const parsed = new URL(trimmed, origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      // Return absolute or valid URL
      return parsed.href;
    }
  } catch {
    // Relative path check (e.g. /images/banana.jpg)
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
      return trimmed.replace(/[<>"'`;]/g, '');
    }
  }

  // If unsafe, return empty string
  return '';
}

/**
 * Sanitizes phone numbers, removing dangerous script payloads and keeping standard dialing chars.
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d+()\-\s]/g, '').trim().substring(0, 30);
}

/**
 * Sanitizes email addresses.
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (typeof email !== 'string') return '';
  const cleaned = sanitizeText(email, 150).toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitizes file names to prevent path traversal (../, /etc/) and malicious execution.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'file';
  // Strip directory separators, null bytes, and control characters
  let clean = fileName.replace(/[/\\?%*:|"<>]/g, '_').replace(/\.\./g, '_').trim();
  // Strip dangerous file extensions
  clean = clean.replace(/\.(php|phtml|phar|exe|bat|cmd|sh|cgi|pl|py|js|vbs|jar|wsf|scr|msi)$/i, '.safe');
  return clean.substring(0, 100);
}

/**
 * Recursively sanitizes all string properties in an object.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[sanitizeText(key, 50)] = sanitizeObject(value);
    }
    return result as T;
  }

  return obj;
}
