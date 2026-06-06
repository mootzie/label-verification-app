import { Router } from 'express';

const router = Router();

router.post('/upload', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/:jobId/stream', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
