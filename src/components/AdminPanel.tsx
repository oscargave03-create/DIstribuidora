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
  Unlock
} from 'lucide-react';
import { AppConfig, UserPermission } from '../types';

interface AdminPanelProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => Promise<void>;
  permissions: UserPermission[];
  onUpdatePermission: (p: UserPermission) => Promise<void>;
  onDeletePermission: (id: string) => Promise<void>;
  currentUserUid: string;
}

export default function AdminPanel({
  config,
  onUpdateConfig,
  permissions,
  onUpdatePermission,
  onDeletePermission,
  currentUserUid
}: AdminPanelProps) {
  // Tabs within administration
  const [subTab, setSubTab] = useState<'system' | 'categories' | 'users'>('system');

  const isSuperAdmin = permissions.find(p => p.id === currentUserUid)?.email.toLowerCase() === 'oscargave03@gmail.com';

  // Load configs local states
  const [systemTitle, setSystemTitle] = useState(config.systemTitle);
  const [systemSubtitle, setSystemSubtitle] = useState(config.systemSubtitle);
  const [companyName, setCompanyName] = useState(config.companyName);
  const [ruc, setRuc] = useState(config.ruc);
  const [telephone, setTelephone] = useState(config.telephone);
  const [address, setAddress] = useState(config.address);
  const [receiptFooter, setReceiptFooter] = useState(config.receiptFooter);
  const [receiptAd, setReceiptAd] = useState(config.receiptAd);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);

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
        companyName,
        ruc,
        telephone,
        address,
        receiptFooter,
        receiptAd,
        logoUrl,
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

  // Category Add
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    if (config.categories.includes(newCatName.trim())) {
      alert("La sección ya existe.");
      return;
    }
    const updatedCats = [...config.categories, newCatName.trim()];
    const updated: AppConfig = { ...config, categories: updatedCats };
    await onUpdateConfig(updated);
    setNewCatName('');
  };

  // Category Delete
  const handleDeleteCategory = async (catName: string) => {
    if (config.categories.length <= 1) {
      alert("Debe haber por lo menos una sección/categoría.");
      return;
    }
    if (confirm(`¿Dar de baja la sección "${catName}"? Los productos de esta sección seguirán existiendo, pero se quedarán sin la categoría activa.`)) {
      const updatedCats = config.categories.filter(c => c !== catName);
      const updated: AppConfig = { ...config, categories: updatedCats };
      await onUpdateConfig(updated);
    }
  };

  // Save renamed Category
  const handleSaveRenameCategory = async (index: number) => {
    if (!editingCatVal.trim()) return;
    const updatedCats = [...config.categories];
    updatedCats[index] = editingCatVal.trim();
    const updated: AppConfig = { ...config, categories: updatedCats };
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
                ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10'
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
                ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10'
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
                ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10'
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
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfig ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==================== SUB-TAB 2: SECTIONS / CATEGORIES ==================== */}
          {subTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-400" /> Creación y Personalización de Secciones
                </h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xl">
                  Crea las secciones o pasillos lógicos de clasificación para tu catálogo de productos. Al editar una sección, todos los formularios de alta de stock se actualizarán al instante.
                </p>
              </div>

              {/* Add category field */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 max-w-lg space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Añadir Nueva Sección</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Panadería, Bebidas Heladas, Limpieza..."
                    className="flex-1 bg-slate-905 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              </div>

              {/* Grid of existing categories */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Secciones Activas ({config.categories.length})</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {config.categories.map((cat, idx) => {
                    const isEditing = editingCatIndex === idx;

                    return (
                      <div 
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex gap-1.5">
                            <input
                              type="text"
                              value={editingCatVal}
                              onChange={(e) => setEditingCatVal(e.target.value)}
                              className="flex-1 bg-slate-900 border border-teal-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRenameCategory(idx)}
                              className="p-1 bg-teal-550/20 text-teal-400 border border-teal-500/20 rounded-md hover:bg-teal-500 hover:text-white transition cursor-pointer"
                              title="Salvar cambio"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCatIndex(null)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-teal-500/30 rounded-full" />
                              <span className="text-xs font-semibold text-slate-200">{cat}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCatIndex(idx);
                                  setEditingCatVal(cat);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                title="Renombrar sección"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                title="Eliminar sección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
