type FeaturesProps = {
  showBookFeatures?: boolean;
};

export default function Features({ showBookFeatures = false }: FeaturesProps) {
  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 9 9 0 0114 0z"
          />
        </svg>
      ),
      title: 'Easy Search',
      description:
        'Find any book instantly with our powerful search engine. Search by title, author, ISBN, or category.',
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z"
          />
        </svg>
      ),
      title: 'Quick Borrowing',
      description:
        'Borrow books with just a few clicks. No more waiting in lines or filling out paperwork.',
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      title: 'Due Date Reminders',
      description:
        'Never miss a return date. Get automatic notifications before your books are due.',
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Secure Account',
      description:
        'Your data is protected with industry-standard security. Safe and private library experience.',
    },
  ];

  const coreBookFeatures = [
    {
      title: 'Table of Contents',
      points: [
        'Lists chapters and sections',
        'Shows page numbers for easy navigation',
      ],
    },
    {
      title: 'Preface / Introduction',
      points: [
        'Explains the purpose of the book',
        'May describe who the book is for',
        'Gives background context',
      ],
    },
    {
      title: 'About the Author',
      points: [
        'Short author biography',
        'Credentials or relevant experience',
      ],
    },
  ];

  const nonfictionFeatures = [
    'Chapter summaries',
    'Learning objectives',
    'Case studies or real-life examples',
    'Illustrations, diagrams, or photos',
    'Exercises or reflection questions',
    'Key takeaways or summary boxes',
    'Glossary of important terms',
    'References or further reading',
  ];

  const fictionFeatures = [
    'Character list',
    'Map of the story world',
    "Author's note",
    'Discussion questions (book clubs)',
    'Sneak preview of the next book',
  ];

  const academicFeatures = [
    'Learning goals',
    'Review questions',
    'Practice problems',
    'Charts and data tables',
    'Index',
    'Bibliography',
  ];

  const suggestedAdditions = [
    'Estimated reading time per chapter',
    'Difficulty level tags per section',
    'Quick recap page at the end of each chapter',
  ];
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-8 pb-24 sm:pt-10">
      <div className="absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-sky-300/16 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/14 blur-3xl animate-float-slow" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="public-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] animate-fade-up sm:px-4 sm:py-2 sm:text-[11px]">
            Core Features
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink md:text-4xl text-balance animate-fade-up">
            Why Choose Salazar Library System?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-muted animate-fade-up delay-100 sm:text-lg">
            Experience the future of library management with our feature-rich platform
            designed for modern readers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              style={{ animationDelay: `${index * 90 + 120}ms` }}
              className="public-panel-soft group relative overflow-hidden rounded-[1.6rem] p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-up sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent" />
                <div className="absolute -right-10 top-8 h-24 w-24 rounded-full bg-amber-300/14 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-sky-300/14 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200/60 bg-white/80 text-[color:var(--accent)] transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                    {feature.icon}
                  </div>
                  <span className="pt-1 text-[11px] font-semibold tracking-[0.34em] text-[color:var(--accent-cool-strong)]/45">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-[1.32rem] font-semibold leading-tight text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 max-w-sm text-[0.95rem] leading-6 text-ink-muted transition-colors duration-300 group-hover:text-ink">
                    {feature.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {showBookFeatures && (
          <div className="public-panel mt-16 rounded-3xl p-6 sm:p-8 backdrop-blur-xl animate-fade-up">
            <h3 className="text-2xl font-semibold text-ink">Book Features</h3>
            <p className="mt-2 max-w-3xl text-sm text-ink-muted">
              Core sections and content blocks you can include in books to improve navigation,
              context, and learning value.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {coreBookFeatures.map((feature, index) => (
                <article
                  key={feature.title}
                  style={{ animationDelay: `${index * 90 + 140}ms` }}
                  className="public-panel-soft rounded-2xl p-4 animate-fade-up"
                >
                  <h4 className="text-base font-semibold text-ink">{feature.title}</h4>
                  <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-[2px] text-[color:var(--accent)]">-</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="public-panel-soft rounded-2xl p-4">
                <h4 className="text-base font-semibold text-ink">Key Features (Nonfiction / Textbooks)</h4>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {nonfictionFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-emerald-500">v</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="public-panel-soft rounded-2xl p-4">
                <h4 className="text-base font-semibold text-ink">For Fiction Books</h4>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {fictionFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-[color:var(--accent-cool-strong)]">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="public-panel-soft rounded-2xl p-4">
                <h4 className="text-base font-semibold text-ink">For Academic / Textbooks</h4>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {academicFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-indigo-500">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="public-panel-soft mt-6 rounded-2xl p-4">
              <h4 className="text-base font-semibold text-ink">Suggested Additions</h4>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                {suggestedAdditions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[2px] text-[color:var(--accent)]">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
