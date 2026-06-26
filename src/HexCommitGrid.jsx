// HexCommitGrid — the main entry component.
//
// Renders a 6-hex honeycomb ring showing N days of commit activity for
// a GitHub user's most-recently-pushed repos. Each repo is a flat-top
// hex of 24 triangles; the inner 6 triangles = newest 6 days, the outer
// 18 = older 18 days. Hover any hex to unroll the 24 triangles into a
// horizontal strip with a staggered per-triangle animation.
//
// Required props:
//   username  : GitHub username to fetch repos for
//
// Optional props (with defaults):
//   repoCount        : 6        — number of repos to show (max 6 in the ring)
//   days             : 24       — days of activity per repo
//   palettes         : PALETTES — palette dictionary (corona, duotone, ember)
//   defaultPalette   : 'corona' — initial palette key
//   localStorageKey  : 'hex-commit-grid-palette' — set to null to disable persistence
//   cacheTtlMs       : 3600000  — sessionStorage cache TTL for repo data
//   title            : 'Recent shipping' — text in the header (set null to hide)
//   showPaletteSelector : true
//   showFooter       : true
//   className        : ''       — extra class on the wrapper

import { useEffect, useState } from 'react';
import HexCell from './HexCell.jsx';
import PaletteSelector from './PaletteSelector.jsx';
import { PALETTES } from './palettes.js';
import {
  buildDays,
  bucketOf,
  fetchRepos,
  fetchRepoCommits,
  relativeTime
} from './utils.js';

function readCache(key, ttlMs) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.repos;
  } catch {
    return null;
  }
}

function writeCache(key, repos) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), repos }));
  } catch {
    // sessionStorage can be unavailable.
  }
}

function readPalettePref(storageKey, palettes, fallback) {
  if (!storageKey) return fallback;
  try {
    const v = localStorage.getItem(storageKey);
    return v && palettes[v] ? v : fallback;
  } catch {
    return fallback;
  }
}

function writePalettePref(storageKey, value) {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // localStorage can be unavailable.
  }
}

