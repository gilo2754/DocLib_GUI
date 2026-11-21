import { Clinic, ClinicState, Speciality } from '../../core/models';

export interface ClinicFilter {
  speciality?: Speciality | null;
  /** Free text matched against name, address (municipality) and description. */
  query?: string | null;
  state?: ClinicState | null;
}

/** Lower-cases and strips diacritics so "cuscatlan" matches "Cuscatlán". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filterClinics(clinics: readonly Clinic[], filter: ClinicFilter): Clinic[] {
  const query = filter.query ? normalize(filter.query) : '';
  return clinics
    .filter((c) => !filter.speciality || c.speciality === filter.speciality)
    .filter((c) => !filter.state || c.clinic_state === filter.state)
    .filter(
      (c) =>
        !query ||
        normalize(`${c.clinic_name} ${c.clinic_address} ${c.clinic_description}`).includes(query),
    )
    .sort((a, b) => a.clinic_name.localeCompare(b.clinic_name, 'de'));
}
