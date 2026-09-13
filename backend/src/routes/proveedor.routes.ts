import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller';

const router = Router();

router.get('/', ProveedorController.listar);
router.post('/', ProveedorController.crear);
router.post('/:id/mapeo', ProveedorController.guardarMapeo);

export default router;