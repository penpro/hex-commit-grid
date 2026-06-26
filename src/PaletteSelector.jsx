// Palette selector: a row of small swatch+name buttons. Renders one
// button per palette in the `palettes` prop. The button shows 1-2
// color swatches (the bucket-3 from/to colors) so the user can
// preview each palette without applying it.

export default function PaletteSelector({ palettes, value, onChange }) {
  return (
    <div
      className="hcg-palette-selector"
      role="radiogroup"
      aria-label="Color palette"
    >
      {Object.entries(palettes).map(([key, p]) => {
        const active = value === key;
        const swatchFrom = p.buckets[3];
        const swatchTo = p.morph?.[3] || null;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            title={p.name}
            className={`hcg-palette-btn${active ? ' active' : ''}`}
          >
            <span className="hcg-palette-swatch-row">
              <span
                className="hcg-palette-swatch"
                style={{
                  background: swatchFrom.bg,
                  border: `1px solid ${swatchFrom.border}`
                }}
              />
              {swatchTo && (
                <span
                  className="hcg-palette-swatch"
                  style={{
                    background: swatchTo.bg,
                    border: `1px solid ${swatchTo.border}`
                  }}
                />
              )}
            </span>
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
