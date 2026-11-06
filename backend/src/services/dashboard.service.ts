import { PrismaClient } from '@prisma/client';
import { ComparadorService } from './comparador.service';

const prisma = new PrismaClient();

export class DashboardService {
  static async obtenerMetricasGestion() {
    const [
      totalArticulos,
      proveedoresSinMapeo,
      equivalencias,
      detallesPedidos,
      listaPendientes,
    ] = await Promise.all([
      // RF06.4 - Conteo Global de Artículos Únicos
      prisma.producto.count(),

      // Proveedores que aún no configuraron columnas de mapeo
      prisma.proveedor.count({
        where: { mapeo: null },
      }),

      // RF06.3 - Datos de Memoria de Homologación
      prisma.equivalencia.findMany({
        select: {
          descripcionMaster: true,
          descripcionProveedor: true,
        },
      }),

      // RF06.1 - Compras para Share of Wallet
      prisma.detallePedido.findMany({
        select: {
          precioUnit: true,
          cantidad: true,
          subtotal: true,
          producto: {
            select: {
              listaPrecio: {
                select: {
                  proveedor: {
                    select: { nombre: true },
                  },
                },
              },
            },
          },
        },
      }),

      // RF06.2 - Obtención en tiempo real de los pendientes calculados por el motor
      ComparadorService.obtenerPendientes(),
    ]);

    // --- RF06.1: Share of Wallet ---
    const mapaWallet: { [proveedor: string]: number } = {};
    let totalInvertidoGlobal = 0;

    detallesPedidos.forEach((item) => {
      const montoItem = item.subtotal ?? (item.precioUnit * item.cantidad);
      const provNombre = item.producto?.listaPrecio?.proveedor?.nombre || 'Proveedor Desconocido';
      mapaWallet[provNombre] = (mapaWallet[provNombre] || 0) + montoItem;
      totalInvertidoGlobal += montoItem;
    });

    const shareOfWallet = Object.entries(mapaWallet).map(([proveedor, monto]) => ({
      proveedor,
      monto,
      porcentaje: totalInvertidoGlobal > 0 
        ? Number(((monto / totalInvertidoGlobal) * 100).toFixed(1)) 
        : 0,
    }));

    // --- RF06.2: Control de Bandeja de Pendientes ---
    // Muestra la cantidad exacta devuelta por la consola de homologación
    const totalPendientes = listaPendientes.length;

    // --- RF06.3: Rendimiento de Homologación ---
    const totalEquivalencias = equivalencias.length;

    // Coincidencias nominales directas
    const autoHomologados = equivalencias.filter(
      (e) => e.descripcionMaster.trim().toLowerCase() === e.descripcionProveedor.trim().toLowerCase()
    ).length;

    // Intervenciones humanas (tanto confirmaciones manuales como descartes guardados)
    const manuales = totalEquivalencias - autoHomologados;

    const porcentajeAuto = totalEquivalencias > 0 
      ? Number(((autoHomologados / totalEquivalencias) * 100).toFixed(1)) 
      : 100;
      
    const porcentajeManual = totalEquivalencias > 0 
      ? Number(((manuales / totalEquivalencias) * 100).toFixed(1)) 
      : 0;

    return {
      rf06_1_shareOfWallet: {
        totalInvertidoGlobal,
        distribucion: shareOfWallet,
      },
      rf06_2_bandejaPendientes: {
        totalPendientes,
        proveedoresSinMapeo,
      },
      rf06_3_rendimientoHomologacion: {
        totalEquivalencias,
        autoHomologados,
        manuales,
        porcentajeAuto,
        porcentajeManual,
        tasaAprobacion: 100,
      },
      rf06_4_conteoGlobal: {
        totalArticulos,
      },
    };
  }
}