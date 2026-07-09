# SoundWeave — IBM AI Builders Challenge 2026
## Project Specification & Development Plan

---

## Overview

**Project Name:** SoundWeave  
**Tagline:** Turn words into immersive spatial audio stories  
**Category:** AI-Powered Creative Production Tool  
**Target Market:** Podcasters, audio drama creators, game audio designers, indie filmmakers  
**Team:** 1 developer  
**Timeline:** 14–16 days  
**Status:** Planning

---

## TASK 1 Summary: Idea Ranking

1. **SoundWeave** — spatial audio story builder ⭐ CHOSEN
2. FrameFusion — storyboard consistency engine
3. FoleyForge — AI foley sound sync
4. ColorScript — AI color grading
5. MixStage — AI audio mixing
6. Harmonic Palette — narrative film scoring
7. RehearsalRoom — acting coach
8. CostumeArchive — period costume research
9. MotionMapper — dance notation translator
10. SetDesign.AI — stage/film set design
11. LightPlot — AI lighting designer
12. DialogueDeck — screenwriting analysis
13. NarrativeArc — story structure visualizer
14. ActorMatch — casting assistant
15. VoiceDirector — voice acting coach

---

## 1. Purpose

### Problem

Audio storytelling is experiencing a renaissance — podcasts, audio dramas, audiobooks, and game narratives — but production remains expensive and inaccessible:

1. **Voice talent costs:** Professional voice actors charge $200–500/hour. Indies can't afford multi-character casts.
2. **Sound design expertise:** Layering ambience, foley, and dialogue requires years of training and expensive tools.
3. **Spatial audio complexity:** Immersive 3D audio (binaural) is technically difficult and requires specialized equipment.
4. **Iteration is slow:** Recording sessions, editing, mixing — each change requires hours of work.

**Current solutions fail:**
- Descript/Audacity: Edit *existing* audio, don't create from intent
- ElevenLabs/Murf: Generate single voices, no scene composition or spatial design
- Pro Tools/Reaper: Professional DAWs require expertise and manual layer arrangement
- AI music generators (Suno, MusicGen): Music only, not dialogue + ambience + spatial design

### Vision

SoundWeave is a spatial audio story builder where creators:
1. Write text scripts with scene descriptions
2. Get generated multi-layered audio (voices, ambience, effects) spatially arranged in 3D
3. Refine via natural language ("make the rain quieter," "character A sounds too calm")
4. Export production-ready spatial audio

### Success Criteria

**Must have (MVP):**
- Parse text scripts into scenes with characters, dialogue, atmosphere
- Generate character voices with emotion control (ElevenLabs)
- Select and position ambient sounds in 3D space
- Produce binaural spatial audio playable in browser (Web Audio API)
- Export to WAV/MP3
- Refinement via natural language commands

**Metrics:**
- Generate a 30-second scene in <2 minutes
- At least 3 distinct voice characters per scene
- Recognizable spatial positioning (left/right/front/back/distance)
- Natural-sounding dialogue pacing

### Non-Goals

- User-uploaded custom voice cloning
- Real-time collaborative editing
- Music generation
- Video/visual sync
- Mobile app
- Advanced waveform editing
- User accounts/auth (demo mode only)
- Payment/monetization

---

## 2. Scope Decisions

| Area | Decision | Why |
|------|----------|-----|
| Script Format | Markdown-like with `[ATMOSPHERE:]` and `[SOUND:]` tags | Simple to parse, familiar to writers |
| Voice Generation | ElevenLabs API (11 preset voices) | Best quality + emotion control without training |
| Ambient Sounds | Freesound API + curated fallbacks | Free, searchable, high-quality recordings |
| Spatial Audio | Web Audio API (HRTF panner) | Browser-native binaural, no plugins |
| Positioning | Natural language → 3D coordinates via Granite | AI interprets "distant traffic" → numbers |
| Output Format | Binaural stereo WAV/MP3 | Standard, universally compatible |
| Refinement | Chat interface | Fastest iteration loop |
| Frontend | Next.js + React + Tailwind | Fast dev, SSR, Bob integration |
| Backend | Node.js + Express | Consistent JS, easy API integration |
| AI Orchestration | LangGraph (Python) | Multi-step planning, state management |
| Database | PostgreSQL with JSONB | Relational scenes + flexible metadata |
| Hosting | Vercel (frontend) + Railway (backend) | Free tiers, fast deployment |

