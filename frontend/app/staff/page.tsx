'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BadgeCheck,
  BellRing,
  BookCopy,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleLabel, isWorkingStudent } from '@/lib/roles';
import {
  booksApi,
  BorrowRequest,
  Notification as NotificationRecord,
  RenewalRequest,
  ReturnRequest,
  getRenewalRequests,
  getReturnRequests,
  notificationsApi,
  approveBorrowRequest,
  approveRenewalRequest,
  rejectBorrowRequest,
  rejectRenewalRequest,
  approveReturnRequest,
  rejectReturnRequest,
  authApi,
  User as AuthUser,
  API_BASE_URL,
} from '@/lib/api';

type SectionState = 'idle' | 'loading' | 'error';

type DeskPanelProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  titleIcon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type RefreshButtonProps = {
  onClick: () => void | Promise<void>;
};

type LoadingStateProps = {
  text: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
};

type DecisionButtonsProps = {
  busy: boolean;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
};

const panelClassName =
  'rounded-lg border border-slate-200 bg-white shadow-sm';

const requestCardClassName =
  'rounded-lg border border-slate-200 bg-white p-5 shadow-sm';

const sectionCountPillClassName =
  'rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';

const statusPill: Record<BorrowRequest['status'], string> = {
  PENDING: 'border border-sky-300/40 bg-sky-100/90 text-[color:var(--accent-cool-strong)]',
  APPROVED: 'border border-emerald-300/40 bg-emerald-100 text-emerald-700',
  REJECTED: 'border border-rose-300/40 bg-rose-50 text-rose-700',
  RETURNED: 'border border-slate-200 bg-slate-100 text-slate-600',
};

const returnStatusPill: Record<ReturnRequest['status'], string> = {
  PENDING: 'border border-sky-300/40 bg-sky-100/90 text-[color:var(--accent-cool-strong)]',
  APPROVED: 'border border-emerald-300/40 bg-emerald-100 text-emerald-700',
  REJECTED: 'border border-rose-300/40 bg-rose-50 text-rose-700',
};

