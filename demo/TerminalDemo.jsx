// TerminalDemo — the YouTube-demo scaffolding.
//
// Landing screen with a "Run Demo" button. On click it plays a scripted
// fake terminal walkthrough (npm install -> write App.jsx -> npm run dev
// -> Vite ready) and then hands off to a faux browser window that renders
// the *real* <HexCommitGrid /> component as the payoff.
//
// Everything here is presentation-only. It never ships with the package —
// it lives under demo/ and is driven by Vite (`npm run dev`).

import React, { useCallback, useReducer, useRef, useState } from 'react';
import { HexCommitGrid } from '../src/index.js';
import '../src/styles.css';
import './demo.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Progressive, regex-based highlighters. They re-run on every keystroke,
// so partial tokens just render plain until they complete — which reads
// fine and keeps the typing engine trivial.
function highlightCmd(text) {
  return escapeHtml(text).replace(
    /(\s)(-{1,2}[\w-]+)/g,
    '$1<span class="flag">$2</span>'
  );
}

function highlightCode(text) {
  let h = escapeHtml(text);
  // strings
  h = h.replace(/('[^']*'|"[^"]*")/g, '<span class="str">$1</span>');
  // keywords
  h = h.replace(
    /\b(import|from|export|default|function|return|const)\b/g,
    '<span class="kw">$1</span>'
  );
  // JSX tag names
  h = h.replace(/(&lt;\/?)([A-Z][\w]*)/g, '$1<span class="tag">$2</span>');
  return h;
}

// Each line is { kind, cls, text }. `kind` picks the renderer.
function renderLine(line) {
  switch (line.kind) {
    case 'prompt':
      return (
        '<span class="seg-path">~/portfolio</span> ' +
        '<span class="seg-branch">main</span> ' +
        '<span class="seg-sigil">❯</span> ' +
        highlightCmd(line.text)
      );
    case 'cmd':
      return highlightCmd(line.text);
    case 'code':
      return highlightCode(line.text);
    case 'html':
      return line.text; // trusted, author-provided markup
    default:
      return escapeHtml(line.text);
  }
}

export default function TerminalDemo() {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | typing | done
  const [status, setStatus] = useState('');

  // Source of truth for terminal output; we force re-renders rather than
  // cloning arrays on every keystroke.
  const linesRef = useRef([]);
  const cursorRef = useRef(-1);
  const termRef = useRef(null);
  const runIdRef = useRef(0);
  const [, force] = useReducer((x) => x + 1, 0);

  const flush = useCallback(() => {
    force();
    // keep newest output in view
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const play = useCallback(async () => {
    const runId = ++runIdRef.current;
    const alive = () => runId === runIdRef.current;

    linesRef.current = [];
    cursorRef.current = -1;
    setStarted(true);
    setPhase('typing');
    setStatus('booting shell…');
    flush();

    // --- engine primitives -------------------------------------------
    const push = (kind, text = '', cls = '') => {
      linesRef.current.push({ kind, text, cls });
      const idx = linesRef.current.length - 1;
      flush();
      return idx;
    };
    const setCursor = (idx) => {
      cursorRef.current = idx;
      flush();
    };
    const type = async (kind, text, speed = 34) => {
      const idx = push(kind, '');
      setCursor(idx);
      for (let i = 0; i < text.length; i++) {
        if (!alive()) return idx;
        linesRef.current[idx].text += text[i];
        flush();
        // small natural jitter on spaces/newlines
        await sleep(speed + (text[i] === ' ' ? 12 : 0));
      }
      return idx;
    };
    const out = (text = '', cls = '') => push('out', text, cls);
    const spin = async (label, ms = 1200) => {
      const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      const idx = push('out', '', 'tl-accent');
      cursorRef.current = -1;
      let t = 0;
      let f = 0;
      while (t < ms) {
        if (!alive()) return idx;
        linesRef.current[idx].text = `${frames[f % frames.length]} ${label}`;
        flush();
        await sleep(80);
        t += 80;
        f++;
      }
      // remove the spinner line once done
      linesRef.current.splice(idx, 1);
      flush();
      return idx;
    };

    await sleep(450);
    if (!alive()) return;

    // --- 1. npm install ----------------------------------------------
    setStatus('installing the package…');
    await type('prompt', 'npm install hex-commit-grid', 40);
    setCursor(-1);
    await sleep(300);
    out('');
    await spin('reaching registry.npmjs.org', 1300);
    if (!alive()) return;
    out('added 3 packages, and audited 4 packages in 2s', 'tl-out');
    out('');
    out('1 package is looking for funding', 'tl-dim');
    out('  run `npm fund` for details', 'tl-dim');
    out('');
    out('found 0 vulnerabilities', 'tl-ok');
    await sleep(700);
    if (!alive()) return;

    // --- 2. write the config / usage ---------------------------------
    setStatus('wiring it into the app…');
    out('');
    await type('prompt', 'nvim src/App.jsx', 40);
    setCursor(-1);
    await sleep(350);
    out('');
    out('// src/App.jsx', 'tl-dim');
    const code = [
      "import { HexCommitGrid } from 'hex-commit-grid';",
      "import 'hex-commit-grid/styles.css';",
      '',
      'export default function App() {',
      '  return <HexCommitGrid username="penpro" defaultPalette="duotone" />;',
      '}'
    ];
    for (const ln of code) {
      if (!alive()) return;
      await type('code', ln, ln ? 16 : 0);
    }
    setCursor(-1);
    await sleep(250);
    out('', '');
    out('"src/App.jsx" 6L written', 'tl-dim');
    await sleep(650);
    if (!alive()) return;

    // --- 3. run the dev server ---------------------------------------
    setStatus('starting the dev server…');
    out('');
    await type('prompt', 'npm run dev', 42);
    setCursor(-1);
    await sleep(450);
    out('');
    out('  VITE v5.0.0  ready in 312 ms', 'tl-accent');
    out('');
    out('  ➜  Local:   http://localhost:5173/', 'tl-out');
    out('  ➜  Network: use --host to expose', 'tl-dim');
    out('  ➜  press h + enter to show help', 'tl-dim');
    await sleep(700);
    if (!alive()) return;

    out('');
    out('  opening http://localhost:5173/ …', 'tl-warn');
    setCursor(linesRef.current.length - 1);
    setStatus('opening the browser…');
    await sleep(1100);
    if (!alive()) return;

    setCursor(-1);
    setPhase('done');
    setStatus('');
  }, [flush]);

  const replay = useCallback(() => {
    setPhase('idle');
    play();
  }, [play]);

  const lines = linesRef.current;

  return (
    <div className="stage">
      <header className={`hero${started ? ' is-hidden' : ''}`}>
        <div className="hero-kicker">npm · react · svg</div>
        <h1>hex-commit-grid</h1>
        <p>
          An animated honeycomb of your GitHub commit activity. Press play
          for a guided walkthrough — install, configure, and watch the real
          component render live.
        </p>
        <button className="run-btn" onClick={play}>
          <span className="tri">▶</span> Run Demo
        </button>
      </header>

      {started && (
        <section className="win term-win" aria-label="terminal walkthrough">
          <div className="win-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="win-title">zsh — ~/portfolio</span>
          </div>
          <div className="term" ref={termRef}>
            {lines.map((line, i) => (
              <span
                key={i}
                className={`term-line tl-${line.kind} ${line.cls}`}
                dangerouslySetInnerHTML={{
                  __html:
                    renderLine(line) +
                    (cursorRef.current === i
                      ? '<span class="cursor"></span>'
                      : '')
                }}
              />
            ))}
          </div>
        </section>
      )}

      {started && status && <div className="status-strip">{status}</div>}

      {phase === 'done' && (
        <section className="win browser" aria-label="rendered component">
          <div className="win-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="url-bar">
              <span className="lock">🔒</span> localhost:5173
            </span>
          </div>
          <div className="browser-body">
            <div className="fade-late" style={{ width: '100%', maxWidth: 680 }}>
              <HexCommitGrid username="penpro" defaultPalette="duotone" />
            </div>
          </div>
        </section>
      )}

      {phase === 'done' && (
        <div className="toolbar">
          <button className="ghost-btn" onClick={replay}>
            ↻ Replay walkthrough
          </button>
        </div>
      )}
    </div>
  );
}
