'use client';

import { useState, useEffect, useMemo } from 'react';
import { buscarComparacion } from '@/lib/api';
import { Search, Award } from 'lucide-react';

interface ProductoComparado {
  id: string;
  descripcion: string;
  precio: number;
  bulto?: number | null;
  fechaCarga?: string;
  diasAntiguedad?: number;
  semaforo?: 'VERDE' | 'AMARILLO' | 'ROJO';
  proveedor: {
    id: string;
    nombre: string;
  };
  similitud?: number;
}

interface FilaMatriz {
  descripcion: string;
  preciosPorProveedor: { [nombreProveedor: string]: number };
  mejorPrecio: number;
  mejorProveedor: string;
}

export default function ComparativasPage() {
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [resultadosComparacion, setResultadosComparacion] = useState<ProductoComparado[]>([]);
  const [buscando, setBuscando] = useState(true);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Carga inicial automática al montar el componente
  useEffect(() => {
    fetchProductosIniciales();
  }, []);

  const fetchProductosIniciales = async () => {
    setBuscando(true);
    try {
      const res = await fetch('http://localhost:4000/api/productos');
      if (res.ok) {
        const data = await res.json();
        const formateados = data.map((p: any) => ({
          id: p.id,
          descripcion: p.descripcion,
          precio: p.precio,
          bulto: p.bulto,
          fechaCarga: p.fechaCarga,
          proveedor: p.proveedor,
        }));
        setResultadosComparacion(formateados);
        setBusquedaRealizada(true);
      }
    } catch (error) {
      console.error('Error al cargar catálogo inicial:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscarComparacion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!queryBusqueda.trim()) {
      return fetchProductosIniciales();
    }

    setBuscando(true);
    try {
      const resultados = await buscarComparacion(queryBusqueda);
      setResultadosComparacion(resultados);
      setBusquedaRealizada(true);
    } catch (err: any) {
      alert(err.message || 'Error al realizar la búsqueda');
    } finally {
      setBuscando(false);
    }
  };

  const proveedoresUnicos = useMemo(() => {
    const lista = resultadosComparacion.map((item) => item.proveedor.nombre);
    return Array.from(new Set(lista));
  }, [resultadosComparacion]);

  const filasMatriz = useMemo(() => {
    const mapa = new Map<string, { [prov: string]: number }>();

    resultadosComparacion.forEach((item) => {
      const desc = item.descripcion;
      if (!mapa.has(desc)) {
        mapa.set(desc, {});
      }
      const precios = mapa.get(desc)!;
      if (!precios[item.proveedor.nombre] || item.precio < precios[item.proveedor.nombre]) {
        precios[item.proveedor.nombre] = item.precio;
      }
    });

    const filas: FilaMatriz[] = [];

    mapa.forEach((preciosProv, descripcion) => {
      const listaPrecios = Object.values(preciosProv);
      const mejorPrecio = Math.min(...listaPrecios);
      const mejorProveedor =
        Object.keys(preciosProv).find((prov) => preciosProv[prov] === mejorPrecio) || '';

      filas.push({
        descripcion,
        preciosPorProveedor: preciosProv,
        mejorPrecio,
        mejorProveedor,
      });
    });

    // orden alfabetico y limitado a 100 filas (testear experiencia de usuario)
    return filas
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      .slice(0, 100);
  }, [resultadosComparacion]);

  return (
    <main className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="space-y-6">
        {/* Cabecera */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comparador de Precios Mayoristas</h1>
          <p className="text-gray-600 mt-1">Análisis comparativo de catálogos y tarifas de compras vigentes.</p>
        </div>

        {/* Buscador */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <form onSubmit={handleBuscarComparacion} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre (ej. Cuaderno, Resma, Bolígrafo)..."
                value={queryBusqueda}
                onChange={(e) => setQueryBusqueda(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {buscando ? 'Procesando...' : 'Buscar y Comparar'}
            </button>
          </form>

          {/* Estado de Resultados */}
          {buscando ? (
            <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
              Cargando catálogo comparativo desde PostgreSQL...
            </div>
          ) : busquedaRealizada && (
            <div className="pt-2">
              {filasMatriz.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                  No se encontraron productos para mostrar. Subí una lista en Proveedores.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-gray-600 flex justify-between items-center px-1">
                    <span>
                      Mostrando <strong className="text-emerald-700">{filasMatriz.length}</strong> productos (máx. 100 por rendimiento) comparados entre <strong className="text-emerald-700">{proveedoresUnicos.length}</strong> proveedores:
                    </span>
                    <span className="text-gray-400 font-medium">Ordenado alfabéticamente A-Z</span>
                  </div>

                  {/* Tabla Matricial Dinámica */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-200 font-bold">
                          <tr>
                            <th className="py-3.5 px-4">Descripción del Producto</th>
                            {proveedoresUnicos.map((provNombre) => (
                              <th key={provNombre} className="py-3.5 px-4 text-center">
                                {provNombre}
                              </th>
                            ))}
                            <th className="py-3.5 px-4 text-center bg-emerald-50/70 text-emerald-900">
                              Mejor Opción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filasMatriz.map((fila, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              {/* Descripción */}
                              <td className="py-4 px-4 font-semibold text-gray-900">
                                {fila.descripcion}
                              </td>

                              {/* Columnas por Proveedor */}
                              {proveedoresUnicos.map((provNombre) => {
                                const precioProv = fila.preciosPorProveedor[provNombre];
                                const esMejor = precioProv !== undefined && precioProv === fila.mejorPrecio;

                                return (
                                  <td key={provNombre} className="py-4 px-4 text-center">
                                    {precioProv !== undefined ? (
                                      <span
                                        className={`inline-block px-3 py-1 rounded-md font-bold text-xs transition-all ${
                                          esMejor
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        $ {precioProv.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 font-normal">—</span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Resumen: Mejor Precio */}
                              <td className="py-4 px-4 text-center bg-emerald-50/30">
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 font-black text-emerald-700 text-sm">
                                    <Award className="w-4 h-4 text-emerald-600" />
                                    $ {fila.mejorPrecio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[11px] font-semibold text-emerald-900/70 mt-0.5">
                                    {fila.mejorProveedor}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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