import { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { connectSocket, getSocket } from "../socket/socketClient.js";
import {
  addBodyFromRemote,
  attachBodyMeta,
  createPhysicsBody,
  makeVlId,
} from "../lib/physics/bodyFactory.js";
import {
  applySyncFrame,
  serializeAllDynamic,
  serializeDynamicBody,
} from "../lib/physics/serialize.js";
import { roomSnapshotStorageKey } from "../constants/roomStorage.js";
import { ROOM_MATERIAL_PRESETS } from "../lib/physics/materialPresets.js";
import {
  addConnectorFromPayload,
  applyMotorConstraints,
  clearAllConnectorConstraints,
  createConnectorInteraction,
  drawConnectorsOverlay,
  drawGhostLine,
  estimateGravityForceMagnitude,
  getConnectorFbdArrows,
  removeConstraintsForBody,
  serializeAllConnectors,
  sumConnectorLoadOnBody,
} from "../lib/physics/connectors.js";

const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events,
  Mouse,
  MouseConstraint,
  Composite,
  Query,
} = Matter;

const WALL_THICK = 48;

function buildWalls(width, height) {
  const t = WALL_THICK;
  return [
    Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, {
      isStatic: true,
      label: "wall-bottom",
      friction: 1,
      render: { fillStyle: "#cbd5e1", visible: true },
    }),
    Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, {
      isStatic: true,
      label: "wall-top",
      friction: 1,
      render: { fillStyle: "#e2e8f0", visible: true },
    }),
    Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, {
      isStatic: true,
      label: "wall-left",
      friction: 1,
      render: { fillStyle: "#e2e8f0", visible: true },
    }),
    Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, {
      isStatic: true,
      label: "wall-right",
      friction: 1,
      render: { fillStyle: "#e2e8f0", visible: true },
    }),
  ];
}

function clearDynamicBodies(world) {
  clearAllConnectorConstraints(world);
  Composite.allBodies(world)
    .filter((b) => b.label?.startsWith("vl-"))
    .forEach((b) => Composite.remove(world, b));
}

function drawArrowWithLabel(ctx, x0, y0, x1, y1, color, label, fontPx) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ah = Math.min(10, len * 0.22);
  const bx = x1 - ux * ah;
  const by = y1 - uy * ah;
  const lx = -uy;
  const ly = ux;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(bx + lx * (ah * 0.55), by + ly * (ah * 0.55));
  ctx.lineTo(bx - lx * (ah * 0.55), by - ly * (ah * 0.55));
  ctx.closePath();
  ctx.fill();
  ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#0f172a";
  const tx = x1 + lx * 6 + (ux > 0 ? 2 : -2);
  const ty = y1 + ly * 6;
  ctx.fillText(label, tx, ty);
}

function drawFbdOnCanvas(ctx, body, world, engine) {
  if (!body) return;
  const px = body.position.x;
  const py = body.position.y;

  const wMag = estimateGravityForceMagnitude(body, world);
  const gLen = Math.min(100, Math.max(22, wMag * 0.045));
  drawArrowWithLabel(ctx, px, py, px, py + gLen, "#dc2626", "F_g", Math.max(9, Math.min(12, 8 + gLen / 18)));

  const spd = Math.hypot(body.velocity.x, body.velocity.y);
  if (spd > 1e-6) {
    const vScale = 0.1;
    const vx = body.velocity.x * vScale;
    const vy = body.velocity.y * vScale;
    const vLen = Math.min(96, Math.max(18, spd * vScale * 1.2));
    const scale = vLen / Math.max(1e-6, Math.hypot(vx, vy));
    drawArrowWithLabel(
      ctx,
      px,
      py,
      px + vx * scale,
      py + vy * scale,
      "#1E90FF",
      "v",
      Math.max(9, Math.min(12, 8 + spd * 0.15))
    );
  }

  const greens = getConnectorFbdArrows(world, body);
  for (const a of greens) {
    drawArrowWithLabel(
      ctx,
      a.x0,
      a.y0,
      a.x1,
      a.y1,
      "#16a34a",
      a.label,
      Math.max(8, Math.min(11, 7 + Math.hypot(a.x1 - a.x0, a.y1 - a.y0) / 14))
    );
  }
}

