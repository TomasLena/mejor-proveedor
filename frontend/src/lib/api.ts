const API_URL = 'http://localhost:4000/api';

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