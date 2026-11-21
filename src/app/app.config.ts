import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { MOCK_LATENCY_MS, mockBackendInterceptor } from './core/mock-api/mock-backend.interceptor';

/**
 * The simulated backend is the *last* interceptor, so it sees exactly the request
 * the real backend would receive (including the Authorization header).
 */
const interceptors = environment.useMockApi
  ? [authInterceptor, mockBackendInterceptor]
  : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors(interceptors)),
    { provide: MOCK_LATENCY_MS, useValue: environment.mockLatencyMs },
    { provide: LOCALE_ID, useValue: 'de-DE' },
  ],
};