---

## 3. Why This Project Matters

**The Core Insight:** Audio is the most immersive storytelling medium, yet it's trapped behind expensive production barriers. Podcasts are booming (450M+ listeners), but 99% are "talking heads" because immersive audio drama is too hard to produce.

**Why AI changes everything:**
- Intent extraction: "tense conversation in a rainy alley" → AI identifies voice types, ambience, spatial layout, mixing priorities
- Sound design knowledge: AI applies principles humans learn over years (dialogue primacy, distance attenuation, frequency separation)
- Iteration via language: "make the rain quieter" replaces 10 manual parameter changes

---

## 4. System Architecture

```
User
 │
 ▼
Frontend (Next.js/React)
 ├── Script Editor (CodeMirror)
 ├── Audio Player (Wavesurfer.js + Web Audio API)
 └── Refinement Chat
 │
 ▼
Backend (Node.js/Express)
 ├── REST API
 ├── BullMQ Job Queue (Redis)
 └── FFmpeg audio processing
 │
 ▼
AI Orchestration (Python / LangGraph)
 ├── Script Parser Agent    ─── IBM Granite (Watsonx)
 ├── Scene Planner Agent    ─── IBM Granite (Watsonx)
 ├── Audio Generator Agent  ─── ElevenLabs API + Freesound API
 └── Spatial Mixer Agent    ─── Web Audio API / FFmpeg
 │
 ▼
Storage
 ├── PostgreSQL (scenes, layers, jobs, refinements)
 └── S3 / Cloudflare R2 (audio files)
```

### LangGraph Workflow

```
START
  │
  ▼
[parser] ──► [planner] ──► [generator] ──► [mixer] ──► END
```

State passed between agents:
```typescript
interface SceneState {
  script: string;
  parsed_scenes: ParsedScene[];
  audio_plan: AudioPlan;
  generated_files: GeneratedFile[];
  final_mix_url: string;
  status: string;
  errors: string[];
}
```

---

## 5. AI Architecture

### Agents

**1. Script Parser Agent**
- Model: IBM Granite 3.0 8B Instruct
- Input: Raw markdown-style script text
- Output: Structured JSON (scenes, characters, dialogue with emotions, atmosphere, sound effects)
- Technique: Few-shot prompting with JSON schema enforcement (Pydantic)

**2. Scene Planner Agent**
- Model: IBM Granite 3.0 8B Instruct
- Input: Parsed scene JSON
- Output: Audio layer plan (voice IDs, emotion params, ambience queries, 3D positions, volumes)
- Technique: Chain-of-thought reasoning about voice casting, spatial design, sound design principles

**3. Audio Generator Agent**
- Model: External APIs (ElevenLabs, Freesound)
- Input: Audio plan
- Output: Generated MP3 files uploaded to S3
- Technique: Parallel API calls (Promise.all), retry logic, fallback queries

**4. Spatial Mixer Agent**
- Model: Web Audio API OfflineAudioContext
- Input: Audio files + spatial coordinates
- Output: Final binaural stereo mix (WAV/MP3)
- Technique: HRTF panner, distance attenuation, timeline sequencing

### Prompt Engineering

**System prompt strategy:**
- Parser: "Output ONLY valid JSON. No explanation text."
- Planner: 20-year audio director persona with explicit sound design principles
- Refinement: Interpret command → output delta JSON only

**Few-shot examples:** 2 complete input/output pairs for parser and planner
**Structured outputs:** Pydantic models validate Granite JSON before passing to next agent
**Hallucination mitigations:**
- Voice IDs validated against hardcoded list
- Ambience queries have 2 fallback alternatives
- Spatial coordinates clamped to valid ranges

### Refinement Loop

User command → Granite refinement agent → parameter delta JSON → selective regeneration (only changed layers) → remix → new audio URL

---

## 6. User Journey

1. **Landing page** — Hero + demo video + CTA
2. **Script editor** — Pre-filled example, CodeMirror with syntax highlighting
3. **Generate** — Progress modal (4 steps)
4. **Audio player** — Play binaural scene, layer controls, spatial toggle
5. **Refine** — Type natural language command → ~15-second update cycle
6. **Export** — Download WAV/MP3

