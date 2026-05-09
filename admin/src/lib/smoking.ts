/** Map stored smoking labels to wizard radio values so admin assessment shows the correct selection. */
export function normalizeSmokingStatusForForm(raw: unknown): string {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return '';
  if (s.startsWith('current')) return 'Current smoker';
  if (s.startsWith('former') || s.startsWith('ex')) return 'Ex smoker';
  if (s.startsWith('never')) return 'Never smoked';
  const titled = s.charAt(0).toUpperCase() + s.slice(1);
  if (['Current', 'Former', 'Never'].includes(titled)) return titled;
  return String(raw ?? '').trim();
}

export function formatSmokingSummary(status: unknown, details: unknown): string {
  const s = String(status ?? '').trim();
  const d = String(details ?? '').trim();
  if (!s && !d) return '';
  if (!d) return s;
  if (!s) return d;
  return `${s} — ${d}`;
}
