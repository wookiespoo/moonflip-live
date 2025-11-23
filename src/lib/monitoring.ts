import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      beforeSend(event) {
        // Filter out sensitive data
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.stacktrace?.frames) {
            error.stacktrace.frames.forEach(frame => {
              // Remove wallet addresses from stack traces
              if (frame.filename) {
                frame.filename = frame.filename.replace(/[A-Za-z0-9]{32,}/g, '[WALLET]');
              }
            });
          }
        }
        return event;
      },
    });
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error('Error captured:', error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  console.log(`[${level.toUpperCase()}] ${message}`);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level);
  }
};

export const captureBet = (bet: any, result?: any) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      category: 'bet',
      message: `Bet placed: ${bet.amount} SOL ${bet.direction} on ${bet.coinSymbol}`,
      level: 'info',
      data: {
        betId: bet.id,
        wallet: bet.userWallet.slice(0, 8) + '...',
        amount: bet.amount,
        direction: bet.direction,
        coin: bet.coinSymbol,
        result: result?.won ? 'WON' : 'LOST',
        profit: result?.profit,
      },
    });
  }
};

export const captureSecurityEvent = (type: string, details: Record<string, any>) => {
  console.warn(`Security event: ${type}`, details);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(`Security: ${type}`, 'warning');
    Sentry.addBreadcrumb({
      category: 'security',
      message: type,
      level: 'warning',
      data: details,
    });
  }
};