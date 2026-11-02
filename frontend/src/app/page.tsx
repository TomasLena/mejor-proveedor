"use client";

import Link from 'next/link';

export default function DashboardPage() {
  // Datos simulados hasta conectar con GET /api/analytics/dashboard
  const metricas = {
    totalProductos: 8520,
    pendientes: 12,
    shareOfWallet: [
      { proveedor: 'Distribuidora Industrial', porcentaje: 50, color: 'bg-emerald-500' },
      { proveedor: 'Global Supply Corp', porcentaje: 30, color: 'bg-blue-500' },
      { proveedor: 'Mendoza Mayoristas', porcentaje: 20, color: 'bg-amber-500' },
    ]
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consola de Control y Optimización</h1>
        <p className="text-gray-600 mt-1">Monitoreo y optimización de tarifas de compras en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI: Total de Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Productos Únicos</span>
          <span className="text-5xl font-bold text-gray-800">{metricas.totalProductos.toLocaleString('es-AR')}</span>
          <span className="text-sm text-green-600 font-medium mt-2">+2 proveedores mapeados</span>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Acciones Rápidas</span>
          <div className="flex flex-col gap-3">
            <Link href="/proveedores" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors flex items-center gap-2">
              <span>📁</span> Cargar Excel de Proveedor
            </Link>
            <Link href="/homologacion" className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-2 px-4 rounded transition-colors flex items-center gap-2 border border-amber-200">
              <span>⚠️</span> Resolver Matching Pendiente ({metricas.pendientes})
            </Link>
          </div>
        </div>

        {/* KPI: Share of Wallet (Gráfico CSS) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Share of Wallet</span>
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center" 
                style={{ background: 'conic-gradient(#10b981 0% 50%, #3b82f6 50% 80%, #f59e0b 80% 100%)' }}>
            <div className="w-24 h-24 bg-white rounded-full"></div>
          </div>
          <div className="mt-4 w-full flex flex-col gap-2">
            {metricas.shareOfWallet.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-gray-600 font-medium">{item.proveedor}</span>
                </div>
                <span className="font-bold text-gray-800">{item.porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tip de Optimización */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex gap-4">
        <div className="text-blue-600 font-bold text-2xl">💡</div>
        <div>
          <h4 className="text-blue-900 font-bold">Tip de Optimización</h4>
          <p className="text-blue-800 text-sm mt-1">
            Actualizar las listas de precios obsoletas permite al simulador inteligente encontrar hasta un 14% de ahorro estimado. ¿Existen productos sin emparejar con el catálogo maestro? Accede a la consola de homologación manual.
          </p>
        </div>
      </div>
    </div>
  );
}