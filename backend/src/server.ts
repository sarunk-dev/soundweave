import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import generateRouter from './routes/generate';
import statusRouter from './routes/status';
import refineRouter from './routes/refine';
import exportRouter from './routes/export';
import scenesRouter from './routes/scenes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/generate', generateRouter);
app.use('/api/status',   statusRouter);
app.use('/api/refine',   refineRouter);
app.use('/api/export',   exportRouter);
app.use('/api/scenes',   scenesRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'soundweave-backend', ts: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] SoundWeave backend running on port ${PORT}`);
});

export default app;
