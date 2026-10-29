export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'store_credit' | 'split';
export type OrderStatus = 'completed' | 'refunded' | 'partially_refunded';
export type StockMovementType = 'sale' | 'restock' | 'damaged' | 'adjustment' | 'return';

export type AdminTab =
  | 'dashboard'
  | 'inventory'
  | 'pos'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'reports'
  | 'sales-history'
  | 'audit-log'
  | 'users'
  | 'settings';

export type CashierTab = 'pos' | 'inventory';

export type ActiveTab =
  | AdminTab
  | CashierTab
  | 'admin'
  | 'boss'
  | 'cashier'
  | 'orders'
  | 'analytics'
  | 'login'
  | 'logout'
  | 'storefront';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand?: string;
  costPrice: number; // Buy price
  sellingPrice: number; // Sell price
  stock: number;
  damaged?: number;
  returned?: number;
  minStockLevel: number;
  unit: string;
  supplierId?: string;
  image?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
  customPrice?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  taxRate: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeGiven?: number;
  customerId?: string;
  customerName?: string;
  cashierName: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  tier: 'Regular' | 'Silver' | 'Gold' | 'VIP';
  creditBalance?: number;
  debt?: number;
  status?: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  suppliedCategories: string[];
  productsCount?: number;
  outstandingBalance?: number;
  activeOrdersCount: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  costPerUnit: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  itemsCountSummary?: string;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  orderDate: string;
  receivedDate?: string;
  expectedDate?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'cashier';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  pin: string;
  email?: string;
  phone?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  note?: string;
  timestamp: string;
}

export type DbStatus = 'online' | 'syncing' | 'local' | 'connected' | 'offline';

export type UserRole = 'admin' | 'cashier' | 'customer';

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  phone?: string;
  email?: string;
  avatarColor?: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxNumber: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  receiptHeaderMessage: string;
  receiptFooterMessage: string;
  lowStockThresholdDefault: number;
  enableSoundEffects: boolean;
  cashierName: string;
  adminPin: string;
  bossPin?: string;
  cashierPin: string;
  allowCashierRefunds: boolean;
  allowCashierDiscounts: boolean;
  showPricesToCustomers?: boolean;
  storeLogo?: string;
}

export interface CustomerFeedback {
  id: string;
  customerName: string;
  customerContact?: string;
  rating: number; // 1 to 5
  category: 'Produce Quality' | 'Customer Service' | 'Stall Experience' | 'Fruit Request' | 'General';
  productId?: string;
  productName?: string;
  comment: string;
  status: 'new' | 'reviewed' | 'resolved';
  adminNote?: string;
  createdAt: string;
}

export interface CustomerOnlineOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  category?: string;
  image?: string;
  notes?: string;
}

export interface CustomerOnlineOrder {
  id: string;
  orderNumber: string;
  orderCode?: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryLocation?: string;
  pickupTime?: string;
  notes?: string;
  items: CustomerOnlineOrderItem[];
  totalItems: number;
  totalAmount?: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  adminNotes?: string;
  delayNotice?: string;
  isDelayed?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RegisterShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  startingCash: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  totalSales: number;
  expectedCashInDrawer: number;
  actualCashInDrawer?: number;
  difference?: number;
  cashierName: string;
  isOpen: boolean;
  notes?: string;
}
