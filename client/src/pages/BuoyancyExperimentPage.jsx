import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { BuoyancyControlBar } from "../components/buoyancy/BuoyancyControlBar.jsx";
import { BuoyancyLeftPanel } from "../components/buoyancy/BuoyancyLeftPanel.jsx";
import { BuoyancyRightPanel } from "../components/buoyancy/BuoyancyRightPanel.jsx";
import { BuoyancyToolRail } from "../components/buoyancy/BuoyancyToolRail.jsx";
import { BuoyancyTopBar } from "../components/buoyancy/BuoyancyTopBar.jsx";
import {
  BuoyancyExperimentProvider,
  useBuoyancyExperiment,
} from "../context/BuoyancyExperimentContext.jsx";
import { attachBodyMeta, makeVlId } from "../lib/physics/bodyFactory.js";
import { G, submergedHeightFraction } from "../lib/buoyancy/buoyancyMath.js";

const {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Query,
  Render,
  Runner,
  World,
} = Matter;

const WALL_THICK = 48;
const FORCE_K = 6.2e-6;
const DRAG_K = 1.35e-5;

/** Matter.js 0.20 has no `Mouse.setPosition`; sync position for synthetic pointer events. */
function setMousePosition(mouse, x, y) {
  mouse.position.x = x;
  mouse.position.y = y;
}

function buildWalls(width, height) {
  const t = WALL_THICK;
  return [
    Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, {
      isStatic: true,
      label: "wall-bottom",
      friction: 1,
      render: { fillStyle: "#cbd5e1", visible: true },
    }),
    Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, {
      isStatic: true,
      label: "wall-left",
      friction: 0.6,
      render: { fillStyle: "#e2e8f0", visible: true },
    }),
    Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, {
      isStatic: true,
      label: "wall-right",
      friction: 0.6,
      render: { fillStyle: "#e2e8f0", visible: true },
    }),
  ];
}

function createDynamicBody(kind, x, y, opts) {
  const { massKg, volumeM3, material, color } = opts;
  const label = makeVlId();
  const common = {
    label,
    friction: 0.45,
    frictionAir: 0.01,
    restitution: 0.08,
    render: {
      fillStyle: color,
      strokeStyle: "#0f172a",
      lineWidth: 1,
    },
  };
  const body =
    kind === "circle"
      ? Bodies.circle(x, y, 36, common)
      : Bodies.rectangle(x, y, 88, 72, common);
  attachBodyMeta(body, kind);
  body.plugin.virtualLab = {
    kind,
    massKg,
    volumeM3,
    material,
    color,
    baseVolume: volumeM3,
    lastFb: 0,
    lastW: 0,
    lastNet: 0,
    lastFrac: 0,
  };
  Body.setMass(body, massKg);
  return body;
}

