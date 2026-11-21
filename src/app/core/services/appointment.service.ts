import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { Appointment, CreateAppointmentRequest } from '../models';

/** REST client for `/api/v1/appointment` (see `AppointmentController`). */
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_CONFIG).apiUrl}/appointment`;

  /** Appointments of the logged-in user. */
  mine(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/person`);
  }

  byClinic(clinicId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/clinic/${clinicId}`);
  }

  create(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/create`, request);
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
