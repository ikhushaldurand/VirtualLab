/**
 * Coulomb electrostatics in SI with charge stored in microcoulombs (μC).
 * Superposition: E_net = Σ k q_i / r_i^2 * r̂_i  (implemented as k q r_vec / r^3).
 */

export const K_COULOMB = 8.9875517923e9; // N·m²/C²

export function microCoulombsToCoulombs(mu) {
  return mu * 1e-6;
}

/**
 * @param {number} px
 * @param {number} py
 * @param {{ x: number; y: number; qMicroC: number }[]} charges
 * @param {number} [softM] softening distance (m) to limit singularities
 * @returns {{ Ex: number; Ey: number }}
 */
export function electricFieldAt(px, py, charges, softM = 0.04) {
  let Ex = 0;
  let Ey = 0;
  const s2 = softM * softM;
  for (const c of charges) {
    const dx = px - c.x;
    const dy = py - c.y;
    const r2 = dx * dx + dy * dy + s2;
    const r = Math.sqrt(r2);
    const qC = microCoulombsToCoulombs(c.qMicroC);
    const kqr = (K_COULOMB * qC) / (r2 * r);
    Ex += kqr * dx;
    Ey += kqr * dy;
  }
  return { Ex, Ey };
}

export function electricFieldMagnitude(px, py, charges, softM) {
  const { Ex, Ey } = electricFieldAt(px, py, charges, softM);
  return Math.hypot(Ex, Ey);
}

/**
 * Scalar potential (volts) with same softening on r.
 */
export function electricPotentialAt(px, py, charges, softM = 0.04) {
  let V = 0;
  const s = softM;
  for (const c of charges) {
    const dx = px - c.x;
    const dy = py - c.y;
    const r = Math.max(Math.hypot(dx, dy), s);
    const qC = microCoulombsToCoulombs(c.qMicroC);
    V += (K_COULOMB * qC) / r;
  }
  return V;
}
