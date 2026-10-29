import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminPinPage } from './AdminPinPage';
import { AdminOverviewView } from './AdminOverviewView';
import { DailySalesOverview } from './DailySalesOverview';
import { InventoryManager } from '../inventory/InventoryManager';
import { SalesHistory } from '../orders/SalesHistory';
import { SalesReportsSection } from '../analytics/SalesReportsSection';
import { SupplierManager } from '../suppliers/SupplierManager';
import { CustomerManager } from '../customers/CustomerManager';
import { StoreSettingsView } from '../settings/StoreSettingsView';
import { CustomerOrdersView } from './CustomerOrdersView';
import { CustomerOrdersPage } from './CustomerOrdersPage';
import { CustomerFeedbackView } from './CustomerFeedbackView';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import {
  ShieldCheck,
  Boxes,
  Receipt,
  Truck,
  Users,
  Settings,
  Globe,
  Lock,
  BarChart3,
  Menu,
  X,
  Store,
  ShoppingBag,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminPortalProps {
  onSwitchToStorefront: () => void;
  onOpenCustomerOrders?: () => void;
}

export type AdminSection =
  | 'orders'
  | 'overview'
  | 'sales'
  | 'inventory'
  | 'feedback'
  | 'suppliers'
  | 'customers'
  | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onSwitchToStorefront,
  onOpenCustomerOrders,
}) => {
  const {
    currentRole,
    isAuthenticated,
    logout,
    products,
    orders,
    customers,
    suppliers,
    customerOrders,
    feedbacks,
    lowStockProducts,
    outOfStockProducts,
    formatCurrency,
  } = useStore();

  // The first thing opened in admin must be Orders (Requirement 7)
  const [activeSection, setActiveSection] = useState<AdminSection>('orders');
  const [salesTab, setSalesTab] = useState<'trends' | 'reports' | 'history'>('trends');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [, setAuthRevision] = useState<number>(0);

  const pendingCustomerOrdersCount = useMemo(
    () => customerOrders.filter((o) => o.status === 'pending').length,
    [customerOrders]
  );
  const newFeedbacksCount = useMemo(
    () => feedbacks.filter((f) => f.status === 'new').length,
    [feedbacks]
  );

  // Financial aggregates
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'completed'),
    [orders]
  );
  const totalGrossRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    [completedOrders]
  );

  const totalCustomerDebt = useMemo(
    () => customers.reduce((sum, c) => sum + (c.debt || 0), 0),
    [customers]
  );

  const handleLogoutAndLock = () => {
    logout();
    setAuthRevision((r) => r + 1);
  };

  // Dedicated Admin Pin Access
  if (!isAuthenticated || currentRole !== 'admin') {
    return (
      <AdminPinPage
        onSuccess={() => setAuthRevision((r) => r + 1)}
        onBackToHome={onSwitchToStorefront}
      />
    );
  }

  // 1-word minimal nav items (Requirement 4 & 22)
  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge:
        pendingCustomerOrdersCount > 0
          ? `${pendingCustomerOrdersCount}`
          : customerOrders.length > 0
          ? customerOrders.length
          : undefined,
      badgeColor:
        pendingCustomerOrdersCount > 0
          ? 'bg-amber-500 text-white'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: <Receipt className="w-4 h-4" />,
      badge: completedOrders.length > 0 ? completedOrders.length : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Boxes className="w-4 h-4" />,
      badge:
        lowStockProducts.length + outOfStockProducts.length > 0
          ? lowStockProducts.length + outOfStockProducts.length
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: <MessageSquare className="w-4 h-4" />,
      badge:
        newFeedbacksCount > 0
          ? `${newFeedbacksCount}`
          : feedbacks.length > 0
          ? feedbacks.length
          : undefined,
      badgeColor:
        newFeedbacksCount > 0
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <Truck className="w-4 h-4" />,
      badge: suppliers.length > 0 ? suppliers.length : undefined,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
      badge: totalCustomerDebt > 0 ? formatCurrency(totalCustomerDebt) : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 1. LEFT SIDEBAR FOR ADMIN */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-56 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between p-3 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                  Admin Console
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Top Fruit &amp; Veg
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Minimal 1-Line Revenue summary */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px]">Revenue</span>
            <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(totalGrossRevenue)}</span>
          </div>

          {/* Clean 1-word Nav Buttons */}
          <nav className="space-y-0.5 flex-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons at bottom */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onSwitchToStorefront}
                className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Customer Storefront"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Store</span>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Share QR"
              >
                <span>Share</span>
              </button>
            </div>

            <button
              onClick={handleLogoutAndLock}
              className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WORKSPACE */}
      <div className="flex-1 min-w-0 md:pl-56 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-700 hover:text-slate-900 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-sm font-semibold text-slate-900 capitalize tracking-tight">
                {navItems.find((n) => n.id === activeSection)?.label || 'Orders'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogoutAndLock}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Lock Admin"
            >
              Lock
            </button>

            <button
              onClick={onSwitchToStorefront}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Content (NO horizontal quick navigation bar) */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-4">
          {/* ORDERS (First thing seen upon opening admin) */}
          {activeSection === 'orders' && (
            <CustomerOrdersPage
              isEmbedded={true}
              onSwitchToStorefront={onSwitchToStorefront}
            />
          )}

          {/* OVERVIEW (Minimal, small rectangle cards, minimal graph, no cashier attribution) */}
          {activeSection === 'overview' && (
            <AdminOverviewView />
          )}

          {/* SALES (Combines Daily Sales Overview + Sales History + Executive Reports) */}
          {activeSection === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button
                  onClick={() => setSalesTab('trends')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    salesTab === 'trends'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daily Overview (Line Trend)
                </button>
                <button
                  onClick={() => setSalesTab('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    salesTab === 'reports'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Executive Report
                </button>
                <button
                  onClick={() => setSalesTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    salesTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Transactions
                </button>
              </div>

              {salesTab === 'trends' ? (
                <DailySalesOverview />
              ) : salesTab === 'reports' ? (
                <SalesReportsSection />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
                  <SalesHistory />
                </div>
              )}
            </div>
          )}

          {/* INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <InventoryManager onNavigateToPO={() => setActiveSection('suppliers')} />
            </div>
          )}

          {/* FEEDBACK (Clean, minimal, no categories/stars/search) */}
          {activeSection === 'feedback' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <CustomerFeedbackView />
            </div>
          )}

          {/* SUPPLIERS */}
          {activeSection === 'suppliers' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <SupplierManager />
            </div>
          )}

          {/* CUSTOMERS */}
          {activeSection === 'customers' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <CustomerManager />
            </div>
          )}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <StoreSettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareStoreModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      )}
    </div>
  );
};
