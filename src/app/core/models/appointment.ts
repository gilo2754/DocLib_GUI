import { Clinic } from './clinic';

export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Angefragt',
  CONFIRMED: 'Bestätigt',
  CANCELLED: 'Storniert',
};

/** Mirrors `com.pluralsight.entity.Appointment`. */
export interface Appointment {
  appointment_id: number;
  clinic: Pick<Clinic, 'clinic_id' | 'clinic_name'>;
  patient: { username: string };
  /** `LocalDateTime` → ISO string without zone, e.g. "2026-12-01T09:30" */
  startTime: string;
  endTime: string;
  appointment_status: AppointmentStatus;
}

export interface CreateAppointmentRequest {
  clinic: { clinic_id: number };
  startTime: string;
  endTime: string;
}
