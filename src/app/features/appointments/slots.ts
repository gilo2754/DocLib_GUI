/** Pure helpers for appointment slot calculation (no Angular dependencies). */

export const SLOT_MINUTES = 30;

export interface Slot {
  /** "HH:mm" */
  time: string;
  /** "YYYY-MM-DDTHH:mm" */
  start: string;
  end: string;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** All slots of a day between opening and closing time (closing is exclusive). */
export function daySlots(
  date: string,
  opening: string,
  closing: string,
  minutes = SLOT_MINUTES,
): Slot[] {
  const slots: Slot[] = [];
  for (let t = toMinutes(opening); t + minutes <= toMinutes(closing); t += minutes) {
    slots.push({
      time: fromMinutes(t),
      start: `${date}T${fromMinutes(t)}`,
      end: `${date}T${fromMinutes(t + minutes)}`,
    });
  }
  return slots;
}

/**
 * Slots that are neither booked nor in the past.
 * @param booked start times ("YYYY-MM-DDTHH:mm") of existing, non-cancelled appointments
 * @param now    current local time as "YYYY-MM-DDTHH:mm"
 */
export function availableSlots(slots: Slot[], booked: Iterable<string>, now: string): Slot[] {
  const taken = new Set(booked);
  return slots.filter((s) => !taken.has(s.start) && s.start > now);
}

/** Current local date-time as "YYYY-MM-DDTHH:mm". */
export function localNow(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
