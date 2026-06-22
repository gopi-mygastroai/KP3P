export const INFECTION_SCREENING_PICKLIST_OPTIONS = [
  'Not done',
  'Done - Negative',
  'Done - Positive, treated',
  'Done - Positive, not treated',
  'Unknown',
] as const;

export type InfectionScreeningPicklistValue = (typeof INFECTION_SCREENING_PICKLIST_OPTIONS)[number];

export const TB_SCREENING_SUBFIELDS = [
  { id: 'tbQuantiFERONGold', label: 'Quanteferon gold' },
  { id: 'tbChestXRay', label: 'Chest X- Ray' },
  { id: 'tbCtChest', label: 'CT Chest' },
] as const;

export const INFECTION_SCREENING_FIELDS = [
  { id: 'hepBSurfaceAg', label: 'Hepatitis B Surface Antigen' },
  { id: 'hepBSurfaceAb', label: 'Hepatitis B Surface Antibody' },
  { id: 'hepBCoreAb', label: 'Hepatitis B Core Antibody' },
  { id: 'antiHcv', label: 'Anti HCV' },
  { id: 'antiHiv', label: 'Anti HIV' },
] as const;

export type TbScreeningFieldId = (typeof TB_SCREENING_SUBFIELDS)[number]['id'];
export type InfectionScreeningFieldId = (typeof INFECTION_SCREENING_FIELDS)[number]['id'];

export type InfectionScreeningSet = {
  screeningDate: string;
  tbQuantiFERONGold: string;
  tbChestXRay: string;
  tbCtChest: string;
  hepBSurfaceAg: string;
  hepBSurfaceAb: string;
  hepBCoreAb: string;
  antiHcv: string;
  antiHiv: string;
};

export type InfectionScreeningData = {
  sets: InfectionScreeningSet[];
};

export function emptyInfectionScreeningSet(): InfectionScreeningSet {
  return {
    screeningDate: '',
    tbQuantiFERONGold: '',
    tbChestXRay: '',
    tbCtChest: '',
    hepBSurfaceAg: '',
    hepBSurfaceAb: '',
    hepBCoreAb: '',
    antiHcv: '',
    antiHiv: '',
  };
}

export function emptyInfectionScreening(): InfectionScreeningData {
  return { sets: [emptyInfectionScreeningSet()] };
}

export function normalizeInfectionScreeningSet(
  input: Partial<InfectionScreeningSet> | null | undefined,
): InfectionScreeningSet {
  const base = emptyInfectionScreeningSet();
  if (!input) return base;

  return {
    screeningDate:
      typeof input.screeningDate === 'string'
        ? input.screeningDate.substring(0, 10)
        : typeof (input as { infectionScreeningDate?: string }).infectionScreeningDate === 'string'
          ? (input as { infectionScreeningDate: string }).infectionScreeningDate.substring(0, 10)
          : '',
    tbQuantiFERONGold: migrateLegacyTbScreening(input.tbQuantiFERONGold),
    tbChestXRay: migrateLegacyInfectionPicklist(input.tbChestXRay),
    tbCtChest: migrateLegacyInfectionPicklist(input.tbCtChest),
    hepBSurfaceAg: migrateLegacyInfectionPicklist(input.hepBSurfaceAg),
    hepBSurfaceAb: migrateLegacyInfectionPicklist(input.hepBSurfaceAb),
    hepBCoreAb: migrateLegacyInfectionPicklist(input.hepBCoreAb),
    antiHcv: migrateLegacyInfectionPicklist(input.antiHcv),
    antiHiv: migrateLegacyInfectionPicklist(input.antiHiv),
  };
}

export function normalizeInfectionScreening(
  input: Partial<InfectionScreeningData> | null | undefined,
): InfectionScreeningData {
  if (!input || !Array.isArray(input.sets) || input.sets.length === 0) {
    return emptyInfectionScreening();
  }
  return { sets: input.sets.map((set) => normalizeInfectionScreeningSet(set)) };
}

function parseRawInfectionScreening(raw: unknown): unknown {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  return raw;
}

