'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function CallToAction() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute -top-20 left-10 h-64 w-64 rounded-full bg-sky-300/18 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/18 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(126,191,231,0.16),transparent_45%)]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-ink animate-fade-up md:text-4xl">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-ink-muted animate-fade-up delay-100">
            Join readers who want a modern borrowing experience. Create your account,
            explore the catalog, and track every receipt in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-200">
            <Link
              href="/register"
              className="rounded-full bg-[color:var(--accent)] px-8 py-4 font-semibold text-[#17314e] shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--accent-strong)] hover:text-[#17314e]"
            >
              Create Free Account
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-line bg-white/72 px-8 py-4 font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Learn More
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-ink-muted animate-fade-up delay-300">
            <div className="flex items-center space-x-2 rounded-full border border-line bg-white/72 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
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
            <div className="flex items-center space-x-2 rounded-full border border-line bg-white/72 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
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
            <div className="flex items-center space-x-2 rounded-full border border-line bg-white/72 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
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
