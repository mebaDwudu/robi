import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import { getProduceMeta } from '../../utils/produceImages';
import { normalizeCategory } from '../../utils/produceSanitizer';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerCartDrawer, CustomerCartItem } from './CustomerCartDrawer';
import { CustomerFeedbackModal } from '../modals/CustomerFeedbackModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import { CustomerOrderTrackerModal } from './CustomerOrderTrackerModal';
import { LivingBackground } from '../common/LivingBackground';
import { StoreContactQrCard } from './StoreContactQrCard';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import { validateHumanSubmission } from '../../utils/security';
import {
  Search,
  ShoppingBag,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  Store,
  Leaf,
  Heart,
  Globe,
  Handshake,
  Send,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Plus,
  Minus,
  MessageSquare,
  Tag,
  Lock,
  Truck,
  Check,
  Home,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

const formatCategoryName = (cat?: string): string => {
  if (!cat || typeof cat !== 'string') return 'Produce';
  const lower = cat.toLowerCase();
  if (lower.includes('fruit')) return 'Fruits';
  if (lower.includes('veg')) return 'Vegetables';
  if (lower.includes('root') || lower.includes('tuber')) return 'Roots';
  if (lower.includes('herb')) return 'Herbs';
  if (lower.includes('exotic') || lower.includes('tropical')) return 'Exotics';
  if (lower.includes('drink') || lower.includes('grocer')) return 'Groceries';
  return cat.split(' ')[0] || cat;
};

interface CustomerStorefrontProps {
  onSwitchToStaff: () => void;
}

type CustomerPageTab = 'landing' | 'home' | 'about_contact';

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({ onSwitchToStaff }) => {
  const {
    products = [],
    categories = [],
    formatCurrency,
    settings,
    isOnline = true,
    dbStatus,
    customerOrders = [],
    refreshCloudData,
  } = useStore();

  // Navigation & view state (defaults to landing page on open)
  const [currentTab, setCurrentTab] = useState<CustomerPageTab>('landing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOrganicFilter, setSelectedOrganicFilter] = useState<'all' | 'organic' | 'non-organic'>('all');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest'>('name_asc');

  // Interactive state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [preFilledOrderCode, setPreFilledOrderCode] = useState('');

  // Micro-interaction states for tactile feedback
  const [cartBounce, setCartBounce] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cartToastMessage, setCartToastMessage] = useState<string | null>(null);
  const cartToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showPrices = settings?.showPricesToCustomers !== false;

  // Real-time network sync & queued offline orders computation
  const queuedOrdersCount = useMemo(() => {
    return (customerOrders || []).filter(
      (o) => o && (o.status === 'pending' || o.id?.startsWith('cust-ord-'))
    ).length;
  }, [customerOrders]);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    _website_hp: '', // Honeypot field for bot trap
  });
  const [formRenderedAt, setFormRenderedAt] = useState<number>(() => Date.now());
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Secret Admin Access Trigger (Keyboard shortcut & 4-click event on logo/footer trigger areas)
  const secretClickCountRef = React.useRef(0);
  const secretClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretAdminTrigger = () => {
    if (secretClickTimerRef.current) {
      clearTimeout(secretClickTimerRef.current);
    }
    secretClickCountRef.current += 1;
    if (secretClickCountRef.current >= 4) {
      secretClickCountRef.current = 0;
      onSwitchToStaff();
    } else {
      secretClickTimerRef.current = setTimeout(() => {
        secretClickCountRef.current = 0;
      }, 1500);
    }
  };

  // Keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A or Alt+Shift+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey || e.altKey) &&
        e.shiftKey &&
        (e.key === 'A' || e.key === 'a' || e.key === 'B' || e.key === 'b')
      ) {
        e.preventDefault();
        onSwitchToStaff();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToStaff]);

  // Hash-based routing synchronization across desktop & mobile
  const applyHashRoute = useCallback((hashStr: string) => {
    const clean = hashStr.replace(/^#\/?/, '').toLowerCase().trim();
    if (!clean) return;

    if (clean === 'home' || clean === 'landing' || clean === 'customer' || clean === 'storefront') {
      setCurrentTab('landing');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'products' || clean === 'produce' || clean === 'catalog') {
      setCurrentTab('home');
      setSelectedCategory('All');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'track-order' || clean === 'track' || clean === 'trackorder') {
      setIsTrackerModalOpen(true);
      setIsFeedbackModalOpen(false);
    } else if (clean === 'about-us' || clean === 'about' || clean === 'contact' || clean === 'about_contact') {
      setCurrentTab('about_contact');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'feedback' || clean === 'reviews' || clean === 'review') {
      setIsFeedbackModalOpen(true);
      setIsTrackerModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      applyHashRoute(window.location.hash);
    }

    const handleHashChange = () => {
      applyHashRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [applyHashRoute]);

  // Navigation click handler for hash-based routing paths
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: '#/home' | '#/products' | '#/track-order' | '#/about-us' | '#/feedback'
  ) => {
    if (hash === '#/track-order') {
      setIsTrackerModalOpen(true);
      setIsFeedbackModalOpen(false);
    } else if (hash === '#/feedback') {
      setIsFeedbackModalOpen(true);
      setIsTrackerModalOpen(false);
    } else if (hash === '#/home') {
      setCurrentTab('landing');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#/products') {
      setCurrentTab('home');
      setSelectedCategory('All');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#/about-us') {
      setCurrentTab('about_contact');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileSidebarOpen(false);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  // Cart helper functions
  const totalCartCount = (cartItems || []).reduce((acc, item) => acc + (item?.quantity || 0), 0);
  const cartSubtotal = (cartItems || []).reduce(
    (acc, item) => acc + (item?.product?.sellingPrice || 0) * (item?.quantity || 0),
    0
  );

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!product || !product.id) return;
    setCartItems((prev) => {
      const existing = (prev || []).find((item) => item?.product?.id === product.id);
      if (existing) {
        return (prev || []).map((item) =>
          item?.product?.id === product.id
            ? { ...item, quantity: Math.min(product.stock || 999, (item.quantity || 0) + quantity) }
            : item
        );
      }
      return [...(prev || []), { product, quantity }];
    });

    // Tactile micro-interaction feedback
    setRecentlyAddedId(product.id);
    setCartBounce(true);
    setCartToastMessage(`Added ${product.name} to basket`);

    if (cartToastTimeoutRef.current) {
      clearTimeout(cartToastTimeoutRef.current);
    }
    cartToastTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedId(null);
      setCartBounce(false);
      setCartToastMessage(null);
    }, 1800);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      (prev || []).map((item) =>
        item?.product?.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => (prev || []).filter((item) => item?.product?.id !== productId));
  };

  const handleClearBag = () => {
    setCartItems([]);
  };

  // Filtered products for full-screen display
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        if (!p) return false;
        const pName = p.name || '';
        const pCategory = p.category || '';
        const pSku = p.sku || '';
        const pDesc = p.description || '';
        const meta = getProduceMeta(pName, pCategory, p.image);

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = pName.toLowerCase().includes(q);
          const matchesCategory = pCategory.toLowerCase().includes(q);
          const matchesSku = pSku.toLowerCase().includes(q);
          const matchesDesc = pDesc.toLowerCase().includes(q);
          const matchesOrigin = (meta.origin || '').toLowerCase().includes(q);
          if (!matchesName && !matchesCategory && !matchesSku && !matchesDesc && !matchesOrigin) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All') {
          const normSelected = normalizeCategory(selectedCategory).toLowerCase();
          const normProd = normalizeCategory(pCategory).toLowerCase();
          const directMatch =
            pCategory.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            selectedCategory.toLowerCase().includes(pCategory.toLowerCase());
          if (normSelected !== normProd && !directMatch) {
            return false;
          }
        }

        // Organic filter
        if (selectedOrganicFilter === 'organic' && !meta.isOrganic) return false;
        if (selectedOrganicFilter === 'non-organic' && meta.isOrganic) return false;

        // Availability filter
        const stock = p.stock ?? 0;
        if (selectedAvailabilityFilter === 'in-stock' && stock <= 0) return false;
        if (selectedAvailabilityFilter === 'out-of-stock' && stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        const nameA = a?.name || '';
        const nameB = b?.name || '';
        const priceA = a?.sellingPrice ?? 0;
        const priceB = b?.sellingPrice ?? 0;
        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'newest') {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedOrganicFilter,
    selectedAvailabilityFilter,
    sortBy,
  ]);

  // Contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    // Bot detection check
    const botCheck = validateHumanSubmission({
      honeypotValue: contactForm._website_hp,
      renderedTimestamp: formRenderedAt,
    });

    if (!botCheck.isHuman) {
      setContactError('Submission rejected: automated bot behavior detected.');
      return;
    }

    const cleanName = sanitizeText(contactForm.name, 100);
    const cleanEmail = sanitizeEmail(contactForm.email);
    const cleanPhone = sanitizePhone(contactForm.phone);
    const cleanMessage = sanitizeText(contactForm.message, 1500);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setContactError('Please enter your name, a valid email address, and a message.');
      return;
    }

    setContactSuccess(true);
    setContactError(null);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '', _website_hp: '' });
      setFormRenderedAt(Date.now());
    }, 4000);
  };

  const renderProduceCatalogContent = () => (
    <div className="space-y-4">
      {/* Category Filter & Search Bar: Clean Minimal Segmented Controls */}
      <section
        className="w-full rounded-2xl p-3 sm:p-4 space-y-3 shadow-xs"
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #fde68a',
          boxShadow: '0 4px 14px -2px rgba(245, 158, 11, 0.06)',
        }}
      >
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const singleWord = formatCategoryName(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {singleWord}
              </button>
            );
          })}
        </div>

        {/* Secondary Search Input */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>
          <span className="text-slate-400 text-[11px] shrink-0">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </section>

      {/* Produce Grid */}
      <section className="w-full">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">No Produce Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No items matched "{searchQuery}". Try searching for another fruit or vegetable.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedOrganicFilter('all');
                setSelectedAvailabilityFilter('all');
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
            {filteredProducts.map((prod) => {
              const meta = getProduceMeta(prod.name, prod.category, prod.image);
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockLevel;
              const existingCartItem = cartItems.find((item) => item.product.id === prod.id);
              const cartQty = existingCartItem?.quantity || 0;

              return (
                <div
                  key={prod.id}
                  className="produce-card rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #fde68a',
                    boxShadow: '0 4px 14px -2px rgba(245, 158, 11, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                    color: '#0f172a',
                    position: 'relative',
                    zIndex: 1,
                    isolation: 'isolate',
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)',
                    opacity: 1,
                    visibility: 'visible',
                  }}
                >
                  {/* Real Fruit Image Container */}
                  <div>
                    <div
                      onClick={() => setSelectedProduct(prod)}
                      className="relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer flex items-center justify-center border"
                      style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}
                    >
                      <img
                        src={meta.imageUrl}
                        alt={prod.name}
                        loading="lazy"
                        decoding="async"
                        width="280"
                        height="280"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = 'true';
                            target.src =
                              'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=75';
                          }
                        }}
                      />

                      {/* Fallback produce emoji tag if image takes time to load */}
                      <div
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center shadow-xs text-sm pointer-events-none"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', border: '1px solid #fde68a' }}
                        title={prod.name}
                      >
                        {meta.emoji || '🥭'}
                      </div>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs flex items-center justify-center">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs"
                            style={{ color: '#be123c', backgroundColor: '#ffffff', borderColor: '#fecdd3' }}
                          >
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fruit Info & Texts - ALWAYS 100% VISIBLE WITHOUT HOVER */}
                    <div className="pt-3 space-y-1" style={{ opacity: 1, visibility: 'visible' }}>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider block"
                          style={{ color: '#047857', opacity: 1, visibility: 'visible' }}
                        >
                          {formatCategoryName(prod.category)}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold" style={{ color: '#e11d48', opacity: 1, visibility: 'visible' }}>Sold Out</span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold" style={{ color: '#b45309', opacity: 1, visibility: 'visible' }}>{prod.stock} left</span>
                        ) : (
                          <span className="text-[10px] font-bold" style={{ color: '#047857', opacity: 1, visibility: 'visible' }}>In Stock</span>
                        )}
                      </div>

                      <h4
                        onClick={() => setSelectedProduct(prod)}
                        className="font-extrabold text-sm sm:text-base leading-snug cursor-pointer line-clamp-2 transition-colors"
                        style={{ color: '#0f172a', opacity: 1, visibility: 'visible' }}
                      >
                        {prod.name}
                      </h4>

                      {/* Origin tag - fully visible */}
                      {meta.origin && (
                        <div className="pt-0.5">
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                            style={{ color: '#334155', backgroundColor: '#fefce8', borderColor: '#fef08a', opacity: 1, visibility: 'visible' }}
                          >
                            {meta.origin}
                          </span>
                        </div>
                      )}

                      {/* Description - fully visible */}
                      {prod.description && (
                        <p
                          className="text-[11px] line-clamp-2 leading-relaxed pt-0.5 font-medium"
                          style={{ color: '#475569', opacity: 1, visibility: 'visible' }}
                        >
                          {prod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Add to Bag */}
                  <div
                    className="pt-3 mt-2 border-t flex items-center justify-between gap-2"
                    style={{ borderTopColor: '#fef3c7', opacity: 1, visibility: 'visible' }}
                  >
                    <div style={{ opacity: 1, visibility: 'visible' }}>
                      {showPrices ? (
                        <div
                          className="text-sm sm:text-base font-black tabular-nums"
                          style={{ color: '#0f172a', opacity: 1, visibility: 'visible' }}
                        >
                          {formatCurrency(prod.sellingPrice)}
                          <span className="text-[11px] font-medium ml-1" style={{ color: '#64748b', opacity: 1, visibility: 'visible' }}>
                            /{prod.unit || 'kg'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: '#334155', opacity: 1, visibility: 'visible' }}>
                          per {prod.unit || 'kg'}
                        </span>
                      )}
                    </div>

                    {/* Add / Quantity Stepper Button */}
                    {cartQty > 0 ? (
                      <div
                        className="flex items-center space-x-1 rounded-xl p-0.5 shrink-0"
                        style={{ backgroundColor: '#f1f5f9' }}
                      >
                        <button
                          onClick={() => handleUpdateCartQuantity(prod.id, cartQty - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors cursor-pointer"
                          style={{ color: '#334155' }}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className="w-5 text-center font-bold text-xs tabular-nums"
                          style={{ color: '#0f172a' }}
                        >
                          {cartQty}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateCartQuantity(
                              prod.id,
                              Math.min(prod.stock, cartQty + 1)
                            )
                          }
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors cursor-pointer"
                          style={{ color: '#334155' }}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(prod, 1)}
                        disabled={isOutOfStock}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: isOutOfStock
                            ? '#f1f5f9'
                            : recentlyAddedId === prod.id
                            ? '#047857'
                            : '#059669',
                          color: isOutOfStock ? '#94a3b8' : '#ffffff',
                        }}
                      >
                        {recentlyAddedId === prod.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className={`relative min-h-screen w-full max-w-full text-slate-900 flex flex-col overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white bg-transparent`}>
      {/* Living animated backdrop with subtle gradient orbs & dot grid */}
      <LivingBackground />
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (Clean bright solid theme, no scrollbar, no admin login) */}
      {/* ========================================================= */}
      
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl lg:hidden flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Brand Header with Secret 4-Click Admin Trigger */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div
                id="drawer-brand-admin-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  handleSecretAdminTrigger();
                }}
                className="flex items-center space-x-2.5 group select-none cursor-pointer"
                title="Top Fruit & Veg"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center text-white shadow-2xs">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
                    Top Fruit & Veg
                  </h1>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer border border-slate-200"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Navigation Links in Mobile Drawer */}
            <nav className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-0.5">
                Navigation
              </div>

              {/* Link 1: Home */}
              <a
                href="#/home"
                id="customer-nav-landing"
                onClick={(e) => handleNavClick(e, '#/home')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Home className={`w-4 h-4 ${currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Home</span>
                </div>
              </a>

              {/* Link 2: Products */}
              <a
                href="#/products"
                id="customer-nav-home"
                onClick={(e) => handleNavClick(e, '#/products')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShoppingBag className={`w-4 h-4 ${currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Products</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 font-bold'}`}>
                  {products.length}
                </span>
              </a>

              {/* Link 3: Track Order */}
              <a
                href="#/track-order"
                id="customer-nav-track"
                onClick={(e) => handleNavClick(e, '#/track-order')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isTrackerModalOpen
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Truck className={`w-4 h-4 ${isTrackerModalOpen ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Track Order</span>
                </div>
              </a>

              {/* Link 4: About Us */}
              <a
                href="#/about-us"
                id="customer-nav-about-contact"
                onClick={(e) => handleNavClick(e, '#/about-us')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MapPin className={`w-4 h-4 ${currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-white' : 'text-emerald-600'}`} />
                  <span>About Us</span>
                </div>
              </a>

              {/* Link 5: Feedback */}
              <a
                href="#/feedback"
                id="customer-nav-feedback"
                onClick={(e) => handleNavClick(e, '#/feedback')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isFeedbackModalOpen
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className={`w-4 h-4 ${isFeedbackModalOpen ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Feedback</span>
                </div>
              </a>
            </nav>
          </div>

          <div className="space-y-2">
            {/* Quick Market Phone & Hours */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Brixton Market</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Open Daily</span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-slate-700 pt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href="tel:+447449338679" className="text-emerald-700 font-semibold hover:underline transition-colors">
                  +44 7449 338679
                </a>
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Share */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://wa.me/447449338679?text=Hello%20Top%20Fruits%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20a%20pre-order."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400">
          <span>Brixton Market Stall</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (CLEAN FULL WIDTH TOP-HEADER LAYOUT) */}
      {/* ========================================================= */}
      <div className="relative z-10 flex-1 min-w-0 w-full flex flex-col min-h-screen bg-transparent" style={{ position: 'relative', zIndex: 10 }}>
        {/* ========================================================= */}
        {/* FULL-WIDTH STICKY HEADER (AT THE VERY TOP OF THE WEBSITE) */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4 sm:gap-6">
            {/* Logo & Mobile Menu Toggle */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
                title="Open Navigation Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div
                id="header-brand-admin-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  handleSecretAdminTrigger();
                }}
                className="flex items-center space-x-2.5 cursor-pointer select-none"
                title="Top Fruit & Veg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                    Top Fruit &amp; Veg
                  </h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links: Clean Typography */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
              <a
                href="#/home"
                id="header-nav-home"
                onClick={(e) => handleNavClick(e, '#/home')}
                className={`py-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors rounded-md ${
                  currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </a>

              <a
                href="#/products"
                id="header-nav-products"
                onClick={(e) => handleNavClick(e, '#/products')}
                className={`py-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors rounded-md ${
                  currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Products
              </a>

              <a
                href="#/track-order"
                id="header-btn-track"
                onClick={(e) => handleNavClick(e, '#/track-order')}
                className={`py-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors rounded-md ${
                  isTrackerModalOpen
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Track Order
              </a>

              <a
                href="#/about-us"
                id="header-nav-about"
                onClick={(e) => handleNavClick(e, '#/about-us')}
                className={`py-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors rounded-md ${
                  currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                About Us
              </a>

              <a
                href="#/feedback"
                id="header-btn-feedback"
                onClick={(e) => handleNavClick(e, '#/feedback')}
                className={`py-1.5 px-2.5 text-xs font-medium cursor-pointer transition-colors rounded-md ${
                  isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Feedback
              </a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Dynamic Real-Time Network & Offline Sync Status Indicator */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={async () => {
                    if (isOnline) {
                      await refreshCloudData();
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/90'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                  }`}
                  aria-label={isOnline ? 'Online - Cloud Synced' : 'Offline Mode - Orders Queued for Sync'}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    {isOnline ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    )}
                  </span>
                  {isOnline ? (
                    <div className="flex items-center space-x-1">
                      <Wifi className="w-3 h-3 text-emerald-700" />
                      <span className="hidden sm:inline">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <WifiOff className="w-3 h-3 text-amber-700" />
                      <span>Offline</span>
                      {queuedOrdersCount > 0 ? (
                        <span className="bg-amber-200 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                          {queuedOrdersCount} queued
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 ml-0.5 hidden md:inline">
                          (queue active)
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Hover / Focus Details Popover */}
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-72 p-3 bg-white border border-slate-200 rounded-xl shadow-xl text-left text-xs">
                  {isOnline ? (
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Brixton Cloud Live</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Connected</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                        Live connection active. Produce stock and new customer orders are synchronized instantly with Pitch 18 Brixton Market.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="font-bold text-amber-900 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                          <span>Offline Mode Active</span>
                        </div>
                        <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">Local Cache</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        No internet connection detected. You can safely build your basket and place orders! Orders will be preserved on your device and queued for automatic sync the moment connection returns.
                      </p>
                      {queuedOrdersCount > 0 && (
                        <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[11px] font-bold text-amber-900">
                          <span>Orders Queued for Sync:</span>
                          <span className="bg-amber-200 px-2 py-0.5 rounded-full">{queuedOrdersCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <a
                href="https://wa.me/447449338679?text=Hello%20Top%20Fruit%20and%20Veg!%20I%20would%20like%20to%20place%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-medium transition-colors"
                title="WhatsApp stall"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp</span>
              </a>

              <button
                id="header-btn-orders"
                onClick={() => setIsCartOpen(true)}
                className="relative py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                title="View basket"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Basket</span>
                {totalCartCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-semibold tabular-nums">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Offline Queued Orders Notice Banner */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold shadow-xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 min-w-0">
                <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
                <span className="truncate sm:whitespace-normal">
                  Offline Mode: Grocery orders placed now are stored safely on your device and queued for automatic cloud sync once you're back online.
                </span>
              </div>
              {queuedOrdersCount > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-bold">
                  {queuedOrdersCount} Order{queuedOrdersCount === 1 ? '' : 's'} Queued
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile Horizontal Navigation Bar */}
        <nav className="md:hidden w-full bg-white border-b border-slate-200 px-4 py-2.5 flex items-center space-x-4 overflow-x-auto scrollbar-none text-xs font-medium">
          <a
            href="#/home"
            id="mobile-nav-home"
            onClick={(e) => handleNavClick(e, '#/home')}
            className={`shrink-0 transition-colors ${
              currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </a>
          <a
            href="#/products"
            id="mobile-nav-products"
            onClick={(e) => handleNavClick(e, '#/products')}
            className={`shrink-0 transition-colors ${
              currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products
          </a>
          <a
            href="#/track-order"
            id="mobile-nav-track"
            onClick={(e) => handleNavClick(e, '#/track-order')}
            className={`shrink-0 transition-colors ${
              isTrackerModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Order
          </a>
          <a
            href="#/about-us"
            id="mobile-nav-about"
            onClick={(e) => handleNavClick(e, '#/about-us')}
            className={`shrink-0 transition-colors ${
              currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About Us
          </a>
          <a
            href="#/feedback"
            id="mobile-nav-feedback"
            onClick={(e) => handleNavClick(e, '#/feedback')}
            className={`shrink-0 transition-colors ${
              isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feedback
          </a>
        </nav>

        {/* ========================================================= */}
        {/* VIEW 0: LANDING PAGE */}
        {/* ========================================================= */}
        {currentTab === 'landing' && (
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Hero Banner with Complete Market Information */}
            <section
              className="rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs"
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #fde68a',
                boxShadow: '0 4px 16px -2px rgba(245, 158, 11, 0.06)',
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Store className="w-3.5 h-3.5 text-emerald-700" />
                      Brixton Market
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Open Today · 8am – 6:30pm
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Top Fruit &amp; Vegetables — Brixton Market
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
                    Your trusted neighborhood market stall for authentic fresh tropical fruits, sweet ripe plantains, Jamaican yams, African cassava, fiery scotch bonnet chillies, and daily British garden produce. Hand-selected daily from New Covent Garden Market and direct overseas growers.
                  </p>

                  {/* Clean Single Primary Action Button */}
                  <div className="pt-1">
                    <a
                      href="#/products"
                      id="hero-cta-browse-products"
                      onClick={(e) => handleNavClick(e, '#/products')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Online Now</span>
                    </a>
                  </div>
                </div>

                {/* Compact Minimal Store Contact & QR Code Section: QR on Left, Text on Right */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
                  <StoreContactQrCard className="w-full max-w-sm" />
                </div>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Brixton Delivery &amp; Pickup</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Collect in 15 mins or same-day local drop-off.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Fresh Tropical Imports</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Top-grade plantains, yams, and mangoes sourced daily.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Brixton Market Hours</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mon–Sat: 8am–6:30pm | Sun: 9am–4pm</p>
                  </div>
                </div>
              </div>
            </section>

            {/* DIRECT PRODUCE CATALOG ON LANDING */}
            <section id="market-produce" className="w-full space-y-4 pt-2">
              {renderProduceCatalogContent()}
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: PRODUCE CATALOG (DEDICATED FULL VIEW) */}
        {/* ========================================================= */}
        {currentTab === 'home' && (
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="pb-3 border-b border-amber-200/60">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Products
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Fresh market produce available today
              </p>
            </div>

            {renderProduceCatalogContent()}
          </main>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ABOUT US & CONTACTS (Compact 2-Column Layout, No Scroll) */}
        {/* ========================================================= */}
        {currentTab === 'about_contact' && (
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Stall Profile & Details */}
              <section className="lg:col-span-6 bg-white border border-emerald-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-extrabold">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Brixton Market Stall</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Top Fruit and Veg
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Brixton's trusted family produce stall. We supply fresh seasonal tropical fruits, root vegetables, yams, plantains, scotch bonnets, and seasonings daily.
                  </p>
                </div>

                {/* 4 Compact Detail Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Stall Location</span>
                      <span className="text-slate-600 text-[11px]">Brixton Market, London</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Phone Hotline</span>
                      <a href="tel:+447449338679" className="text-emerald-700 font-extrabold hover:underline text-[11px]">
                        +44 7449 338679
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Opening Hours</span>
                      <span className="text-slate-600 text-[11px]">Mon–Sat: 8am–6:30pm | Sun: 9am–5pm</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Produce In Stock</span>
                      <span className="text-emerald-700 font-bold text-[11px]">{products.length} Fresh Varieties</span>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Callout */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block">Click & Collect via WhatsApp</span>
                    <span className="text-[11px] text-slate-600 block">Pre-order bags or wholesale boxes for fast pickup</span>
                  </div>
                  <a
                    href="https://wa.me/447449338679?text=Hello%20Top%20Fruit%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20an%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </section>

              {/* Right Column: Direct Message Form */}
              <section className="lg:col-span-6 bg-white border border-emerald-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">Send Stall Message</h3>
                  <p className="text-xs text-slate-500">
                    Have questions about seasonal fruit availability or bulk wholesale crates?
                  </p>
                </div>

                {contactSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Message received! We will contact you shortly.</span>
                  </div>
                )}

                {contactError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {/* Honeypot Bot Trap Field */}
                  <div className="hidden" aria-hidden="true" style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}>
                    <label htmlFor="website_hp_sidebar">Website</label>
                    <input
                      id="website_hp_sidebar"
                      type="text"
                      name="_website_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={contactForm._website_hp}
                      onChange={(e) => setContactForm({ ...contactForm, _website_hp: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        onBlur={() => {
                          if (window.innerWidth < 768) {
                            window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                          }
                        }}
                        placeholder="e.g. Samuel Ade"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email / Phone *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        onBlur={() => {
                          if (window.innerWidth < 768) {
                            window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                          }
                        }}
                        placeholder="email@example.com or phone"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Product Availability">Product / Seasonal Fruit Availability</option>
                      <option value="Wholesale Crates">Wholesale / Bulk Crate Inquiries</option>
                      <option value="Click and Collect">Click & Collect Pickup</option>
                      <option value="General Question">General Stall Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Message *</label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      onBlur={() => {
                        if (window.innerWidth < 768) {
                          window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                        }
                      }}
                      placeholder="Let us know what produce or quantities you need..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </main>
        )}

        {/* Comprehensive Storefront Footer */}
        {/* Clean Minimal Storefront Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Col 1 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-700 flex items-center justify-center text-white">
                    <Leaf className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                    Top Fruit &amp; Veg
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Family-run produce stall at Brixton Market. Fresh seasonal tropical fruits, root vegetables, yams, and market greens.
                </p>
              </div>

              {/* Col 2 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Navigation
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li>
                    <a
                      href="#/home"
                      id="footer-nav-home"
                      onClick={(e) => handleNavClick(e, '#/home')}
                      className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/products"
                      id="footer-nav-products"
                      onClick={(e) => handleNavClick(e, '#/products')}
                      className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Produce Catalog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/track-order"
                      id="footer-nav-track"
                      onClick={(e) => handleNavClick(e, '#/track-order')}
                      className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Track Order
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/about-us"
                      id="footer-nav-about"
                      onClick={(e) => handleNavClick(e, '#/about-us')}
                      className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      About &amp; Location
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Hours &amp; Location
                </h4>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Brixton Market, London</p>
                  <p>Mon–Sat: 8:00 AM – 6:30 PM</p>
                  <p>Sunday: 9:00 AM – 4:00 PM</p>
                </div>
              </div>

              {/* Col 4 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Contact
                </h4>
                <p className="text-xs text-slate-500">
                  Direct inquiries and pre-orders:
                </p>
                <div className="pt-1 flex flex-col gap-1.5 text-xs">
                  <a
                    href="https://wa.me/447449338679"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Order Hotline</span>
                  </a>
                  <a
                    href="tel:+447449338679"
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+44 7449 338679</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <span>© {new Date().getFullYear()} Top Fruit &amp; Veg Ltd · Brixton Market</span>
              <span>Fresh produce updated daily</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Clean Minimal Floating Basket Indicator */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-5 inset-x-0 mx-auto w-fit z-40 px-3">
          <div className="bg-slate-900 text-white shadow-md rounded-xl px-4 py-2 flex items-center gap-3">
            <span className="text-xs font-medium tabular-nums">
              {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in basket
            </span>
            <span className="text-slate-500">·</span>
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              View Basket →
            </button>
          </div>
        </div>
      )}


      {/* Dynamic Toast Feedback for Basket Actions */}
      {cartToastMessage && (
        <div className="fixed bottom-16 right-4 sm:right-6 z-50 animate-toast-enter flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-semibold shadow-xl shadow-slate-900/20 backdrop-blur-md border border-slate-700/60">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" />
          </div>
          <span>{cartToastMessage}</span>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-1 text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer text-[11px]"
          >
            View Bag
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODALS & DRAWERS */}
      {/* ========================================================= */}

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          if (window.location.hash === '#/feedback' || window.location.hash === '#feedback') {
            const fallbackHash = currentTab === 'landing' ? '#/home' : currentTab === 'home' ? '#/products' : '#/about-us';
            window.location.hash = fallbackHash;
          }
        }}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToBag={(prod, qty) => handleAddToCart(prod, qty)}
          currentBagQuantity={
            cartItems.find((item) => item.product.id === selectedProduct.id)?.quantity || 0
          }
        />
      )}

      {/* Shopping Bag / Order List Slide-Over Drawer */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearBag={handleClearBag}
        onTrackOrder={(code) => {
          setPreFilledOrderCode(code);
          setIsTrackerModalOpen(true);
          window.location.hash = '#/track-order';
        }}
      />

      {/* Share QR Code Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Customer Order Tracker Modal */}
      <CustomerOrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => {
          setIsTrackerModalOpen(false);
          if (window.location.hash === '#/track-order' || window.location.hash === '#track-order') {
            const fallbackHash = currentTab === 'landing' ? '#/home' : currentTab === 'home' ? '#/products' : '#/about-us';
            window.location.hash = fallbackHash;
          }
        }}
        initialOrderCode={preFilledOrderCode}
      />
    </div>
  );
};
