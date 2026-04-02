import logging
import secrets
import string
import re
import hashlib
import math
from datetime import datetime, timedelta
from urllib.parse import urlencode
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .enrollment_import import EnrollmentImportError, get_enrollment_summary, import_enrollment_csv_file
from .email_delivery import get_email_config_error, send_email_message
from .models import (
    PasswordResetCode,
    ContactMessage,
    Notification,
    EmailVerificationCode,
    LoginOTPCode,
)
from .registration_rules import get_identifier_status

from .serializers import (
    UserSerializer,
    ProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    PasswordResetConfirmSerializer,
    ContactMessageSerializer,
    NotificationSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)
OTP_CHALLENGE_SALT = 'user.login_otp.challenge'
LOGIN_OTP_PURPOSE = 'otp_challenge'
REGISTRATION_OTP_PURPOSE = 'registration_otp'
REGISTRATION_SESSION_CACHE_PREFIX = 'auth.registration_session'
LOGIN_FAILURE_CACHE_PREFIX = 'auth.login_fail'
LOGIN_LOCK_CACHE_PREFIX = 'auth.login_lock'

PORTAL_ROLE_MAP = {
    'student': {'STUDENT', 'WORKING'},
    'teacher': {'TEACHER'},
    'librarian': {'LIBRARIAN', 'ADMIN'},
    'staff': {'STAFF', 'WORKING', 'ADMIN'},
}
REGISTRABLE_ACCOUNT_ROLES = {'STUDENT', 'TEACHER'}
PENDING_ACCOUNT_ROLES = {'STUDENT', 'TEACHER'}


def format_email_delivery_error(message_prefix: str, exc: Exception) -> str:
    raw_message = re.sub(r'\s+', ' ', str(exc or '')).strip()
    lowered = raw_message.lower()

    if 'resend' in lowered:
        if 'own email address' in lowered or 'testing' in lowered:
            return (
                f"{message_prefix} Resend is still in testing mode. "
                "Verify your domain in Resend and set RESEND_FROM_EMAIL to that verified sender."
            )
        if 'invalid api key' in lowered or 'status 401' in lowered or 'unauthorized' in lowered:
            return (
                f"{message_prefix} Resend rejected the API key. "
                "Update RESEND_API_KEY in Render and redeploy."
            )
        if 'from' in lowered or 'sender' in lowered or 'status 403' in lowered or 'status 422' in lowered:
            return (
                f"{message_prefix} Resend rejected the sender address. "
                "RESEND_FROM_EMAIL must be a verified sender in Resend."
            )
        return f"{message_prefix} Resend could not accept the email request. Check the Render logs for details."

    if 'email bridge' in lowered:
        if 'missing required environment variable:' in lowered:
            match = re.search(r'Missing required environment variable:\s*([A-Z0-9_]+)', raw_message)
            missing_var = match.group(1) if match else 'an email bridge variable'
            return (
                f"{message_prefix} Vercel is missing `{missing_var}`. "
                "Add it to the frontend environment variables and redeploy Vercel."
            )
        if 'gmail authentication failed' in lowered:
            return (
                f"{message_prefix} Gmail login failed in the Vercel bridge. "
                "Check MAILER_GMAIL_USER and MAILER_GMAIL_APP_PASSWORD in Vercel."
            )
        if 'sender address was rejected' in lowered:
            return (
                f"{message_prefix} Gmail rejected the sender address. "
                "Check MAILER_FROM_EMAIL and MAILER_FROM_NAME in Vercel."
            )
        if 'gmail sending limit was reached' in lowered:
            return (
                f"{message_prefix} The Gmail account hit its sending limit. "
                "Try again later or use another Gmail account."
            )
        if 'status 401' in lowered or 'unauthorized' in lowered:
            return (
                f"{message_prefix} The email bridge rejected the request. "
                "Check EMAIL_BRIDGE_SECRET on both Render and Vercel."
            )
        if 'failed to reach the email bridge' in lowered:
            return (
                f"{message_prefix} Render could not reach the Vercel email bridge. "
                "Check EMAIL_BRIDGE_URL and confirm the frontend is deployed."
            )
        return f"{message_prefix} The email bridge could not send the message. Check the Vercel logs."

    if settings.DEBUG and raw_message:
        return f"{message_prefix} {raw_message}"

    return f"{message_prefix} Please check the email service configuration and try again."


def is_super_admin(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or getattr(user, 'role', None) == 'ADMIN')
    )


def is_working_student(user) -> bool:
    return bool(user and user.is_authenticated and getattr(user, 'has_working_student_access', lambda: False)())


def has_staff_portal_access(user) -> bool:
    return bool(user and user.is_authenticated and getattr(user, 'has_staff_desk_access', lambda: False)())


def parse_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'yes', 'on'}
    return bool(value)


def can_manage_pending_students(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (
            is_super_admin(user)
            or getattr(user, 'role', None) == 'LIBRARIAN'
            or is_working_student(user)
        )
    )


def can_manage_enrollment_records(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (
            is_super_admin(user)
            or getattr(user, 'role', None) == 'LIBRARIAN'
        )
    )


class CanViewPendingStudents(BasePermission):
    def has_permission(self, request, view):
        return can_manage_pending_students(request.user)


class CanApproveStudents(BasePermission):
    def has_permission(self, request, view):
        return can_manage_pending_students(request.user)


class CanManageEnrollmentRecords(BasePermission):
    def has_permission(self, request, view):
        return can_manage_enrollment_records(request.user)


def normalize_email_value(email: str | None) -> str:
    return (email or '').strip().lower()


