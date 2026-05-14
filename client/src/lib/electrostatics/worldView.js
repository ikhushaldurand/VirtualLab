/** Vertical half-extent of the visible world (meters). */
export const WORLD_HALF_Y = 4;

export function worldExtents(canvasW, canvasH) {
  const hy = WORLD_HALF_Y;
  const hx = (canvasW / canvasH) * hy;
  return { hx, hy };
}

/**
 * @param {number} px
 * @param {number} py
 * @param {number} W
 * @param {number} H
 * @param {{ x: number; y: number }} viewCenter
 */
export function pixelToWorld(px, py, W, H, viewCenter) {
  const { hx, hy } = worldExtents(W, H);
  return {
    x: (px / W - 0.5) * 2 * hx + viewCenter.x,
    y: (0.5 - py / H) * 2 * hy + viewCenter.y,
  };
}

export function worldToPixel(wx, wy, W, H, viewCenter) {
  const { hx, hy } = worldExtents(W, H);
  return {
    x: ((wx - viewCenter.x) / (2 * hx) + 0.5) * W,
    y: (0.5 - (wy - viewCenter.y) / (2 * hy)) * H,
  };
}

/** Fixed generous bounds for field-line termination (world meters). */
export const FIELD_LINE_BOUNDS = {
  minX: -18,
  maxX: 18,
  minY: -18,
  maxY: 18,
};
