import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MUNICIPALITIES, SPECIALITIES, Speciality } from '../../core/models';
import { SpecialityPipe } from '../../shared/labels.pipe';

/** Landing page: search by speciality and municipality (replaces the old "welcome" page). */
@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, SpecialityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <h1>Arzttermine einfach online buchen</h1>
      <p class="lead">
        Finden Sie eine Praxis nach Fachrichtung und Ort – und buchen Sie direkt einen freien
        Termin.
      </p>

      <form class="search card" [formGroup]="form" (ngSubmit)="search()" role="search">
        <label>
          Fachrichtung
          <select formControlName="speciality" data-testid="search-speciality">
            <option [ngValue]="null">Alle Fachrichtungen</option>
            @for (s of specialities; track s) {
              <option [ngValue]="s">{{ s | speciality }}</option>
            }
          </select>
        </label>
        <label>
          Ort
          <input
            formControlName="query"
            list="municipalities"
            placeholder="z. B. San Salvador"
            data-testid="search-query"
          />
          <datalist id="municipalities">
            @for (m of municipalities; track m) {
              <option [value]="m"></option>
            }
          </datalist>
        </label>
        <button type="submit" class="btn btn-primary">Suchen</button>
      </form>
    </section>

    <section>
      <h2>Beliebte Fachrichtungen</h2>
      <div class="chips">
        @for (s of specialities; track s) {
          <a class="chip" routerLink="/clinics" [queryParams]="{ speciality: s }">{{
            s | speciality
          }}</a>
        }
      </div>
    </section>
  `,
})
export class Home {
  private readonly router = inject(Router);
  protected readonly specialities = SPECIALITIES;
  protected readonly municipalities = MUNICIPALITIES;

  protected readonly form = new FormGroup({
    speciality: new FormControl<Speciality | null>(null),
    query: new FormControl('', { nonNullable: true }),
  });

  search(): void {
    const { speciality, query } = this.form.getRawValue();
    void this.router.navigate(['/clinics'], {
      queryParams: { speciality: speciality ?? undefined, q: query.trim() || undefined },
    });
  }
}
