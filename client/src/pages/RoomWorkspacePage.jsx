import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useCollaborativePhysics } from "../hooks/useCollaborativePhysics.js";
import { RoomTopBar } from "../components/room/RoomTopBar.jsx";
import { ToolRail } from "../components/room/ToolRail.jsx";
import { LeftBuildPanel } from "../components/room/LeftBuildPanel.jsx";
import { RightRoomPanel } from "../components/room/RightRoomPanel.jsx";
import { LabButton } from "../components/ui/LabButton.jsx";
import {
  roomSnapshotStorageKey,
  upsertUserSavedRoom,
} from "../constants/roomStorage.js";
import { useAuth } from "../context/AuthContext.jsx";

export function RoomWorkspacePage() {
  const { roomId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const centerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(520);
  const [roomName, setRoomName] = useState("Untitled Room");
  const [leftTab, setLeftTab] = useState("build");
  const [rightTab, setRightTab] = useState("analytics");
  const [saveStatus, setSaveStatus] = useState("");
  const [connectorTool, setConnectorTool] = useState(/** @type {string | null} */ (null));
  const [materialTool, setMaterialTool] = useState(/** @type {string | null} */ (null));
  const [customMaterial, setCustomMaterial] = useState({
    friction: "0.35",
    restitution: "0.45",
    density: "0.0018",
  });

  const roomUx = useMemo(
    () => ({
      connectorTool,
      setConnectorTool,
      materialTool,
      setMaterialTool,
      customMaterial,
    }),
    [connectorTool, materialTool, customMaterial]
  );

  const ph = useCollaborativePhysics(roomId, canvasSize, roomUx);

  useEffect(() => {
    if (leftTab !== "connectors") setConnectorTool(null);
  }, [leftTab]);

  useEffect(() => {
    if (leftTab !== "materials") setMaterialTool(null);
  }, [leftTab]);

  useEffect(() => {
    if (!roomId) return undefined;
    try {
      const raw = localStorage.getItem(roomSnapshotStorageKey(roomId));
      if (!raw) return undefined;
      const data = JSON.parse(raw);
      if (typeof data.roomName === "string" && data.roomName.trim()) {
        setRoomName(data.roomName);
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }, [roomId]);

  useLayoutEffect(() => {
    const el = centerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const next = Math.floor(Math.min(r.width, r.height) - 16);
      setCanvasSize(Math.max(200, Math.min(next, 900)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function handleSaveRoom() {
    const result = ph.saveRoomSnapshot(roomName);
    if (!result.ok) {
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(""), 3200);
      return;
    }
    if (isAuthenticated && user?.id) {
      const listed = upsertUserSavedRoom(user.id, {
        roomId: result.roomId,
        roomName: result.roomName,
        savedAt: result.savedAt,
      });
      setSaveStatus(
        listed
          ? "Saved to My Experiments"
          : "Room saved; could not update your experiment list (storage full?)"
      );
    } else {
      setSaveStatus("Saved locally — sign in to add to My Experiments");
    }
    setTimeout(() => setSaveStatus(""), 3200);
  }

  function handleTool(id) {
    if (id === "delete" && ph.selectedLabel) {
      ph.deleteSelected();
      ph.setTool("pointer");
      return;
    }
    ph.setTool(id);
  }

  if (!roomId) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#FAFBFC] text-slate-800">
      <RoomTopBar
        roomId={roomId}
        roomName={roomName}
        onRoomNameChange={setRoomName}
        onSaveRoom={handleSaveRoom}
        saveStatus={saveStatus}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_300px]">
        <div className="flex min-h-0 min-w-0 border-r border-slate-200/90 bg-[#F3F4F6]">
          <ToolRail tool={ph.tool} onToolChange={handleTool} />
          <div className="min-w-0 flex-1 bg-white">
            <LeftBuildPanel
              leftTab={leftTab}
              onLeftTab={setLeftTab}
              spawnKind={ph.spawnKind}
              onPickSpawn={ph.setSpawnKind}
              panelDraft={ph.panelDraft}
              selectedLabel={ph.selectedLabel}
              onApplyProps={ph.applyPropsToSelected}
              connectorTool={connectorTool}
              onConnectorTool={setConnectorTool}
              materialTool={materialTool}
              onMaterialTool={setMaterialTool}
              customMaterial={customMaterial}
              onCustomMaterialChange={setCustomMaterial}
            />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col border-r border-slate-200/90 bg-[#F9FAFB]">
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-slate-200/90 bg-white px-3 py-2.5 shadow-sm">
            <LabButton
              type="button"
              variant="primary"
              className="gap-1.5 rounded-lg px-4 py-2 text-xs shadow-sm"
              onClick={ph.play}
              disabled={ph.simRunning}
            >
              <Play className="h-3.5 w-3.5" />
              Play
            </LabButton>
            <LabButton
              type="button"
              variant="outline"
              className="gap-1.5 rounded-lg px-4 py-2 text-xs"
              onClick={ph.pause}
              disabled={!ph.simRunning}
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </LabButton>
            <LabButton
              type="button"
              variant="outline"
              className="gap-1.5 rounded-lg px-4 py-2 text-xs"
              onClick={ph.reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </LabButton>
            <label className="ml-0 flex items-center gap-1.5 text-xs text-slate-600 sm:ml-4">
              <span className="hidden sm:inline">Speed</span>
              <select
                value={String(ph.speed)}
                onChange={(e) => ph.setSpeed(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-1 focus:ring-lab-blue"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1.0x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </label>
          </div>

          <div
            ref={centerRef}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
          >
            <div
              className="relative overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-md"
              style={{
                width: canvasSize,
                height: canvasSize,
                maxWidth: "100%",
                maxHeight: "100%",
                backgroundImage:
                  "radial-gradient(#d1d5db 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            >
              <div
                ref={ph.mountRef}
                className="absolute inset-0 h-full w-full [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
              />
              <canvas
                ref={ph.vectorRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            </div>
            <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-slate-200/90 bg-white/95 px-4 py-1.5 text-[11px] font-medium text-slate-600 shadow-md backdrop-blur-sm">
              X: {ph.metrics.cursor.x.toFixed(2)} m · Y:{" "}
              {ph.metrics.cursor.y.toFixed(2)} m
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 bg-white">
        <RightRoomPanel
          rightTab={rightTab}
          onRightTab={setRightTab}
          chartPoints={ph.chartPoints}
          showVectors={ph.showVectors}
          onShowVectorsChange={ph.setShowVectors}
          metrics={ph.metrics}
          analyticsHasTarget={Boolean(ph.selectedLabel)}
        />
        </div>
      </div>
    </div>
  );
}
