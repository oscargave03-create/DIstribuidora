import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Layers, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Save, 
  UserPlus, 
  Percent, 
  ShieldAlert, 
  Info,
  Type,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Upload,
  Image,
  Lock,
  Unlock,
  Palette,
  Moon,
  Eye,
  Sun,
  Package,
  Store,
  Boxes,
  Database,
  Coffee,
  ShoppingBag,
  TrendingUp,
  Wrench,
  ShoppingCart,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Hash,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { AppConfig, UserPermission, ProductSectionObj } from '../types';
import { isSupabaseConfigured } from '../supabaseClient';

interface AdminPanelProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => Promise<void>;
  permissions: UserPermission[];
  onUpdatePermission: (p: UserPermission) => Promise<void>;
  onDeletePermission: (id: string) => Promise<void>;
  currentUserUid: string;
  products?: any[]; // Allow optional product tracking list for counting items in table
  sections?: ProductSectionObj[];
  onAddSection?: (sec: ProductSectionObj) => Promise<void>;
  onUpdateSection?: (id: string, updates: Partial<ProductSectionObj>) => Promise<void>;
  onDeleteSection?: (id: string) => Promise<void>;
}

export default function AdminPanel({
  config,
  onUpdateConfig,
  permissions,
  onUpdatePermission,
  onDeletePermission,
  currentUserUid,
  products = [],
  sections = [],
  onAddSection,
  onUpdateSection,
  onDeleteSection
}: AdminPanelProps) {
  // Tabs within administration
  const [subTab, setSubTab] = useState<'system' | 'categories' | 'users'>('system');

  const isSuperAdmin = permissions.find(p => p.id === currentUserUid)?.email.toLowerCase() === 'oscargave03@gmail.com';

  // Load configs local states
  const [systemTitle, setSystemTitle] = useState(config.systemTitle);
  const [systemSubtitle, setSystemSubtitle] = useState(config.systemSubtitle);
  const [systemLogoType, setSystemLogoType] = useState<'icon' | 'image'>(config.systemLogoType || 'icon');
  const [systemIconName, setSystemIconName] = useState<string>(config.systemIconName || 'Package');
  const [companyName, setCompanyName] = useState(config.companyName);
  const [ruc, setRuc] = useState(config.ruc);
  const [telephone, setTelephone] = useState(config.telephone);
  const [address, setAddress] = useState(config.address);
  const [receiptFooter, setReceiptFooter] = useState(config.receiptFooter);
  const [receiptAd, setReceiptAd] = useState(config.receiptAd);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const [themeColor, setThemeColor] = useState(config.themeColor || 'teal');
  const [themeMode, setThemeMode] = useState(config.themeMode || 'dark');

  // Login Customized State
  const [loginTitle, setLoginTitle] = useState(config.loginTitle || 'Sistema de Inventario');
  const [loginSubtitle, setLoginSubtitle] = useState(config.loginSubtitle || 'Control & Distribución');
  const [loginDescription, setLoginDescription] = useState(config.loginDescription || 'Aplicación de registro y control de stock rápido, despachos inmediatos y facturación electrónica integrada.');
  const [loginLogoUrl, setLoginLogoUrl] = useState(config.loginLogoUrl || '');
  const [loginThemeColor, setLoginThemeColor] = useState(config.loginThemeColor || 'teal');
  const [loginBgStyle, setLoginBgStyle] = useState(config.loginBgStyle || 'glow');
  const [loginCardStyle, setLoginCardStyle] = useState(config.loginCardStyle || 'glass');
  const [loginCardTitle, setLoginCardTitle] = useState(config.loginCardTitle || 'Acceso de Usuarios Autorizados');
  const [loginUserLabel, setLoginUserLabel] = useState(config.loginUserLabel || 'Usuario o Correo');
  const [loginPasswordLabel, setLoginPasswordLabel] = useState(config.loginPasswordLabel || 'Contraseña de Seguridad');
  const [loginButtonText, setLoginButtonText] = useState(config.loginButtonText || 'Ingresar al Sistema');
  const [loginFooterText, setLoginFooterText] = useState(config.loginFooterText || 'Mecanismo ABAC Zero-Trust Bloqueado');
  const [isDragOverLogin, setIsDragOverLogin] = useState(false);

  // Taxes
  const [generalRate, setGeneralRate] = useState(config.taxes.generalRate);
  const [liquorRate, setLiquorRate] = useState(config.taxes.liquorRate);
  const [tobaccoRate, setTobaccoRate] = useState(config.taxes.tobaccoRate);
  const [generalName, setGeneralName] = useState(config.taxes.generalName);
  const [liquorName, setLiquorName] = useState(config.taxes.liquorName);
  const [tobaccoName, setTobaccoName] = useState(config.taxes.tobaccoName);

  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Categories Local state
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatVal, setEditingCatVal] = useState('');

  // Detailed Product & Food Sections State
  const [secName, setSecName] = useState('');
  const [secCode, setSecCode] = useState('');
  const [secDescription, setSecDescription] = useState('');
  const [secIsFoodOrExempt, setSecIsFoodOrExempt] = useState(false);
  const [secSearchText, setSecSearchText] = useState('');
  const [secTypeFilter, setSecTypeFilter] = useState<'all' | 'food' | 'general'>('all');
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editingSecName, setEditingSecName] = useState('');
  const [editingSecCode, setEditingSecCode] = useState('');
  const [editingSecDescription, setEditingSecDescription] = useState('');
  const [editingSecIsFood, setEditingSecIsFood] = useState(false);

  // User details
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'supervisor' | 'cashier' | 'guest'>('cashier');

  // Editing permissions detail
  const [selectedUserPerm, setSelectedUserPerm] = useState<UserPermission | null>(null);

  // Handle configuration submit
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccess(false);

    try {
      const updated: AppConfig = {
        ...config,
        systemTitle,
        systemSubtitle,
        systemLogoType,
        systemIconName,
        companyName,
        ruc,
        telephone,
        address,
        receiptFooter,
        receiptAd,
        logoUrl,
        themeColor,
        themeMode,
        loginTitle,
        loginSubtitle,
        loginDescription,
        loginLogoUrl,
        loginThemeColor,
        loginBgStyle,
        loginCardStyle,
        loginCardTitle,
        loginUserLabel,
        loginPasswordLabel,
        loginButtonText,
        loginFooterText,
        taxes: {
          generalRate,
          liquorRate,
          tobaccoRate,
          generalName,
          liquorName,
          tobaccoName
        }
      };
      await onUpdateConfig(updated);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 4000);
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSavingConfig(false);
    }
  };

  // Helper to ensure isFood or general properties are saved synced with categories
  const getSectionsList = (): any[] => {
    if (sections && sections.length > 0) {
      return sections;
    }
    const details = config.sectionsDetail || [];
    const detailsMap = new Map(details.map(d => [d.name, d]));
    const syncedList: any[] = [];
    
    config.categories.forEach((cat, idx) => {
      if (detailsMap.has(cat)) {
        syncedList.push(detailsMap.get(cat)!);
      } else {
        const isFood = cat.toLowerCase().includes('abarrote') || 
                       cat.toLowerCase().includes('lácteo') || 
                       cat.toLowerCase().includes('lacteo') || 
                       cat.toLowerCase().includes('conserva') || 
                       cat.toLowerCase().includes('enlatado') || 
                       cat.toLowerCase().includes('panader') || 
                       cat.toLowerCase().includes('pan') || 
                       cat.toLowerCase().includes('alimento') || 
                       cat.toLowerCase().includes('bebida') ||
                       cat.toLowerCase().includes('fruta') ||
                       cat.toLowerCase().includes('verdura') ||
                       cat.toLowerCase().includes('comida');
        let code = cat.slice(0, 3).toUpperCase().replace(/\s/g, '');
        if (code.length < 2) code = cat.toUpperCase() + 'X';
        syncedList.push({
          id: `sec-${idx + 1}-${Date.now() % 1000000}`,
          name: cat,
          code: code,
          description: `Sección destinada a la clasificación y almacenamiento de ${cat.toLowerCase()}`,
          isFoodOrExempt: isFood,
          createdAt: new Date().toISOString()
        });
      }
    });
    return syncedList;
  };

  // Create Section
  const handleCreateDetailedSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim()) {
      alert("Por favor ingrese el nombre de la sección.");
      return;
    }
    const cleanName = secName.trim();
    const currentSections = getSectionsList();
    if (currentSections.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Esta sección ya existe en el sistema.");
      return;
    }

    const cleanCode = (secCode.trim() || cleanName.slice(0, 3).toUpperCase()).toUpperCase();

    const newSecObj: ProductSectionObj = {
      id: `sec-${Date.now()}`,
      name: cleanName,
      code: cleanCode,
      description: secDescription.trim() || `Sección especializada en ${cleanName}`,
      isFoodOrExempt: secIsFoodOrExempt,
      createdAt: new Date().toISOString()
    };

    if (onAddSection) {
      await onAddSection(newSecObj);
    }

    const updatedCategories = [...config.categories, cleanName];
    const updatedDetails = [...currentSections, newSecObj];

    const updated: AppConfig = {
      ...config,
      categories: updatedCategories,
      sectionsDetail: updatedDetails
    };

    await onUpdateConfig(updated);

    // Reset Form
    setSecName('');
    setSecCode('');
    setSecDescription('');
    setSecIsFoodOrExempt(false);
  };

  // Delete Section Detail
  const handleDeleteDetailedSection = async (secId: string, name: string) => {
    const currentSections = getSectionsList();
    if (currentSections.length <= 1) {
      alert("Debe haber por lo menos una sección/categoría autorizada.");
      return;
    }

    // Check if there are active products using this category in the warehouse
    const productsInCat = products.filter(p => p.category === name);
    const count = productsInCat.length;

    let confirmMsg = `¿Dar de baja la sección "${name}"?`;
    if (count > 0) {
      confirmMsg += ` ADVERTENCIA: Hay ${count} producto(s) asignado(s) a esta sección. Si la eliminas, estos productos continuarán registrados pero quedarán categorizados provisionalmente sin sección asignada.`;
    }

    if (confirm(confirmMsg)) {
      if (onDeleteSection) {
        await onDeleteSection(secId);
      }

      const updatedCategories = config.categories.filter(c => c !== name);
      const updatedDetails = currentSections.filter(s => s.id !== secId && s.name !== name);

      const updated: AppConfig = {
        ...config,
        categories: updatedCategories,
        sectionsDetail: updatedDetails
      };

      await onUpdateConfig(updated);
    }
  };

  // Trigger inline or modal edit setup
  const startEditSection = (sec: any) => {
    setEditingSecId(sec.id);
    setEditingSecName(sec.name);
    setEditingSecCode(sec.code);
    setEditingSecDescription(sec.description);
    setEditingSecIsFood(sec.isFoodOrExempt);
  };

  // Save changes for edited section
  const handleSaveEditSection = async () => {
    if (!editingSecName.trim()) {
      alert("El nombre de la sección no puede estar vacío.");
      return;
    }
    const cleanName = editingSecName.trim();
    const currentSections = getSectionsList();
    const editingSec = currentSections.find(s => s.id === editingSecId);
    if (!editingSec) return;

    // Check if renamed to something already existing (and it is not itself)
    if (cleanName.toLowerCase() !== editingSec.name.toLowerCase() && currentSections.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Ya existe otra sección con ese nombre.");
      return;
    }

    const updatedData = {
      name: cleanName,
      code: (editingSecCode.trim() || cleanName.slice(0, 3).toUpperCase()).toUpperCase(),
      description: editingSecDescription.trim(),
      isFoodOrExempt: editingSecIsFood
    };

    if (onUpdateSection) {
      await onUpdateSection(editingSecId!, updatedData);
    }

    const updatedCats = config.categories.map(c => c === editingSec.name ? cleanName : c);
    const updatedDetails = currentSections.map(s => {
      if (s.id === editingSecId) {
        return {
          ...s,
          ...updatedData
        };
      }
      return s;
    });

    const updated: AppConfig = {
      ...config,
      categories: updatedCats,
      sectionsDetail: updatedDetails
    };

    await onUpdateConfig(updated);
    setEditingSecId(null);
  };

  // Legacy Compatibility Placeholders
  const handleAddCategory = async () => {
    // Falls back to detailed create format
    setSecName(newCatName);
    setSecCode('');
    setSecDescription(`Sección de ${newCatName.trim()}`);
    setSecIsFoodOrExempt(false);
    
    const cleanName = newCatName.trim();
    if (!cleanName) return;
    const cleanCode = cleanName.slice(0, 3).toUpperCase();
    const currentSections = getSectionsList();
    const newSecObj = {
      id: `sec-${Date.now()}`,
      name: cleanName,
      code: cleanCode,
      description: `Sección de ${cleanName}`,
      isFoodOrExempt: false,
      createdAt: new Date().toISOString()
    };
    const updatedCategories = [...config.categories, cleanName];
    const updatedDetails = [...currentSections, newSecObj];
    const updated = { ...config, categories: updatedCategories, sectionsDetail: updatedDetails };
    await onUpdateConfig(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = async (catName: string) => {
    await handleDeleteDetailedSection('', catName);
  };

  const handleSaveRenameCategory = async (index: number) => {
    if (!editingCatVal.trim()) return;
    const oldName = config.categories[index];
    const cleanName = editingCatVal.trim();
    const currentSections = getSectionsList();
    const updatedCats = [...config.categories];
    updatedCats[index] = cleanName;
    const updatedDetails = currentSections.map(s => {
      if (s.name === oldName) {
        return { ...s, name: cleanName };
      }
      return s;
    });
    const updated = { ...config, categories: updatedCats, sectionsDetail: updatedDetails };
    await onUpdateConfig(updated);
    setEditingCatIndex(null);
  };

  // User permissions quick role preset helper
  const getPresetForRole = (role: 'admin' | 'supervisor' | 'cashier' | 'guest') => {
    switch (role) {
      case 'admin':
        return {
          allowedTabs: { dashboard: true, pos: true, alerts: true, reports: true, admin: true },
          allowedActions: { create_product: true, edit_product: true, delete_product: true, adjust_stock: true, process_sale: true }
        };
      case 'supervisor':
        return {
          allowedTabs: { dashboard: true, pos: true, alerts: true, reports: true, admin: false },
          allowedActions: { create_product: true, edit_product: true, delete_product: false, adjust_stock: true, process_sale: true }
        };
      case 'cashier':
        return {
          allowedTabs: { dashboard: false, pos: true, alerts: true, reports: false, admin: false },
          allowedActions: { create_product: false, edit_product: false, delete_product: false, adjust_stock: false, process_sale: true }
        };
      case 'guest':
      default:
        return {
          allowedTabs: { dashboard: true, pos: false, alerts: false, reports: false, admin: false },
          allowedActions: { create_product: false, edit_product: false, delete_product: false, adjust_stock: false, process_sale: false }
        };
    }
  };

  // Add user with preset permissions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) return;

    const emailLow = newUserEmail.toLowerCase().trim();
    const exists = permissions.some(p => p.email.toLowerCase() === emailLow);
    if (exists) {
      alert(`El usuario con correo ${emailLow} ya existe.`);
      return;
    }

    const mockUid = "u-" + Math.random().toString(36).substr(2, 9);
    const presets = getPresetForRole(newUserRole);

    const newUser: UserPermission = {
      id: mockUid,
      email: emailLow,
      displayName: newUserName.trim(),
      role: newUserRole,
      password: newUserPassword,
      allowedTabs: presets.allowedTabs,
      allowedActions: presets.allowedActions
    };

    await onUpdatePermission(newUser);
    setShowAddUserModal(false);
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    setNewUserRole('cashier');
  };

  // Save edited permissions for a user
  const handleSaveUserPermissions = async () => {
    if (!selectedUserPerm) return;
    await onUpdatePermission(selectedUserPerm);
    setSelectedUserPerm(null);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block with explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-905 pb-5">
        <div>
          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            Panel de Administración del Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona la personalización de textos, configuración de boletas/impuestos, secciones de inventario y permisos detallados de usuarios.
          </p>
        </div>

        {/* Administration core tabs switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-850 rounded-xl text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setSubTab('system')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              subTab === 'system'
                ? 'bg-slate-950 text-brand font-bold border border-brand/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Textos e Impuestos
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              subTab === 'categories'
                ? 'bg-slate-950 text-brand font-bold border border-brand/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Secciones / Categorías
          </button>
          <button
            onClick={() => setSubTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              subTab === 'users'
                ? 'bg-slate-950 text-brand font-bold border border-brand/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Usuarios y Roles
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8"
        >
          
          {/* Supabase Status Alert Card */}
          {!isSupabaseConfigured && (
            <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  ⚠️ Atención: Trabajando en Modo Local (LocalStorage)
                </h4>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed">
                Detectamos que estás utilizando la aplicación desde tu despliegue de Vercel (o entorno externo), pero <strong>no se han configurado las variables de entorno de Supabase en tu panel de hosting</strong>. Los datos creados o actualizados aquí no se subirán a tu base de datos central de Supabase.
              </p>
              <div className="text-xs bg-slate-950/80 p-4 rounded-xl space-y-2 border border-slate-900 font-sans">
                <p className="font-semibold text-white">¿Cómo solucionar esto y conectar tu base de datos en Vercel?</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Ve a tu consola o panel de control de <strong className="text-white font-medium">Vercel</strong>.</li>
                  <li>Entra a tu proyecto <strong className="text-white font-medium">d-istribuidora-a2l9xgwj7-oscar-vega-s-projects</strong>.</li>
                  <li>Ve a la pestaña de configuración: <strong className="text-white font-medium">Settings</strong> &rarr; <strong className="text-white font-medium">Environment Variables</strong>.</li>
                  <li>Agrega las siguientes dos variables copiando los valores de tu archivo local o consola de configuración:</li>
                </ol>
                <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-800 font-mono text-[11.5px] text-teal-400 space-y-1.5 overflow-x-auto select-all">
                  <div>VITE_SUPABASE_URL = <span className="text-slate-450">[Tu URL de Supabase]</span></div>
                  <div>VITE_SUPABASE_ANON_KEY = <span className="text-slate-450">[Tu Clave Anon de Supabase]</span></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Una vez agregadas ambas variables, realiza un nuevo redespliegue (rebuild / redeploy) en Vercel para cargarlas en producción.
                </p>
              </div>
            </div>
          )}
          
          {/* ==================== SUB-TAB 1: SYSTEM & TEXTS CONFIG ==================== */}
          {subTab === 'system' && (
            <form onSubmit={handleSaveConfig} className="space-y-8">
              
              {/* Seccion Super Admin Bloqueo / Control de Demo */}
              {isSuperAdmin && (
                <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                  config.isBlocked 
                    ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/5' 
                    : 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider ${
                          config.isBlocked ? 'bg-rose-500/20 text-rose-450' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          CONTROL SUPREMO DE TRIAL
                        </span>
                        <span className="text-slate-500 text-xs">|</span>
                        <span className="text-slate-400 text-xs font-medium">Exclusivo para Oscar Guevara</span>
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {config.isBlocked ? (
                          <>
                            <Lock className="w-4 h-4 text-rose-500" />
                            <span>La Aplicación se encuentra BLOQUEADA (Demo Expirado)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 text-emerald-400" />
                            <span>La Aplicación se encuentra ACTIVA (Demo Operativo)</span>
                          </>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Como creador y promotor del software, tienes la potestad de suspender o habilitar el acceso a este inventario. Al bloquearla, los cajeros y supervisores verán únicamente la pantalla informativa de bloqueo con tus datos para adquisición de licencias.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        const updated: AppConfig = {
                          ...config,
                          isBlocked: !config.isBlocked
                        };
                        await onUpdateConfig(updated);
                      }}
                      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all relative overflow-hidden shadow-md cursor-pointer select-none ${
                        config.isBlocked 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold tracking-wide' 
                          : 'bg-rose-500 hover:bg-rose-450 text-white font-semibold'
                      }`}
                    >
                      {config.isBlocked ? (
                        <>
                          <Unlock className="w-4 h-4 mr-1" />
                          <span>ACTIVAR / DESBLOQUEAR APLICACIÓN</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-1" />
                          <span>BLOQUEAR APP (CONGELAR ACESO)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-teal-400" /> Conf. de Textos del Sitio Principal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título de la Web</label>
                    <input
                      type="text"
                      value={systemTitle}
                      onChange={(e) => setSystemTitle(e.target.value)}
                      required
                      placeholder="Ej. Catálogo de Alimentos"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtítulo / Rubro</label>
                    <input
                      type="text"
                      value={systemSubtitle}
                      onChange={(e) => setSystemSubtitle(e.target.value)}
                      required
                      placeholder="Ej. Ctrl. de Stock"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                {/* Logo & Icon Selection section */}
                <div className="mt-4 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-3">Identidad Visual & Logo de Cabecera</span>
                  
                  <div className="flex flex-wrap gap-4 items-center mb-4 border-b border-slate-850 pb-4">
                    <span className="text-xs text-slate-400">Tipo de Logo en cabecera:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSystemLogoType('icon')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          systemLogoType === 'icon' 
                            ? 'bg-brand text-slate-950 border-brand' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Icono Vectorial (Lucide)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSystemLogoType('image')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          systemLogoType === 'image' 
                            ? 'bg-brand text-slate-950 border-brand' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Imagen Logotipo Distribuidora
                      </button>
                    </div>
                  </div>

                  {systemLogoType === 'icon' ? (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Selecciona un icono representativo:</span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {[
                          { id: 'Package', icon: Package, name: 'Paquete / Caja' },
                          { id: 'Store', icon: Store, name: 'Tienda / Local' },
                          { id: 'Boxes', icon: Boxes, name: 'Inventario' },
                          { id: 'Database', icon: Database, name: 'Base de Datos' },
                          { id: 'Coffee', icon: Coffee, name: 'Café / Alimento' },
                          { id: 'ShoppingBag', icon: ShoppingBag, name: 'Bolsa Compra' },
                          { id: 'TrendingUp', icon: TrendingUp, name: 'Crecimiento' },
                          { id: 'Wrench', icon: Wrench, name: 'Soporte / Taller' },
                          { id: 'Layers', icon: Layers, name: 'Capas / Stock' },
                          { id: 'ShoppingCart', icon: ShoppingCart, name: 'Carrito' },
                          { id: 'ShieldCheck', icon: ShieldCheck, name: 'Seguridad' }
                        ].map((item) => {
                          const IconComponent = item.icon;
                          const isSelected = systemIconName === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSystemIconName(item.id)}
                              className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition border text-center ${
                                isSelected 
                                  ? 'bg-brand/15 border-brand text-brand font-bold' 
                                  : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                              }`}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span className="text-[9px] font-mono leading-none tracking-tight">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs text-slate-400 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] text-slate-650 font-bold">Sin logo</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-300">Logotipo de la Distribuidora</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Automáticamente sincronizado con el logotipo cargado en la sección de datos fiscales de impresión (abajo).</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BRAND COLOR PRESET SELECTOR */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-brand" /> Tema y Paleta de Colores de la App
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-normal">
                  Personalice el color primario y los contrastes de toda la plataforma. Al hacer clic en <strong className="text-white">Guardar Cambios</strong> en el pie de página, el nuevo tema se propagará en tiempo real en esta y en las terminales activas de tus cajeros y supervisores.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {[
                    { key: 'teal', name: 'Turquesa (Principal)', class: 'bg-[#2dd4bf]' },
                    { key: 'blue', name: 'Azul Corporativo', class: 'bg-[#60a5fa]' },
                    { key: 'emerald', name: 'Verde Esmeralda', class: 'bg-[#34d399]' },
                    { key: 'amber', name: 'Ámbar Cálido', class: 'bg-[#fbbf24]' },
                    { key: 'rose', name: 'Rosa Carmín', class: 'bg-[#fb7185]' },
                    { key: 'indigo', name: 'Índigo Cósmico', class: 'bg-[#818cf8]' },
                    { key: 'purple', name: 'Púrpura Mágico', class: 'bg-[#c084fc]' },
                    { key: 'orange', name: 'Naranja Fuego', class: 'bg-[#fb923c]' },
                    { key: 'sky', name: 'Celeste Cielo', class: 'bg-[#38bdf8]' }
                  ].map((preset) => {
                    const isSelected = themeColor === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setThemeColor(preset.key)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left cursor-pointer transition active:scale-95 ${
                          isSelected
                            ? 'bg-slate-950 border-brand text-white shadow-lg shadow-brand/10'
                            : 'bg-slate-950/60 border-slate-850/80 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {/* Swatch sphere */}
                        <div className={`w-5 h-5 rounded-full ring-2 ring-slate-950 shrink-0 ${preset.class} flex items-center justify-center`}>
                          {isSelected && (
                            <Check className="w-3 h-3 text-slate-950 stroke-[3.5px]" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold tracking-tight leading-none">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Visual Contrast Modes (Dark, Light, Warm Eye protection) */}
                <div className="mt-6 pt-5 border-t border-slate-850/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Modo Visual de Contraste
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dark Mode */}
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={`flex flex-col gap-2.5 p-4.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 active:scale-98 ${
                        themeMode === 'dark'
                          ? 'bg-slate-950 border-brand text-white shadow-lg shadow-brand/10'
                          : 'bg-slate-950/60 border-slate-850/80 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${themeMode === 'dark' ? 'bg-brand/10 text-brand' : 'bg-slate-900 text-slate-500'}`}>
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">Modo Oscuro Original</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        La interfaz por defecto elegante y estilizada con tonos azul-slate oscuro óptima para entornos convencionales.
                      </p>
                    </button>

                    {/* Dim Eye Protection Mode */}
                    <button
                      type="button"
                      onClick={() => setThemeMode('dim')}
                      className={`flex flex-col gap-2.5 p-4.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 active:scale-98 ${
                        themeMode === 'dim'
                          ? 'bg-slate-950 border-amber-500/80 text-amber-100 shadow-md shadow-amber-500/5'
                          : 'bg-slate-950/60 border-slate-850/80 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${themeMode === 'dim' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                          <Eye className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          Protección de Vista <span className="text-[8px] bg-amber-500/15 font-mono font-bold text-amber-400 px-1 py-0.5 rounded uppercase leading-none">Recomendado</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Filtro de luz azul con tonos sepias, ámbar cálidos y grises atenuados para combatir la fatiga ocular y cuidar sus ojos en turnos largos.
                      </p>
                    </button>

                    {/* Light Mode */}
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={`flex flex-col gap-2.5 p-4.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 active:scale-98 ${
                        themeMode === 'light'
                          ? 'bg-white border-brand text-slate-900 shadow-md'
                          : 'bg-slate-950/60 border-slate-850/80 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${themeMode === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-slate-500'}`}>
                          <Sun className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">Tema Claro Limpio</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Entorno luminoso con fondos claros y textos nítidos de alto contraste, ideal para oficinas con mucha luz natural o artificial.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE PERSONALIZACIÓN COMPLETA DE PANTALLA LOGIN */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-brand" /> Personalización de la Pantalla de Login (Inicio de Sesión)
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-normal">
                  Rediseñe la ventana completa de inicio de sesión de los usuarios. Modifique los textos generales, logos personalizados, descripciones del pie de Login y defina un color de énfasis específico independiente del color general de la app.
                </p>

                {/* GRID DE PARÁMETROS ESTRUCTURADO COMO UN CMS PREMIUM */}
                <div className="space-y-6 mb-6">
                  {/* SUB SECCIÓN 1: DISEÑO, FONDO Y ESTILO DE TARJETA */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-4">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block border-b border-slate-850/50 pb-2">
                      1. Fondos Ambientales y Estilos de Tarjeta
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ESTILO DE FONDO */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Estilo Visual del Fondo de Login
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'glow', name: 'Halo Neón', desc: 'Fondo oscuro con halos vibrantes' },
                            { key: 'minimal', name: 'Obsidiana Mate', desc: 'Fondo sólido oscuro pulido' },
                            { key: 'light', name: 'Empresarial Claro', desc: 'Tema claro impecable' },
                            { key: 'aurora', name: 'Aurora Fluida', desc: 'Gradiente dinámico moderno' }
                          ].map((style) => (
                            <button
                              key={style.key}
                              type="button"
                              onClick={() => setLoginBgStyle(style.key as any)}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer active:scale-95 ${
                                loginBgStyle === style.key
                                  ? 'bg-slate-900 border-brand text-white shadow-lg'
                                  : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800'
                              }`}
                            >
                              <span className="text-xs font-bold block">{style.name}</span>
                              <span className="text-[8.5px] text-slate-500 leading-tight mt-1">{style.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ESTILO DE TARJETA */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Estructura de Tarjeta de Formulario
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'glass', name: 'Vidrio Esmeril', desc: 'Translúcido' },
                            { key: 'solid', name: 'Sólido Hermético', desc: 'Opaque' },
                            { key: 'flat', name: 'Plano Minimal', desc: 'Delgado border' }
                          ].map((style) => (
                            <button
                              key={style.key}
                              type="button"
                              onClick={() => setLoginCardStyle(style.key as any)}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition h-full cursor-pointer active:scale-95 ${
                                loginCardStyle === style.key
                                  ? 'bg-slate-900 border-brand text-white shadow-lg'
                                  : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800'
                              }`}
                            >
                              <span className="text-xs font-bold block">{style.name}</span>
                              <span className="text-[8.5px] text-slate-500 leading-tight mt-1">{style.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUB SECCIÓN 2: TEXTOS DEL TÍTULO Y PRESENTACIÓN */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-4">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block border-b border-slate-850/50 pb-2">
                      2. Textos Principales del Encabezado
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título de Bienvenida de Login</label>
                        <input
                          type="text"
                          value={loginTitle}
                          onChange={(e) => setLoginTitle(e.target.value)}
                          placeholder="Ej. Sistema de Inventario"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtítulo Descriptivo de Login</label>
                        <input
                          type="text"
                          value={loginSubtitle}
                          onChange={(e) => setLoginSubtitle(e.target.value)}
                          placeholder="Ej. Control & Distribución"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUB SECCIÓN 3: PERSONALIZACIÓN INTERNA DE LA TARJETA */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-4">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block border-b border-slate-850/50 pb-2">
                      3. Formulario, Etiquetas e Inputs de la Tarjeta
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título de la Tarjeta de Acceso</label>
                        <input
                          type="text"
                          value={loginCardTitle}
                          onChange={(e) => setLoginCardTitle(e.target.value)}
                          placeholder="Ej. Acceso de Usuarios Autorizados"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Texto del Botón de Ingreso</label>
                        <input
                          type="text"
                          value={loginButtonText}
                          onChange={(e) => setLoginButtonText(e.target.value)}
                          placeholder="Ej. Ingresar al Sistema"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Etiqueta de Campo de Usuario</label>
                        <input
                          type="text"
                          value={loginUserLabel}
                          onChange={(e) => setLoginUserLabel(e.target.value)}
                          placeholder="Ej. Usuario o Correo"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Etiqueta de Campo de Contraseña</label>
                        <input
                          type="text"
                          value={loginPasswordLabel}
                          onChange={(e) => setLoginPasswordLabel(e.target.value)}
                          placeholder="Ej. Contraseña de Seguridad"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUB SECCIÓN 4: LOGOTIPO, PIE DE PÁGINA Y MARCAS */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-4">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block border-b border-slate-850/50 pb-2">
                      4.Logotipo Personalizado y Textos de Marcas Inferiores
                    </span>

                    <div className="space-y-4">
                      {/* UPLOAD LOGO FOR LOGIN */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Logo de la Empresa (Inicio de Sesión)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                          <div className="sm:col-span-2">
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragOverLogin(true);
                              }}
                              onDragLeave={() => setIsDragOverLogin(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverLogin(false);
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0) {
                                  const file = files[0];
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setLoginLogoUrl(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              onClick={() => document.getElementById('loginLogoFileInput')?.click()}
                              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[140px] ${
                                isDragOverLogin 
                                  ? 'border-brand bg-brand/10 text-brand' 
                                  : loginLogoUrl 
                                    ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80' 
                                    : 'border-slate-800 bg-slate-950 hover:bg-slate-900/40 hover:border-slate-700'
                              }`}
                            >
                              <input
                                id="loginLogoFileInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    const file = files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setLoginLogoUrl(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />

                              {loginLogoUrl ? (
                                <div className="relative group w-full flex flex-col items-center">
                                  <img 
                                    src={loginLogoUrl} 
                                    alt="Logo Personalizado" 
                                    className="max-h-20 max-w-full object-contain mb-2 rounded-lg bg-white p-1 border border-slate-700/50"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-[9px] text-brand font-medium">Logotipo configurado: Haz click o arrastra para cambiar</span>
                                </div>
                              ) : (
                                <div className="space-y-2 flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                                    <Upload className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-300">
                                    Arrastra tu imagen aquí o <span className="text-brand underline">haz click</span>
                                  </div>
                                  <div className="text-[8.5px] text-slate-500">
                                    Soporta PNG, JPEG o SVG (Se guardará localmente)
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {loginLogoUrl ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLoginLogoUrl('');
                                }}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold py-2 px-3 rounded-lg border border-rose-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Quitar Imagen
                              </button>
                            ) : (
                              <div className="text-[9px] text-slate-500 leading-normal bg-slate-900/30 p-3 rounded-xl border border-slate-850">
                                Cargue el logotipo corporativo para la pantalla principal de contraseña.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* TEXTS UNDER CARD AND DESCRIPTIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Texto de Seguridad / Candado Pequeño (Bajo la Tarjeta)</label>
                          <input
                            type="text"
                            value={loginFooterText}
                            onChange={(e) => setLoginFooterText(e.target.value)}
                            placeholder="Ej. Mecanismo ABAC Zero-Trust Bloqueado"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">Párrafo de Descripción en el Pie General</label>
                          <textarea
                            value={loginDescription}
                            onChange={(e) => setLoginDescription(e.target.value)}
                            rows={2}
                            placeholder="Ej. Aplicación de registro y control de stock rápido..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand transition resize-none leading-normal font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LOGIN ACCENT TINT SELECTOR */}
                <div className="pt-3 border-t border-slate-850/65">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Color de Énfasis del Inicio de Sesión
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { key: 'teal', name: 'Turquesa', class: 'bg-[#2dd4bf]' },
                      { key: 'blue', name: 'Azul Social', class: 'bg-[#60a5fa]' },
                      { key: 'emerald', name: 'Verde Esmeralda', class: 'bg-[#34d399]' },
                      { key: 'amber', name: 'Ámbar Cálido', class: 'bg-[#fbbf24]' },
                      { key: 'rose', name: 'Rosa Carmín', class: 'bg-[#fb7185]' },
                      { key: 'indigo', name: 'Índigo Cósmico', class: 'bg-[#818cf8]' },
                      { key: 'purple', name: 'Púrpura', class: 'bg-[#c084fc]' },
                      { key: 'orange', name: 'Naranja Fuego', class: 'bg-[#fb923c]' },
                      { key: 'sky', name: 'Celeste', class: 'bg-[#38bdf8]' }
                    ].map((preset) => {
                      const isSelected = loginThemeColor === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setLoginThemeColor(preset.key)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left cursor-pointer transition active:scale-95 ${
                            isSelected
                              ? 'bg-slate-950 border-brand text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-850/80 hover:bg-slate-950/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ring-2 ring-slate-950 shrink-0 ${preset.class} flex items-center justify-center`}>
                            {isSelected && (
                              <Check className="w-2.5 h-2.5 text-slate-950 stroke-[4px]" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Identidad Comercial en la Boleta de Venta
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (Inputs) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Razón Social / Distribuidora</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RUC / Cédula</label>
                        <input
                          type="text"
                          value={ruc}
                          onChange={(e) => setRuc(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teléfono / Celular</label>
                        <input
                          type="text"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección de Matriz</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pie de Ticket - Frase Agradecimiento</label>
                        <input
                          type="text"
                          value={receiptFooter}
                          onChange={(e) => setReceiptFooter(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pie de Ticket - Frase de Stock o Alerta</label>
                        <input
                          type="text"
                          value={receiptAd}
                          onChange={(e) => setReceiptAd(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Logo Upload) */}
                  <div className="lg:col-span-1 flex flex-col justify-between bg-slate-950 border border-slate-850 p-4.5 rounded-2xl">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Logo de la Distribuidora</label>
                      <p className="text-[10px] text-slate-550 mb-3 leading-relaxed">
                        Este logotipo se imprimirá en los comprobantes y facturas emitidas desde la Caja / POS.
                      </p>

                      {/* Drop / Drag Zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setLogoUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        onClick={() => document.getElementById('logoFileInput')?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[140px] ${
                          isDragOver 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                            : logoUrl 
                              ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80' 
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900/40 hover:border-slate-700'
                        }`}
                      >
                        <input
                          id="logoFileInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const file = files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setLogoUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        {logoUrl ? (
                          <div className="relative group w-full flex flex-col items-center">
                            <img 
                              src={logoUrl} 
                              alt="Logo Distribuidora" 
                              className="max-h-24 max-w-full object-contain mb-2 rounded-lg bg-white p-1 border border-slate-700/50"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] text-emerald-400 font-medium">Logo configurado: Haz click o arrastra para cambiar</span>
                          </div>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center">
                            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div className="text-[10px] font-medium text-slate-300">
                              Arrastra tu imagen aquí o <span className="text-emerald-400 underline">haz click</span>
                            </div>
                            <div className="text-[8.5px] text-slate-500">
                              Soporta PNG, JPEG o SVG
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogoUrl('');
                        }}
                        className="mt-3.5 w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold py-1.5 rounded-lg border border-rose-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Logotipo actual
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-500" /> Tasas y Porcentajes de Impuesto
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  En el sistema caja del TPV (Punto de Venta) se aplican de forma selectiva tasas de impuesto de acuerdo al tipo de artículo: general, licores y tabacos. Edita porcentajes y nomenclatura.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* General */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] text-teal-400 font-bold block">Artículos Generales</span>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Nombre en Factura</label>
                      <input
                        type="text"
                        value={generalName}
                        onChange={(e) => setGeneralName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Porcentaje (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={generalRate}
                        onChange={(e) => setGeneralRate(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Licores */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] text-indigo-400 font-bold block">Bebidas y Licores</span>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Nombre en Factura</label>
                      <input
                        type="text"
                        value={liquorName}
                        onChange={(e) => setLiquorName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Porcentaje (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={liquorRate}
                        onChange={(e) => setLiquorRate(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Tobacco */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] text-rose-400 font-bold block">Tabaco y Derivados</span>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Nombre en Factura</label>
                      <input
                        type="text"
                        value={tobaccoName}
                        onChange={(e) => setTobaccoName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Porcentaje (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={tobaccoRate}
                        onChange={(e) => setTobaccoRate(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-850">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Al guardar, se propagarán los cambios en tiempo real a las terminales POS de tus dependientes.
                </span>
                
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {configSuccess && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-emerald-400 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Configuración Guardada con Éxito
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-slate-950 font-extrabold rounded-xl transition cursor-pointer text-xs flex items-center gap-2 shadow-md shadow-brand/10 select-none"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfig ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==================== SUB-TAB 2: SECTIONS / CATEGORIES ==================== */}
          {subTab === 'categories' && (() => {
            const allSections = getSectionsList();
            
            // Apply Search & Filter
            const filteredSections = allSections.filter(sec => {
              const matchesSearch = 
                sec.name.toLowerCase().includes(secSearchText.toLowerCase()) ||
                sec.code.toLowerCase().includes(secSearchText.toLowerCase()) ||
                sec.description.toLowerCase().includes(secSearchText.toLowerCase());
                
              if (secTypeFilter === 'food') {
                return matchesSearch && sec.isFoodOrExempt;
              }
              if (secTypeFilter === 'general') {
                return matchesSearch && !sec.isFoodOrExempt;
              }
              return matchesSearch;
            });

            const foodCount = allSections.filter(s => s.isFoodOrExempt).length;
            const generalCount = allSections.filter(s => !s.isFoodOrExempt).length;

            const getProductsCountForCategory = (categoryName: string): number => {
              return products.filter(p => p.category === categoryName).length;
            };

            return (
              <div className="space-y-6">
                {/* HEADER DESCRIPTIVE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-5 h-5 text-teal-400" /> Registro de Secciones de Productos y Alimentos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      Configure las áreas de distribución y catalogación del establecimiento. La asignación del de tipo determina si los lotes pertenecen a Alimentos Exentos o a Mercadería con IVA General.
                    </p>
                  </div>
                  
                  {/* STATS CHIPS GRID */}
                  <div className="flex flex-wrap gap-2 md:self-end">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Secciones: <strong className="text-white">{allSections.length}</strong></span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-emerald-450" />
                      <span className="text-[10px] font-mono text-emerald-450 uppercase">Alimentos: <strong className="text-white">{foodCount}</strong></span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-mono text-blue-400 uppercase">General: <strong className="text-white">{generalCount}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                  {/* COLUMN 1: EDIT / CREATE PANEL CONTAINER */}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-teal-450 uppercase tracking-widest flex items-center gap-1.5">
                        {editingSecId ? (
                          <>🔧 Modificar sección</>
                        ) : (
                          <>📝 Registrar nueva sección</>
                        )}
                      </span>
                      {editingSecId && (
                        <button 
                          type="button"
                          onClick={() => setEditingSecId(null)}
                          className="text-[10px] text-rose-450 font-bold hover:underline cursor-pointer"
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>

                    <form onSubmit={(e) => {
                      if (editingSecId) {
                        e.preventDefault();
                        handleSaveEditSection();
                      } else {
                        handleCreateDetailedSection(e);
                      }
                    }} className="space-y-4">
                      {/* Form Fields */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre de la Sección *</label>
                        <input
                          type="text"
                          value={editingSecId ? editingSecName : secName}
                          onChange={(e) => editingSecId ? setEditingSecName(e.target.value) : setSecName(e.target.value)}
                          placeholder="Ej. Lacteos y Quesos, Bebidas Heladas..."
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" title="Identificador de 2 o 3 letras">Código *</label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="EX: LA"
                            value={editingSecId ? editingSecCode : secCode}
                            onChange={(e) => editingSecId ? setEditingSecCode(e.target.value.toUpperCase()) : setSecCode(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-center placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clasificación de Sección</label>
                          <div 
                            onClick={() => editingSecId ? setEditingSecIsFood(!editingSecIsFood) : setSecIsFoodOrExempt(!secIsFoodOrExempt)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                              (editingSecId ? editingSecIsFood : secIsFoodOrExempt)
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <Coffee className={`w-4 h-4 shrink-0 transition ${
                              (editingSecId ? editingSecIsFood : secIsFoodOrExempt) ? 'rotate-12 scale-110' : ''
                            }`} />
                            <span className="text-[9px] uppercase tracking-wider">¿Es Alimento?</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descripción / Detalles de Distribución</label>
                        <textarea
                          rows={3}
                          value={editingSecId ? editingSecDescription : secDescription}
                          onChange={(e) => editingSecId ? setEditingSecDescription(e.target.value) : setSecDescription(e.target.value)}
                          placeholder="Indique pasillos físicos, refrigeración requerida o notas comerciales sobre esta sección..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          editingSecId
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/5'
                        }`}
                      >
                        {editingSecId ? (
                          <>🔧 Aplicar Modificaciones</>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Registrar Sección
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* COLUMN 2 & 3: MAIN DATA TABLE */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row gap-3 items-center justify-between">
                      {/* Search */}
                      <div className="relative w-full md:max-w-xs">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar sección por nombre, código..."
                          value={secSearchText}
                          onChange={(e) => setSecSearchText(e.target.value)}
                          className="w-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
                        />
                        {secSearchText && (
                          <button
                            onClick={() => setSecSearchText('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="flex gap-1 overflow-x-auto self-stretch md:self-auto pb-1 md:pb-0 shrink-0">
                        {[
                          { id: 'all', label: 'Ver Todo', icon: Layers },
                          { id: 'food', label: 'Alimentos / Exentos', icon: Coffee },
                          { id: 'general', label: 'Mercadería General', icon: Package }
                        ].map((pill) => {
                          const PillIcon = pill.icon;
                          const isSelected = secTypeFilter === pill.id;
                          return (
                            <button
                              key={pill.id}
                              onClick={() => setSecTypeFilter(pill.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition border cursor-pointer shrink-0 ${
                                isSelected
                                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 font-black'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <PillIcon className="w-3.5 h-3.5" />
                              {pill.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TABLE CONTAINER */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left border-collapse table-auto md:table-fixed">
                          <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-850 text-[10px] font-black text-slate-450 tracking-widest uppercase">
                              <th className="py-3.5 px-4 w-20 text-center">Código</th>
                              <th className="py-3.5 px-4">Nombre de Sección / Productos</th>
                              <th className="py-3.5 px-4 hidden sm:table-cell">Clasificación tributaria</th>
                              <th className="py-3.5 px-4 w-1/3">Ubicación / Detalles</th>
                              <th className="py-3.5 px-4 w-24 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60 text-xs">
                            {filteredSections.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-12 px-4 text-center text-slate-500">
                                  <CheckSquare className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs font-bold text-slate-400">No se encontraron secciones registradas</p>
                                  <p className="text-[10px] text-slate-600 mt-1">Modifique los filtros o registre una sección en el panel lateral.</p>
                                </td>
                              </tr>
                            ) : (
                              filteredSections.map((sec) => {
                                const itemCount = getProductsCountForCategory(sec.name);
                                const isEditingRaw = editingSecId === sec.id;
                                
                                return (
                                  <tr 
                                    key={sec.id}
                                    className={`hover:bg-slate-900/40 transition-colors group ${
                                      isEditingRaw ? 'bg-amber-500/5' : ''
                                    }`}
                                  >
                                    {/* Code */}
                                    <td className="py-3 px-4 text-center font-mono font-black">
                                      <span className={`px-2 py-1.5 rounded-lg border text-[10px] inline-block shadow-sm ${
                                        sec.isFoodOrExempt 
                                          ? 'bg-emerald-500/10 border-emerald-555/20 text-emerald-455' 
                                          : 'bg-slate-905 border-slate-800 text-slate-300'
                                      }`}>
                                        [{sec.code}]
                                      </span>
                                    </td>

                                    {/* Name / Product count */}
                                    <td className="py-3 px-4">
                                      <div>
                                        <p className="font-bold text-slate-200 block truncate">{sec.name}</p>
                                        <span className={`text-[9px] font-mono font-medium block mt-0.5 rounded-full px-2 py-0.5 max-w-max ${
                                          itemCount > 0 
                                            ? 'bg-slate-900 text-slate-400' 
                                            : 'bg-slate-900/40 text-slate-600'
                                        }`}>
                                          {itemCount} productos en stock
                                        </span>
                                      </div>
                                    </td>

                                    {/* Classification Badge */}
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                      {sec.isFoodOrExempt ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/10">
                                          <Coffee className="w-3 h-3 text-emerald-450" />
                                          Alimento (IVA 0%)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-800">
                                          <Package className="w-3 h-3 text-slate-650" />
                                          General (Con IVA)
                                        </span>
                                      )}
                                    </td>

                                    {/* Description */}
                                    <td className="py-3 px-4">
                                      <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed" title={sec.description}>
                                        {sec.description || "Sin descripción detallada registrada."}
                                      </p>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition">
                                        <button
                                          type="button"
                                          onClick={() => startEditSection(sec)}
                                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                                            isEditingRaw
                                              ? 'bg-amber-550/20 border-amber-500/30 text-amber-400'
                                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-450 hover:text-white'
                                          }`}
                                          title="Editar Sección"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDetailedSection(sec.id, sec.name)}
                                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-900/30 text-slate-450 hover:text-rose-450 rounded-lg transition overflow-hidden cursor-pointer"
                                          title="Dar de baja sección"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Table Footer counts */}
                      <div className="p-3 bg-slate-900/50 border-t border-slate-850 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Secciones mostradas: {filteredSections.length} de {allSections.length}</span>
                        <span>Ordenado por fecha de alta</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== SUB-TAB 3: USERS & PERMISSIONS ==================== */}
          {subTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-400" /> Control de Acceso y Gestión de Permisos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Asigna qué secciones/módulos de la web tiene permitido visualizar cada usuario (Dashboard, POS, Alert, Report o Admin) y cuáles acciones de inventario puede ejecutar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Agregar Operario
                </button>
              </div>

              {/* Users grid list */}
              <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      <th className="p-4">Colaborador / Correo</th>
                      <th className="p-4">Rol Asignado</th>
                      <th className="p-4 hidden md:table-cell">Contenedores Visibles</th>
                      <th className="p-4 hidden md:table-cell">Acciones Autorizadas</th>
                      <th className="p-4 text-right">Configuración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => {
                      const listVisibleTabs = Object.entries(perm.allowedTabs)
                        .filter(([_, isAllowed]) => isAllowed)
                        .map(([tName]) => {
                          if (tName === 'dashboard') return 'Almacén';
                          if (tName === 'pos') return 'TPV/POS';
                          if (tName === 'alerts') return 'Alertas';
                          if (tName === 'reports') return 'Kárdex';
                          if (tName === 'admin') return 'Admin';
                          return tName;
                        });

                      const listAllowedActions = Object.entries(perm.allowedActions)
                        .filter(([_, isAllowed]) => isAllowed)
                        .map(([actionName]) => {
                          if (actionName === 'create_product') return 'Crear';
                          if (actionName === 'edit_product') return 'Editar';
                          if (actionName === 'delete_product') return 'Bajar';
                          if (actionName === 'adjust_stock') return 'Ajustar';
                          if (actionName === 'process_sale') return 'Vender';
                          return actionName;
                        });

                      const isSelf = perm.id === currentUserUid;

                      return (
                        <tr key={perm.id} className="border-b border-slate-905 hover:bg-slate-900/10 transition text-xs">
                          <td className="p-4">
                            <div className="font-semibold text-slate-200">
                              {perm.displayName} {isSelf && <span className="ml-1 px-1.5 py-0.5 bg-teal-500/15 text-teal-400 text-[8px] font-mono rounded-md">Tú</span>}
                              {perm.password && <span className="ml-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500/30 text-[8.5px] rounded-md border border-amber-500/15 font-mono">Clave Local</span>}
                            </div>
                            <div className="text-[10px] text-slate-550 font-mono mt-0.5">{perm.email}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 font-bold font-mono uppercase text-[9px] rounded-md ${
                              perm.role === 'admin' ? 'bg-rose-500/10 text-rose-400' :
                              perm.role === 'supervisor' ? 'bg-indigo-500/10 text-indigo-400' :
                              perm.role === 'cashier' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-slate-500/15 text-slate-400'
                            }`}>
                              {perm.role === 'admin' ? 'Administrador' :
                               perm.role === 'supervisor' ? 'Supervisor' :
                               perm.role === 'cashier' ? 'Cajero POS' :
                               'Lector'}
                            </span>
                          </td>
                          <td className="p-4 hidden md:table-cell max-w-xs truncate text-slate-400">
                            {listVisibleTabs.length > 0 ? listVisibleTabs.join(', ') : <span className="text-slate-650 italic">Ninguno</span>}
                          </td>
                          <td className="p-4 hidden md:table-cell max-w-xs truncate text-slate-450">
                            {perm.role === 'admin' ? 'Todo Autorizado' : (listAllowedActions.length > 0 ? listAllowedActions.join(', ') : <span className="text-slate-650 italic">Ninguno</span>)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedUserPerm({ ...perm })}
                                className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-teal-400 font-bold rounded-lg transition cursor-pointer text-[10px]"
                              >
                                Editar Permisos
                              </button>
                              
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => {
                                  if (confirm(`¿Clausurar cuenta de acceso para ${perm.displayName}?`)) {
                                    onDeletePermission(perm.id);
                                  }
                                }}
                                className={`p-1 text-slate-500 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer ${isSelf ? 'opacity-25 cursor-not-allowed' : ''}`}
                                title={isSelf ? "No puedes eliminarte a ti mismo" : "Desahuciar colaborador"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ==================== DIALOGUE MODAL: CREATE USER ==================== */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden z-10 space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white font-display uppercase tracking-widest flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-400" /> Agregar Colaborador de Almacén
                </span>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-slate-450 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4.5 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Usuario / Identificador / Correo (Para ingresar)</label>
                  <input
                    type="text"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    placeholder="ejemplo@distribuidora.com o Admin0317"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4.5 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Contraseña de Inicio de Sesión</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    placeholder="Escriba la clave de seguridad para el usuario"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4.5 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Rol / Perfil Inicial</label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  >
                    <option value="admin">Administrador (Control total)</option>
                    <option value="supervisor">Supervisor (Auditor de catálogo)</option>
                    <option value="cashier">Cajero TPV (Solo Vender y Alertas)</option>
                    <option value="guest">Solo Escritorio (Solo Listar Kardex)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 text-[10px] text-slate-550 leading-relaxed space-y-1">
                  <span className="font-bold text-slate-400 block mb-0.5">• Nota sobre el acceso:</span>
                  El sistema le asignará permisos preestablecidos según el rol, pero podrás refinarlos granularmente en la grilla después de darlo de alta.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl hover:bg-teal-400 transition cursor-pointer"
                  >
                    Crear Ficha de Acceso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOGUE MODAL: REFINING PERMISSIONS ==================== */}
      <AnimatePresence>
        {selectedUserPerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserPerm(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] z-10 space-y-5 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white font-display">Refinar Permisos Granulares</h4>
                  <p className="text-[10px] text-teal-400 mt-0.5">{selectedUserPerm.displayName} ({selectedUserPerm.email})</p>
                </div>
                <button
                  onClick={() => setSelectedUserPerm(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Set Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Alinear Perfil General</label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-xl">
                  {(['admin', 'supervisor', 'cashier', 'guest'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        const presets = getPresetForRole(r);
                        setSelectedUserPerm({
                          ...selectedUserPerm,
                          role: r,
                          allowedTabs: presets.allowedTabs,
                          allowedActions: presets.allowedActions
                        });
                      }}
                      className={`py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wider text-center transition cursor-pointer ${
                        selectedUserPerm.role === r 
                          ? 'bg-teal-650 text-white font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'admin' ? 'Admin' : r === 'supervisor' ? 'Superv.' : r === 'cashier' ? 'Cajero' : 'Lector'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes: allowed tabs/containers */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 decoration-1 border-b border-slate-800 pb-1">
                    1. Contenedores / Paneles Visibles (Navegación)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Panel Almacen */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedTabs.dashboard}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedTabs: { ...selectedUserPerm.allowedTabs, dashboard: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Panel Almacén (Dashboard)</span>
                        <span className="text-[9px] text-slate-500">Muestra el catálogo, stock y alta de artículos.</span>
                      </div>
                    </label>

                    {/* Caja POS */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedTabs.pos}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedTabs: { ...selectedUserPerm.allowedTabs, pos: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Caja de Facturación / POS</span>
                        <span className="text-[9px] text-slate-500">Módulo de ventas caja y cobro de boletas.</span>
                      </div>
                    </label>

                    {/* Alertas */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedTabs.alerts}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedTabs: { ...selectedUserPerm.allowedTabs, alerts: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Alertas de Bajo Stock</span>
                        <span className="text-[9px] text-slate-500">Monitorea repuestos requeridos y cantidades mínimas.</span>
                      </div>
                    </label>

                    {/* Reportes */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedTabs.reports}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedTabs: { ...selectedUserPerm.allowedTabs, reports: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Reportes y Historial Kárdex</span>
                        <span className="text-[9px] text-slate-500">Historial inmutable de movimientos e ingresos.</span>
                      </div>
                    </label>

                    {/* Admin panel */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedTabs.admin}
                        disabled={selectedUserPerm.id === currentUserUid} // Always active on oneself
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedTabs: { ...selectedUserPerm.allowedTabs, admin: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Panel de Administración</span>
                        <span className="text-[9px] text-slate-500">Edita configuraciones, categorías y usuarios.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 decoration-1 border-b border-slate-800 pb-1">
                    2. Acciones Autorizadas (Ejecución)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Crear producto */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedActions.create_product}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedActions: { ...selectedUserPerm.allowedActions, create_product: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Dar de Alta Productos</span>
                        <span className="text-[9px] text-slate-500">Habilita botón de Agregar Producto.</span>
                      </div>
                    </label>

                    {/* Editar producto */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedActions.edit_product}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedActions: { ...selectedUserPerm.allowedActions, edit_product: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Modificar Producto</span>
                        <span className="text-[9px] text-slate-500">Habilita editar nombres, precios y SKU.</span>
                      </div>
                    </label>

                    {/* Dar de baja / Delete product */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedActions.delete_product}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedActions: { ...selectedUserPerm.allowedActions, delete_product: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Dar de Baja Productos</span>
                        <span className="text-[9px] text-slate-500">Habilita el botón de eliminar del catálogo.</span>
                      </div>
                    </label>

                    {/* Stock adjust */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedActions.adjust_stock}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedActions: { ...selectedUserPerm.allowedActions, adjust_stock: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Hacer Ajustes Manuales</span>
                        <span className="text-[9px] text-slate-500">Habilita reabastecer e ingresos manuales.</span>
                      </div>
                    </label>

                    {/* Process sale */}
                    <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedUserPerm.allowedActions.process_sale}
                        onChange={(e) => {
                          setSelectedUserPerm({
                            ...selectedUserPerm,
                            allowedActions: { ...selectedUserPerm.allowedActions, process_sale: e.target.checked }
                          });
                        }}
                        className="mt-0.5 rounded text-teal-650"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Registrar Ventas (Caja)</span>
                        <span className="text-[9px] text-slate-500">Habilita realizar pedidos, descontos, y cobros.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Contrasena de Acceso */}
              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Contraseña de Acceso (Local / Clave)</label>
                <input
                  type="text"
                  value={selectedUserPerm.password || ''}
                  onChange={(e) => setSelectedUserPerm({
                    ...selectedUserPerm,
                    password: e.target.value
                  })}
                  placeholder="Sin contraseña de seguridad"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Admin Safety trigger disclosure */}
              {selectedUserPerm.id === currentUserUid && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-2.5 text-[10px] text-rose-300 leading-normal">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Por motivos de seguridad informática, no es posible revocar tus propios accesos de Administrador o Panel de Control para evitar bloqueos del sistema.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserPerm(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserPermissions}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                >
                  Salvar Ficha de Acceso
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
