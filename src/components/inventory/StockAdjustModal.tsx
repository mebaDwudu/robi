import React, { useState } from 'react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { X, RefreshCw, AlertTriangle, Check } from 'lucide-react';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { adjustStock } = useStore();

  const [mode, setMode] = useState<'adjust' | 'restock' | 'damaged'>('adjust');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  let computedNewStock = currentStock;

  if (mode === 'adjust') {
    computedNewStock = Math.max(0, amount);
  } else if (mode === 'restock') {
    computedNewStock = currentStock + Math.max(0, amount);
  } else if (mode === 'damaged') {
    computedNewStock = Math.max(0, currentStock - Math.max(0, amount));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const movementType = mode === 'adjust' ? 'adjustment' : mode;
    adjustStock(product.id, computedNewStock, reason || `Manual ${mode}`, movementType);
    onClose();
    setAmount(0);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Adjust Stock Level</h3>
            <p className="text-xs text-slate-400 font-mono">{product.name} ({product.sku})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Adjustment Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('adjust');
                setAmount(currentStock);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                mode === 'adjust'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Exact Audit Count
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('restock');
                setAmount(10);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                mode === 'restock'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              + Add Restock
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('damaged');
                setAmount(1);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                mode === 'damaged'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              - Damaged / Loss
            </button>
          </div>

          {/* Current vs New Visualizer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Current Stock</span>
              <span className="text-lg font-bold text-slate-700">{currentStock} {product.unit}</span>
            </div>
            <div className="text-slate-400">➔</div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">New Projected Stock</span>
              <span className={`text-xl font-bold ${computedNewStock <= product.minStockLevel ? 'text-amber-600' : 'text-emerald-600'}`}>
                {computedNewStock} {product.unit}
              </span>
            </div>
          </div>

          {/* Input Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {mode === 'adjust'
                ? 'Actual Physical Counted Units'
                : mode === 'restock'
                ? 'Units to Add to Stock (+)'
                : 'Units to Deduct / Write-off (-)'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Reason / Note</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weekly physical inventory count reconciliation"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Update Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
