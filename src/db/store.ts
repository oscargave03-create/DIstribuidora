import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc,
  deleteDoc,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth, isConfigured } from '../firebase';
import { Product, StockHistory, UserSession, AppConfig, UserPermission } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Strictly compliant Firestore Error Handler as required by skill guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial Mock/Demo Data for high-fidelity fallback experience
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Arroz Súper Extra Premium 1kg",
    sku: "AB-ARR-PREM-1KG",
    description: "Arroz de grano largo seleccionado, calidad de exportación. Saco protector contra humedad.",
    quantity: 154,
    minQuantity: 50,
    price: 1.85,
    category: "Abarrotes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "guest-user-123"
  },
  {
    id: "prod-2",
    name: "Aceite de Girasol Vegetal 1L",
    sku: "AB-ACE-GIR-1L",
    description: "Aceite de girasol comestible 100% puro para asar y freír, alto en Omega 9.",
    quantity: 12,
    minQuantity: 40, // Low stock warning!
    price: 3.20,
    category: "Abarrotes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "guest-user-123"
  },
  {
    id: "prod-3",
    name: "Leche Entera Tetrapack 1L (Caja x 12)",
    sku: "LA-LEC-ENT-1L",
    description: "Caja máster de leche entera ultrapasteurizada fortificada con Vitaminas A y D.",
    quantity: 60,
    minQuantity: 15,
    price: 14.50,
    category: "Lácteos y Quesos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "guest-user-123"
  },
  {
    id: "prod-4",
    name: "Atún Claro en Aceite de Oliva 140g",
    sku: "CO-ATU-CLA-G",
    description: "Lomos de atún claro capturado de forma sostenible, conservado en aceite de oliva premium.",
    quantity: 3,
    minQuantity: 20, // Low stock warning!
    price: 1.65,
    category: "Conservas y Enlatados",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "guest-user-123"
  }
];

const INITIAL_HISTORY: StockHistory[] = [
  {
    id: "hist-1",
    productId: "prod-1",
    productName: "Arroz Súper Extra Premium 1kg",
    userId: "guest-user-123",
    userName: "Oscar Guevara",
    type: "initial",
    changeAmount: 154,
    previousQuantity: 0,
    newQuantity: 154,
    notes: "Carga de inventario inicial - Mercancía recibida de muelle.",
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: "hist-2",
    productId: "prod-2",
    productName: "Aceite de Girasol Vegetal 1L",
    userId: "guest-user-123",
    userName: "Oscar Guevara",
    type: "initial",
    changeAmount: 32,
    previousQuantity: 0,
    newQuantity: 32,
    notes: "Carga de inventario inicial.",
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: "hist-3",
    productId: "prod-2",
    productName: "Aceite de Girasol Vegetal 1L",
    userId: "guest-user-123",
    userName: "Oscar Guevara",
    type: "subtract",
    changeAmount: -20,
    previousQuantity: 32,
    newQuantity: 12,
    notes: "Despacho por lote a sucursal 'Tienda del Centro' - Orden de compra desc-49920.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

// Helper to interact with LocalStorage when Firebase is not connected/setup
const getLocalProducts = (userId: string): Product[] => {
  const data = localStorage.getItem(`inv_products_${userId}`);
  if (!data) {
    // Populate demo data
    localStorage.setItem(`inv_products_${userId}`, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(data);
};

const saveLocalProducts = (userId: string, products: Product[]) => {
  localStorage.setItem(`inv_products_${userId}`, JSON.stringify(products));
};

const getLocalHistory = (userId: string): StockHistory[] => {
  const data = localStorage.getItem(`inv_history_${userId}`);
  if (!data) {
    localStorage.setItem(`inv_history_${userId}`, JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  }
  return JSON.parse(data);
};

const saveLocalHistory = (userId: string, history: StockHistory[]) => {
  localStorage.setItem(`inv_history_${userId}`, JSON.stringify(history));
};

export async function testFirebaseConnection() {
  if (!isConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

// -----------------------------------------
// Auth API
// -----------------------------------------
export const loginWithGoogle = async (): Promise<UserSession> => {
  if (isConfigured && auth) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const session: UserSession = {
      uid: result.user.uid,
      email: result.user.email || "",
      displayName: result.user.displayName || "Usuario Autorizado",
      isFirebase: true,
      emailVerified: result.user.emailVerified
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    return session;
  } else {
    // Local / Guest Fallback Login Mode
    const mockUser: UserSession = {
      uid: "guest-user-123",
      email: "demo@inventario-app.com",
      displayName: "Administrador de Stock",
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(mockUser));
    return mockUser;
  }
};

export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem("inv_session");
  if (isConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
  }
};

export const observeAuth = (onChange: (user: UserSession | null) => void) => {
  // 1. Emit the cached session immediately if available for fast visual loads
  const sessionStr = localStorage.getItem("inv_session");
  let cachedUser: UserSession | null = null;
  if (sessionStr) {
    try {
      cachedUser = JSON.parse(sessionStr);
      onChange(cachedUser);
    } catch {
      // ignore
    }
  }

  // 2. Synchronize with Firebase Auth state if active
  if (isConfigured && auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const session: UserSession = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Usuario Autorizado",
          isFirebase: true,
          emailVerified: firebaseUser.emailVerified
        };
        localStorage.setItem("inv_session", JSON.stringify(session));
        onChange(session);
      } else {
        const stored = localStorage.getItem("inv_session");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.isFirebase) {
              localStorage.removeItem("inv_session");
              onChange(null);
            }
          } catch {
            localStorage.removeItem("inv_session");
            onChange(null);
          }
        } else {
          onChange(null);
        }
      }
    });
  } else {
    // If not firebase, just continue using the local cached session
    if (cachedUser) {
      onChange(cachedUser);
    } else {
      onChange(null);
    }
    return () => {};
  }
};

