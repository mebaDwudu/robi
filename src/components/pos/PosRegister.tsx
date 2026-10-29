import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, PaymentMethod, Customer } from '../../types/store';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Banknote,
  Smartphone,
  UserCheck,
  UserPlus,
  X,
  CheckCircle,
  Package,
  AlertCircle,
  Tag,
  ReceiptText,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

export const PosRegister: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    setCartItemDiscount,
    clearCart,
    cartSubtotal,
    cartDiscountTotal,
    cartTaxTotal,
    cartGrandTotal,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    addCustomer,
    checkout,
    formatCurrency,
    settings,
    lastCompletedOrder,
    setLastCompletedOrder,
  } = useStore();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Global Barcode Scanner Keyboard Listener
  React.useEffect(() => {
    let scanBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTypingInInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      const currentTime = Date.now();
      const isRapidKeystroke = currentTime - lastKeyTime < 65; // Barcode scanners send rapid characters
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (scanBuffer.length >= 3) {
          const code = scanBuffer.trim();
          const matched = products.find(
            (p) =>
              p.barcode.toLowerCase() === code.toLowerCase() ||
              p.sku.toLowerCase() === code.toLowerCase()
          );
          if (matched) {
            if (matched.stock > 0) {
              addToCart(matched, 1);
            } else {
              alert(`${matched.name} is currently out of stock.`);
            }
            scanBuffer = '';
            e.preventDefault();
            return;
          }
        }
        scanBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isRapidKeystroke || !isTypingInInput) {
          scanBuffer += e.key;
        } else {
          scanBuffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, addToCart]);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // New Customer Modal
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Item discount state
  const [activeDiscountItemId, setActiveDiscountItemId] = useState<string | null>(null);
  const [discountVal, setDiscountVal] = useState<number>(10);

  // Filtered Products - Ensures "All" shows every product
  const filteredProducts = useMemo(() => {
    const isAll =
      !selectedCategory ||
      selectedCategory === 'All' ||
      selectedCategory === 'All Items' ||
      selectedCategory === 'All Categories' ||
      selectedCategory === 'All Products';

    return products.filter((p) => {
      const matchesCategory = isAll || p.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = products.find(
      (p) =>
        p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matchedProduct) {
      if (matchedProduct.stock > 0) {
        addToCart(matchedProduct, 1);
        setBarcodeInput('');
      } else {
        alert(`${matchedProduct.name} is currently out of stock.`);
      }
    } else {
      alert(`No product found with barcode or SKU: "${barcodeInput}"`);
    }
  };

  // Quick tender presets
  const tenderPresets = [
    Math.ceil(cartGrandTotal),
    Math.ceil(cartGrandTotal / 10) * 10 || 10,
    20,
    50,
    100,
  ].filter((val, index, self) => val >= cartGrandTotal && self.indexOf(val) === index);

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - cartGrandTotal);

  const handleExecuteCheckout = () => {
    if (paymentMethod === 'cash' && tenderedNum < cartGrandTotal) {
      alert(`Tendered amount must be at least ${formatCurrency(cartGrandTotal)}`);
      return;
    }

    const completed = checkout(
      paymentMethod,
      paymentMethod === 'cash' ? tenderedNum : cartGrandTotal,
      orderNotes
    );

    if (completed) {
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setAmountTendered('');
      setOrderNotes('');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const created = await addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || undefined,
    });

    setSelectedCustomer(created);
    setIsNewCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div className="h-full flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* Left: Product Catalog Grid & Search */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-slate-50 overflow-hidden">
        {/* Search Bar & Barcode Scanner Row */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shadow-xs space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-barcode-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / Type Barcode + ↵"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
              {barcodeInput && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-md font-medium"
                >
                  Add
                </button>
              )}
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isCatActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
              <Package className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No products found</p>
              <p className="text-xs text-slate-400">Try selecting "All" or adjusting search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock =
                  product.stock > 0 &&
                  product.stock <= (product.minStockLevel || settings.lowStockThresholdDefault);
                const inCart = cart.find((item) => item.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    id={`pos-item-${product.id}`}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(product, 1);
                    }}
                    className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/30 cursor-pointer hover:shadow-md'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                    }`}
                  >
                    {/* Cart count badge */}
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-xs z-10">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Product Image Thumbnail */}
                    <div className="w-full h-28 mb-2 rounded-lg overflow-hidden bg-slate-100 relative group flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-emerald-600/70" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-full">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug mb-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">/{product.unit}</span>
                      </div>

                      {/* Stock Badge */}
                      <span
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Out'
                          : `${product.stock} left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Active POS Cart & Billing Panel */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white flex flex-col border-t lg:border-t-0 shadow-lg z-10">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm tracking-tight">Active Register Cart</h3>
            <span className="bg-slate-800 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold border border-slate-700">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {cart.length > 0 && (
            <button
              id="clear-cart-btn"
              onClick={clearCart}
              className="text-slate-400 hover:text-rose-300 text-xs flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Selector Ribbon */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 mr-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <select
              id="pos-customer-select"
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Walk-in Customer (General)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier} - {c.loyaltyPoints} pts)
                </option>
              ))}
            </select>
          </div>

          <button
            id="add-customer-pos-btn"
            onClick={() => setIsNewCustomerOpen(true)}
            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Add New Customer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Loyalty Banner if selected */}
        {selectedCustomer && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div>
              <span className="font-semibold">{selectedCustomer.name}</span>
              <span className="ml-2 text-emerald-700 text-[11px]">
                Tier: <strong>{selectedCustomer.tier}</strong> ({selectedCustomer.loyaltyPoints} Points)
              </span>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingCart className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Cart is empty</p>
              <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                Scan a barcode or click items from the left product catalog to add them to this order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const itemUnitTotal =
                  (item.customPrice ?? item.product.sellingPrice) *
                  item.quantity *
                  (1 - (item.discountPercent || 0) / 100);

                return (
                  <div key={item.product.id} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2.5">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-md object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex-1 pr-2">
                        <h5 className="font-semibold text-slate-800 text-sm leading-tight">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                          <span>{formatCurrency(item.product.sellingPrice)}/{item.product.unit}</span>
                          {item.discountPercent && item.discountPercent > 0 ? (
                            <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
                              -{item.discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span className="font-bold text-slate-900 text-sm shrink-0">
                        {formatCurrency(itemUnitTotal)}
                      </span>
                    </div>

                    {/* Quantity & Discount Stepper */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center space-x-1">
                        <button
                          id={`qty-minus-${item.product.id}`}
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-800 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          id={`qty-plus-${item.product.id}`}
                          onClick={() => {
                            if (item.quantity < item.product.stock) {
                              updateCartQuantity(item.product.id, item.quantity + 1);
                            } else {
                              alert(`Cannot exceed available stock of ${item.product.stock}`);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Discount button */}
                        <button
                          id={`discount-btn-${item.product.id}`}
                          onClick={() => {
                            setActiveDiscountItemId(item.product.id);
                            setDiscountVal(item.discountPercent || 10);
                          }}
                          className="text-xs text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md border border-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          <span>Discount</span>
                        </button>

                        {/* Remove item */}
                        <button
                          id={`remove-item-${item.product.id}`}
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Financial Summary & Checkout Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
          </div>

          {cartDiscountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Item Discounts</span>
              <span>-{formatCurrency(cartDiscountTotal)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Sales Tax ({settings.taxRatePercent}%)</span>
            <span className="font-semibold">{formatCurrency(cartTaxTotal)}</span>
          </div>

          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payable</span>
            <span className="text-emerald-700 text-lg">{formatCurrency(cartGrandTotal)}</span>
          </div>

          <button
            id="proceed-checkout-btn"
            disabled={cart.length === 0}
            onClick={() => {
              setPaymentMethod('cash');
              setAmountTendered(cartGrandTotal.toString());
              setIsCheckoutOpen(true);
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center space-x-2 mt-3 cursor-pointer ${
              cart.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Proceed to Payment</span>
            <span>• {formatCurrency(cartGrandTotal)}</span>
          </button>
        </div>
      </div>

      {/* Item Discount Modal */}
      {activeDiscountItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-5 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Apply Line Item Discount</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Discount Percentage (%)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
              </div>

              {/* Quick % buttons */}
              <div className="flex space-x-2">
                {[5, 10, 15, 20, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountVal(pct)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => {
                    setCartItemDiscount(activeDiscountItemId, 0);
                    setActiveDiscountItemId(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setCartItemDiscount(activeDiscountItemId, discountVal);
                    setActiveDiscountItemId(null);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Complete Payment</h3>
                <p className="text-xs text-slate-400">Total Due: {formatCurrency(cartGrandTotal)}</p>
              </div>
              <button
                id="close-checkout-modal-btn"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setAmountTendered(cartGrandTotal.toString());
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setAmountTendered(cartGrandTotal.toString());
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                    <span>Credit / Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('mobile');
                      setAmountTendered(cartGrandTotal.toString());
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === 'mobile'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1 text-purple-600" />
                    <span>Mobile / QR</span>
                  </button>
                </div>
              </div>

              {/* Cash specific drawer calculator */}
              {paymentMethod === 'cash' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-700">Cash Received from Customer:</label>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                        {settings.currencySymbol}
                      </span>
                      <input
                        id="amount-tendered-input"
                        type="number"
                        step="0.01"
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-right text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preset quick money buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tenderPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountTendered(val.toString())}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                  </div>

                  {/* Change Output */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                    <span className="font-semibold text-slate-700">Change Due:</span>
                    <span
                      className={`font-mono text-base font-bold ${
                        tenderedNum < cartGrandTotal ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {tenderedNum < cartGrandTotal
                        ? `Short ${formatCurrency(cartGrandTotal - tenderedNum)}`
                        : formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Optional Order Memo / Reference</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Table 4, Special request, Corporate ID..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              {/* Final Confirm Button */}
              <button
                id="confirm-checkout-btn"
                onClick={handleExecuteCheckout}
                disabled={paymentMethod === 'cash' && tenderedNum < cartGrandTotal}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer ${
                  paymentMethod === 'cash' && tenderedNum < cartGrandTotal
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
                }`}
              >
                Confirm Sale & Print Receipt ({formatCurrency(cartGrandTotal)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isNewCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Quick Add Customer</span>
              </h4>
              <button onClick={() => setIsNewCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Save & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Completed Receipt Modal */}
      <ReceiptModal
        order={lastCompletedOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
