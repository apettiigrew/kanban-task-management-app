import Link from "next/link";

export function LandingFooterCta() {
  return (
    <section className="bg-blue-700 text-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Get started with Kanban today
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Join thousands of teams who plan smarter and work better together. It&apos;s free to get
          started.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3 rounded-md transition-colors text-base"
          aria-label="Sign up for Kanban for free"
        >
          Sign up — it&apos;s free!
        </Link>
        <p className="mt-4 text-sm text-blue-200">No credit card required.</p>
      </div>
    </section>
  );
}
