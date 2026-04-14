'use client';

import Link from 'next/link';
import { useState } from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth';
import { PASSWORD_REQUIREMENTS_SUMMARY, getPasswordValidationMessage, isValidPassword } from '@/lib/passwordRules';
import { getUserRoleLabel } from '@/lib/roles';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const displayIdLabel = user?.staff_id
    ? user.role === 'LIBRARIAN' || user.role === 'TEACHER'
      ? 'Faculty ID'
      : 'Staff ID'
    : 'Student ID';
  const displayIdValue = user?.staff_id ?? user?.student_id ?? 'N/A';
  const roleLabel = getUserRoleLabel(user).toLowerCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!oldPassword) {
      setError('Enter your current password.');
      return;
    }
    if (!newPassword) {
      setError('Enter your new password.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError(getPasswordValidationMessage('New password'));
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const result = await authApi.changePassword({
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message);
    setOldPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowNewPasswordConfirm(false);
  };

  return (
    <ProtectedRoute>
      <div className="public-shell min-h-screen text-ink">
        <Navbar />
        <main className="relative overflow-hidden pt-16">
          <section className="relative overflow-hidden border-b border-line">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
              <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-amber-300/18 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(220,236,255,0.4))]" />
            </div>
            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-cool-strong)]/80">
                Security
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-ink sm:text-4xl">
                Change your password
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Update your sign-in password for your {roleLabel || 'library'} account.
                This works for student, librarian, and working accounts while you are signed in.
              </p>
            </div>
          </section>

          <section className="-mt-8 relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="public-panel-soft rounded-[28px] p-5 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-cool-strong)]/70">
                  Account
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-line bg-white/78 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted/75">{displayIdLabel}</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{displayIdValue}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-white/78 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted/75">Email</p>
                    <p className="mt-2 text-sm font-medium text-ink-muted">{user?.email ?? 'No email on file'}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/30 bg-amber-50 p-4 text-sm text-amber-900/80">
                    If you no longer remember your current password, use the{' '}
                    <Link href="/forgot-password" className="font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent)]">
                      forgot-password flow
                    </Link>
                    .
                  </div>
                </div>
              </div>

              <div className="public-panel rounded-[28px] p-5 backdrop-blur-xl sm:p-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {message && (
                    <div className="rounded-2xl border border-emerald-300/40 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                      {message}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-ink">
                      Current Password
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={oldPassword}
                        onChange={(event) => {
                          setOldPassword(event.target.value);
                          setError('');
                        }}
                        className="w-full rounded-xl border border-line bg-white/85 px-4 py-3 pr-16 text-ink placeholder:text-ink-muted/55 focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-cool-strong)]/75 hover:text-[color:var(--accent-cool-strong)]"
                      >
                        {showOldPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-ink">
                      New Password
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setError('');
                        }}
                        className="w-full rounded-xl border border-line bg-white/85 px-4 py-3 pr-16 text-ink placeholder:text-ink-muted/55 focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-cool-strong)]/75 hover:text-[color:var(--accent-cool-strong)]"
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted/80">
                      {PASSWORD_REQUIREMENTS_SUMMARY}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="newPasswordConfirm" className="block text-sm font-medium text-ink">
                      Confirm New Password
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="newPasswordConfirm"
                        type={showNewPasswordConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={newPasswordConfirm}
                        onChange={(event) => {
                          setNewPasswordConfirm(event.target.value);
                          setError('');
                        }}
                        className="w-full rounded-xl border border-line bg-white/85 px-4 py-3 pr-16 text-ink placeholder:text-ink-muted/55 focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                        placeholder="Re-enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordConfirm((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-cool-strong)]/75 hover:text-[color:var(--accent-cool-strong)]"
                      >
                        {showNewPasswordConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Updating...' : 'Change Password'}
                    </button>
                    <Link
                      href="/profile"
                      className="inline-flex items-center justify-center rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white"
                    >
                      Back to Profile
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
