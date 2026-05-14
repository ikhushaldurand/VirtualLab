/** SI constants */
export const G = 9.81;

/** Default seawater / fresh water (kg/m³) */
export const DEFAULT_RHO_FLUID = 1000;

/**
 * Fraction of body height (AABB) that lies in the fluid band [surfaceY, bottomY].
 * Canvas y increases downward; fluid is y >= surfaceY.
 * @param {{ bounds: { min: { y: number }; max: { y: number } } }} body
 */
export function submergedHeightFraction(body, surfaceY, bottomY) {
  const { min, max } = body.bounds;
  if (max.y <= surfaceY) return 0;
  if (min.y >= bottomY) return 0;
  const h = Math.max(1e-9, max.y - min.y);
  const subTop = Math.max(min.y, surfaceY);
  const subBottom = Math.min(max.y, bottomY);
  const subH = Math.max(0, subBottom - subTop);
  return Math.min(1, subH / h);
}

/**
 * @param {number} Fb
 * @param {number} W
 * @param {number} submergedFraction
 */
export function classifyBuoyancyState(Fb, W, submergedFraction) {
  if (submergedFraction < 0.04) return "In air";
  const ref = Math.max(W, Fb, 1e-6);
  const net = Fb - W;
  const tol = ref * 0.04;
  if (Math.abs(net) < tol) return "Neutral";
  if (net > tol) return "Floating";
  return "Sinking";
}