def normalize_login_identifier(identifier: str | None) -> str:
    return (identifier or '').strip().lower()


def find_user_by_email(email: str) -> User | None:
    normalized = normalize_email_value(email)
    if not normalized:
        return None
    return User.objects.filter(email__iexact=normalized).first()


def get_client_ip(request) -> str:
    forwarded_for = str(request.META.get('HTTP_X_FORWARDED_FOR', '')).strip()
    if forwarded_for:
        first_ip = forwarded_for.split(',')[0].strip()
        if first_ip:
            return first_ip
    return str(request.META.get('REMOTE_ADDR', '')).strip() or 'unknown'


def make_cache_scope_token(raw_value: str) -> str:
    return hashlib.sha256(raw_value.encode('utf-8')).hexdigest()[:32]


def get_login_cache_keys(request, identifier: str) -> dict[str, str]:
    normalized_identifier = normalize_login_identifier(identifier)
    identifier_token = make_cache_scope_token(normalized_identifier or 'unknown')
    ip_token = make_cache_scope_token(get_client_ip(request))
    return {
        'identifier_failures': f'{LOGIN_FAILURE_CACHE_PREFIX}:identifier:{identifier_token}',
        'ip_failures': f'{LOGIN_FAILURE_CACHE_PREFIX}:ip:{ip_token}',
        'identifier_lock': f'{LOGIN_LOCK_CACHE_PREFIX}:identifier:{identifier_token}',
        'ip_lock': f'{LOGIN_LOCK_CACHE_PREFIX}:ip:{ip_token}',
    }


def get_active_lockout_message(request, identifier: str) -> str | None:
    keys = get_login_cache_keys(request, identifier)
    active_until_values: list[datetime] = []
    now = timezone.now()

    for lock_key in (keys['identifier_lock'], keys['ip_lock']):
        raw_value = cache.get(lock_key)
        if not raw_value:
            continue
        try:
            locked_until = datetime.fromisoformat(str(raw_value))
        except ValueError:
            cache.delete(lock_key)
            continue
        if timezone.is_naive(locked_until):
            locked_until = timezone.make_aware(locked_until, timezone.get_current_timezone())
        if locked_until <= now:
            cache.delete(lock_key)
            continue
        active_until_values.append(locked_until)

    if not active_until_values:
        return None

    locked_until = max(active_until_values)
    remaining_seconds = max(1, int((locked_until - now).total_seconds()))
    remaining_minutes = max(1, math.ceil(remaining_seconds / 60))
    return f'Too many failed login attempts. Try again in {remaining_minutes} minute(s).'


def clear_failed_login_attempts(request, identifier: str) -> None:
    keys = get_login_cache_keys(request, identifier)
    cache.delete_many(
        [
            keys['identifier_failures'],
            keys['ip_failures'],
            keys['identifier_lock'],
            keys['ip_lock'],
        ]
    )


def record_failed_login_attempt(request, identifier: str) -> None:
    keys = get_login_cache_keys(request, identifier)
    limit = max(1, int(getattr(settings, 'LOGIN_FAILURE_LIMIT', 5)))
    window_timeout = max(60, int(getattr(settings, 'LOGIN_FAILURE_WINDOW_MINUTES', 15)) * 60)
    lockout_timeout = max(60, int(getattr(settings, 'LOGIN_LOCKOUT_MINUTES', 15)) * 60)
    locked_until = (timezone.now() + timedelta(seconds=lockout_timeout)).isoformat()

    for failure_key, lock_key in (
        (keys['identifier_failures'], keys['identifier_lock']),
        (keys['ip_failures'], keys['ip_lock']),
    ):
        failures = int(cache.get(failure_key, 0)) + 1
        cache.set(failure_key, failures, timeout=window_timeout)
        if failures >= limit:
            cache.set(lock_key, locked_until, timeout=lockout_timeout)
            cache.delete(failure_key)


def get_registration_session_cache_key(session_id: str) -> str:
    return f'{REGISTRATION_SESSION_CACHE_PREFIX}:{session_id}'


def get_registration_session_timeout_seconds() -> int:
    ttl_minutes = max(
        int(getattr(settings, 'OTP_CHALLENGE_TTL_MINUTES', 30)),
        int(getattr(settings, 'EMAIL_VERIFICATION_CODE_TTL_MINUTES', 15)),
    )
    return max(60, ttl_minutes * 60)


def store_registration_session(state: dict, session_id: str | None = None) -> dict:
    stored_state = dict(state)
    resolved_session_id = str(session_id or stored_state.get('session_id') or secrets.token_urlsafe(32))
    stored_state['session_id'] = resolved_session_id
    cache.set(
        get_registration_session_cache_key(resolved_session_id),
        stored_state,
        timeout=get_registration_session_timeout_seconds(),
    )
    return stored_state


def delete_registration_session(session_id: str | None) -> None:
    resolved_session_id = str(session_id or '').strip()
    if not resolved_session_id:
        return
    cache.delete(get_registration_session_cache_key(resolved_session_id))


def build_otp_challenge_token(user: User) -> str:
    return signing.dumps(
        {
            'purpose': LOGIN_OTP_PURPOSE,
            'user_id': user.id,
            'email': normalize_email_value(user.email),
        },
        salt=OTP_CHALLENGE_SALT,
        compress=True,
    )


def build_registration_otp_challenge_token(state: dict) -> str:
    return signing.dumps(
        {
            'purpose': REGISTRATION_OTP_PURPOSE,
            'session_id': state.get('session_id'),
            'email': normalize_email_value(state.get('email')),
        },
        salt=OTP_CHALLENGE_SALT,
        compress=True,
    )


