import {
  Hand,
  Minus,
  MousePointer2,
  Move,
  Plus,
  Trash2,
} from "lucide-react";

const tools = [
  { id: "pointer", icon: MousePointer2, label: "Pointer" },
  { id: "hand", icon: Hand, label: "Hand" },
  { id: "move", icon: Move, label: "Move" },
  { id: "add", icon: Plus, label: "Add" },
  { id: "subtract", icon: Minus, label: "Subtract" },
  { id: "delete", icon: Trash2, label: "Delete" },
];

export function ToolRail({ tool, onToolChange }) {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-slate-200/80 bg-[#F3F4F6] py-2">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onToolChange(id)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            tool === id
              ? "bg-white text-lab-blue shadow-md ring-1 ring-lab-blue/35"
              : "text-slate-500 hover:bg-white hover:text-slate-800"
          } ${id === "delete" ? "text-lab-red hover:text-lab-red-dark" : ""}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
