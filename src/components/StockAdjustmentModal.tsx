import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, MinusCircle, PlusCircle, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string, updates: Partial<Product>, adjustReason: { changeAmount: number, notes: string }) => Promise<void>;
}

export default function StockAdjustmentModal({ isOpen, onClose, product, onConfirm }: StockAdjustmentModalProps) {
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(1);
    setNotes('');
    setMode('add');
    setError(null);
  }, [product, isOpen]);

  if (!product) return null;

  const currentQuantity = product.quantity;
  const netChange = mode === 'add' ? amount : -amount;
  const projectedQuantity = currentQuantity + netChange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError("La cantidad de ajuste debe ser mayor a 0.");
      return;
    }

    if (mode === 'subtract' && projectedQuantity < 0) {
      setError(`No es posible retirar ${amount} unidades. El stock final no puede ser un número negativo.`);
      return;
    }

    if (!notes.trim()) {
      setError("Es obligatorio indicar un motivo/nota para auditar este ajuste.");
      return;
    }

    setLoading(true);
    try {
      const updatedProduct: Partial<Product> = {
        name: product.name, // required for history logger name consistency
        quantity: projectedQuantity
      };

      await onConfirm(
        product.id,
        updatedProduct,
        {
          changeAmount: netChange,
          notes: notes.trim()
        }
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar el ajuste de almacén.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  Ajustar Inventario
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  SKU: {product.sku}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Product Card Info */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-teal-400 tracking-wider">Producto seleccionado</span>
                <h4 className="text-base font-bold text-white mb-1">{product.name}</h4>
                <p className="text-xs text-slate-450 line-clamp-1">{product.description || "Sin descripción registrada"}</p>
              </div>

              {/* Action Mode selection buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('add')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold transition text-sm cursor-pointer ${
                    mode === 'add'
                      ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-lg shadow-teal-500/10'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ingresar Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('subtract')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold transition text-sm cursor-pointer ${
                    mode === 'subtract'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Retirar Stock</span>
                </button>
              </div>

              {/* Math preview of calculated inventory levels */}
              <div className="bg-slate-950/30 rounded-2xl border border-slate-850 p-4 flex items-center justify-between text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Stock Actual</span>
                  <div className="text-xl font-extrabold text-slate-350">{currentQuantity}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ajuste</span>
                  <div className={`text-xl font-extrabold ${mode === 'add' ? 'text-teal-400' : 'text-rose-400'}`}>
                    {mode === 'add' ? `+${amount}` : `-${amount}`}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="space-y-1">
                  <span className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">Proyectado</span>
                  <div className={`text-2xl font-black ${projectedQuantity <= product.minQuantity ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
                    {projectedQuantity}
                  </div>
                </div>
              </div>

              {/* Adjustment quantity field */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cantidad a Ajustar *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center text-white font-extrabold text-lg focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Audit trace notes field */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Motivo del Ajuste *</span>
                  <span className="text-[10px] text-slate-500 normal-case">Mandatorio para auditoría</span>
                </label>
                <input
                  type="text"
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Recepción lote #302, Corrección de merma, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer text-sm ${
                    mode === 'add'
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/10'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/10'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Registrar Movimiento</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
