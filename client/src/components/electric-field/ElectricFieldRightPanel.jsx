import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { electricFieldAt, electricFieldMagnitude, electricPotentialAt } from "../../lib/electrostatics/electricField.js";
import { getChargeSeparationMidpoint } from "../../lib/electrostatics/chargeSeparation.js";
import { formatScientific } from "../../lib/electrostatics/formatScientific.js";
import { LabButton } from "../ui/LabButton.jsx";
import { useElectricFieldCharges } from "../../context/ElectricFieldChargesContext.jsx";

/**
 * @param {{
 *   chartData: { distance: number; eMag: number; vPot: number }[];
 *   probeWorld: { x: number; y: number };
 *   rightTab: "analytics" | "vectors";
 *   onRightTab: (t: "analytics" | "vectors") => void;
 * }} props
 */
export function ElectricFieldRightPanel({ chartData, probeWorld, rightTab, onRightTab }) {
  const { charges, selected, deleteCharge } = useElectricFieldCharges();

  const mid = useMemo(() => getChargeSeparationMidpoint(charges), [charges]);
  const eMid = Math.max(electricFieldMagnitude(mid.mx, mid.my, charges), 1e-24);
  const vMid = electricPotentialAt(mid.mx, mid.my, charges);

  const eLive = Math.max(electricFieldMagnitude(probeWorld.x, probeWorld.y, charges), 1e-24);
  const vLive = electricPotentialAt(probeWorld.x, probeWorld.y, charges);
  const { Ex, Ey } = electricFieldAt(probeWorld.x, probeWorld.y, charges);

  const chartE = chartData.map((d) => ({
    ...d,
    eLog: Math.max(d.eMag, 1e-18),
  }));

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l border-slate-200 bg-[#FAFBFC] sm:w-[300px]">
      <div className="flex shrink-0 border-b border-slate-200/90 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onRightTab("analytics")}
          className={`flex-1 border-b-2 py-2.5 text-center text-xs font-semibold ${
            rightTab === "analytics"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Live Analytics
        </button>
        <button
          type="button"
          onClick={() => onRightTab("vectors")}
          className={`flex-1 border-b-2 py-2.5 text-center text-xs font-semibold ${
            rightTab === "vectors"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Vectors
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
        {rightTab === "analytics" ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-1">
                <span className="text-[10px] font-semibold leading-tight text-slate-600">
                  |E| at midpoint vs separation
                </span>
                <span className="shrink-0 text-right text-[10px] font-bold text-lab-blue">
                  {formatScientific(eMid)}
                </span>
              </div>
              <p className="mb-1 text-[9px] leading-snug text-slate-400">
                r = distance between +/− |q|-centroids; field at their midpoint.
              </p>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartE} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="distance"
                      tick={{ fontSize: 9 }}
                      stroke="#94a3b8"
                      label={{
                        value: "r (m)",
                        position: "insideBottom",
                        offset: -2,
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      scale="log"
                      domain={[1e-12, "auto"]}
                      tick={{ fontSize: 9 }}
                      stroke="#94a3b8"
                      width={36}
                      tickFormatter={(v) => {
                        if (!Number.isFinite(v) || v === 0) return "0";
                        const e = Math.round(Math.log10(v));
                        return `10^${e}`;
                      }}
                    />
                    <Tooltip
                      formatter={(v) => [formatScientific(Number(v)), "|E|"]}
                      labelFormatter={(l) => `r = ${Number(l).toFixed(3)} m`}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eLog"
                      stroke="#1E90FF"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-1">
                <span className="text-[10px] font-semibold leading-tight text-slate-600">
                  V at midpoint vs separation
                </span>
                <span className="shrink-0 text-right text-[10px] font-bold text-lab-red">
                  {formatScientific(vMid)}
                </span>
              </div>
              <p className="mb-1 text-[9px] leading-snug text-slate-400">
                Same r and sample point as the |E| chart.
              </p>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="distance"
                      tick={{ fontSize: 9 }}
                      stroke="#94a3b8"
                      label={{
                        value: "r (m)",
                        position: "insideBottom",
                        offset: -2,
                        fontSize: 9,
                      }}
                    />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" width={32} />
                    <Tooltip
                      formatter={(v) => [`${Number(v).toFixed(2)} V`, "V"]}
                      labelFormatter={(l) => `r = ${Number(l).toFixed(3)} m`}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vPot"
                      stroke="#FF3B30"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 text-xs text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">Field at probe (mouse)</p>
            <p className="text-[11px] text-slate-600">
              Net field uses superposition of Coulomb fields from every charge.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-[11px]">
              <dt className="text-slate-500">Ex</dt>
              <dd>{Ex.toExponential(3)} N/C</dd>
              <dt className="text-slate-500">Ey</dt>
              <dd>{Ey.toExponential(3)} N/C</dd>
              <dt className="text-slate-500">|E|</dt>
              <dd className="text-lab-blue">{formatScientific(eLive)} N/C</dd>
              <dt className="text-slate-500">V</dt>
              <dd className="text-lab-red">{formatScientific(vLive)} V</dd>
            </dl>
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Selected charge</p>
          {!selected ? (
            <p className="mt-1 text-xs text-slate-500">None selected.</p>
          ) : (
            <div className="mt-2 space-y-2 rounded-lg border border-slate-200/90 bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: selected.color }}
                >
                  {selected.qMicroC > 0 ? "+" : "−"}
                </span>
                <span>{selected.qMicroC > 0 ? "Positive" : "Negative"}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Magnitude:</span>{" "}
                {Math.abs(selected.qMicroC).toFixed(2)} μC
              </p>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Position (m):</span>{" "}
                {selected.x.toFixed(2)}, {selected.y.toFixed(2)}
              </p>
              <LabButton
                type="button"
                variant="outline"
                className="w-full gap-1.5 border-lab-red py-2 text-xs text-lab-red hover:bg-red-50"
                onClick={() => deleteCharge(selected.id)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete Charge
              </LabButton>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
