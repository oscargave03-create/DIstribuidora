import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowUpDown, 
  FileDown, 
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  TrendingDown,
  Layers
} from 'lucide-react';
import { Product } from '../types';

interface DashboardViewProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onQuickAdjust: (product: Product) => void;
  activeAlertsCount: number;
}

const CATEGORIES = ["Todos", "Abarrotes", "Lácteos y Quesos", "Carnes y Embutidos", "Bebidas y Jugos", "Snacks y Dulces", "Conservas y Enlatados", "Licores", "Tabaco", "Limpieza y Hogar", "Otros"];

export default function DashboardView({ 
  products, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct, 
  onQuickAdjust,
  activeAlertsCount
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle Dynamic Sorting logic
  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Perform filtration based on search, category selection, and safety threshold triggers
  const processedProducts = useMemo(() => {
    let list = [...products];

    // Filter by name, desc, SKU
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (selectedCategory !== "Todos") {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Filter by low stock alerts
    if (showOnlyAlerts) {
      list = list.filter(p => p.quantity <= p.minQuantity);
    }

    // Apply sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }

      return 0;
    });

    return list;
  }, [products, searchTerm, selectedCategory, showOnlyAlerts, sortField, sortDirection]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const units = products.reduce((acc, curr) => acc + curr.quantity, 0);
    const value = products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
    return { units, value };
  }, [products]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top statistics overview panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-teal-500/10 transition" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Ítems Registrados</span>
            <div className="text-xl sm:text-2xl font-black text-white">{products.length} productos</div>
          </div>
          <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-emerald-500/10 transition" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Volumen Almacén</span>
            <div className="text-xl sm:text-2xl font-black text-white">{aggregateStats.units} unidades</div>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-indigo-500/10 transition" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Valor Total Neto</span>
            <div className="text-xl sm:text-2xl font-black text-white">$ {aggregateStats.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
            <span className="font-bold text-sm font-mono">$</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-rose-500/10 transition" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Alertas Críticas</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400">{activeAlertsCount} críticas</div>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${activeAlertsCount > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-950 text-slate-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main filters bar */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left search and safety checks */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre, SKU, Categoría..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 min-w-64"
              />
            </div>

            {/* Safety alert filter toggle */}
            <button
              type="button"
              onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold font-mono transition cursor-pointer ${
                showOnlyAlerts 
                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-400 font-extrabold shadow-sm' 
                  : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{showOnlyAlerts ? "Viendo solo Alertas" : "Filtrar por Bajo Stock"}</span>
            </button>
          </div>

          {/* Right action button */}
          <button
            type="button"
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-teal-500 to-emerald-400 hover:scale-[1.01] active:scale-[0.99] text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-teal-500/10 text-sm cursor-pointer self-start lg:self-auto w-full lg:w-auto"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Dar de alta producto</span>
          </button>
        </div>

        {/* Category horizontal scroll bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-5 border-t border-slate-850/60 no-scrollbar">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold pr-2 font-mono">Familias:</span>
          {CATEGORIES.map(cat => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-950 border-teal-500/50 text-teal-400 border font-bold'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog inventory list table */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                <th className="pb-3.5 pl-4 cursor-pointer hover:text-white" onClick={() => handleSort('sku')}>
                  <div className="flex items-center gap-1">
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="pb-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Nombre / Descripción</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="pb-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    <span>Categoría</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="pb-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1 justify-end">
                    <span>P. Unitario</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="pb-3.5 text-center cursor-pointer hover:text-white" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center gap-1 justify-center">
                    <span>Disponible</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="pb-3.5 text-right">Variación Rápida</th>
                <th className="pb-3.5 pr-4 text-right">Catálogo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              <AnimatePresence>
                {processedProducts.length > 0 ? (
                  processedProducts.map((p) => {
                    const isLow = p.quantity <= p.minQuantity;
                    const isOut = p.quantity === 0;

                    return (
                      <motion.tr 
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-850/15 transition group"
                      >
                        {/* SKU */}
                        <td className="py-3.5 pl-4 font-mono text-xs text-slate-450 whitespace-nowrap uppercase">
                          {p.sku}
                        </td>

                        {/* Name and description */}
                        <td className="py-3.5">
                          <div>
                            <span className="font-bold text-white block truncate max-w-64">{p.name}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-64 leading-normal">
                              {p.description || "Sin descripción adicional registrada."}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 text-slate-350">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-medium font-sans">
                            {p.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 text-right font-semibold text-slate-200">
                          $ {p.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Stock level quantity */}
                        <td className="py-3.5 text-center">
                          {isLow ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono" title={`Mínimo requerido: ${p.minQuantity}`}>
                              {isOut ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              )}
                              <span>{p.quantity} un.</span>
                            </div>
                          ) : (
                            <span className="font-semibold text-teal-400 font-mono">{p.quantity} un.</span>
                          )}
                        </td>

                        {/* Direct Stock Change Buttons */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-slate-950/80 p-1 border border-slate-850 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                onQuickAdjust(p);
                              }}
                              title="Ajustar e ingresar/retirar existencias"
                              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg text-xs font-bold text-slate-400 flex items-center gap-1 cursor-pointer hover:bg-slate-800 transition"
                            >
                              <span>Ajustar Cantidad</span>
                            </button>
                          </div>
                        </td>

                        {/* Action buttons (Edit & Delete) */}
                        <td className="py-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditProduct(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition cursor-pointer"
                              title="Editar ficha"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Dar de baja permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                      No se encontraron artículos registrados que coincidan con los filtros de visualización.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
