import { todayIsoDate } from './iso-date';

export const SES_CD_SEGMENTS = [
  { id: 'terminalIleum', label: 'Terminal Ileum', maxScore: 3 },
  { id: 'rightColon', label: 'Right Colon', maxScore: 3 },
  { id: 'transverseColon', label: 'Transverse Colon', maxScore: 3 },
  { id: 'leftSigmoid', label: 'Left / Sigmoid', maxScore: 3 },
  { id: 'rectum', label: 'Rectum', maxScore: 3 },
] as const;

export type SesCdSegmentId = (typeof SES_CD_SEGMENTS)[number]['id'];

export const SES_CD_VARIABLES = [
  { id: 'ulcerSize', label: '1. Ulcer Size (US)' },
  { id: 'ulceratedSurface', label: '2. Ulcerated Surface (ULS) - % of segment' },
  { id: 'affectedSurface', label: '3. Affected Surface (AFS) - % of segment' },
  { id: 'narrowing', label: '4. Presence of Narrowing (NAR)' },
] as const;

export type SesCdVariableId = (typeof SES_CD_VARIABLES)[number]['id'];

export type SesCdScores = Record<SesCdVariableId, Record<SesCdSegmentId, number | null>>;

export type SesCdScoringData = {
  scores: SesCdScores;
  /** ISO date (YYYY-MM-DD) when SES-CD scores were captured or observed. */
  scoringDate?: string;
};

export const SES_CD_GRAND_TOTAL_MAX = 60;

/** Ulcer Size (US) picklist — totals use the leading score digit (0–3). */
export const SES_CD_ULCER_SIZE_OPTIONS = [
  { score: 0, label: '0-No ulcer' },
  { score: 1, label: '1-Aphthous (<=5mm)' },
  { score: 2, label: '2-Large (5-20mm)' },
  { score: 3, label: '3-Very large (>20mm)' },
] as const;

/** Ulcerated Surface (ULS) picklist — totals use the leading score digit (0–3). */
export const SES_CD_ULCERATED_SURFACE_OPTIONS = [
  { score: 0, label: '0-None' },
  { score: 1, label: '1-Less than 10%' },
  { score: 2, label: '2-Between 10-30%' },
  { score: 3, label: '3-More than 30%' },
] as const;

/** Affected Surface (AFS) picklist — totals use the leading score digit (0–3). */
export const SES_CD_AFFECTED_SURFACE_OPTIONS = [
  { score: 0, label: '0-Unaffected' },
  { score: 1, label: '1-Less than 50%' },
  { score: 2, label: '2-Between 50-75%' },
  { score: 3, label: '3-More than 75%' },
] as const;

/** Presence of Narrowing (NAR) picklist — totals use the leading score digit (0–3). */
export const SES_CD_NARROWING_OPTIONS = [
  { score: 0, label: '0-None' },
  { score: 1, label: '1-Single passable' },
  { score: 2, label: '2-Multiple passable' },
  { score: 3, label: '3-Non-passable' },
] as const;

export type SesCdPicklistOption = { score: number; label: string };

const SES_CD_LABELED_OPTIONS: Partial<
  Record<SesCdVariableId, readonly { score: number; label: string }[]>
> = {
  ulcerSize: SES_CD_ULCER_SIZE_OPTIONS,
  ulceratedSurface: SES_CD_ULCERATED_SURFACE_OPTIONS,
  affectedSurface: SES_CD_AFFECTED_SURFACE_OPTIONS,
  narrowing: SES_CD_NARROWING_OPTIONS,
};

export function usesLabeledPicklist(variableId: SesCdVariableId): boolean {
  return variableId in SES_CD_LABELED_OPTIONS;
}

function emptyScores(): SesCdScores {
  const scores = {} as SesCdScores;
  for (const v of SES_CD_VARIABLES) {
    scores[v.id] = {} as Record<SesCdSegmentId, number | null>;
    for (const s of SES_CD_SEGMENTS) {
      scores[v.id][s.id] = 0;
    }
  }
  return scores;
}

/** Coerce unset cells to 0 (first picklist option per variable). */
function resolvedScore(cell: unknown): number {
  const n = parseScoreValue(cell);
  return n ?? 0;
}

function isSegmentId(v: string): v is SesCdSegmentId {
  return SES_CD_SEGMENTS.some((s) => s.id === v);
}

function isVariableId(v: string): v is SesCdVariableId {
  return SES_CD_VARIABLES.some((x) => x.id === v);
}

export function scoreOptionsForSegment(segmentId: SesCdSegmentId): number[] {
  const seg = SES_CD_SEGMENTS.find((s) => s.id === segmentId);
  const max = seg?.maxScore ?? 3;
  return Array.from({ length: max + 1 }, (_, i) => i);
}

