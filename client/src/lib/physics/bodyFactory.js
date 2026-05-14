import Matter from "matter-js";

const { Bodies, Body, Composite } = Matter;

export const VL_PREFIX = "vl-";

export function makeVlId() {
  return `${VL_PREFIX}${crypto.randomUUID()}`;
}

export function createPhysicsBody(kind, x, y, vlId, style = {}) {
  const fill = style.fill ?? "#1E90FF";
  const friction = style.friction ?? 0.2;
  const restitution = style.restitution ?? 0.4;
  const density = style.density ?? 0.001;
  const mass = style.mass;

  const common = {
    label: vlId,
    friction,
    restitution,
    density,
    render: { fillStyle: fill, strokeStyle: "#0f172a", lineWidth: 1 },
  };

  let body;
  switch (kind) {
    case "circle":
      body = Bodies.circle(x, y, 22, common);
      break;
    case "box":
      body = Bodies.rectangle(x, y, 48, 48, common);
      break;
    case "rectangle":
      body = Bodies.rectangle(x, y, 88, 40, common);
      break;
    case "triangle":
      body = Bodies.polygon(x, y, 3, 26, common);
      break;
    case "polygon":
      body = Bodies.polygon(x, y, 5, 24, common);
      break;
    default:
      body = Bodies.rectangle(x, y, 48, 48, common);
  }

  if (typeof mass === "number" && mass > 0) {
    Body.setMass(body, mass);
  }

  return body;
}

export function attachBodyMeta(body, kind) {
  body.plugin = { ...(body.plugin || {}), virtualLab: { kind } };
  body.name = kind;
}

export function addBodyFromRemote(world, spec) {
  if (!spec?.id?.startsWith(VL_PREFIX)) return;
  const exists = Composite.allBodies(world).some((b) => b.label === spec.id);
  if (exists) return;
  const body = createPhysicsBody(
    spec.kind || "box",
    spec.x,
    spec.y,
    spec.id,
    {
      mass: spec.mass,
      friction: spec.friction,
      restitution: spec.restitution,
      density: spec.density,
      fill: spec.fill,
    }
  );
  attachBodyMeta(body, spec.kind || "box");
  Body.setAngle(body, spec.angle ?? 0, false);
  Composite.add(world, body);
}
