"use client";

import React from "react";
import type { GenerationStep } from "@/lib/types";

const STEPS: { key: GenerationStep; label: string; desc: string }[] = [
  { key: "parsing",    label: "Parsing script",        desc: "IBM Granite reads your script and extracts scenes, characters, and atmosphere" },
  { key: "planning",   label: "Planning audio layers", desc: "Designing voice casting, ambience selection, and 3D spatial positions" },
  { key: "generating", label: "Generating audio",      desc: "Synthesising voices with ElevenLabs, fetching ambient sounds from Freesound" },
  { key: "mixing",     label: "Spatial mixing",        desc: "Arranging layers in 3D space and rendering the final binaural mix" },
];

const STEP_ORDER: GenerationStep[] = ["parsing", "planning", "generating", "mixing", "complete"];

function stepIndex(step: GenerationStep): number {
  return STEP_ORDER.indexOf(step);
}

interface Props {
  step: GenerationStep;
  elapsedSeconds?: number;
  error?: string;
}

export default function GenerationProgress({ step, elapsedSeconds, error }: Props) {
  const currentIdx = stepIndex(step);

  return (
    <div className="generation-progress">
      <div className="gp-header">
        {step === "failed" ? (
          <span className="gp-title error">Generation failed</span>
        ) : step === "complete" ? (
          <span className="gp-title success">Ready to listen!</span>
        ) : (
          <span className="gp-title">Generating your scene…</span>
        )}
        {elapsedSeconds !== undefined && step !== "complete" && step !== "failed" && (
          <span className="gp-elapsed">{elapsedSeconds}s</span>
        )}
      </div>

      {error && <p className="gp-error">{error}</p>}

      <div className="gp-steps">
        {STEPS.map((s, i) => {
          const done    = currentIdx > i;
          const active  = currentIdx === i && step !== "complete" && step !== "failed";
          const pending = currentIdx < i;

          return (
            <div
              key={s.key}
              className={`gp-step ${done ? "done" : ""} ${active ? "active" : ""} ${pending ? "pending" : ""}`}
            >
              <div className="gp-indicator">
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : active ? (
                  <span className="gp-spinner" />
                ) : (
                  <span className="gp-dot" />
                )}
              </div>
              <div className="gp-step-text">
                <span className="gp-step-label">{s.label}</span>
                {active && <span className="gp-step-desc">{s.desc}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .generation-progress {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
          width: 100%;
          max-width: 480px;
        }
        .gp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .gp-title { font-weight: 600; font-size: 15px; }
        .gp-title.error   { color: var(--danger); }
        .gp-title.success { color: var(--success); }
        .gp-elapsed { font-size: 12px; color: var(--muted); }
        .gp-error {
          font-size: 13px;
          color: var(--danger);
          margin: 0 0 16px;
          padding: 10px 14px;
          background: #fef2f2;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }
        .gp-steps { display: flex; flex-direction: column; gap: 12px; }
        .gp-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          opacity: 0.4;
        }
        .gp-step.done, .gp-step.active { opacity: 1; }
        .gp-indicator {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .gp-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border);
          display: block;
        }
        .gp-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          display: block;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .gp-step-text { display: flex; flex-direction: column; }
        .gp-step-label { font-size: 14px; font-weight: 500; line-height: 1.4; }
        .gp-step-desc  { font-size: 12px; color: var(--muted); margin-top: 2px; }
      `}</style>
    </div>
  );
}
