const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Mapeo {
    id?: string;
    filaInicioData: number;
    colDescripcion: string;
    colPrecio: string;
    colBulto?: string;
}

export interface Proveedor {
    id: string;
    nombre: string;
    contactoNombre?: string;
    email?: string;
    telefono?: string;
    condicionesComerciales?: string;
    mapeo?: Mapeo | null;
}

export interface ProductoExtraido {
    descripcion: string;
    precio: number;
    bulto?: number | null;
}

export interface RespuestaExcel {
    proveedor: string;
    totalLeidos: number;
    productos: ProductoExtraido[];
}

export async function getProveedores(): Promise<Proveedor[]> {
    const res = await fetch(`${API_URL}/proveedores`);
    if (!res.ok) throw new Error('Error al obtener proveedores');
    return res.json();
}

export async function crearProveedor(data: Partial<Proveedor>): Promise<Proveedor> {
    const res = await fetch(`${API_URL}/proveedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear proveedor');
    return res.json();
}

export async function guardarMapeo(proveedorId: string, data: Mapeo): Promise<Mapeo> {
    const res = await fetch(`${API_URL}/proveedores/${proveedorId}/mapeo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al guardar el mapeo');
    return res.json();
}

export async function cargarListaExcel(proveedorId: string, archivo: File): Promise<RespuestaExcel> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const res = await fetch(`${API_URL}/proveedores/${proveedorId}/cargar-lista`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar el archivo Excel');
    }

    

    return res.json();
}


    export async function guardarListaConfirmada(proveedorId: string, productos: any[]) {
        const res = await fetch(`${API_URL}/proveedores/${proveedorId}/guardar-lista`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al guardar la lista en la base de datos');
        }

        return res.json();
        }

    export async function buscarComparacion(query: string) {
        const res = await fetch(`${API_URL}/comparar?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
            throw new Error('Error al realizar la búsqueda de comparación');
        }
        return res.json();
        }

        export async function eliminarProveedor(id: string) {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Error al eliminar el proveedor');
    }
    return res.json();
}