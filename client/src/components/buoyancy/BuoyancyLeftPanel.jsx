import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { LabButton } from "../ui/LabButton.jsx";
import { LabInput } from "../ui/LabInput.jsx";
import { MATERIALS } from "../../lib/buoyancy/materials.js";
import { useBuoyancyExperiment } from "../../context/BuoyancyExperimentContext.jsx";

/**
 * @param {{
 *   bodyUi: null | { label: string; kind: string; massKg: number; volumeM3: number; material: string; color: string };
 *   onApply: (patch: { massKg?: number; volumeM3?: number; material?: string; color?: string; kind?: string }) => void;
 * }} props
 */
export function BuoyancyLeftPanel({ bodyUi, onApply }) {
  const { fluidDensity, setFluidDensity, setPendingAdd } = useBuoyancyExperiment();
  const [tab, setTab] = useState(/** @type {"objects" | "settings"} */ ("objects"));
  const [shape, setShape] = useState("box");
  const [mass, setMass] = useState("2");
  const [volume, setVolume] = useState("0.002");
  const [density, setDensity] = useState("1000");
  const [material, setMaterial] = useState("custom");
  const [color, setColor] = useState("#1E90FF");

  useEffect(() => {
    if (!bodyUi) return;
    setShape(bodyUi.kind === "circle" ? "circle" : "box");
    setMass(String(bodyUi.massKg));
    setVolume(String(bodyUi.volumeM3));
    setDensity(String(Math.round((bodyUi.massKg / bodyUi.volumeM3) * 100) / 100));
    setMaterial(bodyUi.material);
    setColor(bodyUi.color);
  }, [bodyUi?.label, bodyUi?.massKg, bodyUi?.volumeM3, bodyUi?.material, bodyUi?.color, bodyUi?.kind]);

  const rho = Number.parseFloat(String(density).replace(",", "."));
  const m = Number.parseFloat(String(mass).replace(",", "."));
  const v = Number.parseFloat(String(volume).replace(",", "."));

  function setMassFromDensity(newRho) {
    if (!Number.isFinite(newRho) || !Number.isFinite(v) || v <= 0) return;
    setDensity(String(Math.round(newRho * 100) / 100));
    setMass(String(Math.round(newRho * v * 1000) / 1000));
  }

  function setDensityFromMassVol(newM, newV) {
    if (!Number.isFinite(newM) || !Number.isFinite(newV) || newV <= 0) return;
    setDensity(String(Math.round((newM / newV) * 100) / 100));
  }

  function handleApply() {
    if (!bodyUi) return;
    const massKg = Number.parseFloat(String(mass).replace(",", "."));
    const volumeM3 = Number.parseFloat(String(volume).replace(",", "."));
    if (!Number.isFinite(massKg) || !Number.isFinite(volumeM3) || volumeM3 <= 0 || massKg <= 0) return;
    onApply({
      massKg,
      volumeM3,
      material,
      color,
      kind: shape === "circle" ? "circle" : "box",
    });
  }

  return (
    <aside className="flex w-[256px] shrink-0 flex-col border-r border-slate-200 bg-[#FAFBFC] sm:w-[272px]">
      <div className="flex shrink-0 border-b border-slate-200/90 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTab("objects")}
          className={`flex-1 border-b-2 py-2.5 text-center text-xs font-semibold ${
            tab === "objects"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Objects
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`flex-1 border-b-2 py-2.5 text-center text-xs font-semibold ${
            tab === "settings"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Settings
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        {tab === "objects" ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">Add object</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAdd("box")}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-lab-blue hover:text-lab-blue"
                >
                  Box
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAdd("circle")}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-lab-blue hover:text-lab-blue"
                >
                  Circle
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Properties
              </p>
              {!bodyUi ? (
                <p className="mt-2 text-xs text-slate-500">Select an object on the canvas.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Shape
                    <select
                      value={shape}
                      onChange={(e) => setShape(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-2 focus:ring-lab-blue/30"
                    >
                      <option value="box">Box</option>
                      <option value="circle">Circle</option>
                    </select>
                  </label>
                  <LabInput
                    label="Mass (kg)"
                    type="number"
                    step="any"
                    value={mass}
                    onChange={(e) => {
                      setMass(e.target.value);
                      const mm = Number.parseFloat(e.target.value.replace(",", "."));
                      const vv = Number.parseFloat(String(volume).replace(",", "."));
                      if (Number.isFinite(mm) && Number.isFinite(vv) && vv > 0) {
                        setDensityFromMassVol(mm, vv);
                      }
                    }}
                  />
                  <LabInput
                    label="Volume (m³)"
                    type="number"
                    step="any"
                    value={volume}
                    onChange={(e) => {
                      setVolume(e.target.value);
                      const vv = Number.parseFloat(e.target.value.replace(",", "."));
                      if (Number.isFinite(m) && Number.isFinite(vv) && vv > 0) {
                        setDensityFromMassVol(m, vv);
                      }
                    }}
                  />
                  <LabInput
                    label="Density (kg/m³)"
                    type="number"
                    step="any"
                    value={density}
                    readOnly
                    className="[&_input]:cursor-default [&_input]:bg-slate-50 [&_input]:text-slate-700"
                  />
                  <label className="block text-xs font-medium text-slate-600">
                    Material
                    <select
                      value={material}
                      onChange={(e) => {
                        const id = e.target.value;
                        setMaterial(id);
                        const d0 = MATERIALS.find((x) => x.id === id)?.density;
                        if (typeof d0 === "number") setMassFromDensity(d0);
                      }}
                      className="mt-0.5 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-2 focus:ring-lab-blue/30"
                    >
                      {MATERIALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Color
                    <span className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <span className="font-mono text-[11px] text-slate-700">{color}</span>
                    </span>
                  </label>
                  <LabButton
                    type="button"
                    variant="outline"
                    className="w-full py-2 text-xs"
                    onClick={handleApply}
                  >
                    Apply
                  </LabButton>
                </div>
              )}
            </div>

            <div className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-[11px] leading-snug text-sky-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-lab-blue" aria-hidden />
              <p>An object floats if buoyant force is greater than or equal to its weight.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Fluid</p>
            <LabInput
              label="Fluid density (kg/m³)"
              type="number"
              step="any"
              value={String(fluidDensity)}
              onChange={(e) => {
                const x = Number.parseFloat(e.target.value.replace(",", "."));
                if (Number.isFinite(x) && x > 0) setFluidDensity(x);
              }}
            />
            <p className="text-[11px] text-slate-500">
              Buoyancy uses F_b = ρ_fluid V_sub g with linear drag while submerged.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
