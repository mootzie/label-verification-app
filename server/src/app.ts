import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import verifyRouter from './routes/verify';
import batchRouter from './routes/batch';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/verify', verifyRouter);
app.use('/api/batch', batchRouter);

app.use(errorHandler);

export default app;
