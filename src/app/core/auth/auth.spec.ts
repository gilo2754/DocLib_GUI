import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { API_CONFIG } from '../api/api.config';
import { authGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AUTHENTICATED_USER_KEY, AuthService, TOKEN_KEY } from './auth.service';

describe('Auth', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { apiUrl: '/api', adminApiUrl: '/admin' } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('AuthService', () => {
    it('sends Basic credentials and stores the session on success', () => {
      auth.login('demo', 'demo').subscribe();

      const req = http.expectOne('/api/login');
      expect(req.request.headers.get('Authorization')).toBe('Basic ' + btoa('demo:demo'));
      req.flush({ message: 'ok' });

      expect(auth.isLoggedIn()).toBe(true);
      expect(auth.username()).toBe('demo');
      expect(sessionStorage.getItem(AUTHENTICATED_USER_KEY)).toBe('demo');
    });

    it('does not store a session when the server rejects the login', () => {
      auth.login('demo', 'bad').subscribe({ error: () => undefined });
      http
        .expectOne('/api/login')
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(auth.isLoggedIn()).toBe(false);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('logout() clears signals and storage', () => {
      auth.login('demo', 'demo').subscribe();
      http.expectOne('/api/login').flush({});
      auth.logout();

      expect(auth.isLoggedIn()).toBe(false);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('authInterceptor', () => {
    it('adds the Authorization header once logged in', () => {
      auth.login('demo', 'demo').subscribe();
      http.expectOne('/api/login').flush({});

      TestBed.inject(HttpClient).get('/api/clinic').subscribe();
      expect(http.expectOne('/api/clinic').request.headers.get('Authorization')).toBe(
        'Basic ' + btoa('demo:demo'),
      );
    });

    it('does not add a header for anonymous users', () => {
      TestBed.inject(HttpClient).get('/api/clinic').subscribe();
      expect(http.expectOne('/api/clinic').request.headers.has('Authorization')).toBe(false);
    });
  });

  describe('authGuard', () => {
    const run = (url: string) =>
      TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
      );

    it('redirects anonymous users to /login with a returnUrl', () => {
      const result = run('/appointments') as UrlTree;
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fappointments');
    });

    it('lets logged-in users pass', () => {
      auth.login('demo', 'demo').subscribe();
      http.expectOne('/api/login').flush({});
      expect(run('/appointments')).toBe(true);
    });
  });
});
