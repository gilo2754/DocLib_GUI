import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { MOCK_DB, mockBackendInterceptor } from '../../core/mock-api/mock-backend.interceptor';
import { MockDb } from '../../core/mock-api/mock-db';
import { toIsoDate } from '../../core/mock-api/seed-data';
import { ClinicDetail, nextWorkday } from './clinic-detail';

describe('ClinicDetail (booking)', () => {
  let db: MockDb;

  beforeEach(() => {
    sessionStorage.clear();
    db = new MockDb(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'clinics/:id', component: ClinicDetail }],
          withComponentInputBinding(),
        ),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        { provide: API_CONFIG, useValue: { apiUrl: '/api/v1', adminApiUrl: '/admin/api/v1' } },
        { provide: MOCK_DB, useValue: db },
      ],
    });
  });

  async function render(id: number) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/clinics/${id}`);
    await stable();
    return harness.routeNativeElement as HTMLElement;
  }
  const stable = () => TestBed.inject(ApplicationRef).whenStable();
  const login = () => firstValueFrom(TestBed.inject(AuthService).login('demo', 'demo'));

  it('shows the clinic and asks anonymous users to log in', async () => {
    const el = await render(1);
    expect(el.querySelector('h1')?.textContent).toContain('Centro Cardiológico Escalón');
    expect(el.textContent).toContain('melden Sie sich an');
    expect(el.querySelector('[data-testid="book"]')).toBeNull();
  });

  it('does not offer booking for clinics that are not active', async () => {
    await login();
    const el = await render(7);
    expect(el.textContent).toContain('keine Online-Termine');
  });

  it('shows an error for unknown clinics', async () => {
    const el = await render(999);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('nicht gefunden');
  });

  it('books a selected slot and stores it in the simulated backend', async () => {
    await login();
    const el = await render(4);
    const before = db.appointmentsByPatient('demo').length;

    const slots = el.querySelectorAll<HTMLButtonElement>('.slot');
    expect(slots.length).toBeGreaterThan(0);
    const time = slots[0].textContent!.trim();
    slots[0].click();
    await stable();

    const book = el.querySelector<HTMLButtonElement>('[data-testid="book"]')!;
    expect(book.disabled).toBe(false);
    expect(book.textContent).toContain(time);
    book.click();
    await new Promise((r) => setTimeout(r));
    await stable();

    expect(el.querySelector('[data-testid="booking-success"]')?.textContent).toContain(time);
    expect(db.appointmentsByPatient('demo')).toHaveLength(before + 1);
  });

  it('hides slots that are already booked', async () => {
    // clinic 4 opens at 07:30; the default booking date is the next workday
    const date = toIsoDate(nextWorkday(new Date()));
    db.createAppointment(
      { clinic: { clinic_id: 4 }, startTime: `${date}T07:30`, endTime: `${date}T08:00` },
      'admin',
    );
    await login();
    const el = await render(4);

    expect(el.querySelector<HTMLInputElement>('[data-testid="booking-date"]')!.value).toBe(date);
    const times = [...el.querySelectorAll('.slot')].map((s) => s.textContent!.trim());
    expect(times).not.toContain('07:30');
    expect(times).toContain('08:00');
  });
});
