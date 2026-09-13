import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import proveedorRoutes from './routes/proveedor.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Endpoint del healthcheck y conexión SQL
app.get('/healthcheck', async (req, res) => {
try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
        status: 'ok',
        message: 'Servidor Backend operativo',
        database: 'Conectado exitosamente a PostgreSQL',
        timestamp: new Date()
    });
} catch (error) {
    res.status(500).json({
        status: 'error',
        message: 'Error al conectar con la base de datos',
        error: (error as Error).message
    });
    }
});

app.use('/api/proveedores', proveedorRoutes); // proveedores y mapeo

app.listen(PORT, () => {
console.log(`🚀 Backend ejecutándose en http://localhost:${PORT}`);
});