function BuoyancyWork() {
  const {
    fluidDensityRef,
    selectedLabel,
    setSelectedLabel,
    tool,
    setTool,
    zoom,
    pendingAdd,
    setPendingAdd,
  } = useBuoyancyExperiment();

  const toolRef = useRef(tool);
  const selectedLabelRef = useRef(selectedLabel);
  const pendingAddRef = useRef(pendingAdd);
  const setSelectedLabelRef = useRef(setSelectedLabel);
  const setPendingAddRef = useRef(setPendingAdd);
  const setToolRef = useRef(setTool);
  const setBodyUiRef = useRef(/** @type {null | ((u: unknown) => void)} */ (null));

  toolRef.current = tool;
  selectedLabelRef.current = selectedLabel;
  pendingAddRef.current = pendingAdd;
  setSelectedLabelRef.current = setSelectedLabel;
  setPendingAddRef.current = setPendingAdd;
  setToolRef.current = setTool;

  const mountRef = useRef(null);
  const hostRef = useRef(null);
  const engineRef = useRef(/** @type {import("matter-js").Engine | null} */ (null));
  const renderRef = useRef(/** @type {import("matter-js").Render | null} */ (null));
  const runnerRef = useRef(/** @type {import("matter-js").Runner | null} */ (null));
  const mouseRef = useRef(/** @type {import("matter-js").Mouse | null} */ (null));
  const mcRef = useRef(/** @type {import("matter-js").MouseConstraint | null} */ (null));
  const surfaceYRef = useRef(0);
  const wavePhaseRef = useRef(0);
  const panDragRef = useRef(/** @type {{ x: number; y: number } | null} */ (null));
  const readBodyUiRef = useRef(() => null);

  const [size, setSize] = useState({ w: 520, h: 520 });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [chartData, setChartData] = useState(
    /** @type {{ t: number; fb: number; weight: number; net: number; subFrac: number }[]} */ ([]),
  );
  const [rightTab, setRightTab] = useState(/** @type {"analytics" | "vectors"} */ ("analytics"));
  const [probe, setProbe] = useState({ x: 0, y: 0 });
  const [bodyUi, setBodyUi] = useState(
    /** @type {null | { label: string; kind: string; massKg: number; volumeM3: number; material: string; color: string }} */ (
      null
    ),
  );

  setBodyUiRef.current = setBodyUi;

  const simTimeRef = useRef(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width - 16));
      const h = Math.max(280, Math.floor(r.height - 16));
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const readBodyUi = useCallback((body) => {
    const vl = body.plugin?.virtualLab;
    if (!vl) return null;
    return {
      label: body.label,
      kind: vl.kind,
      massKg: vl.massKg,
      volumeM3: vl.volumeM3,
      material: vl.material,
      color: vl.color ?? body.render?.fillStyle ?? "#1E90FF",
    };
  }, []);

  readBodyUiRef.current = readBodyUi;

  const resetWorldBodies = useCallback((engine, W, H) => {
    const world = engine.world;
    Composite.allBodies(world)
      .filter((b) => b.label?.startsWith("vl-") || b.label?.startsWith("wall-"))
      .forEach((b) => Composite.remove(world, b));
    World.add(world, buildWalls(W, H));
    const surfaceY = H * 0.5;
    surfaceYRef.current = surfaceY;
    const block = createDynamicBody("box", W * 0.5, surfaceY - 48, {
      massKg: 2,
      volumeM3: 0.002,
      material: "custom",
      color: "#1E90FF",
    });
    Composite.add(world, block);
    setSelectedLabelRef.current(block.label);
    setBodyUiRef.current?.(readBodyUiRef.current(block));
    const mc = mcRef.current;
    if (mc?.mouse) {
      setMousePosition(mc.mouse, W / 2, H / 2);
    }
  }, []);

  useEffect(() => {
    const W = size.w;
    const H = size.h;
    const mount = mountRef.current;
    if (!mount || W < 120 || H < 120) return undefined;

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.y = 0;
    engine.world.gravity.scale = 0;
    engineRef.current = engine;

    const render = Render.create({
      element: mount,
      engine,
      options: {
        width: W,
        height: H,
        wireframes: false,
        background: "#ffffff",
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        hasBounds: true,
        bounds: { min: { x: 0, y: 0 }, max: { x: W, y: H } },
      },
    });
    renderRef.current = render;

    const mouse = Mouse.create(render.canvas);
    mouseRef.current = mouse;
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    mcRef.current = mc;
    World.add(engine.world, mc);
    render.mouse = mouse;

    const runner = Runner.create();
    runnerRef.current = runner;

    resetWorldBodies(engine, W, H);

    const surfaceY = H * 0.5;
    surfaceYRef.current = surfaceY;

    const onBefore = () => {
      const rho = fluidDensityRef.current;
      const bodies = Composite.allBodies(engine.world);
      for (const body of bodies) {
        if (!body.label?.startsWith("vl-") || body.isStatic) continue;
        const vl = body.plugin?.virtualLab;
        if (!vl) continue;
        const massKg = vl.massKg ?? body.mass;
        const vol = vl.volumeM3 ?? 0.001;
        const frac = submergedHeightFraction(body, surfaceY, H);
        const Vsub = vol * frac;
        const Fb = rho * Vsub * G;
        const Wn = massKg * G;
        Body.applyForce(body, body.position, { x: 0, y: Wn * FORCE_K });
        Body.applyForce(body, body.position, { x: 0, y: -Fb * FORCE_K });
        if (frac > 0.02) {
          Body.applyForce(body, body.position, {
            x: -body.velocity.x * body.mass * DRAG_K,
            y: -body.velocity.y * body.mass * DRAG_K,
          });
          body.angularVelocity *= 0.988;
        }
        vl.lastFb = Fb;
        vl.lastW = Wn;
        vl.lastNet = Fb - Wn;
        vl.lastFrac = frac;
      }
    };

    const onAfterRender = () => {
      wavePhaseRef.current += 0.045;
      const ctx = render.context;
      const ph = wavePhaseRef.current;
      const waterTop = surfaceY;
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = "rgba(30, 144, 255, 0.32)";
      ctx.beginPath();
      ctx.moveTo(0, waterTop);
      for (let x = 0; x <= W; x += 6) {
        const y = waterTop + Math.sin((x + ph * 40) * 0.018) * 5;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(30, 144, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = waterTop + Math.sin((x + ph * 40) * 0.018) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      const all = Composite.allBodies(engine.world);
      const selLabel = selectedLabelRef.current;
      const sel = selLabel ? all.find((b) => b.label === selLabel) : null;
      if (sel && !sel.isStatic && sel.plugin?.virtualLab) {
        const { x, y } = sel.position;
        const Fb = sel.plugin.virtualLab.lastFb || 0;
        const Wb = sel.plugin.virtualLab.lastW || 0;
        const scale = 0.012;
        const lenB = Math.min(72, Math.max(16, Fb * scale));
        const lenW = Math.min(72, Math.max(16, Wb * scale));
        ctx.save();
        ctx.font = "600 11px Inter, system-ui, sans-serif";
        ctx.strokeStyle = "#22c55e";
        ctx.fillStyle = "#166534";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - lenB);
        ctx.stroke();
        ctx.fillText("F_buoyancy", x + 8, Math.max(14, y - lenB - 4));
        ctx.strokeStyle = "#FF3B30";
        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + lenW);
        ctx.stroke();
        ctx.fillText("W (Weight)", x + 8, Math.min(H - 8, y + lenW + 14));
        ctx.restore();
      }
    };

    Events.on(engine, "beforeUpdate", onBefore);
    Events.on(render, "afterRender", onAfterRender);

    Render.run(render);
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: W, y: H },
    });

    function canvasPoint(e) {
      const rect = render.canvas.getBoundingClientRect();
      const sx = render.options.width / rect.width;
      const sy = render.options.height / rect.height;
      return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
      };
    }

    function onPointerDown(e) {
      const p = canvasPoint(e);
      setMousePosition(mouse, p.x, p.y);
      const bodies = Composite.allBodies(engine.world);
      const hits = Query.point(bodies, p);
      const hitBody = hits.find((b) => b.label?.startsWith("vl-"));
      const t = toolRef.current;
      const pa = pendingAddRef.current;

      if (t === "delete" && hitBody) {
        Composite.remove(engine.world, hitBody);
        if (selectedLabelRef.current === hitBody.label) {
          selectedLabelRef.current = null;
          setBodyUiRef.current?.(null);
          setSelectedLabelRef.current(null);
        }
        return;
      }

      if (pa && !hitBody) {
        setPendingAddRef.current(null);
        const b = createDynamicBody(pa, p.x, p.y, {
          massKg: 1.5,
          volumeM3: 0.0015,
          material: "custom",
          color: pa === "circle" ? "#38bdf8" : "#1E90FF",
        });
        Composite.add(engine.world, b);
        selectedLabelRef.current = b.label;
        setSelectedLabelRef.current(b.label);
        setBodyUiRef.current?.(readBodyUiRef.current(b));
        setToolRef.current("pointer");
        return;
      }

      if (t === "pointer" || t === "move") {
        if (hitBody) {
          selectedLabelRef.current = hitBody.label;
          setSelectedLabelRef.current(hitBody.label);
          setBodyUiRef.current?.(readBodyUiRef.current(hitBody));
        } else {
          selectedLabelRef.current = null;
          setSelectedLabelRef.current(null);
          setBodyUiRef.current?.(null);
        }
      }

      if (t === "hand" && !hitBody) {
        panDragRef.current = { x: p.x, y: p.y };
      }
    }

    function onPointerMove(e) {
      const p = canvasPoint(e);
      setMousePosition(mouse, p.x, p.y);
      const ppm = H / 4;
      setProbe({
        x: (p.x - W / 2) / ppm,
        y: (surfaceY - p.y) / ppm,
      });

      const pd = panDragRef.current;
      const t = toolRef.current;
      if (t === "hand" && pd) {
        const dx = p.x - pd.x;
        const dy = p.y - pd.y;
        panDragRef.current = { x: p.x, y: p.y };
        for (const b of Composite.allBodies(engine.world)) {
          if (!b.isStatic && b.label?.startsWith("vl-")) {
            Body.translate(b, { x: dx, y: dy });
          }
        }
      }
    }

    function onPointerUp() {
      panDragRef.current = null;
    }

    render.canvas.addEventListener("pointerdown", onPointerDown);
    render.canvas.addEventListener("pointermove", onPointerMove);
    render.canvas.addEventListener("pointerup", onPointerUp);
    render.canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      Events.off(engine, "beforeUpdate", onBefore);
      Events.off(render, "afterRender", onAfterRender);
      render.canvas.removeEventListener("pointerdown", onPointerDown);
      render.canvas.removeEventListener("pointermove", onPointerMove);
      render.canvas.removeEventListener("pointerup", onPointerUp);
      render.canvas.removeEventListener("pointerleave", onPointerUp);
      const r = runnerRef.current;
      if (r) Runner.stop(r);
      Render.stop(render);
      Composite.remove(engine.world, mc, true);
      Engine.clear(engine);
      if (render.canvas?.parentNode) render.canvas.remove();
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      mouseRef.current = null;
      mcRef.current = null;
    };
  }, [size.w, size.h, fluidDensityRef, resetWorldBodies]);

  useEffect(() => {
    const mc = mcRef.current;
    if (!mc) return undefined;
    const enable = tool === "pointer" || tool === "move";
    mc.constraint.stiffness = enable ? 0.2 : 0;
    return undefined;
  }, [tool]);

  useEffect(() => {
    const engine = engineRef.current;
    const runner = runnerRef.current;
    if (!engine || !runner) return undefined;
    if (playing) {
      Runner.run(runner, engine);
    } else {
      Runner.stop(runner);
    }
    engine.timing.timeScale = speed;
    return undefined;
  }, [playing, speed]);

  useEffect(() => {
    if (!playing) return undefined;
    const dt = 0.05 * speed;
    const id = window.setInterval(() => {
      simTimeRef.current += dt;
      const engine = engineRef.current;
      if (!engine) return;
      const t = simTimeRef.current;
      const label = selectedLabelRef.current;
      const body = label
        ? Composite.allBodies(engine.world).find((b) => b.label === label)
        : Composite.allBodies(engine.world).find((b) => b.label?.startsWith("vl-") && !b.isStatic);
      const vl = body?.plugin?.virtualLab;
      if (!vl) return;
      setChartData((prev) => {
        const row = {
          t,
          fb: vl.lastFb,
          weight: vl.lastW,
          net: vl.lastNet,
          subFrac: vl.lastFrac,
        };
        const next = [...prev, row];
        return next.length > 200 ? next.slice(-200) : next;
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    const runner = runnerRef.current;
    if (!engine) return;
    if (runner) Runner.stop(runner);
    setPlaying(false);
    simTimeRef.current = 0;
    setChartData([]);
    resetWorldBodies(engine, size.w, size.h);
  }, [resetWorldBodies, size.w, size.h]);

  const applyPatchToBody = useCallback(
    (engine, label, patch) => {
      const body = Composite.allBodies(engine.world).find((b) => b.label === label);
      if (!body?.plugin?.virtualLab) return;
      const vl = body.plugin.virtualLab;
      const pos = { ...body.position };
      const wantKind = patch.kind ?? vl.kind;

      if (wantKind !== vl.kind) {
        Composite.remove(engine.world, body);
        const nb = createDynamicBody(wantKind, pos.x, pos.y, {
          massKg: patch.massKg ?? vl.massKg,
          volumeM3: patch.volumeM3 ?? vl.volumeM3,
          material: patch.material ?? vl.material,
          color: patch.color ?? vl.color,
        });
        nb.label = label;
        Composite.add(engine.world, nb);
        setBodyUi(readBodyUi(nb));
        return;
      }

      if (patch.color) {
        vl.color = patch.color;
        body.render.fillStyle = patch.color;
      }
      if (patch.material != null) vl.material = patch.material;
      if (patch.massKg != null) {
        vl.massKg = patch.massKg;
        Body.setMass(body, patch.massKg);
      }
      if (patch.volumeM3 != null && patch.volumeM3 > 0 && vl.volumeM3 > 0) {
        const ratio = patch.volumeM3 / vl.volumeM3;
        const s = Math.sqrt(Math.max(0.15, Math.min(4.5, ratio)));
        Body.scale(body, s, s, body.position);
        vl.volumeM3 = patch.volumeM3;
      }
      setBodyUi(readBodyUi(body));
    },
    [readBodyUi],
  );

  const onApply = useCallback(
    (patch) => {
      const engine = engineRef.current;
      if (!engine || !selectedLabel) return;
      applyPatchToBody(engine, selectedLabel, patch);
    },
    [applyPatchToBody, selectedLabel],
  );

  const onDelete = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !selectedLabel) return;
    const body = Composite.allBodies(engine.world).find((b) => b.label === selectedLabel);
    if (body) Composite.remove(engine.world, body);
    setSelectedLabel(null);
    setBodyUi(null);
  }, [selectedLabel, setSelectedLabel]);

  const W = size.w;
  const H = size.h;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-800">
      <BuoyancyTopBar />
      <BuoyancyControlBar
        playing={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
      />
      <div className="flex min-h-0 flex-1 flex-row">
        <BuoyancyLeftPanel bodyUi={bodyUi} onApply={onApply} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-row">
          <BuoyancyToolRail />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              ref={hostRef}
              className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[#FAFBFC] p-2"
            >
              <div
                className="relative max-h-full max-w-full"
                style={{
                  width: W,
                  height: H,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className="overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-lg"
                  style={{
                    width: W,
                    height: H,
                    backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  <div
                    ref={mountRef}
                    className="h-full w-full [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
                  />
                </div>
              </div>
            </div>
            <footer className="shrink-0 border-t border-slate-200 bg-[#FAFBFC] py-2 text-center text-[11px] font-mono text-slate-600">
              x: {probe.x.toFixed(2)} m<span className="mx-3"> </span>y: {probe.y.toFixed(2)} m
              <span className="ml-3 text-slate-400">(y = 0 at water surface)</span>
            </footer>
          </div>
        </div>
        <BuoyancyRightPanel
          chartData={chartData}
          bodyUi={bodyUi}
          onDelete={onDelete}
          rightTab={rightTab}
          onRightTab={setRightTab}
        />
      </div>
    </div>
  );
}

export function BuoyancyExperimentPage() {
  return (
    <BuoyancyExperimentProvider>
      <BuoyancyWork />
    </BuoyancyExperimentProvider>
  );
}
