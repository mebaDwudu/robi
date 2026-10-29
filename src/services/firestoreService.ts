import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  Order,
  Customer,
  Supplier,
  PurchaseOrder,
  StockMovement,
  StoreSettings,
  RegisterShift,
  StaffMember,
  CustomerOnlineOrder,
  CustomerFeedback,
} from '../types/store';

export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  CUSTOMER_ORDERS: 'customer_orders',
  FEEDBACKS: 'feedbacks',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  STOCK_MOVEMENTS: 'stock_movements',
  SETTINGS: 'settings',
  SHIFTS: 'shifts',
  STAFF: 'staff',
} as const;

/**
 * Strips all undefined fields recursively so Firestore setDoc/writeBatch never throws
 * "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    // Preserve Date or non-plain objects if any
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// ==========================================
// 1. PRODUCTS REAL-TIME SYNC
// ==========================================
export function subscribeProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PRODUCTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        items.push({ ...data, id: docSnap.id });
      });
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Products subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchProductsOnce(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    const items: Product[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as Product), id: docSnap.id });
    });
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return items;
  } catch (err) {
    console.error('[Firestore] Error fetching products:', err);
    return [];
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const cleanProduct = cleanForFirestore(product);
    const docRef = doc(db, COLLECTIONS.PRODUCTS, cleanProduct.id);
    await setDoc(docRef, cleanProduct, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving product:', err);
    throw err;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firestore] Error deleting product:', err);
    throw err;
  }
}

// ==========================================
// 2. CATEGORIES REAL-TIME SYNC
// ==========================================
export function subscribeCategories(
  onUpdate: (categories: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CATEGORIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const cats: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as { name: string };
        if (data.name) {
          cats.push(data.name);
        }
      });
      if (cats.length > 0) {
        onUpdate(Array.from(new Set(cats)));
      }
    },
    (err) => {
      console.warn('[Firestore] Categories subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveCategoryToFirestore(categoryName: string): Promise<void> {
  try {
    const catDocId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const docRef = doc(db, COLLECTIONS.CATEGORIES, catDocId);
    await setDoc(docRef, { name: categoryName, id: catDocId }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving category:', err);
  }
}

// ==========================================
// 3. SETTINGS REAL-TIME SYNC
// ==========================================
export function subscribeSettings(
  onUpdate: (settings: StoreSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'main');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as StoreSettings);
      }
    },
    (err) => {
      console.warn('[Firestore] Settings subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchSettingsOnce(): Promise<StoreSettings | null> {
  try {
    const docSnap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
    let s: StoreSettings | null = null;
    docSnap.forEach((d) => {
      if (d.id === 'main') {
        s = d.data() as StoreSettings;
      }
    });
    return s;
  } catch (err) {
    console.error('[Firestore] Error fetching settings:', err);
    return null;
  }
}

export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  try {
    const cleanSettings = cleanForFirestore(settings);
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'main');
    await setDoc(docRef, cleanSettings, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving settings:', err);
  }
}

// ==========================================
// 4. CUSTOMER ONLINE ORDERS (Cross-Device Real-Time Sync)
// ==========================================
export function subscribeCustomerOrders(
  onUpdate: (orders: CustomerOnlineOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CUSTOMER_ORDERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: CustomerOnlineOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ ...(docSnap.data() as CustomerOnlineOrder), id: docSnap.id });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.warn('[Firestore] Customer orders subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchCustomerOrdersOnce(): Promise<CustomerOnlineOrder[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.CUSTOMER_ORDERS));
    const orders: CustomerOnlineOrder[] = [];
    snap.forEach((docSnap) => {
      orders.push({ ...(docSnap.data() as CustomerOnlineOrder), id: docSnap.id });
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    console.error('[Firestore] Error direct fetching customer orders:', err);
    return [];
  }
}

export async function saveCustomerOrder(order: CustomerOnlineOrder): Promise<void> {
  try {
    const cleanOrder = cleanForFirestore(order);
    const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, cleanOrder.id);
    await setDoc(docRef, cleanOrder, { merge: true });
    console.log('[Firestore] ✅ Customer order written to cloud:', cleanOrder.id, cleanOrder.orderCode);
  } catch (err) {
    console.error('[Firestore] ❌ Error saving customer order to cloud:', err);
    throw err;
  }
}

export async function updateCustomerOrderStatusInFirestore(
  orderId: string,
  status: CustomerOnlineOrder['status'],
  adminNotes?: string,
  delayNotice?: string,
  isDelayed?: boolean
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, orderId);
    const updates: Partial<CustomerOnlineOrder> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    if (delayNotice !== undefined) {
      updates.delayNotice = delayNotice;
    }
    if (isDelayed !== undefined) {
      updates.isDelayed = isDelayed;
    }
    const cleanUpdates = cleanForFirestore(updates);
    await setDoc(docRef, cleanUpdates, { merge: true });
    console.log('[Firestore] ✅ Updated order status in cloud:', orderId, status);
  } catch (err) {
    console.error('[Firestore] ❌ Error updating customer order status in cloud:', err);
  }
}

export async function deleteCustomerOrderFromFirestore(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, orderId);
    await deleteDoc(docRef);
    console.log('[Firestore] ✅ Deleted customer order from cloud:', orderId);
  } catch (err) {
    console.error('[Firestore] ❌ Error deleting customer order from cloud:', err);
  }
}

// ==========================================
// 5. POS ORDERS (Sales Ledger)
// ==========================================
export function subscribeOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.ORDERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.warn('[Firestore] POS orders subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchOrdersOnce(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orders: Order[] = [];
    snap.forEach((docSnap) => {
      orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    console.error('[Firestore] Error fetching POS orders:', err);
    return [];
  }
}

export async function saveOrderInFirestore(order: Order): Promise<void> {
  try {
    const cleanOrder = cleanForFirestore(order);
    const docRef = doc(db, COLLECTIONS.ORDERS, cleanOrder.id);
    await setDoc(docRef, cleanOrder, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving POS order:', err);
  }
}

// ==========================================
// 6. CUSTOMER FEEDBACKS
// ==========================================
export function subscribeFeedbacks(
  onUpdate: (feedbacks: CustomerFeedback[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.FEEDBACKS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CustomerFeedback[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as CustomerFeedback), id: docSnap.id });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Feedbacks subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function fetchFeedbacksOnce(): Promise<CustomerFeedback[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.FEEDBACKS));
    const items: CustomerFeedback[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as CustomerFeedback), id: docSnap.id });
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.error('[Firestore] Error fetching feedbacks:', err);
    return [];
  }
}

export async function saveFeedbackInFirestore(feedback: CustomerFeedback): Promise<void> {
  try {
    const cleanFb = cleanForFirestore(feedback);
    const docRef = doc(db, COLLECTIONS.FEEDBACKS, cleanFb.id);
    await setDoc(docRef, cleanFb, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving feedback:', err);
  }
}

export async function updateFeedbackStatusInFirestore(
  feedbackId: string,
  status: CustomerFeedback['status'],
  adminNote?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
    const updates: Partial<CustomerFeedback> = { status };
    if (adminNote !== undefined) {
      updates.adminNote = adminNote;
    }
    const cleanUpdates = cleanForFirestore(updates);
    await setDoc(docRef, cleanUpdates, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error updating feedback status:', err);
  }
}

export async function deleteFeedbackFromFirestore(feedbackId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firestore] Error deleting feedback:', err);
  }
}

// ==========================================
// 7. CUSTOMERS & SUPPLIERS & STOCK MOVEMENTS
// ==========================================
export function subscribeCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CUSTOMERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Customer), id: docSnap.id });
      });
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Customers subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    const cleanCust = cleanForFirestore(customer);
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, cleanCust.id);
    await setDoc(docRef, cleanCust, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving customer:', err);
  }
}

export function subscribeSuppliers(
  onUpdate: (suppliers: Supplier[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.SUPPLIERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Supplier[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Supplier), id: docSnap.id });
      });
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Suppliers subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveSupplierToFirestore(supplier: Supplier): Promise<void> {
  try {
    const cleanSup = cleanForFirestore(supplier);
    const docRef = doc(db, COLLECTIONS.SUPPLIERS, cleanSup.id);
    await setDoc(docRef, cleanSup, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving supplier:', err);
  }
}

export function subscribePurchaseOrders(
  onUpdate: (pos: PurchaseOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PURCHASE_ORDERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: PurchaseOrder[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as PurchaseOrder), id: docSnap.id });
      });
      items.sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Purchase orders subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function savePurchaseOrderToFirestore(po: PurchaseOrder): Promise<void> {
  try {
    const cleanPo = cleanForFirestore(po);
    const docRef = doc(db, COLLECTIONS.PURCHASE_ORDERS, cleanPo.id);
    await setDoc(docRef, cleanPo, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving purchase order:', err);
  }
}

export function subscribeStockMovements(
  onUpdate: (movements: StockMovement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.STOCK_MOVEMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: StockMovement[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as StockMovement), id: docSnap.id });
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Stock movements subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveStockMovementToFirestore(movement: StockMovement): Promise<void> {
  try {
    const cleanMov = cleanForFirestore(movement);
    const docRef = doc(db, COLLECTIONS.STOCK_MOVEMENTS, cleanMov.id);
    await setDoc(docRef, cleanMov, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving stock movement:', err);
  }
}

export function subscribeStaff(
  onUpdate: (staff: StaffMember[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.STAFF);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: StaffMember[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as StaffMember), id: docSnap.id });
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (err) => {
      console.warn('[Firestore] Staff subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveStaffToFirestore(staff: StaffMember): Promise<void> {
  try {
    const cleanSt = cleanForFirestore(staff);
    const docRef = doc(db, COLLECTIONS.STAFF, cleanSt.id);
    await setDoc(docRef, cleanSt, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving staff:', err);
  }
}

// ==========================================
// 8. DATABASE SEEDING & INITIALIZATION
// ==========================================
export async function checkAndSeedFirestore(initial: {
  products: Product[];
  categories: string[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
  settings: StoreSettings;
  shift: RegisterShift;
  staff?: StaffMember[];
}): Promise<boolean> {
  try {
    const productsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (!productsSnap.empty && productsSnap.size >= 88) {
      return false; // Database already has complete 88-product catalog
    }

    console.log('[Firestore] Seeding/Updating full 88-product catalog to cloud...');
    await resetFirestoreWithData(initial);
    return true;
  } catch (err) {
    console.warn('[Firestore] Auto-seed check notice:', err);
    return false;
  }
}

export async function resetFirestoreWithData(data: {
  products: Product[];
  categories: string[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
  settings: StoreSettings;
  shift: RegisterShift;
  staff?: StaffMember[];
}): Promise<void> {
  const batch = writeBatch(db);

  // Settings
  batch.set(doc(db, COLLECTIONS.SETTINGS, 'main'), cleanForFirestore(data.settings));

  // Shift
  batch.set(doc(db, COLLECTIONS.SHIFTS, 'current'), cleanForFirestore(data.shift));

  // Staff
  if (data.staff && data.staff.length > 0) {
    data.staff.forEach((st) => {
      batch.set(doc(db, COLLECTIONS.STAFF, st.id), cleanForFirestore(st));
    });
  }

  // Categories
  data.categories.forEach((cat) => {
    const catDocId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    batch.set(doc(db, COLLECTIONS.CATEGORIES, catDocId), cleanForFirestore({ name: cat, id: catDocId }));
  });

  // Products
  data.products.forEach((prod) => {
    batch.set(doc(db, COLLECTIONS.PRODUCTS, prod.id), cleanForFirestore(prod));
  });

  // Customers
  data.customers.forEach((cust) => {
    batch.set(doc(db, COLLECTIONS.CUSTOMERS, cust.id), cleanForFirestore(cust));
  });

  // Suppliers
  data.suppliers.forEach((sup) => {
    batch.set(doc(db, COLLECTIONS.SUPPLIERS, sup.id), cleanForFirestore(sup));
  });

  // Purchase Orders
  data.purchaseOrders.forEach((po) => {
    batch.set(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), cleanForFirestore(po));
  });

  // Stock movements
  data.movements.forEach((mov) => {
    batch.set(doc(db, COLLECTIONS.STOCK_MOVEMENTS, mov.id), cleanForFirestore(mov));
  });

  // Orders
  data.orders.forEach((ord) => {
    batch.set(doc(db, COLLECTIONS.ORDERS, ord.id), cleanForFirestore(ord));
  });

  await batch.commit();
  console.log('[Firestore] Initial store dataset successfully seeded to cloud Firestore');
}

/**
 * Completely purges all orders and sales records from Firestore,
 * resetting gross revenue, net gross profit, and shifts to £0.00 for client fresh start.
 */
export async function clearAllCloudFinancialData(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Delete all POS orders
    const ordersSnap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    ordersSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // 2. Delete all customer online orders
    const custOrdersSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMER_ORDERS));
    custOrdersSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // 3. Reset shift sales to zero
    const cleanShift: RegisterShift = {
      id: `shift-fresh-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash: 0,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      totalSales: 0,
      expectedCashInDrawer: 0,
      cashierName: 'Masgana',
      isOpen: false,
      notes: 'Clean fresh slate - zero revenue start',
    };
    batch.set(doc(db, COLLECTIONS.SHIFTS, 'current'), cleanForFirestore(cleanShift));

    await batch.commit();
    console.log(`[Firestore] Successfully cleared ${ordersSnap.size} POS orders and ${custOrdersSnap.size} customer orders from cloud database.`);
  } catch (err) {
    console.warn('[Firestore] Failed to purge cloud financial records:', err);
  }
}

