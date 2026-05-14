import Matter from "matter-js";
import { attachBodyMeta, makeVlId } from "../physics/bodyFactory.js";

const { Bodies, Composite } = Matter;

export function spawnExperimentBodies(world, preset, width, height) {
  if (preset === "electric-field") {
    const r = 22;
    const plus = Bodies.circle(width * 0.28, height * 0.5, r, {
      isStatic: true,
      label: makeVlId(),
      friction: 0.3,
      restitution: 0.4,
      render: {
        fillStyle: "#FF3B30",
        strokeStyle: "#b91c1c",
        lineWidth: 2,
      },
    });
    const minus = Bodies.circle(width * 0.72, height * 0.5, r, {
      isStatic: true,
      label: makeVlId(),
      friction: 0.3,
      restitution: 0.4,
      render: {
        fillStyle: "#1E90FF",
        strokeStyle: "#187bcd",
        lineWidth: 2,
      },
    });
    attachBodyMeta(plus, "circle");
    attachBodyMeta(minus, "circle");
    const test = Bodies.circle(width * 0.5, height * 0.28, 12, {
      isStatic: false,
      label: makeVlId(),
      friction: 0.05,
      restitution: 0.6,
      density: 0.002,
      render: {
        fillStyle: "#fbbf24",
        strokeStyle: "#b45309",
        lineWidth: 1,
      },
    });
    attachBodyMeta(test, "circle");
    Composite.add(world, [plus, minus, test]);
    return;
  }

  if (preset === "buoyancy") {
    const waterH = height * 0.42;
    const waterY = height - waterH / 2 - 8;
    const water = Bodies.rectangle(width / 2, waterY, width - 40, waterH, {
      isStatic: true,
      label: makeVlId(),
      friction: 0.4,
      render: {
        fillStyle: "rgba(30, 144, 255, 0.28)",
        strokeStyle: "rgba(30, 144, 255, 0.45)",
        lineWidth: 1,
      },
    });
    attachBodyMeta(water, "rectangle");
    const blockW = 72;
    const blockH = 56;
    const block = Bodies.rectangle(width * 0.5, waterY - waterH * 0.35, blockW, blockH, {
      isStatic: false,
      label: makeVlId(),
      friction: 0.5,
      restitution: 0.05,
      density: 0.0018,
      render: {
        fillStyle: "#94a3b8",
        strokeStyle: "#475569",
        lineWidth: 2,
      },
    });
    attachBodyMeta(block, "box");
    Composite.add(world, [water, block]);
  }
}
