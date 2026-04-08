'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const deskItems = [
  {
    title: 'Borrow period',
    value: '7 days - auto reminders',
    desc: 'One-click return requests',
  },
  {
    title: 'Advanced filters',
    value: 'Author - Genre - ISBN',
    desc: 'Find books in seconds',
  },
  {
    title: 'Digital receipts',
    value: 'Instant - trackable',
    desc: 'Every borrow securely logged',
  },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, isLoading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/books?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1221] via-[#0e1629] to-[#0b1324]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-950/30 via-transparent to-amber-950/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-8 sm:pb-6 sm:pt-12 lg:px-10 lg:pb-8 lg:pt-14 xl:pb-10 xl:pt-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] xl:gap-10">
          <div className="space-y-8 sm:space-y-10">
            <div className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 mb-4 text-sm font-medium text-sky-200/90 backdrop-blur-sm tracking-wide animate-fade-up sm:px-5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
              </span>
              Digital Borrowing
            </div>

            <h1 className="text-white animate-fade-up delay-100">
              <span
                className="block whitespace-nowrap text-[clamp(3.4rem,9.4vw,5.2rem)] lg:text-[clamp(5.4rem,6.3vw,6.7rem)] xl:text-[clamp(6.2rem,6.9vw,7.4rem)]"
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 0.88,
                }}
              >
                SCSIT Digital
              </span>
              <span
                className="block text-[clamp(3.4rem,9.4vw,5.2rem)] lg:text-[clamp(5.4rem,6.3vw,6.7rem)] xl:text-[clamp(6.2rem,6.9vw,7.4rem)]"
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontWeight: 1000,
                  letterSpacing: '-0.03em',
                  lineHeight: 0.9,
                }}
              >
                Library
              </span>
              <span
                className="mt-2 block whitespace-nowrap text-[clamp(1.45rem,3.3vw,2.35rem)] font-medium italic text-sky-200/90 lg:text-[clamp(1.85rem,2.55vw,2.85rem)]"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                The Foundation of Perpetual Growth
              </span>
            </h1>

            <p className="max-w-3xl text-base leading-relaxed font-light text-gray-200/85 animate-fade-up delay-200 sm:text-xl">
              Explore curated collections, borrow instantly, and manage your reading life with clarity.
              Search by title, author, genre, or ISBN - everything stays organized.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl animate-fade-up delay-200">
              <div className="group flex flex-col gap-3 sm:relative sm:block">
                <input
                  type="search"
                  inputMode="search"
                  placeholder="Title, author, genre, ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/7 px-5 py-4 text-base text-white shadow-inner backdrop-blur-xl transition-all duration-300 placeholder:text-gray-400/70 focus:outline-none focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30 focus:bg-white/10 sm:py-5 sm:pl-6 sm:pr-36"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-3.5 text-base text-gray-900 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300 active:scale-95 hover:from-amber-400 hover:to-amber-300 hover:shadow-amber-400/40 sm:absolute sm:right-3 sm:top-1/2 sm:px-7 sm:py-2.5 sm:-translate-y-1/2 sm:hover:-translate-y-[55%]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-base">Search</span>
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-4 animate-fade-up delay-300 sm:flex-row sm:gap-5">
              <Link
                href="/books"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-7 py-4 text-gray-900 font-semibold shadow-lg shadow-amber-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-amber-400 hover:to-amber-300 hover:shadow-amber-500/40 active:scale-[0.98] lg:rounded-2xl lg:px-9"
              >
                Browse Collection
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {!isLoading && !isAuthenticated ? (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-4 text-white/90 font-medium backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8 hover:border-white/30 lg:rounded-2xl lg:px-9"
                >
                  Create Free Account
                </Link>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-gray-300/80 animate-fade-up delay-300">
              <div className="flex items-center gap-2.5 transition-colors duration-300 hover:text-white/90">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                Real-time Availability
              </div>
              <div className="flex items-center gap-2.5 transition-colors duration-300 hover:text-white/90">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                Borrow receipts - always accessible
              </div>
              <div className="flex items-center gap-2.5 transition-colors duration-300 hover:text-white/90">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                Smart due-date Reminders
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-up delay-300">
            <div className="absolute -top-8 -left-8 h-40 w-32 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl animate-float-slow opacity-40" />
            <div className="absolute -bottom-10 -right-10 h-36 w-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl animate-float opacity-40" />

            <div className="relative rounded-3xl border border-white/12 bg-white/6 backdrop-blur-2xl p-7 lg:p-8 shadow-2xl shadow-black/30 transition-all duration-300 hover:border-white/25 hover:bg-white/8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400/80 font-medium">Your Library Today</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white tracking-tight">Reading Desk</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-medium text-emerald-300/90 backdrop-blur-sm border border-emerald-400/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="mt-7 space-y-5">
                {deskItems.map((item, i) => (
                  <div
                    key={item.title}
                    style={{ animationDelay: `${i * 90 + 120}ms` }}
                    className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-fade-up transition-all duration-300 hover:-translate-y-1 hover:bg-white/8 hover:border-white/20"
                  >
                    <p className="text-xs uppercase tracking-widest text-gray-400/80 font-medium">{item.title}</p>
                    <p className="mt-2.5 text-lg font-semibold text-white">{item.value}</p>
                    <p className="mt-1.5 text-sm text-gray-300/70">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between text-xs text-gray-400/70">
                <span>Updates in real time</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                  Online sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
