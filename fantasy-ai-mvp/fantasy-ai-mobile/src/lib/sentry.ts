import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
    
    // Set sample rates
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Debug mode in development
    debug: __DEV__,
    
    // Disable in development if needed
    enabled: !__DEV__ || process.env.ENABLE_SENTRY_DEV === 'true',
    
    // Release tracking
    release: 'fantasy-ai@1.0.0',
    
    // Distribution tracking
    dist: Platform.select({
      ios: 'ios',
      android: 'android',
      default: 'unknown',
    }),
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Trace navigation transitions
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Trace touch events
        tracingOrigins: ['localhost', /^\//],
        
        // Trace fetch requests
        traceFetch: true,
        
        // Trace XHR requests
        traceXHR: true,
        
        // Custom options
        beforeNavigate: context => {
          // Add custom context to navigation transactions
          return {
            ...context,
            tags: {
              ...context.tags,
              platform: Platform.OS,
            },
          };
        },
      }),
    ],
    
    // Before send hook
    beforeSend(event, hint) {
      // Filter out certain errors in production
      if (!__DEV__) {
        // Don't send network errors
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Don't send cancelled promises
        if (event.exception?.values?.[0]?.value?.includes('cancelled')) {
          return null;
        }
      }
      
      // Add user context
      if (event.user) {
        event.user = {
          ...event.user,
          // Add custom user properties
        };
      }
      
      return event;
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      // Don't log authentication breadcrumbs in production
      if (!__DEV__ && breadcrumb.message?.includes('auth')) {
        return null;
      }
      
      return breadcrumb;
    },
  });
};

// Custom error logging
export const logError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('Error:', error, context);
  }
  
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};

// Log custom events
export const logEvent = (message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    level,
    data: extra,
    timestamp: Date.now() / 1000,
  });
  
  if (level === 'error' || level === 'warning') {
    Sentry.captureMessage(message, level);
  }
};

// Performance monitoring
export const startTransaction = (name: string, op: string = 'navigation') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

// User identification
export const identifyUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Clear user on logout
export const clearUser = () => {
  Sentry.setUser(null);
};

// Add custom context
export const setCustomContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

// Capture user feedback
export const captureUserFeedback = (feedback: {
  name: string;
  email: string;
  message: string;
  eventId?: string;
}) => {
  const user = Sentry.getCurrentHub().getScope()?.getUser();
  const eventId = feedback.eventId || Sentry.lastEventId();
  
  if (eventId) {
    Sentry.captureUserFeedback({
      event_id: eventId,
      name: feedback.name || user?.username || 'Unknown',
      email: feedback.email || user?.email || 'unknown@example.com',
      comments: feedback.message,
    });
  }
};