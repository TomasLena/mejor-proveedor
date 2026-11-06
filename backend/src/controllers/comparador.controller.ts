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

static async listarPendientes(req: Request, res: Response) {
        try {
        const pendientes = await ComparadorService.obtenerPendientes();
        return res.json(pendientes);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }

    static async confirmarEquivalencia(req: Request, res: Response) {
        try {
        const { descripcionProveedor, descripcionMaster } = req.body;

        if (!descripcionProveedor || !descripcionMaster) {
            return res.status(400).json({ error: 'Faltan descripciones para crear la equivalencia' });
        }

        const equivalencia = await ComparadorService.confirmarMatch(descripcionProveedor, descripcionMaster);
        return res.status(201).json(equivalencia);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }

    static async descartarMatch(req: Request, res: Response) {
        try {
        const { descripcionProveedor } = req.body;

        if (!descripcionProveedor) {
            return res.status(400).json({ error: 'La descripción del proveedor es obligatoria' });
        }

        const resultado = await ComparadorService.descartarMatch(descripcionProveedor);
        return res.status(200).json({ message: 'Match descartado y registrado como producto único', resultado });
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }
    }