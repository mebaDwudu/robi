import React, { useState } from 'react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { getProduceMeta } from '../../utils/produceImages';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (product: Product, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
  currentBagQuantity?: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToBag,
}) => {
  const { formatCurrency, settings } = useStore();
  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const meta = getProduceMeta(product.name, product.category, product.image);
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= (product.minStockLevel ?? 10);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToBag(product, qty);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full border border-slate-200/80 transition-colors cursor-pointer shadow-xs"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Produce Photo (No Badges, No Rating, No Text Overlays) */}
        <div className="w-full h-56 sm:h-64 bg-slate-100 overflow-hidden">
          <img
            src={meta.imageUrl}
            alt={product.name}
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true';
                target.src =
                  'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500&q=75';
              }
            }}
          />
        </div>

        {/* Minimal Details */}
        <div className="p-5 space-y-4" style={{ color: '#0f172a' }}>
          <div>
            <span
              className="text-[11px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: '#065f46' }}
            >
              {product.category}
            </span>
            <h2
              className="text-xl font-bold leading-snug"
              style={{ color: '#0f172a' }}
            >
              {product.name}
            </h2>
            {product.description && (
              <p
                className="text-xs mt-1.5 leading-relaxed"
                style={{ color: '#475569' }}
              >
                {product.description}
              </p>
            )}

            {/* Produce Origin & Meta */}
            {meta.origin && (
              <div className="pt-2">
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md border"
                  style={{ color: '#065f46', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}
                >
                  {meta.origin}
                </span>
              </div>
            )}

            {/* Storage & Preparation Tips */}
            {(meta.storageTip || meta.cookingTips) && (
              <div className="space-y-1.5 pt-1 text-xs">
                {meta.storageTip && (
                  <p
                    className="p-2 rounded-lg border"
                    style={{ color: '#475569', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <strong style={{ color: '#1e293b' }}>Storage: </strong>{meta.storageTip}
                  </p>
                )}
                {meta.cookingTips && (
                  <p
                    className="p-2 rounded-lg border"
                    style={{ color: '#475569', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <strong style={{ color: '#1e293b' }}>Culinary: </strong>{meta.cookingTips}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Price & Stock */}
          <div
            className="flex items-baseline justify-between pt-3 border-t"
            style={{ borderTopColor: '#f1f5f9' }}
          >
            <div>
              {settings?.showPricesToCustomers !== false ? (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-black"
                    style={{ color: '#0f172a' }}
                  >
                    {formatCurrency(product.sellingPrice)}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: '#64748b' }}
                  >
                    per {product.unit || 'kg'}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold" style={{ color: '#334155' }}>
                  Sold per {product.unit || 'kg'}
                </span>
              )}
            </div>

            <div className="text-xs font-bold">
              {isOutOfStock ? (
                <span style={{ color: '#dc2626' }}>Out of Stock</span>
              ) : isLowStock ? (
                <span style={{ color: '#b45309' }}>{product.stock} left</span>
              ) : (
                <span style={{ color: '#047857' }}>In Stock</span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1 || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-slate-900">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                disabled={qty >= product.stock || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Basket Button */}
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Added to Basket</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {settings.showPricesToCustomers
                      ? `Add to Basket • ${formatCurrency(product.sellingPrice * qty)}`
                      : `Add ${qty} to Order`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
