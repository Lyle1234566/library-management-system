'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { PASSWORD_REQUIREMENTS_SUMMARY, getPasswordValidationMessage, isValidPassword } from '@/lib/passwordRules';

type ResetPhase = 'request' | 'confirm' | 'done';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedEmail = searchParams?.get('email')?.trim().toLowerCase() ?? '';
  const linkedCode = searchParams?.get('code')?.trim() ?? '';
  const linkedSource = searchParams?.get('source');
  const hasResetLink = Boolean(linkedEmail && linkedCode && linkedSource === 'email');

  const [phase, setPhase] = useState<ResetPhase>(hasResetLink ? 'confirm' : 'request');
  const [email, setEmail] = useState(linkedEmail);
  const [code, setCode] = useState(linkedCode);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [codeLength, setCodeLength] = useState(6);
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(15);
  const [debugCode, setDebugCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(hasResetLink);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState('');
  const attemptedLinkVerification = useRef(false);

  const headerDescription = useMemo(() => {
    if (phase === 'done') {
      return 'Your password has been reset successfully.';
    }
    if (phase === 'confirm') {
      if (isCodeVerified) {
        return 'Choose a new password for your account.';
      }
      return 'Enter the reset code and choose a new password.';
    }
    return 'Enter your email address and we\'ll send you a reset code.';
  }, [isCodeVerified, phase]);

  useEffect(() => {
    if (!hasResetLink || attemptedLinkVerification.current) {
      return;
    }

    attemptedLinkVerification.current = true;

    void (async () => {
      const result = await authApi.verifyPasswordResetCode({
        email,
        code,
      });

      setIsAutoVerifying(false);
      if (result.error) {
        setIsCodeVerified(false);
        setError(result.error);
        return;
      }

      setIsCodeVerified(true);
      setMessage(result.message || 'Reset link verified. You can now choose a new password.');
    })();
  }, [code, email, hasResetLink]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await authApi.requestPasswordReset(email);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setShowNewPassword(false);
    setShowNewPasswordConfirm(false);
    setIsCodeVerified(false);
    setCodeLength(result.codeLength ?? 6);
    setExpiresInMinutes(result.expiresInMinutes ?? null);
    setDebugCode(result.debugCode ?? '');
    setMessage(result.message);
    setPhase('confirm');
  };

  const handleResendCode = async () => {
    if (!email || !isValidEmail(email) || isLoading || isResendingCode) {
      return;
    }

    setIsResendingCode(true);
    setError('');

    const result = await authApi.requestPasswordReset(email);

    setIsResendingCode(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCode('');
    setIsCodeVerified(false);
    setCodeLength(result.codeLength ?? codeLength);
    setExpiresInMinutes(result.expiresInMinutes ?? expiresInMinutes);
    setDebugCode(result.debugCode ?? '');
    setMessage(result.message || 'A new reset code has been sent.');
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = code.trim();

    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!normalizedCode) {
      setError('Please enter the reset code');
      return;
    }
    if (normalizedCode.length !== codeLength) {
      setError(`Please enter the ${codeLength}-digit reset code`);
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError(getPasswordValidationMessage());
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await authApi.confirmPasswordReset({
      email,
      code: normalizedCode,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message);
    setDebugCode('');
    setPhase('done');
    router.replace('/forgot-password');
  };

  return (
    <div className="public-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-ink sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-7rem] h-80 w-80 rounded-full bg-sky-300/24 blur-3xl animate-float" />
        <div className="absolute bottom-[-4rem] right-[-2rem] h-[26rem] w-[26rem] rounded-full bg-amber-300/16 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.52),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(220,236,255,0.14))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2398bfe6' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[34rem] space-y-7">
        <div className="text-center">
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-cool-strong)]/80">
              Account Recovery
            </span>
          </div>
          <Link href="/" className="inline-flex items-center gap-3 text-ink">
            <svg
              className="h-10 w-10 text-[color:var(--accent-cool-strong)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-[1.65rem] font-semibold tracking-tight text-ink">SCSIT Digital Library</span>
          </Link>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-[2.8rem]">Reset your password</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-ink-muted sm:text-[1.05rem]">{headerDescription}</p>
        </div>

        <div className="public-panel relative overflow-hidden rounded-[34px] p-[1px] shadow-card">
          <div className="pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full bg-sky-300/24 blur-3xl" />
          <div className="relative rounded-[33px] bg-white/95 p-5 backdrop-blur-2xl sm:p-8">
          {phase === 'done' ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink">Password Reset Complete</h3>
              <p className="mb-6 text-ink-muted">{message || 'You can now sign in with your new password.'}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent-strong)]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : phase === 'confirm' ? (
            <form className="space-y-6" onSubmit={handleConfirmSubmit}>
              {message && (
                <div className="rounded-lg border border-emerald-300/40 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}
              {!!debugCode && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">Development fallback code</p>
                  <p className="mt-1 tracking-[0.22em] text-base">{debugCode}</p>
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {isAutoVerifying && (
                <div className="rounded-lg border border-sky-300/40 bg-sky-100 px-4 py-3 text-sm text-sky-700">
                  Verifying your reset link...
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-line bg-white/70 px-4 py-3 text-ink-muted placeholder:text-ink-muted/50 focus:outline-none transition-all"
                  placeholder="Email used for request"
                />
                <p className="mt-2 text-xs text-ink-muted/75">
                  Reset code was sent to this email.
                </p>
              </div>

              {!isCodeVerified && (
                <div>
                  <label htmlFor="code" className="mb-2 block text-sm font-medium text-ink">
                    Reset Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={codeLength}
                    value={code}
                    onChange={(e) => {
                      const sanitizedCode = e.target.value.replace(/\D/g, '').slice(0, codeLength);
                      setCode(sanitizedCode);
                      setError('');
                    }}
                    className="w-full rounded-lg border border-line bg-white/85 px-4 py-3 tracking-[0.3em] text-ink placeholder:text-ink-muted/55 transition-all focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                    placeholder={`Enter ${codeLength}-digit code`}
                  />
                  {expiresInMinutes && (
                    <p className="mt-2 text-xs text-ink-muted/75">
                      Code expires in {expiresInMinutes} minute{expiresInMinutes === 1 ? '' : 's'}.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-ink">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full rounded-lg border border-line bg-white/85 px-4 py-3 pr-16 text-ink placeholder:text-ink-muted/55 transition-all focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                    placeholder="Enter a new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-cool-strong)]/75 hover:text-[color:var(--accent-cool-strong)]"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-muted/75">{PASSWORD_REQUIREMENTS_SUMMARY}</p>
              </div>

              <div>
                <label htmlFor="newPasswordConfirm" className="mb-2 block text-sm font-medium text-ink">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="newPasswordConfirm"
                    name="newPasswordConfirm"
                    type={showNewPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPasswordConfirm}
                    onChange={(e) => {
                      setNewPasswordConfirm(e.target.value);
                      setError('');
                    }}
                    className="w-full rounded-lg border border-line bg-white/85 px-4 py-3 pr-16 text-ink placeholder:text-ink-muted/55 transition-all focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                    placeholder="Re-enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-cool-strong)]/75 hover:text-[color:var(--accent-cool-strong)]"
                    aria-label={showNewPasswordConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showNewPasswordConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isAutoVerifying}
                className="flex w-full items-center justify-center rounded-lg border border-transparent bg-[color:var(--accent)] px-4 py-3 text-base font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[color:var(--accent-strong)]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              {!isCodeVerified && (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading || isResendingCode}
                  className="w-full text-sm text-[color:var(--accent-cool-strong)] hover:text-[color:var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendingCode ? 'Resending code...' : 'Resend code'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPhase('request');
                  setCode('');
                  setNewPassword('');
                  setNewPasswordConfirm('');
                  setShowNewPassword(false);
                  setShowNewPasswordConfirm(false);
                  setCodeLength(6);
                  setExpiresInMinutes(15);
                  setDebugCode('');
                  setIsCodeVerified(false);
                  setMessage('');
                  setError('');
                  attemptedLinkVerification.current = false;
                  router.replace('/forgot-password');
                }}
                className="w-full text-sm text-[color:var(--accent-cool-strong)] hover:text-[color:var(--accent)] transition-colors"
              >
                Start over
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleRequestSubmit}>
              {error && (
                <div className="rounded-lg border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full rounded-lg border border-line bg-white/85 px-4 py-3 text-ink placeholder:text-ink-muted/55 transition-all focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
                  placeholder="Enter your email address"
                />
                <p className="mt-2 text-xs text-ink-muted/80">
                  Use the recovery email saved on your library account. If you can still sign in, update
                  it from{' '}
                  <Link href="/profile" className="font-semibold text-[color:var(--accent-cool-strong)] underline-offset-4 hover:underline">
                    Profile
                  </Link>
                  . Otherwise, contact library support to update your email first.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg border border-transparent bg-[color:var(--accent)] px-4 py-3 text-base font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[color:var(--accent-strong)]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center font-medium text-[color:var(--accent-cool-strong)] transition-colors hover:text-[color:var(--accent)]"
          >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>
        </div>

        {/* Back to Home */}
        <div className="text-center text-sm">
          <Link
            href="/"
            className="inline-flex items-center font-medium text-ink-muted transition-colors hover:text-[color:var(--accent-cool-strong)]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="public-shell flex min-h-screen items-center justify-center text-ink">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--accent)] border-r-transparent" />
        </div>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
