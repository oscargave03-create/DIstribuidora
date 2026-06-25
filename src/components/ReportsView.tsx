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
  Info,
  ShoppingCart
} from 'lucide-react';
import { Product, StockHistory, AppConfig, Sale } from '../types';

interface ReportsViewProps {
  products: Product[];
  history: StockHistory[];
  sales: Sale[];
  config?: AppConfig;
}

const COLORS = ['#0d9488', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'];

export default function ReportsView({ products, history, sales = [], config }: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [printPeriod, setPrintPeriod] = useState<'diario' | 'semanal' | 'mensual' | 'anual' | 'todos'>('todos');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sub-navigation tabs
  const [subTab, setSubTab] = useState<'inventory' | 'sales' | 'purchases'>('inventory');
  const [salesPeriod, setSalesPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [purchasesPeriod, setPurchasesPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

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

  // Helper to check if a date falls in the selected sales period (day, week, month, year)
  const filterSalesByPeriod = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Start of week (7 days ago)
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    
    // Start of month (30 days ago)
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    
    // Start of year (365 days ago)
    const yearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;

    return sales.filter(s => {
      const saleTime = new Date(s.createdAt).getTime();
      const saleDateStr = new Date(s.createdAt).toDateString();
      
      if (salesPeriod === 'day') {
        return saleDateStr === todayStr;
      }
      if (salesPeriod === 'week') {
        return saleTime >= sevenDaysAgo;
      }
      if (salesPeriod === 'month') {
        return saleTime >= thirtyDaysAgo;
      }
      if (salesPeriod === 'year') {
        return saleTime >= yearAgo;
      }
      return true;
    });
  }, [sales, salesPeriod]);

  // Aggregate Sales Stats
  const salesStats = useMemo(() => {
    let totalRevenue = 0;
    let transactionsCount = filterSalesByPeriod.length;
    let itemsCount = 0;
    let totalTax = 0;
    
    // Payment method distribution
    const paymentMethods: Record<string, number> = {};
    // Category distribution of items sold
    const itemsByProduct: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filterSalesByPeriod.forEach(s => {
      totalRevenue += s.total;
      totalTax += s.totalTax || 0;
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + s.total;
      
      if (s.items) {
        s.items.forEach(item => {
          itemsCount += item.quantity;
          if (!itemsByProduct[item.productId]) {
            itemsByProduct[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
          }
          itemsByProduct[item.productId].quantity += item.quantity;
          itemsByProduct[item.productId].revenue += item.subtotal;
        });
      }
    });

    const chartDataMap: Record<string, number> = {};
    // Generate chart data based on period
    filterSalesByPeriod.forEach(s => {
      const date = new Date(s.createdAt);
      let label = '';
      if (salesPeriod === 'day') {
        label = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (salesPeriod === 'week') {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        label = days[date.getDay()];
      } else if (salesPeriod === 'month') {
        label = `Día ${date.getDate()}`;
      } else if (salesPeriod === 'year') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        label = months[date.getMonth()];
      }
      chartDataMap[label] = (chartDataMap[label] || 0) + s.total;
    });

    const trendChartData = Object.entries(chartDataMap).map(([label, total]) => ({
      name: label,
      Ventas: parseFloat(total.toFixed(2))
    }));

    // If day/week/month/year chart data is empty, populate with template entries for visual beauty
    if (trendChartData.length === 0) {
      if (salesPeriod === 'day') {
        ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(l => trendChartData.push({ name: l, Ventas: 0 }));
      } else if (salesPeriod === 'week') {
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(l => trendChartData.push({ name: l, Ventas: 0 }));
      } else if (salesPeriod === 'month') {
        ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'].forEach(l => trendChartData.push({ name: l, Ventas: 0 }));
      } else if (salesPeriod === 'year') {
        ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].forEach(l => trendChartData.push({ name: l, Ventas: 0 }));
      }
    } else {
      if (salesPeriod === 'day') {
        trendChartData.sort((a, b) => a.name.localeCompare(b.name));
      } else if (salesPeriod === 'month') {
        trendChartData.sort((a, b) => {
          const numA = parseInt(a.name.replace('Día ', '')) || 0;
          const numB = parseInt(b.name.replace('Día ', '')) || 0;
          return numA - numB;
        });
      }
    }

    const paymentChartData = Object.entries(paymentMethods).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));

    const topSellingProducts = Object.values(itemsByProduct)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue,
      transactionsCount,
      itemsCount,
      totalTax,
      avgTicket: transactionsCount ? totalRevenue / transactionsCount : 0,
      trendChartData,
      paymentChartData,
      topSellingProducts
    };
  }, [filterSalesByPeriod, salesPeriod]);

  // Helper to check if a stock history event counts as a purchase/addition and falls in period
  const filterPurchasesByPeriod = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const yearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;

    return history.filter(item => {
      const isAddition = (item.type === 'add' || item.type === 'create') && item.changeAmount > 0;
      if (!isAddition) return false;

      const itemTime = new Date(item.timestamp).getTime();
      const itemDateStr = new Date(item.timestamp).toDateString();
      
      if (purchasesPeriod === 'day') {
        return itemDateStr === todayStr;
      }
      if (purchasesPeriod === 'week') {
        return itemTime >= sevenDaysAgo;
      }
      if (purchasesPeriod === 'month') {
        return itemTime >= thirtyDaysAgo;
      }
      if (purchasesPeriod === 'year') {
        return itemTime >= yearAgo;
      }
      return true;
    });
  }, [history, purchasesPeriod]);

  // Aggregate Purchases Stats
  const purchasesStats = useMemo(() => {
    let totalSpent = 0;
    let transactionsCount = filterPurchasesByPeriod.length;
    let unitsAcquired = 0;
    
    const itemsByProduct: Record<string, { name: string; quantity: number; spent: number }> = {};
    const chartDataMap: Record<string, number> = {};

    filterPurchasesByPeriod.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const costEstimated = prod ? prod.price * 0.75 : 10; // estimate cost as 75% of sales price
      const totalCost = costEstimated * item.changeAmount;

      totalSpent += totalCost;
      unitsAcquired += item.changeAmount;

      if (!itemsByProduct[item.productId]) {
        itemsByProduct[item.productId] = { name: item.productName, quantity: 0, spent: 0 };
      }
      itemsByProduct[item.productId].quantity += item.changeAmount;
      itemsByProduct[item.productId].spent += totalCost;

      const date = new Date(item.timestamp);
      let label = '';
      if (purchasesPeriod === 'day') {
        label = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (purchasesPeriod === 'week') {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        label = days[date.getDay()];
      } else if (purchasesPeriod === 'month') {
        label = `Día ${date.getDate()}`;
      } else if (purchasesPeriod === 'year') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        label = months[date.getMonth()];
      }
      chartDataMap[label] = (chartDataMap[label] || 0) + totalCost;
    });

    const trendChartData = Object.entries(chartDataMap).map(([label, total]) => ({
      name: label,
      Compras: parseFloat(total.toFixed(2))
    }));

    if (trendChartData.length === 0) {
      if (purchasesPeriod === 'day') {
        ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(l => trendChartData.push({ name: l, Compras: 0 }));
      } else if (purchasesPeriod === 'week') {
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(l => trendChartData.push({ name: l, Compras: 0 }));
      } else if (purchasesPeriod === 'month') {
        ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'].forEach(l => trendChartData.push({ name: l, Compras: 0 }));
      } else if (purchasesPeriod === 'year') {
        ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].forEach(l => trendChartData.push({ name: l, Compras: 0 }));
      }
    } else {
      if (purchasesPeriod === 'day') {
        trendChartData.sort((a, b) => a.name.localeCompare(b.name));
      } else if (purchasesPeriod === 'month') {
        trendChartData.sort((a, b) => {
          const numA = parseInt(a.name.replace('Día ', '')) || 0;
          const numB = parseInt(b.name.replace('Día ', '')) || 0;
          return numA - numB;
        });
      }
    }

    const topPurchasedProducts = Object.values(itemsByProduct)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSpent,
      transactionsCount,
      unitsAcquired,
      avgItemCost: unitsAcquired ? totalSpent / unitsAcquired : 0,
      trendChartData,
      topPurchasedProducts
    };
  }, [filterPurchasesByPeriod, products, purchasesPeriod]);

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
    let txt = "";
    if (subTab === 'inventory') {
      txt += `REPORTE DE VALORACIÓN Y STOCK - ${new Date().toLocaleDateString()}\n`;
      txt += `Total de Capital Activo: $${stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n`;
      txt += `Volumen Total de Unidades: ${stats.totalUnits} un.\n`;
      txt += `Categorías Activas: ${stats.categoriesCount}\n\n`;
      txt += `CATÁLOGO DETALLADO:\n`;
      txt += `Nombre | SKU | Categoría | Stock | Mínimo | Precio\n`;
      products.forEach(p => {
        txt += `${p.name} | ${p.sku} | ${p.category} | ${p.quantity} | ${p.minQuantity} | $${p.price}\n`;
      });
    } else if (subTab === 'sales') {
      const periodLabel = salesPeriod === 'day' ? 'Hoy' : salesPeriod === 'week' ? 'Semanal (7d)' : salesPeriod === 'month' ? 'Mensual (30d)' : 'Anual (365d)';
      txt += `REPORTE DE VENTAS (${periodLabel.toUpperCase()}) - ${new Date().toLocaleDateString()}\n`;
      txt += `Total Facturado: $${salesStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n`;
      txt += `Transacciones (Tickets): ${salesStats.transactionsCount} ventas\n`;
      txt += `Productos Vendidos: ${salesStats.itemsCount} unidades\n`;
      txt += `Ticket Promedio: $${salesStats.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n\n`;
      txt += `PRODUCTOS MÁS VENTAS:\n`;
      salesStats.topSellingProducts.forEach((p, idx) => {
        txt += `#${idx + 1} ${p.name} | Cantidad: ${p.quantity} un. | Ingreso: $${p.revenue.toFixed(2)}\n`;
      });
      txt += `\nHISTORIAL DE VENTAS:\n`;
      txt += `Ticket | Fecha | Cliente | Método Pago | Total\n`;
      filterSalesByPeriod.forEach(s => {
        txt += `${s.ticketId || s.id.substring(0, 8).toUpperCase()} | ${new Date(s.createdAt).toLocaleDateString()} | ${s.clientName || "Consumidor Final"} | ${s.paymentMethod} | $${s.total.toFixed(2)}\n`;
      });
    } else if (subTab === 'purchases') {
      const periodLabel = purchasesPeriod === 'day' ? 'Hoy' : purchasesPeriod === 'week' ? 'Semanal (7d)' : purchasesPeriod === 'month' ? 'Mensual (30d)' : 'Anual (365d)';
      txt += `REPORTE DE COMPRAS Y ADQUISICIONES (${periodLabel.toUpperCase()}) - ${new Date().toLocaleDateString()}\n`;
      txt += `Total Invertido (Estimado): $${purchasesStats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n`;
      txt += `Adquisiciones Registradas: ${purchasesStats.transactionsCount} ingresos\n`;
      txt += `Unidades Adquiridas: ${purchasesStats.unitsAcquired} un.\n\n`;
      txt += `HISTORIAL DE ADQUISICIONES:\n`;
      txt += `Producto | Fecha | Cantidad | Encargado | Motivo\n`;
      filterPurchasesByPeriod.forEach(item => {
        txt += `${item.productName} | ${new Date(item.timestamp).toLocaleDateString()} | +${item.changeAmount} un. | ${item.userName} | ${item.notes}\n`;
      });
    }

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
            Métricas de valoración, distribución de activos en almacén, ventas e ingresos del sistema.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex bg-slate-900 p-1 border border-slate-850 rounded-2xl text-xs font-semibold gap-1 max-w-xl shadow-lg">
        <button
          onClick={() => setSubTab('inventory')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'inventory' 
              ? 'bg-slate-950 text-teal-400 font-bold border border-teal-500/10' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Valoración y Kárdex</span>
        </button>

        <button
          onClick={() => setSubTab('sales')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'sales' 
              ? 'bg-slate-950 text-indigo-400 font-bold border border-indigo-500/10' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Reporte de Ventas</span>
        </button>

        <button
          onClick={() => setSubTab('purchases')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'purchases' 
              ? 'bg-slate-950 text-amber-400 font-bold border border-amber-500/10' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Compras y Adquisiciones</span>
        </button>
      </div>

      {subTab === 'inventory' && (
        <div className="space-y-8 animate-fade-in">
          {/* Acciones de Valoración y Kárdex */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-850 rounded-2xl shadow-md">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
                Valoración General y Auditoría
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Resumen analítico del inventario actual y control inmutable de movimientos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer font-semibold"
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
        </div>
      )}

      {subTab === 'sales' && (
        <div className="space-y-8 animate-fade-in">
          {/* Period Selector and Subtitle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-850 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
                Análisis de Ventas (Facturación POS)
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Visualice ingresos, volúmenes de venta e indicadores clave según el periodo seleccionado.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-mono">
                {[
                  { id: 'day', label: 'Diario (Hoy)' },
                  { id: 'week', label: 'Semanal (7d)' },
                  { id: 'month', label: 'Mensual (30d)' },
                  { id: 'year', label: 'Anual (365d)' }
                ].map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSalesPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      salesPeriod === p.id 
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer font-semibold"
                >
                  <ClipboardCopy className="w-4 h-4 text-teal-400" />
                  <span>{copied ? "Copiado!" : "Copiar Resumen"}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Total Facturado</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  $
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">$ {salesStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-[10px] text-slate-450 mt-1">Ingresos brutos por ventas en el periodo.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Transacciones (Tickets)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{salesStats.transactionsCount} ventas</div>
                <p className="text-[10px] text-slate-450 mt-1">Comprobantes y tickets despachados.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Productos Vendidos</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{salesStats.itemsCount} unidades</div>
                <p className="text-[10px] text-slate-450 mt-1">Cantidad total de productos entregados.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Ticket Promedio</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  $ {salesStats.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-450 mt-1">Gasto medio por cada compra de cliente.</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue trend line chart */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Tendencia de Ingresos por Ventas
              </h3>
              <div className="h-64 sm:h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesStats.trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} unit="$" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                      itemStyle={{ color: '#818cf8' }}
                      formatter={(value) => [`$${value}`, "Total Facturado"]}
                    />
                    <Bar dataKey="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment methods and Top products */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Productos Más Vendidos
                </h3>
                {salesStats.topSellingProducts.length > 0 ? (
                  <div className="space-y-4">
                    {salesStats.topSellingProducts.map((p, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 font-black">#{index + 1}</span>
                          <span className="text-xs font-semibold text-slate-200 max-w-40 truncate">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white block">{p.quantity} un.</span>
                          <span className="text-[10px] font-mono text-slate-500">$ {p.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-550 italic text-center py-10 text-xs">
                    No hay productos registrados en este periodo.
                  </div>
                )}
              </div>

              {salesStats.paymentChartData.length > 0 && (
                <div className="border-t border-slate-850 pt-4 mt-4">
                  <h4 className="text-[10px] uppercase font-bold text-slate-450 tracking-wider mb-2">Métodos de Pago</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {salesStats.paymentChartData.map((pm, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-850/40">
                        <span className="text-slate-400 capitalize">{pm.name}</span>
                        <span className="font-bold text-emerald-400">${pm.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sales log list */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white font-display mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Historial de Ventas Despachadas ({salesPeriod})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] text-slate-450 uppercase tracking-widest font-mono">
                    <th className="pb-3 pl-4">Comprobante / Ticket ID</th>
                    <th className="pb-3">Fecha / Hora</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Método Pago</th>
                    <th className="pb-3 text-right">Impuestos</th>
                    <th className="pb-3 text-right pr-4">Total Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs">
                  {filterSalesByPeriod.length > 0 ? (
                    filterSalesByPeriod.map(s => (
                      <tr key={s.id} className="hover:bg-slate-850/20 transition">
                        <td className="py-3.5 pl-4 font-mono font-bold text-white">
                          {s.ticketId || s.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3.5 text-slate-450 font-mono">
                          {new Date(s.createdAt).toLocaleString('es-ES')}
                        </td>
                        <td className="py-3.5 text-slate-200">
                          {s.clientName || "Consumidor Final"}
                        </td>
                        <td className="py-3.5 text-slate-350 capitalize">
                          {s.paymentMethod}
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-400">
                          $ {(s.totalTax || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-emerald-400 pr-4">
                          $ {s.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-550 italic">
                        No hay ventas registradas para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'purchases' && (
        <div className="space-y-8 animate-fade-in">
          {/* Period Selector and Subtitle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-850 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
                Análisis de Compras y Abastecimiento
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Supervise egresos por adquisición de mercaderías e ingresos de stock al almacén.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-mono">
                {[
                  { id: 'day', label: 'Diario (Hoy)' },
                  { id: 'week', label: 'Semanal (7d)' },
                  { id: 'month', label: 'Mensual (30d)' },
                  { id: 'year', label: 'Anual (365d)' }
                ].map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPurchasesPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      purchasesPeriod === p.id 
                        ? 'bg-amber-600/15 text-amber-400 border border-amber-500/20 font-bold' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer font-semibold"
                >
                  <ClipboardCopy className="w-4 h-4 text-teal-400" />
                  <span>{copied ? "Copiado!" : "Copiar Resumen"}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Inversión Estimada</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  $
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">$ {purchasesStats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-[10px] text-slate-450 mt-1">Valor de adquisición de la mercadería.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Abastecimientos</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{purchasesStats.transactionsCount} entradas</div>
                <p className="text-[10px] text-slate-450 mt-1">Operaciones de adición o reabastecimiento.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Unidades Adquiridas</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">{purchasesStats.unitsAcquired} un.</div>
                <p className="text-[10px] text-slate-450 mt-1">Cantidad de productos sumados al stock.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Costo Medio</span>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  $ {purchasesStats.avgItemCost.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-450 mt-1">Costo medio estimado por unidad ingresada.</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost trend bar chart */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Historial de Gastos de Adquisición
              </h3>
              <div className="h-64 sm:h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchasesStats.trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} unit="$" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                      itemStyle={{ color: '#f59e0b' }}
                      formatter={(value) => [`$${value}`, "Adquisición Estimada"]}
                    />
                    <Bar dataKey="Compras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Purchased products */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Productos Más Comprados
              </h3>
              {purchasesStats.topPurchasedProducts.length > 0 ? (
                <div className="space-y-4">
                  {purchasesStats.topPurchasedProducts.map((p, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500 font-black">#{index + 1}</span>
                        <span className="text-xs font-semibold text-slate-200 max-w-40 truncate">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">+{p.quantity} un.</span>
                        <span className="text-[10px] font-mono text-slate-500">$ {p.spent.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-550 italic text-center py-10 text-xs">
                  No hay adquisiciones en este periodo.
                </div>
              )}
            </div>
          </div>

          {/* Log list of purchases */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white font-display mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Ingresos a Inventario / Compras ({purchasesPeriod})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] text-slate-450 uppercase tracking-widest font-mono">
                    <th className="pb-3 pl-4">Producto / SKU</th>
                    <th className="pb-3">Fecha / Hora</th>
                    <th className="pb-3 text-right">Cantidad Ingresada</th>
                    <th className="pb-3">Responsable</th>
                    <th className="pb-3 pl-4 pr-4">Motivo / Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs">
                  {filterPurchasesByPeriod.length > 0 ? (
                    filterPurchasesByPeriod.map(item => (
                      <tr key={item.id} className="hover:bg-slate-850/20 transition">
                        <td className="py-3.5 pl-4 font-semibold text-white">
                          {item.productName}
                        </td>
                        <td className="py-3.5 text-slate-450 font-mono">
                          {new Date(item.timestamp).toLocaleString('es-ES')}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-emerald-400">
                          +{item.changeAmount} un.
                        </td>
                        <td className="py-3.5 text-slate-300">
                          {item.userName}
                        </td>
                        <td className="py-3.5 pl-4 pr-4 text-slate-400 italic max-w-64 truncate" title={item.notes}>
                          {item.notes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-550 italic">
                        No hay adquisiciones registradas para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-[10px] text-slate-400">Verifique el diseño y los datos del reporte antes de exportar.</p>
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
                {subTab === 'inventory' ? (
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
                ) : subTab === 'sales' ? (
                  <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl font-mono">
                    {[
                      { id: 'day', label: 'Diario' },
                      { id: 'week', label: 'Semanal' },
                      { id: 'month', label: 'Mensual' },
                      { id: 'year', label: 'Anual' }
                    ].map(period => (
                      <button
                        type="button"
                        key={period.id}
                        onClick={() => setSalesPeriod(period.id as any)}
                        className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                          salesPeriod === period.id 
                            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold' 
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl font-mono">
                    {[
                      { id: 'day', label: 'Diario' },
                      { id: 'week', label: 'Semanal' },
                      { id: 'month', label: 'Mensual' },
                      { id: 'year', label: 'Anual' }
                    ].map(period => (
                      <button
                        type="button"
                        key={period.id}
                        onClick={() => setPurchasesPeriod(period.id as any)}
                        className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                          purchasesPeriod === period.id 
                            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold' 
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                {subTab === 'inventory' && (
                  <span>Se exportarán <b>{timeframeHistory.length}</b> operaciones y kárdex.</span>
                )}
                {subTab === 'sales' && (
                  <span>Se exportarán <b>{filterSalesByPeriod.length}</b> ventas de este periodo.</span>
                )}
                {subTab === 'purchases' && (
                  <span>Se exportarán <b>{filterPurchasesByPeriod.length}</b> adquisiciones de este periodo.</span>
                )}
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
                      {subTab === 'inventory' && `Copia de Auditoría Periodo: ${printPeriod.toUpperCase()}`}
                      {subTab === 'sales' && `Copia de Reporte Ventas: ${salesPeriod.toUpperCase()}`}
                      {subTab === 'purchases' && `Copia de Compras: ${purchasesPeriod.toUpperCase()}`}
                    </span>
                    <div className="text-[10px] text-slate-600 mt-2"><b>Fecha Emisión:</b> {new Date().toLocaleString('es-ES')}</div>
                    <div className="text-[10px] text-slate-600"><b>Exportado por:</b> Control Central de Caja</div>
                  </div>
                </div>

                {/* Subtitle / Description of scope */}
                <div className="mb-5 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  {subTab === 'inventory' && (
                    <>
                      <span>Este reporte certifica el estado del inventario activo y los kárdex registrados.</span>
                      <span><b>Generación de Reporte:</b> Automático</span>
                    </>
                  )}
                  {subTab === 'sales' && (
                    <>
                      <span>Este reporte certifica los ingresos totales y la facturación POS autorizada.</span>
                      <span><b>Generación de Reporte:</b> Ventas POS</span>
                    </>
                  )}
                  {subTab === 'purchases' && (
                    <>
                      <span>Este reporte detalla los abastecimientos de mercaderías e ingresos en bodega.</span>
                      <span><b>Generación de Reporte:</b> Almacén / Compras</span>
                    </>
                  )}
                </div>

                {/* Micro financials */}
                {subTab === 'inventory' && (
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
                )}

                {subTab === 'sales' && (
                  <div className="grid grid-cols-4 gap-3 mb-6 text-center text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Total Facturado</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">$ {salesStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Transacciones POS</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{salesStats.transactionsCount} ventas</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Items Despachados</div>
                      <div className="text-xs font-black text-indigo-600 mt-0.5">{salesStats.itemsCount} un.</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Gasto Promedio (Ticket)</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">$ {salesStats.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                )}

                {subTab === 'purchases' && (
                  <div className="grid grid-cols-4 gap-3 mb-6 text-center text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Total Invertido (Est.)</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">$ {purchasesStats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Ingresos Almacén</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{purchasesStats.transactionsCount} registros</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Unidades Adquiridas</div>
                      <div className="text-xs font-black text-amber-600 mt-0.5">{purchasesStats.unitsAcquired} un.</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Costo Medio Estimado</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        $ {purchasesStats.unitsAcquired > 0 ? (purchasesStats.totalSpent / purchasesStats.unitsAcquired).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtitle table and Table headers */}
                {subTab === 'inventory' && (
                  <>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b pb-1.5 mb-2 flex items-center justify-between">
                      <span>Secuencia de Transacciones e Historial Kárdex ({printPeriod})</span>
                      <span className="text-[9px] text-slate-500 font-mono font-semibold">{timeframeHistory.length} Filas</span>
                    </div>

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
                  </>
                )}

                {subTab === 'sales' && (
                  <>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b pb-1.5 mb-2 flex items-center justify-between">
                      <span>Historial de Facturación POS ({salesPeriod})</span>
                      <span className="text-[9px] text-slate-500 font-mono font-semibold">{filterSalesByPeriod.length} Transacciones</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-650 font-bold uppercase tracking-wider">
                            <th className="pb-1.5 pl-1">ID Ticket / Comprobante</th>
                            <th className="pb-1.5">Fecha / Hora</th>
                            <th className="pb-1.5">Cliente</th>
                            <th className="pb-1.5">Método de Pago</th>
                            <th className="pb-1.5 text-right">Impuestos</th>
                            <th className="pb-1.5 text-right pr-2">Total Pagado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {filterSalesByPeriod.length > 0 ? (
                            filterSalesByPeriod.map(s => (
                              <tr key={s.id} className="text-slate-800">
                                <td className="py-2 pl-1 font-mono font-bold">
                                  {s.ticketId || s.id.substring(0, 8).toUpperCase()}
                                </td>
                                <td className="py-2 text-slate-500 font-mono">
                                  {new Date(s.createdAt).toLocaleString('es-ES')}
                                </td>
                                <td className="py-2 font-medium">
                                  {s.clientName || "Consumidor Final"}
                                </td>
                                <td className="py-2 capitalize">
                                  {s.paymentMethod}
                                </td>
                                <td className="py-2 text-right font-mono text-slate-550">
                                  $ {(s.totalTax || 0).toFixed(2)}
                                </td>
                                <td className="py-2 text-right font-mono font-bold text-emerald-600 pr-2">
                                  $ {s.total.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                No hay ventas registradas para este periodo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {subTab === 'purchases' && (
                  <>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b pb-1.5 mb-2 flex items-center justify-between">
                      <span>Historial de Abastecimiento y Compras ({purchasesPeriod})</span>
                      <span className="text-[9px] text-slate-500 font-mono font-semibold">{filterPurchasesByPeriod.length} Adquisiciones</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-650 font-bold uppercase tracking-wider">
                            <th className="pb-1.5 pl-1">Fecha / Hora</th>
                            <th className="pb-1.5">Producto (SKU)</th>
                            <th className="pb-1.5 text-right">Cant. Adquirida</th>
                            <th className="pb-1.5 text-right">Costo Est.</th>
                            <th className="pb-1.5 pl-4">Responsable</th>
                            <th className="pb-1.5 pl-4">Motivo / Proveedor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {filterPurchasesByPeriod.length > 0 ? (
                            filterPurchasesByPeriod.map(item => {
                              const prod = products.find(p => p.id === item.productId);
                              const costEstimated = prod ? prod.price * 0.75 : 10;
                              const totalCost = costEstimated * item.changeAmount;
                              return (
                                <tr key={item.id} className="text-slate-800">
                                  <td className="py-2 pl-1 whitespace-nowrap text-slate-500 font-mono">
                                    {new Date(item.timestamp).toLocaleString('es-ES')}
                                  </td>
                                  <td className="py-2">
                                    <span className="font-semibold block leading-tight">{item.productName}</span>
                                    <span className="text-[8px] text-slate-400 font-mono">ID: {item.productId.substring(0,8)}</span>
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold text-amber-600">
                                    +{item.changeAmount} un.
                                  </td>
                                  <td className="py-2 text-right font-mono text-slate-700">
                                    $ {totalCost.toFixed(2)}
                                  </td>
                                  <td className="py-2 pl-4 font-medium truncate max-w-28">{item.userName}</td>
                                  <td className="py-2 pl-4 italic text-slate-500 truncate max-w-44" title={item.notes}>
                                    {item.notes}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                No hay adquisiciones registradas para este periodo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="mt-12 text-center text-[8.5px] text-slate-400 border-t pt-3 flex justify-between items-center font-mono">
                  <span>Generado inmutablemente por el ERP Distribuidora</span>
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
              {subTab === 'inventory' && `COPIA DE AUDITORÍA: ${printPeriod.toUpperCase()}`}
              {subTab === 'sales' && `REPORTE DE VENTAS: ${salesPeriod.toUpperCase()}`}
              {subTab === 'purchases' && `COPIA DE COMPRAS: ${purchasesPeriod.toUpperCase()}`}
            </span>
            <div className="text-xs text-slate-700 mt-3"><b>Fecha Emisión:</b> {new Date().toLocaleString()}</div>
            <div className="text-xs text-slate-700">
              {subTab === 'inventory' && `Movimientos Registrados: ${timeframeHistory.length} eventos`}
              {subTab === 'sales' && `Ventas Registradas: ${filterSalesByPeriod.length} comprobantes`}
              {subTab === 'purchases' && `Adquisiciones Registradas: ${filterPurchasesByPeriod.length} ingresos`}
            </div>
          </div>
        </div>

        {/* Financial KPI values inside report */}
        {subTab === 'inventory' && (
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
        )}

        {subTab === 'sales' && (
          <div className="grid grid-cols-4 gap-4 mb-8 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Facturado</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">$ {salesStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Transacciones POS</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{salesStats.transactionsCount} ventas</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Items Entregados</div>
              <div className="text-sm font-black text-indigo-600 mt-0.5">{salesStats.itemsCount} un.</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">$ {salesStats.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        )}

        {subTab === 'purchases' && (
          <div className="grid grid-cols-4 gap-4 mb-8 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Adquisición</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">$ {purchasesStats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ingresos Almacén</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{purchasesStats.transactionsCount} registros</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unidades Adquiridas</div>
              <div className="text-sm font-black text-amber-600 mt-0.5">{purchasesStats.unitsAcquired} un.</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Costo Medio Estimado</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                $ {purchasesStats.unitsAcquired > 0 ? (purchasesStats.totalSpent / purchasesStats.unitsAcquired).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
          </div>
        )}

        {subTab === 'inventory' && (
          <>
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
                        <span className="text-[8.5px] text-slate-450 font-mono">SKU ID: {item.productId.substring(0, 8)}</span>
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
          </>
        )}

        {subTab === 'sales' && (
          <>
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-3 border-b-2 pb-1 text-slate-900">
              Historial de Facturación POS ({salesPeriod})
            </h3>

            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Comprobante / Ticket ID</th>
                  <th className="py-2.5">Fecha / Hora</th>
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">Método de Pago</th>
                  <th className="py-2.5 text-right">Impuestos</th>
                  <th className="py-2.5 text-right pr-4">Total Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filterSalesByPeriod.length > 0 ? (
                  filterSalesByPeriod.map(s => (
                    <tr key={s.id} className="text-slate-800">
                      <td className="py-2.5 font-mono font-bold">
                        {s.ticketId || s.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono">
                        {new Date(s.createdAt).toLocaleString('es-ES')}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">
                        {s.clientName || "Consumidor Final"}
                      </td>
                      <td className="py-2.5 capitalize text-slate-700">
                        {s.paymentMethod}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        $ {(s.totalTax || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 pr-4">
                        $ {s.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No hay ventas registradas para este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {subTab === 'purchases' && (
          <>
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-3 border-b-2 pb-1 text-slate-900">
              Historial de Abastecimiento y Compras ({purchasesPeriod})
            </h3>

            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Fecha / Hora</th>
                  <th className="py-2.5">Producto (SKU ID)</th>
                  <th className="py-2.5 text-right">Cant. Adquirida</th>
                  <th className="py-2.5 text-right">Costo Est.</th>
                  <th className="py-2.5 pl-4">Responsable</th>
                  <th className="py-2.5 pl-4">Motivo / Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filterPurchasesByPeriod.length > 0 ? (
                  filterPurchasesByPeriod.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    const costEstimated = prod ? prod.price * 0.75 : 10;
                    const totalCost = costEstimated * item.changeAmount;
                    return (
                      <tr key={item.id} className="text-slate-800">
                        <td className="py-2.5 text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleString('es-ES')}
                        </td>
                        <td className="py-2.5 font-semibold text-slate-800">
                          <div>{item.productName}</div>
                          <span className="text-[8.5px] text-slate-450 font-mono">ID: {item.productId.substring(0,8)}</span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-amber-600">
                          +{item.changeAmount} un.
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          $ {totalCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 pl-4 font-medium text-slate-800">{item.userName}</td>
                        <td className="py-2.5 pl-4 italic text-slate-600">{item.notes}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No hay adquisiciones registradas para este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-12 text-center text-[9px] text-slate-400 border-t pt-4">
          Este documento es una copia oficial generada por el ERP Distribuidora.
          <br />
          <b>Distribuidora {config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</b> • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
