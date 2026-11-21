import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from '../auth/auth.interceptor';
import { AppointmentService } from '../services/appointment.service';
import { ClinicService } from '../services/clinic.service';
import { SpecialityService } from '../services/speciality.service';
import { MOCK_DB, mockBackendInterceptor } from './mock-backend.interceptor';
import { MockDb } from './mock-db';
import { SEED_CLINICS } from './seed-data';

/**
 * Integration test: real services + real interceptors + in-memory MockDb.
 * This is exactly the stack the demo runs in the browser.
 */
describe('mockBackendInterceptor (simulated API)', () => {
  let auth: AuthService;
  let clinics: ClinicService;
  let appointments: AppointmentService;

  const status = async (p: Promise<unknown>) => {
    try {
      await p;
      return 'ok';
    } catch (e) {
      return (e as HttpErrorResponse).status;
    }
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        { provide: API_CONFIG, useValue: { apiUrl: '/api/v1', adminApiUrl: '/admin/api/v1' } },
        { provide: MOCK_DB, useFactory: () => new MockDb(null) },
      ],
    });
    auth = TestBed.inject(AuthService);
    clinics = TestBed.inject(ClinicService);
    appointments = TestBed.inject(AppointmentService);
  });

  it('lists clinics anonymously and supports the Speciality query param', async () => {
    expect(await firstValueFrom(clinics.list())).toHaveLength(SEED_CLINICS.length);
    const cardio = await firstValueFrom(clinics.list('CARDIOLOGIA'));
    expect(cardio.every((c) => c.speciality === 'CARDIOLOGIA')).toBe(true);
  });

  it('serves the specialities from the admin API', async () => {
    const list = await firstValueFrom(TestBed.inject(SpecialityService).list());
    expect(list).toContain('PEDIATRIA');
  });

  it('rejects login with wrong credentials (401) and accepts the demo user', async () => {
    expect(await status(firstValueFrom(auth.login('demo', 'wrong')))).toBe(401);
    expect(auth.isLoggedIn()).toBe(false);

    await firstValueFrom(auth.login('demo', 'demo'));
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.username()).toBe('demo');
  });

  it('protects write endpoints with 401 when not logged in', async () => {
    expect(await status(firstValueFrom(clinics.delete(12)))).toBe(401);
    expect(await status(firstValueFrom(appointments.mine()))).toBe(401);
  });

  it('returns 404 for unknown clinics and routes', async () => {
    expect(await status(firstValueFrom(clinics.get(999)))).toBe(404);
    expect(await status(firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/nope')))).toBe(404);
  });

  it('runs a full booking flow for a logged-in user', async () => {
    await firstValueFrom(auth.login('demo', 'demo'));
    const before = await firstValueFrom(appointments.mine());

    const created = await firstValueFrom(
      appointments.create({
        clinic: { clinic_id: 4 },
        startTime: '2030-01-07T08:00',
        endTime: '2030-01-07T08:30',
      }),
    );
    expect(created.appointment_status).toBe('PENDING');
    expect(await firstValueFrom(appointments.mine())).toHaveLength(before.length + 1);

    // same slot again -> conflict
    expect(
      await status(
        firstValueFrom(
          appointments.create({
            clinic: { clinic_id: 4 },
            startTime: '2030-01-07T08:00',
            endTime: '2030-01-07T08:30',
          }),
        ),
      ),
    ).toBe(409);

    await firstValueFrom(appointments.cancel(created.appointment_id));
    const after = await firstValueFrom(appointments.mine());
    expect(after.find((a) => a.appointment_id === created.appointment_id)?.appointment_status).toBe(
      'CANCELLED',
    );
  });

  it('maps the backend rule "no delete with appointments" to HTTP 400', async () => {
    await firstValueFrom(auth.login('admin', 'admin'));
    expect(await status(firstValueFrom(clinics.delete(1)))).toBe(400);
    expect(await status(firstValueFrom(clinics.delete(12)))).toBe('ok');
  });

  it('creates and updates clinics', async () => {
    await firstValueFrom(auth.login('admin', 'admin'));
    const { clinic_id: _id, ...draft } = SEED_CLINICS[0];
    const created = await firstValueFrom(clinics.create({ ...draft, clinic_name: 'Test' }));
    const updated = await firstValueFrom(
      clinics.update(created.clinic_id, { ...draft, clinic_name: 'Test 2' }),
    );
    expect(updated.clinic_name).toBe('Test 2');
    expect((await firstValueFrom(clinics.get(created.clinic_id))).clinic_name).toBe('Test 2');
  });

  it('passes through requests that do not target the API', async () => {
    const http = TestBed.inject(HttpClient);
    // no backend handles this URL in jsdom, so the request fails with a
    // network error instead of a mock 404 – proving it was not intercepted
    const result = await status(firstValueFrom(http.get('https://example.invalid/other')));
    expect(result).not.toBe(404);
  });
});
