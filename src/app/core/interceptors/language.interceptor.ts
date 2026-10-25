import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language-service/language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  // Bypass des fichiers de traduction (chemin absolu « /i18n/ » ou relatif « i18n/ »)
  // pour éviter une dépendance circulaire à la construction de LanguageService.
  if (req.url.includes('i18n/')) {
    return next(req);
  }
  const language = inject(LanguageService).currentLanguage();
  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};
