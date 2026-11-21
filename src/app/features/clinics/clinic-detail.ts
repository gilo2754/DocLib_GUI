import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Appointment, Clinic } from '../../core/models';
import { toIsoDate } from '../../core/mock-api/seed-data';
import { AppointmentService } from '../../core/services/appointment.service';
import { ClinicService } from '../../core/services/clinic.service';
import { errorMessage } from '../../shared/http-error';
import { ClinicStatePipe, SpecialityPipe } from '../../shared/labels.pipe';
import { Slot, availableSlots, daySlots, localNow } from '../appointments/slots';

@Component({
  selector: 'app-clinic-detail',
  imports: [RouterLink, DatePipe, SpecialityPipe, ClinicStatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/clinics" class="back">← Alle Praxen</a>

    @if (error(); as message) {
      <p class="alert alert-error" role="alert">{{ message }}</p>
    }

    @if (clinic(); as c) {
      <article class="detail">
        <header>
          <span class="badge">{{ c.speciality | speciality }}</span>
          <span class="state state--{{ c.clinic_state }}">{{ c.clinic_state | clinicState }}</span>
          <h1>{{ c.clinic_name }}</h1>
          <p class="muted">{{ c.clinic_address }} · {{ c.clinic_phone_number }}</p>
          <p>{{ c.clinic_description }}</p>
          <p class="muted">Sprechzeiten: {{ c.openingTime }}–{{ c.closingTime }} Uhr</p>
        </header>

        <section class="card booking" aria-labelledby="booking-title">
          <h2 id="booking-title">Termin buchen</h2>

          @if (c.clinic_state !== 'ACTIVE') {
            <p class="alert alert-info">Diese Praxis nimmt derzeit keine Online-Termine an.</p>
          } @else if (!auth.isLoggedIn()) {
            <p>
              Bitte
              <a routerLink="/login" [queryParams]="{ returnUrl: '/clinics/' + c.clinic_id }"
                >melden Sie sich an</a
              >, um einen Termin zu buchen.
            </p>
          } @else if (booked(); as b) {
            <p class="alert alert-success" role="status" data-testid="booking-success">
              Termin am {{ b.startTime | date: 'EEEE, dd.MM.yyyy' }} um
              {{ b.startTime | date: 'HH:mm' }} Uhr angefragt.
            </p>
            <a routerLink="/appointments" class="btn btn-primary">Zu meinen Terminen</a>
            <button type="button" class="btn btn-ghost" (click)="booked.set(null)">
              Weiteren Termin buchen
            </button>
          } @else {
            <label>
              Datum
              <input
                type="date"
                data-testid="booking-date"
                [min]="today"
                [value]="date()"
                (change)="date.set($any($event.target).value)"
              />
            </label>
            <div class="slots" role="group" aria-label="Freie Termine">
              @for (slot of slots(); track slot.start) {
                <button
                  type="button"
                  class="slot"
                  [class.selected]="selected()?.start === slot.start"
                  [attr.aria-pressed]="selected()?.start === slot.start"
                  (click)="selected.set(slot)"
                >
                  {{ slot.time }}
                </button>
              } @empty {
                <p class="muted">Keine freien Termine an diesem Tag.</p>
              }
            </div>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="book"
              [disabled]="!selected() || saving()"
              (click)="book(c)"
            >
              {{
                saving()
                  ? 'Wird gebucht …'
                  : selected()
                    ? 'Termin um ' + selected()!.time + ' Uhr buchen'
                    : 'Uhrzeit wählen'
              }}
            </button>
          }
        </section>
      </article>
    } @else if (!error()) {
      <p class="muted" aria-busy="true">Praxis wird geladen …</p>
    }
  `,
})
export class ClinicDetail {
  protected readonly auth = inject(AuthService);
  private readonly clinicService = inject(ClinicService);
  private readonly appointmentService = inject(AppointmentService);

  /** Route param `:id`. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly today = toIsoDate(new Date());
  protected readonly clinic = signal<Clinic | null>(null);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly date = signal(toIsoDate(nextWorkday(new Date())));
  protected readonly selected = signal<Slot | null>(null);
  protected readonly saving = signal(false);
  protected readonly booked = signal<Appointment | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly slots = computed(() => {
    const c = this.clinic();
    if (!c || !this.date()) return [];
    const taken = this.appointments()
      .filter((a) => a.appointment_status !== 'CANCELLED')
      .map((a) => a.startTime);
    return availableSlots(daySlots(this.date(), c.openingTime, c.closingTime), taken, localNow());
  });

  constructor() {
    effect(() => this.load(this.id()));
    // reset the chosen slot whenever the date changes
    effect(() => {
      this.date();
      this.selected.set(null);
    });
  }

  book(clinic: Clinic): void {
    const slot = this.selected();
    if (!slot) return;
    this.saving.set(true);
    this.error.set(null);
    this.appointmentService
      .create({ clinic: { clinic_id: clinic.clinic_id }, startTime: slot.start, endTime: slot.end })
      .subscribe({
        next: (appointment) => {
          this.saving.set(false);
          this.booked.set(appointment);
          this.selected.set(null);
          this.appointments.update((list) => [...list, appointment]);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(err));
          this.loadAppointments(clinic.clinic_id);
        },
      });
  }

  private load(id: number): void {
    this.clinicService.get(id).subscribe({
      next: (clinic) => {
        this.clinic.set(clinic);
        this.loadAppointments(id);
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  private loadAppointments(id: number): void {
    if (!this.auth.isLoggedIn()) return;
    this.appointmentService.byClinic(id).subscribe({
      next: (list) => this.appointments.set(list),
      error: () => this.appointments.set([]),
    });
  }
}

/** First weekday after `d` (default booking date). */
export function nextWorkday(d: Date): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return next;
}
