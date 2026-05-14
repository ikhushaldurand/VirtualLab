import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function RoomNewRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/room/${crypto.randomUUID()}`, { replace: true });
  }, [navigate]);
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-slate-500">
      Opening workspace…
    </div>
  );
}
