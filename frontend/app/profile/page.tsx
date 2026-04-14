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
            <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <div className="flex items-center gap-6">
                {/* Circular Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-sky-400 to-sky-500 text-3xl font-bold text-white shadow-[0_10px_30px_rgba(56,189,248,0.25)] sm:h-24 sm:w-24 sm:text-4xl">
                  {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold text-ink sm:text-4xl">
                    Welcome back, {user?.full_name?.split(' ')[0] ?? 'User'}
                  </h1>
                  <p className="mt-2 text-ink-muted">
                    Manage your library profile, track borrowing activity, and keep your account details current.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-10 mx-auto max-w-[1200px] px-6 py-20 sm:px-8 lg:px-12">
            {/* Power Sidebar Layout - 30-70 Split */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[30%_70%]">
              {/* LEFT SIDEBAR - Identity + Quick Actions */}
              <div className="space-y-6">
                <div className="rounded-[20px] border border-line bg-gradient-to-br from-[#f0f7fc] to-white p-6 shadow-[0_10px_40px_rgba(0,150,255,0.08)]">
                  <div className="space-y-5">
                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-400/20 to-amber-300/15 px-3 py-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.15)]">
                      <svg className="h-3.5 w-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{roleLabel}</span>
                    </div>

                    {/* Student/Staff ID */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">{displayIdLabel}</p>
                      <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{displayIdValue}</p>
                    </div>

                    {/* Membership Timeline */}
                    <div className="rounded-[14px] border border-sky-200/60 bg-sky-50/50 p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">Member Since</p>
                      <p className="mt-1.5 text-base font-bold text-ink">{memberSince}</p>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-sky-200">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-sky-400 to-sky-500"></div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-ink-muted">Active library member</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] border border-sky-300/30 bg-sky-400/[0.08] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">Active</p>
                        <p className="mt-2 text-2xl font-bold text-ink">{activeBorrowCount}</p>
                        <p className="mt-1 text-[10px] text-ink-muted">Books</p>
                      </div>
                      <div className="rounded-[14px] border border-amber-300/30 bg-amber-400/[0.08] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Returned</p>
                        <p className="mt-2 text-2xl font-bold text-ink">{returnedBorrowCount}</p>
                        <p className="mt-1 text-[10px] text-ink-muted">Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_10px_40px_rgba(0,150,255,0.08)]">
                  <div className="border-b border-line pb-4">
                    <h3 className="text-lg font-bold text-ink">Quick Actions</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      Common account tasks.
                    </p>
                  </div>
                  <div className="mt-5 space-y-3">
                    <Link
                      href="/my-books"
                      className="group block rounded-[14px] border border-line bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,150,255,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-ink">My Books</h4>
                          <p className="mt-1 text-[10px] text-ink-muted">Review pending, approved, and returned books.</p>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                    <Link
                      href="/contact"
                      className="group block rounded-[14px] border border-line bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,150,255,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-ink">Contact Support</h4>
                          <p className="mt-1 text-[10px] text-ink-muted">Reach the library team if you need help.</p>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                    <Link
                      href="/change-password"
                      className="group block rounded-[14px] border border-line bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,150,255,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-ink">Change Password</h4>
                          <p className="mt-1 text-[10px] text-ink-muted">Update your account security.</p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
                          <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN AREA - Account Details + Borrow Activity */}
              <div className="space-y-6">
                <div className="rounded-[20px] border border-line bg-white p-7 shadow-[0_10px_40px_rgba(0,150,255,0.08)]">
                  <div className="flex items-start justify-between border-b border-line pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-ink">Account Details</h2>
                      <p className="mt-1.5 text-sm text-ink-muted">
                        Update your editable information below.
                      </p>
                    </div>
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={handleStartProfileEdit}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,158,11,0.4)]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-muted transition-all hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form className="mt-6 space-y-6" onSubmit={handleProfileSave}>
                    {profileError && (
                      <div className="rounded-[16px] border border-rose-400/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {profileError}
                      </div>
                    )}
                    {profileMessage && (
                      <div className="rounded-[16px] border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {profileMessage}
                      </div>
                    )}

                    {/* Full Name - Editable */}
                    <div>
                      <label htmlFor="profile-full-name" className="block text-sm font-semibold text-ink">
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
                        className="mt-2 w-full rounded-[14px] border-2 border-amber-300/40 bg-white px-4 py-3 text-sm text-ink transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-slate-50 disabled:opacity-70"
                        placeholder="Enter your full name"
                      />
                      <p className="mt-2 text-xs text-ink-muted">
                        This name appears on all your borrow records and receipts.
                      </p>
                    </div>

                    {/* Email - Locked/Verified Display */}
                    <div>
                      <label className="block text-sm font-semibold text-ink">
                        Institutional Email
                      </label>
                      <div className="mt-2 rounded-[14px] border-2 border-sky-200/60 bg-gradient-to-br from-sky-50/50 to-blue-50/30 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-400/20">
                            <svg className="h-5 w-5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{emailValue || 'No email set'}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <svg className="h-3.5 w-3.5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-[10px] font-semibold text-sky-700">Verified by institution</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-sky-700">
                        Managed by institution. Contact admin to change.
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-between rounded-[14px] border border-line bg-slate-50/50 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {isEditingProfile ? 'Editing enabled' : 'View mode'}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {isEditingProfile
                            ? 'Click Save to update your profile.'
                            : 'Click Edit to make changes.'}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={!canSaveProfile || profileSubmitting}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,158,11,0.4)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {profileSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Borrow Activity */}
                <div className="rounded-[20px] border border-line bg-white p-7 shadow-[0_10px_40px_rgba(0,150,255,0.08)]">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-ink">Borrow Activity</h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        Your approved and returned books.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-sky-300/40 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
                        {approvedRequests.length} Total
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {loading && (
                      <div className="flex items-center gap-3 text-ink-muted">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-sky-400"></div>
                        Loading activity...
                      </div>
                    )}
                    {error && (
                      <div className="rounded-[16px] border border-rose-400/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                      </div>
                    )}
                    {!loading && !error && approvedRequests.length === 0 && (
                      <p className="rounded-[16px] border border-dashed border-line bg-slate-50 px-4 py-8 text-center text-sm text-ink-muted">
                        No borrow receipts yet.
                      </p>
                    )}
                    {!loading &&
                      !error &&
                      approvedRequests.map((request) => {
                        const dueDate = request.due_date ? new Date(request.due_date) : null;
                        const today = new Date();
                        const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                        const progressPercent = daysRemaining !== null && daysRemaining >= 0 ? Math.max(0, Math.min(100, (daysRemaining / 14) * 100)) : 0;
                        
                        return (
                          <div
                            key={request.id}
                            className="rounded-[14px] border border-line bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:shadow-[0_4px_16px_rgba(0,150,255,0.12)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-full border border-sky-300/40 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                                    {request.receipt_number ?? 'Pending'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      request.status === 'RETURNED'
                                        ? 'border border-emerald-300/40 bg-emerald-50 text-emerald-700'
                                        : 'border border-amber-300/40 bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {request.status === 'RETURNED' ? 'Returned' : 'Active'}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-ink">{request.book.title}</p>
                                <p className="mt-1 text-[10px] text-ink-muted">
                                  Borrowed: {formatDate(request.processed_at ?? request.requested_at)} • Due: {formatDate(request.due_date)}
                                </p>
                                {request.status === 'APPROVED' && daysRemaining !== null && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-semibold text-ink-muted">Days remaining</span>
                                      <span className="font-bold text-ink">{daysRemaining > 0 ? daysRemaining : 'Overdue'}</span>
                                    </div>
                                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-200">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          daysRemaining > 7 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                          daysRemaining > 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                          'bg-gradient-to-r from-rose-400 to-rose-500'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
