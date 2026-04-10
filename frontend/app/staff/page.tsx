'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BadgeCheck,
  BookCopy,
  CheckCircle2,
  CircleAlert,
  Clock3,
  HandHelping,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleLabel, isWorkingStudent } from '@/lib/roles';
import {
  booksApi,
  BorrowRequest,
  RenewalRequest,
  ReturnRequest,
  getRenewalRequests,
  getReturnRequests,
  approveBorrowRequest,
  approveRenewalRequest,
  rejectBorrowRequest,
  rejectRenewalRequest,
  approveReturnRequest,
  rejectReturnRequest,
} from '@/lib/api';

type SectionState = 'idle' | 'loading' | 'error';
type Tone = 'sky' | 'amber' | 'emerald' | 'rose' | 'violet' | 'slate';

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  caption: string;
  tone: Tone;
};

type DeskPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
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
  'rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,30,0.94)_0%,rgba(10,20,39,0.98)_100%)] shadow-[0_28px_80px_rgba(2,8,23,0.46)] backdrop-blur-2xl';

const statusPill: Record<BorrowRequest['status'], string> = {
  PENDING: 'border border-sky-300/20 bg-sky-400/15 text-sky-100',
  APPROVED: 'border border-emerald-300/20 bg-emerald-400/15 text-emerald-100',
  REJECTED: 'border border-rose-300/20 bg-rose-400/15 text-rose-100',
  RETURNED: 'border border-white/12 bg-white/[0.06] text-white/72',
};

const returnStatusPill: Record<ReturnRequest['status'], string> = {
  PENDING: 'border border-sky-300/20 bg-sky-400/15 text-sky-100',
  APPROVED: 'border border-emerald-300/20 bg-emerald-400/15 text-emerald-100',
  REJECTED: 'border border-rose-300/20 bg-rose-400/15 text-rose-100',
};

const renewalStatusPill: Record<RenewalRequest['status'], string> = {
  PENDING: 'border border-sky-300/20 bg-sky-400/15 text-sky-100',
  APPROVED: 'border border-emerald-300/20 bg-emerald-400/15 text-emerald-100',
  REJECTED: 'border border-rose-300/20 bg-rose-400/15 text-rose-100',
};

const metricToneStyles: Record<Tone, { icon: string; value: string }> = {
  sky: {
    icon: 'bg-sky-400/14 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.16)]',
    value: 'text-white',
  },
  amber: {
    icon: 'bg-amber-400/14 text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]',
    value: 'text-amber-50',
  },
  emerald: {
    icon: 'bg-emerald-400/14 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.16)]',
    value: 'text-white',
  },
  rose: {
    icon: 'bg-rose-400/14 text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.16)]',
    value: 'text-white',
  },
  violet: {
    icon: 'bg-violet-400/14 text-violet-100 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.16)]',
    value: 'text-white',
  },
  slate: {
    icon: 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]',
    value: 'text-white',
  },
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
  eyebrow,
  title,
  description,
  action,
  children,
  className = 'p-6 sm:p-7',
}: DeskPanelProps) {
  return (
    <section className={`${panelClassName} ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/42">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-[1.45rem]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, caption, tone }: MetricCardProps) {
  const toneStyle = metricToneStyles[tone];
  const compactValue = typeof value === 'string' && value.length > 12;

  return (
    <div className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${toneStyle.icon}`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/50 transition-colors group-hover:text-white/70">{label}</p>
        <p className={`mt-3.5 font-bold transition-all duration-300 ${compactValue ? 'text-2xl' : 'text-4xl'} ${toneStyle.value} group-hover:scale-105`}>
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-white/60 transition-colors group-hover:text-white/75">{caption}</p>
      </div>
    </div>
  );
}

function RefreshButton({ onClick }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/72 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}

function LoadingState({ text }: LoadingStateProps) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/72">
      <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
      {text}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-rose-300/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
      {message}
    </div>
  );
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/14 bg-white/[0.03] px-5 py-9 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/62">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/52">{description}</p>
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
        className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#07101d] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Working...' : 'Approve'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onReject}
        className="inline-flex items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-rose-100 transition hover:bg-rose-400/16 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Working...' : 'Reject'}
      </button>
    </div>
  );
}

