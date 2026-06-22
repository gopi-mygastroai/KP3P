export type CurrentIbdMedicationRow = {
  drugName: string;
  dose: string;
  doseUnit: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  reasonForStopping: string;
  /** Free text when drugName is "Other". */
  otherDrugSpecify?: string;
};

export type CurrentIbdMedicationsData = {
  rows: CurrentIbdMedicationRow[];
};

export const DRUG_NAME_OPTIONS = [
  'Mesalazine (5-ASA)',
  'Sulphasalazine',
  'Azathioprine',
  'Prednisolone',
  'Budesonide',
  'Hydrocortisone',
  'Methotrexate',
  'Infliximab',
  'Adalimumab',
  'Vedolizumab',
  'Ustekinumab',
  'Tofacitinib',
  'Upadacitinib',
  'Current Vitamin D / Calcium Supplementation',
  'IRON Supplements',
  'Other',
] as const;

export const DOSE_UNIT_OPTIONS = ['Milligrams', 'Grams'] as const;

export const REASON_FOR_STOPPING_OPTIONS = [
  'Intolerence',
  'Adverse drug reaction',
  'Poor compliance',
  'Primary non response',
  'Secondary loss of response',
  'Other',
] as const;

export function emptyMedicationRow(): CurrentIbdMedicationRow {
  return {
    drugName: '',
    dose: '',
    doseUnit: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    reasonForStopping: '',
  };
}

export function defaultCurrentIbdMedications(): CurrentIbdMedicationsData {
  return { rows: [emptyMedicationRow()] };
}

function strField(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function boolField(raw: Record<string, unknown>, key: string): boolean {
  const value = raw[key];
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  return false;
}

function mapLegacyDoseUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'mg') return 'Milligrams';
  if (normalized === 'g') return 'Grams';
  if (DOSE_UNIT_OPTIONS.includes(unit as (typeof DOSE_UNIT_OPTIONS)[number])) return unit;
  return '';
}

function mapLegacyDrugName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (trimmed === 'Others (specify)') return 'Other';
  if (DRUG_NAME_OPTIONS.includes(trimmed as (typeof DRUG_NAME_OPTIONS)[number])) return trimmed;
  return trimmed;
}

function isLegacyRow(raw: Record<string, unknown>): boolean {
  return (
    'drugId' in raw ||
    'currentlyTaking' in raw ||
    'doseMg' in raw ||
    'frequency' in raw ||
    'route' in raw ||
    'duration' in raw ||
    'drugClass' in raw
  );
}

function legacyRowHasData(raw: Record<string, unknown>): boolean {
  const currentlyTaking = strField(raw, 'currentlyTaking');
  return Boolean(
    strField(raw, 'doseMg') ||
      strField(raw, 'dose') ||
      strField(raw, 'duration') ||
      strField(raw, 'frequency') ||
      strField(raw, 'route') ||
      (currentlyTaking && currentlyTaking !== 'Never used'),
  );
}

function migrateLegacyRow(raw: Record<string, unknown>): CurrentIbdMedicationRow | null {
  if (!legacyRowHasData(raw)) return null;

  const currentlyTaking = strField(raw, 'currentlyTaking');
  const ongoing = currentlyTaking === 'Yes';
  const drugName = mapLegacyDrugName(strField(raw, 'drugName'));

  return {
    drugName,
    dose: strField(raw, 'dose') || strField(raw, 'doseMg'),
    doseUnit: mapLegacyDoseUnit(strField(raw, 'doseUnit')),
    startDate: strField(raw, 'startDate'),
    endDate: ongoing ? '' : strField(raw, 'endDate'),
    ongoing,
    reasonForStopping:
      currentlyTaking === 'Stopped' ? strField(raw, 'reasonForStopping') : strField(raw, 'reasonForStopping'),
    otherDrugSpecify: strField(raw, 'otherSpecify') || strField(raw, 'otherDrugSpecify') || undefined,
  };
}

function coerceMedicationRow(raw: unknown): CurrentIbdMedicationRow | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  if (isLegacyRow(record)) {
    return migrateLegacyRow(record);
  }

  const drugName = mapLegacyDrugName(strField(record, 'drugName'));
  const row: CurrentIbdMedicationRow = {
    drugName,
    dose: strField(record, 'dose'),
    doseUnit: mapLegacyDoseUnit(strField(record, 'doseUnit')),
    startDate: strField(record, 'startDate').substring(0, 10),
    endDate: strField(record, 'endDate').substring(0, 10),
    ongoing: boolField(record, 'ongoing'),
    reasonForStopping: strField(record, 'reasonForStopping'),
  };

  if (drugName === 'Other') {
    row.otherDrugSpecify = strField(record, 'otherDrugSpecify') || undefined;
  }

  return row;
}

function parseMedicationRowsRaw(raw: unknown): CurrentIbdMedicationRow[] {
  if (raw == null || raw === '') return [];

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      return parseMedicationRowsRaw(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw.map((row) => coerceMedicationRow(row)).filter(Boolean) as CurrentIbdMedicationRow[];
  }

  if (typeof raw === 'object' && raw !== null && 'rows' in raw) {
    const rowsRaw = (raw as { rows?: unknown }).rows;
    if (Array.isArray(rowsRaw)) {
      return rowsRaw.map((row) => coerceMedicationRow(row)).filter(Boolean) as CurrentIbdMedicationRow[];
    }
  }

  return [];
}

export function medicationRowHasData(row: CurrentIbdMedicationRow): boolean {
  return Boolean(
    row.drugName ||
      row.dose ||
      row.doseUnit ||
      row.startDate ||
      row.endDate ||
      row.ongoing ||
      row.reasonForStopping ||
      row.otherDrugSpecify,
  );
}

/** Form editing: keep blank rows, always at least one line. */
export function parseCurrentIbdMedicationsForForm(raw: unknown): CurrentIbdMedicationsData {
  const rows = parseMedicationRowsRaw(raw);
  return { rows: rows.length > 0 ? rows : [emptyMedicationRow()] };
}

export function normalizeCurrentIbdMedications(data: CurrentIbdMedicationsData): CurrentIbdMedicationsData {
  const rows = (data.rows ?? []).filter(medicationRowHasData);
  return rows.length > 0 ? { rows } : defaultCurrentIbdMedications();
}

export function parseCurrentIbdMedications(raw: unknown): CurrentIbdMedicationsData {
  const rows = parseMedicationRowsRaw(raw).filter(medicationRowHasData);
  return rows.length > 0 ? { rows } : defaultCurrentIbdMedications();
}

export function serializeCurrentIbdMedications(data: CurrentIbdMedicationsData): string {
  const rows = (data.rows ?? []).filter(medicationRowHasData);
  return JSON.stringify({ rows });
}

export function serializeCurrentIbdMedicationsForForm(data: CurrentIbdMedicationsData): string {
  const rows = data.rows.length > 0 ? data.rows : [emptyMedicationRow()];
  return JSON.stringify({ rows });
}

export function medicationRowLabel(row: CurrentIbdMedicationRow): string {
  if (row.drugName === 'Other' && row.otherDrugSpecify?.trim()) {
    return `${row.drugName} (${row.otherDrugSpecify.trim()})`;
  }
  return row.drugName || 'Unspecified drug';
}
