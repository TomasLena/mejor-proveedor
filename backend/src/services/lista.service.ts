import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductoDTO {
    descripcion: string;
    precio: number;
    bulto?: number | null;
}

export class ListaService {
    static async guardarLista(proveedorId: string, productos: ProductoDTO[]) {
        const nuevaLista = await prisma.listaPrecio.create({
        data: {
            proveedorId,
            productos: {
            createMany: {
                data: productos.map((p) => ({
                descripcion: p.descripcion,
                precio: p.precio,
                bulto: p.bulto ?? null,
                })),
            },
            },
        },
        include: {
            _count: {
            select: { productos: true },
            },
        },
        });

        return nuevaLista;
    }
}