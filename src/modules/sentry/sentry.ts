import * as Sentry from '@sentry/node';
import '@sentry/tracing';

Sentry.init({
  dsn: 'https://e2503086f44a4b0d941cc8acc94eb97f@o350818.ingest.sentry.io/5604863',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

export function reportWithScope(error: any, extraInfo?: any) {
  Sentry.withScope((scope) => {
    extraInfo && scope.setExtras(extraInfo);
    Sentry.captureException(error);
  });
}

export async function waitForSentryCompletion() {
  await Sentry.close(2000).catch(() => {
    /** ignore errors */
  });
}
