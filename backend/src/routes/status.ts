import { Router, Request, Response } from 'express';
import { query } from '../db/client';

const router = Router();

// GET /api/status/:jobId
router.get('/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const rows = await query(
    `SELECT id, scene_id, status, step, progress, error_message, started_at, completed_at, created_at
     FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const job = rows[0] as any;

  // If complete, attach audio_url from scene
  if (job.status === 'complete') {
    const scenes = await query(
      `SELECT audio_url, duration FROM scenes WHERE id = $1`,
      [job.scene_id]
    );
    const scene = scenes[0] as any;

    const layers = await query(
      `SELECT layer_type, character_name, description, file_url FROM audio_layers WHERE scene_id = $1`,
      [job.scene_id]
    );

    return res.json({
      job_id:    job.id,
      scene_id:  job.scene_id,
      status:    job.status,
      audio_url: scene?.audio_url,
      duration:  scene?.duration,
      layers,
    });
  }

  const elapsed = job.started_at
    ? Math.floor((Date.now() - new Date(job.started_at).getTime()) / 1000)
    : 0;

  return res.json({
    job_id:       job.id,
    status:       job.status,
    progress:     job.progress,
    elapsed_time: elapsed,
    error:        job.error_message ?? undefined,
  });
});

export default router;
