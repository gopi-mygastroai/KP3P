export const IBD_INVESTIGATION_GROUPS = [
  {
    id: 'cbc',
    title: 'COMPLETE BLOOD COUNT (CBC)',
    fields: [
      { id: 'hemoglobin', label: 'Hemoglobin (Hb)' },
      { id: 'wbc', label: 'Total White Blood Cell Count (WBC)' },
      { id: 'neutrophilsPct', label: 'Neutrophils (%)' },
      { id: 'lymphocytesPct', label: 'Lymphocytes (%)' },
      { id: 'plateletCount', label: 'Platelet Count' },
      { id: 'mcv', label: 'Mean Corpuscular Volume (MCV)' },
      { id: 'hematocrit', label: 'Hematocrit (HCT)' },
    ],
  },
  {
    id: 'inflammatoryMarkers',
    title: 'INFLAMMATORY MARKERS',
    fields: [
      { id: 'esr', label: 'Erythrocyte Sedimentation Rate (ESR)' },
      { id: 'crp', label: 'C-Reactive Protein (CRP)' },
      { id: 'fecalCalprotectin', label: 'Fecal Calprotectin' },
    ],
  },
  {
    id: 'ironStudies',
    title: 'IRON STUDIES',
    fields: [
      { id: 'serumIron', label: 'Serum Iron' },
      { id: 'ferritin', label: 'Ferritin' },
      { id: 'tibc', label: 'Total Iron Binding Capacity (TIBC)' },
      { id: 'transferrinSaturation', label: 'Transferrin Saturation (%)' },
    ],
  },
  {
    id: 'vitaminsMicronutrients',
    title: 'VITAMINS & MICRONUTRIENTS',
    fields: [
      { id: 'vitaminB12', label: 'Vitamin B12' },
      { id: 'folate', label: 'Folate' },
      { id: 'vitaminD', label: 'Vitamin D (25-OH)' },
      { id: 'zinc', label: 'Zinc' },
      { id: 'magnesium', label: 'Magnesium' },
      { id: 'calcium', label: 'Calcium' },
    ],
  },
  {
    id: 'lft',
    title: 'LIVER FUNCTION TESTS (LFT)',
    fields: [
      { id: 'totalBilirubin', label: 'Total Bilirubin' },
      { id: 'directBilirubin', label: 'Direct Bilirubin' },
      { id: 'ast', label: 'AST (SGOT)' },
      { id: 'alt', label: 'ALT (SGPT)' },
      { id: 'alp', label: 'Alkaline Phosphatase (ALP)' },
      { id: 'ggt', label: 'GGT' },
      { id: 'serumAlbumin', label: 'Serum Albumin' },
      { id: 'totalProtein', label: 'Total Protein' },
    ],
  },
  {
    id: 'rft',
    title: 'RENAL FUNCTION TESTS (RFT)',
    fields: [
      { id: 'serumCreatinine', label: 'Serum Creatinine' },
      { id: 'bun', label: 'Blood Urea Nitrogen (BUN)' },
    ],
  },
  {
    id: 'electrolytes',
    title: 'ELECTROLYTES',
    fields: [
      { id: 'sodium', label: 'Sodium (Na+)' },
      { id: 'potassium', label: 'Potassium (K+)' },
      { id: 'chloride', label: 'Chloride (Cl-)' },
    ],
  },
  {
    id: 'stoolInvestigations',
    title: 'STOOL INVESTIGATIONS',
    fields: [
      { id: 'stoolRoutineExam', label: 'Stool Routine Examination' },
      { id: 'stoolCulture', label: 'Stool Culture & Sensitivity' },
      { id: 'cDiffToxin', label: 'Clostridium difficile Toxin (A/B)' },
      { id: 'fobt', label: 'Fecal Occult Blood Test (FOBT)' },
    ],
  },
  {
    id: 'serologicalMarkers',
    title: 'SEROLOGICAL MARKERS',
    fields: [
      { id: 'asca', label: 'ASCA (Anti-Saccharomyces cerevisiae Antibody)' },
      { id: 'panca', label: 'pANCA (Perinuclear Anti-Neutrophil Cytoplasmic Ab)' },
    ],
  },
  {
    id: 'drugMonitoringThiopurines',
    title: 'DRUG MONITORING (Thiopurines)',
    fields: [
      { id: 'tpmt', label: 'TPMT Level / Activity' },
      { id: 'nudt', label: 'NUDT Level / Activity' },
      { id: 'tgn6', label: '6-Thioguanine Nucleotides (6-TGN)' },
      { id: 'mmp6', label: '6-Methylmercaptopurine (6-MMP)' },
    ],
  },
  {
    id: 'drugMonitoringBiologics',
    title: 'DRUG MONITORING (Biologics)',
    fields: [
      { id: 'drugTroughLevel', label: 'Drug Trough Level' },
      { id: 'antiDrugAntibodies', label: 'Anti-Drug Antibodies (ATI)' },
    ],
  },
] as const;

export type IbdInvestigationFieldId =
  (typeof IBD_INVESTIGATION_GROUPS)[number]['fields'][number]['id'];

