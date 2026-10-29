import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Percent,
  Layers,
  ShoppingBag,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const SalesReportsSection: React.FC = () => {
  const { orders, formatCurrency, settings, currentStaff } = useStore();

  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth()); // 0-11
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter completed orders
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  // Navigate dates
  const handlePrevPeriod = () => {
    if (period === 'daily') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else if (period === 'weekly') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else if (period === 'monthly') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    } else if (period === 'yearly') {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (period === 'daily') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else if (period === 'weekly') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else if (period === 'monthly') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    } else if (period === 'yearly') {
      setSelectedYear((y) => y + 1);
    }
  };

  // Helper date labels
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 1. Filtered Orders according to selected period
  const periodFilteredOrders = useMemo(() => {
    if (period === 'daily') {
      return completedOrders.filter((o) => o.createdAt.startsWith(selectedDate));
    }

    if (period === 'weekly') {
      const target = new Date(selectedDate);
      const dayOfWeek = target.getDay(); // 0 is Sunday
      const startOfWeek = new Date(target);
      startOfWeek.setDate(target.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return completedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfWeek && d <= endOfWeek;
      });
    }

    if (period === 'monthly') {
      return completedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
    }

    if (period === 'yearly') {
      return completedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === selectedYear;
      });
    }

    return completedOrders;
  }, [completedOrders, period, selectedDate, selectedYear, selectedMonth]);

  // Aggregate Metrics for Period
  const totalGrossRevenue = periodFilteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCOGS = periodFilteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalGrossProfit = periodFilteredOrders.reduce((sum, o) => sum + o.grossProfit, 0);
  const totalTax = periodFilteredOrders.reduce((sum, o) => sum + o.taxTotal, 0);
  const totalDiscounts = periodFilteredOrders.reduce((sum, o) => sum + o.discountTotal, 0);
  const totalOrdersCount = periodFilteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;
  const profitMargin = totalGrossRevenue > 0 ? ((totalGrossProfit / totalGrossRevenue) * 100).toFixed(1) : '0';

  const totalItemsSold = periodFilteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      mobile: { count: 0, total: 0 },
      store_credit: { count: 0, total: 0 },
    };
    periodFilteredOrders.forEach((o) => {
      const pm = o.paymentMethod || 'cash';
      if (!map[pm]) map[pm] = { count: 0, total: 0 };
      map[pm].count += 1;
      map[pm].total += o.grandTotal;
    });
    return map;
  }, [periodFilteredOrders]);

  // Cashier Performance Breakdown
  const cashierBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number; profit: number }> = {};
    periodFilteredOrders.forEach((o) => {
      const name = o.cashierName || 'Cashier';
      if (!map[name]) {
        map[name] = { name, count: 0, revenue: 0, profit: 0 };
      }
      map[name].count += 1;
      map[name].revenue += o.grandTotal;
      map[name].profit += o.grossProfit;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [periodFilteredOrders]);

  // Top Items Sold for Period
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sku: string; qty: number; revenue: number; profit: number }> = {};
    periodFilteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            sku: item.sku,
            qty: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.totalPrice;
        map[item.productId].profit += item.totalPrice - item.costPrice * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [periodFilteredOrders]);

  // Chart Time Series Data
  const chartData = useMemo(() => {
    if (period === 'daily') {
      // 24 hours breakdown
      const hoursMap: Record<number, { label: string; revenue: number; profit: number; orders: number }> = {};
      for (let h = 0; h < 24; h++) {
        const hourLabel = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;
        hoursMap[h] = { label: hourLabel, revenue: 0, profit: 0, orders: 0 };
      }
      periodFilteredOrders.forEach((o) => {
        const hour = new Date(o.createdAt).getHours();
        if (hoursMap[hour]) {
          hoursMap[hour].revenue += o.grandTotal;
          hoursMap[hour].profit += o.grossProfit;
          hoursMap[hour].orders += 1;
        }
      });
      return Object.values(hoursMap);
    }

    if (period === 'weekly') {
      // 7 days breakdown (Sun - Sat)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const target = new Date(selectedDate);
      const dayOfWeek = target.getDay();
      const startOfWeek = new Date(target);
      startOfWeek.setDate(target.getDate() - dayOfWeek);

      const daysArr = days.map((dName, idx) => {
        const curr = new Date(startOfWeek);
        curr.setDate(startOfWeek.getDate() + idx);
        const iso = curr.toISOString().slice(0, 10);
        return {
          dateStr: iso,
          label: `${dName} (${curr.getDate()})`,
          revenue: 0,
          profit: 0,
          orders: 0,
        };
      });

      periodFilteredOrders.forEach((o) => {
        const dStr = o.createdAt.slice(0, 10);
        const found = daysArr.find((item) => item.dateStr === dStr);
        if (found) {
          found.revenue += o.grandTotal;
          found.profit += o.grossProfit;
          found.orders += 1;
        }
      });
      return daysArr;
    }

    if (period === 'monthly') {
      // Days in selected month
      const daysCount = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const daysArr = Array.from({ length: daysCount }, (_, i) => {
        const dayNum = i + 1;
        return {
          day: dayNum,
          label: `${monthNames[selectedMonth].slice(0, 3)} ${dayNum}`,
          revenue: 0,
          profit: 0,
          orders: 0,
        };
      });

      periodFilteredOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const dayIdx = d.getDate() - 1;
        if (daysArr[dayIdx]) {
          daysArr[dayIdx].revenue += o.grandTotal;
          daysArr[dayIdx].profit += o.grossProfit;
          daysArr[dayIdx].orders += 1;
        }
      });
      return daysArr;
    }

    if (period === 'yearly') {
      // 12 months breakdown
      const monthsArr = monthNames.map((m, idx) => ({
        monthIdx: idx,
        label: m.slice(0, 3),
        revenue: 0,
        profit: 0,
        orders: 0,
      }));

      periodFilteredOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const mIdx = d.getMonth();
        if (monthsArr[mIdx]) {
          monthsArr[mIdx].revenue += o.grandTotal;
          monthsArr[mIdx].profit += o.grossProfit;
          monthsArr[mIdx].orders += 1;
        }
      });
      return monthsArr;
    }

    return [];
  }, [period, periodFilteredOrders, selectedDate, selectedMonth, selectedYear]);

  // Period title descriptor
  const getPeriodLabel = () => {
    if (period === 'daily') {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (period === 'weekly') {
      const target = new Date(selectedDate);
      const start = new Date(target);
      start.setDate(target.getDate() - target.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `Week of ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (period === 'monthly') {
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    }
    if (period === 'yearly') {
      return `Calendar Year ${selectedYear}`;
    }
    return '';
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date & Time', 'Cashier', 'Customer', 'Items Count', 'Payment Method', 'Subtotal', 'Tax', 'Grand Total', 'Gross Profit'];
    const rows = periodFilteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      `"${o.cashierName || 'Cashier'}"`,
      `"${o.customerName || 'Walk-in'}"`,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.paymentMethod.toUpperCase(),
      o.subtotal.toFixed(2),
      o.taxTotal.toFixed(2),
      o.grandTotal.toFixed(2),
      o.grossProfit.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${period}_${selectedDate || selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'daily'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'yearly'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly Report
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevPeriod}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
            title="Previous Period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Quick Date Inputs */}
          {period === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          )}

          {period === 'weekly' && (
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{getPeriodLabel()}</span>
            </div>
          )}

          {period === 'monthly' && (
            <div className="flex items-center space-x-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleNextPeriod}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
            title="Next Period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Export & Print */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Period Banner - Matches background */}
      <div className="bg-slate-100 border border-slate-200 text-slate-900 p-4 sm:p-5 rounded-xl shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-emerald-700 text-[11px] font-extrabold uppercase tracking-wider">
            {period.toUpperCase()} SALES REPORT
          </span>
          <h2 className="text-lg sm:text-xl font-black mt-0.5 text-slate-900 tracking-tight">
            {getPeriodLabel()}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {totalOrdersCount} completed orders
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-500 block font-medium">Net Revenue</span>
          <span className="text-2xl font-black text-emerald-700">
            {formatCurrency(totalGrossRevenue)}
          </span>
        </div>
      </div>

      {/* Key Metric Cards - Small Rectangle Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {formatCurrency(totalGrossRevenue)}
          </span>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <ShoppingBag className="w-3 h-3 text-slate-400" />
            <span>{totalItemsSold} items</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Profit</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-lg font-black text-blue-600 tracking-tight block">
            {formatCurrency(totalGrossProfit)}
          </span>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <Percent className="w-3 h-3" />
            <span>{profitMargin}% margin</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Orders & Ticket</span>
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {totalOrdersCount} <span className="text-[11px] font-normal text-slate-400">orders</span>
          </span>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <span>Avg: <strong className="text-slate-800">{formatCurrency(avgOrderValue)}</strong></span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cost & Tax</span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {formatCurrency(totalCOGS)}
          </span>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
            <span>Tax: <strong className="text-slate-800">{formatCurrency(totalTax)}</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Visual Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>
              {period === 'daily' && 'Hourly Revenue & Profit Curve'}
              {period === 'weekly' && 'Daily Revenue Breakdown across the Week'}
              {period === 'monthly' && 'Day-by-Day Revenue Progression in Month'}
              {period === 'yearly' && 'Monthly Revenue & Annual Profit Growth'}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">All figures in {settings.currency}</span>
        </div>

        <div className="h-72 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    formatCurrency(val),
                    name === 'revenue' ? 'Gross Revenue' : 'Net Profit',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Gross Revenue" />
                <Bar dataKey="profit" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Gross Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No sales logged in this period.
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Payment & Cashier breakdown | Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment & Staff Breakdown */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payment Tender Breakdown</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-xs text-emerald-800 font-bold uppercase block">Cash in Drawer</span>
                <span className="text-lg font-black text-emerald-950 mt-1 block">
                  {formatCurrency(paymentBreakdown.cash.total)}
                </span>
                <span className="text-[11px] text-emerald-700">{paymentBreakdown.cash.count} cash sales</span>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-xs text-blue-800 font-bold uppercase block">Credit / Debit Card</span>
                <span className="text-lg font-black text-blue-950 mt-1 block">
                  {formatCurrency(paymentBreakdown.card.total)}
                </span>
                <span className="text-[11px] text-blue-700">{paymentBreakdown.card.count} card swipes</span>
              </div>

              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                <span className="text-xs text-purple-800 font-bold uppercase block">Mobile & Contactless</span>
                <span className="text-lg font-black text-purple-950 mt-1 block">
                  {formatCurrency(paymentBreakdown.mobile.total)}
                </span>
                <span className="text-[11px] text-purple-700">{paymentBreakdown.mobile.count} scans</span>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
                <span className="text-xs text-amber-800 font-bold uppercase block">Store Credit / Other</span>
                <span className="text-lg font-black text-amber-950 mt-1 block">
                  {formatCurrency(paymentBreakdown.store_credit.total)}
                </span>
                <span className="text-[11px] text-amber-700">{paymentBreakdown.store_credit.count} txns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Product Movers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Top Performing Products ({period.toUpperCase()})</span>
          </h3>

          <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={p.sku + idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">{p.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">SKU: {p.sku} • {p.qty} units</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-xs block">
                      {formatCurrency(p.revenue)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      +{formatCurrency(p.profit)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No item sales in this window.</p>
            )}
          </div>
        </div>
      </div>

      {/* Printable Report Modal / Statement Dialog */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Official Sales Report Statement</h3>
                <span className="text-xs text-slate-500">Ready for accounting, manager audit, or IRS tax filings</span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Printable Statement Sheet */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-slate-50/50 space-y-6 text-slate-800 font-sans text-xs">
              {/* Store Letterhead */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="font-black text-base text-slate-900 uppercase tracking-tight">
                    {settings.storeName}
                  </h1>
                  <p className="text-slate-500 text-[11px]">{settings.storeAddress}</p>
                  <p className="text-slate-500 text-[11px]">Phone: {settings.storePhone} | Tax ID: {settings.taxNumber}</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-[11px] uppercase">
                    {period} Sales Audit
                  </span>
                  <p className="text-slate-500 text-[11px] mt-1.5">
                    Report Date: <strong>{getPeriodLabel()}</strong>
                  </p>
                  <p className="text-slate-400 text-[10px]">Generated by {currentStaff.name}</p>
                </div>
              </div>

              {/* Financial Executive Summary */}
              <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Sales</span>
                  <span className="text-base font-black text-slate-900">{formatCurrency(totalGrossRevenue)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cost of Goods (COGS)</span>
                  <span className="text-base font-black text-slate-700">{formatCurrency(totalCOGS)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Gross Profit</span>
                  <span className="text-base font-black text-emerald-600">{formatCurrency(totalGrossProfit)}</span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Tax & Revenue Summary</h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  <div className="flex justify-between p-2.5">
                    <span>Total Orders Count</span>
                    <strong className="font-bold text-slate-900">{totalOrdersCount}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span>Total Units Sold</span>
                    <strong className="font-bold text-slate-900">{totalItemsSold} pcs</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span>Tax Collected ({settings.taxRatePercent}%)</span>
                    <strong className="font-bold text-slate-900">{formatCurrency(totalTax)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span>Customer Discounts Given</span>
                    <strong className="font-bold text-slate-900">{formatCurrency(totalDiscounts)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span>Average Ticket Size</span>
                    <strong className="font-bold text-slate-900">{formatCurrency(avgOrderValue)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-slate-900">
                    <span>Profit Margin Percentage</span>
                    <span className="text-emerald-700">{profitMargin}%</span>
                  </div>
                </div>
              </div>

              {/* Tender Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Cash Drawer & Payment Reconciliation</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">CASH</span>
                    <span className="font-bold text-slate-900">{formatCurrency(paymentBreakdown.cash.total)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">CARD</span>
                    <span className="font-bold text-slate-900">{formatCurrency(paymentBreakdown.card.total)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">DIGITAL / OTHER</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(paymentBreakdown.mobile.total + paymentBreakdown.store_credit.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1"></div>
                  <span>Prepared By: <strong>{currentStaff.name}</strong></span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1"></div>
                  <span>Store Owner / Boss Signature & Date</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
