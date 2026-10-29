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
  AlertTriangle,
  Clock,
  CircleDot,
  DollarSign,
  Search,
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { PinAuthModal } from '../auth/PinAuthModal';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenLowStock?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
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
  const [pinPromptReason, setPinPromptReason] = useState<{ title: string; desc: string }>({
    title: 'Boss / Admin Authentication Required',
    desc: 'Enter Boss Admin PIN to access financial reports and management tools.',
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
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeAlert?: boolean;
    adminOnly?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart, badge: cartItemCount > 0 ? `${cartItemCount}` : null, adminOnly: false },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, badge: totalStockAlerts > 0 ? `${totalStockAlerts}` : null, badgeAlert: true, adminOnly: false },
    { id: 'orders', label: 'Sales & Orders', icon: Receipt, adminOnly: true },
    { id: 'analytics', label: 'Sales Reports & Profit', icon: BarChart3, adminOnly: true },
    { id: 'suppliers', label: 'Purchase Orders', icon: Truck, adminOnly: true },
    { id: 'customers', label: 'Customers', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const handleTabClick = (item: NavItem) => {
    if (currentRole === 'cashier' && item.adminOnly) {
      setPendingTab(item.id);
      setPinPromptReason({
        title: `Boss PIN Required for ${item.label}`,
        desc: `Cashiers are restricted to POS & Inventory Stock. Please enter Boss Admin PIN (Default: 1234) to unlock this tab.`,
      });
      setIsPinModalOpen(true);
      return;
    }
    setActiveTab(item.id);
  };

  const handlePinSuccess = () => {
    // Elevate to Boss/Admin
    setDirectRole('admin');
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
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
      if (target.role === 'cashier' && activeTab !== 'pos') {
        setActiveTab('pos');
      }
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 select-none shadow-md">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between border-b border-slate-800/80 text-xs">
        {/* Left: Store Branding & Live Clock */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium">
            <Store className="w-4 h-4" />
            <span className="text-white font-black text-sm tracking-tight">{settings.storeName}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Clock */}
          <div className="hidden md:flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{time}</span>
          </div>
        </div>

        {/* Right: Role & Staff Profile Switcher, Cloud DB status & Lock */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cloud Database Status Badge */}
          <div
            id="nav-db-status-badge"
            title={`Cloud Database: ${dbStatus === 'connected' ? 'Connected & Synced' : dbStatus === 'syncing' ? 'Syncing...' : 'Local Cache / Offline'}`}
            onClick={() => {
              if (currentRole === 'cashier') {
                setPendingTab('settings');
                setPinPromptReason({
                  title: 'Boss PIN Required for Cloud Settings',
                  desc: 'Enter Boss PIN to inspect database config.',
                });
                setIsPinModalOpen(true);
              } else {
                setActiveTab('settings');
              }
            }}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
              dbStatus === 'connected'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : dbStatus === 'syncing'
                ? 'bg-blue-950/60 border-blue-500/40 text-blue-300 hover:bg-blue-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Cloud DB:</span>
            {dbStatus === 'connected' && (
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live</span>
              </span>
            )}
            {dbStatus === 'syncing' && (
              <span className="flex items-center space-x-1 text-blue-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing</span>
              </span>
            )}
            {dbStatus === 'offline' && <span>Offline</span>}
          </div>

          {/* Shift Drawer status (Admin sees exact sales) */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Shift Sales:</span>
            <span className="text-emerald-400 font-bold text-xs">{formatCurrency(currentShift.totalSales)}</span>
          </div>

          {/* Staff & Role Quick Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/80'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/80'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  currentRole === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="truncate max-w-[120px]">{currentStaff.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                  currentRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {currentRole === 'admin' ? 'BOSS' : 'CASHIER'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isStaffMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs divide-y divide-slate-800">
                <div className="p-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Switch Active User Profile
                  </span>
                  <div className="space-y-1 mt-1">
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
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              st.role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'
                            }`}
                          />
                          <div>
                            <span className="block font-medium">{st.name}</span>
                            <span className="text-[10px] text-slate-400">
                              PIN: ****{st.pin.slice(-2)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            st.role === 'admin'
                              ? 'bg-indigo-900/60 text-indigo-300'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}
                        >
                          {st.role === 'admin' ? 'BOSS' : 'CASHIER'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Toggle Direct Mode */}
                <div className="p-2 space-y-1">
                  {currentRole === 'cashier' ? (
                    <button
                      onClick={() => {
                        setIsStaffMenuOpen(false);
                        setPinPromptReason({
                          title: 'Boss Admin Access',
                          desc: 'Enter 6-digit Boss PIN (091825) to unlock Admin mode.',
                        });
                        setIsPinModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Unlock Boss Mode</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsStaffMenuOpen(false);
                        setDirectRole('cashier');
                        setActiveTab('pos');
                      }}
                      className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch to Cashier Only Mode</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Lock Register Button */}
          <button
            onClick={() => setIsLocked(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Lock Register Screen"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Sign Out / Switch Staff to Login Page */}
          <button
            onClick={() => logout()}
            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
            title="Sign Out / Switch Staff to Login Screen"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold pr-1">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestrictedForCashier = currentRole === 'cashier' && item.adminOnly;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleTabClick(item)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/50 font-bold'
                    : isRestrictedForCashier
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 opacity-75'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {/* Lock icon if cashier restricted */}
                {isRestrictedForCashier && (
                  <Lock className="w-3 h-3 text-amber-400 ml-1 shrink-0" />
                )}

                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeAlert
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
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
    </header>
  );
};
