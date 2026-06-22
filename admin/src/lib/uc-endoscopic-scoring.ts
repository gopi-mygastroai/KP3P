import { todayIsoDate } from './iso-date';

export { todayIsoDate, isFutureIsoDate } from './iso-date';

export const MAYO_ENDOSCOPIC_SCORE_OPTIONS = [
  {
    score: 0,
    label: '0',
    helpText: '0 Normal mucosa — no friability, normal vascular pattern',
  },
  {
    score: 1,
    label: '1',
    helpText: '1 Erythema, decreased vascular pattern, mild friability',
  },
  {
    score: 2,
    label: '2',
    helpText: '2 Marked erythema, absent vascular, erosions, frank friability',
  },
  {
    score: 3,
    label: '3',
    helpText: '3 Spontaneous bleeding, deep ulceration',
  },
] as const;

export const MAYO_FIELD_LABEL = 'Mayo Endoscopic Score (MES)';

export type MayoEndoscopicScore = (typeof MAYO_ENDOSCOPIC_SCORE_OPTIONS)[number]['score'];

export type UceisPicklistOption = {
  score: number;
  label: string;
  helpText: string;
};

export type UceisFieldId = 'vascularPattern' | 'bleeding' | 'erosionsAndUlcers';

export type UceisFieldConfig = {
  id: UceisFieldId;
  label: string;
  options: readonly UceisPicklistOption[];
};

export const UCEIS_VASCULAR_PATTERN_OPTIONS = [
  { score: 0, label: '0 - Normal', helpText: '0 Normal vascular pattern' },
  { score: 1, label: '1 - Patchy obliteration', helpText: '1 Patchy obliteration of vascular pattern' },
  { score: 2, label: '2 - Complete obliteration', helpText: '2 Complete obliteration of vascular pattern' },
] as const;

export const UCEIS_BLEEDING_OPTIONS = [
  { score: 0, label: '0 - None', helpText: '0 No bleeding' },
  { score: 1, label: '1 - Mucosal bleeding only', helpText: '1 Mucosal bleeding only — dried blood on surface' },
  { score: 2, label: '2 - Luminal bleeding - mild', helpText: '2 Luminal bleeding — mild (small amount in lumen)' },
  {
    score: 3,
    label: '3 - Luminal bleeding - moderate or severe',
    helpText: '3 Luminal bleeding — moderate or severe (active streaming)',
  },
] as const;

export const UCEIS_EROSIONS_ULCERS_OPTIONS = [
  { score: 0, label: '0 - None', helpText: '0 No erosions or ulcers' },
  {
    score: 1,
    label: '1 - Erosions',
    helpText: '1 Erosions — tiny, ≤5mm, white or yellow fibrin-covered',
  },
  {
    score: 2,
    label: '2 - Superficial ulcer',
    helpText: '2 Superficial ulcer — larger, discrete fibrin-covered',
  },
  {
    score: 3,
    label: '3 - Deep ulcer',
    helpText: '3 Deep ulcer — excavated, clearly depth to ulcer bed',
  },
] as const;

export const UCEIS_FIELDS: readonly UceisFieldConfig[] = [
  { id: 'vascularPattern', label: 'Vascular Pattern', options: UCEIS_VASCULAR_PATTERN_OPTIONS },
  { id: 'bleeding', label: 'Bleeding', options: UCEIS_BLEEDING_OPTIONS },
  { id: 'erosionsAndUlcers', label: 'Erosions & Ulcers', options: UCEIS_EROSIONS_ULCERS_OPTIONS },
];

export type UceisScores = {
  vascularPattern: number;
  bleeding: number;
  erosionsAndUlcers: number;
};

export type UcEndoscopicScoringData = {
  mayoEndoscopicScore: MayoEndoscopicScore;
  uceis: UceisScores;
  /** ISO date (YYYY-MM-DD) when UC endoscopic scores were captured or observed. */
  scoringDate?: string;
};

export function emptyUceisScores(): UceisScores {
  return { vascularPattern: 0, bleeding: 0, erosionsAndUlcers: 0 };
}

export function emptyUcEndoscopicScoring(): UcEndoscopicScoringData {
  return { mayoEndoscopicScore: 0, uceis: emptyUceisScores(), scoringDate: todayIsoDate() };
}

function isMayoScore(n: number): n is MayoEndoscopicScore {
  return n === 0 || n === 1 || n === 2 || n === 3;
}

function parseScoreForField(fieldId: UceisFieldId, raw: unknown): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  const field = UCEIS_FIELDS.find((f) => f.id === fieldId);
  if (!field) return 0;
  return field.options.some((opt) => opt.score === n) ? n : 0;
}

function parseMayoScore(raw: unknown): MayoEndoscopicScore {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || !isMayoScore(n)) return 0;
  return n;
}

