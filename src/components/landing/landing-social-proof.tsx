import Image from "next/image";
import Link from "next/link";

export function LandingSocialProof() {
  return (
    <section className="bg-slate-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-4">
              Trusted worldwide
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Join millions of teams who get more done with Kanban.
            </h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Teams that switch to Kanban report higher productivity, better collaboration, and
              clearer priorities — from day one.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-md transition-colors"
              aria-label="Start using Kanban for free today"
            >
              Start for free today
            </Link>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <div className="bg-blue-700 text-white rounded-2xl p-8 shadow-xl max-w-sm w-full">
              <p className="text-6xl font-extrabold mb-3 leading-none">75%</p>
              <p className="text-lg font-semibold leading-snug mb-6">
                of organisations report that Kanban delivers value to their business within 30 days.
              </p>
              <Image
                src="https://placehold.co/320x140/1e40af/FFFFFF?text=Customer+Story"
                alt="Customer success story illustration"
                width={320}
                height={140}
                unoptimized
                className="rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
