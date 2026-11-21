import { Routes } from '@angular/router';

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
    path: '**',
    title: 'Seite nicht gefunden – DocLib',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
