import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildFieldLines } from "../../lib/electrostatics/fieldLines.js";
import { FIELD_LINE_BOUNDS, worldExtents, worldToPixel } from "../../lib/electrostatics/worldView.js";
import { useElectricFieldCharges } from "../../context/ElectricFieldChargesContext.jsx";

/**
 * @param {{ onProbeWorld?: (x: number, y: number) => void; className?: string }} props
 */
export function ElectricFieldCanvas({ onProbeWorld, className = "" }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const {
    charges,
    selectedId,
    setSelectedId,
    tool,
    setTool,
    viewCenter,
    setViewCenter,
    moveCharge,
    addCharge,
    deleteCharge,
  } = useElectricFieldCharges();

  const fieldLines = useMemo(
    () => buildFieldLines(charges, FIELD_LINE_BOUNDS, 18),
    [charges],
  );

  const dragRef = useRef(
    /** @type {{ id: string; ox: number; oy: number } | null} */ (null),
  );
  const panRef = useRef(
    /** @type {{ startViewX: number; startViewY: number; startClientX: number; startClientY: number } | null} */ (
      null
    ),
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const W = Math.max(120, Math.floor(rect.width));
    const H = Math.max(120, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const gridStepPx = 14;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += gridStepPx) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += gridStepPx) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = "#FF3B30";
    ctx.lineWidth = 1.25;
    for (const line of fieldLines) {
      if (line.length < 2) continue;
      ctx.beginPath();
      const p0 = worldToPixel(line[0].x, line[0].y, W, H, viewCenter);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < line.length; i++) {
        const p = worldToPixel(line[i].x, line[i].y, W, H, viewCenter);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    const chargeRadiusPx = 18;
    for (const c of charges) {
      const p = worldToPixel(c.x, c.y, W, H, viewCenter);
      const sel = c.id === selectedId;
      ctx.beginPath();
      ctx.arc(p.x, p.y, chargeRadiusPx, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      if (sel) {
        ctx.strokeStyle = "#1E90FF";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const sym = c.qMicroC > 0 ? "+" : "−";
      ctx.fillText(sym, p.x, p.y + 1);
    }

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
  }, [charges, fieldLines, selectedId, viewCenter]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  const hitCharge = useCallback(
    (wx, wy) => {
      let best = /** @type {{ id: string; d: number } | null} */ (null);
      for (const c of charges) {
        const d = Math.hypot(wx - c.x, wy - c.y);
        if (d < 0.55 && (!best || d < best.d)) best = { id: c.id, d };
      }
      return best?.id ?? null;
    },
    [charges],
  );

  const screenToCanvas = useCallback((clientX, clientY) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0, W: 1, H: 1 };
    const r = wrap.getBoundingClientRect();
    return {
      x: clientX - r.left,
      y: clientY - r.top,
      W: r.width,
      H: r.height,
    };
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      const { x, y, W, H } = screenToCanvas(e.clientX, e.clientY);
      const { hx, hy } = worldExtents(W, H);
      if (onProbeWorld) {
        const wx = (x / W - 0.5) * 2 * hx + viewCenter.x;
        const wy = (0.5 - y / H) * 2 * hy + viewCenter.y;
        onProbeWorld(wx, wy);
      }

      const drag = dragRef.current;
      if (drag && (tool === "move" || tool === "select")) {
        const wx = (x / W - 0.5) * 2 * hx + viewCenter.x;
        const wy = (0.5 - y / H) * 2 * hy + viewCenter.y;
        moveCharge(drag.id, wx - drag.ox, wy - drag.oy);
      }

      const pan = panRef.current;
      if (pan && tool === "pan") {
        const dx = e.clientX - pan.startClientX;
        const dy = e.clientY - pan.startClientY;
        setViewCenter({
          x: pan.startViewX - (dx / W) * 2 * hx,
          y: pan.startViewY + (dy / H) * 2 * hy,
        });
      }
    },
    [moveCharge, onProbeWorld, screenToCanvas, setViewCenter, tool, viewCenter],
  );

  const onPointerDown = useCallback(
    (e) => {
      const { x, y, W, H } = screenToCanvas(e.clientX, e.clientY);
      const { hx, hy } = worldExtents(W, H);
      const wx = (x / W - 0.5) * 2 * hx + viewCenter.x;
      const wy = (0.5 - y / H) * 2 * hy + viewCenter.y;
      const hit = hitCharge(wx, wy);

      if (tool === "pan") {
        panRef.current = {
          startViewX: viewCenter.x,
          startViewY: viewCenter.y,
          startClientX: e.clientX,
          startClientY: e.clientY,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (tool === "delete" && hit) {
        deleteCharge(hit);
        return;
      }

      if (tool === "addPlus") {
        addCharge({ x: wx, y: wy, qMicroC: 1, color: "#EF4444" });
        setTool("select");
        return;
      }
      if (tool === "addMinus") {
        addCharge({ x: wx, y: wy, qMicroC: -1, color: "#2563EB" });
        setTool("select");
        return;
      }

      if (hit) {
        setSelectedId(hit);
        const c = charges.find((ch) => ch.id === hit);
        if (c && (tool === "move" || tool === "select")) {
          dragRef.current = { id: hit, ox: wx - c.x, oy: wy - c.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (tool === "select") {
        setSelectedId(null);
      }
    },
    [
      addCharge,
      charges,
      deleteCharge,
      hitCharge,
      screenToCanvas,
      setSelectedId,
      setTool,
      tool,
      viewCenter,
    ],
  );

  const onPointerUp = useCallback((e) => {
    dragRef.current = null;
    panRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative min-h-0 min-w-0 flex-1 bg-white ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
