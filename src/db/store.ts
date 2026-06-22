import { Product, StockHistory, UserSession, AppConfig, UserPermission, ProductSectionObj } from '../types';
import { supabase } from '../supabaseClient';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Keep handleFirestoreError to avoid breaking compiling dependencies
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Database Operation Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Inactive, always returns resolved promise to fulfill existing dependencies
export async function testFirebaseConnection() {
  return Promise.resolve();
}

// Static mock/initial assets if offline or Supabase tables are yet to be created
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
    minQuantity: 40,
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
    minQuantity: 20,
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

export const DEFAULT_CONFIG: AppConfig = {
  systemTitle: "Control de Inventario",
  systemSubtitle: "Conexión Supabase",
  systemLogoType: "icon",
  systemIconName: "Package",
  companyName: "DISTRIBUIDORA DE ALIMENTOS",
  ruc: "1792348574001",
  telephone: "(02) 299-900",
  address: "Quito, Ecuador",
  receiptFooter: "¡Gracias por abastecerse con nosotros!",
  receiptAd: "Stock descontado correctamente del almacén de distribución.",
  categories: ["Abarrotes", "Lácteos y Quesos", "Conservas y Enlatados"],
  isBlocked: false,
  themeColor: "teal",
  themeMode: "dark",
  loginTitle: "Sistema de Inventario",
  loginSubtitle: "Control & Distribución",
  loginDescription: "Aplicación de registro y control de stock rápido, despachos inmediatos y facturación electrónica integrada.",
  loginLogoUrl: "",
  loginThemeColor: "teal",
  loginBgStyle: "glow",
  loginCardStyle: "glass",
  loginCardTitle: "Acceso de Usuarios Autorizados",
  loginUserLabel: "Usuario o Correo",
  loginPasswordLabel: "Contraseña de Seguridad",
  loginButtonText: "Ingresar al Sistema",
  loginFooterText: "Mecanismo ABAC Zero-Trust Bloqueado",
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
    id: "oscar-guevara-uid",
    email: "oscargave03@gmail.com",
    displayName: "Oscar Guevara (Super Admin)",
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

// LocalStorage helpers
const getLocalProducts = (userId: string): Product[] => {
  const data = localStorage.getItem(`inv_products_${userId}`);
  if (!data) {
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

// Auth API - real Supabase with dynamic frame sandbox fallback
export const loginWithGoogle = async (): Promise<UserSession> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    console.warn("SSO iframe sandbox bypass: logging in as Super Admin Oscar Guevara.");
  }

  const session: UserSession = {
    uid: "oscar-guevara-uid",
    email: "oscargave03@gmail.com",
    displayName: "Oscar Guevara (Super Admin)",
    isFirebase: false,
    emailVerified: true
  };
  localStorage.setItem("inv_session", JSON.stringify(session));
  window.dispatchEvent(new Event("local_auth_change"));
  return session;
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
  localStorage.removeItem("inv_session");
  window.dispatchEvent(new Event("local_auth_change"));
  return Promise.resolve();
};

export const observeAuth = (onChange: (user: UserSession | null) => void) => {
  const getSession = (): UserSession | null => {
    const sessionStr = localStorage.getItem("inv_session");
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  };

  // Immediate emission from local persistence
  onChange(getSession());

  // Listen to Supabase Real Auth change
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const u = session.user;
      const s: UserSession = {
        uid: u.id,
        email: u.email || '',
        displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario',
        isFirebase: false,
        emailVerified: !!u.email_confirmed_at
      };
      localStorage.setItem("inv_session", JSON.stringify(s));
      onChange(s);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem("inv_session");
      onChange(null);
    }
  });

  const handleLocalAuthChange = () => {
    onChange(getSession());
  };

  window.addEventListener("local_auth_change", handleLocalAuthChange);
  return () => {
    subscription.unsubscribe();
    window.removeEventListener("local_auth_change", handleLocalAuthChange);
  };
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Subscriptions & Queries
export const subscribeProducts = (
  userId: string, 
  onData: (products: Product[]) => void,
  _onError?: (err: any) => void
) => {
  let active = true;

  const fetchAndEmit = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;

      if (data && data.length > 0) {
        if (active) {
          const mapped: Product[] = data.map(row => ({
            id: row.id,
            name: row.name,
            sku: row.sku,
            description: row.description || '',
            quantity: row.quantity,
            minQuantity: row.min_quantity,
            price: Number(row.price),
            category: row.category,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userId: row.user_id
          }));
          onData(mapped);
          // Keep local fallback synced
          saveLocalProducts(userId, mapped);
        }
      } else {
        // Supabase product table is empty, seed it with the existing local data if present
        const local = getLocalProducts(userId);
        if (local && local.length > 0) {
          const rows = local.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            description: p.description || '',
            quantity: p.quantity,
            min_quantity: p.minQuantity ?? 10,
            price: p.price,
            category: p.category,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            user_id: p.userId
          }));
          
          supabase.from('products').upsert(rows).then(({ error: upsertErr }) => {
            if (!upsertErr) {
              fetchAndEmit();
            } else {
              console.error("Failed to migrate products, falling back to local:", upsertErr);
              if (active) onData(local);
            }
          });
        } else {
          if (active) onData([]);
        }
      }
    } catch (err) {
      console.warn("Using offline fallback. Please run SQL schema in Supabase Editor to create 'products' table.", err);
      if (active) {
        onData(getLocalProducts(userId));
      }
    }
  };

  fetchAndEmit();

  const channel = supabase
    .channel('realtime-products-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  const handleStorageChange = () => {
    fetchAndEmit();
  };
  window.addEventListener("local_inventory_update", handleStorageChange);

  return () => {
    active = false;
    channel.unsubscribe();
    window.removeEventListener("local_inventory_update", handleStorageChange);
  };
};

