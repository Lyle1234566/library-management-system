'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Features from '@/components/Features';
import { useAuth } from '@/contexts/AuthContext';

const systemModules = [
  {
    title: 'Student Workspace',
    details: 'Search books, submit borrow requests, and monitor your request status in real time.',
  },
  {
    title: 'Librarian Desk',
    details: 'Approve accounts, manage catalog actions, and handle borrow and return workflows.',
  },
  {
    title: 'Staff Operations',
    details: 'Process circulation tasks quickly, verify returns, and keep records accurate.',
  },
  {
    title: 'Account Center',
    details: 'Secure profile updates, role-based access, and full borrowing history tracking.',
  },
];

export default function FeaturesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return (
    <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl animate-float" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-300/18 blur-3xl animate-float-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(126,191,231,0.2),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(217,175,88,0.12),transparent_50%)]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--accent-cool-strong)] animate-fade-up">Platform Features</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold animate-fade-up delay-100">
              Everything built into your library system
            </h1>
            <p className="mt-4 max-w-2xl text-ink-muted animate-fade-up delay-200">
              Your system includes role-based tools for students, staff, and librarians, designed
              for fast circulation and clear tracking.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {systemModules.map((module, index) => (
                <article
                  key={module.title}
                  style={{ animationDelay: `${index * 90 + 120}ms` }}
                  className="public-panel-soft rounded-2xl p-5 backdrop-blur-xl animate-fade-up transition-all duration-300 hover:-translate-y-1"
                >
                  <h2 className="text-lg font-semibold text-ink">{module.title}</h2>
                  <p className="mt-2 text-sm text-ink-muted">{module.details}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Features showBookFeatures />

        {!authLoading && !isAuthenticated && (
          <section className="relative pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="public-panel rounded-3xl p-6 sm:p-8 backdrop-blur-2xl animate-fade-up">
                <h3 className="text-2xl font-semibold text-ink">Start using these features now</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Create an account, explore books, and experience the full borrowing flow.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#17314e] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--accent-strong)] hover:text-[#17314e]"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/books"
                    className="inline-flex items-center justify-center rounded-full border border-line bg-white/70 px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                  >
                    Browse books
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
