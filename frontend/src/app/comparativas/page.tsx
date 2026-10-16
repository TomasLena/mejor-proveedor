'use client';

import { useState } from 'react';
import { buscarComparacion } from '@/lib/api';
import { Search, Award, Clock, Sparkles } from 'lucide-react';

interface ProductoComparado {
  id: string;
  descripcion: string;
  precio: number;
  bulto?: number | null;
  fechaCarga: string;
  diasAntiguedad: number;
  semaforo: 'VERDE' | 'AMARILLO' | 'ROJO';
  proveedor: {
    id: string;
    nombre: string;
  };
  similitud: number;
}

export default function ComparativasPage() {
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [resultadosComparacion, setResultadosComparacion] = useState<ProductoComparado[]>([]);
  const [buscandoComparacion, setBuscandoComparacion] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const handleBuscarComparacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryBusqueda.trim()) return;

    setBuscandoComparacion(true);
    try {
      const resultados = await buscarComparacion(queryBusqueda);
      setResultadosComparacion(resultados);
      setBusquedaRealizada(true);
    } catch (err: any) {
      alert(err.message || 'Error al realizar la búsqueda');
    } finally {
      setBuscandoComparacion(false);
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-emerald-400">Comparador de Precios Mayoristas</h1>
          <p className="text-sm text-slate-400">Análisis comparativo de catálogos y tarifas de compras vigentes.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <form onSubmit={handleBuscarComparacion} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Ej. Cuaderno, Resma, Lapicera, Boligrafo..."
                value={queryBusqueda}
                onChange={(e) => setQueryBusqueda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={buscandoComparacion}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {buscandoComparacion ? 'Buscando...' : 'Buscar y Comparar'}
            </button>
          </form>

          {busquedaRealizada && (
            <div className="space-y-3 pt-2">
              {resultadosComparacion.length === 0 ? (
                <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs">
                  No se encontraron coincidencias para "<strong className="text-slate-200">{queryBusqueda}</strong>".
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                    <span>
                      Se encontraron <strong className="text-emerald-400">{resultadosComparacion.length}</strong> opciones para "<strong className="text-white">{queryBusqueda}</strong>":
                    </span>
                    <span className="text-[11px] text-slate-500 italic">Ordenado del menor al mayor precio</span>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Ranking / Oferta</th>
                          <th className="py-3 px-4">Descripción en Lista</th>
                          <th className="py-3 px-4">Proveedor</th>
                          <th className="py-3 px-4 text-center">Coincidencia</th>
                          <th className="py-3 px-4 text-center">Vigencia</th>
                          <th className="py-3 px-4 text-right">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {resultadosComparacion.map((item, idx) => {
                          const esMejorPrecio = idx === 0;
                          return (
                            <tr key={item.id} className={`transition ${esMejorPrecio ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'hover:bg-slate-900/50'}`}>
                              <td className="py-3 px-4">
                                {esMejorPrecio ? (
                                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                    <Award className="w-3.5 h-3.5" /> Mejor Precio
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-500 pl-2">#{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-medium text-white">{item.descripcion}</td>
                              <td className="py-3 px-4 font-semibold text-slate-300">{item.proveedor.nombre}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                                  <Sparkles className="w-3 h-3 text-amber-400" /> {item.similitud}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {item.semaforo === 'VERDE' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <Clock className="w-3 h-3" /> Vigente ({item.diasAntiguedad}d)
                                  </span>
                                )}
                                {item.semaforo === 'AMARILLO' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <Clock className="w-3 h-3" /> Alerta ({item.diasAntiguedad}d)
                                  </span>
                                )}
                                {item.semaforo === 'ROJO' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <Clock className="w-3 h-3" /> Obsoleta (&gt;60d)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-400">
                                $ {item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}