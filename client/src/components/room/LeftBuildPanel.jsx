import { useEffect, useState } from "react";
import { Circle, Pentagon, Square, Triangle } from "lucide-react";
import { LabButton } from "../ui/LabButton.jsx";
import { LabInput } from "../ui/LabInput.jsx";
import { ROOM_MATERIAL_PRESETS } from "../../lib/physics/materialPresets.js";

const OBJECTS = [
  { kind: "circle", label: "Circle", Icon: Circle },
  { kind: "box", label: "Box", Icon: Square },
  { kind: "rectangle", label: "Rectangle", Icon: Square },
  { kind: "triangle", label: "Triangle", Icon: Triangle },
  { kind: "polygon", label: "Polygon", Icon: Pentagon },
];

const CONNECTORS = [
  { id: "spring", label: "Spring", hint: "Drag from object A → B" },
  { id: "rope", label: "String (rope)", hint: "Soft link, high damping" },
  { id: "rod", label: "Rod", hint: "Rigid link" },
  { id: "pulley", label: "Pulley", hint: "Two bodies over a fixed wheel" },
  { id: "pivot", label: "Pivot", hint: "Drag anchor point on canvas" },
  { id: "motor", label: "Motor", hint: "Pivot + constant spin" },
];

function TabBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 py-2 text-center text-xs font-semibold transition ${
        active
          ? "border-lab-blue text-lab-blue"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function LeftBuildPanel({
  leftTab,
  onLeftTab,
  spawnKind,
  onPickSpawn,
  panelDraft,
  selectedLabel,
  onApplyProps,
  connectorTool,
  onConnectorTool,
  materialTool,
  onMaterialTool,
  customMaterial,
  onCustomMaterialChange,
}) {
  const [form, setForm] = useState({
    mass: "1",
    friction: "0.2",
    restitution: "0.4",
    density: "1000",
    fill: "#1E90FF",
  });

  useEffect(() => {
    if (!panelDraft) return;
    setForm({
      mass: String(panelDraft.mass),
      friction: String(panelDraft.friction),
      restitution: String(panelDraft.restitution),
      density: String(panelDraft.density),
      fill: panelDraft.fill,
    });
  }, [panelDraft, selectedLabel]);

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="flex border-b border-slate-200/90 bg-[#FAFBFC]">
        <TabBtn active={leftTab === "build"} onClick={() => onLeftTab("build")}>
          Build
        </TabBtn>
        <TabBtn
          active={leftTab === "connectors"}
          onClick={() => onLeftTab("connectors")}
        >
          Connectors
        </TabBtn>
        <TabBtn
          active={leftTab === "materials"}
          onClick={() => onLeftTab("materials")}
        >
          Materials
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {leftTab === "build" && (
          <>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Add objects
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {OBJECTS.map(({ kind, label, Icon }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onPickSpawn(kind)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium shadow-sm transition ${
                    spawnKind === kind
                      ? "border-lab-blue bg-blue-50/80 text-lab-blue ring-1 ring-lab-blue/25"
                      : "border-slate-200/90 bg-white text-slate-700 hover:border-lab-blue/40 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
            {spawnKind ? (
              <p className="mt-2 text-[10px] text-lab-blue">Click the canvas to place.</p>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200/90 bg-[#FAFBFC] p-3 shadow-sm">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Properties
              </p>
              {!selectedLabel ? (
                <p className="text-xs text-slate-400">Select an object.</p>
              ) : (
                <form
                  className="space-y-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onApplyProps({
                      mass: form.mass,
                      friction: form.friction,
                      restitution: form.restitution,
                      density: form.density,
                      fill: form.fill,
                    });
                  }}
                >
                  <LabInput
                    label="Mass (kg)"
                    value={form.mass}
                    onChange={(e) => setForm((f) => ({ ...f, mass: e.target.value }))}
                  />
                  <LabInput
                    label="Friction"
                    value={form.friction}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, friction: e.target.value }))
                    }
                  />
                  <LabInput
                    label="Restitution"
                    value={form.restitution}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, restitution: e.target.value }))
                    }
                  />
                  <LabInput
                    label="Density (kg/m³)"
                    value={form.density}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, density: e.target.value }))
                    }
                  />
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      Color
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.fill}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, fill: e.target.value }))
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200"
                      />
                      <input
                        className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                        value={form.fill}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, fill: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <LabButton
                    type="submit"
                    variant="primary"
                    className="mt-2 w-full rounded-lg py-2.5 text-xs shadow-sm"
                  >
                    Apply
                  </LabButton>
                </form>
              )}
            </div>
          </>
        )}

        {leftTab === "connectors" && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Connector tool
            </p>
            <p className="text-[11px] leading-snug text-slate-500">
              Choose a connector, then <span className="font-medium">drag</span> on the canvas:
              press on the first body, move, release on the second body. Pivot / motor: release
              on the anchor point in space.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {CONNECTORS.map(({ id, label, hint }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onConnectorTool(connectorTool === id ? null : id)}
                  className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium shadow-sm transition ${
                    connectorTool === id
                      ? "border-lab-blue bg-blue-50/80 text-lab-blue ring-1 ring-lab-blue/25"
                      : "border-slate-200/90 bg-white text-slate-700 hover:border-lab-blue/40 hover:bg-slate-50"
                  }`}
                >
                  <div>{label}</div>
                  <div className="mt-0.5 text-[10px] font-normal text-slate-500">{hint}</div>
                </button>
              ))}
            </div>
            {connectorTool ? (
              <p className="text-[10px] text-lab-blue">Mouse constraint pauses while wiring.</p>
            ) : null}
          </div>
        )}

        {leftTab === "materials" && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Presets
            </p>
            <p className="text-[11px] text-slate-500">
              Select a material, then click a dynamic object on the canvas to apply friction,
              restitution, and density.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(ROOM_MATERIAL_PRESETS).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onMaterialTool(materialTool === key ? null : key)}
                  className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium shadow-sm transition ${
                    materialTool === key
                      ? "border-lab-blue bg-blue-50/80 text-lab-blue ring-1 ring-lab-blue/25"
                      : "border-slate-200/90 bg-white text-slate-700 hover:border-lab-blue/40 hover:bg-slate-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onMaterialTool(materialTool === "custom" ? null : "custom")}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium shadow-sm transition ${
                  materialTool === "custom"
                    ? "border-lab-blue bg-blue-50/80 text-lab-blue ring-1 ring-lab-blue/25"
                    : "border-slate-200/90 bg-white text-slate-700 hover:border-lab-blue/40 hover:bg-slate-50"
                }`}
              >
                Custom
              </button>
            </div>

            {materialTool === "custom" && (
              <div className="rounded-lg border border-slate-200/90 bg-[#FAFBFC] p-2.5">
                <p className="mb-2 text-[10px] font-semibold uppercase text-slate-400">Values</p>
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-600">
                    Friction
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="2"
                      value={customMaterial.friction}
                      onChange={(e) =>
                        onCustomMaterialChange({
                          ...customMaterial,
                          friction: e.target.value,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-600">
                    Restitution
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1.2"
                      value={customMaterial.restitution}
                      onChange={(e) =>
                        onCustomMaterialChange({
                          ...customMaterial,
                          restitution: e.target.value,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-600">
                    Density (engine units)
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      max="0.05"
                      value={customMaterial.density}
                      onChange={(e) =>
                        onCustomMaterialChange({
                          ...customMaterial,
                          density: e.target.value,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
