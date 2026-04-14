'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, FileText, Search, Zap } from 'lucide-react';

const deskItems = [
  {
    title: 'Borrow period',
    value: '7-day borrowing',
    desc: 'Auto reminders and a faster return flow for active readers.',
    icon: <Clock3 className="h-5 w-5 text-[color:var(--accent-strong)]" />,
  },
  {
    title: 'Digital receipts',
    value: 'Instant tracking',
    desc: 'Every transaction stays logged, searchable, and easy to verify.',
    icon: <FileText className="h-5 w-5 text-[color:var(--accent-strong)]" />,
  },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/books?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="library-hero-pattern absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/45 to-transparent" />
        <div className="absolute -left-24 top-14 h-96 w-96 rounded-full bg-sky-300/18 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-[-5rem] h-[22rem] w-[22rem] rounded-full bg-amber-300/14 blur-3xl animate-float-slow" />
        <div className="absolute left-[11%] top-[18%] h-24 w-24 rounded-full border border-sky-200/55" />
        <div className="absolute right-[13%] top-[24%] h-28 w-28 rounded-full border border-sky-100/70" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-32 pb-16 sm:px-8 sm:pt-36 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(21rem,0.94fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-12">
          <div className="space-y-8 sm:space-y-9">
            <div className="space-y-5">
              <h1 className="text-ink animate-fade-up delay-100">
                <span
                  className="block text-[clamp(2.5rem,6.5vw,3.8rem)] lg:text-[clamp(3.5rem,4.5vw,4.5rem)] xl:text-[clamp(4rem,5vw,5rem)]"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontWeight: 700,
                    letterSpacing: '0.035em',
                    lineHeight: 0.96,
                  }}
                >
                  Salazar Library
                </span>
                <span
                  className="block text-[clamp(2.5rem,6.5vw,3.8rem)] lg:text-[clamp(3.5rem,4.5vw,4.5rem)] xl:text-[clamp(4rem,5vw,5rem)]"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    lineHeight: 0.96,
                  }}
                >
                  System
                </span>
                <span className="mt-3 block text-[clamp(0.95rem,2.2vw,1.25rem)] font-semibold uppercase tracking-[0.24em] text-[#5a88b0] lg:text-[clamp(1rem,1.5vw,1.35rem)]">
                  The Foundation of Perpetual Growth
                </span>
              </h1>

              <p className="max-w-2xl text-[1.02rem] leading-[1.65] text-[#2f628b]/92 animate-fade-up delay-200 sm:text-[1.08rem]">
                Explore curated collections, borrow instantly, and manage your reading life with
                clarity. Search by title, author, genre, or ISBN while the system keeps every shelf
                and receipt organized in real time.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl animate-fade-up delay-200">
              <div className="flex flex-col gap-3 sm:relative sm:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a88b0]/78" />
                  <input
                    type="search"
                    inputMode="search"
                    placeholder="Search by title, author, genre, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-w-0 rounded-[1.9rem] border border-white/70 bg-white/80 px-6 py-[1.18rem] pl-14 text-base text-[#11395d] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),inset_0_-4px_12px_rgba(0,51,102,0.04),0_14px_30px_rgba(0,68,124,0.08)] backdrop-blur-xl transition-all duration-200 placeholder:text-[#5f84a6]/72 focus:border-[#00447C]/28 focus:outline-none focus:ring-4 focus:ring-sky-200/55 sm:pr-44"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[linear-gradient(135deg,#00447C_0%,#003366_100%)] px-7 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(0,51,102,0.22)] ring-1 ring-inset ring-white/12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,51,102,0.28)] active:translate-y-0 sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 sm:px-7 sm:py-3.5"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4 animate-fade-up delay-300">
              <Link
                href="/books"
                className="library-gold-button inline-flex items-center justify-center gap-3 rounded-[1.3rem] px-8 py-4 text-base font-semibold text-[#1f2530] transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              >
                <span className="relative z-10">Browse Collection</span>
                <ArrowRight className="relative z-10 h-5 w-5" />
              </Link>

              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#517da6]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#EBC03F]/45 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#EBC03F]" />
                </span>
                Curated access with live catalog sync
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl animate-fade-up delay-300 lg:mx-0">
            <div className="absolute -left-8 -top-6 hidden h-32 w-28 rounded-[2rem] border border-white/35 bg-white/32 backdrop-blur-xl lg:block" />
            <div className="absolute -bottom-7 -right-7 hidden h-28 w-24 rounded-[1.8rem] border border-white/35 bg-white/26 backdrop-blur-xl lg:block" />

            <div className="relative overflow-hidden rounded-[1.4rem] border border-white/[0.3] bg-white/[0.65] p-5 shadow-[0_10px_30px_rgba(0,50,100,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_50%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,68,124,0.03)_0%,transparent_60%)]" />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.32em] text-[#5b88af]/70">
                      Your Library Today
                    </p>
                    <h3 className="text-[1.4rem] font-bold tracking-tight text-[#00447C]">
                      Reading Desk
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 px-2.5 py-1 shadow-[0_2px_8px_rgba(16,185,129,0.15)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" style={{ animationDuration: '2s' }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    </span>
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-emerald-700">Live</span>
                  </div>
                </div>

                {/* Two-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                  {deskItems.map((item, i) => (
                    <div
                      key={item.title}
                      style={{ animationDelay: `${i * 90 + 120}ms` }}
                      className="group relative flex flex-1 overflow-hidden rounded-[1rem] border border-white/40 bg-gradient-to-br from-white/95 to-white/80 p-3.5 shadow-[0_2px_12px_rgba(0,68,124,0.06)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,68,124,0.12)] animate-fade-up"
                    >
                      {/* Watermark Icon */}
                      <div className="pointer-events-none absolute -right-1 -top-1 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09]">
                        <div className="scale-[2.2]">{item.icon}</div>
                      </div>
                      
                      <div className="relative flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.5rem] border border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-white/60 shadow-[0_2px_6px_rgba(0,68,124,0.08)]">
                            <div className="scale-[0.7]">{item.icon}</div>
                          </div>
                          <p className="text-[0.6rem] font-bold uppercase tracking-[0.26em] text-[#5b88af]/75 leading-none">
                            {item.title}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[1rem] font-bold leading-tight tracking-tight text-[#00447C] mb-1.5">
                            {item.value}
                          </p>
                          <p className="text-[0.7rem] leading-[1.45] text-[#4b6780]/90 line-clamp-2 min-h-[2.03rem]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Status Bar */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5b88af]/10 to-transparent" />
                  <div className="flex items-center justify-between gap-3 pt-2.5 text-[0.65rem] font-semibold text-[#4b6780]/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-[#EBC03F] drop-shadow-[0_0_4px_rgba(235,192,63,0.4)]" />
                      <span>Soft-sync updates</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#0066B3]/60 animate-ping" style={{ animationDuration: '3s' }} />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0066B3] shadow-[0_0_4px_rgba(0,102,179,0.5)]" />
                      </span>
                      <span>Online sync</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
