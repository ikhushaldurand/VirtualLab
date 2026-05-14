import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="flex w-full max-w-3xl flex-col items-center px-3 text-center">
      <h1 className="font-extrabold leading-[1.05] tracking-tight text-slate-900">
        <span className="block text-[clamp(1.75rem,5vw,3.25rem)]">
          Explore Physics.
        </span>
        <span className="mt-1 block text-[clamp(1.75rem,5vw,3.25rem)] text-brand-blue">
          Together.
        </span>
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-sm font-medium leading-relaxed text-slate-500 sm:mt-5 sm:text-base">
        Build, simulate and analyze 2D physics experiments in a real-time
        collaborative environment.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
        <Link
          to="/room/new"
          className="inline-flex min-h-[40px] min-w-[140px] items-center justify-center rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark"
        >
          Create Room
        </Link>
        <Link
          to="/experiments"
          className="inline-flex min-h-[40px] min-w-[160px] items-center justify-center rounded-md border border-brand-red bg-white px-5 py-2.5 text-sm font-semibold text-brand-red transition hover:bg-red-50"
        >
          Browse Experiments
        </Link>
      </div>
    </section>
  );
}
