import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  Info,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface DailySalesOverviewProps {
  onNavigateToOrders?: () => void;
}

export interface DaySalesData {
  dayIndex: number; // 0 = Mon, 6 = Sun
  dayLabel: string; // 'Mon', 'Tue'...
  fullDateLabel: string; // 'Mon, 19 Oct'
  dateStr: string; // 'YYYY-MM-DD'
  dateObj: Date;
  sales: number;
  profit: number;
  ordersCount: number;
  avgOrderValue: number;
  itemsCount: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isPeakDay: boolean;
  paymentSplit: {
    cash: number;
    card: number;
    mobile: number;
    other: number;
  };
  ordersList: any[];
}

export const DailySalesOverview: React.FC<DailySalesOverviewProps> = ({
  onNavigateToOrders,
}) => {
  const {
    orders,
    customerOrders,
    formatCurrency,
    seedCurrentWeekSales,
  } = useStore();

  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, +1 = next week
  const [metricView, setMetricView] = useState<'sales' | 'orders' | 'both'>('sales');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // 1. Calculate Monday for the selected week
  const { mondayDate, weekRangeLabel, isCurrentCalendarWeek } = useMemo(() => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    base.setDate(base.getDate() + weekOffset * 7);

    const dayOfWeek = base.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const mon = new Date(base);
    mon.setDate(base.getDate() + diffToMon);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const formatShort = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const label = `${formatShort(mon)} – ${formatShort(sun)} ${sun.getFullYear()}`;
    const isCurrent = weekOffset === 0;

    return { mondayDate: mon, weekRangeLabel: label, isCurrentCalendarWeek: isCurrent };
  }, [weekOffset]);

  // 2. Generate 7 days (Monday to Sunday) and aggregate completed sales
  const { weekData, weekTotals, peakDayInfo } = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days: DaySalesData[] = [];

    // Filter all completed POS orders
    const completedPosOrders = orders.filter((o) => o.status === 'completed');

    // Filter completed or delivered online customer orders
    const completedOnlineOrders = customerOrders.filter(
      (o) => o.status === 'completed' || o.status === 'delivered'
    );

    let maxSalesFound = 0;
    let peakIndex = -1;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + i);

      const y = dayDate.getFullYear();
      const m = dayDate.getMonth();
      const d = dayDate.getDate();

      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = y === todayYear && m === todayMonth && d === todayDate;

      // Check if past or future
      const dayMidnight = new Date(y, m, d).getTime();
      const todayMidnight = new Date(todayYear, todayMonth, todayDate).getTime();
      const isPast = dayMidnight < todayMidnight;
      const isFuture = dayMidnight > todayMidnight;

      // Find POS orders matching this calendar day
      const dayPosOrders = completedPosOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getFullYear() === y &&
          orderDate.getMonth() === m &&
          orderDate.getDate() === d
        );
      });

      // Find online orders matching this calendar day
      const dayOnlineOrders = completedOnlineOrders.filter((co) => {
        const orderDate = new Date(co.createdAt);
        return (
          orderDate.getFullYear() === y &&
          orderDate.getMonth() === m &&
          orderDate.getDate() === d
        );
      });

      // Compute POS aggregates
      const posSales = dayPosOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const posProfit = dayPosOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
      const posItems = dayPosOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0
      );

      // Compute Online aggregates
      const onlineSales = dayOnlineOrders.reduce((sum, co) => sum + (co.totalAmount || 0), 0);
      const onlineProfit = onlineSales * 0.35; // Estimated produce margin for online orders
      const onlineItems = dayOnlineOrders.reduce((sum, co) => sum + (co.totalItems || 0), 0);

      const totalDaySales = Number((posSales + onlineSales).toFixed(2));
      const totalDayProfit = Number((posProfit + onlineProfit).toFixed(2));
      const totalOrdersCount = dayPosOrders.length + dayOnlineOrders.length;
      const avgOrderValue =
        totalOrdersCount > 0 ? Number((totalDaySales / totalOrdersCount).toFixed(2)) : 0;

      // Payment splits
      const paySplit = { cash: 0, card: 0, mobile: 0, other: 0 };
      dayPosOrders.forEach((o) => {
        if (o.paymentMethod === 'cash') paySplit.cash += o.grandTotal;
        else if (o.paymentMethod === 'card') paySplit.card += o.grandTotal;
        else if (o.paymentMethod === 'mobile') paySplit.mobile += o.grandTotal;
        else paySplit.other += o.grandTotal;
      });
      // Online orders typically card/online
      paySplit.card += onlineSales;

      if (totalDaySales > maxSalesFound) {
        maxSalesFound = totalDaySales;
        peakIndex = i;
      }

      days.push({
        dayIndex: i,
        dayLabel: dayNames[i],
        fullDateLabel: dayDate.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        dateStr,
        dateObj: dayDate,
        sales: totalDaySales,
        profit: totalDayProfit,
        ordersCount: totalOrdersCount,
        avgOrderValue,
        itemsCount: posItems + onlineItems,
        isToday,
        isPast,
        isFuture,
        isPeakDay: false, // will update below
        paymentSplit: paySplit,
        ordersList: [...dayPosOrders, ...dayOnlineOrders],
      });
    }

    if (peakIndex >= 0 && maxSalesFound > 0) {
      days[peakIndex].isPeakDay = true;
    }

    // Weekly totals
    const totalSales = days.reduce((sum, d) => sum + d.sales, 0);
    const totalProfit = days.reduce((sum, d) => sum + d.profit, 0);
    const totalOrders = days.reduce((sum, d) => sum + d.ordersCount, 0);
    const totalItems = days.reduce((sum, d) => sum + d.itemsCount, 0);

    // Calculate days elapsed for accurate daily average
    let activeDaysCount = 7;
    if (isCurrentCalendarWeek) {
      // Days from Monday up to today
      const todayDayOfWeek = today.getDay(); // 0 is Sun (7th day)
      activeDaysCount = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
    }
    const dailyAverage =
      activeDaysCount > 0 ? Number((totalSales / activeDaysCount).toFixed(2)) : 0;
    const avgTicket = totalOrders > 0 ? Number((totalSales / totalOrders).toFixed(2)) : 0;
    const profitMargin =
      totalSales > 0 ? Number(((totalProfit / totalSales) * 100).toFixed(1)) : 0;

    const peakDay = peakIndex >= 0 ? days[peakIndex] : null;

    return {
      weekData: days,
      weekTotals: {
        totalSales,
        totalProfit,
        totalOrders,
        totalItems,
        dailyAverage,
        avgTicket,
        profitMargin,
        activeDaysCount,
      },
      peakDayInfo: peakDay,
    };
  }, [mondayDate, isCurrentCalendarWeek, orders, customerOrders]);

  // Selected Day Details
  const activeDay = useMemo(() => {
    if (!selectedDayKey) {
      // Default to today if in current week, else peak day or Monday
      const todayDay = weekData.find((d) => d.isToday);
      return todayDay || peakDayInfo || weekData[0];
    }
    return weekData.find((d) => d.dateStr === selectedDayKey) || weekData[0];
  }, [selectedDayKey, weekData, peakDayInfo]);

  // Export CSV of current week
  const handleExportWeekCSV = () => {
    const headers = [
      'Day',
      'Date',
      'Gross Sales (£)',
      'Orders Count',
      'Average Order (£)',
      'Gross Profit (£)',
      'Items Sold',
    ];
    const rows = weekData.map((d) => [
      d.dayLabel,
      d.dateStr,
      d.sales.toFixed(2),
      d.ordersCount,
      d.avgOrderValue.toFixed(2),
      d.profit.toFixed(2),
      d.itemsCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily_sales_overview_${weekData[0].dateStr}_to_${weekData[6].dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DaySalesData = payload[0].payload;
      const pctOfWeek =
        weekTotals.totalSales > 0
          ? ((data.sales / weekTotals.totalSales) * 100).toFixed(1)
          : '0.0';

      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md min-w-[210px] animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-xs text-slate-200 block">
                {data.fullDateLabel}
              </span>
              <span className="text-[10px] text-slate-400">
                {data.isToday ? 'Today (Active)' : data.isPeakDay ? 'Best Day of Week' : 'Completed Day'}
              </span>
            </div>
            {data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Today
              </span>
            )}
            {data.isPeakDay && !data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Peak
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Daily Sales:</span>
              <span className="font-black text-emerald-400 text-sm">
                {formatCurrency(data.sales)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Transactions:</span>
              <span className="font-bold">{data.ordersCount} orders</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Avg Ticket:</span>
              <span>{formatCurrency(data.avgOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Estimated Profit:</span>
              <span className="text-blue-400 font-semibold">
                {formatCurrency(data.profit)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Week Contribution:</span>
              <span className="font-semibold text-slate-200">{pctOfWeek}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 1. COMPONENT HEADER & CONTROLS */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
                  Daily Sales Overview
                </h2>
                {isCurrentCalendarWeek && (
                  <span className="text-xs text-slate-400">
                    · Current Week
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Weekly trends and daily totals for {weekRangeLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Navigator */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              title="Previous Week"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                weekOffset === 0
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              title="Next Week"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Metric View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setMetricView('sales')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                metricView === 'sales'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sales (£)
            </button>
            <button
              onClick={() => setMetricView('orders')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                metricView === 'orders'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] ${
                metricView === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Dual Trend
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportWeekCSV}
            title="Download CSV breakdown of this week"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. WEEKLY EXECUTIVE METRICS STRIP */}
      <div className="p-4 sm:p-5 border-b border-slate-100 grid grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/50">
        {/* Total Sales */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-500">
              Week Sales
            </span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight block tabular-nums">
            {formatCurrency(weekTotals.totalSales)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">
            {weekTotals.totalOrders} total orders
          </span>
        </div>

        {/* Daily Average */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-500">
              Daily Average
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight block tabular-nums">
            {formatCurrency(weekTotals.dailyAverage)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">
            {weekTotals.activeDaysCount} active days
          </span>
        </div>

        {/* Peak Sales Day */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-500">
              Peak Day
            </span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight block">
            {peakDayInfo ? peakDayInfo.dayLabel : '—'}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">
            {peakDayInfo && peakDayInfo.sales > 0
              ? `${formatCurrency(peakDayInfo.sales)} (${peakDayInfo.ordersCount} orders)`
              : 'None recorded'}
          </span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-500">
              Avg Ticket
            </span>
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight block tabular-nums">
            {formatCurrency(weekTotals.avgTicket)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">
            {weekTotals.totalItems} items sold
          </span>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-500">
              Gross Profit
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight block tabular-nums">
            {formatCurrency(weekTotals.totalProfit)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">
            {weekTotals.profitMargin}% gross margin
          </span>
        </div>
      </div>

      {/* 3. RECHARTS LINE GRAPH */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Current Week Sales Trend (Mon – Sun)
            </h3>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              • Hover over points for daily breakdown
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Sales (£)</span>
            </div>
            {(metricView === 'orders' || metricView === 'both') && (
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-600 font-medium">Orders</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-3 h-0.5 border-b border-dashed border-slate-400"></span>
              <span className="text-[11px]">Daily Avg</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weekData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedDayKey(e.activePayload[0].payload.dateStr);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="dayLabel"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `£${Math.round(val)}`}
              />
              {metricView === 'both' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#60A5FA"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} ord`}
                />
              )}
              <Tooltip content={<CustomTooltip />} />

              {/* Reference line for weekly daily average */}
              {weekTotals.dailyAverage > 0 && metricView !== 'orders' && (
                <ReferenceLine
                  yAxisId="left"
                  y={weekTotals.dailyAverage}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg: £${Math.round(weekTotals.dailyAverage)}`,
                    position: 'insideTopRight',
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
              )}

              {/* Primary Sales Line */}
              {(metricView === 'sales' || metricView === 'both') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  name="Gross Sales"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: '#FFFFFF',
                    stroke: '#10B981',
                  }}
                  activeDot={{
                    r: 7,
                    stroke: '#047857',
                    strokeWidth: 2,
                    fill: '#10B981',
                  }}
                  animationDuration={600}
                />
              )}

              {/* Orders Line */}
              {(metricView === 'orders' || metricView === 'both') && (
                <Line
                  yAxisId={metricView === 'both' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="ordersCount"
                  name="Transactions"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray={metricView === 'both' ? '4 4' : undefined}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: '#FFFFFF',
                    stroke: '#3B82F6',
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#1D4ED8',
                    strokeWidth: 2,
                    fill: '#3B82F6',
                  }}
                  animationDuration={600}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Empty state notice / seed option if sales are 0 */}
        {weekTotals.totalSales === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
            <div className="flex items-center space-x-2 text-amber-800 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No completed orders logged yet for this week ({weekRangeLabel}).
              </span>
            </div>
            <button
              onClick={seedCurrentWeekSales}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <span>Populate Sample Week Sales</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. INTERACTIVE 7-DAY PERFORMANCE STRIP */}
      <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daily Breakdown & Inspection
          </span>
          <span className="text-[11px] text-slate-400">
            Click any day to inspect order breakdown
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {weekData.map((d) => {
            const isSelected = activeDay?.dateStr === d.dateStr;
            const pctOfTotal =
              weekTotals.totalSales > 0
                ? Math.min(100, Math.round((d.sales / weekTotals.totalSales) * 100))
                : 0;

            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDayKey(d.dateStr)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : d.isToday
                    ? 'bg-white text-slate-900 border-slate-400'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {d.dayLabel}
                    </span>
                    {d.isToday && (
                      <span
                        className={`text-[10px] font-medium ${
                          isSelected
                            ? 'text-emerald-400'
                            : 'text-emerald-700'
                        }`}
                      >
                        Today
                      </span>
                    )}
                    {d.isPeakDay && !d.isToday && (
                      <span
                        className={`text-[10px] font-medium ${
                          isSelected
                            ? 'text-amber-300'
                            : 'text-amber-600'
                        }`}
                      >
                        Peak
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] block tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {d.dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100">
                  <span
                    className={`text-sm font-semibold tracking-tight block tabular-nums ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(d.sales)}
                  </span>
                  <div
                    className={`text-[10px] flex items-center justify-between mt-0.5 tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    <span>{d.ordersCount} orders</span>
                    <span>{pctOfTotal}%</span>
                  </div>

                  {/* Relative progress bar */}
                  <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isSelected ? 'bg-emerald-400' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. SELECTED DAY TRANSACTION INSPECTOR */}
      {activeDay && (
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-slate-900">
                  Day Inspection: {activeDay.fullDateLabel}
                </h4>
                {activeDay.isToday && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Live Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeDay.ordersCount} transactions logged • Gross Sales:{' '}
                <span className="font-bold text-slate-900">
                  {formatCurrency(activeDay.sales)}
                </span>{' '}
                • Profit:{' '}
                <span className="font-bold text-emerald-700">
                  {formatCurrency(activeDay.profit)}
                </span>
              </p>
            </div>

            {/* Payment method split for this day */}
            <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-medium">
                  Card: {formatCurrency(activeDay.paymentSplit.card)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-600">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium">
                  Cash: {formatCurrency(activeDay.paymentSplit.cash)}
                </span>
              </div>
              {activeDay.paymentSplit.mobile > 0 && (
                <div className="flex items-center space-x-1 text-slate-600">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[11px] font-medium">
                    Mobile: {formatCurrency(activeDay.paymentSplit.mobile)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Orders list for the selected day */}
          {activeDay.ordersList.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {activeDay.ordersList.map((order: any, idx: number) => {
                const isOnline = Boolean(order.fulfillmentType);
                const orderTime = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const total = order.grandTotal || order.totalAmount || 0;
                const itemsCount =
                  order.items?.reduce(
                    (sum: number, it: any) => sum + (it.quantity || 1),
                    0
                  ) || order.totalItems || 0;

                return (
                  <div
                    key={order.id || `ord-${idx}`}
                    className="py-2 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-[10px]">
                        {orderTime}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {order.orderNumber}
                          </span>
                          {isOnline ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Online ({order.fulfillmentType})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              POS ({order.paymentMethod})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          {order.customerName ? `Customer: ${order.customerName} • ` : ''}
                          {order.cashierName ? `Cashier: ${order.cashierName} • ` : ''}
                          {itemsCount} units
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900 block text-sm">
                        {formatCurrency(total)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Completed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No individual transactions found on {activeDay.fullDateLabel}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
