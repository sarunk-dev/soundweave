import { Router, Request, Response } from 'express';
import { query } from '../db/client';

const router = Router();

// GET /api/scenes/:sceneId
router.get('/:sceneId', async (req: Request, res: Response) => {
  const { sceneId } = req.params;

  const scenes = await query(
    `SELECT id, script, parsed_data, status, audio_url, duration, error_message, created_at, updated_at
     FROM scenes WHERE id = $1`,
    [sceneId]
  );

  if (!scenes.length) {
    return res.status(404).json({ error: 'Scene not found.' });
  }

  const scene = scenes[0] as any;

  const layers = await query(
    `SELECT id, layer_type, character_name, description, file_url, duration, volume, spatial_position, loop, start_time
     FROM audio_layers WHERE scene_id = $1 ORDER BY start_time ASC`,
    [sceneId]
  );

  return res.json({ ...scene, layers });
});

export default router;
