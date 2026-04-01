import json
import logging
import smtplib
from urllib import error, request

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection


PLACEHOLDER_EMAIL_USERS = {
    'yourgmail@gmail.com',
    'you@example.com',
    'example@example.com',
}
PLACEHOLDER_EMAIL_PASSWORDS = {
    'your_app_password',
    'app_password',
    'password',
    'changeme',
}
NON_SMTP_BACKENDS = {
    'django.core.mail.backends.console.EmailBackend',
    'django.core.mail.backends.locmem.EmailBackend',
    'django.core.mail.backends.filebased.EmailBackend',
    'django.core.mail.backends.dummy.EmailBackend',
}
SMTP_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

logger = logging.getLogger(__name__)


def has_resend_config() -> bool:
    return bool(
        getattr(settings, 'RESEND_API_KEY', '').strip()
        and getattr(settings, 'RESEND_FROM_EMAIL', '').strip()
    )


def has_email_bridge_config() -> bool:
    return bool(
        getattr(settings, 'EMAIL_BRIDGE_URL', '').strip()
        and getattr(settings, 'EMAIL_BRIDGE_SECRET', '').strip()
    )


def get_email_provider() -> str:
    provider = getattr(settings, 'EMAIL_PROVIDER', 'auto').strip().lower()
    if provider in {'', 'auto'}:
        if has_email_bridge_config():
            return 'bridge'
        return 'resend' if has_resend_config() else 'smtp'
    return provider


def is_resend_provider() -> bool:
    return get_email_provider() == 'resend'


def get_email_config_error() -> str | None:
    if get_email_provider() == 'bridge':
        missing = []
        if not getattr(settings, 'EMAIL_BRIDGE_URL', '').strip():
            missing.append('EMAIL_BRIDGE_URL')
        if not getattr(settings, 'EMAIL_BRIDGE_SECRET', '').strip():
            missing.append('EMAIL_BRIDGE_SECRET')
        if missing:
            return f"Email bridge is not configured. Missing: {', '.join(missing)}."
        return None

    if is_resend_provider():
        missing = []
        if not getattr(settings, 'RESEND_API_KEY', '').strip():
            missing.append('RESEND_API_KEY')

        resend_from_email = getattr(settings, 'RESEND_FROM_EMAIL', '').strip()
        if not resend_from_email:
            missing.append('RESEND_FROM_EMAIL')

        if missing:
            return f"Email service is not configured. Missing: {', '.join(missing)}."
        if resend_from_email.endswith('.local'):
            return 'Email service is not configured. Replace the placeholder RESEND_FROM_EMAIL value.'
        return None

    email_backend = getattr(settings, 'EMAIL_BACKEND', '')
    if email_backend in NON_SMTP_BACKENDS:
        return None
    if email_backend and email_backend != SMTP_BACKEND:
        return None

    missing = []
    if not getattr(settings, 'EMAIL_HOST', ''):
        missing.append('EMAIL_HOST')

    email_host_user = getattr(settings, 'EMAIL_HOST_USER', '')
    if not email_host_user:
        missing.append('EMAIL_HOST_USER')

    email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    if not email_host_password:
        missing.append('EMAIL_HOST_PASSWORD')

    if missing:
        return f"Email service is not configured. Missing: {', '.join(missing)}."
    if email_host_user.strip().lower() in PLACEHOLDER_EMAIL_USERS:
        return 'Email service is not configured. Replace the placeholder EMAIL_HOST_USER value in backend/.env.'
    if email_host_password.strip() in PLACEHOLDER_EMAIL_PASSWORDS:
        return 'Email service is not configured. Replace the placeholder EMAIL_HOST_PASSWORD value in backend/.env.'
    return None


def send_email_message(recipient: str, subject: str, text_body: str, html_body: str) -> None:
    if get_email_provider() == 'bridge':
        _send_via_http_bridge(recipient, subject, text_body, html_body)
        return

    if is_resend_provider():
        _send_via_resend(recipient, subject, text_body, html_body)
        return

    try:
        _send_via_smtp(recipient, subject, text_body, html_body)
    except (OSError, smtplib.SMTPException):
        if not has_resend_config():
            raise
        logger.warning(
            'SMTP email send failed; retrying with Resend for recipient=%s',
            recipient,
            exc_info=True,
        )
        _send_via_resend(recipient, subject, text_body, html_body)


