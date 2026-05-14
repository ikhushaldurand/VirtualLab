import Matter from "matter-js";

const { Composite, Constraint, Vector, Bodies, Body } = Matter;

export const CONNECTOR_PREFIX = "vl-conn-";
export const PULLEY_PREFIX = "vl-pulley-";

export function worldPointToLocal(body, wx, wy) {
  return Vector.rotate(Vector.sub({ x: wx, y: wy }, body.position), -body.angle);
}

export function localPointToWorld(body, lx, ly) {
  return Vector.add(body.position, Vector.rotate({ x: lx, y: ly }, body.angle));
}

export function getConstraintAnchorWorld(c) {
  const pa = c.pointA || { x: 0, y: 0 };
  const pb = c.pointB || { x: 0, y: 0 };
  const bodyA = c.bodyA;
  const bodyB = c.bodyB;
  const wa = bodyA ? localPointToWorld(bodyA, pa.x, pa.y) : pa;
  const wb = bodyB ? localPointToWorld(bodyB, pb.x, pb.y) : pb;
  return { worldA: wa, worldB: wb };
}

export function estimateConstraintLoad(c) {
  const { worldA, worldB } = getConstraintAnchorWorld(c);
  const current = Vector.magnitude(Vector.sub(worldB, worldA));
  const target = c.length ?? 0;
  const k = typeof c.stiffness === "number" ? c.stiffness : 0.5;
  return Math.abs(current - target) * (0.5 + k) * 180;
}

export function sumConnectorLoadOnBody(world, bodyLabel) {
  let sum = 0;
  for (const c of Composite.allConstraints(world)) {
    if (!c.label?.startsWith(CONNECTOR_PREFIX)) continue;
    const a = c.bodyA?.label;
    const b = c.bodyB?.label;
    if (a === bodyLabel || b === bodyLabel) {
      sum += estimateConstraintLoad(c);
    }
  }
  return sum;
}

/** Approximate gravity force magnitude (Matter world.gravity × mass × scale). */
export function estimateGravityForceMagnitude(body, world) {
  const g = world.gravity || { x: 0, y: 1, scale: 0.001 };
  const gx = g.x ?? 0;
  const gy = g.y ?? 0;
  const scale = g.scale ?? 0.001;
  return body.mass * Math.hypot(gx, gy) * scale;
}

/**
 * Green FBD arrows from COM for each connector touching the body.
 * @returns {{ x0: number, y0: number, x1: number, y1: number, label: string }[]}
 */
export function getConnectorFbdArrows(world, body) {
  const arrows = [];
  const com = body.position;
  for (const c of Composite.allConstraints(world)) {
    if (!c.label?.startsWith(CONNECTOR_PREFIX)) continue;
    const vl = c.plugin?.virtualLab;
    const { worldA, worldB } = getConstraintAnchorWorld(c);
    let selfW;
    let otherW;
    if (c.bodyA === body) {
      selfW = worldA;
      otherW = worldB;
    } else if (c.bodyB === body) {
      selfW = worldB;
      otherW = worldA;
    } else {
      continue;
    }
    const dir = Vector.normalise(Vector.sub(otherW, selfW));
    const load = estimateConstraintLoad(c);
    const lenPx = Math.min(90, Math.max(12, 16 + load * 0.0075));
    const x1 = com.x + dir.x * lenPx;
    const y1 = com.y + dir.y * lenPx;

    const k = vl?.kind || "";
    let label = "F_c";
    if (k === "spring") label = "F_spring";
    else if (k === "rope") label = "F_cord";
    else if (k === "rod") label = "F_rod";
    else if (k === "pivot" || k === "motor") label = "F_pin";
    else if (k === "pulley" || k === "pulley-arm") label = "F_pulley";

    arrows.push({ x0: com.x, y0: com.y, x1, y1, label });
  }
  return arrows;
}

