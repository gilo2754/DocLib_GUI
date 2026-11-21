import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import {
  CLINIC_STATES,
  Clinic,
  ClinicState,
  SPECIALITIES,
  Speciality,
  isSpeciality,
} from '../../core/models';
import { ClinicService } from '../../core/services/clinic.service';
import { ConfirmService } from '../../shared/confirm-dialog';
import { errorMessage } from '../../shared/http-error';
import { ClinicStatePipe, SpecialityPipe } from '../../shared/labels.pipe';
import { filterClinics } from './clinic-filter';

@Component({
  selector: 'app-clinic-list',
  imports: [RouterLink, SpecialityPipe, ClinicStatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <h1>Praxen</h1>
      @if (auth.isLoggedIn()) {
        <a routerLink="/clinics/new" class="btn btn-primary">Neue Praxis</a>
      }
    </div>

    <form class="filters card" (submit)="$event.preventDefault()" aria-label="Filter">
      <label>
        Fachrichtung
        <select data-testid="filter-speciality" (change)="setSpeciality($any($event.target).value)">
          <option value="" [selected]="!selectedSpeciality()">Alle</option>
          @for (s of specialities; track s) {
            <option [value]="s" [selected]="s === selectedSpeciality()">
              {{ s | speciality }}
            </option>
          }
        </select>
      </label>
      <label>
        Suche (Name, Ort)
        <input
          type="search"
          data-testid="filter-query"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </label>
      <label>
        Status
        <select (change)="state.set($any($event.target).value || null)">
          <option value="">Alle</option>
          @for (s of states; track s) {
            <option [value]="s">{{ s | clinicState }}</option>
          }
        </select>
      </label>
    </form>

    @if (message(); as msg) {
      <p
        class="alert"
        [class.alert-error]="msg.error"
        [class.alert-success]="!msg.error"
        role="status"
      >
        {{ msg.text }}
      </p>
    }

    @if (loading()) {
      <p class="muted" aria-busy="true">Praxen werden geladen …</p>
    } @else {
      <p class="muted" data-testid="result-count">
        {{ filtered().length }} von {{ clinics().length }} Praxen
      </p>
      <ul class="grid" data-testid="clinic-list">
        @for (clinic of filtered(); track clinic.clinic_id) {
          <li class="card clinic-card">
            <div class="clinic-card__head">
              <span class="badge">{{ clinic.speciality | speciality }}</span>
              <span class="state state--{{ clinic.clinic_state }}">{{
                clinic.clinic_state | clinicState
              }}</span>
            </div>
            <h2>
              <a [routerLink]="['/clinics', clinic.clinic_id]">{{ clinic.clinic_name }}</a>
            </h2>
            <p class="muted">{{ clinic.clinic_address }}</p>
            <p>{{ clinic.clinic_description }}</p>
            <p class="muted small">
              {{ clinic.openingTime }}–{{ clinic.closingTime }} Uhr ·
              {{ clinic.clinic_phone_number }}
            </p>
            <div class="actions">
              <a [routerLink]="['/clinics', clinic.clinic_id]" class="btn btn-primary"
                >Termin buchen</a
              >
              @if (auth.isLoggedIn()) {
                <a [routerLink]="['/clinics', clinic.clinic_id, 'edit']" class="btn btn-ghost"
                  >Bearbeiten</a
                >
                <button type="button" class="btn btn-danger" (click)="remove(clinic)">
                  Löschen
                </button>
              }
            </div>
          </li>
        } @empty {
          <li class="empty">Keine Praxen für diese Auswahl gefunden.</li>
        }
      </ul>
    }
  `,
})
export class ClinicList implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly clinicService = inject(ClinicService);
  private readonly router = inject(Router);
  private readonly confirmService = inject(ConfirmService);

  /** Query params (bound via withComponentInputBinding). */
  readonly speciality = input<string>();
  readonly q = input<string>();

  protected readonly specialities = SPECIALITIES;
  protected readonly states = CLINIC_STATES;

  protected readonly selectedSpeciality = linkedSignal<Speciality | null>(() => {
    const s = this.speciality();
    return isSpeciality(s) ? s : null;
  });
  protected readonly query = linkedSignal(() => this.q() ?? '');
  protected readonly state = signal<ClinicState | null>(null);

  protected readonly clinics = signal<Clinic[]>([]);
  protected readonly loading = signal(true);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly filtered = computed(() =>
    filterClinics(this.clinics(), {
      speciality: this.selectedSpeciality(),
      query: this.query(),
      state: this.state(),
    }),
  );

  ngOnInit(): void {
    this.load();
  }

  setSpeciality(value: string): void {
    const speciality = isSpeciality(value) ? value : null;
    this.selectedSpeciality.set(speciality);
    // keep the URL shareable
    void this.router.navigate([], {
      queryParams: { speciality: speciality ?? undefined },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  async remove(clinic: Clinic): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Praxis löschen?',
      message: `„${clinic.clinic_name}“ wird dauerhaft gelöscht.`,
      confirmLabel: 'Löschen',
      danger: true,
    });
    if (!confirmed) return;
    this.clinicService.delete(clinic.clinic_id).subscribe({
      next: () => {
        this.message.set({ text: `„${clinic.clinic_name}“ wurde gelöscht.`, error: false });
        this.clinics.update((list) => list.filter((c) => c.clinic_id !== clinic.clinic_id));
      },
      error: (err: unknown) => this.message.set({ text: errorMessage(err), error: true }),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.clinicService.list().subscribe({
      next: (clinics) => {
        this.clinics.set(clinics);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.message.set({ text: errorMessage(err), error: true });
      },
    });
  }
}