def _send_via_smtp(recipient: str, subject: str, text_body: str, html_body: str) -> None:
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@salazar-library.local')
    message = EmailMultiAlternatives(
        subject,
        text_body,
        from_email,
        [recipient],
        connection=_get_smtp_connection(),
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def _get_smtp_connection():
    email_backend = getattr(settings, 'EMAIL_BACKEND', '') or SMTP_BACKEND
    if email_backend != SMTP_BACKEND:
        return get_connection(backend=email_backend, fail_silently=False)

    return get_connection(
        backend=SMTP_BACKEND,
        fail_silently=False,
        host=getattr(settings, 'EMAIL_HOST', ''),
        port=getattr(settings, 'EMAIL_PORT', None),
        username=getattr(settings, 'EMAIL_HOST_USER', ''),
        password=_get_smtp_password(),
        use_tls=getattr(settings, 'EMAIL_USE_TLS', False),
        use_ssl=getattr(settings, 'EMAIL_USE_SSL', False),
    )


def _get_smtp_password() -> str:
    password = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    email_host = getattr(settings, 'EMAIL_HOST', '').strip().lower()
    if email_host in {'smtp.gmail.com', 'smtp.googlemail.com'}:
        collapsed = password.replace(' ', '')
        if collapsed and collapsed.isalnum():
            return collapsed
    return password


def _send_via_resend(recipient: str, subject: str, text_body: str, html_body: str) -> None:
    api_key = getattr(settings, 'RESEND_API_KEY', '').strip()
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', '').strip()
    api_base_url = getattr(settings, 'RESEND_API_BASE_URL', 'https://api.resend.com').rstrip('/')

    payload = json.dumps(
        {
            'from': from_email,
            'to': [recipient],
            'subject': subject,
            'text': text_body,
            'html': html_body,
        }
    ).encode('utf-8')

    req = request.Request(
        f'{api_base_url}/emails',
        data=payload,
        method='POST',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    )

    try:
        with request.urlopen(req, timeout=15) as response:
            response.read()
            status_code = getattr(response, 'status', 200)
            if status_code >= 400:
                raise RuntimeError(f'Resend API request failed with status {status_code}.')
    except error.HTTPError as exc:
        response_body = exc.read().decode('utf-8', errors='ignore').strip()
        if response_body:
            raise RuntimeError(
                f'Resend API request failed with status {exc.code}: {response_body}'
            ) from exc
        raise RuntimeError(f'Resend API request failed with status {exc.code}.') from exc
    except error.URLError as exc:
        raise RuntimeError('Failed to reach the Resend API.') from exc


def _send_via_http_bridge(recipient: str, subject: str, text_body: str, html_body: str) -> None:
    bridge_url = getattr(settings, 'EMAIL_BRIDGE_URL', '').strip()
    bridge_secret = getattr(settings, 'EMAIL_BRIDGE_SECRET', '').strip()
    timeout_seconds = getattr(settings, 'EMAIL_BRIDGE_TIMEOUT_SECONDS', 15)

    payload = json.dumps(
        {
            'recipient': recipient,
            'subject': subject,
            'textBody': text_body,
            'htmlBody': html_body,
        }
    ).encode('utf-8')

    req = request.Request(
        bridge_url,
        data=payload,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Email-Bridge-Secret': bridge_secret,
        },
    )

    try:
        with request.urlopen(req, timeout=timeout_seconds) as response:
            response.read()
            status_code = getattr(response, 'status', 200)
            if status_code >= 400:
                raise RuntimeError(f'Email bridge request failed with status {status_code}.')
    except error.HTTPError as exc:
        response_body = exc.read().decode('utf-8', errors='ignore').strip()
        if response_body:
            raise RuntimeError(
                f'Email bridge request failed with status {exc.code}: {response_body}'
            ) from exc
        raise RuntimeError(f'Email bridge request failed with status {exc.code}.') from exc
    except error.URLError as exc:
        raise RuntimeError('Failed to reach the email bridge.') from exc