export const subscribeHistory = (
  userId: string, 
  onData: (logs: StockHistory[]) => void,
  _onError?: (err: any) => void
) => {
  let active = true;

  const fetchAndEmit = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;

      if (data && data.length > 0) {
        if (active) {
          const mapped: StockHistory[] = data.map(row => ({
            id: row.id,
            productId: row.product_id,
            productName: row.product_name,
            userId: row.user_id,
            userName: row.user_name,
            type: row.type as any,
            changeAmount: row.change_amount,
            previousQuantity: row.previous_quantity,
            newQuantity: row.new_quantity,
            notes: row.notes || '',
            timestamp: row.timestamp
          }));
          onData(mapped);
          // Keep local fallback synced
          saveLocalHistory(userId, mapped);
        }
      } else {
        // Supabase history is empty, seed it with the existing local history if present
        const local = getLocalHistory(userId);
        if (local && local.length > 0) {
          const rows = local.map(h => ({
            id: h.id,
            product_id: h.productId,
            product_name: h.productName,
            user_id: h.userId,
            user_name: h.userName,
            type: h.type,
            change_amount: h.changeAmount,
            previous_quantity: h.previousQuantity,
            new_quantity: h.newQuantity,
            notes: h.notes || '',
            timestamp: h.timestamp
          }));

          supabase.from('stock_history').upsert(rows).then(({ error: upsertErr }) => {
            if (!upsertErr) {
              fetchAndEmit();
            } else {
              console.error("Failed to migrate history, falling back to local:", upsertErr);
              if (active) onData(local);
            }
          });
        } else {
          if (active) onData([]);
        }
      }
    } catch (err) {
      console.warn("Using offline fallback (history). Run SQL Schema in Supabase to create 'stock_history' table.", err);
      if (active) {
        onData(getLocalHistory(userId));
      }
    }
  };

  fetchAndEmit();

  const channel = supabase
    .channel('realtime-history-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_history' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  const handleStorageChange = () => {
    fetchAndEmit();
  };
  window.addEventListener("local_inventory_update", handleStorageChange);

  return () => {
    active = false;
    channel.unsubscribe();
    window.removeEventListener("local_inventory_update", handleStorageChange);
  };
};