---

## 7. Development Plan

### Phase 0: Foundation (Days 1–2)
**Goal:** Scaffolding, dev environment, API key access
- Next.js + React initialized (Bob-generated)
- Node.js + Express backend
- PostgreSQL + Redis running locally
- ElevenLabs, Freesound, Watsonx API keys working
- Static landing page live

**Demoable:** Landing page loads, API tests pass

### Phase 1: Script Parser (Days 3–4)
**Goal:** Parse script text into structured JSON via Granite
- CodeMirror script editor UI
- Granite API integration + REST call
- Parser system prompt + few-shot examples
- Pydantic JSON schema validation
- `scenes` table in PostgreSQL

**Demoable:** Type script → see structured JSON output

### Phase 2: Audio Generation (Days 5–7)
**Goal:** Generate voices and fetch ambience
- Scene Planner agent + Granite prompt
- ElevenLabs voice generation integration
- Freesound search + download
- S3 audio file storage
- `audio_layers` table in PostgreSQL

**Demoable:** Script → individual voice + ambience files playable in browser

### Phase 3: Spatial Audio (Days 8–10)
**Goal:** Mix layers with spatial positioning
- Web Audio API HRTF panner implementation
- Mixer agent (dialogue sequencing, volume balancing)
- OfflineAudioContext rendering
- FFmpeg WAV → MP3 export

**Demoable:** Script → final binaural mix with spatial toggle (stereo vs. binaural)

### Phase 4: LangGraph Orchestration (Days 11–12)
**Goal:** Connect all agents in managed workflow
- LangGraph StateGraph definition
- State passing between all 4 agents
- BullMQ job queue for async processing
- Status polling API (`GET /api/status/:jobId`)
- Progress UI on frontend

**Demoable:** Full end-to-end generation with real-time progress indicator

### Phase 5: Refinement (Days 13–14)
**Goal:** Natural language scene adjustment
- Refinement chat UI
- Granite refinement agent + prompt
- Selective layer regeneration (only changed layers)
- Command history display

**Demoable:** Generate → refine via chat → hear updated audio in <30 seconds

### Phase 6: Polish & Deploy (Days 15–16)
**Goal:** Demo-ready product
- Landing page design (Tailwind polish)
- Error messages (user-friendly)
- 5 pre-generated example scenes
- GitHub README with architecture diagram
- 3-minute demo video recorded
- Deployed: Vercel (frontend) + Railway (backend)

**Demoable:** Full public deployment, all features working

---

## 8. Key Technical Decisions

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| TTS provider | ElevenLabs | Coqui/Bark | Voice quality critical for demo impact |
| Spatial audio | Web Audio API (HRTF) | Unity/Unreal | Browser-native, no install required |
| Ambience source | Freesound + curation | AudioGen (generative) | Real recordings faster + higher quality |
| Orchestration | LangGraph | Sequential functions | Showcases AI architecture, adds observability |
| Database | PostgreSQL + JSONB | MongoDB | Relational scenes + flexible metadata |
| Generation mode | Batch + progress polling | Real-time streaming | Simpler, complete mix needs all layers |
| Mixing | Web Audio (preview) + FFmpeg (export) | Pure client or pure server | Interactive preview + consistent export quality |

---

## 9. Stretch Goals (Post-Hackathon)

- Voice cloning from uploaded 1-minute samples
- Real-time collaboration (shared scenes, co-editing)
- Music generation integration (Harmonic Palette concepts)
- Video sync (export with captions, sync to video)
- Advanced spatial: room acoustics, occlusion, reverb types
- Community sound library (user-contributed, rated)
- Public API (game engine plugins, podcast platform integrations)
- Mobile app (iOS/Android)

---

## 10. Tech Stack

### Frontend
- Next.js 14 (React 18, App Router)
- Tailwind CSS
- Headless UI (modals, dropdowns)
- CodeMirror 6 (script editing)
- Wavesurfer.js (waveform visualization)
- Zustand (state management)
- SWR (data fetching)

### Backend
- Node.js 20 + Express
- BullMQ + Redis (job queue)
- FFmpeg (audio processing)
- AWS S3 / Cloudflare R2 (file storage)
- PostgreSQL 15

