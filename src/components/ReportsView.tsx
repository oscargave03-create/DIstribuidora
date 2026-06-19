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
  Search,
  Calendar,
  X,
  FileCheck,
  Check,
  Info
} from 'lucide-react';
import { Product, StockHistory, AppConfig } from '../types';

interface ReportsViewProps {
  products: Product[];
  history: StockHistory[];
  config?: AppConfig;
}

const COLORS = ['#0d9488', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

export default function ReportsView({ products, history, config }: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [printPeriod, setPrintPeriod] = useState<'diario' | 'semanal' | 'mensual' | 'anual' | 'todos'>('todos');
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  // Filter history by period (Diario, Semanal, Mensual, Anual, Todos)
  const timeframeHistory = useMemo(() => {
    const now = new Date();
    
    // Start of today (midnight)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Last 7 days
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    
    // Last 30 days
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    
    // Last 365 days
    const yearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;

    return history.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      if (printPeriod === 'diario') {
        return itemTime >= startOfToday;
      }
      if (printPeriod === 'semanal') {
        return itemTime >= sevenDaysAgo;
      }
      if (printPeriod === 'mensual') {
        return itemTime >= thirtyDaysAgo;
      }
      if (printPeriod === 'anual') {
        return itemTime >= yearAgo;
      }
      return true; // 'todos'
    });
  }, [history, printPeriod]);

  // Stock movement aggregates for the filtered period
  const periodStats = useMemo(() => {
    let totalInputs = 0;
    let totalOutputs = 0;
    const modifiedItems = new Set<string>();

    timeframeHistory.forEach(item => {
      modifiedItems.add(item.productId);
      if (item.type === 'add' || item.type === 'create') {
        totalInputs += item.changeAmount;
      } else if (item.type === 'subtract') {
        totalOutputs += Math.abs(item.changeAmount);
      }
    });

    return {
      totalEvents: timeframeHistory.length,
      totalInputs,
      totalOutputs,
      uniqueProductsCount: modifiedItems.size
    };
  }, [timeframeHistory]);

  // Filtered History for the table (supports search term & operation type)
  const filteredHistory = useMemo(() => {
    return timeframeHistory.filter(item => {
      const matchSearch = 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' ? true : item.type === filterType;

      return matchSearch && matchType;
    });
  }, [timeframeHistory, searchTerm, filterType]);

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
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/15"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir PDF Personalizado</span>
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

          <div className="flex flex-wrap items-center gap-4.5">
            {/* Filter tags period */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historial:</span>
              <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-mono">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'diario', label: 'Diario' },
                  { id: 'semanal', label: 'Semanal' },
                  { id: 'mensual', label: 'Mensual' },
                  { id: 'anual', label: 'Anual' }
                ].map(period => (
                  <button
                    type="button"
                    key={period.id}
                    onClick={() => setPrintPeriod(period.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      printPeriod === period.id 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-bold' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter tags type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operación:</span>
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

        {/* Audit data layout container (Responsive layout compatible) */}
        <div className="overflow-x-auto hidden md:block">
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
                          <User className="w-3.5 h-3.5 text-slate-550" />
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

        {/* MOBILE CARDS LOGS VIEW: visible only on small viewports */}
        <div className="md:hidden space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => {
              let badgeColor = "bg-slate-800 text-slate-400 border-slate-750";
              let textSign = "";
              let varColor = "text-slate-400 font-mono";

              if (item.type === 'create') {
                badgeColor = "bg-teal-500/10 text-teal-300 border-teal-500/20";
                textSign = "+";
                varColor = "text-teal-400 font-extrabold";
              } else if (item.type === 'add') {
                badgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                textSign = "+";
                varColor = "text-emerald-400 font-extrabold";
              } else if (item.type === 'subtract') {
                badgeColor = "bg-rose-500/10 text-rose-300 border-rose-500/20";
                textSign = "";
                varColor = "text-rose-400 font-extrabold";
              } else if (item.type === 'delete') {
                badgeColor = "bg-red-950 text-red-400 border-red-900";
                varColor = "text-red-400";
              } else if (item.type === 'update') {
                badgeColor = "bg-purple-500/10 text-purple-350 border-purple-500/20";
              }

              return (
                <div 
                  key={`kardex-mob-${item.id}`} 
                  className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/70 space-y-3 font-sans text-xs"
                >
                  {/* Top line: Date & Mode badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-450 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.timestamp).toLocaleString('es-ES', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border uppercase ${badgeColor}`}>
                      {item.type}
                    </span>
                  </div>

                  {/* Product name & user responsible */}
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.productName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-600" />
                      Por: {item.userName}
                    </p>
                  </div>

                  {/* Stock variation & final stock box */}
                  <div className="bg-slate-900/50 p-2 rounded-xl flex items-center justify-between border border-slate-850/60">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Variación</span>
                      <span className={`text-xs font-bold font-mono ${varColor}`}>
                        {item.type === 'update' || item.type === 'delete' ? '-' : `${textSign}${item.changeAmount}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Stock Final</span>
                      <span className="text-xs font-bold font-mono text-slate-200">
                        {item.type === 'delete' ? '0' : item.newQuantity} un.
                      </span>
                    </div>
                  </div>

                  {/* Notes & reason */}
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-900/40 italic font-mono leading-normal">
                    <span className="text-[9px] text-slate-600 uppercase font-bold block not-italic font-sans mb-0.5">Nota de Auditoría</span>
                    "{item.notes}"
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-850/35">
              Sin eventos registrados en Kardex para estos filtros de búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* IMPRESIÓN DEL PDF MODAL / PREVISUALIZACIÓN */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Previsualizar Reporte / Exportar PDF</h3>
                  <p className="text-[10px] text-slate-400">Verifique el diseño y los datos de auditoría antes de exportar.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Period Selector controls inside the Modal */}
            <div className="px-6 py-3.5 bg-slate-900/60 border-b border-slate-850 flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Periodo del PDF:</span>
                <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl font-mono">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'diario', label: 'Diario' },
                    { id: 'semanal', label: 'Semanal' },
                    { id: 'mensual', label: 'Mensual' },
                    { id: 'anual', label: 'Anual' }
                  ].map(period => (
                    <button
                      type="button"
                      key={period.id}
                      onClick={() => setPrintPeriod(period.id as any)}
                      className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                        printPeriod === period.id 
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Se exportarán <b>{timeframeHistory.length}</b> operaciones y kárdex.</span>
              </div>
            </div>

            {/* Paper Preview Sheet Workspace */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/75 flex justify-center">
              <div className="bg-white text-slate-900 p-8 rounded-lg shadow-xl max-w-3xl w-full min-h-[600px] font-sans scale-[0.98] transition">
                
                {/* Distributor Headings */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="space-y-1">
                    {config?.logoUrl && (
                      <img 
                        src={config.logoUrl} 
                        alt="Logo" 
                        className="max-h-12 max-w-[160px] object-contain mb-2 rounded p-0.5 bg-slate-50 border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 leading-none">{config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</h2>
                    <p className="text-[10px] text-slate-500 font-mono">RUC: {config?.ruc || "1792348574001"} • Tel: {config?.telephone || "(02) 299-900"}</p>
                    <p className="text-[10px] text-slate-500">{config?.address || "Quito, Ecuador"}</p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <span className="text-[9px] font-bold uppercase py-0.5 px-2 bg-indigo-600 text-white rounded-md tracking-wider">
                      Copia de Auditoría Periodo: {printPeriod.toUpperCase()}
                    </span>
                    <div className="text-[10px] text-slate-600 mt-2"><b>Fecha Emisión:</b> {new Date().toLocaleString('es-ES')}</div>
                    <div className="text-[10px] text-slate-600"><b>Exportado por:</b> Control Central de Caja</div>
                  </div>
                </div>

                {/* Subtitle / Description of scope */}
                <div className="mb-5 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  <span>Este reporte certifica el estado del inventario activo y los kárdex registrados.</span>
                  <span><b>Generación de Reporte:</b> Automático</span>
                </div>

                {/* Micro financials */}
                <div className="grid grid-cols-4 gap-3 mb-6 text-center text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Capital Total Activo</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">$ {stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Total Unidades Activas</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{stats.totalUnits.toLocaleString('es-ES')} un.</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Altas / Entradas</div>
                    <div className="text-xs font-black text-emerald-600 mt-0.5">+{periodStats.totalInputs} un.</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Bajas / Salidas</div>
                    <div className="text-xs font-black text-rose-600 mt-0.5">-{periodStats.totalOutputs} un.</div>
                  </div>
                </div>

                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b pb-1.5 mb-2 flex items-center justify-between">
                  <span>Secuencia de Transacciones e Historial Kárdex ({printPeriod})</span>
                  <span className="text-[9px] text-slate-500 font-mono font-semibold">{timeframeHistory.length} Filas</span>
                </div>

                {/* Mini Printable Table inside preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-650 font-bold uppercase tracking-wider">
                        <th className="pb-1.5 pl-1">Fecha / Hora</th>
                        <th className="pb-1.5">Producto (SKU)</th>
                        <th className="pb-1.5">Operación</th>
                        <th className="pb-1.5 text-right">Cant. Cambiada</th>
                        <th className="pb-1.5 text-right">Stock Resultante</th>
                        <th className="pb-1.5 pl-4">Responsable</th>
                        <th className="pb-1.5 pl-4">Auditoría / Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {timeframeHistory.length > 0 ? (
                        timeframeHistory.map(item => (
                          <tr key={item.id} className="text-slate-800">
                            <td className="py-2 pl-1 whitespace-nowrap text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleString('es-ES', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2">
                              <span className="font-semibold block leading-tight">{item.productName}</span>
                              <span className="text-[8px] text-slate-400 font-mono">ID: {item.productId.substring(0,8)}</span>
                            </td>
                            <td className="py-2">
                              <span className="text-[8.5px] uppercase font-mono px-1 py-0.5 bg-slate-100 rounded border border-slate-200">
                                {item.type}
                              </span>
                            </td>
                            <td className={`py-2 text-right font-mono font-bold ${
                              item.type === 'add' || item.type === 'create' ? 'text-emerald-600' : item.type === 'subtract' ? 'text-rose-600' : 'text-slate-500'
                            }`}>
                              {item.type === 'update' || item.type === 'delete' ? '-' : (item.changeAmount > 0 ? `+${item.changeAmount}` : item.changeAmount)}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold">{item.type === 'delete' ? '0' : item.newQuantity} un.</td>
                            <td className="py-2 pl-4 font-medium text-slate-800 truncate max-w-28">{item.userName}</td>
                            <td className="py-2 pl-4 italic text-slate-500 max-w-44 truncate" title={item.notes}>{item.notes}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                            No hay transacciones registradas para este periodo en Almacén.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 text-center text-[8.5px] text-slate-400 border-t pt-3 flex justify-between items-center font-mono">
                  <span>Generado inmutablemente por el Sistema ERP Distribuidora</span>
                  <span>Firma Autorizada y Sello de Almacén</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-450 hover:text-white rounded-xl text-xs transition font-semibold cursor-pointer"
              >
                Cerrar Previsualización
              </button>
              
              <button
                type="button"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/20"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar como PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRO DE SOPORTE PARA IMPRESIONES DIRECTAS DE PAGINA (SOLO @media print) */}
      <div id="print-report-area" className="hidden print:block bg-white text-slate-900 p-8 font-sans">
        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-5 mb-6">
          <div className="space-y-1 col-span-2">
            {config?.logoUrl && (
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                className="max-h-20 max-w-[200px] object-contain mb-3 rounded p-0.5 bg-white border border-slate-200"
                referrerPolicy="no-referrer"
              />
            )}
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 leading-none">{config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</h1>
            <p className="text-xs text-slate-650 font-mono">RUC: {config?.ruc || "1792348574001"} • Tel: {config?.telephone || "(02) 299-900"}</p>
            <p className="text-xs text-slate-650">{config?.address || "Quito, Ecuador"}</p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[9px] font-extrabold uppercase py-1 px-3 bg-slate-950 text-white rounded-md tracking-wider">
              COPIA DE REPORTES ({printPeriod.toUpperCase()})
            </span>
            <div className="text-xs text-slate-700 mt-3"><b>Fecha Emisión:</b> {new Date().toLocaleString()}</div>
            <div className="text-xs text-slate-700"><b>Movimientos Registrados:</b> {timeframeHistory.length} eventos</div>
          </div>
        </div>

        {/* Financial KPI values inside report */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Capital Total Activo</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">$ {stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Volumen Unidades</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{stats.totalUnits.toLocaleString('es-ES')} un.</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Altas / Ingresos ({printPeriod})</div>
            <div className="text-sm font-black text-emerald-600 mt-0.5">+{periodStats.totalInputs} un.</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Saliendo / Gastos ({printPeriod})</div>
            <div className="text-sm font-black text-rose-600 mt-0.5">-{periodStats.totalOutputs} un.</div>
          </div>
        </div>

        <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-3 border-b-2 pb-1 text-slate-900">
          Lista de Transacciones e Historial Histórico (Kárdex)
        </h3>

        <table className="w-full text-[10px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-400 text-slate-700 font-bold uppercase tracking-wider">
              <th className="py-2.5">Fecha</th>
              <th className="py-2.5">Detalles del Producto (ID)</th>
              <th className="py-2.5">Tipo</th>
              <th className="py-2.5 text-right">Cant. Modificada</th>
              <th className="py-2.5 text-right">Stock Restante</th>
              <th className="py-2.5 pl-4">Encargado</th>
              <th className="py-2.5 pl-4">Auditoría / Motivos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timeframeHistory.length > 0 ? (
              timeframeHistory.map(item => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-2.5 whitespace-nowrap text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleString('es-ES', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-2.5 font-semibold">
                    <div>{item.productName}</div>
                    <span className="text-[8.5px] text-slate-400 font-mono">SKU ID: {item.productId.substring(0, 8)}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[8.5px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-250 text-slate-700">
                      {item.type}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-mono font-bold ${
                    item.type === 'add' || item.type === 'create' ? 'text-emerald-600' : item.type === 'subtract' ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    {item.type === 'update' || item.type === 'delete' ? '-' : (item.changeAmount > 0 ? `+${item.changeAmount}` : item.changeAmount)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold">{item.type === 'delete' ? '0' : item.newQuantity} un.</td>
                  <td className="py-2.5 pl-4 font-medium text-slate-800">{item.userName}</td>
                  <td className="py-2.5 pl-4 italic text-slate-600">{item.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No hay movimientos registrados para este periodo ({printPeriod}).
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-12 text-center text-[9px] text-slate-400 border-t pt-4">
          Este documento de kárdex es una copia oficial e inviolable.
          <br />
          <b>Distribuidora {config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</b> • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
