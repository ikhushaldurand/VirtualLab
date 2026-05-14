/** 2D Matter.js–friendly presets (density scales with classroom feel, not SI volume). */

export const ROOM_MATERIAL_PRESETS = {
  steel: {
    label: "Steel",
    friction: 0.22,
    restitution: 0.18,
    density: 0.0085,
  },
  wood: {
    label: "Wood",
    friction: 0.52,
    restitution: 0.12,
    density: 0.002,
  },
  ice: {
    label: "Ice",
    friction: 0.04,
    restitution: 0.38,
    density: 0.0011,
  },
  rubber: {
    label: "Rubber",
    friction: 0.88,
    restitution: 0.82,
    density: 0.0016,
  },
};
