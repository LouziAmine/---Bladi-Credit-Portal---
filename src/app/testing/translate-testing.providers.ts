import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TranslateLoader, TranslationObject, provideTranslateService } from '@ngx-translate/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { I18N_RESOURCES } from '../i18n-resources';

const PUBLIC_I18N_ROOT = join(process.cwd(), 'public/i18n');

@Injectable()
class StaticTranslateLoader extends TranslateLoader {
  override getTranslation(lang: string): Observable<TranslationObject> {
    const merged: TranslationObject = {};
    for (const resource of I18N_RESOURCES) {
      const folder = resource.prefix.replace(/^\/i18n\//, '').replace(/\/$/, '');
      const filePath = join(PUBLIC_I18N_ROOT, folder, `${lang}${resource.suffix}`);
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- test-only, built from the static I18N_RESOURCES registry
        Object.assign(merged, JSON.parse(readFileSync(filePath, 'utf-8')) as TranslationObject);
      } catch {
        continue;
      }
    }
    return of(merged);
  }
}

export function provideTranslateTesting() {
  return provideTranslateService({
    lang: 'fr',
    fallbackLang: 'fr',
    loader: { provide: TranslateLoader, useClass: StaticTranslateLoader },
  });
}
