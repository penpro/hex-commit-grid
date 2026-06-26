// 24-triangle flat-top hex with per-triangle unroll animation + palette
// morph. Renders a 280×78 SVG canvas. The hex sits centered in the
// canvas; when a parent with class .hcg-card is hovered, each triangle
// CSS-transforms (translate + rotate around its source centroid) to a
// target position in a horizontal alternating-up/down strip. Staggered
// 14ms per triangle for a sequential "unroll" feel.
//
// Color: paths get fill/stroke from the active palette. If the palette
// defines a morph color for a cell's bucket, the path gets data-pulse=1
// and CSS variables (--c-from, --c-to, --phase) that the hcg-cell-pulse
// @keyframes rule in styles.css uses to cycle colors infinitely.
//
// Geometry note: flat-top hex (vertices start at 0°, not -90°). This
// 30° offset from pointy-top means the hex's flat sides face the
// neighbors when 6 hexes are arranged at 60° intervals around a center
// — true honeycomb tiling.
//
// Cell ordering: indices 0..17 = outer ring (3 sub-triangles per wedge,
// clockwise from the wedge at 0°); 18..23 = inner hex. Consumers pass a
// buckets[] array of length 24 where buckets[0..17] is the older 18 days
// and buckets[18..23] is the newest 6 days — so active repos light up
// the inner core, and when the hex unrolls older days end up at the LEFT
// of the strip and newer days at the RIGHT (chronological reading).

const HEX_SIZE = 78;
const SVG_WIDTH = 280;
const SVG_HEIGHT = HEX_SIZE;
const STAGGER_MS = 14;
const TRANSITION_MS = 540;
const PULSE_SECONDS = 8;

function computeHexCells(size, cx, cy) {
  const R = size / 2;
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    verts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }
  const C = { x: cx, y: cy };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const fmt = (n) => n.toFixed(2);

  const buildCell = (a, b, c) => {
    const ccx = (a.x + b.x + c.x) / 3;
    const ccy = (a.y + b.y + c.y) / 3;
    return {
      path: `M ${fmt(a.x)} ${fmt(a.y)} L ${fmt(b.x)} ${fmt(b.y)} L ${fmt(c.x)} ${fmt(c.y)} Z`,
      centroid: { x: ccx, y: ccy },
      angle: Math.atan2(a.y - ccy, a.x - ccx)
    };
  };

  const outer = [];
  const inner = [];
  for (let k = 0; k < 6; k++) {
    const Vk = verts[k];
    const Vk1 = verts[(k + 1) % 6];
    const ML = mid(C, Vk);
    const MR = mid(C, Vk1);
    const MO = mid(Vk, Vk1);
    outer.push(buildCell(ML, Vk, MO));
    outer.push(buildCell(ML, MO, MR));
    outer.push(buildCell(MO, Vk1, MR));
    inner.push(buildCell(C, ML, MR));
  }
  return [...outer, ...inner];
}

function computeStripTargets(svgWidth, svgHeight) {
  const b = 19.5;
  const totalWidth = 23 * (b / 2) + b;
  const leftEdge = (svgWidth - totalWidth) / 2;
  const center0 = leftEdge + b / 2;
  const cy = svgHeight / 2;
  return Array.from({ length: 24 }, (_, k) => {
    const cx = center0 + k * (b / 2);
    const isUp = k % 2 === 0;
    return {
      cx,
      cy,
      angle: isUp ? -Math.PI / 2 : Math.PI / 2
    };
  });
}

function normalizeAngle(rad) {
  let a = rad;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

const cells = computeHexCells(HEX_SIZE, SVG_WIDTH / 2, SVG_HEIGHT / 2);
const targets = computeStripTargets(SVG_WIDTH, SVG_HEIGHT);
const transforms = cells.map((cell, k) => {
  const tgt = targets[k];
  return {
    centroid: cell.centroid,
    dx: tgt.cx - cell.centroid.x,
    dy: tgt.cy - cell.centroid.y,
    rotationDeg: (normalizeAngle(tgt.angle - cell.angle) * 180) / Math.PI,
    delayMs: k * STAGGER_MS,
    phaseSeconds: -((k * PULSE_SECONDS) / 24)
  };
});

export default function HexCell({ buckets, palette, ariaLabel }) {
  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block' }}
    >
      {cells.map((cell, k) => {
        const bucket = buckets[k];
        const from = palette.buckets[bucket] || palette.buckets[0];
        const to = palette.morph ? palette.morph[bucket] : null;
        const t = transforms[k];
        return (
          <path
            key={k}
            d={cell.path}
            fill={from.bg}
            stroke={from.border}
            strokeWidth={0.5}
            data-pulse={to ? '1' : '0'}
            style={{
              transformOrigin: `${t.centroid.x.toFixed(2)}px ${t.centroid.y.toFixed(2)}px`,
              transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${t.delayMs}ms`,
              '--tx': `${t.dx.toFixed(2)}px`,
              '--ty': `${t.dy.toFixed(2)}px`,
              '--tr': `${t.rotationDeg.toFixed(1)}deg`,
              '--c-from': from.bg,
              '--c-to': to ? to.bg : from.bg,
              '--c-from-border': from.border,
              '--c-to-border': to ? to.border : from.border,
              '--phase': `${t.phaseSeconds.toFixed(2)}s`
            }}
          />
        );
      })}
    </svg>
  );
}
