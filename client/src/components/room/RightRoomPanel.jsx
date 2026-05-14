import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { LabButton } from "../ui/LabButton.jsx";

const CHART_PLACEHOLDER = Array.from({ length: 48 }, (_, i) => ({
  t: i * (1 / 60),
  v: 0,
  ke: 0,
  f: 0,
}));

function MiniChart({ title, dataKey, color, data, suffix, inactive }) {
  const series = data;
  const last = !inactive && series.length ? series[series.length - 1][dataKey] : null;
  return (
    <div
      className={`mb-2 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm ${
        inactive ? "opacity-60" : ""
      }`}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold text-slate-600">{title}</span>
        <span className="text-xs font-bold text-slate-800">
          {inactive || last == null ? "—" : `${Number(last).toFixed(2)}${suffix ? ` ${suffix}` : ""}`}
        </span>
      </div>
      <div className="h-[72px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(v) => [Number(v).toFixed(3), title]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={inactive ? "#cbd5e1" : color}
              strokeWidth={inactive ? 1.25 : 1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RightRoomPanel({
  rightTab,
  onRightTab,
  chartPoints,
  showVectors,
  onShowVectorsChange,
  metrics,
  analyticsHasTarget,
}) {
  const inactive = !analyticsHasTarget || chartPoints.length === 0;
  const chartData = inactive ? CHART_PLACEHOLDER : chartPoints;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FAFBFC]">
      <div className="flex border-b border-slate-200/90 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onRightTab("analytics")}
          className={`flex-1 border-b-2 py-2 text-center text-xs font-semibold ${
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
          className={`flex-1 border-b-2 py-2 text-center text-xs font-semibold ${
            rightTab === "vectors"
              ? "border-lab-blue text-lab-blue"
              : "border-transparent text-slate-500"
          }`}
        >
          Vectors
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
        {rightTab === "analytics" && (
          <>
            {!analyticsHasTarget ? (
              <p className="mb-2 text-[11px] leading-snug text-slate-500">
                Select an object to stream live metrics at 60 Hz (rolling 100 samples).
              </p>
            ) : null}
            <MiniChart
              title="Velocity (m/s)"
              dataKey="v"
              color="#1E90FF"
              data={chartData}
              inactive={inactive}
            />
            <MiniChart
              title="Kinetic Energy (J)"
              dataKey="ke"
              color="#FF3B30"
              data={chartData}
              inactive={inactive}
            />
            <MiniChart
              title="Forces (N, net + connectors)"
              dataKey="f"
              color="#1E90FF"
              data={chartData}
              inactive={inactive}
            />
          </>
        )}
        {rightTab === "vectors" && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Free-body diagram on the selected body: <span className="font-medium text-red-600">F_g</span>{" "}
              (weight), <span className="font-medium text-lab-blue">v</span> (velocity), and{" "}
              <span className="font-medium text-green-600">connector</span> forces.
            </p>
            <LabButton
              type="button"
              variant={showVectors ? "primary" : "outline"}
              className="w-full"
              onClick={() => onShowVectorsChange(!showVectors)}
            >
              {showVectors ? "Hide vectors" : "Show vectors"}
            </LabButton>
          </div>
        )}
        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Selected object
          </p>
          {metrics.selectedSummary ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="col-span-2 flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full bg-lab-blue"
                  aria-hidden
                />
                <span className="font-medium capitalize text-slate-800">
                  {metrics.selectedSummary.label}
                </span>
              </div>
              <div>
                <div className="text-slate-400">Mass</div>
                <div className="font-semibold text-slate-800">
                  {metrics.selectedSummary.mass} kg
                </div>
              </div>
              <div>
                <div className="text-slate-400">Velocity</div>
                <div className="font-semibold text-slate-800">
                  {metrics.selectedSummary.velocity} m/s
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400">Position (norm.)</div>
                <div className="font-semibold text-slate-800">
                  x: {metrics.selectedSummary.posX} · y: {metrics.selectedSummary.posY}
                </div>
              </div>
              <div>
                <div className="text-slate-400">F_net (est.)</div>
                <div className="font-semibold text-slate-800">
                  {metrics.selectedSummary.fNet} N
                </div>
              </div>
              <div>
                <div className="text-slate-400">Weight F_g (est.)</div>
                <div className="font-semibold text-slate-800">
                  {metrics.selectedSummary.weightEst} N
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400">Connectors (est.)</div>
                <div className="font-semibold text-slate-800">
                  {metrics.selectedSummary.connectorLoad ?? "—"} N
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-400">None selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
