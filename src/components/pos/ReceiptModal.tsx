import React, { useRef } from 'react';
import { Order } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { Printer, Download, CheckCircle, X, Store, Tag } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { settings, formatCurrency } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in duration-150">
        {/* Top Header Banner */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-100" />
            <h3 className="font-semibold text-lg">Sale Completed</h3>
          </div>
          <button
            id="close-receipt-modal-btn"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 flex items-center justify-between border-b border-slate-200">
          <span className="text-xs text-slate-500 font-mono">ID: {order.orderNumber}</span>
          <div className="flex items-center space-x-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Thermal Receipt Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto font-mono text-xs text-slate-800" ref={receiptRef}>
          <div className="text-center space-y-1 mb-4 pb-3 border-b border-dashed border-slate-300">
            <div className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center justify-center space-x-1">
              <Store className="w-4 h-4 text-emerald-600 inline" />
              <span>{settings.storeName}</span>
            </div>
            <p className="text-slate-500 text-[11px]">{settings.storeAddress}</p>
            <p className="text-slate-500 text-[11px]">Tel: {settings.storePhone}</p>
            <p className="text-slate-500 text-[11px]">Tax ID: {settings.taxNumber}</p>
          </div>

          <div className="space-y-1 mb-3 text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date / Time:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{order.cashierName}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Customer:</span>
                <span>{order.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="uppercase font-semibold">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-4">
            <div className="grid grid-cols-12 font-bold text-slate-700 pb-1 mb-1 border-b border-slate-300">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center text-slate-800">
                  <div className="col-span-6 truncate pr-1">
                    <p className="font-medium truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                  </div>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-2 text-right">{formatCurrency(item.unitPrice)}</span>
                  <span className="col-span-2 text-right font-medium">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-3 border-t border-dashed border-slate-300 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>Discount</span>
                </span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax ({order.taxRate}%)</span>
              <span>{formatCurrency(order.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>TOTAL</span>
              <span className="text-emerald-700 text-base">{formatCurrency(order.grandTotal)}</span>
            </div>

            {order.paymentMethod === 'cash' && order.amountTendered && (
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(order.amountTendered)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Change Given:</span>
                  <span>{formatCurrency(order.changeGiven || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">{settings.receiptHeaderMessage}</p>
            <p>{settings.receiptFooterMessage}</p>
            <div className="pt-2">
              <div className="inline-block px-4 py-1 tracking-widest text-[12px] bg-slate-100 rounded text-slate-700 font-bold border border-slate-200">
                * {order.orderNumber} *
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="done-receipt-btn"
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-colors text-sm cursor-pointer shadow-sm"
          >
            Done & Return to POS
          </button>
        </div>
      </div>
    </div>
  );
};
