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
      <div className="theme-login min-h-screen bg-[#0b1324] text-white">
        <Navbar variant="dark" />
        <main className="pt-16">
          <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0a1221] via-[#0e1629] to-[#0b1324] text-white">
            <div className="absolute inset-0">
              <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              <h1 className="text-3xl font-bold sm:text-4xl">Profile</h1>
              <p className="mt-3 max-w-2xl text-white/75">
                Review your library access, keep your contact details current, and manage account activity from one polished workspace.
              </p>
            </div>
          </section>

          <section className="relative z-10 -mt-12 mx-auto max-w-6xl px-4 sm:-mt-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,27,45,0.95)_0%,rgba(12,20,35,0.97)_100%)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.34)] backdrop-blur-xl sm:p-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.02fr_1.38fr]">
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(21,34,57,0.98)_0%,rgba(10,18,33,0.96)_100%)] p-6 shadow-[0_18px_50px_rgba(2,8,23,0.28)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_36%)]" />
                    <div className="relative">
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <span className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                            Account Overview
                          </span>
                          <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white">
                              {user?.full_name ?? 'Student'}
                            </h2>
                            <p className="mt-2 text-sm text-white/65">
                              {user?.email ?? 'No email saved for reminders'}
                            </p>
                          </div>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-white/60">
                          Your library role, active borrowing status, and access information are organized here for a cleaner and more professional account view.
                        </p>
                        
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.2rem] border border-sky-300/20 bg-sky-400/[0.08] p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/70">{displayIdLabel}</p>
                            <p className="mt-1.5 text-xl font-bold text-white">{displayIdValue}</p>
                          </div>
                          <div className="rounded-[1.2rem] border border-amber-300/20 bg-amber-400/[0.08] p-3.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Role</p>
                            <p className="mt-1.5 text-xl font-bold text-white">{roleLabel}</p>
                          </div>
                        </div>

                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Active Borrows</p>
                              <p className="mt-2 text-3xl font-semibold text-white">{activeBorrowCount}</p>
                              <p className="mt-1 text-sm text-white/55">Books currently on your account.</p>
                            </div>
                            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                              Live
                            </span>
                          </div>
                        </div>

                        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Pending Requests</p>
                              <p className="mt-2 text-3xl font-semibold text-white">{pendingRequests.length}</p>
                              <p className="mt-1 text-sm text-white/55">Requests waiting for approval.</p>
                            </div>
                            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                              Queue
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#101b2d]/92 p-6 shadow-[0_18px_50px_rgba(2,8,23,0.24)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />
                  <div className="relative">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Editable Profile</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">Edit Account Details</h3>
                      <p className="mt-2 max-w-2xl text-sm text-white/65">
                        Update the personal details that can change while your system-assigned account details stay listed in Account Overview.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          onClick={handleStartProfileEdit}
                          className="inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent-strong)]"
                        >
                          Edit Details
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCancelProfileEdit}
                          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        href="/forgot-password"
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        Forgot Password
                      </Link>
                    </div>
                  </div>

                  <form className="mt-6 space-y-5" onSubmit={handleProfileSave}>
                    {profileError && (
                      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                        {profileError}
                      </div>
                    )}
                    {profileMessage && (
                      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
                        {profileMessage}
                      </div>
                    )}

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Contact Details</p>
                        <p className="mt-2 text-sm text-white/60">
                          Keep these details accurate so account notices and recovery flows continue working properly.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="profile-full-name" className="block text-sm font-medium text-white/78">
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
                          className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/35 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder="Enter your full name"
                        />
                        <p className="mt-2 text-xs text-white/45">
                          This name appears across your account and borrow records.
                        </p>
                        </div>

                        <div>
                        <label htmlFor="profile-email" className="block text-sm font-medium text-white/78">
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
                          className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/35 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder="name@example.com"
                        />
                        <p className="mt-2 text-xs text-white/45">
                          Due-date reminders and password reset messages will be sent here.
                        </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Editing status</p>
                          <p className="mt-1 text-sm text-white/55">
                            {isEditingProfile
                              ? 'You can update your editable details now.'
                              : 'Click Edit Details to unlock the form and make changes.'}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={!canSaveProfile || profileSubmitting}
                          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(14,165,233,0.2)] transition-colors hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2d]/92 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Borrow Activity</h3>
                      <p className="mt-1 text-sm text-white/55">
                        Approved receipts and returned books are listed here for quick review.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
                        {approvedRequests.length} receipts
                      </span>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                        {returnedBorrowCount} returned
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {loading && (
                      <div className="flex items-center gap-3 text-white/60">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[color:var(--accent)]"></div>
                        Loading borrow activity...
                      </div>
                    )}
                    {error && (
                      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                        {error}
                      </div>
                    )}
                    {!loading && !error && approvedRequests.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/55">
                        No approved borrow receipts yet.
                      </p>
                    )}
                    {!loading &&
                      !error &&
                      approvedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Receipt</p>
                              <p className="mt-1 text-lg font-semibold text-white">
                                {request.receipt_number ?? 'Not issued'}
                              </p>
                              <p className="mt-2 text-sm text-white/65">{request.book.title}</p>
                            </div>
                            <div className="text-sm text-white/55">
                              <p>Borrowed: {formatDate(request.processed_at ?? request.requested_at)}</p>
                              <p>Due: {formatDate(request.due_date)}</p>
                              <span
                                className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  request.status === 'RETURNED'
                                    ? 'border border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                                    : 'border border-sky-300/20 bg-sky-400/10 text-sky-100'
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
                  <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2d]/92 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                        <p className="mt-1 text-sm text-white/55">
                          Shortcuts for the most common account tasks.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/65">
                        Friendly tools
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {accountActions.map((item) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:border-sky-300/20 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-white">{item.title}</h4>
                              <p className="mt-2 text-sm text-white/55">{item.description}</p>
                            </div>
                            <span className="text-white/30 transition-colors group-hover:text-sky-200">
                              -&gt;
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-[#101b2d]/92 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                        <p className="mt-1 text-sm text-white/55">
                          Track books that are still waiting for approval.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                        {pendingRequests.length} pending
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {!loading && pendingRequests.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/55">
                          No pending borrow requests.
                        </p>
                      )}
                      {!loading &&
                        pendingRequests.map((request) => (
                          <div
                            key={request.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">{request.book.title}</p>
                                <p className="mt-1 text-xs text-white/50">
                                  Requested on {formatDate(request.requested_at)}
                                </p>
                              </div>
                              <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
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
