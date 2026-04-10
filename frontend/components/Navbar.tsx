'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi, resolveMediaUrl } from '@/lib/api';
import { subscribeToUnreadCountUpdated } from '@/lib/notificationEvents';
import { getUserRoleLabel, hasStaffDeskAccess, isWorkingStudent } from '@/lib/roles';

type NavbarProps = {
  variant?: 'light' | 'dark';
};

const navItems = [
  { label: 'Home', href: '/', requireAuth: false },
  { label: 'Browse Books', href: '/books', requireAuth: true },
  { label: 'Features', href: '/features', requireAuth: false },
  { label: 'About', href: '/about', requireAuth: false },
  { label: 'Contact', href: '/contact', requireAuth: false },
] as const;

export default function Navbar({ variant = 'light' }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const isDark = variant === 'dark';
  const showLibrarianDesk = !!user && ['LIBRARIAN', 'ADMIN'].includes(user.role);
  const showStaffDesk = hasStaffDeskAccess(user);
  const staffDeskLabel = isWorkingStudent(user) ? 'Working Student Desk' : 'Staff Desk';
  const roleLabel = getUserRoleLabel(user);
  const displayId = user?.staff_id || user?.student_id || '-';
  const displayIdLabel = user?.staff_id
    ? user?.role === 'LIBRARIAN' || user?.role === 'TEACHER'
      ? 'Faculty ID'
      : 'Staff ID'
    : 'Student ID';

  const isNavItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getNavLinkClasses = (href: string, mobile = false) => {
    const isActive = isNavItemActive(href);
    const baseClasses = mobile
      ? 'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium tracking-[0.01em] transition-all duration-300'
      : 'group relative inline-flex items-center rounded-full px-4.5 py-2.5 text-[0.92rem] font-medium tracking-[0.01em] transition-all duration-300';

    return `${baseClasses} ${
      isActive
        ? 'bg-[color:var(--header-active-bg)] text-[color:var(--header-text)] ring-1 ring-inset ring-white/15'
        : 'text-[color:var(--header-text-muted)] hover:bg-[color:var(--header-button-bg)] hover:text-[color:var(--header-text)]'
    }`;
  };

  const getNavIndicatorClasses = (href: string) => {
    const isActive = isNavItemActive(href);
    return isActive
      ? 'opacity-100 scale-100 bg-gradient-to-r from-transparent via-sky-200 to-transparent shadow-[0_0_20px_rgba(143,203,239,0.42)]'
      : 'opacity-0 scale-75 bg-gradient-to-r from-transparent via-sky-200/80 to-transparent group-hover:opacity-100 group-hover:scale-100';
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const closeMenusFrame = requestAnimationFrame(() => {
      setIsMenuOpen(false);
      setIsProfileOpen(false);
    });

    return () => cancelAnimationFrame(closeMenusFrame);
  }, [pathname]);

  useEffect(() => {
    let isActive = true;

    const loadUnreadCount = async () => {
      if (!isAuthenticated) {
        setUnreadCount(0);
        return;
      }

      const response = await notificationsApi.getUnreadCount();
      if (!isActive || response.error || !response.data) {
        return;
      }

      setUnreadCount(response.data.unread_count ?? 0);
    };

    void loadUnreadCount();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    return subscribeToUnreadCountUpdated((nextUnreadCount) => {
      setUnreadCount(nextUnreadCount);
    });
  }, []);

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNavLinkClick = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);

    if (pathname !== href) {
      return;
    }

    event.preventDefault();
    scrollToTop();
  };

  const avatarUrl = user?.avatar ? resolveMediaUrl(user.avatar) : null;
  const defaultAvatarUrl = '/student-avatar.svg';
  const dropdownPanelClasses =
    'border border-line bg-white shadow-lg';
  const dropdownBorderClasses = 'border-line';
  const dropdownPrimaryTextClasses = 'text-ink';
  const dropdownSecondaryTextClasses = 'text-ink-muted';
  const dropdownBadgeClasses = 'bg-sky-500/15 text-sky-700 border border-sky-300/30';
  const dropdownItemClasses =
    'flex items-center px-4 py-2 text-sm text-ink transition-colors hover:bg-sky-50';
  const dropdownSignOutClasses =
    'flex items-center w-full px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--header-border)] bg-[linear-gradient(180deg,var(--header-bg-start)_0%,var(--header-bg-end)_100%)] shadow-[var(--nav-shadow)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-100/45 to-transparent"
        />
        <div
          className={`absolute left-[12%] top-[-8rem] h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-sky-300/20' : 'bg-sky-300/18'}`}
        />
        <div
          className={`absolute right-[10%] top-[-9rem] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-blue-200/16' : 'bg-blue-200/14'}`}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-w-0 items-center justify-between gap-3 py-3 sm:h-[4.7rem] sm:py-0">
          {/* Logo */}
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-soft sm:h-14 sm:w-14"
            >
              <Image
                src="/logo%20lib.png"
                alt="SCSIT Digital Library logo"
                fill
                sizes="(min-width: 640px) 56px, 48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-[0.98rem] font-semibold tracking-tight text-[color:var(--header-text)] sm:text-[1.08rem]">
                Salazar Library System
              </span>
              <span className="hidden text-[0.62rem] font-medium uppercase tracking-[0.34em] text-[color:var(--header-text-muted)] sm:block">
                Library Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems
              .filter((item) => !item.requireAuth || isAuthenticated)
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={getNavLinkClasses(item.href)}
                aria-current={isNavItemActive(item.href) ? 'page' : undefined}
                onClick={(event) => handleNavLinkClick(event, item.href)}
              >
                <span>{item.label}</span>
                <span className={`pointer-events-none absolute inset-x-4 -bottom-px h-px rounded-full transition-all duration-300 ${getNavIndicatorClasses(item.href)}`} />
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/12"></div>
            ) : isAuthenticated && user ? (
              /* Authenticated User - Profile Dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative flex items-center space-x-2 rounded-full border border-white/12 bg-white/10 px-2 py-1.5 transition-all hover:bg-white/14 focus:outline-none"
                >
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-[#10203a] shadow-[0_10px_24px_rgba(251,191,36,0.35)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/12 font-semibold text-[color:var(--header-text)] shadow-soft">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={user.full_name} className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={defaultAvatarUrl}
                        alt={user.full_name ? `${user.full_name} profile` : 'Student profile'}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 text-[color:var(--header-text-muted)] transition-transform ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-[1.6rem] py-2 z-50 ${dropdownPanelClasses}`}>
                    {/* User Info */}
                    <div className={`px-4 py-3 border-b ${dropdownBorderClasses}`}>
                      <p className={`text-sm font-semibold truncate ${dropdownPrimaryTextClasses}`}>
                        {user.full_name}
                      </p>
                      <p className={`text-sm truncate ${dropdownSecondaryTextClasses}`}>
                        {displayIdLabel}: {displayId}
                      </p>
                      <span className={`inline-block mt-2 rounded-full px-2.5 py-1 text-xs font-semibold ${dropdownBadgeClasses}`}>
                        {roleLabel}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className={dropdownItemClasses}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        href="/notifications"
                        className={dropdownItemClasses}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-[#10203a]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                      {showLibrarianDesk && (
                        <Link
                          href="/librarian"
                          className={dropdownItemClasses}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 0a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Librarian Desk
                        </Link>
                      )}
                      {showStaffDesk && (
                        <Link
                          href="/staff"
                          className={dropdownItemClasses}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z" />
                          </svg>
                          {staffDeskLabel}
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className={`border-t py-1 ${dropdownBorderClasses}`}>
                      <button
                        onClick={handleLogout}
                        className={dropdownSignOutClasses}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not Authenticated - Show Login and Create Account */
              !isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--header-text-muted)] transition-all hover:bg-white/10 hover:text-[color:var(--header-text)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] text-[#1a1b1f] px-4 py-2 rounded-full hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)] transition-colors font-semibold shadow-soft"
                  >
                    Get Started
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-full border border-white/12 bg-white/10 p-2.5 text-[color:var(--header-text-muted)] transition-all hover:bg-white/14 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-white/12 py-4 md:hidden">
            <div
              className="rounded-[1.75rem] border border-white/12 bg-white/[0.08] p-3 shadow-[0_22px_50px_rgba(21,33,94,0.3)]"
            >
              <div className="flex flex-col gap-2">
                {navItems
                  .filter((item) => !item.requireAuth || isAuthenticated)
                  .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={getNavLinkClasses(item.href, true)}
                    aria-current={isNavItemActive(item.href) ? 'page' : undefined}
                    onClick={(event) => handleNavLinkClick(event, item.href)}
                  >
                    <span>{item.label}</span>
                    <span className={`text-xs font-semibold uppercase tracking-[0.24em] ${isNavItemActive(item.href) ? 'text-sky-100/85' : 'text-[color:var(--header-text-muted)]'}`}>
                      {String(navItems.findIndex((nav) => nav.href === item.href) + 1).padStart(2, '0')}
                    </span>
                  </Link>
                ))}

                {/* Mobile Auth Section */}
                <div className="mt-4 border-t border-white/12 pt-4">
                  {isAuthenticated && user ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex min-w-0 items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/12 font-semibold text-[color:var(--header-text)] shadow-soft">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={user.full_name} className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={defaultAvatarUrl}
                              alt={user.full_name ? `${user.full_name} profile` : 'Student profile'}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--header-text)]">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-[color:var(--header-text-muted)]">
                            {displayIdLabel}: {displayId}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block text-[color:var(--header-text-muted)] transition-colors hover:text-[color:var(--header-text)]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/notifications"
                        className="block text-[color:var(--header-text-muted)] transition-colors hover:text-[color:var(--header-text)]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Notifications {unreadCount > 0 ? `(${unreadCount > 9 ? '9+' : unreadCount})` : ''}
                      </Link>
                      {showLibrarianDesk && (
                        <Link
                          href="/librarian"
                          className="block text-[color:var(--header-text-muted)] transition-colors hover:text-[color:var(--header-text)]"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Librarian Desk
                        </Link>
                      )}
                      {showStaffDesk && (
                        <Link
                          href="/staff"
                          className="block text-[color:var(--header-text-muted)] transition-colors hover:text-[color:var(--header-text)]"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {staffDeskLabel}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    /* Not Authenticated - Show Login and Create Account */
                    !isAuthenticated && (
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/login"
                          className="rounded-full border border-white/12 px-4 py-3 text-center text-sm font-medium text-[color:var(--header-text-muted)] transition-all hover:bg-white/10 hover:text-[color:var(--header-text)]"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="bg-[linear-gradient(135deg,#d4af37_0%,#f4d03f_100%)] text-[#1a1b1f] px-4 py-3 rounded-full hover:bg-[linear-gradient(135deg,#c19b2e_0%,#d4af37_100%)] transition-colors font-semibold text-center shadow-soft"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Get Started
                        </Link>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
