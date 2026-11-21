import { availableSlots, daySlots, fromMinutes, localNow, toMinutes } from './slots';

describe('slots', () => {
  it('converts between "HH:mm" and minutes', () => {
    expect(toMinutes('08:30')).toBe(510);
    expect(fromMinutes(510)).toBe('08:30');
    expect(fromMinutes(toMinutes('17:05'))).toBe('17:05');
  });

  it('generates 30-minute slots between opening and closing time (closing exclusive)', () => {
    const slots = daySlots('2026-12-01', '08:00', '10:00');
    expect(slots.map((s) => s.time)).toEqual(['08:00', '08:30', '09:00', '09:30']);
    expect(slots[0]).toEqual({ time: '08:00', start: '2026-12-01T08:00', end: '2026-12-01T08:30' });
  });

  it('does not create a partial slot at the end of the day', () => {
    expect(daySlots('2026-12-01', '08:00', '08:45').map((s) => s.time)).toEqual(['08:00']);
  });

  it('returns no slots when the clinic opens after it closes', () => {
    expect(daySlots('2026-12-01', '18:00', '08:00')).toEqual([]);
  });

  it('removes booked and past slots', () => {
    const slots = daySlots('2026-12-01', '08:00', '10:00');
    const result = availableSlots(slots, ['2026-12-01T09:00'], '2026-12-01T08:15');
    expect(result.map((s) => s.time)).toEqual(['08:30', '09:30']);
  });

  it('formats the local date-time without timezone conversion', () => {
    expect(localNow(new Date(2026, 0, 5, 7, 3))).toBe('2026-01-05T07:03');
  });
});