function parseUceisScores(raw: unknown): UceisScores {
  const empty = emptyUceisScores();
  if (raw == null) return empty;

  if (typeof raw === 'number' || typeof raw === 'string') {
    const legacy = parseScoreForField('vascularPattern', raw);
    return { ...empty, vascularPattern: legacy };
  }

  if (typeof raw !== 'object') return empty;

  const obj = raw as Record<string, unknown>;
  return {
    vascularPattern: parseScoreForField('vascularPattern', obj.vascularPattern),
    bleeding: parseScoreForField('bleeding', obj.bleeding),
    erosionsAndUlcers: parseScoreForField('erosionsAndUlcers', obj.erosionsAndUlcers),
  };
}

export function parseUcEndoscopicScoring(val: unknown): UcEndoscopicScoringData {
  if (val == null || val === '') return emptyUcEndoscopicScoring();
  let parsed: unknown = val;
  if (typeof val === 'string') {
    try {
      parsed = JSON.parse(val) as unknown;
    } catch {
      return emptyUcEndoscopicScoring();
    }
  }
  if (typeof parsed !== 'object' || parsed === null) return emptyUcEndoscopicScoring();
  const obj = parsed as { mayoEndoscopicScore?: unknown; uceis?: unknown; scoringDate?: unknown };
  const scoringDate = typeof obj.scoringDate === 'string' ? obj.scoringDate : '';
  return {
    mayoEndoscopicScore: parseMayoScore(obj.mayoEndoscopicScore),
    uceis: parseUceisScores(obj.uceis),
    scoringDate,
  };
}

export function normalizeUcEndoscopicScoring(data: UcEndoscopicScoringData): UcEndoscopicScoringData {
  const mayo = data.mayoEndoscopicScore;
  const uceis = parseUceisScores(data.uceis);
  const rawDate = typeof data.scoringDate === 'string' ? data.scoringDate.trim().substring(0, 10) : '';
  const scoringDate = rawDate || todayIsoDate();
  return {
    mayoEndoscopicScore: isMayoScore(mayo) ? mayo : 0,
    uceis,
    scoringDate,
  };
}

export function serializeUcEndoscopicScoring(data: UcEndoscopicScoringData): string {
  return JSON.stringify(normalizeUcEndoscopicScoring(data));
}

export function mayoEndoscopicScoreLabel(score: MayoEndoscopicScore): string {
  const opt = MAYO_ENDOSCOPIC_SCORE_OPTIONS.find((o) => o.score === score);
  return opt?.label ?? String(score);
}

export const UCEIS_TOTAL_MAX = 8;

export function uceisTotal(scores: UceisScores): number {
  return scores.vascularPattern + scores.bleeding + scores.erosionsAndUlcers;
}

export type EndoscopicGrade = {
  label: string;
  display: string;
  color: string;
};

/** MES severity band (0–3). */
export function mesInterpretation(score: MayoEndoscopicScore): EndoscopicGrade {
  if (score === 0) {
    return { label: 'Remission', display: 'Remission', color: '#059669' };
  }
  if (score === 1) {
    return { label: 'Mild', display: 'Mild', color: '#0369a1' };
  }
  if (score === 2) {
    return { label: 'Moderate', display: 'Moderate', color: '#c2410c' };
  }
  return { label: 'Severe', display: 'Severe', color: '#b91c1c' };
}

/** UCEIS severity band from total score (0–8). */
export function uceisInterpretation(total: number): EndoscopicGrade {
  if (total <= 1) {
    return { label: 'Remission', display: 'Remission', color: '#059669' };
  }
  if (total <= 4) {
    return { label: 'Mild Activity', display: 'Mild Activity', color: '#0369a1' };
  }
  if (total <= 6) {
    return { label: 'Moderate Activity', display: 'Moderate Activity', color: '#c2410c' };
  }
  return { label: 'Severe Activity', display: 'Severe Activity', color: '#b91c1c' };
}

export function uceisOptionLabel(fieldId: UceisFieldId, score: number): string {
  const field = UCEIS_FIELDS.find((f) => f.id === fieldId);
  const opt = field?.options.find((o) => o.score === score);
  return opt?.label ?? String(score);
}

export type EndoscopicRemissionResult = {
  inRemission: boolean;
  display: string;
  color: string;
};

/** Endoscopic remission when MES ≤ 1 and UCEIS total ≤ 1. */
export function endoscopicRemission(
  mesScore: MayoEndoscopicScore,
  uceisTotalScore: number,
): EndoscopicRemissionResult {
  const inRemission = mesScore <= 1 && uceisTotalScore <= 1;
  return {
    inRemission,
    display: inRemission
      ? '✔  YES — Remission on both scores'
      : '✘  NOT in remission',
    color: inRemission ? '#059669' : '#b91c1c',
  };
}
