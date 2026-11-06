import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';

const router = Router();

router.get('/stats', async (_req, res) => {
    try {
        const stats = await DashboardService.obtenerMetricasGestion();
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener métricas del dashboard:', error);
        res.status(500).json({ error: 'Error al consultar indicadores de gestión' });
    }
});

export default router;