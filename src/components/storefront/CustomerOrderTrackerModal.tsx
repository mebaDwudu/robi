import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Search,
  X,
  Clock,
  PackageCheck,
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  AlertTriangle,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { CustomerOnlineOrder } from '../../types/store';

interface CustomerOrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderCode?: string;
}

export const CustomerOrderTrackerModal: React.FC<CustomerOrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderCode = '',
}) => {
  const { customerOrders, settings, refreshCloudData } = useStore();
  const [inputCode, setInputCode] = useState(initialOrderCode);
  const [searchedCode, setSearchedCode] = useState(initialOrderCode.trim().toUpperCase());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialOrderCode) {
      setInputCode(initialOrderCode);
      setSearchedCode(initialOrderCode.trim().toUpperCase());
    }
  }, [initialOrderCode]);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevWidth = document.body.style.width;
      const prevOverflow = document.body.style.overflow;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        document.body.style.overflow = prevOverflow;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Find the order matching the searched code
  const matchedOrder: CustomerOnlineOrder | undefined = searchedCode
    ? customerOrders.find(
        (o) =>
          (o.orderCode && o.orderCode.toUpperCase() === searchedCode) ||
          (o.orderNumber && o.orderNumber.toUpperCase() === searchedCode)
      )
    : undefined;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    setSearchedCode(clean);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const isPickup = matchedOrder?.fulfillmentType === 'pickup';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/30 backdrop-blur-xs overscroll-none touch-none" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] touch-pan-y overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Track Order</h3>
              <p className="text-[11px] text-slate-500">
                Live updates for produce orders
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              className={`p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ${
                isRefreshing ? 'animate-spin text-emerald-600' : ''
              }`}
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar / Add Order Code */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter order code (e.g. FR-4821)..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 uppercase placeholder-slate-400 tracking-wider focus:outline-hidden focus:border-slate-900 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Track
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!searchedCode ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Enter Your Order Code</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                After placing your order, enter the 6-character code (e.g., FR-4821) to see live status updates.
              </p>
            </div>
          ) : !matchedOrder ? (
            <div className="py-10 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Order #{searchedCode} Not Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We could not find an order with this code. Please check your code and try again.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Info Capsule */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Order Code
                  </div>
                  <div className="font-mono text-base font-black text-slate-900">
                    {matchedOrder.orderCode || matchedOrder.orderNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                      isPickup
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {isPickup ? (
                      <>
                        <Store className="w-3.5 h-3.5" /> Pick Up
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5" /> Delivery
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* DELAY NOTIFICATION BANNER (4th Requirement) */}
              {(matchedOrder.isDelayed || matchedOrder.delayNotice) && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-amber-950">
                      Delivery Delay Notification
                    </div>
                    <div className="font-medium text-amber-900">
                      {matchedOrder.delayNotice ||
                        'Your delivery is currently experiencing a delay due to market logistics or traffic. Our team is working to get your fresh produce to you as swiftly as possible.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Visual Steps (5th Requirement) */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Live Order Status
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1: Received */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        matchedOrder.status === 'pending' ||
                        matchedOrder.status === 'preparing' ||
                        matchedOrder.status === 'ready' ||
                        matchedOrder.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-[11px] text-slate-800">Received</div>
                  </div>

                  {/* Step 2: Prepared */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        matchedOrder.status === 'preparing' ||
                        matchedOrder.status === 'ready' ||
                        matchedOrder.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-[11px] text-slate-800">Prepared</div>
                  </div>

                  {/* Step 3: Ready for Pick Up / Delivery on the Way */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        matchedOrder.status === 'ready' || matchedOrder.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPickup ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div className="font-extrabold text-[11px] text-slate-800">
                      {isPickup ? 'Ready for Pick Up' : 'On the Way'}
                    </div>
                  </div>

                  {/* Step 4: Completed */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        matchedOrder.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-[11px] text-slate-800">Completed</div>
                  </div>
                </div>

                {/* Status Explanation Message */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed">
                  {matchedOrder.status === 'pending' && (
                    <span>
                      🌱 <strong>Order Received:</strong> Your order has reached our Brixton Market stall. We are preparing to pick your items.
                    </span>
                  )}
                  {matchedOrder.status === 'preparing' && (
                    <span>
                      📦 <strong>Prepared:</strong> Your fresh produce is currently hand-selected and prepared fresh for you.
                    </span>
                  )}
                  {matchedOrder.status === 'ready' && isPickup && (
                    <span>
                      🏪 <strong>Ready for Pick Up:</strong> Your bag is packed and waiting for collection at Pitch 18 Pope's Road, Brixton Market!
                    </span>
                  )}
                  {matchedOrder.status === 'ready' && !isPickup && (
                    <span>
                      🚚 <strong>Delivery on the Way:</strong> Our courier is en route with your fresh fruits & veg to your delivery address!
                    </span>
                  )}
                  {matchedOrder.status === 'completed' && (
                    <span>
                      ✅ <strong>Order Completed:</strong> This order has been fulfilled. Thank you for shopping fresh at Top Fruit and Veg!
                    </span>
                  )}
                  {matchedOrder.status === 'cancelled' && (
                    <span className="text-rose-700">
                      ❌ <strong>Order Cancelled:</strong> This order was cancelled. Please contact the stall if you have any questions.
                    </span>
                  )}
                </div>
              </div>

              {/* Destination / Address */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isPickup ? 'Collection Point' : 'Delivery Destination'}
                </div>
                <div className="flex items-start gap-1.5 font-semibold text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    {isPickup
                      ? "Pitch 18 Brixton Market Pope's Road London SW9"
                      : matchedOrder.deliveryLocation || 'Specified Delivery Address'}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 flex justify-between">
                  <span>Reserved Items ({matchedOrder.items?.length || 0})</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {matchedOrder.items?.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs text-slate-800"
                    >
                      <span className="font-normal">• {it.productName}</span>
                      <span className="font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Stall Help */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Questions? Contact us</span>
                <a
                  href={`https://wa.me/447449338679?text=Hello%20Masgana,%20inquiring%20about%20Order%20${matchedOrder.orderCode || matchedOrder.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