def decode_otp_session(
    raw_token: str,
    *,
    expired_message: str,
    invalid_message: str,
) -> tuple[dict | None, str | None]:
    token = str(raw_token or '').strip()
    if not token:
        return None, 'Verification session is required.'

    ttl_minutes = int(getattr(settings, 'OTP_CHALLENGE_TTL_MINUTES', 30))
    try:
        payload = signing.loads(
            token,
            salt=OTP_CHALLENGE_SALT,
            max_age=ttl_minutes * 60,
        )
    except SignatureExpired:
        return None, expired_message
    except BadSignature:
        return None, invalid_message

    return payload, None


def resolve_otp_session_context(raw_token: str) -> tuple[dict | None, str | None]:
    payload, challenge_error = decode_otp_session(
        raw_token,
        expired_message='This verification session has expired. Please start again.',
        invalid_message='Invalid verification session. Please start again.',
    )
    if challenge_error:
        return None, challenge_error

    purpose = payload.get('purpose')
    if purpose == LOGIN_OTP_PURPOSE:
        user_id = payload.get('user_id')
        expected_email = normalize_email_value(payload.get('email'))
        if not user_id or not expected_email:
            return None, 'Invalid verification session. Please sign in again.'

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None, 'Account not found. Please sign in again.'

        if normalize_email_value(user.email) != expected_email:
            return None, 'This verification session is no longer valid. Please sign in again.'

        return {'kind': 'user', 'user': user}, None

    if purpose == REGISTRATION_OTP_PURPOSE:
        session_id = str(payload.get('session_id') or '').strip()
        expected_email = normalize_email_value(payload.get('email'))
        if not session_id or not expected_email:
            return None, 'Invalid verification session. Please register again.'

        state = cache.get(get_registration_session_cache_key(session_id))
        if not state:
            return None, 'This verification session has expired. Please register again.'

        if normalize_email_value(state.get('email')) != expected_email:
            return None, 'This verification session is no longer valid. Please register again.'

        return {'kind': 'registration', 'state': dict(state)}, None

    return None, 'Invalid verification session. Please start again.'


def resolve_otp_challenge_user(raw_token: str) -> tuple[User | None, str | None]:
    session_context, challenge_error = resolve_otp_session_context(raw_token)
    if challenge_error:
        return None, challenge_error
    if session_context.get('kind') != 'user':
        return None, 'Invalid verification session. Please sign in again.'
    return session_context['user'], None


def blacklist_user_refresh_tokens(user: User) -> int:
    blacklisted_count = 0
    outstanding_tokens = OutstandingToken.objects.filter(
        user=user,
        expires_at__gt=timezone.now(),
    )
    for token in outstanding_tokens:
        _, created = BlacklistedToken.objects.get_or_create(token=token)
        if created:
            blacklisted_count += 1
    return blacklisted_count


def generate_reset_code() -> str:
    length = getattr(settings, 'PASSWORD_RESET_CODE_LENGTH', 6)
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))


def build_reset_link(email: str, code: str) -> str:
    base_url = getattr(settings, 'PASSWORD_RESET_WEB_URL', '').strip() or 'http://localhost:3000/forgot-password'
    separator = '&' if '?' in base_url else '?'
    query = urlencode(
        {
            'email': email,
            'code': code,
            'source': 'email',
        }
    )
    return f"{base_url}{separator}{query}"


def send_reset_code(email: str, code: str) -> None:
    ttl_minutes = getattr(settings, 'PASSWORD_RESET_CODE_TTL_MINUTES', 15)
    reset_link = build_reset_link(email, code)
    subject = "Password Reset Verification Code"
    body = (
        f"Your verification code is {code}. "
        f"This code will expire in {ttl_minutes} minutes.\n\n"
        f"Reset your password here: {reset_link}\n\n"
        "If you did not request a password reset, you can ignore this email."
    )
    html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Password Reset Verification Code</h2>
          <p>Your verification code is <strong>{code}</strong>.</p>
          <p>This code will expire in {ttl_minutes} minutes.</p>
          <p>
            <a
              href="{reset_link}"
              style="display: inline-block; padding: 12px 18px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;"
            >
              Change Password
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="{reset_link}">{reset_link}</a></p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
    """
    send_email_message(email, subject, body, html_body)


def send_login_otp_code(email: str, code: str) -> None:
    ttl_minutes = getattr(settings, 'LOGIN_OTP_CODE_TTL_MINUTES', 15)
    subject = "Login Verification Code"
    body = (
        f"Your login verification code is {code}. "
        f"This code will expire in {ttl_minutes} minutes.\n\n"
        "If you did not attempt to login, please secure your account immediately."
    )
    html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Login Verification Code</h2>
          <p>Your verification code is <strong style="font-size: 24px; color: #0ea5e9;">{code}</strong>.</p>
          <p>This code will expire in {ttl_minutes} minutes.</p>
          <p>Enter this code to complete your login.</p>
          <p>If you did not attempt to login, please secure your account immediately.</p>
        </div>
    """
    send_email_message(email, subject, body, html_body)


