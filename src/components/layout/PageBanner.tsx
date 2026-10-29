import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ActiveTab } from '../../types/store';
import {
  ShoppingCart,
  Boxes,
  Receipt,
  Truck,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface PageBannerProps {
  activeTab: ActiveTab;
  onUnlockBoss?: () => void;
  redirectNotice?: string | null;
  onClearNotice?: () => void;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  activeTab,
  onUnlockBoss,
  redirectNotice,
  onClearNotice,
}) => {
  const { currentStaff, currentRole } = useStore();

  const isCashier = currentRole === 'cashier';

  const tabMeta: Partial<
    Record<
      ActiveTab,
      {
        title: string;
        desc: string;
        icon: React.ComponentType<{ className?: string }>;
        adminOnly?: boolean;
      }
    >
  > = {
    pos: {
      title: 'Point of Sale (POS)',
      desc: 'Fast barcode scanner, touch product grid, custom discounts, and multi-tender split checkout.',
      icon: ShoppingCart,
      adminOnly: false,
    },
    inventory: {
      title: 'Inventory & Stock Management',
      desc: 'Real-time stock counts, catalog pricing, low-stock reorder thresholds, and instant stock adjustments.',
      icon: Boxes,
      adminOnly: false,
    },
    orders: {
      title: 'Sales & Order History',
      desc: 'Audit completed transactions, register receipts, payment splits, and cashier refund operations.',
      icon: Receipt,
      adminOnly: true,
    },
    analytics: {
      title: 'Sales Reports & Profit Analytics',
      desc: 'Daily, weekly, monthly, and yearly executive financial breakdown, gross profit margins, and IRS statements.',
      icon: BarChart3,
      adminOnly: true,
    },
    suppliers: {
      title: 'Purchase Orders & Suppliers',
      desc: 'Vendor directory, stock reorder requests, delivery receipts, and wholesale inventory replenishment.',
      icon: Truck,
      adminOnly: true,
    },
    customers: {
      title: 'Customer Directory & Loyalty',
      desc: 'Shopper profiles, purchase history, reward tier tracking, and quick customer assignment.',
      icon: Users,
      adminOnly: true,
    },
    settings: {
      title: 'Store & System Settings',
      desc: 'Store receipt headers, sales tax percentages, currency symbols, Cloud Firestore DB, and staff PIN security.',
      icon: Settings,
      adminOnly: true,
    },
    login: {
      title: 'Terminal Login',
      desc: 'User authentication.',
      icon: Lock,
      adminOnly: false,
    },
  };

  const meta = tabMeta[activeTab] || tabMeta.pos;
  const Icon = meta.icon;

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
      {/* Redirect warning toast/banner if a cashier attempted unauthorized navigation */}
      {redirectNotice && (
        <div className="mb-3 p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{redirectNotice}</span>
          </div>
          {onClearNotice && (
            <button
              onClick={onClearNotice}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold underline ml-3 cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Left: Active Page Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">{meta.title}</h1>
              {meta.adminOnly ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Boss Only
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Open to Cashiers & Boss
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">{meta.desc}</p>
          </div>
        </div>

        {/* Right: Active Role Pill & Elevation Trigger if Cashier */}
        <div className="flex items-center space-x-2 self-start md:self-center shrink-0">
          <div
            className={`px-3 py-1 rounded-xl border text-xs flex items-center space-x-2 ${
              isCashier
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isCashier ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
              }`}
            />
            <span className="font-bold">{currentStaff.name}</span>
            <span className="text-[10px] text-slate-400">
              ({isCashier ? 'POS & Stock Only' : 'Full Boss Access'})
            </span>
          </div>

          {isCashier && onUnlockBoss && (
            <button
              onClick={onUnlockBoss}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-indigo-300 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
              title="Enter Boss PIN to unlock restricted tabs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unlock Boss</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
