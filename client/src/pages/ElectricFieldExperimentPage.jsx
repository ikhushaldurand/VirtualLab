import { useCallback, useEffect, useRef, useState } from "react";
import {
  ElectricFieldChargesProvider,
  useElectricFieldCharges,
} from "../context/ElectricFieldChargesContext.jsx";
import { sampleDistanceChartPoint } from "../lib/electrostatics/chartSample.js";
import { ElectricFieldCanvas } from "../components/electric-field/ElectricFieldCanvas.jsx";
import { ElectricFieldControlBar } from "../components/electric-field/ElectricFieldControlBar.jsx";
import { ElectricFieldLeftPanel } from "../components/electric-field/ElectricFieldLeftPanel.jsx";
import { ElectricFieldRightPanel } from "../components/electric-field/ElectricFieldRightPanel.jsx";
import { ElectricFieldToolRail } from "../components/electric-field/ElectricFieldToolRail.jsx";
import { ElectricFieldTopBar } from "../components/electric-field/ElectricFieldTopBar.jsx";

function ElectricFieldShell() {
  const { charges, resetCharges } = useElectricFieldCharges();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [chartData, setChartData] = useState(
    /** @type {{ distance: number; eMag: number; vPot: number }[]} */ ([]),
  );
  const [rightTab, setRightTab] = useState(/** @type {"analytics" | "vectors"} */ ("analytics"));
  const [probeDisplay, setProbeDisplay] = useState({ x: 0, y: 0 });
  const probeRef = useRef(probeDisplay);

  const onProbeWorld = useCallback((x, y) => {
    const p = { x, y };
    probeRef.current = p;
    setProbeDisplay(p);
  }, []);

  /** While paused, update the trail when separation or field at the midpoint changes. */
  useEffect(() => {
    if (playing) return undefined;
    setChartData((prev) => {
      const pt = sampleDistanceChartPoint(charges);
      if (prev.length === 0) return [pt];
      const last = prev[prev.length - 1];
      const sameD = Math.abs(last.distance - pt.distance) < 1e-5;
      if (sameD) {
        const copy = [...prev];
        copy[copy.length - 1] = pt;
        return copy;
      }
      return [...prev, pt].slice(-240);
    });
    return undefined;
  }, [charges, playing]);

  useEffect(() => {
    if (!playing) return undefined;
    const intervalMs = Math.max(20, Math.round(50 / speed));
    const id = window.setInterval(() => {
      setChartData((prev) => {
        const pt = sampleDistanceChartPoint(charges);
        const last = prev.at(-1);
        if (
          last &&
          Math.abs(last.distance - pt.distance) < 1e-9 &&
          Math.abs(last.eMag - pt.eMag) < 1e-20 &&
          Math.abs(last.vPot - pt.vPot) < 1e-20
        ) {
          return prev;
        }
        const next = [...prev, pt];
        return next.length > 240 ? next.slice(-240) : next;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, speed, charges]);

  const handleReset = useCallback(() => {
    resetCharges();
    setChartData([]);
    setPlaying(false);
  }, [resetCharges]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-800">
      <ElectricFieldTopBar />
      <ElectricFieldControlBar
        playing={playing}
        onPlay={() => {
          setPlaying(true);
          setChartData((prev) => {
            if (prev.length > 0) return prev;
            return [sampleDistanceChartPoint(charges)];
          });
        }}
        onPause={() => setPlaying(false)}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
      />
      <div className="flex min-h-0 flex-1 flex-row">
        <ElectricFieldLeftPanel />
        <div className="flex min-h-0 min-w-0 flex-1 flex-row">
          <ElectricFieldToolRail />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ElectricFieldCanvas onProbeWorld={onProbeWorld} />
            <footer className="shrink-0 border-t border-slate-200 bg-[#FAFBFC] py-2 text-center text-[11px] font-mono text-slate-600">
              X: {probeDisplay.x.toFixed(2)} m<span className="mx-2"> </span>Y:{" "}
              {probeDisplay.y.toFixed(2)} m
            </footer>
          </div>
        </div>
        <ElectricFieldRightPanel
          chartData={chartData}
          probeWorld={probeDisplay}
          rightTab={rightTab}
          onRightTab={setRightTab}
        />
      </div>
    </div>
  );
}

export function ElectricFieldExperimentPage() {
  return (
    <ElectricFieldChargesProvider>
      <ElectricFieldShell />
    </ElectricFieldChargesProvider>
  );
}
