import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language-service/language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/i18n/')) {
    return next(req);
  }
  const language = inject(LanguageService).currentLanguage();
  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};
