import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import Matter from "matter-js";
import { getExperimentById } from "../data/experimentsCatalog.js";
import { spawnExperimentBodies } from "../lib/experiments/spawnExperimentBodies.js";
import { LabButton } from "../components/ui/LabButton.jsx";

const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Events,
  Mouse,
  MouseConstraint,
  Composite,
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

export function ExperimentRunPage() {
  const { experimentId } = useParams();
  const experiment = getExperimentById(experimentId);
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const renderRef = useRef(null);
  const [size, setSize] = useState(520);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const wrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const next = Math.floor(Math.min(r.width, r.height, 720) - 24);
      setSize(Math.max(280, next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const play = useCallback(() => {
    const r = runnerRef.current;
    const e = engineRef.current;
    if (!r || !e) return;
    Runner.run(r, e);
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    const r = runnerRef.current;
    const e = engineRef.current;
    if (!r || !e) return;
    Runner.stop(r);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    const e = engineRef.current;
    const r = runnerRef.current;
    if (!e || !experiment) return;
    if (r) Runner.stop(r);
    setRunning(false);
    Composite.allBodies(e.world)
      .filter((b) => b.label?.startsWith("vl-"))
      .forEach((b) => Composite.remove(e.world, b));
    spawnExperimentBodies(e.world, experiment.preset, size, size);
  }, [experiment, size]);

  useEffect(() => {
    if (!experiment) return undefined;
    const w = size;
    const h = size;
    const mount = mountRef.current;
    if (!mount || w < 120) return undefined;

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.y = 1;
    engine.timing.timeScale = speed;
    engineRef.current = engine;
    World.add(engine.world, buildWalls(w, h));

    const render = Render.create({
      element: mount,
      engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: "#ffffff",
        pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
        hasBounds: true,
        bounds: { min: { x: 0, y: 0 }, max: { x: w, y: h } },
      },
    });
    renderRef.current = render;

    const mouse = Mouse.create(render.canvas);
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    World.add(engine.world, mc);
    render.mouse = mouse;

    const runner = Runner.create();
    runnerRef.current = runner;

    Render.run(render);
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: w, y: h },
    });

    spawnExperimentBodies(engine.world, experiment.preset, w, h);

    const onAfter = () => {
      engine.timing.timeScale = speed;
    };
    Events.on(engine, "afterUpdate", onAfter);

    return () => {
      Events.off(engine, "afterUpdate", onAfter);
      Runner.stop(runner);
      Render.stop(render);
      Composite.remove(engine.world, mc, true);
      Engine.clear(engine);
      if (render.canvas?.parentNode) render.canvas.remove();
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, [experiment, size, speed]);

  if (!experiment) {
    return <Navigate to="/experiments" replace />;
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-800">
      <div className="shrink-0 border-b border-slate-200/90 px-4 py-3 shadow-sm">
        <Link
          to="/experiments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lab-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">
          {experiment.title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{experiment.description}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-slate-100 bg-[#FAFBFC] px-3 py-2">
        <LabButton
          type="button"
          variant="primary"
          className="gap-1.5 rounded-lg px-4 py-2 text-xs"
          onClick={play}
          disabled={running}
        >
          <Play className="h-3.5 w-3.5" />
          Play
        </LabButton>
        <LabButton
          type="button"
          variant="outline"
          className="gap-1.5 rounded-lg px-4 py-2 text-xs"
          onClick={pause}
          disabled={!running}
        >
          <Pause className="h-3.5 w-3.5" />
          Pause
        </LabButton>
        <LabButton
          type="button"
          variant="outline"
          className="gap-1.5 rounded-lg px-4 py-2 text-xs"
          onClick={reset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </LabButton>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          Speed
          <select
            value={String(speed)}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium focus:border-lab-blue focus:outline-none"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </label>
      </div>

      <div
        ref={wrapRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
      >
        <div
          className="overflow-hidden rounded-xl border-2 border-slate-900 shadow-lg"
          style={{
            width: size,
            height: size,
            maxWidth: "100%",
            maxHeight: "100%",
            backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        >
          <div
            ref={mountRef}
            className="h-full w-full [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:object-contain"
          />
        </div>
      </div>
    </div>
  );
}
