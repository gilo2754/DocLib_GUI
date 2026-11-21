import { Appointment, Clinic } from '../models';

export interface DemoUser {
  username: string;
  password: string;
}

/** Credentials accepted by the simulated API (shown on the login page). */
export const DEMO_USERS: readonly DemoUser[] = [
  { username: 'demo', password: 'demo' },
  { username: 'admin', password: 'admin' },
];

export const SEED_CLINICS: readonly Clinic[] = [
  {
    clinic_id: 1,
    clinic_name: 'Centro Cardiológico Escalón',
    clinic_description: 'Kardiologische Praxis mit EKG, Belastungs-EKG und Herzultraschall.',
    clinic_address: 'Paseo General Escalón 3500, San Salvador',
    clinic_phone_number: '+503 2263-1100',
    clinic_state: 'ACTIVE',
    speciality: 'CARDIOLOGIA',
    openingTime: '08:00',
    closingTime: '16:00',
  },
  {
    clinic_id: 2,
    clinic_name: 'Clínica del Corazón Santa Ana',
    clinic_description: 'Vorsorge und Nachsorge bei Herz-Kreislauf-Erkrankungen.',
    clinic_address: 'Avenida Independencia Sur 12, Santa Ana',
    clinic_phone_number: '+503 2440-2200',
    clinic_state: 'ACTIVE',
    speciality: 'CARDIOLOGIA',
    openingTime: '09:00',
    closingTime: '17:00',
  },
  {
    clinic_id: 3,
    clinic_name: 'DermaCare Santa Tecla',
    clinic_description: 'Hautkrebs-Screening, Allergologie und ästhetische Dermatologie.',
    clinic_address: 'Calle Chiltiupán 21, Santa Tecla',
    clinic_phone_number: '+503 2288-3300',
    clinic_state: 'ACTIVE',
    speciality: 'DERMATOLOGIA',
    openingTime: '08:30',
    closingTime: '15:30',
  },
  {
    clinic_id: 4,
    clinic_name: 'Gastro Centro San Miguel',
    clinic_description: 'Magen- und Darmspiegelung, Ernährungsberatung.',
    clinic_address: 'Avenida Roosevelt Norte 7, San Miguel',
    clinic_phone_number: '+503 2661-4400',
    clinic_state: 'ACTIVE',
    speciality: 'GASTROENTEROLOGIA',
    openingTime: '07:30',
    closingTime: '14:00',
  },
  {
    clinic_id: 5,
    clinic_name: 'NeuroSalud Antiguo Cuscatlán',
    clinic_description: 'Diagnostik und Therapie neurologischer Erkrankungen, EEG.',
    clinic_address: 'Boulevard Merliot 45, Antiguo Cuscatlán',
    clinic_phone_number: '+503 2243-5500',
    clinic_state: 'ACTIVE',
    speciality: 'NEUROLOGIA',
    openingTime: '09:00',
    closingTime: '18:00',
  },
  {
    clinic_id: 6,
    clinic_name: 'Visión Clara Soyapango',
    clinic_description: 'Augenuntersuchungen, Sehtests und Grauer-Star-Vorsorge.',
    clinic_address: 'Carretera de Oro km 3, Soyapango',
    clinic_phone_number: '+503 2251-6600',
    clinic_state: 'ACTIVE',
    speciality: 'OFTALMOLOGIA',
    openingTime: '08:00',
    closingTime: '16:00',
  },
  {
    clinic_id: 7,
    clinic_name: 'Oncología Integral San Salvador',
    clinic_description: 'Interdisziplinäre Tumorsprechstunde und Chemotherapie-Ambulanz.',
    clinic_address: 'Colonia Médica, Pasaje 10, San Salvador',
    clinic_phone_number: '+503 2225-7700',
    clinic_state: 'IN_REVIEW',
    speciality: 'ONCOLOGIA',
    openingTime: '08:00',
    closingTime: '15:00',
  },
  {
    clinic_id: 8,
    clinic_name: 'Pediatría Los Niños Mejicanos',
    clinic_description: 'Kinderarztpraxis mit Vorsorgeuntersuchungen und Impfungen.',
    clinic_address: 'Calle a Mariona 33, Mejicanos',
    clinic_phone_number: '+503 2272-8800',
    clinic_state: 'ACTIVE',
    speciality: 'PEDIATRIA',
    openingTime: '07:00',
    closingTime: '13:00',
  },
  {
    clinic_id: 9,
    clinic_name: 'Pediatría Sonsonate',
    clinic_description: 'Kinder- und Jugendmedizin, Entwicklungsdiagnostik.',
    clinic_address: 'Avenida Morazán 8, Sonsonate',
    clinic_phone_number: '+503 2451-9900',
    clinic_state: 'ACTIVE',
    speciality: 'PEDIATRIA',
    openingTime: '08:00',
    closingTime: '16:00',
  },
  {
    clinic_id: 10,
    clinic_name: 'Mente Sana Nuevo Cuscatlán',
    clinic_description: 'Psychiatrische Sprechstunde und Psychotherapie.',
    clinic_address: 'Calle Huizúcar 14, Nuevo Cuscatlán',
    clinic_phone_number: '+503 2212-1010',
    clinic_state: 'INACTIVE',
    speciality: 'PSIQUIATRIA',
    openingTime: '10:00',
    closingTime: '18:00',
  },
  {
    clinic_id: 11,
    clinic_name: 'Trauma & Ortopedia Ilopango',
    clinic_description: 'Unfallchirurgie, Sportverletzungen und Physiotherapie.',
    clinic_address: 'Boulevard del Ejército km 6, Ilopango',
    clinic_phone_number: '+503 2295-1111',
    clinic_state: 'ACTIVE',
    speciality: 'TRAUMATOLOGIA',
    openingTime: '08:00',
    closingTime: '17:00',
  },
  {
    clinic_id: 12,
    clinic_name: 'Clínica Dermatológica Usulután',
    clinic_description: 'Allgemeine Dermatologie und Wundversorgung.',
    clinic_address: 'Calle Grimaldi 4, Usulután',
    clinic_phone_number: '+503 2662-1212',
    clinic_state: 'ACTIVE',
    speciality: 'DERMATOLOGIA',
    openingTime: '08:00',
    closingTime: '12:00',
  },
];

/** Seed appointments are created relative to "today" so the demo never looks stale. */
export function seedAppointments(today: Date): Appointment[] {
  const day = (offset: number, time: string) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return `${toIsoDate(d)}T${time}`;
  };
  return [
    {
      appointment_id: 1,
      clinic: { clinic_id: 1, clinic_name: SEED_CLINICS[0].clinic_name },
      patient: { username: 'demo' },
      startTime: day(2, '09:00'),
      endTime: day(2, '09:30'),
      appointment_status: 'CONFIRMED',
    },
    {
      appointment_id: 2,
      clinic: { clinic_id: 3, clinic_name: SEED_CLINICS[2].clinic_name },
      patient: { username: 'demo' },
      startTime: day(5, '10:30'),
      endTime: day(5, '11:00'),
      appointment_status: 'PENDING',
    },
    {
      appointment_id: 3,
      clinic: { clinic_id: 1, clinic_name: SEED_CLINICS[0].clinic_name },
      patient: { username: 'admin' },
      startTime: day(2, '10:00'),
      endTime: day(2, '10:30'),
      appointment_status: 'CONFIRMED',
    },
  ];
}

/** Local calendar date as "YYYY-MM-DD" (no timezone shift, unlike toISOString). */
export function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