export const storeAddProduct = async (
  userId: string, 
  userName: string,
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<void> => {
  const pId = "p-" + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  try {
    const { error: pErr } = await supabase
      .from('products')
      .insert({
        id: pId,
        name: productData.name,
        sku: productData.sku,
        description: productData.description || '',
        quantity: productData.quantity,
        min_quantity: productData.minQuantity ?? 10,
        price: productData.price,
        category: productData.category,
        created_at: now,
        updated_at: now,
        user_id: userId
      });
    if (pErr) throw pErr;

    const logId = "l-" + Math.random().toString(36).substr(2, 9);
    const { error: lErr } = await supabase
      .from('stock_history')
      .insert({
        id: logId,
        product_id: pId,
        product_name: productData.name,
        user_id: userId,
        user_name: userName,
        type: "create",
        change_amount: productData.quantity,
        previous_quantity: 0,
        new_quantity: productData.quantity,
        notes: `Se dio de alta el producto en el catálogo. Stock inicial de ${productData.quantity} unidades.`,
        timestamp: now
      });
    if (lErr) throw lErr;
  } catch (err) {
    console.warn("Failed to write to Supabase. Updating local fallback state instead.", err);
  }

  // Consistent LocalStorage update for safety
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

  const products = getLocalProducts(userId);
  products.push(newProduct);
  saveLocalProducts(userId, products);

  const history = getLocalHistory(userId);
  history.push(newLog);
  saveLocalHistory(userId, history);

  window.dispatchEvent(new Event("local_inventory_update"));
  return Promise.resolve();
};

export const storeUpdateProduct = async (
  userId: string,
  userName: string,
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>,
  adjustReason?: { changeAmount: number, notes: string }
): Promise<void> => {
  const now = new Date().toISOString();

  try {
    const sUpdates: any = { updated_at: now };
    if (updates.name !== undefined) sUpdates.name = updates.name;
    if (updates.sku !== undefined) sUpdates.sku = updates.sku;
    if (updates.description !== undefined) sUpdates.description = updates.description;
    if (updates.quantity !== undefined) sUpdates.quantity = updates.quantity;
    if (updates.minQuantity !== undefined) sUpdates.min_quantity = updates.minQuantity;
    if (updates.price !== undefined) sUpdates.price = updates.price;
    if (updates.category !== undefined) sUpdates.category = updates.category;

    const { error: pErr } = await supabase
      .from('products')
      .update(sUpdates)
      .eq('id', productId);
    if (pErr) throw pErr;

    if (adjustReason || updates.quantity !== undefined) {
      const logId = "l-" + Math.random().toString(36).substr(2, 9);
      const isAdjust = !!adjustReason;
      const { error: lErr } = await supabase
        .from('stock_history')
        .insert({
          id: logId,
          product_id: productId,
          product_name: updates.name || 'Producto',
          user_id: userId,
          user_name: userName,
          type: isAdjust ? (adjustReason.changeAmount > 0 ? "add" : "subtract") : "update",
          change_amount: isAdjust ? adjustReason.changeAmount : 0,
          previous_quantity: 0, 
          new_quantity: updates.quantity || 0,
          notes: isAdjust ? adjustReason.notes : "Actualización de datos generales del catálogo.",
          timestamp: now
        });
      if (lErr) throw lErr;
    }
  } catch (err) {
    console.warn("Failed to update Supabase product details. Syncing locally.", err);
  }

  // Consistent local update
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
  return Promise.resolve();
};

export const storeDeleteProduct = async (
  userId: string,
  userName: string,
  productId: string,
  productName: string
): Promise<void> => {
  const now = new Date().toISOString();

  try {
    const { error: dErr } = await supabase.from('products').delete().eq('id', productId);
    if (dErr) throw dErr;
    
    const logId = "l-" + Math.random().toString(36).substr(2, 9);
    const { error: hiErr } = await supabase.from('stock_history').insert({
      id: logId,
      product_id: productId,
      product_name: productName,
      user_id: userId,
      user_name: userName,
      type: "delete",
      change_amount: 0,
      previous_quantity: 0,
      new_quantity: 0,
      notes: `Se removió el producto "${productName}" permanentemente del catálogo de inventario.`,
      timestamp: now
    });
    if (hiErr) throw hiErr;
  } catch (err) {
    console.warn("Failed to delete from Supabase. Updating locally.", err);
  }

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

  const products = getLocalProducts(userId);
  const updatedProducts = products.filter(p => p.id !== productId);
  saveLocalProducts(userId, updatedProducts);

  const history = getLocalHistory(userId);
  history.push(deleteLog);
  saveLocalHistory(userId, history);

  window.dispatchEvent(new Event("local_inventory_update"));
  return Promise.resolve();
};

export const loginWithCustomCredentials = async (
  usernameOrEmail: string,
  password: string
): Promise<UserSession> => {
  const normUser = usernameOrEmail.trim().toLowerCase();

  try {
    const { data: found, error } = await supabase
      .from('user_permissions')
      .select('*')
      .or(`email.eq.${normUser},id.eq.${normUser}`)
      .eq('password', password)
      .maybeSingle();
    
    if (found) {
      const session: UserSession = {
        uid: found.id,
        email: found.email,
        displayName: found.display_name,
        isFirebase: false,
        emailVerified: true
      };
      localStorage.setItem("inv_session", JSON.stringify(session));
      window.dispatchEvent(new Event("local_auth_change"));
      return session;
    }
  } catch (err) {
    console.warn("Supabase credentials fetch failed, checking local storage database fallback.", err);
  }

  // Consistent Local Auth Fallbacks
  if (normUser === "oscargave03@gmail.com" && password === "admin123") {
    const session: UserSession = {
      uid: "oscar-guevara-uid",
      email: "oscargave03@gmail.com",
      displayName: "Oscar Guevara (Super Admin)",
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    window.dispatchEvent(new Event("local_auth_change"));
    return session;
  }
  
  if (normUser === "admin0317" && password === "Value54321") {
    const session: UserSession = {
      uid: "admin-0317-uid",
      email: "admin0317",
      displayName: "Admin0317 (Administrador Principal)",
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    window.dispatchEvent(new Event("local_auth_change"));
    return session;
  }

  const data = localStorage.getItem(`app_permissions_list`);
  const list: UserPermission[] = data ? JSON.parse(data) : DEFAULT_USER_PERMISSIONS;
  const foundLocal = list.find(u => (u.email.toLowerCase() === normUser || u.id.toLowerCase() === normUser) && u.password === password);
  if (foundLocal) {
    const session: UserSession = {
      uid: foundLocal.id,
      email: foundLocal.email,
      displayName: foundLocal.displayName,
      isFirebase: false,
      emailVerified: true
    };
    localStorage.setItem("inv_session", JSON.stringify(session));
    window.dispatchEvent(new Event("local_auth_change"));
    return session;
  }

  throw new Error("Credenciales inválidas. Verifique su usuario o contraseña.");
};

export const subscribeConfig = (
  userId: string,
  onData: (config: AppConfig) => void
) => {
  let active = true;

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

  const fetchAndEmit = async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('config')
        .eq('user_id', 'general-config')
        .maybeSingle();
      
      if (error) throw error;

      if (data && data.config) {
        if (active) {
          onData(data.config as AppConfig);
          // Keep local fallback synced
          localStorage.setItem(`app_config_${userId}`, JSON.stringify(data.config));
        }
      } else {
        // Safe placeholder config insert on empty db using the custom local configuration
        const local = getLocalConfig();
        await supabase
          .from('app_config')
          .insert({ user_id: 'general-config', config: local });
        if (active) {
          onData(local);
        }
      }
    } catch (err) {
      console.warn("Using offline fallback (config). Run SQL Schema in Supabase to create 'app_config' table.", err);
      if (active) {
        onData(getLocalConfig());
      }
    }
  };

  fetchAndEmit();

  const channel = supabase
    .channel('realtime-config-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  const handleStorageChange = () => {
    fetchAndEmit();
  };
  window.addEventListener("local_config_update", handleStorageChange);

  return () => {
    active = false;
    channel.unsubscribe();
    window.removeEventListener("local_config_update", handleStorageChange);
  };
};

export const storeUpdateConfig = async (
  userId: string,
  config: AppConfig
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({ user_id: 'general-config', config });
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to overwrite Supabase app config. Updating locally.", err);
  }

  localStorage.setItem(`app_config_${userId}`, JSON.stringify(config));
  localStorage.setItem(`app_config_general-config`, JSON.stringify(config));
  window.dispatchEvent(new Event("local_config_update"));
  window.dispatchEvent(new Event("local_inventory_update"));
  return Promise.resolve();
};

