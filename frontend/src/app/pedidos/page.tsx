"use client";

import { useState, useEffect } from 'react';

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

    interface ItemCarrito {
    id: string; // key de React
    productoId: string; // ID de PostgreSQL
    descripcion: string;
    proveedor: string;
    precio: number;
    cantidad: number;
    }

    export default function PedidosPage() {
    const [loading, setLoading] = useState(false);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [productosBD, setProductosBD] = useState<ProductoReal[]>([]);
    const [cantidades, setCantidades] = useState<{ [key: string]: number }>({});
    const [pedido, setPedido] = useState<ItemCarrito[]>([]);

    useEffect(() => {
        fetchProductos();
    }, []);

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

    const handleCantidadChange = (productoId: string, valor: number) => {
        setCantidades((prev) => ({
        ...prev,
        [productoId]: Math.max(1, valor),
        }));
    };

    const handleAnadirAlCarrito = (prod: ProductoReal) => {
        const cantidad = cantidades[prod.id] || 1;
        
        setPedido((prev) => {
        const existe = prev.find((item) => item.productoId === prod.id);
        if (existe) {
            return prev.map((item) =>
            item.productoId === prod.id
                ? { ...item, cantidad: item.cantidad + cantidad }
                : item
            );
        }
        return [
            ...prev,
            {
            id: `${prod.id}-${Date.now()}`,
            productoId: prod.id,
            descripcion: prod.descripcion,
            proveedor: prod.proveedor.nombre,
            precio: prod.precio,
            cantidad,
            },
        ];
        });
    };

    const proveedoresCart = Array.from(new Set(pedido.map((p) => p.proveedor)));
    const totalGeneral = pedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const handleGenerarPedido = async () => {
        if (pedido.length === 0) return alert("El carrito está vacío");
        setLoading(true);

        try {
        const res = await fetch('http://localhost:4000/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            total: totalGeneral,
            items: pedido,
            }),
        });

        if (res.ok) {
            alert("¡Órdenes de compra generadas exitosamente en PostgreSQL!");
            setPedido([]);
        } else {
            const errorData = await res.json();
            alert(`Error al generar pedido: ${errorData.error}`);
        }
        } catch (error) {
        console.error(error);
        alert("Error de conexión con el backend.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
        <div className="mb-6 flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Generador de Pedidos</h1>
            <p className="text-gray-600">Compara precios, elige un proveedor y prepara tus órdenes de compra en un solo lugar.</p>
            </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
            {/* Lado Izquierdo: Productos Reales de BD */}
            <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Catálogo de Productos en Base de Datos</h3>
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
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                        <th className="py-3 px-4">Descripción del Producto</th>
                        <th className="py-3 px-4">Proveedor</th>
                        <th className="py-3 px-4 text-center">Bulto</th>
                        <th className="py-3 px-4 text-right">Precio Unit.</th>
                        <th className="py-3 px-4 text-center">Cantidad / Añadir</th>
                    </tr>
                    </thead>
                    <tbody>
                    {productosBD.map((prod) => (
                        <tr key={prod.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{prod.descripcion}</td>
                        <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {prod.proveedor.nombre}
                            </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500">{prod.bulto ?? 1}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                            ${prod.precio.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 flex justify-center items-center gap-2">
                            <input
                            type="number"
                            min={1}
                            value={cantidades[prod.id] || 1}
                            onChange={(e) => handleCantidadChange(prod.id, parseInt(e.target.value) || 1)}
                            className="w-16 border rounded p-1 text-center"
                            />
                            <button
                            onClick={() => handleAnadirAlCarrito(prod)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
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

            {/* Lado Derecho: Carrito / Resumen de Pedido */}
            <div className="w-full xl:w-[400px] shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                🛒 Tu pedido{" "}
                <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {pedido.length} productos
                </span>
                </h3>

                {pedido.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Seleccioná productos del catálogo para armar las órdenes.</p>
                ) : (
                <div className="space-y-6 mb-6">
                    {proveedoresCart.map((prov) => {
                    const itemsProv = pedido.filter((p) => p.proveedor === prov);
                    const subtotal = itemsProv.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
                    return (
                        <div key={prov} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 flex justify-between">
                            {prov}{" "}
                            <span className="text-xs text-gray-500 font-normal">
                            {itemsProv.length} ítems
                            </span>
                        </h4>
                        <div className="space-y-3">
                            {itemsProv.map((item) => (
                            <div key={item.id} className="text-sm flex justify-between items-start">
                                <div>
                                <p className="font-medium text-gray-700">{item.descripcion}</p>
                                <p className="text-gray-500">
                                    {item.cantidad} x ${item.precio.toLocaleString('es-AR')}
                                </p>
                                </div>
                                <p className="font-bold">${(item.cantidad * item.precio).toLocaleString('es-AR')}</p>
                            </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t flex justify-between font-bold text-gray-800">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString('es-AR')}</span>
                        </div>
                        </div>
                    );
                    })}
                </div>
                )}

                <div className="border-t pt-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                    <p className="text-gray-500 text-sm">
                        {pedido.reduce((acc, item) => acc + item.cantidad, 0)} unidades de catálogo
                    </p>
                    <p className="font-bold text-lg">Total del pedido</p>
                    </div>
                    <p className="font-black text-2xl">${totalGeneral.toLocaleString('es-AR')}</p>
                </div>
                <button
                    onClick={handleGenerarPedido}
                    disabled={loading || pedido.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
                >
                    {loading ? 'Procesando...' : 'Generar Órdenes de Compra'}
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}