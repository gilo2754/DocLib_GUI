import { Appointment, Clinic, ClinicDraft, CreateAppointmentRequest, Speciality } from '../models';
import { SEED_CLINICS, seedAppointments } from './seed-data';

export const MOCK_DB_STORAGE_KEY = 'doclib.mock-db.v1';

interface DbState {
  clinics: Clinic[];
  appointments: Appointment[];
  nextClinicId: number;
  nextAppointmentId: number;
}

/** Minimal storage abstraction so the DB can be tested without a browser. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MockDbError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

/**
 * In-memory data store behind the simulated API.
 * Business rules intentionally mirror the Spring Boot services:
 *  - a clinic with active appointments cannot be deleted (HTTP 400)
 *  - unknown ids raise HTTP 404
 *  - a slot can only be booked once per clinic (HTTP 409)
 */
export class MockDb {
  private state: DbState;

  constructor(
    private readonly storage: KeyValueStorage | null = null,
    private readonly today: () => Date = () => new Date(),
  ) {
    this.state = this.load() ?? this.seed();
  }

  // ---- clinics -------------------------------------------------------------

  listClinics(speciality?: Speciality): Clinic[] {
    const all = this.state.clinics;
    return structuredClone(speciality ? all.filter((c) => c.speciality === speciality) : all);
  }

  getClinic(id: number): Clinic {
    return structuredClone(this.findClinic(id));
  }

  createClinic(draft: ClinicDraft): Clinic {
    const clinic: Clinic = { ...draft, clinic_id: this.state.nextClinicId++ };
    this.state.clinics.push(clinic);
    this.persist();
    return structuredClone(clinic);
  }

  updateClinic(id: number, draft: ClinicDraft): Clinic {
    const existing = this.findClinic(id);
    Object.assign(existing, draft, { clinic_id: id });
    for (const a of this.state.appointments) {
      if (a.clinic.clinic_id === id) a.clinic.clinic_name = existing.clinic_name;
    }
    this.persist();
    return structuredClone(existing);
  }

  deleteClinic(id: number): void {
    this.findClinic(id);
    const hasAppointments = this.state.appointments.some(
      (a) => a.clinic.clinic_id === id && a.appointment_status !== 'CANCELLED',
    );
    if (hasAppointments) {
      // Same message as ClinicController (DataIntegrityViolationException -> 400)
      throw new MockDbError(400, 'No se pueden borrar clinics si estas contienen appointment');
    }
    this.state.clinics = this.state.clinics.filter((c) => c.clinic_id !== id);
    this.persist();
  }

  // ---- appointments --------------------------------------------------------

  appointmentsByPatient(username: string): Appointment[] {
    return structuredClone(
      this.state.appointments
        .filter((a) => a.patient.username === username)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );
  }

  appointmentsByClinic(clinicId: number): Appointment[] {
    this.findClinic(clinicId);
    return structuredClone(this.state.appointments.filter((a) => a.clinic.clinic_id === clinicId));
  }

  createAppointment(request: CreateAppointmentRequest, username: string): Appointment {
    const clinic = this.findClinic(request.clinic.clinic_id);
    if (clinic.clinic_state !== 'ACTIVE') {
      throw new MockDbError(400, 'Clinic is not accepting appointments');
    }
    const taken = this.state.appointments.some(
      (a) =>
        a.clinic.clinic_id === clinic.clinic_id &&
        a.appointment_status !== 'CANCELLED' &&
        a.startTime === request.startTime,
    );
    if (taken) {
      throw new MockDbError(409, 'La cita no está disponible');
    }
    const appointment: Appointment = {
      appointment_id: this.state.nextAppointmentId++,
      clinic: { clinic_id: clinic.clinic_id, clinic_name: clinic.clinic_name },
      patient: { username },
      startTime: request.startTime,
      endTime: request.endTime,
      appointment_status: 'PENDING',
    };
    this.state.appointments.push(appointment);
    this.persist();
    return structuredClone(appointment);
  }

  cancelAppointment(id: number, username: string): void {
    const appointment = this.state.appointments.find((a) => a.appointment_id === id);
    if (!appointment || appointment.patient.username !== username) {
      throw new MockDbError(404, 'Cita no encontrada');
    }
    appointment.appointment_status = 'CANCELLED';
    this.persist();
  }

  /** Restores the seed data (used by the "Demo zurücksetzen" button). */
  reset(): void {
    this.state = this.seed();
    this.persist();
  }

  // ---- internals -----------------------------------------------------------

  private findClinic(id: number): Clinic {
    const clinic = this.state.clinics.find((c) => c.clinic_id === id);
    if (!clinic) {
      throw new MockDbError(404, 'Clinic Not Found');
    }
    return clinic;
  }

  private seed(): DbState {
    const clinics = structuredClone(SEED_CLINICS) as Clinic[];
    const appointments = seedAppointments(this.today());
    return {
      clinics,
      appointments,
      nextClinicId: Math.max(...clinics.map((c) => c.clinic_id)) + 1,
      nextAppointmentId: Math.max(...appointments.map((a) => a.appointment_id)) + 1,
    };
  }

  private load(): DbState | null {
    try {
      const raw = this.storage?.getItem(MOCK_DB_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DbState) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // storage full or unavailable -> keep working in memory
    }
  }
}
