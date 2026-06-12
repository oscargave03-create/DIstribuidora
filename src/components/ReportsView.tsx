import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  Layers, 
  Printer, 
  ArrowLeftRight,
  ClipboardCopy,
  Clock,
  User,
  Search
} from 'lucide-react';
import { Product, StockHistory } from '../types';

interface ReportsViewProps {
  products: Product[];
  history: StockHistory[];
}

const COLORS = ['#0d9488', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

export default function ReportsView({ products, history }: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Financial statistics
  const stats = useMemo(() => {
    let rawValue = 0;
    let rawUnits = 0;
    const catMap: Record<string, { quantity: number; value: number }> = {};

    products.forEach(p => {
      const v = p.quantity * p.price;
      rawValue += v;
      rawUnits += p.quantity;

      if (!catMap[p.category]) {
        catMap[p.category] = { quantity: 0, value: 0 };
      }
      catMap[p.category].quantity += p.quantity;
      catMap[p.category].value += v;
    });

    const categoryDataForCharts = Object.entries(catMap).map(([name, data]) => ({
      name,
      cantidad: data.quantity,
      valor: parseFloat(data.value.toFixed(2))
    }));

    return {
      totalValue: rawValue,
      totalUnits: rawUnits,
      avgPrice: products.length ? rawValue / rawUnits : 0,
      categoriesCount: Object.keys(catMap).length,
      categoryChartData: categoryDataForCharts
    };
  }, [products]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchSearch = 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' ? true : item.type === filterType;

      return matchSearch && matchType;
    });
  }, [history, searchTerm, filterType]);

  // Export report tabular copy
  const handleCopyReport = () => {
    let txt = `REPORTE DE INVENTARIO - ${new Date().toLocaleDateString()}\n`;
    txt += `Total de Capital Activo: $${stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n`;
    txt += `Volumen Total de Unidades: ${stats.totalUnits} un.\n`;
    txt += `Categorías Activas: ${stats.categoriesCount}\n\n`;
    txt += `CATÁLOGO DETALLADO:\n`;
    txt += `Nombre | SKU | Categoría | Stock | Mínimo | Precio\n`;
    products.forEach(p => {
      txt += `${p.name} | ${p.sku} | ${p.category} | ${p.quantity} | ${p.minQuantity} | $${p.price}\n`;
    });

    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Reportes Avanzados e Historial de Auditorías
          </h2>
          <p className="text-xs text-slate-450 mt-1">
            Métricas de valoración, distribución de activos en almacén e historial inmutable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer font-semibold"
          >
            <ClipboardCopy className="w-4 h-4 text-teal-400" />
            <span>{copied ? "Copiado!" : "Copiar Resumen de Stock"}</span>
          </button>
          
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer font-semibold"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Kárdex</span>
          </button>
        </div>
      </div>

      {/* Grid summarizing Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Valor del Inventario</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              $
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">$ {stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-slate-450 mt-1">Valor de adquisición de todo el stock activo.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Total Unidades</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.totalUnits.toLocaleString('es-ES')} un.</div>
            <p className="text-[10px] text-slate-450 mt-1">Suma global de unidades en estanterías.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Costo Promedio del Item</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              $ {stats.avgPrice ? stats.avgPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-[10px] text-slate-450 mt-1">Relación costo total dividido unidades totales.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Categorías Activas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.categoriesCount} agrupaciones</div>
            <p className="text-[10px] text-slate-450 mt-1">Familias de mercaderías clasificadas.</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Recharts Monies allocations */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Finanzas: Valor de Stock por Categoría
          </h3>
          <div className="h-64 sm:h-72 w-full text-xs">
            {stats.categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} unit="$" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2dd4bf' }}
                    formatter={(value) => [`$${value}`, "Capital total"]}
                  />
                  <Bar dataKey="valor" fill="#0d9488" radius={[4, 4, 0, 0]}>
                    {stats.categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-550 border border-dashed border-slate-800 rounded-2xl">
                Cargue productos al catálogo para renderizar análisis.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recharts Quantity allocations */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Volumen: Distribución de Unidades
          </h3>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center text-xs">
            {stats.categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="cantidad"
                  >
                    {stats.categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value) => [`${value} unidades`, "Volumen"]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[11px] text-slate-400 font-mono">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-550 border border-dashed border-slate-800 rounded-2xl">
                Cargue productos para visualizar proporciones del volumen.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inmutable stock movement tracker table */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              Kárdex: Historial Inmutable de Almacén
            </h3>
            <p className="text-xs text-slate-450 mt-1">
              Registro secuencial de ingresos, egresos y modificaciones auditadas de stock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter tags type */}
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-mono">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'create', label: 'Altas' },
                { id: 'add', label: 'Ingresos' },
                { id: 'subtract', label: 'Gastos' },
                { id: 'update', label: 'Cambios' },
                { id: 'delete', label: 'Bajas' }
              ].map(type => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === type.id 
                      ? 'bg-slate-800 text-teal-400 font-semibold' 
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Audit keyword search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por item, usuario..."
                className="bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400 min-w-44"
              />
            </div>
          </div>
        </div>

        {/* Audit data layout table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] text-slate-450 uppercase tracking-widest font-mono">
                <th className="pb-3 pl-4">Fecha / Hora</th>
                <th className="pb-3">Producto / SKU</th>
                <th className="pb-3">Acción</th>
                <th className="pb-3 text-right">Variación</th>
                <th className="pb-3 text-right">Stock Final</th>
                <th className="pb-3 pl-6">Responsable</th>
                <th className="pb-3 pr-4 pl-4">Auditoría / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-xs">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => {
                  let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
                  let textSign = "";
                  let varColor = "text-slate-400 font-mono";

                  if (item.type === 'create') {
                    badgeColor = "bg-teal-500/10 text-teal-400 border-teal-500/20";
                    textSign = "+";
                    varColor = "text-teal-400 font-extrabold font-mono";
                  } else if (item.type === 'add') {
                    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    textSign = "+";
                    varColor = "text-emerald-400 font-extrabold font-mono";
                  } else if (item.type === 'subtract') {
                    badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    textSign = ""; // already has negative in changeAmount
                    varColor = "text-rose-400 font-extrabold font-mono";
                  } else if (item.type === 'delete') {
                    badgeColor = "bg-red-950 text-red-400 border-red-900";
                    varColor = "text-red-400 font-mono";
                  } else if (item.type === 'update') {
                    badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/20 transition group">
                      <td className="py-3.5 pl-4 text-slate-450 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                          <span>
                            {new Date(item.timestamp).toLocaleString('es-ES', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 font-semibold text-white max-w-44 truncate">
                        <span>{item.productName}</span>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {item.productId.substring(0,6)}</div>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeColor}`}>
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right font-mono ${varColor}`}>
                        {item.type === 'update' || item.type === 'delete' ? (
                          <span className="text-slate-600">-</span>
                        ) : (
                          <span>{textSign}{item.changeAmount}</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-300 font-mono pr-2">
                        {item.type === 'delete' ? '0' : item.newQuantity} un.
                      </td>
                      <td className="py-3.5 pl-6 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.userName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 pl-4 text-slate-400 italic font-mono max-w-64 truncate" title={item.notes}>
                        {item.notes}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-550 italic">
                    Sin eventos registrados en Kardex para estos filtros de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
