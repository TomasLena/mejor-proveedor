'use client';

import { useEffect, useState } from 'react';
import { getProveedores, crearProveedor, guardarMapeo, Proveedor } from '@/lib/api';
import { Building2, Settings2, Plus, CheckCircle2, FileSpreadsheet, User, Phone, Mail, FileText } from 'lucide-react';

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
      await crearProveedor({
        nombre,
        contactoNombre,
        email,
        telefono,
        condicionesComerciales,
      });
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">MejorProveedor v1.0</h1>
            <p className="text-sm text-slate-400">Módulo 1: ABM de Proveedores y Mapeo Parametrizable</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </button>
        </div>

        {/* Contenido Principal */}
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
                No hay proveedores registrados aún. Agrega el primero con el botón superior.
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
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" /> {p.contactoNombre}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" /> {p.email}
                          </span>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" /> {p.telefono}
                          </span>
                        )}
                      </div>
                      {p.condicionesComerciales && (
                        <p className="text-xs text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/10 mt-2 w-fit">
                          {p.condicionesComerciales}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => abrirConfiguracionMapeo(p)}
                      className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition shrink-0 cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4 text-emerald-400" /> Configurar Excel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Lateral: Configuración del Mapeo */}
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
                  <label className="text-xs text-slate-400 block mb-1">Fila donde inician los productos</label>
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
                    <label className="text-xs text-slate-400 block mb-1">Columna Descripción / Producto (*)</label>
                    <input
                      type="text"
                      placeholder="Ej: A"
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
                      placeholder="Ej: B"
                      value={colPrecio}
                      onChange={(e) => setColPrecio(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Columna Bulto / Empaque (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: C"
                      value={colBulto}
                      onChange={(e) => setColBulto(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded transition cursor-pointer"
                  >
                    Guardar Mapeo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProveedorSeleccionado(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Selecciona <strong>"Configurar Excel"</strong> en cualquier proveedor para indicar la ubicación de sus columnas.
              </p>
            )}
          </div>
        </div>
      </div>

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
                  placeholder="Ej: Distribuidora AyB"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre de Contacto</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ventas@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="11-1234-5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Condiciones / Notas Comerciales</label>
                <textarea
                  placeholder="Ej: Descuento del 10% superando los $2.000.000"
                  value={condicionesComerciales}
                  onChange={(e) => setCondicionesComerciales(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 h-20 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded transition cursor-pointer"
                >
                  Guardar Proveedor
                </button>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded transition cursor-pointer"
                >
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