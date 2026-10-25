import { APP_INITIALIZER, ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateMultiHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { demoBackendInterceptor } from './demo/demo.providers';
import { environment } from '../environments/environment';
import { AuthService } from './core/services/auth-service/auth.service';
import { LanguageService } from './core/services/language-service/language.service';
import { I18N_RESOURCES } from './i18n-resources';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        languageInterceptor,
        errorInterceptor,
        // Le faux backend (démo GitHub Pages) reste en dernier : il court-circuite
        // le réseau tout en laissant errorInterceptor gérer les 401/refresh.
        ...(environment.demo ? [demoBackendInterceptor] : []),
      ]),
    ),
    provideTranslateService({
      lang: 'fr',
      fallbackLang: 'fr',
      loader: provideTranslateMultiHttpLoader({ resources: I18N_RESOURCES }),
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authService = inject(AuthService);
        inject(LanguageService);
        return () => authService.initAuthState();
      },
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.demo || environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
