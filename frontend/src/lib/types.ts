// ── Shared types used across frontend ──────────────────────────────────────

export interface Scene {
  scene_id: string;
  script: string;
  parsed_data?: ParsedScript | null;
  status: "queued" | "processing" | "complete" | "failed";
  audio_url?: string | null;
  duration?: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  layers?: AudioLayer[];
}

export interface AudioLayer {
  id?: string;
  layer_type: "voice" | "ambience" | "effect";
  character_name?: string | null;
  description?: string | null;
  file_url: string;
  duration?: number | null;
  volume: number;
  spatial_position?: SpatialPosition | null;
  loop?: boolean;
  start_time?: number;
}

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
  distance: number;
}

export interface ParsedScript {
  scenes: ParsedScene[];
  characters: string[];
  warnings: string[];
}

export interface ParsedScene {
  id: string;
  title: string;
  atmosphere: {
    description: string;
    mood: string;
    environment: string;
    ambience_cues: string[];
  };
  dialogue: DialogueLine[];
  sound_effects: SoundEffect[];
}

export interface DialogueLine {
  id: string;
  character: string;
  text: string;
  emotion: string;
  volume: string;
  position_hint: string;
}

export interface SoundEffect {
  id: string;
  type: string;
  timing: string;
  description: string;
}

export interface GenerateResponse {
  job_id: string;
  scene_id: string;
  status: string;
  estimated_time: number;
}

export interface JobStatus {
  job_id: string;
  scene_id?: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress?: { step: string; current: number; total: number };
  elapsed_time?: number;
  error?: string;
  audio_url?: string;
  duration?: number;
  layers?: AudioLayer[];
}

export interface RefineResponse {
  job_id: string;
  scene_id: string;
  status: string;
  refinement_id: string;
}

export type GenerationStep =
  | "idle"
  | "parsing"
  | "planning"
  | "generating"
  | "mixing"
  | "complete"
  | "failed";