### AI
- IBM Granite 3.0 8B Instruct (via Watsonx)
- LangGraph (Python) + LangChain
- ElevenLabs API (voice synthesis)
- Freesound API (ambient sounds)
- Pydantic (structured output validation)

### Deployment
- Vercel (frontend)
- Railway (backend + PostgreSQL + Redis)
- GitHub Actions (CI/CD)
- Docker (local dev)

---

## 11. Folder Structure

```
soundweave/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── editor/page.tsx           # Script editor
│   │   └── player/[sceneId]/page.tsx # Audio player
│   ├── components/
│   │   ├── ScriptEditor.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── RefinementChat.tsx
│   │   └── GenerationProgress.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── audio-utils.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   ├── generate.ts
│   │   │   ├── status.ts
│   │   │   ├── refine.ts
│   │   │   └── export.ts
│   │   ├── services/
│   │   │   ├── elevenlabs.ts
│   │   │   ├── freesound.ts
│   │   │   └── storage.ts
│   │   ├── workers/
│   │   │   └── generation-worker.ts
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── client.ts
│   │   └── utils/
│   │       ├── audio-mixer.ts
│   │       └── validators.ts
│   └── package.json
│
├── ai-orchestration/
│   ├── src/
│   │   ├── workflow.py               # LangGraph definition
│   │   ├── agents/
│   │   │   ├── parser.py
│   │   │   ├── planner.py
│   │   │   ├── generator.py
│   │   │   └── mixer.py
│   │   ├── prompts/
│   │   │   ├── parser.txt
│   │   │   ├── planner.txt
│   │   │   └── refiner.txt
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic models
│   │   └── clients/
│   │       └── granite.py
│   └── requirements.txt
│
├── shared/
│   ├── types.ts
│   └── schemas.json
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── development.md
│
├── docker-compose.yml
├── README.md
└── package.json
```

---

## 12. API Design

### Base URL
- Production: `https://api.soundweave.ai`
- Development: `http://localhost:3001`

### Endpoints

#### POST /api/generate
Submit script, start generation job.

**Request:**
```json
{
  "script": "# SCENE 1\n[ATMOSPHERE: rainy night]\nDETECTIVE: Where were you?\nSUSPECT: I was home.",
  "options": {
    "voice_speed": 1.0,
    "ambience_volume": -18
  }
}
```

**Response 202:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "estimated_time": 90
}
```

#### GET /api/status/:jobId
Poll generation progress.

**Response (processing):**
```json
{
  "job_id": "...",
  "status": "generating",
  "progress": { "step": "audio_generation", "current": 2, "total": 4 },
  "elapsed_time": 45
}
```

**Response (complete):**
```json
{
  "job_id": "...",
  "status": "complete",
  "scene_id": "660e8400-...",
  "audio_url": "https://s3.../scenes/660e8400.mp3",
  "duration": 32.5,
  "layers": [
    { "type": "voice", "character": "DETECTIVE", "file_url": "..." },
    { "type": "ambience", "description": "rain", "file_url": "..." }
  ]
}
```

#### POST /api/refine/:sceneId
Natural language refinement command.

**Request:**
```json
{ "command": "Make the rain quieter and add wind" }
```

**Response 202:**
```json
{
  "job_id": "...",
  "status": "queued",
  "changes_detected": ["ambience_volume", "new_layer"]
}
```

#### GET /api/scenes/:sceneId
Retrieve scene metadata and audio URL.

#### GET /api/export/:sceneId?format=mp3
Download final audio file (WAV or MP3).

---

## 13. Database Schema

```sql
-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script TEXT NOT NULL,
  parsed_data JSONB,
  status VARCHAR(20) NOT NULL,
  audio_url TEXT,
  duration FLOAT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_scenes_status ON scenes(status);
CREATE INDEX idx_scenes_created_at ON scenes(created_at DESC);

