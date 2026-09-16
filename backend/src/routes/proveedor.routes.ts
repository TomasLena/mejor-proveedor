import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', ProveedorController.listar);
router.post('/', ProveedorController.crear);
router.post('/:id/mapeo', ProveedorController.guardarMapeo);

router.post('/:id/cargar-lista', upload.single('archivo'), ProveedorController.cargarListaExcel);

export default router;