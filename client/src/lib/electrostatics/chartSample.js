import { electricFieldMagnitude, electricPotentialAt } from "./electricField.js";
import { getChargeSeparationMidpoint } from "./chargeSeparation.js";

/**
 * @param {{ x: number; y: number; qMicroC: number }[]} charges
 * @returns {{ distance: number; eMag: number; vPot: number }}
 */
export function sampleDistanceChartPoint(charges) {
  const { d, mx, my } = getChargeSeparationMidpoint(charges);
  return {
    distance: d,
    eMag: electricFieldMagnitude(mx, my, charges),
    vPot: electricPotentialAt(mx, my, charges),
  };
}
