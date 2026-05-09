type VaccineDose = { date?: string; dosage?: string };

type ParsedVaccine = { status: string; doses: VaccineDose[] };

function parseVaccineRaw(raw: unknown): ParsedVaccine | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      status: String(o.status ?? ''),
      doses: Array.isArray(o.doses) ? (o.doses as VaccineDose[]) : [],
    };
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    try {
      const p = JSON.parse(t) as Record<string, unknown>;
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        return {
          status: String(p.status ?? ''),
          doses: Array.isArray(p.doses) ? (p.doses as VaccineDose[]) : [],
        };
      }
    } catch {
      return { status: t, doses: [] };
    }
  }
  return null;
}

function titleCaseStatus(s: string): string {
  const t = s.trim();
  if (!t) return 'Unknown';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Human-readable block for PDF/DOC/LLM prompts (not raw JSON). */
export function formatVaccineForDocExport(raw: unknown): string {
  const parsed = parseVaccineRaw(raw);
  if (!parsed) return '—';

  const st = titleCaseStatus(parsed.status);
  const doses = parsed.doses || [];
  const lines: string[] = [`Status: ${st}`];

  if (doses.length === 0) {
    if (parsed.status?.toLowerCase() === 'given') {
      lines.push('  (No individual doses recorded)');
    }
    return lines.join('\n');
  }

  doses.forEach((d, i) => {
    const date = (d.date && String(d.date).trim()) || '—';
    const dosage = d.dosage && String(d.dosage).trim();
    lines.push(`  Dose ${i + 1}: ${date}${dosage ? ` — ${dosage}` : ''}`);
  });

  return lines.join('\n');
}
