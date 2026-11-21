import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { MOCK_DB, mockBackendInterceptor } from '../../core/mock-api/mock-backend.interceptor';
import { MockDb } from '../../core/mock-api/mock-db';
import { ClinicForm, createClinicForm } from './clinic-form';

describe('clinic form', () => {
  const valid = {
    clinic_name: 'Praxis Test',
    clinic_description: 'Eine Beschreibung',
    clinic_address: 'Calle 1, Santa Ana',
    clinic_phone_number: '+503 2222-3333',
    speciality: 'PEDIATRIA' as const,
    clinic_state: 'ACTIVE' as const,
    openingTime: '08:00',
    closingTime: '16:00',
  };

  it('is invalid when empty and valid with complete data', () => {
    const form = createClinicForm();
    expect(form.valid).toBe(false);
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it('requires opening time before closing time', () => {
    const form = createClinicForm();
    form.setValue({ ...valid, openingTime: '17:00', closingTime: '09:00' });
    expect(form.hasError('openingAfterClosing')).toBe(true);
  });

  it.each(['abc', '12', '+503 2222-3333-4444-5555-66'])('rejects phone number %s', (phone) => {
    const form = createClinicForm();
    form.setValue({ ...valid, clinic_phone_number: phone });
    expect(form.controls.clinic_phone_number.hasError('pattern')).toBe(true);
  });

  it('limits the description to 200 characters (backend @Size(max = 200))', () => {
    const form = createClinicForm();
    form.setValue({ ...valid, clinic_description: 'x'.repeat(201) });
    expect(form.controls.clinic_description.hasError('maxlength')).toBe(true);
  });
});

describe('ClinicForm component', () => {
  let db: MockDb;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    sessionStorage.clear();
    db = new MockDb(null);
    TestBed.configureTestingModule({
      imports: [ClinicForm],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        { provide: API_CONFIG, useValue: { apiUrl: '/api/v1', adminApiUrl: '/admin/api/v1' } },
        { provide: MOCK_DB, useValue: db },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await firstValueFrom(TestBed.inject(AuthService).login('admin', 'admin'));
  });

  async function setup(id?: string) {
    const fixture = TestBed.createComponent(ClinicForm);
    if (id) fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const submit = async (el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await new Promise((r) => setTimeout(r));
    await TestBed.inject(ApplicationRef).whenStable();
  };

  it('shows validation errors and does not save an empty form', async () => {
    const { el } = await setup();
    await submit(el);
    expect(el.querySelectorAll('.field-error').length).toBeGreaterThan(0);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('loads an existing clinic into the form when editing', async () => {
    const { el } = await setup('3');
    expect(el.querySelector('h1')?.textContent).toContain('bearbeiten');
    expect(el.querySelector<HTMLInputElement>('[data-testid="clinic-name"]')!.value).toBe(
      'DermaCare Santa Tecla',
    );
  });

  it('saves changes through the API and navigates to the detail page', async () => {
    const { el } = await setup('3');
    const name = el.querySelector<HTMLInputElement>('[data-testid="clinic-name"]')!;
    name.value = 'DermaCare Neu';
    name.dispatchEvent(new Event('input'));
    await submit(el);

    expect(db.getClinic(3).clinic_name).toBe('DermaCare Neu');
    expect(navigate).toHaveBeenCalledWith(['/clinics', 3]);
  });
});
