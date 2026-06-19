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
import { UserSession } from '../types';
import { isConfigured } from '../firebase';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-brand selection:text-slate-900 font-sans">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Header App Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand to-brand-hover rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 mb-3 border border-brand/20">
            <Package className="w-7 h-7 text-slate-950 stroke-[2.5px]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display mb-1">
            Sistema de Inventario
          </h1>
          <p className="text-sm text-slate-400 text-center px-4">
            Gestión inteligente de stock en tiempo real y reportes detallados.
          </p>
        </div>

        {/* Main login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <Lock className="w-4 h-4 text-brand" />
            <h2 className="text-base font-semibold text-slate-200">
              Acceso exclusivo de usuarios
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
            <div className="mb-5 bg-brand/10 border border-brand/20 text-brand rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-brand" />
              <div>
                <span className="font-semibold text-white">Modo Local Activado:</span> Firebase está en espera de configuración en la plataforma. Usando autenticación aislada persistente con cuenta pre-autorizada.
                <button 
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="block mt-1 font-semibold underline text-brand hover:text-brand-hover cursor-pointer"
                >
                  {showHelper ? "Ocultar credenciales" : "Ver credenciales de demostración"}
                </button>
                {showHelper && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 bg-slate-950 p-2 rounded border border-brand/10 font-mono text-[10px] text-brand flex flex-col gap-1"
                  >
                    <div>Usuario: <span className="text-white select-all">admin@inventario.com</span></div>
                    <div>Clave: <span className="text-white select-all">admin123</span></div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLocalLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Usuario o Correo
              </label>
              <input
                type="text"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. Admin0317 o correo electrónico"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña de Seguridad
              </label>
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-slate-950 font-black py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-brand/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>



            {!isConfigured && (
              <>
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-800 h-[1px]"></div>
                  <span className="relative bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Acceso Rápido</span>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleQuickDemo}
                  className="w-full py-2.5 px-4 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-xs text-slate-300 font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
            <span className="text-[11px] font-mono tracking-wide">
              Mecanismo ABAC Zero-Trust Bloqueado
            </span>
          </div>
          <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                Aplicación de registro y control de 
          </p>
        </div>
      </motion.div>
    </div>
  );
}
