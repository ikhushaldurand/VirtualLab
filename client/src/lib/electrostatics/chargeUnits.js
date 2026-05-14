/**
 * @param {number} absVal  |q| in the chosen unit
 * @param {'μC' | 'nC' | 'C'} unit
 * @param {boolean} positive
 * @returns {number} signed microcoulombs
 */
export function signedMicroCFromInput(absVal, unit, positive) {
  const sign = positive ? 1 : -1;
  const v = Math.abs(absVal);
  if (unit === "nC") return sign * v * 1e-3;
  if (unit === "C") return sign * v * 1e6;
  return sign * v;
}
