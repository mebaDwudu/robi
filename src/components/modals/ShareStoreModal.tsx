import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  X,
  Store,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoreModal: React.FC<ShareStoreModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let customerUrl = '/customer';
  try {
    const rawOrigin = window?.location?.origin;
    if (rawOrigin && rawOrigin !== 'null' && rawOrigin !== '') {
      customerUrl = `${rawOrigin}/customer`;
    } else if (window?.location?.href) {
      customerUrl = window.location.href.split('#')[0].split('?')[0];
    }
  } catch {
    customerUrl = '/customer';
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(customerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = `Check out today's fresh fruits, vegetables, yams & plantains at ${settings.storeName || 'Top Fruit and Veg'} (Pitch 18 Brixton Market Pope's Road London): ${customerUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    customerUrl
  )}&color=022c22&bgcolor=ffffff&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-xs mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Share Stall QR Code
          </h3>
          <p className="text-xs text-emerald-800 font-bold mt-0.5">
            Top Fruit and Veg • Pitch 18 Brixton Market
          </p>
        </div>

        <div className="space-y-4">
          {/* QR Code Card */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100">
              <img
                src={qrCodeImgSrc}
                alt="Stall QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            </div>
            <span className="text-xs font-extrabold text-emerald-900 mt-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-700" />
              Scan with mobile camera to open stall store
            </span>
          </div>

          {/* Direct Link Copy */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              Customer Store Link:
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={customerUrl}
                className="bg-transparent text-xs text-emerald-900 font-bold flex-1 outline-hidden select-all truncate px-1"
              />
              <button
                onClick={copyUrl}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </a>

            <a
              href="/customer"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-emerald-700" />
              <span>Preview Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
