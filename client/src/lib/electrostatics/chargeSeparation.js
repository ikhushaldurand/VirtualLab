/**
 * Separation distance and midpoint used for dipole-style analytics.
 * Uses |q|-weighted centroids of positive vs negative charges; if only one
 * polarity exists, falls back to the first two charges in the array.
 *
 * @param {{ x: number; y: number; qMicroC: number }[]} charges
 * @returns {{ d: number; mx: number; my: number }} d = separation (m), (mx,my) = midpoint (m)
 */
export function getChargeSeparationMidpoint(charges) {
  if (!charges.length) return { d: 0, mx: 0, my: 0 };

  const pos = charges.filter((c) => c.qMicroC > 0);
  const neg = charges.filter((c) => c.qMicroC < 0);

  function centroid(list) {
    let wsum = 0;
    for (const c of list) wsum += Math.abs(c.qMicroC);
    if (wsum === 0) return { x: list[0].x, y: list[0].y };
    let x = 0;
    let y = 0;
    for (const c of list) {
      const w = Math.abs(c.qMicroC) / wsum;
      x += c.x * w;
      y += c.y * w;
    }
    return { x, y };
  }

  if (pos.length && neg.length) {
    const p = centroid(pos);
    const n = centroid(neg);
    const d = Math.hypot(p.x - n.x, p.y - n.y);
    return {
      d,
      mx: (p.x + n.x) / 2,
      my: (p.y + n.y) / 2,
    };
  }

  if (charges.length < 2) {
    return { d: 0, mx: charges[0].x, my: charges[0].y };
  }

  const a = charges[0];
  const b = charges[1];
  return {
    d: Math.hypot(a.x - b.x, a.y - b.y),
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}
