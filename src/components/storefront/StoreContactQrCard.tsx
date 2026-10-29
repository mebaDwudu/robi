import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Phone, MapPin } from 'lucide-react';

interface StoreContactQrCardProps {
  className?: string;
}

export const StoreContactQrCard: React.FC<StoreContactQrCardProps> = ({ className = '' }) => {
  const customerStorefrontUrl = (() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const origin = window.location.origin;
        if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          return `${origin}/customer`;
        }
      }
    } catch {
      // Fallback
    }
    return 'https://ais-pre-5b2nb4syxu4ykdqs7eog5o-223369896875.europe-west2.run.app/customer';
  })();

  return (
    <div
      className={`rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5 bg-white border-2 border-amber-200/90 shadow-xs ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#fde68a',
        boxShadow: '0 2px 10px -2px rgba(245, 158, 11, 0.08)',
      }}
    >
      {/* Small Scannable QR Code on the Left */}
      <div
        className="shrink-0 p-1.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center"
        title="Scan to open customer storefront"
      >
        <QRCodeSVG
          value={customerStorefrontUrl}
          size={74}
          level="M"
          marginSize={0}
          fgColor="#022c22"
          bgColor="#ffffff"
        />
      </div>

      {/* Contact Text on the Right: Only Top Fruit & Veg, Pitch 18 Pope's Road SW9, and +44 7449 338679 */}
      <div className="min-w-0 space-y-1 text-left">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
          Top Fruit &amp; Veg
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-semibold text-slate-800">Pitch 18 Pope's Road SW9</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs pt-0.5">
          <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <a
            href="tel:+447449338679"
            className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors"
          >
            +44 7449 338679
          </a>
        </div>
      </div>
    </div>
  );
};
