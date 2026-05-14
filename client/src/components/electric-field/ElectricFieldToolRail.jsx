import { Hand, Minus, MousePointer2, Move, Plus, Trash2 } from "lucide-react";
import { useElectricFieldCharges } from "../../context/ElectricFieldChargesContext.jsx";

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

export function ElectricFieldToolRail() {
  const { tool, setTool } = useElectricFieldCharges();

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-2 sm:w-14">
      <ToolButton
        isActive={tool === "select"}
        onPick={() => setTool("select")}
        label="Selection"
      >
        <MousePointer2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton isActive={tool === "pan"} onPick={() => setTool("pan")} label="Pan">
        <Hand className="h-4 w-4" />
      </ToolButton>
      <ToolButton isActive={tool === "move"} onPick={() => setTool("move")} label="Move">
        <Move className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        isActive={tool === "addPlus"}
        onPick={() => setTool("addPlus")}
        label="Add positive charge"
      >
        <Plus className="h-4 w-4 text-lab-red" />
      </ToolButton>
      <ToolButton
        isActive={tool === "addMinus"}
        onPick={() => setTool("addMinus")}
        label="Add negative charge"
      >
        <Minus className="h-4 w-4 text-lab-blue" />
      </ToolButton>
      <ToolButton
        isActive={tool === "delete"}
        onPick={() => setTool("delete")}
        label="Delete charge"
        danger
      >
        <Trash2 className="h-4 w-4" />
      </ToolButton>
    </aside>
  );
}
