import type {
  GenerateResponse,
  JobStatus,
  RefineResponse,
  Scene,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    throw new Error(body?.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Generate ──────────────────────────────────────────────────────────────────
export async function generateScene(
  script: string,
  options: Record<string, unknown> = {}
): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify({ script, options }),
  });
}

// ── Poll status ───────────────────────────────────────────────────────────────
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/api/status/${jobId}`);
}

// ── Get scene ─────────────────────────────────────────────────────────────────
export async function getScene(sceneId: string): Promise<Scene> {
  return apiFetch<Scene>(`/api/scenes/${sceneId}`);
}

// ── Refine ────────────────────────────────────────────────────────────────────
export async function refineScene(
  sceneId: string,
  command: string
): Promise<RefineResponse> {
  return apiFetch<RefineResponse>(`/api/refine/${sceneId}`, {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

// ── Export URL ────────────────────────────────────────────────────────────────
export function getExportUrl(sceneId: string, format: "mp3" | "wav" = "mp3") {
  return `${BASE}/api/export/${sceneId}?format=${format}`;
}

// ── Poll until complete or failed ─────────────────────────────────────────────
export async function pollUntilDone(
  jobId: string,
  onProgress: (status: JobStatus) => void,
  intervalMs = 2000,
  timeoutMs = 5 * 60 * 1000
): Promise<JobStatus> {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const status = await getJobStatus(jobId);
        onProgress(status);

        if (status.status === "complete") return resolve(status);
        if (status.status === "failed")
          return reject(new Error(status.error || "Generation failed"));
        if (Date.now() > deadline)
          return reject(new Error("Generation timed out after 5 minutes"));

        setTimeout(tick, intervalMs);
      } catch (err) {
        reject(err);
      }
    };

    setTimeout(tick, intervalMs);
  });
}
