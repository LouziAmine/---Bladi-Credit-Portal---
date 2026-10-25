import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { clientGuard } from './core/guards/client.guard';
import { guestGuard } from './core/guards/guest.guard';
import { managerGuard } from './core/guards/manager.guard';
import { MortgageCreditComponent } from './pages/mortgage-credit/mortgage-credit.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'mortgage-credit',
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
    path: 'invitations/:token',
    loadComponent: () =>
      import('./pages/invitations/invitations.component').then((m) => m.InvitationsComponent),
  },
  {
    path: 'mortgage-credit',
    component: MortgageCreditComponent,
  },
  {
    path: 'investment-credit',
    loadComponent: () =>
      import('./pages/investment-credit/investment-credit.component').then((m) => m.InvestmentCreditComponent),
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
        path: 'investment-credit-parameters',
        loadComponent: () =>
          import('./pages/admin/investment-credit-parameters/investment-credit-parameters.component').then(
            (m) => m.InvestmentCreditParametersComponent,
          ),
      },
      {
        path: 'enterprises',
        loadComponent: () =>
          import('./pages/admin/enterprises/enterprises.component').then((m) => m.EnterprisesComponent),
      },
      {
        path: 'enterprise-links',
        loadComponent: () =>
          import('./pages/admin/enterprise-links/enterprise-links.component').then(
            (m) => m.EnterpriseLinksComponent,
          ),
      },
      {
        path: 'activity-sectors',
        loadComponent: () =>
          import('./pages/admin/activity-sectors/activity-sectors.component').then(
            (m) => m.ActivitySectorsComponent,
          ),
      },
      {
        path: 'document-suggestions',
        loadComponent: () =>
          import('./pages/admin/document-suggestions/document-suggestions.component').then(
            (m) => m.DocumentSuggestionsComponent,
          ),
      },
      {
        path: 'demands',
        loadComponent: () =>
          import('./pages/admin/demands/demands.component').then((m) => m.DemandsComponent),
      },
      {
        path: 'demands/import',
        loadComponent: () =>
          import('./pages/admin/demands/demand-import/demand-import.component').then(
            (m) => m.DemandImportComponent,
          ),
      },
      {
        path: 'demands/:id',
        loadComponent: () =>
          import('./pages/admin/demands/demand-detail/demand-detail.component').then(
            (m) => m.DemandDetailComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'portal',
    canActivate: [authGuard, clientGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/portal/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
      },
      {
        path: 'mortgage/:demandId',
        loadComponent: () =>
          import('./pages/portal/portal-demand-detail/portal-demand-detail.component').then(
            (m) => m.PortalDemandDetailComponent,
          ),
      },
      {
        path: ':enterpriseId/demands',
        loadComponent: () =>
          import('./pages/portal/portfolio-demands/portfolio-demands.component').then(
            (m) => m.PortfolioDemandsComponent,
          ),
      },
      {
        path: ':enterpriseId/demands/:demandId',
        loadComponent: () =>
          import('./pages/portal/portal-demand-detail/portal-demand-detail.component').then(
            (m) => m.PortalDemandDetailComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'mortgage-credit',
  },
];