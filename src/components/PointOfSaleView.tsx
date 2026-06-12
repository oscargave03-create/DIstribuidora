import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  Check, 
  AlertTriangle, 
  Receipt,
  RotateCcw,
  Store,
  User,
  Hash,
  Printer
} from 'lucide-react';
import { Product, AppConfig } from '../types';

interface PointOfSaleViewProps {
  products: Product[];
  onSellProduct: (
    productId: string, 
    newQty: number, 
    adjustReason: { changeAmount: number, notes: string }
  ) => Promise<void>;
  config?: AppConfig;
  allowedActions?: {
    create_product: boolean;
    edit_product: boolean;
    delete_product: boolean;
    adjust_stock: boolean;
    process_sale: boolean;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PointOfSaleView({ 
  products, 
  onSellProduct,
  config,
  allowedActions = { create_product: true, edit_product: true, delete_product: true, adjust_stock: true, process_sale: true }
}: PointOfSaleViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('Consumidor Final');
  const [salesTicket, setSalesTicket] = useState<{ 
    id: string; 
    items: CartItem[]; 
    subtotal: number;
    taxGeneral: number;
    taxLiquor: number;
    taxTobacco: number;
    totalTax: number;
    total: number; 
    client: string 
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Categories matching the custom admin setup
  const categories = config?.categories && config.categories.length > 0 
    ? ["Todos", ...config.categories] 
    : ["Todos", "Abarrotes", "Lácteos y Quesos", "Conservas y Enlatados"];

  // Filter products that are available in catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = selectedCategory === "Todos" ? true : p.category === selectedCategory;
      
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Handle adding product to POS cart
  const handleAddToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.quantity <= 0) {
      setErrorMessage(`El artículo "${product.name}" no cuenta con existencias disponibles en almacén.`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex !== -1) {
      const newQty = cart[existingIndex].quantity + 1;
      if (newQty > product.quantity) {
        setErrorMessage(`Acción denegada: La cantidad excede el stock físico disponible (${product.quantity} un.).`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity = newQty;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Adjust quantitative levels in cart
  const updateCartQty = (productId: string, increment: number) => {
    setErrorMessage(null);
    const index = cart.findIndex(item => item.product.id === productId);
    if (index === -1) return;

    const currentItem = cart[index];
    const newQty = currentItem.quantity + increment;

    if (newQty <= 0) {
      // Remove from cart
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    if (newQty > currentItem.product.quantity) {
      setErrorMessage(`No es posible agregar más unidades. El stock máximo disponible es de ${currentItem.product.quantity} un.`);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  // Clear cart completely
  const handleClearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Calculated monetary figures itemized by product category taxes dynamically from AppConfig:
  const cartTotals = useMemo(() => {
    let sub = 0;
    let taxGeneral = 0;
    let taxLiquor = 0;
    let taxTobacco = 0;

    const generalRate = config?.taxes?.generalRate !== undefined ? config.taxes.generalRate / 100 : 0.07;
    const liquorRate = config?.taxes?.liquorRate !== undefined ? config.taxes.liquorRate / 100 : 0.10;
    const tobaccoRate = config?.taxes?.tobaccoRate !== undefined ? config.taxes.tobaccoRate / 100 : 0.15;

    cart.forEach(item => {
      const itemSubtotal = item.product.price * item.quantity;
      const cat = (item.product.category || '').toLowerCase();
      sub += itemSubtotal;

      if (cat === 'licores' || cat.includes('licor') || cat.includes('cerveza') || cat.includes('alcohol')) {
        taxLiquor += itemSubtotal * liquorRate;
      } else if (cat === 'tabaco' || cat.includes('tabaco') || cat.includes('cigarro')) {
        taxTobacco += itemSubtotal * tobaccoRate;
      } else {
        taxGeneral += itemSubtotal * generalRate;
      }
    });

    const totalTax = taxGeneral + taxLiquor + taxTobacco;
    const total = sub + totalTax;

    return {
      subtotal: sub,
      taxGeneral,
      taxLiquor,
      taxTobacco,
      totalTax,
      total
    };
  }, [cart, config]);

  // Process checkout in real-time
  const handlePerformCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    setErrorMessage(null);

    try {
      const ticketId = "TK-" + Math.floor(Math.random() * 900000 + 100000);
      const currentClient = clientName.trim() || 'Consumidor Final';

      // Lock sequentially in firestore / state
      for (const item of cart) {
        const remainingQty = item.product.quantity - item.quantity;
        const changeAmount = -item.quantity;
        const notes = `Venta en Caja POS ${ticketId} - Entregado a: ${currentClient}`;

        await onSellProduct(item.product.id, remainingQty, { changeAmount, notes });
      }

      // Generate visual receipt invoice modal
      setSalesTicket({
        id: ticketId,
        items: [...cart],
        subtotal: cartTotals.subtotal,
        taxGeneral: cartTotals.taxGeneral,
        taxLiquor: cartTotals.taxLiquor,
        taxTobacco: cartTotals.taxTobacco,
        totalTax: cartTotals.totalTax,
        total: cartTotals.total,
        client: currentClient
      });

      // Reset application POS cart state
      setCart([]);
      setClientName('Consumidor Final');

    } catch (err: any) {
      console.error(err);
      setErrorMessage("Fallo al registrar la transacción. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función dedicada para realizar una impresión limpia de la factura actual en la impresora Bixolon SRP-Q300 (80mm)
  const handlePrint = () => {
    if (!salesTicket) return;

    try {
      // 1. Intentar usar un iframe temporal para aislar solo la factura y forzar el diálogo de impresión.
      // Esto evita imprimir el resto de la interfaz del sistema o la barra lateral.
      const iframeId = 'pos-receipt-print-iframe';
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      
      if (iframe) {
        document.body.removeChild(iframe);
      }
      
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("No se pudo acceder al documento del iframe");
      }

      // Estructurar listado de productos de forma ultra compacta para formato de ticket térmica Bixolon SRP-Q300
      const itemsRowsHtml = salesTicket.items.map(item => `
        <tr style="border-bottom: 1px dashed #cccccc; font-family: monospace; font-size: 11px;">
          <td style="padding: 4px 0; text-align: left; vertical-align: top; width: 15%;">${item.quantity}x</td>
          <td style="padding: 4px 0; text-align: left; vertical-align: top; width: 55%; padding-right: 4px; word-break: break-word;">${item.product.name}</td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; width: 30%; font-weight: bold;">$ ${(item.product.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      // Desglosar impuestos para la Bixolon 80mm
      const genName = config?.taxes?.generalName || "Imp. Artículos (7%)";
      const liqName = config?.taxes?.liquorName || "Imp. Licores (10%)";
      const tobName = config?.taxes?.tobaccoName || "Imp. Tabaco (15%)";

      let taxesBlockHtml = '';
      if (salesTicket.taxGeneral > 0) {
        taxesBlockHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
            <span>${genName}:</span>
            <span>$ ${salesTicket.taxGeneral.toFixed(2)}</span>
          </div>
        `;
      }
      if (salesTicket.taxLiquor > 0) {
        taxesBlockHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; font-weight: bold;">
            <span>${liqName}:</span>
            <span>$ ${salesTicket.taxLiquor.toFixed(2)}</span>
          </div>
        `;
      }
      if (salesTicket.taxTobacco > 0) {
        taxesBlockHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; font-weight: bold;">
            <span>${tobName}:</span>
            <span>$ ${salesTicket.taxTobacco.toFixed(2)}</span>
          </div>
        `;
      }

      const totalTaxes = salesTicket.totalTax;

      const ticketHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Factura ${salesTicket.id}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                font-family: 'Courier New', Courier, monospace, sans-serif;
                color: #000000;
                margin: 0;
                padding: 4mm 6mm;
                background-color: #ffffff;
                width: 68mm; /* Configuración óptima para papel de 80mm de Bixolon para evitar cortes de borde */
                font-size: 12px;
                line-height: 1.3;
              }
              .text-center { text-align: center; }
              .logo-img {
                max-height: 48px;
                max-width: 140px;
                object-fit: contain;
                margin: 0 auto 6px auto;
                display: block;
              }
              .header {
                border-bottom: 1px dashed #000000;
                padding-bottom: 8px;
                margin-bottom: 8px;
              }
              .company-title {
                font-size: 13px;
                font-weight: bold;
                margin: 0 0 2px 0;
                text-transform: uppercase;
              }
              .subtitle {
                font-size: 10px;
                margin: 1px 0;
              }
              .doc-title {
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                margin-top: 6px;
                letter-spacing: 0.5px;
              }
              .metadata {
                font-size: 10px;
                line-height: 1.4;
                border-bottom: 1px dashed #000000;
                padding-bottom: 6px;
                margin-bottom: 6px;
              }
              .meta-row {
                display: flex;
                justify-content: space-between;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 8px;
              }
              .items-table th {
                font-size: 10px;
                text-transform: uppercase;
                border-bottom: 1px solid #000000;
                padding-bottom: 2px;
                text-align: left;
              }
              .totals {
                border-bottom: 1px dashed #000000;
                padding-bottom: 6px;
                margin-bottom: 8px;
                font-size: 11px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
              }
              .grand-total {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                font-weight: bold;
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px dashed #000000;
              }
              .footer {
                text-align: center;
                font-size: 9px;
                line-height: 1.2;
                margin-top: 8px;
              }
              .footer p { margin: 2px 0; }
            </style>
          </head>
          <body>
            <div class="header text-center">
              ${config?.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="logo-img" />` : ''}
              <div class="company-title">${config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</div>
              <div class="subtitle">${config?.address || "Quito, Ecuador"}</div>
              <div class="subtitle">Tel: ${config?.telephone || "(02) 299-900"} • RUC: ${config?.ruc || "1792348574001"}</div>
              <div class="doc-title">COMPROBANTE DE FACTURACIÓN</div>
            </div>

            <div class="metadata">
              <div class="meta-row"><span>FACTURA:</span> <strong>${salesTicket.id}</strong></div>
              <div class="meta-row"><span>FECHA:</span> <strong>${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong></div>
              <div class="meta-row"><span>CLIENTE:</span> <strong style="text-transform: uppercase;">${salesTicket.client}</strong></div>
              <div class="meta-row"><span>VENDEDOR:</span> <strong>DISTRIBUIDORA OFICIAL</strong></div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 15%; text-align: left;">Cant</th>
                  <th style="width: 55%; text-align: left;">Artículo</th>
                  <th style="width: 30%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal Neto:</span>
                <span>$ ${salesTicket.subtotal.toFixed(2)}</span>
              </div>
              
              ${taxesBlockHtml}
              
              <div class="total-row" style="margin-top: 2px; padding-top: 2px; border-top: 1px dotted #000000; font-size: 10px; color: #444444;">
                <span>Total Impuestos:</span>
                <span>$ ${totalTaxes.toFixed(2)}</span>
              </div>
              
              <div class="grand-total">
                <span>TOTAL A COBRAR:</span>
                <span>$ ${salesTicket.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer text-center">
              <p>${config?.receiptFooter || "¡Gracias por abastecerse con nosotros!"}</p>
              <p style="font-style: italic;">${config?.receiptAd || "Distribuidora Oficial Almacén"}</p>
              <p style="font-size: 8px; margin-top: 4px; color: #333333;">Impreso en Bixolon SRP-Q300</p>
            </div>

            <script>
              window.onload = function() {
                try {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                } catch (e) {
                  console.error(e);
                }
              };
            </script>
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(ticketHtml);
      iframeDoc.close();

      // Limpieza periódica para no sobrecargar el DOM
      setTimeout(() => {
        if (iframe && document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 30000);

    } catch (e) {
      console.error("Iframe print error, falling back to window.print():", e);
      // Fallback a window.print() si falla el iframe (ej. debido a políticas de sandbox muy estrictas de navegadores)
      window.print();
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start font-sans">
      
      {/* Search and products catalogs side (Saves 8 columns) */}
      <div className="xl:col-span-7 space-y-5">
        
        {/* Filter / Search header Bar */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-400" />
                Caja Registradora / Punto de Venta
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Despache pedidos en el mostrador para descontar el inventario de la distribuidora instantáneamente.
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto alimenticio por nombre o código SKU..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-sans"
            />
          </div>

          {/* Categories selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer font-semibold ${
                  selectedCategory === cat 
                    ? 'bg-slate-950 border border-teal-500/50 text-teal-400 font-bold' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => {
              const isOut = p.quantity === 0;
              const isLow = p.quantity <= p.minQuantity;

              return (
                <div 
                  key={p.id}
                  onClick={() => !isOut && handleAddToCart(p)}
                  className={`bg-slate-900 border rounded-3xl p-5 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isOut 
                      ? 'border-slate-850 opacity-55 cursor-not-allowed' 
                      : isLow
                        ? 'border-amber-500/30 hover:border-amber-500/60 bg-slate-900/80'
                        : 'border-slate-850 hover:border-teal-500/40'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">{p.sku}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] text-slate-400 font-semibold border border-slate-850">
                        {p.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                      {p.description || "Sin descripción registrada en el catálogo."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Precio Unitario</span>
                      <span className="text-base font-extrabold text-teal-400">$ {p.price.toFixed(2)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Disponible</span>
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">AGOTADO</span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">ALERTA ({p.quantity})</span>
                      ) : (
                        <span className="text-sm font-mono font-bold text-slate-200">{p.quantity} un.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-850 rounded-3xl text-slate-500">
              No se encontraron productos alimenticios con los criterios de búsqueda actuales.
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing transaction side (Saves 5 columns) */}
      <div className="xl:col-span-5 sticky top-24">
        <div className="bg-slate-900 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Cart Header */}
          <div className="p-5 bg-slate-950/50 border-b border-slate-850/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Orden Directa Mostrador
              </h3>
              <span className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-slate-450 hover:text-rose-400 transition cursor-pointer font-bold flex items-center gap-1"
                title="Limpiar Carretilla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          {/* Validation Err alert bar */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border-b border-rose-500/35 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items list */}
          <div className="p-5 max-h-[340px] overflow-y-auto divide-y divide-slate-850">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-3 group first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">SKU: {item.product.sku}</span>
                    <h5 className="text-xs font-bold text-white truncate">{item.product.name}</h5>
                    <span className="text-xs text-slate-450 font-mono">$ {item.product.price.toFixed(2)} c/u</span>
                  </div>

                  {/* Quantity adjustment cluster */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="p-1 text-slate-450 hover:text-white transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-bold text-teal-400">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-1 text-slate-450 hover:text-white transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateCartQty(item.product.id, -item.quantity)}
                      className="p-1 rounded-lg text-slate-600 hover:text-rose-400 transition cursor-pointer"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-550 italic text-xs flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-slate-700 mb-1" />
                <span>La carretilla está vacía. Pulse sobre cualquier alimento del catálogo para empezar a vender.</span>
              </div>
            )}
          </div>

          {/* Billing Form Checkout details */}
          <form onSubmit={handlePerformCheckout} className="p-5 bg-slate-950/40 border-t border-slate-850/60 space-y-4">
            {/* Customer name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nombre del Cliente / Adquiriente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Oscar Guevara, Tienda El Carmen, etc."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Subtotal metrics list */}
            <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-dashed border-slate-850">
              <div className="flex justify-between text-slate-450">
                <span>Subtotal Neto:</span>
                <span>$ {cartTotals.subtotal.toFixed(2)}</span>
              </div>
              
              {cartTotals.taxGeneral > 0 && (
                <div className="flex justify-between text-slate-440">
                  <span>• {config?.taxes?.generalName || "Impuesto Artículos (7%)"}:</span>
                  <span>$ {cartTotals.taxGeneral.toFixed(2)}</span>
                </div>
              )}
              {cartTotals.taxLiquor > 0 && (
                <div className="flex justify-between text-yellow-400/90">
                  <span>• {config?.taxes?.liquorName || "Impuesto Licores (10%)"}:</span>
                  <span>$ {cartTotals.taxLiquor.toFixed(2)}</span>
                </div>
              )}
              {cartTotals.taxTobacco > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>• {config?.taxes?.tobaccoName || "Impuesto Tabaco (15%)"}:</span>
                  <span>$ {cartTotals.taxTobacco.toFixed(2)}</span>
                </div>
              )}
              
              {cartTotals.totalTax > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-850/40">
                  <span>Total Impuestos:</span>
                  <span>$ {cartTotals.totalTax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-850">
                <span className="font-display">TOTAL A COBRAR:</span>
                <span className="text-teal-400">$ {cartTotals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete checkout cash register execution */}
            <button
              type="submit"
              disabled={loading || cart.length === 0 || !allowedActions.process_sale}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer text-sm font-sans uppercase flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt className="w-4.5 h-4.5" />
                  <span>{allowedActions.process_sale ? "Registrar Venta / Entregar" : "Acceso de Venta Bloqueado"}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Sale Success PDF Receipt Dialog Overlay */}
      <AnimatePresence>
        {salesTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSalesTicket(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            <motion.div
              id="print-receipt-area"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white text-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden z-10 font-mono text-xs border border-slate-200"
            >
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
                {config?.logoUrl ? (
                  <img 
                    src={config.logoUrl} 
                    alt="Logo Distribuidora" 
                    className="max-h-12 max-w-[140px] object-contain mx-auto mb-2 rounded-md bg-slate-50 p-1 border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-1 no-print">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <h4 className="font-sans font-bold text-slate-900 text-sm">{config?.companyName || "DISTRIBUIDORA DE ALIMENTOS"}</h4>
                <p className="text-[10px] text-slate-500 select-none">Muelle de Carga & Sucursales</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">COMPROBANTE DE FACTURACIÓN</p>
              </div>

              {/* Receipt metadata */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>TICKET POS:</span>
                  <span className="font-bold text-slate-900">{salesTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{new Date().toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-bold text-slate-900 truncate max-w-36">{salesTicket.client}</span>
                </div>
                <div className="flex justify-between">
                  <span>VENDEDOR:</span>
                  <span>Distribuidora Oficial</span>
                </div>
              </div>

              {/* Items listing */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2 max-h-44 overflow-y-auto">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold pb-1">
                  <span>Despacho Cant.</span>
                  <span>Alimento x Importe</span>
                </div>
                {salesTicket.items.map(item => (
                  <div key={item.product.id} className="flex justify-between gap-2 text-[11px]">
                    <span className="shrink-0">{item.quantity} un. x</span>
                    <span className="min-w-0 flex-1 truncate text-slate-800">{item.product.name}</span>
                    <span className="shrink-0 text-right font-bold text-slate-900">$ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Summary calculated numbers */}
              <div className="py-3 text-right space-y-1 border-b border-dashed border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal Neto:</span>
                  <span>$ {salesTicket.subtotal.toFixed(2)}</span>
                </div>
                
                {salesTicket.taxGeneral > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Artículos (7%):</span>
                    <span>$ {salesTicket.taxGeneral.toFixed(2)}</span>
                  </div>
                )}
                {salesTicket.taxLiquor > 0 && (
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Licores (10%):</span>
                    <span>$ {salesTicket.taxLiquor.toFixed(2)}</span>
                  </div>
                )}
                {salesTicket.taxTobacco > 0 && (
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Tabaco (15%):</span>
                    <span>$ {salesTicket.taxTobacco.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-slate-200">
                  <span>Total Impuestos:</span>
                  <span>$ {salesTicket.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-300 font-sans">
                  <span>MONTO TOTAL PAGADO:</span>
                  <span>$ {salesTicket.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footnote */}
              <div className="text-center pt-4 text-[9px] text-slate-500 leading-normal">
                <p>¡Gracias por abastecerse con nosotros!</p>
                <p className="mt-1 font-sans italic text-slate-450">Stock físico descontado del almacén de la distribuidora.</p>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col gap-2 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-sans font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/10"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>Imprimir Factura</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSalesTicket(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans font-semibold rounded-xl transition cursor-pointer text-xs"
                >
                  Cerrar y Reanudar Caja
                </button>

                <p className="mt-2 text-[10px] text-slate-500 text-center leading-relaxed font-sans select-none border-t border-slate-100 pt-2.5">
                  💡 <strong>¿No se abre la ventana de impresión?</strong> Haz clic en el botón de la esquina superior derecha ↗️ en la barra superior de AI Studio para <strong>abrir la aplicación en una pestaña nueva</strong> e imprimir directamente.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
