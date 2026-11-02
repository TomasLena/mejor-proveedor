import { Router } from 'express';
import { ProductoController } from './../controllers/producto.controller';

const router = Router();

router.get('/', ProductoController.listarTodos);

export default router;