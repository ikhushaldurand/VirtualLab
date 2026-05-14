import { useMemo, useState } from "react";
import { Lightbulb, Search } from "lucide-react";
import {
  EXPERIMENTS,
  EXPERIMENT_CATEGORIES,
} from "../data/experimentsCatalog.js";
import { ExperimentCard } from "../components/experiments/ExperimentCard.jsx";

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-lab-blue bg-sky-50 text-lab-blue shadow-sm"
          : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

export function ExperimentsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(EXPERIMENT_CATEGORIES.ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXPERIMENTS.filter((ex) => {
      if (category !== EXPERIMENT_CATEGORIES.ALL && ex.category !== category) {
        return false;
      }
      if (!q) return true;
      const blob = `${ex.title} ${ex.description} ${ex.tag}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query, category]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-800">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 py-5 md:px-6 md:py-6">
        <header className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Browse Experiments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Explore ready-to-use physics experiments. Open, simulate, and learn.
          </p>
        </header>

        <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={category === EXPERIMENT_CATEGORIES.ALL}
              onClick={() => setCategory(EXPERIMENT_CATEGORIES.ALL)}
            >
              All
            </FilterChip>
            <FilterChip
              active={category === EXPERIMENT_CATEGORIES.MECHANICS}
              onClick={() => setCategory(EXPERIMENT_CATEGORIES.MECHANICS)}
            >
              Mechanics
            </FilterChip>
            <FilterChip
              active={category === EXPERIMENT_CATEGORIES.FLUIDS}
              onClick={() => setCategory(EXPERIMENT_CATEGORIES.FLUIDS)}
            >
              Fluids
            </FilterChip>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search experiments..."
              className="w-full rounded-full border border-slate-200/90 bg-[#FAFBFC] py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-inner outline-none ring-lab-blue/30 transition placeholder:text-slate-400 focus:border-lab-blue focus:bg-white focus:ring-2"
              aria-label="Search experiments"
            />
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4">
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((experiment) => (
              <ExperimentCard key={experiment.id} experiment={experiment} />
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No experiments match your filters.
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-100 py-3 text-xs font-medium text-slate-500">
          <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden />
          More experiments coming soon!
        </footer>
      </div>
    </div>
  );
}
