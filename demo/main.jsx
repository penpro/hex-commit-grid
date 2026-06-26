import React from 'react';
import { createRoot } from 'react-dom/client';
import { HexCommitGrid } from '../src/index.js';
import '../src/styles.css';

function Demo() {
  return (
    <div className="demo-shell">
      <h1>hex-commit-grid</h1>
      <p>
        Live data fetched from GitHub for <code>penpro</code>. Hover a
        hex to unroll. Switch palettes to see the corona ↔ violet morph.
      </p>
      <HexCommitGrid username="penpro" defaultPalette="duotone" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
