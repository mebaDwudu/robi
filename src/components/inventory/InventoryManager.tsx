import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Download,
  Edit2,
  Trash2,
  Layers,
  DollarSign,
  TrendingUp,
  PackageCheck,
  PackageX,
  Boxes,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { ProductModal } from './ProductModal';
import { StockAdjustModal } from './StockAdjustModal';

interface InventoryManagerProps {
  onNavigateToPO?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onNavigateToPO }) => {
  const {
    products,
    categories,
    deleteProduct,
    lowStockProducts,
    outOfStockProducts,
    formatCurrency,
    settings,
    currentRole,
  } = useStore();

  const isCashier = currentRole === 'cashier';

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'price' | 'category'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Inventory valuation calculation
  const safeProducts = products || [];
  const safeLowStock = lowStockProducts || [];
  const safeOutOfStock = outOfStockProducts || [];

  const totalInventoryCost = safeProducts.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stock || 0), 0);
  const totalRetailValuation = safeProducts.reduce((sum, p) => sum + (p.sellingPrice || 0) * (p.stock || 0), 0);
  const totalUnitsInStock = safeProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Filtered & Sorted list
  const filteredProducts = useMemo(() => {
    const isAllCat =
      !selectedCategory ||
      selectedCategory === 'All' ||
      selectedCategory === 'All Items' ||
      selectedCategory === 'All Categories' ||
      selectedCategory === 'All Products';

    return safeProducts
      .filter((p) => {
        const matchesCat = isAllCat || p.category === selectedCategory;
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.barcode && p.barcode.includes(term));

        const isLow = p.stock > 0 && p.stock <= (p.minStockLevel || settings.lowStockThresholdDefault || 10);
        const isOut = p.stock <= 0;
        const isInStock = p.stock > (p.minStockLevel || settings.lowStockThresholdDefault || 10);

        let matchesStock = true;
        if (stockStatusFilter === 'low') matchesStock = isLow;
        if (stockStatusFilter === 'out') matchesStock = isOut;
        if (stockStatusFilter === 'in_stock') matchesStock = isInStock;

        return matchesCat && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
        else if (sortField === 'category') cmp = (a.category || '').localeCompare(b.category || '');
        else if (sortField === 'stock') cmp = (a.stock || 0) - (b.stock || 0);
        else if (sortField === 'price') cmp = (a.sellingPrice || 0) - (b.sellingPrice || 0);

        return sortAsc ? cmp : -cmp;
      });
  }, [safeProducts, selectedCategory, searchTerm, stockStatusFilter, sortField, sortAsc, settings]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Product ID', 'Name', 'SKU', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Unit', 'Min Threshold'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      p.category,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.stock,
      p.unit,
      p.minStockLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto space-y-5">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage stock levels, pricing, and catalog
          </p>
        </div>

        {!isCashier && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="export-inventory-csv-btn"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              id="add-product-btn"
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className={`grid gap-3 ${isCashier ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Items</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{products.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalUnitsInStock} in storage</p>
        </div>

        {!isCashier && (
          <>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cost</span>
                <DollarSign className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-xl font-black text-slate-950">{formatCurrency(totalInventoryCost)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Capital invested</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Retail</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-slate-950">{formatCurrency(totalRetailValuation)}</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                +{formatCurrency(totalRetailValuation - totalInventoryCost)} profit
              </p>
            </div>
          </>
        )}

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-amber-600">{safeLowStock.length}</p>
            <span className="text-[11px] text-rose-600 font-bold">({safeOutOfStock.length} out)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Need restock</p>
        </div>
      </div>

      {/* Low Stock Urgent Reorder Banner */}
      {(safeLowStock.length > 0 || safeOutOfStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Attention: {safeLowStock.length + safeOutOfStock.length} items need replenishment
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {safeOutOfStock.length} items are currently completely depleted and {safeLowStock.length} items are below safe thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setStockStatusFilter('low')}
              className="px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Filter Low Stock
            </button>
            {onNavigateToPO && (
              <button
                onClick={onNavigateToPO}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Create Restock PO
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="inventory-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, SKU, barcode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 focus:outline-none"
            />
          </div>

          {/* Category dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock state filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (Healthy)</option>
              <option value="low">Low Stock Alerts</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider select-none">
              <tr>
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortAsc(!sortAsc);
                  }}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Product Item</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">SKU / Barcode</th>
                <th
                  onClick={() => {
                    setSortField('category');
                    setSortAsc(!sortAsc);
                  }}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {!isCashier && (
                  <th className="px-4 py-3.5 text-right">Cost Price</th>
                )}
                <th
                  onClick={() => {
                    setSortField('price');
                    setSortAsc(!sortAsc);
                  }}
                  className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Retail Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {!isCashier && (
                  <th className="px-4 py-3.5 text-center">Margin</th>
                )}
                <th
                  onClick={() => {
                    setSortField('stock');
                    setSortAsc(!sortAsc);
                  }}
                  className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {!isCashier && (
                  <th className="px-4 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isCashier ? 5 : 8} className="px-4 py-12 text-center text-slate-400">
                    No products matched your search filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow =
                    p.stock > 0 &&
                    p.stock <= (p.minStockLevel || settings.lowStockThresholdDefault);
                  const marginPct =
                    p.sellingPrice > 0
                      ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0)
                      : '0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Description & Thumbnail */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                              <Boxes className="w-5 h-5 text-emerald-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-snug">{p.name}</p>
                            {p.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="px-4 py-3.5 font-mono">
                        <p className="font-semibold text-slate-700">{p.sku}</p>
                        <p className="text-[10px] text-slate-400">{p.barcode}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost (Admin Only) */}
                      {!isCashier && (
                        <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                          {formatCurrency(p.costPrice)}
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice)}
                        <span className="text-[10px] text-slate-400 ml-0.5">/{p.unit}</span>
                      </td>

                      {/* Margin (Admin Only) */}
                      {!isCashier && (
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-semibold ${
                              Number(marginPct) >= 40
                                ? 'text-emerald-700'
                                : Number(marginPct) >= 20
                                ? 'text-blue-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {marginPct}%
                          </span>
                        </td>
                      )}

                      {/* Stock Level */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Min: {p.minStockLevel}
                          </span>
                        </div>
                      </td>

                      {/* Actions (Admin Only) */}
                      {!isCashier && (
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            id={`adjust-stock-btn-${p.id}`}
                            onClick={() => setAdjustingProduct(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Count or adjust stock"
                          >
                            Adjust
                          </button>

                          <button
                            id={`edit-prod-btn-${p.id}`}
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`delete-prod-btn-${p.id}`}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        product={adjustingProduct}
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />
    </div>
  );
};
