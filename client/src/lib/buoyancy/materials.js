export const MATERIALS = [
  { id: "wood", label: "Wood", density: 600 },
  { id: "iron", label: "Iron", density: 7800 },
  { id: "plastic", label: "Plastic", density: 950 },
  { id: "custom", label: "Custom", density: null },
];

export function materialDensity(id) {
  const m = MATERIALS.find((x) => x.id === id);
  return m?.density ?? null;
}
