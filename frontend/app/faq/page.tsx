import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const faqs = [
  {
    question: 'How do I borrow a book?',
    answer:
      'Open the book details page and click borrow. Students can submit a request, then staff reviews and approves it.',
  },
  {
    question: 'How long can I keep borrowed books?',
    answer:
      'Most books are issued for 7 days. Due dates are shown in your account and on each approved receipt.',
  },
  {
    question: 'Can I request a return online?',
    answer:
      'Yes. Open your borrowed book details and send a return request. Staff will verify and complete the return.',
  },
  {
    question: 'What if I cannot log in?',
    answer:
      'Use the Forgot Password page first. If you still cannot access your account, contact library support.',
  },
];

export default function FaqPage() {
  return (
    <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-300/22 blur-3xl animate-float" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/16 blur-3xl animate-float-slow" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--accent-cool-strong)] animate-fade-up">Support</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold animate-fade-up delay-100">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 max-w-2xl text-ink-muted animate-fade-up delay-200">
              Quick answers about borrowing, returns, account access, and library workflow.
            </p>
          </div>
        </section>

        <section className="-mt-8 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="space-y-4">
            {faqs.map((item, index) => (
              <article
                key={item.question}
                style={{ animationDelay: `${index * 90 + 120}ms` }}
                className="public-panel-soft rounded-2xl p-6 backdrop-blur-xl animate-fade-up transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-lg font-semibold text-ink">{item.question}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
