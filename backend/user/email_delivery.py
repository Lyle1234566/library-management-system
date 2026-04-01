import json
from urllib import error, request

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


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


def is_resend_provider() -> bool:
    return getattr(settings, 'EMAIL_PROVIDER', 'smtp').strip().lower() == 'resend'


def get_email_config_error() -> str | None:
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
    if email_backend and email_backend != 'django.core.mail.backends.smtp.EmailBackend':
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
    if is_resend_provider():
        _send_via_resend(recipient, subject, text_body, html_body)
        return

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@salazar-library.local')
    message = EmailMultiAlternatives(
        subject,
        text_body,
        from_email,
        [recipient],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


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
