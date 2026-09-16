'use client';

import { useEffect, useState } from 'react';
import { getProveedores, crearProveedor, guardarMapeo, cargarListaExcel, Proveedor, ProductoExtraido } from '@/lib/api';
import { Building2, Settings2, Plus, CheckCircle2, FileSpreadsheet, User, Phone, Mail, Upload, FileUp, Table } from 'lucide-react';

export default function Home() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);

  // Formulario Nuevo Proveedor
  const [nombre, setNombre] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [condicionesComerciales, setCondicionesComerciales] = useState('');

  // Formulario Mapeo Excel
  const [filaInicioData, setFilaInicioData] = useState(2);
  const [colDescripcion, setColDescripcion] = useState('A');
  const [colPrecio, setColPrecio] = useState('B');
  const [colBulto, setColBulto] = useState('C');

  // Subida y Previsualización v0.3
  const [modalExcelAbierto, setModalExcelAbierto] = useState(false);
  const [proveedorSubida, setProveedorSubida] = useState<Proveedor | null>(null);
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [cargandoExcel, setCargandoExcel] = useState(false);
  const [productosProcesados, setProductosProcesados] = useState<ProductoExtraido[]>([]);
  const [resumenProcesado, setResumenProcesado] = useState<{ proveedor: string; total: number } | null>(null);

  const cargarProveedores = async () => {
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;
    try {
      await crearProveedor({ nombre, contactoNombre, email, telefono, condicionesComerciales });
      setNombre('');
      setContactoNombre('');
      setEmail('');
      setTelefono('');
      setCondicionesComerciales('');
      setModalAbierto(false);
      cargarProveedores();
    } catch (err) {
      alert('Error al crear el proveedor');
    }
  };

  const abrirConfiguracionMapeo = (p: Proveedor) => {
    setProveedorSeleccionado(p);
    if (p.mapeo) {
      setFilaInicioData(p.mapeo.filaInicioData || 2);
      setColDescripcion(p.mapeo.colDescripcion || 'A');
      setColPrecio(p.mapeo.colPrecio || 'B');
      setColBulto(p.mapeo.colBulto || 'C');
    }
  };

  const handleGuardarMapeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorSeleccionado) return;
    try {
      await guardarMapeo(proveedorSeleccionado.id, {
        filaInicioData: Number(filaInicioData),
        colDescripcion,
        colPrecio,
        colBulto,
      });
      setProveedorSeleccionado(null);
      cargarProveedores();
    } catch (err) {
      alert('Error al guardar la configuración de mapeo');
    }
  };

  const abrirModalSubida = (p: Proveedor) => {
    setProveedorSubida(p);
    setArchivoExcel(null);
    setModalExcelAbierto(true);
  };

  const handleSubirExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorSubida || !archivoExcel) return;

    setCargandoExcel(true);
    try {
      const resultado = await cargarListaExcel(proveedorSubida.id, archivoExcel);
      setProductosProcesados(resultado.productos);
      setResumenProcesado({ proveedor: resultado.proveedor, total: resultado.totalLeidos });
      setModalExcelAbierto(false);
    } catch (err: any) {
      alert(err.message || 'Error al procesar el archivo Excel');
    } finally {
      setCargandoExcel(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">MejorProveedor v1.0</h1>
            <p className="text-sm text-slate-400">Módulo 2: Carga y Lectura Parametrizada de Planillas Excel (v0.3)</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </button>
        </div>

        {/* Panel Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado de Proveedores */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
              <Building2 className="w-5 h-5 text-emerald-400" /> Proveedores Registrados
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando proveedores...</div>
            ) : proveedores.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
                No hay proveedores registrados aún.
              </div>
            ) : (
              <div className="space-y-3">
                {proveedores.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base">{p.nombre}</span>
                        {p.mapeo && (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Mapeado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        {p.contactoNombre && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> {p.contactoNombre}</span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {p.email}</span>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {p.telefono}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => abrirConfiguracionMapeo(p)}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-emerald-400" /> Mapeo
                      </button>

                      {p.mapeo ? (
                        <button
                          onClick={() => abrirModalSubida(p)}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-lg transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> Subir Excel
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic px-2">Configurar mapeo antes de subir</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Configuración Mapeo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200 mb-4 border-b border-slate-800 pb-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Mapeo de Columnas
            </h2>

            {proveedorSeleccionado ? (
              <form onSubmit={handleGuardarMapeo} className="space-y-4">
                <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                  Configurando: <strong>{proveedorSeleccionado.nombre}</strong>
                </p>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fila inicio de datos</label>
                  <input
                    type="number"
                    min="1"
                    value={filaInicioData}
                    onChange={(e) => setFilaInicioData(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Columna Descripción (*)</label>
                    <input
                      type="text"
                      value={colDescripcion}
                      onChange={(e) => setColDescripcion(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Columna Precio (*)</label>
                    <input
                      type="text"
                      value={colPrecio}
                      onChange={(e) => setColPrecio(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Columna Bulto (Opcional)</label>
                    <input
                      type="text"
                      value={colBulto}
                      onChange={(e) => setColBulto(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded transition cursor-pointer">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setProveedorSeleccionado(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded transition cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Selecciona <strong>"Mapeo"</strong> en cualquier proveedor para definir su formato.
              </p>
            )}
          </div>
        </div>

        {/* Tabla de Previsualización de Productos Extraídos (v0.3) */}
        {productosProcesados.length > 0 && resumenProcesado && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Table className="w-5 h-5" /> Previsualización de Lista Procesada
                </h3>
                <p className="text-xs text-slate-400">
                  Proveedor: <strong className="text-white">{resumenProcesado.proveedor}</strong> — Se leyeron <strong className="text-emerald-400">{resumenProcesado.total}</strong> productos válidos.
                </p>
              </div>
              <button
                onClick={() => setProductosProcesados([])}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition cursor-pointer"
              >
                Cerrar vista
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Descripción del Producto</th>
                    <th className="py-3 px-4 text-right">Precio de Lista</th>
                    <th className="py-3 px-4 text-center">Bulto / Caja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {productosProcesados.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{p.descripcion}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                        $ {p.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-400">{p.bulto ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Carga de Excel (v0.3) */}
      {modalExcelAbierto && proveedorSubida && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileUp className="w-5 h-5 text-emerald-400" /> Cargar Planilla de Precios
            </h3>
            <p className="text-xs text-slate-400">
              Subiendo lista para: <strong className="text-white">{proveedorSubida.nombre}</strong>
            </p>

            <form onSubmit={handleSubirExcel} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-lg p-6 text-center cursor-pointer bg-slate-950 transition">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setArchivoExcel(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={cargandoExcel}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded transition cursor-pointer disabled:opacity-50"
                >
                  {cargandoExcel ? 'Procesando Excel...' : 'Procesar Lista'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalExcelAbierto(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proveedor */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Registrar Nuevo Proveedor</h3>
            <form onSubmit={handleCrearProveedor} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Empresa (*)</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded transition cursor-pointer">
                  Guardar Proveedor
                </button>
                <button type="button" onClick={() => setModalAbierto(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded transition cursor-pointer">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}