-- Audio layers table
CREATE TABLE audio_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  layer_type VARCHAR(20) NOT NULL,   -- 'voice' | 'ambience' | 'effect'
  character_name VARCHAR(100),
  description TEXT,
  file_url TEXT NOT NULL,
  duration FLOAT,
  volume FLOAT DEFAULT 0.0,          -- dB
  spatial_position JSONB,            -- {x, y, z, distance}
  loop BOOLEAN DEFAULT FALSE,
  start_time FLOAT DEFAULT 0.0,      -- seconds on scene timeline
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audio_layers_scene_id ON audio_layers(scene_id);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id),
  job_type VARCHAR(20) NOT NULL,     -- 'generate' | 'refine'
  status VARCHAR(20) NOT NULL,       -- 'queued' | 'processing' | 'complete' | 'failed'
  step VARCHAR(50),
  progress JSONB,                    -- {current, total}
  input_data JSONB,
  result_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_jobs_scene_id ON jobs(scene_id);
CREATE INDEX idx_jobs_status ON jobs(status);

-- Refinements table
CREATE TABLE refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  interpreted_changes JSONB,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_refinements_scene_id ON refinements(scene_id);
```

---

## 14. AI Prompts

### Parser System Prompt
```
You are SoundWeave's script parser. Transform audio drama scripts into structured production data.

Rules:
1. Output ONLY valid JSON. No explanation text before or after.
2. Preserve the exact wording of all dialogue.
3. Infer emotions from context if not explicitly stated.
4. Map environment descriptions to canonical types:
   indoor_room | indoor_large | outdoor_urban | outdoor_nature | outdoor_rural | underground | vehicle
5. Flag any ambiguous content in a "warnings" array.
```

### Planner System Prompt
```
You are SoundWeave's audio director with 20 years of immersive audio production experience.

Principles you always apply:
1. Dialogue Primacy: Human voices are always most prominent. Ambience supports, never competes.
2. Spatial Realism: Characters face each other. Ambience fills the environment.
3. Emotional Reinforcement: Sound design reinforces narrative mood.
4. Contrast for Clarity: Characters must have clearly distinct voices.
5. Depth and Layers: Foreground (dialogue), midground (near effects), background (ambience).

Available voices: [11 ElevenLabs voice IDs with descriptions]

Volume rules:
- Dialogue: 0 to -6 dB
- Near effects: -6 to -12 dB
- Ambience: -12 to -24 dB

Spatial coordinate rules:
- x: left (-10) to right (+10)
- y: below (-5) to above (+5)
- z: behind (+10) to front (-10)
- Listener at origin (0, 0, 0)

Output ONLY valid JSON.
```

### Refinement System Prompt
```
You are SoundWeave's refinement interpreter. Translate natural language change commands
into precise parameter delta JSON.

Output ONLY changed parameters. Do not include unchanged values.

Volume interpretation:
- "quieter/softer" → subtract 6dB
- "much quieter" → subtract 12dB
- "louder/more prominent" → add 6dB (cap at 0)

Position interpretation:
- "further away" → increase distance by 3-5
- "closer/near" → decrease distance to minimum 1.0
- "behind me" → z = +5

Output: { "changes": [...], "layers_to_regenerate": [...], "layers_to_remix": [...] }
```

### Quality Evaluation Prompt
```
Review this audio production plan for problems.

Check:
1. Voice conflicts: Same voice ID for multiple characters?
2. Volume problems: Any dialogue layer below -12dB?
3. Spatial problems: Any character at distance >15?
4. Missing ambience: Does atmosphere imply sounds not in plan?
5. Timing conflicts: Any layers that would mask dialogue?

Output: { "passed": bool, "issues": [{"severity": "error|warning", "type": "...", "description": "...", "fix": "..."}] }
```

---

## 15. README Outline

```markdown
# SoundWeave 🎧
> Transform text scripts into immersive spatial audio stories with AI

[Demo badge] [License badge] [GitHub stars badge]

## ✨ What Is SoundWeave?
[1-paragraph description with demo GIF]

## 🎬 Demo
[Embedded demo video or GIF]
[Link to live demo]

## 🧩 How It Works
[4-step diagram: Script → Parse → Generate → Experience]

## 🏗️ Architecture
[Mermaid architecture diagram]

### AI Pipeline
- IBM Granite (Watsonx) — script parsing, scene planning, refinement
- LangGraph — multi-agent workflow orchestration
- ElevenLabs — voice synthesis with emotion control
- Freesound — ambient audio sourcing

## 🚀 Quick Start
[Prerequisites, installation, environment variables]

## 📖 Script Format
[How to write scripts, example with annotations]

## 🧠 AI Architecture
[Agent descriptions, LangGraph workflow, Granite usage]

