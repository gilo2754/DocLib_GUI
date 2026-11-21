import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'DocLib – Arzttermine online buchen',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    title: 'Anmelden – DocLib',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'clinics',
    title: 'Praxen – DocLib',
    loadComponent: () => import('./features/clinics/clinic-list').then((m) => m.ClinicList),
  },
  {
    path: 'clinics/new',
    title: 'Neue Praxis – DocLib',
    canActivate: [authGuard],
    loadComponent: () => import('./features/clinics/clinic-form').then((m) => m.ClinicForm),
  },
  {
    path: 'clinics/:id',
    title: 'Praxis – DocLib',
    loadComponent: () => import('./features/clinics/clinic-detail').then((m) => m.ClinicDetail),
  },
  {
    path: 'clinics/:id/edit',
    title: 'Praxis bearbeiten – DocLib',
    canActivate: [authGuard],
    loadComponent: () => import('./features/clinics/clinic-form').then((m) => m.ClinicForm),
  },
  {
    path: '**',
    title: 'Seite nicht gefunden – DocLib',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
