import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { generationQueue } from '../workers/generation-worker';

const router = Router();

// POST /api/generate
router.post('/', async (req: Request, res: Response) => {
  const { script, options = {} } = req.body;

  if (!script || typeof script !== 'string' || script.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid script: must be a non-empty string (min 10 characters).' });
  }

  const sceneId = uuidv4();
  const jobId   = uuidv4();

  // Persist scene skeleton
  await query(
    `INSERT INTO scenes (id, script, status) VALUES ($1, $2, 'queued')`,
    [sceneId, script.trim()]
  );

  // Persist job record
  await query(
    `INSERT INTO jobs (id, scene_id, job_type, status, input_data) VALUES ($1, $2, 'generate', 'queued', $3)`,
    [jobId, sceneId, JSON.stringify({ script: script.trim(), options })]
  );

  // Enqueue async work
  await generationQueue.add('generate', { sceneId, jobId, script: script.trim(), options }, { jobId });

  return res.status(202).json({
    job_id: jobId,
    scene_id: sceneId,
    status: 'queued',
    estimated_time: 90,
  });
});

export default router;
