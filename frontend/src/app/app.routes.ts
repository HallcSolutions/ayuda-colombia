import { Routes } from '@angular/router';

/** Cada pestaña del encabezado es una ruta: la app no es una landing de scroll. */
export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'puntos',
    loadComponent: () =>
      import('./features/relief-points/relief-points-section/relief-points-section').then(
        (m) => m.ReliefPointsSection,
      ),
  },
  {
    path: 'alojamientos',
    loadComponent: () =>
      import('./features/lodging/lodging-section/lodging-section').then((m) => m.LodgingSection),
  },
  {
    path: 'camiones',
    loadComponent: () =>
      import('./features/convoys/convoys-section/convoys-section').then((m) => m.ConvoysSection),
  },
  {
    path: 'desaparecidos',
    loadComponent: () =>
      import('./features/missing/missing-section/missing-section').then((m) => m.MissingSection),
  },
  {
    path: 'reportar',
    loadComponent: () =>
      import('./features/report-form/report-form.component').then((m) => m.ReportFormComponent),
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./features/reports-feed/reports-feed.component').then((m) => m.ReportsFeedComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
