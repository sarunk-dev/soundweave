import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { generationQueue } from '../workers/generation-worker';

const router = Router();

// POST /api/refine/:sceneId
router.post('/:sceneId', async (req: Request, res: Response) => {
  const { sceneId } = req.params;
  const { command } = req.body;

  if (!command || typeof command !== 'string' || command.trim().length < 3) {
    return res.status(400).json({ error: 'Invalid command: must be a non-empty string.' });
  }

  // Verify scene exists and is complete
  const scenes = await query(`SELECT id, status FROM scenes WHERE id = $1`, [sceneId]);
  if (!scenes.length) {
    return res.status(404).json({ error: 'Scene not found.' });
  }
  const scene = scenes[0] as any;
  if (scene.status !== 'complete') {
    return res.status(409).json({ error: `Scene is not ready for refinement (status: ${scene.status}).` });
  }

  const jobId = uuidv4();
  const refinementId = uuidv4();

  // Store refinement intent
  await query(
    `INSERT INTO refinements (id, scene_id, command) VALUES ($1, $2, $3)`,
    [refinementId, sceneId, command.trim()]
  );

  // Persist job
  await query(
    `INSERT INTO jobs (id, scene_id, job_type, status, input_data) VALUES ($1, $2, 'refine', 'queued', $3)`,
    [jobId, sceneId, JSON.stringify({ command: command.trim(), refinementId })]
  );

  // Update scene status
  await query(`UPDATE scenes SET status = 'queued', updated_at = NOW() WHERE id = $1`, [sceneId]);

  // Enqueue
  await generationQueue.add(
    'refine',
    { sceneId, jobId, refinementId, command: command.trim() },
    { jobId }
  );

  return res.status(202).json({
    job_id: jobId,
    scene_id: sceneId,
    status: 'queued',
    refinement_id: refinementId,
  });
});

export default router;
