import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { readUserSavedRooms, removeUserSavedRoom, userSavedRoomsKey } from "../constants/roomStorage.js";
import { LabButton } from "../components/ui/LabButton.jsx";

function formatSavedAt(ts) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function LibraryPage() {
  const { user, ready, isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => []);

  const refresh = useCallback(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setItems(readUserSavedRooms(user.id));
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const key = userSavedRoomsKey(user.id);
    function onStorage(e) {
      if (e.key === key) refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id, refresh]);

  function handleRemove(roomId) {
    if (!user?.id) return;
    removeUserSavedRoom(user.id, roomId);
    refresh();
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">My Experiments</h1>
        <p className="mt-3 text-slate-600">
          Sign in to see rooms you save from the workspace. Saved layouts are stored in this
          browser for your account.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signin">
            <LabButton type="button" variant="primary" className="px-5 py-2">
              Sign in
            </LabButton>
          </Link>
          <Link to="/signup">
            <LabButton type="button" variant="outline" className="px-5 py-2">
              Create account
            </LabButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">My Experiments</h1>
      <p className="mt-3 text-slate-600">
        Rooms you save with <span className="font-medium text-slate-800">Save Room</span> in the
        workspace appear here. Open one to continue editing; removing only removes the shortcut
        from this list (your last save for that room id stays in this browser until overwritten).
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
          No saved rooms yet. Use{" "}
          <Link to="/room/new" className="font-semibold text-lab-blue underline-offset-2 hover:underline">
            Create Room
          </Link>
          , then choose <span className="font-medium">Save Room</span> in the top bar.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((row) => (
            <li
              key={row.roomId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">{row.roomName}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Saved {formatSavedAt(row.savedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link to={`/room/${row.roomId}`}>
                  <LabButton
                    type="button"
                    variant="outline"
                    className="gap-1.5 px-3 py-1.5 text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Open
                  </LabButton>
                </Link>
                <LabButton
                  type="button"
                  variant="ghost"
                  className="gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-red-600"
                  onClick={() => handleRemove(row.roomId)}
                  aria-label={`Remove ${row.roomName} from list`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </LabButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
