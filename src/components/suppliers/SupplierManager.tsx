import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier, PurchaseOrder } from '../../types/store';
import { sanitizeText, sanitizePhone, sanitizeEmail } from '../../utils/sanitize';
import {
  Truck,
  Plus,
  PackageCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const SupplierManager: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    products,
    lowStockProducts,
    outOfStockProducts,
    addSupplier,
    createPurchaseOrder,
    receivePurchaseOrder,
    formatCurrency,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'po' | 'suppliers'>('po');

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCategories, setSupCategories] = useState('Beverages, Pantry & Staples');

  // New PO Form
  const [selectedSupId, setSelectedSupId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; costPerUnit: number }[]>([]);
  const [poNotes, setPoNotes] = useState('');

  // Open Create PO with low-stock prefilled
  const handleAutoGenerateLowStockPO = () => {
    const lowItems = [...outOfStockProducts, ...lowStockProducts];
    if (lowItems.length === 0) {
      alert('All products are currently well-stocked above their minimum alert threshold.');
      return;
    }

    const defaultSup = suppliers[0]?.id || '';
    setSelectedSupId(defaultSup);

    const generated = lowItems.map((p) => ({
      productId: p.id,
      quantity: Math.max(12, (p.minStockLevel || 10) * 2 - p.stock),
      costPerUnit: p.costPrice || 1.0,
    }));

    setPoItems(generated);
    setPoNotes(`Automated Restock Batch for ${lowItems.length} low/out-of-stock items.`);
    setIsCreatePOOpen(true);
  };

  const handleOpenManualPO = () => {
    if (products.length === 0) {
      alert('Please add products to your catalog first.');
      return;
    }
    setSelectedSupId(suppliers[0]?.id || '');
    setPoItems([{ productId: products[0].id, quantity: 10, costPerUnit: products[0].costPrice }]);
    setPoNotes('');
    setIsCreatePOOpen(true);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(supName, 100);
    const cleanContact = sanitizeText(supContact, 100);
    const cleanEmail = sanitizeEmail(supEmail);
    const cleanPhone = sanitizePhone(supPhone);
    const cleanAddress = sanitizeText(supAddress, 300);

    if (!cleanName) return;

    addSupplier({
      name: cleanName,
      contactPerson: cleanContact || 'Account Manager',
      email: cleanEmail || 'orders@supplier.com',
      phone: cleanPhone || '+1 (555) 000-0000',
      address: cleanAddress || undefined,
      suppliedCategories: supCategories
        .split(',')
        .map((c) => sanitizeText(c.trim(), 50))
        .filter(Boolean),
    });

    setIsAddSupplierOpen(false);
    setSupName('');
    setSupContact('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupId || poItems.length === 0) return;

    const cleanNotes = sanitizeText(poNotes, 500);
    const sup = suppliers.find((s) => s.id === selectedSupId);
    const enrichedItems = poItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Unknown Produce',
        sku: prod?.sku || 'SKU',
        quantityOrdered: item.quantity,
        costPerUnit: item.costPerUnit,
        totalCost: item.quantity * item.costPerUnit,
      };
    });
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.totalCost, 0);

    createPurchaseOrder({
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierId: selectedSupId,
      supplierName: sup?.name || 'Supplier',
      items: enrichedItems,
      totalAmount,
      status: 'ordered',
      orderDate: new Date().toISOString().split('T')[0],
      notes: cleanNotes || undefined,
    });
    setIsCreatePOOpen(false);
  };

  const handleAddPOLineItem = () => {
    if (products.length === 0) return;
    setPoItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 10, costPerUnit: products[0].costPrice },
    ]);
  };

  const handleRemovePOLineItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePOLine = (index: number, field: 'productId' | 'quantity' | 'costPerUnit', value: any) => {
    setPoItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          return { ...item, productId: value, costPerUnit: prod?.costPrice || item.costPerUnit };
        }
        return { ...item, [field]: value };
      })
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-100 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers & Restock Orders</h2>
          <p className="text-sm text-slate-500">
            Manage vendor purchase orders, supply chain contracts, and stock fulfillment
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleAutoGenerateLowStockPO}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Auto-Restock Low Items</span>
          </button>

          <button
            onClick={handleOpenManualPO}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('po')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'po'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Supplier Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* PO View */}
      {activeTab === 'po' ? (
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 stroke-[1.3] mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No purchase orders created yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Create Purchase Order" or "Auto-Restock Low Items" to generate a restock batch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOrders.map((po) => {
                const isReceived = po.status === 'received';

                return (
                  <div
                    key={po.id}
                    className={`bg-white p-5 rounded-2xl border transition-all ${
                      isReceived ? 'border-slate-200 opacity-90' : 'border-emerald-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{po.poNumber}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {po.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-1">{po.supplierName}</p>
                        <p className="text-[11px] text-slate-400">
                          Ordered on: {new Date(po.orderDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900">
                          {formatCurrency(po.totalAmount)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {po.items.reduce((s, i) => s + i.quantityOrdered, 0)} units
                        </p>
                      </div>
                    </div>

                    {/* PO Items Preview */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 mb-4 text-xs">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700">
                          <span className="truncate pr-2">
                            <strong>{item.quantityOrdered}x</strong> {item.productName}
                          </span>
                          <span className="font-mono font-medium text-slate-900">
                            {formatCurrency(item.totalCost)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {po.notes && (
                      <p className="text-[11px] text-slate-500 italic mb-3">Memo: {po.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        {isReceived && po.receivedDate
                          ? `Delivered & Stocked on ${new Date(po.receivedDate).toLocaleDateString()}`
                          : 'Pending Delivery'}
                      </span>

                      {!isReceived && (
                        <button
                          id={`receive-po-${po.id}`}
                          onClick={() => receivePurchaseOrder(po.id)}
                          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Receive & Add Stock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Suppliers Directory */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{sup.name}</h4>
                    <p className="text-xs text-slate-500">Contact: {sup.contactPerson}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                    {sup.activeOrdersCount} active orders
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {sup.suppliedCategories.map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[10px]">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base">Add New Supplier Vendor</h4>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. Apex Wholesale Supply"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  placeholder="orders@vendor.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Supplied Categories (comma separated)</label>
                <input
                  type="text"
                  value={supCategories}
                  onChange={(e) => setSupCategories(e.target.value)}
                  placeholder="Beverages, Produce, Dairy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">New Purchase Restock Order</h4>
                <p className="text-xs text-slate-400">Order inventory from suppliers</p>
              </div>
              <button onClick={() => setIsCreatePOOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Supplier *</label>
                <select
                  value={selectedSupId}
                  onChange={(e) => setSelectedSupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line items table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-700">Order Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddPOLineItem}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdatePOLine(idx, 'productId', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - Current Stock: {p.stock}
                          </option>
                        ))}
                      </select>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePOLine(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Unit Cost"
                          value={item.costPerUnit}
                          onChange={(e) => handleUpdatePOLine(idx, 'costPerUnit', Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-right font-mono"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-slate-800">
                        {formatCurrency(item.quantity * item.costPerUnit)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePOLineItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Expected delivery schedule, dock instructions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Total PO Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(poItems.reduce((acc, i) => acc + i.quantity * i.costPerUnit, 0))}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePOOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
