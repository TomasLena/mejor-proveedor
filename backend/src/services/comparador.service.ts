import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//  Normalización de texto 
function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

//Algoritmo de Coincidencia de Tokens para filtrar falsos positivos
function calcularSimilitud(busqueda: string, objetivo: string): number {
    const tokensBusqueda = normalizarTexto(busqueda).split(/\s+/).filter((t) => t.length > 1);
    const textObjetivoNorm = normalizarTexto(objetivo);

    if (tokensBusqueda.length === 0) return 0;

    let coincidenciaPonderada = 0;
    for (const token of tokensBusqueda) {
        if (textObjetivoNorm.includes(token)) {
        coincidenciaPonderada += 1;
        }
    }

    return (coincidenciaPonderada / tokensBusqueda.length) * 100;
    }

    export class ComparadorService {
    static async buscarYComparar(query: string) {
        if (!query || query.trim().length === 0) {
        return [];
        }

        const palabrasClave = normalizarTexto(query).split(/\s+/).filter((t) => t.length > 1);

        if (palabrasClave.length === 0) {
        return [];
        }

        //PostgreSQL filtrando productos por palabras clave
        const productosBD = await prisma.producto.findMany({
        where: {
            OR: palabrasClave.map((palabra) => ({
            descripcion: {
                contains: palabra,
                mode: 'insensitive',
            },
            })),
        },
        include: {
            listaPrecio: {
            include: {
                proveedor: true,
            },
            },
        },
        orderBy: {
            precio: 'asc',
        },
        });

        const ahora = new Date();

        //cálculo del Semáforo de Vigencia
        const productosEvaluados = productosBD
        .map((p) => {
            const porcentajeSimilitud = calcularSimilitud(query, p.descripcion);

            //antigüedad de la lista en días
            const fechaCarga = new Date(p.listaPrecio.fechaCarga);
            const diasAntiguedad = Math.floor((ahora.getTime() - fechaCarga.getTime()) / (1000 * 60 * 60 * 24));

            let semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
            if (diasAntiguedad > 60) {
            semaforo = 'ROJO';
            } else if (diasAntiguedad > 30) {
            semaforo = 'AMARILLO';
            }

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
            };
        })
        .filter((p) => p.similitud >= 40)
        
        .sort((a, b) => a.precio - b.precio);

        return productosEvaluados;
    }
}