export function useCollaborativePhysics(roomId, canvasSize, roomWorkspace = {}) {
  const { connectorTool, materialTool } = roomWorkspace;
  const [tool, setTool] = useState("pointer");
  const [spawnKind, setSpawnKind] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [metrics, setMetrics] = useState({
    cursor: { x: 0, y: 0 },
    selectedSummary: null,
  });
  const [chartPoints, setChartPoints] = useState([]);
  const [showVectors, setShowVectors] = useState(false);
  const [panelDraft, setPanelDraft] = useState(null);

  const mountRef = useRef(null);
  const vectorRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);
  const mouseAttachedRef = useRef(false);
  const selectedRef = useRef(null);
  const isRemoteRef = useRef(false);
  const lastEmitRef = useRef(0);
  const lastChartSampleRef = useRef(0);
  const simRunningRef = useRef(false);
  const speedRef = useRef(1);
  const toolRef = useRef("pointer");
  const spawnKindRef = useRef(null);
  const roomIdRef = useRef(roomId);
  const showVectorsRef = useRef(false);
  /** After applying a non-empty scene from the network, skip delayed scene-announce (avoids stale localStorage overwriting a peer). */
  const heardRemoteSceneRef = useRef(false);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const roomUxRef = useRef(roomWorkspace);
  roomUxRef.current = roomWorkspace;

  const wireDraftRef = useRef(null);
  const ghostRef = useRef(null);

  const metricsFrameRef = useRef(0);

  useEffect(() => {
    simRunningRef.current = simRunning;
  }, [simRunning]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    spawnKindRef.current = spawnKind;
  }, [spawnKind]);
  useEffect(() => {
    showVectorsRef.current = showVectors;
  }, [showVectors]);

  useEffect(() => {
    if (!selectedLabel) {
      setChartPoints([]);
      setMetrics((m) => ({ ...m, selectedSummary: null }));
    }
  }, [selectedLabel]);

  useEffect(() => {
    const eng = engineRef.current;
    if (!selectedLabel || !eng) {
      setPanelDraft(null);
      return;
    }
    const b = Composite.allBodies(eng.world).find(
      (x) => x.label === selectedLabel
    );
    if (!b) {
      setPanelDraft(null);
      return;
    }
    setPanelDraft({
      mass: b.mass,
      friction: b.friction,
      restitution: b.restitution,
      density: b.density,
      fill: b.render?.fillStyle || "#1E90FF",
    });
  }, [selectedLabel, canvasSize]);

  const applyPropsToSelected = useCallback(
    (props) => {
      const engine = engineRef.current;
      if (!engine || !selectedLabel) return;
      const body = Composite.allBodies(engine.world).find(
        (b) => b.label === selectedLabel
      );
      if (!body) return;
      if (props.mass != null) Body.setMass(body, Number(props.mass));
      if (props.friction != null)
        Body.set(body, "friction", Number(props.friction));
      if (props.restitution != null)
        Body.set(body, "restitution", Number(props.restitution));
      if (props.density != null) Body.set(body, "density", Number(props.density));
      if (props.fill) {
        body.render = body.render || {};
        body.render.fillStyle = props.fill;
      }
      getSocket().emit("room:discrete", {
        roomId,
        type: "body-props",
        payload: serializeDynamicBody(body),
      });
    },
    [roomId, selectedLabel]
  );

  const deleteSelected = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !selectedLabel) return;
    const body = Composite.allBodies(engine.world).find(
      (b) => b.label === selectedLabel
    );
    if (!body) return;
    removeConstraintsForBody(engine.world, body.label);
    Composite.remove(engine.world, body);
    setSelectedLabel(null);
    selectedRef.current = null;
    getSocket().emit("room:discrete", {
      roomId,
      type: "body-removed",
      payload: { id: body.label },
    });
  }, [roomId, selectedLabel]);

  const addObject = useCallback(
    (kind, x, y) => {
      const engine = engineRef.current;
      if (!engine) return;
      const id = makeVlId();
      const body = createPhysicsBody(kind, x, y, id, {});
      attachBodyMeta(body, kind);
      Composite.add(engine.world, body);
      getSocket().emit("room:discrete", {
        roomId,
        type: "body-created",
        payload: serializeDynamicBody(body),
      });
    },
    [roomId]
  );

  const play = useCallback(() => {
    const runner = runnerRef.current;
    const engine = engineRef.current;
    if (!runner || !engine) return;
    Runner.run(runner, engine);
    setSimRunning(true);
    getSocket().emit("room:discrete", {
      roomId,
      type: "sim-control",
      payload: { action: "play", speed: speedRef.current },
    });
  }, [roomId]);

  const pause = useCallback(() => {
    const runner = runnerRef.current;
    const engine = engineRef.current;
    if (!runner || !engine) return;
    Runner.stop(runner);
    setSimRunning(false);
    getSocket().emit("room:discrete", {
      roomId,
      type: "sim-control",
      payload: { action: "pause" },
    });
  }, [roomId]);

  const reset = useCallback(() => {
    const runner = runnerRef.current;
    const engine = engineRef.current;
    if (!engine) return;
    if (runner) Runner.stop(runner);
    clearDynamicBodies(engine.world);
    setSimRunning(false);
    setSelectedLabel(null);
    selectedRef.current = null;
    setChartPoints([]);
    getSocket().emit("room:discrete", {
      roomId,
      type: "sim-control",
      payload: { action: "reset" },
    });
  }, [roomId]);

  const saveRoomSnapshot = useCallback(
    (roomNameArg) => {
      const engine = engineRef.current;
      if (!engine || !roomId) return { ok: false };
      const bodies = serializeAllDynamic(engine.world);
      const connectors = serializeAllConnectors(engine.world);
      const savedAt = Date.now();
      const payload = {
        version: 2,
        roomId,
        roomName: (roomNameArg && String(roomNameArg).trim()) || "Untitled Room",
        savedAt,
        bodies,
        connectors,
        speed: speedRef.current,
      };
      try {
        localStorage.setItem(
          roomSnapshotStorageKey(roomId),
          JSON.stringify(payload)
        );
        return {
          ok: true,
          roomId,
          roomName: payload.roomName,
          savedAt,
        };
      } catch {
        return { ok: false };
      }
    },
    [roomId]
  );

  useEffect(() => {
    const w = canvasSize;
    const h = canvasSize;
    if (!roomId || w < 120 || h < 120) return undefined;

    const mount = mountRef.current;
    const vectorCanvas = vectorRef.current;
    if (!mount || !vectorCanvas) return undefined;

    vectorCanvas.width = w;
    vectorCanvas.height = h;

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.y = 1;
    engine.constraintIterations = 4;
    engine.timing.timeScale = speedRef.current;
    engineRef.current = engine;

    World.add(engine.world, buildWalls(w, h));

    const render = Render.create({
      element: mount,
      engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: "transparent",
        pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
        hasBounds: true,
        bounds: {
          min: { x: 0, y: 0 },
          max: { x: w, y: h },
        },
      },
    });
    renderRef.current = render;

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.25, render: { visible: false } },
    });
    mouseConstraintRef.current = mouseConstraint;
    World.add(engine.world, mouseConstraint);
    mouseAttachedRef.current = true;
    render.mouse = mouse;

    const runner = Runner.create();
    runnerRef.current = runner;

    Render.run(render);
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: w, y: h },
    });

    try {
      const raw = localStorage.getItem(roomSnapshotStorageKey(roomId));
      if (raw) {
        const data = JSON.parse(raw);
        for (const spec of data.bodies || []) {
          addBodyFromRemote(engine.world, spec);
        }
        for (const spec of data.connectors || []) {
          addConnectorFromPayload(engine.world, spec);
        }
      }
    } catch {
      /* ignore corrupt snapshot */
    }

    const onAfterRender = () => {
      const ctx = vectorCanvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawConnectorsOverlay(ctx, engine.world);
      const draft = wireDraftRef.current;
      const g = ghostRef.current;
      if (draft && g) {
        drawGhostLine(ctx, draft.worldAx, draft.worldAy, g.x, g.y);
      }
      if (showVectorsRef.current) {
        const body = selectedRef.current;
        if (body?.label?.startsWith("vl-")) {
          drawFbdOnCanvas(ctx, body, engine.world, engine);
        }
      }

      /* Live analytics + cursor: drive from render loop so charts work while physics is paused. */
      const mousePos = mouse.position;
      metricsFrameRef.current += 1;
      const mf = metricsFrameRef.current;
      if (mf % 2 === 0) {
        setMetrics((m) => ({
          ...m,
          cursor: {
            x: Number((mousePos.x / w).toFixed(2)),
            y: Number(((h - mousePos.y) / h).toFixed(2)),
          },
        }));
      }

      const sel = selectedRef.current;
      if (sel?.label?.startsWith("vl-")) {
        const spd = Math.hypot(sel.velocity.x, sel.velocity.y);
        const conn = sumConnectorLoadOnBody(engine.world, sel.label);
        const fengine = Math.hypot(sel.force.x, sel.force.y);
        const fgrav = estimateGravityForceMagnitude(sel, engine.world);
        const fmag = fengine + conn;
        const ke = 0.5 * sel.mass * spd * spd;
        const now = performance.now();
        if (now - lastChartSampleRef.current >= 1000 / 60 - 0.5) {
          lastChartSampleRef.current = now;
          const t = now / 1000;
          setChartPoints((prev) =>
            [...prev, { t, v: spd, ke, f: fmag }].slice(-100)
          );
          setMetrics((m) => ({
            ...m,
            selectedSummary: {
              label: sel.plugin?.virtualLab?.kind || "Object",
              mass: sel.mass.toFixed(3),
              posX: (sel.position.x / w).toFixed(2),
              posY: ((h - sel.position.y) / h).toFixed(2),
              velocity: spd.toFixed(2),
              fNet: fmag.toFixed(2),
              weightEst: fgrav.toFixed(2),
              connectorLoad: conn.toFixed(2),
            },
          }));
        }
      }
    };
    Events.on(render, "afterRender", onAfterRender);

    const onAfterUpdate = () => {
      engine.timing.timeScale = speedRef.current;
      applyMotorConstraints(engine.world);
      if (!isRemoteRef.current && simRunningRef.current) {
        const now = performance.now();
        if (now - lastEmitRef.current > 32) {
          lastEmitRef.current = now;
          getSocket().emit("room:physics-sync", {
            roomId: roomIdRef.current,
            bodies: serializeAllDynamic(engine.world),
          });
        }
      }
    };
    Events.on(engine, "afterUpdate", onAfterUpdate);

    const onMouseDown = (e) => {
      if (["hand", "add", "subtract"].includes(toolRef.current)) return;
      const b = e.body;
      if (toolRef.current === "delete" && b?.label?.startsWith("vl-")) {
        removeConstraintsForBody(engine.world, b.label);
        Composite.remove(engine.world, b);
        if (selectedRef.current?.label === b.label) {
          selectedRef.current = null;
          setSelectedLabel(null);
        }
        getSocket().emit("room:discrete", {
          roomId: roomIdRef.current,
          type: "body-removed",
          payload: { id: b.label },
        });
        return;
      }
      if (b?.label?.startsWith("vl-")) {
        selectedRef.current = b;
        setSelectedLabel(b.label);
      }
    };

    const onEndDrag = (e) => {
      const b = e.body;
      if (
        b?.label?.startsWith("vl-") &&
        (toolRef.current === "pointer" || toolRef.current === "move")
      ) {
        getSocket().emit("room:discrete", {
          roomId: roomIdRef.current,
          type: "body-moved",
          payload: serializeDynamicBody(b),
        });
      }
    };

    Events.on(mouseConstraint, "mousedown", onMouseDown);
    Events.on(mouseConstraint, "enddrag", onEndDrag);

    function canvasPxFromEvent(ev) {
      const rect = render.canvas.getBoundingClientRect();
      return {
        x: ((ev.clientX - rect.left) / rect.width) * w,
        y: ((ev.clientY - rect.top) / rect.height) * h,
      };
    }

    function pickables() {
      return Composite.allBodies(engine.world).filter(
        (b) =>
          typeof b.label === "string" &&
          b.label.startsWith("vl-") &&
          !b.label.startsWith("vl-pulley") &&
          !b.isStatic
      );
    }

    function onCanvasPointerDown(ev) {
      const ux = roomUxRef.current;
      const mat = ux.materialTool;
      if (mat && !spawnKindRef.current) {
        const p = canvasPxFromEvent(ev);
        const hits = Query.point(pickables(), p);
        const hit = hits[0];
        if (hit) {
          ev.preventDefault();
          ev.stopPropagation();
          if (mat === "custom" && ux.customMaterial) {
            const cm = ux.customMaterial;
            Body.set(hit, "friction", Number(cm.friction) || 0.2);
            Body.set(hit, "restitution", Number(cm.restitution) || 0.4);
            Body.set(hit, "density", Number(cm.density) || 0.001);
          } else {
            const preset = ROOM_MATERIAL_PRESETS[mat];
            if (preset) {
              Body.set(hit, "friction", preset.friction);
              Body.set(hit, "restitution", preset.restitution);
              Body.set(hit, "density", preset.density);
            }
          }
          getSocket().emit("room:discrete", {
            roomId: roomIdRef.current,
            type: "body-props",
            payload: serializeDynamicBody(hit),
          });
          ux.setMaterialTool?.(null);
        }
        return;
      }

      const connKind = ux.connectorTool;
      if (!connKind || spawnKindRef.current) return;
      const p = canvasPxFromEvent(ev);
      const hits = Query.point(pickables(), p);
      const hit = hits[0];
      if (!hit || wireDraftRef.current) return;
      wireDraftRef.current = {
        kind: connKind,
        bodyA: hit,
        worldAx: p.x,
        worldAy: p.y,
      };
      ghostRef.current = { x: p.x, y: p.y };
      ev.preventDefault();
      ev.stopPropagation();
    }

    function onCanvasPointerMove(ev) {
      if (!wireDraftRef.current || !roomUxRef.current.connectorTool) return;
      const p = canvasPxFromEvent(ev);
      ghostRef.current = { x: p.x, y: p.y };
    }

    function onCanvasPointerUp(ev) {
      const draft = wireDraftRef.current;
      if (!draft) return;
      const ux = roomUxRef.current;
      const p = canvasPxFromEvent(ev);
      const { kind, bodyA, worldAx, worldAy } = draft;
      wireDraftRef.current = null;
      ghostRef.current = null;

      if (kind === "pivot" || kind === "motor") {
        const payload = createConnectorInteraction(
          engine.world,
          kind,
          bodyA,
          { x: worldAx, y: worldAy },
          bodyA,
          p
        );
        if (payload) {
          getSocket().emit("room:discrete", {
            roomId: roomIdRef.current,
            type: "connector-created",
            payload,
          });
        }
        ux.setConnectorTool?.(null);
        return;
      }

      const hits = Query.point(pickables(), p);
      const bodyB = hits.find((b) => b !== bodyA);
      if (!bodyB) {
        ux.setConnectorTool?.(null);
        return;
      }
      const payload = createConnectorInteraction(
        engine.world,
        kind,
        bodyA,
        { x: worldAx, y: worldAy },
        bodyB,
        p
      );
      if (payload) {
        getSocket().emit("room:discrete", {
          roomId: roomIdRef.current,
          type: "connector-created",
          payload,
        });
      }
      ux.setConnectorTool?.(null);
    }

    render.canvas.addEventListener("pointerdown", onCanvasPointerDown, true);
    render.canvas.addEventListener("pointermove", onCanvasPointerMove, true);
    render.canvas.addEventListener("pointerup", onCanvasPointerUp, true);

    const onCanvasClick = (ev) => {
      const sk = spawnKindRef.current;
      if (!sk) return;
      const rect = render.canvas.getBoundingClientRect();
      const sx = ((ev.clientX - rect.left) / rect.width) * w;
      const sy = ((ev.clientY - rect.top) / rect.height) * h;
      const id = makeVlId();
      const body = createPhysicsBody(sk, sx, sy, id, {});
      attachBodyMeta(body, sk);
      Composite.add(engine.world, body);
      getSocket().emit("room:discrete", {
        roomId: roomIdRef.current,
        type: "body-created",
        payload: serializeDynamicBody(body),
      });
      setSpawnKind(null);
    };
    render.canvas.addEventListener("click", onCanvasClick);

    return () => {
      render.canvas.removeEventListener("pointerdown", onCanvasPointerDown, true);
      render.canvas.removeEventListener("pointermove", onCanvasPointerMove, true);
      render.canvas.removeEventListener("pointerup", onCanvasPointerUp, true);
      render.canvas.removeEventListener("click", onCanvasClick);
      Events.off(mouseConstraint, "mousedown", onMouseDown);
      Events.off(mouseConstraint, "enddrag", onEndDrag);
      Events.off(engine, "afterUpdate", onAfterUpdate);
      Events.off(render, "afterRender", onAfterRender);
      Runner.stop(runner);
      Render.stop(render);
      try {
        Composite.remove(engine.world, mouseConstraint, true);
      } catch {
        /* ignore */
      }
      Engine.clear(engine);
      if (render.canvas?.parentNode) {
        render.canvas.remove();
      }
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      mouseConstraintRef.current = null;
      mouseAttachedRef.current = false;
      wireDraftRef.current = null;
      ghostRef.current = null;
    };
  }, [canvasSize, roomId]);

  useEffect(() => {
    const mc = mouseConstraintRef.current;
    const engine = engineRef.current;
    if (!mc || !engine) return undefined;
    const hide =
      ["hand", "add", "subtract"].includes(tool) ||
      Boolean(connectorTool) ||
      Boolean(materialTool);
    if (hide && mouseAttachedRef.current) {
      try {
        Composite.remove(engine.world, mc, true);
      } catch {
        /* ignore */
      }
      mouseAttachedRef.current = false;
    }
    if (!hide && !mouseAttachedRef.current) {
      Composite.add(engine.world, mc);
      mouseAttachedRef.current = true;
    }
    return undefined;
  }, [tool, connectorTool, materialTool]);

  useEffect(() => {
    if (!roomId) return undefined;
    heardRemoteSceneRef.current = false;
    connectSocket();
    const socket = getSocket();

    const applyRemoteScene = (msg) => {
      if (!msg || msg.roomId !== roomId) return;
      const bodies = msg.bodies || [];
      const connectors = msg.connectors || [];
      if (bodies.length === 0 && connectors.length === 0) return;
      const engine = engineRef.current;
      if (!engine) return;
      isRemoteRef.current = true;
      clearDynamicBodies(engine.world);
      for (const spec of bodies) {
        addBodyFromRemote(engine.world, spec);
      }
      applySyncFrame(engine.world, bodies);
      for (const c of connectors) {
        addConnectorFromPayload(engine.world, c);
      }
      isRemoteRef.current = false;
      heardRemoteSceneRef.current = true;
      setSelectedLabel(null);
      selectedRef.current = null;
      setChartPoints([]);
    };

    const onSync = (msg) => {
      if (!msg || msg.roomId !== roomId) return;
      const engine = engineRef.current;
      if (!engine) return;
      isRemoteRef.current = true;
      applySyncFrame(engine.world, msg.bodies);
      isRemoteRef.current = false;
    };

    const onDiscrete = (msg) => {
      if (!msg || msg.roomId !== roomId) return;
      const engine = engineRef.current;
      if (!engine) return;
      isRemoteRef.current = true;
      if (msg.type === "body-created" && msg.payload) {
        addBodyFromRemote(engine.world, msg.payload);
      }
      if (msg.type === "body-removed" && msg.payload?.id) {
        removeConstraintsForBody(engine.world, msg.payload.id);
        const b = Composite.allBodies(engine.world).find(
          (x) => x.label === msg.payload.id
        );
        if (b) Composite.remove(engine.world, b);
      }
      if (msg.type === "connector-created" && msg.payload) {
        addConnectorFromPayload(engine.world, msg.payload);
      }
      if (msg.type === "body-props" && msg.payload?.id) {
        const b = Composite.allBodies(engine.world).find(
          (x) => x.label === msg.payload.id
        );
        if (b) {
          const p = msg.payload;
          if (p.mass != null) Body.setMass(b, p.mass);
          if (p.friction != null) Body.set(b, "friction", p.friction);
          if (p.restitution != null) Body.set(b, "restitution", p.restitution);
          if (p.density != null) Body.set(b, "density", p.density);
          if (p.fill) {
            b.render = b.render || {};
            b.render.fillStyle = p.fill;
          }
        }
      }
      if (msg.type === "body-moved" && msg.payload?.id) {
        applySyncFrame(engine.world, [msg.payload]);
      }
      if (msg.type === "sim-control" && msg.payload?.action) {
        const runner = runnerRef.current;
        const eng = engineRef.current;
        if (!runner || !eng) return;
        if (msg.payload.action === "play") {
          Runner.run(runner, eng);
          setSimRunning(true);
          if (typeof msg.payload.speed === "number") {
            setSpeed(msg.payload.speed);
          }
        }
        if (msg.payload.action === "pause") {
          Runner.stop(runner);
          setSimRunning(false);
        }
        if (msg.payload.action === "reset") {
          Runner.stop(runner);
          clearDynamicBodies(eng.world);
          setSimRunning(false);
          setSelectedLabel(null);
          selectedRef.current = null;
          setChartPoints([]);
        }
      }
      isRemoteRef.current = false;
    };

    const onScenePull = (msg) => {
      if (!msg || msg.roomId !== roomId) return;
      if (msg.requesterId === socket.id) return;
      const engine = engineRef.current;
      if (!engine) return;
      const bodies = serializeAllDynamic(engine.world);
      const connectors = serializeAllConnectors(engine.world);
      if (bodies.length === 0 && connectors.length === 0) return;
      socket.emit("room:scene-push", {
        roomId,
        targetSocketId: msg.requesterId,
        bodies,
        connectors,
      });
    };

    const onSceneApply = (msg) => {
      applyRemoteScene(msg);
    };

    const emitRequestScene = () => {
      socket.emit("room:request-scene", { roomId });
    };

    const joinAndWire = () => {
      socket.emit("room:join", roomId);
      emitRequestScene();
    };

    if (socket.connected) {
      joinAndWire();
    } else {
      socket.once("connect", joinAndWire);
    }

    const requestRetries = [
      window.setTimeout(emitRequestScene, 450),
      window.setTimeout(emitRequestScene, 1200),
    ];

    const announceTimer = window.setTimeout(() => {
      if (heardRemoteSceneRef.current) return;
      const engine = engineRef.current;
      if (!engine) return;
      const bodies = serializeAllDynamic(engine.world);
      const connectors = serializeAllConnectors(engine.world);
      if (bodies.length === 0 && connectors.length === 0) return;
      socket.emit("room:scene-announce", { roomId, bodies, connectors });
    }, 500);

    socket.on("room:physics-sync", onSync);
    socket.on("room:discrete", onDiscrete);
    socket.on("room:scene-pull", onScenePull);
    socket.on("room:scene-apply", onSceneApply);

    return () => {
      socket.off("connect", joinAndWire);
      for (const t of requestRetries) clearTimeout(t);
      clearTimeout(announceTimer);
      socket.emit("room:leave");
      socket.off("room:physics-sync", onSync);
      socket.off("room:discrete", onDiscrete);
      socket.off("room:scene-pull", onScenePull);
      socket.off("room:scene-apply", onSceneApply);
    };
  }, [roomId]);

  useEffect(() => {
    const eng = engineRef.current;
    if (eng) {
      eng.timing.timeScale = speed;
    }
  }, [speed]);

  return {
    mountRef,
    vectorRef,
    tool,
    setTool,
    spawnKind,
    setSpawnKind,
    simRunning,
    speed,
    setSpeed,
    play,
    pause,
    reset,
    addObject,
    deleteSelected,
    applyPropsToSelected,
    selectedLabel,
    panelDraft,
    metrics,
    chartPoints,
    showVectors,
    setShowVectors,
    saveRoomSnapshot,
  };
}