type LegacyFlatInfectionScreening = {
  infectionScreeningDate?: string;
  tbQuantiFERONGold?: string;
  tbScreening?: string;
  tbChestXRay?: string;
  tbCtChest?: string;
  hepBSurfaceAg?: string;
  hepBSurfaceAb?: string;
  hepBCoreAb?: string;
  antiHcv?: string;
  antiHiv?: string;
};

function legacyFlatSetHasData(flat: LegacyFlatInfectionScreening): boolean {
  return Boolean(
    flat.infectionScreeningDate?.trim() ||
      flat.tbQuantiFERONGold?.trim() ||
      flat.tbScreening?.trim() ||
      flat.tbChestXRay?.trim() ||
      flat.tbCtChest?.trim() ||
      flat.hepBSurfaceAg?.trim() ||
      flat.hepBSurfaceAb?.trim() ||
      flat.hepBCoreAb?.trim() ||
      flat.antiHcv?.trim() ||
      flat.antiHiv?.trim(),
  );
}

function infectionScreeningSetFromLegacyFlat(flat: LegacyFlatInfectionScreening): InfectionScreeningSet {
  return normalizeInfectionScreeningSet({
    screeningDate: flat.infectionScreeningDate ?? '',
    tbQuantiFERONGold: flat.tbQuantiFERONGold || flat.tbScreening,
    tbChestXRay: flat.tbChestXRay,
    tbCtChest: flat.tbCtChest,
    hepBSurfaceAg: flat.hepBSurfaceAg,
    hepBSurfaceAb: flat.hepBSurfaceAb,
    hepBCoreAb: flat.hepBCoreAb,
    antiHcv: flat.antiHcv,
    antiHiv: flat.antiHiv,
  });
}

export function parseInfectionScreening(
  raw: unknown,
  legacyFlat?: LegacyFlatInfectionScreening,
): InfectionScreeningData {
  const parsed = parseRawInfectionScreening(raw);
  if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.sets)) {
      const sets = obj.sets.map((set) =>
        normalizeInfectionScreeningSet(set as Partial<InfectionScreeningSet>),
      );
      if (sets.length > 0) return { sets };
    }
  }

  if (legacyFlat && legacyFlatSetHasData(legacyFlat)) {
    return { sets: [infectionScreeningSetFromLegacyFlat(legacyFlat)] };
  }

  return emptyInfectionScreening();
}

export function serializeInfectionScreening(data: InfectionScreeningData): string {
  return JSON.stringify(normalizeInfectionScreening(data));
}

export function infectionScreeningSetHasData(set: InfectionScreeningSet): boolean {
  return Boolean(
    set.screeningDate.trim() ||
      set.tbQuantiFERONGold.trim() ||
      set.tbChestXRay.trim() ||
      set.tbCtChest.trim() ||
      set.hepBSurfaceAg.trim() ||
      set.hepBSurfaceAb.trim() ||
      set.hepBCoreAb.trim() ||
      set.antiHcv.trim() ||
      set.antiHiv.trim(),
  );
}

export function primaryInfectionScreeningSet(data: InfectionScreeningData): InfectionScreeningSet {
  const dated = [...data.sets]
    .filter((set) => set.screeningDate.trim())
    .sort((a, b) => b.screeningDate.localeCompare(a.screeningDate));
  if (dated.length > 0) return dated[0];
  return data.sets[0] ?? emptyInfectionScreeningSet();
}

export function formatTbScreeningSummary(input: {
  tbQuantiFERONGold?: string;
  tbChestXRay?: string;
  tbCtChest?: string;
}): string {
  const parts = TB_SCREENING_SUBFIELDS.map(({ id, label }) => {
    const value = String(input[id as keyof typeof input] ?? '').trim();
    return value ? `${label}: ${value}` : null;
  }).filter(Boolean);
  return parts.length ? parts.join(' | ') : 'Not documented';
}