export default function HexCommitGrid({
  username,
  repoCount = 6,
  days = 24,
  palettes = PALETTES,
  defaultPalette = 'corona',
  localStorageKey = 'hex-commit-grid-palette',
  cacheTtlMs = 60 * 60 * 1000,
  title = 'Recent shipping',
  showPaletteSelector = true,
  showFooter = true,
  className = ''
}) {
  if (!username) {
    throw new Error('<HexCommitGrid /> requires a `username` prop');
  }

  const cacheKey = `hex-commit-grid-${username}-v1`;

  const [state, setState] = useState({ status: 'loading', repos: [] });
  const [paletteKey, setPaletteKey] = useState(() =>
    readPalettePref(localStorageKey, palettes, defaultPalette)
  );
  const palette = palettes[paletteKey] || palettes[defaultPalette];

  useEffect(() => {
    writePalettePref(localStorageKey, paletteKey);
  }, [paletteKey, localStorageKey]);

  useEffect(() => {
    const cached = readCache(cacheKey, cacheTtlMs);
    if (cached) {
      setState({ status: 'ready', repos: cached });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const repos = await fetchRepos(username, repoCount);
        const results = await Promise.all(
          repos.map((repo) => fetchRepoCommits(repo, days).catch(() => null))
        );
        const filtered = results.filter(Boolean);
        if (cancelled) return;
        writeCache(cacheKey, filtered);
        setState({ status: 'ready', repos: filtered });
      } catch {
        if (cancelled) return;
        setState({ status: 'error', repos: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, repoCount, days, cacheKey, cacheTtlMs]);

  const { status, repos } = state;
  const totalCommits = repos.reduce(
    (sum, r) => sum + Object.values(r.counts).reduce((a, b) => a + b, 0),
    0
  );
  const meta =
    status === 'ready'
      ? `${totalCommits} commit${totalCommits === 1 ? '' : 's'} across ${repos.length} repo${repos.length === 1 ? '' : 's'}`
      : status === 'error'
        ? 'GitHub API unreachable'
        : 'fetching...';

  return (
    <div className={`hex-commit-grid${className ? ' ' + className : ''}`}>
      {title !== null && (
        <div className="hcg-header">
          <h3>{title}</h3>
          <span className="hcg-meta">{meta}</span>
        </div>
      )}

      {showPaletteSelector && Object.keys(palettes).length > 1 && (
        <PaletteSelector
          palettes={palettes}
          value={paletteKey}
          onChange={setPaletteKey}
        />
      )}

      {status === 'ready' && repos.length > 0 && (
        <HexFlower repos={repos} palette={palette} days={days} />
      )}

      {showFooter && (
        <div className="hcg-footer">
          <span>{days} days ending at each repo&apos;s last commit · hover to unroll</span>
          <span className="hcg-legend">
            less
            {palette.buckets.map((f, i) => (
              <span
                key={i}
                className="hcg-legend-cell"
                style={{
                  background: f.bg,
                  border: `1px solid ${f.border}`
                }}
              />
            ))}
            more
          </span>
          <a
            className="hcg-link"
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            github.com/{username} ↗
          </a>
        </div>
      )}
    </div>
  );
}

function HexFlower({ repos, palette, days }) {
  const hexSize = 78;
  const R = hexSize / 2;
  const sqrt3 = Math.sqrt(3);
  const ringR = R * sqrt3;
  const W = 460;
  const H = 320;
  const cx = W / 2;
  const cy = H / 2;
  const labelOffset = 18;

  const layout = Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    return {
      x: ringR * Math.cos(angle),
      y: ringR * Math.sin(angle),
      angle
    };
  });

  const positions = repos.slice(0, 6).map((_, i) => {
    const p = layout[i];
    const hexX = cx + p.x;
    const hexY = cy + p.y;
    const labelDist = R + labelOffset;
    return {
      angle: p.angle,
      hexX,
      hexY,
      labelX: hexX + labelDist * Math.cos(p.angle),
      labelY: hexY + labelDist * Math.sin(p.angle),
      lineStartX: hexX + (R - 1) * Math.cos(p.angle),
      lineStartY: hexY + (R - 1) * Math.sin(p.angle),
      lineEndX: hexX + (R + labelOffset - 4) * Math.cos(p.angle),
      lineEndY: hexY + (R + labelOffset - 4) * Math.sin(p.angle)
    };
  });

  return (
    <div className="hcg-flower">
      <svg
        className="hcg-flower-svg"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        {positions.map((p, i) => (
          <line
            key={i}
            x1={p.lineStartX}
            y1={p.lineStartY}
            x2={p.lineEndX}
            y2={p.lineEndY}
            stroke="var(--hcg-line-color)"
            strokeWidth={0.6}
            strokeDasharray="2 3"
          />
        ))}
      </svg>

      {repos.slice(0, 6).map((repo, i) => {
        const p = positions[i];
        const cosA = Math.cos(p.angle);
        const alignClass =
          cosA > 0.3
            ? 'hcg-label-left'
            : cosA < -0.3
              ? 'hcg-label-right'
              : 'hcg-label-center';
        return (
          <div
            key={`label-${repo.fullName}`}
            className={`hcg-label ${alignClass}`}
            style={{ left: p.labelX, top: p.labelY }}
          >
            <div className="hcg-label-name" title={repo.name}>
              {repo.name}
            </div>
            <div className="hcg-label-time">
              {relativeTime(repo.pushedAt)}
            </div>
          </div>
        );
      })}

      {repos.slice(0, 6).map((repo, i) => {
        const p = positions[i];
        const repoDays = buildDays(new Date(repo.pushedAt), days);
        const buckets = repoDays.map((day) =>
          bucketOf(repo.counts[day] || 0)
        );
        const total = Object.values(repo.counts).reduce(
          (a, b) => a + b,
          0
        );
        return (
          <div
            key={`hex-${repo.fullName}`}
            className="hcg-card"
            style={{
              '--hcg-cx': `${p.hexX}px`,
              '--hcg-cy': `${p.hexY}px`
            }}
            onClick={() =>
              window.open(
                repo.htmlUrl,
                '_blank',
                'noopener,noreferrer'
              )
            }
            title={`${repo.name} — ${total} commit${total === 1 ? '' : 's'} in ${days}-day window. Click for repo.`}
          >
            <div className="hcg-card-bg" />
            <div className="hcg-card-svg-wrap">
              <HexCell
                buckets={buckets}
                palette={palette}
                ariaLabel={`${repo.name}: ${days}-day activity hex, ${total} commits`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