/** One dated set of lab & investigation values. */
export type IbdInvestigationSet = {
  assessmentDate: string;
  investigationDiagnosis: string;
  values: Record<IbdInvestigationFieldId, string>;
};

/** Multiple lab & investigation sets stored in `Patient.ibdInvestigations`. */
export type IbdInvestigationsData = {
  sets: IbdInvestigationSet[];
};

const FIELD_IDS = IBD_INVESTIGATION_GROUPS.flatMap((group) =>
  group.fields.map((field) => field.id),
) as IbdInvestigationFieldId[];

function emptyValues(): Record<IbdInvestigationFieldId, string> {
  const values = {} as Record<IbdInvestigationFieldId, string>;
  for (const id of FIELD_IDS) values[id] = '';
  return values;
}

export function emptyIbdInvestigationSet(assessmentDate = ''): IbdInvestigationSet {
  return {
    assessmentDate,
    investigationDiagnosis: '',
    values: emptyValues(),
  };
}

export function emptyIbdInvestigations(): IbdInvestigationsData {
  return { sets: [emptyIbdInvestigationSet()] };
}

function isLegacySingleSet(raw: Record<string, unknown>): boolean {
  return 'values' in raw && !Array.isArray(raw.sets);
}

export function normalizeIbdInvestigationSet(
  input: Partial<IbdInvestigationSet> | null | undefined,
): IbdInvestigationSet {
  const base = emptyIbdInvestigationSet();
  if (!input) return base;

  const values = { ...base.values };
  if (input.values && typeof input.values === 'object') {
    for (const id of FIELD_IDS) {
      const raw = input.values[id];
      values[id] = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    }
  }

  return {
    assessmentDate: typeof input.assessmentDate === 'string' ? input.assessmentDate : '',
    investigationDiagnosis:
      typeof input.investigationDiagnosis === 'string' ? input.investigationDiagnosis : '',
    values,
  };
}

export function normalizeIbdInvestigations(
  input: Partial<IbdInvestigationsData> | null | undefined,
  legacyAssessmentDate = '',
): IbdInvestigationsData {
  if (!input) {
    const initial = emptyIbdInvestigations();
    if (legacyAssessmentDate.trim()) {
      initial.sets[0] = { ...initial.sets[0], assessmentDate: legacyAssessmentDate.trim() };
    }
    return initial;
  }

  if (Array.isArray(input.sets) && input.sets.length > 0) {
    const sets = input.sets.map((set) => normalizeIbdInvestigationSet(set));
    if (!sets[0].assessmentDate.trim() && legacyAssessmentDate.trim()) {
      sets[0] = { ...sets[0], assessmentDate: legacyAssessmentDate.trim() };
    }
    return { sets };
  }

  return normalizeIbdInvestigations(null, legacyAssessmentDate);
}

function parseRawInvestigations(raw: unknown): unknown {
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

export function parseIbdInvestigations(
  raw: unknown,
  legacyAssessmentDate = '',
): IbdInvestigationsData {
  const parsed = parseRawInvestigations(raw);
  if (parsed == null) {
    return normalizeIbdInvestigations(null, legacyAssessmentDate);
  }

  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (isLegacySingleSet(obj)) {
      const set = normalizeIbdInvestigationSet({
        values: obj.values as IbdInvestigationSet['values'],
        investigationDiagnosis:
          typeof obj.investigationDiagnosis === 'string' ? obj.investigationDiagnosis : '',
        assessmentDate: legacyAssessmentDate,
      });
      return { sets: [set] };
    }
    if (Array.isArray(obj.sets)) {
      return normalizeIbdInvestigations(
        { sets: obj.sets.map((set) => normalizeIbdInvestigationSet(set as Partial<IbdInvestigationSet>)) },
        legacyAssessmentDate,
      );
    }
  }

  return normalizeIbdInvestigations(null, legacyAssessmentDate);
}

export function serializeIbdInvestigations(data: IbdInvestigationsData): string {
  const normalized = normalizeIbdInvestigations(data);
  if (normalized.sets.length === 0) {
    return JSON.stringify({ sets: [emptyIbdInvestigationSet()] });
  }
  return JSON.stringify(normalized);
}

/** Primary assessment date — first set, kept in sync with legacy `dateMostRecentLabs`. */
export function primaryInvestigationAssessmentDate(data: IbdInvestigationsData): string {
  return data.sets[0]?.assessmentDate?.trim() ?? '';
}

export function filledInvestigationEntries(set: IbdInvestigationSet): Array<{
  groupTitle: string;
  label: string;
  value: string;
}> {
  const entries: Array<{ groupTitle: string; label: string; value: string }> = [];
  for (const group of IBD_INVESTIGATION_GROUPS) {
    for (const field of group.fields) {
      const value = set.values[field.id]?.trim() ?? '';
      if (value) {
        entries.push({ groupTitle: group.title, label: field.label, value });
      }
    }
  }
  return entries;
}

export function filledInvestigationSets(data: IbdInvestigationsData): Array<{
  assessmentDate: string;
  entries: ReturnType<typeof filledInvestigationEntries>;
}> {
  return data.sets.map((set) => ({
    assessmentDate: set.assessmentDate.trim(),
    entries: filledInvestigationEntries(set),
  }));
}
