'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  AlertTriangle, 
  Lightbulb, 
  RefreshCw, 
  Package, 
  PieChart as PieIcon,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface DistribucionWallet {
  proveedor: string;
  monto: number;
  porcentaje: number;
}

interface MetricasBackend {
  rf06_1_shareOfWallet: {
    totalInvertidoGlobal: number;
    distribucion: DistribucionWallet[];
  };
  rf06_2_bandejaPendientes: {
    totalPendientes: number;
    proveedoresSinMapeo: number;
  };
  rf06_3_rendimientoHomologacion: {
    totalEquivalencias: number;
    autoHomologados: number;
    manuales: number;
    porcentajeAuto: number;
    porcentajeManual: number;
    tasaAprobacion: number;
  };
  rf06_4_conteoGlobal: {
    totalArticulos: number;
  };
}

const PALETA_COLORES = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

const PALETA_TAILWIND_BG = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-pink-500',
];

export default function DashboardPage() {
  const [data, setData] = useState<MetricasBackend | null>(null);
  const [cargando, setCargando] = useState(true);

  const fetchMetricas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/dashboard/stats');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error al conectar con la API de Dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMetricas();
  }, []);

  const generarConicGradient = (distribucion: DistribucionWallet[]) => {
    if (!distribucion || distribucion.length === 0) {
      return 'conic-gradient(#e5e7eb 0% 100%)';
    }

    let acumulado = 0;
    const paradas = distribucion.map((item, idx) => {
      const inicio = acumulado;
      acumulado += item.porcentaje;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];
      return `${color} ${inicio}% ${acumulado}%`;
    });

    return `conic-gradient(${paradas.join(', ')})`;
  };

  if (cargando) {
    return (
      <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen flex items-center justify-center text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-emerald-600" />
        <span className="font-medium text-sm">Cargando métricas del dashboard...</span>
      </div>
    );
  }

  const totalProductos = data?.rf06_4_conteoGlobal.totalArticulos || 0;
  const pendientes = data?.rf06_2_bandejaPendientes.totalPendientes || 0;
  const shareOfWallet = data?.rf06_1_shareOfWallet.distribucion || [];
  const rendimiento = data?.rf06_3_rendimientoHomologacion;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consola de Control y Optimización</h1>
          <p className="text-gray-600 mt-1">Monitoreo y optimización de tarifas de compras en tiempo real.</p>
        </div>
        <button
          onClick={fetchMetricas}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 px-3.5 rounded-lg transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* BLOQUE SUPERIOR DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* RF06.4: Total de Productos */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between items-center text-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-600" /> Total Productos
          </span>
          <span className="text-4xl font-extrabold text-gray-800 my-2">
            {totalProductos.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Catálogo unificado
          </span>
        </div>

        {/* RF06.3: Rendimiento de Homologación */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between items-center text-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-600" /> Eficiencia Motor
          </span>
          <span className="text-4xl font-extrabold text-blue-600 my-2">
            {rendimiento?.porcentajeAuto ?? 100}%
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {rendimiento?.autoHomologados ?? 0} auto-homologados
          </span>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col justify-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Acciones Rápidas</span>
          <div className="flex flex-col gap-2">
            <Link 
              href="/proveedores" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cargar Excel</span>
            </Link>
            
            <Link 
              href="/homologacion" 
              className={`font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-between text-xs border ${
                pendientes > 0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3.5 h-3.5 ${pendientes > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                <span>Matching Pendiente</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                pendientes > 0 ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'
              }`}>
                {pendientes}
              </span>
            </Link>
          </div>
        </div>

        {/* RF06.1: Share of Wallet */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-emerald-600" /> Share of Wallet
          </span>
          
          <div className="flex items-center gap-3 my-1">
            <div 
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shrink-0" 
              style={{ background: generarConicGradient(shareOfWallet) }}
            >
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-700">{shareOfWallet.length}p</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px]">
              {shareOfWallet.length === 0 ? (
                <span className="text-gray-400 text-xs">Sin órdenes</span>
              ) : (
                shareOfWallet.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${PALETA_TAILWIND_BG[idx % PALETA_TAILWIND_BG.length]}`} />
                    <span className="text-gray-600 truncate max-w-24">{item.proveedor}</span>
                    <span className="font-bold text-gray-800">{item.porcentaje}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETALLE COMPLETO DE HOMOLOGACIÓN Y RENDIMIENTO */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Rendimiento del Motor de Homologación</h3>
            <p className="text-xs text-gray-500 mt-0.5">Métrica de eficiencia entre auto-matching (Levenshtein + RegEx) e intervención manual.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Tasa de Aprobación: {rendimiento?.tasaAprobacion ?? 100}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Auto-Homologados (Algoritmo Híbrido)</span>
              <span className="text-blue-600">{rendimiento?.porcentajeAuto ?? 100}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${rendimiento?.porcentajeAuto ?? 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Resolución Manual (Consola)</span>
              <span className="text-amber-600">{rendimiento?.porcentajeManual ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${rendimiento?.porcentajeManual ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TIP DE OPTIMIZACIÓN */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start shadow-xs">
        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-blue-900 font-bold text-sm">Tip de Optimización de Compras</h4>
          <p className="text-blue-800 text-xs mt-1 leading-relaxed">
            Actualizar las listas de precios obsoletas en la sección de Proveedores permite al simulador inteligente encontrar el costo unitario efectivo más conveniente. Revisa las listas en estado amarillo o rojo para mantener tus comparativas al día.
          </p>
        </div>
      </div>
    </div>
  );
}