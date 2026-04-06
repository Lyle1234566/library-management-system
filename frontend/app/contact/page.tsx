'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { contactApi } from '@/lib/api';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const librarianDetails = [
  { label: 'Desk', value: 'Learning Commons 2F' },
  { label: 'Hours', value: 'Mon-Fri, 8:00 AM - 5:00 PM' },
  { label: 'Support', value: 'Borrowing, approvals, and catalog help' },
  { label: 'Response', value: 'Typically within 24 hours' },
];

const contactHighlights = [
  {
    label: 'Email',
    value: 'SalazarLibrary@gmail.com',
    helper: 'We reply within 1 business day.',
    icon: (
      <svg className="h-5 w-5 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: 'Call',
    value: '+63 9696123641',
    helper: 'Mon-Fri, 8:00 AM - 5:00 PM',
    icon: (
      <svg className="h-5 w-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
  },
  {
    label: 'Visit',
    value: 'SCSIT Digital Library',
    helper: 'Main campus, Learning Commons 2F',
    icon: (
      <svg className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Response',
    value: '24-hour turnaround',
    helper: 'Catalog updates may take 2-3 days.',
    icon: (
      <svg className="h-5 w-5 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const LIBRARIAN_NAME = 'EDITHA A. LABORATE LPT R...I';
const CONTACT_FEATURE_PHOTO = '/contact-librarian.jpg';
const CONTACT_FEATURE_FALLBACK = '/librarian-illustration.svg';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usePhotoFallback, setUsePhotoFallback] = useState(false);

  const handleLowerLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) {
      setError('Please enter your name.');
      return;
    }
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message) {
      setError('Please enter your message.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const result = await contactApi.sendMessage({
      name,
      email,
      subject: subject || undefined,
      message,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(result.data?.message ?? 'Thanks! Your message has been received.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1324] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-amber-500/20 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(251,191,36,0.14),transparent_50%)]" />
      </div>

      <Navbar variant="dark" />
      <main className="relative z-10 pt-24 pb-20 lg:pt-28 lg:pb-28">
        <section className="mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.06fr)_minmax(26rem,0.94fr)] lg:items-start xl:gap-20">
            <div className="space-y-8 animate-fade-up lg:space-y-9">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Contact
              </span>
              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                We&apos;re here to help your library run smoothly
              </h1>
              <p className="max-w-xl text-base text-white/70 sm:text-lg">
                Send us a note about borrowing, catalog updates, or account concerns. Our team
                responds quickly and keeps you in the loop.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {contactHighlights.map((item, index) => (
                  <div
                    key={item.label}
                    style={{ animationDelay: `${index * 90 + 120}ms` }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 animate-fade-up transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-white/60">{item.helper}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_32px_90px_rgba(2,6,23,0.48)] backdrop-blur-xl animate-fade-up delay-200">
                  <div className="relative h-[30rem] overflow-hidden sm:h-[38rem]">
                    <Image
                      src={usePhotoFallback ? CONTACT_FEATURE_FALLBACK : CONTACT_FEATURE_PHOTO}
                      alt="SCSIT librarian ready to help at the library desk"
                      fill
                      className={
                        usePhotoFallback
                          ? 'object-contain bg-[#091221] p-6 sm:p-8'
                          : 'object-cover object-[center_52%]'
                      }
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      priority
                      onError={() => setUsePhotoFallback(true)}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,11,25,0.02),rgba(4,11,25,0.1)_30%,rgba(4,11,25,0.28)_56%,rgba(4,11,25,0.72))]" />
                    <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0b1324]/55 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur-md">
                        Library support desk
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-100 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-sky-300" />
                        In-person assistance
                      </span>
                    </div>
                  </div>

                </div>

                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/50">Meet your librarian</p>
                      <div>
                        <h3 className="text-[2rem] font-semibold tracking-[-0.02em] text-white">{LIBRARIAN_NAME}</h3>
                        <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-sky-100/80">Senior Librarian</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-100">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Ready to assist on site
                    </div>
                  </div>

                  <div className="mt-6 h-px w-full bg-white/10" />

                  <p className="mt-6 max-w-2xl text-[0.97rem] leading-8 text-white/70">
                    Direct support for borrowing concerns, account approvals, and catalog questions inside the library.
                  </p>
                </div>
              </div>

            </div>

            <div className="space-y-8 animate-fade-up delay-200 lg:pt-3">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 sm:p-8 lg:p-10">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Contact form</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Tell us how we can help</h3>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  Share your question below and we will follow up shortly. Borrowing issues are
                  usually resolved within 24 hours.
                </p>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                  {success && (
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 animate-fade-up">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100 animate-fade-up">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="text-sm font-medium text-white/80">
                      Full name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={updateField('name')}
                      placeholder="Your full name"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="text-sm font-medium text-white/80">
                      Email address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={updateField('email')}
                      placeholder="you@gmail.com"
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="text-sm font-medium text-white/80">
                      Subject (optional)
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={updateField('subject')}
                      placeholder="Borrowing help, catalog update..."
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="text-sm font-medium text-white/80">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={formData.message}
                      onChange={updateField('message')}
                      placeholder="Tell us what you need help with..."
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-[#0b1324] shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>

                  <p className="text-xs text-white/50">
                    We only use your details to respond to this request.
                  </p>
                </form>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 sm:p-7">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/50">Support details</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {librarianDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      <p className="text-[0.65rem] uppercase tracking-widest text-white/60">{detail.label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 sm:p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Quick links</p>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href="/books"
                    scroll
                    onClick={handleLowerLinkClick}
                    className="inline-flex w-fit text-amber-300 transition-all duration-200 hover:translate-x-1 hover:text-amber-200"
                  >
                    Browse books -&gt;
                  </Link>
                  <Link
                    href="/my-books"
                    scroll
                    onClick={handleLowerLinkClick}
                    className="inline-flex w-fit text-amber-300 transition-all duration-200 hover:translate-x-1 hover:text-amber-200"
                  >
                    My books -&gt;
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