// -----------------------------------------
// Products and History API (Realtime Sync)
// -----------------------------------------
export const isOnline = (): boolean => {
  return !!(isConfigured && db && auth?.currentUser);
};

export const subscribeProducts = (
  userId: string, 
  onData: (products: Product[]) => void,
  onError?: (err: any) => void
) => {
  if (isOnline()) {
    const q = query(collection(db!, "products"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      onData(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
      if (onError) onError(error);
    });
  } else {
    // Fallback to offline localstorage polling-like reactive triggers
    onData(getLocalProducts(userId));
    
    // Listen to manual update events we trigger inside this same app
    const handleStorageChange = () => {
      onData(getLocalProducts(userId));
    };
    window.addEventListener("local_inventory_update", handleStorageChange);
    return () => {
      window.removeEventListener("local_inventory_update", handleStorageChange);
    };
  }
};

export const subscribeHistory = (
  userId: string, 
  onData: (logs: StockHistory[]) => void,
  onError?: (err: any) => void
) => {
  if (isOnline()) {
    const q = query(collection(db!, "history"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const history: StockHistory[] = [];
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as StockHistory);
      });
      // Sort history chronologically descending
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(history);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "history");
      if (onError) onError(error);
    });
  } else {
    // Offline localstorage fallback
    const logs = getLocalHistory(userId);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onData(logs);

    const handleStorageChange = () => {
      const currentLogs = getLocalHistory(userId);
      currentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(currentLogs);
    };
    window.addEventListener("local_inventory_update", handleStorageChange);
    return () => {
      window.removeEventListener("local_inventory_update", handleStorageChange);
    };
  }
};

