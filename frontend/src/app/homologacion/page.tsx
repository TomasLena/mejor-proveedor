"use client";

import { useState, useEffect } from 'react';

const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const colorClass = percentage >= 85 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative inline-flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
            <circle className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
            <circle 
                className={`${colorClass} transition-all duration-1000 ease-in-out`} 
                strokeWidth="4" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r={radius} cx="32" cy="32" 
            />
            </svg>
            <span className="absolute text-sm font-bold text-gray-700">{percentage}%</span>
        </div>
        <span className="text-xs text-gray-500 mt-1 font-medium">Similitud</span>
        </div>
    );
    };

    interface ItemPendiente {
    id: string;
    descripcionMaster: string;
    skuMaster: string;
    rubro: string;
    descripcionProveedor: string;
    codigoProveedor: string;
    proveedorNombre: string;
    similitud: number;
    regexMatchOk: boolean;
    }

    export default function HomologacionPage() {
    const [loading, setLoading] = useState(false);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [pendientes, setPendientes] = useState<ItemPendiente[]>([]);

    useEffect(() => {
        fetchPendientes();
    }, []);

    const fetchPendientes = async () => {
        try {
        const res = await fetch('http://localhost:4000/api/comparador/pendientes');
        if (res.ok) {
            const data = await res.json();
            setPendientes(data);
        }
        } catch (error) {
        console.error("Error al cargar ítems pendientes:", error);
        } finally {
        setCargandoLista(false);
        }
    };

    const handleConfirmar = async (item: ItemPendiente) => {
        setLoading(true);
        try {
        const res = await fetch('http://localhost:4000/api/comparador/equivalencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            descripcionProveedor: item.descripcionProveedor,
            descripcionMaster: item.descripcionMaster
            })
        });

        if (res.ok) {
            alert("¡Equivalencia guardada exitosamente en PostgreSQL!");
            setPendientes(prev => prev.filter(p => p.id !== item.id));
        } else {
            const errorData = await res.json();
            alert(`Error: ${errorData.error}`);
        }
        } catch (error) {
        console.error(error);
        alert("Error de conexión con el backend.");
        } finally {
        setLoading(false);
        }
    };

    const handleDescartar = (id: string) => {
        setPendientes(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Módulo de Matching Manual</h1>
            <p className="text-gray-600">
            {pendientes.length} productos requieren confirmación o emparejamiento manual para optimizar el comparador.
            </p>
        </div>

        {cargandoLista ? (
            <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            Cargando coincidencias dudosas desde PostgreSQL...
            </div>
        ) : (
            <div className="space-y-6">
            {pendientes.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">
                    Propuesta de Equivalencia Activa
                </h3>
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                    
                    {/* Lado Izquierdo: Catálogo Maestro */}
                    <div className="flex-1 w-full bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Producto Catálogo Propio</span>
                    <h4 className="text-lg font-bold text-gray-800 mt-1">{item.descripcionMaster}</h4>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <p>SKU: <span className="font-medium text-gray-700">{item.skuMaster}</span></p>
                        <p>Rubro: <span className="font-medium text-gray-700">{item.rubro}</span></p>
                    </div>
                    </div>

                    {/* Centro: Ruedita de Similitud */}
                    <div className="flex flex-col items-center justify-center px-4">
                    <CircularProgress percentage={item.similitud} />
                    {item.regexMatchOk ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        ✓ RegEx Match OK
                        </span>
                    ) : (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        ✕ Difiere Empaque
                        </span>
                    )}
                    <div className="text-gray-400 mt-2 text-2xl">→</div>
                    </div>

                    {/* Lado Derecho: Sugerencia del Proveedor */}
                    <div className="flex-1 w-full bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Sugerencia del Proveedor</span>
                    <h4 className="text-lg font-bold text-gray-800 mt-1">{item.descripcionProveedor}</h4>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <p>Cód. Proveedor: <span className="font-medium text-gray-700">{item.codigoProveedor}</span></p>
                        <p>Proveedor: <span className="font-medium text-gray-700">{item.proveedorNombre}</span></p>
                    </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                    onClick={() => handleConfirmar(item)}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
                    >
                    {loading ? "Guardando..." : "✓ Confirmar Equivalencia (Guardar en SQL)"}
                    </button>
                    
                    <div className="flex flex-1 gap-3">
                    <button 
                        onClick={() => handleDescartar(item.id)}
                        className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        ✕ Descartar Match
                    </button>
                    </div>
                </div>
                </div>
            ))}

            {pendientes.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">¡Al día!</h3>
                <p className="text-gray-500 mt-1">No hay productos pendientes de homologación manual en PostgreSQL.</p>
                </div>
            )}
            </div>
        )}
        </div>
    );
    }