export function removeConstraintsForBody(world, bodyLabel) {
  for (const c of [...Composite.allConstraints(world)]) {
    const touches = c.bodyA?.label === bodyLabel || c.bodyB?.label === bodyLabel;
    if (!touches) continue;
    if (!c.label?.startsWith(CONNECTOR_PREFIX)) continue;
    try {
      Composite.remove(world, c);
    } catch {
      /* ignore */
    }
  }
  for (const b of [...Composite.allBodies(world)]) {
    if (!b.label?.startsWith(PULLEY_PREFIX)) continue;
    const still = Composite.allConstraints(world).some((c) => c.bodyA === b || c.bodyB === b);
    if (!still) {
      try {
        Composite.remove(world, b);
      } catch {
        /* ignore */
      }
    }
  }
}

export function clearAllConnectorConstraints(world) {
  for (const c of [...Composite.allConstraints(world)]) {
    if (c.label?.startsWith(CONNECTOR_PREFIX)) {
      try {
        Composite.remove(world, c);
      } catch {
        /* ignore */
      }
    }
  }
  for (const b of [...Composite.allBodies(world)]) {
    if (b.label?.startsWith(PULLEY_PREFIX)) {
      try {
        Composite.remove(world, b);
      } catch {
        /* ignore */
      }
    }
  }
}

function baseRenderInvisible() {
  return { visible: false, anchors: false };
}

export function addConnectorFromPayload(world, payload) {
  if (!payload?.id?.startsWith(CONNECTOR_PREFIX) || !payload.kind) return null;

  const find = (id) => Composite.allBodies(world).find((b) => b.label === id);

  if (payload.kind === "pivot" || payload.kind === "motor") {
    const bodyB = find(payload.bodyAId);
    const wa = payload.worldAnchor;
    if (!bodyB || !wa || typeof wa.x !== "number") return null;
    const c = Constraint.create({
      bodyA: null,
      pointA: { x: wa.x, y: wa.y },
      bodyB,
      pointB: payload.pointA || { x: 0, y: 0 },
      length: 0,
      stiffness: 1,
      damping: 0.12,
      label: payload.id,
      render: baseRenderInvisible(),
    });
    c.plugin = {
      virtualLab: {
        kind: payload.kind,
        motorOmega: payload.kind === "motor" ? Number(payload.motorOmega) || 0.055 : 0,
      },
    };
    Composite.add(world, c);
    return c;
  }

  if (payload.kind === "pulley") {
    const bodyA = find(payload.bodyAId);
    const bodyB = find(payload.bodyBId);
    if (!bodyA || !bodyB) return null;
    const px = payload.pulleyX;
    const py = payload.pulleyY;
    const r = Number(payload.pulleyR) || 20;
    const pinId =
      payload.pulleyBodyId ||
      `${PULLEY_PREFIX}${payload.id.slice(CONNECTOR_PREFIX.length)}`;
    let pin = Composite.allBodies(world).find((b) => b.label === pinId);
    if (!pin) {
      pin = Bodies.circle(px, py, r, {
        isStatic: true,
        label: pinId,
        friction: 0.05,
        render: {
          fillStyle: "#94a3b8",
          strokeStyle: "#64748b",
          lineWidth: 1,
        },
      });
      pin.plugin = { virtualLab: { kind: "pulley-pin" } };
      Composite.add(world, pin);
    }
    const wa = localPointToWorld(bodyA, payload.pointA.x, payload.pointA.y);
    const wb = localPointToWorld(bodyB, payload.pointB.x, payload.pointB.y);
    const mid = { x: px, y: py };
    const dirA = Vector.normalise(Vector.sub(wa, mid));
    const dirB = Vector.normalise(Vector.sub(wb, mid));
    const rimA = Vector.add(mid, Vector.mult(dirA, r * 0.92));
    const rimB = Vector.add(mid, Vector.mult(dirB, r * 0.92));
    const localPinA = worldPointToLocal(pin, rimA.x, rimA.y);
    const localPinB = worldPointToLocal(pin, rimB.x, rimB.y);
    const lenA = Vector.magnitude(Vector.sub(wa, rimA));
    const lenB = Vector.magnitude(Vector.sub(wb, rimB));

    const groupId = payload.id;
    const c1 = Constraint.create({
      bodyA,
      bodyB: pin,
      pointA: payload.pointA,
      pointB: localPinA,
      length: lenA,
      stiffness: 0.92,
      damping: 0.35,
      label: `${payload.id}-a`,
      render: baseRenderInvisible(),
    });
    c1.plugin = {
      virtualLab: {
        kind: "pulley",
        skipSerialize: false,
        groupId,
        bodyAId: bodyA.label,
        bodyBId: bodyB.label,
        pointA: { ...payload.pointA },
        pointB: { ...payload.pointB },
        pulleyX: px,
        pulleyY: py,
        pulleyR: r,
        pulleyBodyId: pinId,
      },
    };
    const c2 = Constraint.create({
      bodyA: bodyB,
      bodyB: pin,
      pointA: payload.pointB,
      pointB: localPinB,
      length: lenB,
      stiffness: 0.92,
      damping: 0.35,
      label: `${payload.id}-b`,
      render: baseRenderInvisible(),
    });
    c2.plugin = {
      virtualLab: { kind: "pulley-arm", skipSerialize: true, groupId },
    };
    Composite.add(world, c1);
    Composite.add(world, c2);
    return c1;
  }

  const bodyA = find(payload.bodyAId);
  const bodyB = find(payload.bodyBId);
  if (!bodyA || !bodyB) return null;

  const c = Constraint.create({
    bodyA,
    bodyB,
    pointA: payload.pointA || { x: 0, y: 0 },
    pointB: payload.pointB || { x: 0, y: 0 },
    length: Number(payload.length) || 40,
    stiffness: typeof payload.stiffness === "number" ? payload.stiffness : 0.2,
    damping: typeof payload.damping === "number" ? payload.damping : 0.08,
    label: payload.id,
    render: baseRenderInvisible(),
  });
  c.plugin = { virtualLab: { kind: payload.kind } };
  Composite.add(world, c);
  return c;
}

