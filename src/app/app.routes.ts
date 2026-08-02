import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { managerGuard } from './core/guards/manager.guard';
import { SimulationComponent } from './pages/simulation/simulation.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'simulation',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'simulation',
    component: SimulationComponent,
  },
  {
    path: 'admin',
    canActivate: [authGuard, managerGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'bam-parameters',
        loadComponent: () =>
          import('./pages/admin/bam-parameters/bam-parameters.component').then((m) => m.BamParametersComponent),
      },
      {
        path: 'credit-rates',
        loadComponent: () =>
          import('./pages/admin/credit-rates/credit-rates.component').then((m) => m.CreditRatesComponent),
      },
      {
        path: 'mourabaha-parameters',
        loadComponent: () =>
          import('./pages/admin/mourabaha-parameters/mourabaha-parameters.component').then(
            (m) => m.MourabahaParametersComponent,
          ),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./pages/admin/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'simulation',
  },
];