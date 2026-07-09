import { Router, Request, Response } from 'express';
import { query } from '../db/client';
import fetch from 'node-fetch';

const router = Router();

// GET /api/export/:sceneId?format=mp3
router.get('/:sceneId', async (req: Request, res: Response) => {
  const { sceneId } = req.params;
  const format = (req.query.format as string) || 'mp3';

  if (!['mp3', 'wav'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Use mp3 or wav.' });
  }

  const scenes = await query(
    `SELECT audio_url, status FROM scenes WHERE id = $1`,
    [sceneId]
  );

  if (!scenes.length) {
    return res.status(404).json({ error: 'Scene not found.' });
  }

  const scene = scenes[0] as any;

  if (scene.status !== 'complete' || !scene.audio_url) {
    return res.status(409).json({ error: 'Scene is not ready for export.' });
  }

  // Proxy the file from storage
  const fileRes = await fetch(scene.audio_url);
  if (!fileRes.ok) {
    return res.status(502).json({ error: 'Failed to retrieve audio file from storage.' });
  }

  const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="scene_${sceneId}.${format}"`);

  fileRes.body?.pipe(res);
});

export default router;
