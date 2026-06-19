import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Info,
  Layers,
  Database
} from 'lucide-react';
import { loginWithGoogle, loginWithCustomCredentials } from '../db/store';
import { UserSession, AppConfig } from '../types';
import { isConfigured } from '../firebase';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
  config?: AppConfig;
}

export default function LoginView({ onLoginSuccess, config }: LoginViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local admin custom login states (convenient fallback)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showHelper, setShowHelper] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión con Google. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor, rellene todos los campos de acceso.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithCustomCredentials(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Credenciales incorrectas. Verifique su usuario o contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const guestUser: UserSession = {
        uid: "guest-user-123",
        email: "demo@inventario-app.com",
        displayName: "Oscar Guevara",
        isFirebase: false,
        emailVerified: true
      };
      localStorage.setItem("inv_session", JSON.stringify(guestUser));
      onLoginSuccess(guestUser);
      setLoading(false);
    }, 400);
  };

  const colorMap: Record<string, {
    text: string;
    bg: string;
    bgHover: string;
    border: string;
    badge: string;
    ringFocus: string;
  }> = {
    teal: {
      text: 'text-[#2dd4bf]',
      bg: 'bg-[#2dd4bf]',
      bgHover: 'hover:bg-[#14b8a6]',
      border: 'border-[#2dd4bf]/20',
      badge: 'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/20',
      ringFocus: 'focus:border-[#2dd4bf] focus:ring-[#2dd4bf]/20'
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      border: 'border-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ringFocus: 'focus:border-blue-500 focus:ring-blue-500/20'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      bgHover: 'hover:bg-emerald-600',
      border: 'border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      ringFocus: 'focus:border-emerald-500 focus:ring-emerald-500/20'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      bgHover: 'hover:bg-amber-600',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      ringFocus: 'focus:border-amber-500 focus:ring-amber-500/20'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      bgHover: 'hover:bg-rose-600',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      ringFocus: 'focus:border-rose-500 focus:ring-rose-500/20'
    },
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      bgHover: 'hover:bg-indigo-600',
      border: 'border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      ringFocus: 'focus:border-indigo-500 focus:ring-indigo-500/20'
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500',
      bgHover: 'hover:bg-purple-600',
      border: 'border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      ringFocus: 'focus:border-purple-500 focus:ring-purple-500/20'
    },
    orange: {
      text: 'text-orange-400',
      bg: 'bg-orange-500',
      bgHover: 'hover:bg-orange-600',
      border: 'border-orange-500/20',
      badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      ringFocus: 'focus:border-orange-500 focus:ring-orange-500/20'
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500',
      bgHover: 'hover:bg-sky-600',
      border: 'border-sky-500/20',
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      ringFocus: 'focus:border-sky-500 focus:ring-sky-500/20'
    }
  };

  const loginThemeKey = config?.loginThemeColor || 'teal';
  const theme = colorMap[loginThemeKey] || colorMap.teal;

  const loginBgStyle = config?.loginBgStyle || 'glow';
  const loginCardStyle = config?.loginCardStyle || 'glass';
  const loginCardTitle = config?.loginCardTitle || 'Acceso de Usuarios Autorizados';
  const loginUserLabel = config?.loginUserLabel || 'Usuario o Correo';
  const loginPasswordLabel = config?.loginPasswordLabel || 'Contraseña de Seguridad';
  const loginButtonText = config?.loginButtonText || 'Ingresar al Sistema';
  const loginFooterText = config?.loginFooterText || 'Mecanismo ABAC Zero-Trust Bloqueado';

  const isLight = loginBgStyle === 'light';

  // Compute a high-contrast theme color class to prevent letters from hiding on light/dark backgrounds
  const getThemeTextClass = (lightMode: boolean) => {
    if (lightMode) {
      const lightColorMap: Record<string, string> = {
        teal: 'text-teal-700',
        blue: 'text-blue-700',
        emerald: 'text-emerald-700',
        amber: 'text-amber-800',
        rose: 'text-rose-700',
        indigo: 'text-indigo-700',
        purple: 'text-purple-700',
        orange: 'text-orange-700',
        sky: 'text-sky-800'
      };
      return lightColorMap[loginThemeKey] || 'text-teal-700';
    }
    return theme.text; // e.g., text-teal-400 for dark mode
  };

  // Compute background class
  let bgClass = 'bg-slate-950';
  if (isLight) {
    bgClass = 'bg-slate-50';
  } else if (loginBgStyle === 'aurora') {
    bgClass = 'bg-[#030712]';
  }

  // Compute card containers classes
  let cardClass = '';
  if (isLight) {
    if (loginCardStyle === 'glass') {
      cardClass = 'bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-xl';
    } else if (loginCardStyle === 'solid') {
      cardClass = 'bg-white border border-slate-200 shadow-xl';
    } else {
      cardClass = 'bg-slate-100 border border-slate-200/60';
    }
  } else {
    if (loginCardStyle === 'glass') {
      cardClass = 'bg-slate-900/80 backdrop-blur-md border border-slate-850/80';
    } else if (loginCardStyle === 'solid') {
      cardClass = 'bg-slate-900 border border-slate-850';
    } else {
      cardClass = 'bg-slate-950/40 border border-slate-850/50';
    }
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-4 selection:bg-slate-800 selection:text-white font-sans overflow-x-hidden relative transition-colors duration-500`}>
      {/* Decorative ambient blobs */}
      {loginBgStyle === 'glow' && (
        <>
          <div className={`absolute top-1/4 left-1/4 w-80 h-80 ${theme.badge.split(' ')[0]} rounded-full filter blur-[120px] pointer-events-none opacity-40`} />
          <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${theme.badge.split(' ')[0]} rounded-full filter blur-[100px] pointer-events-none opacity-20`} />
        </>
      )}

      {loginBgStyle === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/15 blur-[130px]`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full ${theme.bg.split(' ')[0]}/15 blur-[120px]`} />
          <div className="absolute top-[35%] left-[25%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[110px]" />
        </div>
      )}

      {isLight && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.03]">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Header App Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl mb-4 border ${isLight ? 'border-slate-200 bg-white' : `${theme.border} bg-slate-900/60`} transition-all duration-350`}>
            {config?.loginLogoUrl ? (
              <img 
                src={config.loginLogoUrl} 
                alt="Logo Empresa" 
                className="w-11 h-11 object-contain rounded-xl" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Package className={`w-8 h-8 ${getThemeTextClass(isLight)} stroke-[2.2px]`} />
            )}
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight font-display mb-1 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {config?.loginTitle || "Sistema de Inventario"}
          </h1>
          <p className={`text-xs font-mono tracking-widest uppercase font-bold text-center ${getThemeTextClass(isLight)}`}>
            {config?.loginSubtitle || "Control & Distribución"}
          </p>
        </div>

        {/* Main login card */}
        <div className={`${cardClass} rounded-3xl p-8 shadow-2xl backdrop-blur-md`}>
          <div className={`flex items-center gap-2 mb-6 border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-850 pb-4'}`}>
            <Lock className={`w-4 h-4 ${getThemeTextClass(isLight)}`} />
            <h2 className={`text-base font-semibold font-display ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {loginCardTitle}
            </h2>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 flex items-start gap-2.5"
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Fallback Creds helper panel */}
          {!isConfigured && (
            <div className={`mb-5 ${isLight ? 'bg-slate-200/50 text-slate-700 border border-slate-300/60' : `${theme.badge}`} rounded-xl p-3 flex items-start gap-2.5`}>
              <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${getThemeTextClass(isLight)}`} />
              <div>
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>Modo Local Activado:</span> Firebase está en espera de configuración en la plataforma. Usando autenticación aislada persistente con cuenta pre-autorizada.
                <button 
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className={`block mt-1 font-semibold underline ${isLight ? 'text-slate-800 hover:text-slate-950' : `${theme.text} hover:text-white`} cursor-pointer`}
                >
                  {showHelper ? "Ocultar credenciales" : "Ver credenciales de demostración"}
                </button>
                {showHelper && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mt-2 ${isLight ? 'bg-white border-slate-200 text-slate-700' : `bg-slate-950 ${theme.border} ${theme.text}`} p-2 rounded border font-mono text-[10px] flex flex-col gap-1`}
                  >
                    <div>Usuario: <span className={`${isLight ? 'text-slate-900' : 'text-white'} select-all font-bold`}>admin@inventario.com</span></div>
                    <div>Clave: <span className={`${isLight ? 'text-slate-900' : 'text-white'} select-all font-bold`}>admin123</span></div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLocalLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {loginUserLabel}
              </label>
              <input
                type="text"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. Admin0317 o correo electrónico"
                className={`w-full ${isLight ? 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 ${theme.ringFocus} transition-all font-mono`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {loginPasswordLabel}
              </label>
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full ${isLight ? 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 ${theme.ringFocus} transition-all`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 ${theme.bg} ${theme.bgHover} text-white font-black py-3.5 px-4 rounded-xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{loginButtonText}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </>
              )}
            </button>

            {!isConfigured && (
              <>
                <div className="relative my-6 flex items-center justify-center">
                  <div className={`absolute inset-0 h-[1px] ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                  <span className={`relative px-3 text-[10px] uppercase tracking-widest font-semibold ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-slate-900 text-slate-500'}`}>Acceso Rápido</span>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleQuickDemo}
                  className={`w-full py-2.5 px-4 ${isLight ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700' : 'bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300'} text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm`}
                >
                  <span>Acceder en modo Demostración</span>
                </button>
              </>
            )}
          </form>
        </div>

        {/* Security / Architecture details block (Humility and compliance indicators) */}
        <div className="mt-6 flex flex-col gap-2 items-center text-center">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
            <span className={`text-[11px] font-mono tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
              {loginFooterText}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
            {config?.loginDescription || "Aplicación de registro y control de stock rápido, despachos inmediatos y facturación electrónica integrada."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
