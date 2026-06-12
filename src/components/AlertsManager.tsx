import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  ChevronsRight, 
  HelpCircle, 
  ShoppingBag,
  Plus,
  RefreshCw,
  Box
} from 'lucide-react';
import { Product } from '../types';

interface AlertsManagerProps {
  products: Product[];
  onOpenReplenish: (product: Product) => void;
}

export default function AlertsManager({ products, onOpenReplenish }: AlertsManagerProps) {
  
  // Find low-stock items
  const alertsList = products.filter(p => p.quantity <= p.minQuantity);

  // Group alerts by severity
  const criticalAlerts = alertsList.filter(p => p.quantity === 0);
  const warningAlerts = alertsList.filter(p => p.quantity > 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Upper description header */}
      <div className="border-b border-slate-850 pb-5">
        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
          Alertas Automatizadas de Bajo Stock
        </h2>
        <p className="text-xs text-slate-450 mt-1">
          Productos cuyas existencias actuales se encuentran por debajo del Umbral Mínimo de Seguridad definido.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Stats column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
              Resumen de Alertas
            </h3>
            
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold block">Agotado Total</span>
                <span className="text-2xl font-black text-rose-200">{criticalAlerts.length} items</span>
              </div>
              <div className="w-9 h-9 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center font-bold font-mono">
                !
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">Bajo Mínimo</span>
                <span className="text-2xl font-black text-amber-200">{warningAlerts.length} items</span>
              </div>
              <div className="w-9 h-9 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold font-mono">
                ▲
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 text-[11px] text-slate-500 leading-normal">
              <span className="font-semibold text-slate-400 block mb-1">💡 ¿Cómo funciona?</span>
              Cada producto posee un nivel mínimo modificable en el catálogo. Cuando el stock real desciende por debajo de ese límite, se activa la advertencia de abastecimiento de forma automatizada e instantánea.
            </div>
          </div>
        </div>

        {/* Right Active Alerts List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Critical Section */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Inmediato: Falta de Existencias Crítica ({criticalAlerts.length})
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criticalAlerts.map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={`alert-${p.id}`}
                    className="bg-rose-500/5 hover:bg-rose-500/10 transition-all border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[10px] font-mono text-rose-400 font-bold tracking-wide">SKU: {p.sku}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">AGOTADO</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{p.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Categoría: {p.category}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-rose-500/10 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Umbral requerido: <span className="font-bold text-rose-300">{p.minQuantity} un.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenReplenish(p)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl text-xs font-extrabold font-mono transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Abastecer
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-widest font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Atención: Bajo Nivel de Seguridad ({warningAlerts.length})
            </span>

            {warningAlerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {warningAlerts.map(p => (
                  <motion.div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-850/40 transition-all rounded-3xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] font-mono text-slate-500">SKU: {p.sku}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">REABASTECER</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{p.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Categoría: {p.category}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Stock Actual</div>
                        <div className="text-base font-extrabold text-amber-400 font-mono">
                          {p.quantity} <span className="text-xs text-slate-450 font-normal">/ {p.minQuantity} un.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenReplenish(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-850 hover:border-slate-800 rounded-xl text-xs font-semibold font-mono transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                        Surtir
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              criticalAlerts.length === 0 && (
                <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-850 rounded-3xl text-slate-550 flex flex-col items-center justify-center gap-2">
                  <Box className="w-8 h-8 text-slate-650 shrink-0" />
                  <div>
                    <h5 className="font-bold text-slate-400">¡Almacén saludable!</h5>
                    <p className="text-xs text-slate-600 mt-1">Todos los artículos se encuentran por encima de sus límites de seguridad.</p>
                  </div>
                </div>
              )
            )}
          </div>

          {alertsList.length === 0 && products.length > 0 && (
            <div className="p-12 text-center bg-slate-900 border border-slate-850 rounded-3xl flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Cero Alertas de Inventario</h4>
                <p className="text-xs text-slate-450 max-w-sm mx-auto mt-1">
                  Las existencias de todos sus artículos del catálogo se encuentran en niveles correctos para cubrir la operación.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
