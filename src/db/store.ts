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
import { Product, StockHistory, UserSession } from '../types';

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
    return {
      uid: result.user.uid,
      email: result.user.email || "",
      displayName: result.user.displayName || "Usuario Autorizado",
      isFirebase: true,
      emailVerified: result.user.emailVerified
    };
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
  if (isConfigured && auth) {
    await firebaseSignOut(auth);
  } else {
    localStorage.removeItem("inv_session");
  }
};

export const observeAuth = (onChange: (user: UserSession | null) => void) => {
  if (isConfigured && auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        onChange({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Usuario Autorizado",
          isFirebase: true,
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        onChange(null);
      }
    });
  } else {
    // Local State listener trigger
    const sessionStr = localStorage.getItem("inv_session");
    if (sessionStr) {
      try {
        onChange(JSON.parse(sessionStr));
      } catch {
        onChange(null);
      }
    } else {
      onChange(null);
    }
    // Return unsubscribe empty fn
    return () => {};
  }
};

// -----------------------------------------
// Products and History API (Realtime Sync)
// -----------------------------------------
export const subscribeProducts = (
  userId: string, 
  onData: (products: Product[]) => void,
  onError?: (err: any) => void
) => {
  if (isConfigured && db) {
    const q = query(collection(db, "products"), where("userId", "==", userId));
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
  if (isConfigured && db) {
    const q = query(collection(db, "history"), where("userId", "==", userId));
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

  if (isConfigured && db) {
    try {
      // Set Product doc
      await setDoc(doc(db, "products", pId), { 
        ...newProduct,
        createdAt: now, // will be request.time verified by security rules
        updatedAt: now
      });
      // Set History doc
      await setDoc(doc(db, "history", logId), {
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

  if (isConfigured && db) {
    try {
      // Find existing product first for historical checks
      const productsRef = collection(db, "products");
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

  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, "products", productId));
      await setDoc(doc(db, "history", logId), deleteLog);
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
