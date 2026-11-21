import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_CONFIG } from '../../core/api/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { MOCK_DB, mockBackendInterceptor } from '../../core/mock-api/mock-backend.interceptor';
import { MockDb } from '../../core/mock-api/mock-db';
import { Login } from './login';

describe('Login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        { provide: API_CONFIG, useValue: { apiUrl: '/api/v1', adminApiUrl: '/admin/api/v1' } },
        { provide: MOCK_DB, useFactory: () => new MockDb(null) },
      ],
    });
  });

  async function setup(returnUrl?: string) {
    const fixture = TestBed.createComponent(Login);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const type = (testId: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, el, type, submit };
  }

  it('shows the demo credentials hint', async () => {
    const { el } = await setup();
    expect(el.querySelector('[data-testid="demo-hint"]')?.textContent).toContain('demo');
  });

  it('shows an error for wrong credentials', async () => {
    const { el, type, submit } = await setup();
    type('username', 'demo');
    type('password', 'falsch');
    await submit();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('falsch');
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });

  it('logs in and navigates to the return url', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { type, submit } = await setup('/appointments');
    type('username', 'demo');
    type('password', 'demo');
    await submit();
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/appointments');
  });

  it('ignores external return urls (open redirect protection)', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { type, submit } = await setup('//evil.example');
    type('username', 'demo');
    type('password', 'demo');
    await submit();
    expect(navigate).toHaveBeenCalledWith('/clinics');
  });
});