const renewalStatusPill: Record<RenewalRequest['status'], string> = {
  PENDING: 'border border-sky-300/40 bg-sky-100/90 text-[color:var(--accent-cool-strong)]',
  APPROVED: 'border border-emerald-300/40 bg-emerald-100 text-emerald-700',
  REJECTED: 'border border-rose-300/40 bg-rose-50 text-rose-700',
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Unknown';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00`
    : dateString;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

function DeskPanel({
  id,
  eyebrow,
  title,
  description,
  titleIcon,
  action,
  children,
  className = 'p-5 sm:p-6',
}: DeskPanelProps) {
  return (
    <section id={id} className={`${panelClassName} ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cool-strong)]/65">{eyebrow}</p>
          <div className="mt-1.5 flex items-center gap-2.5">
            {titleIcon}
            <h2 className="text-lg font-semibold text-slate-900 sm:text-[1.2rem]">{title}</h2>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RefreshButton({ onClick }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}

function LoadingState({ text }: LoadingStateProps) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-[color:var(--accent-cool-strong)]">
      <Loader2 className="h-5 w-5 animate-spin text-[color:var(--accent-cool-strong)]" />
      {text}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-lg border border-rose-300/40 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {message}
    </div>
  );
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-9 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[color:var(--accent-cool-strong)] shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function DecisionButtons({ busy, onApprove, onReject }: DecisionButtonsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onApprove}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Working...' : 'Approve'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onReject}
        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Working...' : 'Reject'}
      </button>
    </div>
  );
}

async function parseResponseData<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function StaffDeskPage() {
  const { user } = useAuth();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [approvedBorrowRequests, setApprovedBorrowRequests] = useState<BorrowRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<AuthUser[]>([]);
  const [workingStudentApprovals, setWorkingStudentApprovals] = useState<Record<number, boolean>>({});

  const [borrowsState, setBorrowsState] = useState<SectionState>('idle');
  const [overdueState, setOverdueState] = useState<SectionState>('idle');
  const [returnsState, setReturnsState] = useState<SectionState>('idle');
  const [renewalsState, setRenewalsState] = useState<SectionState>('idle');
  const [notificationsState, setNotificationsState] = useState<SectionState>('idle');
  const [accountsState, setAccountsState] = useState<SectionState>('idle');

  const [borrowsError, setBorrowsError] = useState<string | null>(null);
  const [overdueError, setOverdueError] = useState<string | null>(null);
  const [returnsError, setReturnsError] = useState<string | null>(null);
  const [renewalsError, setRenewalsError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [activeDeskSection, setActiveDeskSection] = useState('staff-overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [returnActionBusy, setReturnActionBusy] = useState<number | null>(null);
  const [renewalActionBusy, setRenewalActionBusy] = useState<number | null>(null);
  const [notificationActionBusy, setNotificationActionBusy] = useState(false);
  const [accountActionBusy, setAccountActionBusy] = useState<number | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const isWorkingStudentDesk = isWorkingStudent(user);
  const roleLabel = getUserRoleLabel(user);
  const staffLabel = isWorkingStudentDesk ? 'Working Student Desk' : 'Staff Desk';
  const staffSubtitle =
    isWorkingStudentDesk
      ? 'Assist the circulation desk, help students, and keep the library moving with a calm, polished flow.'
      : 'Coordinate the front desk, process requests quickly, and keep every circulation lane in sync.';

  const overdueRequests = useMemo(
    () =>
      approvedBorrowRequests
        .filter((request) => (request.overdue_days ?? 0) > 0)
        .sort((a, b) => (b.overdue_days ?? 0) - (a.overdue_days ?? 0)),
    [approvedBorrowRequests]
  );

  const totalQueue = borrowRequests.length + returnRequests.length + renewalRequests.length;
  const deskPulseLabel =
    totalQueue === 0 ? 'Desk clear' : totalQueue >= 8 ? 'High traffic' : totalQueue >= 4 ? 'Busy but stable' : 'Steady flow';

  const canApproveAccounts = isWorkingStudentDesk;

  const requestNavItems = useMemo(
    () => [
      ...(canApproveAccounts
        ? [
            {
              id: 'staff-pending-accounts',
              label: 'Pending Accounts',
              count: pendingAccounts.length,
              icon: User,
            },
          ]
        : []),
      {
        id: 'staff-borrow-requests',
        label: 'Borrow Requests',
        count: borrowRequests.length,
        icon: BookCopy,
      },
      {
        id: 'staff-renewal-requests',
        label: 'Renewal Requests',
        count: renewalRequests.length,
        icon: Clock3,
      },
      {
        id: 'staff-return-requests',
        label: 'Return Requests',
        count: returnRequests.length,
        icon: ArrowRightLeft,
      },
    ],
    [canApproveAccounts, pendingAccounts.length, borrowRequests.length, renewalRequests.length, returnRequests.length]
  );

  const sidebarGroups = useMemo(
    () => [
      {
        label: 'Overview',
        items: [
          {
            id: 'staff-overview',
            label: 'Desk Overview',
            icon: LayoutDashboard,
          },
          {
            id: 'staff-notifications',
            label: 'Notifications',
            icon: BellRing,
            count: notificationUnreadCount,
          },
          {
            id: 'staff-overdue-watch',
            label: 'Overdue Watch',
            icon: ShieldAlert,
            count: overdueRequests.length,
          },
        ],
      },
      {
        label: 'Queue Manager',
        items: requestNavItems,
      },
    ],
    [notificationUnreadCount, overdueRequests.length, requestNavItems]
  );

  const activeSectionLabel = useMemo(
    () =>
      sidebarGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === activeDeskSection)?.label ?? 'Desk Overview',
    [activeDeskSection, sidebarGroups]
  );

  const jumpToSection = (sectionId: string) => {
    setActiveDeskSection(sectionId);
    setIsSidebarOpen(false);
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const loadBorrowRequests = async () => {
    setBorrowsState('loading');
    const response = await booksApi.getBorrowRequests('PENDING');
    if (response.error || !response.data) {
      setBorrowsError(response.error ?? 'Unable to load borrow requests.');
      setBorrowRequests([]);
      setBorrowsState('error');
      return;
    }
    setBorrowsError(null);
    setBorrowRequests(response.data);
    setBorrowsState('idle');
  };

  const loadOverdueRequests = async () => {
    setOverdueState('loading');
    const response = await booksApi.getBorrowRequests('APPROVED');
    if (response.error || !response.data) {
      setOverdueError(response.error ?? 'Unable to load overdue books.');
      setApprovedBorrowRequests([]);
      setOverdueState('error');
      return;
    }
    setOverdueError(null);
    setApprovedBorrowRequests(response.data);
    setOverdueState('idle');
  };

  const loadReturnRequests = async () => {
    setReturnsState('loading');
    const response = typeof booksApi.getReturnRequests === 'function'
      ? await booksApi.getReturnRequests('PENDING')
      : await getReturnRequests('PENDING');
    if (response.error || !response.data) {
      setReturnsError(response.error ?? 'Unable to load return requests.');
      setReturnRequests([]);
      setReturnsState('error');
      return;
    }
    setReturnsError(null);
    setReturnRequests(response.data);
    setReturnsState('idle');
  };

  const loadRenewalRequests = async () => {
    setRenewalsState('loading');
    const response = typeof booksApi.getRenewalRequests === 'function'
      ? await booksApi.getRenewalRequests('PENDING')
      : await getRenewalRequests('PENDING');
    if (response.error || !response.data) {
      setRenewalsError(response.error ?? 'Unable to load renewal requests.');
      setRenewalRequests([]);
      setRenewalsState('error');
      return;
    }
    setRenewalsError(null);
    setRenewalRequests(response.data);
    setRenewalsState('idle');
  };

  const loadNotifications = async () => {
    setNotificationsState('loading');
    const response = await notificationsApi.getNotifications({ limit: 8 });
    if (response.error || !response.data) {
      setNotificationsError(response.error ?? 'Unable to load notifications.');
      setNotifications([]);
      setNotificationUnreadCount(0);
      setNotificationsState('error');
      return;
    }

    setNotifications(response.data.results);
    setNotificationUnreadCount(response.data.unread_count);
    setNotificationsError(null);
    setNotificationsState('idle');
  };

  const loadPendingAccounts = async () => {
    if (!canApproveAccounts) {
      setAccountsError(null);
      setPendingAccounts([]);
      setWorkingStudentApprovals({});
      setAccountsState('idle');
      return;
    }
    setAccountsState('loading');
    const response = await authApi.getPendingStudents();
    if (response.error || !response.data) {
      setAccountsError(response.error ?? 'Unable to load pending accounts.');
      setPendingAccounts([]);
      setWorkingStudentApprovals({});
      setAccountsState('error');
      return;
    }
    setAccountsError(null);
    setPendingAccounts(response.data);
    setWorkingStudentApprovals(
      response.data.reduce<Record<number, boolean>>((acc, account) => {
        acc[account.id] = Boolean(account.is_working_student);
        return acc;
      }, {})
    );
    setAccountsState('idle');
  };

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      void loadBorrowRequests();
      void loadOverdueRequests();
      void loadReturnRequests();
      void loadRenewalRequests();
      void loadNotifications();
      if (canApproveAccounts) {
        void loadPendingAccounts();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, canApproveAccounts]);

  useEffect(() => {
    const orderedSectionIds = sidebarGroups.flatMap((group) => group.items.map((item) => item.id));

    const syncActiveSection = () => {
      let nextActiveSection = orderedSectionIds[0] ?? 'staff-overview';

      for (const sectionId of orderedSectionIds) {
        const sectionElement = document.getElementById(sectionId);
        if (!sectionElement) {
          continue;
        }

        if (sectionElement.getBoundingClientRect().top <= 180) {
          nextActiveSection = sectionId;
        } else {
          break;
        }
      }

      setActiveDeskSection((currentSection) =>
        currentSection === nextActiveSection ? currentSection : nextActiveSection
      );
    };

    syncActiveSection();
    window.addEventListener('scroll', syncActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', syncActiveSection);
    };
  }, [sidebarGroups]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  const handleBorrowDecision = async (requestId: number, approve: boolean) => {
    setActionBusy(requestId);
    const response =
      approve
        ? (typeof booksApi.approveBorrowRequest === 'function'
            ? await booksApi.approveBorrowRequest(requestId)
            : await approveBorrowRequest(requestId))
        : (typeof booksApi.rejectBorrowRequest === 'function'
            ? await booksApi.rejectBorrowRequest(requestId)
            : await rejectBorrowRequest(requestId));
    if (response.error || !response.data) {
      setBorrowsError(response.error ?? 'Unable to update borrow request.');
    } else {
      setBorrowRequests((prev) => prev.filter((request) => request.id !== requestId));
    }
    setActionBusy(null);
  };

  const handleReturnDecision = async (requestId: number, approve: boolean) => {
    setReturnActionBusy(requestId);
    const response =
      approve
        ? (typeof booksApi.approveReturnRequest === 'function'
            ? await booksApi.approveReturnRequest(requestId)
            : await approveReturnRequest(requestId))
        : (typeof booksApi.rejectReturnRequest === 'function'
            ? await booksApi.rejectReturnRequest(requestId)
            : await rejectReturnRequest(requestId));
    if (response.error || !response.data) {
      setReturnsError(response.error ?? 'Unable to update return request.');
    } else {
      setReturnRequests((prev) => prev.filter((request) => request.id !== requestId));
      void loadOverdueRequests();
    }
    setReturnActionBusy(null);
  };

  const handleRenewalDecision = async (requestId: number, approve: boolean) => {
    setRenewalActionBusy(requestId);
    const response =
      approve
        ? (typeof booksApi.approveRenewalRequest === 'function'
            ? await booksApi.approveRenewalRequest(requestId)
            : await approveRenewalRequest(requestId))
        : (typeof booksApi.rejectRenewalRequest === 'function'
            ? await booksApi.rejectRenewalRequest(requestId)
            : await rejectRenewalRequest(requestId));
    if (response.error || !response.data) {
      setRenewalsError(response.error ?? 'Unable to update renewal request.');
    } else {
      setRenewalRequests((prev) => prev.filter((request) => request.id !== requestId));
      void loadOverdueRequests();
    }
    setRenewalActionBusy(null);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (notificationActionBusy || notificationUnreadCount === 0) {
      return;
    }

    setNotificationActionBusy(true);
    const response = await notificationsApi.markAllAsRead();
    if (response.error || !response.data) {
      setNotificationsError(response.error ?? 'Unable to mark notifications as read.');
      setNotificationActionBusy(false);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
    setNotificationUnreadCount(response.data.unread_count ?? 0);
    setNotificationsError(null);
    setNotificationActionBusy(false);
  };

  const handleNotificationClick = async (notification: NotificationRecord) => {
    if (notification.is_read) {
      return;
    }

    const response = await notificationsApi.markAsRead(notification.id);
    if (response.error || !response.data) {
      setNotificationsError(response.error ?? 'Unable to update notification.');
      return;
    }

    setNotifications((prev) =>
      prev.map((currentNotification) =>
        currentNotification.id === notification.id
          ? { ...currentNotification, is_read: true }
          : currentNotification
      )
    );
    setNotificationUnreadCount(response.data.unread_count ?? 0);
    setNotificationsError(null);
  };

  const handleApproveAccount = async (accountId: number) => {
    setAccountActionBusy(accountId);
    const response = await authApi.approveStudent(accountId, {
      is_working_student: Boolean(workingStudentApprovals[accountId]),
    });
    if (response.error || !response.data) {
      setAccountsError(response.error ?? 'Unable to approve account.');
    } else {
      setPendingAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setWorkingStudentApprovals((prev) => {
        const next = { ...prev };
        delete next[accountId];
        return next;
      });
    }
    setAccountActionBusy(null);
  };

  const handleRejectAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to reject this account? This action cannot be undone.')) {
      return;
    }

    setAccountActionBusy(accountId);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reject-account/${accountId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await parseResponseData<{ message?: string; detail?: string }>(response);

      if (!response.ok) {
        setAccountsError(data?.detail ?? 'Unable to reject account.');
      } else {
        setPendingAccounts((prev) => prev.filter((account) => account.id !== accountId));
        setWorkingStudentApprovals((prev) => {
          const next = { ...prev };
          delete next[accountId];
          return next;
        });
      }
    } catch (error) {
      setAccountsError(
        error instanceof Error ? error.message : 'Unable to reject account.'
      );
    }
    setAccountActionBusy(null);
  };

  return (
    <ProtectedRoute requiredRoles={['WORKING', 'STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-[#edf1f7] text-slate-900">
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity md:hidden ${
            isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#16345e]/40 bg-[linear-gradient(180deg,#1f467d_0%,#234170_26%,#23395f_100%)] text-white shadow-[0_24px_40px_rgba(15,23,42,0.28)] transition-transform duration-300 md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10 shadow-sm">
                  <Image
                    src="/logo%20lib.png"
                    alt="Salazar Library System logo"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-white">
                    Salazar Library
                  </p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">
                    Management System
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
            {sidebarGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  {group.label}
                </p>
                <div className="mt-4 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeDeskSection === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => jumpToSection(item.id)}
                        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? 'bg-white/12 text-white shadow-sm'
                            : 'text-white/82 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                        {typeof item.count !== 'undefined' && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isActive
                                ? 'bg-[#f2b967] text-[#22375f]'
                                : item.count > 0
                                ? 'bg-white/14 text-white'
                                : 'bg-white/8 text-white/52'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="md:pl-72">
          <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Front Desk Workspace
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="font-medium">Admin</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className="font-medium">Queues</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className="truncate font-semibold text-slate-900">{activeSectionLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Open notifications"
                  onClick={() => jumpToSection('staff-notifications')}
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 ${
                    activeDeskSection === 'staff-notifications'
                      ? 'border-sky-300 bg-sky-50 text-sky-700'
                      : 'border-slate-200'
                  }`}
                >
                  <BellRing className="h-4.5 w-4.5" />
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                      {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                    </span>
                  )}
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-3 transition-all hover:opacity-80"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1f467d] to-[#2a5a9e] text-sm font-bold text-white shadow-sm">
                        {user?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">
                          {user?.full_name ?? 'Desk User'}
                        </p>
                        <p className="text-xs text-slate-500">{roleLabel}</p>
                      </div>
                      <ChevronDown
                        className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block ${
                          showProfileDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Premium Dropdown Menu */}
                    {showProfileDropdown && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowProfileDropdown(false)}
                        />
                        
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                          {/* Header Section */}
                          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Manage Account
                            </p>
                          </div>

                          {/* Navigation Items */}
                          <div className="py-1.5">
                            <Link
                              href="/profile"
                              onClick={() => setShowProfileDropdown(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
                            >
                              <User className="h-4 w-4" />
                              <span>Profile</span>
                            </Link>
                            <Link
                              href="/change-password"
                              onClick={() => setShowProfileDropdown(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Security</span>
                            </Link>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-slate-100" />

                          {/* Logout Action */}
                          <div className="py-1.5">
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <section
                id="staff-overview"
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
              >
                <div className="grid gap-6 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5f8fc_56%,#eef4ff_100%)] px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1.3fr)_340px]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#5c77a1]">
                      Daily Operations
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#14233b] sm:text-[2.35rem]">
                      {staffLabel}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                      {staffSubtitle}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        {roleLabel}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                        {deskPulseLabel}
                      </span>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                        {totalQueue} active queue item{totalQueue === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                          Queue Summary
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          Current circulation lanes
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f467d] text-white">
                        <BookCopy className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {requestNavItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1f467d] shadow-sm">
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                          </div>
                          <span className="rounded-full bg-[#1f467d] px-2.5 py-1 text-xs font-bold text-white">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 px-6 py-6 sm:px-8 md:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Role</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{roleLabel}</p>
                        <p className="mt-1 text-xs text-slate-500">Current desk assignment</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Desk Status</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{deskPulseLabel}</p>
                        <p className="mt-1 text-xs text-slate-500">Shift traffic overview</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Queue</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {totalQueue} item{totalQueue === 1 ? '' : 's'} in queue
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Borrow, renewal, and return lanes</p>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
                <DeskPanel
                  id="staff-notifications"
                  eyebrow="Desk Activity"
                  title="Notifications"
                  titleIcon={
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <BellRing className="h-5 w-5" />
                    </span>
                  }
                  description="Review your in-app alerts and clear unread desk activity."
                  action={
                    <div className="flex flex-wrap items-center gap-3">
                      <RefreshButton onClick={loadNotifications} />
                      <button
                        type="button"
                        onClick={() => void handleMarkAllNotificationsRead()}
                        disabled={notificationActionBusy || notificationUnreadCount === 0}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {notificationActionBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark all read
                          </>
                        )}
                      </button>
                    </div>
                  }
                >
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Unread</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{notificationUnreadCount}</p>
                      <p className="mt-2 text-sm text-slate-600">Unread updates</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{notifications.length}</p>
                      <p className="mt-2 text-sm text-slate-600">All loaded</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {notificationsState === 'loading' && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                        Loading notifications...
                      </div>
                    )}
                    {notificationsError && notificationsState !== 'loading' && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                        {notificationsError}
                      </div>
                    )}
                    {notificationsState !== 'loading' &&
                      !notificationsError &&
                      notifications.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                          No notifications found for this account.
                        </div>
                      )}
                    {notificationsState !== 'loading' &&
                      !notificationsError &&
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => void handleNotificationClick(notification)}
                          className="block w-full rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 hover:bg-sky-50"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-slate-600">
                                {notification.message}
                              </p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </DeskPanel>

                {canApproveAccounts && (
                <DeskPanel
                  id="staff-pending-accounts"
                  eyebrow="Account Reviews"
                  title="Pending Accounts"
                  description="Review student and teacher registrations. Approve accounts to grant library access or mark students as working students."
                  action={
                    <div className="flex items-center gap-2">
                      <span className={sectionCountPillClassName}>
                        {pendingAccounts.length} pending
                      </span>
                      <RefreshButton onClick={loadPendingAccounts} />
                    </div>
                  }
                >
                  {accountsState === 'loading' && <LoadingState text="Loading pending accounts..." />}
                  {accountsError && <ErrorState message={accountsError} />}
                  {accountsState !== 'loading' && !accountsError && pendingAccounts.length === 0 && (
                    <EmptyState
                      title="No pending accounts"
                      description="All account registrations have been reviewed. New registrations will appear here when submitted."
                    />
                  )}

                  {accountsState !== 'loading' && !accountsError && pendingAccounts.length > 0 && (
                    <div className="mt-6 space-y-4">
                    {pendingAccounts.map((account) => (
                      <div key={account.id} className={requestCardClassName}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                                {account.role === 'TEACHER' ? 'Faculty' : 'Student'}
                              </span>
                            </div>
                            <h3 className="mt-3 text-lg font-semibold text-slate-900">
                              {account.full_name}
                            </h3>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p>ID: {account.staff_id ?? account.student_id ?? 'Not assigned'}</p>
                              <p>Email: {account.email ?? 'No email provided'}</p>
                              <p>Registered: {formatDate(account.date_joined)}</p>
                            </div>

                            {account.role === 'STUDENT' && (
                              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
                                <label className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 bg-white text-sky-500 focus:ring-sky-300"
                                    disabled={accountActionBusy === account.id}
                                    checked={Boolean(workingStudentApprovals[account.id])}
                                    onChange={(event) =>
                                      setWorkingStudentApprovals((prev) => ({
                                        ...prev,
                                        [account.id]: event.target.checked,
                                      }))
                                    }
                                  />
                                  <span className="text-sm font-medium text-slate-700">
                                    Approve as working student
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={accountActionBusy === account.id}
                            onClick={() => handleApproveAccount(account.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {accountActionBusy === account.id ? 'Working...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={accountActionBusy === account.id}
                            onClick={() => handleRejectAccount(account.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {accountActionBusy === account.id ? 'Working...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </DeskPanel>
              )}

                <DeskPanel
                  id="staff-overdue-watch"
                  eyebrow="Risk watch"
                  title="Overdue books"
                  description="Review overdue loans so the desk can verify follow-up, fines, and borrower communication."
                  action={
                    <div className="flex items-center gap-2">
                      <span className={sectionCountPillClassName}>
                        {overdueRequests.length} on watch
                      </span>
                      <RefreshButton onClick={loadOverdueRequests} />
                    </div>
                  }
                >
                  {overdueState === 'loading' && <LoadingState text="Loading overdue books..." />}
                  {overdueError && <ErrorState message={overdueError} />}
                  {overdueState !== 'loading' && overdueRequests.length === 0 && (
                    <EmptyState
                      title="No overdue books right now"
                      description="The approved loan lane is currently clear. Keep monitoring returns and renewals to maintain that pace."
                    />
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {overdueRequests.map((request) => {
                      const fine = Number.parseFloat(request.late_fee_amount ?? '0');
                      const resolvedFine = Number.isFinite(fine) ? fine : 0;
                      const overdueDays = request.overdue_days ?? 0;

                      return (
                        <div
                          key={request.id}
                          className={requestCardClassName}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                              <p className="text-sm text-slate-600">{request.book.author}</p>
                            </div>
                            <span className="rounded-full border border-rose-300/40 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                              {overdueDays} day{overdueDays === 1 ? '' : 's'} overdue
                            </span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>Borrower: {request.user?.full_name ?? 'Unknown'}</p>
                            <p>ID: {request.user?.student_id ?? request.user?.staff_id ?? '-'}</p>
                            <p>Due date: {formatDate(request.due_date)}</p>
                            {request.receipt_number && <p>Receipt: {request.receipt_number}</p>}
                          </div>
                          <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-600/80">Estimated fine</p>
                            <p className="mt-2 text-sm font-semibold text-amber-700">{formatCurrency(resolvedFine)}</p>
                            <p className="mt-2 text-sm leading-6 text-amber-800/80">
                              Verify the loan status and follow up with the borrower.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DeskPanel>

                <DeskPanel
                  id="staff-borrow-requests"
                  eyebrow="Approval lane"
                  title="Borrow requests"
                  description="Approve or reject pending borrow requests with a clean, consistent front-desk flow."
                  action={
                    <RefreshButton onClick={loadBorrowRequests} />
                  }
                >
                  {borrowsState === 'loading' && <LoadingState text="Loading borrow requests..." />}
                  {borrowsError && <ErrorState message={borrowsError} />}
                  {borrowsState !== 'loading' && borrowRequests.length === 0 && (
                    <EmptyState
                      title="No borrow requests waiting"
                      description="The approval lane is quiet. New borrower requests will appear here when they come in."
                    />
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {borrowRequests.map((request) => (
                      <div
                        key={request.id}
                        className={requestCardClassName}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                            <p className="text-sm text-slate-600">{request.book.author}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusPill[request.status]}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p>Student: {request.user?.full_name ?? 'Unknown'}</p>
                          <p>ID: {request.user?.student_id ?? '-'}</p>
                          <p>Requested: {formatDate(request.requested_at)}</p>
                        </div>
                        <DecisionButtons
                          busy={actionBusy === request.id}
                          onApprove={() => handleBorrowDecision(request.id, true)}
                          onReject={() => handleBorrowDecision(request.id, false)}
                        />
                      </div>
                    ))}
                  </div>
                </DeskPanel>

                <DeskPanel
                  id="staff-renewal-requests"
                  eyebrow="Extension lane"
                  title="Renewal requests"
                  description="Review extension requests carefully so due dates stay fair, clear, and documented."
                  action={
                    <RefreshButton onClick={loadRenewalRequests} />
                  }
                >
                  {renewalsState === 'loading' && <LoadingState text="Loading renewal requests..." />}
                  {renewalsError && <ErrorState message={renewalsError} />}
                  {renewalsState !== 'loading' && renewalRequests.length === 0 && (
                    <EmptyState
                      title="No renewal requests waiting"
                      description="The extension lane is currently empty. New due-date requests will show here when submitted."
                    />
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {renewalRequests.map((request) => (
                      <div
                        key={request.id}
                        className={requestCardClassName}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                            <p className="text-sm text-slate-600">{request.book.author}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${renewalStatusPill[request.status]}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p>Student: {request.user?.full_name ?? 'Unknown'}</p>
                          <p>ID: {request.user?.student_id ?? request.user?.staff_id ?? '-'}</p>
                          <p>Requested: {formatDate(request.requested_at)}</p>
                          <p>Current due date: {formatDate(request.current_due_date)}</p>
                          <p>Projected due date: {formatDate(request.projected_due_date)}</p>
                          <p>
                            Extension: {request.requested_extension_days} day
                            {request.requested_extension_days === 1 ? '' : 's'}
                          </p>
                          {request.receipt_number && <p>Receipt: {request.receipt_number}</p>}
                        </div>
                        <DecisionButtons
                          busy={renewalActionBusy === request.id}
                          onApprove={() => handleRenewalDecision(request.id, true)}
                          onReject={() => handleRenewalDecision(request.id, false)}
                        />
                      </div>
                    ))}
                  </div>
                </DeskPanel>

                <DeskPanel
                  id="staff-return-requests"
                  eyebrow="Check-in lane"
                  title="Return requests"
                  description="Process pending returns to keep inventory, overdue tracking, and fees accurate."
                  action={
                    <RefreshButton onClick={loadReturnRequests} />
                  }
                >
                  {returnsState === 'loading' && <LoadingState text="Loading return requests..." />}
                  {returnsError && <ErrorState message={returnsError} />}
                  {returnsState !== 'loading' && returnRequests.length === 0 && (
                    <EmptyState
                      title="No return requests waiting"
                      description="The return lane is clear. New check-ins will appear here as soon as borrowers submit them."
                    />
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {returnRequests.map((request) => (
                      <div
                        key={request.id}
                        className={requestCardClassName}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                            <p className="text-sm text-slate-600">{request.book.author}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${returnStatusPill[request.status]}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p>Student: {request.user?.full_name ?? 'Unknown'}</p>
                          <p>ID: {request.user?.student_id ?? '-'}</p>
                          <p>Requested: {formatDate(request.requested_at)}</p>
                          {request.receipt_number && <p>Receipt: {request.receipt_number}</p>}
                        </div>
                        <DecisionButtons
                          busy={returnActionBusy === request.id}
                          onApprove={() => handleReturnDecision(request.id, true)}
                          onReject={() => handleReturnDecision(request.id, false)}
                        />
                      </div>
                    ))}
                  </div>
                </DeskPanel>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
