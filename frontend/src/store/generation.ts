import { create } from "zustand";
import type { GenerationStep, JobStatus, Scene } from "@/lib/types";

interface GenerationState {
  // Generation flow
  jobId: string | null;
  sceneId: string | null;
  step: GenerationStep;
  elapsedSeconds: number;
  error: string | null;

  // Scene data
  currentScene: Scene | null;

  // Actions
  startGeneration: (jobId: string, sceneId: string) => void;
  updateProgress: (status: JobStatus) => void;
  setScene: (scene: Scene) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  jobId:          null,
  sceneId:        null,
  step:           "idle",
  elapsedSeconds: 0,
  error:          null,
  currentScene:   null,

  startGeneration: (jobId, sceneId) =>
    set({ jobId, sceneId, step: "parsing", error: null, elapsedSeconds: 0 }),

  updateProgress: (status) =>
    set((state) => {
      const stepMap: Record<string, GenerationStep> = {
        queued:     "parsing",
        processing: statusStepToGenerationStep(status.progress?.step),
        complete:   "complete",
        failed:     "failed",
      };

      return {
        step:           stepMap[status.status] || state.step,
        elapsedSeconds: status.elapsed_time ?? state.elapsedSeconds,
        error:          status.error ?? null,
        sceneId:        status.scene_id ?? state.sceneId,
      };
    }),

  setScene:  (scene)  => set({ currentScene: scene }),
  reset:     ()       => set({ jobId: null, sceneId: null, step: "idle", error: null, currentScene: null, elapsedSeconds: 0 }),
}));

function statusStepToGenerationStep(step?: string): GenerationStep {
  if (!step) return "parsing";
  if (step.includes("pars"))      return "parsing";
  if (step.includes("plan"))      return "planning";
  if (step.includes("gen") || step.includes("audio")) return "generating";
  if (step.includes("mix"))       return "mixing";
  return "parsing";
}
