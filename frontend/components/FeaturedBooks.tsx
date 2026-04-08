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
    <section className="relative bg-[#0f1b2f] pt-8 pb-4 sm:pt-10 sm:pb-6">
      <div className="absolute inset-0">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.12),transparent_45%)]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-up">
            Featured Books
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto animate-fade-up delay-100">
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
          <div className="mb-8 animate-fade-up rounded-3xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-left">
            <p className="text-[color:var(--accent-strong)] text-sm font-semibold uppercase tracking-[0.2em]">
              Live catalog unavailable
            </p>
            <p className="mt-2 text-sm text-amber-100/90">
              Request failed for <span className="font-mono text-[13px]">{booksRequestUrl}</span>
            </p>
            <p className="mt-1 text-sm text-amber-100/80">{error}</p>
            {API_CONFIGURATION_WARNING && (
              <p className="mt-2 text-sm text-amber-100/80">{API_CONFIGURATION_WARNING}</p>
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
          <div className="rounded-3xl border border-white/12 bg-white/6 px-6 py-14 text-center shadow-[0_20px_36px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-white">No featured books available</h3>
            <p className="mt-2 text-white/70">
              Add catalog titles in the librarian desk to populate this section.
            </p>
          </div>
        )}

        {/* View All Button */}
        <div className="relative z-10 mt-4 text-center animate-fade-up delay-300">
          <Link
            href="/books"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-full text-[#1a1b1f] bg-amber-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-400 shadow-soft"
          >
            View All Books
            <svg
              className="ml-4 w-5 h-5"
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
