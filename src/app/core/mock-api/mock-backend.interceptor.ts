import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { Observable, defer, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { ClinicDraft, CreateAppointmentRequest, SPECIALITIES, isSpeciality } from '../models';
import { MockDb, MockDbError } from './mock-db';
import { DEMO_USERS } from './seed-data';

function browserStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Singleton DB instance; overridable in tests. */
export const MOCK_DB = new InjectionToken<MockDb>('MOCK_DB', {
  providedIn: 'root',
  factory: () => new MockDb(browserStorage()),
});

/** Artificial network latency so loading states are visible in the demo. */
export const MOCK_LATENCY_MS = new InjectionToken<number>('MOCK_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 0,
});

type Handler = (req: HttpRequest<unknown>, params: string[], user: string | null) => unknown;

interface Route {
  method: string;
  /** Pattern relative to the API base URL (`admin:` prefix for the admin API). */
  pattern: RegExp;
  handler: Handler;
  /** Anonymous access allowed. */
  public?: boolean;
}

/**
 * Simulates the DocLib Spring Boot REST API inside the browser.
 * Only requests whose URL starts with one of the configured API base URLs are
 * intercepted; everything else is passed through untouched.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiUrl, adminApiUrl } = inject(API_CONFIG);
  const db = inject(MOCK_DB);
  const latency = inject(MOCK_LATENCY_MS);

  const url = req.url.split('?')[0];
  const path = url.startsWith(adminApiUrl)
    ? 'admin:' + url.slice(adminApiUrl.length)
    : url.startsWith(apiUrl)
      ? url.slice(apiUrl.length)
      : null;
  if (path === null) {
    return next(req);
  }

  return defer(() => handle(req, path, db)).pipe(
    materialize(), // delay errors as well, not only values
    delay(latency),
    dematerialize(),
  );
};

function routesFor(db: MockDb): Route[] {
  return [
    { method: 'GET', pattern: /^\/login$/, handler: () => ({ message: 'You are authenticated' }) },
    {
      method: 'GET',
      pattern: /^admin:\/specialities$/,
      public: true,
      handler: () => [...SPECIALITIES],
    },
    {
      method: 'GET',
      pattern: /^\/clinic$/,
      public: true,
      handler: (r) => {
        const speciality = r.params.get('Speciality') ?? undefined;
        if (speciality !== undefined && !isSpeciality(speciality)) {
          throw new MockDbError(400, `Unknown speciality: ${speciality}`);
        }
        return db.listClinics(speciality);
      },
    },
    {
      method: 'GET',
      pattern: /^\/clinic\/(\d+)$/,
      public: true,
      handler: (_r, [id]) => db.getClinic(+id),
    },
    {
      method: 'POST',
      pattern: /^\/clinic\/add$/,
      handler: (r) => db.createClinic(r.body as ClinicDraft),
    },
    {
      method: 'PUT',
      pattern: /^\/clinic\/(\d+)$/,
      handler: (r, [id]) => db.updateClinic(+id, r.body as ClinicDraft),
    },
    { method: 'DELETE', pattern: /^\/clinic\/(\d+)$/, handler: (_r, [id]) => db.deleteClinic(+id) },
    {
      method: 'GET',
      pattern: /^\/appointment\/person$/,
      handler: (_r, _p, user) => db.appointmentsByPatient(user!),
    },
    {
      method: 'GET',
      pattern: /^\/appointment\/clinic\/(\d+)$/,
      handler: (_r, [id]) => db.appointmentsByClinic(+id),
    },
    {
      method: 'POST',
      pattern: /^\/appointment\/create$/,
      handler: (r, _p, user) => db.createAppointment(r.body as CreateAppointmentRequest, user!),
    },
    {
      method: 'DELETE',
      pattern: /^\/appointment\/(\d+)$/,
      handler: (_r, [id], user) => db.cancelAppointment(+id, user!),
    },
  ];
}

function handle(
  req: HttpRequest<unknown>,
  path: string,
  db: MockDb,
): Observable<HttpEvent<unknown>> {
  for (const route of routesFor(db)) {
    const match = req.method === route.method ? route.pattern.exec(path) : null;
    if (!match) continue;

    const user = authenticatedUser(req);
    if (!route.public && !user) {
      return httpError(req, 401, 'Unauthorized');
    }
    try {
      const body = route.handler(req, match.slice(1), user);
      const status = req.method === 'POST' ? 201 : body === undefined ? 204 : 200;
      return of(new HttpResponse({ status, body: body ?? null, url: req.url }));
    } catch (e) {
      if (e instanceof MockDbError) return httpError(req, e.status, e.message);
      return httpError(req, 500, 'Error interno del servidor');
    }
  }
  return httpError(req, 404, `No mock route for ${req.method} ${path}`);
}

/** Decodes the Basic auth header and validates it against the demo users. */
export function authenticatedUser(req: HttpRequest<unknown>): string | null {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Basic ')) return null;
  try {
    const [username, password] = atob(header.slice(6)).split(':');
    return DEMO_USERS.some((u) => u.username === username && u.password === password)
      ? username
      : null;
  } catch {
    return null;
  }
}

function httpError(req: HttpRequest<unknown>, status: number, message: string) {
  return throwError(
    () => new HttpErrorResponse({ status, error: message, url: req.url, statusText: message }),
  );
}
