import { todayIsoDate } from './iso-date';

export const PMAYO_STOOL_FREQUENCY_OPTIONS = [
  { score: 0, label: '0 — Normal number of stools' },
  { score: 1, label: '1 — 1–2 stools more than normal' },
  { score: 2, label: '2 — 3–4 stools more than normal' },
  { score: 3, label: '3 — 5 or more stools more than normal' },
] as const;

export const PMAYO_RECTAL_BLEEDING_OPTIONS = [
  { score: 0, label: '0 — None' },
  { score: 1, label: '1 — Streaks of blood with stool < half the time' },
  { score: 2, label: '2 — Obvious blood with stool most of the time' },
  { score: 3, label: '3 — Blood alone passed' },
] as const;

export const PMAYO_PGA_OPTIONS = [
  { score: 0, label: '0 — Normal' },
  { score: 1, label: '1 — Mild' },
  { score: 2, label: '2 — Moderate' },
  { score: 3, label: '3 — Severe' },
] as const;

export const PMAYO_REFERENCE_ROWS = [
  {
    range: '0 – 1',
    category: 'Remission',
    meaning: 'No significant disease activity',
    action: 'Continue current therapy; routine monitoring',
  },
  {
    range: '2 – 4',
    category: 'Mild Active',
    meaning: 'Symptomatic; monitor closely',
    action: 'Optimise 5-ASA; consider step-up',
  },
  {
    range: '5 – 6',
    category: 'Moderate Active',
    meaning: 'Significant disease burden; review needed',
    action: 'Steroids / biologic evaluation; reassess at 8 wks',
  },
  {
    range: '7 – 9',
    category: 'Severe Active',
    meaning: 'High disease burden; urgent review',
    action: 'Consider hospitalisation / IV steroids / rescue',
  },
] as const;

export const PMAYO_FOOTNOTE =
  'Partial Mayo Score omits endoscopy (Mayo subscores 0–3 for stool frequency, rectal bleeding, and PGA). pMayo ≤ 1 defines clinical remission in pivotal UC trials (Schroeder et al., NEJM 1987). pMayo correlates strongly with endoscopic remission and is the recommended non-invasive monitoring tool in STRIDE-II. Full Mayo (with endoscopy) required for definitive treat-to-target endoscopic assessment.';

export type PMayoPicklistOption = { score: number; label: string };

export type PartialMayoScoreData = {
  /** ISO date (YYYY-MM-DD) when pMayo was assessed. */
  assessmentDate?: string;
  stoolFrequency: number;
  rectalBleeding: number;
  physiciansGlobalAssessment: number;
};

export type PMayoInterpretation = {
  label: string;
  display: string;
  color: string;
  clinicalMeaning: string;
  action: string;
};

function parsePicklistScore(raw: unknown, options: readonly PMayoPicklistOption[]): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isFinite(n) && options.some((o) => o.score === n)) return n;
  return 0;
}

export function emptyPartialMayoScore(): PartialMayoScoreData {
  return {
    assessmentDate: todayIsoDate(),
    stoolFrequency: 0,
    rectalBleeding: 0,
    physiciansGlobalAssessment: 0,
  };
}

export function parsePartialMayoScore(val: unknown): PartialMayoScoreData {
  if (val == null || val === '') return emptyPartialMayoScore();

  let raw: unknown = val;
  if (typeof val === 'string') {
    try {
      raw = JSON.parse(val);
    } catch {
      return emptyPartialMayoScore();
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyPartialMayoScore();

  const o = raw as Record<string, unknown>;
  const assessmentDate = typeof o.assessmentDate === 'string' ? o.assessmentDate : '';

  return {
    assessmentDate,
    stoolFrequency: parsePicklistScore(o.stoolFrequency, PMAYO_STOOL_FREQUENCY_OPTIONS),
    rectalBleeding: parsePicklistScore(o.rectalBleeding, PMAYO_RECTAL_BLEEDING_OPTIONS),
    physiciansGlobalAssessment: parsePicklistScore(o.physiciansGlobalAssessment, PMAYO_PGA_OPTIONS),
  };
}

export function normalizePartialMayoScore(data: PartialMayoScoreData): PartialMayoScoreData {
  const rawDate = typeof data.assessmentDate === 'string' ? data.assessmentDate.trim().substring(0, 10) : '';
  return {
    assessmentDate: rawDate || todayIsoDate(),
    stoolFrequency: parsePicklistScore(data.stoolFrequency, PMAYO_STOOL_FREQUENCY_OPTIONS),
    rectalBleeding: parsePicklistScore(data.rectalBleeding, PMAYO_RECTAL_BLEEDING_OPTIONS),
    physiciansGlobalAssessment: parsePicklistScore(
      data.physiciansGlobalAssessment,
      PMAYO_PGA_OPTIONS,
    ),
  };
}

export function serializePartialMayoScore(data: PartialMayoScoreData): string {
  return JSON.stringify(normalizePartialMayoScore(data));
}

export function partialMayoTotal(data: PartialMayoScoreData): number {
  return data.stoolFrequency + data.rectalBleeding + data.physiciansGlobalAssessment;
}

/** pMayo severity band from total score (0–9). */
export function partialMayoInterpretation(total: number): PMayoInterpretation {
  if (total <= 1) {
    return {
      label: 'Remission',
      display: '✅  Remission',
      color: '#059669',
      clinicalMeaning: 'No significant disease activity',
      action: 'Continue current therapy; routine monitoring',
    };
  }
  if (total <= 4) {
    return {
      label: 'Mild Active',
      display: '🟡  Mild Active',
      color: '#b45309',
      clinicalMeaning: 'Symptomatic; monitor closely',
      action: 'Optimise 5-ASA; consider step-up',
    };
  }
  if (total <= 6) {
    return {
      label: 'Moderate Active',
      display: '🟠  Moderate Active',
      color: '#c2410c',
      clinicalMeaning: 'Significant disease burden; review needed',
      action: 'Steroids / biologic evaluation; reassess at 8 wks',
    };
  }
  return {
    label: 'Severe Active',
    display: '🔴  Severe Active',
    color: '#b91c1c',
    clinicalMeaning: 'High disease burden; urgent review',
    action: 'Consider hospitalisation / IV steroids / rescue',
  };
}
