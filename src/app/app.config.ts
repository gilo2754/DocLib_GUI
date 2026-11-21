import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

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
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
    { provide: MOCK_LATENCY_MS, useValue: environment.mockLatencyMs },
  ],
};
