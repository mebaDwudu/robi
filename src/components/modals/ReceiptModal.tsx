import React, { useRef } from 'react';
import { Order } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { settings, formatCurrency } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Sale Receipt
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div ref={receiptRef} className="p-6 font-mono text-xs space-y-4 bg-white text-slate-900">
          <div className="text-center space-y-1">
            <div className="text-base font-black tracking-wider uppercase">
              {settings.storeName}
            </div>
            <div className="text-[11px] text-slate-600">{settings.storeAddress}</div>
            <div className="text-[11px] text-slate-600">Tel: {settings.storePhone}</div>
            <div className="text-[10px] text-slate-400">TIN: {settings.taxNumber}</div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Receipt:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName || 'Walk-in'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold border-b pb-1 text-slate-500 uppercase">
              <span>Item</span>
              <span>Qty × Price</span>
              <span>Total</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div className="truncate max-w-[140px] font-medium">{item.productName}</div>
                <div className="text-slate-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
                <div className="font-bold">{formatCurrency(item.totalPrice)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            {order.taxTotal > 0 && (
              <div className="flex justify-between">
                <span>Tax ({order.taxRate}%):</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t">
              <span>GRAND TOTAL:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>Payment ({order.paymentMethod}):</span>
              <span>{formatCurrency(order.amountTendered || order.grandTotal)}</span>
            </div>
            {order.changeGiven !== undefined && order.changeGiven > 0 && (
              <div className="flex justify-between text-[11px] font-bold">
                <span>Change:</span>
                <span>{formatCurrency(order.changeGiven)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
            <div>{settings.receiptFooterMessage || 'Thank you for your purchase!'}</div>
            <div>Please keep this receipt for warranty and returns.</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
