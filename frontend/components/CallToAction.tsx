import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden py-24 bg-[#0f1b2f]">
      <div className="absolute inset-0">
        <div className="absolute -top-20 left-10 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-up">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-fade-up delay-100">
            Join readers who want a modern borrowing experience. Create your account,
            explore the catalog, and track every receipt in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-200">
            <Link
              href="/register"
              className="px-8 py-4 bg-amber-500 text-[#1a1b1f] font-semibold rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-400 shadow-card"
            >
              Create Free Account
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-transparent border border-white/25 text-white/90 font-semibold rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/70 animate-fade-up delay-300">
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Free to Join</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
