const envDomain = (import.meta.env.VITE_APP_DOMAIN ?? '').trim();

const normalizeDomain = (value: string) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '');
  return `https://${value.replace(/\/+$/, '')}`;
};

export const getAppBaseUrl = () => {
  const normalized = normalizeDomain(envDomain);
  if (normalized) return normalized;
  return window.location.origin;
};

