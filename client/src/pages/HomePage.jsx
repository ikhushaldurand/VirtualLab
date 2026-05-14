import { Hero } from "../components/landing/Hero.jsx";
import { PhysicsIllustration } from "../components/landing/PhysicsIllustration.jsx";

export function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1200px] min-h-0 flex-1 flex-col items-center px-4">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 sm:py-4">
          <Hero />
        </div>
        <PhysicsIllustration />
      </div>
    </div>
  );
}