export function formatInfectionScreeningSetDetail(set: InfectionScreeningSet, index: number): string {
  const datePrefix = set.screeningDate.trim()
    ? `Screening date ${set.screeningDate.trim()}`
    : `Set ${index + 1}`;
  const tb = formatTbScreeningSummary(set);
  const serology = INFECTION_SCREENING_FIELDS.map(({ id, label }) => {
    const value = String(set[id as keyof InfectionScreeningSet] ?? '').trim();
    return value ? `${label}: ${value}` : null;
  })
    .filter(Boolean)
    .join('; ');
  const parts = [tb !== 'Not documented' ? `TB — ${tb}` : null, serology ? `Serology — ${serology}` : null].filter(Boolean);
  return parts.length ? `${datePrefix}: ${parts.join(' | ')}` : `${datePrefix}: no values recorded`;
}

export function formatInfectionScreeningForPrompt(raw: unknown): string {
  const data = parseInfectionScreening(raw);
  const relevant = data.sets.filter(infectionScreeningSetHasData);
  if (relevant.length === 0) return 'Not documented';
  return relevant.map((set, index) => formatInfectionScreeningSetDetail(set, index)).join(' || ');
}

export function validateInfectionScreeningSets(data: InfectionScreeningData): string[] {
  const missing: string[] = [];
  data.sets.forEach((set, index) => {
    const prefix = data.sets.length > 1 ? `Screening ${index + 1}: ` : '';
    if (!set.screeningDate.trim()) missing.push(`${prefix}Screening date`);
    if (!set.tbQuantiFERONGold.trim()) missing.push(`${prefix}Quanteferon gold`);
    if (!set.tbChestXRay.trim()) missing.push(`${prefix}Chest X- Ray`);
    if (!set.tbCtChest.trim()) missing.push(`${prefix}CT Chest`);
    for (const field of INFECTION_SCREENING_FIELDS) {
      if (!String(set[field.id as keyof InfectionScreeningSet] ?? '').trim()) {
        missing.push(`${prefix}${field.label}`);
      }
    }
  });
  return missing;
}

/** Map legacy single TB screening value to QuantiFERON field when migrating old records. */
export function migrateLegacyTbScreening(value: unknown): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';

  const legacyMap: Record<string, InfectionScreeningPicklistValue> = {
    'Not done': 'Not done',
    'Done - Negative (IGRA or TST)': 'Done - Negative',
    'Done - Positive, treated': 'Done - Positive, treated',
    'Done - Positive, not treated': 'Done - Positive, not treated',
    Unknown: 'Unknown',
    Negative: 'Done - Negative',
    Positive: 'Done - Positive, not treated',
  };

  return legacyMap[trimmed] ?? trimmed;
}

export function migrateLegacyInfectionPicklist(value: unknown): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';

  const legacyMap: Record<string, InfectionScreeningPicklistValue> = {
    'Not tested': 'Not done',
    'Not done': 'Not done',
    Negative: 'Done - Negative',
    Positive: 'Done - Positive, not treated',
    'Positive (Immune)': 'Done - Negative',
    'Negative (Not immune)': 'Done - Negative',
    'Positive (Past infection)': 'Done - Positive, not treated',
    Unknown: 'Unknown',
    'Done - Negative (IGRA or TST)': 'Done - Negative',
    'Done - Positive, treated': 'Done - Positive, treated',
    'Done - Positive, not treated': 'Done - Positive, not treated',
  };

  if (INFECTION_SCREENING_PICKLIST_OPTIONS.includes(trimmed as InfectionScreeningPicklistValue)) {
    return trimmed;
  }

  return legacyMap[trimmed] ?? trimmed;
}

export function legacyFlatFromPatient(patient: Record<string, unknown>): LegacyFlatInfectionScreening {
  return {
    infectionScreeningDate: String(patient.infectionScreeningDate ?? ''),
    tbQuantiFERONGold: String(patient.tbQuantiFERONGold ?? patient.tbScreening ?? ''),
    tbChestXRay: String(patient.tbChestXRay ?? ''),
    tbCtChest: String(patient.tbCtChest ?? ''),
    hepBSurfaceAg: String(patient.hepBSurfaceAg ?? ''),
    hepBSurfaceAb: String(patient.hepBSurfaceAb ?? ''),
    hepBCoreAb: String(patient.hepBCoreAb ?? ''),
    antiHcv: String(patient.antiHcv ?? ''),
    antiHiv: String(patient.antiHiv ?? ''),
  };
}
