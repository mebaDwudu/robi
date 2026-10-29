import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ActiveTab } from '../../types/store';
import {
  Store,
  ShoppingCart,
  Boxes,
  Receipt,
  Truck,
  Users,
  BarChart3,
  Settings,
  Clock,
  Database,
  RefreshCw,
  Lock,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  LogOut,
  DollarSign,
  Globe,
  QrCode,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { PinAuthModal } from '../auth/PinAuthModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    settings,
    lowStockProducts,
    outOfStockProducts,
    cart,
    currentShift,
    formatCurrency,
    dbStatus,
    currentStaff,
    currentRole,
    staffMembers,
    switchStaff,
    setDirectRole,
    setIsLocked,
    logout,
  } = useStore();

  const [time, setTime] = useState<string>('');
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [pinPromptReason, setPinPromptReason] = useState<{ title: string; desc: string }>({
    title: 'Boss Admin Authentication Required',
    desc: 'Enter Boss Admin PIN (Default: 1234) to access management and financial views.',
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalStockAlerts = (lowStockProducts?.length || 0) + (outOfStockProducts?.length || 0);
  const cartItemCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  interface NavItem {
    id: ActiveTab;
    label: string; // STRICT ONE WORD
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeAlert?: boolean;
    adminOnly?: boolean;
  }

  const allNavItems: NavItem[] = [
    { id: 'pos', label: 'POS', icon: ShoppingCart, badge: cartItemCount > 0 ? `${cartItemCount}` : null, adminOnly: false },
    { id: 'inventory', label: 'Stock', icon: Boxes, badge: totalStockAlerts > 0 ? `${totalStockAlerts}` : null, badgeAlert: true, adminOnly: false },
    { id: 'orders', label: 'Sales', icon: Receipt, adminOnly: true },
    { id: 'analytics', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, adminOnly: true },
    { id: 'customers', label: 'Customers', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  // For cashiers: strictly remove/disable all admin-only buttons!
  const navItems = currentRole === 'cashier'
    ? allNavItems.filter((item) => !item.adminOnly)
    : allNavItems;

  const handleTabClick = (item: NavItem) => {
    if (currentRole === 'cashier' && item.adminOnly) {
      setPendingTab(item.id);
      setPinPromptReason({
        title: `Boss PIN Required for ${item.label}`,
        desc: `Cashiers are restricted to POS & Stock views. Enter Boss PIN (Default: 1234) to access ${item.label}.`,
      });
      setIsPinModalOpen(true);
      return;
    }
    setActiveTab(item.id);
    window.location.hash = `#/${item.id}`;
  };

  const handlePinSuccess = () => {
    setDirectRole('admin');
    if (pendingTab) {
      setActiveTab(pendingTab);
      window.location.hash = `#/${pendingTab}`;
      setPendingTab(null);
    } else {
      setActiveTab('admin');
      window.location.hash = '#/admin';
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setIsStaffMenuOpen(false);
    const target = staffMembers.find((s) => s.id === staffId);
    if (!target) return;

    if (target.role === 'admin' && currentRole === 'cashier') {
      setPinPromptReason({
        title: `Switch to ${target.name} (Boss Admin)`,
        desc: `Enter Boss Admin PIN to switch to Administrator mode.`,
      });
      setIsPinModalOpen(true);
    } else {
      switchStaff(staffId);
      if (target.role === 'cashier' && activeTab !== 'pos' && activeTab !== 'inventory') {
        setActiveTab('pos');
      }
    }
  };

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen shrink-0 select-none z-30 shadow-xl">
      {/* Top Header Section: Branding & Profile */}
      <div className="p-3.5 space-y-3">
        {/* Brand Header */}
        <div className="flex items-center space-x-2.5 px-1 py-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-black text-sm tracking-tight leading-tight truncate">
              {settings.storeName || 'Top Fruits and Veg'}
            </h1>
            <p className="text-[10px] font-semibold text-emerald-400 truncate flex items-center gap-1">
              <span>Pitch 18 Brixton</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{time}</span>
            </p>
          </div>
        </div>

        {/* Staff Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/60'
                : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/60'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentRole === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="truncate text-xs font-bold text-white">{currentStaff.name}</span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  currentRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {currentRole === 'admin' ? 'BOSS' : 'STAFF'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </button>

          {/* User Switcher Dropdown */}
          {isStaffMenuOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs divide-y divide-slate-800">
              <div className="p-1 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-1 block mb-1">
                  Active Users
                </span>
                {staffMembers.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleStaffSelect(st.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      st.id === currentStaff.id
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          st.role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="truncate">{st.name}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        st.role === 'admin'
                          ? 'bg-indigo-900/80 text-indigo-300'
                          : 'bg-emerald-900/80 text-emerald-300'
                      }`}
                    >
                      {st.role === 'admin' ? 'BOSS' : 'CASHIER'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Toggle Elevation */}
              <div className="p-1.5 pt-2">
                {currentRole === 'cashier' ? (
                  <button
                    onClick={() => {
                      setIsStaffMenuOpen(false);
                      setPinPromptReason({
                        title: 'Boss Admin Access',
                        desc: 'Enter 4-digit Boss PIN (Default: 1234) to unlock all management views.',
                      });
                      setIsPinModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unlock Boss (PIN 1234)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsStaffMenuOpen(false);
                      setDirectRole('cashier');
                      setActiveTab('pos');
                    }}
                    className="w-full py-1.5 px-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Switch to Cashier Mode</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation Links (Single Word Only) */}
        <nav className="space-y-1 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestrictedForCashier = currentRole === 'cashier' && item.adminOnly;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleTabClick(item)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/50'
                    : isRestrictedForCashier
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 opacity-70'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="tracking-wide text-xs">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Lock icon for restricted views */}
                  {isRestrictedForCashier && (
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  )}

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                        item.badgeAlert
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Dedicated Boss Admin Webpage Link */}
          <div className="pt-2">
            <button
              id="sidebar-tab-admin-portal"
              onClick={() => {
                if (currentRole === 'cashier') {
                  setPendingTab('admin');
                  setPinPromptReason({
                    title: 'Admin Authorization',
                    desc: 'Enter Admin PIN to open management settings.',
                  });
                  setIsPinModalOpen(true);
                } else {
                  setActiveTab('admin');
                  window.location.hash = '#/admin';
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/50'
                  : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-500/30'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="tracking-wide text-xs">Boss Portal</span>
              </div>
              <div className="flex items-center space-x-1">
                {currentRole === 'cashier' ? (
                  <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                ) : (
                  <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 text-[9px] font-black rounded-sm">
                    ADMIN
                  </span>
                )}
              </div>
            </button>
          </div>
        </nav>

        {/* Public Customer Website Section */}
        <div className="pt-2">
          <div className="px-1 pb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Customer Storefront
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-sm">
              PUBLIC
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('storefront');
                window.location.hash = '#/storefront';
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'storefront'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Customer Site</span>
              </div>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>QR Code / Link</span>
              </div>
              <Share2 className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Section: DB Status, Shift, Lock, Exit */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/60">
        {/* Shift sales summary */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium">Shift Sales:</span>
          </div>
          <span className="text-emerald-400 font-bold text-xs">{formatCurrency(currentShift.totalSales)}</span>
        </div>

        {/* Database Status & Action Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Cloud DB Status */}
          <div
            title={`Cloud Database: ${dbStatus === 'connected' ? 'Live Connected' : 'Offline Mode'}`}
            onClick={() => {
              if (currentRole === 'cashier') {
                setPendingTab('settings');
                setIsPinModalOpen(true);
              } else {
                setActiveTab('settings');
              }
            }}
            className={`flex-1 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold cursor-pointer transition-colors ${
              dbStatus === 'connected'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Database className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">Cloud:</span>
            {dbStatus === 'connected' ? (
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live</span>
              </span>
            ) : (
              <span>Cache</span>
            )}
          </div>

          {/* Screen Lock */}
          <button
            onClick={() => setIsLocked(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Lock Register Screen"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          {/* Sign Out / Exit */}
          <button
            onClick={() => logout()}
            className="p-2 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/40 text-rose-300 hover:text-rose-100 rounded-xl transition-colors cursor-pointer"
            title="Sign Out / Switch Staff"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Boss PIN Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingTab(null);
        }}
        onSuccess={handlePinSuccess}
        title={pinPromptReason.title}
        description={pinPromptReason.desc}
      />

      {/* Share Storefront Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </aside>
  );
};
