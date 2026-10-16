import { Request, Response } from 'express';
import { ComparadorService } from '../services/comparador.service';

export class ComparadorController {
    static async buscar(req: Request, res: Response) {
        try {
        const q = req.query.q as string;
        if (!q) {
            return res.json([]);
        }
        const resultados = await ComparadorService.buscarYComparar(q);
        return res.json(resultados);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }
}