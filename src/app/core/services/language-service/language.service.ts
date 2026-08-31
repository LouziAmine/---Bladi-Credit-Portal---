import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'fr' | 'en' | 'ar';

export const APP_LANGUAGES: readonly AppLanguage[] = ['fr', 'en', 'ar'];

const STORAGE_KEY = 'cb-language';
const RTL_LANGUAGES: readonly AppLanguage[] = ['ar'];
const DEFAULT_LANGUAGE: AppLanguage = 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLanguage = signal<AppLanguage>(this.resolveInitialLanguage());

  constructor() {
    this.apply(this.currentLanguage());
  }

  setLanguage(lang: AppLanguage): void {
    if (lang === this.currentLanguage()) {
      return;
    }
    this.currentLanguage.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.apply(lang);
  }

  isRtl(lang: AppLanguage = this.currentLanguage()): boolean {
    return RTL_LANGUAGES.includes(lang);
  }

  private apply(lang: AppLanguage): void {
    this.translate.use(lang);

    const rtl = this.isRtl(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';

    const ltrLink = document.getElementById('bootstrap-ltr') as HTMLLinkElement | null;
    const rtlLink = document.getElementById('bootstrap-rtl') as HTMLLinkElement | null;
    if (ltrLink) {
      ltrLink.disabled = rtl;
    }
    if (rtlLink) {
      rtlLink.disabled = !rtl;
    }
  }

  private resolveInitialLanguage(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'ar') {
      return stored;
    }
    return DEFAULT_LANGUAGE;
  }
}
