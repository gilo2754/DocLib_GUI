import { ClinicDraft } from '../models';
import { KeyValueStorage, MOCK_DB_STORAGE_KEY, MockDb, MockDbError } from './mock-db';
import { SEED_CLINICS } from './seed-data';

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const draft: ClinicDraft = {
  clinic_name: 'Neue Praxis',
  clinic_description: 'Beschreibung',
  clinic_address: 'Calle 1, San Salvador',
  clinic_phone_number: '+503 1111-2222',
  clinic_state: 'ACTIVE',
  speciality: 'NEUROLOGIA',
  openingTime: '08:00',
  closingTime: '12:00',
};

const today = () => new Date(2026, 11, 1, 8, 0);

function expectDbError(fn: () => unknown, status: number) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(MockDbError);
    expect((e as MockDbError).status).toBe(status);
    return;
  }
  throw new Error(`expected MockDbError ${status}`);
}

describe('MockDb', () => {
  let storage: MemoryStorage;
  let db: MockDb;

  beforeEach(() => {
    storage = new MemoryStorage();
    db = new MockDb(storage, today);
  });

  it('starts with the seed data', () => {
    expect(db.listClinics()).toHaveLength(SEED_CLINICS.length);
    expect(db.appointmentsByPatient('demo')).toHaveLength(2);
  });

  it('filters clinics by speciality', () => {
    expect(db.listClinics('CARDIOLOGIA').map((c) => c.clinic_id)).toEqual([1, 2]);
  });

  it('returns copies so callers cannot mutate the store', () => {
    db.getClinic(1).clinic_name = 'hacked';
    expect(db.getClinic(1).clinic_name).not.toBe('hacked');
  });

  it('creates clinics with a new id and persists them', () => {
    const created = db.createClinic(draft);
    expect(created.clinic_id).toBe(SEED_CLINICS.length + 1);
    // a new instance on the same storage sees the change
    expect(new MockDb(storage, today).getClinic(created.clinic_id).clinic_name).toBe('Neue Praxis');
  });

  it('updates clinics and keeps denormalized names on appointments in sync', () => {
    db.updateClinic(1, { ...draft, clinic_name: 'Umbenannt' });
    expect(db.getClinic(1).clinic_name).toBe('Umbenannt');
    expect(db.appointmentsByClinic(1).every((a) => a.clinic.clinic_name === 'Umbenannt')).toBe(
      true,
    );
  });

  it('throws 404 for unknown clinics', () => {
    expectDbError(() => db.getClinic(999), 404);
    expectDbError(() => db.updateClinic(999, draft), 404);
  });

  it('refuses to delete a clinic that has appointments (400, like the backend)', () => {
    expectDbError(() => db.deleteClinic(1), 400);
    expect(db.getClinic(1)).toBeTruthy();
  });

  it('deletes a clinic without appointments', () => {
    db.deleteClinic(12);
    expectDbError(() => db.getClinic(12), 404);
  });

  it('books a free slot as PENDING for the given user', () => {
    const a = db.createAppointment(
      { clinic: { clinic_id: 4 }, startTime: '2026-12-03T08:00', endTime: '2026-12-03T08:30' },
      'demo',
    );
    expect(a.appointment_status).toBe('PENDING');
    expect(a.patient.username).toBe('demo');
    expect(a.clinic.clinic_name).toBe(SEED_CLINICS[3].clinic_name);
  });

  it('rejects double bookings with 409', () => {
    const slot = {
      clinic: { clinic_id: 4 },
      startTime: '2026-12-03T08:00',
      endTime: '2026-12-03T08:30',
    };
    db.createAppointment(slot, 'demo');
    expectDbError(() => db.createAppointment(slot, 'admin'), 409);
  });

  it('allows re-booking a slot after it was cancelled', () => {
    const slot = {
      clinic: { clinic_id: 4 },
      startTime: '2026-12-03T08:00',
      endTime: '2026-12-03T08:30',
    };
    const first = db.createAppointment(slot, 'demo');
    db.cancelAppointment(first.appointment_id, 'demo');
    expect(db.createAppointment(slot, 'admin').appointment_status).toBe('PENDING');
  });

  it('rejects bookings for clinics that are not active', () => {
    expectDbError(
      () =>
        db.createAppointment({ clinic: { clinic_id: 7 }, startTime: 'x', endTime: 'y' }, 'demo'),
      400,
    );
  });

  it('only lets the owner cancel an appointment', () => {
    expectDbError(() => db.cancelAppointment(1, 'admin'), 404);
    db.cancelAppointment(1, 'demo');
    expect(
      db.appointmentsByPatient('demo').find((a) => a.appointment_id === 1)?.appointment_status,
    ).toBe('CANCELLED');
  });

  it('reset() restores the seed data', () => {
    db.deleteClinic(12);
    db.reset();
    expect(db.listClinics()).toHaveLength(SEED_CLINICS.length);
  });

  it('falls back to seed data when storage contains garbage', () => {
    storage.setItem(MOCK_DB_STORAGE_KEY, '{not json');
    expect(new MockDb(storage, today).listClinics()).toHaveLength(SEED_CLINICS.length);
  });
});
