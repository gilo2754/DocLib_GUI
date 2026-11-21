/** Mirrors `com.pluralsight.enums.Speciality` of the Spring Boot backend. */
export const SPECIALITIES = [
  'CARDIOLOGIA',
  'DERMATOLOGIA',
  'GASTROENTEROLOGIA',
  'NEUROLOGIA',
  'OFTALMOLOGIA',
  'ONCOLOGIA',
  'PEDIATRIA',
  'PSIQUIATRIA',
  'TRAUMATOLOGIA',
] as const;

export type Speciality = (typeof SPECIALITIES)[number];

/** Human readable (German) labels used in the UI. */
export const SPECIALITY_LABELS: Record<Speciality, string> = {
  CARDIOLOGIA: 'Kardiologie',
  DERMATOLOGIA: 'Dermatologie',
  GASTROENTEROLOGIA: 'Gastroenterologie',
  NEUROLOGIA: 'Neurologie',
  OFTALMOLOGIA: 'Augenheilkunde',
  ONCOLOGIA: 'Onkologie',
  PEDIATRIA: 'Kinderheilkunde',
  PSIQUIATRIA: 'Psychiatrie',
  TRAUMATOLOGIA: 'Unfallchirurgie',
};

export function isSpeciality(value: unknown): value is Speciality {
  return typeof value === 'string' && (SPECIALITIES as readonly string[]).includes(value);
}
