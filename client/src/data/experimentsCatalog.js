/**
 * Inbuilt experiment library metadata + Matter.js preset ids.
 * Preset bodies are spawned in `lib/experiments/spawnExperimentBodies.js`.
 */

export const EXPERIMENT_CATEGORIES = {
  ALL: "all",
  MECHANICS: "mechanics",
  FLUIDS: "fluids",
};

export const EXPERIMENTS = [
  {
    id: "electric-field",
    title: "Electric Field",
    tag: "Physics",
    category: EXPERIMENT_CATEGORIES.MECHANICS,
    description:
      "Visualize electric field lines and observe the force on a test charge placed in the field.",
    preset: "electric-field",
  },
  {
    id: "buoyancy",
    title: "Buoyancy",
    tag: "Physics",
    category: EXPERIMENT_CATEGORIES.FLUIDS,
    description:
      "Explore buoyant force, weight, and how objects float or sink in fluids.",
    preset: "buoyancy",
  },
];

export function getExperimentById(id) {
  return EXPERIMENTS.find((e) => e.id === id) ?? null;
}
