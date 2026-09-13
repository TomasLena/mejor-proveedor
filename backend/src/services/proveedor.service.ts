import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CrearProveedorDTO {
    nombre: string;
    contactoNombre?: string;
    email?: string;
    telefono?: string;
    condicionesComerciales?: string;
    }

    export interface ConfigurarMapeoDTO {
    filaInicioData: number;
    colDescripcion: string;
    colPrecio: string;
    colBulto?: string;
    }

    export class ProveedorService {
    static async obtenerTodos() {
        return prisma.proveedor.findMany({
        include: { mapeo: true },
        orderBy: { nombre: 'asc' },
        });
    }

    static async crearProveedor(data: CrearProveedorDTO) {
        return prisma.proveedor.create({ data });
    }

    static async guardarMapeo(proveedorId: string, data: ConfigurarMapeoDTO) {
        return prisma.mapeoProveedor.upsert({
        where: { proveedorId },
        update: data,
        create: { ...data, proveedorId },
        });
    }
}