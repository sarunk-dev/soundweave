"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScriptEditor from "@/components/ScriptEditor";
import GenerationProgress from "@/components/GenerationProgress";
import { generateScene, pollUntilDone } from "@/lib/api-client";
import { useGenerationStore } from "@/store/generation";
import type { GenerationStep } from "@/lib/types";

const EXAMPLE_SCRIPT = `# ACT 1: THE RAINY ALLEY

[ATMOSPHERE: Cold rainy night, narrow alley, brick walls, distant city traffic]

DETECTIVE (frustrated, loud): Where were you on the night of the 12th?

SUSPECT (nervous, quiet): I... I told you. I was home. Alone.

[SOUND: footsteps approaching on wet pavement]

DETECTIVE (low, menacing): Don't lie to me. We have a witness.

SUSPECT (voice cracking): That's — that's impossible.`;

export default function EditorPage() {
  const router = useRouter();
  const [script, setScript] = useState(EXAMPLE_SCRIPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { step, elapsedSeconds, error, startGeneration, updateProgress, reset } =
    useGenerationStore();

  const abortRef = useRef(false);

  const handleGenerate = useCallback(async () => {
    if (!script.trim() || isGenerating) return;

    abortRef.current = false;
    setIsGenerating(true);
    setShowProgress(true);
    reset();

    try {
      const { job_id, scene_id } = await generateScene(script);
      startGeneration(job_id, scene_id);

      const finalStatus = await pollUntilDone(job_id, updateProgress);

      if (!abortRef.current && finalStatus.scene_id) {
        router.push(`/player/${finalStatus.scene_id}`);
      }
    } catch (err: any) {
      useGenerationStore.setState({ step: "failed", error: err.message });
    } finally {
      setIsGenerating(false);
    }
  }, [script, isGenerating, router, startGeneration, updateProgress, reset]);

  const handleCancel = () => {
    abortRef.current = true;
    setIsGenerating(false);
    setShowProgress(false);
    reset();
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = script.split("\n").length;

  return (
    <div className="editor-page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="editor-header">
        <Link href="/" className="editor-logo">
          ← SoundWeave
        </Link>
        <div className="editor-header-right">
          <span className="editor-meta">{wordCount} words · {lineCount} lines</span>
          <button
            className="btn btn-primary generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || script.trim().length < 10}
          >
            {isGenerating ? (
              <>
                <span className="btn-spinner" />
                Generating…
              </>
            ) : (
              "Generate Scene →"
            )}
          </button>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="editor-layout">
        {/* Script editor panel */}
        <div className="editor-panel">
          <ScriptEditor
            value={script}
            onChange={setScript}
            disabled={isGenerating}
          />
        </div>

        {/* Right sidebar */}
        <div className="editor-sidebar">
          {showProgress ? (
            <div className="sidebar-progress">
              <GenerationProgress
                step={step as GenerationStep}
                elapsedSeconds={elapsedSeconds}
                error={error ?? undefined}
              />
              {(step === "failed" || step === "complete") ? (
                <button className="btn btn-secondary sidebar-action" onClick={handleCancel}>
                  {step === "complete" ? "Create new scene" : "Try again"}
                </button>
              ) : (
                <button className="btn btn-ghost sidebar-action" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="sidebar-help">
              <h3 className="help-title">Script format</h3>

              <div className="help-section">
                <span className="help-tag scene">Scene title</span>
                <code className="help-example"># ACT 1: LOCATION</code>
              </div>

              <div className="help-section">
                <span className="help-tag atmosphere">Atmosphere</span>
                <code className="help-example">[ATMOSPHERE: rainy night, distant traffic]</code>
                <p className="help-note">Describes the environment and mood. Used to select ambient sounds and reverb.</p>
              </div>

              <div className="help-section">
                <span className="help-tag dialogue">Dialogue</span>
                <code className="help-example">CHARACTER (emotion, volume): text</code>
                <p className="help-note">
                  Emotions: nervous, frustrated, calm, menacing, excited…<br />
                  Volumes: quiet, normal, loud
                </p>
              </div>

              <div className="help-section">
                <span className="help-tag effect">Sound effects</span>
                <code className="help-example">[SOUND: footsteps on gravel]</code>
                <p className="help-note">Placed between dialogue lines. Timed automatically.</p>
              </div>

              <div className="help-limits">
                <span className="limit-item">Max 10 characters</span>
                <span className="limit-item">Max 5 min audio</span>
                <span className="limit-item">~$0.40 per scene</span>
              </div>

              <button
                className="btn btn-primary generate-btn-sidebar"
                onClick={handleGenerate}
                disabled={isGenerating || script.trim().length < 10}
              >
                Generate Scene →
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .editor-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }

        /* Header */
        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .editor-logo {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
          opacity: 0.7;
        }
        .editor-logo:hover { opacity: 1; }
        .editor-header-right { display: flex; align-items: center; gap: 16px; }
        .editor-meta { font-size: 12px; color: var(--muted); }
        .generate-btn { padding: 8px 18px; font-size: 14px; }
        .btn-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Layout */
        .editor-layout {
          display: flex;
          flex: 1;
          gap: 0;
          min-height: 0;
        }
        .editor-panel {
          flex: 1;
          padding: 24px;
          min-width: 0;
        }
        .editor-sidebar {
          width: 300px;
          flex-shrink: 0;
          border-left: 1px solid var(--border);
          padding: 24px;
          background: var(--surface);
          overflow-y: auto;
        }

        /* Progress state */
        .sidebar-progress {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sidebar-action { width: 100%; justify-content: center; }

        /* Help state */
        .sidebar-help { display: flex; flex-direction: column; gap: 16px; }
        .help-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin: 0;
        }
        .help-section { display: flex; flex-direction: column; gap: 5px; }
        .help-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }
        .help-tag.scene      { background: #eff6ff; color: #1d4ed8; }
        .help-tag.atmosphere { background: #f5f3ff; color: #6d28d9; }
        .help-tag.dialogue   { background: #f0fdf4; color: #15803d; }
        .help-tag.effect     { background: #fffbeb; color: #b45309; }
        .help-example {
          font-family: "JetBrains Mono", monospace;
          font-size: 11.5px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 6px 10px;
          display: block;
          color: var(--text);
          line-height: 1.5;
        }
        .help-note {
          font-size: 12px;
          color: var(--muted);
          margin: 0;
          line-height: 1.5;
        }
        .help-limits {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .limit-item { font-size: 12px; color: var(--muted); }
        .limit-item::before { content: "· "; }
        .generate-btn-sidebar { width: 100%; justify-content: center; margin-top: 4px; }

        /* Responsive */
        @media (max-width: 640px) {
          .editor-sidebar { display: none; }
          .editor-header .editor-meta { display: none; }
        }
      `}</style>
    </div>
  );
}
