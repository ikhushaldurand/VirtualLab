import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { LabButton } from "../ui/LabButton.jsx";
import { LabInput } from "../ui/LabInput.jsx";
import { useElectricFieldCharges } from "../../context/ElectricFieldChargesContext.jsx";
import { signedMicroCFromInput } from "../../lib/electrostatics/chargeUnits.js";

export function ElectricFieldLeftPanel() {
  const { selected, selectedId, setTool, updateCharge } = useElectricFieldCharges();
  const [tab, setTab] = useState(/** @type {"charges" | "settings"} */ ("charges"));
  const [abs, setAbs] = useState("1");
  const [unit, setUnit] = useState(/** @type {"μC" | "nC" | "C"} */ ("μC"));
  const [signPos, setSignPos] = useState(true);
  const [color, setColor] = useState("#EF4444");

  useEffect(() => {
    if (!selected) return;
    setAbs(String(Math.abs(selected.qMicroC)));
    setUnit("μC");
    setSignPos(selected.qMicroC >= 0);
    setColor(selected.color);
  }, [selectedId, selected?.qMicroC, selected?.color, selected]);

  function apply() {
    if (!selected) return;
    const a = Number.parseFloat(String(abs).replace(",", "."));
    if (!Number.isFinite(a) || a < 0) return;
    const qMicroC = signedMicroCFromInput(a, unit, signPos);
    updateCharge(selected.id, { qMicroC, color });
  }

  return (
    <aside className="flex w-[256px] shrink-0 flex-col border-r border-slate-200 bg-[#FAFBFC] sm:w-[272px]">
      <div className="flex shrink-0 border-b border-slate-200/90 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTab("charges")}
          className={`flex-1 border-b-2 py-2.5 text-center text-xs font-semibold ${
            tab === "charges"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Charges
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
        {tab === "charges" ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-slate-600">
                Click on the canvas to place a charge.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTool("addPlus")}
                  className="flex-1 rounded-lg border-2 border-lab-red bg-white py-2 text-xs font-bold text-lab-red shadow-sm transition hover:bg-red-50"
                >
                  + Positive
                </button>
                <button
                  type="button"
                  onClick={() => setTool("addMinus")}
                  className="flex-1 rounded-lg border-2 border-lab-blue bg-white py-2 text-xs font-bold text-lab-blue shadow-sm transition hover:bg-sky-50"
                >
                  − Negative
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Properties
              </p>
              {!selected ? (
                <p className="mt-2 text-xs text-slate-500">Select a charge to edit properties.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <LabInput
                      label="Magnitude |q|"
                      className="min-w-0 flex-1"
                      type="number"
                      step="any"
                      value={abs}
                      onChange={(e) => setAbs(e.target.value)}
                    />
                    <label className="block w-[4.5rem] shrink-0 text-xs font-medium text-slate-600">
                      <span className="mb-1 block">Unit</span>
                      <select
                        value={unit}
                        onChange={(e) =>
                          setUnit(/** @type {"μC" | "nC" | "C"} */ (e.target.value))
                        }
                        className="mt-0.5 w-full rounded-lg border border-slate-200/90 bg-white px-1.5 py-2 text-[11px] text-slate-900 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-2 focus:ring-lab-blue/30"
                      >
                        <option value="μC">μC</option>
                        <option value="nC">nC</option>
                        <option value="C">C</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-slate-600">
                    Sign
                    <select
                      value={signPos ? "+" : "-"}
                      onChange={(e) => setSignPos(e.target.value === "+")}
                      className="mt-0.5 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-2 focus:ring-lab-blue/30"
                    >
                      <option value="+">+ Positive</option>
                      <option value="-">− Negative</option>
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
                    onClick={apply}
                  >
                    Apply
                  </LabButton>
                </div>
              )}
            </div>

            <div className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-[11px] leading-snug text-sky-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-lab-blue" aria-hidden />
              <p>
                Use + / − buttons or click on the canvas to add charges. Drag to reposition;
                use the trash tool or delete in the analytics panel to remove a charge.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Simulation</p>
            <p>
              Electrostatic superposition is applied:{" "}
              <span className="font-mono text-[10px] text-slate-700">
                E⃗ = Σ kqᵢ r̂ᵢ / rᵢ²
              </span>
              . Field lines are traced along the net field direction from positive sources.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
