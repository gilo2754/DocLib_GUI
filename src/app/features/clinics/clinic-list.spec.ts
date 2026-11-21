import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_CONFIG } from '../../core/api/api.config';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { MOCK_DB, mockBackendInterceptor } from '../../core/mock-api/mock-backend.interceptor';
import { MockDb } from '../../core/mock-api/mock-db';
import { SEED_CLINICS } from '../../core/mock-api/seed-data';
import { ApplicationRef } from '@angular/core';
import { withComponentInputBinding } from '@angular/router';
import { ClinicList } from './clinic-list';

describe('ClinicList', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'clinics', component: ClinicList }], withComponentInputBinding()),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        { provide: API_CONFIG, useValue: { apiUrl: '/api/v1', adminApiUrl: '/admin/api/v1' } },
        { provide: MOCK_DB, useFactory: () => new MockDb(null) },
      ],
    });
  });

  async function render(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  const cards = (el: HTMLElement) =>
    el.querySelectorAll('[data-testid="clinic-list"] .clinic-card');

  it('renders all clinics from the simulated API', async () => {
    const el = await render('/clinics');
    expect(cards(el)).toHaveLength(SEED_CLINICS.length);
    expect(el.querySelector('[data-testid="result-count"]')?.textContent).toContain(
      `${SEED_CLINICS.length} von ${SEED_CLINICS.length}`,
    );
  });

  it('applies the speciality and text filters from the query params', async () => {
    const el = await render('/clinics?speciality=DERMATOLOGIA&q=tecla');
    expect(cards(el)).toHaveLength(1);
    expect(el.textContent).toContain('DermaCare Santa Tecla');
  });

  it('filters while typing in the search box', async () => {
    const el = await render('/clinics');
    const input = el.querySelector<HTMLInputElement>('[data-testid="filter-query"]')!;
    input.value = 'Sonsonate';
    input.dispatchEvent(new Event('input'));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(cards(el)).toHaveLength(1);
  });

  it('hides edit/delete actions for anonymous users', async () => {
    const el = await render('/clinics');
    expect(el.textContent).not.toContain('Löschen');
    expect(el.textContent).not.toContain('Neue Praxis');
  });
});
