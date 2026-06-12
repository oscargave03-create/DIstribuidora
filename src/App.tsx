/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  LogOut, 
  AlertTriangle, 
  FileText, 
  LayoutDashboard, 
  Database, 
  ChevronRight,
  ShieldCheck,
  User,
  Info,
  Layers,
  X,
  Trash2,
  ShoppingCart
} from 'lucide-react';

import { 
  observeAuth, 
  logoutUser, 
  subscribeProducts, 
  subscribeHistory,
  storeAddProduct,
  storeUpdateProduct,
  storeDeleteProduct,
  testFirebaseConnection,
  subscribeConfig,
  storeUpdateConfig,
  subscribeUserPermissions,
  storeUpdateUserPermission,
  storeDeleteUserPermission
} from './db/store';
import { isConfigured } from './firebase';
import { Product, StockHistory, UserSession, AppConfig, UserPermission } from './types';

// Page views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import PointOfSaleView from './components/PointOfSaleView';
import AlertsManager from './components/AlertsManager';
import ReportsView from './components/ReportsView';
import AdminPanel from './components/AdminPanel';

// Modals
import ProductFormModal from './components/ProductFormModal';
import StockAdjustmentModal from './components/StockAdjustmentModal';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time data lists
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);

  // Config and permissions lists
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [allPermissionsList, setAllPermissionsList] = useState<UserPermission[]>([]);

  // Navigation tab selection
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'pos' | 'alerts' | 'reports' | 'admin'>('dashboard');

  // Modular modals open-indicators
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null); // Custom visual confirmation

  // Auth synchronization hook
  useEffect(() => {
    const unsub = observeAuth((session) => {
      setUser(session);
      setAuthLoading(false);
    });

    // Run connection test if Firebase is active
    if (isConfigured) {
      testFirebaseConnection();
    }

    return () => unsub();
  }, []);

  // Real-time Database synchronization hook (Products + Kardex Historial movements)
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setHistory([]);
      return;
    }

    const unsubProducts = subscribeProducts(
      user.uid, 
      (data) => setProducts(data),
      (err) => console.error("Realtime Products error:", err)
    );

    const unsubHistory = subscribeHistory(
      user.uid, 
      (data) => setHistory(data),
      (err) => console.error("Realtime History error:", err)
    );

    return () => {
      unsubProducts();
      unsubHistory();
    };
  }, [user]);

  // Real-time settings and permissions synchronization hook
  useEffect(() => {
    if (!user) {
      setAppConfig(null);
      setAllPermissionsList([]);
      return;
    }

    const unsubConfig = subscribeConfig(user.uid, (config) => {
      setAppConfig(config);
    });

    const unsubPerms = subscribeUserPermissions(user.uid, (perms) => {
      setAllPermissionsList(perms);
    });

    return () => {
      unsubConfig();
      unsubPerms();
    };
  }, [user]);

  // Aggregate low-stock alerts
  const activeAlertsCount = useMemo(() => {
    return products.filter(p => p.quantity <= p.minQuantity).length;
  }, [products]);

  // Memoized user-level granular authorizations
  const userPermissions = useMemo<UserPermission | null>(() => {
    if (!user) return null;
    return allPermissionsList.find(p => p.id === user.uid) || 
           allPermissionsList.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || 
           null;
  }, [user, allPermissionsList]);

  const activeAllowedTabs = useMemo(() => {
    return userPermissions?.allowedTabs || {
      dashboard: true,
      pos: true,
      alerts: true,
      reports: true,
      admin: false
    };
  }, [userPermissions]);

  const activeAllowedActions = useMemo(() => {
    return userPermissions?.allowedActions || {
      create_product: true,
      edit_product: true,
      delete_product: true,
      adjust_stock: true,
      process_sale: true
    };
  }, [userPermissions]);

  // Safety tab authorization check
  useEffect(() => {
    if (!user) return;
    const permitted: ('dashboard' | 'pos' | 'alerts' | 'reports' | 'admin')[] = [];
    if (activeAllowedTabs.dashboard) permitted.push('dashboard');
    if (activeAllowedTabs.pos) permitted.push('pos');
    if (activeAllowedTabs.alerts) permitted.push('alerts');
    if (activeAllowedTabs.reports) permitted.push('reports');
    if (activeAllowedTabs.admin) permitted.push('admin');

    if (permitted.length > 0 && !permitted.includes(activeTab)) {
      setActiveTab(permitted[0]);
    }
  }, [activeAllowedTabs, activeTab, user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // -----------------------------------------
  // CRUD store triggers
  // -----------------------------------------
  const handleAddProductSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) return;
    await storeAddProduct(user.uid, user.displayName, data);
  };

  const handleEditProductSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user || !editingProduct) return;
    await storeUpdateProduct(user.uid, user.displayName, editingProduct.id, data);
    setEditingProduct(null);
  };

  const handleQuickAdjustConfirm = async (
    productId: string, 
    updates: Partial<Product>, 
    adjustReason: { changeAmount: number, notes: string }
  ) => {
    if (!user) return;
    await storeUpdateProduct(user.uid, user.displayName, productId, updates, adjustReason);
    setAdjustingProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingProduct) return;
    await storeDeleteProduct(user.uid, user.displayName, deletingProduct.id, deletingProduct.name);
    setDeletingProduct(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-450 font-mono tracking-wider">Iniciando Sistema de Inventario...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-slate-900">
      
      {/* Upper Navigation Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/10">
              <Package className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide font-display">
                {appConfig?.systemTitle || "Catálogo de Inventario"}
              </h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider block">
                {appConfig?.systemSubtitle || "Ctrl. de Stock"}
              </span>
            </div>
          </div>

          {/* Center Tabs Control */}
          <nav className="flex items-center bg-slate-900 p-1 border border-slate-850 rounded-2xl text-xs font-semibold gap-1">
            {activeAllowedTabs.dashboard && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Panel Almacén</span>
              </button>
            )}

            {activeAllowedTabs.pos && (
              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'pos' 
                    ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Caja / POS</span>
              </button>
            )}
            
            {activeAllowedTabs.alerts && (
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer relative ${
                  activeTab === 'alerts' 
                    ? 'bg-slate-950 text-amber-400 font-bold border border-amber-500/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas de Stock</span>
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            )}
            
            {activeAllowedTabs.reports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'reports' 
                    ? 'bg-slate-950 text-indigo-400 font-bold border border-indigo-500/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Reportes / Kárdex</span>
              </button>
            )}

            {activeAllowedTabs.admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-slate-950 text-emerald-400 font-bold border border-emerald-500/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </nav>

          {/* Right User account settings block */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2.5 bg-slate-900 border border-slate-850 px-3.5 py-1.5 rounded-2xl">
              <div className="w-7 h-7 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-tight">{user.displayName}</span>
                <span className="text-[9px] font-mono text-slate-500 block leading-none">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                products={products}
                onAddProduct={() => setShowAddModal(true)}
                onEditProduct={(p) => setEditingProduct(p)}
                onDeleteProduct={(p) => setDeletingProduct(p)}
                onQuickAdjust={(p) => setAdjustingProduct(p)}
                activeAlertsCount={activeAlertsCount}
                categoriesList={appConfig?.categories || []}
                allowedActions={activeAllowedActions}
              />
            )}

            {activeTab === 'pos' && (
              <PointOfSaleView 
                products={products}
                onSellProduct={async (prodId, newQty, reason) => {
                  await handleQuickAdjustConfirm(prodId, { quantity: newQty }, reason);
                }}
                config={appConfig || undefined}
                allowedActions={activeAllowedActions}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsManager 
                products={products}
                onOpenReplenish={(p) => setAdjustingProduct(p)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView 
                products={products}
                history={history}
                config={appConfig || undefined}
              />
            )}

            {activeTab === 'admin' && appConfig && (
              <AdminPanel 
                config={appConfig}
                onUpdateConfig={async (newConfig) => {
                  await storeUpdateConfig(user.uid, newConfig);
                }}
                permissions={allPermissionsList}
                onUpdatePermission={async (p) => {
                  await storeUpdateUserPermission(p);
                }}
                onDeletePermission={async (id) => {
                  await storeDeleteUserPermission(id);
                }}
                currentUserUid={user.uid}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer detailing system connection status and humility */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-550">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Reglas de Acceso Estrictas e Inmutabilidad de Kárdex activas.</span>
          </div>

          {/* Firebase engine runtime states indicator */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {isConfigured ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 rounded-full font-bold">
                <Database className="w-3.5 h-3.5" />
                FIRESTORE EN VIVO ACTIVO
              </span>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/25 text-teal-400 rounded-full font-bold self-start md:self-auto">
                  <Database className="w-3.5 h-3.5" />
                  PERSISTENCIA DE DATOS DE ALMACÉN LOCAL ACTIVO
                </span>
                <span className="hidden md:inline text-slate-650">|</span>
                <span className="text-slate-600 text-[9px]">En espera de asignaciones del Cloud Firebase en la UI del panel.</span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Modals and Forms */}
      
      {/* 1. Add Product modal */}
      <ProductFormModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddProductSubmit}
        product={null}
        categoriesList={appConfig?.categories || []}
      />

      {/* 2. Edit Product modal */}
      <ProductFormModal 
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={handleEditProductSubmit}
        product={editingProduct}
        categoriesList={appConfig?.categories || []}
      />

      {/* 3. Stock Adjustment replenishment dialog */}
      <StockAdjustmentModal 
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        onConfirm={handleQuickAdjustConfirm}
      />

      {/* 4. Complete secure overlay custom confirm delete dialog */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingProduct(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden z-10 space-y-4"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white font-display">¿Dar de baja producto?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Esta acción desactivará permanentemente <span className="text-slate-200 font-bold">&#34;{deletingProduct.name}&#34;</span> (SKU: {deletingProduct.sku}) del kárdex activo.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 text-[10px] text-slate-500 leading-normal">
                Esta remoción se registrará con firma inmutable de auditoría para fines supervisorios.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Confirmar Baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