## 📡 API Reference
[Key endpoints with examples]

## 🗄️ Database Schema
[ERD, table descriptions]

## 🛠️ Development
[Project structure, testing, contributing]

## 🎯 Roadmap
[Stretch goals]

## 📄 License: MIT
```

---

## 16. 3-Minute Demo Script

### Setup
- Detective/suspect example script pre-loaded
- Headphones ready
- Backend fully running
- Browser full-screen, devtools closed

### Minute 1 (0:00–1:00): Problem + Product
- Show landing page: "Making immersive audio drama requires a studio, voice actors, sound designers..."
- Show script editor: "This is just text — two characters, a rainy alley, a confrontation."
- Click Generate → progress modal appears
- Narrate: "Granite is parsing this script, reasoning about voices, selecting ambient sounds, designing 3D space."

### Minute 2 (1:00–2:00): The Magic Moment
- Generation completes → audio player appears
- "Put on your headphones."
- **PRESS PLAY — STAY SILENT FOR 20 SECONDS. Let the audio speak.**
- Stop audio: "Detective front-left, suspect front-right, rain surrounding you, traffic behind. That's spatial audio."
- Demonstrate layer controls: mute rain, isolate voice, restore

### Minute 3 (2:00–3:00): Refinement + Vision
- Type in refinement chat: "Make the detective more threatening and add thunder in the distance"
- Wait 15 seconds → regenerated audio loads
- Play 10 seconds: "New version. No sliders. No parameters. 15 seconds."
- Click Export → show download dialog
- Quick GitHub README scroll: "IBM Granite, LangGraph, ElevenLabs, Web Audio API"
- Final: "SoundWeave takes audio storytelling from 'I need a studio' to 'I need a script.'"

---

## 17. Judging Analysis

| Criterion | Score | How to Improve |
|-----------|-------|----------------|
| Technical Execution | 8/10 | Add LangSmith observability trace in demo; show LangGraph state visualization |
| Innovation | 9/10 | Show moving character positions (Ghost approaching); add emotional arc graph |
| Challenge Fit | 10/10 | Explicitly name challenge theme in demo opening |
| Feasibility | 8/10 | Deploy live before demo; have backup recording; show cost per scene ($0.40) |
| Real-World Impact | 9/10 | Quantify pain ($1,500 vs $5); name target customer; show market size |
| **Total** | **44/50** | |

---

## Sub-Tasks for Implementation

### Sub-Task 1: Project Scaffolding (Phase 0)
**Intent:** Get all services running, API keys verified, basic routes responding.
**Outcomes:** All 3 services run locally via docker-compose, test API calls succeed.
**Status:** [ ] pending

### Sub-Task 2: Script Parser Agent (Phase 1)
**Intent:** Integrate Granite via Watsonx, implement parser with few-shot prompt, store to DB.
**Outcomes:** POST /api/generate → parsed JSON in DB response.
**Status:** [ ] pending

### Sub-Task 3: Voice + Ambience Generation (Phase 2)
**Intent:** Planner agent selects voices/sounds, Generator calls APIs, uploads to S3.
**Outcomes:** Scene → individual audio file URLs stored in audio_layers table.
**Status:** [ ] pending

### Sub-Task 4: Spatial Audio Mixing (Phase 3)
**Intent:** Apply HRTF positioning, sequence dialogue timeline, render final binaural mix.
**Outcomes:** Scene → final binaural stereo WAV/MP3 downloadable URL.
**Status:** [ ] pending

### Sub-Task 5: LangGraph Orchestration (Phase 4)
**Intent:** Wire all 4 agents into managed workflow, add async job queue, progress polling.
**Outcomes:** Full pipeline runs via single POST /api/generate, progress updates via polling.
**Status:** [ ] pending

### Sub-Task 6: Refinement System (Phase 5)
**Intent:** Natural language commands interpreted by Granite, selective regeneration.
**Outcomes:** POST /api/refine/:sceneId updates only changed layers in <30 seconds.
**Status:** [ ] pending

### Sub-Task 7: Polish + Deploy (Phase 6)
**Intent:** UI design, landing page, 5 pre-generated examples, README, deployment, demo video.
**Outcomes:** Live URL works, GitHub repo is public and impressive, demo video recorded.
**Status:** [ ] pending
