import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { Clinic, ClinicDraft, Speciality } from '../models';

/** REST client for `/api/v1/clinic` (see `ClinicController` in the backend). */
@Injectable({ providedIn: 'root' })
export class ClinicService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_CONFIG).apiUrl}/clinic`;

  list(speciality?: Speciality): Observable<Clinic[]> {
    const params = speciality ? new HttpParams().set('Speciality', speciality) : undefined;
    return this.http.get<Clinic[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Clinic> {
    return this.http.get<Clinic>(`${this.baseUrl}/${id}`);
  }

  create(clinic: ClinicDraft): Observable<Clinic> {
    return this.http.post<Clinic>(`${this.baseUrl}/add`, clinic);
  }

  update(id: number, clinic: ClinicDraft): Observable<Clinic> {
    return this.http.put<Clinic>(`${this.baseUrl}/${id}`, { ...clinic, clinic_id: id });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
