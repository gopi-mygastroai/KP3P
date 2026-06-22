import { todayIsoDate } from './iso-date';

export const HBI_GENERAL_WELLBEING_OPTIONS = [
  { score: 0, label: '0 — Very well' },
  { score: 1, label: '1 — Slightly below par' },
  { score: 2, label: '2 — Poor' },
  { score: 3, label: '3 — Very poor' },
  { score: 4, label: '4 — Terrible' },
] as const;

export const HBI_ABDOMINAL_PAIN_OPTIONS = [
  { score: 0, label: '0 — None' },
  { score: 1, label: '1 — Mild' },
  { score: 2, label: '2 — Moderate' },
  { score: 3, label: '3 — Severe' },
] as const;

export const HBI_ABDOMINAL_MASS_OPTIONS = [
  { score: 0, label: '0 — None' },
  { score: 1, label: '1 — Dubious' },
  { score: 2, label: '2 — Definite' },
  { score: 3, label: '3 — Definite + tender' },
] as const;

export const HBI_REFERENCE_ROWS = [
  { range: '≤ 4', category: 'Remission', meaning: 'No active disease' },
  { range: '5 – 7', category: 'Mild Active', meaning: 'Symptomatic; monitor closely' },
  { range: '8 – 12', category: 'Moderate Active', meaning: 'Significant symptom burden; clinical review indicated' },
  { range: '≥ 13', category: 'Severe Active', meaning: 'High disease burden; urgent clinical review' },
] as const;

export const HBI_FOOTNOTE =
  "HBI is a validated PRO/clinical index for Crohn's disease. Symptoms refer to the previous 24 hours. HBI ≤ 4 aligns with endoscopic remission in validated studies (Harvey & Bradshaw, Lancet 1980).";

export type HbiPicklistOption = { score: number; label: string };

export type HarveyBradshawIndexData = {
  /** ISO date (YYYY-MM-DD) when HBI was assessed. */
  assessmentDate?: string;
  generalWellbeing: number;
  abdominalPain: number;
  liquidSoftStools: number;
  abdominalMass: number;
  complications: number;
};

export type HbiInterpretation = {
  label: string;
  display: string;
  color: string;
  clinicalMeaning: string;
};

function clampInt(raw: unknown, min: number, max: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parsePicklistScore(raw: unknown, options: readonly HbiPicklistOption[]): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isFinite(n) && options.some((o) => o.score === n)) return n;
  return 0;
}

export function emptyHarveyBradshawIndex(): HarveyBradshawIndexData {
  return {
    assessmentDate: todayIsoDate(),
    generalWellbeing: 0,
    abdominalPain: 0,
    liquidSoftStools: 0,
    abdominalMass: 0,
    complications: 0,
  };
}

export function parseHarveyBradshawIndex(val: unknown): HarveyBradshawIndexData {
  if (val == null || val === '') return emptyHarveyBradshawIndex();

  let raw: unknown = val;
  if (typeof val === 'string') {
    try {
      raw = JSON.parse(val);
    } catch {
      return emptyHarveyBradshawIndex();
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyHarveyBradshawIndex();

  const o = raw as Record<string, unknown>;
  const assessmentDate = typeof o.assessmentDate === 'string' ? o.assessmentDate : '';

  return {
    assessmentDate,
    generalWellbeing: parsePicklistScore(o.generalWellbeing, HBI_GENERAL_WELLBEING_OPTIONS),
    abdominalPain: parsePicklistScore(o.abdominalPain, HBI_ABDOMINAL_PAIN_OPTIONS),
    liquidSoftStools: clampInt(o.liquidSoftStools, 0, 999),
    abdominalMass: parsePicklistScore(o.abdominalMass, HBI_ABDOMINAL_MASS_OPTIONS),
    complications: clampInt(o.complications, 0, 8),
  };
}

export function normalizeHarveyBradshawIndex(data: HarveyBradshawIndexData): HarveyBradshawIndexData {
  const rawDate = typeof data.assessmentDate === 'string' ? data.assessmentDate.trim().substring(0, 10) : '';
  return {
    assessmentDate: rawDate || todayIsoDate(),
    generalWellbeing: parsePicklistScore(data.generalWellbeing, HBI_GENERAL_WELLBEING_OPTIONS),
    abdominalPain: parsePicklistScore(data.abdominalPain, HBI_ABDOMINAL_PAIN_OPTIONS),
    liquidSoftStools: clampInt(data.liquidSoftStools, 0, 999),
    abdominalMass: parsePicklistScore(data.abdominalMass, HBI_ABDOMINAL_MASS_OPTIONS),
    complications: clampInt(data.complications, 0, 8),
  };
}

export function serializeHarveyBradshawIndex(data: HarveyBradshawIndexData): string {
  return JSON.stringify(normalizeHarveyBradshawIndex(data));
}

export function hbiTotal(data: HarveyBradshawIndexData): number {
  return (
    data.generalWellbeing +
    data.abdominalPain +
    data.liquidSoftStools +
    data.abdominalMass +
    data.complications
  );
}

/** HBI severity band from total score. */
export function hbiInterpretation(total: number): HbiInterpretation {
  if (total <= 4) {
    return {
      label: 'Remission',
      display: '✅  Remission',
      color: '#059669',
      clinicalMeaning: 'No active disease',
    };
  }
  if (total <= 7) {
    return {
      label: 'Mild Active',
      display: '🟡  Mild Active',
      color: '#b45309',
      clinicalMeaning: 'Symptomatic; monitor closely',
    };
  }
  if (total <= 12) {
    return {
      label: 'Moderate Active',
      display: '🟠  Moderate Active',
      color: '#c2410c',
      clinicalMeaning: 'Significant symptom burden; clinical review indicated',
    };
  }
  return {
    label: 'Severe Active',
    display: '🔴  Severe Active',
    color: '#b91c1c',
    clinicalMeaning: 'High disease burden; urgent clinical review',
  };
}
