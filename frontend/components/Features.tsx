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
    <section className="relative -mt-10 overflow-hidden bg-[#0b1324] pt-2 pb-24 sm:-mt-12 sm:pt-4">
      <div className="absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl animate-float-slow" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/80 animate-fade-up">
            Core Features
          </span>
          <h2 className="mt-5 text-3xl font-bold text-white md:text-4xl text-balance animate-fade-up">
            Why Choose SCSIT Digital Library?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/68 animate-fade-up delay-100">
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
              className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,33,53,0.92)_0%,rgba(17,25,43,0.9)_100%)] p-5 shadow-[0_18px_42px_rgba(2,8,23,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/18 hover:shadow-[0_22px_52px_rgba(2,8,23,0.28)] animate-fade-up sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute -right-10 top-8 h-24 w-24 rounded-full bg-amber-400/6 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-sky-400/6 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/[0.06] text-[color:var(--accent)] transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                    {feature.icon}
                  </div>
                  <span className="pt-1 text-[11px] font-semibold tracking-[0.34em] text-white/28">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-[1.32rem] font-semibold leading-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 max-w-sm text-[0.95rem] leading-6 text-white/64 transition-colors duration-300 group-hover:text-white/76">
                    {feature.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {showBookFeatures && (
          <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl animate-fade-up">
            <h3 className="text-2xl font-semibold text-white">Book Features</h3>
            <p className="mt-2 text-sm text-white/70 max-w-3xl">
              Core sections and content blocks you can include in books to improve navigation,
              context, and learning value.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {coreBookFeatures.map((feature, index) => (
                <article
                  key={feature.title}
                  style={{ animationDelay: `${index * 90 + 140}ms` }}
                  className="rounded-2xl border border-white/10 bg-[#0f1a31]/70 p-4 animate-fade-up"
                >
                  <h4 className="text-base font-semibold text-white">{feature.title}</h4>
                  <ul className="mt-3 space-y-2 text-sm text-white/75">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-[2px] text-amber-300">-</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-[#0f1a31]/70 p-4">
                <h4 className="text-base font-semibold text-white">Key Features (Nonfiction / Textbooks)</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {nonfictionFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-emerald-300">v</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#0f1a31]/70 p-4">
                <h4 className="text-base font-semibold text-white">For Fiction Books</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {fictionFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-sky-300">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#0f1a31]/70 p-4">
                <h4 className="text-base font-semibold text-white">For Academic / Textbooks</h4>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {academicFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[2px] text-violet-300">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#0f1a31]/70 p-4">
              <h4 className="text-base font-semibold text-white">Suggested Additions</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                {suggestedAdditions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[2px] text-amber-300">+</span>
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
