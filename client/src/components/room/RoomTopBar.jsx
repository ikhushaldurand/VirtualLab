import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Pencil, Save, UserPlus } from "lucide-react";
import { LabButton } from "../ui/LabButton.jsx";
import { AtomLogo } from "../brand/AtomLogo.jsx";

function buildShareUrl(roomId) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/room/${roomId}`;
}

export function RoomTopBar({
  roomId,
  roomName,
  onRoomNameChange,
  onSaveRoom,
  saveStatus,
}) {
  const navigate = useNavigate();
  const [shareHint, setShareHint] = useState(null);
  const shareTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const handleShare = useCallback(async () => {
    const url = buildShareUrl(roomId);
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "VIRTUAL-LAB room",
          text: roomName || "Physics lab room",
          url,
        });
        setShareHint("Shared");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareHint("Link copied");
      } else {
        window.prompt("Copy this room link:", url);
        setShareHint("Link ready to copy");
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareHint("Link copied");
      } catch {
        setShareHint("Could not copy link");
      }
    }
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareHint(null), 2600);
  }, [roomId, roomName]);

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-slate-200/90 bg-white px-3 shadow-sm md:px-5">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-lab-blue transition hover:opacity-90"
            title="VIRTUAL-LAB home"
          >
            <AtomLogo className="h-8 w-8 md:h-9 md:w-9" />
            <div className="hidden leading-tight sm:block">
              <div className="text-xs font-extrabold tracking-wide text-lab-blue md:text-sm">
                VIRTUAL-LAB
              </div>
              <div className="text-[10px] font-medium text-slate-400">
                Physics Sandbox
              </div>
            </div>
          </Link>
        </div>

        <div className="flex max-w-[min(100vw-12rem,20rem)] min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-2 py-1.5">
          <input
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            className="min-w-0 flex-1 truncate border-none bg-transparent text-center text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
            aria-label="Room name"
            placeholder="Untitled Room"
          />
          <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {saveStatus ? (
            <span
              className="hidden max-w-[8rem] truncate text-[10px] font-medium text-lab-blue sm:inline md:max-w-[10rem] md:text-xs"
              role="status"
            >
              {saveStatus}
            </span>
          ) : null}
          <LabButton
            type="button"
            variant="outline"
            className="gap-1.5 px-2.5 py-2 text-xs font-semibold sm:px-3"
            onClick={() => onSaveRoom?.()}
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save Room</span>
          </LabButton>
          <LabButton
            type="button"
            variant="outline"
            className="relative gap-1.5 px-2.5 py-2 text-xs font-semibold sm:px-3"
            onClick={handleShare}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share Room</span>
            {shareHint ? (
              <span className="absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-md">
                {shareHint}
              </span>
            ) : null}
          </LabButton>
          <LabButton
            variant="danger"
            className="px-2.5 py-2 text-xs sm:px-3"
            onClick={() => navigate("/rooms")}
          >
            Leave Room
          </LabButton>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
