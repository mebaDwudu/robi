import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Product,
  CartItem,
  Order,
  Customer,
  Supplier,
  PurchaseOrder,
  StockMovement,
  StoreSettings,
  RegisterShift,
  PaymentMethod,
  StaffMember,
  UserRole,
  Expense,
  AuditLog,
  UserAccount,
  AdminTab,
  CashierTab,
  ActiveTab,
  CustomerFeedback,
  CustomerOnlineOrder,
  DbStatus,
} from '../types/store';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  generateWeekSeedOrders,
  INITIAL_MOVEMENTS,
  INITIAL_SHIFT,
  INITIAL_STAFF,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_CUSTOMER_ORDERS,
  INITIAL_FEEDBACKS,
} from '../data/initialData';
import {
  cleanProduceName,
  normalizeCategory,
  MINIMAL_CATEGORIES,
} from '../utils/produceSanitizer';
import {
  subscribeProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeCategories,
  saveCategoryToFirestore,
  subscribeSettings,
  saveSettingsToFirestore,
  subscribeCustomerOrders,
  saveCustomerOrder,
  updateCustomerOrderStatusInFirestore,
  deleteCustomerOrderFromFirestore,
  subscribeOrders,
  saveOrderInFirestore,
  subscribeFeedbacks,
  saveFeedbackInFirestore,
  updateFeedbackStatusInFirestore,
  deleteFeedbackFromFirestore,
  subscribeCustomers,
  saveCustomerToFirestore,
  subscribeSuppliers,
  saveSupplierToFirestore,
  subscribePurchaseOrders,
  savePurchaseOrderToFirestore,
  subscribeStockMovements,
  saveStockMovementToFirestore,
  subscribeStaff,
  saveStaffToFirestore,
  checkAndSeedFirestore,
  resetFirestoreWithData,
  fetchCustomerOrdersOnce,
  fetchProductsOnce,
  fetchSettingsOnce,
  fetchFeedbacksOnce,
  fetchOrdersOnce,
  clearAllCloudFinancialData,
  COLLECTIONS,
} from '../services/firestoreService';
import confetti from 'canvas-confetti';

interface StoreContextType {
  // Authentication & Role
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  currentRole: UserRole;
  currentStaff: StaffMember;
  staffMembers: StaffMember[];
  users: UserAccount[];
  switchStaff: (staffId: string) => void;
  loginStaff: (staffId: string, pin?: string) => { success: boolean; error?: string };
  loginWithRoleAndPin: (role: UserRole, pin: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  loginAdminWithPin: (pin: string) => { success: boolean; error?: string };
  verifyAdminPin: (pin: string) => boolean;
  quickLoginStaff: (staffId: string) => void;
  logout: () => void;
  isOnline: boolean;
  setDirectRole: (role: UserRole) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;

  // Dark Mode
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  formatCurrency: (amount: number) => string;

  // Products & Inventory
  products: Product[];
  categories: string[];
  addCategory: (category: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    newStock: number,
    reason: string,
    type?: 'adjustment' | 'restock' | 'damaged'
  ) => void;
  recordDamage: (productId: string, quantity: number) => void;
  recordReturn: (productId: string, quantity: number) => void;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalInventoryValue: number;

  // POS & Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  setCartItemDiscount: (productId: string, discountPercent: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxTotal: number;
  cartGrandTotal: number;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  checkout: (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    notes?: string,
    customDiscountAmount?: number,
    customTaxPercent?: number
  ) => Order | null;

  // Orders & Sales History
  orders: Order[];
  refundOrder: (orderId: string, returnInventory: boolean) => void;
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;
  seedCurrentWeekSales: () => void;

  // Purchases
  purchases: PurchaseOrder[];
  purchaseOrders: PurchaseOrder[];
  addPurchase: (po: Omit<PurchaseOrder, 'id'>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  receivePurchase: (poId: string) => void;
  receivePurchaseOrder: (poId: string) => void;
  cancelPurchase: (poId: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Partial<Customer> & { name: string; phone: string }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'activeOrdersCount'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Shift Management
  currentShift: RegisterShift;
  openShift: (startingCash: number, notes?: string) => void;
  closeShift: (actualCashInDrawer: number, notes?: string) => void;

  // Customer Online Orders
  customerOrders: CustomerOnlineOrder[];
  addCustomerOrder: (
    order: Omit<CustomerOnlineOrder, 'id' | 'createdAt' | 'orderNumber' | 'status'>
  ) => CustomerOnlineOrder;
  updateCustomerOrderStatus: (
    orderId: string,
    status: CustomerOnlineOrder['status'],
    adminNotes?: string,
    delayNotice?: string,
    isDelayed?: boolean
  ) => void;
  deleteCustomerOrder: (orderId: string) => void;

  // Customer Feedback & Reviews
  feedbacks: CustomerFeedback[];
  addFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>) => CustomerFeedback;
  updateFeedbackStatus: (
    feedbackId: string,
    status: CustomerFeedback['status'],
    adminNote?: string
  ) => void;
  deleteFeedback: (feedbackId: string) => void;

  // Portal & App Lifecycle
  activePortal: 'customer' | 'admin' | 'customer-orders' | 'hub';
  setActivePortal: (portal: 'customer' | 'admin' | 'customer-orders' | 'hub') => void;
  isInitializing: boolean;

  // Sound & Notifications
  playOrderNotificationSound: (force?: boolean) => void;

  // Cloud & Sync
  dbStatus: DbStatus;
  isCloudConnected: boolean;
  lastSyncedAt: string | null;
  refreshCloudData: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  logActivity: (action: string, details: string) => void;

  // Stock Movements
  stockMovements: StockMovement[];

  // Utilities
  clearAllSalesAndTransactions: () => void;
  resetToDefaultData: () => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => void;
  exportDataJSON: () => void;
  backupDatabase: () => void;
  restoreDatabase: (jsonContent: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'topfruit_store_settings_v7',
  PRODUCTS: 'topfruit_products_v8',
  CATEGORIES: 'topfruit_categories_v7',
  ORDERS: 'topfruit_orders_v7',
  CUSTOMERS: 'topfruit_customers_v7',
  SUPPLIERS: 'topfruit_suppliers_v7',
  PURCHASES: 'topfruit_purchases_v7',
  EXPENSES: 'topfruit_expenses_v7',
  AUDIT_LOGS: 'topfruit_audit_logs_v7',
  USERS: 'topfruit_users_v7',
  STAFF: 'topfruit_staff_v7',
  CURRENT_STAFF_ID: 'topfruit_current_staff_id_v7',
  CURRENT_ROLE: 'topfruit_current_role_v7',
  IS_AUTHENTICATED: 'topfruit_is_authenticated_v7',
  DARK_MODE: 'topfruit_dark_mode_v7',
  CUSTOMER_ORDERS: 'topfruit_customer_orders_v7',
  FEEDBACKS: 'topfruit_feedbacks_v7',
  CURRENT_SHIFT: 'topfruit_current_shift_v7',
  STOCK_MOVEMENTS: 'topfruit_stock_movements_v7',
};

// In-memory storage fallback for privacy-restricted browser environments (e.g. iframes/partitioned cookies)
const memoryStorage = new Map<string, string>();
const memorySession = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStorage.set(key, value);
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    memoryStorage.delete(key);
  }
}

function safeGetSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return memorySession.get(key) ?? null;
  }
}

function safeSetSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    memorySession.set(key, value);
  }
}

function safeRemoveSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    memorySession.delete(key);
  }
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = safeGetItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    safeSetItem(key, JSON.stringify(data));
  } catch {
    // Fail gracefully without console noise
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role & Auth State - default to unauthenticated so PIN is required when opening Admin
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    try {
      const sessionAuth = safeGetSession('topfruit_admin_session_auth');
      return sessionAuth === 'true';
    } catch {
      return false;
    }
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      const sessionAuth = safeGetSession('topfruit_admin_session_auth');
      if (sessionAuth === 'true') {
        const savedRole = safeGetSession('topfruit_current_role');
        if (savedRole === 'admin' || savedRole === 'cashier') return savedRole as UserRole;
      }
    } catch {
      // ignore
    }
    return 'customer';
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    loadStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF)
  );

  const [currentStaffId, setCurrentStaffId] = useState<string>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_STAFF_ID, INITIAL_STAFF[0].id)
  );

  const [users, setUsers] = useState<UserAccount[]>(() =>
    loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() =>
    loadStorage(STORAGE_KEYS.DARK_MODE, false)
  );

  // Settings & Core Data
  const [settings, setSettings] = useState<StoreSettings>(() =>
    loadStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = loadStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const raw: Product[] = Array.isArray(saved) && saved.length > 0 ? saved : INITIAL_PRODUCTS;
    return raw.map((p) => ({
      ...p,
      name: cleanProduceName(p.name),
      category: normalizeCategory(p.category),
    }));
  });

  const [categories, setCategories] = useState<string[]>(() => [...MINIMAL_CATEGORIES]);

  const [orders, setOrders] = useState<Order[]>(() =>
    loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  );

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    loadStorage(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_MOVEMENTS)
  );

  const [customerOrders, setCustomerOrders] = useState<CustomerOnlineOrder[]>(() =>
    loadStorage(STORAGE_KEYS.CUSTOMER_ORDERS, INITIAL_CUSTOMER_ORDERS)
  );

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() =>
    loadStorage(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
  );

  // One-time initialization to guarantee zero revenue starting point for client
  useEffect(() => {
    try {
      const isCleaned = localStorage.getItem('topfruit_zero_revenue_clean_v3');
      if (isCleaned !== 'true') {
        localStorage.setItem('topfruit_zero_revenue_clean_v3', 'true');
        // Clear all previous version order caches
        localStorage.removeItem('topfruit_orders_v5');
        localStorage.removeItem('topfruit_orders_v6');
        localStorage.removeItem('topfruit_customer_orders_v6');
        localStorage.removeItem('topfruit_expenses_v6');
        localStorage.removeItem('topfruit_purchases_v6');
        localStorage.removeItem('topfruit_orders_v7');
        localStorage.removeItem('topfruit_customer_orders_v7');
        localStorage.removeItem('topfruit_expenses_v7');
        localStorage.removeItem('topfruit_purchases_v7');

        // Reset state
        setOrders([]);
        setCustomerOrders([]);
        setExpenses([]);
        setPurchases([]);
        setCart([]);

        // Purge cloud orders in Firestore so remote listener doesn't repopulate
        clearAllCloudFinancialData().catch((e) => console.warn('[Firestore] Zero-revenue purge notice:', e));
      }
    } catch {
      // ignore
    }
  }, []);

  // POS Active Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Portal & App Lifecycle
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activePortal, setActivePortalState] = useState<'customer' | 'admin' | 'customer-orders' | 'hub'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const hash = (window.location.hash || '').toLowerCase();
        const path = (window.location.pathname || '').toLowerCase();
        if (hash.includes('admin/orders') || hash.includes('customer-orders') || path.includes('orders')) return 'customer-orders';
        if (hash.includes('admin') || path.includes('admin')) return 'admin';
        if (hash.includes('hub') || path.includes('hub')) return 'hub';
      }
    } catch {}
    return 'customer';
  });

  const activePortalRef = useRef<'customer' | 'admin' | 'customer-orders' | 'hub'>(activePortal);
  useEffect(() => {
    activePortalRef.current = activePortal;
  }, [activePortal]);

  const setActivePortal = useCallback((portal: 'customer' | 'admin' | 'customer-orders' | 'hub') => {
    setActivePortalState(portal);
    activePortalRef.current = portal;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Audio effects & notification sound control
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const currentRoleRef = useRef<UserRole>(currentRole);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    currentRoleRef.current = currentRole;
  }, [currentRole]);

  // Check if current user is logged in as Admin or Cashier
  const isUserAdminLoggedIn = (): boolean => {
    return (
      isAuthenticatedRef.current &&
      (currentRoleRef.current === 'admin' || currentRoleRef.current === 'cashier')
    );
  };

  // Strict check: notification sound MUST be heard ONLY for the admin!
  // It must be completely silent for customers, in the customer storefront, or when logged out.
  const isUserInAdminPortal = (): boolean => {
    // 1. Must be logged in as admin or cashier
    if (!isAuthenticatedRef.current) return false;
    if (currentRoleRef.current !== 'admin' && currentRoleRef.current !== 'cashier') return false;

    // 2. Active portal must be admin or customer-orders (admin orders page)
    const portal = activePortalRef.current;
    if (portal !== 'admin' && portal !== 'customer-orders') {
      return false;
    }

    // 3. Double-check browser URL/hash to ensure not in customer storefront
    try {
      if (typeof window !== 'undefined') {
        const hash = (window.location.hash || '').toLowerCase();
        const path = (window.location.pathname || '').toLowerCase();
        if (
          hash.includes('customer') ||
          hash.includes('storefront') ||
          hash.includes('market') ||
          hash.includes('products') ||
          hash.includes('track') ||
          hash.includes('about') ||
          path.includes('customer') ||
          path.includes('market')
        ) {
          return false;
        }
      }
    } catch {
      // Safe fallback
    }

    return true;
  };

  // Standard sound effect (SILENT if in customer storefront or without admin login)
  const playBeep = (
    freq = 880,
    type: OscillatorType = 'sine',
    duration = 0.1,
    volume = 0.12,
    adminOnly = true
  ) => {
    // Requirement: in the customer storefront or not logged in to admin, notification sound must be silent!
    if (adminOnly && !isUserInAdminPortal()) {
      return;
    }
    if (!settings.enableSoundEffects) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioCtx === 'function') {
          try {
            audioCtxRef.current = new AudioCtx();
          } catch {
            audioCtxRef.current = null;
          }
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio failure safely
    }
  };

  // Loudable real-time order arrival chime
  // Requirement: when peoples order the notification must be heard ONLY for the admin!
  // Silent in customer storefront, silent for customers placing orders, silent if logged out.
  const playOrderNotificationSound = (force = false) => {
    const isAdminInPortal = isUserInAdminPortal();
    if (!isAdminInPortal && !force) {
      // Completely silent for customer!
      return;
    }
    if (!settings.enableSoundEffects) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioCtx === 'function') {
          try {
            audioCtxRef.current = new AudioCtx();
          } catch {
            audioCtxRef.current = null;
          }
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // High-clarity loudable 3-tone retail alert chime (D5 -> A5 -> D6)
      const chimeNotes = [
        { freq: 587.33, start: 0, duration: 0.16, vol: 0.35 },    // D5
        { freq: 880.00, start: 0.14, duration: 0.20, vol: 0.40 },  // A5
        { freq: 1174.66, start: 0.32, duration: 0.45, vol: 0.48 }, // D6
      ];

      chimeNotes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; // triangle provides clear, audible harmonics
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0.001, now + note.start);
        gain.gain.linearRampToValueAtTime(note.vol, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.05);
      });
    } catch {
      // Ignore audio failure safely
    }
  };

  // Sync state to local storage
  useEffect(() => saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, isAuthenticated), [isAuthenticated]);
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_ROLE, currentRole), [currentRole]);
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_STAFF_ID, currentStaffId), [currentStaffId]);
  useEffect(() => saveStorage(STORAGE_KEYS.STAFF, staffMembers), [staffMembers]);
  useEffect(() => saveStorage(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => saveStorage(STORAGE_KEYS.DARK_MODE, isDarkMode), [isDarkMode]);
  useEffect(() => saveStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveStorage(STORAGE_KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveStorage(STORAGE_KEYS.ORDERS, orders), [orders]);
  useEffect(() => saveStorage(STORAGE_KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => saveStorage(STORAGE_KEYS.SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => saveStorage(STORAGE_KEYS.PURCHASES, purchases), [purchases]);
  useEffect(() => saveStorage(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs), [auditLogs]);
  useEffect(() => saveStorage(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements), [stockMovements]);
  useEffect(() => saveStorage(STORAGE_KEYS.CUSTOMER_ORDERS, customerOrders), [customerOrders]);
  useEffect(() => saveStorage(STORAGE_KEYS.FEEDBACKS, feedbacks), [feedbacks]);

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [currentShift, setCurrentShift] = useState<RegisterShift>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_SHIFT, INITIAL_SHIFT)
  );
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_SHIFT, currentShift), [currentShift]);

  const [dbStatus, setDbStatus] = useState<DbStatus>('online');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date().toLocaleTimeString());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Firestore Subscriptions & Initial Cloud Sync
  useEffect(() => {
    // Check and seed initial store data if database is brand new
    checkAndSeedFirestore({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      orders: INITIAL_ORDERS,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      purchaseOrders: INITIAL_PURCHASES,
      movements: INITIAL_MOVEMENTS,
      settings: INITIAL_SETTINGS,
      shift: INITIAL_SHIFT,
      staff: INITIAL_STAFF,
    }).catch((err) => {
      console.warn('[Firestore] Seed check notice:', err);
    });

    // 1. Products (Instant price, stock, and catalog updates across all devices)
    const unsubProducts = subscribeProducts(
      (remoteProducts) => {
        if (remoteProducts && remoteProducts.length > 0) {
          const cleaned = remoteProducts.map((p) => ({
            ...p,
            name: cleanProduceName(p.name),
            category: normalizeCategory(p.category),
          }));
          setProducts(cleaned);
          setLastSyncedAt(new Date().toLocaleTimeString());
          setDbStatus('online');
          setIsCloudConnected(true);
        }
      },
      (err) => {
        console.warn('[Firestore] Products sync warning:', err);
        setDbStatus('local');
      }
    );

    // 2. Categories (Enforce minimalist 5 categories)
    const unsubCategories = subscribeCategories(
      () => {
        setCategories([...MINIMAL_CATEGORIES]);
      },
      (err) => {
        console.warn('[Firestore] Categories sync warning:', err);
      }
    );

    // 3. Settings
    const unsubSettings = subscribeSettings(
      (remoteSettings) => {
        if (remoteSettings && remoteSettings.storeName) {
          setSettings((prev) => ({ ...prev, ...remoteSettings }));
        }
      },
      (err) => {
        console.warn('[Firestore] Settings sync warning:', err);
      }
    );

    // 4. Customer Online Orders (Cross-device real-time sync)
    let previousOrdersCount = -1;
    const unsubCustomerOrders = subscribeCustomerOrders(
      (remoteOrders) => {
        if (remoteOrders && remoteOrders.length >= 0) {
          if (previousOrdersCount !== -1 && remoteOrders.length > previousOrdersCount) {
            // A new order arrived in real-time!
            // Silent if customer has not logged in; loudable only when admin is logged in!
            playOrderNotificationSound();
          }
          previousOrdersCount = remoteOrders.length;
          setCustomerOrders(remoteOrders);
          setLastSyncedAt(new Date().toLocaleTimeString());
          setDbStatus('online');
          setIsCloudConnected(true);
        }
      },
      (err) => {
        console.warn('[Firestore] Customer orders sync warning:', err);
        setDbStatus('local');
      }
    );

    // 5. POS Orders (Sales ledger)
    const unsubOrders = subscribeOrders(
      (remoteOrders) => {
        if (remoteOrders && remoteOrders.length >= 0) {
          setOrders(remoteOrders);
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      },
      (err) => {
        console.warn('[Firestore] POS orders sync warning:', err);
      }
    );

    // 6. Customer Feedbacks
    const unsubFeedbacks = subscribeFeedbacks(
      (remoteFeedbacks) => {
        if (remoteFeedbacks && remoteFeedbacks.length >= 0) {
          setFeedbacks(remoteFeedbacks);
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      },
      (err) => {
        console.warn('[Firestore] Feedbacks sync warning:', err);
      }
    );

    // 7. Customers
    const unsubCustomers = subscribeCustomers(
      (remoteCusts) => {
        if (remoteCusts && remoteCusts.length > 0) {
          setCustomers(remoteCusts);
        }
      },
      (err) => {
        console.warn('[Firestore] Customers sync warning:', err);
      }
    );

    // 8. Suppliers
    const unsubSuppliers = subscribeSuppliers(
      (remoteSups) => {
        if (remoteSups && remoteSups.length > 0) {
          setSuppliers(remoteSups);
        }
      },
      (err) => {
        console.warn('[Firestore] Suppliers sync warning:', err);
      }
    );

    // 9. Staff
    const unsubStaff = subscribeStaff(
      (remoteStaff) => {
        if (remoteStaff && remoteStaff.length > 0) {
          setStaffMembers(remoteStaff);
        }
      },
      (err) => {
        console.warn('[Firestore] Staff sync warning:', err);
      }
    );

    // Auto-refresh when tab is focused or becomes visible
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchCustomerOrdersOnce()
          .then((orders) => {
            if (orders && orders.length >= 0) {
              setCustomerOrders(orders);
              setLastSyncedAt(new Date().toLocaleTimeString());
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
      unsubCustomerOrders();
      unsubOrders();
      unsubFeedbacks();
      unsubCustomers();
      unsubSuppliers();
      unsubStaff();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  // Current active staff object
  const currentStaff =
    staffMembers.find((s) => s.id === currentStaffId) ||
    staffMembers[0] || {
      id: 'default-admin',
      name: 'Admin User',
      role: currentRole,
      pin: '1234',
      active: true,
    };

  const setIsAuthenticated = (auth: boolean) => {
    setIsAuthenticatedState(auth);
    isAuthenticatedRef.current = auth;
    if (auth) {
      try {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  };

  const setDirectRole = (role: UserRole) => {
    setCurrentRoleState(role);
    currentRoleRef.current = role;
    const matchingStaff = staffMembers.find((s) => s.role === role);
    if (matchingStaff) {
      setCurrentStaffId(matchingStaff.id);
    }
  };

  const logActivity = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: currentStaff.name || (currentRole === 'admin' ? 'Admin User' : 'Cashier User'),
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const verifyAdminPin = (pin: string): boolean => {
    const cleanPin = pin.trim();
    return cleanPin === '091825';
  };

  const loginAdminWithPin = (pin: string): { success: boolean; error?: string } => {
    const cleanPin = pin.trim();
    if (verifyAdminPin(cleanPin)) {
      const boss = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(boss.id);
      setCurrentRoleState('admin');
      currentRoleRef.current = 'admin';
      setIsAuthenticatedState(true);
      isAuthenticatedRef.current = true;
      setIsLocked(false);
      try {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', 'admin');
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'admin');
      logActivity('Login', 'Administrator authenticated via PIN');
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN. Please try again.' };
  };

  const loginWithPin = (pin: string): { success: boolean; error?: string } => {
    const staff = staffMembers.find((s) => s.pin === pin && s.active);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', staff.role);
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, staff.role);
      logActivity('Login', `${staff.name} signed in (${staff.role.toUpperCase()})`);
      return { success: true };
    }

    if (
      pin === '091825' ||
      pin === settings.adminPin ||
      pin === settings.bossPin
    ) {
      const boss = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(boss.id);
      setCurrentRoleState('admin');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', 'admin');
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'admin');
      logActivity('Login', 'Boss signed in via master PIN');
      return { success: true };
    }

    if (pin === '1111' || pin === '2222' || pin === settings.cashierPin) {
      const cashier = staffMembers.find((s) => s.role === 'cashier') || staffMembers[1] || staffMembers[0];
      setCurrentStaffId(cashier.id);
      setCurrentRoleState('cashier');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', 'cashier');
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'cashier');
      logActivity('Login', `${cashier.name} signed in via cashier PIN`);
      return { success: true };
    }

    return { success: false, error: 'Incorrect security PIN code.' };
  };

  const quickLoginStaff = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', staff.role);
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, staff.role);
      logActivity('Quick Login', `${staff.name} signed in`);
    }
  };

  const loginStaff = (staffId: string, pin?: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (!staff) {
      return { success: false, error: 'Staff profile not found.' };
    }
    if (pin) {
      const isMasterAdminMatch =
        staff.role === 'admin' &&
        (pin === '091825' ||
          pin === settings.adminPin ||
          pin === settings.bossPin);
      if (staff.pin !== pin && !isMasterAdminMatch) {
        return { success: false, error: 'Incorrect security PIN.' };
      }
    }
    setCurrentStaffId(staff.id);
    setCurrentRoleState(staff.role);
    setIsAuthenticatedState(true);
    setIsLocked(false);
    try {
      sessionStorage.setItem('topfruit_admin_session_auth', 'true');
      sessionStorage.setItem('topfruit_current_role', staff.role);
    } catch {
      // ignore
    }
    saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
    saveStorage(STORAGE_KEYS.CURRENT_ROLE, staff.role);
    logActivity('Login', `${staff.name} logged in (${staff.role.toUpperCase()})`);
    return { success: true };
  };

  const loginWithRoleAndPin = (role: UserRole, pin: string) => {
    const matchingStaff = staffMembers.find((s) => s.role === role && s.pin === pin);
    if (matchingStaff) {
      setCurrentStaffId(matchingStaff.id);
      setCurrentRoleState(matchingStaff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', matchingStaff.role);
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, matchingStaff.role);
      logActivity('Login', `${matchingStaff.name} logged in`);
      return { success: true };
    }

    // Default fallback check
    if (role === 'admin' && (pin === '1234' || pin === settings.adminPin)) {
      const adminStaff = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(adminStaff.id);
      setCurrentRoleState('admin');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', 'admin');
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'admin');
      logActivity('Login', 'Admin User logged in');
      return { success: true };
    }

    if (role === 'cashier' && (pin === '1111' || pin === '2222' || pin === '0000' || pin === settings.cashierPin)) {
      const cashierStaff = staffMembers.find((s) => s.role === 'cashier') || staffMembers[1] || staffMembers[0];
      setCurrentStaffId(cashierStaff.id);
      setCurrentRoleState('cashier');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      try {
        sessionStorage.setItem('topfruit_admin_session_auth', 'true');
        sessionStorage.setItem('topfruit_current_role', 'cashier');
      } catch {
        // ignore
      }
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'cashier');
      logActivity('Login', `${cashierStaff.name} logged in`);
      return { success: true };
    }

    return { success: false, error: 'Invalid PIN entered. Please try again.' };
  };

  const switchStaff = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      logActivity('Switch User', `Switched active terminal profile to ${staff.name}`);
    }
  };

  const logout = () => {
    logActivity('Logout', `${currentStaff.name} logged out`);
    setIsAuthenticatedState(false);
    isAuthenticatedRef.current = false;
    setCurrentRoleState('customer');
    currentRoleRef.current = 'customer';
    try {
      sessionStorage.removeItem('topfruit_admin_session_auth');
      sessionStorage.removeItem('topfruit_current_role');
    } catch {
      // ignore
    }
    saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, false);
    saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'customer');
    setCart([]);
  };

  const addStaffMember = (staff: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...staff,
      id: `staff-${Date.now()}`,
    };
    setStaffMembers((prev) => [...prev, newStaff]);
    logActivity('Staff Added', `Added ${newStaff.name} (${newStaff.role.toUpperCase()})`);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logActivity('Staff Updated', `Updated staff record for ${id}`);
  };

  const deleteStaffMember = (id: string) => {
    const s = staffMembers.find((item) => item.id === id);
    setStaffMembers((prev) => prev.filter((item) => item.id !== id));
    if (s) logActivity('Staff Removed', `Removed ${s.name}`);
  };

  const toggleDarkMode = () => {
    setIsDarkModeState((prev) => !prev);
  };

  const setIsDarkMode = (dark: boolean) => {
    setIsDarkModeState(dark);
  };

  const formatCurrency = (amount: number) => {
    const sym = settings.currencySymbol || '£';
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount < 0 ? '-' : ''}${sym}${formatted}`;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      saveSettingsToFirestore(merged).catch((err) => {
        console.warn('[Firestore] Error saving settings to cloud:', err);
      });
      return merged;
    });
    logActivity('Settings Updated', 'Store configuration updated');
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      saveCategoryToFirestore(trimmed).catch((err) => {
        console.warn('[Firestore] Error saving category to cloud:', err);
      });
      logActivity('Category Added', `Added category ${trimmed}`);
    }
  };

  // Shift Management
  const openShift = (startingCash: number, notes?: string) => {
    const shift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      totalSales: 0,
      expectedCashInDrawer: startingCash,
      cashierName: currentStaff.name,
      isOpen: true,
      notes: notes || undefined,
    };
    setCurrentShift(shift);
    saveStorage('em_current_shift_v2', shift);
    logActivity('Shift Opened', `Opened register shift with ${formatCurrency(startingCash)} starting float`);
  };

  const closeShift = (actualCashInDrawer: number, notes?: string) => {
    const diff = actualCashInDrawer - currentShift.expectedCashInDrawer;
    const closed: RegisterShift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      actualCashInDrawer,
      difference: diff,
      isOpen: false,
      notes,
    };
    setCurrentShift(closed);
    saveStorage('em_current_shift_v2', closed);
    logActivity(
      'Shift Closed',
      `Closed shift. Expected: ${formatCurrency(currentShift.expectedCashInDrawer)}, Actual: ${formatCurrency(actualCashInDrawer)} (Diff: ${formatCurrency(diff)})`
    );
  };

  // Product Operations
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      damaged: prodData.damaged || 0,
      returned: prodData.returned || 0,
    };
    setProducts((prev) => [newProd, ...prev]);

    // Sync to Firestore cloud database
    saveProductToFirestore(newProd).catch((err) => {
      console.error('[Firestore] Error saving new product to cloud:', err);
    });

    logActivity('Product Added', `${newProd.name} (SKU: ${newProd.sku})`);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updatedList = prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const target = updatedList.find((p) => p.id === id);
      if (target) {
        // Sync updated product (e.g. price change, stock change) to Firestore
        saveProductToFirestore(target).catch((err) => {
          console.error('[Firestore] Error updating product in cloud:', err);
        });
      }
      return updatedList;
    });
    logActivity('Product Updated', `Updated details for product ${id}`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));

    // Delete product from Firestore
    deleteProductFromFirestore(id).catch((err) => {
      console.error('[Firestore] Error deleting product from cloud:', err);
    });

    if (target) {
      logActivity('Product Deleted', `Removed ${target.name} (SKU: ${target.sku})`);
    }
  };

  const adjustStock = (
    productId: string,
    newStock: number,
    reason: string,
    type: 'adjustment' | 'restock' | 'damaged' = 'adjustment'
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const change = newStock - prod.stock;
    updateProduct(productId, { stock: newStock });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: prod.name,
      sku: prod.sku,
      type,
      quantityChange: change,
      previousStock: prod.stock,
      newStock,
      note: reason,
      timestamp: new Date().toISOString(),
    };
    setStockMovements((prev) => [movement, ...prev]);
    saveStockMovementToFirestore(movement).catch((err) => {
      console.warn('[Firestore] Error saving stock movement:', err);
    });
    logActivity('Stock Adjusted', `${prod.name}: ${prod.stock} -> ${newStock} (${reason})`);
  };

  const recordDamage = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;
    const newStock = Math.max(0, prod.stock - quantity);
    const newDamaged = (prod.damaged || 0) + quantity;
    updateProduct(productId, { stock: newStock, damaged: newDamaged });
    logActivity('Damage Recorded', `${prod.name}: +${quantity} damaged units recorded`);
  };

  const recordReturn = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;
    const newStock = prod.stock + quantity;
    const newReturned = (prod.returned || 0) + quantity;
    updateProduct(productId, { stock: newStock, returned: newReturned });
    logActivity('Return Recorded', `${prod.name}: +${quantity} returned units restored to stock`);
  };

  const outOfStockProducts = (products || []).filter((p) => p.stock <= 0);
  const lowStockProducts = (products || []).filter(
    (p) => p.stock > 0 && p.stock <= (p.minStockLevel || settings.lowStockThresholdDefault || 10)
  );

  const totalInventoryValue = (products || []).reduce((acc, p) => acc + (p.stock || 0) * (p.sellingPrice || 0), 0);

  // Cart & POS Calculations
  const addToCart = (product: Product, quantity = 1) => {
    playBeep(980, 'sine', 0.08);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const setCartItemDiscount = (productId: string, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discountPercent } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => {
    const unitPrice = item.customPrice ?? item.product.sellingPrice;
    return acc + unitPrice * item.quantity;
  }, 0);

  const cartDiscountTotal = cart.reduce((acc, item) => {
    if (!item.discountPercent) return acc;
    const unitPrice = item.customPrice ?? item.product.sellingPrice;
    const itemTotal = unitPrice * item.quantity;
    return acc + (itemTotal * item.discountPercent) / 100;
  }, 0);

  const cartTaxTotal =
    ((cartSubtotal - cartDiscountTotal) * (settings.taxRatePercent || 0)) / 100;

  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscountTotal + cartTaxTotal);

  const checkout = (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    notes?: string,
    customDiscountAmount = 0,
    customTaxPercent = 0
  ): Order | null => {
    if (cart.length === 0) return null;

    const discountTotal = customDiscountAmount > 0 ? customDiscountAmount : cartDiscountTotal;
    const taxRate = customTaxPercent > 0 ? customTaxPercent : settings.taxRatePercent || 0;
    const taxTotal = ((cartSubtotal - discountTotal) * taxRate) / 100;
    const grandTotal = Math.max(0, cartSubtotal - discountTotal + taxTotal);

    let totalCost = 0;
    const orderItems = cart.map((item) => {
      const unitPrice = item.customPrice ?? item.product.sellingPrice;
      const itemSubtotal = unitPrice * item.quantity;
      const itemDiscount = item.discountPercent ? (itemSubtotal * item.discountPercent) / 100 : 0;
      const totalPrice = itemSubtotal - itemDiscount;
      const itemCost = item.product.costPrice * item.quantity;
      totalCost += itemCost;

      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        quantity: item.quantity,
        costPrice: item.product.costPrice,
        unitPrice,
        totalPrice,
        discountAmount: itemDiscount,
      };
    });

    const tendered = amountTendered !== undefined ? amountTendered : grandTotal;
    const changeGiven = Math.max(0, tendered - grandTotal);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${new Date().getMonth() + 1}${new Date().getDate()}-${String(
        orders.length + 1
      ).padStart(3, '0')}`,
      items: orderItems,
      subtotal: cartSubtotal,
      discountTotal,
      taxTotal,
      taxRate,
      grandTotal,
      totalCost,
      grossProfit: grandTotal - totalCost,
      paymentMethod,
      amountTendered: tendered,
      changeGiven,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in',
      cashierName: currentStaff.name || (currentRole === 'admin' ? 'Admin User' : 'Cashier User'),
      notes,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    // Deduct stock for all items
    cart.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        updateProduct(prod.id, { stock: newStock });

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${item.product.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: prod.stock,
          newStock,
          referenceId: newOrder.id,
          note: `Completed sale to ${newOrder.customerName}`,
          timestamp: new Date().toISOString(),
        };
        setStockMovements((prev) => [movement, ...prev]);
      }
    });

    // Update customer stats if applicable
    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, {
        totalSpent: selectedCustomer.totalSpent + grandTotal,
        totalOrders: selectedCustomer.totalOrders + 1,
        loyaltyPoints: selectedCustomer.loyaltyPoints + Math.floor(grandTotal / 10),
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    logActivity('Sale Created', `${newOrder.customerName} - ${formatCurrency(grandTotal)}`);

    // Sync POS order directly to Firestore
    saveOrderInFirestore(newOrder).catch((err) => {
      console.warn('[Firestore] Failed to save POS order:', err);
    });

    // Audio & visual celebration
    playBeep(1200, 'sine', 0.2);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    clearCart();
    setSelectedCustomer(null);
    return newOrder;
  };

  const refundOrder = (orderId: string, returnInventory: boolean) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
    );

    if (returnInventory) {
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newStock = prod.stock + item.quantity;
          updateProduct(prod.id, { stock: newStock });
        }
      });
    }

    logActivity('Order Refunded', `Refunded ${order.orderNumber} (${formatCurrency(order.grandTotal)})`);
  };

  const seedCurrentWeekSales = () => {
    const newOrders = generateWeekSeedOrders();
    setOrders((prev) => {
      const nonSeed = prev.filter((o) => !o.id.startsWith('ord-seed-'));
      const combined = [...newOrders, ...nonSeed];
      saveStorage(STORAGE_KEYS.ORDERS, combined);
      return combined;
    });
    logActivity('Weekly Demo Seed', 'Populated weekly sales trend data for Admin Overview analytics');
  };

  // Purchases
  const addPurchase = (poData: Omit<PurchaseOrder, 'id'>) => {
    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
    };
    setPurchases((prev) => [newPo, ...prev]);
    savePurchaseOrderToFirestore(newPo).catch((err) => {
      console.warn('[Firestore] Error saving purchase order:', err);
    });
    logActivity('Purchase Order Created', `${newPo.poNumber} for ${newPo.supplierName}`);
  };

  const receivePurchase = (poId: string) => {
    const po = purchases.find((p) => p.id === poId);
    if (!po) return;

    // Add stock for each received product
    po.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        adjustStock(
          prod.id,
          prod.stock + item.quantityOrdered,
          `Received PO ${po.poNumber}`,
          'restock'
        );
      }
    });

    setPurchases((prev) => {
      const updated = prev.map((p) =>
        p.id === poId
          ? { ...p, status: 'received' as const, receivedDate: new Date().toISOString().split('T')[0] }
          : p
      );
      const target = updated.find((p) => p.id === poId);
      if (target) {
        savePurchaseOrderToFirestore(target).catch((err) => {
          console.warn('[Firestore] Error updating purchase order:', err);
        });
      }
      return updated;
    });
    logActivity('Purchase Order Received', `Restocked inventory from ${po.poNumber}`);
  };

  const cancelPurchase = (poId: string) => {
    setPurchases((prev) => {
      const updated = prev.map((p) =>
        p.id === poId ? { ...p, status: 'cancelled' as const } : p
      );
      const target = updated.find((p) => p.id === poId);
      if (target) {
        savePurchaseOrderToFirestore(target).catch((err) => {
          console.warn('[Firestore] Error cancelling purchase order:', err);
        });
      }
      return updated;
    });
    logActivity('Purchase Cancelled', `Cancelled purchase order ${poId}`);
  };

  // Customers
  const addCustomer = (custData: Partial<Customer> & { name: string; phone: string }): Customer => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custData.name,
      phone: custData.phone,
      email: custData.email,
      loyaltyPoints: custData.loyaltyPoints ?? 0,
      totalSpent: custData.totalSpent ?? 0,
      totalOrders: custData.totalOrders ?? 0,
      tier: custData.tier ?? 'Regular',
      creditBalance: custData.creditBalance ?? 0,
      debt: custData.debt ?? 0,
      status: custData.status ?? 'Active',
      notes: custData.notes,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    saveCustomerToFirestore(newCust).catch((err) => {
      console.warn('[Firestore] Error saving customer:', err);
    });
    logActivity('Customer Added', `${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const target = updated.find((c) => c.id === id);
      if (target) {
        saveCustomerToFirestore(target).catch((err) => {
          console.warn('[Firestore] Error updating customer:', err);
        });
      }
      return updated;
    });
  };

  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (cust) logActivity('Customer Deleted', `Removed customer ${cust.name}`);
  };

  // Suppliers
  const addSupplier = (supData: Omit<Supplier, 'id' | 'activeOrdersCount'>): Supplier => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      activeOrdersCount: 0,
      outstandingBalance: supData.outstandingBalance || 0,
      productsCount: supData.productsCount || 0,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    saveSupplierToFirestore(newSup).catch((err) => {
      console.warn('[Firestore] Error saving supplier:', err);
    });
    logActivity('Supplier Added', `${newSup.name}`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const target = updated.find((s) => s.id === id);
      if (target) {
        saveSupplierToFirestore(target).catch((err) => {
          console.warn('[Firestore] Error updating supplier:', err);
        });
      }
      return updated;
    });
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find((s) => s.id === id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    if (sup) logActivity('Supplier Deleted', `Removed supplier ${sup.name}`);
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    logActivity('Expense Added', `${newExp.category}: ${formatCurrency(newExp.amount)}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('Expense Removed', `Removed expense ${id}`);
  };

  // User Accounts
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers((prev) => [newUser, ...prev]);

    // Also sync to staffMembers
    setStaffMembers((prev) => [
      ...prev,
      {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        pin: newUser.pin,
        email: newUser.email,
        phone: newUser.phone,
        active: newUser.status === 'Active',
      },
    ]);

    logActivity('User Created', `Added ${newUser.name} (${newUser.role.toUpperCase()})`);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: updates.name ?? s.name,
              role: updates.role ?? s.role,
              pin: updates.pin ?? s.pin,
              email: updates.email ?? s.email,
              phone: updates.phone ?? s.phone,
              active: updates.status ? updates.status === 'Active' : s.active,
            }
          : s
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    logActivity('User Deleted', `Removed user ${id}`);
  };

  // Customer Online Orders Handlers
  const addCustomerOrder = (
    orderData: Omit<CustomerOnlineOrder, 'id' | 'createdAt' | 'orderNumber' | 'status'>
  ): CustomerOnlineOrder => {
    const existingCodes = new Set(
      customerOrders.map((o) => (o.orderCode || o.orderNumber || '').toUpperCase())
    );

    let orderCode = orderData.orderCode;
    let randomNum = Math.floor(1000 + Math.random() * 9000);

    if (!orderCode) {
      let attempts = 0;
      do {
        randomNum = Math.floor(1000 + Math.random() * 9000);
        orderCode = `FR-${randomNum}`;
        attempts++;
      } while (existingCodes.has(orderCode.toUpperCase()) && attempts < 300);
    }

    const newOrder: CustomerOnlineOrder = {
      ...orderData,
      id: `cust-ord-${Date.now()}-${randomNum}`,
      orderNumber: orderCode.replace('FR-', 'ORD-'),
      orderCode,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic local state update
    setCustomerOrders((prev) => [newOrder, ...prev]);

    // 3rd Requirement: Decrease inventory when peoples start ordering!
    if (newOrder.items && newOrder.items.length > 0) {
      newOrder.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const currentStock = prod.stock || 0;
          const newStock = Math.max(0, currentStock - (item.quantity || 1));
          updateProduct(item.productId, { stock: newStock });

          const movement: StockMovement = {
            id: `mov-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: prod.name,
            sku: prod.sku,
            type: 'sale',
            quantityChange: -(item.quantity || 1),
            previousStock: currentStock,
            newStock,
            note: `Online Order: ${orderCode}`,
            timestamp: new Date().toISOString(),
          };
          setStockMovements((sm) => [movement, ...sm]);
          saveStockMovementToFirestore(movement).catch((err) => {
            console.warn('[Firestore] Error saving stock movement for online order:', err);
          });
        }
      });
    }

    // Save directly to Firestore for real-time cross-device sync!
    saveCustomerOrder(newOrder).catch((err) => {
      console.error('[Firestore] Error writing customer order to cloud:', err);
    });

    logActivity(
      'Customer Order Received',
      `New order ${newOrder.orderCode || newOrder.orderNumber} from ${newOrder.customerName || 'Customer'} (${newOrder.totalItems} items)`
    );
    playBeep(980, 'triangle', 0.18);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {
      // Ignore confetti if unsupported
    }
    return newOrder;
  };

  const updateCustomerOrderStatus = (
    orderId: string,
    status: CustomerOnlineOrder['status'],
    adminNotes?: string,
    delayNotice?: string,
    isDelayed?: boolean
  ) => {
    setCustomerOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              adminNotes: adminNotes !== undefined ? adminNotes : o.adminNotes,
              delayNotice: delayNotice !== undefined ? delayNotice : o.delayNotice,
              isDelayed: isDelayed !== undefined ? isDelayed : o.isDelayed,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    // Sync status change directly to Firestore
    updateCustomerOrderStatusInFirestore(orderId, status, adminNotes, delayNotice, isDelayed).catch((err) => {
      console.error('[Firestore] Error updating order status in cloud:', err);
    });

    logActivity('Order Status Updated', `Order ${orderId} changed to ${status.toUpperCase()}${isDelayed ? ' [DELAYED]' : ''}`);
  };

  const deleteCustomerOrder = (orderId: string) => {
    setCustomerOrders((prev) => prev.filter((o) => o.id !== orderId));

    // Delete from Firestore
    deleteCustomerOrderFromFirestore(orderId).catch((err) => {
      console.error('[Firestore] Error deleting customer order from cloud:', err);
    });

    logActivity('Customer Order Deleted', `Removed customer order ${orderId}`);
  };

  // Customer Feedback Handlers
  const addFeedback = (
    feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>
  ): CustomerFeedback => {
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: `fb-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);

    // Save feedback to Firestore
    saveFeedbackInFirestore(newFeedback).catch((err) => {
      console.error('[Firestore] Error saving feedback to cloud:', err);
    });

    logActivity(
      'Customer Feedback Received',
      `${newFeedback.rating}★ Review from ${newFeedback.customerName || 'Customer'} [${newFeedback.category}]`
    );
    playBeep(880, 'sine', 0.15);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti
    }
    return newFeedback;
  };

  const updateFeedbackStatus = (
    feedbackId: string,
    status: CustomerFeedback['status'],
    adminNote?: string
  ) => {
    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === feedbackId
          ? {
              ...f,
              status,
              adminNote: adminNote !== undefined ? adminNote : f.adminNote,
            }
          : f
      )
    );

    // Sync feedback status in Firestore
    updateFeedbackStatusInFirestore(feedbackId, status, adminNote).catch((err) => {
      console.error('[Firestore] Error updating feedback status in cloud:', err);
    });

    logActivity('Feedback Status Updated', `Feedback ${feedbackId} marked as ${status.toUpperCase()}`);
  };

  const deleteFeedback = (feedbackId: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));

    // Delete feedback from Firestore
    deleteFeedbackFromFirestore(feedbackId).catch((err) => {
      console.error('[Firestore] Error deleting feedback from cloud:', err);
    });

    logActivity('Feedback Deleted', `Removed feedback ${feedbackId}`);
  };

  // Clear Sales History & Financial Transactions (Clean slate for client)
  const clearAllSalesAndTransactions = () => {
    setOrders([]);
    setCustomerOrders([]);
    setExpenses([]);
    setPurchases([]);
    setStockMovements([]);
    setFeedbacks([]);
    setCart([]);
    setLastCompletedOrder(null);
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        user: currentStaff.name || 'Admin',
        action: 'Financial History Cleared',
        details: 'All sales history, revenue records, and customer orders reset to clean zero state for client use.',
      },
    ]);
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        totalSpent: 0,
        totalOrders: 0,
        loyaltyPoints: 0,
      }))
    );
    const freshShift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash: 0,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      totalSales: 0,
      expectedCashInDrawer: 0,
      cashierName: currentStaff.name || 'Masgana',
      isOpen: false,
      notes: 'Fresh register shift',
    };
    setCurrentShift(freshShift);
    saveStorage(STORAGE_KEYS.ORDERS, []);
    saveStorage(STORAGE_KEYS.CUSTOMER_ORDERS, []);
    saveStorage(STORAGE_KEYS.EXPENSES, []);
    saveStorage(STORAGE_KEYS.PURCHASES, []);
    saveStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    saveStorage(STORAGE_KEYS.FEEDBACKS, []);
    saveStorage(STORAGE_KEYS.CURRENT_SHIFT, freshShift);
    clearAllCloudFinancialData().catch((err) => {
      console.warn('[Firestore] Failed to clear cloud financial documents:', err);
    });
    logActivity('Reset', 'Cleared all sales history, revenue, orders, and financial records for client launch');
  };

  // Reset & Backup
  const resetToDefaultData = async () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_USERS);
    setStaffMembers(INITIAL_STAFF);
    setSettings(INITIAL_SETTINGS);
    setStockMovements(INITIAL_MOVEMENTS);
    setCustomerOrders(INITIAL_CUSTOMER_ORDERS);
    setFeedbacks(INITIAL_FEEDBACKS);
    setCart([]);

    try {
      await resetFirestoreWithData({
        products: INITIAL_PRODUCTS,
        categories: INITIAL_CATEGORIES,
        orders: INITIAL_ORDERS,
        customers: INITIAL_CUSTOMERS,
        suppliers: INITIAL_SUPPLIERS,
        purchaseOrders: INITIAL_PURCHASES,
        movements: INITIAL_MOVEMENTS,
        settings: INITIAL_SETTINGS,
        shift: INITIAL_SHIFT,
        staff: INITIAL_STAFF,
      });
      setLastSyncedAt(new Date().toLocaleTimeString());
      setDbStatus('online');
      setIsCloudConnected(true);
    } catch (err) {
      console.error('[Firestore] Error syncing 88 products to cloud:', err);
    }

    logActivity('Database Reset', 'Reset all records and pushed 88 catalog products to cloud Firestore');
  };

  const exportDatabaseJSON = () => {
    const data = {
      settings,
      products,
      categories,
      orders,
      customers,
      suppliers,
      purchases,
      expenses,
      auditLogs,
      users,
      staffMembers,
      customerOrders,
      feedbacks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topfruit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('Backup Exported', 'Full database JSON backup created');
  };

  const backupDatabase = () => {
    exportDatabaseJSON();
  };

  const restoreDatabase = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.customerOrders && Array.isArray(data.customerOrders)) setCustomerOrders(data.customerOrders);
      if (data.feedbacks && Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      logActivity('Backup Restored', 'Restored database from uploaded JSON backup');
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  };

  const refreshCloudData = async (): Promise<void> => {
    setDbStatus('syncing');
    try {
      const [remoteOrders, remoteProducts, remoteSettings, remoteFeedbacks, remotePosOrders] = await Promise.all([
        fetchCustomerOrdersOnce(),
        fetchProductsOnce(),
        fetchSettingsOnce(),
        fetchFeedbacksOnce(),
        fetchOrdersOnce(),
      ]);

      if (remoteOrders && remoteOrders.length >= 0) {
        setCustomerOrders(remoteOrders);
      }
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(remoteProducts);
      }
      if (remoteSettings && remoteSettings.storeName) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
      if (remoteFeedbacks && remoteFeedbacks.length >= 0) {
        setFeedbacks(remoteFeedbacks);
      }
      if (remotePosOrders && remotePosOrders.length >= 0) {
        setOrders(remotePosOrders);
      }
      setLastSyncedAt(new Date().toLocaleTimeString());
      setDbStatus('online');
      setIsCloudConnected(true);
      console.log('[Firestore] ✅ Manual cloud refresh completed successfully');
    } catch (err) {
      console.warn('[Firestore] ⚠️ Cloud refresh error:', err);
      setDbStatus('local');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        isLocked,
        setIsLocked,
        currentRole,
        currentStaff,
        staffMembers,
        users,
        switchStaff,
        loginStaff,
        loginWithRoleAndPin,
        loginWithPin,
        loginAdminWithPin,
        verifyAdminPin,
        quickLoginStaff,
        logout,
        isOnline,
        setDirectRole,
        addUser,
        updateUser,
        deleteUser,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        settings,
        updateSettings,
        formatCurrency,
        products,
        categories,
        addCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordDamage,
        recordReturn,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
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
        checkout,
        orders,
        refundOrder,
        lastCompletedOrder,
        setLastCompletedOrder,
        seedCurrentWeekSales,
        purchases,
        purchaseOrders: purchases,
        addPurchase,
        createPurchaseOrder: addPurchase,
        receivePurchase,
        receivePurchaseOrder: receivePurchase,
        cancelPurchase,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        expenses,
        addExpense,
        deleteExpense,
        currentShift,
        openShift,
        closeShift,
        customerOrders,
        addCustomerOrder,
        updateCustomerOrderStatus,
        deleteCustomerOrder,
        feedbacks,
        addFeedback,
        updateFeedbackStatus,
        deleteFeedback,
        activePortal,
        setActivePortal,
        isInitializing,
        playOrderNotificationSound,
        dbStatus,
        isCloudConnected,
        lastSyncedAt,
        refreshCloudData,
        auditLogs,
        logActivity,
        stockMovements,
        clearAllSalesAndTransactions,
        resetToDefaultData,
        resetToDemoData: resetToDefaultData,
        exportDatabaseJSON,
        exportDataJSON: exportDatabaseJSON,
        backupDatabase,
        restoreDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
