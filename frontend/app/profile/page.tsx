'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { booksApi, BorrowRequest } from '@/lib/api';
import { authApi } from '@/lib/auth';
import { getUserRoleLabel } from '@/lib/roles';

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return 'Unknown';
  }
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00`
    : dateString;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const accountActions = [
  {
    title: 'My Books',
    description: 'Review pending, approved, and returned books.',
    href: '/my-books',
  },
  {
    title: 'Change Password',
    description: 'Update your password while you are signed in.',
    href: '/change-password',
  },
  {
    title: 'Contact Support',
    description: 'Reach the library team if you need help with your account.',
    href: '/contact',
  },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [draftFullName, setDraftFullName] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);

  const displayIdLabel = user?.staff_id
    ? user?.role === 'LIBRARIAN' || user?.role === 'TEACHER'
      ? 'Faculty ID'
      : 'Staff ID'
    : 'Student ID';
  const displayIdValue = user?.staff_id ?? user?.student_id ?? 'N/A';
  const roleLabel = getUserRoleLabel(user);
  const fullNameValue = draftFullName ?? user?.full_name ?? '';
  const emailValue = draftEmail ?? user?.email ?? '';
  const normalizedCurrentEmail = (user?.email ?? '').trim().toLowerCase();
  const normalizedDraftEmail = emailValue.trim().toLowerCase();
  const hasProfileChanges =
    fullNameValue.trim() !== (user?.full_name ?? '').trim() ||
    normalizedDraftEmail !== normalizedCurrentEmail;
  const canSaveProfile = isEditingProfile && hasProfileChanges;

  useEffect(() => {
    let isActive = true;

    const loadRequests = async () => {
      setLoading(true);
      const response = await booksApi.getBorrowRequests();

      if (!isActive) {
        return;
      }

      if (response.error || !response.data) {
        setError(response.error ?? 'Unable to load borrow receipts.');
        setRequests([]);
      } else {
        setError(null);
        setRequests(response.data);
      }
      setLoading(false);
    };

    loadRequests();

    return () => {
      isActive = false;
    };
  }, []);

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === 'APPROVED' || request.status === 'RETURNED'),
    [requests],
  );

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'PENDING'),
    [requests],
  );

  const activeBorrowCount = useMemo(
    () => requests.filter((request) => request.status === 'APPROVED').length,
    [requests],
  );

  const returnedBorrowCount = useMemo(
    () => requests.filter((request) => request.status === 'RETURNED').length,
    [requests],
  );

  const memberSince = user?.date_joined ? formatDate(user.date_joined) : 'Unknown';
  const emailStatusLabel = user?.email ? 'Ready for reminders' : 'Email required';

  const handleStartProfileEdit = () => {
    setDraftFullName(user?.full_name ?? '');
    setDraftEmail(user?.email ?? '');
    setProfileError(null);
    setProfileMessage(null);
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setDraftFullName(null);
    setDraftEmail(null);
    setProfileError(null);
    setProfileMessage(null);
    setIsEditingProfile(false);
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFullName = fullNameValue.trim();
    const trimmedEmail = emailValue.trim().toLowerCase();

    if (!trimmedFullName) {
      setProfileError('Full name is required.');
      return;
    }

    if (!trimmedEmail) {
      setProfileError('Email is required so due-date reminders and password reset emails can be sent.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setProfileError('Enter a valid email address.');
      return;
    }

    setProfileSubmitting(true);
    setProfileError(null);
    setProfileMessage(null);

    const result = await authApi.updateProfile({
      full_name: trimmedFullName,
      email: trimmedEmail,
    });

    setProfileSubmitting(false);

    if (result.error) {
      setProfileError(result.error);
      return;
    }

    await refreshUser();
    setDraftFullName(null);
    setDraftEmail(null);
    setIsEditingProfile(false);
    setProfileMessage('Profile updated successfully.');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8f9fb] text-ink">
        <Navbar variant="light" />
        <main className="pt-16">
          <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#f8f9fb]">
            <div className="absolute inset-0">
              <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              <h1 className="text-3xl font-bold text-ink sm:text-4xl">Profile</h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Review your library access, keep your contact details current, and manage account activity from one polished workspace.
              </p>
            </div>
          </section>

          <section className="relative z-10 -mt-12 mx-auto max-w-6xl px-4 sm:-mt-16 sm:px-6 lg:px-8">
            <div className="public-panel rounded-[2rem] p-6 sm:p-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.02fr_1.38fr]">
                <div className="space-y-5">
                  <div className="public-panel-soft relative overflow-hidden rounded-[1.9rem] p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_40%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_40%)]" />
                    <div className="relative">
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <span className="inline-flex items-center rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                            Account Overview
                          </span>
                          <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-ink">
                              {user?.full_name ?? 'Student'}
                            </h2>
                            <p className="mt-2 text-sm text-ink-muted">
                              {user?.email ?? 'No email saved for reminders'}
                            </p>
                          </div>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-ink-muted">
                          Your library role, active borrowing status, and access information are organized here for a cleaner and more professional account view.
                        </p>
                        
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.2rem] border border-sky-300/30 bg-sky-400/[0.12] p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-700/80">{displayIdLabel}</p>
                            <p className="mt-1.5 text-xl font-bold text-ink">{displayIdValue}</p>
                          </div>
                          <div className="rounded-[1.2rem] border border-amber-300/30 bg-amber-400/[0.12] p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700/80">Role</p>
                            <p className="mt-1.5 text-xl font-bold text-ink">{roleLabel}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-700">
                            {emailStatusLabel}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-line bg-white/60 px-3 py-1 text-xs font-medium text-ink-muted">
                            Member since {memberSince}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="public-panel-soft rounded-[1.35rem] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Active Borrows</p>
                              <p className="mt-2 text-3xl font-semibold text-ink">{activeBorrowCount}</p>
                              <p className="mt-1 text-sm text-ink-muted">Books currently on your account.</p>
                            </div>
                            <span className="rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                              Live
                            </span>
                          </div>
                        </div>

                        <div className="public-panel-soft rounded-[1.35rem] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Pending Requests</p>
                              <p className="mt-2 text-3xl font-semibold text-ink">{pendingRequests.length}</p>
                              <p className="mt-1 text-sm text-ink-muted">Requests waiting for approval.</p>
                            </div>
                            <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                              Queue
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="public-panel-soft relative overflow-hidden rounded-[1.9rem] p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.06),transparent_35%)]" />
                  <div className="relative">
                  <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--accent-cool-strong)]/70">Editable Profile</p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">Edit Account Details</h3>
                      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                        Update the personal details that can change while your system-assigned account details stay listed in Account Overview.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          onClick={handleStartProfileEdit}
                          className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] px-4 py-3 text-sm font-semibold text-[#1a1b1f] transition-all hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)]"
                        >
                          Edit Details
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCancelProfileEdit}
                          className="inline-flex items-center justify-center rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-muted transition-all hover:bg-white/60"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        href="/forgot-password"
                        className="inline-flex items-center justify-center rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-muted transition-all hover:bg-white/60"
                      >
                        Forgot Password
                      </Link>
                    </div>
                  </div>

                  <form className="mt-6 space-y-5" onSubmit={handleProfileSave}>
                    {profileError && (
                      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-700">
                        {profileError}
                      </div>
                    )}
                    {profileMessage && (
                      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-700">
                        {profileMessage}
                      </div>
                    )}

                    <div className="public-panel-soft rounded-[1.5rem] p-5">
                      <div className="mb-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">Contact Details</p>
                        <p className="mt-2 text-sm text-ink-muted">
                          Keep these details accurate so account notices and recovery flows continue working properly.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="profile-full-name" className="block text-sm font-medium text-ink">
                          Full Name
                        </label>
                        <input
                          id="profile-full-name"
                          type="text"
                          value={fullNameValue}
                          disabled={!isEditingProfile}
                          onChange={(event) => {
                            setDraftFullName(event.target.value);
                            setProfileError(null);
                          }}
                          className="mt-2 w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-ink placeholder:text-ink-muted/50 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder="Enter your full name"
                        />
                        <p className="mt-2 text-xs text-ink-muted">
                          This name appears across your account and borrow records.
                        </p>
                        </div>

                        <div>
                        <label htmlFor="profile-email" className="block text-sm font-medium text-ink">
                          Email Address
                        </label>
                        <input
                          id="profile-email"
                          type="email"
                          value={emailValue}
                          disabled={!isEditingProfile}
                          onChange={(event) => {
                            setDraftEmail(event.target.value);
                            setProfileError(null);
                          }}
                          className="mt-2 w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-ink placeholder:text-ink-muted/50 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder="name@example.com"
                        />
                        <p className="mt-2 text-xs text-ink-muted">
                          Due-date reminders and password reset messages will be sent here.
                        </p>
                        </div>
                      </div>
                    </div>

                    <div className="public-panel-soft rounded-[1.5rem] px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">Editing status</p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {isEditingProfile
                              ? 'You can update your editable details now.'
                              : 'Click Edit Details to unlock the form and make changes.'}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={!canSaveProfile || profileSubmitting}
                          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] px-5 py-3 text-sm font-semibold text-[#1a1b1f] shadow-lg shadow-amber-500/30 transition-all hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {profileSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="public-panel-soft rounded-[1.6rem] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">Borrow Activity</h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        Approved receipts and returned books are listed here for quick review.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full border border-line bg-white/60 px-3 py-1 text-ink-muted">
                        {approvedRequests.length} receipts
                      </span>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-emerald-700">
                        {returnedBorrowCount} returned
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {loading && (
                      <div className="flex items-center gap-3 text-ink-muted">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[color:var(--accent)]"></div>
                        Loading borrow activity...
                      </div>
                    )}
                    {error && (
                      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-700">
                        {error}
                      </div>
                    )}
                    {!loading && !error && approvedRequests.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-line bg-white/40 px-4 py-6 text-sm text-ink-muted">
                        No approved borrow receipts yet.
                      </p>
                    )}
                    {!loading &&
                      !error &&
                      approvedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="public-panel-soft rounded-2xl p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Receipt</p>
                              <p className="mt-1 text-lg font-semibold text-ink">
                                {request.receipt_number ?? 'Not issued'}
                              </p>
                              <p className="mt-2 text-sm text-ink-muted">{request.book.title}</p>
                            </div>
                            <div className="text-sm text-ink-muted">
                              <p>Borrowed: {formatDate(request.processed_at ?? request.requested_at)}</p>
                              <p>Due: {formatDate(request.due_date)}</p>
                              <span
                                className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  request.status === 'RETURNED'
                                    ? 'border border-emerald-300/30 bg-emerald-400/15 text-emerald-700'
                                    : 'border border-sky-300/30 bg-sky-400/15 text-sky-700'
                                }`}
                              >
                                {request.status === 'RETURNED' ? 'Returned' : 'Borrowed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="public-panel-soft rounded-[1.6rem] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">Quick Actions</h3>
                        <p className="mt-1 text-sm text-ink-muted">
                          Shortcuts for the most common account tasks.
                        </p>
                      </div>
                      <span className="rounded-full border border-line bg-white/60 px-3 py-1 text-xs font-medium text-ink-muted">
                        Friendly tools
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {accountActions.map((item) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          className="group public-panel-soft rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-ink">{item.title}</h4>
                              <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
                            </div>
                            <span className="text-ink-muted/40 transition-colors group-hover:text-sky-600">
                              -&gt;
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="public-panel-soft rounded-[1.6rem] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">Pending Requests</h3>
                        <p className="mt-1 text-sm text-ink-muted">
                          Track books that are still waiting for approval.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-700">
                        {pendingRequests.length} pending
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {!loading && pendingRequests.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-line bg-white/40 px-4 py-6 text-sm text-ink-muted">
                          No pending borrow requests.
                        </p>
                      )}
                      {!loading &&
                        pendingRequests.map((request) => (
                          <div
                            key={request.id}
                            className="public-panel-soft rounded-2xl px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-ink">{request.book.title}</p>
                                <p className="mt-1 text-xs text-ink-muted">
                                  Requested on {formatDate(request.requested_at)}
                                </p>
                              </div>
                              <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-700">
                                Pending
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
