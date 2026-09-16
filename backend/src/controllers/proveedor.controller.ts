import { Request, Response } from 'express';
import { ProveedorService } from '../services/proveedor.service';
import { PrismaClient } from '@prisma/client';
import { ExcelService } from '../services/excel.service';

const prisma = new PrismaClient();

    export class ProveedorController {
    static async listar(req: Request, res: Response) {
        try {
        const proveedores = await ProveedorService.obtenerTodos();
        res.json(proveedores);
        } catch (error) {
        res.status(500).json({ error: (error as Error).message });
        }
    }

    static async crear(req: Request, res: Response) {
        try {
        const nuevoProveedor = await ProveedorService.crearProveedor(req.body);
        res.status(201).json(nuevoProveedor);
        } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        }
    }

    static async guardarMapeo(req: Request, res: Response) {
        try {
        const { id } = req.params;
        const mapeo = await ProveedorService.guardarMapeo(id as string, req.body);
        res.json(mapeo);
        } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        }
    }

    static async cargarListaExcel(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Debe adjuntar un archivo de Excel (.xlsx o .xls)' });
        }

        // Buscar el proveedor y su mapeo
        const proveedor = await prisma.proveedor.findUnique({
            where: { id: id as string },
            include: { mapeo: true },
        });

        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        if (!proveedor.mapeo) {
            return res.status(400).json({
            error: 'El proveedor no tiene configurado un mapeo de columnas. Por favor configúrelo antes de subir la lista.',
            });
        }

        const productos = ExcelService.procesarExcel(req.file.buffer, proveedor.mapeo);

        return res.json({
            proveedor: proveedor.nombre,
            totalLeidos: productos.length,
            productos,
        });
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }


}