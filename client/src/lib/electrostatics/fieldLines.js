import { electricFieldAt } from "./electricField.js";

const DEFAULT_STEP_M = 0.045;
const DEFAULT_MAX_STEPS = 420;
const DEFAULT_NEAR_NEG_M = 0.11;

function unit(Ex, Ey) {
  const m = Math.hypot(Ex, Ey);
  if (m < 1e-24) return { x: 0, y: 0 };
  return { x: Ex / m, y: Ey / m };
}

/**
 * Euler stepping along +E direction from a seed near a positive charge.
 * @param {{ x: number; y: number }} start
 * @param {{ x: number; y: number; qMicroC: number }[]} charges
 * @param {{ minX: number; maxX: number; minY: number; maxY: number }} bounds
 * @param {{ stepM?: number; maxSteps?: number; nearNegM?: number }} [options]
 */
export function traceFieldLine(start, charges, bounds, options = {}) {
  const stepM = options.stepM ?? DEFAULT_STEP_M;
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const nearNegM = options.nearNegM ?? DEFAULT_NEAR_NEG_M;

  const points = [{ x: start.x, y: start.y }];
  let { x, y } = start;

  for (let i = 0; i < maxSteps; i++) {
    const { Ex, Ey } = electricFieldAt(x, y, charges);
    const u = unit(Ex, Ey);
    if (u.x === 0 && u.y === 0) break;

    x += stepM * u.x;
    y += stepM * u.y;
    points.push({ x, y });

    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
      break;
    }

    for (const c of charges) {
      if (c.qMicroC >= 0) continue;
      if (Math.hypot(x - c.x, y - c.y) < nearNegM) {
        return points;
      }
    }
  }

  return points;
}

/**
 * @param {{ x: number; y: number; qMicroC: number }[]} charges
 * @param {{ minX: number; maxX: number; minY: number; maxY: number }} bounds
 * @param {number} [seedsPerPositive]
 * @returns {{ x: number; y: number }[][]}
 */
export function buildFieldLines(charges, bounds, seedsPerPositive = 16) {
  const lines = [];
  const positives = charges.filter((c) => c.qMicroC > 0);
  const seedR = 0.07;

  for (const p of positives) {
    for (let k = 0; k < seedsPerPositive; k++) {
      const ang = (2 * Math.PI * k) / seedsPerPositive;
      const sx = p.x + seedR * Math.cos(ang);
      const sy = p.y + seedR * Math.sin(ang);
      const line = traceFieldLine({ x: sx, y: sy }, charges, bounds, {
        stepM: DEFAULT_STEP_M,
        maxSteps: DEFAULT_MAX_STEPS,
        nearNegM: DEFAULT_NEAR_NEG_M,
      });
      if (line.length > 2) lines.push(line);
    }
  }

  return lines;
}
