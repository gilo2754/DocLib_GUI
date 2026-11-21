import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { AppointmentService } from '../../core/services/appointment.service';
import { ConfirmService } from '../../shared/confirm-dialog';
import { errorMessage } from '../../shared/http-error';
import { AppointmentStatusPipe } from '../../shared/labels.pipe';
import { localNow } from './slots';

@Component({
  selector: 'app-my-appointments',
  imports: [RouterLink, DatePipe, AppointmentStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Meine Termine</h1>

    @if (error(); as message) {
      <p class="alert alert-error" role="alert">{{ message }}</p>
    }

    @if (loading()) {
      <p class="muted" aria-busy="true">Termine werden geladen …</p>
    } @else {
      <h2>Bevorstehend</h2>
      <ul class="list" data-testid="upcoming">
        @for (a of upcoming(); track a.appointment_id) {
          <li class="card appointment">
            <div>
              <strong>
                {{ a.startTime | date: 'EEE, dd.MM.yyyy' }} · {{ a.startTime | date: 'HH:mm' }}–{{
                  a.endTime | date: 'HH:mm'
                }}
                Uhr
              </strong>
              <a [routerLink]="['/clinics', a.clinic.clinic_id]">{{ a.clinic.clinic_name }}</a>
            </div>
            <span class="status status--{{ a.appointment_status }}">{{
              a.appointment_status | appointmentStatus
            }}</span>
            @if (a.appointment_status !== 'CANCELLED') {
              <button type="button" class="btn btn-danger" (click)="cancel(a)">Stornieren</button>
            }
          </li>
        } @empty {
          <li class="empty">
            Keine bevorstehenden Termine. <a routerLink="/clinics">Jetzt Termin buchen</a>
          </li>
        }
      </ul>

      @if (past().length) {
        <h2>Vergangen</h2>
        <ul class="list muted">
          @for (a of past(); track a.appointment_id) {
            <li class="card appointment">
              <span>
                {{ a.startTime | date: 'dd.MM.yyyy, HH:mm' }} Uhr – {{ a.clinic.clinic_name }}
              </span>
              <span>{{ a.appointment_status | appointmentStatus }}</span>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class MyAppointments implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly confirmService = inject(ConfirmService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly now = localNow();
  protected readonly upcoming = computed(() =>
    this.appointments().filter((a) => a.startTime >= this.now),
  );
  protected readonly past = computed(() =>
    this.appointments().filter((a) => a.startTime < this.now),
  );

  ngOnInit(): void {
    this.appointmentService.mine().subscribe({
      next: (list) => {
        this.appointments.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  async cancel(appointment: Appointment): Promise<void> {
    const when = formatDate(appointment.startTime, "EEEE, dd.MM.yyyy 'um' HH:mm", this.locale);
    const confirmed = await this.confirmService.confirm({
      title: 'Termin stornieren?',
      message: `Ihr Termin am ${when} Uhr bei ${appointment.clinic.clinic_name} wird storniert.`,
      confirmLabel: 'Stornieren',
      cancelLabel: 'Termin behalten',
      danger: true,
    });
    if (!confirmed) return;
    this.appointmentService.cancel(appointment.appointment_id).subscribe({
      next: () =>
        this.appointments.update((list) =>
          list.map((a) =>
            a.appointment_id === appointment.appointment_id
              ? { ...a, appointment_status: 'CANCELLED' as const }
              : a,
          ),
        ),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }
}
