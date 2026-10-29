import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import {
  requireAdminDeviceAuth,
  verifyDeviceToken,
  generateDeviceToken,
  AUTHORIZED_DEVICE_SLOTS,
  DeviceSlotId,
} from './server/middleware/adminDeviceAuth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // =========================================================================
  // 1. API ROUTES
  // =========================================================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Check current device pairing status
  app.get('/api/admin/device-status', (req, res) => {
    const token =
      req.cookies?.['admin_device_token'] ||
      (req.headers['x-admin-device-token'] as string | undefined);

    const userAgent = req.headers['user-agent'] || '';
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || userAgent;

    const result = verifyDeviceToken(token || '', fingerprint);

    if (result.valid && result.deviceId) {
      const slot = AUTHORIZED_DEVICE_SLOTS.find((s) => s.id === result.deviceId);
      res.json({
        authorized: true,
        deviceId: result.deviceId,
        deviceName: slot?.name,
      });
    } else {
      res.json({
        authorized: false,
        deviceId: null,
      });
    }
  });

  // One-time Device Registration / Pairing Flow
  app.post('/api/admin/pair-device', (req, res) => {
    const { deviceSlot, pairingKey, fingerprint } = req.body;

    const slot = AUTHORIZED_DEVICE_SLOTS.find((s) => s.id === deviceSlot);
    if (!slot) {
      res.status(400).json({ error: 'Invalid device slot selection.', code: 'INVALID_SLOT' });
      return;
    }

    const expectedKey = process.env[`PAIRING_KEY_${slot.id.toUpperCase().replace(/-/g, '_')}`] || slot.defaultPairingKey;

    if (!pairingKey || pairingKey.trim().toUpperCase() !== expectedKey.toUpperCase()) {
      res.status(401).json({ error: 'Invalid pairing key for this device slot.', code: 'INVALID_KEY' });
      return;
    }

    const userAgent = req.headers['user-agent'] || '';
    const effectiveFingerprint = fingerprint || userAgent;
    const token = generateDeviceToken(slot.id as DeviceSlotId, effectiveFingerprint);

    // Set secure HTTP-only cookie
    res.cookie('admin_device_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year persistence
      path: '/',
    });

    res.json({
      success: true,
      deviceId: slot.id,
      deviceName: slot.name,
      token,
    });
  });

  // Revoke / unpair device
  app.post('/api/admin/unpair-device', (req, res) => {
    res.clearCookie('admin_device_token', { path: '/' });
    res.json({ success: true, message: 'Device unpaired successfully.' });
  });

  // Protected Admin Route Check
  app.get('/api/admin/verify-access', requireAdminDeviceAuth, (req, res) => {
    const device = (req as any).adminDevice;
    res.json({
      accessGranted: true,
      device,
    });
  });

  // =========================================================================
  // 2. VITE OR STATIC FRONTEND SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
