export const RADIOLOGY_INVESTIGATION_FIELDS = [
  { id: 'ct', label: 'CT' },
  { id: 'mri', label: 'MRI' },
  { id: 'intestinalUltrasound', label: 'Intestinal Ultra sound' },
  { id: 'other', label: 'Other' },
] as const;

export type RadiologyInvestigationFieldId =
  (typeof RADIOLOGY_INVESTIGATION_FIELDS)[number]['id'];

export type RadiologyInvestigationSet = {
  assessmentDate: string;
  ct: string;
  mri: string;
  intestinalUltrasound: string;
  other: string;
};

export type RadiologyInvestigationsData = {
  sets: RadiologyInvestigationSet[];
};

export function emptyRadiologySet(): RadiologyInvestigationSet {
  return {
    assessmentDate: '',
    ct: '',
    mri: '',
    intestinalUltrasound: '',
    other: '',
  };
}

export const emptyRadiologyInvestigationSet = emptyRadiologySet;

export function emptyRadiologyInvestigations(): RadiologyInvestigationsData {
  return { sets: [emptyRadiologySet()] };
}

export function normalizeRadiologyInvestigationSet(
  input: Partial<RadiologyInvestigationSet> | null | undefined,
): RadiologyInvestigationSet {
  const base = emptyRadiologySet();
  if (!input) return base;

  return {
    assessmentDate: typeof input.assessmentDate === 'string' ? input.assessmentDate : '',
    ct: typeof input.ct === 'string' ? input.ct : '',
    mri: typeof input.mri === 'string' ? input.mri : '',
    intestinalUltrasound:
      typeof input.intestinalUltrasound === 'string' ? input.intestinalUltrasound : '',
    other: typeof input.other === 'string' ? input.other : '',
  };
}

export function normalizeRadiologyInvestigations(
  input: Partial<RadiologyInvestigationsData> | null | undefined,
): RadiologyInvestigationsData {
  if (!input || !Array.isArray(input.sets) || input.sets.length === 0) {
    return emptyRadiologyInvestigations();
  }
  return { sets: input.sets.map((set) => normalizeRadiologyInvestigationSet(set)) };
}

function parseRawRadiology(raw: unknown): unknown {
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

export function parseRadiologyInvestigations(raw: unknown): RadiologyInvestigationsData {
  const parsed = parseRawRadiology(raw);
  if (parsed == null) return emptyRadiologyInvestigations();

  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.sets)) {
      return normalizeRadiologyInvestigations({
        sets: obj.sets.map((set) =>
          normalizeRadiologyInvestigationSet(set as Partial<RadiologyInvestigationSet>),
        ),
      });
    }
  }

  return emptyRadiologyInvestigations();
}

export function serializeRadiologyInvestigations(data: RadiologyInvestigationsData): string {
  return JSON.stringify(normalizeRadiologyInvestigations(data));
}

export function filledRadiologySetEntries(set: RadiologyInvestigationSet): Array<{
  label: string;
  value: string;
}> {
  return RADIOLOGY_INVESTIGATION_FIELDS.map((field) => ({
    label: field.label,
    value: set[field.id]?.trim() ?? '',
  })).filter((entry) => entry.value);
}

export function filledRadiologySets(data: RadiologyInvestigationsData): Array<{
  assessmentDate: string;
  entries: ReturnType<typeof filledRadiologySetEntries>;
}> {
  return data.sets.map((set) => ({
    assessmentDate: set.assessmentDate.trim(),
    entries: filledRadiologySetEntries(set),
  }));
}

export function formatRadiologyForPrompt(raw: unknown): string {
  const data = parseRadiologyInvestigations(raw);
  const parts = data.sets
    .map((set, index) => {
      const entries = filledRadiologySetEntries(set);
      const datePrefix = set.assessmentDate.trim()
        ? `Assessment date ${set.assessmentDate.trim()}`
        : `Set ${index + 1}`;
      if (entries.length === 0) {
        return set.assessmentDate.trim() ? `${datePrefix}: no values recorded` : null;
      }
      return `${datePrefix}: ${entries.map((e) => `${e.label}=${e.value}`).join('; ')}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(' || ') : 'None documented';
}
