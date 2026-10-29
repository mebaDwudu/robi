import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types/store';
import {
  Receipt,
  Search,
  RotateCcw,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  Download,
  Calendar as CalendarIcon,
  X,
  Clock,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

export type SalesTimeframe = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom_date';

export const SalesHistory: React.FC = () => {
  const { orders, refundOrder, formatCurrency } = useStore();

  const [timeframe, setTimeframe] = useState<SalesTimeframe>('today');
  const [customCalendarDate, setCustomCalendarDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Receipt Modal for viewing historical receipt
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Refund confirmation modal
  const [refundTargetOrder, setRefundTargetOrder] = useState<Order | null>(null);
  const [returnToInventory, setReturnToInventory] = useState(true);

  const safeOrders = orders || [];
  const todayStr = new Date().toISOString().slice(0, 10);

  // Timeframe filtered orders
  const timeframeOrders = useMemo(() => {
    const now = new Date();

    return safeOrders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      const orderDateStr = o.createdAt.slice(0, 10);

      if (timeframe === 'today') {
        return orderDateStr === todayStr;
      }

      if (timeframe === 'custom_date') {
        return orderDateStr === customCalendarDate;
      }

      if (timeframe === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return orderDate >= startOfWeek;
      }

      if (timeframe === 'month') {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth()
        );
      }

      if (timeframe === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }

      return true; // 'all'
    });
  }, [safeOrders, timeframe, customCalendarDate, todayStr]);

  // Completed orders in selected timeframe for accurate revenue & profit
  const completedInTimeframe = useMemo(() => {
    return timeframeOrders.filter((o) => o.status === 'completed');
  }, [timeframeOrders]);

  const timeframeRevenue = useMemo(() => {
    return completedInTimeframe.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [completedInTimeframe]);

  const timeframeProfit = useMemo(() => {
    return completedInTimeframe.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
  }, [completedInTimeframe]);

  const timeframeItemsCount = useMemo(() => {
    return completedInTimeframe.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 0), 0),
      0
    );
  }, [completedInTimeframe]);

  const avgOrderValue =
    completedInTimeframe.length > 0 ? timeframeRevenue / completedInTimeframe.length : 0;

  // Search & secondary filtered orders
  const displayOrders = useMemo(() => {
    return timeframeOrders.filter((o) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(term)) ||
        (o.items &&
          o.items.some(
            (i) =>
              (i.productName && i.productName.toLowerCase().includes(term)) ||
              (i.sku && i.sku.toLowerCase().includes(term))
          ));

      const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [timeframeOrders, searchTerm, paymentFilter, statusFilter]);

  const handleExecuteRefund = () => {
    if (!refundTargetOrder) return;
    refundOrder(refundTargetOrder.id, returnToInventory);
    setRefundTargetOrder(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Order #',
      'Date',
      'Customer',
      'Cashier',
      'Payment',
      'Subtotal',
      'Tax',
      'Grand Total',
      'Profit',
      'Status',
    ];
    const rows = displayOrders.map((o) => [
      o.orderNumber,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
      `"${o.cashierName.replace(/"/g, '""')}"`,
      o.paymentMethod,
      o.subtotal.toFixed(2),
      o.taxTotal.toFixed(2),
      o.grandTotal.toFixed(2),
      o.grossProfit.toFixed(2),
      o.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'today':
        return "Today's Sales";
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'custom_date':
        return `Date: ${customCalendarDate}`;
      case 'all':
      default:
        return 'All Time';
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Sales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ledger and daily transaction history
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="export-sales-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Timeframe Filter Buttons & Calendar Picker */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                timeframe === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Today</span>
            </button>

            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Month
            </button>

            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'year'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Year
            </button>

            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All
            </button>
          </div>

          {/* Dedicated Mini Calendar Picker Button */}
          <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-xs font-bold text-emerald-900 whitespace-nowrap">
              Date:
            </label>
            <input
              type="date"
              value={customCalendarDate}
              onChange={(e) => {
                setCustomCalendarDate(e.target.value);
                setTimeframe('custom_date');
              }}
              className="bg-white border border-emerald-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Small Notice / Helper */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{getTimeframeLabel()}</strong>
          </span>
          <span className="font-semibold text-emerald-700">
            {completedInTimeframe.length} orders
          </span>
        </div>
      </div>

      {/* Financial KPIs for Selected Timeframe */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Revenue
            </span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{formatCurrency(timeframeRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completedInTimeframe.length} receipts
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Profit
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{formatCurrency(timeframeProfit)}</p>
          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
            {timeframeRevenue > 0
              ? ((timeframeProfit / timeframeRevenue) * 100).toFixed(1)
              : '0.0'}
            % margin
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Units
            </span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-950">{timeframeItemsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dispatched</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Average
            </span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{formatCurrency(avgOrderValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Per order</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order #, customer, cashier, item..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Payment Types</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="mobile">Mobile / QR Pay</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Customer / Cashier</th>
                <th className="px-4 py-3.5">Items Summary</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-right">Gross Profit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No transactions found for {getTimeframeLabel()}.
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => {
                  const isRefunded = order.status === 'refunded';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString()} •{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Customer / Cashier */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">
                          {order.customerName || 'Walk-in Customer'}
                        </p>
                        <p className="text-[10px] text-slate-400">Cashier: {order.cashierName}</p>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 font-bold">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items:
                        </span>{' '}
                        <span className="text-slate-500 truncate max-w-xs block text-[11px]">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-md font-bold text-[11px] text-slate-700 capitalize">
                          {order.paymentMethod === 'cash' && (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {order.paymentMethod === 'card' && (
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          {order.paymentMethod === 'mobile' && (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{order.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td
                        className={`px-4 py-3.5 text-right font-black text-sm ${
                          isRefunded ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(order.grandTotal)}
                      </td>

                      {/* Gross Profit */}
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                        {isRefunded ? '-' : formatCurrency(order.grossProfit)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isRefunded
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions with smaller, clean buttons */}
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        {!isRefunded && (
                          <button
                            onClick={() => setRefundTargetOrder(order)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Historical Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Refund Confirmation Modal */}
      {refundTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2 text-rose-600">
              <RotateCcw className="w-5 h-5" />
              <span>Confirm Order Refund</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to refund transaction{' '}
              <strong className="text-slate-900 font-mono">
                {refundTargetOrder.orderNumber}
              </strong>{' '}
              for{' '}
              <strong className="text-slate-900">
                {formatCurrency(refundTargetOrder.grandTotal)}
              </strong>
              ?
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnToInventory}
                  onChange={(e) => setReturnToInventory(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Return items back into stock inventory automatically
                </span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setRefundTargetOrder(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
