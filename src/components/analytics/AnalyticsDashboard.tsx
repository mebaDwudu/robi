import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  ShoppingBag,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  ShieldCheck,
} from 'lucide-react';
import { SalesReportsSection } from './SalesReportsSection';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const AnalyticsDashboard: React.FC = () => {
  const { orders, products, formatCurrency, settings, currentRole } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'overview'>('reports');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Filter completed orders
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  // Aggregate Metrics
  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCOGS = completedOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalTaxCollected = completedOrders.reduce((sum, o) => sum + o.taxTotal, 0);
  const totalNetProfit = completedOrders.reduce((sum, o) => sum + o.grossProfit, 0);
  const profitMarginPercent =
    totalGrossRevenue > 0 ? ((totalNetProfit / totalGrossRevenue) * 100).toFixed(1) : '0';
  const averageOrderValue =
    completedOrders.length > 0 ? totalGrossRevenue / completedOrders.length : 0;
  const totalUnitsSold = completedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Total inventory retail & cost valuation
  const inventoryRetailValuation = products.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0);
  const inventoryCostValuation = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const projectedInventoryProfit = inventoryRetailValuation - inventoryCostValuation;

  // 1. Daily Sales Trend Data
  const salesTimelineData = useMemo(() => {
    const daysMap: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};

    // Seed past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysMap[key] = { date: key, revenue: 0, profit: 0, orders: 0 };
    }

    completedOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!daysMap[key]) {
        daysMap[key] = { date: key, revenue: 0, profit: 0, orders: 0 };
      }
      daysMap[key].revenue += order.grandTotal;
      daysMap[key].profit += order.grossProfit;
      daysMap[key].orders += 1;
    });

    return Object.values(daysMap);
  }, [completedOrders]);

  // 2. Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + item.totalPrice;
      });
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [completedOrders]);

  // 3. Top Selling Products
  const topProductsData = useMemo(() => {
    const prodMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!prodMap[item.productId]) {
          prodMap[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        prodMap[item.productId].quantity += item.quantity;
        prodMap[item.productId].revenue += item.totalPrice;
        prodMap[item.productId].profit += item.totalPrice - item.costPrice * item.quantity;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [completedOrders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Sales Intelligence</h1>
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Boss / Admin Access</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audited daily, weekly, monthly, and yearly sales reports, cash drawer reconciliations, and profit margins.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sales Reports (Daily / W / M / Y)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Store Overview & Valuation</span>
          </button>
        </div>
      </div>

      {/* Main SubTab Content */}
      {activeSubTab === 'reports' ? (
        <SalesReportsSection />
      ) : (
        <div className="space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">All-Time Revenue</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalGrossRevenue)}
              </p>
              <p className="text-xs text-slate-500">
                From <strong className="text-slate-700">{completedOrders.length}</strong> total sales
              </p>
            </div>

            {/* Net Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Gross Profit</span>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600 tracking-tight">
                {formatCurrency(totalNetProfit)}
              </p>
              <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold">
                <Percent className="w-3 h-3" />
                <span>{profitMarginPercent}% overall profit margin</span>
              </div>
            </div>

            {/* Average Ticket */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Ticket</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(averageOrderValue)}
              </p>
              <p className="text-xs text-slate-500">Avg spend per customer checkout</p>
            </div>

            {/* Total Units Sold */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Units Sold</span>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {totalUnitsSold.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Individual products checked out</p>
            </div>
          </div>

          {/* Live Inventory Valuation */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inventory Retail Value</span>
              <p className="text-2xl font-black text-white">{formatCurrency(inventoryRetailValuation)}</p>
              <span className="text-[11px] text-slate-400">{products.length} catalog items on shelves</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wholesale Cost (COGS)</span>
              <p className="text-2xl font-black text-slate-300">{formatCurrency(inventoryCostValuation)}</p>
              <span className="text-[11px] text-slate-400">Total invested in current stock</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Potential Unrealized Profit</span>
              <p className="text-2xl font-black text-emerald-400">+{formatCurrency(projectedInventoryProfit)}</p>
              <span className="text-[11px] text-emerald-300">Expected when current stock is sold</span>
            </div>
          </div>

          {/* Revenue & Profit Area Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Sales & Profit Trajectory</h3>
                <p className="text-xs text-slate-400">Daily gross revenue and gross margin curves</p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                Recent 7-Day Window
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: number) => [`$${Number(val || 0).toFixed(2)}`]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#FFF',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross Sales"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Net Profit"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProf)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Category Breakdown & Top 5 Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Share */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Category Revenue Contribution</h3>
                <p className="text-xs text-slate-400">Share of sales by department</p>
              </div>

              <div className="h-64 w-full my-3">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No category sales recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`$${Number(val || 0).toFixed(2)}`, 'Sales']}
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top 5 Products Leaderboard */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Top Performing Products</h3>
                <p className="text-xs text-slate-400">Ranked by total revenue generated</p>
              </div>

              <div className="space-y-3 my-3">
                {topProductsData.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center">No product sales yet</p>
                ) : (
                  topProductsData.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center space-x-3 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-slate-500 text-[10px]">{p.quantity} units sold</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(p.revenue)}</span>
                        <p className="text-[10px] text-emerald-600 font-semibold">+{formatCurrency(p.profit)} profit</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
