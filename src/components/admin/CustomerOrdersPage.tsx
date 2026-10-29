import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerOnlineOrder } from '../../types/store';
import { AdminPinPage } from './AdminPinPage';
import {
  ShoppingBag,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  Truck,
  Store,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Printer,
  ChevronRight,
  Filter,
  Layers,
  Volume2,
} from 'lucide-react';

interface CustomerOrdersPageProps {
  onBackToAdmin?: () => void;
  onSwitchToStorefront?: () => void;
  isEmbedded?: boolean;
}

export const CustomerOrdersPage: React.FC<CustomerOrdersPageProps> = ({
  onBackToAdmin,
  onSwitchToStorefront,
  isEmbedded = false,
}) => {
  const {
    currentRole,
    isAuthenticated,
    customerOrders,
    updateCustomerOrderStatus,
    deleteCustomerOrder,
    formatCurrency,
    settings,
    dbStatus,
    isCloudConnected,
    lastSyncedAt,
    refreshCloudData,
    playOrderNotificationSound,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Dedicated Admin PIN Access Screen if unauthenticated
  if (!isAuthenticated || currentRole !== 'admin') {
    return (
      <AdminPinPage
        onSuccess={() => {}}
        onBackToHome={onBackToAdmin || (() => {})}
      />
    );
  }

  const safeOrders = customerOrders || [];

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.fulfillmentType === typeFilter;

      const term = searchTerm.toLowerCase().trim();
      const codeMatch = (order.orderCode || order.orderNumber || '').toLowerCase().includes(term);
      const nameMatch = (order.customerName || '').toLowerCase().includes(term);
      const locMatch = (order.deliveryLocation || '').toLowerCase().includes(term);
      const itemMatch = order.items?.some((i) =>
        (i.productName || '').toLowerCase().includes(term)
      );

      const matchesSearch = !term || codeMatch || nameMatch || locMatch || itemMatch;

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [safeOrders, statusFilter, typeFilter, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: safeOrders.length,
      pending: safeOrders.filter((o) => o.status === 'pending').length,
      preparing: safeOrders.filter((o) => o.status === 'preparing').length,
      ready: safeOrders.filter((o) => o.status === 'ready').length,
      completed: safeOrders.filter((o) => o.status === 'completed').length,
      cancelled: safeOrders.filter((o) => o.status === 'cancelled').length,
    };
  }, [safeOrders]);

  const handleCopyOrder = (order: CustomerOnlineOrder) => {
    const code = order.orderCode || order.orderNumber;
    let text = `📦 CUSTOMER ORDER #${code}\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Type: ${order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pick Up Myself'}\n`;
    if (order.fulfillmentType === 'delivery' && order.deliveryLocation) {
      text += `Address: ${order.deliveryLocation}\n`;
    }
    text += `Status: ${order.status.toUpperCase()}\n`;
    text += `\nITEMS:\n`;
    order.items.forEach((it) => {
      text += `- ${it.productName} x ${it.quantity} ${it.unit}\n`;
    });
    if (order.totalAmount) {
      text += `Total: £${order.totalAmount.toFixed(2)}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    });
  };

  const handlePrintOrder = (order: CustomerOnlineOrder) => {
    const code = order.orderCode || order.orderNumber;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${code}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #111; }
            h2 { margin: 0 0 5px 0; text-align: center; }
            .meta { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #666; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
            .total { font-weight: bold; border-top: 1px dashed #666; padding-top: 8px; margin-top: 10px; }
            .badge { background: #eee; padding: 3px 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${settings.storeName || 'Top Fruit & Veg'}</h2>
          <div style="text-align: center; font-size: 11px; margin-bottom: 10px;">Brixton Market Pitch 18 Pope's Road</div>
          <div class="meta">
            <div><strong>ORDER CODE:</strong> ${code}</div>
            <div><strong>CUSTOMER:</strong> ${order.customerName}</div>
            <div><strong>TYPE:</strong> ${order.fulfillmentType === 'delivery' ? 'DELIVERY' : 'PICK UP MYSELF'}</div>
            ${order.deliveryLocation ? `<div><strong>ADDRESS:</strong> ${order.deliveryLocation}</div>` : ''}
            <div><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <strong>ITEMS:</strong>
            ${order.items.map((i) => `<div class="item"><span>${i.productName}</span><span>${i.quantity} ${i.unit}</span></div>`).join('')}
          </div>
          ${order.totalAmount ? `<div class="total item"><span>TOTAL:</span><span>£${order.totalAmount.toFixed(2)}</span></div>` : ''}
          <div style="text-align: center; margin-top: 20px; font-size: 11px;">Thank you for shopping local!</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusBadge = (status: CustomerOnlineOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" /> Pending
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
            <PackageCheck className="w-3 h-3 text-sky-700" /> Packing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Ready
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
            <Check className="w-3 h-3 text-slate-600" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-700" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={isEmbedded ? 'space-y-4' : 'min-h-screen bg-slate-100 text-slate-900 pb-16'}>
      {/* Top Navigation Bar / Embedded Toolbar */}
      {!isEmbedded ? (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Back to Admin Dashboard</span>
                </button>
              )}

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Customer Orders
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300">
                    {counts.all} Total
                  </span>
                  {counts.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black animate-pulse">
                      {counts.pending} New
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Live customer orders placed from any phone, PC, or device
                </p>
              </div>
            </div>

            {/* Right actions: manual refresh & Storefront button */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => {
                  setIsTestingSound(true);
                  playOrderNotificationSound();
                  setTimeout(() => setIsTestingSound(false), 1200);
                }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Test chime alert"
              >
                <Volume2 className={`w-3.5 h-3.5 text-emerald-600 ${isTestingSound ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Test Alert</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh live orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>

              {onSwitchToStorefront && (
                <button
                  onClick={onSwitchToStorefront}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              )}
            </div>
          </div>
        </header>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Customer Orders
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                  {counts.all} Total
                </span>
                {counts.pending > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {counts.pending} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Live customer orders placed from any phone, PC, or device
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsTestingSound(true);
                playOrderNotificationSound();
                setTimeout(() => setIsTestingSound(false), 1200);
              }}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Test chime alert"
            >
              <Volume2 className={`w-3.5 h-3.5 text-emerald-600 ${isTestingSound ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Test Alert</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Content Area */}
      <div className={isEmbedded ? 'space-y-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5'}>
        {/* Status Count Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-white' : 'text-slate-600'}`}>
              All Orders
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>
              {counts.all}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'pending' ? 'text-white' : 'text-amber-600'}`}>
              Pending
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'pending' ? 'text-white' : 'text-slate-900'}`}>
              {counts.pending}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('preparing')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'preparing'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'preparing' ? 'text-white' : 'text-sky-600'}`}>
              Packing
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'preparing' ? 'text-white' : 'text-slate-900'}`}>
              {counts.preparing}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('ready')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'ready'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'ready' ? 'text-white' : 'text-emerald-700'}`}>
              Ready
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'ready' ? 'text-white' : 'text-slate-900'}`}>
              {counts.ready}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'completed' ? 'text-white' : 'text-slate-600'}`}>
              Completed
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'completed' ? 'text-white' : 'text-slate-900'}`}>
              {counts.completed}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'cancelled' ? 'text-white' : 'text-rose-600'}`}>
              Cancelled
            </div>
            <div className={`text-xl font-black mt-0.5 ${statusFilter === 'cancelled' ? 'text-white' : 'text-slate-900'}`}>
              {counts.cancelled}
            </div>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order Code (e.g. FR-4821), Name, Address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="flex items-center bg-slate-50 p-1 border border-slate-200 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('pickup')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'pickup'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pickup</span>
              </button>
              <button
                onClick={() => setTypeFilter('delivery')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'delivery'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ShoppingBag className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800">No Customer Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {safeOrders.length === 0
                ? 'No online customer orders have been placed yet. Customers can place orders from any device through the storefront.'
                : 'No orders match the current search filters.'}
            </p>
            {safeOrders.length === 0 && onSwitchToStorefront && (
              <button
                onClick={onSwitchToStorefront}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Open Storefront to Place an Order</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const code = order.orderCode || order.orderNumber;
              const isPickup = order.fulfillmentType === 'pickup';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  {/* Order Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-sm font-black px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-slate-900 shadow-2xs tracking-wide">
                        {code}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          isPickup
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {isPickup ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-emerald-600" /> Pick Up Myself
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-sky-600" /> Delivery
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Body */}
                  <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                    {/* Customer & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Customer Name
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          {isPickup ? 'Collection Point' : 'Delivery Address'}
                        </span>
                        {isPickup ? (
                          <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Pitch 18 Pope's Road, Brixton Market
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900 text-xs flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                            <span className="break-words">{order.deliveryLocation || 'Address not specified'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ordered Produce Items */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Reserved Produce ({order.totalItems || order.items.length} items)</span>
                        {order.totalAmount !== undefined && (
                          <span className="text-emerald-800 font-black">
                            Est: {formatCurrency(order.totalAmount)}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs text-slate-700"
                          >
                            <span className="font-medium">• {it.productName}</span>
                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                              {it.quantity} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    {/* Status Workflow Action Buttons (Lighter, cleaner styling) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateCustomerOrderStatus(order.id, 'preparing')}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
                          <span>Start Packing</span>
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateCustomerOrderStatus(order.id, 'ready')}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ready for {isPickup ? 'Pickup' : 'Delivery'}</span>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateCustomerOrderStatus(order.id, 'completed')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => updateCustomerOrderStatus(order.id, 'cancelled')}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {order.status === 'completed' && (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Fulfilled
                        </span>
                      )}
                    </div>

                    {/* Secondary Utilities: Copy, Print, Delete */}
                    <div className="flex items-center space-x-1.5 ml-auto">
                      <button
                        onClick={() => handleCopyOrder(order)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Copy order details"
                      >
                        {copiedOrderId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Print order slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {deletingOrderId === order.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => deleteCustomerOrder(order.id)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingOrderId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingOrderId(order.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                          title="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
