"use client";

import React, { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

const EXAMPLE_SCRIPT = `# ACT 1: THE RAINY ALLEY

[ATMOSPHERE: Cold rainy night, narrow alley, brick walls, distant city traffic]

DETECTIVE (frustrated, loud): Where were you on the night of the 12th?

SUSPECT (nervous, quiet): I... I told you. I was home. Alone.

[SOUND: footsteps approaching on wet pavement]

DETECTIVE (low, menacing): Don't lie to me. We have a witness.

SUSPECT (voice cracking): That's — that's impossible.`;

const SCRIPT_HELP = [
  { tag: "# SCENE TITLE",                color: "#3b82d4" },
  { tag: "[ATMOSPHERE: description]",     color: "#7c5cd8" },
  { tag: "CHARACTER (emotion): dialogue", color: "#16a34a" },
  { tag: "[SOUND: sound effect]",         color: "#d97706" },
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function ScriptEditor({ value, onChange, disabled }: Props) {
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
      setCharCount(val.length);
    },
    [onChange]
  );

  // Rough estimate: avg 4 words/line of dialogue, ~3 seconds/word
  const estimatedDuration = Math.round(
    (value.match(/^[A-Z][A-Z\s]+\s*\(.*?\):/gm)?.length ?? 0) * 8
  );

  return (
    <div className="script-editor-wrapper">
      <div className="se-toolbar">
        <span className="se-label">Script</span>
        <div className="se-hints">
          {SCRIPT_HELP.map((h) => (
            <span key={h.tag} className="se-hint" style={{ color: h.color }}>
              {h.tag}
            </span>
          ))}
        </div>
        <button
          className="btn btn-ghost se-example-btn"
          onClick={() => handleChange(EXAMPLE_SCRIPT)}
          disabled={disabled}
          type="button"
        >
          Load example
        </button>
      </div>

      <div className={`se-editor ${disabled ? "se-disabled" : ""}`}>
        <CodeMirror
          value={value}
          onChange={handleChange}
          extensions={[
            markdown(),
            EditorView.lineWrapping,
            EditorView.theme({
              "&": {
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                fontSize: "13.5px",
              },
              ".cm-scroller": { padding: "12px 0" },
              ".cm-content": { padding: "0 16px" },
              ".cm-line": { padding: "1px 0" },
              ".cm-focused": { outline: "none" },
            }),
          ]}
          editable={!disabled}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: false,
            closeBrackets: false,
            autocompletion: false,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightActiveLine: true,
            highlightSelectionMatches: false,
            closeBracketsKeymap: false,
            searchKeymap: false,
            foldKeymap: false,
            completionKeymap: false,
            lintKeymap: false,
          }}
        />
      </div>

      <div className="se-footer">
        <span className="se-stat">{charCount.toLocaleString()} chars</span>
        {estimatedDuration > 0 && (
          <span className="se-stat">~{estimatedDuration}s estimated audio</span>
        )}
        <span className="se-tip">
          Use <code>[ATMOSPHERE:]</code> for environment and <code>[SOUND:]</code> for effects
        </span>
      </div>

      <style jsx>{`
        .script-editor-wrapper {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .se-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-wrap: wrap;
        }
        .se-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .se-hints {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          flex: 1;
        }
        .se-hint {
          font-size: 11px;
          font-family: monospace;
          opacity: 0.75;
        }
        .se-example-btn {
          padding: 4px 10px;
          font-size: 12px;
          flex-shrink: 0;
        }
        .se-editor {
          min-height: 340px;
          max-height: 520px;
          overflow: auto;
        }
        .se-disabled { opacity: 0.6; pointer-events: none; }
        .se-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 6px 12px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .se-stat {
          font-size: 11px;
          color: var(--muted);
        }
        .se-tip {
          font-size: 11px;
          color: var(--muted);
          margin-left: auto;
        }
        .se-tip code {
          font-size: 11px;
          background: var(--border);
          padding: 1px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
