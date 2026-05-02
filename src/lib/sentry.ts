import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out known errors
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'ChunkLoadError',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    
    // Don't send events from localhost
    beforeSend(event) {
      if (event.request?.headers?.host?.includes('localhost')) {
        return null;
      }
      return event;
    },
  });
};

export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, { extra: context });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export default Sentry;
