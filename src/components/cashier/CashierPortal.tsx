import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PosRegister } from '../pos/PosRegister';
import { InventoryManager } from '../inventory/InventoryManager';
import { LockScreen } from '../auth/LockScreen';
import { LoginPage } from '../auth/LoginPage';
import { PinAuthModal } from '../auth/PinAuthModal';
import {
  ShoppingCart,
  Boxes,
  Lock,
  LogOut,
  ShieldAlert,
  Globe,
  Store,
  Clock,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface CashierPortalProps {
  onSwitchToAdmin?: () => void;
  onSwitchToStorefront?: () => void;
}

export const CashierPortal: React.FC<CashierPortalProps> = ({
  onSwitchToAdmin,
  onSwitchToStorefront,
}) => {
  const {
    currentStaff,
    currentRole,
    setDirectRole,
    settings,
    cart,
    lowStockProducts,
    outOfStockProducts,
    isAuthenticated,
    isLocked,
    setIsLocked,
    logout,
  } = useStore();

  const [cashierTab, setCashierTab] = useState<'pos' | 'stock'>('pos');
  const [isBossPinOpen, setIsBossPinOpen] = useState(false);

  // If user is not authenticated, show staff login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If register is locked, show lock screen
  if (isLocked) {
    return <LockScreen />;
  }

  const cartItemCount = Array.isArray(cart) ? cart.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. CASHIER DEDICATED HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand & Pitch info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black text-white tracking-tight leading-none truncate">
                  {settings.storeName || 'Top Fruits and Veg'}
                </h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase">
                  Cashier Register
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold truncate mt-0.5">
                Pitch 18 Brixton Market • Pope's Road London
              </p>
            </div>
          </div>

          {/* Cashier Tab Navigation Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setCashierTab('pos')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer ${
                cashierTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>POS Register</span>
              {cartItemCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-emerald-950 rounded-full text-[10px] font-black leading-none">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCashierTab('stock')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer ${
                cashierTab === 'stock'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Produce & Prices</span>
              {totalStockAlerts > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black leading-none">
                  {totalStockAlerts}
                </span>
              )}
            </button>
          </div>

          {/* Right Header Utilities (Lock, Customer Link, Boss Pin Gate) */}
          <div className="flex items-center space-x-2">
            {/* Active Cashier Pill */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">{currentStaff?.name || 'Cashier'}</span>
            </div>

            {/* Lock Register */}
            <button
              onClick={() => setIsLocked(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Lock Screen"
            >
              <Lock className="w-4 h-4 text-amber-400" />
            </button>

            {/* Customer Storefront Link */}
            {onSwitchToStorefront && (
              <button
                onClick={onSwitchToStorefront}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 hover:text-white transition-colors cursor-pointer"
                title="Open Customer Market Page"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Site</span>
              </button>
            )}

            {/* Boss Admin Gateway */}
            <button
              onClick={() => setIsBossPinOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
              title="Boss Admin Access (PIN 1234)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Boss Admin</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 rounded-xl text-slate-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CASHIER WORKSPACE (STRICTLY POS REGISTER OR PRICE/STOCK LOOKUP) */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 w-full">
        {cashierTab === 'pos' ? (
          <PosRegister />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <InventoryManager />
          </div>
        )}
      </main>

      {/* Boss PIN Modal */}
      <PinAuthModal
        isOpen={isBossPinOpen}
        onClose={() => setIsBossPinOpen(false)}
        onSuccess={() => {
          setIsBossPinOpen(false);
          if (onSwitchToAdmin) {
            onSwitchToAdmin();
          } else {
            window.location.hash = '#/admin';
          }
        }}
        title="Boss Admin Authorization"
        description="Enter Boss Admin PIN (Default: 1234) to switch to the executive management portal."
      />
    </div>
  );
};