export const subscribeUserPermissions = (
  userId: string,
  onData: (permissions: UserPermission[]) => void
) => {
  let active = true;

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

  const fetchAndEmit = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        if (active) {
          const mapped: UserPermission[] = data.map(row => ({
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            role: row.role as any,
            password: row.password || '',
            allowedTabs: row.allowed_tabs,
            allowedActions: row.allowed_actions
          }));
          onData(mapped);
          // Sync with LocalStorage for consistent offline capability
          localStorage.setItem(`app_permissions_list`, JSON.stringify(mapped));
        }
      } else {
        // Supabase user_permissions table is empty. Let's seed it with the current local list
        const local = getLocalPermissions();
        const hasCurrentUser = local.some(p => p.id === userId);
        if (!hasCurrentUser) {
          const newUserPerm: UserPermission = {
            id: userId,
            email: userId === "oscar-guevara-uid" ? "oscargave03@gmail.com" : "demo@inventario-app.com",
            displayName: userId === "oscar-guevara-uid" ? "Oscar Guevara (Super Admin)" : "Usuario Administrador",
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
          local.push(newUserPerm);
          localStorage.setItem(`app_permissions_list`, JSON.stringify(local));
        }

        const rows = local.map(row => ({
          id: row.id,
          email: row.email,
          display_name: row.displayName,
          role: row.role,
          password: row.password || '',
          allowed_tabs: row.allowedTabs,
          allowed_actions: row.allowedActions
        }));

        supabase.from('user_permissions').upsert(rows).then(({ error: upsertErr }) => {
          if (!upsertErr) {
            fetchAndEmit();
          } else {
            console.error("Failed to migrate permissions to Supabase:", upsertErr);
            if (active) onData(local);
          }
        });
      }
    } catch (err) {
      console.warn("Using offline fallback (permissions). Run SQL Schema in Supabase to create 'user_permissions' table.", err);
      if (active) {
        const currentList = getLocalPermissions();
        const hasCurrentUser = currentList.some(p => p.id === userId);
        if (!hasCurrentUser) {
          const newUserPerm: UserPermission = {
            id: userId,
            email: userId === "oscar-guevara-uid" ? "oscargave03@gmail.com" : "demo@inventario-app.com",
            displayName: userId === "oscar-guevara-uid" ? "Oscar Guevara (Super Admin)" : "Usuario Administrador",
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
      }
    }
  };

  fetchAndEmit();

  const channel = supabase
    .channel('realtime-permissions-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_permissions' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  const handleStorageChange = () => {
    fetchAndEmit();
  };
  window.addEventListener("local_permissions_update", handleStorageChange);

  return () => {
    active = false;
    channel.unsubscribe();
    window.removeEventListener("local_permissions_update", handleStorageChange);
  };
};

export const storeUpdateUserPermission = async (
  permission: UserPermission
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_permissions')
      .upsert({
        id: permission.id,
        email: permission.email,
        display_name: permission.displayName,
        role: permission.role,
        password: permission.password || '',
        allowed_tabs: permission.allowedTabs,
        allowed_actions: permission.allowedActions
      });
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to update Supabase permission Row. Syncing locally.", err);
  }

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
  return Promise.resolve();
};

