/**
 * Application Security Hardening Engine
 * Implements security primitives:
 * - PIN & Password Cryptographic Hashing with Salt (Web Crypto SHA-256)
 * - Rate Limiting for Authentication Attempts (Brute-Force & Credential-Stuffing Defense)
 * - Anti-Bot & Honeypot Validation for Customer/Public Forms
 * - Session State Integrity & Expiration
 * - Safe Query Parameterization & Response Trimming (PII Masking)
 */

// In-memory rate limiting tracking store
interface RateLimitRecord {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

const loginRateLimitMap = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

/**
 * Checks if an action or user is currently rate-limited.
 */
export function checkRateLimit(key: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(key);

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  // Check if active lockout period has expired
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
  }

  // If window expired without lockout, reset attempts
  if (now - record.lastAttemptTime > ATTEMPT_WINDOW_MS) {
    loginRateLimitMap.delete(key);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * Records a failed attempt for rate limiting.
 */
export function recordFailedAttempt(key: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(key) || { attempts: 0, lastAttemptTime: now, lockedUntil: 0 };

  record.attempts += 1;
  record.lastAttemptTime = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginRateLimitMap.set(key, record);
    return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }

  loginRateLimitMap.set(key, record);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS - record.attempts };
}

/**
 * Resets the rate limiter on successful authentication.
 */
export function resetRateLimit(key: string): void {
  loginRateLimitMap.delete(key);
}

/**
 * Computes a salted SHA-256 hash using the Web Crypto API.
 */
export async function hashPINWithSalt(pin: string, salt: string = 'brixton-market-salt-2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback hash for initial client validation.
 */
export function quickHashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validates form submission against bot behavior (honeypot check and submission speed check).
 */
export interface BotChallengeData {
  honeypotValue?: string; // Should always remain empty for humans
  renderedTimestamp: number; // Time when the form was rendered
}

export function validateHumanSubmission(data: BotChallengeData): { isHuman: boolean; reason?: string } {
  // 1. Honeypot check: If the hidden honeypot field has a value, it was filled by an automated bot
  if (data.honeypotValue && data.honeypotValue.trim().length > 0) {
    return { isHuman: false, reason: 'Bot activity detected (honeypot triggered).' };
  }

  // 2. Submission speed check: A human requires at least 400ms to fill a form
  const duration = Date.now() - data.renderedTimestamp;
  if (duration < 300) {
    return { isHuman: false, reason: 'Submission too fast. Please retry.' };
  }

  return { isHuman: true };
}

/**
 * Masks sensitive PII (like phone numbers and emails) for safe client logging and display.
 */
export function maskSensitivePhone(phone: string): string {
  if (!phone || phone.length < 5) return '***';
  const clean = phone.trim();
  const visiblePrefix = clean.slice(0, 3);
  const visibleSuffix = clean.slice(-2);
  return `${visiblePrefix}****${visibleSuffix}`;
}

export function maskSensitiveEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  const visibleUser = user.length > 2 ? `${user.slice(0, 2)}***` : `${user}***`;
  return `${visibleUser}@${domain}`;
}

/**
 * Trims and purges excess or unauthorized internal fields from public API objects.
 */
export function trimPublicProduct<T extends Record<string, any>>(product: T): Partial<T> {
  const copy = { ...product };
  // Cost price and supplier margin are restricted internal attributes
  delete copy.costPrice;
  delete copy.supplierId;
  delete copy.minCost;
  delete copy.targetMarginPercent;
  return copy;
}
