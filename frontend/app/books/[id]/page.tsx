'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BorrowSlip from '@/components/BorrowSlip';
import { useAuth } from '@/contexts/AuthContext';
import {
  booksApi,
  Book,
  BorrowRequest,
  BookRecommendation,
  BookReview,
  ReportingFrequency,
  resolveMediaUrl,
} from '@/lib/api';
import { canBorrowAsPatron } from '@/lib/roles';

function formatDate(dateString?: string) {
  if (!dateString) {
    return 'Unknown';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type RequestStatusState = {
  bookId: number;
  submitting: boolean;
  error: string | null;
  message: string | null;
};

type CoverState = {
  bookId: number;
  side: 'front' | 'back';
};

function StaticBorrowField({
  value,
  fallback,
  multiline = false,
}: {
  value?: string | null;
  fallback: string;
  multiline?: boolean;
}) {
  const trimmedValue = value?.trim() ?? '';
  const displayValue = trimmedValue || fallback;
  const textTone = trimmedValue ? 'text-ink' : 'text-ink-muted';

  return (
    <div
      className={`mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm ${textTone} ${
        multiline ? 'min-h-[88px] whitespace-pre-wrap' : 'flex min-h-[42px] items-center'
      }`}
    >
      {displayValue}
    </div>
  );
}

function RatingStars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  const filledStars = Math.round(Math.max(0, Math.min(5, rating)));

  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${className} ${
            index < filledStars ? 'fill-[color:var(--accent)] text-[color:var(--accent)]' : 'text-slate-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function BookDetailsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const bookId = useMemo(() => Number(idParam), [idParam]);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverState, setCoverState] = useState<CoverState | null>(null);
  const [borrowStatus, setBorrowStatus] = useState<RequestStatusState | null>(null);
  const [returnStatus, setReturnStatus] = useState<RequestStatusState | null>(null);
  const [reservationStatus, setReservationStatus] = useState<RequestStatusState | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowDays, setBorrowDays] = useState(7);
  const [teacherReportingFrequency, setTeacherReportingFrequency] = useState<
    Exclude<ReportingFrequency, 'NONE'>
  >('MONTHLY');
  const [todayReference] = useState(() => new Date());
  const [studentBorrowForm, setStudentBorrowForm] = useState({
    full_name: '',
    student_id: '',
    course_program: '',
    year_level: '',
    contact_number: '',
    email: '',
    call_number: '',
    accession_number: '',
    quantity: '1',
    return_date: '',
    borrower_signature: '',
    condition: 'GOOD',
    remarks: '',
    agreementAccepted: false,
  });

  // Review state
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, reviewText: '' });
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(true);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [showBorrowSlip, setShowBorrowSlip] = useState(false);
  const [latestProcessedBorrowRequest, setLatestProcessedBorrowRequest] = useState<BorrowRequest | null>(null);
  const [borrowSlipData, setBorrowSlipData] = useState<{
    studentName: string;
    studentId: string;
    courseYear: string;
    bookTitle: string;
    author: string;
    callNumber: string;
    dateBorrowed: string;
    dueDate: string;
  } | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchBook = async () => {
      if (!idParam || Number.isNaN(bookId)) {
        setError('Invalid book ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await booksApi.getById(bookId);

      if (!isActive) {
        return;
      }

      if (response.error || !response.data) {
        setError(response.error ?? 'Unable to load book');
        setBook(null);
      } else {
        setError(null);
        setBook(response.data);
      }

      setLoading(false);
    };

    fetchBook();

    return () => {
      isActive = false;
    };
  }, [bookId, idParam]);

  // Fetch reviews when book is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (!bookId || Number.isNaN(bookId)) return;
      setReviewsLoading(true);
      const response = await booksApi.getBookReviews(bookId);
      if (response.data) {
        setReviews(response.data);
      }
      setReviewsLoading(false);
    };
    fetchReviews();
  }, [bookId]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!bookId || Number.isNaN(bookId)) {
        return;
      }

      setRecommendationsLoading(true);
      setRecommendationsError(null);
      const response = await booksApi.getSimilarBooks(bookId);
      if (response.error) {
        setRecommendationsError(response.error);
        setRecommendations([]);
      } else {
        setRecommendations(response.data ?? []);
      }
      setRecommendationsLoading(false);
    };

    void fetchRecommendations();
  }, [bookId]);

  useEffect(() => {
    let isActive = true;

    const fetchLatestProcessedBorrow = async () => {
      if (!bookId || Number.isNaN(bookId) || !isAuthenticated || !canBorrowAsPatron(user)) {
        setLatestProcessedBorrowRequest(null);
        return;
      }

      const response = await booksApi.getBorrowRequests();
      if (!isActive) {
        return;
      }

      if (response.error || !response.data) {
        setLatestProcessedBorrowRequest(null);
        return;
      }

      const latestMatch =
        response.data
          .filter(
            (request) =>
              request.book.id === bookId &&
              (request.status === 'APPROVED' || request.status === 'RETURNED')
          )
          .sort((a, b) => {
            const aTime = new Date(a.processed_at ?? a.requested_at).getTime();
            const bTime = new Date(b.processed_at ?? b.requested_at).getTime();
            return bTime - aTime;
          })[0] ?? null;

      setLatestProcessedBorrowRequest(latestMatch);
    };

    void fetchLatestProcessedBorrow();

    return () => {
      isActive = false;
    };
  }, [bookId, isAuthenticated, user]);

  // Get user's existing review
  const userReview = reviews.find((r) => user && r.user.id === user.id);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!bookId || reviewForm.rating === 0) return;
    setReviewSubmitting(true);
    setReviewError(null);

    let response;
    if (editingReview && userReview) {
      response = await booksApi.updateReview(bookId, userReview.id, reviewForm.rating, reviewForm.reviewText);
    } else {
      response = await booksApi.createReview(bookId, reviewForm.rating, reviewForm.reviewText);
    }

    if (response.error) {
      setReviewError(response.error);
    } else {
      // Refresh reviews
      const reviewsResponse = await booksApi.getBookReviews(bookId);
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }
      // Refresh book to get updated average rating
      const bookResponse = await booksApi.getById(bookId);
      if (bookResponse.data) {
        setBook(bookResponse.data);
      }
      setShowReviewForm(false);
      setReviewForm({ rating: 0, reviewText: '' });
      setEditingReview(null);
    }
    setReviewSubmitting(false);
  };

  // Handle delete review
  const handleDeleteReview = async () => {
    if (!bookId || !userReview) return;
    if (!confirm('Are you sure you want to delete your review?')) return;

    const response = await booksApi.deleteReview(bookId, userReview.id);
    if (!response.error) {
      // Refresh reviews
      const reviewsResponse = await booksApi.getBookReviews(bookId);
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }
      // Refresh book to get updated average rating
      const bookResponse = await booksApi.getById(bookId);
      if (bookResponse.data) {
        setBook(bookResponse.data);
      }
    }
  };

  // Start editing existing review
  const startEditReview = () => {
    if (userReview) {
      setReviewForm({ rating: userReview.rating, reviewText: userReview.review_text });
      setEditingReview(userReview.id);
      setReviewsExpanded(true);
      setShowReviewForm(true);
    }
  };

  // Cancel review form
  const cancelReviewForm = () => {
    setShowReviewForm(false);
    setReviewForm({ rating: 0, reviewText: '' });
    setEditingReview(null);
    setReviewError(null);
  };

  const coverUrl = resolveMediaUrl(book?.cover_image);
  const coverBackUrl = resolveMediaUrl(book?.cover_back);
  const hasBackCover = Boolean(coverBackUrl);
  const categoryNames = book?.categories?.map((category) => category.name).filter(Boolean) ?? [];
  const displayCategories =
    categoryNames.length > 0 ? categoryNames : book?.genre ? [book.genre] : ['Uncategorized'];
  const categoriesLabel = displayCategories.join(', ');
  const featuredCategory = displayCategories[0];
  const remainingCategoryCount = Math.max(displayCategories.length - 1, 0);
  const availableCopies = book?.copies_available ?? 0;
  const totalCopies = book?.copies_total ?? availableCopies;
  const availabilityPercent =
    totalCopies > 0 ? Math.max(0, Math.min(100, Math.round((availableCopies / totalCopies) * 100))) : 0;
  const averageRating = book?.average_rating ?? 0;
  const reviewCount = book?.review_count ?? reviews.length;
  const hasRatings = averageRating > 0 && reviewCount > 0;
  const reviewCountLabel = `${reviewCount} review${reviewCount === 1 ? '' : 's'}`;
  const publishedLabel = book ? formatDate(book.published_date) : 'Unknown';
  const languageLabel = book?.language?.trim() ? book.language : 'Not specified';
  const gradeLevelLabel = book?.grade_level?.trim() ? book.grade_level : 'General';
  const isbnLabel = book?.isbn?.trim() ? book.isbn : 'Not provided';
  const shelfLabel = book?.location_shelf?.trim() ? book.location_shelf : 'Not assigned';
  const resolvedBookId = book?.id ?? (Number.isNaN(bookId) ? -1 : bookId);
  const coverSide = coverState?.bookId === resolvedBookId ? coverState.side : 'front';
  const effectiveCoverSide = hasBackCover ? coverSide : 'front';
  const activeBorrowStatus = borrowStatus?.bookId === resolvedBookId ? borrowStatus : null;
  const borrowSubmitting = activeBorrowStatus?.submitting ?? false;
  const borrowError = activeBorrowStatus?.error ?? null;
  const borrowMessage = activeBorrowStatus?.message ?? null;
  const activeReturnStatus = returnStatus?.bookId === resolvedBookId ? returnStatus : null;
  const returnSubmitting = activeReturnStatus?.submitting ?? false;
  const returnError = activeReturnStatus?.error ?? null;
  const returnMessage = activeReturnStatus?.message ?? null;
  const activeReservationStatus = reservationStatus?.bookId === resolvedBookId ? reservationStatus : null;
  const reservationSubmitting = activeReservationStatus?.submitting ?? false;
  const reservationError = activeReservationStatus?.error ?? null;
  const reservationMessage = activeReservationStatus?.message ?? null;
  const borrowDayOptions = [7];
  const getEstimatedDueDateLabel = (days: number) => {
    const dueDate = new Date(todayReference);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toLocaleDateString();
  };
  const borrowedDateInput = useMemo(
    () => formatDateInput(todayReference),
    [todayReference]
  );
  const dueDateInput = useMemo(() => {
    const dueDate = new Date(todayReference);
    dueDate.setDate(dueDate.getDate() + borrowDays);
    return formatDateInput(dueDate);
  }, [borrowDays, todayReference]);
  const studentDisplayName = user?.full_name?.trim() ?? '';
  const studentDisplayId = user?.student_id?.trim() ?? '';
  const studentDisplayProgram = user?.program?.trim() ?? '';
  const studentDisplayYearLevel = user?.year_level?.trim() ?? '';
  const studentDisplayContactNumber = '';
  const studentDisplayEmail = user?.email?.trim() ?? '';
  const studentDisplayCallNumber = book?.location_shelf?.trim() ?? '';
  const studentDisplayAccessionNumber = '';
  const studentCourseYear = [studentDisplayProgram, studentDisplayYearLevel]
    .filter((value) => value.length > 0)
    .join(' - ');

  const handleBorrowRequest = async () => {
    if (!book || borrowSubmitting) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }

    if (!canBorrowAsPatron(user)) {
      setBorrowStatus({
        bookId: book.id,
        submitting: false,
        error: 'Only students and teachers can request to borrow books.',
        message: null,
      });
      return;
    }

    if (!book.available) {
      setBorrowStatus({
        bookId: book.id,
        submitting: false,
        error: 'This book is currently not available.',
        message: null,
      });
      return;
    }

    if (hasPendingRequest) {
      setBorrowStatus({
        bookId: book.id,
        submitting: false,
        error: 'You already have a pending request for this book.',
        message: null,
      });
      return;
    }

    if (isBorrowedByUser) {
      setBorrowStatus({
        bookId: book.id,
        submitting: false,
        error: 'You have already borrowed this book.',
        message: null,
      });
      return;
    }

    if (user?.role === 'TEACHER') {
      setShowBorrowModal(true);
      return;
    }

    setStudentBorrowForm((prev) => ({
      ...prev,
      full_name: user?.full_name ?? '',
      student_id: user?.student_id ?? '',
      course_program: user?.program ?? '',
      year_level: user?.year_level ?? '',
      contact_number: '',
      email: user?.email ?? '',
      call_number: book.location_shelf ?? '',
      accession_number: '',
      quantity: '1',
      return_date: dueDateInput,
      borrower_signature: user?.full_name ?? '',
      condition: '',
      remarks: '',
      agreementAccepted: false,
    }));
    setShowBorrowModal(true);
  };

  const confirmBorrowRequest = async () => {
    if (!book || borrowSubmitting) {
      return;
    }

    const requestBookId = book.id;
    setBorrowStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message: null,
    });

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }

    if (!canBorrowAsPatron(user)) {
      setBorrowStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'Only students and teachers can request to borrow books.',
        message: null,
      });
      return;
    }

    setShowBorrowModal(false);
    setBorrowStatus({
      bookId: requestBookId,
      submitting: true,
      error: null,
      message: null,
    });
    const response = await booksApi.requestBorrow(
      book.id,
      user?.role === 'TEACHER'
        ? { reportingFrequency: teacherReportingFrequency }
        : borrowDays,
    );

    if (response.error || !response.data) {
      setBorrowStatus({
        bookId: requestBookId,
        submitting: false,
        error: response.error ?? 'Unable to submit borrow request.',
        message: null,
      });
      return;
    }

    setBorrowStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message:
        user?.role === 'TEACHER'
          ? `Teacher borrow request submitted with ${teacherReportingFrequency.toLowerCase()} reporting. ${response.data.message ?? ''}`
          : `Borrow request submitted for ${borrowDays} days. ${response.data.message ?? ''}`,
    });
    if (response.data.book) {
      setBook(response.data.book);
    } else {
      setBook({
        ...book,
        has_pending_borrow_request: true,
      });
    }

    // Show borrow slip for student-type borrowers, including working students.
    if (isStudentBorrower) {
      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + borrowDays);
      
      setBorrowSlipData({
        studentName: studentDisplayName,
        studentId: studentDisplayId,
        courseYear: studentCourseYear,
        bookTitle: book.title,
        author: book.author || 'Unknown Author',
        callNumber: studentDisplayCallNumber || 'Assigned by library staff',
        dateBorrowed: borrowDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
      setShowBorrowSlip(true);
    }
  };

  const handleStudentBorrowFormChange = (
    field: keyof typeof studentBorrowForm,
    value: string | boolean
  ) => {
    setStudentBorrowForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReturnRequest = async () => {
    if (!book || returnSubmitting) {
      return;
    }

    const borrowedByUser = Boolean(book.is_borrowed_by_user);
    const pendingReturn = Boolean(book.has_pending_return_request);

    const requestBookId = book.id;
    setReturnStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message: null,
    });

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }

    if (user?.role !== 'STUDENT' && user?.role !== 'TEACHER') {
      setReturnStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'Only students and teachers can request to return books.',
        message: null,
      });
      return;
    }

    if (!borrowedByUser) {
      setReturnStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'No active borrow found for this book.',
        message: null,
      });
      return;
    }

    if (pendingReturn) {
      setReturnStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'Return request already pending.',
        message: null,
      });
      return;
    }

    setReturnStatus({
      bookId: requestBookId,
      submitting: true,
      error: null,
      message: null,
    });
    const response = await booksApi.requestReturn(book.id);

    if (response.error || !response.data) {
      setReturnStatus({
        bookId: requestBookId,
        submitting: false,
        error: response.error ?? 'Unable to submit return request.',
        message: null,
      });
      return;
    }

    setReturnStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message: response.data.message ?? 'Return request submitted.',
    });
    if (response.data.book) {
      setBook(response.data.book);
    } else {
      setBook({
        ...book,
        has_pending_return_request: true,
      });
    }
  };

  const handleReserveRequest = async () => {
    if (!book || reservationSubmitting) {
      return;
    }

    const requestBookId = book.id;
    setReservationStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message: null,
    });

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }

    if (user?.role !== 'STUDENT' && user?.role !== 'TEACHER') {
      setReservationStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'Only students and teachers can reserve books.',
        message: null,
      });
      return;
    }

    if (book.available) {
      setReservationStatus({
        bookId: requestBookId,
        submitting: false,
        error: 'This book is currently available. Request borrow instead.',
        message: null,
      });
      return;
    }

    setReservationStatus({
      bookId: requestBookId,
      submitting: true,
      error: null,
      message: null,
    });

    const response = await booksApi.createReservation(book.id);
    if (response.error) {
      setReservationStatus({
        bookId: requestBookId,
        submitting: false,
        error: response.error,
        message: null,
      });
      return;
    }

    const queuePosition = response.data?.position;
    setReservationStatus({
      bookId: requestBookId,
      submitting: false,
      error: null,
      message:
        typeof queuePosition === 'number'
          ? `Reservation submitted. You are #${queuePosition} in queue.`
          : response.data?.message ?? 'Reservation submitted successfully.',
    });
  };

  const hasPendingRequest = Boolean(book?.has_pending_borrow_request);
  const hasPendingReturnRequest = Boolean(book?.has_pending_return_request);
  const isBorrowedByUser = Boolean(book?.is_borrowed_by_user);
  const isTeacher = user?.role === 'TEACHER';
  const canUseBorrowingActions = canBorrowAsPatron(user);
  const isStudentBorrower = canUseBorrowingActions && !isTeacher;
  const librarianVerificationName = latestProcessedBorrowRequest?.processed_by?.full_name ?? '';
  const librarianVerificationDate = latestProcessedBorrowRequest?.processed_at
    ? formatDate(latestProcessedBorrowRequest.processed_at)
    : '';
  const isBorrowDisabled =
    borrowSubmitting || authLoading || (isAuthenticated && !canUseBorrowingActions);
  const canRequestReturn = Boolean(book && isBorrowedByUser && !hasPendingReturnRequest);
  const isReturnDisabled =
    returnSubmitting || authLoading || !canRequestReturn || (isAuthenticated && !canUseBorrowingActions);
  const canReserve =
    Boolean(book && !book.available && !hasPendingRequest && !isBorrowedByUser);
  const isReserveDisabled =
    reservationSubmitting || authLoading || !canReserve || (isAuthenticated && !canUseBorrowingActions);

  let borrowLabel = 'Request Borrow';
  if (borrowSubmitting) {
    borrowLabel = 'Submitting...';
  } else if (!book?.available) {
    borrowLabel = 'Not Available';
  } else if (isBorrowedByUser) {
    borrowLabel = 'Already Borrowed';
  } else if (hasPendingRequest) {
    borrowLabel = 'Request Pending';
  } else if (isAuthenticated && !canUseBorrowingActions) {
    borrowLabel = 'Students/Teachers Only';
  } else if (!isAuthenticated) {
    borrowLabel = 'Sign in to Request';
  }

  let returnLabel = 'Request Return';
  if (returnSubmitting) {
    returnLabel = 'Submitting...';
  } else if (hasPendingReturnRequest) {
    returnLabel = 'Return Pending';
  } else if (isAuthenticated && !canUseBorrowingActions) {
    returnLabel = 'Students/Teachers Only';
  } else if (!isAuthenticated) {
    returnLabel = 'Sign in to Return';
  }

  let reserveLabel = 'Reserve Book';
  if (reservationSubmitting) {
    reserveLabel = 'Submitting...';
  } else if (hasPendingRequest) {
    reserveLabel = 'Borrow Pending';
  } else if (!book?.available && !isAuthenticated) {
    reserveLabel = 'Sign in to Reserve';
  } else if (isAuthenticated && !canUseBorrowingActions) {
    reserveLabel = 'Students/Teachers Only';
  }

  const hasStatusMessage = Boolean(
    borrowError || borrowMessage || returnError || returnMessage || reservationError || reservationMessage
  );
  const heroCategoryLabel = loading ? 'UNCATEGORIZED' : featuredCategory.toUpperCase();
  const heroStatusLabel = loading || !book ? 'LOADING' : book.available ? 'AVAILABLE' : 'BORROWED';
  const heroStatusChipClass =
    loading || !book
      ? 'border-line bg-white/80 text-ink-muted'
      : book.available
        ? 'border-emerald-300/40 bg-emerald-100 text-emerald-700'
        : 'border-amber-300/40 bg-amber-100 text-amber-800';
  const heroStatusDotClass =
    loading || !book
      ? 'bg-slate-300'
      : book.available
        ? 'bg-emerald-400'
        : 'bg-amber-400';
  const availabilityBadgeClass = book?.available
    ? 'border-emerald-300/40 bg-emerald-100 text-emerald-700'
    : 'border-amber-300/40 bg-amber-100 text-amber-800';
  const availabilityMessage = book
    ? book.available
      ? `${availableCopies} of ${totalCopies} copies are currently available.`
      : 'All copies are currently borrowed. You can place a reservation to join the queue.'
    : 'Review availability and borrowing information for this title.';
  const actionHelperText = !isAuthenticated
    ? 'Sign in with a student or teacher account to borrow or return this title.'
    : !canUseBorrowingActions
      ? 'Only student and teacher accounts can submit borrow, return, and reservation requests.'
      : isTeacher
        ? 'Teacher borrows have no due date limit, but weekly or monthly reporting is required.'
      : isBorrowedByUser
        ? 'This book is currently borrowed by you. Submit a return request when ready.'
        : book?.available
          ? 'Submit a borrow request and the library team will review it soon.'
          : 'This title is unavailable right now. Submit a reservation to join the queue.';

  return (
    <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main className="pt-14 sm:pt-16">
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 right-[-4rem] h-80 w-80 rounded-full bg-sky-300/18 blur-3xl" />
            <div className="absolute -bottom-24 left-[-5rem] h-72 w-72 rounded-full bg-amber-300/16 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(126,191,231,0.16),transparent_42%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
            <Link
              href="/books"
              className="inline-flex items-center text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to catalog
            </Link>
            <div className="mt-3 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3 animate-fade-up">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--accent-cool-strong)]/80">
                  Book Profile
                </p>
                <h1 className="text-4xl font-semibold text-balance text-ink sm:text-5xl">
                  {book?.title ?? 'Book Details'}
                </h1>
                <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
                  Review metadata, availability, and borrowing actions for this title in one clean and
                  focused layout.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-50 px-4 py-3 shadow-[0_14px_30px_rgba(217,175,88,0.12)]">
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-strong)]/85">
                        Reader rating
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <RatingStars rating={averageRating} />
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-ink">
                            {hasRatings ? `${averageRating.toFixed(1)} out of 5` : 'No ratings yet'}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {hasRatings ? reviewCountLabel : 'Be the first to review this title.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <a
                    href="#reviews"
                    className="inline-flex items-center rounded-full border border-line bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:bg-white hover:text-ink"
                  >
                    Jump to reviews
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                  <span className="inline-flex max-w-[11.5rem] items-center rounded-full border border-line bg-white/80 px-5 py-2 text-ink">
                    <span className="truncate">{heroCategoryLabel}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 ${heroStatusChipClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${heroStatusDotClass}`} />
                    <span>{heroStatusLabel}</span>
                  </span>
                </div>
                <p className="text-xs font-medium text-ink-muted">
                  Copies {loading ? '...' : `${availableCopies}/${totalCopies}`}
                </p>
              </div>

              <div className="public-panel self-start animate-fade-up delay-100 rounded-[26px] backdrop-blur-xl p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-cool-strong)]/80">
                  At a glance
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="public-panel-soft rounded-2xl px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Available
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-ink">
                      {loading ? '...' : availableCopies}
                    </p>
                  </div>
                  <div className="public-panel-soft rounded-2xl px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Total
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{loading ? '...' : totalCopies}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Availability</span>
                    <span className="font-semibold text-ink">
                      {loading ? 'Loading...' : `${availabilityPercent}%`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        book?.available ? 'bg-sky-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${loading ? 42 : availabilityPercent}%` }}
                    />
                  </div>
                </div>
                <div className="public-panel-soft mt-4 rounded-2xl px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Rating
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {hasRatings ? `${averageRating.toFixed(1)} / 5` : 'No ratings yet'}
                      </p>
                    </div>
                    <p className="text-xs text-ink-muted">{hasRatings ? reviewCountLabel : '0 reviews'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <RatingStars rating={averageRating} className="h-3.5 w-3.5" />
                    <a
                      href="#reviews"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)] transition-colors hover:text-[color:var(--accent)]"
                    >
                      Open reviews
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-6 pb-12 sm:-mt-8 sm:pb-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="public-panel rounded-[30px] backdrop-blur-xl p-4 sm:p-6 lg:p-8">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              </div>
            )}

            {!loading && error && (
              <div className="py-12 text-center">
                <h2 className="text-2xl font-semibold text-ink">{error}</h2>
                <p className="mt-2 text-ink-muted">Please choose another book from the catalog.</p>
                <Link
                  href="/books"
                  className="mt-6 inline-flex items-center rounded-full bg-[color:var(--accent)] px-5 py-2.5 font-semibold text-[#17314e] transition-colors hover:bg-[color:var(--accent-strong)]"
                >
                  Browse collection
                </Link>
              </div>
            )}

            {!loading && !error && book && (
              <div className="grid gap-5 lg:grid-cols-[minmax(190px,0.58fr)_minmax(0,1.42fr)] xl:gap-6">
                <aside className="lg:pr-0">
                  <div className="space-y-5 lg:sticky lg:top-24">
                    <div className="public-panel-soft rounded-[26px] p-4">
                      <div 
                        className="group relative mx-auto aspect-[3/4] max-w-[210px] overflow-visible rounded-[18px] [perspective:2000px] flex items-center justify-center sm:max-w-[225px] lg:max-w-[200px] xl:max-w-[215px]"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div 
                          className="relative h-full w-full cursor-pointer transition-transform duration-500 ease-out [transform-style:preserve-3d]"
                          style={{
                            transformOrigin: 'center center',
                            transform: effectiveCoverSide === 'back' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                          }}
                          onClick={() => {
                            if (hasBackCover) {
                              setCoverState({ 
                                bookId: resolvedBookId, 
                                side: effectiveCoverSide === 'front' ? 'back' : 'front' 
                              });
                            }
                          }}
                        >
                          {/* Front Cover */}
                          <div className="absolute inset-0 overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_10px_24px_rgba(31,53,84,0.16)] [backface-visibility:hidden]">
                            {coverUrl ? (
                              <Image
                                src={coverUrl}
                                alt={`${book.title} front cover`}
                                fill
                                sizes="(min-width: 1280px) 215px, (min-width: 1024px) 200px, (min-width: 640px) 225px, 210px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-16 w-16 text-ink-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Back Cover */}
                          {hasBackCover && (
                            <div className="absolute inset-0 overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_10px_24px_rgba(31,53,84,0.16)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                              {coverBackUrl ? (
                                <Image
                                  src={coverBackUrl}
                                  alt={`${book.title} back cover`}
                                  fill
                                  sizes="(min-width: 1280px) 215px, (min-width: 1024px) 200px, (min-width: 640px) 225px, 210px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <svg className="h-16 w-16 text-ink-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="public-panel-soft mt-4 rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <span>Available copies</span>
                          <span className="font-semibold text-ink">
                            {availableCopies} / {totalCopies}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              book.available ? 'bg-sky-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${availabilityPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-center text-sm text-ink-muted">
                        {hasBackCover ? 'Click book to flip' : 'Front cover only'}
                      </div>
                    </div>

                    <div className="public-panel-soft rounded-2xl px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-cool-strong)]/80">
                        Book facts
                      </p>
                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white/82 px-3 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                            Published
                          </span>
                          <span className="text-right text-sm font-semibold text-ink">{publishedLabel}</span>
                        </div>
                        <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white/82 px-3 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                            Language
                          </span>
                          <span className="text-right text-sm font-semibold text-ink">{languageLabel}</span>
                        </div>
                        <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white/82 px-3 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                            Grade level
                          </span>
                          <span className="text-right text-sm font-semibold text-ink">{gradeLevelLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="public-panel-soft rounded-2xl px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-cool-strong)]/80">
                        Friendly note
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{actionHelperText}</p>
                    </div>
                  </div>
                </aside>

                <div className="space-y-6 lg:max-w-[48rem] xl:max-w-[50rem]">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${availabilityBadgeClass}`}
                      >
                        {book.available ? 'Available now' : 'Currently borrowed'}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-line bg-white/80 px-3 py-1 text-sm font-medium text-ink">
                        {featuredCategory}
                      </span>
                      {remainingCategoryCount > 0 && (
                        <span className="inline-flex items-center rounded-full border border-line bg-white/72 px-3 py-1 text-sm font-medium text-ink-muted">
                          +{remainingCategoryCount} more
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-cool-strong)]/80">
                        {book.author || 'Unknown author'}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{book.title}</h2>
                      <p className="mt-4 max-w-xl text-sm text-ink-muted sm:text-base">
                        {availabilityMessage}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="public-panel-soft rounded-2xl px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                        ISBN
                      </p>
                      <p className="mt-1 break-all text-base font-semibold text-ink">{isbnLabel}</p>
                    </div>
                    <div className="public-panel-soft rounded-2xl px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                        Shelf
                      </p>
                      <p className="mt-1 text-base font-semibold text-ink">{shelfLabel}</p>
                    </div>
                  </div>

                  <div className="public-panel-soft rounded-[22px] p-4 sm:p-5">
                    <h3 className="text-xl font-semibold text-ink">Collection details</h3>
                    <p className="mt-2 text-sm text-ink-muted">
                      Explore category placement and current shelf status before sending a request.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                          Categories
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2" title={categoriesLabel}>
                          {displayCategories.map((category, index) => (
                            <span
                              key={`${category}-${index}`}
                              className="inline-flex items-center rounded-full border border-line bg-white/82 px-3 py-1 text-xs font-semibold text-ink"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="public-panel-soft rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between text-sm text-ink-muted">
                          <span>Availability progress</span>
                          <span className="font-semibold text-ink">{availabilityPercent}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              book.available ? 'bg-sky-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${availabilityPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="public-panel-soft rounded-[22px] px-4 py-5 sm:px-5">
                    <h3 className="text-lg font-semibold text-ink">Borrowing actions</h3>
                    <p className="mt-1 text-sm text-ink-muted">{actionHelperText}</p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      {isBorrowedByUser ? (
                        <button
                          type="button"
                          className={`flex-1 rounded-full px-6 py-3 font-semibold transition-all duration-400 ${
                            isReturnDisabled
                              ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                              : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] shadow-[0_14px_40px_-12px_rgba(30,58,95,0.35)]'
                          }`}
                          disabled={isReturnDisabled}
                          onClick={handleReturnRequest}
                        >
                          <span className="inline-block transition-all duration-400 hover:pr-14 relative">
                            {returnLabel}
                            <span className="absolute opacity-0 top-0 -right-5 transition-all duration-700 hover:opacity-100 hover:right-0">now</span>
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`flex-1 rounded-full px-6 py-3 font-semibold transition-all duration-400 ${
                            isBorrowDisabled
                              ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                              : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] shadow-[0_14px_40px_-12px_rgba(30,58,95,0.35)]'
                          }`}
                          disabled={isBorrowDisabled}
                          onClick={handleBorrowRequest}
                        >
                          <span className="inline-block transition-all duration-400 hover:pr-14 relative">
                            {borrowLabel}
                            <span className="absolute opacity-0 top-0 -right-5 transition-all duration-700 hover:opacity-100 hover:right-0">now</span>
                          </span>
                        </button>
                      )}
                      {!isBorrowedByUser && !book.available && (
                        <button
                          type="button"
                          className={`flex-1 rounded-full px-6 py-3 font-semibold transition-all duration-400 ${
                            isReserveDisabled
                              ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                              : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] shadow-[0_14px_40px_-12px_rgba(30,58,95,0.35)]'
                          }`}
                          disabled={isReserveDisabled}
                          onClick={handleReserveRequest}
                        >
                          {reserveLabel}
                        </button>
                      )}
                      <Link
                        href="/books"
                        className="flex-1 rounded-full border border-line bg-white/72 px-6 py-3 text-center font-semibold text-ink transition-colors hover:bg-white"
                      >
                        Browse more
                      </Link>
                    </div>
                  </div>

                  {hasStatusMessage && (
                    <div className="space-y-2">
                      {borrowError && (
                        <div className="rounded-2xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {borrowError}
                        </div>
                      )}
                      {borrowMessage && (
                        <div className="rounded-2xl border border-sky-300/30 bg-sky-50 px-4 py-3 text-sm text-[color:var(--accent-cool-strong)]">
                          <p>{borrowMessage}</p>
                          {isStudentBorrower && borrowSlipData && (
                            <button
                              type="button"
                              onClick={() => setShowBorrowSlip(true)}
                              className="mt-3 inline-flex rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-white"
                            >
                              View Borrow Slip
                            </button>
                          )}
                        </div>
                      )}
                      {returnError && (
                        <div className="rounded-2xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {returnError}
                        </div>
                      )}
                      {returnMessage && (
                        <div className="rounded-2xl border border-sky-300/30 bg-sky-50 px-4 py-3 text-sm text-[color:var(--accent-cool-strong)]">
                          {returnMessage}
                        </div>
                      )}
                      {reservationError && (
                        <div className="rounded-2xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {reservationError}
                        </div>
                      )}
                      {reservationMessage && (
                        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {reservationMessage}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="public-panel-soft rounded-[22px] px-4 py-5 sm:px-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-cool-strong)]/80">
                      Description
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-muted sm:text-base">
                      {book.description?.trim() || 'No description has been added for this book yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="public-panel rounded-[30px] p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-cool-strong)]/65">
                    Next reads
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">Similar books to explore</h3>
                  <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                    Suggestions are ranked from shared categories, author overlap, reader activity, and live availability.
                  </p>
                </div>
                <Link
                  href="/books"
                  className="inline-flex items-center rounded-full border border-line bg-white/72 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white"
                >
                  Browse catalog
                </Link>
              </div>

              {recommendationsLoading ? (
                <div className="mt-8 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                </div>
              ) : recommendationsError ? (
                <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Recommendations are unavailable right now: {recommendationsError}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="mt-6 rounded-[1.6rem] border border-dashed border-line bg-white/70 px-5 py-8 text-center">
                  <p className="text-ink-muted">No similar titles are ready yet for this book.</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recommendations.map((item) => {
                    const recommendation = item.book;
                    const recommendationCategories =
                      recommendation.categories?.map((category) => category.name).filter(Boolean) ?? [];
                    const recommendationLabel =
                      recommendationCategories[0] || recommendation.genre || 'General collection';
                    const recommendationRating = recommendation.average_rating ?? 0;
                    const recommendationReviews = recommendation.review_count ?? 0;

                    return (
                      <Link
                        key={recommendation.id}
                        href={`/books/${recommendation.id}`}
                        className="public-panel-soft group rounded-[1.6rem] p-5 transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex rounded-full border border-line bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                            {recommendationLabel}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              recommendation.available
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {recommendation.available ? 'Available' : 'In demand'}
                          </span>
                        </div>

                        <h4 className="mt-4 text-lg font-semibold text-ink transition-colors group-hover:text-[color:var(--accent-cool-strong)]">
                          {recommendation.title}
                        </h4>
                        <p className="mt-1 text-sm text-ink-muted">{recommendation.author}</p>
                        <p className="mt-4 text-sm leading-6 text-ink-muted">{item.reason}</p>

                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted/80">
                              Reader rating
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <RatingStars rating={recommendationRating} className="h-3.5 w-3.5" />
                              <span className="text-xs text-ink-muted">
                                {recommendationReviews > 0
                                  ? `${recommendationRating.toFixed(1)} from ${recommendationReviews} review${recommendationReviews === 1 ? '' : 's'}`
                                  : 'No reviews yet'}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[color:var(--accent-cool-strong)] transition-colors group-hover:text-ink">
                            Open
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="scroll-mt-24 pb-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="public-panel rounded-[30px] backdrop-blur-xl p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setReviewsExpanded((prev) => !prev)}
                  className="flex flex-1 items-center justify-between rounded-2xl border border-line bg-white/78 px-4 py-3 text-left transition-colors hover:bg-white"
                  aria-expanded={reviewsExpanded}
                  aria-controls="reviews-panel"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-ink">
                      Reviews ({reviews.length})
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {reviewsExpanded ? 'Hide review details' : 'Show review details'}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-ink-muted transition-transform duration-300 ${
                      reviewsExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isAuthenticated && !showReviewForm && !userReview && (
                  <button
                    onClick={() => {
                      setReviewsExpanded(true);
                      setShowReviewForm(true);
                    }}
                    className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent-strong)]"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              <div
                id="reviews-panel"
                className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
                  reviewsExpanded ? 'mt-6 grid-rows-[1fr] opacity-100' : 'mt-2 grid-rows-[0fr] opacity-0'
                }`}
                aria-hidden={!reviewsExpanded}
              >
                <div className="min-h-0 overflow-hidden">
              {/* Review Form */}
              {showReviewForm && (
                <div className="public-panel-soft rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-ink">
                    {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                  </h4>
                  
                  {/* Star Rating Selector */}
                  <div className="mt-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Your Rating
                    </label>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="text-2xl transition-transform hover:scale-110"
                        >
                          {star <= reviewForm.rating ? (
                            <span className="text-amber-400">★</span>
                          ) : (
                            <span className="text-slate-300">☆</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="mt-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Your Review (optional)
                    </label>
                    <textarea
                      value={reviewForm.reviewText}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                      placeholder="Share your thoughts about this book..."
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
                    />
                  </div>

                  {/* Error Message */}
                  {reviewError && (
                    <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                      {reviewError}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={cancelReviewForm}
                      className="rounded-full border border-line bg-white/72 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || reviewForm.rating === 0}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        reviewSubmitting || reviewForm.rating === 0
                          ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                          : 'bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-strong)]'
                      }`}
                    >
                      {reviewSubmitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}

              {/* User's Existing Review */}
              {userReview && !showReviewForm && (
                <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-50 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]/85">
                        Your Review
                      </p>
                      <div className="mt-1 text-lg">
                        {'★'.repeat(userReview.rating)}{'☆'.repeat(5 - userReview.rating)}
                      </div>
                      {userReview.review_text && (
                        <p className="mt-2 text-sm text-ink-muted">{userReview.review_text}</p>
                      )}
                      <p className="mt-2 text-xs text-ink-muted">
                        Posted on {new Date(userReview.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startEditReview}
                        className="rounded-full border border-line bg-white/72 px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        className="rounded-full border border-rose-300/30 px-3 py-1 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="mt-8 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="mt-8 text-center text-ink-muted">
                  <p>No reviews yet. Be the first to review this book!</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviews
                    .filter((r) => !user || r.user.id !== user.id)
                    .map((review) => (
                      <div key={review.id} className="public-panel-soft rounded-2xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-ink">
                              {review.user.full_name || review.user.username}
                            </p>
                            <div className="mt-1 text-sm">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          <span className="text-xs text-ink-muted">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.review_text && (
                          <p className="mt-2 text-sm text-ink-muted">{review.review_text}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {showBorrowModal && isTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(237,245,255,0.98)_100%)] shadow-2xl">
              <div className="border-b border-line px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-cool-strong)]/80">
                  Teacher Borrow Request
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Set reporting schedule</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Teacher loans do not get a due date. Choose how often this borrow must be
                  reported after approval.
                </p>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div className="rounded-2xl border border-indigo-300/25 bg-indigo-50 px-4 py-4 text-sm text-ink-muted">
                  <p className="font-semibold text-indigo-700">Teacher borrowing rules</p>
                  <p className="mt-2">
                    No day/time limit will be assigned. The borrower must submit a periodic report
                    every week or month while the book remains borrowed.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(['WEEKLY', 'MONTHLY'] as const).map((frequency) => (
                    <button
                      key={frequency}
                      type="button"
                      onClick={() => setTeacherReportingFrequency(frequency)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${
                        teacherReportingFrequency === frequency
                          ? 'border-indigo-300 bg-indigo-100'
                          : 'border-line bg-white/80 hover:border-indigo-300/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {frequency === 'WEEKLY' ? 'Weekly report' : 'Monthly report'}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {frequency === 'WEEKLY'
                              ? 'Teacher submits a check-in every 7 days.'
                              : 'Teacher submits a check-in every 30 days.'}
                          </p>
                        </div>
                        {teacherReportingFrequency === frequency && (
                          <svg className="h-6 w-6 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="rounded-full border border-line bg-white/72 px-6 py-3 font-semibold text-ink transition-colors hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBorrowRequest}
                  disabled={borrowSubmitting}
                  className={`rounded-full px-6 py-3 font-semibold transition-colors ${
                    borrowSubmitting
                      ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                      : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'
                  }`}
                >
                  {borrowSubmitting ? 'Submitting...' : 'Submit teacher borrow'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBorrowModal && !isTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(237,245,255,0.98)_100%)] shadow-2xl">
              <div className="border-b border-line px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-cool-strong)]/80">
                  Student Borrowing Form
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  Library Management System Borrowing Form
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Borrower details are pulled from the signed-in account and library records so
                  students cannot edit them here.
                </p>
              </div>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
                <section className="public-panel-soft rounded-2xl p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-cool-strong)]/80">
                    Borrower Information
                  </h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Full Name
                      </label>
                      <StaticBorrowField
                        value={studentDisplayName}
                        fallback="Name not available on account"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Borrower Type
                      </label>
                      <input
                        value="Student"
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Student ID Number
                      </label>
                      <StaticBorrowField
                        value={studentDisplayId}
                        fallback="Student ID not available on account"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Course or Program
                      </label>
                      <StaticBorrowField
                        value={studentDisplayProgram}
                        fallback="Program not available in enrollment record"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Year/Level
                      </label>
                      <StaticBorrowField
                        value={studentDisplayYearLevel}
                        fallback="Year level not available in enrollment record"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Contact Number
                      </label>
                      <StaticBorrowField
                        value={studentDisplayContactNumber}
                        fallback="Not available in account record"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Email Address
                      </label>
                      <StaticBorrowField
                        value={studentDisplayEmail}
                        fallback="Email not available on account"
                      />
                    </div>
                  </div>
                </section>

                <section className="public-panel-soft rounded-2xl p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-cool-strong)]/80">
                    Book Information
                  </h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Book Title
                      </label>
                      <input
                        value={book?.title ?? ''}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Author
                      </label>
                      <input
                        value={book?.author ?? ''}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        ISBN
                      </label>
                      <input
                        value={book?.isbn ?? ''}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Call Number
                      </label>
                      <StaticBorrowField
                        value={studentDisplayCallNumber}
                        fallback="Assigned by library staff"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Accession Number
                      </label>
                      <StaticBorrowField
                        value={studentDisplayAccessionNumber}
                        fallback="Assigned after librarian approval"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Quantity Borrowed
                      </label>
                      <input
                        value={studentBorrowForm.quantity}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Date Borrowed
                      </label>
                      <input
                        value={borrowedDateInput}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Due Date
                      </label>
                      <input
                        value={dueDateInput}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        Return Date
                      </label>
                      <input
                        type="date"
                        value={dueDateInput}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-line bg-white/85 px-3 py-2 text-sm text-ink"
                      />
                    </div>
                  </div>
                </section>

                <section className="public-panel-soft rounded-2xl p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-cool-strong)]/80">
                    Borrow Duration
                  </h4>
                  <p className="mt-2 text-sm text-ink-muted">
                    Select how many days you need this book. You&apos;ll receive a reminder before the due date.
                  </p>
                  <div className="mt-4 space-y-3">
                    {borrowDayOptions.map((days) => (
                      <button
                        key={days}
                        onClick={() => setBorrowDays(days)}
                        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                          borrowDays === days
                            ? 'border-sky-300 bg-sky-100'
                            : 'border-line bg-white/80 hover:border-sky-300/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-ink">
                              {days} {days === 1 ? 'Day' : 'Days'}
                            </p>
                            <p className="text-xs text-ink-muted">
                              Estimated due date: {getEstimatedDueDateLabel(days)}
                            </p>
                          </div>
                          {borrowDays === days && (
                            <svg className="h-6 w-6 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="public-panel-soft rounded-2xl p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-cool-strong)]/80">
                    Borrowing Agreement
                  </h4>
                  <p className="mt-3 text-sm text-ink-muted">
                    I acknowledge receipt of the book(s) listed above and agree to comply with library
                    policies. I will return all borrowed materials on or before the due date and accept
                    responsibility for any loss, damage, or overdue penalties as required by library
                    regulations.
                  </p>
                  <label className="mt-4 flex items-start gap-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={studentBorrowForm.agreementAccepted}
                      onChange={(event) =>
                        handleStudentBorrowFormChange('agreementAccepted', event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-line bg-white text-sky-400 focus:ring-sky-300/40"
                    />
                    I agree to the borrowing policies above.
                  </label>
                </section>
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row">
                <button
                  onClick={() => setShowBorrowModal(false)}
                  className="flex-1 rounded-full border border-line bg-white/72 px-6 py-3 font-semibold text-ink transition-colors hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBorrowRequest}
                  disabled={borrowSubmitting || !studentBorrowForm.agreementAccepted}
                  className={`flex-1 rounded-full px-6 py-3 font-semibold transition-colors ${
                    borrowSubmitting || !studentBorrowForm.agreementAccepted
                      ? 'cursor-not-allowed bg-white/72 text-ink-muted/70'
                      : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'
                  }`}
                >
                  Confirm Request
                </button>
              </div>
            </div>
          </div>
        )}

        {showBorrowSlip && borrowSlipData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-white shadow-2xl">
              <button
                onClick={() => setShowBorrowSlip(false)}
                className="no-print absolute right-4 top-4 z-10 rounded-full bg-[color:var(--ink)] p-2 text-white hover:bg-[#24496d]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <BorrowSlip
                studentName={borrowSlipData.studentName}
                studentId={borrowSlipData.studentId}
                courseYear={borrowSlipData.courseYear}
                bookTitle={borrowSlipData.bookTitle}
                author={borrowSlipData.author}
                callNumber={borrowSlipData.callNumber}
                dateBorrowed={borrowSlipData.dateBorrowed}
                dueDate={borrowSlipData.dueDate}
                receiptNumber={latestProcessedBorrowRequest?.receipt_number}
                librarianName={librarianVerificationName}
                approvedDate={librarianVerificationDate}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
