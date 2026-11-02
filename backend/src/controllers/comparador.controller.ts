import { Request, Response } from 'express';
import { ComparadorService } from '../services/comparador.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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



static async confirmarEquivalencia(req: Request, res: Response) {
    try {
        const { descripcionProveedor, descripcionMaster } = req.body;
        
        if (!descripcionProveedor || !descripcionMaster) {
            return res.status(400).json({ error: "Faltan descripciones para crear la equivalencia" });
        }

        const equivalencia = await prisma.equivalencia.create({
            data: {
            descripcionProveedor,
            descripcionMaster
            }
        });

        return res.status(201).json(equivalencia);
        } catch (error) {
        // Si el par ya existe, evito que rompa (revisar antes del 6)
        if ((error as any).code === 'P2002') {
            return res.status(409).json({ error: "Esta equivalencia ya fue registrada anteriormente." });
        }
        return res.status(500).json({ error: (error as Error).message });
        }
    }

    static async listarPendientes(req: Request, res: Response) {
    try {
        const pendientes = await ComparadorService.obtenerPendientes();
        return res.json(pendientes);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }

}