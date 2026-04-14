import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LibraryLocationSection from '@/components/LibraryLocationSection';
import AboutStatsGrid from '@/components/AboutStatsGrid';

const goals = [
  'Deliver a calm, reliable borrowing experience for every student.',
  'Keep availability transparent and updates instant.',
  'Make returning and renewals easy to understand.',
  'Support librarians with accurate, organized tools.',
];

export default function AboutPage() {
  return (
    <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden text-ink">
          <div className="absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl animate-float" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-300/18 blur-3xl animate-float-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(126,191,231,0.2),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(217,175,88,0.12),transparent_50%)]" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <p className="text-xs uppercase tracking-[0.5em] text-[color:var(--accent-cool-strong)] animate-fade-up">About Us</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold animate-fade-up delay-100">
              A calmer, smarter way to manage your library
            </h1>
            <p className="mt-4 max-w-2xl text-ink-muted animate-fade-up delay-200">
              SCSIT Digital Library blends thoughtful design with dependable systems so students can spend
              less time waiting and more time reading.
            </p>
            <AboutStatsGrid />
          </div>
        </section>

        <section className="-mt-12 sm:-mt-16 relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="public-panel rounded-3xl p-6 sm:p-10 space-y-10 backdrop-blur-2xl animate-fade-up delay-100">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="public-panel-soft rounded-3xl p-6 sm:p-8 animate-fade-up delay-100 transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-widest text-[color:var(--accent-cool-strong)]/80">Mission</p>
                <h2 className="mt-3 text-xl font-semibold text-ink">
                  Make borrowing feel simple, clear, and welcoming.
                </h2>
                <p className="mt-4 text-sm text-ink-muted leading-relaxed">
                  We remove friction from everyday library tasks so students can browse quickly,
                  track requests, and always know the next step.
                </p>
              </div>
              <div className="public-panel-soft rounded-3xl p-6 sm:p-8 animate-fade-up delay-200 transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-widest text-[color:var(--accent-cool-strong)]/80">Vision</p>
                <h2 className="mt-3 text-xl font-semibold text-ink">
                  A library experience that feels calm, smart, and human.
                </h2>
                <p className="mt-4 text-sm text-ink-muted leading-relaxed">
                  We aim to build a digital library environment that keeps learning accessible,
                  organized, and supportive for every reader.
                </p>
              </div>
              <div className="public-panel-soft rounded-3xl p-6 sm:p-8 animate-fade-up delay-300 transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs uppercase tracking-widest text-[color:var(--accent-cool-strong)]/80">Goals</p>
                <ul className="mt-4 space-y-3 text-sm text-ink-muted">
                  {goals.map((goal, index) => (
                    <li
                      key={goal}
                      style={{ animationDelay: `${index * 70 + 140}ms` }}
                      className="flex items-start gap-3 animate-fade-up transition-colors duration-300 hover:text-ink"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <LibraryLocationSection />

            <div className="public-panel-soft rounded-3xl p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up delay-300 transition-all duration-300 hover:-translate-y-1">
              <div>
                <h3 className="text-xl font-semibold text-ink">Ready to explore the collection?</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Browse books, track your requests, and build your reading list in minutes.
                </p>
              </div>
              <Link
                href="/books"
                className="inline-flex items-center justify-center rounded-full bg-[#2f3e9e] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#253285] hover:shadow-xl"
              >
                Browse books
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
