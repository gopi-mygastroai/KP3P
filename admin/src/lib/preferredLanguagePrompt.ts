/**
 * preferredLanguage may be a plain string (intake / admin assessment radio) or legacy JSON
 * array string from older multi-select, e.g. "Hindi" or '["Hindi"]' or '["English","Hindi"]'.
 */

function parsePreferredLanguages(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) {
        return p.map((x: unknown) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* single label */
    }
    return [t];
  }
  return [];
}

/** Single value for admin assessment radio (from plain string, JSON array string, or array). Defaults to English when unset. */
export function preferredLanguageScalarForForm(raw: unknown): string {
  const langs = parsePreferredLanguages(raw);
  if (langs.length === 0) return 'English';
  const normalized = langs.map((l) => l.trim());
  const nonEn = normalized.find((l) => l.toLowerCase() !== 'english');
  const pick = nonEn ?? normalized[0];
  return pick.charAt(0).toUpperCase() + pick.slice(1).toLowerCase();
}

/** Primary language for patient-facing sections: first non-English if any, otherwise English. */
export function carePlanPrimaryPatientLanguage(raw: unknown): string {
  const langs = parsePreferredLanguages(raw);
  const normalized = langs.map((l) => l.trim());
  const nonEn = normalized.find((l) => l.toLowerCase() !== 'english');
  if (nonEn) {
    return nonEn.charAt(0).toUpperCase() + nonEn.slice(1).toLowerCase();
  }
  return 'English';
}
