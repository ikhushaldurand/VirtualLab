import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { ElectricFieldPreview } from "./previews/ElectricFieldPreview.jsx";
import { BuoyancyPreview } from "./previews/BuoyancyPreview.jsx";

function Preview({ experimentId }) {
  if (experimentId === "electric-field") {
    return <ElectricFieldPreview className="h-full w-full object-cover" />;
  }
  if (experimentId === "buoyancy") {
    return <BuoyancyPreview className="h-full w-full object-cover" />;
  }
  return <div className="h-full w-full bg-slate-100" />;
}

export function ExperimentCard({ experiment }) {
  const { id, title, tag, description } = experiment;

  return (
    <article className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md transition hover:shadow-lg">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-[#f4f4f5]">
        <Preview experimentId={id} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lab-blue">
            {tag}
          </span>
        </div>
        <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-slate-600">
          {description}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Inbuilt
          </div>
          <Link
            to={`/experiments/${id}`}
            className="rounded-lg bg-lab-blue px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-blue-dark"
          >
            Open Experiment
          </Link>
        </div>
      </div>
    </article>
  );
}
