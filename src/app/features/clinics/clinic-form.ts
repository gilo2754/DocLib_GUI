import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CLINIC_STATES,
  ClinicDraft,
  ClinicState,
  SPECIALITIES,
  Speciality,
} from '../../core/models';
import { ClinicService } from '../../core/services/clinic.service';
import { errorMessage } from '../../shared/http-error';
import { ClinicStatePipe, SpecialityPipe } from '../../shared/labels.pipe';

/** Cross-field validator: opening time must be before closing time. */
export const openingBeforeClosing: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const opening = group.get('openingTime')?.value as string | undefined;
  const closing = group.get('closingTime')?.value as string | undefined;
  return opening && closing && opening >= closing ? { openingAfterClosing: true } : null;
};

export const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

export function createClinicForm() {
  return new FormGroup(
    {
      clinic_name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      }),
      clinic_description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
      }),
      clinic_address: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)],
      }),
      clinic_phone_number: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PHONE_PATTERN)],
      }),
      speciality: new FormControl<Speciality>('CARDIOLOGIA', { nonNullable: true }),
      clinic_state: new FormControl<ClinicState>('IN_REVIEW', { nonNullable: true }),
      openingTime: new FormControl('08:00', { nonNullable: true, validators: Validators.required }),
      closingTime: new FormControl('16:00', { nonNullable: true, validators: Validators.required }),
    },
    { validators: openingBeforeClosing },
  );
}

@Component({
  selector: 'app-clinic-form',
  imports: [ReactiveFormsModule, RouterLink, SpecialityPipe, ClinicStatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/clinics" class="back">← Alle Praxen</a>
    <h1>{{ isEdit() ? 'Praxis bearbeiten' : 'Neue Praxis' }}</h1>

    @if (error(); as message) {
      <p class="alert alert-error" role="alert">{{ message }}</p>
    }

    @if (loading()) {
      <p class="muted" aria-busy="true">Praxis wird geladen …</p>
    }
    <form class="card form" [hidden]="loading()" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <label>
        Name *
        <input formControlName="clinic_name" data-testid="clinic-name" />
        @if (showError('clinic_name')) {
          <small class="field-error">Bitte mindestens 3 Zeichen eingeben.</small>
        }
      </label>
      <label>
        Beschreibung *
        <textarea formControlName="clinic_description" rows="3"></textarea>
        @if (showError('clinic_description')) {
          <small class="field-error">5 bis 200 Zeichen.</small>
        }
      </label>
      <label>
        Adresse *
        <input formControlName="clinic_address" />
        @if (showError('clinic_address')) {
          <small class="field-error">Bitte eine Adresse angeben.</small>
        }
      </label>
      <label>
        Telefon *
        <input formControlName="clinic_phone_number" placeholder="+503 2222-3333" />
        @if (showError('clinic_phone_number')) {
          <small class="field-error">Bitte eine gültige Telefonnummer eingeben.</small>
        }
      </label>
      <div class="row">
        <label>
          Fachrichtung
          <select formControlName="speciality">
            @for (s of specialities; track s) {
              <option [ngValue]="s">{{ s | speciality }}</option>
            }
          </select>
        </label>
        <label>
          Status
          <select formControlName="clinic_state">
            @for (s of states; track s) {
              <option [ngValue]="s">{{ s | clinicState }}</option>
            }
          </select>
        </label>
      </div>
      <div class="row">
        <label>Öffnet <input type="time" formControlName="openingTime" /></label>
        <label>Schließt <input type="time" formControlName="closingTime" /></label>
      </div>
      @if (form.hasError('openingAfterClosing')) {
        <small class="field-error">Die Öffnungszeit muss vor der Schließzeit liegen.</small>
      }

      <div class="actions">
        <button type="submit" class="btn btn-primary" [disabled]="saving()" data-testid="save">
          {{ saving() ? 'Speichern …' : 'Speichern' }}
        </button>
        <a routerLink="/clinics" class="btn btn-ghost">Abbrechen</a>
      </div>
    </form>
  `,
})
export class ClinicForm implements OnInit {
  private readonly clinicService = inject(ClinicService);
  private readonly router = inject(Router);

  /** Route param `:id` – undefined on /clinics/new. */
  readonly id = input<string>();

  protected readonly specialities = SPECIALITIES;
  protected readonly states = CLINIC_STATES;
  protected readonly form = createClinicForm();
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEdit = signal(false);
  /** True while an existing clinic is being fetched – the form stays hidden so no input is lost. */
  protected readonly loading = signal(false);

  ngOnInit(): void {
    const id = Number(this.id());
    if (!Number.isInteger(id) || id <= 0) return;
    this.isEdit.set(true);
    this.loading.set(true);
    this.clinicService.get(id).subscribe({
      next: ({ clinic_id: _ignored, ...draft }) => {
        this.form.setValue(draft);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  protected showError(name: keyof ClinicDraft): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const draft: ClinicDraft = this.form.getRawValue();
    const request = this.isEdit()
      ? this.clinicService.update(Number(this.id()), draft)
      : this.clinicService.create(draft);

    this.saving.set(true);
    request.subscribe({
      next: (clinic) => void this.router.navigate(['/clinics', clinic.clinic_id]),
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
