import React, { Component, type ErrorInfo, type ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ActiveTab } from './types/store';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import { AdminPortal } from './components/admin/AdminPortal';
import { CustomerOrdersPage } from './components/admin/CustomerOrdersPage';
import { GlobalLoadingScreen } from './components/common/GlobalLoadingScreen';
import { ShoppingBag, Shield, ArrowRight, ExternalLink, Store } from 'lucide-react';

function parseCurrentRoute(): 'customer' | 'admin' | 'customer-orders' | 'hub' {
  try {
    const pathname = (window?.location?.pathname || '').toLowerCase();
    const rawHash = (window?.location?.hash || '').replace('#/', '').replace('#', '').trim().toLowerCase();
    
    let searchPage = '';
    let searchView = '';
    try {
      if (window?.location?.search) {
        const searchParams = new URLSearchParams(window.location.search);
        searchPage = searchParams.get('page') || '';
        searchView = searchParams.get('view') || '';
      }
    } catch {
      // Fallback
    }

    if (
      pathname.includes('customer-orders') ||
      pathname.includes('orders') ||
      rawHash === 'orders' ||
      rawHash === 'customer-orders' ||
      rawHash === 'admin/orders' ||
      searchPage === 'orders' ||
      searchView === 'orders'
    ) {
      return 'customer-orders';
    }

    if (
      pathname.includes('customer') ||
      pathname.includes('market') ||
      pathname.includes('store') ||
      rawHash === 'storefront' ||
      rawHash === 'customer' ||
      rawHash === 'market' ||
      rawHash === 'home' ||
      rawHash === 'landing' ||
      rawHash === 'products' ||
      rawHash === 'produce' ||
      rawHash === 'track-order' ||
      rawHash === 'track' ||
      rawHash === 'about-us' ||
      rawHash === 'about' ||
      rawHash === 'contact' ||
      rawHash === 'feedback' ||
      rawHash === 'reviews' ||
      searchPage === 'customer' ||
      searchView === 'customer'
    ) {
      return 'customer';
    }

    if (
      pathname.includes('admin') ||
      pathname.includes('boss') ||
      pathname.includes('management') ||
      rawHash === 'admin' ||
      rawHash === 'boss' ||
      rawHash === 'management' ||
      searchPage === 'admin' ||
      searchView === 'admin'
    ) {
      return 'admin';
    }

    if (pathname.includes('hub') || rawHash === 'hub' || searchPage === 'hub') {
      return 'hub';
    }

    return 'customer';
  } catch {
    return 'customer';
  }
}

