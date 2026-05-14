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
import { classifyBuoyancyState } from "../../lib/buoyancy/buoyancyMath.js";
import { LabButton } from "../ui/LabButton.jsx";

/**
 * @param {{
 *   chartData: { t: number; fb: number; weight: number; net: number; subFrac: number }[];
 *   bodyUi: null | { label: string; kind: string; massKg: number; volumeM3: number; material: string; color: string };
 *   onDelete: () => void;
 *   rightTab: "analytics" | "vectors";
 *   onRightTab: (t: "analytics" | "vectors") => void;
 * }} props
 */
export function BuoyancyRightPanel({ chartData, bodyUi, onDelete, rightTab, onRightTab }) {
  const last = chartData.length ? chartData[chartData.length - 1] : null;
  const status = last
    ? classifyBuoyancyState(last.fb, last.weight, last.subFrac)
    : "—";

  const rhoObj =
    bodyUi && bodyUi.volumeM3 > 0 ? bodyUi.massKg / bodyUi.volumeM3 : null;

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
            <MiniLine
              title="Buoyant Force (N)"
              dataKey="fb"
              color="#22c55e"
              data={chartData}
              last={last?.fb}
            />
            <MiniLine
              title="Weight (N)"
              dataKey="weight"
              color="#FF3B30"
              data={chartData}
              last={last?.weight}
            />
            <MiniLine
              title="Net Force (N)"
              dataKey="net"
              color="#1E90FF"
              data={chartData}
              last={last?.net}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-900">Vectors</p>
            <p className="mt-2 text-[11px] leading-relaxed">
              Buoyancy (green) and weight (red) arrows are drawn on the canvas at the
              object&apos;s center when it is in the water.
            </p>
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Selected object</p>
          {!bodyUi ? (
            <p className="mt-1 text-xs text-slate-500">None selected.</p>
          ) : (
            <div className="mt-2 space-y-2 rounded-lg border border-slate-200/90 bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-xs text-white"
                  style={{ backgroundColor: bodyUi.color }}
                >
                  {bodyUi.kind === "circle" ? "○" : "▢"}
                </span>
                <span className="capitalize">{bodyUi.kind === "circle" ? "Circle" : "Box"}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Mass:</span>{" "}
                {bodyUi.massKg.toFixed(2)} kg
              </p>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Volume:</span>{" "}
                {bodyUi.volumeM3} m³
              </p>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Density:</span>{" "}
                {rhoObj != null ? `${Math.round(rhoObj)} kg/m³` : "—"}
              </p>
              <p className="text-[11px]">
                <span className="font-semibold text-slate-700">State:</span>{" "}
                <span
                  className={
                    status === "Floating" || status === "Neutral"
                      ? "font-bold text-emerald-600"
                      : status === "Sinking"
                        ? "font-bold text-lab-red"
                        : "font-medium text-slate-600"
                  }
                >
                  {status}
                </span>
              </p>
              <LabButton
                type="button"
                variant="outline"
                className="w-full gap-1.5 border-lab-red py-2 text-xs text-lab-red hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete object
              </LabButton>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MiniLine({ title, dataKey, color, data, last }) {
  const v = typeof last === "number" ? last.toFixed(2) : "0.00";
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold text-slate-600">{title}</span>
        <span className="text-xs font-bold text-slate-800">{v}</span>
      </div>
      <div className="h-[72px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 9 }}
              stroke="#94a3b8"
              domain={["auto", "auto"]}
              label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 9 }}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(val) => [`${Number(val).toFixed(3)} N`, title]}
              labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
