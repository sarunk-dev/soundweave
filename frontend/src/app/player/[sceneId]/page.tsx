"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlayerPage() {
  const { sceneId } = useParams<{ sceneId: string }>();

  return (
    <div className="player-placeholder">
      <nav className="pp-nav">
        <Link href="/editor" className="pp-back">← Back to editor</Link>
        <span className="pp-logo">SoundWeave</span>
      </nav>

      <div className="pp-body">
        <div className="pp-card">
          <div className="pp-icon">◉</div>
          <h1 className="pp-title">Scene generated!</h1>
          <p className="pp-sub">
            Scene ID: <code>{sceneId}</code>
          </p>
          <p className="pp-note">
            The audio player will be available in Phase 3 (spatial mixing).
            Your scene has been created and stored.
          </p>
          <Link href="/editor" className="btn btn-primary pp-btn">
            Create another scene →
          </Link>
        </div>
      </div>

      <style jsx>{`
        .player-placeholder {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }
        .pp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
        }
        .pp-back { font-size: 14px; color: var(--muted); text-decoration: none; }
        .pp-back:hover { color: var(--text); }
        .pp-logo { font-size: 15px; font-weight: 700; }
        .pp-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }
        .pp-card {
          text-align: center;
          max-width: 420px;
          width: 100%;
          padding: 48px 40px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }
        .pp-icon { font-size: 40px; color: var(--accent); margin-bottom: 16px; }
        .pp-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
        .pp-sub { font-size: 13px; color: var(--muted); margin: 0 0 16px; }
        .pp-sub code {
          font-family: monospace;
          font-size: 12px;
          background: var(--border);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .pp-note { font-size: 13px; color: var(--muted); margin: 0 0 28px; line-height: 1.6; }
        .pp-btn { padding: 10px 24px; }
      `}</style>
    </div>
  );
}
