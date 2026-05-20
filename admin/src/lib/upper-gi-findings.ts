/** Upper GI segments — one row each in the assessment table. */
export const UPPER_GI_SEGMENTS = [
  { id: 'oesophagus', label: 'Oesophagus' },
  { id: 'stomachBody', label: 'Stomach (body)' },
  { id: 'gastricAntrum', label: 'Gastric antrum' },
  { id: 'duodenum', label: 'Duodenum (D1 and D2)' },
  { id: 'jejunum', label: 'Jejunum (Capsule only)' },
  { id: 'upperGiStricture', label: 'Upper GI stricture' },
  { id: 'upperGiFistula', label: 'Upper GI fistula opening' },
] as const;

export type UpperGiSegmentId = (typeof UPPER_GI_SEGMENTS)[number]['id'];

export type UpperGiPicklistOption = { value: string; label: string };

export type UpperGiRow = {
  endoscopicFinding: string;
  biopsyTaken: string;
};

export type UpperGiFindingsData = {
  rows: Record<UpperGiSegmentId, UpperGiRow>;
};

export const UPPER_GI_FINDINGS_NOTE =
  'Upper GI involvement is the L4 modifier in Montreal classification. Does NOT contribute to SES-CD total score. Send biopsies for granuloma histology.';

const PLACEHOLDER_SELECT: UpperGiPicklistOption = { value: '', label: '— Select —' };

/**
 * Per-segment picklists for Endoscopic Finding and Biopsy Taken.
 * Replace placeholder arrays with clinical options per segment when ready.
 */
export const UPPER_GI_SEGMENT_PICKLISTS: Record<
  UpperGiSegmentId,
  { endoscopicFinding: readonly UpperGiPicklistOption[]; biopsyTaken: readonly UpperGiPicklistOption[] }
> = {
  oesophagus: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Normal', label: 'Normal' },
      { value: 'Aphthous ulcers', label: 'Aphthous ulcers' },
      { value: 'Linear ulcers', label: 'Linear ulcers' },
      { value: 'Cobblestoning', label: 'Cobblestoning' },
      { value: 'Stricture', label: 'Stricture' },
      { value: 'Not examined', label: 'Not examined' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  stomachBody: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Normal', label: 'Normal' },
      { value: 'Erythema', label: 'Erythema' },
      { value: 'Aphthous ulcers', label: 'Aphthous ulcers' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  gastricAntrum: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Normal', label: 'Normal' },
      { value: 'Erythema', label: 'Erythema' },
      { value: 'Aphthous ulcers', label: 'Aphthous ulcers' },
      { value: 'Nodularity', label: 'Nodularity' },
      { value: 'Ulcer', label: 'Ulcer' },
      { value: 'Not examined', label: 'Not examined' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  duodenum: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Normal', label: 'Normal' },
      { value: 'Aphthous ulcers', label: 'Aphthous ulcers' },
      { value: 'Erosions', label: 'Erosions' },
      { value: 'Ulcer', label: 'Ulcer' },
      { value: 'Cobblestoning', label: 'Cobblestoning' },
      { value: 'Stricture', label: 'Stricture' },
      { value: 'Not examined', label: 'Not examined' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  jejunum: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Normal', label: 'Normal' },
      { value: 'Aphthous ulcers', label: 'Aphthous ulcers' },
      { value: 'Ulcers', label: 'Ulcers' },
      { value: 'Stricture', label: 'Stricture' },
      { value: 'Not examined', label: 'Not examined' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  upperGiStricture: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Absent', label: 'Absent' },
      { value: 'Single', label: 'Single' },
      { value: 'Multiple', label: 'Multiple' },
      { value: 'Non-passable', label: 'Non-passable' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
  upperGiFistula: {
    endoscopicFinding: [
      PLACEHOLDER_SELECT,
      { value: 'Absent', label: 'Absent' },
      { value: 'Present', label: 'Present' },
    ],
    biopsyTaken: [
      PLACEHOLDER_SELECT,
      { value: 'No biopsy', label: 'No biopsy' },
      { value: 'Yes - routine', label: 'Yes - routine' },
      { value: 'Yes - targeted', label: 'Yes - targeted' },
      { value: 'Both', label: 'Both' },
    ],
  },
};

function emptyRows(): Record<UpperGiSegmentId, UpperGiRow> {
  const rows = {} as Record<UpperGiSegmentId, UpperGiRow>;
  for (const seg of UPPER_GI_SEGMENTS) {
    rows[seg.id] = { endoscopicFinding: '', biopsyTaken: '' };
  }
  return rows;
}

function isSegmentId(v: string): v is UpperGiSegmentId {
  return UPPER_GI_SEGMENTS.some((s) => s.id === v);
}

export function parseUpperGiFindings(val: unknown): UpperGiFindingsData {
  const rows = emptyRows();
  if (val == null || val === '') return { rows };

  let raw: unknown = val;
  if (typeof val === 'string') {
    try {
      raw = JSON.parse(val);
    } catch {
      return { rows };
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { rows };

  const o = raw as Record<string, unknown>;
  const source =
    o.rows && typeof o.rows === 'object' && !Array.isArray(o.rows)
      ? (o.rows as Record<string, unknown>)
      : o;

  for (const [segKey, row] of Object.entries(source)) {
    if (!isSegmentId(segKey) || !row || typeof row !== 'object' || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    rows[segKey] = {
      endoscopicFinding: typeof r.endoscopicFinding === 'string' ? r.endoscopicFinding : '',
      biopsyTaken: typeof r.biopsyTaken === 'string' ? r.biopsyTaken : '',
    };
  }

  return { rows };
}

export function normalizeUpperGiFindings(data: UpperGiFindingsData): UpperGiFindingsData {
  const rows = emptyRows();
  for (const seg of UPPER_GI_SEGMENTS) {
    const row = data.rows[seg.id];
    rows[seg.id] = {
      endoscopicFinding: row?.endoscopicFinding ?? '',
      biopsyTaken: row?.biopsyTaken ?? '',
    };
  }
  return { rows };
}

export function serializeUpperGiFindings(data: UpperGiFindingsData): string {
  return JSON.stringify(data);
}

export function emptyUpperGiFindings(): UpperGiFindingsData {
  return { rows: emptyRows() };
}
