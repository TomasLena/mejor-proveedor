import { Request, Response } from 'express';
import { ProveedorService } from '../services/proveedor.service';

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
}