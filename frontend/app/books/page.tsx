'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import MovingObjectsLayer from '@/components/MovingObjectsLayer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { booksApi, Book, Category } from '@/lib/api';
import { API_BASE_URL, API_CONFIGURATION_WARNING } from '@/lib/api-config';

function BooksPageContent() {
  const searchParams = useSearchParams();
  const searchValue = searchParams.get('search') ?? '';
  const [query, setQuery] = useState(searchValue);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const booksRequestUrl = `${API_BASE_URL}/books/books/`;
  const categoriesRequestUrl = `${API_BASE_URL}/books/categories/`;

  useEffect(() => {
    setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    let isActive = true;

    const fetchBooks = async () => {
      setLoading(true);
      const response = await booksApi.getAll();

      if (!isActive) {
        return;
      }

      if (response.error || !response.data) {
        setError(response.error ?? 'Unable to load books');
        setBooks([]);
      } else {
        setError(null);
        setBooks(response.data);
      }

      setLoading(false);
    };

    fetchBooks();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      const response = await booksApi.getCategories();

      if (!isActive) {
        return;
      }

      if (response.error || !response.data) {
        setCategoriesError(response.error ?? 'Unable to load categories');
        setCategories([]);
      } else {
        setCategoriesError(null);
        setCategories([...response.data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setCategoriesLoading(false);
    };

    fetchCategories();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0) return;
    const uniqueCategories = new Map<number, Category>();
    books.forEach((book) => {
      (book.categories ?? []).forEach((category) => {
        uniqueCategories.set(category.id, category);
      });
    });
    if (uniqueCategories.size > 0) {
      setCategories(
        Array.from(uniqueCategories.values()).sort((a, b) => a.name.localeCompare(b.name))
      );
      setCategoriesError(null);
    }
  }, [books, categories.length]);

  const availableCount = useMemo(
    () => books.filter((book) => book.available).length,
    [books]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<number, number>();
    books.forEach((book) => {
      (book.categories ?? []).forEach((category) => {
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
      });
    });
    return counts;
  }, [books]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((category) => category.id === selectedCategoryId)?.name ?? null;
  }, [categories, selectedCategoryId]);

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return books.filter((book) => {
      if (
        selectedCategoryId &&
        !(book.categories ?? []).some((category) => category.id === selectedCategoryId)
      ) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const categoryText = (book.categories ?? [])
        .map((category) => category.name)
        .join(' ');
      return [book.title, book.author, book.genre, book.isbn, categoryText].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    });
  }, [books, query, selectedCategoryId]);

  return (
    <ProtectedRoute>
      <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main className="relative overflow-hidden pt-16">
        <MovingObjectsLayer />
        <section className="relative overflow-hidden border-b border-line">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-amber-300/18 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(220,236,255,0.42))]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5 animate-fade-up">
                <p className="text-[color:var(--accent-cool-strong)] text-xs font-semibold uppercase tracking-[0.35em]">
                  Browse Collection
                </p>
                <h1 className="text-4xl sm:text-5xl font-semibold text-balance text-ink">
                  Find your next read
                </h1>
                <p className="max-w-xl text-lg text-ink-muted">
                  Search by title, author, category, or ISBN and explore every shelf in the
                  collection.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                  <span className="public-pill rounded-full px-4 py-1.5 backdrop-blur-sm">
                    Total {loading ? '...' : books.length} titles
                  </span>
                  <span className="public-pill rounded-full px-4 py-1.5 backdrop-blur-sm">
                    Available {loading ? '...' : availableCount}
                  </span>
                </div>
              </div>
              <form onSubmit={(event) => event.preventDefault()} className="w-full">
                <div className="public-panel rounded-[28px] p-4 sm:p-5 md:p-6 backdrop-blur-xl animate-fade-up delay-100">
                  <label className="text-sm font-semibold text-ink">Search the catalog</label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white/88 px-4 py-3.5 sm:py-3 focus-within:border-sky-300/60 focus-within:ring-2 focus-within:ring-sky-300/25">
                    <svg
                      className="w-5 h-5 shrink-0 text-ink-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by title, author, or category..."
                      className="w-full min-w-0 bg-transparent text-base text-ink placeholder:text-ink-muted/70 focus:outline-none"
                      type="search"
                      inputMode="search"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="rounded-full border border-line bg-white/80 px-3 py-1">
                      {loading ? '...' : filteredBooks.length} result{
                        filteredBooks.length === 1 ? '' : 's'
                      }
                    </span>
                    {selectedCategoryName && (
                      <span className="rounded-full border border-sky-300/40 bg-sky-100/85 px-3 py-1 text-[color:var(--accent-cool-strong)]">
                        Category: {selectedCategoryName}
                      </span>
                    )}
                    {query.trim() && (
                      <span className="rounded-full border border-line bg-white/80 px-3 py-1">
                        Search: &quot;{query.trim()}&quot;
                      </span>
                    )}
                    {!query.trim() && (
                      <span className="rounded-full border border-line bg-white/80 px-3 py-1">
                        Tip: Use ISBN for exact match
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="relative py-10 sm:py-12">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_10%,rgba(126,191,231,0.16),transparent_38%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="public-panel relative mb-8 overflow-hidden rounded-[2rem] p-6 shadow-card backdrop-blur-xl sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(126,191,231,0.16),rgba(59,130,246,0.12),rgba(0,68,124,0.08))]" />
                <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-sky-300/25 blur-3xl" />
                <div className="absolute -right-8 top-4 h-28 w-28 rounded-full bg-blue-400/18 blur-3xl" />
              </div>

              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-cool-strong)]/55">
                    Categories
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
                    Browse by category
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-[0.96rem]">
                    Jump into a specific shelf, compare categories faster, and narrow the catalog
                    with cleaner filters built for quick browsing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  disabled={selectedCategoryId === null}
                  className="inline-flex items-center rounded-full border border-line bg-white/74 px-4 py-2 text-xs font-semibold text-ink-muted transition-all hover:border-sky-300/55 hover:bg-sky-50 hover:text-[color:var(--accent-cool-strong)] disabled:cursor-default disabled:opacity-45"
                >
                  Clear filter
                </button>
              </div>

              <div className="relative mt-6 rounded-[1.6rem] border border-sky-200/55 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-4">
                {categoriesLoading && (
                  <div className="flex items-center gap-3 px-1 py-1 text-sm text-ink-muted">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-[color:var(--accent-cool-strong)]" />
                    Loading categories...
                  </div>
                )}
                {!categoriesLoading && categoriesError && (
                  <div className="rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {categoriesError}
                  </div>
                )}
                {!categoriesLoading && categories.length === 0 && !categoriesError && (
                  <div className="rounded-2xl border border-dashed border-sky-200/70 bg-white/70 px-4 py-6 text-sm text-ink-muted">
                    No categories available yet.
                  </div>
                )}
                {!categoriesLoading && categories.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(null)}
                      aria-pressed={selectedCategoryId === null}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        selectedCategoryId === null
                          ? 'border-[color:var(--accent-cool-strong)] bg-[color:var(--accent-cool-strong)] text-white shadow-[0_12px_24px_rgba(0,68,124,0.22)]'
                          : 'border-sky-200/80 bg-white/84 text-[color:var(--accent-cool-strong)] hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-sky-50'
                      }`}
                    >
                      <span>All categories</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          selectedCategoryId === null
                            ? 'bg-white/16 text-white'
                            : 'bg-sky-100 text-[color:var(--accent-cool-strong)]/90'
                        }`}
                      >
                        {loading ? '...' : books.length}
                      </span>
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        aria-pressed={selectedCategoryId === category.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          selectedCategoryId === category.id
                            ? 'border-[color:var(--accent-cool-strong)] bg-[color:var(--accent-cool-strong)] text-white shadow-[0_12px_24px_rgba(0,68,124,0.22)]'
                            : 'border-sky-200/80 bg-white/84 text-[color:var(--accent-cool-strong)] hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-sky-50'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            selectedCategoryId === category.id
                              ? 'bg-white/16 text-white'
                              : 'bg-sky-100 text-[color:var(--accent-cool-strong)]/90'
                          }`}
                        >
                          {categoryCounts.get(category.id) ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-cool-strong)]/80">
                  Library Catalog
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-ink">All books</h2>
                <p className="text-sm text-ink-muted">
                  Browse the full catalog and request a borrow in seconds.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-full border border-line bg-white/80 px-3 py-1">
                  {loading ? '...' : filteredBooks.length} result{
                    filteredBooks.length === 1 ? '' : 's'
                  }
                </span>
                {query.trim() && (
                  <span className="rounded-full border border-line bg-white/80 px-3 py-1">
                    Search: &quot;{query.trim()}&quot;
                  </span>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-[color:var(--accent)] border-t-transparent"></div>
              </div>
            )}

            {error && !loading && (
              <div className="mb-8 rounded-3xl border border-amber-300/40 bg-amber-50 px-5 py-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                  Live catalog unavailable
                </p>
                <p className="mt-2 text-sm text-amber-900/80">
                  Request failed for <span className="font-mono text-[13px]">{booksRequestUrl}</span>
                </p>
                <p className="mt-1 text-sm text-amber-900/75">{error}</p>
                {categoriesError && (
                  <p className="mt-2 text-sm text-amber-900/75">
                    Categories request failed for{' '}
                    <span className="font-mono text-[13px]">{categoriesRequestUrl}</span>:{" "}
                    {categoriesError}
                  </p>
                )}
                {API_CONFIGURATION_WARNING && (
                  <p className="mt-2 text-sm text-amber-900/75">{API_CONFIGURATION_WARNING}</p>
                )}
              </div>
            )}

            {!loading && filteredBooks.length === 0 && (
              <div className="public-panel rounded-3xl px-6 py-14 text-center backdrop-blur-xl">
                <h2 className="text-2xl font-semibold text-ink">
                  {error ? 'Catalog unavailable' : 'No books matched your search'}
                </h2>
                <p className="mt-2 text-ink-muted">
                  {error
                    ? 'Check the backend connection or API configuration, then refresh this page.'
                    : 'Try a different title, author, or category.'}
                </p>
              </div>
            )}

            {!loading && filteredBooks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 animate-fade-up delay-100">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
    </ProtectedRoute>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="public-shell flex min-h-screen items-center justify-center text-ink">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--accent)] border-r-transparent" />
        </div>
      }
    >
      <BooksPageContent />
    </Suspense>
  );
}
