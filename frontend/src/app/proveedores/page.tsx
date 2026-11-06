"use client";

import { useState, useEffect } from "react";

interface Proveedor {
  id: string;
  nombre: string;
  contactoNombre?: string;
  email?: string;
  telefono?: string;
  cuit?: string;
  mapeo?: {
    id?: string;
    colDescripcion?: string;
    colPrecio?: string;
  } | null;
  listas?: { fechaCarga: string }[];
}

export function obtenerSemaforoVigencia(fechaCargaStr?: string | Date) {
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
      label: `Por vencer • ${diasRestantes} días`,
      dias,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-500',
    };
  } else {
    return {
      color: 'ROJO' as const,
      label: `Vencida • Hace ${dias} días`,
      dias,
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      dotClass: 'bg-rose-500',
    };
  }
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Vigentes" | "Vencidos">("Todos");

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [vista, setVista] = useState<"directorio" | "mapeo">("directorio");

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCuit, setNuevoCuit] = useState("");
  const [nuevoContacto, setNuevoContacto] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [filaInicio, setFilaInicio] = useState(2);
  const [colDescripcion, setColDescripcion] = useState("B");
  const [colPrecio, setColPrecio] = useState("C");
  const [colBulto, setColBulto] = useState("D");
  const [guardandoMapeo, setGuardandoMapeo] = useState(false);
  const [cargandoPreview, setCargandoPreview] = useState(false);

  const [filasRaw, setFilasRaw] = useState<any[][]>([]);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/proveedores");
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return alert("El nombre del proveedor es obligatorio");

    setCreandoProveedor(true);
    try {
      const res = await fetch("http://localhost:4000/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          cuit: nuevoCuit || null,
          contactoNombre: nuevoContacto || null,
          email: nuevoEmail || null,
          telefono: nuevoTelefono || null,
        }),
      });

      if (res.ok) {
        const nuevoProv = await res.json();
        setProveedores((prev) => [...prev, nuevoProv]);
        alert("¡Proveedor registrado con éxito!");
        setNuevoNombre("");
        setNuevoCuit("");
        setNuevoContacto("");
        setNuevoEmail("");
        setNuevoTelefono("");
        setMostrarModalCrear(false);
      } else {
        const errorData = await res.json();
        alert(`Error al registrar: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al registrar proveedor.");
    } finally {
      setCreandoProveedor(false);
    }
  };

  const handleEliminarProveedor = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el proveedor "${nombre}"? Se borrarán sus listas asociadas.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/proveedores/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProveedores((prev) => prev.filter((p) => p.id !== id));
        alert("Proveedor eliminado correctamente.");
      } else {
        const errorData = await res.json();
        alert(`Error al eliminar: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al eliminar el proveedor.");
    }
  };

  const handleAbrirMapeo = (prov: Proveedor) => {
    setProveedorSeleccionado(prov);
    setArchivo(null);
    setFilasRaw([]);
    setVista("mapeo");
  };

  const procesarArchivoExcel = async (file: File) => {
    setArchivo(file);
    setCargandoPreview(true);

    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const res = await fetch("http://localhost:4000/api/proveedores/preview-excel", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFilasRaw(data.filas || []);
      } else {
        alert("Error al leer la previsualización del archivo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al obtener previsualización.");
    } finally {
      setCargandoPreview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivoExcel(e.target.files[0]);
    }
  };

  const handleDropArchivo = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivoExcel(e.dataTransfer.files[0]);
    }
  };

  const handleDragOverArchivo = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleGuardarYProcesar = async () => {
    if (!proveedorSeleccionado) return;
    setGuardandoMapeo(true);

    try {
      const resMapeo = await fetch(`http://localhost:4000/api/proveedores/${proveedorSeleccionado.id}/mapeo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filaInicioData: Number(filaInicio),
          colDescripcion,
          colPrecio,
          colBulto: colBulto || null,
        }),
      });

      if (!resMapeo.ok) {
        const errMapeo = await resMapeo.json();
        throw new Error(errMapeo.error || "Error al guardar la configuración de mapeo.");
      }

      if (archivo) {
        const formData = new FormData();
        formData.append("archivo", archivo);

        const resUpload = await fetch(
          `http://localhost:4000/api/proveedores/${proveedorSeleccionado.id}/cargar-excel`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (resUpload.ok) {
          const dataUpload = await resUpload.json();
          alert(`¡Lista procesada con éxito! Se guardaron ${dataUpload.totalLeidos} productos en la base de datos.`);
          fetchProveedores();
        } else {
          const errUpload = await resUpload.json();
          throw new Error(errUpload.error || "Error al procesar el archivo Excel.");
        }
      } else {
        alert("Parámetros de mapeo guardados correctamente.");
      }

      setArchivo(null);
      setFilasRaw([]);
      setVista("directorio");
      
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setGuardandoMapeo(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cuit && p.cuit.includes(busqueda));

    const ultimaFecha = p.listas && p.listas.length > 0 ? p.listas[0].fechaCarga : undefined;
    const semaforo = obtenerSemaforoVigencia(ultimaFecha);

    if (filtroEstado === "Vigentes") return coincideBusqueda && semaforo.color !== "ROJO" && semaforo.color !== "GRIS";
    if (filtroEstado === "Vencidos") return coincideBusqueda && semaforo.color === "ROJO";
    return coincideBusqueda;
  });

  const maxCols = filasRaw.reduce((max, f) => Math.max(max, f.length), 0);
  const letrasColumnas = Array.from({ length: Math.max(maxCols, 4) }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 text-gray-900 min-h-screen">
      {/* VISTA 1: DIRECTORIO DE PROVEEDORES */}
      {vista === "directorio" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
              <p className="text-gray-600 mt-1">Directorio unificado de abastecimiento, homologación y mapeo de catálogos (ABM)</p>
            </div>
            <button
              onClick={() => setMostrarModalCrear(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              + Registrar Nuevo Proveedor
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, CUIT, rubro..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setFiltroEstado("Todos")} className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer ${filtroEstado === "Todos" ? "border-emerald-600 text-emerald-700 bg-emerald-50" : "border-gray-200 text-gray-600 bg-white"}`}>
                Todos ({proveedores.length})
              </button>
              <button onClick={() => setFiltroEstado("Vigentes")} className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer ${filtroEstado === "Vigentes" ? "border-emerald-600 text-emerald-700 bg-emerald-50" : "border-gray-200 text-gray-600 bg-white"}`}>
                Vigentes
              </button>
              <button onClick={() => setFiltroEstado("Vencidos")} className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer ${filtroEstado === "Vencidos" ? "border-emerald-600 text-emerald-700 bg-emerald-50" : "border-gray-200 text-gray-600 bg-white"}`}>
                Vencidos
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-gray-500">Cargando proveedores...</div>
          ) : proveedoresFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No se encontraron proveedores registrados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proveedoresFiltrados.map((prov) => {
                const iniciales = prov.nombre.substring(0, 2).toUpperCase();
                const ultimaFecha = prov.listas && prov.listas.length > 0 ? prov.listas[0].fechaCarga : undefined;
                const semaforo = obtenerSemaforoVigencia(ultimaFecha);

                return (
                  <div key={prov.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs ${
                            semaforo.color === 'ROJO' ? 'bg-rose-500' : semaforo.color === 'AMARILLO' ? 'bg-amber-500' : semaforo.color === 'GRIS' ? 'bg-gray-400' : 'bg-emerald-500'
                          }`}>
                            {iniciales}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{prov.nombre}</h3>
                            <p className="text-xs text-gray-500">CUIT: {prov.cuit || "Sin registrar"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Fila de Estados: Semáforo a la izquierda | Mapeo a la derecha */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${semaforo.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${semaforo.dotClass}`}></span>
                          {semaforo.label}
                        </span>

                        {prov.mapeo ? (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            📦 Mapeado
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            ⚠️ Precisa mapeo
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600 mb-6 border-t border-gray-100 pt-3">
                        <p>👤 {prov.contactoNombre || "Contacto Comercial"}</p>
                        <p>✉️ {prov.email || "contacto@proveedor.com"}</p>
                        <p>📞 {prov.telefono || "+54 11 0000-0000"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleAbrirMapeo(prov)}
                        className="grow bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        ⚙️ Cargar Lista / Mapear
                      </button>
                      <button
                        onClick={() => handleEliminarProveedor(prov.id, prov.nombre)}
                        className="bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        title="Eliminar proveedor"
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL CREAR NUEVO PROVEEDOR */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-gray-900">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Registrar Nuevo Proveedor</h3>
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearProveedor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nombre de la Empresa / Mayorista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Central S.A."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  CUIT
                </label>
                <input
                  type="text"
                  placeholder="30-12345678-9"
                  value={nuevoCuit}
                  onChange={(e) => setNuevoCuit(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nombre del Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nuevoContacto}
                  onChange={(e) => setNuevoContacto(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="ventas@prov.com"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+54 11 ..."
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="flex-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoProveedor}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-xs cursor-pointer"
                >
                  {creandoProveedor ? "Guardando..." : "Guardar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISTA 2: IMPORTADOR Y MAPEADOR DE CATÁLOGOS */}
      {vista === "mapeo" && proveedorSeleccionado && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Importador y Mapeador de Catálogos</h1>
              <p className="text-gray-600 mt-1">Carga listas de precios y vincula las columnas al catálogo maestro.</p>
            </div>
            <button onClick={() => setVista("directorio")} className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 cursor-pointer">
              ← Volver al Directorio
            </button>
          </div>

          {/* PASO 1 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded mb-4">PASO 1</span>
            <h3 className="text-lg font-bold text-gray-900 mb-4 inline-block ml-3">Cargar Archivo de Proveedor</h3>

            <label
              onDragOver={handleDragOverArchivo}
              onDrop={handleDropArchivo}
              className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl font-bold mb-3">☁️</div>
              <p className="text-gray-800 font-bold text-sm">Arrastra tu archivo .xlsx o .xls aquí</p>
              <p className="text-emerald-600 font-semibold text-xs mt-1">o haz clic para seleccionar archivo</p>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
            </label>

            {cargandoPreview && <p className="mt-3 text-sm text-amber-600 font-medium">Leyendo celdas del archivo Excel...</p>}
            {archivo && !cargandoPreview && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-sm text-green-800 font-medium">
                📄 Archivo cargado correctamente: <strong>{archivo.name}</strong>
              </div>
            )}
          </div>

          {/* PASO 2 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded mb-4">PASO 2</span>
            <h3 className="text-lg font-bold text-gray-900 mb-4 inline-block ml-3">Configuración de Mapeo & Equivalencias</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Proveedor</label>
                <input type="text" disabled value={proveedorSeleccionado.nombre} className="w-full p-2.5 border border-gray-200 bg-gray-100 rounded-lg text-sm font-semibold text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Fila donde inician los datos</label>
                <input
                  type="number"
                  min={1}
                  value={filaInicio}
                  onChange={(e) => setFilaInicio(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* PANEL DE TARJETAS ARRASTRABLES */}
            <div className="mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                👇 Arrastrá cada tarjeta de campo y soltala sobre la cabecera de la columna correspondiente:
              </p>
              <div className="flex flex-wrap gap-3">
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "DESCRIPCION")}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs border cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all ${
                    colDescripcion
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 opacity-80"
                      : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                  }`}
                >
                  <span>✋ 📌 Descripción (Requerido)</span>
                  {colDescripcion && <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">En Columna {colDescripcion}</span>}
                </div>

                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "PRECIO")}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs border cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all ${
                    colPrecio
                      ? "bg-blue-100 text-blue-800 border-blue-300 opacity-80"
                      : "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                  }`}
                >
                  <span>✋ 💵 Precio Unitario (Requerido)</span>
                  {colPrecio && <span className="text-[10px] bg-blue-200 px-1.5 py-0.5 rounded text-blue-900">En Columna {colPrecio}</span>}
                </div>

                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "BULTO")}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs border cursor-grab active:cursor-grabbing flex items-center gap-2 transition-all ${
                    colBulto
                      ? "bg-amber-100 text-amber-800 border-amber-300 opacity-80"
                      : "bg-amber-600 text-white border-amber-700 hover:bg-amber-700"
                  }`}
                >
                  <span>✋ 📦 Cantidad / Bulto (Opcional)</span>
                  {colBulto && <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">En Columna {colBulto}</span>}
                </div>
              </div>
            </div>

            {/* TABLA PREVISUALIZACIÓN */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm">Vista Previa del Archivo</h4>
                <p className="text-xs text-gray-500 mt-0.5">Soltá las fichas en el recuadro punteado de la columna correspondiente.</p>
              </div>

              {filasRaw.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Selecciona o arrastra un archivo .xlsx o .xls arriba para cargar las celdas y mapear por arrastre.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {letrasColumnas.map((letra) => {
                          const esDesc = colDescripcion === letra;
                          const esPrecio = colPrecio === letra;
                          const esBulto = colBulto === letra;

                          return (
                            <th
                              key={letra}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fieldType = e.dataTransfer.getData("fieldType");
                                if (fieldType === "DESCRIPCION") setColDescripcion(letra);
                                if (fieldType === "PRECIO") setColPrecio(letra);
                                if (fieldType === "BULTO") setColBulto(letra);
                              }}
                              className={`p-3 transition-all min-w-200px ${
                                esDesc ? "bg-emerald-50 border-b-2 border-emerald-500" :
                                esPrecio ? "bg-blue-50 border-b-2 border-blue-500" :
                                esBulto ? "bg-amber-50 border-b-2 border-amber-500" : "bg-gray-50"
                              }`}
                            >
                              <div className="text-xs font-bold text-gray-700 uppercase mb-2 text-center">
                                COLUMNA {letra}
                              </div>

                              <div className="min-h-44px flex items-center justify-center">
                                {esDesc && (
                                  <div className="w-full bg-emerald-600 text-white text-xs font-bold py-2 px-2.5 rounded-lg flex items-center justify-between shadow-xs">
                                    <span>📌 Descripción</span>
                                    <button onClick={() => setColDescripcion("")} className="hover:bg-emerald-700 rounded px-1.5 text-white cursor-pointer">✕</button>
                                  </div>
                                )}
                                {esPrecio && (
                                  <div className="w-full bg-blue-600 text-white text-xs font-bold py-2 px-2.5 rounded-lg flex items-center justify-between shadow-xs">
                                    <span>💵 Precio Unit.</span>
                                    <button onClick={() => setColPrecio("")} className="hover:bg-blue-700 rounded px-1.5 text-white cursor-pointer">✕</button>
                                  </div>
                                )}
                                {esBulto && (
                                  <div className="w-full bg-amber-600 text-white text-xs font-bold py-2 px-2.5 rounded-lg flex items-center justify-between shadow-xs">
                                    <span>📦 Bulto</span>
                                    <button onClick={() => setColBulto("")} className="hover:bg-amber-700 rounded px-1.5 text-white cursor-pointer">✕</button>
                                  </div>
                                )}

                                {!esDesc && !esPrecio && !esBulto && (
                                  <div className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-[11px] text-gray-400 font-medium text-center hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer">
                                    Soltar campo aquí
                                  </div>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filasRaw.slice(0, 6).map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                          {letrasColumnas.map((letra, colIdx) => {
                            const valorRaw = row[colIdx];
                            const esNulo = valorRaw === null || valorRaw === undefined || valorRaw === "null" || String(valorRaw).trim() === "";

                            const esDesc = colDescripcion === letra;
                            const esPrecio = colPrecio === letra;
                            const esBulto = colBulto === letra;

                            return (
                              <td
                                key={colIdx}
                                className={`p-3 font-medium ${
                                  esNulo ? "text-gray-400 font-normal" : "text-gray-800"
                                } ${
                                  esDesc ? "bg-emerald-50/40 font-semibold" :
                                  esPrecio ? "bg-blue-50/40 font-bold text-blue-950" :
                                  esBulto ? "bg-amber-50/40" : ""
                                }`}
                              >
                                {esNulo ? "—" : String(valorRaw)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">ℹ️ Podés arrastrar fichas entre columnas o tocar el botón ✕ para quitar una asignación.</p>
              <button
                onClick={handleGuardarYProcesar}
                disabled={guardandoMapeo || !archivo || !colDescripcion || !colPrecio}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer"
              >
                {guardandoMapeo ? "Procesando Lista..." : "Guardar Parámetros y Procesar Lista →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}