export function serializeAllConnectors(world) {
  const out = [];
  for (const c of Composite.allConstraints(world)) {
    if (!c.label?.startsWith(CONNECTOR_PREFIX)) continue;
    const vl = c.plugin?.virtualLab;
    if (vl?.skipSerialize) continue;

    if (vl?.kind === "pivot" || vl?.kind === "motor") {
      const bodyB = c.bodyB;
      const pa = c.pointB || { x: 0, y: 0 };
      const wa = c.pointA || { x: 0, y: 0 };
      out.push({
        id: c.label,
        kind: vl.kind,
        bodyAId: bodyB?.label,
        pointA: { x: pa.x, y: pa.y },
        worldAnchor: { x: wa.x, y: wa.y },
        motorOmega: vl.motorOmega ?? 0.055,
      });
      continue;
    }

    if (vl?.kind === "pulley") {
      out.push({
        id: vl.groupId || c.label.replace(/-a$/, ""),
        kind: "pulley",
        bodyAId: vl.bodyAId,
        bodyBId: vl.bodyBId,
        pointA: { ...vl.pointA },
        pointB: { ...vl.pointB },
        pulleyX: vl.pulleyX,
        pulleyY: vl.pulleyY,
        pulleyR: vl.pulleyR,
        pulleyBodyId: vl.pulleyBodyId,
      });
      continue;
    }

    const a = c.bodyA;
    const b = c.bodyB;
    if (!a?.label || !b?.label) continue;
    out.push({
      id: c.label,
      kind: vl?.kind || "rod",
      bodyAId: a.label,
      bodyBId: b.label,
      pointA: { ...(c.pointA || { x: 0, y: 0 }) },
      pointB: { ...(c.pointB || { x: 0, y: 0 }) },
      length: c.length,
      stiffness: c.stiffness,
      damping: c.damping,
    });
  }
  return out;
}

