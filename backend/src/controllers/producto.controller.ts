import { Request, Response } from 'express';
import { ListaService } from '../services/lista.service';

export class ProductoController {
    static async listarTodos(req: Request, res: Response) {
        try {
        const productos = await ListaService.obtenerTodosLosProductos();
        return res.json(productos);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }
}