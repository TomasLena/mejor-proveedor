'use client';

import { useState, useEffect, useMemo } from 'react';
import { buscarComparacion } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { Search, Award, ShoppingCart, Check, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProductoComparado {
  id: string;
  descripcion: string;
  precio: number;
  bulto?: number | null;
  precioUnitario?: number;
  fechaCarga?: string;
  semaforo?: 'VERDE' | 'AMARILLO' | 'ROJO';
  proveedor: {
    id: string;
    nombre: string;
  };
}

interface InfoPrecioProveedor {
  productoId: string;
  proveedorId: string;
  precioLista: number;
  precioUnitario: number;
  bulto: number;
  fechaCarga?: string;
  semaforo?: 'VERDE' | 'AMARILLO' | 'ROJO';
}

interface FilaMatriz {
  descripcion: string;
  preciosPorProveedor: { [nombreProveedor: string]: InfoPrecioProveedor };
  mejorPrecio: number;
  mejorProveedor: string;
  mejorProductoId: string;
  mejorProveedorId: string;
  mejorBulto: number;
  hayOfertaValida: boolean;
}

const PRODUCTOS_POR_PAGINA = 50;

export function obtenerSemaforoVigencia(fechaCargaStr?: string | Date, semaforoBackend?: string) {
  if (semaforoBackend === 'ROJO') {
    return { color: 'ROJO' as const, label: 'Vencida', dotClass: 'bg-rose-500', dias: 61 };
  }
  if (semaforoBackend === 'AMARILLO') {
    return { color: 'AMARILLO' as const, label: 'Por vencer', dotClass: 'bg-amber-500', dias: 45 };
  }
  if (semaforoBackend === 'VERDE') {
    return { color: 'VERDE' as const, label: 'Vigente', dotClass: 'bg-emerald-500', dias: 10 };
  }

  if (!fechaCargaStr) {
    return {
      color: 'GRIS' as const,
      label: 'Sin Lista',
      dias: 0,
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
      dotClass: 'bg-gray-400',
    };
  }

  const fechaCarga = new Date(fechaCargaStr);
  const hoy = new Date();
  const diffMs = hoy.getTime() - fechaCarga.getTime();
  const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (dias <= 30) {
    return {
      color: 'VERDE' as const,
      label: 'Vigente',
      dias,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
    };
  } else if (dias <= 60) {
    const diasRestantes = 60 - dias;
    return {
      color: 'AMARILLO' as const,
      label: `Por vencer • ${diasRestantes}d`,
      dias,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-500',
    };
  } else {
    return {
      color: 'ROJO' as const,
      label: `Vencida • Hace ${dias}d`,
      dias,
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      dotClass: 'bg-rose-500',
    };
  }
}

export default function ComparativasPage() {
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [resultadosComparacion, setResultadosComparacion] = useState<ProductoComparado[]>([]);
  const [buscando, setBuscando] = useState(true);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [verPrecioUnitario, setVerPrecioUnitario] = useState(false);
  const [agregadosTemp, setAgregadosTemp] = useState<{ [key: string]: boolean }>({});
  
  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1);

  const { items: cartItems, addItem } = useCartStore();

  useEffect(() => {
    fetchProductosIniciales();
  }, []);

  const fetchProductosIniciales = async () => {
    setBuscando(true);
    setPaginaActual(1);
    try {
      const res = await fetch('http://localhost:4000/api/productos');
      if (res.ok) {
        const data = await res.json();
        const formateados = data.map((p: any) => {
          const bultoVal = p.bulto && p.bulto > 1 ? p.bulto : 1;
          const unitarioVal = p.precioUnitario ?? (p.precio / bultoVal);

          return {
            id: p.id,
            descripcion: p.descripcion,
            precio: p.precio,
            bulto: bultoVal,
            precioUnitario: Number(unitarioVal.toFixed(2)),
            fechaCarga: p.fechaCarga || p.listaPrecio?.fechaCarga,
            semaforo: p.semaforo,
            proveedor: p.proveedor || p.listaPrecio?.proveedor,
          };
        });
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
    if (!queryBusqueda.trim()) return fetchProductosIniciales();

    setBuscando(true);
    setPaginaActual(1);
    try {
      const resultados = await buscarComparacion(queryBusqueda);
      const adaptados = resultados.map((p: any) => {
        const bultoVal = p.bulto && p.bulto > 1 ? p.bulto : 1;
        const unitarioVal = p.precioUnitario ?? (p.precio / bultoVal);

        return {
          ...p,
          bulto: bultoVal,
          precioUnitario: Number(unitarioVal.toFixed(2)),
          fechaCarga: p.fechaCarga || p.listaPrecio?.fechaCarga,
          semaforo: p.semaforo,
          proveedor: p.proveedor || p.listaPrecio?.proveedor,
        };
      });
      setResultadosComparacion(adaptados);
      setBusquedaRealizada(true);
    } catch (err: any) {
      alert(err.message || 'Error al realizar la búsqueda');
    } finally {
      setBuscando(false);
    }
  };

  const proveedoresUnicos = useMemo(() => {
    const lista = resultadosComparacion
      .filter((item) => item.proveedor && item.proveedor.nombre)
      .map((item) => item.proveedor.nombre);
    return Array.from(new Set(lista));
  }, [resultadosComparacion]);

  const filasMatriz = useMemo(() => {
    const mapa = new Map<string, { descripcionMostrar: string; precios: { [prov: string]: InfoPrecioProveedor } }>();

    resultadosComparacion.forEach((item) => {
      if (!item.proveedor) return;
      const descLimpia = item.descripcion.replace(/\s+/g, ' ').trim();
      const claveGrupo = descLimpia.toLowerCase();

      const bultoVal = item.bulto && item.bulto > 1 ? item.bulto : 1;
      const unitarioVal = item.precioUnitario ?? (item.precio / bultoVal);

      if (!mapa.has(claveGrupo)) {
        mapa.set(claveGrupo, { descripcionMostrar: descLimpia, precios: {} });
      }

      const grupo = mapa.get(claveGrupo)!;
      const precios = grupo.precios;
      const actual = precios[item.proveedor.nombre];

      const comparadorActual = verPrecioUnitario
        ? (actual ? actual.precioUnitario : Infinity)
        : (actual ? actual.precioLista : Infinity);

      const comparadorNuevo = verPrecioUnitario ? unitarioVal : item.precio;

      if (!actual || comparadorNuevo < comparadorActual) {
        precios[item.proveedor.nombre] = {
          productoId: item.id,
          proveedorId: item.proveedor.id,
          precioLista: item.precio,
          precioUnitario: unitarioVal,
          bulto: bultoVal,
          fechaCarga: item.fechaCarga,
          semaforo: item.semaforo,
        };
      }
    });

    const filas: FilaMatriz[] = [];

    mapa.forEach(({ descripcionMostrar, precios: preciosProv }) => {
      const provs = Object.keys(preciosProv);
      let mejorPrecio = Infinity;
      let mejorProveedor = '';
      let mejorProductoId = '';
      let mejorProveedorId = '';
      let mejorBulto = 1;
      let hayOfertaValida = false;

      provs.forEach((prov) => {
        const info = preciosProv[prov];
        const semaforoInfo = obtenerSemaforoVigencia(info.fechaCarga, info.semaforo);

        if (semaforoInfo.color !== 'ROJO' && semaforoInfo.color !== 'GRIS') {
          hayOfertaValida = true;
          const valorAComparar = verPrecioUnitario ? info.precioUnitario : info.precioLista;

          if (valorAComparar < mejorPrecio) {
            mejorPrecio = valorAComparar;
            mejorProveedor = prov;
            mejorProductoId = info.productoId;
            mejorProveedorId = info.proveedorId;
            mejorBulto = info.bulto;
          }
        }
      });

      filas.push({
        descripcion: descripcionMostrar,
        preciosPorProveedor: preciosProv,
        mejorPrecio: mejorPrecio === Infinity ? 0 : mejorPrecio,
        mejorProveedor,
        mejorProductoId,
        mejorProveedorId,
        mejorBulto,
        hayOfertaValida,
      });
    });

    return filas.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  }, [resultadosComparacion, verPrecioUnitario]);

  // Paginación
  const totalPaginas = Math.ceil(filasMatriz.length / PRODUCTOS_POR_PAGINA) || 1;

  const filasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    return filasMatriz.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
  }, [filasMatriz, paginaActual]);

  const handleAgregarAlCarrito = (productoId: string, descripcion: string, proveedorId: string, proveedorNombre: string, precio: number, bulto: number) => {
    addItem({
      productoId,
      descripcion,
      proveedorId,
      proveedorNombre,
      precio,
      bulto,
    });

    setAgregadosTemp((prev) => ({ ...prev, [productoId]: true }));
    setTimeout(() => {
      setAgregadosTemp((prev) => ({ ...prev, [productoId]: false }));
    }, 1500);
  };

  return (
    <main className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comparador de Precios Mayoristas</h1>
            <p className="text-gray-600 mt-1">Análisis comparativo de catálogos y tarifas de compras vigentes.</p>
          </div>
          <Link href="/pedidos" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm">
            <ShoppingCart className="w-4 h-4" />
            <span>Ver Carrito ({cartItems.length})</span>
          </Link>
        </div>

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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <div className="text-xs text-gray-600">
                      Mostrando <strong className="text-emerald-700">{filasMatriz.length}</strong> productos comparados entre <strong className="text-emerald-700">{proveedoresUnicos.length}</strong> proveedores (Página {paginaActual} de {totalPaginas}):
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVerPrecioUnitario(!verPrecioUnitario);
                        setPaginaActual(1);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        verPrecioUnitario
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>{verPrecioUnitario ? '📦' : '🏷️'}</span>
                      <span>
                        {verPrecioUnitario ? 'Modo: Precio Unitario (/u)' : 'Modo: Precio de Lista (Bulto)'}
                      </span>
                    </button>
                  </div>

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
                              Mejor Opción {verPrecioUnitario ? '(/u)' : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filasPaginadas.map((fila, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-4 px-4 font-semibold text-gray-900">
                                {fila.descripcion}
                              </td>

                              {proveedoresUnicos.map((provNombre) => {
                                const infoProv = fila.preciosPorProveedor[provNombre];
                                if (!infoProv) {
                                  return (
                                    <td key={provNombre} className="py-4 px-4 text-center text-gray-300">—</td>
                                  );
                                }

                                const semaforoInfo = obtenerSemaforoVigencia(infoProv.fechaCarga, infoProv.semaforo);
                                const precioMostrar = verPrecioUnitario ? infoProv.precioUnitario : infoProv.precioLista;
                                
                                const esVencida = semaforoInfo.color === 'ROJO' || semaforoInfo.color === 'GRIS';
                                const esGanador = fila.hayOfertaValida && precioMostrar === fila.mejorPrecio && !esVencida;

                                let badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';

                                if (esVencida) {
                                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 line-through opacity-70';
                                } else if (esGanador) {
                                  if (semaforoInfo.color === 'AMARILLO') {
                                    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-xs';
                                  } else {
                                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-xs';
                                  }
                                } else if (semaforoInfo.color === 'AMARILLO') {
                                  badgeClass = 'bg-amber-50 text-amber-800 border-amber-200/80';
                                }

                                return (
                                  <td key={provNombre} className="py-4 px-4 text-center">
                                    <div className="inline-flex flex-col items-center gap-1">
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-xs border ${badgeClass}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${semaforoInfo.dotClass}`}></span>
                                        $ {precioMostrar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>

                                      {esVencida ? (
                                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                                          <AlertTriangle className="w-3 h-3" /> Vencida
                                        </span>
                                      ) : semaforoInfo.color === 'AMARILLO' && !esGanador ? (
                                        <span className="text-[10px] text-amber-700 font-medium">
                                          Por vencer
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleAgregarAlCarrito(infoProv.productoId, fila.descripcion, infoProv.proveedorId, provNombre, infoProv.precioLista, infoProv.bulto)}
                                          className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                        >
                                          + Carrito
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}

                              <td className="py-4 px-4 text-center bg-emerald-50/30">
                                {fila.hayOfertaValida ? (
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1 font-black text-emerald-700 text-sm">
                                      <Award className="w-4 h-4 text-emerald-600" />
                                      $ {fila.mejorPrecio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[11px] font-semibold text-emerald-900/70">
                                      {fila.mejorProveedor}
                                    </span>
                                    <button
                                      onClick={() => handleAgregarAlCarrito(fila.mejorProductoId, fila.descripcion, fila.mejorProveedorId, fila.mejorProveedor, fila.mejorPrecio, fila.mejorBulto)}
                                      className={`px-2 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        agregadosTemp[fila.mejorProductoId]
                                          ? 'bg-emerald-700 text-white'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      }`}
                                    >
                                      {agregadosTemp[fila.mejorProductoId] ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                                      {agregadosTemp[fila.mejorProductoId] ? 'Añadido' : 'Elegir Mejor'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200 inline-block">
                                    Sin ofertas vigentes
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* BARRA DE PAGINACIÓN */}
                    {totalPaginas > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                        <div>
                          Mostrando del <strong>{(paginaActual - 1) * PRODUCTOS_POR_PAGINA + 1}</strong> al{' '}
                          <strong>{Math.min(paginaActual * PRODUCTOS_POR_PAGINA, filasMatriz.length)}</strong> de{' '}
                          <strong>{filasMatriz.length}</strong> productos
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaginaActual((prev) => Math.max(prev - 1, 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={paginaActual === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                          </button>

                          <span className="font-bold text-gray-800 px-2">
                            Página {paginaActual} de {totalPaginas}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            Siguiente <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
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