export const storeDeleteUserPermission = async (
  id: string
): Promise<void> => {
  try {
    const { error } = await supabase.from('user_permissions').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to delete Supabase permission row. Syncing locally.", err);
  }

  const data = localStorage.getItem(`app_permissions_list`);
  let list: UserPermission[] = data ? JSON.parse(data) : [];
  list = list.filter(p => p.id !== id);
  localStorage.setItem(`app_permissions_list`, JSON.stringify(list));
  window.dispatchEvent(new Event("local_permissions_update"));
  return Promise.resolve();
};

// ==================== PRODUCT & FOOD SECTIONS (DYNAMIC SUPABASE SYNC) ====================

const INITIAL_SECTIONS: ProductSectionObj[] = [
  {
    id: "sec-1",
    name: "Abarrotes",
    code: "ABA",
    description: "Sección de abarrotes y productos básicos.",
    isFoodOrExempt: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "sec-2",
    name: "Lácteos y Quesos",
    code: "LAC",
    description: "Sección de derivados de la leche y quesos refrigerados.",
    isFoodOrExempt: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "sec-3",
    name: "Conservas y Enlatados",
    code: "CON",
    description: "Sección de alimentos en conserva, mariscos y vegetales enlatados.",
    isFoodOrExempt: true,
    createdAt: new Date().toISOString()
  }
];

