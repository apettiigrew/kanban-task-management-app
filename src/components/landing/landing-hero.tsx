import Link from "next/link";
import Image from "next/image";

export function LandingHero() {
  return (
    <section className="bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-gray-900">
            Collect. Organize. Conquer.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0">
            Use Kanban to visualize your progress from start to finish. Stop juggling and start delivering with tools built for high-output project management.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-700 text-white hover:bg-blue-800 font-semibold px-8 py-3 rounded-md transition-colors text-base"
                aria-label="Sign up for Kanban for free"
              >
                Sign up — it&apos;s free!
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-8 py-3 rounded-md transition-colors text-base"
                aria-label="Log in to Kanban"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-400">No credit card required.</p>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm lg:max-w-md">
              <Image
                src="https://placehold.co/400x600/1e40af/FFFFFF?text=App+Preview"
                alt="Kanban app preview on mobile"
                width={400}
                height={600}
                unoptimized
                className="rounded-2xl shadow-2xl w-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
