import { Link } from "react-router-dom";
import { LabButton } from "../components/ui/LabButton.jsx";

export function RoomsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Rooms</h1>
      <p className="mt-3 text-slate-600">
        Open a collaborative physics lab. Multiple users in the same room share
        Matter.js state over Socket.io (deltas while the simulation runs, plus
        discrete events for creates, edits, and deletes).
      </p>
      <div className="mt-6">
        <Link to="/room/new">
          <LabButton variant="primary" className="px-5 py-2.5">
            Open lab workspace
          </LabButton>
        </Link>
      </div>
    </div>
  );
}
