import { Router } from 'express';
import { ComparadorController } from '../controllers/comparador.controller';

const router = Router();

router.get('/', ComparadorController.buscar);
router.post('/equivalencia', ComparadorController.confirmarEquivalencia); // POST /api/comparador/equivalencia
router.get('/pendientes', ComparadorController.listarPendientes); // GET /api/comparador/pendientes
export default router;