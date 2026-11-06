import { Router } from 'express';
import { PedidosController } from '../controllers/pedidos.controller';

const router = Router();

router.post('/', PedidosController.crearPedido);
router.get('/', PedidosController.obtenerPedidos);

export default router;