export default function StaffDeskPage() {
  const { user } = useAuth();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [approvedBorrowRequests, setApprovedBorrowRequests] = useState<BorrowRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);

  const [borrowsState, setBorrowsState] = useState<SectionState>('idle');
  const [overdueState, setOverdueState] = useState<SectionState>('idle');
  const [returnsState, setReturnsState] = useState<SectionState>('idle');
  const [renewalsState, setRenewalsState] = useState<SectionState>('idle');

  const [borrowsError, setBorrowsError] = useState<string | null>(null);
  const [overdueError, setOverdueError] = useState<string | null>(null);
  const [returnsError, setReturnsError] = useState<string | null>(null);
  const [renewalsError, setRenewalsError] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [returnActionBusy, setReturnActionBusy] = useState<number | null>(null);
  const [renewalActionBusy, setRenewalActionBusy] = useState<number | null>(null);

  const isWorkingStudentDesk = isWorkingStudent(user);
  const roleLabel = getUserRoleLabel(user);
  const staffLabel = isWorkingStudentDesk ? 'Working Student Desk' : 'Staff Desk';
  const staffSubtitle =
    isWorkingStudentDesk
      ? 'Assist the circulation desk, help students, and keep the library moving with a calm, polished flow.'
      : 'Coordinate the front desk, process requests quickly, and keep every circulation lane in sync.';
  const staffFocusTitle = isWorkingStudentDesk ? 'Working student focus' : 'Staff focus';
  const staffFocusSubtitle =
    isWorkingStudentDesk
      ? 'Your shift should feel calm, accurate, and reassuring to every borrower.'
      : 'Lead the daily desk rhythm with fast decisions and consistent service.';

  const focusTracks = useMemo(
    () =>
      isWorkingStudentDesk
        ? [
            {
              title: 'Borrow confirmations',
              description: 'Keep new requests moving so readers do not wait at the desk.',
              icon: BookCopy,
            },
            {
              title: 'Return accuracy',
              description: 'Verify every hand-in carefully and keep records clean.',
              icon: ArrowRightLeft,
            },
            {
              title: 'Student support',
              description: 'Guide borrowers politely and escalate unusual cases early.',
              icon: HandHelping,
            },
            {
              title: 'Quiet professionalism',
              description: 'Maintain a steady, welcoming atmosphere while you work.',
              icon: BadgeCheck,
            },
          ]
        : [
            {
              title: 'Queue control',
              description: 'Balance borrow, return, and renewal lanes without bottlenecks.',
              icon: BookCopy,
            },
            {
              title: 'Fine verification',
              description: 'Review overdue penalties and resolve questions with confidence.',
              icon: Wallet,
            },
            {
              title: 'Front desk support',
              description: 'Keep borrowers informed while prioritizing urgent items.',
              icon: HandHelping,
            },
            {
              title: 'Operational rhythm',
              description: 'Keep the workspace tidy, consistent, and audit-ready.',
              icon: BadgeCheck,
            },
          ],
    [isWorkingStudentDesk]
  );

  const serviceStandards = useMemo(
    () =>
      isWorkingStudentDesk
        ? [
            'Confirm borrower identity before approving any request.',
            'Check due dates and receipt details before closing a transaction.',
            'Escalate disputes, missing items, or unusual penalties immediately.',
          ]
        : [
            'Keep queue visibility clear so no request sits unattended.',
            'Review due dates, receipts, and status changes before final approval.',
            'Escalate damaged items, fee disputes, and policy exceptions quickly.',
          ],
    [isWorkingStudentDesk]
  );

  const overdueRequests = useMemo(
    () =>
      approvedBorrowRequests
        .filter((request) => (request.overdue_days ?? 0) > 0)
        .sort((a, b) => (b.overdue_days ?? 0) - (a.overdue_days ?? 0)),
    [approvedBorrowRequests]
  );

  const totalOverdueFees = useMemo(
    () =>
      overdueRequests.reduce((sum, request) => {
        const fee = Number.parseFloat(request.late_fee_amount ?? '0');
        return sum + (Number.isFinite(fee) ? fee : 0);
      }, 0),
    [overdueRequests]
  );

  const totalQueue = borrowRequests.length + returnRequests.length + renewalRequests.length;
  const deskPulseLabel =
    totalQueue === 0 ? 'Desk clear' : totalQueue >= 8 ? 'High traffic' : totalQueue >= 4 ? 'Busy but stable' : 'Steady flow';

  const nextBestMove = useMemo(() => {
    if (overdueRequests.length > 0) {
      return `${overdueRequests.length} overdue ${overdueRequests.length === 1 ? 'loan needs' : 'loans need'} follow-up before the desk gets busier.`;
    }
    if (borrowRequests.length > 0) {
      return 'Borrow approvals are first in line. Clear them early to keep circulation smooth.';
    }
    if (returnRequests.length > 0) {
      return 'Return confirmations are waiting. Closing them now keeps inventory accurate.';
    }
    if (renewalRequests.length > 0) {
      return 'Renewal decisions are the only open lane. A quick review will clear the desk.';
    }
    return 'The queue is quiet. Use the breathing room to tidy shelves and prepare for the next rush.';
  }, [borrowRequests.length, overdueRequests.length, renewalRequests.length, returnRequests.length]);

  const snapshotMetrics = useMemo(
    () => [
      {
        icon: BookCopy,
        label: 'Pending borrows',
        value: borrowRequests.length,
        caption: 'Requests waiting for first approval.',
        tone: 'sky' as const,
      },
      {
        icon: ArrowRightLeft,
        label: 'Pending returns',
        value: returnRequests.length,
        caption: 'Books ready for check-in confirmation.',
        tone: 'emerald' as const,
      },
      {
        icon: Clock3,
        label: 'Pending renewals',
        value: renewalRequests.length,
        caption: 'Extension requests awaiting a decision.',
        tone: 'violet' as const,
      },
      {
        icon: ShieldAlert,
        label: 'Overdue watch',
        value: overdueRequests.length,
        caption: 'Approved loans that already need follow-up.',
        tone: 'rose' as const,
      },
      {
        icon: Wallet,
        label: 'Estimated fines',
        value: formatCurrency(totalOverdueFees),
        caption: 'Projected late fees across active overdue books.',
        tone: 'amber' as const,
      },
      {
        icon: BadgeCheck,
        label: 'Desk pulse',
        value: deskPulseLabel,
        caption: 'A quick read on current front-desk pressure.',
        tone: 'slate' as const,
      },
    ],
    [borrowRequests.length, deskPulseLabel, overdueRequests.length, renewalRequests.length, returnRequests.length, totalOverdueFees]
  );

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

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      void loadBorrowRequests();
      void loadOverdueRequests();
      void loadReturnRequests();
      void loadRenewalRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

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

  return (
    <ProtectedRoute requiredRoles={['WORKING', 'STAFF', 'ADMIN']}>
      <div className="royal-app min-h-screen bg-[#07101d] text-white">
        <Navbar variant="dark" />
        <main className="relative overflow-hidden pt-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute right-[-6rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute left-1/2 top-[42rem] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-violet-500/8 blur-3xl" />
          </div>

          <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.22),transparent_42%),radial-gradient(ellipse_at_85%_15%,rgba(251,191,36,0.20),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.12),transparent_50%),linear-gradient(180deg,#07101d_0%,#0a1730_100%)]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="animate-fade-up">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-4 py-1.5 backdrop-blur-sm">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/90">Daily Operations</p>
                  </div>
                  <h1 className="mt-6 bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-[3.5rem] lg:leading-[1.1]">
                    {staffLabel}
                  </h1>
                  <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">
                    {staffSubtitle}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <span className="group inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 px-5 py-2.5 backdrop-blur-sm transition-all hover:border-emerald-400/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                      <BadgeCheck className="h-4.5 w-4.5 text-emerald-300 transition-transform group-hover:scale-110" />
                      <span className="text-sm font-semibold text-white">{roleLabel}</span>
                    </span>
                    <span className="group inline-flex items-center gap-2.5 rounded-full border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-5 py-2.5 backdrop-blur-sm transition-all hover:border-amber-400/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                      <Sparkles className="h-4.5 w-4.5 text-amber-300 transition-transform group-hover:rotate-12" />
                      <span className="text-sm font-medium text-white/90">{deskPulseLabel}</span>
                    </span>
                    <span className="group inline-flex items-center gap-2.5 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-5 py-2.5 backdrop-blur-sm transition-all hover:border-sky-400/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                      <Clock3 className="h-4.5 w-4.5 text-sky-300 transition-transform group-hover:scale-110" />
                      <span className="text-sm font-medium text-white/90">
                        {totalQueue} item{totalQueue === 1 ? '' : 's'} in queue
                      </span>
                    </span>
                  </div>
                </div>

                <div className={`${panelClassName} animate-fade-up p-6 sm:p-8 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-sky-500/20 to-transparent blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-violet-500/20 to-transparent blur-3xl" />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/50">Live Shift Pulse</p>
                    <div className="mt-6 flex items-end justify-between gap-6">
                      <div>
                        <p className="bg-gradient-to-br from-white via-white to-white/80 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">{totalQueue}</p>
                        <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
                          Open requests across borrow, return, and renewal lanes.
                        </p>
                      </div>
                      <div className="group rounded-[1.5rem] border border-white/12 bg-gradient-to-br from-rose-500/10 to-orange-500/10 px-5 py-4 text-right backdrop-blur-sm transition-all hover:border-rose-400/30 hover:shadow-[0_0_25px_rgba(251,113,133,0.2)]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-rose-200/70">On Watch</p>
                        <p className="mt-2.5 text-xl font-bold text-white transition-transform group-hover:scale-110">{overdueRequests.length} overdue</p>
                      </div>
                    </div>

                  <div className="relative mt-7 overflow-hidden rounded-[1.7rem] border border-sky-300/20 bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-violet-500/10 px-6 py-5 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_60%)]" />
                    <div className="relative flex items-start gap-4">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-transform hover:scale-110">
                        <CircleAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.26em] text-sky-100/80">Next Best Move</p>
                        <p className="mt-3 text-sm leading-7 text-white/90">{nextBestMove}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="-mt-10 relative z-10 mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8 space-y-10">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <DeskPanel
                eyebrow="Desk intelligence"
                title="Circulation snapshot"
                description="A clean overview of the queue, pressure points, and follow-up items that matter most this shift."
              >
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {snapshotMetrics.map((metric) => (
                    <MetricCard key={metric.label} {...metric} />
                  ))}
                </div>
              </DeskPanel>

              <DeskPanel
                eyebrow="Shift focus"
                title={staffFocusTitle}
                description={staffFocusSubtitle}
              >
                <div className="mt-6 space-y-3">
                  {focusTracks.map((task, index) => {
                    const Icon = task.icon;

                    return (
                      <div
                        key={task.title}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/16 hover:bg-white/[0.08]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-sky-100">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                              {String(index + 1).padStart(2, '0')}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">{task.title}</p>
                            <p className="mt-2 text-sm leading-6 text-white/56">{task.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  {serviceStandards.map((standard) => (
                    <div
                      key={standard}
                      className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
                      <p className="text-sm leading-6 text-white/68">{standard}</p>
                    </div>
                  ))}
                </div>
              </DeskPanel>
            </div>

            <DeskPanel
              eyebrow="Risk watch"
              title="Overdue books"
              description="Review overdue loans so the desk can verify follow-up, fines, and borrower communication."
              action={
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/68">
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
                      className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.03)_100%)] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-white">{request.book.title}</p>
                          <p className="text-sm text-white/56">{request.book.author}</p>
                        </div>
                        <span className="rounded-full border border-rose-300/20 bg-rose-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-100">
                          {overdueDays} day{overdueDays === 1 ? '' : 's'} overdue
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-white/64">
                        <p>Borrower: {request.user?.full_name ?? 'Unknown'}</p>
                        <p>ID: {request.user?.student_id ?? request.user?.staff_id ?? '-'}</p>
                        <p>Due date: {formatDate(request.due_date)}</p>
                        {request.receipt_number && <p>Receipt: {request.receipt_number}</p>}
                      </div>
                      <div className="mt-4 rounded-[1.4rem] border border-amber-300/14 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(255,255,255,0.03))] px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-100/72">Estimated fine</p>
                        <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(resolvedFine)}</p>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          Verify the loan status and follow up with the borrower.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DeskPanel>

            <DeskPanel
              eyebrow="Approval lane"
              title="Borrow requests"
              description="Approve or reject pending borrow requests with a clean, consistent front-desk flow."
              action={
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/68">
                    {borrowRequests.length} pending
                  </span>
                  <RefreshButton onClick={loadBorrowRequests} />
                </div>
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
                    className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.03)_100%)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{request.book.title}</p>
                        <p className="text-sm text-white/56">{request.book.author}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusPill[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/64">
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
              eyebrow="Extension lane"
              title="Renewal requests"
              description="Review extension requests carefully so due dates stay fair, clear, and documented."
              action={
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/68">
                    {renewalRequests.length} pending
                  </span>
                  <RefreshButton onClick={loadRenewalRequests} />
                </div>
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
                    className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.03)_100%)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{request.book.title}</p>
                        <p className="text-sm text-white/56">{request.book.author}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${renewalStatusPill[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/64">
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
              eyebrow="Check-in lane"
              title="Return requests"
              description="Process pending returns to keep inventory, overdue tracking, and fees accurate."
              action={
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/68">
                    {returnRequests.length} pending
                  </span>
                  <RefreshButton onClick={loadReturnRequests} />
                </div>
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
                    className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.03)_100%)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{request.book.title}</p>
                        <p className="text-sm text-white/56">{request.book.author}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${returnStatusPill[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/64">
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
          </section>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
