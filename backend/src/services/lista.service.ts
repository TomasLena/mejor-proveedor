import { PrismaClient } from '@prisma/client';
import { ComparadorService } from './comparador.service';

const prisma = new PrismaClient();

export interface ProductoDTO {
    descripcion: string;
    precio: number;
    bulto?: number | null;
    }

    export class ListaService {
    static async guardarLista(proveedorId: string, productos: ProductoDTO[]) {
        return await prisma.$transaction(async (tx) => {
        await tx.detallePedido.deleteMany({
            where: {
            producto: {
                listaPrecio: {
                proveedorId,
                },
            },
            },
        });

        await tx.listaPrecio.deleteMany({
            where: { proveedorId },
        });

        return await tx.listaPrecio.create({
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
        });
    }

    static async obtenerTodosLosProductos() {
        // 1. Obtener pendientes para excluirlos de la tabla comparativa
        const pendientes = await ComparadorService.obtenerPendientes();
        const idsPendientes = new Set(pendientes.map((p) => p.id));

        // 2. Cargar equivalencias confirmadas y descartadas
        const equivalencias = await prisma.equivalencia.findMany({
        orderBy: { createdAt: 'asc' },
        });
        const mapaEquivalencias = new Map<string, string>();
        equivalencias.forEach((eq) => {
        mapaEquivalencias.set(
            eq.descripcionProveedor.replace(/\s+/g, ' ').trim().toLowerCase(),
            eq.descripcionMaster.replace(/\s+/g, ' ').trim()
        );
        });

        const productos = await prisma.producto.findMany({
        include: {
            listaPrecio: {
            include: {
                proveedor: true,
            },
            },
        },
        orderBy: {
            descripcion: 'asc',
        },
        });

        return productos
        .filter((p) => !idsPendientes.has(p.id))
        .map((p) => {
            const clave = p.descripcion.replace(/\s+/g, ' ').trim().toLowerCase();
            const descripcionCanonica =
            mapaEquivalencias.get(clave) || p.descripcion.replace(/\s+/g, ' ').trim();

            return {
            id: p.id,
            descripcion: descripcionCanonica,
            precio: p.precio,
            bulto: p.bulto,
            fechaCarga: p.listaPrecio.fechaCarga,
            proveedor: {
                id: p.listaPrecio.proveedor.id,
                nombre: p.listaPrecio.proveedor.nombre,
            },
            };
        });
    }
    }