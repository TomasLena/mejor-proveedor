import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizarTexto(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();
    }

    function extraerEmpaque(str: string): string | null {
    const match = str.match(/(?:x\d+|\d+(?:\s?x\s?\d+)?|\d+(?:g|gr|ml|cc|cm|mm))/i);
    return match ? match[0].replace(/\s/g, '').toLowerCase() : null;
    }

    function calcularSimilitudLevenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
        } else {
            matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Sustitución
            matrix[i][j - 1] + 1,     // Inserción
            matrix[i - 1][j] + 1      // Eliminación
            );
        }
        }
    }
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    const distancia = matrix[b.length][a.length];
    return ((maxLen - distancia) / maxLen) * 100;
    }

    export class ComparadorService {
    static async buscarYComparar(query: string) {
        if (!query || query.trim().length === 0) return [];

        const queryNormalizada = normalizarTexto(query);
        const empaqueQuery = extraerEmpaque(query);
        const palabrasClave = queryNormalizada.split(/\s+/).filter((t) => t.length > 1);

        if (palabrasClave.length === 0) return [];

        const productosBD = await prisma.producto.findMany({
        where: {
            OR: palabrasClave.map((palabra) => ({
            descripcion: { contains: palabra, mode: 'insensitive' },
            })),
        },
        include: {
            listaPrecio: { include: { proveedor: true } },
        },
        });

        const ahora = new Date();

        const productosEvaluados = productosBD
        .map((p) => {
            const descripcionNormalizada = normalizarTexto(p.descripcion);
            const empaqueProducto = extraerEmpaque(p.descripcion);

            let porcentajeSimilitud = calcularSimilitudLevenshtein(queryNormalizada, descripcionNormalizada);
            const regexMatchOk = empaqueQuery === empaqueProducto;

            // RN03
            if (empaqueQuery && empaqueProducto && !regexMatchOk && porcentajeSimilitud >= 85) {
            porcentajeSimilitud = 84;
            }

            const fechaCarga = new Date(p.listaPrecio.fechaCarga);
            const diasAntiguedad = Math.floor((ahora.getTime() - fechaCarga.getTime()) / (1000 * 60 * 60 * 24));

            let semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
            if (diasAntiguedad > 60) semaforo = 'ROJO';
            else if (diasAntiguedad > 30) semaforo = 'AMARILLO';

            return {
            id: p.id,
            descripcion: p.descripcion,
            precio: p.precio,
            bulto: p.bulto,
            fechaCarga: p.listaPrecio.fechaCarga,
            diasAntiguedad,
            semaforo,
            proveedor: {
                id: p.listaPrecio.proveedor.id,
                nombre: p.listaPrecio.proveedor.nombre,
            },
            similitud: Math.round(porcentajeSimilitud),
            regexMatchOk,
            };
        })
        .filter((p) => p.similitud >= 50); // RN04: Descarta <50%

        return productosEvaluados;
    }

    static async obtenerPendientes() {
        const equivalencias = await prisma.equivalencia.findMany();
        const descripcionesHomologadas = new Set(equivalencias.map((e) => e.descripcionProveedor));

        const productosBD = await prisma.producto.findMany({
        include: {
            listaPrecio: {
            include: { proveedor: true },
            },
        },
        take: 50,
        });

        const pendientes = productosBD
        .filter((p) => !descripcionesHomologadas.has(p.descripcion))
        .map((p) => ({
            id: p.id,
            descripcionProveedor: p.descripcion,
            codigoProveedor: p.id.substring(0, 8).toUpperCase(),
            proveedorNombre: p.listaPrecio.proveedor.nombre,
            descripcionMaster: p.descripcion,
            skuMaster: `SKU-${p.id.substring(0, 4).toUpperCase()}`,
            rubro: 'General',
            similitud: 78,
            regexMatchOk: true,
        }));

        return pendientes;
    }
}