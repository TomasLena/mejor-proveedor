import { PrismaClient } from '@prisma/client';
import { obtenerCantidadUnidades, calcularPrecioUnitario } from '../utils/bulto.util';

const prisma = new PrismaClient();

function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function claveExacta(str: string): string {
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

function limpiarEspacios(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
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
    // 1. Procesar auto-matches (>= 85%) y obtener los IDs que siguen pendientes de revisión manual
    const pendientes = await ComparadorService.obtenerPendientes();
    const idsPendientes = new Set(pendientes.map((p) => p.id));

    if (!query || query.trim().length === 0) return [];

    const queryNormalizada = normalizarTexto(query);
    const empaqueQuery = extraerEmpaque(query);
    const palabrasClave = queryNormalizada.split(/\s+/).filter((t) => t.length > 1);

    if (palabrasClave.length === 0) return [];

    // 2. Cargar equivalencias ordenadas por fecha (la decisión más reciente pisa a las anteriores)
    const equivalencias = await prisma.equivalencia.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const mapaEquivalencias = new Map<string, string>();
    equivalencias.forEach((eq) => {
      mapaEquivalencias.set(claveExacta(eq.descripcionProveedor), limpiarEspacios(eq.descripcionMaster));
    });

    const descripcionesHomologadasCoincidentes = equivalencias
      .filter((eq) =>
        palabrasClave.some((palabra) => normalizarTexto(eq.descripcionMaster).includes(palabra))
      )
      .map((eq) => eq.descripcionProveedor);

    const productosBD = await prisma.producto.findMany({
      where: {
        OR: [
          ...palabrasClave.map((palabra) => ({
            descripcion: { contains: palabra, mode: 'insensitive' as const },
          })),
          { descripcion: { in: descripcionesHomologadasCoincidentes, mode: 'insensitive' as const } },
        ],
      },
      include: {
        listaPrecio: { include: { proveedor: true } },
      },
    });

    const ahora = new Date();

    const productosEvaluados = productosBD
      // Ocultar del comparador todo producto que esté esperando decisión en Homologación Manual
      .filter((p) => !idsPendientes.has(p.id))
      .map((p) => {
        const descripcionCanonica =
          mapaEquivalencias.get(claveExacta(p.descripcion)) || limpiarEspacios(p.descripcion);

        const descripcionNormalizada = normalizarTexto(descripcionCanonica);
        const empaqueProducto = extraerEmpaque(descripcionCanonica);

        let porcentajeSimilitud = calcularSimilitudLevenshtein(queryNormalizada, descripcionNormalizada);
        const regexMatchOk = empaqueQuery === empaqueProducto;

        if (empaqueQuery && empaqueProducto && !regexMatchOk && porcentajeSimilitud >= 85) {
          porcentajeSimilitud = 84;
        }

        const fechaCarga = new Date(p.listaPrecio.fechaCarga);
        const diasAntiguedad = Math.floor((ahora.getTime() - fechaCarga.getTime()) / (1000 * 60 * 60 * 24));

        let semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
        if (diasAntiguedad > 60) semaforo = 'ROJO';
        else if (diasAntiguedad > 30) semaforo = 'AMARILLO';

        const cantidadBulto = obtenerCantidadUnidades(p.descripcion, p.bulto);
        const precioUnitario = calcularPrecioUnitario(p.precio, cantidadBulto);

        return {
          id: p.id,
          descripcion: descripcionCanonica,
          descripcionOriginal: p.descripcion,
          precio: p.precio,
          bulto: cantidadBulto,
          precioUnitario,
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
      .filter((p) => p.similitud >= 50);

    return productosEvaluados;
  }

  static async obtenerPendientes() {
    const equivalencias = await prisma.equivalencia.findMany();
    const descripcionesResueltas = new Set(
      equivalencias.map((e) => claveExacta(e.descripcionProveedor))
    );

    const productosBD = await prisma.producto.findMany({
      include: {
        listaPrecio: {
          include: { proveedor: true },
        },
      },
    });

    if (productosBD.length === 0) return [];

    const proveedoresIds = Array.from(new Set(productosBD.map((p) => p.listaPrecio.proveedor.id)));
    if (proveedoresIds.length < 2) return [];

    const proveedorMaestroId = proveedoresIds[0];
    const productosMaestros = productosBD.filter((p) => p.listaPrecio.proveedor.id === proveedorMaestroId);

    const productosSecundarios = productosBD.filter(
      (p) =>
        p.listaPrecio.proveedor.id !== proveedorMaestroId &&
        !descripcionesResueltas.has(claveExacta(p.descripcion))
    );

    const pendientes: any[] = [];

    for (const prodSec of productosSecundarios) {
      const descSecNorm = normalizarTexto(prodSec.descripcion);
      const empaqueSec = extraerEmpaque(prodSec.descripcion);

      let mejorCandidato: typeof productosMaestros[0] | null = null;
      let mejorSimilitud = 0;

      for (const prodMaster of productosMaestros) {
        const descMasterNorm = normalizarTexto(prodMaster.descripcion);
        const empaqueMaster = extraerEmpaque(prodMaster.descripcion);

        if (empaqueSec && empaqueMaster && empaqueSec !== empaqueMaster) {
          continue;
        }

        const sim = calcularSimilitudLevenshtein(descSecNorm, descMasterNorm);

        if (sim > mejorSimilitud) {
          mejorSimilitud = sim;
          mejorCandidato = prodMaster;
        }
      }

      if (mejorCandidato) {
        if (mejorSimilitud >= 85) {
          await prisma.equivalencia.upsert({
            where: { descripcionProveedor: limpiarEspacios(prodSec.descripcion) },
            update: { descripcionMaster: limpiarEspacios(mejorCandidato.descripcion) },
            create: {
              descripcionProveedor: limpiarEspacios(prodSec.descripcion),
              descripcionMaster: limpiarEspacios(mejorCandidato.descripcion),
            },
          });
        } else if (mejorSimilitud >= 50 && mejorSimilitud <= 84) {
          pendientes.push({
            id: prodSec.id,
            descripcionProveedor: limpiarEspacios(prodSec.descripcion),
            codigoProveedor: prodSec.id.substring(0, 8).toUpperCase(),
            proveedorNombre: prodSec.listaPrecio.proveedor.nombre,
            descripcionMaster: limpiarEspacios(mejorCandidato.descripcion),
            skuMaster: `SKU-${mejorCandidato.id.substring(0, 4).toUpperCase()}`,
            rubro: 'General',
            similitud: Math.round(mejorSimilitud),
            regexMatchOk: true,
          });
        }
      }
    }

    return pendientes;
  }

  static async confirmarMatch(descripcionProveedor: string, descripcionMaster: string) {
    const provLimpio = limpiarEspacios(descripcionProveedor);
    const masterLimpio = limpiarEspacios(descripcionMaster);

    return await prisma.equivalencia.upsert({
      where: { descripcionProveedor: provLimpio },
      update: { descripcionMaster: masterLimpio },
      create: {
        descripcionProveedor: provLimpio,
        descripcionMaster: masterLimpio,
      },
    });
  }

  static async descartarMatch(descripcionProveedor: string) {
    const provLimpio = limpiarEspacios(descripcionProveedor);

    return await prisma.equivalencia.upsert({
      where: { descripcionProveedor: provLimpio },
      update: { descripcionMaster: provLimpio },
      create: {
        descripcionProveedor: provLimpio,
        descripcionMaster: provLimpio,
      },
    });
  }
}