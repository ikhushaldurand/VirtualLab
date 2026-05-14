import Matter from "matter-js";

const { Body } = Matter;

export function serializeDynamicBody(body) {
  if (!body?.label?.startsWith("vl-")) return null;
  const kind = body.plugin?.virtualLab?.kind || body.name || "box";
  return {
    id: body.label,
    kind,
    x: body.position.x,
    y: body.position.y,
    angle: body.angle,
    vx: body.velocity.x,
    vy: body.velocity.y,
    angularVelocity: body.angularVelocity,
    circleRadius: body.circleRadius || null,
    width: body.circleRadius ? null : body.bounds.max.x - body.bounds.min.x,
    height: body.circleRadius ? null : body.bounds.max.y - body.bounds.min.y,
    vertices: body.vertices?.map((v) => ({ x: v.x, y: v.y })),
    mass: body.mass,
    friction: body.friction,
    restitution: body.restitution,
    density: body.density,
    fill: body.render?.fillStyle || "#1E90FF",
  };
}

export function serializeAllDynamic(world) {
  return Matter.Composite.allBodies(world)
    .map(serializeDynamicBody)
    .filter(Boolean);
}

export function applySyncFrame(world, bodies) {
  if (!Array.isArray(bodies)) return;
  const all = Matter.Composite.allBodies(world);
  for (const snap of bodies) {
    if (!snap?.id?.startsWith("vl-")) continue;
    const body = all.find((b) => b.label === snap.id);
    if (!body) continue;
    Body.setPosition(body, { x: snap.x, y: snap.y }, true);
    Body.setAngle(body, snap.angle, true);
    if (typeof snap.vx === "number" && typeof snap.vy === "number") {
      Body.setVelocity(body, { x: snap.vx, y: snap.vy });
    }
    if (typeof snap.angularVelocity === "number") {
      Body.setAngularVelocity(body, snap.angularVelocity);
    }
  }
}
