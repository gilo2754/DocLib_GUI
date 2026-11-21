import { Pipe, PipeTransform } from '@angular/core';
import {
  APPOINTMENT_STATUS_LABELS,
  AppointmentStatus,
  CLINIC_STATE_LABELS,
  ClinicState,
  SPECIALITY_LABELS,
  Speciality,
} from '../core/models';

@Pipe({ name: 'speciality' })
export class SpecialityPipe implements PipeTransform {
  transform(value: Speciality): string {
    return SPECIALITY_LABELS[value] ?? value;
  }
}

@Pipe({ name: 'clinicState' })
export class ClinicStatePipe implements PipeTransform {
  transform(value: ClinicState): string {
    return CLINIC_STATE_LABELS[value] ?? value;
  }
}

@Pipe({ name: 'appointmentStatus' })
export class AppointmentStatusPipe implements PipeTransform {
  transform(value: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[value] ?? value;
  }
}
