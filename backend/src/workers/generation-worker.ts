import { Queue, Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { query } from '../db/client';

dotenv.config();

// BullMQ accepts a plain connection options object — avoids ioredis version conflicts
const connection = {
  host: (() => {
    try { return new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname; } catch { return 'localhost'; }
  })(),
  port: (() => {
    try { return Number(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379; } catch { return 6379; }
  })(),
  maxRetriesPerRequest: null as null,
};

// ── Queue (exported so routes can add jobs) ───────────────────────────────────
export const generationQueue = new Queue('generation', { connection });

// ── Worker ────────────────────────────────────────────────────────────────────
export const generationWorker = new Worker(
  'generation',
  async (job: Job) => {
    const { sceneId, jobId } = job.data;

    const updateJob = async (status: string, step?: string, progress?: object) => {
      await query(
        `UPDATE jobs SET status=$1, step=$2, progress=$3, started_at=COALESCE(started_at, NOW()), updated_at=NOW()
         WHERE id=$4`,
        [status, step ?? null, progress ? JSON.stringify(progress) : null, jobId]
      );
    };

    const failJob = async (message: string) => {
      await query(`UPDATE jobs SET status='failed', error_message=$1, completed_at=NOW() WHERE id=$2`, [message, jobId]);
      await query(`UPDATE scenes SET status='failed', error_message=$1, updated_at=NOW() WHERE id=$2`, [message, sceneId]);
    };

    try {
      await updateJob('processing', 'parsing', { current: 1, total: 4 });
      await query(`UPDATE scenes SET status='processing', updated_at=NOW() WHERE id=$1`, [sceneId]);

      if (job.name === 'generate') {
        await runGeneratePipeline(job.data, updateJob);
      } else if (job.name === 'refine') {
        await runRefinePipeline(job.data, updateJob);
      }

      await query(`UPDATE jobs SET status='complete', completed_at=NOW() WHERE id=$1`, [jobId]);
    } catch (err: any) {
      console.error(`[worker] Job ${jobId} failed:`, err.message);
      await failJob(err.message);
    }
  },
  { connection, concurrency: 2 }
);

// ── Pipeline stubs (wired to AI orchestration in Phase 4) ─────────────────────
async function runGeneratePipeline(
  data: any,
  updateJob: (status: string, step?: string, progress?: object) => Promise<void>
) {
  const { sceneId, script } = data;

  // Step 1: Call AI orchestration service
  updateJob('processing', 'parsing', { current: 1, total: 4 });
  const response = await callOrchestration('/orchestrate/generate', { sceneId, script });

  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.detail || 'Orchestration service failed');
  }

  const result = await response.json() as any;

  // Step 4: Mark scene complete
  await query(
    `UPDATE scenes SET status='complete', audio_url=$1, duration=$2, parsed_data=$3, updated_at=NOW() WHERE id=$4`,
    [result.audio_url, result.duration, JSON.stringify(result.parsed_data ?? {}), sceneId]
  );

  // Persist audio layers
  for (const layer of (result.layers ?? [])) {
    await query(
      `INSERT INTO audio_layers (scene_id, layer_type, character_name, description, file_url, duration, volume, spatial_position, loop, start_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        sceneId,
        layer.layer_type,
        layer.character_name ?? null,
        layer.description ?? null,
        layer.file_url,
        layer.duration ?? null,
        layer.volume ?? 0,
        JSON.stringify(layer.spatial_position ?? {}),
        layer.loop ?? false,
        layer.start_time ?? 0,
      ]
    );
  }
}

async function runRefinePipeline(
  data: any,
  updateJob: (status: string, step?: string, progress?: object) => Promise<void>
) {
  const { sceneId, refinementId, command } = data;

  updateJob('processing', 'refining', { current: 1, total: 2 });
  const response = await callOrchestration('/orchestrate/refine', { sceneId, refinementId, command });

  if (!response.ok) {
    const err = await response.json() as any;
    throw new Error(err.detail || 'Orchestration refine failed');
  }

  const result = await response.json() as any;

  await query(
    `UPDATE scenes SET audio_url=$1, updated_at=NOW() WHERE id=$2`,
    [result.audio_url, sceneId]
  );

  await query(
    `UPDATE refinements SET interpreted_changes=$1, applied=TRUE WHERE id=$2`,
    [JSON.stringify(result.changes ?? {}), refinementId]
  );
}

function callOrchestration(path: string, body: object) {
  const base = process.env.ORCHESTRATION_URL || 'http://localhost:8000';
  return require('node-fetch')(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

generationWorker.on('completed', (job) => console.log(`[worker] Job ${job.id} completed`));
generationWorker.on('failed',    (job, err) => console.error(`[worker] Job ${job?.id} failed:`, err.message));
