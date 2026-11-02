import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PedidosController {
    static async crearPedido(req: Request, res: Response) {
        try {
        const { items, total } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: "El pedido está vacío" });
        }

        const nuevoPedido = await prisma.pedido.create({
            data: {
            total,
            detalles: {
                create: items.map((item: any) => ({
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnit: item.precio,
                subtotal: item.cantidad * item.precio
                }))
            }
            },
            include: {
            detalles: true
            }
        });

        return res.status(201).json(nuevoPedido);
        } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
        }
    }
}