def send_verification_code(email: str, code: str) -> None:
    ttl_minutes = getattr(settings, 'EMAIL_VERIFICATION_CODE_TTL_MINUTES', 15)
    subject = "Email Verification Code"
    body = (
        f"Your email verification code is {code}. "
        f"This code will expire in {ttl_minutes} minutes.\n\n"
        "If you did not request this code, you can ignore this email."
    )
    html_body = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Email Verification Code</h2>
          <p>Your verification code is <strong style="font-size: 24px; color: #0ea5e9;">{code}</strong>.</p>
          <p>This code will expire in {ttl_minutes} minutes.</p>
          <p>Enter this code on the registration page to verify your email address.</p>
          <p>If you did not request this code, you can ignore this email.</p>
        </div>
    """
    send_email_message(email, subject, body, html_body)


def build_otp_challenge_payload(user: User, message: str) -> dict:
    return {
        'requires_otp': True,
        'otp_session': build_otp_challenge_token(user),
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'student_id': user.student_id,
        'staff_id': user.staff_id,
        'message': message,
    }


def create_and_send_login_otp(user: User) -> None:
    if not user.email:
        raise ValueError('No email associated with this account.')

    LoginOTPCode.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())

    code = generate_reset_code()
    otp_code = LoginOTPCode(user=user, email=user.email)
    otp_code.set_code(code)
    otp_code.save()
    send_login_otp_code(user.email, code)


def create_and_send_registration_otp(state: dict) -> dict:
    email = normalize_email_value(state.get('email'))
    if not email:
        raise ValueError('No email associated with this registration session.')

    code = generate_reset_code()
    next_state = dict(state)
    next_state['email'] = email
    next_state['otp_code_hash'] = make_password(code)
    next_state['otp_created_at'] = timezone.now().isoformat()
    next_state['otp_attempt_count'] = 0
    next_state['otp_used_at'] = None
    stored_state = store_registration_session(next_state)
    send_verification_code(email, code)
    return stored_state


def parse_cached_datetime(raw_value: str | None) -> datetime | None:
    if not raw_value:
        return None
    try:
        return datetime.fromisoformat(str(raw_value))
    except ValueError:
        return None


def format_validation_error(exc: ValidationError) -> str:
    if hasattr(exc, 'message_dict') and exc.message_dict:
        first_messages = next(iter(exc.message_dict.values()), None)
        if first_messages:
            return str(first_messages[0])
    if getattr(exc, 'messages', None):
        return str(exc.messages[0])
    return 'Unable to complete registration. Please check your details and try again.'


def build_registration_otp_payload(state: dict, message: str) -> dict:
    return {
        'requires_otp': True,
        'otp_session': build_registration_otp_challenge_token(state),
        'email': state.get('email'),
        'full_name': state.get('full_name'),
        'role': state.get('role'),
        'student_id': state.get('student_id'),
        'staff_id': state.get('staff_id'),
        'message': message,
    }


def finalize_pending_registration(state: dict) -> tuple[User | None, str | None]:
    role = str(state.get('role') or 'STUDENT').strip().upper()
    student_id = (state.get('student_id') or '').strip().upper() or None
    staff_id = (state.get('staff_id') or '').strip().upper() or None
    identifier = staff_id if role == 'TEACHER' else student_id
    password_hash = str(state.get('password_hash') or '').strip()
    email = normalize_email_value(state.get('email'))

    if not identifier or not password_hash or not email:
        return None, 'This registration session is invalid. Please register again.'

    identifier_status = get_identifier_status(role, identifier)
    if not identifier_status.available:
        return None, identifier_status.message

    if User.objects.filter(email__iexact=email).exists():
        return None, 'This email is already registered.'

    user = User(
        username=identifier,
        student_id=student_id if role == 'STUDENT' else None,
        staff_id=staff_id if role == 'TEACHER' else None,
        full_name=state.get('full_name'),
        email=email,
        role=role,
        is_active=False,
        email_verified=True,
    )
    user.password = password_hash

    try:
        with transaction.atomic():
            user.full_clean()
            user.save()
    except ValidationError as exc:
        return None, format_validation_error(exc)
    except IntegrityError:
        return None, 'This registration session is no longer valid. Please register again.'

    return user, None


def get_latest_password_reset_code(user: User, email: str) -> PasswordResetCode | None:
    return (
        PasswordResetCode.objects.filter(user=user, email__iexact=email)
        .order_by('-created_at')
        .first()
    )


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for student and teacher registration.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = 'register'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        config_error = get_email_config_error()
        if config_error:
            return Response(
                {'detail': config_error},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        pending_registration = store_registration_session(
            serializer.build_pending_registration()
        )

        try:
            pending_registration = create_and_send_registration_otp(pending_registration)
        except Exception as exc:
            logger.exception("Failed to send registration OTP email: %s", exc)
            delete_registration_session(pending_registration.get('session_id'))
            return Response(
                {'detail': format_email_delivery_error('Failed to send OTP email.', exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            build_registration_otp_payload(
                pending_registration,
                'Verify your email to finish creating the account. Staff approval will start after email verification.',
            ),
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    API endpoint for user login with student/staff ID or username.
    Authenticates user and returns JWT tokens.
    If email is not verified, requires OTP verification first.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'login'
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        portal = serializer.validated_data.get('portal')
        identifier = serializer.validated_data['student_id'].strip()
        password = serializer.validated_data['password']

        lockout_message = get_active_lockout_message(request, identifier)
        if lockout_message:
            return Response(
                {'detail': lockout_message},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        
        # Find user by student_id, staff_id, or username
        user = (
            User.objects.filter(student_id=identifier).first()
            or User.objects.filter(staff_id=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )
        if not user:
            record_failed_login_attempt(request, identifier)
            return Response(
                {'detail': 'Invalid ID or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        # Check password
        if not user.check_password(password):
            record_failed_login_attempt(request, identifier)
            return Response({
                'detail': 'Invalid ID or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        clear_failed_login_attempts(request, identifier)

        if portal:
            allowed_roles = PORTAL_ROLE_MAP.get(portal, set())
            has_portal_access = (
                has_staff_portal_access(user)
                if portal == 'staff'
                else user.role in allowed_roles
            )
            if allowed_roles and not has_portal_access:
                return Response(
                    {'detail': f"Your account cannot access the {portal} portal."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        
        requires_login_email_verification = (
            user.role in {'STUDENT', 'TEACHER', 'WORKING'}
            and not user.email_verified
            and bool(user.email)
        )
        if requires_login_email_verification:
            return Response(
                build_otp_challenge_payload(
                    user,
                    'Email verification required. OTP will be sent to your email.',
                ),
                status=status.HTTP_200_OK,
            )

        if not user.is_active:
            return Response({
                'detail': 'Account pending approval.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    API endpoint for user logout.
    Blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating user profile.
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    API endpoint for changing user password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        with transaction.atomic():
            user.set_password(serializer.validated_data['new_password'])
            user.save(update_fields=['password'])
            blacklist_user_refresh_tokens(user)

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class CheckStudentIdView(APIView):
    """
    API endpoint to check if a student ID is available.
    """
    permission_classes = [AllowAny]

    def get_response(self, role: str, identifier: str) -> Response:
        identifier_status = get_identifier_status(role, identifier)
        response_status = (
            status.HTTP_400_BAD_REQUEST
            if identifier_status.reason == 'missing_identifier'
            else status.HTTP_200_OK
        )
        return Response(identifier_status.to_dict(), status=response_status)

    def get(self, request):
        student_id = request.query_params.get('student_id', '').strip()
        return self.get_response('STUDENT', student_id)


class CheckAccountIdentifierView(CheckStudentIdView):
    """
    API endpoint to check whether a student or faculty ID is available.
    """

    def get(self, request):
        role = str(request.query_params.get('role', 'STUDENT')).strip().upper()
        if role not in REGISTRABLE_ACCOUNT_ROLES:
            return Response(
                {'detail': 'Invalid registration role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        identifier = str(request.query_params.get('identifier', '')).strip()
        return self.get_response(role, identifier)


class EnrollmentImportView(APIView):
    permission_classes = [IsAuthenticated, CanManageEnrollmentRecords]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(get_enrollment_summary(), status=status.HTTP_200_OK)

    def post(self, request):
        upload = request.FILES.get('file') or request.FILES.get('csv')
        if upload is None:
            return Response(
                {'detail': 'CSV file is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fallback_term = str(request.data.get('academic_term') or '').strip()

        try:
            result = import_enrollment_csv_file(upload, fallback_term=fallback_term)
        except EnrollmentImportError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        summary = get_enrollment_summary()
        return Response(
            {
                'message': 'Enrollment records uploaded successfully.',
                'created_count': result.created_count,
                'updated_count': result.updated_count,
                'skipped_count': result.skipped_count,
                'skipped_rows': result.skipped_rows,
                **summary,
            },
            status=status.HTTP_200_OK,
        )


class PendingAccountsView(APIView):
    """
    List student and teacher accounts awaiting approval.
    """

    permission_classes = [IsAuthenticated, CanViewPendingStudents]

    def get(self, request):
        pending_accounts = User.objects.filter(
            role__in=PENDING_ACCOUNT_ROLES,
            is_active=False,
        ).order_by('date_joined')
        data = UserSerializer(pending_accounts, many=True).data
        return Response({'results': data}, status=status.HTTP_200_OK)


class PendingStudentsView(PendingAccountsView):
    """
    Backward-compatible alias for the pending-accounts endpoint.
    """


class ApproveAccountView(APIView):
    """
    Approve a pending student or teacher account.
    """

    permission_classes = [IsAuthenticated, CanApproveStudents]

    def post(self, request, user_id: int):
        try:
            account = User.objects.get(pk=user_id, role__in=PENDING_ACCOUNT_ROLES)
        except User.DoesNotExist:
            return Response({'detail': 'Pending account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if account.is_active:
            return Response(
                {'detail': 'Account is already active.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mark_as_working_student = parse_bool(request.data.get('is_working_student'))
        if mark_as_working_student and account.role != 'STUDENT':
            return Response(
                {'detail': 'Only student accounts can be approved as working students.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account.is_active = True
        account.is_working_student = mark_as_working_student
        account.save(update_fields=['is_active', 'is_working_student'])
        return Response(UserSerializer(account).data, status=status.HTTP_200_OK)


class ApproveStudentView(ApproveAccountView):
    """
    Backward-compatible alias for the approve-account endpoint.
    """


class RejectAccountView(APIView):
    """
    Reject a pending student or teacher account.
    """

    permission_classes = [IsAuthenticated, CanApproveStudents]

    def post(self, request, user_id: int):
        try:
            account = User.objects.get(pk=user_id, role__in=PENDING_ACCOUNT_ROLES)
        except User.DoesNotExist:
            return Response({'detail': 'Pending account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if account.is_active:
            return Response(
                {'detail': 'Cannot reject an active account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete the account
        account_info = {
            'id': account.id,
            'full_name': account.full_name,
            'email': account.email,
            'role': account.role,
        }
        account.delete()
        
        return Response(
            {
                'message': 'Account rejected and removed.',
                'account': account_info,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """
    Request a short reset code for the given email address.
    """

    permission_classes = [AllowAny]
    throttle_scope = 'password_reset_request'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = find_user_by_email(email)
        ttl_minutes = int(getattr(settings, 'PASSWORD_RESET_CODE_TTL_MINUTES', 15))
        code_length = int(getattr(settings, 'PASSWORD_RESET_CODE_LENGTH', 6))
        allow_debug_fallback = bool(
            getattr(settings, 'DEBUG', False)
            and getattr(settings, 'PASSWORD_RESET_DEBUG_RETURN_CODE', False)
        )
        success_payload = {
            'message': 'If that email is registered, a reset code has been sent.',
            'code_length': code_length,
            'expires_in_minutes': ttl_minutes,
        }

        if not user:
            return Response(
                success_payload,
                status=status.HTTP_200_OK,
            )

        message = 'A reset code has been sent to your email address.'

        config_error = get_email_config_error()
        if config_error:
            if not allow_debug_fallback:
                return Response(
                    {'detail': config_error},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            logger.warning("Email config missing. Using debug password reset code fallback: %s", config_error)

        # Invalidate any previous outstanding codes for this user.
        user.password_reset_codes.filter(used_at__isnull=True).update(used_at=timezone.now())

        code = generate_reset_code()
        reset_code = PasswordResetCode(
            user=user,
            email=email,
        )
        reset_code.set_code(code)
        reset_code.save()
        if config_error:
            return Response(
                {
                    'message': 'Email service unavailable. Using debug reset code for local development.',
                    'code': code,
                    'code_length': code_length,
                    'expires_in_minutes': ttl_minutes,
                    'email_delivery': 'debug_fallback',
                },
                status=status.HTTP_200_OK,
            )

        try:
            send_reset_code(email, code)
        except Exception as exc:
            logger.exception("Failed to send reset email: %s", exc)
            if not allow_debug_fallback:
                detail = format_email_delivery_error('Failed to send reset email.', exc)
                return Response({'detail': detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(
                {
                    'message': 'Email delivery failed. Using debug reset code for local development.',
                    'code': code,
                    'code_length': code_length,
                    'expires_in_minutes': ttl_minutes,
                    'email_delivery': 'debug_fallback',
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'message': message,
                'code_length': code_length,
                'expires_in_minutes': ttl_minutes,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm the reset code and set a new password.
    """

    permission_classes = [AllowAny]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        submitted_code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        user = find_user_by_email(email)
        if not user:
            return Response(
                {'detail': 'Invalid reset code or email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_code = get_latest_password_reset_code(user, email)
        if not reset_code:
            return Response(
                {'detail': 'No reset request found. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_attempts = int(getattr(settings, 'PASSWORD_RESET_MAX_ATTEMPTS', 5))

        if reset_code.is_used:
            return Response(
                {'detail': 'This reset code has already been used. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_code.is_expired or reset_code.attempt_count >= max_attempts:
            if not reset_code.is_used:
                reset_code.used_at = timezone.now()
                reset_code.save(update_fields=['used_at'])
            return Response(
                {'detail': 'This reset code has expired. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reset_code.matches(submitted_code):
            reset_code.attempt_count += 1
            if reset_code.attempt_count >= max_attempts:
                reset_code.used_at = timezone.now()
                reset_code.save(update_fields=['attempt_count', 'used_at'])
            else:
                reset_code.save(update_fields=['attempt_count'])
            return Response(
                {'detail': 'Invalid reset code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=['password'])
            reset_code.mark_used()
            user.password_reset_codes.filter(used_at__isnull=True).exclude(pk=reset_code.pk).update(
                used_at=timezone.now()
            )
            blacklist_user_refresh_tokens(user)

        return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)


class PasswordResetVerifyView(APIView):
    """
    Validate a reset code before allowing a password change.
    """

    permission_classes = [AllowAny]
    throttle_scope = 'password_reset_verify'

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        submitted_code = serializer.validated_data['code']
        user = find_user_by_email(email)
        if not user:
            return Response(
                {'detail': 'Invalid reset code or email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_code = get_latest_password_reset_code(user, email)
        if not reset_code:
            return Response(
                {'detail': 'No reset request found. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_attempts = int(getattr(settings, 'PASSWORD_RESET_MAX_ATTEMPTS', 5))

        if reset_code.is_used:
            return Response(
                {'detail': 'This reset code has already been used. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_code.is_expired or reset_code.attempt_count >= max_attempts:
            if not reset_code.is_used:
                reset_code.used_at = timezone.now()
                reset_code.save(update_fields=['used_at'])
            return Response(
                {'detail': 'This reset code has expired. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reset_code.matches(submitted_code):
            reset_code.attempt_count += 1
            if reset_code.attempt_count >= max_attempts:
                reset_code.used_at = timezone.now()
                reset_code.save(update_fields=['attempt_count', 'used_at'])
            else:
                reset_code.save(update_fields=['attempt_count'])
            return Response(
                {'detail': 'Invalid reset code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'message': 'Reset code verified. You can now choose a new password.'},
            status=status.HTTP_200_OK,
        )


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_param = str(request.query_params.get('unread', '')).strip().lower()
        unread_only = unread_param in {'1', 'true', 'yes'}
        limit_raw = request.query_params.get('limit')
        limit = 50
        if limit_raw:
            try:
                limit = max(1, min(int(limit_raw), 200))
            except (TypeError, ValueError):
                limit = 50

        queryset = Notification.objects.filter(user=request.user)
        if unread_only:
            queryset = queryset.filter(is_read=False)
        queryset = queryset.order_by('-created_at')[:limit]

        serializer = NotificationSerializer(queryset, many=True)
        return Response(
            {
                'results': serializer.data,
                'unread_count': request.user.get_unread_notifications_count(),
            },
            status=status.HTTP_200_OK,
        )


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {'unread_count': request.user.get_unread_notifications_count()},
            status=status.HTTP_200_OK,
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id: int):
        try:
            notification = Notification.objects.get(pk=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.mark_read()
        return Response(
            {
                'message': 'Notification marked as read.',
                'unread_count': request.user.get_unread_notifications_count(),
            },
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        now = timezone.now()
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=now,
        )
        return Response(
            {
                'message': 'All notifications marked as read.',
                'unread_count': 0,
            },
            status=status.HTTP_200_OK,
        )


class ContactMessageView(APIView):
    """
    Accept contact form submissions.
    """

    permission_classes = [AllowAny]
    throttle_scope = 'contact'

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        ContactMessage.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=data['name'],
            email=data['email'],
            subject=data.get('subject', ''),
            message=data['message'],
        )

        return Response(
            {'message': 'Thanks! Your message has been received.'},
            status=status.HTTP_201_CREATED,
        )


class SendEmailVerificationView(APIView):
    """
    Send verification code to email for registration.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'email_verification_send'

    def post(self, request):
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return Response(
                {'detail': 'Please enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': 'This email is already registered.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        ttl_minutes = int(getattr(settings, 'EMAIL_VERIFICATION_CODE_TTL_MINUTES', 15))
        code_length = int(getattr(settings, 'EMAIL_VERIFICATION_CODE_LENGTH', 6))
        
        config_error = get_email_config_error()
        if config_error:
            return Response(
                {'detail': config_error},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        EmailVerificationCode.objects.filter(email__iexact=email, used_at__isnull=True).update(used_at=timezone.now())
        
        code = generate_reset_code()
        verification_code = EmailVerificationCode(email=email)
        verification_code.set_code(code)
        verification_code.save()
        
        try:
            send_verification_code(email, code)
        except Exception as exc:
            logger.exception("Failed to send verification email: %s", exc)
            return Response(
                {'detail': format_email_delivery_error('Failed to send verification email.', exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        return Response(
            {
                'message': 'Verification code sent to your email.',
                'code_length': code_length,
                'expires_in_minutes': ttl_minutes,
            },
            status=status.HTTP_200_OK,
        )


class VerifyEmailCodeView(APIView):
    """
    Verify the email verification code.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'email_verification_verify'

    def post(self, request):
        email = request.data.get('email', '').strip()
        submitted_code = request.data.get('code', '').strip()
        
        if not email or not submitted_code:
            return Response(
                {'detail': 'Email and code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        verification_code = (
            EmailVerificationCode.objects.filter(email__iexact=email)
            .order_by('-created_at')
            .first()
        )
        
        if not verification_code:
            return Response(
                {'detail': 'No verification request found. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        max_attempts = int(getattr(settings, 'EMAIL_VERIFICATION_MAX_ATTEMPTS', 5))
        
        if verification_code.is_used:
            return Response(
                {'detail': 'This verification code has already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if verification_code.is_expired or verification_code.attempt_count >= max_attempts:
            if not verification_code.is_used:
                verification_code.used_at = timezone.now()
                verification_code.save(update_fields=['used_at'])
            return Response(
                {'detail': 'This verification code has expired. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not verification_code.matches(submitted_code):
            verification_code.attempt_count += 1
            if verification_code.attempt_count >= max_attempts:
                verification_code.used_at = timezone.now()
                verification_code.save(update_fields=['attempt_count', 'used_at'])
            else:
                verification_code.save(update_fields=['attempt_count'])
            return Response(
                {'detail': 'Invalid verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        verification_code.mark_used()
        
        return Response(
            {'message': 'Email verified successfully. You can now complete registration.'},
            status=status.HTTP_200_OK,
        )


class SendLoginOTPView(APIView):
    """
    Send OTP code to user's email for login verification.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'otp_send'

    def post(self, request):
        session_context, challenge_error = resolve_otp_session_context(request.data.get('otp_session'))
        if challenge_error:
            return Response(
                {'detail': challenge_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        config_error = get_email_config_error()
        if config_error:
            return Response(
                {'detail': config_error},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if session_context['kind'] == 'registration':
            state = session_context['state']
            if not state.get('email'):
                return Response(
                    {'detail': 'No email associated with this registration session.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ttl_minutes = int(getattr(settings, 'EMAIL_VERIFICATION_CODE_TTL_MINUTES', 15))
            code_length = int(getattr(settings, 'EMAIL_VERIFICATION_CODE_LENGTH', 6))

            try:
                state = create_and_send_registration_otp(state)
            except Exception as exc:
                logger.exception("Failed to send registration OTP email: %s", exc)
                return Response(
                    {'detail': format_email_delivery_error('Failed to send OTP email.', exc)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    'message': 'OTP code sent to your email.',
                    'email': state['email'],
                    'code_length': code_length,
                    'expires_in_minutes': ttl_minutes,
                },
                status=status.HTTP_200_OK,
            )

        user = session_context['user']
        if not user.email:
            return Response(
                {'detail': 'No email associated with this account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ttl_minutes = int(getattr(settings, 'LOGIN_OTP_CODE_TTL_MINUTES', 15))
        code_length = int(getattr(settings, 'LOGIN_OTP_CODE_LENGTH', 6))

        try:
            create_and_send_login_otp(user)
        except Exception as exc:
            logger.exception("Failed to send login OTP email: %s", exc)
            return Response(
                {'detail': format_email_delivery_error('Failed to send OTP email.', exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'message': 'OTP code sent to your email.',
                'email': user.email,
                'code_length': code_length,
                'expires_in_minutes': ttl_minutes,
            },
            status=status.HTTP_200_OK,
        )


class VerifyLoginOTPView(APIView):
    """
    Verify the login OTP code and complete login.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'otp_verify'

    def post(self, request):
        otp_session = request.data.get('otp_session')
        submitted_code = request.data.get('code', '').strip()

        if not otp_session or not submitted_code:
            return Response(
                {'detail': 'Verification session and code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_context, challenge_error = resolve_otp_session_context(otp_session)
        if challenge_error:
            return Response(
                {'detail': challenge_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if session_context['kind'] == 'registration':
            state = session_context['state']
            otp_code_hash = str(state.get('otp_code_hash') or '')
            if not otp_code_hash:
                return Response(
                    {'detail': 'No OTP request found. Please request a new code.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            max_attempts = int(getattr(settings, 'EMAIL_VERIFICATION_MAX_ATTEMPTS', 5))
            attempt_count = int(state.get('otp_attempt_count') or 0)
            created_at = parse_cached_datetime(state.get('otp_created_at'))
            used_at = parse_cached_datetime(state.get('otp_used_at'))
            ttl_minutes = int(getattr(settings, 'EMAIL_VERIFICATION_CODE_TTL_MINUTES', 15))

            if used_at:
                return Response(
                    {'detail': 'This OTP code has already been used.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                created_at is None
                or timezone.now() > created_at + timedelta(minutes=ttl_minutes)
                or attempt_count >= max_attempts
            ):
                state['otp_used_at'] = timezone.now().isoformat()
                store_registration_session(state)
                return Response(
                    {'detail': 'This OTP code has expired. Request a new code.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not (otp_code_hash == submitted_code or check_password(submitted_code, otp_code_hash)):
                state['otp_attempt_count'] = attempt_count + 1
                if state['otp_attempt_count'] >= max_attempts:
                    state['otp_used_at'] = timezone.now().isoformat()
                store_registration_session(state)
                return Response(
                    {'detail': 'Invalid OTP code.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            _, registration_error = finalize_pending_registration(state)
            delete_registration_session(state.get('session_id'))
            if registration_error:
                return Response(
                    {'detail': registration_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'email_verified': True,
                    'requires_approval': True,
                    'message': 'Email verified. Wait for account approval before signing in.',
                },
                status=status.HTTP_200_OK,
            )

        user = session_context['user']

        otp_code = (
            LoginOTPCode.objects.filter(user=user)
            .order_by('-created_at')
            .first()
        )
        
        if not otp_code:
            return Response(
                {'detail': 'No OTP request found. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        max_attempts = int(getattr(settings, 'LOGIN_OTP_MAX_ATTEMPTS', 5))
        
        if otp_code.is_used:
            return Response(
                {'detail': 'This OTP code has already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if otp_code.is_expired or otp_code.attempt_count >= max_attempts:
            if not otp_code.is_used:
                otp_code.used_at = timezone.now()
                otp_code.save(update_fields=['used_at'])
            return Response(
                {'detail': 'This OTP code has expired. Request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not otp_code.matches(submitted_code):
            otp_code.attempt_count += 1
            if otp_code.attempt_count >= max_attempts:
                otp_code.used_at = timezone.now()
                otp_code.save(update_fields=['attempt_count', 'used_at'])
            else:
                otp_code.save(update_fields=['attempt_count'])
            return Response(
                {'detail': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        otp_code.mark_used()
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified'])

        if not user.is_active:
            return Response(
                {
                    'email_verified': True,
                    'requires_approval': True,
                    'message': 'Email verified. Wait for account approval before signing in.',
                },
                status=status.HTTP_200_OK,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'Login successful. Email verified.'
            },
            status=status.HTTP_200_OK,
        )


class UpdateEmailView(APIView):
    """
    Update a user's email address.
    Unauthenticated recovery requires a signed verification session.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'update_email'

    def post(self, request):
        otp_session = request.data.get('otp_session')
        new_email = request.data.get('email', '').strip()

        if not new_email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', new_email):
            return Response(
                {'detail': 'Please enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if request.user.is_authenticated:
            session_context = {'kind': 'user', 'user': request.user}
        elif otp_session:
            session_context, challenge_error = resolve_otp_session_context(otp_session)
            if challenge_error:
                return Response(
                    {'detail': challenge_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if session_context['kind'] == 'user' and session_context['user'].email_verified:
                return Response(
                    {'detail': 'Email already verified. Please login to update.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {'detail': 'Authentication or verification session required.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if session_context['kind'] == 'registration':
            if User.objects.filter(email__iexact=new_email).exists():
                return Response(
                    {'detail': 'This email is already in use.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            state = dict(session_context['state'])
            delete_registration_session(state.get('session_id'))
            state['email'] = normalize_email_value(new_email)
            state['otp_code_hash'] = None
            state['otp_created_at'] = None
            state['otp_attempt_count'] = 0
            state['otp_used_at'] = None
            state.pop('session_id', None)
            updated_state = store_registration_session(state)

            return Response(
                {
                    'message': 'Email updated successfully. Please verify with OTP.',
                    'email': updated_state['email'],
                    'otp_session': build_registration_otp_challenge_token(updated_state),
                },
                status=status.HTTP_200_OK,
            )

        user = session_context['user']
        if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
            return Response(
                {'detail': 'This email is already in use.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email = new_email
        user.email_verified = False
        user.save(update_fields=['email', 'email_verified'])

        return Response(
            {
                'message': 'Email updated successfully. Please verify with OTP.',
                'email': user.email,
                'otp_session': build_otp_challenge_token(user),
            },
            status=status.HTTP_200_OK,
        )
