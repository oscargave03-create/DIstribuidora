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
  ShoppingCart,
  Lock,
  Unlock,
  Menu,
  Store,
  Boxes,
  Coffee,
  ShoppingBag,
  TrendingUp,
  Wrench
} from 'lucide-react';

export const appBrandingIcons: Record<string, any> = {
  Package,
  Store,
  Boxes,
  Database,
  Coffee,
  ShoppingBag,
  TrendingUp,
  Wrench,
  Layers,
  ShoppingCart,
  ShieldCheck
};

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
  storeDeleteUserPermission,
  subscribeSections,
  storeAddSection,
  storeUpdateSection,
  storeDeleteSection
} from './db/store';
import { isConfigured } from './firebase';
import { isSupabaseConfigured } from './supabaseClient';
import { Product, StockHistory, UserSession, AppConfig, UserPermission, ProductSectionObj } from './types';

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
  const [sections, setSections] = useState<ProductSectionObj[]>([]);

  // Config and permissions lists
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [allPermissionsList, setAllPermissionsList] = useState<UserPermission[]>([]);

  // Navigation tab selection
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'pos' | 'alerts' | 'reports' | 'admin'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modular modals open-indicators
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null); // Custom visual confirmation

  // Dynamic theme colors & modes effect
  useEffect(() => {
    const theme = appConfig?.themeColor || 'teal';
    const mode = appConfig?.themeMode || 'dark';

    const presets: Record<string, { brand400: string; brand500: string; muted: string; border: string }> = {
      teal: { brand400: '#2dd4bf', brand500: '#14b8a6', muted: 'rgba(45, 212, 191, 0.1)', border: 'rgba(45, 212, 191, 0.15)' },
      blue: { brand400: '#60a5fa', brand500: '#3b82f6', muted: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.15)' },
      emerald: { brand400: '#34d399', brand500: '#10b981', muted: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.15)' },
      amber: { brand400: '#fbbf24', brand500: '#f59e0b', muted: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.15)' },
      rose: { brand400: '#fb7185', brand500: '#f43f5e', muted: 'rgba(251, 113, 133, 0.1)', border: 'rgba(251, 113, 133, 0.15)' },
      indigo: { brand400: '#818cf8', brand500: '#6366f1', muted: 'rgba(129, 140, 248, 0.1)', border: 'rgba(129, 140, 248, 0.15)' },
      purple: { brand400: '#c084fc', brand500: '#a855f7', muted: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.15)' },
      orange: { brand400: '#fb923c', brand500: '#f97316', muted: 'rgba(251, 146, 60, 0.1)', border: 'rgba(251, 146, 60, 0.15)' },
      sky: { brand400: '#38bdf8', brand500: '#0ea5e9', muted: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.15)' },
    };

    const sel = presets[theme] || presets.teal;
    const r = document.documentElement;
    
    // Set brand color parameters
    r.style.setProperty('--color-brand-400', sel.brand400);
    r.style.setProperty('--color-brand-500', sel.brand500);
    r.style.setProperty('--color-brand-muted-val', sel.muted);
    r.style.setProperty('--color-brand-border-val', sel.border);

    // Set mode CSS Variables
    const modeConfigs: Record<string, Record<string, string>> = {
      dark: {
        '--bg-slate-950': '#020617',
        '--bg-slate-900': '#090d16',
        '--bg-slate-850': '#151e2e',
        '--bg-slate-800': '#1e293b',
        '--text-white': '#ffffff',
        '--text-slate-100': '#f1f5f9',
        '--text-slate-200': '#e2e8f0',
        '--text-slate-300': '#cbd5e1',
        '--text-slate-350': '#cbd5e1',
        '--text-slate-400': '#94a3b8',
        '--text-slate-450': '#64748b',
        '--text-slate-500': '#64748b',
        '--text-slate-550': '#475569',
        '--text-slate-600': '#334155',
        '--text-slate-650': '#1e293b',
      },
      dim: {
        '--bg-slate-950': '#13110f',
        '--bg-slate-900': '#1c1916',
        '--bg-slate-850': '#27231e',
        '--bg-slate-800': '#332d28',
        '--text-white': '#fdfaf2',
        '--text-slate-100': '#f1e8dc',
        '--text-slate-200': '#e3d7c7',
        '--text-slate-300': '#cbbaa6',
        '--text-slate-350': '#bea992',
        '--text-slate-400': '#aa9885',
        '--text-slate-450': '#8d7e6d',
        '--text-slate-500': '#7d7060',
        '--text-slate-550': '#6d6153',
        '--text-slate-600': '#5d5246',
        '--text-slate-650': '#4d4339',
      },
      light: {
        '--bg-slate-950': '#f3f4f6',
        '--bg-slate-900': '#ffffff',
        '--bg-slate-850': '#e5e7eb',
        '--bg-slate-800': '#d1d5db',
        '--text-white': '#0f172a',
        '--text-slate-100': '#1f2937',
        '--text-slate-200': '#374151',
        '--text-slate-300': '#4b5563',
        '--text-slate-350': '#4b5563',
        '--text-slate-400': '#6b7280',
        '--text-slate-450': '#4b5563',
        '--text-slate-550': '#6b7280',
        '--text-slate-500': '#6b7280',
        '--text-slate-600': '#9ca3af',
        '--text-slate-650': '#d1d5db',
      }
    };

    const selMode = modeConfigs[mode] || modeConfigs.dark;
    Object.entries(selMode).forEach(([key, val]) => {
      r.style.setProperty(key, val);
    });
  }, [appConfig?.themeColor, appConfig?.themeMode]);

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

  // Real-time settings synchronization hook (always active to load login screen styling!)
  useEffect(() => {
    const configUserId = user?.uid || 'general-config';
    const unsubConfig = subscribeConfig(configUserId, (config) => {
      setAppConfig(config);
    });

    return () => {
      unsubConfig();
    };
  }, [user?.uid]);

  // Real-time sections synchronization hook
  useEffect(() => {
    if (!user) {
      setSections([]);
      return;
    }

    const unsubSections = subscribeSections(user.uid, (data) => {
      setSections(data);
    });

    return () => {
      unsubSections();
    };
  }, [user]);

  // Real-time permissions synchronization hook
  useEffect(() => {
    if (!user) {
      setAllPermissionsList([]);
      return;
    }

    const unsubPerms = subscribeUserPermissions(user.uid, (perms) => {
      setAllPermissionsList(perms);
    });

    return () => {
      unsubPerms();
    };
  }, [user]);

  // Aggregate low-stock alerts
  const activeAlertsCount = useMemo(() => {
    return products.filter(p => p.quantity <= p.minQuantity).length;
  }, [products]);

  // Dynamic products & food categories synced from our Supabase tables
  const dynamicCategories = useMemo(() => {
    return sections.length > 0 ? sections.map(s => s.name) : (appConfig?.categories || []);
  }, [sections, appConfig?.categories]);

  // Memoized user-level granular authorizations
  const isSuperAdmin = useMemo(() => {
    return !!(user && user.email?.toLowerCase() === 'oscargave03@gmail.com');
  }, [user]);

  const userPermissions = useMemo<UserPermission | null>(() => {
    if (!user) return null;
    return allPermissionsList.find(p => p.id === user.uid) || 
           allPermissionsList.find(p => p.email.toLowerCase() === user.email.toLowerCase()) || 
           null;
  }, [user, allPermissionsList]);

  const activeAllowedTabs = useMemo(() => {
    if (isSuperAdmin) {
      return {
        dashboard: true,
        pos: true,
        alerts: true,
        reports: true,
        admin: true
      };
    }
    return userPermissions?.allowedTabs || {
      dashboard: true,
      pos: true,
      alerts: true,
      reports: true,
      admin: false
    };
  }, [userPermissions, isSuperAdmin]);

  const activeAllowedActions = useMemo(() => {
    if (isSuperAdmin) {
      return {
        create_product: true,
        edit_product: true,
        delete_product: true,
        adjust_stock: true,
        process_sale: true
      };
    }
    return userPermissions?.allowedActions || {
      create_product: true,
      edit_product: true,
      delete_product: true,
      adjust_stock: true,
      process_sale: true
    };
  }, [userPermissions, isSuperAdmin]);

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
    return <LoginView onLoginSuccess={(u) => setUser(u)} config={appConfig || undefined} />;
  }

  // Trial / demo lock-out block screen
  if (appConfig?.isBlocked && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center antialiased select-none">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient light indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 blur-sm" />
          
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/5 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">
            SISTEMA SUSPENDIDO
          </h2>
          <span className="text-[10px] text-rose-450 font-black mb-6 tracking-widest uppercase bg-rose-500/10 py-1.5 px-3 rounded-full inline-block border border-rose-500/10">
            Período de Demostración Finalizado
          </span>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            El tiempo de prueba programado para esta entidad o empresa ha culminado, o el servicio ha sido suspendido temporalmente por el administrador / distribuidor del software.
          </p>

          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-left space-y-3 mb-6">
            <h3 className="text-[10px] font-bold text-slate-450 tracking-wider uppercase border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Contacto de Soporte y Licencias
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-550">Soporte Técnico:</span>
                <span className="font-semibold text-slate-205">Oscar Guevara</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-550">Correo de Contacto:</span>
                <span className="font-mono font-semibold text-brand select-all">oscargave03@gmail.com</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2 mt-2">
                <span className="text-slate-550">Empresa / Entidad:</span>
                <span className="font-semibold text-slate-300 truncate max-w-[170px]">{appConfig?.companyName || "Distribuidora"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full h-11 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 font-mono mt-8 uppercase">
          Plataforma de Inventarios y kardex &copy; {new Date().getFullYear()}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-brand selection:text-slate-900 overflow-x-hidden relative">
      
      {/* Premium Unique Background Ambient Halos */}
      <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-brand/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[350px] rounded-full bg-brand/5 blur-[130px] pointer-events-none z-0" />

      {/* Mobile Drawer Navigation (Slide-out from left) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              style={{ contentVisibility: 'auto' }}
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full bg-slate-900 border-r border-slate-850/95 p-6 flex flex-col shadow-2xl z-10 overflow-y-auto"
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-5 mb-6">
                <div className="flex items-center gap-2.5">
                  {appConfig?.systemLogoType === 'image' && appConfig?.logoUrl ? (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-950 border border-slate-850 shadow-sm shrink-0">
                      <img 
                        src={appConfig.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (() => {
                    const SystemBrandIcon = appBrandingIcons[appConfig?.systemIconName || 'Package'] || Package;
                    return (
                      <div className="relative w-8 h-8 bg-gradient-to-tr from-brand to-brand-hover rounded-lg flex items-center justify-center shadow-md shadow-brand/10 shrink-0">
                        <SystemBrandIcon className="w-4.5 h-4.5 text-slate-950 stroke-[2.2px]" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-xs font-black text-white tracking-wide uppercase font-display">
                      {appConfig?.systemTitle || "Inventario"}
                    </h2>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      Menú de Navegación
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Cerrar menú"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation list in drawer */}
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Módulos del Sistema</span>
                
                {activeAllowedTabs.dashboard && (
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-bold text-left ${
                      activeTab === 'dashboard'
                        ? 'bg-brand/10 text-brand border border-brand/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                    <span>Panel Almacén</span>
                  </button>
                )}

                {activeAllowedTabs.pos && (
                  <button
                    onClick={() => {
                      setActiveTab('pos');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-bold text-left ${
                      activeTab === 'pos'
                        ? 'bg-brand/10 text-brand border border-brand/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                    }`}
                  >
                    <ShoppingCart className="w-4.5 h-4.5 shrink-0" />
                    <span>Caja / POS</span>
                  </button>
                )}

                {activeAllowedTabs.alerts && (
                  <button
                    onClick={() => {
                      setActiveTab('alerts');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-bold text-left relative ${
                      activeTab === 'alerts'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                    }`}
                  >
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span>Alertas de Stock</span>
                    {activeAlertsCount > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-[#ffffff] text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm border border-rose-600/20">
                        {activeAlertsCount}
                      </span>
                    )}
                  </button>
                )}

                {activeAllowedTabs.reports && (
                  <button
                    onClick={() => {
                      setActiveTab('reports');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-bold text-left ${
                      activeTab === 'reports'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5 shrink-0" />
                    <span>Reportes / Kárdex</span>
                  </button>
                )}

                {activeAllowedTabs.admin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-bold text-left ${
                      activeTab === 'admin'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                    }`}
                  >
                    <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                    <span>Admin</span>
                  </button>
                )}
              </div>

              {/* User info at bottom */}
              <div className="border-t border-slate-850 pt-5 mt-auto space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 bg-brand-muted rounded-full flex items-center justify-center text-brand shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <span className="text-xs font-bold text-white block leading-tight truncate">{user.displayName}</span>
                    <span className="text-[9px] font-mono text-slate-500 block leading-none truncate">{user.email}</span>
                  </div>
                </div>

                <div className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono border select-none bg-slate-950/40 text-slate-400 border-slate-850">
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSupabaseConfigured ? "Supabase Online" : "Local Storage"}</span>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upper Navigation Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu trigger for mobile/tablet viewports */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex lg:hidden items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {appConfig?.systemLogoType === 'image' && appConfig?.logoUrl ? (
              <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-800 shadow-md">
                <img 
                  src={appConfig.logoUrl} 
                  alt="App Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (() => {
              const SystemBrandIcon = appBrandingIcons[appConfig?.systemIconName || 'Package'] || Package;
              return (
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-brand to-brand-hover opacity-30 blur-[6px] group-hover:opacity-75 transition duration-500" />
                  <div className="relative w-9 h-9 bg-gradient-to-tr from-brand to-brand-hover rounded-xl flex items-center justify-center shadow-md shadow-brand/10">
                    <SystemBrandIcon className="w-5 h-5 text-slate-950 stroke-[2.2px]" />
                  </div>
                </div>
              );
            })()}
            <div>
              <h1 className="text-sm font-black text-white tracking-wide font-display">
                {appConfig?.systemTitle || "Catálogo de Inventario"}
              </h1>
              <span className="text-[10px] text-slate-550 font-mono tracking-wider block">
                {appConfig?.systemSubtitle || "Ctrl. de Stock"}
              </span>
            </div>
          </div>

          {/* Center Tabs Control - Hidden on mobile/tablets, shown on lg+ screens */}
          <nav className="hidden lg:flex items-center bg-slate-900/90 p-1 border border-slate-850/80 rounded-2xl text-xs font-semibold gap-1 z-10 shadow-lg">
            {activeAllowedTabs.dashboard && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-950 text-brand font-black border border-brand/20 shadow-md shadow-brand/5 scale-[1.02]' 
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
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'pos' 
                    ? 'bg-slate-950 text-brand font-black border border-brand/20 shadow-md shadow-brand/5 scale-[1.02]' 
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
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer relative ${
                  activeTab === 'alerts' 
                    ? 'bg-slate-950 text-amber-400 font-black border border-amber-500/20 shadow-md shadow-amber-500/5 scale-[1.02]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas de Stock</span>
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[#ffffff] text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm border border-rose-600/20">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            )}
            
            {activeAllowedTabs.reports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'reports' 
                    ? 'bg-slate-950 text-indigo-400 font-black border border-indigo-500/20 shadow-md shadow-indigo-500/5 scale-[1.02]' 
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
                className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-slate-950 text-emerald-400 font-black border border-emerald-500/20 shadow-md shadow-emerald-500/5 scale-[1.02]' 
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
            {isSuperAdmin && (
              <button
                onClick={async () => {
                  if (appConfig) {
                    await storeUpdateConfig(user.uid, {
                      ...appConfig,
                      isBlocked: !appConfig.isBlocked
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2.5 rounded-xl text-[11px] md:text-xs font-extrabold transition-all cursor-pointer border select-none ${
                  appConfig?.isBlocked
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/35 hover:bg-rose-500/25'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
                title={appConfig?.isBlocked ? "Haga clic para DESBLOQUEAR la app para todos" : "Haga clic para BLOQUEAR la app en modo de prueba"}
              >
                {appConfig?.isBlocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span className="hidden lg:inline">DEMO SUSPENDIDA</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden lg:inline">DEMO ACTIVA</span>
                  </>
                )}
              </button>
            )}

            {/* Database connection badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono border select-none ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
            }`}
            title={isSupabaseConfigured ? "Conectado a la base de datos central de Supabase" : "La base de datos Supabase no está configurada en las variables de entorno de Vercel. Los datos actuales solo se guardan localmente en su navegador."}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isSupabaseConfigured ? "En línea (Supabase)" : "Offline (Local)"}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2.5 bg-slate-900 border border-slate-850 px-3.5 py-1.5 rounded-2xl">
              <div className="w-7 h-7 bg-brand-muted rounded-full flex items-center justify-center text-brand">
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

      {/* Global alert bar visible only to Oscar when system is locked */}
      {isSuperAdmin && appConfig?.isBlocked && (
        <div className="bg-rose-950 text-[#ffffff] px-4 py-3 text-xs font-medium flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-rose-900 shadow-lg select-none">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-center sm:text-left text-rose-100 font-bold">
              <strong className="text-[#ffffff]">¡ALERTA OSCAR (REPRESENTANTE):</strong> Has activado el <span className="text-rose-400 font-bold underline">BLOQUEO DE DEMOSTRACIÓN</span>. Los terminales ordinarios y cajeros están suspendidos.
            </span>
          </div>
          <button
            onClick={async () => {
              if (appConfig) {
                await storeUpdateConfig(user.uid, {
                  ...appConfig,
                  isBlocked: false
                });
              }
            }}
            className="bg-[#ffffff] hover:bg-neutral-100 text-rose-950 px-4 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer shadow-md shrink-0 flex items-center gap-1.5 border border-rose-900/10"
          >
            <Unlock className="w-3.5 h-3.5 text-rose-950" />
            <span>DESBLOQUEAR AHORA</span>
          </button>
        </div>
      )}

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
                categoriesList={dynamicCategories}
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
                products={products}
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
                sections={sections}
                onAddSection={async (sec) => {
                  await storeAddSection(user.uid, sec);
                }}
                onUpdateSection={async (id, updates) => {
                  await storeUpdateSection(user.uid, id, updates);
                }}
                onDeleteSection={async (id) => {
                  await storeDeleteSection(user.uid, id);
                }}
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
        categoriesList={dynamicCategories}
      />

      {/* 2. Edit Product modal */}
      <ProductFormModal 
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={handleEditProductSubmit}
        product={editingProduct}
        categoriesList={dynamicCategories}
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
