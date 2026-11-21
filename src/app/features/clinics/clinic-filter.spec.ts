import { SEED_CLINICS } from '../../core/mock-api/seed-data';
import { filterClinics, normalize } from './clinic-filter';

describe('filterClinics', () => {
  it('returns all clinics sorted by name when no filter is set', () => {
    const result = filterClinics(SEED_CLINICS, {});
    expect(result).toHaveLength(SEED_CLINICS.length);
    const names = result.map((c) => c.clinic_name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'de')));
  });

  it('filters by speciality', () => {
    const result = filterClinics(SEED_CLINICS, { speciality: 'PEDIATRIA' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.speciality === 'PEDIATRIA')).toBe(true);
  });

  it('matches the municipality in the address, ignoring case and accents', () => {
    const result = filterClinics(SEED_CLINICS, { query: 'antiguo CUSCATLAN' });
    expect(result.map((c) => c.clinic_id)).toEqual([5]);
  });

  it('combines speciality, text and state filters', () => {
    expect(
      filterClinics(SEED_CLINICS, { speciality: 'DERMATOLOGIA', query: 'tecla', state: 'ACTIVE' }),
    ).toHaveLength(1);
    expect(
      filterClinics(SEED_CLINICS, { speciality: 'DERMATOLOGIA', state: 'INACTIVE' }),
    ).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const input = [...SEED_CLINICS];
    filterClinics(input, { query: 'x' });
    expect(input).toEqual(SEED_CLINICS);
  });

  it('normalize strips diacritics and whitespace', () => {
    expect(normalize('  Usulután ')).toBe('usulutan');
  });
});
