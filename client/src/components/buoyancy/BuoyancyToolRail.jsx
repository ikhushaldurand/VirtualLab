import { Hand, Minus, MousePointer2, Move, Plus, Trash2 } from "lucide-react";
import { useBuoyancyExperiment } from "../../context/BuoyancyExperimentContext.jsx";

const btn =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:bg-slate-100";

function ToolButton({ isActive, onPick, children, label, danger }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onClick={onPick}
      className={`${btn} ${
        isActive
          ? danger
            ? "border-lab-red/40 bg-red-50 text-lab-red"
            : "border-lab-blue/40 bg-sky-50 text-lab-blue"
          : danger
            ? "text-lab-red hover:border-lab-red/30"
            : ""
      }`}
    >
      {children}
    </button>
  );
}

export function BuoyancyToolRail() {
  const { tool, setTool, setZoom } = useBuoyancyExperiment();

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-[#F3F4F6] py-2 sm:w-14">
      <ToolButton
        isActive={tool === "pointer"}
        onPick={() => setTool("pointer")}
        label="Select"
      >
        <MousePointer2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton isActive={tool === "hand"} onPick={() => setTool("hand")} label="Pan">
        <Hand className="h-4 w-4" />
      </ToolButton>
      <ToolButton isActive={tool === "move"} onPick={() => setTool("move")} label="Move">
        <Move className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        isActive={false}
        onPick={() => setZoom((z) => Math.min(1.6, Math.round((z * 1.12) * 100) / 100))}
        label="Zoom in"
      >
        <Plus className="h-4 w-4 text-lab-blue" />
      </ToolButton>
      <ToolButton
        isActive={false}
        onPick={() => setZoom((z) => Math.max(0.65, Math.round((z / 1.12) * 100) / 100))}
        label="Zoom out"
      >
        <Minus className="h-4 w-4 text-lab-blue" />
      </ToolButton>
      <ToolButton
        isActive={tool === "delete"}
        onPick={() => setTool("delete")}
        label="Delete"
        danger
      >
        <Trash2 className="h-4 w-4" />
      </ToolButton>
    </aside>
  );
}