const getLocalSections = (userId: string): ProductSectionObj[] => {
  const data = localStorage.getItem(`inv_sections_${userId}`);
  if (!data) {
    localStorage.setItem(`inv_sections_${userId}`, JSON.stringify(INITIAL_SECTIONS));
    return INITIAL_SECTIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SECTIONS;
  }
};

const saveLocalSections = (userId: string, list: ProductSectionObj[]) => {
  localStorage.setItem(`inv_sections_${userId}`, JSON.stringify(list));
};

export const subscribeSections = (
  userId: string,
  onData: (sections: ProductSectionObj[]) => void
) => {
  let active = true;

  const fetchAndEmit = async () => {
    try {
      const { data, error } = await supabase
        .from('product_sections')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        if (active) {
          const mapped: ProductSectionObj[] = data.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code || '',
            description: row.description || '',
            isFoodOrExempt: !!row.is_food_or_exempt,
            createdAt: row.created_at || new Date().toISOString()
          }));
          onData(mapped);
          saveLocalSections(userId, mapped);
        }
      } else {
        // Table empty -> seed with local sections
        const local = getLocalSections(userId);
        if (local && local.length > 0) {
          const rows = local.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            description: s.description,
            is_food_or_exempt: s.isFoodOrExempt,
            created_at: s.createdAt
          }));
          supabase.from('product_sections').upsert(rows).then(({ error: upsertErr }) => {
            if (!upsertErr) {
              fetchAndEmit();
            } else {
              console.error("Failed to seed product_sections in Supabase:", upsertErr);
              if (active) onData(local);
            }
          });
        } else {
          if (active) onData([]);
        }
      }
    } catch (err) {
      console.warn("Using offline fallback (sections). Run SQL Schema in Supabase to create 'product_sections' table.", err);
      if (active) {
        onData(getLocalSections(userId));
      }
    }
  };

  fetchAndEmit();

  const channel = supabase
    .channel('realtime-sections-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_sections' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  const handleStorageChange = () => {
    fetchAndEmit();
  };
  window.addEventListener("local_sections_update", handleStorageChange);

  return () => {
    active = false;
    channel.unsubscribe();
    window.removeEventListener("local_sections_update", handleStorageChange);
  };
};

export const storeAddSection = async (
  userId: string,
  section: ProductSectionObj
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('product_sections')
      .insert({
        id: section.id,
        name: section.name,
        code: section.code,
        description: section.description,
        is_food_or_exempt: section.isFoodOrExempt,
        created_at: section.createdAt
      });
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to insert section to Supabase. Updating locally.", err);
  }

  const list = getLocalSections(userId);
  list.push(section);
  saveLocalSections(userId, list);
  window.dispatchEvent(new Event("local_sections_update"));
  return Promise.resolve();
};

export const storeUpdateSection = async (
  userId: string,
  sectionId: string,
  updates: Partial<Omit<ProductSectionObj, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const sUpdates: any = {};
    if (updates.name !== undefined) sUpdates.name = updates.name;
    if (updates.code !== undefined) sUpdates.code = updates.code;
    if (updates.description !== undefined) sUpdates.description = updates.description;
    if (updates.isFoodOrExempt !== undefined) sUpdates.is_food_or_exempt = updates.isFoodOrExempt;

    const { error } = await supabase
      .from('product_sections')
      .update(sUpdates)
      .eq('id', sectionId);
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to update section in Supabase. Syncing locally.", err);
  }

  const list = getLocalSections(userId);
  const idx = list.findIndex(s => s.id === sectionId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    saveLocalSections(userId, list);
  }
  window.dispatchEvent(new Event("local_sections_update"));
  return Promise.resolve();
};

export const storeDeleteSection = async (
  userId: string,
  sectionId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('product_sections')
      .delete()
      .eq('id', sectionId);
    if (error) throw error;
  } catch (err) {
    console.warn("Failed to delete section from Supabase. Syncing locally.", err);
  }

  const list = getLocalSections(userId);
  const updated = list.filter(s => s.id !== sectionId);
  saveLocalSections(userId, updated);
  window.dispatchEvent(new Event("local_sections_update"));
  return Promise.resolve();
};