/** Numeric score from stored cell (number or label string starting with 0–3). */
export function parseScoreValue(cell: unknown): number | null {
  if (cell === null || cell === '') return null;
  if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
  if (typeof cell === 'string') {
    const t = cell.trim();
    if (!t) return null;
    const leading = Number(t.charAt(0));
    if (Number.isFinite(leading)) return leading;
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function scoreOptionsForCell(
  variableId: SesCdVariableId,
  segmentId: SesCdSegmentId,
): SesCdPicklistOption[] {
  const labeled = SES_CD_LABELED_OPTIONS[variableId];
  if (labeled) {
    const max = SES_CD_SEGMENTS.find((s) => s.id === segmentId)?.maxScore ?? 3;
    return labeled
      .filter((o) => o.score <= max)
      .map((o) => ({ score: o.score, label: o.label }));
  }
  return scoreOptionsForSegment(segmentId).map((n) => ({ score: n, label: String(n) }));
}

export function parseSesCdScoring(val: unknown): SesCdScoringData {
  const scores = emptyScores();
  if (val == null || val === '') return { scores, scoringDate: '' };

  let raw: unknown = val;
  if (typeof val === 'string') {
    try {
      raw = JSON.parse(val);
    } catch {
      return { scores, scoringDate: '' };
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { scores, scoringDate: '' };

  const o = raw as Record<string, unknown>;
  const scoringDate = typeof o.scoringDate === 'string' ? o.scoringDate : '';
  const source =
    o.scores && typeof o.scores === 'object' && !Array.isArray(o.scores)
      ? (o.scores as Record<string, unknown>)
      : o;

  for (const [varKey, row] of Object.entries(source)) {
    if (!isVariableId(varKey) || !row || typeof row !== 'object' || Array.isArray(row)) continue;
    for (const [segKey, cell] of Object.entries(row as Record<string, unknown>)) {
      if (!isSegmentId(segKey)) continue;
      scores[varKey][segKey] = resolvedScore(cell);
    }
  }

  return { scores, scoringDate };
}

/** Ensure every cell has the default score of 0. */
export function normalizeSesCdScoring(data: SesCdScoringData): SesCdScoringData {
  const scores = emptyScores();
  for (const v of SES_CD_VARIABLES) {
    for (const s of SES_CD_SEGMENTS) {
      const raw = data.scores[v.id]?.[s.id];
      scores[v.id][s.id] = resolvedScore(raw);
    }
  }
  return {
    scores,
    scoringDate: (typeof data.scoringDate === 'string' ? data.scoringDate.trim().substring(0, 10) : '') || todayIsoDate(),
  };
}

export function serializeSesCdScoring(data: SesCdScoringData): string {
  return JSON.stringify(normalizeSesCdScoring(data));
}

function cellValue(scores: SesCdScores, variableId: SesCdVariableId, segmentId: SesCdSegmentId): number {
  const v = scores[variableId][segmentId];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export function rowTotal(scores: SesCdScores, variableId: SesCdVariableId): number {
  return SES_CD_SEGMENTS.reduce((sum, seg) => sum + cellValue(scores, variableId, seg.id), 0);
}

export function columnTotal(scores: SesCdScores, segmentId: SesCdSegmentId): number {
  return SES_CD_VARIABLES.reduce((sum, v) => sum + cellValue(scores, v.id, segmentId), 0);
}

export function sesCdGrandTotal(scores: SesCdScores): number {
  return SES_CD_VARIABLES.reduce((sum, v) => sum + rowTotal(scores, v.id), 0);
}

export type SesCdInterpretation = {
  label: string;
  /** Display text shown beside the field label (e.g. "Severe (>16)"). */
  display: string;
  color: string;
};

/** SES-CD severity band from grand total (0–60). */
export function sesCdInterpretation(grandTotal: number): SesCdInterpretation {
  if (grandTotal === 0) {
    return { label: 'Remission', display: 'Remission (0)', color: '#059669' };
  }
  if (grandTotal <= 2) {
    return { label: 'Mild', display: 'Mild (1–2)', color: '#0369a1' };
  }
  if (grandTotal <= 8) {
    return { label: 'Mild-Moderate', display: 'Mild-Moderate (3–8)', color: '#b45309' };
  }
  if (grandTotal <= 16) {
    return { label: 'Moderate', display: 'Moderate (9–16)', color: '#c2410c' };
  }
  return { label: 'Severe', display: 'Severe (>16)', color: '#b91c1c' };
}

export const SES_CD_INTERPRETATION_LEGEND =
  'SES-CD: 0 = Remission | 1-2 = Mild | 3-8 = Mild-Moderate | 9-16 = Moderate | >16 = Severe | Endoscopic Remission = SES-CD <= 2 | Response = >=50% reduction from baseline';

export function emptySesCdScoring(): SesCdScoringData {
  return { scores: emptyScores(), scoringDate: todayIsoDate() };
}
