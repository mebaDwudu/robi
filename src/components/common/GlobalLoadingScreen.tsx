import React, { useState, useEffect } from 'react';
import { Leaf, Loader2, ShoppingBag, Shield } from 'lucide-react';

export interface GlobalLoadingScreenProps {
  portal?: 'customer' | 'admin' | 'customer-orders' | 'hub';
  isSwitching?: boolean;
  message?: string;
}

export const GlobalLoadingScreen: React.FC<GlobalLoadingScreenProps> = ({
  portal = 'customer',
  isSwitching = false,
  message,
}) => {
  // Safety watchdog: auto-dismiss loading overlay if still visible after 1.5s
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const maxSafetyTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 1500);
    return () => clearTimeout(maxSafetyTimeout);
  }, []);

  if (!isVisible) return null;

  // Determine contextual description based on target portal
  const getContextualText = () => {
    if (message) return message;
    if (isSwitching) {
      switch (portal) {
        case 'admin':
          return 'Opening Store Management...';
        case 'customer-orders':
          return 'Loading Customer Orders...';
        case 'customer':
          return 'Loading Fresh Produce Market...';
        case 'hub':
          return 'Returning to Portal Hub...';
        default:
          return 'Switching Portal...';
      }
    }
    return 'Initializing Top Fruit & Veg...';
  };

  return (
    <div
      id="global-loading-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-50/95 backdrop-blur-md transition-opacity duration-300 select-none overflow-hidden"
    >
      {/* Skeleton Background Layout tailored to portal */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden flex flex-col">
        {/* Skeleton Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/70 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-20 h-2.5 bg-slate-200 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-16 h-4 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-16 h-4 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-20 h-4 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="w-24 h-9 bg-slate-200 rounded-xl animate-pulse" />
        </header>

        {/* Skeleton Content Grid */}
        <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
          {portal === 'admin' || portal === 'customer-orders' ? (
            /* Admin Skeleton */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                    <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-64 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <div className="w-48 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : (
            /* Storefront Skeleton */
            <div className="space-y-6">
              {/* Category Pills Skeleton */}
              <div className="flex items-center space-x-2 overflow-hidden py-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-20 h-8 bg-slate-200 rounded-xl shrink-0 animate-pulse" />
                ))}
              </div>
              {/* Product Cards Skeleton Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="w-full aspect-square bg-slate-200 rounded-xl animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="w-12 h-2.5 bg-slate-200 rounded animate-pulse" />
                      <div className="w-28 h-3.5 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="w-12 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Centered Brand Loading Spinner Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl border border-emerald-100 shadow-2xl shadow-emerald-950/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-auto flex flex-col items-center text-center transform transition-all duration-300 scale-100">
          {/* Animated Spinner with Brand Logo Center */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-4">
            {/* Outer Spinning Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            {/* Secondary pulsing ring */}
            <div className="absolute inset-1 rounded-full border border-emerald-50 animate-ping opacity-30" />
            {/* Center Brand Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              {portal === 'admin' ? (
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : portal === 'customer-orders' ? (
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
          </div>

          {/* Titles & Contextual Text */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Top Fruit & Veg
          </h2>
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">
            Pitch 18 Brixton Market, London
          </p>

          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-3.5 flex items-center justify-center space-x-2">
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
            <span>{getContextualText()}</span>
          </p>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4 relative">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full w-2/3 animate-pulse" />
          </div>

          {/* Live Sync Status Pill */}
          <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Cloud Connected</span>
            </span>
            <span className="text-slate-400 font-mono text-[9px]">
              {portal === 'admin' ? 'Admin Portal' : portal === 'customer-orders' ? 'Orders Page' : 'Storefront'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer copyright stamp */}
      <footer className="relative z-10 py-3 text-center text-[10px] text-slate-400">
        Top Fruit & Veg • Real-Time Produce Management
      </footer>
    </div>
  );
};