// -----------------------------------------
// Mutation actions
// -----------------------------------------
export const storeAddProduct = async (
  userId: string, 
  userName: string,
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<void> => {
  const pId = "p-" + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  const newProduct: Product = {
    ...productData,
    id: pId,
    createdAt: now,
    updatedAt: now,
    userId
  };

  const logId = "l-" + Math.random().toString(36).substr(2, 9);
  const newLog: StockHistory = {
    id: logId,
    productId: pId,
    productName: newProduct.name,
    userId,
    userName,
    type: "create",
    changeAmount: newProduct.quantity,
    previousQuantity: 0,
    newQuantity: newProduct.quantity,
    notes: `Se dio de alta el producto en el catálogo. Stock inicial de ${newProduct.quantity} unidades.`,
    timestamp: now
  };

  if (isOnline()) {
    try {
      // Set Product doc
      await setDoc(doc(db!, "products", pId), { 
        ...newProduct,
        createdAt: now, // will be request.time verified by security rules
        updatedAt: now
      });
      // Set History doc
      await setDoc(doc(db!, "history", logId), {
        ...newLog,
        timestamp: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${pId}`);
    }
  } else {
    // LocalStorage write
    const products = getLocalProducts(userId);
    products.push(newProduct);
    saveLocalProducts(userId, products);

    const history = getLocalHistory(userId);
    history.push(newLog);
    saveLocalHistory(userId, history);

    // Notify listeners
    window.dispatchEvent(new Event("local_inventory_update"));
  }
};

export const storeUpdateProduct = async (
  userId: string,
  userName: string,
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>,
  adjustReason?: { changeAmount: number, notes: string }
): Promise<void> => {
  const now = new Date().toISOString();

  if (isOnline()) {
    try {
      // Find existing product first for historical checks
      const productsRef = collection(db!, "products");
      const productDocRef = doc(productsRef, productId);
      
      // Update doc
      await setDoc(productDocRef, {
        ...updates as any,
        updatedAt: now
      }, { merge: true });

      if (adjustReason) {
        const logId = "l-" + Math.random().toString(36).substr(2, 9);
        const newLog: StockHistory = {
          id: logId,
          productId,
          productName: updates.name || "Producto Ajustado",
          userId,
          userName,
          type: adjustReason.changeAmount > 0 ? "add" : "subtract",
          changeAmount: adjustReason.changeAmount,
          previousQuantity: (updates.quantity || 0) - adjustReason.changeAmount,
          newQuantity: updates.quantity || 0,
          notes: adjustReason.notes,
          timestamp: now
        };
        await setDoc(doc(db, "history", logId), newLog);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  } else {
    const products = getLocalProducts(userId);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const prevQty = products[index].quantity;
      const updatedProduct = {
        ...products[index],
        ...updates,
        updatedAt: now
      };
      products[index] = updatedProduct;
      saveLocalProducts(userId, products);

      if (adjustReason) {
        const history = getLocalHistory(userId);
        const logId = "l-" + Math.random().toString(36).substr(2, 9);
        const newLog: StockHistory = {
          id: logId,
          productId,
          productName: updatedProduct.name,
          userId,
          userName,
          type: adjustReason.changeAmount > 0 ? "add" : "subtract",
          changeAmount: adjustReason.changeAmount,
          previousQuantity: prevQty,
          newQuantity: updatedProduct.quantity,
          notes: adjustReason.notes,
          timestamp: now
        };
        history.push(newLog);
        saveLocalHistory(userId, history);
      } else {
        // Generic metadata update (name, sku, category, price)
        const history = getLocalHistory(userId);
        const logId = "l-" + Math.random().toString(36).substr(2, 9);
        const newLog: StockHistory = {
          id: logId,
          productId,
          productName: updatedProduct.name,
          userId,
          userName,
          type: "update",
          changeAmount: 0,
          previousQuantity: prevQty,
          newQuantity: updatedProduct.quantity,
          notes: "Actualización de datos generales del catálogo.",
          timestamp: now
        };
        history.push(newLog);
        saveLocalHistory(userId, history);
      }

      window.dispatchEvent(new Event("local_inventory_update"));
    }
  }
};

export const storeDeleteProduct = async (
  userId: string,
  userName: string,
  productId: string,
  productName: string
): Promise<void> => {
  const now = new Date().toISOString();
  const logId = "l-" + Math.random().toString(36).substr(2, 9);
  
  const deleteLog: StockHistory = {
    id: logId,
    productId,
    productName,
    userId,
    userName,
    type: "delete",
    changeAmount: 0,
    previousQuantity: 0,
    newQuantity: 0,
    notes: `Se removió el producto "${productName}" permanentemente del catálogo de inventario.`,
    timestamp: now
  };

  if (isOnline()) {
    try {
      await deleteDoc(doc(db!, "products", productId));
      await setDoc(doc(db!, "history", logId), deleteLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  } else {
    // LocalStorage implementation
    const products = getLocalProducts(userId);
    const updatedProducts = products.filter(p => p.id !== productId);
    saveLocalProducts(userId, updatedProducts);

    const history = getLocalHistory(userId);
    history.push(deleteLog);
    saveLocalHistory(userId, history);

    window.dispatchEvent(new Event("local_inventory_update"));
  }
};

// -----------------------------------------
// Application Config & Permissions Api (Default Config and CRUDS)
// -----------------------------------------

export const DEFAULT_CONFIG: AppConfig = {
  systemTitle: "Catálogo de Inventario",
  systemSubtitle: "Ctrl. de Stock",
  companyName: "DISTRIBUIDORA DE ALIMENTOS",
  ruc: "1792348574001",
  telephone: "(02) 299-900",
  address: "Quito, Ecuador",
  receiptFooter: "¡Gracias por abastecerse con nosotros!",
  receiptAd: "Stock descontado correctamente del almacén de distribución.",
  categories: ["Abarrotes", "Lácteos y Quesos", "Conservas y Enlatados"],
  taxes: {
    generalRate: 7,
    liquorRate: 10,
    tobaccoRate: 15,
    generalName: "Impuesto Artículos (7%)",
    liquorName: "Impuesto Licores (10%)",
    tobaccoName: "Impuesto Tabaco (15%)"
  }
};

const DEFAULT_USER_PERMISSIONS: UserPermission[] = [
  {
    id: "admin-0317-uid",
    email: "admin0317",
    displayName: "Admin0317 (Administrador Principal)",
    role: "admin",
    password: "Value54321",
    allowedTabs: {
      dashboard: true,
      pos: true,
      alerts: true,
      reports: true,
      admin: true
    },
    allowedActions: {
      create_product: true,
      edit_product: true,
      delete_product: true,
      adjust_stock: true,
      process_sale: true
    }
  },
  {
    id: "guest-user-123",
    email: "demo@inventario-app.com",
    displayName: "Administrador de Stock",
    role: "admin",
    password: "admin123",
    allowedTabs: {
      dashboard: true,
      pos: true,
      alerts: true,
      reports: true,
      admin: true
    },
    allowedActions: {
      create_product: true,
      edit_product: true,
      delete_product: true,
      adjust_stock: true,
      process_sale: true
    }
  }
];

export const loginWithCustomCredentials = async (
  usernameOrEmail: string,
  password: string
): Promise<UserSession> => {
  const normUser = usernameOrEmail.trim().toLowerCase();
  
  // Sign out from Firebase Auth to ensure we do not have a mismatched backend session!
  if (isConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Error signing out Firebase Auth on custom credentials login:", e);
    }
  }

  // 1. Check hardcoded/default custom credentials
  if (normUser === "admin0317" && password === "Value54321") {
    const session: UserSession = {
      uid: "admin-0317-uid",
      email: "admin0317",
      displayName: "Admin0317 (Administrador Principal)",
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    return session;
  }

  if (normUser === "admin@inventario.com" && password === "admin123") {
    const session: UserSession = {
      uid: "guest-user-123",
      email: "admin@inventario.com",
      displayName: "Oscar Guevara (Supervisor)",
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    return session;
  }

  // 2. Query local DB / LocalStorage for other custom users (to avoid unauthenticated Firestore requests)
  const data = localStorage.getItem(`app_permissions_list`);
  const list: UserPermission[] = data ? JSON.parse(data) : DEFAULT_USER_PERMISSIONS;
  const found = list.find(u => (u.email.toLowerCase() === normUser || u.id.toLowerCase() === normUser) && u.password === password);
  if (found) {
    const session: UserSession = {
      uid: found.id,
      email: found.email,
      displayName: found.displayName,
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    return session;
  }

  throw new Error("Credenciales inválidas. Verifique su usuario o contraseña.");
};

export const subscribeConfig = (
  userId: string,
  onData: (config: AppConfig) => void
) => {
  if (isOnline()) {
    const docRef = doc(db!, "configs", userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as AppConfig);
      } else {
        // Automatically save initial config
        setDoc(docRef, DEFAULT_CONFIG).catch(err => console.error("Error setting default config: ", err));
        onData(DEFAULT_CONFIG);
      }
    }, (error) => {
      console.error("Firestore Config error:", error);
    });
  } else {
    // Local storage fallback
    const getLocalConfig = (): AppConfig => {
      const data = localStorage.getItem(`app_config_${userId}`);
      if (!data) {
        localStorage.setItem(`app_config_${userId}`, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
      }
      try {
        return JSON.parse(data);
      } catch {
        return DEFAULT_CONFIG;
      }
    };
    onData(getLocalConfig());

    const handleStorageChange = () => {
      onData(getLocalConfig());
    };
    window.addEventListener("local_config_update", handleStorageChange);
    return () => {
      window.removeEventListener("local_config_update", handleStorageChange);
    };
  }
};

export const storeUpdateConfig = async (
  userId: string,
  config: AppConfig
): Promise<void> => {
  if (isOnline()) {
    try {
      await setDoc(doc(db!, "configs", userId), config);
    } catch (error) {
      console.error("Error updating firestore config:", error);
    }
  } else {
    localStorage.setItem(`app_config_${userId}`, JSON.stringify(config));
    window.dispatchEvent(new Event("local_config_update"));
    // Trigger products updates just in case categories listings need sync
    window.dispatchEvent(new Event("local_inventory_update"));
  }
};

export const subscribeUserPermissions = (
  userId: string,
  onData: (permissions: UserPermission[]) => void
) => {
  if (isOnline()) {
    // 1. Subscribe to the personal permission document first so we bypass list queries for non-admins
    const personalDocRef = doc(db!, "permissions", userId);
    let personalPerm: UserPermission | null = null;
    let otherPerms: UserPermission[] = [];

    const unsubPersonal = onSnapshot(personalDocRef, (docSnap) => {
      if (docSnap.exists()) {
        personalPerm = { id: docSnap.id, ...docSnap.data() } as UserPermission;
        onData([personalPerm, ...otherPerms.filter(p => p.id !== userId)]);
      } else {
        // Automatically seed default config and owner permission for Google users
        const defaultPerm: UserPermission = {
          id: userId,
          email: auth?.currentUser?.email || "usuario@correo.com",
          displayName: auth?.currentUser?.displayName || "Usuario Autorizado",
          role: "admin", // Seed initial Google login as admin so they can configure system
          allowedTabs: {
            dashboard: true,
            pos: true,
            alerts: true,
            reports: true,
            admin: true
          },
          allowedActions: {
            create_product: true,
            edit_product: true,
            delete_product: true,
            adjust_stock: true,
            process_sale: true
          }
        };
        setDoc(personalDocRef, defaultPerm)
          .then(() => {
            personalPerm = defaultPerm;
            onData([defaultPerm, ...otherPerms.filter(p => p.id !== userId)]);
          })
          .catch(err => console.error("Error seeding default permission:", err));
      }
    }, (error) => {
      console.error("Personal Permission fetch error:", error);
    });

    // 2. Try to subscribe to the full collection (only works for authenticated admins)
    const q = query(collection(db!, "permissions"));
    const unsubAll = onSnapshot(q, (snapshot) => {
      const list: UserPermission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserPermission);
      });
      otherPerms = list.filter(p => p.id !== userId);
      if (personalPerm) {
        onData([personalPerm, ...otherPerms]);
      } else {
        onData(list);
      }
    }, (error) => {
      // Silently swallow permission error if non-admin - they shouldn't query other accounts' permissions anyway
      if (error?.message?.includes("permissions") || error?.code === "permission-denied" || String(error).includes("permission")) {
        console.log("User is not an admin, restricted user list loaded.");
      } else {
        console.error("User Permissions list sync error:", error);
      }
    });

    return () => {
      unsubPersonal();
      unsubAll();
    };
  } else {
    // Offline local storage fallback
    const getLocalPermissions = (): UserPermission[] => {
      const data = localStorage.getItem(`app_permissions_list`);
      if (!data) {
        localStorage.setItem(`app_permissions_list`, JSON.stringify(DEFAULT_USER_PERMISSIONS));
        return DEFAULT_USER_PERMISSIONS;
      }
      try {
        return JSON.parse(data);
      } catch {
        return DEFAULT_USER_PERMISSIONS;
      }
    };

    const currentList = getLocalPermissions();
    // Guarantee that at least the current user exists in permissions list
    const hasCurrentUser = currentList.some(p => p.id === userId);
    if (!hasCurrentUser) {
      const newUserPerm: UserPermission = {
        id: userId,
        email: "demo@inventario-app.com",
        displayName: "Usuario Administrador",
        role: "admin",
        allowedTabs: {
          dashboard: true,
          pos: true,
          alerts: true,
          reports: true,
          admin: true
        },
        allowedActions: {
          create_product: true,
          edit_product: true,
          delete_product: true,
          adjust_stock: true,
          process_sale: true
        }
      };
      currentList.push(newUserPerm);
      localStorage.setItem(`app_permissions_list`, JSON.stringify(currentList));
    }

    onData(currentList);

    const handleStorageChange = () => {
      onData(getLocalPermissions());
    };
    window.addEventListener("local_permissions_update", handleStorageChange);
    return () => {
      window.removeEventListener("local_permissions_update", handleStorageChange);
    };
  }
};

export const storeUpdateUserPermission = async (
  permission: UserPermission
): Promise<void> => {
  if (isOnline()) {
    try {
      await setDoc(doc(db!, "permissions", permission.id), permission);
    } catch (error) {
      console.error("Error saving user permission in Firestore:", error);
    }
  } else {
    const data = localStorage.getItem(`app_permissions_list`);
    let list: UserPermission[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(p => p.id === permission.id);
    if (idx !== -1) {
      list[idx] = permission;
    } else {
      list.push(permission);
    }
    localStorage.setItem(`app_permissions_list`, JSON.stringify(list));
    window.dispatchEvent(new Event("local_permissions_update"));
  }
};

export const storeDeleteUserPermission = async (
  id: string
): Promise<void> => {
  if (isOnline()) {
    try {
      await deleteDoc(doc(db!, "permissions", id));
    } catch (error) {
      console.error("Error deleting user permission in Firestore:", error);
    }
  } else {
    const data = localStorage.getItem(`app_permissions_list`);
    let list: UserPermission[] = data ? JSON.parse(data) : [];
    list = list.filter(p => p.id !== id);
    localStorage.setItem(`app_permissions_list`, JSON.stringify(list));
    window.dispatchEvent(new Event("local_permissions_update"));
  }
};
