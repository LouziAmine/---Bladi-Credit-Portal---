const LEGAL_SUFFIXES = ['SARLAU', 'SARL AU', 'SARL', 'SA', 'SAS', 'SASU', 'EURL', 'SNC', 'GIE', 'ETS'];

export function normalizeEnterpriseName(rawName: string | null | undefined): string {
  if (!rawName || !rawName.trim()) {
    return '';
  }
  const withoutAccents = rawName.normalize('NFD').replace(/\p{M}+/gu, '');
  let cleaned = withoutAccents
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let previous: string;
  do {
    previous = cleaned;
    for (const suffix of LEGAL_SUFFIXES) {
      if (cleaned.endsWith(' ' + suffix)) {
        cleaned = cleaned.substring(0, cleaned.length - suffix.length - 1).trim();
        break;
      }
    }
  } while (cleaned !== previous);

  return cleaned;
}
