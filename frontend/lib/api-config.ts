const DEV_API_BASE_URL = 'http://localhost:8000/api';
const PROD_FALLBACK_API_BASE_URL = '/api';

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('/')) {
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
  }
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

function getConfiguredApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }
  if (process.env.NODE_ENV === 'production') {
    return PROD_FALLBACK_API_BASE_URL;
  }
  return DEV_API_BASE_URL;
}

export const API_BASE_URL = getConfiguredApiBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const HAS_CONFIGURED_API_BASE_URL = Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

if (!HAS_CONFIGURED_API_BASE_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    'NEXT_PUBLIC_API_URL is not set. Falling back to same-origin /api requests until a backend URL is configured.',
  );
}
