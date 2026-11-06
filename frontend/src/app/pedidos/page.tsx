"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { crearPedidoAPI } from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  FileText, 
  CheckCircle2, 
  History, 
  PlusCircle, 
  Calendar, 
  Clock, 
  FileDown 
} from 'lucide-react';

interface ProductoReal {
  id: string;
  descripcion: string;
  precio: number;
  bulto: number | null;
  fechaCarga: string;
  proveedor: {
    id: string;
    nombre: string;
  };
}

interface DetallePedidoHistorial {
  id: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
  producto: {
    descripcion: string;
    bulto: number | null;
    listaPrecio: {
      proveedor: {
        id: string;
        nombre: string;
        cuit?: string;
        email?: string;
        telefono?: string;
      }
    }
  }
}

interface PedidoHistorial {
  id: string;
  fecha: string;
  estado: string;
  total: number;
  detalles: DetallePedidoHistorial[];
}

export default function PedidosPage() {
  // Pestaña activa: 'NUEVO' (Armar pedido) o 'HISTORIAL' (Ver órdenes creadas)
  const [vistaActiva, setVistaActiva] = useState<'NUEVO' | 'HISTORIAL'>('NUEVO');

  // Estados para armado de pedido nuevo
  const [loading, setLoading] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [productosBD, setProductosBD] = useState<ProductoReal[]>([]);
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>({});

  // Estados para historial de pedidos
  const [pedidosHistorial, setPedidosHistorial] = useState<PedidoHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const { items: cartItems, addItem, removeItem, updateCantidad, clearCart } = useCartStore();

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    if (vistaActiva === 'HISTORIAL') {
      fetchHistorial();
    }
  }, [vistaActiva]);

  const fetchProductos = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/productos');
      if (res.ok) {
        const data = await res.json();
        setProductosBD(data);
      }
    } catch (error) {
      console.error("Error al cargar productos de BD:", error);
    } finally {
      setCargandoProductos(false);
    }
  };

  const fetchHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const res = await fetch('http://localhost:4000/api/pedidos');
      if (res.ok) {
        const data = await res.json();
        setPedidosHistorial(data);
      }
    } catch (error) {
      console.error('Error al obtener historial de pedidos:', error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCantidadChange = (productoId: string, valor: number) => {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: Math.max(1, valor),
    }));
  };

  const handleAnadirAlCarrito = (prod: ProductoReal) => {
    const cantidad = cantidades[prod.id] || 1;
    addItem(
      {
        productoId: prod.id,
        descripcion: prod.descripcion,
        proveedorId: prod.proveedor.id,
        proveedorNombre: prod.proveedor.nombre,
        precio: prod.precio,
        bulto: prod.bulto ?? 1,
      },
      cantidad
    );
  };

  const proveedoresCart = Array.from(new Set(cartItems.map((p) => p.proveedorNombre)));
  const totalGeneral = cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const handleGenerarPedido = async () => {
    if (cartItems.length === 0) return alert("El carrito está vacío");
    setLoading(true);

    try {
      await crearPedidoAPI(
        totalGeneral,
        cartItems.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: item.precio,
        }))
      );

      alert("¡Órdenes de compra generadas exitosamente!");
      clearCart();
      setVistaActiva('HISTORIAL');
    } catch (error: any) {
      console.error(error);
      alert(`Error al generar pedido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // PDF 1: Consolidado General (Separado por Proveedores para uso interno de compras)
  const generarPDFConsolidado = (pedido: PedidoHistorial, proveedoresMap: Map<string, DetallePedidoHistorial[]>) => {
    const doc = new jsPDF();
    let currentY = 20;

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text('AYB LIBRERÍA - ORDEN DE COMPRA CONSOLIDADA', 14, currentY);
    currentY += 7;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${new Date(pedido.fecha).toLocaleString('es-AR')}`, 14, currentY);
    doc.text(`N° Control Interno: #${pedido.id.slice(0, 8).toUpperCase()}`, 120, currentY);
    currentY += 6;

    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 196, currentY);
    currentY += 8;

    // Bloques separados por cada Proveedor
    proveedoresMap.forEach((detallesProv, provNombre) => {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      const subtotalProv = detallesProv.reduce((acc, d) => acc + d.subtotal, 0);

      // Encabezado de Sección del Proveedor
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(`■ PROVEEDOR: ${provNombre.toUpperCase()}`, 14, currentY);

      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`Subtotal: $ ${subtotalProv.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 140, currentY);
      currentY += 4;

      const tableData = detallesProv.map((d, idx) => [
        idx + 1,
        d.producto.descripcion,
        d.producto.bulto ?? 1,
        d.cantidad,
        `$ ${d.precioUnit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        `$ ${d.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Descripción del Producto', 'Bulto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    // Total General Final
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(14, currentY, 196, currentY);
    currentY += 8;

    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL DE LA COMPRA: $ ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 80, currentY);

    doc.save(`Orden_Consolidada_${pedido.id.slice(0, 6)}.pdf`);
  };

  // PDF 2: Individual por Proveedor (Envío exclusivo)
  const generarPDFProveedor = (pedido: PedidoHistorial, proveedorNombre: string, detallesProv: DetallePedidoHistorial[]) => {
    const doc = new jsPDF();
    const proveedor = detallesProv[0]?.producto.listaPrecio?.proveedor;
    const totalProveedor = detallesProv.reduce((acc, d) => acc + d.subtotal, 0);

    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE COMPRA / PEDIDO MAYORISTA', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${new Date(pedido.fecha).toLocaleDateString('es-AR')}`, 14, 28);
    doc.text(`N° Orden: ${pedido.id.slice(0, 8).toUpperCase()}`, 14, 34);

    doc.setDrawColor(220);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROVEEDOR: ${proveedorNombre}`, 14, 46);

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    if (proveedor?.cuit) doc.text(`CUIT: ${proveedor.cuit}`, 14, 52);
    if (proveedor?.email) doc.text(`Email: ${proveedor.email}`, 14, 57);
    if (proveedor?.telefono) doc.text(`Teléfono: ${proveedor.telefono}`, 14, 62);

    const tableData = detallesProv.map((d, index) => [
      index + 1,
      d.producto.descripcion,
      d.producto.bulto ?? 1,
      d.cantidad,
      `$ ${d.precioUnit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      `$ ${d.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Descripción', 'Bulto', 'Cant. Packs', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PEDIDO (${proveedorNombre}): $ ${totalProveedor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 95, finalY);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text('Generado por el Sistema MejorProveedor v1.3 - AyB Librería', 14, 285);

    doc.save(`Orden_${proveedorNombre.replace(/\s+/g, '_')}_${pedido.id.slice(0, 6)}.pdf`);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen text-gray-900">
      {/* Cabecera y Selector de Pestañas */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Pedidos y Órdenes de Compra</h1>
          <p className="text-gray-600 mt-1">Confeccioná carritos por proveedor y consultá el historial de órdenes generadas.</p>
        </div>

        {/* Botones Selector de Pestañas */}
        <div className="flex bg-gray-200 p-1 rounded-xl border border-gray-300">
          <button
            onClick={() => setVistaActiva('NUEVO')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              vistaActiva === 'NUEVO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Armar Nuevo Pedido ({cartItems.length})</span>
          </button>
          <button
            onClick={() => setVistaActiva('HISTORIAL')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              vistaActiva === 'HISTORIAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Órdenes</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: ARMAR NUEVO PEDIDO */}
      {vistaActiva === 'NUEVO' && (
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Lado Izquierdo: Catálogo */}
          <div className="grow bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Catálogo de Productos en Base de Datos</h3>
              <span className="text-xs text-gray-500 font-medium">
                Total: {productosBD.length} ítems
              </span>
            </div>

            {cargandoProductos ? (
              <div className="py-12 text-center text-gray-500">Cargando catálogo desde PostgreSQL...</div>
            ) : productosBD.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No se encontraron productos cargados. Subí una lista en la sección de Proveedores.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Descripción del Producto</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4 text-center">Bulto</th>
                      <th className="py-3 px-4 text-right">Precio Unit.</th>
                      <th className="py-3 px-4 text-center">Cantidad / Añadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productosBD.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{prod.descripcion}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                            {prod.proveedor.nombre}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 font-medium">{prod.bulto ?? 1}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          ${prod.precio.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 flex justify-center items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={cantidades[prod.id] || 1}
                            onChange={(e) => handleCantidadChange(prod.id, parseInt(e.target.value) || 1)}
                            className="w-16 border border-gray-300 rounded-md py-1 px-2 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                          />
                          <button
                            onClick={() => handleAnadirAlCarrito(prod)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            Añadir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lado Derecho: Carrito / Resumen */}
          <div className="w-full xl:w-[450px] shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  Tu pedido
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {cartItems.length} ítems
                  </span>
                </h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline font-bold cursor-pointer"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <p className="text-sm">El carrito está vacío.</p>
                  <p className="text-xs mt-1">Seleccioná productos del catálogo o del comparador para armar la orden.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-1">
                  {proveedoresCart.map((provNombre) => {
                    const itemsProv = cartItems.filter((p) => p.proveedorNombre === provNombre);
                    const subtotal = itemsProv.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

                    return (
                      <div key={provNombre} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                          <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                            {provNombre}
                          </h4>
                          <span className="text-xs text-gray-500 font-semibold">
                            {itemsProv.length} prod.
                          </span>
                        </div>

                        <div className="space-y-3">
                          {itemsProv.map((item) => (
                            <div key={item.productoId} className="text-xs bg-white p-2.5 rounded-md border border-gray-200 space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-semibold text-gray-900 leading-tight">{item.descripcion}</p>
                                <button
                                  onClick={() => removeItem(item.productoId)}
                                  className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                <div className="flex items-center border border-gray-300 rounded bg-gray-50">
                                  <button
                                    onClick={() => updateCantidad(item.productoId, item.cantidad - 1)}
                                    className="px-1.5 py-0.5 text-gray-700 hover:bg-gray-200 cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 font-bold text-gray-900 text-xs">{item.cantidad}</span>
                                  <button
                                    onClick={() => updateCantidad(item.productoId, item.cantidad + 1)}
                                    className="px-1.5 py-0.5 text-gray-700 hover:bg-gray-200 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-gray-500 block">${item.precio.toLocaleString('es-AR')} c/u</span>
                                  <span className="font-bold text-gray-900 text-sm">
                                    ${(item.cantidad * item.precio).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900 text-xs">
                          <span>Subtotal Proveedor:</span>
                          <span className="text-emerald-700 text-sm">${subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase">Total General</p>
                    <p className="text-xs text-gray-600 font-medium">
                      {cartItems.reduce((acc, item) => acc + item.cantidad, 0)} unidades elegidas
                    </p>
                  </div>
                  <p className="font-black text-2xl text-emerald-700">${totalGeneral.toLocaleString('es-AR')}</p>
                </div>

                <button
                  onClick={handleGenerarPedido}
                  disabled={loading || cartItems.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Procesando...' : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Generar Órdenes de Compra</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: HISTORIAL DE ÓRDENES CREADAS */}
      {vistaActiva === 'HISTORIAL' && (
        <div className="space-y-6">
          {cargandoHistorial ? (
            <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              Cargando historial de compras desde PostgreSQL...
            </div>
          ) : pedidosHistorial.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              No hay órdenes de compra registradas aún. Volvé a la pestaña "Armar Nuevo Pedido" para generar una.
            </div>
          ) : (
            pedidosHistorial.map((pedido) => {
              const proveedoresMap = new Map<string, DetallePedidoHistorial[]>();
              pedido.detalles.forEach((d) => {
                const prov = d.producto.listaPrecio?.proveedor?.nombre || 'Proveedor Genérico';
                if (!proveedoresMap.has(prov)) proveedoresMap.set(prov, []);
                proveedoresMap.get(prov)!.push(d);
              });

              return (
                <div key={pedido.id} className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                  {/* Cabecera del Pedido con Botón Consolidado Principal */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-4 gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        ORDEN CONSOLIDADA #{pedido.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(pedido.fecha).toLocaleString('es-AR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Estado: <strong className="text-gray-700">{pedido.estado}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Total Compra</span>
                        <span className="text-2xl font-black text-emerald-700">${pedido.total.toLocaleString('es-AR')}</span>
                      </div>

                      <button
                        onClick={() => generarPDFConsolidado(pedido, proveedoresMap)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-xs"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Descargar PDF Consolidado</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-bloques organizados por Proveedor */}
                  <div className="space-y-4">
                    {Array.from(proveedoresMap.entries()).map(([provNombre, detallesProv]) => {
                      const subtotalProv = detallesProv.reduce((acc, item) => acc + item.subtotal, 0);

                      return (
                        <div key={provNombre} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-emerald-600" />
                              Proveedor: {provNombre}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {detallesProv.length} ítems — Subtotal: <strong className="text-gray-900">${subtotalProv.toLocaleString('es-AR')}</strong>
                            </p>
                          </div>

                          <button
                            onClick={() => generarPDFProveedor(pedido, provNombre, detallesProv)}
                            className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5 text-gray-500" />
                            <span>PDF Solo {provNombre}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}