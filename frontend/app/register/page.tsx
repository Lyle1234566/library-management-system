'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, IdentifierAvailabilityResult, RegisterRole } from '@/lib/auth';
import { getPasswordRequirements, getPasswordValidationMessage, isValidPassword } from '@/lib/passwordRules';

type RegisterFormData = {
  studentId: string;
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

type RegisterFormErrors = {
  studentId?: string;
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string;
};

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'blocked' | 'error';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function RegisterPageShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, register } = useAuth();

  const requestedRole: RegisterRole = searchParams?.get('role') === 'teacher' ? 'TEACHER' : 'STUDENT';
  const [registerRole, setRegisterRole] = useState<RegisterRole>(requestedRole);

  const [formData, setFormData] = useState<RegisterFormData>({
    studentId: '',
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const idLabel = registerRole === 'TEACHER' ? 'Faculty ID' : 'Student ID';
  const idPlaceholder = registerRole === 'TEACHER' ? 'Enter your faculty ID' : 'Enter your student ID';
  const passwordRequirements = getPasswordRequirements(formData.password);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    if (field === 'studentId') setAvailabilityState('idle');
  };

  const validateForm = () => {
    const nextErrors: RegisterFormErrors = {};

    if (!formData.studentId.trim()) {
      nextErrors.studentId = `${idLabel} is required.`;
    }
    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (!isValidPassword(formData.password)) {
      nextErrors.password = getPasswordValidationMessage();
    }
    if (!formData.passwordConfirm) {
      nextErrors.passwordConfirm = 'Confirm your password.';
    } else if (formData.password !== formData.passwordConfirm) {
      nextErrors.passwordConfirm = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || authLoading || !validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const result = await register({
      role: registerRole,
      ...(registerRole === 'TEACHER'
        ? { staff_id: formData.studentId.trim() }
        : { student_id: formData.studentId.trim() }),
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      password_confirm: formData.passwordConfirm,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ general: result.error || 'Registration failed. Please try again.' });
      return;
    }

    if (result.data?.requires_otp) {
      const params = new URLSearchParams({
        otp_session: result.data.otp_session,
        email: result.data.email,
        full_name: result.data.full_name,
        account_role: result.data.role,
        flow: 'registration',
        otp_sent: '1',
      });
      if (result.data.student_id) params.set('student_id', result.data.student_id);
      if (result.data.staff_id) params.set('staff_id', result.data.staff_id);
      router.push(`/login-otp?${params.toString()}`);
      return;
    }

    router.push('/login?registered=true');
  };

  if (authLoading) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center text-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4af37] border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink">
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-[-7rem] h-80 w-80 rounded-full bg-sky-300/26 blur-3xl animate-float" />
        <div className="absolute bottom-[-4rem] right-[-2rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/18 blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1380px] items-center px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,560px)] xl:gap-8">
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

            <div className="public-panel relative overflow-hidden rounded-[38px] p-6 backdrop-blur-xl sm:p-8 xl:p-10">
              <div className="relative space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink">
                  Member Onboarding
                </span>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.93] tracking-tight text-ink sm:text-6xl lg:text-[4.15rem] xl:text-[5rem]">
                    Join the
                    <span className="block" style={{ color: '#d4af37' }}>Salazar Library System.</span>
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
                    Choose whether you are registering as a student or teacher, then verify your email and wait for staff approval before your first sign in.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-ink-muted">
              Already Approved?{' '}
              <Link href="/login" className="font-semibold text-[#1a1b1f] hover:text-[#00447C]">
                Go to Sign in
              </Link>
            </div>
          </div>

          <div className="animate-fade-up delay-200">
            <div className="relative">
              <div className="absolute inset-x-10 top-4 h-28 rounded-full bg-sky-300/26 blur-3xl" />
              <div className="public-panel relative overflow-hidden rounded-[30px] p-[1px] shadow-card">
                <div className="rounded-[29px] bg-white/95 p-4 backdrop-blur-2xl sm:p-5 lg:p-6">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Registration desk
                    </span>
                    <h2 className="text-[1.7rem] font-semibold text-ink sm:text-[1.9rem]">
                      Complete your account setup
                    </h2>
                    <p className="max-w-md text-xs leading-5 text-ink-muted sm:text-sm">
                      Pick your account type first, then enter the correct school ID for registration.
                    </p>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-sky-200/60 bg-white/80 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Account type
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setRegisterRole('STUDENT')}
                        className={`rounded-[16px] border px-4 py-2.5 text-sm font-semibold transition ${
                          registerRole === 'STUDENT'
                            ? 'border-[#00447C] bg-[#00447C] text-white shadow-lg'
                            : 'border-line bg-white text-ink hover:border-[#00447C]/50'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterRole('TEACHER')}
                        className={`rounded-[16px] border px-4 py-2.5 text-sm font-semibold transition ${
                          registerRole === 'TEACHER'
                            ? 'border-[#00447C] bg-[#00447C] text-white shadow-lg'
                            : 'border-line bg-white text-ink hover:border-[#00447C]/50'
                        }`}
                      >
                        Teacher
                      </button>
                    </div>
                  </div>

                  <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
                    {errors.general && (
                      <div className="rounded-[20px] border border-red-300/40 bg-red-100 px-3.5 py-2.5 text-xs text-red-700">
                        {errors.general}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="studentId" className="text-[13px] font-medium text-ink">
                        {idLabel}
                      </label>
                      <input
                        id="studentId"
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => updateField('studentId', e.target.value)}
                        className={`w-full rounded-[20px] border bg-white py-3 px-4 text-[15px] text-ink shadow-inner transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                          errors.studentId ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                        }`}
                        placeholder={idPlaceholder}
                      />
                      {errors.studentId && <p className="text-xs text-red-600">{errors.studentId}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className="text-[13px] font-medium text-ink">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className={`w-full rounded-[20px] border bg-white py-3 px-4 text-[15px] text-ink shadow-inner transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                          errors.fullName ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-[13px] font-medium text-ink">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={`w-full rounded-[20px] border bg-white py-3 px-4 text-[15px] text-ink shadow-inner transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                          errors.email ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                        }`}
                        placeholder="name@example.com"
                      />
                      {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="password" className="text-[13px] font-medium text-ink">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className={`w-full rounded-[20px] border bg-white py-3 px-4 pr-16 text-[15px] text-ink shadow-inner transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                            errors.password ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                    </div>

                    <div className="rounded-[22px] border border-sky-200/60 bg-white/80 px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Password must have
                      </p>
                      <div className="mt-3 space-y-2">
                        {passwordRequirements.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 text-sm ${
                              item.met ? 'text-emerald-700' : 'text-ink-muted'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                item.met
                                  ? 'border-emerald-400/60 bg-emerald-100 text-emerald-700'
                                  : 'border-line bg-white text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="passwordConfirm" className="text-[13px] font-medium text-ink">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="passwordConfirm"
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={formData.passwordConfirm}
                          onChange={(e) => updateField('passwordConfirm', e.target.value)}
                          className={`w-full rounded-[20px] border bg-white py-3 px-4 pr-16 text-[15px] text-ink shadow-inner transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                            errors.passwordConfirm ? 'border-red-400/60' : 'border-line hover:border-sky-400/35'
                          }`}
                          placeholder="Repeat your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
                        >
                          {showPasswordConfirm ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.passwordConfirm && <p className="text-xs text-red-600">{errors.passwordConfirm}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] py-3 text-sm font-semibold text-[#1a1b1f] shadow-lg shadow-amber-500/30 transition-all hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)] focus:outline-none focus:ring-2 focus:ring-amber-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10">
                        {isSubmitting ? 'Creating account...' : 'Create my account'}
                      </span>
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>

                    <div className="relative text-center text-xs text-ink-muted">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-line" />
                      </div>
                      <span className="relative bg-white px-3">or</span>
                    </div>

                    <Link
                      href="/login"
                      className="block w-full rounded-[20px] border border-line bg-white/65 py-3 text-center text-xs font-semibold text-ink transition-colors hover:border-sky-400/50 hover:bg-white"
                    >
                      Back to Sign In
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="public-shell flex min-h-screen items-center justify-center text-ink">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4af37] border-r-transparent" />
        </div>
      }
    >
      <RegisterPageShell />
    </Suspense>
  );
}
