import { Router } from 'express';
import { ComparadorController } from '../controllers/comparador.controller';

const router = Router();

router.get('/', ComparadorController.buscar);

export default router;