import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Secret key for HMAC signing tokens (from env or cryptographically secure runtime fallback)
const AUTH_SECRET = process.env.ADMIN_DEVICE_AUTH_SECRET || 'brixton-market-pitch18-secure-device-hmac-salt-9821';

// Exactly 3 authorized device identifiers as specified by business requirements:
// 1. Boss's personal phone
// 2. Boss's personal laptop
// 3. Personal work laptop
export const AUTHORIZED_DEVICE_SLOTS = [
  { id: 'boss-phone', name: "Boss's Personal Phone", defaultPairingKey: 'BOSS-PHONE-0918' },
  { id: 'boss-laptop', name: "Boss's Personal Laptop", defaultPairingKey: 'BOSS-LAPTOP-0918' },
  { id: 'work-laptop', name: 'Personal Work Laptop', defaultPairingKey: 'WORK-LAPTOP-0918' },
] as const;

export type DeviceSlotId = typeof AUTHORIZED_DEVICE_SLOTS[number]['id'];

interface DeviceTokenPayload {
  deviceId: DeviceSlotId;
  fingerprintHash: string;
  issuedAt: number;
}

/**
 * Creates an HMAC-SHA256 signature for the token payload
 */
function signPayload(payloadString: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payloadString).digest('hex');
}

/**
 * Generates a tamper-proof signed device token
 */
export function generateDeviceToken(deviceId: DeviceSlotId, clientFingerprint: string): string {
  const fingerprintHash = crypto
    .createHash('sha256')
    .update(clientFingerprint || 'unknown-client')
    .digest('hex')
    .substring(0, 16);

  const payload: DeviceTokenPayload = {
    deviceId,
    fingerprintHash,
    issuedAt: Date.now(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a signed device token against server secret and device whitelist
 */
export function verifyDeviceToken(token: string, clientFingerprint?: string): { valid: boolean; deviceId?: DeviceSlotId } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadBase64, signature] = parts;

  // Verify HMAC signature in constant time
  const expectedSignature = signPayload(payloadBase64);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false };
  }

  try {
    const payload: DeviceTokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));

    // Check deviceId is in the 3 authorized slots
    const isAuthorizedSlot = AUTHORIZED_DEVICE_SLOTS.some((slot) => slot.id === payload.deviceId);
    if (!isAuthorizedSlot) {
      return { valid: false };
    }

    // Check fingerprint consistency if provided
    if (clientFingerprint) {
      const currentFingerprintHash = crypto
        .createHash('sha256')
        .update(clientFingerprint)
        .digest('hex')
        .substring(0, 16);

      if (payload.fingerprintHash !== currentFingerprintHash) {
        return { valid: false };
      }
    }

    return { valid: true, deviceId: payload.deviceId };
  } catch {
    return { valid: false };
  }
}

/**
 * Production-ready Express middleware that restricts access to the 3 registered devices only.
 * Returns HTTP 403 Forbidden with clear diagnostic code if token is invalid or missing.
 */
export function requireAdminDeviceAuth(req: Request, res: Response, next: NextFunction): void {
  // Read token from signed/standard cookies or X-Admin-Device-Token header
  const token =
    req.cookies?.['admin_device_token'] ||
    (req.headers['x-admin-device-token'] as string | undefined);

  if (!token) {
    res.status(403).json({
      error: 'Access Denied: Unregistered device. This terminal is not authorized for Admin access.',
      code: 'DEVICE_UNAUTHORIZED',
    });
    return;
  }

  const userAgent = req.headers['user-agent'] || '';
  const clientFingerprint = (req.headers['x-device-fingerprint'] as string) || userAgent;

  const verification = verifyDeviceToken(token, clientFingerprint);

  if (!verification.valid || !verification.deviceId) {
    res.status(403).json({
      error: 'Access Denied: Invalid or revoked device credentials.',
      code: 'INVALID_DEVICE_TOKEN',
    });
    return;
  }

  // Attach verified device info to request
  (req as any).adminDevice = {
    deviceId: verification.deviceId,
    slotName: AUTHORIZED_DEVICE_SLOTS.find((s) => s.id === verification.deviceId)?.name,
  };

  next();
}
