import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, HelpCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  product?: Product | null; // If passed, we are in EDIT mode
}

const CATEGORIES = ["Abarrotes", "Lácteos y Quesos", "Carnes y Embutidos", "Bebidas y Jugos", "Snacks y Dulces", "Conservas y Enlatados", "Licores", "Tabaco", "Limpieza y Hogar", "Otros"];

export default function ProductFormModal({ isOpen, onClose, onSubmit, product }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(2);
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load product details if in EDIT mode
  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description || '');
      setQuantity(product.quantity);
      setMinQuantity(product.minQuantity);
      setPrice(product.price);
      setCategory(product.category);
    } else {
      // Reset to defaults
      setName('');
      setSku('');
      setDescription('');
      setQuantity(0);
      setMinQuantity(2);
      setPrice(0);
      setCategory(CATEGORIES[0]);
    }
    setError(null);
  }, [product, isOpen]);

  // Clean SKU string to follow rules strictly
  const handleSkuChange = (val: string) => {
    // Only alphanumeric and dash/underscores
    const sanitized = val.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    setSku(sanitized);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dynamic field integrity checks matching security schema
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    if (!sku.trim()) {
      setError("Código SKU obligatorio.");
      return;
    }
    if (quantity < 0) {
      setError("La cantidad inicial no puede ser un número negativo.");
      return;
    }
    if (minQuantity < 0) {
      setError("La alerta de bajo inventario no puede ser inferior a 0.");
      return;
    }
    if (price < 0) {
      setError("El precio unitario no puede ser negativo.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim(),
        description: description.trim(),
        quantity,
        minQuantity,
        price,
        category
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar el producto en el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-bold text-white font-display">
                {product ? "Editar Producto del Catálogo" : "Agregar Nuevo Producto"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error panel */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Teclado Mecánico Pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    Código SKU *
                    <span className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-teal-400 cursor-help" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded-lg p-2 w-48 hidden group-hover:block z-20 shadow-xl leading-normal normal-case font-normal">
                        Identificador único. Mayúsculas sin espacios, guiones permitidos (A-Z, 0-9, _, -).
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!product} // SKU shouldn't be altered on edit to maintain relational index
                    value={sku}
                    onChange={(e) => handleSkuChange(e.target.value)}
                    placeholder="INV-TEC-001"
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-350 focus:outline-none focus:border-teal-500 transition"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Descripción / Detalles
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escriba especificaciones técnicas, ubicación u observaciones de stock..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Cantidad Inicial *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={!!product} // In edit mode, stock adjustments should be done via audit logs for security
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-55 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition"
                  />
                  {product && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
                      Ajuste el stock mediante controles directos en la fila.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="col-span-2 bg-slate-950/40 border border-slate-850 p-3 rounded-2xl">
                  <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
                    Umbral de Alerta de Bajo Inventario *
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Si el stock del producto cae a o por debajo de esta cantidad, se activarán las alertas de reposición automática.
                  </p>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-center font-bold text-white focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{product ? "Guardar Cambios" : "Agregar Producto"}</span>
                    </>
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
