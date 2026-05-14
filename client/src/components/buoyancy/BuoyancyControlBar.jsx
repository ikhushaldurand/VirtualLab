import { Pause, Play, RotateCcw } from "lucide-react";

export function BuoyancyControlBar({
  playing,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-slate-100 bg-[#FAFBFC] px-2 py-2">
      <button
        type="button"
        onClick={onPlay}
        disabled={playing}
        className="inline-flex items-center gap-1.5 rounded-lg bg-lab-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition enabled:hover:bg-lab-blue-dark disabled:opacity-45"
      >
        <Play className="h-3.5 w-3.5" aria-hidden />
        Play
      </button>
      <button
        type="button"
        onClick={onPause}
        disabled={!playing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-45"
      >
        <Pause className="h-3.5 w-3.5" aria-hidden />
        Pause
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reset
      </button>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <span className="hidden sm:inline">Speed</span>
        <select
          value={String(speed)}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium focus:border-lab-blue focus:outline-none"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1.0x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>
      </label>
    </div>
  );
}
