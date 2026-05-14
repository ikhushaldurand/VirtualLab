import { ExternalLink, Mail } from "lucide-react";

const CC_URL = "https://codingiitg.github.io/";

export function AboutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            About VIRTUAL-LAB
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-[17px]">
            VIRTUAL-LAB is a collaborative 2D physics sandbox for university learning. Build
            machines, test structures, and visualize forces in real time.
          </p>
        </header>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Owner
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Khushal Durand</h2>
            <p className="mt-1 text-sm text-slate-600">Developer &amp; Maintainer</p>
            <a
              href="mailto:d.khushal@iitg.ac.in"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-lab-blue transition hover:text-lab-blue-dark sm:mt-5"
            >
              <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              d.khushal@iitg.ac.in
            </a>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Supported by
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Coding Club, IIT Guwahati
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A student developer community building tools and learning experiences for the campus.
            </p>
            <a
              href={CC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:mt-5"
            >
              Visit website
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            </a>
          </article>
        </div>
      </div>
    </div>
  );
}