export function drawZigZagSpring(ctx, x1, y1, x2, y2, amplitude = 5, segments = 14) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const cx = x1 + (dx * t);
    const cy = y1 + (dy * t);
    const side = i % 2 === 0 ? 1 : -1;
    ctx.lineTo(cx + px * amplitude * side, cy + py * amplitude * side);
  }
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "#1E90FF";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawConstraintRod(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

export function drawConstraintRope(ctx, x1, y1, x2, y2) {
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawGhostLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "rgba(30, 144, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawConnectorsOverlay(ctx, world) {
  for (const c of Composite.allConstraints(world)) {
    if (!c.label?.startsWith(CONNECTOR_PREFIX)) continue;
    const vl = c.plugin?.virtualLab;
    const { worldA, worldB } = getConstraintAnchorWorld(c);
    if (vl?.kind === "pulley-arm") {
      drawConstraintRod(ctx, worldA.x, worldA.y, worldB.x, worldB.y);
      continue;
    }
    if (vl?.kind === "pivot" || vl?.kind === "motor") {
      ctx.beginPath();
      ctx.arc(worldA.x, worldA.y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = vl.kind === "motor" ? "#FF3B30" : "#1E90FF";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawConstraintRod(ctx, worldA.x, worldA.y, worldB.x, worldB.y);
      continue;
    }
    if (vl?.kind === "spring") {
      drawZigZagSpring(ctx, worldA.x, worldA.y, worldB.x, worldB.y);
    } else if (vl?.kind === "rope") {
      drawConstraintRope(ctx, worldA.x, worldA.y, worldB.x, worldB.y);
    } else {
      drawConstraintRod(ctx, worldA.x, worldA.y, worldB.x, worldB.y);
    }
  }
}

export function applyMotorConstraints(world) {
  for (const c of Composite.allConstraints(world)) {
    const vl = c.plugin?.virtualLab;
    if (vl?.kind !== "motor" || !c.bodyB) continue;
    const w = Number(vl.motorOmega) || 0.055;
    Body.setAngularVelocity(c.bodyB, w);
  }
}

/**
 * @returns {object|null} payload for socket
 */
export function createConnectorInteraction(world, kind, bodyA, worldA, bodyB, worldB) {
  const id = `${CONNECTOR_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const pointA = worldPointToLocal(bodyA, worldA.x, worldA.y);
  const dist = Vector.magnitude(Vector.sub(worldB, worldA));

  if (kind === "pivot" || kind === "motor") {
    const payload = {
      id,
      kind,
      bodyAId: bodyA.label,
      pointA,
      worldAnchor: { x: worldB.x, y: worldB.y },
      motorOmega: kind === "motor" ? 0.055 : 0,
    };
    addConnectorFromPayload(world, payload);
    return payload;
  }

  const pointB = worldPointToLocal(bodyB, worldB.x, worldB.y);

  if (kind === "pulley") {
    const mid = Vector.mult(Vector.add(worldA, worldB), 0.5);
    const r = 20;
    const pinId = `${PULLEY_PREFIX}${id.slice(CONNECTOR_PREFIX.length)}`;
    const payload = {
      id,
      kind: "pulley",
      bodyAId: bodyA.label,
      bodyBId: bodyB.label,
      pointA: { x: pointA.x, y: pointA.y },
      pointB: { x: pointB.x, y: pointB.y },
      pulleyX: mid.x,
      pulleyY: mid.y,
      pulleyR: r,
      pulleyBodyId: pinId,
    };
    addConnectorFromPayload(world, payload);
    return payload;
  }

  const base = {
    id,
    bodyAId: bodyA.label,
    bodyBId: bodyB.label,
    pointA: { x: pointA.x, y: pointA.y },
    pointB: { x: pointB.x, y: pointB.y },
    length: dist,
  };

  if (kind === "spring") {
    const payload = {
      ...base,
      kind: "spring",
      stiffness: 0.14,
      damping: 0.06,
    };
    addConnectorFromPayload(world, payload);
    return payload;
  }
  if (kind === "rope") {
    const payload = {
      ...base,
      kind: "rope",
      stiffness: 0.028,
      damping: 0.18,
    };
    addConnectorFromPayload(world, payload);
    return payload;
  }
  if (kind === "rod") {
    const payload = {
      ...base,
      kind: "rod",
      stiffness: 1,
      damping: 0.85,
    };
    addConnectorFromPayload(world, payload);
    return payload;
  }
  return null;
}
