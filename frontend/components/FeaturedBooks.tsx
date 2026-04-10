'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { booksApi, Book } from '@/lib/api';
import { API_BASE_URL, API_CONFIGURATION_WARNING } from '@/lib/api-config';
import BookCard from './BookCard';

export default function FeaturedBooks() {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const booksRequestUrl = `${API_BASE_URL}/books/books/`;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchBooks = async () => {
      setLoading(true);
      const response = await booksApi.getAll();
      
      if (response.error) {
        setError(response.error);
        setBooks([]);
      } else if (response.data) {
        setError(null);
        setBooks(response.data.slice(0, 4)); // Show only first 4 books
      }
      
      setLoading(false);
    };

    fetchBooks();
  }, [isAuthenticated]);

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="relative pt-8 pb-10 sm:pt-10 sm:pb-12">
      <div className="absolute inset-0">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-sky-300/18 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-amber-300/14 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(126,191,231,0.14),transparent_45%)]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-4 text-3xl font-bold text-ink animate-fade-up md:text-4xl">
            Featured Books
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ink-muted animate-fade-up delay-100">
            Discover our curated collection of popular books available for borrowing
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12 animate-fade-up">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 animate-fade-up rounded-3xl border border-amber-300/40 bg-amber-50 px-5 py-4 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
              Live catalog unavailable
            </p>
            <p className="mt-2 text-sm text-amber-900/80">
              Request failed for <span className="font-mono text-[13px]">{booksRequestUrl}</span>
            </p>
            <p className="mt-1 text-sm text-amber-900/75">{error}</p>
            {API_CONFIGURATION_WARNING && (
              <p className="mt-2 text-sm text-amber-900/75">{API_CONFIGURATION_WARNING}</p>
            )}
          </div>
        )}

        {/* Books Grid */}
        {!loading && books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book, index) => (
              <div
                key={book.id}
                style={{ animationDelay: `${index * 90 + 120}ms` }}
                className="animate-fade-up transition-transform duration-300 hover:-translate-y-1"
              >
                <BookCard book={book} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="public-panel rounded-3xl px-6 py-14 text-center backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-ink">No featured books available</h3>
            <p className="mt-2 text-ink-muted">
              Add catalog titles in the librarian desk to populate this section.
            </p>
          </div>
        )}

        {/* View All Button */}
        <div className="relative z-10 mt-6 flex items-center justify-center text-center animate-fade-up delay-300">
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-[color:var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-[#17314e] shadow-[0_8px_16px_rgba(217,175,88,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--accent-strong)] hover:text-[#17314e] sm:px-4 sm:py-2 sm:text-[13px]"
          >
            View All Books
            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
