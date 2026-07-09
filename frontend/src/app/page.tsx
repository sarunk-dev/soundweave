"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "✦",
    title: "Describe your scene",
    desc: "Write a script with characters, dialogue, and atmosphere descriptions using our simple format.",
  },
  {
    icon: "◈",
    title: "AI plans the audio",
    desc: "IBM Granite reasons about voice casting, sound design, and 3D spatial positioning for every element.",
  },
  {
    icon: "◉",
    title: "Experience the result",
    desc: "Put on headphones and hear a fully-realized, immersive binaural audio scene — in under 2 minutes.",
  },
];

const USE_CASES = [
  { label: "Podcast creators",      desc: "Produce immersive audio drama without a studio" },
  { label: "Game designers",        desc: "Prototype narrative audio scenes rapidly" },
  { label: "Film students",         desc: "Pre-visualize scenes as spatial audio" },
  { label: "Audio drama writers",   desc: "Bring scripts to life before full production" },
];

export default function Home() {
  return (
    <main className="home">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="nav">
        <span className="nav-logo">SoundWeave</span>
        <div className="nav-links">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <Link href="/editor" className="btn btn-primary nav-cta">
            Try it free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">IBM AI Builders Challenge 2026</div>
        <h1 className="hero-title">
          Turn words into<br />
          <span className="hero-accent">immersive audio stories</span>
        </h1>
        <p className="hero-sub">
          Write a script. IBM Granite AI plans the voices, ambience, and 3D
          spatial audio. Put on headphones and experience your scene — in under
          2 minutes.
        </p>
        <div className="hero-actions">
          <Link href="/editor" className="btn btn-primary hero-cta">
            Create your scene →
          </Link>
          <a href="#how-it-works" className="btn btn-secondary">
            See how it works
          </a>
        </div>
        <div className="hero-stats">
          <span>No recording needed</span>
          <span className="stat-sep">·</span>
          <span>Multiple characters</span>
          <span className="stat-sep">·</span>
          <span>True 3D spatial audio</span>
          <span className="stat-sep">·</span>
          <span>Export-ready</span>
        </div>
      </section>

      {/* ── Demo preview ────────────────────────────────────────────────── */}
      <section className="demo-preview">
        <div className="demo-card">
          <div className="demo-script">
            <div className="demo-tag">Script input</div>
            <pre className="demo-code">{`# ACT 1: THE ALLEY

[ATMOSPHERE: Rainy night, distant traffic]

DETECTIVE (frustrated): Where were you?

SUSPECT (nervous, quiet): I was home.`}</pre>
          </div>
          <div className="demo-arrow">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16h20M20 10l6 6-6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="demo-output">
            <div className="demo-tag">Spatial audio output</div>
            <div className="demo-audio-vis">
              {[18, 32, 24, 40, 28, 44, 22, 36, 30, 42, 20, 38, 26, 44, 32, 28, 40, 24, 36, 18].map((h, i) => (
                <div
                  key={i}
                  className="demo-bar"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
            <div className="demo-layers">
              <span className="demo-layer voice">◉ Detective (deep, front-left)</span>
              <span className="demo-layer voice">◉ Suspect (nervous, front-right)</span>
              <span className="demo-layer ambient">◈ Rain ambience (surround)</span>
              <span className="demo-layer ambient">◈ Traffic (distant, behind)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="features">
        <h2 className="section-title">How it works</h2>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card">
              <div className="feature-num">0{i + 1}</div>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use cases ───────────────────────────────────────────────────── */}
      <section className="use-cases">
        <h2 className="section-title">Built for creators</h2>
        <div className="use-case-grid">
          {USE_CASES.map((u) => (
            <div key={u.label} className="use-case-card">
              <strong>{u.label}</strong>
              <span>{u.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <section className="tech-strip">
        <span className="tech-label">Powered by</span>
        {["IBM Granite", "Watsonx", "LangGraph", "ElevenLabs", "Web Audio API"].map((t) => (
          <span key={t} className="tech-badge">{t}</span>
        ))}
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="final-cta">
        <h2>Ready to hear your story?</h2>
        <p>No account needed. Your first scene is free.</p>
        <Link href="/editor" className="btn btn-primary final-cta-btn">
          Open the editor →
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="footer">
        <span>SoundWeave — IBM AI Builders Challenge 2026</span>
        <span className="footer-sep">·</span>
        <a href="https://github.com/sarunk-dev/soundweave" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <span className="footer-sep">·</span>
        <span>Built with IBM Bob</span>
      </footer>

      <style jsx>{`
        .home { min-height: 100vh; }

        /* Nav */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 48px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          z-index: 10;
        }
        .nav-logo { font-weight: 700; font-size: 17px; letter-spacing: -0.02em; }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-link { font-size: 14px; color: var(--muted); text-decoration: none; }
        .nav-link:hover { color: var(--text); }
        .nav-cta { padding: 7px 16px; font-size: 13px; }

        /* Hero */
        .hero {
          text-align: center;
          padding: 80px 24px 60px;
          max-width: 720px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 20px;
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 20px;
          color: var(--text);
        }
        .hero-accent { color: var(--accent); }
        .hero-sub {
          font-size: 17px;
          color: var(--muted);
          max-width: 540px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .hero-cta { padding: 11px 24px; font-size: 15px; }
        .hero-stats {
          margin-top: 28px;
          font-size: 13px;
          color: var(--muted);
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stat-sep { color: var(--border); }

        /* Demo preview */
        .demo-preview {
          padding: 0 24px 60px;
          max-width: 900px;
          margin: 0 auto;
        }
        .demo-card {
          display: flex;
          align-items: center;
          gap: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          flex-wrap: wrap;
        }
        .demo-script, .demo-output { flex: 1; min-width: 220px; }
        .demo-tag {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .demo-code {
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          line-height: 1.7;
          margin: 0;
          color: var(--text);
          white-space: pre-wrap;
        }
        .demo-arrow { flex-shrink: 0; }
        .demo-audio-vis {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 48px;
          margin-bottom: 14px;
        }
        .demo-bar {
          width: 4px;
          background: var(--accent);
          border-radius: 2px;
          opacity: 0.7;
          animation: pulse 1.4s ease-in-out infinite alternate;
        }
        @keyframes pulse {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        .demo-layers { display: flex; flex-direction: column; gap: 6px; }
        .demo-layer {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .demo-layer.voice   { background: #eff6ff; color: #1d4ed8; }
        .demo-layer.ambient { background: #f0fdf4; color: #15803d; }

        /* Features */
        .features {
          padding: 60px 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .section-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 32px;
          text-align: center;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
          position: relative;
        }
        .feature-num {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 11px;
          font-weight: 700;
          color: var(--border);
          letter-spacing: 0.05em;
        }
        .feature-icon { font-size: 22px; margin-bottom: 12px; color: var(--accent); }
        .feature-title { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
        .feature-desc  { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.6; }

        /* Use cases */
        .use-cases {
          padding: 0 24px 60px;
          max-width: 900px;
          margin: 0 auto;
        }
        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .use-case-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .use-case-card strong { font-size: 14px; font-weight: 600; }
        .use-case-card span   { font-size: 13px; color: var(--muted); }

        /* Tech */
        .tech-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 24px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .tech-label { font-size: 12px; color: var(--muted); font-weight: 500; }
        .tech-badge {
          font-size: 12px;
          font-weight: 500;
          padding: 3px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text);
        }

        /* Final CTA */
        .final-cta {
          text-align: center;
          padding: 72px 24px;
        }
        .final-cta h2 { font-size: 28px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
        .final-cta p  { color: var(--muted); margin: 0 0 28px; }
        .final-cta-btn { padding: 12px 28px; font-size: 15px; }

        /* Footer */
        .footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--muted);
        }
        .footer-sep { color: var(--border); }
        .footer a { color: var(--muted); text-decoration: none; }
        .footer a:hover { color: var(--text); }
      `}</style>
    </main>
  );
}
