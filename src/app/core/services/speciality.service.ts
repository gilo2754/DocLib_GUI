import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { Speciality } from '../models';

@Injectable({ providedIn: 'root' })
export class SpecialityService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);

  list(): Observable<Speciality[]> {
    return this.http.get<Speciality[]>(`${this.api.adminApiUrl}/specialities`);
  }
}