function StoreAppContent() {
  const { isOnline, activePortal, setActivePortal, isInitializing } = useStore();
  const [isSwitchingPortal, setIsSwitchingPortal] = useState<boolean>(false);
  const [switchingTarget, setSwitchingTarget] = useState<'customer' | 'admin' | 'customer-orders' | 'hub' | null>(null);
  const portalSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hash-based and URL routing handler
  const handleRouting = useCallback(() => {
    const route = parseCurrentRoute();
    if (route !== activePortal) {
      setIsSwitchingPortal(true);
      setSwitchingTarget(route);
      if (portalSwitchTimerRef.current) clearTimeout(portalSwitchTimerRef.current);
      portalSwitchTimerRef.current = setTimeout(() => {
        setActivePortal(route);
        setIsSwitchingPortal(false);
        setSwitchingTarget(null);
      }, 350);
    }
  }, [activePortal, setActivePortal]);

  useEffect(() => {
    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);
    return () => {
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('hashchange', handleRouting);
    };
  }, [handleRouting]);

  const navigateTo = (portal: 'customer' | 'admin' | 'customer-orders' | 'hub') => {
    if (portal === activePortal && !isSwitchingPortal) return;

    if (portalSwitchTimerRef.current) {
      clearTimeout(portalSwitchTimerRef.current);
    }

    setIsSwitchingPortal(true);
    setSwitchingTarget(portal);

    try {
      if (portal === 'customer') {
        window.location.hash = '#/customer';
      } else if (portal === 'admin') {
        window.location.hash = '#/admin';
      } else if (portal === 'customer-orders') {
        window.location.hash = '#/admin/orders';
      } else {
        window.location.hash = '';
      }
    } catch {
      // Safe fallback
    }

    portalSwitchTimerRef.current = setTimeout(() => {
      setActivePortal(portal);
      setIsSwitchingPortal(false);
      setSwitchingTarget(null);
    }, 380);
  };

  // Strict 4-click counter to activate Admin Portal navigation from App Hub
  const [hubAdminClicks, setHubAdminClicks] = useState<number>(0);
  const hubAdminTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHubAdminTriggerClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (hubAdminTimerRef.current) {
      clearTimeout(hubAdminTimerRef.current);
    }
    const nextCount = hubAdminClicks + 1;
    if (nextCount >= 4) {
      setHubAdminClicks(0);
      navigateTo('admin');
    } else {
      setHubAdminClicks(nextCount);
      hubAdminTimerRef.current = setTimeout(() => {
        setHubAdminClicks(0);
      }, 2500);
    }
  };

  // Render Portal Component View
  const renderPortalView = () => {
    // 1. DEDICATED CUSTOMER ORDERS PAGE
    if (activePortal === 'customer-orders') {
      return (
        <CustomerOrdersPage
          onBackToAdmin={() => navigateTo('admin')}
          onSwitchToStorefront={() => navigateTo('customer')}
        />
      );
    }

    // 2. CUSTOMER STOREFRONT PORTAL
    if (activePortal === 'customer') {
      return (
        <CustomerStorefront
          onSwitchToStaff={() => navigateTo('admin')}
        />
      );
    }

    // 3. ADMIN PORTAL (Matches Customer styling & Left-side navigation)
    if (activePortal === 'admin') {
      return (
        <AdminPortal
          onSwitchToStorefront={() => navigateTo('customer')}
          onOpenCustomerOrders={() => navigateTo('customer-orders')}
        />
      );
    }

    // 4. CLEAN HUB SELECTION (If visited explicitly)
    return (
      <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white">
        {/* Top Header */}
        <header className="border-b border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white text-xs font-semibold">
              TF
            </div>
            <div>
              <h1 className="font-semibold text-sm text-slate-900 tracking-tight">
                Top Fruit &amp; Vegetables
              </h1>
              <p className="text-xs text-slate-500">Brixton Market · Pitch 18</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{isOnline ? 'Online Sync' : 'Offline Mode'}</span>
          </div>
        </header>

        {/* Main Dual Portal Selection */}
        <main className="max-w-3xl mx-auto w-full px-6 py-16 flex-1 flex flex-col justify-center">
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-semibold text-emerald-800 tracking-wider uppercase">
              Brixton Market Portal
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Select Workspace
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Access the customer market catalog or manage store operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Customer Portal */}
            <div
              onClick={() => navigateTo('customer')}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-6 transition-all duration-200 hover:shadow-sm cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Customer Storefront
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Browse fresh tropical fruits, vegetables, root crops, create grocery orders, and place WhatsApp pickup requests.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-800">
                <span className="flex items-center gap-1.5">
                  Enter Storefront <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-slate-400 font-normal">Public</span>
              </div>
            </div>

            {/* 2. Admin Management - Strictly Requires Exactly 4 Clicks */}
            <div
              id="hub-admin-card-trigger"
              onClick={handleHubAdminTriggerClick}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-6 transition-all duration-200 hover:shadow-sm cursor-pointer flex flex-col justify-between select-none"
              title="Click 4 times to unlock Admin"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {hubAdminClicks > 0 ? `${hubAdminClicks}/4 clicks` : '4 clicks to open'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Admin &amp; Operations
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Back-office system: inventory management, price and margin updates, sales trends, supplier orders, and analytics.
                </p>

                {/* Progress bar indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1 transition-all duration-200"
                      style={{ width: `${(hubAdminClicks / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-900">
                <span className="flex items-center gap-1.5">
                  {hubAdminClicks === 0
                    ? 'Click 4 times to open'
                    : `Click ${4 - hubAdminClicks} more time${4 - hubAdminClicks === 1 ? '' : 's'}`}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-slate-400 font-normal">Protected</span>
              </div>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
          Top Fruit &amp; Vegetables · Pitch 18 Pope's Road, Brixton SW9
        </footer>
      </div>
    );
  };

  return (
    <>
      {/* Global Loading Spinner / Skeleton Screen during initialization */}
      {isInitializing && (
        <GlobalLoadingScreen portal={activePortal} isSwitching={false} />
      )}

      {/* Global Loading Spinner / Skeleton Screen during portal switching */}
      {!isInitializing && isSwitchingPortal && (
        <GlobalLoadingScreen portal={switchingTarget || activePortal} isSwitching={true} />
      )}

      {/* Active Portal Content View */}
      {renderPortalView()}
    </>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App caught unexpected error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      window.location.hash = '';
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <span className="text-3xl">🥭</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Top Fruit & Veg</h1>
              <p className="text-xs text-slate-500 mt-1">Brixton Market Pitch 18 • London</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 font-mono overflow-auto max-h-32">
              {this.state.error?.message || 'A temporary display error occurred.'}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.location.hash = '';
                    window.location.href = '/';
                  } catch {
                    window.location.reload();
                  }
                }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Go to Storefront
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StoreAppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
