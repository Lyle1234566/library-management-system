'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { tokenStorage } from '@/lib/auth';
import { resolveSignedInRedirect } from '@/lib/roles';

type LoginErrors = {
  studentId?: string;
  password?: string;
  general?: string;
};



function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState(() => ({
    studentId: '',
    password: '',
    rememberMe: tokenStorage.getRememberMe(),
  }));
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams?.get('redirect');
    if (!redirect) {
      return null;
    }
    const decoded = decodeURIComponent(redirect);
    return decoded.startsWith('/') ? decoded : null;
  }, [searchParams]);
  const postLoginRedirect = useMemo(
    () => resolveSignedInRedirect(user, redirectTo),
    [redirectTo, user]
  );
  const idLabel = 'Account ID';
  const idPlaceholder = 'Enter your student, faculty, or staff ID';

  const registered = searchParams?.get('registered') === 'true';
  const awaitingApproval = searchParams?.get('awaiting_approval') === '1';
  const emailVerified = searchParams?.get('email_verified') === '1';
  const registerHref = '/register';

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(postLoginRedirect);
    }
  }, [authLoading, isAuthenticated, postLoginRedirect, router, user]);

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!formData.studentId.trim()) {
      nextErrors.studentId = `${idLabel} is required`;
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof LoginErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    tokenStorage.setRememberMe(formData.rememberMe);
    const result = await login({
      student_id: formData.studentId.trim(),
      password: formData.password,
    });

    setIsSubmitting(false);

    if (result.success) {
      return;
    }

    if (result.data?.requires_otp) {
      const params = new URLSearchParams({
        otp_session: result.data.otp_session,
        email: result.data.email,
        full_name: result.data.full_name,
        account_role: result.data.role,
        flow: 'login',
        auto_send: '1',
      });
      if (result.data.student_id) {
        params.set('student_id', result.data.student_id);
      }
      if (result.data.staff_id) {
        params.set('staff_id', result.data.staff_id);
      }
      router.push(`/login-otp?${params.toString()}`);
      return;
    }

    setErrors({ general: result.error || 'Login failed. Please try again.' });
  };

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink">
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-[-7rem] h-80 w-80 rounded-full bg-sky-300/26 blur-3xl animate-float" />
        <div className="absolute bottom-[-4rem] right-[-2rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/18 blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1380px] items-center px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,580px)] xl:gap-8">
          <div className="space-y-6 lg:pr-4 animate-fade-up">
            <Link href="/" className="inline-flex items-center gap-3 text-ink">
              <Image
                src="/logo-lib-transparent.png"
                alt="Salazar Library System logo"
                width={72}
                height={72}
                priority
                className="h-14 w-14 object-contain drop-shadow-[0_12px_20px_rgba(2,8,23,0.45)] sm:h-16 sm:w-16"
              />
              <span className="text-xl font-semibold tracking-tight">Salazar Library System</span>
            </Link>

            <div className="public-panel relative overflow-hidden rounded-[34px] p-6 backdrop-blur-xl sm:p-8 xl:p-10">
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink">
                    Member Access Portal
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Secure session
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem] xl:text-[5.1rem]">
                    Borrow Smarter.
                    <span className="block font-extrabold italic bg-gradient-to-r from-[#00447C] to-[#3b82f6] bg-clip-text text-transparent">Read with less Friction.</span>
                  </h1>
                  <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
                    Sign in once with your approved library account. The platform detects your role, protects your
                    access flow, and sends you directly to the right workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-ink-muted">
              New here?{' '}
              <Link href={registerHref} className="font-semibold text-[#d4af37] hover:text-[#c19b2e]">
                Create an account
              </Link>
            </div>
          </div>

          <div className="animate-fade-up delay-200">
            <div className="relative">
              <div className="absolute inset-x-10 top-4 h-28 rounded-full bg-sky-300/26 blur-3xl" />
              <div className="public-panel relative overflow-hidden rounded-[34px] p-[1px] shadow-card">
                <div className="rounded-[33px] bg-white/95 p-5 backdrop-blur-2xl sm:p-7 lg:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Secure sign in
                      </span>
                      <div>
                        <h2 className="text-3xl font-semibold text-ink">Welcome back</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
                          Use your student, faculty, or staff ID to continue. After sign in, the system routes you to
                          the correct library workspace.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-300/40 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                      OTP ready for first-time access
                    </div>
                  </div>

                  <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    {emailVerified && awaitingApproval ? (
                      <div className="rounded-[22px] border border-emerald-300/40 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                        Email verified. Wait for staff approval before signing in.
                      </div>
                    ) : registered ? (
                      <div className="rounded-[22px] border border-emerald-300/40 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                        Registration started. Check your email for the OTP step to finish creating the account.
                      </div>
                    ) : null}

                    {errors.general && (
                      <div className="rounded-[22px] border border-red-300/40 bg-red-100 px-4 py-3 text-sm text-red-700">
                        {errors.general}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="studentId" className="text-sm font-medium text-ink">
                        {idLabel}
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-muted">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        </div>
                        <input
                          id="studentId"
                          name="studentId"
                          type="text"
                          autoComplete="username"
                          value={formData.studentId}
                          onChange={handleChange}
                          className={`w-full rounded-[22px] border bg-white py-3.5 pl-12 pr-4 text-ink shadow-inner transition-all focus:border-sky-400/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                            errors.studentId ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                          }`}
                          placeholder={idPlaceholder}
                        />
                      </div>
                      {errors.studentId && <p className="text-xs text-red-600">{errors.studentId}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-ink">
                        Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-muted">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 11c.828 0 1.5-.672 1.5-1.5S12.828 8 12 8s-1.5.672-1.5 1.5S11.172 11 12 11zm6 0a6 6 0 10-12 0v4a2 2 0 002 2h8a2 2 0 002-2v-4z" />
                          </svg>
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full rounded-[22px] border bg-white py-3.5 pl-12 pr-12 text-ink shadow-inner transition-all focus:border-sky-400/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                            errors.password ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between text-sm text-ink-muted">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-line bg-white text-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/60"
                        />
                        Remember me
                      </label>
                      <Link href="/forgot-password" className="text-[#d4af37] hover:text-[#c19b2e]">
                        Forgot password?
                      </Link>
                    </div>

                    <div className="rounded-[22px] border border-sky-200/60 bg-white/80 px-4 py-3 text-xs leading-5 text-ink-muted">
                      Role detection is automatic. Students and teachers go to My Books, while working desk and
                      librarian accounts go to their desk pages.
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] py-3.5 text-base font-semibold text-[#1a1b1f] shadow-lg shadow-amber-500/30 transition-all hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)] focus:outline-none focus:ring-2 focus:ring-amber-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSubmitting ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          'Sign in'
                        )}
                      </span>
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>

                    <div className="relative text-center text-xs text-ink-muted">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-line"></div>
                      </div>
                      <span className="relative bg-white px-3">or</span>
                    </div>

                    <Link
                      href={registerHref}
                      className="block w-full rounded-[22px] border border-line bg-white/65 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-sky-400/50 hover:bg-white"
                    >
                      Create an account
                    </Link>
                  </form>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-ink-muted">
              <Link href="/" className="inline-flex items-center gap-2 hover:text-ink">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="public-shell flex min-h-screen items-center justify-center text-ink">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4af37] border-r-transparent" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
