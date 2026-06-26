// Palette definitions.
//
// A palette is { name, buckets, morph }.
//
//   name    — display label (shown in the palette selector UI)
//   buckets — array of 5 { bg, border } objects, one per activity level
//             (index 0 = empty cell, index 4 = most-active cell)
//   morph   — null OR array of 5 entries. If non-null, cells of bucket k
//             will continuously animate between buckets[k] and morph[k]
//             colors over an 8s cycle. Use null on individual entries
//             (e.g., morph[0] = null) to skip animation for that bucket.
//
// Add your own palette by importing PALETTES and extending it, or by
// passing a custom `palettes` prop to <HexCommitGrid />.

export const PALETTES = {
  corona: {
    name: 'Corona',
    buckets: [
      { bg: 'rgba(94, 234, 212, 0.06)', border: 'rgba(94, 234, 212, 0.18)' },
      { bg: 'rgba(94, 234, 212, 0.28)', border: 'rgba(94, 234, 212, 0.45)' },
      { bg: 'rgba(94, 234, 212, 0.50)', border: 'rgba(94, 234, 212, 0.65)' },
      { bg: 'rgba(94, 234, 212, 0.75)', border: 'rgba(94, 234, 212, 0.90)' },
      { bg: 'rgba(94, 234, 212, 1.00)', border: 'rgba(94, 234, 212, 1.00)' }
    ],
    morph: null
  },
  duotone: {
    name: 'Duotone',
    buckets: [
      { bg: 'rgba(94, 234, 212, 0.06)', border: 'rgba(94, 234, 212, 0.18)' },
      { bg: 'rgba(94, 234, 212, 0.28)', border: 'rgba(94, 234, 212, 0.45)' },
      { bg: 'rgba(94, 234, 212, 0.50)', border: 'rgba(94, 234, 212, 0.65)' },
      { bg: 'rgba(94, 234, 212, 0.75)', border: 'rgba(94, 234, 212, 0.90)' },
      { bg: 'rgba(94, 234, 212, 1.00)', border: 'rgba(94, 234, 212, 1.00)' }
    ],
    morph: [
      null, // empty cells stay dim — they're "no activity," not pulsing
      { bg: 'rgba(192, 132, 252, 0.28)', border: 'rgba(192, 132, 252, 0.45)' },
      { bg: 'rgba(192, 132, 252, 0.50)', border: 'rgba(192, 132, 252, 0.65)' },
      { bg: 'rgba(192, 132, 252, 0.75)', border: 'rgba(192, 132, 252, 0.90)' },
      { bg: 'rgba(192, 132, 252, 1.00)', border: 'rgba(192, 132, 252, 1.00)' }
    ]
  },
  ember: {
    name: 'Ember',
    buckets: [
      { bg: 'rgba(251, 191, 36, 0.06)', border: 'rgba(251, 191, 36, 0.18)' },
      { bg: 'rgba(251, 191, 36, 0.30)', border: 'rgba(251, 191, 36, 0.50)' },
      { bg: 'rgba(251, 113, 133, 0.55)', border: 'rgba(251, 113, 133, 0.75)' },
      { bg: 'rgba(244, 63, 94, 0.80)', border: 'rgba(244, 63, 94, 1.00)' },
      { bg: 'rgba(220, 38, 38, 1.00)', border: 'rgba(220, 38, 38, 1.00)' }
    ],
    morph: [
      null,
      { bg: 'rgba(220, 38, 38, 0.30)', border: 'rgba(220, 38, 38, 0.50)' },
      { bg: 'rgba(251, 191, 36, 0.55)', border: 'rgba(251, 191, 36, 0.75)' },
      { bg: 'rgba(251, 191, 36, 0.80)', border: 'rgba(251, 191, 36, 1.00)' },
      { bg: 'rgba(251, 191, 36, 1.00)', border: 'rgba(251, 191, 36, 1.00)' }
    ]
  }
};
